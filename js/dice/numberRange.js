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

	countIntegersInRange(lowerBound, upperBound){
		if (this._greaterThan < this._lessThan) {
			return upperBound - lowerBound + 1;
		}
		var count = 0;
		if (Number.isFinite(this._lessThan)) {
			count += this._lessThan - lowerBound + 1;
		}
		if (Number.isFinite(this._greaterThan)) {
			count += upperBound - this._greaterThan + 1;
		}
		for (var specificEquality in this._specificEquality) {
			if (this._specificEquality.hasOwnProperty(specificEquality) &&
				this._specificEquality[specificEquality] &&
				specificEquality < this._greaterThan &&
				specificEquality > this._lessThan &&
				specificEquality >= lowerBound &&
				specificEquality <= upperBound) {
				count++;
			}
		}
		return Math.max(Math.min(count, upperBound - lowerBound + 1), 0);
	}
}

module.exports = NumberRange;
