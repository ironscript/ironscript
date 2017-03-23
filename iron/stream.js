/**
 * Copyright (c) 2016 Ganesh Prasad Sahoo (GnsP)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the "Software"), to deal 
 * in the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
 * SOFTWARE.
 *
 */


import Env from './env.js';
import {nextTick} from 'async-es';

export default class Stream {
  constructor (core, env) {
    this.__itype__ = 'stream';
    this.env = env;
    this.core = core;
    this.value = undefined;

    this.callbacks = [];
    this.addcb = (cb) => { this.callbacks.push(cb); }

    this.push = (val) => {
      this.value = val;
      if (val !== null && val !== undefined) for (let cb of this.callbacks)
        nextTick (cb, null, this.env, null, val);
    }

    nextTick (this.core, (val) => {
      this.value = val;
      if (val !== null && val !== undefined) for (let cb of this.callbacks) 
        nextTick (cb, null, this.env, null, val);
    });
  }

	static isStream (obj) {
		return obj instanceof Object && obj.__itype__ === 'stream';
	}
};
    



