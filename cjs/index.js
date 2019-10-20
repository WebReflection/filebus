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
const {resolve} = require('path');

const FileInBus = (require('./filebus-in.js'));
const FileOutBus = (require('./filebus-out.js'));
const { unlink } = require('fs');

const HANDHSAKE = '__handshake__';

const inBus = new WeakMap;
const outBus = new WeakMap;
const secrets = new WeakMap;

let random = Math.random();

module.exports = class FileBus extends EventEmitter {

  constructor(input = '', output = '', cleanup = false) {
    super();
    this.cleanup = cleanup;
    if (output)
      outBus.set(this, new FileOutBus(this, resolve(output)));
    if (input) {
      inBus.set(this, new FileInBus(this, resolve(input)));
      if (output) {
        const secret = '__JS__' + ++random;
        secrets.set(this, secret);
        this.on(HANDHSAKE, value => {
          if (outBus.has(this) && secret !== value && value[0] !== '!')
            this.send(HANDHSAKE, '!' + value);
        });
      }
    }
  }

  get active() { return inBus.has(this) || outBus.has(this); }

  handshake() {
    if (this.active) {
      const emit = () => {
        /* istanbul ignore else */
        if (this.active)
          this.emit('handshake');
      };
      if (secrets.has(this)) {
        let timer = 0;
        const secret = secrets.get(this);
        this.on(HANDHSAKE, function handshake(value) {
          /* istanbul ignore else */
          if (value[0] === '!' && value.slice(1) === secret) {
            clearTimeout(timer);
            this.removeListener(HANDHSAKE, handshake);
            emit();
          }
        });
        (function handshake(self, delay) {
          /* istanbul ignore else */
          if (self.active) {
            timer = setTimeout(handshake, delay, self, delay * 1.5);
            self.send(HANDHSAKE, secret);
          }
        }(this, 250));
      }
      else
        setTimeout(emit);
    }
  }

  send(type, json) {
    return outBus.has(this) ?
            outBus.get(this).send(type, json) :
            Promise.reject(`${this.constructor.name} has no destination`);
  }

  stop() {
    this.removeAllListeners();

    let otherFile = '';
    if (outBus.has(this)) {
      const {file} = outBus.get(this);
      outBus.delete(this);
      otherFile = file;
      if (this.cleanup)
        unlink(file, Object);
    }

    if (inBus.has(this)) {
      const {bus, file} = inBus.get(this);
      inBus.delete(this);
      bus.stop();
      if (this.cleanup && file !== otherFile)
        unlink(file, Object);
    }
  }
};
