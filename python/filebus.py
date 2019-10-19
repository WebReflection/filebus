import os
import json

# import EventEmitter, INotifyWait from 'inotifywait-spawn'
import sys
pwd = os.path.dirname(__file__)
pwd = os.path.join(pwd, '..', '..', 'inotifywait-spawn', 'python')
sys.path.insert(1, os.path.realpath(pwd))

from inotifywait import EventEmitter, INotifyWait

class FileInBus():

  def __init__(self, driver, file):
    if not os.path.exists(file):
      f = open(file, 'w+')
      f.write('')
      f.close()

    self.driver = driver
    self.file = file
    self.bus = None
    self.update()

  def stop(self):
    if self.bus is not None:
      self.bus.stop()

  def update(self):
    self.stop()
    self.bus = INotifyWait(self.file, {'events': INotifyWait.IN_CLOSE_WRITE})
    self.bus.on('error', self.__onError)
    self.bus.on(INotifyWait.IN_CLOSE_WRITE, self.__onWrite)

  def __onError(self, err):
    self.driver.emit('error', err, self.file)

  def __onWrite(self, event):
    if os.path.exists(self.file):
      f = open(self.file, 'r')
      content = f.read().strip()
      f.close()
      i = content.find(' ')
      if i < 0:
        self.driver.emit(content, None)
      else:
        type = content[0:i]
        data = content[(i+1):]
        self.driver.emit(type, json.loads(data))

class FileOutBus():

  def __init__(self, driver, file):
    self.driver = driver
    self.file = file

  def send(self, type, data):
    f = open(self.file, 'w+')
    if data == None:
      f.write(type)
    else:
      f.write(type + ' ' + json.dumps(data))
    f.close()

class FileBus(EventEmitter):

  def __init__(self, input = '', output = '', cleanup = False):
    super(FileBus, self).__init__()
    self.cleanup = cleanup

    if len(input):
      self.__in = FileInBus(self, os.path.abspath(input))
    else:
      self.__in = None

    if len(output):
      self.__out = FileOutBus(self, os.path.abspath(output))
    else:
      self.__out = None

  def on(self, type, callback):
    super().on(type, callback)
    if self.__in is not None:
      self.__in.update()

  def send(self, type, data = None):
    return self.__out.send(type, data)

  def stop(self):
    otherFile = ''

    if self.__out is not None:
      otherFile = self.__out.file
      self.__out = None
      if self.cleanup:
        os.unlink(otherFile)

    if self.__in is not None:
      file = self.__in.file
      self.__in.stop()
      self.__in = None
      if self.cleanup and file != otherFile:
        os.unlink(file)

# # EXAMPLE
# fb = FileBus('test.txt', 'test.txt', True)
# fb.on('ready', lambda data: print(data))
# fb.send('ready')
# import time
# time.sleep(0.1)
# fb.stop()
