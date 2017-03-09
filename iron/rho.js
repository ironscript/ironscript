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

const _ANY = new IronSymbol('__internal (any)');
const _REST = new IronSymbol('__internal (rest)');

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
    return this.table.get(s.symbol);
  }

	captureRest (sym, varvec) {
		varvec.push(sym);
    if (!(this.table.has(_REST.symbol))) this.table.set(_REST.symbol, new RhoState());
    return this.table.get(_REST.symbol);
	}

		

  find (sym, varvec) {
    if (this.table.has(sym.symbol)) return this.table.get(sym.symbol);
    else if (this.table.has(_ANY.symbol)) {
      varvec.push(sym);
      return this.table.get(_ANY.symbol);
    }
    else if (this.table.has(_REST.symbol)) {
      varvec.push(_REST);
      return this.table.get(_REST.symbol);
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
    while (pcell instanceof Cell) {
      state = state.accept(pcell.car, varvec);
      if (state instanceof IError) return state;
      pcell = pcell.cdr;
    }

		if (pcell !== null) {
			if (pcell instanceof IronSymbol && pcell.startsWith('@')) 
				state = state.captureRest (pcell, varvec);
		}
   

    this.resolutionVector.push (new Resolution (varvec, resolutionBody));
    state.makeFinal (this.size);
    this.size++;
    return true;
  }

  find (cell, env) {
    let state = this.initialState;
    let acell = cell;
    let varvec = [];

    while (acell instanceof Cell) {
			let sym = acell.car;
			if (sym instanceof IronSymbol && sym.startsWith('@')) {
				sym = env.get(sym);
			}
    	state = state.find (sym, varvec); 
    	if (state === null) break;

			let cpt = varvec [varvec.length - 1];
			if (cpt instanceof IronSymbol && _REST.equal(cpt) ) {
				varvec [varvec.length - 1] = acell;
				break;
			}
    	acell = acell.cdr;
    }
    if (state === null || state.finalPointer === null) {
      varvec = [];
      if (this.env.par !== null) {
        let r = this.env.par.rho.find (cell, env);
        return r;
      }
      else return [null, []];
    }
    return [this.resolutionVector [state.finalPointer], varvec];
  }
      


  reduce (cell, env) {
    let r = this.find(cell, env);
    if (r[0] === null) return null;
		return Rho.reduce_internal (r[0].body, r[0].params, r[1], env);
	}
	
	static reduce_internal (body, params, varvec, env) {
		let args = [];
		let argStrs = [];
		for (let v of varvec) {
      if (v instanceof IronSymbol) {
        args.push(env.get(v));
        argStrs.push(v.symbol);
      }
      else if (v instanceof Cell) {
        args.push(v);
        argStrs.push(Cell.stringify(v));
      }
      else {
        args.push(v);
        argStrs.push(''+v);
      }
    }

    let paramsList = [];
    let argsList = [];
    for (let s of params) {
      if (s.startsWith('@')) {
        paramsList.push(s);
        argsList.push(args.shift());
        paramsList.push(new IronSymbol('@#' + s.symbol.slice(1)));
        argsList.push(argStrs.shift());
      }
    }

    let scope = new Env (Cell.list(paramsList), Cell.list(argsList), null);
		return Rho.rewrite (body, scope);
  }

	static rewriteCell (cell, scope) {
		if (cell instanceof Cell) {
			let c = new Cell (Rho.rewrite(cell.car, scope));
			c.cdr = Rho.rewrite (cell.cdr, scope);
			return c;
		}
		return cell;
	}

	static rewrite (body, scope) {
		if (body instanceof Cell) return Rho.rewriteCell (body, scope);
		else if (body instanceof IronSymbol) return scope.get (body);
		else return body;
	}
}



