'use strict';

const ConfigManager = require('./configure.js');
const Akun = require('./akun/akun.js');
const Call = require('./call.js');
const wide = require('./wide.js').wide;
const kys = require('./kys.js').kys;
const Roll20 = require('./dice/dice.js');

const ALIASES = {
	'anonkun': 'akun',
	'configure': 'conf',
	'dice': 'roll',
	'killyourself': 'kill',
	'kys': 'kill'
};

class Commands {
	constructor(discordClient, configManager){
		this._bot = discordClient;
		this._configManager = configManager;
		this._call = new Call(this._bot);

		this._commands = {
			'akun': {
				helpText: 'Use `/akun live` to view a list of quests that are currently live.\n' +
				'Use `/akun livelink` to view a list of links to the quests that are currently live.\n' +
				'Use `/akun dice` to roll dice like you were on Anonkun.',
				features: {
					'live': Akun.live,
					'livelink': Akun.livelink,
					'dice': Akun.dice
				}
			},
			'call': {
				helpText: 'Use `/call <X> a <Y>` to make Fidbot accuse X of being a Y.',
				feature: (message, parameters)=>{
					this._call.call(message, parameters);
				}
			},
			'conf': {
				helpText: 'Use `/conf <feature>` to configure that feature.',
				feature: (message, parameters, config)=>{
					if (!message.member) {
						message.reply('This has not been made to work here.');
						return;
					}
					if (message.member.hasPermission('ADMINISTRATOR') ||
						message.member.hasPermission('MANAGE_CHANNELS') ||
						message.member.hasPermission('MANAGE_GUILD')) {
						let commandName = Commands._resolveCommandName(parameters[0]);
						let reply = ConfigManager.configure(config, commandName, parameters.slice(1));
						message.reply(reply);
					} else {
						message.reply('You do not have suitable permissions to do this!');
					}
				}
			},
			'help': {
				helpText: `Think you're real smart don't you.`,
				hidden: true,
				feature: (message, parameters)=>{
					let commandName = Commands._resolveCommandName(parameters[0]);
					if (this._commands[commandName]) {
						message.reply(this._commands[commandName].helpText);
					} else {
						message.reply(this._defaultHelpText);
					}
				}
			},
			'kill': {
				helpText: `I will not be complicit in such actions!`,
				hidden: true,
				feature: kys
			},
			'roll': {
				helpText: 'Basic syntax is `/roll XdY`. This is a semi-complete implementation of the roll20 spec, you can find details of how to use more complex rolls on <https://wiki.roll20.net/Dice_Reference>',
				feature: (message, parameters, config)=>{
					var roll20 = new Roll20(config.roll);

					let trailingComment = parameters.slice(1).join(' ').trim();

					var rollOutput = roll20.evaluate(parameters[0]);
					if (roll20.error) {
						message.reply(roll20.errorMessage);
					} else {
						message.reply(rollOutput + (trailingComment.length ? ' ' + trailingComment : ''));
					}
				}
			},
			'wide': {
				helpText: 'Use `/wide <text>` to make Fidbot say <ｔｅｘｔ>.',
				feature: wide
			}
		};

		this._defaultHelpText = 'Fidbot currently offers a limited selection of functionality. Type `/help <command>` to find out more about them.\n' +
			'Following commands currently supported: ' +
			Object.keys(this._commands).filter(commandName=>{
				return !this._commands[commandName].hidden;
			}).map(commandName=>{
				return '`' + commandName + '`'
			}).join(', ');
	}

	handle(message, parameters){
		let commandName = Commands._resolveCommandName(parameters[0]);
		let command = this._commands[commandName];

		if (command) {
			let config = this._configManager.getConfig(message.guild.id);
			if (!config[commandName].active) {
				return;
			}

			if (command.features && command.features[parameters[1]]) {
				command.features[parameters[1]](message, parameters.slice(2), config);
			} else if (command.feature) {
				command.feature(message, parameters.slice(1), config);
			} else {
				this._commands['help'].feature(message, [commandName], config);
			}
		} else {
			message.reply(`Unrecognised command!`);
		}
	}

	static _resolveCommandName(commandName){
		if (ALIASES[commandName]) {
			commandName = ALIASES[commandName];
		}
		return commandName;
	}

}

module.exports = Commands;
