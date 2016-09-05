'use strict';

var fs = require('fs');
var Discord = require('discord.js');
var Dice = require('./js/dice/dice.js');
var akun = require('./js/akun.js');

var fidbot = new Discord.Client();
var guildConfigs = {};
const DEFAULTGUILDNAME = 'defaultConfig';
const defaultGuildConfig = {
	dice: {
		maxCount: 100
	}
};

fidbot.on('message', function(message){
	var messageContent = message.content;
	var guild = message.guild;
	var guildConfig = guildConfigs[guild.id] || guildConfigs[DEFAULTGUILDNAME];

	console.log(message.guild.name + '|' + message.channel.name + '|' + message.author.username + ': ' + messageContent);
	if (message.author.bot) {
		return;
	}

	if (messageContent.charAt(0) === '/') {
		var commandEndCharIndex = messageContent.indexOf(' ');
		var command = commandEndCharIndex !== -1 ? messageContent.slice(1, commandEndCharIndex) : messageContent.slice(1);
		var parameters = messageContent.slice(command.length + 2);
		switch (command) {
			case 'dice':
				var dice = new Dice(guildConfig.dice);
				message.channel.sendMessage(dice.evalAkun(parameters));
				break;
			case 'roll':
				var roll = new Dice(guildConfig.dice);

				// First split off any trailing comment. The dice command should be a single word, so first space is where to split
				var inputCommand, trailingComment;
				var commentSplitIndex = parameters.indexOf(' ');
				if (commentSplitIndex > -1) {
					inputCommand = parameters.slice(0, commentSplitIndex);
					trailingComment = ' ' + parameters.slice(commentSplitIndex).trim();
				} else {
					inputCommand = parameters;
					trailingComment = '';
				}

				var rollOutput = roll.eval(inputCommand.trim());
				if (roll.error) {
					message.channel.sendMessage(roll.errorMessage);
				} else {
					message.channel.sendMessage(rollOutput + trailingComment);
				}

				break;
			case 'configureDice':
				var roleDiceMasterId = guild.roles.find('name', 'DiceMaster').id;

				if (roleDiceMasterId && message.member.roles.exists('id', roleDiceMasterId)) {
					confirmGuildHasOwnConfig(guild.id);
					guildConfigs[guild.id].dice = {
						maxCount: parseInt(parameters, 10)
					};
					saveGuildConfigs();
					message.reply('Dice reconfigured!');
				} else {
					message.reply("I'm afraid I can't let you do that.");
				}
				break;
			case 'akun':
			case 'anonkun':
				akun.eval(parameters, function(output){
					message.channel.sendMessage(output);
				});
				break;
			case 'call':
				parameters = parameters.replace(/\n.*/g, '');
				var splitPoint = parameters.search(/ an? /i);
				var callName, callSlur;
				if (splitPoint > 0) {
					callName = parameters.slice(0, splitPoint).trim();
					callSlur = parameters.slice(splitPoint + 3).trim();
				}
				if (callName && callSlur) {
					callName = callName.charAt(0).toUpperCase() + callName.slice(1);
					if (/fidbot/i.test(callName) || callName === '<@' + this.user.id + '>') {
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
					var determiner = 'a';
					if (/[aeiou]/i.test(callSlur.charAt(0))) {
						determiner = 'an';
					}

					message.channel.sendMessage(callName + ' is ' + determiner + ' ' + callSlur + '! ' + determiner.toUpperCase() + ' ' + yellNoun + trailingExclamationMarks);
				} else {
					message.reply("that was a malformed accusation!");
				}
				break;
			case 'help':
				switch (parameters) {
					case 'akun':
						message.channel.sendMessage('Use `/akun live` to view a list of quests that are currently live.\nUse `/akun livelink` to view a list of links to the quests that are currently live.');
						break;
					case 'call':
						message.channel.sendMessage('Use `/call <X> a <Y>` to make Fidbot accuse X of being a Y.');
						break;
					case 'dice':
						message.channel.sendMessage('Roll dice like you\'re on Akun. Dice are going to undergo a rewrite to expand functionality though, syntax might change after that.');
						break;
					case 'wide':
						message.channel.sendMessage('Use `/wide <text>` to make Fidbot say <ｔｅｘｔ>.');
						break;
					default:
						message.channel.sendMessage('Fidbot currently offers a limited selection of functionality. Type `/help <command>` to find out more about them.\nFollowing commands currently supported: `akun`, `dice`, `call`, `wide`');
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
					message.reply(killselfArray[Math.floor(Math.random() * killselfArray.length)]);
				} else {
					message.reply('what did ' + parameters + ' ever do to you?!');
				}
				break;
			case 'wide':
				message.channel.sendMessage(makeWide(parameters));
				break;
			default:
			// message.reply( "I didn't quite catch that I'm afraid.");
		}
	} else {
		if (/alerni/i.test(messageContent) && /slut/i.test(messageContent)) {
			message.channel.sendMessage('A slut! A SLUUUUUUTTTTT!');
		}
		if (/([^A-z]|^)a+w+o{2,}/i.test(messageContent)) {
			message.channel.sendFile('http://i.imgur.com/f7ipWKn.jpg').then(function(message){
				message.delete(2000);
			});
		}
	}
});

var confirmGuildHasOwnConfig = function(guildId){
	if (guildConfigs[guildId] === undefined) {
		guildConfigs[guildId] = cloneObject(guildConfigs[DEFAULTGUILDNAME]);
	}
};

var cloneObject = function(object){
	return JSON.parse(JSON.stringify(object));
};

var saveGuildConfigs = function(){
	try {
		fs.accessSync('./data');
	} catch (err) {
		fs.mkdirSync('./data');
	}
	fs.writeFileSync('./data/guildConfigs.json', JSON.stringify(guildConfigs));
};

var loadGuildConfigs = function(){
	guildConfigs = {};
	try {
		var data = fs.readFileSync('./data/guildConfigs.json', 'utf8');
		guildConfigs = JSON.parse(data);
	} catch (err) {
		// console.log(err);
	}
	guildConfigs[DEFAULTGUILDNAME] = defaultGuildConfig;
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

loadGuildConfigs();
fidbot.login('MjIxMzMzMzA1MjAxNjU1ODA5.CqtUOA.HaFWJm4Po5RgHHZ43IC6YMQd7qw');