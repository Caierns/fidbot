'use strict';

const fs = require('fs');
const Discord = require('discord.js');
const Commands = require('./js/commands.js');
const ConfigManager = require('./js/configure.js');
const ShitbotController = require('./js/shitbot/shitbotController');

const TOKEN = fs.readFileSync('./token', 'utf8').trim(); // Trim because linux


class Fidbot {
	constructor(token){
		this.client = new Discord.Client();
		this.configManager = new ConfigManager(this);
		this.commands = new Commands(this);
		this.commandCharacter = '/';
		this.shitbotControllers = {};

		this.client.on('ready', () =>{
			console.log('Ready!');
		});

		this.client.on('message', this._onMessage.bind(this));

		this.client.login(token).catch(console.log);
	}

	_onMessage(message){

		Fidbot._log(message);

		// Ignore bots
		if (message.author.bot) {
			return;
		}

		// Ignore direct messages to the bot
		if (!message.guild) {
			message.reply('I am not presently equipped to deal with direct communication. I am sorry.');
			return;
		}

		this.getShitbotController(message).onNewMessage(message);

		let config = this._getConfig(message);

		if (message.content.charAt(0) === this.commandCharacter) {
			this.commands.handle(message, message.content.slice(1).split(' '));
		} else {
			if (/alerni/i.test(message.content) && /slut/i.test(message.content)) {
				message.channel.sendMessage('A slut! A SLUUUUUUTTTTT!');
			}
			if (config.awoo.active) {
				if (/([^A-z]|^)a+[\s]*w+[\s]*o[\s]*o+/i.test(message.content)) {
					message.channel.sendFile('http://i.imgur.com/f7ipWKn.jpg').then(message =>{
						message.delete(2000);
					});
				}
			}
		}
	}

	getShitbotController(message){
		if (!this.shitbotControllers[message.channel.id]) {
			let config = this._getConfig(message);
			let isActive = ConfigManager.arrayHasElement(config.shitbot.active, message.channel.id);
			this.shitbotControllers[message.channel.id] = new ShitbotController(this, message, isActive);
		}
		return this.shitbotControllers[message.channel.id];
	}

	static _log(message){
		let logArray = [];
		logArray.push(getNiceTimestamp(message.createdAt));
		if (message.guild) {
			logArray.push(message.guild.name);
		} else {
			logArray.push('[[Guild missing]]');
		}
		logArray.push(message.channel.name);
		logArray.push(message.author.username + ': ' + message.content);
		console.log(logArray.join('|'));
	}

	_getConfig(message){
		return this.configManager.getConfig(message.guild.id);
	}
}

let getNiceTimestamp = function(date){
	let time = date || new Date();
	return '' + time.getFullYear() + '/' + padToTwo(time.getMonth()) + '/' + padToTwo(time.getDate()) + ' ' + padToTwo(time.getHours()) + ':' + padToTwo(time.getMinutes()) + ':' + padToTwo(time.getSeconds());
};

let padToTwo = function(input){
	input = input.toString();
	let infiniteLoopLimiter = 10000;
	while (input.length < 2 && infiniteLoopLimiter) {
		infiniteLoopLimiter--;
		input = '0' + input;
	}
	if (!infiniteLoopLimiter) {
		console.error('Maybe infinite loop hit in fidbot line 103:');
		console.error(input);
	}
	return input;
};

const fidbot = new Fidbot(TOKEN);
