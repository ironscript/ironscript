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


import globalenv from './globalenv.js';
import IronSymbol from './symbol.js';
import {nextTick} from 'async-es';
import importfn from './import.js';

export default function () {
  let env = globalenv();

  env.sync();
  
  
  env.bind (new IronSymbol ('_doc_'), document );
  env.bind (new IronSymbol ('_win_'), window );
  
  function _readsource (err, env, cb, id) {
    let source = document.getElementById(id).text;
    nextTick(cb, null, env, null, source);
  }
  env.bind(new IronSymbol ('_readsource'), _readsource);
  env.bind(new IronSymbol ('_import'), importfn(env) );

  
  env.unsync();
  
  return env;
}

