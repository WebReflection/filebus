'use strict';
const {writeFile} = require('fs');
const {exec} = require('child_process');

const {stringify} = JSON;

module.exports = class FileOutBus {

  constructor(driver, file) {
    this.driver = driver;
    this.file = file;
  }

  send(type, json) {
    return new Promise((resolve, reject) => {
      const data = json == null ? type : `${type} ${stringify(json)}`;
      writeFile(this.file, data, err => {
        const {driver} = this;
        /* istanbul ignore if */
        if (!driver.active)
          resolve(json);
        /* istanbul ignore if */
        if (err)
          reject(err);
        else
          exec('sync', err => {
            /* istanbul ignore next */
            if (err && driver.active)
              reject(err);
            else
              resolve(json);
          });
      });
    });
  }
};
