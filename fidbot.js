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
	var serverConfig = serverConfigs[server.id] || serverConfigs[DEFAULTSERVERNAME];
	var fidbotId = getUser(server, 'Fidbot').id;

	console.log(message.author.username + ': ' + messageContent);
	if (message.author.bot) {
		return;
	}

	if (messageContent.charAt(0) === '/' || messageContent.charAt(0) === '!') {
		var commandEndCharIndex = messageContent.indexOf(' ');
		var command = commandEndCharIndex !== -1 ? messageContent.slice(1, commandEndCharIndex) : messageContent.slice(1);
		var parameters = messageContent.slice(command.length + 2);
		switch (command) {
			case 'dice':
				var dice = new Dice(serverConfig.dice);
				fidbot.sendMessage(message.channel, dice.eval(parameters));
				break;
			case 'configureDice':
				var roleDiceMaster = getRole(server, 'DiceMaster');

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
			case 'call':
				parameters = parameters.replace(/\n.*/g, '');
				var splitPoint = parameters.toLowerCase().indexOf(' a ');
				var callName, callSlur;
				if (splitPoint > 0) {
					callName = parameters.slice(0, splitPoint).trim();
					callSlur = parameters.slice(splitPoint + 3).trim();
				}
				if (callName && callSlur) {
					callName = callName.charAt(0).toUpperCase() + callName.slice(1).toLowerCase();
					if (callName === 'Fidbot' || callName === '<@' + fidbotId + '>') {
						callSlur = 'wonderful creation';
					}
					var yellNoun = callSlur.toUpperCase();
					var count;
					yellNoun = yellNoun.replace(/[AEIOUＡＥＩＯＵ⛎]/g, function(letter){
						count = 2 + Math.floor(Math.random() * 4);
						var ret = '';
						for (; count > 0; count--) {
							ret += letter;
						}
						return ret;
					});
					var trailingExclamationMarks = '';
					count = 1 + Math.floor(Math.random() * 3);
					for (; count > 0; count--) {
						trailingExclamationMarks += '!';
					}

					fidbot.sendMessage(message.channel, callName + ' is a ' + callSlur + '! A ' + yellNoun + trailingExclamationMarks);
				} else {
					fidbot.reply(message, "that was a malformed accusation!");
				}
				break;
			case 'help':
				switch (parameters) {
					case 'akun':
						fidbot.sendMessage(message.channel, 'Use `/akun live` to view a list of quests that are currently live.\nUse `/akun livelink` to view a list of links to the quests that are currently live.');
						break;
					case 'call':
						fidbot.sendMessage(message.channel, 'Use `/call <X> a <Y>` to make Fidbot accuse X of being a Y.');
						break;
					case 'dice':
						fidbot.sendMessage(message.channel, 'Roll dice like you\'re on Akun. Dice are going to undergo a rewrite to expand functionality though, syntax might change after that.');
						break;
					default:
						fidbot.sendMessage(message.channel, 'Fidbot currently offers a limited selection of functionality. Type `/help <command>` to find out more about them.\nFollowing commands currently supported: `akun`, `dice`, `call`');
				}
				break;
			case 'kys':
			case 'killyourself':
			case 'kill':
				if (parameters.trim() === '' || parameters === 'yourself') {
					var killselfArray = [
						'you should probably just off yourself tbh fam',
						'just end yourself',
						'why even live?',
						'I bet your mother is real proud of you right now.',
						'make like a frog and reeeeeeeeeee'
					];
					fidbot.reply(message, killselfArray[Math.floor(Math.random() * killselfArray.length)]);
				} else {
					fidbot.reply(message, 'what did ' + parameters + ' ever do to you?!');
				}
				break;
			case 'wide':
				fidbot.sendMessage(message.channel, makeWide(parameters));
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
		// console.log(err);
	}
	serverConfigs[DEFAULTSERVERNAME] = defaultServerConfig;
};

var getRole = function(server, rolename){
	return server.roles.get('name', rolename);
};

var getUser = function(server, username){
	return server.members.get('username', username);
};

var makeWide = function(inputString){
	var normalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var wideChars = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ';
	return inputString.replace(/./g, function($0){
		var normalIndex = normalChars.indexOf($0);
		if (normalIndex >= 0) {
			return wideChars[normalIndex];
		} else {
			return $0;
		}
	})
};

loadServerConfigs();
fidbot.loginWithToken('MjIxMzMzMzA1MjAxNjU1ODA5.CqtUOA.HaFWJm4Po5RgHHZ43IC6YMQd7qw');