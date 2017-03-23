import Node from './node.js';

export default class Literal extends Node {
	constructor (value) {
		super ('literal');
		this.valueType = typeof value;
		this.value = value;
	}

	static isLiteral (obj) {
		return Node.isNode(obj) && obj.type === 'literal';
	}
}
