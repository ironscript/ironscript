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


import IronSymbol from './symbol.js';
import Cell from './cell.js';
import IError from './errors.js';
import Env from './env.js';
//import {inspect} from 'util';

const _ANY = new IronSymbol('__internal (any)');

class RhoState {
  constructor () {
    this.table = new Map();
    this.finalPointer = null;
  }

  accept (sym, varvec) {
    if (sym instanceof Cell) 
      return new IError ('[RHO INTERNAL] Expected an atomic value; got a LIST: '+sym);
    
    let s = sym;
    if (sym.startsWith('@')) {
      varvec.push(sym);
      s = _ANY;
    }
    if (!(this.table.has(s.symbol))) this.table.set(s.symbol, new RhoState());
    //console.log(this.table.get(s.symbol));
    return this.table.get(s.symbol);
  }

  find (sym, varvec) {
    if (this.table.has(sym.symbol)) return this.table.get(sym.symbol);
    else if (this.table.has(_ANY.symbol)) {
      varvec.push(sym);
      //console.log ('\n\n\nvarvec -----', varvec);
      return this.table.get(_ANY.symbol);
    }
    else return null;
  }

  makeFinal (num) {
    this.finalPointer = num;
  }
}

class Resolution {
  constructor (params, body) {
    this.params = params;
    this.body = body;
  }
}

class Reduced {
  constructor (body, params, args) {
    this.body = body;
    this.params = params
    this.args = args;
  }
}

export default class Rho {
  constructor (par) {
    this.initialState = new RhoState();
    this.resolutionVector = [];
    this.size = 0;
    this.env = par;
  }

  accept (pattern, resolutionBody) {
    if (! this.env.syncLock ) 
      return new IError ('[RHO INTERNAL] can define rewrite rules only inside a _sync block');
    let varvec = [];
    let state = this.initialState;
    let pcell = pattern;
    //console.log ('\n\n\ndebug-rho-pattern: \n-------\n', inspect(pattern));
    while (pcell instanceof Cell) {
      //console.log ('\n\n\ndebug: \n-------\n', inspect(state));
      state = state.accept(pcell.car, varvec);
      if (state instanceof IError) return state;
      pcell = pcell.cdr;
    }
   

    //console.log('debug: ',varvec);
    this.resolutionVector.push (new Resolution (varvec, resolutionBody));
    state.makeFinal (this.size);
    this.size++;
    return true;
  }

  find (cell) {
    let state = this.initialState;
    let acell = cell;
    let varvec = [];

    while (acell instanceof Cell) {
      state = state.find (acell.car, varvec); 
       if (state === null) break;
       acell = acell.cdr;
    }
    if (state === null || state.finalPointer === null) {
      varvec = [];
      if (this.env.par !== null) {
        //console.log ('\n\nSEARCHING PARENT ... ... ...\n\n');
        //console.log ('\n\n\nvarvec ==== ', varvec);
        let r = this.env.par.rho.find (cell);
        //console.log ('\n\n\nvarvec ===== ', varvec);
        return r;
      }
      else return [null, []];
    }
    //console.log (inspect (this.resolutionVector [state.finalPointer]));
    //console.log ('\n\n\nvarvec ******* ', varvec);
    return [this.resolutionVector [state.finalPointer], varvec];
  }
      


  reduce (cell, env) {
    let res, varvec;
    //console.log ('\n\n\n#############################\n\n\n', varvec);
    let r = this.find(cell);
    //console.log(r);
    res = r[0];
    if (res === null) return null;

    varvec = r[1];
    let args = [];
    let argStrs = [];
    for (let v of varvec) {
      if (v instanceof IronSymbol) {
        args.push(env.get(v));
        argStrs.push(v.symbol);
      }
      else {
        args.push(v);
        argStrs.push(''+v);
      }
    }

    let paramsList = [];
    let argsList = [];
    for (let s of res.params) {
      if (s.startsWith('@')) {
        paramsList.push(s);
        argsList.push(args.shift());
        paramsList.push(new IronSymbol('@#' + s.symbol.slice(1)));
        argsList.push(argStrs.shift());
      }
    }


    //console.log ('\n\n\ndebug: \n----------\n\n\n', inspect(res), '\n\n\n', inspect(cell), '\n\n\n', varvec, '\n\n\n', inspect(env));
    //let scope = new Env (Cell.list(res.params), Cell.list(args), env);
    //console.log('debug: \n' +inspect(scope));
    return new Reduced (res.body, paramsList, argsList);
  }
}



