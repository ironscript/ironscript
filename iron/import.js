import {nextTick} from 'async-es';
import Parser from './parser.js';
import evalAsync from './evalAsync.js';

export default function (env) {
  let readSource = env.map.get('_readsource');
  let imported = new Map();
  return (err, _env, cb, sourcename) => {
    if (imported.has(sourcename)) nextTick (cb, null, _env, null, imported.get(sourcename));
    else {
      nextTick (readSource, err, _env, (err, __env, _cb, src) => {
        let p = new Parser ({name:sourcename, buffer:src});
        nextTick (evalAsync, p.parse(), env, (err, _env_, _cb, val) => {
          imported.set (sourcename, _env_);
          nextTick (cb, null, _env, null, _env_);
        });
      } , sourcename);
    }
  }
}    
