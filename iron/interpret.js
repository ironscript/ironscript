import Parser from './parser.js';
import evalAsync from './evalAsync.js';
import {nextTick} from 'async-es';
import globalenv from './globalenv.js';

export function _eval (err, env, cb, src, name) {
  if (!name) name = 'unnamed';
  let p = new Parser ({name: name, buffer: src});
  nextTick (evalAsync, p.parse(), globalenv(), (err, _env, _cb, val) => {
    if (cb) nextTick (cb, err, env, null, _env);
  });
}

export function interpretSync (src, name, env) {
  if (!name) name = 'unnamed';
  let p = new Parser ({name: name, buffer: src});
  nextTick (evalAsync, p.parse(), env);
}

