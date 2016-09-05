'use strict';

var fs = require('fs');
var Discord = require('discord.js');
var Dice = require('./js/dice/dice.js');
var akun = require('./js/akun.js');

var fidbot = new Discord.Client();
var guildConfigs = {};
const DEFAULTGUILDNAME = 'defaultConfig';
const defaultGuildConfig = {
	commands: {
		dice: {
			maxCount: 100
		},
		call: {
			active: true
		},
		wide: {
			active: true
		},
		akun: {
			active: true
		},
		kill: {
			active: true
		}
	},
	awoo: {
		active: true
	}
};

fidbot.on('message', function(message){
	var messageContent = message.content;
	var guildConfig = guildConfigs[message.guild.id] || guildConfigs[DEFAULTGUILDNAME];

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
				var dice = new Dice(guildConfig.commands.dice);
				message.channel.sendMessage(dice.evalAkun(parameters));
				break;
			case 'roll':
				var roll = new Dice(guildConfig.commands.dice);

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
			case 'conf':
			case 'config':
			case 'configure':
				configure(parameters, message);
				break;
			case 'akun':
			case 'anonkun':
				if (guildConfig.commands.akun.active) {
					akun.eval(parameters, function(output){
						message.channel.sendMessage(output);
					});
				}
				break;
			case 'call':
				if (guildConfig.commands.call.active) {
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
					case 'conf':
						message.channel.sendMessage('Use `/conf <feature>` to configure that feature.');
						break;
					default:
						message.channel.sendMessage('Fidbot currently offers a limited selection of functionality. Type `/help <command>` to find out more about them.\nFollowing commands currently supported: `akun`, `dice`, `call`, `wide`, `conf`');
				}
				break;
			case 'kys':
			case 'killyourself':
			case 'kill':
				if (guildConfig.commands.kill.active) {
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
				}
				break;
			case 'wide':
				if (guildConfig.commands.wide.active) {
					message.channel.sendMessage(makeWide(parameters));
				}
				break;
			default:
			// message.reply( "I didn't quite catch that I'm afraid.");
		}
	} else {
		if (/alerni/i.test(messageContent) && /slut/i.test(messageContent)) {
			message.channel.sendMessage('A slut! A SLUUUUUUTTTTT!');
		}
		if (guildConfig.awoo.active) {
			if (/([^A-z]|^)a+w+o{2,}/i.test(messageContent)) {
				message.channel.sendFile('http://i.imgur.com/f7ipWKn.jpg').then(function(message){
					message.delete(2000);
				});
			}
		}
	}
});

var configure = function(inputString, message){
	if (inputString === '') {
		message.reply("Please specify something to configure.");
		return;
	}

	inputString = inputString.toLowerCase();
	var guildConfig = guildConfigs[message.guild.id] || guildConfigs[DEFAULTGUILDNAME];

	var commandEndCharIndex = inputString.indexOf(' ');
	var command = commandEndCharIndex !== -1 ? inputString.slice(0, commandEndCharIndex) : inputString.slice(0);
	var parameters = inputString.slice(command.length + 1).trim();

	var roleBotMasterId = message.guild.roles.find('name', 'BotMaster');
	roleBotMasterId = roleBotMasterId ? roleBotMasterId.id : null;
	var roleDiceMasterId = message.guild.roles.find('name', 'DiceMaster');
	roleDiceMasterId = roleDiceMasterId ? roleDiceMasterId.id : null;

	var userCanConfigureBot = roleBotMasterId && message.member.roles.exists('id', roleBotMasterId);
	var userCanConfigureDice = userCanConfigureBot || roleDiceMasterId && message.member.roles.exists('id', roleDiceMasterId);

	if (!userCanConfigureBot && !userCanConfigureDice) {
		message.reply("I'm afraid I can't let you do that.");
		return;
	}

	if (userCanConfigureBot) {
		switch (command) {
			case 'awoo':
				if (parameters === 'on') {
					guildConfig.awoo.active = true;
					message.reply('Awoo policing activated!');
				} else if (parameters === 'off') {
					guildConfig.awoo.active = false;
					message.reply('Awoo policing deactivated!');
				} else {
					message.reply('Please use `/configure awoo on` or `/configure awoo off` to toggle the command!');
				}
				break;
			case 'call':
				if (parameters === 'on') {
					guildConfig.commands.call.active = true;
					message.reply('Name calling activated!');
				} else if (parameters === 'off') {
					guildConfig.commands.call.active = false;
					message.reply('Name calling deactivated!');
				} else {
					message.reply('Please use `/configure call on` or `/configure call off` to toggle the command!');
				}
				break;
			case 'wide':
				if (parameters === 'on') {
					guildConfig.commands.wide.active = true;
					message.reply('Ｗｉｄｅ activated!');
				} else if (parameters === 'off') {
					guildConfig.commands.wide.active = false;
					message.reply('Ｗｉｄｅ deactivated!');
				} else {
					message.reply('Please use `/configure wide on` or `/configure wide off` to toggle the command!');
				}
				break;
			case 'akun':
				if (parameters === 'on') {
					guildConfig.commands.akun.active = true;
					message.reply('Akun utility activated!');
				} else if (parameters === 'off') {
					guildConfig.commands.akun.active = false;
					message.reply('Akun utility deactivated!');
				} else {
					message.reply('Please use `/configure akun on` or `/configure akun off` to toggle the command!');
				}
				break;
			case 'kill':
				if (parameters === 'on') {
					guildConfig.commands.kill.active = true;
					message.reply('Kill suggestions activated!');
				} else if (parameters === 'off') {
					guildConfig.commands.kill.active = false;
					message.reply('Kill suggestions deactivated!');
				} else {
					message.reply('Please use `/configure kill on` or `/configure kill off` to toggle the command!');
				}
				break;
			case 'dice': // Next bit handles dice config
				break;
			default:
				message.reply('Option not recognised.');
		}
	}
	if (userCanConfigureDice) {
		if (command === 'dice') {
			confirmGuildHasOwnConfig(message.guild.id);
			guildConfig.commands.dice = {
				maxCount: parseInt(parameters, 10)
			};
			message.reply('Dice reconfigured!');
		} else if (!userCanConfigureBot) {
			message.reply("I'm afraid I can't let you do that.");
		}
	}
	saveGuildConfigs();
};

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