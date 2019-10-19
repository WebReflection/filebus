const FileBus = require('../');

const fb = new FileBus('pingpong.txt', 'pingpong.txt');
let bootstrap = true;

fb.on('pong', () => {
  bootstrap = false;
  console.log('JS: pong');
  setTimeout(() => fb.send('ping'), 1000);
});

(function init() {
  if (bootstrap) {
    fb.send('ping');
    // try again in few seconds
    // in case no event was ever received
    setTimeout(init, 1000);
  }
}());
