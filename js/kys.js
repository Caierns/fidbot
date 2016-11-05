'use strict';

const kysPhrases = [
	'you should probably just off yourself tbh fam',
	'just end yourself',
	'why even live?',
	'I bet your mother is real proud of you right now.',
	'make like a frog and reeeeeeeeeee'
];

class Kys {
	static kys(message, parameters){
		if (parameters[0] !== undefined) {
			message.reply('what did ' + parameters.join(' ') + ' ever do to you?!');
		} else {
			message.reply(kysPhrases[Math.floor(Math.random() * kysPhrases.length)]);
		}
	}
}

module.exports = Kys;
