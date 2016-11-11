import Env from './env.js';
import IronSymbol from './symbol.js';
import {fn, fx, fxSync} from './higher.js';
import {_eval} from './interpret.js';
import {nextTick} from 'async-es';
import Cell from './cell.js';

function echo (...args) {
  for (let arg of args) {
    if (arg instanceof Cell) console.log (Cell.printList(arg));
    else console.log (arg);
  }
}

export default function () {
  let _globalenv = new Env (null, null, null);
  _globalenv.sync();
  _globalenv.bind (new IronSymbol('_fx'), fx);
  _globalenv.bind (new IronSymbol('_eval'), _eval);
  _globalenv.bind (new IronSymbol('_echo'), fxSync(echo));

  function _new (cls, ...args) {
    return new cls (...args);
  }
  _globalenv.bind (new IronSymbol('_new'), fxSync(_new));
  
  _globalenv.unsync();
  return _globalenv;
}
