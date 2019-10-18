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
import {resolve} from 'path';

import FileInBus from './filebus-in.js';
import FileOutBus from './filebus-out.js';
import { unlink } from 'fs';

const inBus = new WeakMap;
const outBus = new WeakMap;

export default class FileBus extends EventEmitter {

  constructor(input = '', output = '', cleanup = false) {
    super();
    this.cleanup = cleanup;
    if (input)
      inBus.set(this, new FileInBus(this, resolve(input)));
    if (output)
      outBus.set(this, new FileOutBus(this, resolve(output)));
  }

  get active() { return inBus.has(this) || outBus.has(this); }

  send(type, json) {
    return outBus.has(this) ?
            outBus.get(this).send(type, json) :
            Promise.reject(`${this.constructor.name} has no destination`);
  }

  stop() {
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
