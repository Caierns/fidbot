'use strict';

class NumberRange {
	constructor(){
		this._greaterThan = Infinity;
		this._lessThan = -Infinity;
		this._specificEquality = {};
	}

	addSpecificEquality(value){
		this._specificEquality[value] = true;
	}

	removeSpecificEquality(value){
		this._specificEquality[value] = false;
	}

	addGreaterThan(value){
		this._greaterThan = Math.min(value, this._greaterThan);
	}

	setGreaterThan(value){
		this._greaterThan = value;
	}

	addLessThan(value){
		this._lessThan = Math.max(value, this._lessThan);
	}

	setLessThan(value){
		this._lessThan = value;
	}

	isInRange(number){
		if (number >= this._greaterThan) {
			return true;
		}
		if (number <= this._lessThan) {
			return true;
		}
		return !!this._specificEquality[number];
	}
}

module.exports = NumberRange;
