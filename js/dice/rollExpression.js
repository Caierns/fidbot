'use strict';
const Roll = require('./roll.js');
const EXPRESSION_OPERATIONS_REGEX = /[\+\-*/]/;
const ORDER_OF_OPERATIONS = '/*+-';

class RollExpression {
	constructor(inputString, options){
		this._options = options;

		this._values = [];
		this._operations = [];
		let braceOpen = 0;
		let lastPlusIndex = 0;
		let splitString;
		for (let charIndex = 0; charIndex < inputString.length; charIndex++) {
			let char = inputString.charAt(charIndex);
			if (char === '{') {
				braceOpen++;
			}
			if (char === '}') {
				braceOpen--;
			}
			if (EXPRESSION_OPERATIONS_REGEX.test(char) && braceOpen === 0) {
				this._operations.push(char);
				splitString = inputString.slice(lastPlusIndex, charIndex);
				if (!this._processSplitString(splitString)) {
					return;
				}
				lastPlusIndex = charIndex + 1;
			}
		}
		splitString = inputString.slice(lastPlusIndex);
		if (!this._processSplitString(splitString)) {
			return;
		}

		this._total = 0;
		this._error = false;
		this._errorMessage = '';
		this._isTypeSuccess = null;

		for (let memberIndex = 0; memberIndex < this._values.length; memberIndex++) {
			let member = this._values[memberIndex];
			if (typeof member === 'number') {
				continue;
			}
			if (this._isTypeSuccess === null) {
				this._isTypeSuccess = member.isTypeSuccess;
			}
			if (member.error) {
				this._error = true;
				this._errorMessage = member.errorMessage;
				return;
			}
			if (member.isTypeSuccess !== this._isTypeSuccess && this._isTypeSuccess !== null && member.isTypeSuccess !== null) {
				this._error = true;
				this._errorMessage = 'Error: mixed sum and success roll types.';
				return;
			}
		}
	}

	_processSplitString(splitString){
		if (/[A-z]/.test(splitString)) {
			if (splitString.charAt(0) === '{') {
				this._values.push(new RollGroup(splitString, this._options));
			} else {
				this._values.push(new Roll(splitString, this._options));
			}
		} else {
			let splitNumber = parseInt(splitString, 10);
			if (isNaN(splitNumber)) {
				this._error = true;
				this._errorMessage = 'Error: invalid roll command.';
				return false;
			}
			this._values.push(splitNumber);
		}
		return true;
	}

	get error(){
		return this._error;
	}

	get errorMessage(){
		return this._errorMessage;
	}

	get isTypeSuccess(){
		return this._isTypeSuccess;
	}

	get total(){
		return this._total;
	}

	executeDice(){
		let values = [];
		for (let memberIndex = 0; memberIndex < this._values.length; memberIndex++) {
			let member = this._values[memberIndex];
			if (isNaN(member)) {
				member.executeDice();
				values.push(member.total);
			} else {
				values.push(member);
			}
		}
		let total;
		for (let operationIndex = 0; operationIndex < ORDER_OF_OPERATIONS.length; operationIndex++) {
			let operation = ORDER_OF_OPERATIONS[operationIndex];
			for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
				if (this._operations[valueIndex] === operation) {
					let nextValueIndex;
					for (nextValueIndex = valueIndex + 1; nextValueIndex < values.length; nextValueIndex++) {
						if (values[nextValueIndex] !== null) {
							break;
						}
					}
					switch (operation) {
						case '+':
							values[nextValueIndex] = values[valueIndex] + values[nextValueIndex];
							break;
						case '-':
							values[nextValueIndex] = values[valueIndex] - values[nextValueIndex];
							break;
						case '*':
							values[nextValueIndex] = values[valueIndex] * values[nextValueIndex];
							break;
						case '/':
							values[nextValueIndex] = values[valueIndex] / values[nextValueIndex];
							break;
					}
					values[valueIndex] = null;
					total = values[nextValueIndex];
				}
			}
		}
		this._total = total;
	}

	toString(){
		let outputString = '';
		for (let memberIndex = 0; memberIndex < this._values.length; memberIndex++) {
			let member = this._values[memberIndex];
			outputString += member.toString();
			if (memberIndex !== this._values.length - 1) {
				let operation = this._operations[memberIndex];
				if (operation === '*') {
					operation = '\\*';
				}
				outputString += operation;
			}
		}
		return outputString;
	}
}

class RollGroup {
	constructor(inputString, options){
		this._options = options;

		this._error = true;
		this._errorMessage = 'Error: grouped rolls not yet supported.';
		return;

		var rollArray = [];
		var braceOpen = 0;
		var lastCommaIndex = 1;
		var splitString;
		for (var charIndex = 1; charIndex < inputString.length; charIndex++) {
			var char = inputString.charAt(charIndex);
			if (char === '{') {
				braceOpen++;
			}
			if (char === '}') {
				braceOpen--;
				if (braceOpen < 0) {
					break;
				}
			}
			if (char === ',' && braceOpen === 0) {
				splitString = inputString.slice(lastCommaIndex, charIndex);
				rollArray.push(new RollExpression(splitString, this._options));
				lastCommaIndex = charIndex + 1;
			}
		}
		splitString = inputString.slice(lastCommaIndex, charIndex);
		rollArray.push(new RollExpression(splitString, this._options));

		var optionsString = inputString.slice(charIndex + 1);

		this._members = rollArray;
		this._optionsString = optionsString;

		this._total = 0;
		this._error = false;
		this._errorMessage = '';
		this._isTypeSuccess = this._members[0].isTypeSuccess;

		var memberIndex, member;
		for (memberIndex = 0; memberIndex < this._members.length; memberIndex++) {
			member = this._members[memberIndex];
			if (member.error) {
				this._error = true;
				this._errorMessage = member.errorMessage;
				return;
			}
			if (member.isTypeSuccess !== this._isTypeSuccess) {
				this._error = true;
				this._errorMessage = 'Error: mixed sum and success roll types.';
				return;
			}
		}
	}

	get error(){
		return this._error;
	}

	get errorMessage(){
		return this._errorMessage;
	}

	get isTypeSuccess(){
		return this._isTypeSuccess;
	}

	get total(){
		return this._total;
	}

	executeDice(){
		for (var memberIndex = 0; memberIndex < this._members.length; memberIndex++) {
			var member = this._members[memberIndex];
			member.executeDice();
			this._total += member.total;
		}
	}

	toString(){
		var outputString = '';
		for (var memberIndex = 0; memberIndex < this._members.length; memberIndex++) {
			var member = this._members[memberIndex];
			outputString += member.toString();
			if (memberIndex !== this._members.length - 1) {
				outputString += '+';
			}
		}
		return outputString;
	}
}

module.exports = RollExpression;
