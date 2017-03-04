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


import Cell from './cell.js';
import Env from './env.js';
import Stream from './stream.js';
import {fn} from './higher.js';
import IronSymbol from './symbol.js';
import IError from './errors.js';
import {nextTick, mapLimit, whilst, filterLimit} from 'async-es';


import {Reference, Collection, Sequence} from './collection.js';

//import {inspect} from 'util';

const _cons = new IronSymbol ('_cons');
const _car = new IronSymbol ('_car');
const _cdr = new IronSymbol ('_cdr');

const _quote = new IronSymbol ('_quote');
const _dot = new IronSymbol ('_dot');
const _eval = new IronSymbol('_');

const _if = new IronSymbol ('_if');
const _def = new IronSymbol ('_def');
const _let = new IronSymbol ('_let');
const _assign_unsafe = new IronSymbol ('_assign!');
const _set_unsafe = new IronSymbol ('_set!');

const _fn = new IronSymbol ('_fn');
const _fr = new IronSymbol ('_fr');

const _begin = new IronSymbol ('_begin');
const _sync = new IronSymbol ('_sync');
const _rho = new IronSymbol ('_rho');
const _try = new IronSymbol ('_try');

const _self = new IronSymbol ('_self'); 
const _this = new IronSymbol ('_this');
const _null_ = new IronSymbol('NIL'); 

const _coll = new IronSymbol ('_coll');
const _seq = new IronSymbol('_seq'); 

const _map = new IronSymbol('_map');
const _filter = new IronSymbol('_filter');

const _push = new IronSymbol('_push'); 
const _pull = new IronSymbol('_pull'); 
const _pop = new IronSymbol ('_pop');

const _stream = new IronSymbol('_stream'); 
const _do = new IronSymbol('_do'); 
const _on = new IronSymbol('_on'); 

const _include = new IronSymbol('_include'); 
const _import = new IronSymbol('_import'); 

const defaultCallback = (err, env) => {
  if (err) {
    if (err instanceof IError) err.log();
    throw err;
  }
  //console.log (env);
};

function cellToArr (cell, arr, env, cb) {
	while (cell instanceof Cell) {
		arr.push (cell.car);
		cell = cell.cdr;
	}
	if (cell !== null) {
		evalAsync (cell, env, (err, _env, _, val) => {
			if (val instanceof Cell) cellToArr (val, arr, env, cb);
			else {
				arr.push (val);
				cb (err, env, null, arr);
			}
		});
	}
	else cb(null, env, null, arr);
}




