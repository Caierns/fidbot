'use strict';

const fs = require('fs');
const path = require('path');
const SEED_PATH = path.join('js', 'shitbot', 'seed');

class WordPermutations {
	constructor(word){
		this._word = word.toLowerCase();
		this._permutations = new Map();
	}

	add(word){
		let freq = this._permutations.get(word);
		if (freq === undefined) {
			this._permutations.set(word, 1);
		} else {
			this._permutations.set(word, freq + 1);
		}
	}

	cap(){
		let p = Math.random() * this._permutations.size;
		let runningWeight = 0;
		for (let mapping of this._permutations) {
			runningWeight += mapping[1];
			if (p < runningWeight) {
				return mapping[0];
			}
		}
	}
}

class WordStore extends Map {
	add(key, value){
		let target = super.get(key);
		if (target === undefined) {
			target = [];
			super.set(key, target);
		}
		target.push(value);
	}

	get(key){
		let target = super.get(key);
		if (target === undefined) {
			return undefined;
		}
		let index = Math.floor(WordStore._transformProbability(Math.random()) * target.length);
		return target[index];
	}

	size(key){
		if (key === undefined) {
			return super.size();
		}
		let target = super.get(key);
		if (target) {
			return target.length;
		} else {
			return 0;
		}
	}

	static _transformProbability(p){
		// Make more recent words come up more often
		return Math.pow(p, 2);
	}
}

class MarkovBase {
	constructor(){
		this.capitalisationFrequency = new Map();
		this.threeWordSequences = new WordStore();
		this.twoWordSequences = new WordStore();
		this.oneWordStarts = new WordStore();
	}

	add(text){
		let words = text.split(/\s/).filter(this._addWordFilter);

		// Exit if we have nothing to work with
		if (!words || !words.length){
			return;
		}

		// Specially handle first word
		this.oneWordStarts.add('.', words[0].toLowerCase());

		// Now we don't have to worry about previous words being undefined for index < 1;
		for (let wordIndex = 1; wordIndex < words.length; wordIndex++) {
			let wordTrueCaps = words[wordIndex];
			let word = wordTrueCaps.toLowerCase();
			let wordPrevious = words[wordIndex - 1].toLowerCase();
			let wordBeforeThat = words[wordIndex - 2];
			wordBeforeThat = wordBeforeThat && wordBeforeThat.toLowerCase();

			if (MarkovBase._endsSentence(wordPrevious)) {
				// Previous word ended a sentence
				this.oneWordStarts.add(wordPrevious.slice(-1), word);
			} else {
				this.twoWordSequences.add(wordPrevious, word);
				if (wordBeforeThat && !MarkovBase._endsSentence(wordBeforeThat)) {
					// wordBeforeThat didn't end a sentence
					this.threeWordSequences.add(MarkovBase._threeWordSequenceKey(wordPrevious, wordBeforeThat), word);
				}
				// If the word didn't start a sentence we can take it capitalisation as reflective of it's normal state
				let perm = this.capitalisationFrequency.get(word);
				if (!perm) {
					perm = new WordPermutations(word);
					this.capitalisationFrequency.set(word, perm);
				}
				perm.add(wordTrueCaps);
			}
		}
	}

	_addWordFilter(word){
		return word.length;
	}

	static _endsSentence(word){
		return /[.?!]$/.test(word);
	}

	static _threeWordSequenceKey(wordPrevious, wordBeforeThat){
		return wordBeforeThat + ' ' + wordPrevious;
	}

	generate(wordCount){
		let words = [];
		for (let wordIndex = 0; wordIndex < wordCount; wordIndex++) {
			let wordPrevious = words[wordIndex - 1];
			wordPrevious = wordPrevious && wordPrevious.toLowerCase();
			let wordBeforeThat = words[wordIndex - 2];
			wordBeforeThat = wordBeforeThat && wordBeforeThat.toLowerCase();
			let endSentenceChar = MarkovBase._endsSentence(wordPrevious) && wordPrevious.slice(-1);

			words.push(this._cap(this._getWord(wordPrevious, wordBeforeThat, endSentenceChar)));

			// Ensure it doesn't end with trailing weird punctuation
			if ((wordIndex + 1) >= wordCount && /[,:;]$/.test(words[words.length - 1])) {
				wordCount++;
			}
		}

		return words.join(' ');
	}

