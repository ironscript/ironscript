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


import {nextTick} from 'async-es';
import Parser from './parser.js';
import evalAsync from './evalAsync.js';
import {dirname, join, basename} from 'path';
import IronSymbol from './symbol.js';

const _readsource = new IronSymbol('_readsource');
const _basedir = new IronSymbol('__base_dir__');

export function importfn (env) {
  let imported = new Map();
  return (err, _env, cb, sourcename) => {
    let readSource = _env.get(_readsource);
    let basedir = _env.get(_basedir);
   
    //console.log('debug: '+sourcename);

    if (imported.has(sourcename)) nextTick (cb, null, _env, null, imported.get(sourcename));
    else {
      if (!sourcename.endsWith('.is')) _env.syncAndBind (_basedir, join(__dirname, 'include', dirname(sourcename)));
      else _env.syncAndBind(_basedir, join(basedir, dirname(sourcename)));
      nextTick (readSource, err, _env, (err, __env, _cb, src) => {
        let p = new Parser ({name:sourcename, buffer:src});
        nextTick (evalAsync, p.parse(), env, (err, _env_, _cb, val) => {
          imported.set (sourcename, _env_);
          _env.syncAndBind(_basedir, basedir);
          nextTick (cb, null, _env, null, _env_);
        });
      } , basename(sourcename));
    }
  }
}

export function includefn (env) {
  let readsource = env.get(_readsource);
  let included = new Map();
  let src = null;
  return (err, _env, cb, sourcename) => {
    let basedir = _env.get(_basedir);
    //console.log('debug: '+sourcename);
    if (!sourcename.endsWith('.is')) _env.syncAndBind (_basedir, join(__dirname, 'include', dirname(sourcename)));
    else _env.syncAndBind(_basedir, join(basedir, dirname(sourcename)));
    
    if (included.has(sourcename)) { 
      src = included.get(sourcename);
      let p = new Parser({name: sourcename, buffer: src});
      nextTick (evalAsync, p.parse(), _env, (err, _env, _cb, val) => {
        _env.syncAndBind(_basedir, basedir);
        nextTick (cb, null, _env, null, null);
      });
    }
    else {
      nextTick (readsource, err, _env, (err, __env, _cb, src) => {
        included.set(sourcename, src);
        let p = new Parser({name: sourcename, buffer: src});
        nextTick (evalAsync, p.parse(), _env, (err, _env, _cb, val) => {
          _env.syncAndBind(_basedir, basedir);
          nextTick (cb, null, _env, null, null);
        });
      }, basename(sourcename));
    }
  }
}


