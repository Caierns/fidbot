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
		this._csSet = false;
		this._cfSet = false;
		this._sortAscending = false;
		this._sortDescending = false;
		this._drop = false;
		this._dropHighest = false;
		this._dropCount = 0;
		this._droppedTracker = [];

		this._parseMods(matchParams[3]);

		if (!this._csSet) {
			this._cs.setGreaterThan(this._diceSize);
		}
		if (!this._cfSet) {
			this._cf.setLessThan(1);
		}

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
			this._csSet = true;
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
			this._cfSet = true;
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
		this['_mod_kh'](matchMod);
	}

	'_mod_kh'(matchMod){
		matchMod[3] = this._diceCount - matchMod[3];
		this['_mod_dl'](matchMod);
	}

	'_mod_kl'(matchMod){
		matchMod[3] = this._diceCount - matchMod[3];
		this['_mod_dh'](matchMod);
	}

	'_mod_d'(matchMod){
		this['_mod_dl'](matchMod);
	}

	'_mod_dh'(matchMod){
		this._drop = true;
		this._dropHighest = true;
		this._dropCount = Math.max(matchMod[3], this._dropCount);
	}

	'_mod_dl'(matchMod){
		this._drop = true;
		this._dropHighest = false;
		this._dropCount = Math.max(matchMod[3], this._dropCount);
	}

	'_mod_r'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_ro'(matchMod){
		this._error = true;
		this._errorMessage = 'Error: ' + matchMod[1] + ' mod has not yet been implemented!';
	}

	'_mod_s'(matchMod){
		this['_mod_sa'](matchMod);
	}

	'_mod_sa'(matchMod){
		this._sortAscending = true;
	}

	'_mod_sd'(matchMod){
		this._sortDescending = true;
	}

	_sumResults(){
		var sum = 0;
		for (var resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
			if (!this._dropCount || !this._droppedTracker[resultIndex][2]) {
				sum += this._results[resultIndex];
			}
		}
		this._sum = sum;
	}

	_tallyResults(){
		var successes = 0;
		for (var resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
			if (!this._dropCount || !this._droppedTracker[resultIndex][2]) {
				var result = this._results[resultIndex];
				if (this._s.isInRange(result)) {
					successes++;
				}
				if (this._f.isInRange(result)) {
					successes--;
				}
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
		var output = result;
		if (this._cs.isInRange(result)) {
			output = Roll._formatCriticalSuccess(output);
		}
		if (this._cf.isInRange(result)) {
			output = Roll._formatCriticalFail(output);
		}
		return output;
	}

	static _sortAscendingFunction(a, b){
		if (a > b) {
			return 1;
		}
		if (a < b) {
			return -1;
		}
		return 0;
	}

	static _sortDescendingFunction(a, b){
		if (a > b) {
			return -1;
		}
		if (a < b) {
			return 1;
		}
		return 0;
	}

	static _sortKeepLowestFunction(a, b){
		if (a[0] > b[0]) {
			return 1;
		}
		if (a[0] < b[0]) {
			return -1;
		}
		return 0;
	}

	static _sortKeepHighestFunction(a, b){
		if (a[0] > b[0]) {
			return -1;
		}
		if (a[0] < b[0]) {
			return 1;
		}
		return 0;
	}

	static _sortResumeOriginalOrderFunction(a, b){
		if (a[1] > b[1]) {
			return 1;
		}
		if (a[1] < b[1]) {
			return -1;
		}
		return 0;
	}

	executeDice(){
		var resultIndex, result;
		for (resultIndex = 0; resultIndex < this._diceCount; resultIndex++) {
			result = this._getRandomDieResult();
			if (this._isFateDice) {
				result -= 2;
			}
			this._results.push(result);
		}

		if (this._sortAscending) {
			this._results.sort(Roll._sortAscendingFunction);
		} else if (this._sortDescending) {
			this._results.sort(Roll._sortDescendingFunction);
		}

		if (this._drop) {
			// Generate an array we can sort willy nilly
			for (resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
				result = this._results[resultIndex];
				this._droppedTracker.push([result, resultIndex, false]);
			}
			// Sort it
			if (this._dropHighest) {
				this._droppedTracker.sort(Roll._sortKeepHighestFunction);
			} else {
				this._droppedTracker.sort(Roll._sortKeepLowestFunction);
			}
			// Mark the first dropCount elements as dropped
			for (resultIndex = 0; resultIndex < this._droppedTracker.length; resultIndex++) {
				if (resultIndex >= this._dropCount) {
					break;
				}
				this._droppedTracker[resultIndex][2] = true;
			}
			// Sort it by original index to restore it to the original order
			this._droppedTracker.sort(Roll._sortResumeOriginalOrderFunction);
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
			if (this._dropCount && this._droppedTracker[resultIndex][2]) {
				result = Roll._formatDropped(result);
			}
			outputString += result;
			if (resultIndex !== this._results.length - 1) {
				if (this._isFateDice) {
					outputString += ' ';
				} else {
					if (!this._dropCount || !this._droppedTracker[resultIndex][2]) {
						outputString += '+';
					} else {
						outputString += Roll._formatDropped('+');
					}
				}
			}
		}
		outputString += ')';
		return outputString;
	}
}

module.exports = Roll;
