# filebus

A communication channel based on files watcher.


### Example

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
// if there is a watcher listening for "event"
// it will be invoked with {optional: 'data'}
fb.send('event', {optional: 'data'}).then(() => {
  // executed once the content has been written
  // and also synced with the system
});
```


### Communicate with Python 3

This module contains a [python/filebus.py](./python/filebus.py) file where you can import `FileBus` and use pretty much exact same API.

Please note the python file also relies in this module dependencies, so that [inotifywait-spawn](https://github.com/WebReflection/inotifywait-spawn#readme) module must be installed too, otherwise its `python/inotifywait.py` would be missing.

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
