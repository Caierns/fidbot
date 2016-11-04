'use strict';

class Shitbot {
	constructor(){
		this._words = [];
		this._frequencyAllCaps = {};
		this._frequencyStartCaps = {};
		this._frequencyNoCaps = {};
		this._sequentialWordCount = 3;
	}

	addPost(post){
		post = post.replace(/[^\.\?\!]\n/g, '.\n');
		let words = post.split(/\s/);
		words.forEach(this._processNewWord, this);
	}

	generatePost(wordCount){
		let post = '';
		let wordIndex = this._getRandomStartIndex();
		let sequentialWordCount = this._sequentialWordCount;
		let word;
		while (wordCount) {
			wordCount--;

			// Get a new word and handle its capitalisation
			word = this._words[wordIndex];
			if (this._frequencyStartCaps[word] > this._frequencyNoCaps[word]) {
				if (this._frequencyAllCaps[word] > this._frequencyStartCaps[word]) {
					word = word.toUpperCase();
				} else {
					word = word.charAt(0).toUpperCase() + word.slice(1);
				}
			} else if (this._frequencyAllCaps[word] > this._frequencyNoCaps[word]) {
				word = word.toUpperCase();
			}
			post += word + (wordCount > 1 ? ' ' : '');

			// Handle sequential word and index switching
			sequentialWordCount--;
			if (!sequentialWordCount) {
				sequentialWordCount = this._sequentialWordCount;
				wordIndex = this._getRandomStartIndex();
			} else {
				wordIndex++;
				if (wordIndex >= this._words.length) {
					wordIndex = this._getRandomStartIndex();
				}
			}
		}

		// Capitalise sentence starts
		post = post.charAt(0).toUpperCase() + post.slice(1);
		post = post.replace(/([.?!]\s)([a-z])/g, Shitbot._capitaliseSentenceStartReplacementFunction);
		return post;
	}

	static _capitaliseSentenceStartReplacementFunction($0, $1, $2){
		return $1 + $2.toUpperCase();
	}

	static _incrementFrequency(frequencyStore, word){
		frequencyStore[word.toLowerCase()] = frequencyStore[word.toLowerCase()] || 0;
		frequencyStore[word.toLowerCase()]++;
	}

	static _transformProbability(p){
		// Make more recent words come up more often
		return Math.pow(p, 2);
	}

	_processNewWord(word){
		if (!/[A-z0-9]/.test(word)) {
			// Don't keep empty words or purely miscellaneous characters
			return;
		}
		if (word.slice(0, 4) === 'http') {
			// Handle links differently
			return;
		}

		let wordLowercase = word.toLowerCase();
		if (/[A-Z]/.test(word.charAt(0))) {
			if (/[^a-z]/.test(word.slice(1))) {
				Shitbot._incrementFrequency(this._frequencyAllCaps, wordLowercase);
			} else {
				Shitbot._incrementFrequency(this._frequencyStartCaps, wordLowercase);
			}
		} else {
			Shitbot._incrementFrequency(this._frequencyNoCaps, wordLowercase);
		}
		this._words.push(wordLowercase);
	}

	_getRandomStartIndex(){
		return Math.floor(Shitbot._transformProbability(Math.random()) * this._words.length);
	}
}

module.exports = Shitbot;