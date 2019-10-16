'use strict';
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

const {EventEmitter} = require('events');
const {readFile, watch, writeFile} = require('fs');
const {basename, dirname, resolve} = require('path');

const DEBOUNCE = 100;
const {stringify, parse} = JSON;
const {trim} = '';

const notifiers = new WeakMap;

const create = path => {
  path = resolve(path);
  return {path, file: basename(path), dir: dirname(path), _: null};
};

module.exports = class FileBus extends EventEmitter {
  constructor(input, output) {
    super();
    const notifier = {
      input: input ? create(input) : null,
      output: output ? create(output) : null
    };
    notifiers.set(this, notifier);
    if (input) {
      const {dir, file, path} = notifier.input;
      let i = 0;
      notifier.input._ = watch(dir, {recursive: true}, (event, name) => {
        if (event === 'change' && name === file) {
          clearTimeout(i);
          i = setTimeout(
            () => {
              readFile(path, (err, data) => {
                if (!this.active)
                  return;
                /* istanbul ignore if */
                if (err)
                  this.emit('error', path);
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
            },
            DEBOUNCE
          );
        }
      });
    }
  }
  get active() { return notifiers.has(this); }
  send(type, json) {
    return new Promise((resolve, reject) => {
      if (this.active) {
        const {output} = notifiers.get(this);
        if (output) {
          const data = json != null ? `${type} ${stringify(json)}` : type;
          writeFile(output.path, data, err => {
            /* istanbul ignore if */
            if (err)
              reject(err);
            else
              resolve(json);
          });
        }
        else
          reject(FileBus.name + ' without output');
      }
      else
        reject(FileBus.name + ' stopped');
    });
  }
  stop() {
    if (this.active) {
      const {input} = notifiers.get(this);
      notifiers.delete(this);
      if (input)
        input._.close();
    }
  }
};
