'use strict';

class DieResult {
	constructor(value, index){
		this._value = value;
		this._index = index;
		this.exploded = false;
		this.rerolled = false;
		this.dropped = false;
	}

	get value(){
		return this._value;
	}

	get index(){
		return this._index;
	}

	addValue(moreValue){
		this._value += moreValue;
	}

	toString(){
		return '[' + this._value + ']';
	}
}

module.exports = DieResult;
