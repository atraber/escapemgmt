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

        if orientation != 0 and orientation != 90:
            raise Exception("Unknown orientation")

        if orientation == 90:
            tmp = self.size_x
            self.size_x = self.size_y
            self.size_y = self.size_x

    def get_scaling_factor(self, display_x, display_y):
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


class ProcessWatcher:
    def __init__(self):
        self.stop_watch = False
        self.monitor_is_off = True

    def decode_cmds(self, urls):
        cmds = []
        display_size_x = 1600
        display_size_y = 1200

        if len(urls) == 1:
            scaling = urls[0].get_scaling_factor(display_size_x, display_size_y)
            urls[0].scale(scaling)
            urls[0].center(display_size_x, display_size_y)

            cmds.append(omx_cmd(urls[0]))
        elif len(urls) == 2:
            assert urls[0].orientation == urls[1].orientation

            if urls[0].orientation == 0:
                size_x = display_size_x
                size_y = display_size_y/2
            else:
                size_x = display_size_x/2
                size_y = display_size_y

            for url in urls:
                scaling = url.get_scaling_factor(size_x, size_y)
                url.scale(scaling)
                url.center(size_x, size_y)

            urls[1].pos_x += (display_size_x - size_x)
            urls[1].pos_y += (display_size_y - size_y)

            for url in urls:
                cmds.append(omx_cmd(url))
        else:
            print("We only support one or two streams for now")

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

    def watch(self, urls):
        if len(urls) == 0:
            subprocess.call(["/opt/vc/bin/tvservice", "-o"])
            self.monitor_is_off = True
            return

        if self.monitor_is_off:
            # turn monitor back on
            subprocess.call(["/opt/vc/bin/tvservice", "-p"])
            self.monitor_is_off = False

        urls = copy.deepcopy(urls)
        self.cmds = self.decode_cmds(urls)
        self.thread = threading.Thread(target=functools.partial(ProcessWatcher._watch_thread_entry, self))
        self.thread.start()

    def stop(self):
        if self.monitor_is_off:
            return

        self.stop_watch = True
        self.thread.join()
        self.stop_watch = False
