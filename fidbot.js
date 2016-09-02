'use strict';

var Discord = require('discord.js');
var Dice = require('./js/dice.js');

var fidbot = new Discord.Client();
var dice = new Dice({
	maxCount: 100
});

fidbot.on('message', function(message){
	if (message.content.slice(0, 5) === '/dice') {
		fidbot.sendMessage(message.channel, dice.eval(message.content.slice(6)));
	}
});

fidbot.loginWithToken('token redacted');