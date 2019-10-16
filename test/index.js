const {writeFile, unlink} = require('fs');

const FileBus = require('../cjs');

let fb = new FileBus('.same', '.same');

fb.on('error', console.error);
fb.on('ready', console.log);

fb.send('ready').then(() => {
  setTimeout(() => {
    writeFile('.same', '', () => {
      setTimeout(() => {
        fb.send('ready', 'test ready').then(() => {
          setTimeout(() => {
            writeFile('.same', 'ready     ', () => {
              setTimeout(() => {
                fb.send('ready', 'closing').then(() => {
                  fb.stop();
                  fb.stop();
                  fb.send('nope').catch(console.error);
                  fb = new FileBus('.same');
                  fb.send('nope').catch(console.error);
                  fb.stop();
                  fb = new FileBus(null, '.same');
                  fb.send('OK').then(() => {
                    fb.stop();
                    require('fs').unlink('.same', () => {
                      // OK
                    });
                  });
                });
              }, 300);
            });
          }, 300);
        });
      }, 300);
    });
  }, 300);
});
