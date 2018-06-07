import copy
import functools
import psutil
import subprocess
import threading
import time

class UrlBox:
    def __init__(self, url, size_x, size_y, orientation = 0):
        self.url = url
        self.pos_x = 0
        self.pos_y = 0
        self.size_x = size_x
        self.size_y = size_y
        self.orientation = orientation

        if not self.orientation in [0, 90, 180, 270]:
            print("Unknown orientation. Setting it to 0")
            self.orientation = 0

        if orientation == 90:
            tmp = self.size_x
            self.size_x = self.size_y
            self.size_y = tmp

    def getScalingFactor(self, display_x, display_y):
        x = display_x / self.size_x
        y = display_y / self.size_y
        return min(x, y)

    def scale(self, scaling_factor):
        self.size_x = int(self.size_x * scaling_factor)
        self.size_y = int(self.size_y * scaling_factor)

    def center(self, display_x, display_y):
        self.pos_x = int((display_x - self.size_x)/2)
        self.pos_y = int((display_y - self.size_y)/2)

    def isEqual(self, rhs):
        return self.url         == rhs.url \
           and self.size_x      == rhs.size_x \
           and self.size_y      == rhs.size_y \
           and self.orientation == rhs.orientation


def omx_cmd(url):
    tmp = ["{}".format(i) for i in [url.pos_x, url.pos_y, int(url.pos_x + url.size_x), int(url.pos_y + url.size_y)]]
    win = ','.join(tmp)
    return ["omxplayer", url.url, "--win", win, "--orientation", str(url.orientation), "-o", "alsa"]


class Streamer:
    def __init__(self, screen_size):
        self.stop_watch = False
        self.monitor_is_on = False
        self.screen_size = screen_size

        print("Streamer class has been initialized width screen size {}x{}"
            .format(self.screen_size[0], self.screen_size[1]))

    def build_cmds(self, urls):
        cmds = []
        display_size_x = self.screen_size[0]
        display_size_y = self.screen_size[1]

        if len(urls) == 0:
            print("You did not give us a url")
            return []
        if len(urls) == 1:
            scaling = urls[0].getScalingFactor(display_size_x, display_size_y)
            urls[0].scale(scaling)
            urls[0].center(display_size_x, display_size_y)

            cmds.append(omx_cmd(urls[0]))
        elif len(urls) == 2:
            if urls[0].orientation == 0 and urls[0].orientation == 0:
                size_x = display_size_x
                size_y = display_size_y/2
            elif urls[0].orientation == 90 and urls[1].orientation == 90:
                size_x = display_size_x/2
                size_y = display_size_y
            else:
                size_x = display_size_x/2
                size_y = display_size_y/2

            for url in urls:
                scaling = url.getScalingFactor(size_x, size_y)
                url.scale(scaling)
                url.center(size_x, size_y)

            urls[1].pos_x += (display_size_x - size_x)
            urls[1].pos_y += (display_size_y - size_y)

            for url in urls:
                cmds.append(omx_cmd(url))
        else:
            size_x = display_size_x
            size_y = display_size_y/len(urls)

            for url in urls:
                scaling = url.getScalingFactor(size_x, size_y)
                url.scale(scaling)
                url.center(size_x, size_y)

            for i in range(1, len(urls)):
                urls[i].pos_y += i * size_y

            for url in urls:
                cmds.append(omx_cmd(url))

        return cmds

    def kill_children(self, pid):
        process = psutil.Process(pid)
        for proc in process.children(recursive=True):
            proc.kill()
        process.kill()

    def _watch_thread_entry(self):
        processes = []
        for cmd in self.cmds:
            print(cmd)
            p = subprocess.Popen(cmd, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
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

            if self.stop_watch:
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

        self.stop_watch = True
        self.thread.join()
        self.stop_watch = False
