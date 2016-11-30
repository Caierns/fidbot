'use strict';

class Call {
	constructor(botClient){
		this._botClient = botClient;
	}

	call(message, parameters){
		parameters = parameters.join(' ').replace(/\n.*/g, '');
		let splitPoint = parameters.search(/ an? /i);
		let callName, callSlur;
		if (splitPoint > 0) {
			callName = parameters.slice(0, splitPoint).trim();
			callSlur = parameters.slice(splitPoint + 3).trim();
		}
		if (callName && callSlur) {
			callName = callName.charAt(0).toUpperCase() + callName.slice(1);
			if (/fidbot/i.test(callName) || callName === '<@' + this._botClient.user.id + '>') {
				callSlur = 'wonderful creation';
			}
			let yellNoun = callSlur.toUpperCase();
			let count;
			yellNoun = yellNoun.replace(/[AEIOUＡＥＩＯＵ⛎]/g, function(letter){
				count = 2 + Math.floor(Math.random() * 4);
				let ret = '';
				for (; count > 0; count--) {
					ret += letter;
				}
				return ret;
			});
			let trailingExclamationMarks = '';
			count = 1 + Math.floor(Math.random() * 3);
			for (; count > 0; count--) {
				trailingExclamationMarks += '!';
			}
			let determiner = 'a';
			if (/[aeiou]/i.test(callSlur.charAt(0))) {
				determiner = 'an';
			}

			message.channel.sendMessage(callName + ' is ' + determiner + ' ' + callSlur + '! ' + determiner.toUpperCase() + ' ' + yellNoun + trailingExclamationMarks);
		} else {
			message.reply("that was a malformed accusation!");
		}
	}
}

module.exports = Call;
