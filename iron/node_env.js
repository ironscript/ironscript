import {readFile} from 'fs';
import globalenv from './globalenv.js';
import IronSymbol from './symbol.js';
import {nextTick} from 'async-es';
import importfn from './import.js';
import {join} from 'path';

export default function (basedir) {
  let env = globalenv();
  env.sync();
  
  function _readFile (err, _env, _cb, filepath) {
    readFile ( join('./', basedir, filepath), 'utf8', (err, str) => {
      nextTick (_cb, err, _env, null, str);  
    });
  }
  env.bind(new IronSymbol('_readfile'), _readFile);
  env.bind(new IronSymbol('_readsource'), _readFile);
  env.bind(new IronSymbol('_import'), importfn(env));
  
  env.unsync();
  return env;
}
