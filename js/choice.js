'use strict';

class Choice {
	static choice(message, parameters){
		let choices = parameters.join(' ').split(';').map(choice=>{
			return choice.trim();
		}).filter(choice=>{
			return choice.length;
		});
		if (choices.length) {
			let choice = choices[Math.floor(Math.random() * choices.length)];
			message.reply(choice);
		}else{
			message.reply(`C'mon, gimme something to work with here...`);
		}
	}
}

module.exports = Choice;
