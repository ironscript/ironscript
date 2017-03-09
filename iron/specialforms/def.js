import Cell from '../cell.js';
import Env from '../env.js';
import IronSymbol from '../symbol.js';
import IError from '../errors.js';
import {mapLimit} from 'async-es';
import {Reference} from '../collection.js';
import {default as evalAsync, cellToArr} from '../evalAsync.js';

const _dot = new IronSymbol ('_dot');

export default function def (name, val, env, cb) {
	if (!env.syncLock) cb( 'can _def/_let only inside a _begin/_sync block');
	if (name instanceof IronSymbol && name.startsWith('@')) name = env.get(name);

	if (name instanceof Cell && _dot.equal(name.car)) {
		name.ctx = 'set';
		evalAsync( name, env, (err, _env, _, ref) => {
			evalAsync( val, env, (err, _env, _, value) => {
				cb( err, env, null, ref(value) );
			});
		});
	}

	else if (name instanceof Cell) {
		evalAsync (val, env, (err, _env, _, value) => {
			if (value instanceof Cell) {
				cellToArr (value, [], env, (err, _env, _, args) => {
					let evalArg = (arg, _cb) => {
						evalAsync( arg, env, (err, env, _, argval) => {
							_cb( err, argval);
						});
					};
			
					mapLimit (args, 32, evalArg, (err, argvals) => {
						let names = name;
						let arglist = Cell.list(argvals);
						while (names instanceof Cell) {
							def (names.car, arglist.car, env, (err) => {
								if (err) cb (err);
							});
							names = names.cdr;
							arglist = arglist.cdr;
						}
						if (names !== null) def (names, arglist, env, (err) => {
							if (err) cb (err);
						});
						
						cb (null, env, null, value);
					});
				});
			}
			else cb ('LValue : '+Cell.stringify(name)+' RValue : '+ Cell.stringify(value)+' <Expected a List as the RValue>');
		});
	}
	else if (name instanceof IronSymbol) {
		evalAsync( val, env, (err, _env, _, value) => {
			let sts = env.bind(name, value);
			if (!sts) cb( 'can _def/_let only inside a _begin/_sync block');
			else cb( null, env, null, value);
		});
	}
	else cb( ""+Cell.stringify(name)+"is not a valid LValue, Symbols, List of Symbols and References are the only valid LValues");
}
