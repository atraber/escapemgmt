# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from rectpack import newPacker
import copy
import functools
import math
import psutil
import subprocess
import threading
import time

class UrlBox:
    def __init__(self, url, crop_x2, crop_y2, crop_x1 = 0, crop_y1 = 0, orientation = 0):
        if not orientation in [0, 90, 180, 270]:
            print("Unknown orientation. Setting it to 0")
            orientation = 0

        if orientation == 90:
            crop_x1, crop_y1 = crop_y1, crop_x1
            crop_x2, crop_y2 = crop_y2, crop_x2

        if url is None:
            print("URL does not seem to be set")
            url = ""

        self.url = url
        self.pos_x = 0
        self.pos_y = 0
        self.crop = [crop_x1, crop_y1, crop_x2, crop_y2]
        self.orientation = orientation

        self.scaling_factor = 1.0

    def getSize(self):
        size = [self.crop[2] - self.crop[0], self.crop[3] - self.crop[1]]
        return list(map(lambda v: int(v * self.scaling_factor), size))

    def setScalingFactor(self, scaling_factor):
        self.scaling_factor = scaling_factor

    def getScalingFactor(self):
        return self.scaling_factor

    def isEqual(self, rhs):
        for i in range(len(self.crop)):
            if self.crop[i] != rhs.crop[i]:
                return False

        return self.url         == rhs.url \
           and self.orientation == rhs.orientation

    def __repr__(self):
        return "<UrlBox:{} {}:{} {}x{}".format(self.url, self.pos_x, self.pos_y, *self.getSize())


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

        print("Streamer class has been initialized width screen size {}x{}"
            .format(self.screen_size[0], self.screen_size[1]))

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
        return ["omxplayer", url.url, "--live", "--win", win, "--orientation", str(url.orientation), "-o", "alsa"]

    def kill_children(self, pid):
        process = psutil.Process(pid)
        for proc in process.children(recursive=True):
            proc.kill()
        process.kill()

    def _watch_thread_entry(self):
        processes = []
        for cmd in self.cmds:
            print(cmd)
            try:
                p = subprocess.Popen(cmd, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
            except FileNotFoundError:
                print("Could not start streaming application")
                continue
            processes.append(p)

        while True:
            for i in range(len(processes)):
                try:
                    p = processes[i]
                    if p.poll() is not None:
                        print("{} has crashed. Restarting".format(self.cmds[i]))
                        p.terminate()
                        processes[i] = subprocess.Popen(self.cmds[i], stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
                except Exception as e:
                    print(e)
                    print("Something went wrong while checking if process is still alive")

            time.sleep(1)

            if self.stop_event.wait(1.0):
                for p in processes:
                    self.kill_children(p.pid)
                return

    def _monitor_enable(self, enable):
        try:
            if enable:
                subprocess.call(["/opt/vc/bin/tvservice", "-p"])
            else:
                subprocess.call(["/opt/vc/bin/tvservice", "-o"])
        except FileNotFoundError:
            print("tvservice executable not found. Cannot control monitor")

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
            print("Thread is still alive after 10s! We will continue as we can't do anything else")
        self.stop_event.clear()

    def setUrls(self, urls):
        self.stop()
        self.watch(urls)
