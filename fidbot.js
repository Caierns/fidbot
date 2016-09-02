'use strict';

var fs = require('fs');
var Discord = require('discord.js');
var Dice = require('./js/dice.js');

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

	if (messageContent.slice(0, 5) === '/dice') {
		var dice = new Dice(serverConfig.dice);
		fidbot.sendMessage(message.channel, dice.eval(messageContent.slice(6)));
	} else if (messageContent.slice(0, 14) === '/configureDice') {
		var roleDiceMaster = roles.get('name', 'DiceMaster');

		if (roleDiceMaster && message.author.hasRole(roleDiceMaster)) {
			confirmServerHasOwnConfig(server.id);
			serverConfigs[server.id].dice = {
				maxCount: parseInt(messageContent.slice(15), 10)
			};
			saveServerConfigs();
			fidbot.reply(message, 'Dice reconfigured!');
		} else {
			fidbot.reply(message, "I'm afraid I can't let you do that.");
		}
	} else if (/alerni/i.test(messageContent) && /slut/i.test(messageContent)) {
		fidbot.sendMessage(message.channel, 'A slut! A SLUUUUUUTTTTT!');
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