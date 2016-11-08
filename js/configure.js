'use strict';

const fs = require('fs');
const path = require('path');

const DATA_PATH = 'data';

const recursiveAssign = (target, source)=>{
	for (let key in source) {
		if (source.hasOwnProperty(key)) {
			let isTargetValueObject = isObject(target[key]);
			let isSourceValueObject = isObject(source[key]);

			if (isTargetValueObject && isSourceValueObject) {
				recursiveAssign(target[key], source[key]);
			} else if (!isTargetValueObject && !isSourceValueObject) {
				target[key] = source[key];
			}
		}
	}
};

const isObject = (thing)=>{
	return (typeof thing === 'object' ) && ( thing !== null);
};

class Configuration {
	constructor(id){
		this._id = id;
		this._filename = id + '.json';
		this._filepath = path.join(DATA_PATH, this._filename);

		this._value = {
			akun: {
				active: true
			},
			call: {
				active: true
			},
			choice: {
				active: true
			},
			conf: {
				active: true
			},
			help: {
				active: true
			},
			kill: {
				active: true
			},
			roll: {
				maxCount: 100,
				active: true
			},
			wide: {
				active: true
			},
			awoo: {
				active: true
			},
			shitbot: {
				active: []
			}
		};

		this._load();

		for (let key in this._value) {
			if (this._value.hasOwnProperty(key)) {
				Object.defineProperty(this, key, {
					get: function(){
						return this._value[key];
					}
				});
			}
		}
	}

	save(){
		try {
			fs.accessSync(DATA_PATH);
		} catch (err) {
			fs.mkdirSync(DATA_PATH);
		}
		fs.writeFileSync(this._filepath, JSON.stringify(this._value));
	}

	_load(){
		let value;
		try {
			value = JSON.parse(fs.readFileSync(this._filepath, 'utf8'));
		} catch (err) {
			return false;
		}
		recursiveAssign(this._value, value);
	}

}

const COMMAND_NAME_TO_FRIENDLY_MAP = {
	'wide': 'Ｗｉｄｅ feature',
	'awoo': 'Awoo policing'
};

class ConfigManager {
	constructor(fidbot){
		this._fidbot = fidbot;
		this._configurations = {};
	}

	getConfig(id){
		if (!this._configurations[id]) {
			this._configurations[id] = new Configuration(id);
		}
		return this._configurations[id];
	}

	configure(message, commandName, parameters, config){
		if (!message.member) {
			message.reply('This has not been made to work here.');
			return;
		}
		if (message.member.hasPermission('ADMINISTRATOR') ||
			message.member.hasPermission('MANAGE_CHANNELS') ||
			message.member.hasPermission('MANAGE_GUILD')) {

			if (commandName === undefined) {
				message.reply('Please use `/configure <command name> on` or `/configure <command name> off` to toggle the feature!');
				return;
			}

			let reply;

			if (commandName === 'conf') {
				reply = `Let's not get all meta now.`;
			}
			let friendly = COMMAND_NAME_TO_FRIENDLY_MAP[commandName] || (commandName + ' feature');
			if (parameters[0] === 'on') {
				if (commandName === 'shitbot') {
					this._fidbot.getShitbotController(message).enable();
					if (parameters[1] === 'all') {
						config.shitbot.active = message.guild.channels.keyArray();
					} else {
						config.shitbot.active = ConfigManager.addElementToArray(config.shitbot.active, message.channel.id);
					}
				} else {
					config[commandName].active = true;
				}
				config.save();
				reply = `${friendly} activated!`;
			} else if (parameters[0] === 'off') {
				if (commandName === 'shitbot') {
					this._fidbot.getShitbotController(message).disable(); // TODO make this work for 'all'
					if (parameters[1] === 'all') {
						config.shitbot.active = [];
					} else {
						config.shitbot.active = ConfigManager.removeElementFromArray(config.shitbot.active, message.channel.id);
					}
				} else {
					config[commandName].active = false;
				}
				config.save();
				reply = `${friendly} deactivated.`;
			} else if (commandName === 'shitbot' && parameters[0] === 'now') {
				this._fidbot.getShitbotController(message).activate();
				return;
			} else if (commandName === 'shitbot' && parameters[0] === 'reset') {
				this._fidbot.getShitbotController(message).reset();
				reply = 'Shitbot data has been reset!';
			} else {
				reply = 'Please use `/configure ' + commandName + ' on` or `/configure ' + commandName + ' off` to toggle the feature!';
			}

			message.reply(reply);
		} else {
			message.reply('You do not have suitable permissions to do this!');
		}
	}

	static arrayHasElement(array, element){
		return array.indexOf(element) !== -1
	}

	static addElementToArray(array, element){
		if (array.indexOf(element) === -1) {
			array.push(element);
		}
		return array;
	}

	static removeElementFromArray(array, element){
		let index = array.indexOf(element);
		if (index !== -1) {
			return array.slice(0, index).concat(array.slice(index + 1));
		}
		return array;
	}
}

module.exports = ConfigManager;
