# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import copy
import datetime
import fcntl
import functools
import math
import os
import psutil
import subprocess
import sys
import threading
import time
from absl import flags
from logger import logger
from rectpack import newPacker
from typing import List, Tuple


FLAGS = flags.FLAGS

flags.DEFINE_integer(
        'omxplayer_vol', default=800,
        help='--vol of omxplayer. 0 is no amplification.')

flags.DEFINE_integer(
        'omxplayer_poll_interval', default=1,
        help='Polling interval used to check if omxplayer is still alive.')

flags.DEFINE_integer(
        'omxplayer_dead_time', default=20,
        help='Time interval after which omxplayer is restarted if no output is produced.')


class StreamView:
    def __init__(
            self, url: str, crop_x2: int, crop_y2: int, crop_x1: int,
            crop_y1: int) -> None:
        self.url = url
        self.crop_x1 = crop_x1
        self.crop_x2 = crop_x2
        self.crop_y1 = crop_y1
        self.crop_y2 = crop_y2

    def area(self) -> int:
        return (self.crop_x2 - self.crop_x1) * (self.crop_y2 - self.crop_y1)

    def height(self) -> int:
        return self.crop_y2 - self.crop_y1

    def width(self) -> int:
        return self.crop_x2 - self.crop_x1

    def isEqual(self, rhs) -> bool:
        return \
                self.url == rhs.url and \
                self.crop_x1 == rhs.crop_x1 and \
                self.crop_x2 == rhs.crop_x2 and \
                self.crop_y1 == rhs.crop_y1 and \
                self.crop_y2 == rhs.crop_y2


class UrlBox:
    def __init__(self, orientation: int, streamviews: List[StreamView]) -> None:
        if not orientation in [0, 90, 180, 270]:
            logger.warning("Unknown orientation. Setting it to 0")
            orientation = 0

        self.streamviews = sorted(
                streamviews,
                key=lambda view: view.area(),
                reverse=True)

        if orientation in [0, 180]:
            self.width = self.streamviews[0].width()
            self.height = self.streamviews[0].height()
        elif orientation in [90, 270]:
            self.width = self.streamviews[0].height()
            self.height = self.streamviews[0].width()

        self.pos_x = 0
        self.pos_y = 0
        self.orientation = orientation

        self.scaling_factor = 1.0

    def getSize(self):
        size = [self.width, self.height]
        return list(map(lambda v: int(v * self.scaling_factor), size))

    def setScalingFactor(self, scaling_factor):
        self.scaling_factor = scaling_factor

    def getScalingFactor(self):
        return self.scaling_factor

    def getOptimalStreamView(self) -> StreamView:
        # TODO: This should return the optimal quality stream view.
        return self.streamviews[0]

    def getCrop(self) -> Tuple[int, int, int, int]:
        view = self.getOptimalStreamView()
        return (view.crop_x1,
                view.crop_y1,
                view.crop_x2,
                view.crop_y2)

    def getUrl(self) -> str:
        view = self.getOptimalStreamView()
        return view.url

    def isEqual(self, rhs):
        if len(self.streamviews) != len(rhs.streamviews):
            return False

        for i in range(len(self.streamviews)):
            if not self.streamviews[0].isEqual(rhs.streamviews[0]):
                return False

        return self.orientation == rhs.orientation

    def __repr__(self):
        return "<UrlBox:{} {}:{} {}x{}".format(
                self.getUrl(), self.pos_x, self.pos_y, *self.getSize())


class Packer:
    def __init__(self, urls, screen_size):
        self.urls = urls
        self.screen_size = screen_size

        if len(urls) == 0:
            return

        self.minScale()
        self.autoScaleAll()
        self.autoScaleSingle()

    def minScale(self):
        size_each = [self.screen_size[0] / len(self.urls), self.screen_size[1] / len(self.urls)]
        for url in self.urls:
            size = url.getSize()
            factor = min(size_each[0] / size[0], size_each[1] / size[1])
            url.setScalingFactor(factor)

        # now normalize to the smallest area
        smallest = math.inf
        for url in self.urls:
            size = url.getSize()
            smallest = min(smallest, size[0] * size[1])

        for url in self.urls:
            url.setScalingFactor(1.0)
            size = url.getSize()
            url.setScalingFactor(math.sqrt(smallest / (size[0] * size[1])))

    def autoScaleAll(self):
        for step_size in range(1, 12):
            for i in range(8):
                prev_factors = [url.getScalingFactor() for url in self.urls]
                for j in range(len(self.urls)):
                    self.urls[j].setScalingFactor(prev_factors[j] * (1 + 1./2**step_size))

                if not self.pack():
                    for j in range(len(self.urls)):
                        self.urls[j].setScalingFactor(prev_factors[j])
                    break

    def autoScaleSingle(self):
        for step_size in range(5, 12):
            for _ in range(8):
                progress = False
                for url in self.urls:
                    prev_factor = url.getScalingFactor()
                    url.setScalingFactor(prev_factor * (1 + 1./2**step_size))
                    if self.pack():
                        progress = True
                    else:
                        url.setScalingFactor(prev_factor)

                if not progress:
                    break

    def pack(self):
        packer = newPacker(rotation=False)

        for url in self.urls:
            packer.add_rect(*url.getSize(), url)

        packer.add_bin(self.screen_size[0], self.screen_size[1])

        packer.pack()

        all_rects = packer.rect_list()
        if len(all_rects) != len(self.urls):
            return False

        for rect in all_rects:
            bid, pos_x, pos_y, size_x, size_y, url = rect
            url.pos_x = pos_x
            url.pos_y = pos_y

        return True

    def display(self):
        for url in self.urls:
            print(url)


