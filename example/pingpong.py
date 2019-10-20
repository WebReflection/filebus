import os
import sys
sys.path.insert(1, os.path.realpath('../python'))

import time

def ping(data = ''):
  print('Python: ping')
  time.sleep(1)
  fb.send('pong')

from filebus import FileBus
fb = FileBus('inout.txt', 'inout.txt')
fb.on('ping', ping)

# simply wait for JS handshake
