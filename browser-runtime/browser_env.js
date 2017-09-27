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
import {importfn, includefn, globalenv, IronSymbol} from '../iron.js';
import {join, dirname, basename, extname} from './utils/path.js';

export default function (runtimeContext) {
  let env = globalenv();
  
  env.defc('__base_dir__',      runtimeContext.basedir );
  env.defc('__readfile__',      runtimeContext.readFile );
  env.defc('__include_dir__',   join(runtimeContext.rootdir, 'include') );
  env.defc('imports', window);
  env.defc('__path_utils__', {
    join: join, 
    dirname: dirname, 
    basename: basename, 
    extname: extname
  });

  function _readfile (err, _env, _cb, filepath) {
    let basedir = _env.getc('__base_dir__');
    if (!basedir.startsWith('/')) basedir = join(runtimeContext.pwd, basedir);
    let source = runtimeContext.readFile(join(basedir, filepath));
    if (!source) nextTick (_cb, 'could not read file '+filepath);
    nextTick(_cb, null, env, null, source);
  }
  
  env.sync();

  env.bind(new IronSymbol ('_readfile'), _readfile);
  env.bind(new IronSymbol ('_readsource'), _readfile);
  env.bind(new IronSymbol ('_import'), importfn(env) );
  env.bind(new IronSymbol ('_include'), includefn(env) );

  
  env.unsync();
  
  return env;
}

