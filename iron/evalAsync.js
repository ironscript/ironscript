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

const _if = new IronSymbol ('_if');
const _def = new IronSymbol ('_def');
const _let = new IronSymbol ('_let');
const _assign_unsafe = new IronSymbol ('_assign!');
const _fn = new IronSymbol ('_fn');
const _begin = new IronSymbol ('_begin');
const _sync = new IronSymbol ('_sync');
const _rho = new IronSymbol ('_rho');

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

export default function evalAsync (x, env, cb=defaultCallback ) {
  if (x instanceof IronSymbol) {
    if (_self.equal(x)) nextTick (cb, null, env, null, env);
    else if (_this.equal(x)) nextTick (cb, null, env, null, env.collection);
    else if (_null_.equal(x)) nextTick (cb, null, env, null, null);
    else nextTick (cb, null, env, null, env.get(x));
  }
  else if (!(x instanceof Cell)) nextTick (cb, null, env, null, x);
  else if (_quote.equal(x.car)) nextTick (cb, null, env, null, x.cdr.car);
  else if (_cons.equal(x.car)) {
    let car = x.cdr.car;
    let cdr = x.cdr.cdr.car;
    nextTick (evalAsync, car, env, (err, env, _, car) => {
      nextTick (evalAsync, cdr, env, (err, env, _, cdr) => {
        let list = Cell.cons(car, cdr);
          nextTick (cb, null, env, null, list);
      });
    });
  }
  else if (_car.equal(x.car) || _cdr.equal(x.car)) {
    nextTick(evalAsync, x.cdr.car, env, (err, env, _, list) => {
      if (list instanceof Cell) {
        if (_car.equal(x.car)) nextTick (cb, null, env, null, list.car);
        if (_cdr.equal(x.car)) nextTick (cb, null, env, null, list.cdr);
      }
      else nextTick (cb, null, env, null, null);
    });
  }
  else if (_seq.equal(x.car)) {
    let args = [];
    while (x.cdr instanceof Cell) {
      x = x.cdr;
      args.push (x.car);
    }
    
    let evalArg = (arg, _cb) => {
      nextTick(evalAsync, arg, env, (err, env, _, argval) => {
        nextTick (_cb, err, argval);
      });
    };
    
    mapLimit (args, 32, evalArg, (err, argvals) => {
      //console.log(argvals);
      nextTick (cb, err, env, null, new Sequence (argvals) );
    });
  }
  else if (_map.equal(x.car) || _filter.equal(x.car)) {
    let _seqn = x.cdr.car;
    let _func = x.cdr.cdr.car;
    nextTick (evalAsync, _seqn, env, (err, _env, _, seq) => {
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
        nextTick (evalAsync, _func, env, (err, _env, _, func) => {
          //console.log('here  '+Cell.stringify(_func));
          if (func instanceof Function) {
            let cbfn = (arg, _cb) => {
              //console.log(arg);
              nextTick (func, null, env, (err, _env, _, val) => {nextTick(_cb, err, val);}, arg.val, arg.index);
            }
            if (_map.equal(x.car))
              mapLimit (arr, 32, cbfn, (err, newarr) => {
                if (seq.__itype__==='sequence') nextTick (cb, err, env, null, new Sequence(newarr));
                else nextTick (cb, err, env, null, newarr);
              });
            else 
              filterLimit (arr, 32, cbfn, (err, newarr) => {
                let retarr = [];
                for (let it of newarr) retarr.push(it.val);
                if (seq.__itype__==='sequence') nextTick (cb, err, env, null, new Sequence(retarr));
                else nextTick (cb, err, env, null, retarr);
              });
          }
          else nextTick (cb, Cell.stringify(_func)+' is not a Function');
        });
      }
      else nextTick (cb, Cell.stringify(_seqn)+' is not an Array or Sequence');
    });
  }
  else if (_dot.equal(x.car)) {
    let args = [];
    let cmd = x.ctx;
    if (x.ctx === null) cmd = 'get';

    //console.log('### Ref: '+x.ctx+' '+Cell.stringify(x));

    while (x.cdr instanceof Cell) {
      x = x.cdr;
      args.push (x.car);
    }
    
    let evalArg = (arg, _cb) => {
      nextTick(evalAsync, arg, env, (err, env, _, argval) => {
        nextTick (_cb, err, argval);
      });
    };
    
    mapLimit (args, 32, evalArg, (err, argvals) => {
      //console.log(argvals);
      let ref = new Reference (cmd, ...argvals);
      //console.log('### Return of Ref: '+ref.value);
      nextTick (cb, err, env, null, ref.value);
    });
  }

  else if (_if.equal(x.car)) {
    let test = x.cdr.car;
    let then = x.cdr.cdr.car;
    let othr = x.cdr.cdr.cdr.car;
    //console.log ('\n\n\n\ndebug: \n*********', inspect(test), inspect(then), inspect(othr), '\n\n');
    nextTick (evalAsync, test, env, (err, env, _, res) => {
      let expr = res ? then : othr;
      nextTick (evalAsync, expr, env, cb);
    });
  }
  else if (_def.equal(x.car) || _let.equal(x.car)) {
    let name = x.cdr.car;
    let val = x.cdr.cdr.car;
    if (name instanceof IronSymbol) {
      nextTick (evalAsync, val, env, (err, _env, _, value) => {
        let sts = env.bind(name, value);
        if (!sts) nextTick (cb, 'can _def only inside a _begin block');
        else nextTick (cb, null, env, null, value);
      });
    }
    else if (name instanceof Cell && _dot.equal(name.car)) {
      name.ctx = 'set';
      //console.log(Cell.stringify(name));
      nextTick (evalAsync, name, env, (err, _env, _, ref) => {
        nextTick (evalAsync, val, env, (err, _env, _, value) => {
          //console.log(Cell.stringify(ref));
          nextTick (cb, err, env, null, ref(value) );
        });
      });
    }
    else nextTick (cb, ""+Cell.stringify(name)+"is not a valid LValue, Symbols and References are the only valid LValues");
  }
  else if (_assign_unsafe.equal(x.car)) {
    let name = x.cdr.car;
    let val = x.cdr.cdr.car;
    nextTick (evalAsync, val, env, (err, _env, _, value) => {
      let sts = env.find(name).bind(name, value);
      if (!sts) nextTick (cb, 'can _def only inside a _begin block');
      else nextTick (cb, null, env, null, value);
    });
  }
  else if (_push.equal(x.car)) {
    let arr = x.cdr.car;
    let val = x.cdr.cdr.car;

    nextTick (evalAsync, arr, env, (_err, _env, _cb, _arr) => {
      nextTick (evalAsync, val, env, (_err, _env, _cb, _val) => {
        let arr = _arr;
        let val = _val;

        if (arr instanceof Array || (arr instanceof Object && (arr.__itype__ === 'sequence' || arr.__itype__ === 'stream') ) ) {
          arr.push(val);
          nextTick (cb, null, env, null, arr);
        }
        else nextTick (cb, new IError ('Can _push to Arrays, Sequences and Streams'));
      });
    });
  }
  else if (_fn.equal(x.car)) {
    let params = x.cdr.car;
    let body = x.cdr.cdr.car;
    nextTick (cb, null, env, null, fn (params, body, env) );
  }
  else if (_rho.equal(x.car)) {
    let pattern = x.cdr.car;
    let resolution = x.cdr.cdr.car;
    nextTick (evalAsync, pattern, env, (err, _env, _, val) => {
      //console.log('debug-pattern: ', inspect(val));
      let sts = env.rho.accept(val, resolution);
      //console.log ('\n\n\n\ndebug: ', inspect(env), '\n\n');
      if (sts instanceof IError) nextTick (cb, sts);
      else nextTick (cb, null, env, null, env);
    });
  }
  else if (_begin.equal(x.car) || _sync.equal(x.car) || _coll.equal(x.car)) {
    let root = x.cdr;
    let cur = root;
    let isColl = _coll.equal(x.car);
    
    let _env = env;
    if (_begin.equal(x.car)) _env = new Env(null, null, env);
    else if (_coll.equal(x.car)) _env = new Env(null, null, env, true);
    else _env = env;

    let unsyncFlag = false;
    if (!_env.syncLock) {
      unsyncFlag = true;
      _env.sync();
    }
    whilst (
      () => { return x.cdr instanceof Cell; },
      (callback) => {
        x = x.cdr;
        nextTick (evalAsync, x.car, _env, (err, __env, _, argval) => {
          nextTick (callback, err, argval);
        });
      },

      (err, res) => {
        //if(isColl)console.log(_env.collection.obj);
        if (unsyncFlag) _env.unsync();
        if (isColl) nextTick (cb, err, env, null, _env.collection.obj);
        else nextTick (cb, err, _env, null, res);
      }
    );
  }
  else if (_stream.equal(x.car)) {
    let func = x.cdr.car;
    let args = x.cdr.cdr;

    //let argvals = [];
    let arglist = [];
    //let argflags = [];
    //let argcount = 0;
    while (args instanceof Cell) {
      //argvals.push (null);
      //argflags.push(false);
      arglist.push (args.car);
      args = args.cdr;
    }
    //argcount = argflags.length;

    nextTick (evalAsync, func, env, (err, _env, _, func) => {
      
      let corefn = (updatefn) => {
        let argvals = Array(arglist.length);
        let argflags = [];
        let argcount = arglist.length;
        for (let i=0; i<arglist.length; i++) {
          argflags.push(false);
          nextTick (evalAsync, arglist[i], env, (err, _env, _, argval) => {
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
            if (argcount === 0) nextTick (func, err, env, (err, _env, _cb, retval) => {
                nextTick (updatefn, retval);
              } , ...argvals);
          });
        }
      };
      
      nextTick(cb, err, env, null, new Stream(corefn, env) );

    });
  }
  else if (_on.equal(x.car)) {
    let controlStream = x.cdr.car;
    let expr = x.cdr.cdr.car;
    
    nextTick (evalAsync, controlStream, env, (err, _env, _, cs) => {
      let corefn = (updatefn) => {
        cs.addcb((err, _env, _cb, val) => {
          nextTick (evalAsync, expr, env, (err, _env, _, val) => {
            if (val !== null && val !== undefined)
              nextTick (updatefn, val);
          });
        });
      };
      let stream = new Stream (corefn, env);
      nextTick (cb, err, env, null, stream);
    });
  }
  else if (_pull.equal(x.car)) {
    let stream = x.cdr.car;
    nextTick (evalAsync, stream, env, (err, _env, _, s) => {
      if (s instanceof Object && s.__itype__==='stream')
        nextTick (cb, null, env, null, s.value);
      else if (s instanceof Array)
        nextTick (cb, null, env, null, s.shift());
      else if (s instanceof Object && s.__itype__ === 'sequence')
        nextTick (cb, null, env, null, s.pull());
      else nextTick (cb, new IError("can pull from Streams, Arrays and Sequences"));
    });
  }
  else if (_pop.equal(x.car)) {
    let arr = x.cdr.car;
    nextTick (evalAsync, arr, env, (err, _env, _, arr) => {
      if (arr instanceof Array || (arr instanceof Object && arr.__itype__ === 'sequence') )
        nextTick (cb, null, env, null, arr.pop());
      else nextTick (cb, new IError("can pop from Arrays and Sequences"));
    });
  }
  else if (_do.equal(x.car)) {
    let stream = x.cdr.car;
    nextTick (evalAsync, stream, env, (err, _env, _, streamObj) => {
      streamObj.addcb ((err) => { if(err) throw err;} );
    });
    nextTick (cb, null, env, null, null);
  }
  else if (_include.equal(x.car)) {
    let includefn = env.get(x.car);
    nextTick (evalAsync, x.cdr.car, env, (err, _env, _, sourcename) => {
      nextTick (includefn, err, env, cb, sourcename);
    });
  }
  else if (_import.equal(x.car)) {
    //console.log('\n\n\n',env,'\n\n\n');
    let importfn = env.get(x.car);
    nextTick (evalAsync, x.cdr.car, env, (err, _env, _, sourcename) => {
      let names = null;
      if (x.cdr.cdr) names = x.cdr.cdr.car;
      nextTick (evalAsync, names, env, (err, _env, _, namesList) => {
        nextTick (importfn, err, env, cb, sourcename, namesList);
      });
    });
  }
  else {
    nextTick (evalAsync, x.car, env, (err, env, _, func) => {
      //console.log (''+x.car +'\n\n'+inspect(func));
      //console.log("### debug ### "+Cell.stringify(func));
      
      if (func instanceof Object && func.__itype__ === "env") {
        //console.log ('__debug__\n\n ' + inspect(func));
        let acell = x.cdr;
        let _env = new Env (null, null, env);

        let reduced = func.rho.reduce (acell, _env);
        //console.log ('\n\n\n\ndebug: ', inspect(env), '\n\n');
        if (reduced === null) nextTick (cb, null, _env, null, null);
        else {
          //console.log (reduced);

          let args = reduced.args;
          let params = reduced.params;
          let body = reduced.body;
          
          mapLimit (args, 32, (arg, _cb) => {
            //console.log ('debug : ', arg);
            nextTick(evalAsync, arg, _env, (err, __env, _, argval) => {
              nextTick (_cb, err, argval);
            });
          },

          (err, argvals) => {
            let scope = new Env (Cell.list(params), Cell.list(argvals), _env);
            //console.log (Cell.stringify(body));
            //console.log (params, argvals);
            nextTick (evalAsync, body, scope, (err, _, __, val) => {
              //console.log('Debug ________: '+val);
              nextTick (cb, err, _env, null, val);
            });
          });

          //nextTick (evalAsync, reduced.body, reduced.env, (err, _, __, val) => {
            //nextTick (cb, err, env, null, val);
          //});
        }
      }
      
      else if (func instanceof Object && func.__itype__ === 'stream') {
        func.addcb(cb)
        nextTick (cb, err, env, null, func.value);
      }

      else if (func instanceof Function) {
        let args = [];
        while (x.cdr instanceof Cell) {
          x = x.cdr;
          args.push (x.car);
        }
        
        let evalArg = (arg, _cb) => {
          nextTick(evalAsync, arg, env, (err, env, _, argval) => {
            nextTick (_cb, err, argval);
          });
        };
        
        mapLimit (args, 32, evalArg, (err, argvals) => {
          //console.log ('\n\n\n\ndebug: ', argvals, '\n', env, '\n\n');
          let _env = new Env (null, null, env);
          nextTick (func, err, _env, cb, ...argvals);
        });

      }
      else {
        nextTick (cb, new IError ('can not evaluate list '+Cell.stringify(x)));
      }
    });
  }

}

