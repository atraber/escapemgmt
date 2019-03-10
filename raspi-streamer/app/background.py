# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import prometheus_client
import subprocess
import threading
from absl import flags
from OpenGL.GL import *
from OpenGL.GLUT import *


FLAGS = flags.FLAGS


connectedMetric = prometheus_client.Enum(
        'backend_connected', 'Connected to stream server',
        states=['True', 'False'])


class Background:
    def __init__(self):
        self.connected = False

        if not FLAGS.debug:
            self.screensaver_disable()

        self.setup_event = threading.Event()
        # sane default values
        self.width = 640
        self.height = 480

        t = threading.Thread(target=self.glMain)
        t.start()

        if not self.setup_event.wait(timeout=5):
            print("Background drawing task has been blocked for more than 5 seconds")

    def display(self):
        if self.connected:
            glClearColor(0.0, 0.0, 0.0, 1.0)
        else:
            glClearColor(1.0, 0.0, 0.0, 1.0)
        glClear(GL_COLOR_BUFFER_BIT)
        glutSwapBuffers()

    def timer(self, arg):
        glutPostRedisplay()
        glutTimerFunc(100, self.timer, 0)

    def glMain(self):
        # Initialize OpenGL
        glutInit()
        glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB)

        if FLAGS.debug:
            glutInitWindowPosition(100, 100)
            glutInitWindowSize(1024, 768)
            glutCreateWindow("Background")
        else:
            # The application will enter fullscreen
            glutEnterGameMode()

        self.width = glutGet(GLUT_WINDOW_WIDTH)
        self.height = glutGet(GLUT_WINDOW_HEIGHT)

        # Setup callbacks for keyboard and display
        glutDisplayFunc(self.display)
        self.timer(0)

        self.setup_event.set()

        # Enters the GLUT event processing loop
        glutMainLoop()

    def screensaver_disable(self):
        subprocess.call(["xset", "s", "off"])
        subprocess.call(["xset", "s", "noblank"])
        subprocess.call(["xset", "-dpms"])
        subprocess.call(["amixer", "cset", "numid=3", "100%"])

    def setConnected(self, connected):
        self.connected = connected
        if connected:
            connectedMetric.state('True')
        else:
            connectedMetric.state('False')

    def getScreenSize(self):
        return [self.width, self.height]
