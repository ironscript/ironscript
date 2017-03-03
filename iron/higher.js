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
import Cell from './cell.js';
import evalAsync from './evalAsync.js';
import {nextTick} from 'async-es';

export function fn (params, body, env) {
  let closureEnv = Env.clone(env);
  if (env.syncLock) closureEnv.sync();
  return function ( err, _env, cb, ...args ) {
    if (err) cb (err);
    //console.log (Cell.stringify(params), Cell.stringify(args),'\n\n');
    //console.log ('\n\n\n\ndebug: \n----------------------------', new Env(params, Cell.list(args),env), '\n\n');
    evalAsync( body, new Env(params, Cell.list(args), closureEnv), cb);
  };
}

export function fx (err, env, cb, f) {
  if (err) cb (err);
  cb( null, env, null, ( err, _env, _cb,  ...args) => {
    let val = f(...args);
    _cb( null, _env, null, val);
  });
}

export function fxSync (f) {
  return (err, _env, _cb, ...args) => {
    let val = f(...args);
    _cb( null, _env, null, val);
  };
}

export function fxAsync (f) { // f = ($return, $throw, $catch, $env, ...args) => {}
  return (err, _env, _cb, ...args) => {
    let exited = false;
    let $return = (retval) => {
      if (!exited) {
        _cb( null, _env, null, retval);
        exited = true;
      }
    }

    let $throw = (_err) => {
      if (!exited) {
        _cb( _err, _env, null, null);
        exited = true;
      }
    }

    let $catch = (catchFn) => {
      if (err) catchFn(err);
    }

    let $yield = (retval) => {
      _cb( null, _env, null, retval);
    }

    f($return, $throw, $catch, $yield, _env.par, ...args);
  }
}
