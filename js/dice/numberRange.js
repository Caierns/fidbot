'use strict';

var NumberRange = function(){
	this._greaterThan = Infinity;
	this._lessThan = -Infinity;
	this._specificEquality = {};
};

NumberRange.prototype.addSpecificEquality = function(value){
	this._specificEquality[value] = true;
};

NumberRange.prototype.removeSpecificEquality = function(value){
	this._specificEquality[value] = false;
};

NumberRange.prototype.addGreaterThan = function(value){
	this._greaterThan = Math.min(value, this._greaterThan);
};

NumberRange.prototype.setGreaterThan = function(value){
	this._greaterThan = value;
};

NumberRange.prototype.addLessThan = function(value){
	this._lessThan = Math.max(value, this._lessThan);
};

NumberRange.prototype.setLessThan = function(value){
	this._lessThan = value;
};

NumberRange.prototype.isInRange = function(number){
	if (number >= this._greaterThan) {
		return true;
	}
	if (number <= this._lessThan) {
		return true;
	}
	return !!this._specificEquality[number];
};

module.exports = NumberRange;