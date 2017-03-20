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
import IronSymbol from './symbol.js';
import Cell from './cell.js';
import Env from './env.js';

const _readsource = new IronSymbol('_readsource');

export function importfn (env) {
  let imported = new Map();
  return (err, _env, cb, sourcename, namesList) => {
    let readSource = _env.get(_readsource);

    let basedir = _env.getc('__base_dir__');
    let __include_dir__ = _env.getc('__include_dir__');
    let __path_utils__ = _env.getc('__path_utils__');

    let join = __path_utils__.join;
    let dirname = __path_utils__.dirname;
    let basename = __path_utils__.basename;
    
    let sourceDir = null;
    let _all = new IronSymbol('_all');

    if (!sourcename.endsWith('.is')) sourceDir = join(__include_dir__, dirname(sourcename));
    else sourceDir = join(basedir, dirname(sourcename));
    let filename = join(sourceDir, basename(sourcename));

    if (imported.has(filename)) {
      let importEnv = imported.get(filename);
      if (namesList) {
        if (namesList instanceof Cell) {
          while (namesList instanceof Cell) {
            _env.syncAndBind(namesList.car, importEnv.get(namesList.car));
            namesList = namesList.cdr;
          }
        }
        else if (_all.equal(namesList)) _env.map = new Map([..._env.map, ...importEnv.map]);
      }
      nextTick (cb, null, _env, null, importEnv);
    }
    else {
			_env.defc('__base_dir__', sourceDir);
      nextTick (readSource, err, _env, (err, __env, _cb, src) => {
				_env.defc('__base_dir__', basedir);
        let p = new Parser ({name:sourcename, buffer:src});
       	
				let execenv = new Env (null, null, env);
				execenv.defc('__base_dir__', sourceDir);

				nextTick (evalAsync, p.parse(), execenv, (err, importEnv, _cb, val) => {
          imported.set (filename, importEnv);
          if (namesList) {
            if (namesList instanceof Cell) {
              while (namesList instanceof Cell) {

                _env.syncAndBind(namesList.car, importEnv.get(namesList.car));
                namesList = namesList.cdr;
              }
            }
            else if (_all.equal(namesList)) _env.map = new Map([..._env.map, ...importEnv.map]);
          }
          nextTick (cb, null, _env, null, importEnv);
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
    let basedir = _env.getc('__base_dir__');
    let __include_dir__ = _env.getc('__include_dir__');
    let __path_utils__ = _env.getc('__path_utils__');
    
    let join = __path_utils__.join;
    let dirname = __path_utils__.dirname;
    let basename = __path_utils__.basename;

    let sourceDir = null;
    
    if (!sourcename.endsWith('.is')) sourceDir = join(__include_dir__, dirname(sourcename));
    else sourceDir = join(basedir, dirname(sourcename));
    _env.defc('__base_dir__', sourceDir);
    let filename = join(sourceDir, basename(sourcename));
    
    if (included.has(filename)) { 
      src = included.get(filename);
      let p = new Parser({name: sourcename, buffer: src});
      nextTick (evalAsync, p.parse(), _env, (err, _env, _cb, val) => {
        _env.defc('__base_dir__', basedir);
        nextTick (cb, null, _env, null, null);
      });
    }
    else {
      nextTick (readsource, err, _env, (err, __env, _cb, src) => {
        included.set(filename, src);
        let p = new Parser({name: sourcename, buffer: src});
        nextTick (evalAsync, p.parse(), _env, (err, _env, _cb, val) => {
          _env.defc('__base_dir__', basedir);
          nextTick (cb, null, _env, null, null);
        });
      }, basename(sourcename));
    }
  }
}


