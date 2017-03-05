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
import IronSymbol from './symbol.js';
import {fn, fx, fxSync} from './higher.js';
import {_eval, _eval_unsafe} from './interpret.js';
import {nextTick} from 'async-es';
import Cell from './cell.js';

function echo (...args) {
  let str = "";
  for (let arg of args) {
    if (arg instanceof Cell) str += Cell.stringify(arg) + " ";
    else if (arg instanceof Function) str += '[Function] ';
    else if (arg instanceof Object && arg.__itype__ === 'collection') {
      str += JSON.stringify(arg.obj) + " ";
      //console.log(arg);
    }
    else if (arg instanceof Object && arg.__itype__ === 'sequence') str += JSON.stringify(arg.arr) + " ";
    else if (arg instanceof Object && arg.type === 'ironsymbol') str += arg.symbol + " ";
    else if (typeof arg === 'object') str += JSON.stringify(arg) + " ";
    else str += arg + " ";
  }
  console.log(str);
}

export default function () {
  let _globalenv = new Env (null, null, null, true);
  _globalenv.sync();
  _globalenv.bind (new IronSymbol('_fx'), fx);
  _globalenv.bind (new IronSymbol('_eval'), _eval);
  _globalenv.bind (new IronSymbol('_eval!'), _eval_unsafe);
  _globalenv.bind (new IronSymbol('_echo'), fxSync(echo));

  function _new (cls, ...args) {
    return new cls (...args);
  }
  _globalenv.bind (new IronSymbol('_new'), fxSync(_new));
  
  _globalenv.unsync();
  return _globalenv;
}
