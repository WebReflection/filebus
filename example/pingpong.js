const FileBus = require('../');

const fb = new FileBus('inout.txt', 'inout.txt');

fb.on('pong', () => {
  console.log('JS: pong');
  setTimeout(() => fb.send('ping'), 1000);
});

fb.once('handshake', () => {
  // send the first ping
  fb.send('ping');
});

fb.handshake();
