'use strict';
// Inspired by http://www.cse.psu.edu/~duk17/papers/change.pdf

const Shitbot = require('./shitbot.js');

const TIME_INTERVAL = 60 * 1000;
const WINDOW_SIZE = 10;
const STANDARD_DEVIATION = Math.sqrt(WINDOW_SIZE * (WINDOW_SIZE + 1) * ((2 * WINDOW_SIZE) + 1) / 6);
console.log(TIME_INTERVAL, WINDOW_SIZE, STANDARD_DEVIATION);

class ShitbotController {
	constructor(fidbot, message, enabled){
		this._fidbot = fidbot;
		this._channel = message.channel;
		this._shitbot = new Shitbot(fidbot.commandCharacter);
		this._active = false;
		this._enabled = enabled;
		this._windowFixed = [];
		this._windowSliding = [1];
		this._windowSlidingPostingUsers = [new Set()];
		this._windowSlidingPostingUsers[0].add(message.author.id);
		this._windowSlidingMessageContent = [''];
		this._endOfIntervalTimestamp = message.createdTimestamp + TIME_INTERVAL;
		this._postTimeInterval = 0;
		this._postWordCount = 0;
	}

	onNewMessage(message){
		this._shitbot.addPost(message.content);

		if (!this._enabled) {
			return;
		}

		// Create any necessary new entries
		while (this._endOfIntervalTimestamp <= message.createdTimestamp) {
			this._endOfIntervalTimestamp += TIME_INTERVAL;
			this._windowSliding.push(0);
			this._windowSlidingPostingUsers.push(new Set());
			this._windowSlidingMessageContent.push('');
		}

		// Update latest entry with new post information
		this._windowSliding[this._windowSliding.length - 1]++;
		this._windowSlidingPostingUsers[this._windowSlidingPostingUsers.length - 1].add(message.author.id);
		this._windowSlidingMessageContent[this._windowSlidingMessageContent.length - 1] += ' ' + message.content;

		// Trim windows if they have grown too large
		if (this._windowSliding.length > WINDOW_SIZE) {
			this._windowSliding = this._windowSliding.slice(this._windowSliding.length - WINDOW_SIZE);
			this._windowSlidingPostingUsers = this._windowSlidingPostingUsers.slice(this._windowSlidingPostingUsers.length - WINDOW_SIZE);
			this._windowSlidingMessageContent = this._windowSlidingMessageContent.slice(this._windowSlidingMessageContent.length - WINDOW_SIZE);

			// The first time the sliding windows have reached the length the fixed windows can be set
			if (!this._windowFixed.length) {
				this._windowFixed = this._windowSliding.slice();
			}
		}

		// If there are fixed windows then start doing stats on it
		if (this._windowFixed.length) {
			var statResults = ShitbotController._statTest(this._windowFixed, this._windowSliding);
			if (Math.abs(statResults) > STANDARD_DEVIATION) {
				// Change is upon us, go wild!
				this._windowFixed = this._windowSliding.slice();
				if (statResults > 0) {
					// Post rate increased
					this.activate();
				} else {
					this.deactivate();
				}
			}
		}
	}

	activate(){
		this._active = true;
		// Figure out the average user posting rate
		let userCount = (new Set([].concat(...this._windowSlidingPostingUsers.map(users => Array.from(users))))).size;
		let postCount = this._windowSliding.reduce((a, b)=>{
			return a + b;
		});
		let perUserPostCount = postCount / userCount;
		let totalTime = TIME_INTERVAL * WINDOW_SIZE;
		this._postTimeInterval = totalTime / perUserPostCount;
		// Figure out the average word count
		let mergedPostContent = this._windowSlidingMessageContent.reduce((a, b)=>{
			return a + b;
		});
		this._postWordCount = mergedPostContent.split(/\s/).filter(word =>{
			return word.length;
		}).length;
		this._postWordCount /= userCount;
		this._post();
	}

	deactivate(){
		this._active = false;
	}

	enable(){
		this._enabled = true;
	}

	disable(){
		this._enabled = false;
		this.deactivate();
	}

	static _statTest(sample1, sample2){
		let stats = [];
		for (let i = 0; i < sample1.length; i++) {
			let dif = sample2[i] - sample1[i];
			if (dif === 0) {
				continue;
			}
			stats.push({
				sgn: Math.sign(dif),
				abs: Math.abs(dif)
			});
		}
		stats.sort((a, b)=>{
			return a.abs - b.abs;
		});
		for (let i = 0; i < stats.length; i++) {
			stats[i].rank = i;
			// TODO correct for multiple entries with the same abs value
		}
		let statistic = 0;
		for (let i = 0; i < stats.length; i++) {
			statistic += stats[i].sgn * stats[i].rank;
		}
		return statistic;
	}

	_post(){
		if (this._active) {
			this._channel.sendMessage(this._shitbot.generatePost(this._postWordCount));
			let timeOut = (1 + Math.sqrt(Math.random()) * 0.5 * (Math.floor(Math.random() + 0.5) ? 1 : -1)) * this._postTimeInterval;
			setTimeout(this._post.bind(this), timeOut);
		}
	}
}

module.exports = ShitbotController;