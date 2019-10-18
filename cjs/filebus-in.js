'use strict';
const {existsSync, readFile, writeFileSync} = require('fs');
const {execSync} = require('child_process');

const INW = (require('inotifywait-spawn'));
const {IN_CLOSE_WRITE} = INW;

const {parse} = JSON;
const {trim} = '';

module.exports = class FileInBus {

  constructor(driver, file) {
    // if the file doesn't exist, create it right away
    // sync calls are needed to simplify driver.stop() calls
    /* istanbul ignore if */
    if (!existsSync(file)) {
      writeFileSync(file, '');
      execSync('sync');
    }

    this.file = file;
    this.bus = new INW(file, {events: IN_CLOSE_WRITE})
                .on('error', onError.bind(driver, file))
                .on(IN_CLOSE_WRITE, onWrite.bind(driver, file));
  }
};

/* istanbul ignore next */
function onError(file, err) {
  this.emit('error', err, file);
}

function onWrite(file) {
  readFile(file, (err, data) => {
    /* istanbul ignore if */
    if (!this.active)
      return;
    /* istanbul ignore if */
    if (err)
      onError.call(this, file, err);
    else {
      const content = trim.call(data);
      if (content) {
        const i = content.indexOf(' ');
        if (i < 0)
          this.emit(content, null);
        else {
          const type = content.slice(0, i);
          const json = content.slice(i + 1);
          this.emit(type, parse(json));
        }
      }
    }
  });
}
