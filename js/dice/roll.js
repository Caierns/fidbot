'use strict';

const NumberRange = require('./numberRange.js');
const DieResult = require('./dieResult.js');

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
		this._theoreticalDiceCount = 0;
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
		this._explodingSet = false;
		this._sortAscending = false;
		this._sortDescending = false;
		this._drop = false;
		this._dropHighest = false;
		this._dropCount = 0;
		this._reroll = false;
		this._rerollOnce = false;
		this._rerollRange = null;
		this._rerollSet = false;

		this._parseMods(matchParams[3]);

		if (this._rerollRange !== null) {
			var probabilityReroll = (this._rerollRange.countIntegersInRange(1, this._diceSize)) / this._diceSize;
			this._theoreticalDiceCount += this._rerollOnce ? this._diceCount * (1 + probabilityReroll) : this._diceCount / (1 - probabilityReroll);
			if (this._theoreticalDiceCount > this._options.maxCount) {
				this._error = true;
				this._errorMessage = 'Error: Due to exploding dice this input will statistically exceed the limit of ' + this._options.maxCount + ' dice rolls.';
				return;
			}
		}

		if (this._explodingRange !== null) {
			var probabilityExplosion = (this._explodingRange.countIntegersInRange(1, this._diceSize)) / this._diceSize;
			this._theoreticalDiceCount += this._diceCount / (1 - probabilityExplosion);
			if (this._theoreticalDiceCount > this._options.maxCount) {
				this._error = true;
				this._errorMessage = 'Error: Due to exploding dice this input will statistically exceed the limit of ' + this._options.maxCount + ' dice rolls.';
				return;
			}
		}

		if (!this._csSet) {
			this._cs.setGreaterThan(this._diceSize);
		}
		if (!this._cfSet) {
			this._cf.setLessThan(1);
		}
		if ((this._exploding || this._explodingCompound || this._explodingPenetrating) && !this._explodingSet) {
			this._explodingRange.setGreaterThan(this._diceSize);
		}
		if (this._reroll && !this._rerollSet) {
			this._rerollRange.setLessThan(1);
		}

		this._results = [];
		this._total = 0;
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

	get total(){
		return this._total;
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
			Roll._processComparator(matchMod[2], this._cs, matchMod[3]);
			this._csSet = true;
		}
	}

	'_mod_cf'(matchMod){
		if (!isNaN(matchMod[3])) {
			Roll._processComparator(matchMod[2], this._cf, matchMod[3]);
			this._cfSet = true;
		}
	}

	'_mod_!'(matchMod){
		this._exploding = true;
		this._explodingCompound = false;
		this._explodingPenetrating = false;
		this._initialiseExplodingRange();
		if (!isNaN(matchMod[3])) {
			Roll._processComparator(matchMod[2], this._explodingRange, matchMod[3]);
			this._explodingSet = true;
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
			this._explodingSet = true;
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
			this._explodingSet = true;
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
		this._reroll = true;
		this._initialiseRerollRange();
		if (!isNaN(matchMod[3])) {
			Roll._processComparator(matchMod[2], this._rerollRange, matchMod[3]);
			this._rerollSet = true;
		}
	}

	'_mod_ro'(matchMod){
		this._reroll = true;
		this._rerollOnce = true;
		this._initialiseRerollRange();
		if (!isNaN(matchMod[3])) {
			Roll._processComparator(matchMod[2], this._rerollRange, matchMod[3]);
			this._rerollSet = true;
		}
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

	_totalResultsSum(){
		var sum = 0;
		for (var resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
			var result = this._results[resultIndex];
			if (!result.dropped && !result.rerolled) {
				sum += result.value;
			}
		}
		this._total = sum;
	}

	_totalResultsSuccesses(){
		var successes = 0;
		for (var resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
			var result = this._results[resultIndex];
			if (!result.dropped && !result.rerolled) {
				if (this._s.isInRange(result.value)) {
					successes++;
				}
				if (this._f.isInRange(result.value)) {
					successes--;
				}
			}
		}
		this._total = successes;
	}

	_getRandomDieInteger(){
		return 1 + Math.floor(Math.random() * this._diceSize);
	}

	_getRandomDieResult(index){
		return new DieResult(this._getRandomDieInteger(), index);
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

	_initialiseRerollRange(){
		if (this._rerollRange === null) {
			this._rerollRange = new NumberRange();
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
		if (a.value > b.value) {
			return 1;
		}
		if (a.value < b.value) {
			return -1;
		}
		return 0;
	}

	static _sortDescendingFunction(a, b){
		if (a.value > b.value) {
			return -1;
		}
		if (a.value < b.value) {
			return 1;
		}
		return 0;
	}

	static _sortResumeOriginalOrderFunction(a, b){
		if (a.index > b.index) {
			return 1;
		}
		if (a.index < b.index) {
			return -1;
		}
		return 0;
	}

	executeDice(){
		var resultIndex, result;
		for (resultIndex = 0; resultIndex < this._diceCount; resultIndex++) {
			result = this._getRandomDieResult(this._results.length);
			this._results.push(result);

			if (this._reroll && this._rerollRange.isInRange(result.value)) {
				do {
					result.rerolled = true;
					result = this._getRandomDieResult(this._results.length);
					this._results.push(result);
				} while (!this._rerollOnce && this._rerollRange.isInRange(result.value));
			}

			if (this._exploding) {
				while (this._explodingRange.isInRange(result.value)) {
					result = this._getRandomDieResult(this._results.length);
					result.exploded = true;
					this._results.push(result);
				}
			} else if (this._explodingCompound) {
				if (this._explodingRange.isInRange(result.value)) {
					result.exploded = true;
					do {
						var extraResultValue = this._getRandomDieInteger();
						result.addValue(extraResultValue);
					} while (this._explodingRange.isInRange(extraResultValue));
				}
			} else if (this._explodingPenetrating) {
				while (this._explodingRange.isInRange(result.value)) {
					result = this._getRandomDieResult(this._results.length);
					result.exploded = true;
					result.addValue(-1);
					this._results.push(result);
				}
			}
		}

		if (this._isFateDice) {
			// Need to change value of result so that sums add up properly
			for (resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
				this._results[resultIndex].addValue(-2);
			}
		}

		if (this._drop) {
			// Sort it
			if (this._dropHighest) {
				this._results.sort(Roll._sortDescendingFunction);
			} else {
				this._results.sort(Roll._sortAscendingFunction);
			}
			// Mark the first dropCount results as dropped
			var dropsRemaining = this._dropCount;
			for (resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
				if (dropsRemaining <= 0) {
					break;
				}
				result = this._results[resultIndex];
				if (result.rerolled) {
					continue;
				}
				result.dropped = true;
				dropsRemaining--;
			}
			// Sort it by index to restore it to the original order
			this._results.sort(Roll._sortResumeOriginalOrderFunction);
		}

		if (this._sortAscending) {
			this._results.sort(Roll._sortAscendingFunction);
		} else if (this._sortDescending) {
			this._results.sort(Roll._sortDescendingFunction);
		}

		if (this._isTypeSuccess) {
			this._totalResultsSuccesses();
		} else {
			this._totalResultsSum();
		}
	}

	toString(){
		var outputString = '(';
		for (var resultIndex = 0; resultIndex < this._results.length; resultIndex++) {
			var result = this._results[resultIndex];
			var value = result.value;
			if (this._isFateDice) {
				value = _fateMapping[value];
			}
			if (resultIndex < this._results.length - 1) {
				value += this._isFateDice ? ' ' : '+';
			}
			if (!this._isFateDice) {
				value = this._formatResult(value);
			}
			if (result.dropped || result.rerolled) {
				value = Roll._formatDropped(value);
			}
			outputString += value;
		}
		outputString += ')';
		return outputString;
	}
}

module.exports = Roll;
