import Cell from './cell.js';
import ensure from './ensure.js';
import IronSymbol from './symbol.js';
import Rho from './rho.js';
import IError from './errors.js';
//import {inspect} from 'util';

export default class Env {
  constructor (param, arg, par) {
    this.__itype__ = "env";
    this.map = new Map();
    this.par = par; 
    this.syncLock = true;
    this.bind (param, arg);
    this.syncLock = false;
    this.rho = new Rho(this);
  }

  sync () {
    this.syncLock = true;
  }

  unsync () {
    this.syncLock = false;
  }

  bind (key, val) {
    if (!this.syncLock) return false;
    while (key instanceof Cell) {
      //console.log ('debug: ',inspect(key), inspect(val));
      ensure (val instanceof Cell, "can not bind a List to an Atom");
      this.bind (key.car, val.car);
      key = key.cdr;
      val = val.cdr;
    }
    if (key !== null) {
      ensure (key instanceof IronSymbol, ""+key+" is not an IronSymbol");
      let keystr = key.symbol;
      this.map.set (keystr, val);
    }
    return true;
  }

  find (key) {
    ensure (key instanceof IronSymbol, ""+key+" is not an IronSymbol");
    let keystr = key.symbol;
    if (this.map.has(keystr)) return this;
    return this.par.find(key);
  }

  get (key) {
    ensure (key instanceof IronSymbol, ""+key+" is not an IronSymbol");
    let ret;
    let keystr = key.symbol;
    if (this.map.has(keystr)) ret = this.map.get(keystr);
    else if (this.par !== null) ret = this.par.get(key);
    else ret = key;
    
    if (ret instanceof Function) return ret;
    else if (ret instanceof Object) return Object.assign({}, ret);
    return ret;
  }
}

