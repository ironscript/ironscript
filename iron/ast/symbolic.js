import Node from './node.js';

export default class Symbolic extends Node {
	constructor (name) {
		super ('symbolic');
		this.name = name;
	}

	static isSymbolic (obj) {
		return Node.isNode(obj) && obj.type === 'symbolic';
	}
}
