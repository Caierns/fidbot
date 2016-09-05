'use strict';

const NumberRange = require('./numberRange.js');

const _fateMapping = {
	'-1': '-',
	'0': '0',
	'1': '+'
};

class Roll {
	constructor(inputString, options){
		this._options = options;

		this._error = false; // Set a flag to indicate the input is invalid
		this._errorMessage = '';

		var matchParams = /([0-9]+)d([0-9F]+)(.*)/.exec(inputString);
		if (matchParams === null) {
			this._error = true;
			this._errorMessage = 'Error: invalid roll command.';
			return;
		}
		this._diceCount = parseInt(matchParams[1], 10);
		if (this._diceCount > this._options.maxCount) {
			this._error = true;
			this._errorMessage = 'Error: max number of dice exceeded.';
			return;
		}
		this._isFateDice = matchParams[2] === 'F';
		this._diceSize = this._isFateDice ? 3 : parseInt(matchParams[2], 10);

		this._isTypeSuccess = false;
		this._cs = new NumberRange();
		this._cf = new NumberRange();
		this._cs.setGreaterThan(this._diceSize);
		this._cf.setLessThan(1);

		this._parseMods(matchParams[3]);

		this._results = [];
		this._sum = 0;
		this._successes = 0;
	}

	get error(){
		return this._error;
	}

	get errorMessage(){
		return this._errorMessage;
	}

	get diceCount(){
		return this._diceCount;
	}

	get isTypeSuccess(){
		return this._isTypeSuccess;
	}

	get sum(){
		return this._sum;
	}

	get successes(){
		return this._successes;
	}

	_parseMods(modString){
		if (modString !== '') {
			var modRegex = /((?:f|![!p]?|[kd][hl]?|ro?|s[ad]|c[sf])?)([<=>]?)([0-9]*)/g;
			var matchMod;
			while ((matchMod = modRegex.exec(modString)) !== null && matchMod[0] !== '') {
				matchMod[2] = matchMod[2] || '=';
				matchMod[3] = parseInt(matchMod[3], 10);
				this['_mod_' + matchMod[1]](matchMod);
				if (this.error) {
					return;
				}
			}
		}
	}

	'_mod_'(matchMod){
		this['_mod_s'](matchMod);
	}

	'_mod_s'(matchMod){
		if (!isNaN(matchMod[3])) {
			this._initialiseSuccessRange();
			switch (matchMod[2]) {
				case '>':
					this._s.addGreaterThan(matchMod[3]);
					break;
				case '<':
					this._s.addLessThan(matchMod[3]);
					break;
				case '=':
					this._s.addSpecificEquality(matchMod[3]);
					break;
			}
		}
	}

	'_mod_f'(matchMod){
		if (!isNaN(matchMod[3])) {
			this._initialiseSuccessRange();
			switch (matchMod[2]) {
				case '>':
					this._f.addGreaterThan(matchMod[3]);
					break;
				case '<':
					this._f.addLessThan(matchMod[3]);
					break;
				case '=':
					this._f.addSpecificEquality(matchMod[3]);
					break;
			}
		}
	}

	'_mod_cs'(matchMod){
		if (!isNaN(matchMod[3])) {
			this._initialiseSuccessRange();
			switch (matchMod[2]) {
				case '>':
					this._cs.addGreaterThan(matchMod[3]);
					break;
				case '<':
					this._cs.addLessThan(matchMod[3]);
					break;
				case '=':
					this._cs.addSpecificEquality(matchMod[3]);
					break;
			}
		}
	}

	'_mod_cf'(matchMod){
		if (!isNaN(matchMod[3])) {
			this._initialiseSuccessRange();
			switch (matchMod[2]) {
				case '>':
					this._cf.addGreaterThan(matchMod[3]);
					break;
				case '<':
					this._cf.addLessThan(matchMod[3]);
					break;
				case '=':
					this._cf.addSpecificEquality(matchMod[3]);
					break;
			}
		}
	}

	'_mod_!'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_!!'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_!p'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_k'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_kh'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_kl'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_d'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_dh'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_dl'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_r'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_ro'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_sa'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_sd'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	_sumResults(){
		var sum = 0;
		for (var resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
			sum += this._results[resultIndex];
		}
		this._sum = sum;
	}

	_tallyResults(){
		var successes = 0;
		for (var resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
			var result = this._results[resultIndex];
			if (this._s.isInRange(result)) {
				successes++;
			}
			if (this._f.isInRange(result)) {
				successes--;
			}
		}
		this._successes = successes;
	}

	_getRandomDieResult(){
		return 1 + Math.floor(Math.random() * this._diceSize);
	}

	_initialiseSuccessRange(){
		if (!this._isTypeSuccess) {
			this._isTypeSuccess = true;
			this._s = new NumberRange();
			this._f = new NumberRange();
		}
	}

	static _formatCriticalSuccess(value){
		return '**' + value + '**';
	}

	static _formatCriticalFail(value){
		return '__' + value + '__';
	}

	static _formatDropped(value){
		return '~~' + value + '~~';
	}

	_formatResult(result){
		if (this._cs.isInRange(result)) {
			result = Roll._formatCriticalSuccess(result);
		}
		if (this._cf.isInRange(result)) {
			result = Roll._formatCriticalFail(result);
		}
		return result;
	}

	executeDice(){
		for (var rollCount = this._diceCount; rollCount > 0; rollCount--) {
			var result = this._getRandomDieResult();
			if (this._isFateDice) {
				result -= 2;
			}
			this._results.push(result);
		}
		if (this._isTypeSuccess) {
			this._tallyResults();
		} else {
			this._sumResults();
		}
	}

	toString(){
		var outputString = '(';
		for (var resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
			var result = this._results[resultIndex];
			if (this._isFateDice) {
				result = _fateMapping[result];
			} else {
				result = this._formatResult(result);
			}
			outputString += result;
			if (resultIndex !== this._results.length - 1) {
				outputString += this._isFateDice ? ' ' : '+';
			}
		}
		outputString += ')';
		return outputString;
	}
}

module.exports = Roll;
