import Node from './node.js';

export default class Program extends Node {
	constructor (body) {
		super ('program');
		this.body = body;
	}

	static isProgram (obj) {
		return Node.isNode (obj) && obj.type === 'program';
	}
}
