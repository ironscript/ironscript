import Env from './env.js';
import Cell from './cell.js';
import evalAsync from './evalAsync.js';
import {nextTick} from 'async-es';

export function fn (params, body, env) {
  return function ( err, _env, cb, ...args ) {
    if (err) cb (err);
    //console.log (body ,'\n\n\n' ,params,'\n\n\n',args,'\n\n\n');
    //console.log ('\n\n\n\ndebug: \n----------------------------', new Env(params, Cell.list(args),env), '\n\n');
    nextTick (evalAsync, body, new Env(params, Cell.list(args), env), cb);
  };
}

export function fx (err, env, cb, f) {
  if (err) cb (err);
  nextTick (cb, null, env, null, ( err, _env, _cb,  ...args) => {
    let val = f(...args);
    nextTick (_cb, null, _env, null, val);
  });
}

export function fxSync (f) {
  return (err, _env, _cb, ...args) => {
    let val = f(...args);
    nextTick (_cb, null, _env, null, val);
  };
}

export function fxAsync (f) { // f = ($return, $throw, $catch, $env, ...args) => {}
  return (err, _env, _cb, ...args) => {
    let exited = false;
    let $return = (retval) => {
      if (!exited) {
        nextTick (_cb, null, _env, null, retval);
        exited = true;
      }
    }

    let $throw = (_err) => {
      if (!exited) {
        nextTick (_cb, _err, _env, null, null);
        exited = true;
      }
    }

    let $catch = (_errclass, catchFn) => {
      if (err instanceof _errclass) 
        catchFn();
    }

    let $yield = (retval) => {
      nextTick (_cb, null, _env, null, retval);
    }

    nextTick (f, $return, $throw, $catch, $yield, _env, ...args);
  }
}
