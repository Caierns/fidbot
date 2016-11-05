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
				active: false
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
	constructor(){
		this._configurations = {};
	}

	getConfig(id){
		if (!this._configurations[id]) {
			this._configurations[id] = new Configuration(id);
		}
		return this._configurations[id];
	}

	static configure(config, commandName, parameters){
		if (commandName === 'conf') {
			return `Let's not get all meta now.`;
		}
		let friendly = COMMAND_NAME_TO_FRIENDLY_MAP[commandName] || (commandName + ' feature');
		if (parameters[0] === 'on') {
			config[commandName].active = true;
			config.save();
			return `${friendly} activated!`;
		} else if (parameters[0] === 'off') {
			config[commandName].active = false;
			config.save();
			return `${friendly} deactivated.`;
		} else {
			return 'Please use `/configure ' + commandName + ' on` or `/configure ' + commandName + ' off` to toggle the feature!';
		}
	}
}

module.exports = ConfigManager;
