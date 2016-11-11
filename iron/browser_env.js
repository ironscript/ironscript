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

