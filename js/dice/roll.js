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
		this._s = null;
		this._f = null;
		this._cs = new NumberRange();
		this._cf = new NumberRange();
		this._csSet = false;
		this._cfSet = false;
		this._exploding = false;
		this._explodingCompound = false;
		this._explodingPenetrating = false;
		this._explodingRange = null;
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
			Roll._processComparator(matchMod[2], this._s, matchMod[3]);
		}
	}

	'_mod_f'(matchMod){
		if (!isNaN(matchMod[3])) {
			this._initialiseSuccessRange();
			Roll._processComparator(matchMod[2], this._f, matchMod[3]);
		}
	}

	'_mod_cs'(matchMod){
		if (!isNaN(matchMod[3])) {
			this._csSet = true;
			Roll._processComparator(matchMod[2], this._cs, matchMod[3]);
		}
	}

	'_mod_cf'(matchMod){
		if (!isNaN(matchMod[3])) {
			this._cfSet = true;
			Roll._processComparator(matchMod[2], this._cf, matchMod[3]);
		}
	}

	'_mod_!'(matchMod){
		this._exploding = true;
		this._explodingCompound = false;
		this._explodingPenetrating = false;
		this._initialiseExplodingRange();
		if (!isNaN(matchMod[3])) {
			Roll._processComparator(matchMod[2], this._explodingRange, matchMod[3]);
		} else {
			this._explodingRange.addGreaterThan(this._diceSize);
		}
	}

	'_mod_!!'(matchMod){
		if (this._isFateDice) {
			this._error = true;
			this._errorMessage = 'Error: Compound exploding dice is incompatible with Fate dice.';
			return;
		}
		this._exploding = false;
		this._explodingCompound = true;
		this._explodingPenetrating = false;
		this._initialiseExplodingRange();
		if (!isNaN(matchMod[3])) {
			Roll._processComparator(matchMod[2], this._explodingRange, matchMod[3]);
		} else {
			this._explodingRange.addGreaterThan(this._diceSize);
		}
	}

	'_mod_!p'(matchMod){
		if (this._isFateDice) {
			this._error = true;
			this._errorMessage = 'Error: Penetrating exploding dice is incompatible with Fate dice.';
			return;
		}
		this._exploding = false;
		this._explodingCompound = false;
		this._explodingPenetrating = true;
		this._initialiseExplodingRange();
		if (!isNaN(matchMod[3])) {
			Roll._processComparator(matchMod[2], this._explodingRange, matchMod[3]);
		} else {
			this._explodingRange.addGreaterThan(this._diceSize);
		}
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

	static _processComparator(comparator, range, value){
		switch (comparator) {
			case '>':
				range.addGreaterThan(value);
				break;
			case '<':
				range.addLessThan(value);
				break;
			case '=':
				range.addSpecificEquality(value);
				break;
		}
	};

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

	_initialiseExplodingRange(){
		if (this._explodingRange === null) {
			this._explodingRange = new NumberRange();
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
			if (this._exploding) {
				do {
					result = this._getRandomDieResult();
					this._results.push(result);
				} while (this._explodingRange.isInRange(result));
			} else if (this._explodingCompound) {
				result = 0;
				do {
					var newResult = this._getRandomDieResult();
					result += newResult;
				} while (this._explodingRange.isInRange(newResult));
				this._results.push(result);
			} else if (this._explodingPenetrating) {
				result = this._getRandomDieResult();
				this._results.push(result);
				while (this._explodingRange.isInRange(result)) {
					result = this._getRandomDieResult() - 1;
					this._results.push(result);
				}
			} else {
				result = this._getRandomDieResult();
				this._results.push(result);
			}
		}

		if (this._isFateDice) {
			// Need to change value of result so that sums add up properly
			for (resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
				this._results[resultIndex] -= 2;
			}
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
