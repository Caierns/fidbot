'use strict';

var Discord = require('discord.js');
var Dice = require('./js/dice.js');

var fidbot = new Discord.Client();
var dice = new Dice({
	maxCount: 100
});

fidbot.on('message', function(message){
	var messageContent = message.content;
	if (messageContent.slice(0, 5) === '/dice') {
		fidbot.sendMessage(message.channel, dice.eval(messageContent.slice(6)));
	} else if (/alerni/i.test(messageContent) && /slut/i.test(messageContent)) {
		fidbot.sendMessage(message.channel, 'A slut! A SLUUUUUUTTTTT!');
	}
});

fidbot.loginWithToken('MjIxMzMzMzA1MjAxNjU1ODA5.CqtUOA.HaFWJm4Po5RgHHZ43IC6YMQd7qw');