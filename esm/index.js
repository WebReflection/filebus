/*!
 * ISC License
 *
 * Copyright (c) 2019, Andrea Giammarchi, @WebReflection
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

import {EventEmitter} from 'events';
import {exists, readFile, writeFile} from 'fs';
import {resolve} from 'path';
import {exec} from 'child_process';

import INW from 'inotifywait-spawn';
const {IN_CLOSE_WRITE} = INW;

const {stringify, parse} = JSON;
const {trim} = '';

const busses = new WeakMap;

export default class FileBus extends EventEmitter {
  constructor(input = '', output = '') {
    super();
    const bus = {
      input,
      output: output ? resolve(output) : '',
      ready: new Promise((resolve, reject) => {
        if (input) {
          exists(input, exists => {
            /* istanbul ignore if */
            if (!this.active)
              return;
            const whenExists = err => {
              /* istanbul ignore if */
              if (!this.active)
                resolve();
              /* istanbul ignore if */
              if (err)
                reject(err);
              else {
                resolve(
                  new INW(input, {events: IN_CLOSE_WRITE}).on(IN_CLOSE_WRITE, () => {
                    readFile(input, (err, data) => {
                      /* istanbul ignore if */
                      if (!this.active)
                        return;
                      /* istanbul ignore if */
                      if (err)
                        this.emit('error', err, input);
                      else {
                        const content = trim.call(data);
                        if (content) {
                          const i = content.indexOf(' ');
                          if (i < 0)
                            this.emit(content, null);
                          else {
                            const type = content.slice(0, i);
                            const json = trim.call(content.slice(i + 1));
                            this.emit(type, parse(json));
                          }
                        }
                      }
                    });
                  })
                );
              };
            }
            /* istanbul ignore if */
            if (exists)
              whenExists();
            else
              writeFile(input, '', whenExists);
          });
        }
        else
          resolve();
      })
    };
    busses.set(this, bus);
  }
  get active() { return busses.has(this); }
  send(type, json) {
    const {active, constructor} = this;
    if (active) {
      const {ready, output} = busses.get(this);
      if (output) {
        return ready.then(() => new Promise((resolve, reject) => {
          const data = json == null ? type : `${type} ${stringify(json)}`;
          writeFile(output, data, err => {
            /* istanbul ignore if */
            if (err)
              reject(err);
            else
              exec('sync', err => {
                /* istanbul ignore if */
                if (err)
                  reject(err);
                else
                  resolve(json);
              });
          });
        }));
      }
      else
        return Promise.reject(`${constructor.name} without destination`);
    }
    else
      return Promise.reject(`${constructor.name} stopped`);
  }
  stop() {
    if (this.active) {
      const {ready} = busses.get(this);
      busses.delete(this);
      ready.then(_ => (_ && _.stop()));
    }
  }
};
