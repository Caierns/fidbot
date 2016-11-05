'use strict';

const fs = require('fs');
const Discord = require('discord.js');
const Commands = require('./js/commands.js');
const ConfigManager = require('./js/configure.js');
const ShitbotController = require('./js/shitbot/shitbotController');

const TOKEN = fs.readFileSync('./token', 'utf8').trim(); // Trim because linux
const fidbot = new Discord.Client();
const configManager = new ConfigManager();
const commands = new Commands(fidbot, configManager);
const COMMAND_CHARACTER = '/';
let shitbotControllers = {};

fidbot.on('message', message=>{

	// Ignore bots
	if (message.author.bot) {
		console.log(getNiceTimestamp(message.createdAt) + '|' + (message.guild && message.guild.name) + '|' + message.channel.name + '|' + message.author.username + ': ' + message.content);
		return;
	}

	// Ignore direct messages to the bot
	if (!message.guild) {
		message.reply('I am not presently equipped to deal with direct communication. I am sorry.');
		console.log(getNiceTimestamp(message.createdAt) + '|' + '[[Guild missing]]' + '|' + message.channel.name + '|' + message.author.username + ': ' + message.content);
		return;
	}

	let config = configManager.getConfig(message.guild.id);

	if (message.channel && message.channel.id) {
		let channelId = message.channel.id;
		let shitbotController = shitbotControllers[channelId] = shitbotControllers[channelId] || new ShitbotController(message, config.shitbot.active);
		shitbotController.onNewMessage(message);
	}

	console.log(getNiceTimestamp(message.createdAt) + '|' + message.guild.name + '|' + message.channel.name + '|' + message.author.username + ': ' + message.content);

	if (message.content.charAt(0) === COMMAND_CHARACTER) {
		commands.handle(message, message.content.slice(1).split(' '));
	} else {
		if (/alerni/i.test(message.content) && /slut/i.test(message.content)) {
			message.channel.sendMessage('A slut! A SLUUUUUUTTTTT!');
		}
		if (config.awoo.active) {
			if (/([^A-z]|^)a+[\s]*w+[\s]*o[\s]*o+/i.test(message.content)) {
				message.channel.sendFile('http://i.imgur.com/f7ipWKn.jpg').then(message=>{
					message.delete(2000);
				});
			}
		}
	}
});

var getNiceTimestamp = function(date){
	var time = date || new Date();
	return '' + time.getFullYear() + '/' + padToTwo(time.getMonth()) + '/' + padToTwo(time.getDate()) + ' ' + padToTwo(time.getHours()) + ':' + padToTwo(time.getMinutes()) + ':' + padToTwo(time.getSeconds());
};

var padToTwo = function(input){
	input = input.toString();
	while (input.length < 2) {
		input = '0' + input;
	}
	return input;
};

fidbot.login(TOKEN).catch(console.log);
