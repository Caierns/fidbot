'use strict';

class NumberRange {
	constructor(){
		this._lowerBound = Infinity;
		this._upperBound = -Infinity;
		this._specificEquality = {};
	}

	addSpecificEquality(value){
		this._specificEquality[value] = true;
	}

	removeSpecificEquality(value){
		this._specificEquality[value] = false;
	}

	addLowerBound(value){
		this._lowerBound = Math.min(value, this._lowerBound);
	}

	setLowerBound(value){
		this._lowerBound = value;
	}

	addUpperBound(value){
		this._upperBound = Math.max(value, this._upperBound);
	}

	setUpperBound(value){
		this._upperBound = value;
	}

	isInRange(number){
		if (number >= this._lowerBound) {
			return true;
		}
		if (number <= this._upperBound) {
			return true;
		}
		return !!this._specificEquality[number];
	}

	countIntegersInRange(lowerBound, upperBound){
		if (this._lowerBound < this._upperBound) {
			return upperBound - lowerBound + 1;
		}
		var count = 0;
		if (Number.isFinite(this._upperBound)) {
			count += this._upperBound - lowerBound + 1;
		}
		if (Number.isFinite(this._lowerBound)) {
			count += upperBound - this._lowerBound + 1;
		}
		for (var specificEquality in this._specificEquality) {
			if (this._specificEquality.hasOwnProperty(specificEquality) &&
				this._specificEquality[specificEquality] &&
				specificEquality < this._lowerBound &&
				specificEquality > this._upperBound &&
				specificEquality >= lowerBound &&
				specificEquality <= upperBound) {
				count++;
			}
		}
		return Math.max(Math.min(count, upperBound - lowerBound + 1), 0);
	}
}

module.exports = NumberRange;
