'use strict';

class WordPermutations {
	constructor(word){
		this._word = word.toLowerCase();
		this._allCapital = 0;
		this._startCapital = 0;
		this._noCapital = 0;
		this._total = 0;
	}

	add(word){
		if (/[A-Z]/.test(word.charAt(0))) {
			if (/[^a-z]/.test(word.slice(1))) {
				this._allCapital++;
			} else {
				this._startCapital++;
			}
		} else {
			this._noCapital++;
		}
		this._total++;
	}

	cap(){
		let p = Math.random() * this._total;
		if (p < this._allCapital) {
			return this._word.toUpperCase();
		} else if (p < this._allCapital + this._startCapital) {
			return this._word.charAt(0).toUpperCase() + this._word.slice(1);
		} else {
			return this._word;
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

	static _transformProbability(p){
		// Make more recent words come up more often
		return Math.pow(p, 2);
	}
}

class MarkovBase {
	constructor(inputText){
		this.capitalisationFrequency = new Map();
		this.threeWordSequences = new WordStore();
		this.twoWordSequences = new WordStore();
		this.oneWordStarts = new WordStore();

		if (inputText.length) {
			this.add(inputText);
		}
	}

	add(text){
		let words = text.split(/\s/).filter(this._addWordFilter);

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
			words.push(this._getWord(wordPrevious, wordBeforeThat, endSentenceChar));
		}

		return words.join(' ');
	}

	_getWord(wordPrevious, wordBeforeThat, endSentenceChar){
		let word;
		if (!word && wordBeforeThat) {
			word = this.threeWordSequences.get(MarkovBase._threeWordSequenceKey(wordPrevious, wordBeforeThat));
		}
		if (!word && wordPrevious) {
			word = this.twoWordSequences.get(wordPrevious);
		}
		if (!word && endSentenceChar) {
			word = this.oneWordStarts.get(endSentenceChar);
		}
		if (!word) {
			word = this.oneWordStarts.get('.');
		}
		return this.capitalisationFrequency.get(word).cap();
	}
}

class Shitbot extends MarkovBase {
	constructor(commandCharacter){
		super('');
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
		let post = this.generate(wordCount);

		// Capitalise sentence starts
		post = post.charAt(0).toUpperCase() + post.slice(1);
		post = post.replace(/([.?!]\s)([a-z])/g, Shitbot._capitaliseSentenceStartReplacementFunction);
		// Put meme arrows on new lines
		post = post.replace(/ >/g, '\n>');
		// Remove speechmarks and other paired symbols
		post = post.replace(/"\[]\{}\(\)/g, '');

		return post;
	}

	_getWord(wordPrevious, wordBeforeThat, endSentenceChar){
		let word;
		// Try the local word store first
		if (!word && wordBeforeThat) {
			word = this.threeWordSequences.get(MarkovBase._threeWordSequenceKey(wordPrevious, wordBeforeThat));
		}
		if (!word && wordPrevious) {
			word = this.twoWordSequences.get(wordPrevious);
		}
		// Failing that try the base word store
		if (!word && wordBeforeThat) {
			word = Shitbot.base.threeWordSequences.get(MarkovBase._threeWordSequenceKey(wordPrevious, wordBeforeThat));
		}
		if (!word && wordPrevious) {
			word = Shitbot.base.twoWordSequences.get(wordPrevious);
		}
		// In that case we need to just start a new sentence
		if (!word && endSentenceChar) {
			word = this.oneWordStarts.get(endSentenceChar);
		}
		// And if we can't find something with the right punctuation try the base store
		if (!word && endSentenceChar) {
			word = Shitbot.base.oneWordStarts.get(endSentenceChar);
		}
		// And failing that we go local default
		if (!word) {
			word = this.oneWordStarts.get('.');
		}
		// And if we're REALLY scraping we go base store default
		if (!word) {
			word = Shitbot.base.oneWordStarts.get('.');
		}
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

Shitbot.base = new MarkovBase('Some very basic input text');

module.exports = Shitbot;
