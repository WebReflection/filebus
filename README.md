# filebus

A communication channel based on files watcher.

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