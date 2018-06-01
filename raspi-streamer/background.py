from OpenGL.GL import *
from OpenGL.GLUT import *
import subprocess
import threading

def display():
    glClear(GL_COLOR_BUFFER_BIT)
    glutSwapBuffers()

def glMain():
    # Initialize OpenGL
    glutInit()
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB)

    # The application will enter fullscreen
    glutEnterGameMode()

    # Setup callbacks for keyboard and display
    glutDisplayFunc(display)

    # Enters the GLUT event processing loop
    glutMainLoop()

def screensaver_disable():
    subprocess.call(["xset", "s", "off"])
    subprocess.call(["xset", "s", "noblank"])
    subprocess.call(["xset", "-dpms"])
    subprocess.call(["amixer", "cset", "numid=3", "100%"])

def background():
    screensaver_disable()
    t = threading.Thread(target=glMain)
    t.start()
