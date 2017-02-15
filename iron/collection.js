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

class Store {};

export class Reference {
  constructor (cmd, obj, ...keys) {
    this.__itype__ = 'reference';
    this.obj = obj;
    this.keys = keys;
    this.cmd = cmd;
  }

  get value () {
    if (this.cmd === 'get') return this.get();
    else if (this.cmd === 'set') return (val) => {return this.set(val);};
    else return undefined;
  }

  get () {
    let obj = this.obj;
    for (let key of this.keys) {
      if (obj instanceof Store) obj = obj.get (key);
      else if (obj instanceof Object) obj = obj[key];
      else return undefined;
    }
    return obj;
  }

  set (val) {
    let obj = this.obj;
    for (let key of this.keys.slice(0,-1)) {
      if (obj instanceof Store) obj = obj.get(key);
      else if (obj instanceof Object) obj = obj[key];
      else return undefined;
    }
    if (obj instanceof Store) {
      obj.set(this.keys[this.keys.length-1], val);
      return val;
    }
    else if (obj instanceof Object) {
      obj[this.keys[this.keys.length-1]] = val;
      return val;
    }
    else return undefined;
  }
}

export class Collection extends Store{
  constructor (obj) {
    super();
    this.__itype__ = 'collection'; 
    if (obj) this.obj = obj;
    else this.obj = Object.create(null);
  }

  has (key) { return this.obj[key] !== undefined; }
  
  get (key) {
    if (typeof key !== 'string') return undefined;
    if (this.has(key)) return this.obj[key];
    return undefined;
  }
  
  set (key, val) {
    if (typeof key !== 'string') return undefined;
    this.obj[key] = val;
    return this.obj;
  }
}

export class Sequence extends Store{
  constructor (arr) {
    super();
    this.__itype__ = 'sequence';
    if (arr) this.arr = arr;
    else this.arr = [];
  }
  
  get (ind) {
    if (parseInt(ind) === Number(ind)) return this.arr[ind];
    return undefined;
  }

  set (ind, val) {
    if (parseInt(ind) === Number(ind)) {
      this.arr[ind] = val;
      return this.arr;
    }
    return undefined;
  }

  push (val) {
    this.arr.push(val);
    return val;
  }

  pull () {
    return this.arr.shift();
  }

  pop () {
    return this.arr.pop();
  }
}


