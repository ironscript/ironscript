import Node from './node.js';

export default class IronFunction extends Node {
	constructor (params, body) {
		super ('iron-function');
		this.params = params;
		this.body = body;
	}

	static isProgram (obj) {
		return Node.isNode (obj) && obj.type === 'iron-function';
	}
}
