# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import copy
import functools
import math
import psutil
import subprocess
import threading
import time
from absl import flags
from logger import logger
from rectpack import newPacker
from typing import List, Tuple


FLAGS = flags.FLAGS

flags.DEFINE_integer(
        'omxplayer_vol', default=1000,
        help='--vol of omxplayer. 0 is no amplification.')


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
                self.url, self.pos_x, self.pos_y, *self.getSize())


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


class Streamer:
    def __init__(self, screen_size, urls):
        self.stop_event = threading.Event()
        self.monitor_is_on = False
        self.screen_size = screen_size

        self.watch(urls)

        logger.info('Streamer class has been initialized width screen size '
                    '{}x{}'.format(self.screen_size[0], self.screen_size[1]))

    def build_cmds(self, urls):
        cmds = []

        urls = pack(urls, self.screen_size)

        for url in urls:
            cmds.append(Streamer.omx_cmd(url))

        return cmds

    @staticmethod
    def omx_cmd(url):
        size = url.getSize()
        win = ','.join(["{}".format(i) for i in [url.pos_x, url.pos_y, int(url.pos_x + size[0]), int(url.pos_y + size[1])]])
        crop =  ','.join(["{}".format(i) for i in url.getCrop()])
        return ["omxplayer",
                url.getUrl(),
                "--live",
                "--avdict", "rtsp_transport:tcp",
                "--win", win,
                "--crop", crop,
                "--orientation", str(url.orientation),
                "--vol", "{}".format(FLAGS.omxplayer_vol),
            ]

    def kill_children(self, pid):
        process = psutil.Process(pid)
        for proc in process.children(recursive=True):
            proc.kill()
        process.kill()

    def _watch_thread_entry(self):
        processes = []
        for cmd in self.cmds:
            logger.info(cmd)
            try:
                p = subprocess.Popen(cmd, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
            except FileNotFoundError:
                logger.error("Could not start streaming application")
                continue
            processes.append(p)

        while True:
            for i in range(len(processes)):
                try:
                    p = processes[i]
                    if p.poll() is not None:
                        logger.error("{} has crashed. Restarting".format(self.cmds[i]))
                        p.terminate()
                        processes[i] = subprocess.Popen(self.cmds[i], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
                except Exception as e:
                    logger.error(e)
                    logger.error("Something went wrong while checking if process is still alive")

            time.sleep(1)

            if self.stop_event.wait(1.0):
                for p in processes:
                    self.kill_children(p.pid)
                return

    def _monitor_enable(self, enable):
        try:
            if enable:
                logger.info("Turning monitor on")
                subprocess.call(["/opt/vc/bin/tvservice", "-p"])
            else:
                logger.info("Turning monitor off")
                subprocess.call(["/opt/vc/bin/tvservice", "-o"])
        except FileNotFoundError:
            logger.error("tvservice executable not found. Cannot control monitor")

        self.monitor_is_on = enable

    def watch(self, urls):
        if len(urls) == 0:
            self._monitor_enable(False)
            return

        if not self.monitor_is_on:
            # turn monitor back on
            self._monitor_enable(True)

        urls = copy.deepcopy(urls)
        self.cmds = self.build_cmds(urls)
        self.thread = threading.Thread(target=self._watch_thread_entry)
        self.thread.start()

    def stop(self):
        if not self.monitor_is_on:
            return

        self.stop_event.set()
        self.thread.join(10)
        if self.thread.isAlive():
            logger.critical('Thread is still alive after 10s! We will continue'
                            'as we can\'t do anything else')
        self.stop_event.clear()

    def setUrls(self, urls):
        self.stop()
        self.watch(urls)
