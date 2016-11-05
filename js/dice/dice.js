'use strict';

var RollExpression = require('./rollExpression.js');

class Dice {
	constructor(options){
		this._MAXCOUNT = options.maxCount || 100;
		this._options = options;
		this._error = false; // Set a flag to indicate the input is invalid
		this._errorMessage = '';
	}

	evaluate(inputString){
		var rollExpression = new RollExpression(inputString, this._options);
		if (rollExpression.error) {
			this._error = rollExpression.error;
			this._errorMessage = rollExpression.errorMessage;
			return;
		}

		rollExpression.executeDice();
		var outputString = rollExpression.toString() + ' = ' + rollExpression.total;
		if (rollExpression.isTypeSuccess) {
			outputString += ' Successes';
		}

		return outputString;
	}

	get error(){
		return this._error;
	}

	get errorMessage(){
		return this._errorMessage;
	}
}

module.exports = Dice;
