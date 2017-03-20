export default class Node {
	constructor (type) {
		this._isNode = true;
		this.type = type;
		this.loc = null;
	}

	static isNode (obj) {
		return obj._isNode === true;
	}
}
