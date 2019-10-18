const {writeFile} = require('fs');
const {execSync} = require('child_process');

const FileBus = require('../cjs');

let fb = new FileBus('.same', '.same', true);

fb.on('error', console.error);
fb.on('ready', console.log);

fb.send('ready').then(() => {
  writeFile('.same', '', () => {
    execSync('sync');
    setTimeout(() => {
      fb.send('ready', 'test ready').then(() => {
        writeFile('.same', 'ready     ', () => {
          execSync('sync');
          setTimeout(() => {
            fb.send('ready', 'closing').then(() => {
              fb.stop();
              fb.stop();
              fb.send('nope').catch(console.error);
              fb = new FileBus('.other');
              fb.send('nope').catch(console.error);
              fb.stop();
              fb = new FileBus(null, '.other');
              fb.send('ready').then(() => {
                fb.stop();
                fb = new FileBus(null, '.other', true);
                fb.send('ready').then(() => {
                  fb.stop();
                  writeFile('.same', '', () => {
                    execSync('sync');
                    fb = new FileBus('.same', '.other', true);
                    fb.stop();
                    console.log('OK');
                  });
                });
              });
            });
          }, 100);
        });
      });
    }, 100);
  });
});
