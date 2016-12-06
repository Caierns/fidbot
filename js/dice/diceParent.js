'use strict';

const child_process = require('child_process');
const path = require('path');
const filepathDiceChild = path.join('.', 'js', 'dice', 'diceChild.js');

const TIMEOUT_DURATION = 1000;

class DiceParent {
	static roll(config, parameters){
		return new Promise((resolve, reject) =>{
			let child = child_process.fork(filepathDiceChild);

			let timeout = setTimeout(() =>{
				child.kill();
				reject('The roll took too long to execute. Roll command was: ' + parameters.join(' '));
			}, TIMEOUT_DURATION);

			child.on('message', (message) =>{
				switch (message.status) {
					case 'success':
						if (timeout) {
							clearTimeout(timeout);
						}
						child.disconnect();
						resolve(message.data);
						break;
					case 'error':
						reject(message.cause);
						break;
					default:
						reject('DiceChild returned invalid message: ' + JSON.stringify(message));
				}
			});

			child.send({command: 'roll', config: config, parameters: parameters});

		});
	}
}

module.exports = DiceParent;
