# Copyright 2018 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import prometheus_client
import subprocess
import threading
from OpenGL.GL import *
from OpenGL.GLUT import *
from absl import flags
from logger import logger


FLAGS = flags.FLAGS


connectedMetric = prometheus_client.Enum(
        'backend_connected', 'Connected to stream server',
        states=['True', 'False'])
_bgs = []


class Background:
    def __init__(self, screen):
        _bgs.append(self)
        self._connected = False

        self.width = screen.width
        self.height = screen.height
        self.x = screen.x
        self.y = screen.y
        self._screen = screen

    def _glut(self):
        if FLAGS.debug:
            glutInitWindowPosition(100, 100)
            glutInitWindowSize(1024, 768)
            glutCreateWindow("Background")
        else:
            # The application will enter fullscreen.
            glutInitWindowPosition(self.x, self.y)
            glutInitWindowSize(self.width, self.height)
            glutCreateWindow("Background")
            #glutFullScreen()

        # Setup callbacks for keyboard and display
        glutDisplayFunc(self._display)

    def _display(self):
        if self._connected:
            glClearColor(0.0, 0.0, 0.0, 1.0)
        else:
            glClearColor(1.0, 0.0, 0.0, 1.0)
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        glutSwapBuffers()

    def setConnected(self, connected):
        self._connected = connected
        if connected:
            connectedMetric.state('True')
        else:
            connectedMetric.state('False')

    def getScreen(self):
        return self._screen


def _timerCb(arg):
    glutPostRedisplay()
    glutTimerFunc(1000, _timerCb, 0)


def start():
    t = threading.Thread(target=_glutLoop)
    t.start()


def _glutLoop():
    glutInit()
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB)

    for bg in _bgs:
        bg._glut()

    glutTimerFunc(1000, _timerCb, 0)

    # Enters the GLUT event processing loop
    #glutMainLoop()
    #logger.critical("glutMainLoop has exited.")
    #os._exit(-1)
