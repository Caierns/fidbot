'use strict';

const MAX_MEMORY_SIZE = 10000;

const OUTCOMES = {
	'0': [
		`Don't count on it`,
		`My reply is no`,
		`My sources say no`,
		`Outlook not so good`,
		`Very doubtful`
	],
	'1': [
		`Reply hazy try again`,
		`Ask again later`,
		`Better not tell you now`,
		`Cannot predict now`,
		`Concentrate and ask again`
	],
	'2': [
		`It is certain`,
		`It is decidedly so`,
		`Without a doubt`,
		`Yes, definitely`,
		`You may rely on it`,
		`As I see it, yes`,
		`Most likely`,
		`Outlook good`,
		`Yes`,
		`Signs point to yes`
	]
};

class Magic8Ball {
	constructor(){
		this._memory = new Map();
	}

	magic8Ball(message, parameters){
		let question = parameters.join(' ').trim();
		if (Magic8Ball._validateQuestion(question)) {
			let outcomeType = this._memory.get(question);
			if (outcomeType === undefined) {
				outcomeType = Magic8Ball._getOutcomeType();
				this._memory.set(question, outcomeType);
				if (this._memory.size > MAX_MEMORY_SIZE) {
					this._springCleanMemory();
				}
			}
			let outcome = Magic8Ball._getOutcomeFromType(outcomeType);
			message.reply(outcome);
		} else {
			message.reply(`Please ask a valid question!`);
		}
	}

	_springCleanMemory(){
		let keys = this._memory.keys();
		let i = 0;
		let halfway = this._memory.size / 2;
		for (let key of keys) {
			if (i >= halfway) {
				break;
			}
			this._memory.delete(key);
			i++;
		}
	}

	static _validateQuestion(question){
		// Must end with a question mark in some capacity
		if (!/\?\!*$/.test(question)) {
			return false;
		}
		// Must comprise of two words
		if (!/[^\s]\s+[^\s]/.test(question)) {
			return false;
		}
		return true;
	}

	static _getOutcomeType(){
		let n = Math.floor(Math.random() * 4);
		if (n >= 3) {
			n--;
		}
		return n;
	}

	static _getOutcomeFromType(outcomeType){
		return OUTCOMES[outcomeType][Math.floor(Math.random() * OUTCOMES[outcomeType].length)];
	}
}

module.exports = new Magic8Ball();
