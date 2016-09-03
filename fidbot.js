'use strict';

var fs = require('fs');
var Discord = require('discord.js');
var Dice = require('./js/dice.js');
var akun = require('./js/akun.js');

var fidbot = new Discord.Client();
var serverConfigs = {};
const DEFAULTSERVERNAME = 'defaultConfig';
const defaultServerConfig = {
	dice: {
		maxCount: 100
	}
};

fidbot.on('message', function(message){
	var messageContent = message.content;
	var server = message.server;
	var roles = server.roles;
	var serverConfig = serverConfigs[server.id] || serverConfigs[DEFAULTSERVERNAME];

	if (messageContent.charAt(0) === '/') {
		var command = messageContent.slice(1, messageContent.indexOf(' '));
		var parameters = messageContent.slice(command.length + 2);
		switch (command) {
			case 'dice':
				var dice = new Dice(serverConfig.dice);
				fidbot.sendMessage(message.channel, dice.eval(parameters));
				break;
			case 'configureDice':
				var roleDiceMaster = roles.get('name', 'DiceMaster');

				if (roleDiceMaster && message.author.hasRole(roleDiceMaster)) {
					confirmServerHasOwnConfig(server.id);
					serverConfigs[server.id].dice = {
						maxCount: parseInt(parameters, 10)
					};
					saveServerConfigs();
					fidbot.reply(message, 'Dice reconfigured!');
				} else {
					fidbot.reply(message, "I'm afraid I can't let you do that.");
				}
				break;
			case 'akun':
			case 'anonkun':
				akun.eval(parameters, function(output){
					fidbot.sendMessage(message.channel, output);
				});
				break;
			default:
			// fidbot.reply(message, "I didn't quite catch that I'm afraid.");
		}
	} else {
		if (/alerni/i.test(messageContent) && /slut/i.test(messageContent)) {
			fidbot.sendMessage(message.channel, 'A slut! A SLUUUUUUTTTTT!');
		}
	}
});

var confirmServerHasOwnConfig = function(serverId){
	if (serverConfigs[serverId] === undefined) {
		serverConfigs[serverId] = cloneObject(serverConfigs[DEFAULTSERVERNAME]);
	}
};

var cloneObject = function(object){
	return JSON.parse(JSON.stringify(object));
};

var saveServerConfigs = function(){
	try {
		fs.accessSync('./data');
	} catch (err) {
		fs.mkdirSync('./data');
	}
	fs.writeFileSync('./data/serverConfigs.json', JSON.stringify(serverConfigs));
};

var loadServerConfigs = function(){
	serverConfigs = {};
	try {
		var data = fs.readFileSync('./data/serverConfigs.json', 'utf8');
		serverConfigs = JSON.parse(data);
	} catch (err) {
		console.log(err);
	}
	serverConfigs[DEFAULTSERVERNAME] = defaultServerConfig;
};

loadServerConfigs();
fidbot.loginWithToken('MjIxMzMzMzA1MjAxNjU1ODA5.CqtUOA.HaFWJm4Po5RgHHZ43IC6YMQd7qw');