import json
import os
import random
import time

# import EventEmitter, INotifyWait from 'inotifywait-spawn'
def loadINW():
  import sys
  pwd = os.path.dirname(__file__)
  inwPath = os.path.join(pwd, '..', '..', 'inotifywait-spawn', 'python')
  if os.path.exists(os.path.realpath(inwPath)):
    sys.path.insert(1, os.path.realpath(inwPath))
  else:
    inwPath = os.path.join(pwd, '..', 'node_modules', 'inotifywait-spawn', 'python')
    if os.path.exists(os.path.realpath(inwPath)):
      sys.path.insert(1, os.path.realpath(inwPath))
    else:
      print('')
      print('Please install \x1B[1minotifywait-spawn\x1B[0m via `npm i`')
      print('')
      time.sleep(2)
      sys.exit(1)

loadINW()

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

    self.__HANDSHAKE = '__handshake__'
    self.__shake = False
    self.__secret = ''
    self.cleanup = cleanup

    if len(output):
      self.__out = FileOutBus(self, os.path.abspath(output))
    else:
      self.__out = None

    if len(input):
      self.__in = FileInBus(self, os.path.abspath(input))
      if self.__out is not None:
        self.__secret = '__Python__' + str(random.random())
        self.on(self.__HANDSHAKE, self.__onhandshake)
    else:
      self.__in = None

  @property
  def active(self):
    return self.__in is not None or self.__out is not None

  def send(self, type, data = None):
    return self.__out.send(type, data)

  def stop(self):
    self.removeAllListeners()

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

  def __onhandshake(self, data):
    if self.__out is not None and data['reply'] == False and data['secret'] != self.__secret:
      data['reply'] = True
      self.send(self.__HANDSHAKE, data)

  def __handshake(self, data):
    if data['reply'] and data['secret'] == self.__secret:
      self.__shake = False
      self.removeListener(self.__HANDSHAKE, self.__handshake)
      if self.active:
        self.emit('handshake')

  def handshake(self):
    if self.active:
      if len(self.__secret) > 0:
        self.__shake = True
        self.on(self.__HANDSHAKE, self.__handshake)
        attempts = 0
        delay = 0.25
        while self.__shake:
          self.send(
            self.__HANDSHAKE,
            {'attempts': attempts, 'reply': False, 'secret': self.__secret}
          )
          time.sleep(delay)
          attempts = attempts + 1
          delay = delay * 1.5
      else:
        self.emit('handshake')

  def __inUpdate(self):
    if self.__in is not None:
      self.__in.update()

  def on(self, type, callback):
    super().on(type, callback)
    self.__inUpdate()

  def removeListener(self, type, callback):
    super().removeListener(type, callback)
    self.__inUpdate()

  def removeAllListeners(self):
    super().removeAllListeners()
    self.__inUpdate()

# # EXAMPLE
# fb = FileBus('test.txt', 'test.txt', True)
# fb.on('ready', lambda data: print(data))
# fb.send('ready')
# import time
# time.sleep(0.1)
# fb.stop()
