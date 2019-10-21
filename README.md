# filebus

[![Build Status](https://travis-ci.com/WebReflection/filebus.svg?branch=master)](https://travis-ci.com/WebReflection/filebus) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/filebus/badge.svg?branch=master)](https://coveralls.io/github/WebReflection/filebus?branch=master)

<sup>**Social Media Photo by [Juan Encalada](https://unsplash.com/@juanencalada) on [Unsplash](https://unsplash.com/)**</sup>


A communication channel based on files watcher.


### Example

You can clone this repository and [inotifywait-spawn](https://github.com/WebReflection/inotifywait-spawn) in the same folder, enter into the `filebus/example` directory and launch `npm start` to see Python and NodeJS communicating with each other.

You can also grasp most of this utility via the following example:

```js
const FileBus = require('filebus');

// new instance with either an input to listen for
// or an output to send messages ... or both!
const fb = new FileBus(
  input,  // optional input file to watch
  output  // optional output file to write
);

// INPUT relatd API

// will be triggered when the file will contain
// "ready" with eventually extra data as JSON
fb.on('ready', console.log);

// triggered when there are reading errors
// from the watched input file
fb.on('error', console.error);

// stop listening to events
// no more events triggered
fb.stop();


// OUTPUT related API

// will write the following into the output file
// "event {"optional":"data"}"
// if there is a watcher listening for "ready",
// or any other event name, it will be invoked
// receiving the object {optional: 'data'}
fb.send('ready', {optional: 'data'}).then(() => {
  // executed once the content has been written
  // and also synced with the system
});


// HANDSHAKE

// whenever the input/output files are between two
// different instances of FileBus or two different PLs
// the handshake, from one of the two sides, grants
// that both instances are setup and ready to react

fb = new FileBus('.python', '.js', true);
// Python counterpart: fb = FileBus('.js', '.python')

// will happen once Python responds
fb.on('handshake', () => {
  fb.send('update-display', 'Hello World');
});

fb.handshake();
```


### Communicate with Python 3

This module contains a [python/filebus.py](./python/filebus.py) file where you can import `FileBus` and use pretty much exact same API.

Please note the python file also relies in this module dependencies, so that [inotifywait-spawn](https://github.com/WebReflection/inotifywait-spawn#readme) module must be installed too, otherwise its `python/inotifywait.py` would be missing.

`inotifywait` requires the Python 3 [inotify_simple](https://pypi.org/project/inotify_simple/) module.

```sh
sudo pip3 install inotify_simple
```

To import `FileBus` you can write the following:

```python
import os
import sys
sys.path.insert(1, os.path.realpath('./node_modules/filebus/python'))

from filebus import FileBus

fb = FileBus('test.txt', 'test.txt', True)
fb.on('ready', lambda data: print(data))
fb.send('ready')

# wait for events to trigger
import time
time.sleep(0.1)

# close and cleanup the file
fb.stop()
```
