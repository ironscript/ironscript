import Node from './node.js';

export default class Expression extends Node {
	constructor (type) {
		super (type);
	}

	static isExpression (obj) {
		return obj instanceof Expression;
	}
}
