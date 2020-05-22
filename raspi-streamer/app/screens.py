from logger import logger
import subprocess
import os
import time


_screens = {}


class Screen:
    def __init__(self, name, width, height, x, y):
        self.name = name
        self.width = width
        self.height = height
        self.x = x
        self.y = y
        self.enabled = True
        self.raspi_display_no = None
        if name == 'HDMI-1':
            self.raspi_display_no = 2
        elif name == 'HDMI-2':
            self.raspi_display_no = 7

    def __repr__(self):
        return "{}: {}x{} {} {}".format(self.name, self.width, self.height, self.x, self.y)

    def disableScreen(self):
        disableScreen(self.name)

    def enableScreen(self):
        enableScreen(self.name)


def getScreens():
    global _screens
    screens = {}
    list_display = os.popen("xrandr --listactivemonitors | grep '+' | \
                        awk {'print $3, $4'}").read().splitlines()
    for l in list_display:
        # 1920/382x1080/215+3840+2160  eDP-1-1      <---- sample
        # ['3840' '2160' '1920' '1080' 'eDP-1-1']   <---- convert to list
        a = l.split(" ")
        name = a[1]
        b = a[0].split("+")
        x = int(b[1])
        y = int(b[2])
        c = b[0].split("x")
        d = c[0].split("/")
        w = int(d[0])
        d = c[1].split("/")
        h = int(d[0])
        screens[name] = Screen(name=name, x=x, y=y, width=w, height=h)
    _screens = screens
    logger.info("Found screens {}".format(_screens))
    return _screens


def disableScreen(name):
    if not name in _screens:
        logger.error('screen {} not found'.format(screen))
        return

    screen = _screens[name]
    if screen.enabled:
        logger.info("Turning monitor {} off.".format(screen.name))
        xrandr(["--output", "{}".format(screen.name), "--off"])
    screen.enabled = False


def enableScreen(name):
    if not name in _screens:
        logger.error('screen {} not found'.format(screen))
        return

    screen = _screens[name]
    if not screen.enabled:
        logger.info("Turning monitor {} on.".format(screen.name))
        xrandr(["--output", "{}".format(screen.name), "--auto"])
    screen.enabled = True


def enableScreens():
    logger.info("Turning all monitors on.")
    devices = ["HDMI-1", "HDMI-2"]
    for device in devices:
        xrandr(["--output", "{}".format(device), "--auto"])


def screensaverDisable():
    try:
        subprocess.call(["xset", "s", "off"], timeout=5)
        subprocess.call(["xset", "s", "noblank"], timeout=5)
        subprocess.call(["xset", "-dpms"], timeout=5)
    except subprocess.TimeoutExpired:
        logger.info("Timeout expired")


def xrandr(args):
    try:
        cmd = ["xrandr"] + args
        proc = subprocess.Popen(cmd)
        proc.wait(timeout=5)
    except FileNotFoundError:
        logger.error("xrandrnot found. Cannot control monitor.")
    except subprocess.TimeoutExpired:
        proc.kill()
        logger.info("Timeout expired.")


enableScreens()
time.sleep(1)
screensaverDisable()