	_getWord(wordPrevious, wordBeforeThat, endSentenceChar){
		if (wordBeforeThat) {
			return this.threeWordSequences.get(MarkovBase._threeWordSequenceKey(wordPrevious, wordBeforeThat));
		}
		if (wordPrevious) {
			return this.twoWordSequences.get(wordPrevious);
		}
		if (endSentenceChar) {
			return this.oneWordStarts.get(endSentenceChar);
		}
		return this.oneWordStarts.get('.');
	}

	_cap(word){
		let perm = this.capitalisationFrequency.get(word);
		if (perm) {
			word = perm.cap();
		}
		return word;
	}
}

class Shitbot extends MarkovBase {
	constructor(commandCharacter){
		super();
		this._commandCharacter = commandCharacter;
	}

	addPost(post){
		if (post.charAt(0) === this._commandCharacter) {
			// Ignore bot commands
			return;
		}
		post = post.replace(/[^.?!]\n/g, '.\n');
		if (!Shitbot._endsSentence(post)) {
			post += '.';
		}
		this.add(post);
	}

	_addWordFilter(word){
		return word.length && word.slice(0, 4) !== 'http';
	}

	generatePost(wordCount){
		let post = this.generate(Math.floor(wordCount));

		// Put meme arrows on new lines
		post = post.replace(/ >/g, '\n>');
		// Remove speechmarks and other paired symbols
		post = post.replace(/["\[\]\{\}\(\)]/g, '');
		// Capitalise sentence starts
		post = post.charAt(0).toUpperCase() + post.slice(1);
		post = post.replace(/([.?!]\s)([a-z])/g, Shitbot._capitaliseSentenceStartReplacementFunction);

		return post;
	}

	static _useLocal(sizeLocal, sizeBase){
		if (sizeLocal === 0) {
			return false;
		}
		if (sizeBase === 0) {
			return true;
		}
		if (sizeLocal < sizeBase) {
			// Skew the odds in local's favour
			sizeLocal = Math.log(sizeLocal);
			sizeBase = Math.log(sizeBase);
		}
		return (Math.random() * (sizeLocal + sizeBase)) < sizeLocal;
	}

	static _determineWord(key, storeLocal, storeBase){
		let sizeLocal = storeLocal.size(key);
		let sizeBase = storeBase.size(key);

		if (sizeLocal > 0 || sizeBase > 0) {
			if (Shitbot._useLocal(sizeLocal, sizeBase)) {
				return storeLocal.get(key);
			} else {
				return storeBase.get(key);
			}
		}
	}

	_getWord(wordPrevious, wordBeforeThat, endSentenceChar){
		let word;
		if (wordBeforeThat) {
			let key = MarkovBase._threeWordSequenceKey(wordPrevious, wordBeforeThat);
			word = Shitbot._determineWord(key, this.threeWordSequences, Shitbot.base.threeWordSequences);
		}
		if (!word && wordPrevious) {
			word = Shitbot._determineWord(wordPrevious, this.twoWordSequences, Shitbot.base.twoWordSequences);
		}
		if (!word && endSentenceChar) {
			word = Shitbot._determineWord(endSentenceChar, this.oneWordStarts, Shitbot.base.oneWordStarts);
		}
		if (!word) {
			word = Shitbot._determineWord('.', this.oneWordStarts, Shitbot.base.oneWordStarts);
		}
		return word;
	}

	_cap(word){
		// Try to capitalise it with local frequency
		let perm = this.capitalisationFrequency.get(word);
		if (!perm) {
			// Failing that use base frequency
			perm = Shitbot.base.capitalisationFrequency.get(word)
		}
		if (perm) {
			word = perm.cap();
		}
		return word;
	}

	static _capitaliseSentenceStartReplacementFunction($0, $1, $2){
		return $1 + $2.toUpperCase();
	}
}

Shitbot.base = new MarkovBase();

// Seed the base with files found in the seed folder
fs.readdir(SEED_PATH, (err, files)=>{
	if (files) {
		files.forEach(file=>{
			fs.readFile(path.join(SEED_PATH, file), 'utf8', (err, data)=>{
				Shitbot.base.add(data);
			});
		});
	}
});

module.exports = Shitbot;