def pack(urls, screen_size):
    p = Packer(urls, screen_size)
    return p.urls


class OmxProcess:
    def __init__(self, cmd):
        self.cmd = cmd
        self.p = self._cmd_popen()
        self.update_timestamp()

    def _cmd_popen(self):
        p = subprocess.Popen(self.cmd, stderr=subprocess.DEVNULL, stdout=subprocess.PIPE, shell=False)

        # make stdin a non-blocking file
        fd = p.stdout.fileno()
        fl = fcntl.fcntl(fd, fcntl.F_GETFL)
        fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

        return p

    def update_timestamp(self):
        self.last_active = datetime.datetime.now()

    def check(self):
        time_diff = (datetime.datetime.now() - self.last_active).total_seconds()
        try:
            if self.p.poll() is not None or time_diff > FLAGS.omxplayer_dead_time:
                if time_diff > FLAGS.omxplayer_dead_time:
                    logger.error("No reaction within {}".format(time_diff))
                logger.error("{} has crashed. Restarting".format(self.cmd))
                self.kill()
                time.sleep(0.3)
                self.p = self._cmd_popen()
                self.update_timestamp()
        except Exception as e:
            logger.error(e)
            logger.error("Something went wrong while checking if process is still alive")

        try:
            stdout = self.p.stdout.read()
            if type(stdout) is bytes and len(stdout) > 0:
                self.update_timestamp()
        except BlockingIOError:
            # This is expected, just continue
            pass

    def kill(self):
        self.p.kill()
        self.p.terminate()


class Streamer:
    def __init__(self, screen):
        self.stop_event = threading.Event()
        self._screen = screen
        self._urls = []
        self._cmds = []
        self._thread = None

        logger.info('Streamer class has been initialized.')

    def _buildCommands(self, urls, screen):
        packedUrls = pack(urls, [screen.width, screen.height])

        cmds = []
        for url in packedUrls:
            cmds.append(Streamer.omx_cmd(url, screen.raspi_display_no))

        return cmds

    @staticmethod
    def omx_cmd(url, raspi_display_no):
        size = url.getSize()
        win = ','.join(["{}".format(i) for i in [url.pos_x, url.pos_y, int(url.pos_x + size[0]), int(url.pos_y + size[1])]])
        crop =  ','.join(["{}".format(i) for i in url.getCrop()])
        cmd = ["/usr/bin/omxplayer.bin",
                url.getUrl(),
                "--live",
                "-s",
                "--avdict", "rtsp_transport:tcp",
                "--win", win,
                "--crop", crop,
                "--orientation", str(url.orientation),
                "--vol", "{}".format(FLAGS.omxplayer_vol),
            ]
        if raspi_display_no:
            cmd.append("--display={}".format(raspi_display_no))
        return cmd

    def _watch_thread_entry(self):
        processes = []
        cmds = copy.deepcopy(self._cmds)
        for cmd in cmds:
            logger.info(cmd)
            try:
                p = OmxProcess(cmd)
            except FileNotFoundError:
                logger.error("Could not start streaming application")
                continue
            processes.append(p)

        while True:
            for p in processes:
                p.check()

            if self.stop_event.wait(float(FLAGS.omxplayer_poll_interval)):
                break

        # Kill all ou processes.
        for p in processes:
            p.kill()

    def _enableMonitor(self, enable):
        if enable:
            self._screen.enableScreen()
        else:
            self._screen.disableScreen()

    def watch(self):
        urls = copy.deepcopy(self._urls)
        screen = copy.deepcopy(self._screen)
        if len(urls) == 0:
            self._enableMonitor(False)
            return

        if not self._screen.enabled:
            # Turn monitor back on.
            self._enableMonitor(True)

        self._cmds = self._buildCommands(urls, screen)
        logger.info("Starting background task to watch omxplayer tasks.")
        self._thread = threading.Thread(target=self._watch_thread_entry)
        self._thread.start()

    def stop(self):
        if not self._thread:
            return

        self.stop_event.set()
        self._thread.join(10)
        if self._thread.isAlive():
            logger.critical('Thread is still alive after 10s! We will try to crash.')
            os._exit(-1)
        self.stop_event.clear()

    def setUrls(self, urls):
        self.stop()
        self._urls = urls
        self.watch()