export default function evalAsync (x, env, cb=defaultCallback ) {
  if (x instanceof IronSymbol) {
    if (_self.equal(x)) cb (null, env, null, env);
    else if (_this.equal(x)) cb( null, env, null, env.collection);
    else if (_null_.equal(x)) cb( null, env, null, null);
    //else cb( null, env, null, env.get(x));
		else env.getAsync(x, cb);
  }

  else if (!(x instanceof Cell)) cb( null, env, null, x); 
	
	else cellToArr (x, [], env, (err, env, _, xarray) => {
		
		if (_quote.equal(xarray[0])) cb( null, env, null, xarray[1]);
		else if (_eval.equal(xarray[0])) {
			evalAsync (xarray[1], env, (err, env, _, y) => {
				if (err) cb (err);
				else evalAsync (y, env, cb);
			});
		}
		else if (_cons.equal(xarray[0])) {
			let car = xarray[1];
			let cdr = xarray[2];
			evalAsync( car, env, (err, env, _, car) => {
				evalAsync( cdr, env, (err, env, _, cdr) => {
					let list = Cell.cons(car, cdr);
						cb( null, env, null, list);
				});
			});
		}
		else if (_car.equal(xarray[0]) || _cdr.equal(xarray[0])) {
			evalAsync( xarray[1], env, (err, env, _, list) => {
				if (list instanceof Cell) {
					if (_car.equal(xarray[0])) cb( null, env, null, list.car);
					if (_cdr.equal(xarray[0])) cb( null, env, null, list.cdr);
				}
				else cb( null, env, null, null);
			});
		}
		else if (_seq.equal(xarray[0])) {
			let args = xarray.slice(1);
			//while (x.cdr instanceof Cell) {
				//x = x.cdr;
				//args.push (xarray[0]);
			//}
			
			//cellToArr (x.cdr, [], env, (err, env, _, args) => {
			let evalArg = (arg, _cb) => {
				evalAsync( arg, env, (err, env, _, argval) => {
					_cb( err, argval);
				});
			};
			
			mapLimit (args, 32, evalArg, (err, argvals) => {
				//console.log(argvals);
				cb( err, env, null, new Sequence (argvals) );
			});
			//});
		}
		else if (_map.equal(xarray[0]) || _filter.equal(xarray[0])) {
			let _seqn = xarray[1];
			let _func = xarray[2];
			evalAsync( _seqn, env, (err, _env, _, seq) => {
				//console.log(Array(seq));
				if (seq instanceof Array || seq.__itype__ === 'sequence') {
					let _arr = seq;
					if (seq.__itype__ === 'sequence') _arr = seq.arr;
					let arr = [];
					let i = 0;
					for (let it of  _arr) {
						arr.push({index:i, val:it});
						i++;
					}
					evalAsync( _func, env, (err, _env, _, func) => {
						//console.log('here  '+Cell.stringify(_func));
						if (func instanceof Function) {
							let cbfn = (arg, _cb) => {
								//console.log(arg);
								func( null, env, (err, _env, _, val) => {_cb(err, val);}, arg.val, arg.index);
							}
							if (_map.equal(xarray[0]))
								mapLimit (arr, 32, cbfn, (err, newarr) => {
									if (seq.__itype__==='sequence') cb( err, env, null, new Sequence(newarr));
									else cb( err, env, null, newarr);
								});
							else 
								filterLimit (arr, 32, cbfn, (err, newarr) => {
									let retarr = [];
									for (let it of newarr) retarr.push(it.val);
									if (seq.__itype__==='sequence') cb( err, env, null, new Sequence(retarr));
									else cb( err, env, null, retarr);
								});
						}
						else cb( Cell.stringify(_func)+' is not a Function');
					});
				}
				else cb( Cell.stringify(_seqn)+' is not an Array or Sequence');
			});
		}
		else if (_dot.equal(xarray[0])) {
			let args = xarray.slice(1);
			let cmd = x.ctx;
			if (x.ctx === null) cmd = 'get';

			//console.log('### Ref: '+x.ctx+' '+Cell.stringify(x));

			//while (x.cdr instanceof Cell) {
				//x = x.cdr;
				//args.push (xarray[0]);
			//}
			
			//cellToArr (x.cdr, [], env, (err, env, _, args) => {
			let evalArg = (arg, _cb) => {
				evalAsync( arg, env, (err, env, _, argval) => {
					_cb( err, argval);
				});
			};
			
			mapLimit (args, 32, evalArg, (err, argvals) => {
				//console.log(argvals);
				let ref = new Reference (cmd, ...argvals);
				//console.log('### Return of Ref: '+ref.value);
				cb( err, env, null, ref.value);
			});
			//});	
		}

		else if (_if.equal(xarray[0])) {
			let test = xarray[1];
			let then = xarray[2];
			let othr = xarray[3];
			//console.log ('\n\n\n\ndebug: \n*********', inspect(test), inspect(then), inspect(othr), '\n\n');
			evalAsync( test, env, (err, env, _, res) => {
				let expr = res ? then : othr;
				evalAsync( expr, env, cb);
			});
		}
		else if (_try.equal(xarray[0])) {
			let expr = xarray[1];
			let onerror = xarray[2];
			evalAsync( expr, env, (err, env, _, res) => { 
				if (err) evalAsync (onerror, env, cb);
				else cb(null, env, null, res);
			});
		}
		else if (_def.equal(xarray[0]) || _let.equal(xarray[0])) {
			let name = xarray[1];
			let val = xarray[2];
			if (name instanceof IronSymbol) {
				evalAsync( val, env, (err, _env, _, value) => {
					let sts = env.bind(name, value);
					if (!sts) cb( 'can _def only inside a _begin block');
					else cb( null, env, null, value);
				});
			}
			else if (name instanceof Cell && _dot.equal(name.car)) {
				name.ctx = 'set';
				//console.log(Cell.stringify(name));
				evalAsync( name, env, (err, _env, _, ref) => {
					evalAsync( val, env, (err, _env, _, value) => {
						//console.log(Cell.stringify(ref));
						cb( err, env, null, ref(value) );
					});
				});
			}
			else cb( ""+Cell.stringify(name)+"is not a valid LValue, Symbols and References are the only valid LValues");
		}
		else if (_assign_unsafe.equal(xarray[0]) || _set_unsafe.equal(xarray[0])) {
			let name = xarray[1];
			let val = xarray[2];
			evalAsync( val, env, (err, _env, _, value) => {
				let sts = env.find(name).bind(name, value);
				if (!sts) cb( 'can _def only inside a _begin block');
				else cb( null, env, null, value);
			});
		}
		else if (_push.equal(xarray[0])) {
			let arr = xarray[1];
			let val = xarray[2];

			evalAsync( arr, env, (_err, _env, _cb, _arr) => {
				evalAsync( val, env, (_err, _env, _cb, _val) => {
					let arr = _arr;
					let val = _val;

					if (arr instanceof Array || (arr instanceof Object && (arr.__itype__ === 'sequence' || arr.__itype__ === 'stream') ) ) {
						arr.push(val);
						cb( null, env, null, arr);
					}
					else cb( new IError ('Can _push to Arrays, Sequences and Streams'));
				});
			});
		}
		else if (_fn.equal(xarray[0]) || _fr.equal(xarray[0])) {
			let params = xarray[1];
			let body = xarray[2];
			if (_fr.equal(xarray[0])) cb (null, env, null, {__itype__:'specialform', func: fn(params, body, env)});
			else cb( null, env, null, fn (params, body, env) );
		}
		else if (_rho.equal(xarray[0])) {
			let pattern = xarray[1];
			let resolution = xarray[2];
			evalAsync( pattern, env, (err, _env, _, val) => {
				//console.log('debug-pattern: ', inspect(val));
				//evalAsync (resolution, env, (err, _env, _, resolution) => {
					let sts = env.rho.accept(val, resolution);
					//console.log ('\n\n\n\ndebug: ', inspect(env), '\n\n');
					if (sts instanceof IError) cb( sts);
					else cb( null, env, null, env);
				//});
			});
		}
		else if (_begin.equal(xarray[0]) || _sync.equal(xarray[0]) || _coll.equal(xarray[0])) {
			let root = x.cdr;
			let cur = root;
			let isColl = _coll.equal(xarray[0]);
			
			let _env = env;
			if (_begin.equal(xarray[0])) _env = new Env(null, null, env);
			else if (_coll.equal(xarray[0])) _env = new Env(null, null, env, true);
			else _env = env;

			let unsyncFlag = false;
			if (!_env.syncLock) {
				unsyncFlag = true;
				_env.sync();
			}
			//cellToArr (x.cdr, [], _env, (err, _env, _, args) => {
			let args = xarray.slice(1);
			let i = 0;
			whilst (
				//() => { return x.cdr instanceof Cell; },
				() => { return i<args.length; },
				(callback) => {
					//x = x.cdr;
					evalAsync( args[i], _env, (err, __env, _, argval) => {
						i += 1;
						nextTick (callback, err, argval);
					});
				},

				(err, res) => {
					//if(isColl)console.log(_env.collection.obj);
					if (unsyncFlag) _env.unsync();
					if (isColl) cb( err, env, null, _env.collection.obj);
					else cb( err, _env, null, res);
				}
			);
			//});
		}
		else if (_stream.equal(xarray[0])) {
			let func = xarray[1];
			let arglist = xarray.slice(2);

			//let arglist = [];
			//while (args instanceof Cell) {
				//arglist.push (args.car);
				//args = args.cdr;
			//}
			
			//cellToArr (args, [], env, (err, env, _, arglist) => {

				evalAsync( func, env, (err, _env, _, func) => {
			 
				let corefn = (updatefn) => {
					let argvals = Array(arglist.length);
					let argflags = [];
					let argcount = arglist.length;
					for (let i=0; i<arglist.length; i++) {
						argflags.push(false);
						evalAsync( arglist[i], env, (err, _env, _, argval) => {
							argvals[i] = argval;
							if (argval !== null && argval !== undefined) {
								//debugger;
								if (!argflags[i]) {
									argflags[i] = true;
									argcount--;
								}
							}
							else {
								if (argflags[i]) {
									argflags[i] = false;
									argcount++;
								}
							}
							if (argcount === 0) func (err, env, (err, _env, _cb, retval) => {
									updatefn(retval);
								} , ...argvals);
						});
					}
				};
				
				cb (err, env, null, new Stream(corefn, env) );

			});
			//});
		}
		else if (_on.equal(xarray[0])) {
			let controlStream = xarray[1];
			let expr = xarray[2];
			
			evalAsync( controlStream, env, (err, _env, _, cs) => {
				let corefn = (updatefn) => {
					cs.addcb((err, _env, _cb, val) => {
						evalAsync( expr, env, (err, _env, _, val) => {
							if (val !== null && val !== undefined)
								updatefn (val);
						});
					});
				};
				let stream = new Stream (corefn, env);
				cb( err, env, null, stream);
			});
		}
		else if (_pull.equal(xarray[0])) {
			let stream = xarray[1];
			evalAsync( stream, env, (err, _env, _, s) => {
				if (s instanceof Object && s.__itype__==='stream')
					cb( null, env, null, s.value);
				else if (s instanceof Array)
					cb( null, env, null, s.shift());
				else if (s instanceof Object && s.__itype__ === 'sequence')
					cb( null, env, null, s.pull());
				else cb( new IError("can pull from Streams, Arrays and Sequences"));
			});
		}
		else if (_pop.equal(xarray[0])) {
			let arr = xarray[1];
			evalAsync( arr, env, (err, _env, _, arr) => {
				if (arr instanceof Array || (arr instanceof Object && arr.__itype__ === 'sequence') )
					cb( null, env, null, arr.pop());
				else cb( new IError("can pop from Arrays and Sequences"));
			});
		}
		else if (_do.equal(xarray[0])) {
			let stream = xarray[1];
			evalAsync( stream, env, (err, _env, _, streamObj) => {
				streamObj.addcb ((err) => { if(err) throw err;} );
			});
			cb( null, env, null, null);
		}
		else if (_include.equal(xarray[0])) {
			let includefn = env.get(xarray[0]);
			evalAsync( xarray[1], env, (err, _env, _, sourcename) => {
				nextTick (includefn, err, env, cb, sourcename);
			});
		}
		else if (_import.equal(xarray[0])) {
			//console.log('\n\n\n',env,'\n\n\n');
			let importfn = env.get(xarray[0]);
			evalAsync( xarray[1], env, (err, _env, _, sourcename) => {
				let names = null;
				if (x.cdr.cdr) names = xarray[2];
				evalAsync( names, env, (err, _env, _, namesList) => {
					nextTick (importfn, err, env, cb, sourcename, namesList);
				});
			});
		}
		else {
			evalAsync( xarray[0], env, (err, env, _, func) => {
				//console.log (''+xarray[0] +'\n\n'+inspect(func));
				//console.log("### debug ### "+Cell.stringify(func));
				
				if (func instanceof Object && func.__itype__ === "env") {
					//console.log ('__debug__\n\n ' + inspect(func));
					let acell = x.cdr;
					let _env = new Env (null, null, env);

					let reduced = func.rho.reduce (acell, _env);
					//console.log ('\n\n\n\ndebug: ', inspect(env), '\n\n');
					if (reduced === null) cb( null, _env, null, null);
					else {
						//console.log (reduced);

						let args = reduced.args;
						let params = reduced.params;
						let body = reduced.body;
						
						let scope = new Env (Cell.list(params), Cell.list(args), _env);
						let cache = Object.create(null);
						scope.getAsync = (x, _cb) => {
							if (cache[x.symbol]) _cb (null, scope, null, cache[x.symbol]);
							else if (scope.map.has (x.symbol)) {
								evalAsync (scope.map.get(x.symbol), scope, (err, _env, _, val) => {
									cache[x.symbol] = val;
									_cb (null, scope, null, val);
								});
							}
							else _cb (null, scope, null, scope.get(x));
						}

						evalAsync (body, scope, cb);
					}
					/*  
						mapLimit (args, 32, (arg, _cb) => {
							//console.log ('debug : ', arg);
							evalAsync( arg, _env, (err, __env, _, argval) => {
								_cb( err, argval);
							});
						},

						(err, argvals) => {
							let scope = new Env (Cell.list(params), Cell.list(argvals), _env);
							//console.log (Cell.stringify(body));
							//console.log (params, argvals);
							evalAsync( body, scope, (err, _, __, val) => {
								//console.log('Debug ________: '+val);
								cb( err, _env, null, val);
							});
						});

						//evalAsync( reduced.body, reduced.env, (err, _, __, val) => {
							//cb( err, env, null, val);
						//});
					}
					*/
				}
				
				else if (func instanceof Object && func.__itype__ === 'stream') {
					func.addcb(cb)
					cb( err, env, null, func.value);
				}
				
				else if (func instanceof Object && func.__itype__ === 'specialform') {
					func = func.func;
					let args = xarray.slice(1);
					//while (x.cdr instanceof Cell) {
						//x = x.cdr;
						//args.push (xarray[0]);
					//}
					//cellToArr (x.cdr, [], env, (err, env, _, args) => {
					let _env = new Env (null, null, env);
					func (null, _env, cb, ...args);
					//});
				}

				else if (func instanceof Function) {
					let args = xarray.slice(1);
					//while (x.cdr instanceof Cell) {
						//x = x.cdr;
						//args.push (xarray[0]);
					//}
					//cellToArr (x.cdr, [], env, (err, env, _, args) => {
					let evalArg = (arg, _cb) => {
						evalAsync( arg, env, (err, env, _, argval) => {
							_cb( err, argval);
						});
					};
					
					mapLimit (args, 32, evalArg, (err, argvals) => {
						//console.log ('\n\n\n\ndebug: ', argvals, '\n', env, '\n\n');
						let _env = new Env (null, null, env);
						func (err, _env, cb, ...argvals);
					});
					//});
				}
				else {
					//cb (new IError ('can not evaluate list '+Cell.stringify(x)), env, null, x);
					cb (null, env, null, Cell.list(xarray));
				}
			});
		}
	});
}

