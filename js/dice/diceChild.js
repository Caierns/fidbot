'use strict';

const Roll20 = require('./dice.js');

let sendSuccess = (data) =>{
	process.send({status: 'success', data: data});
};

let sendError = (cause) =>{
	process.send({status: 'error', cause: cause});
};

let roll = (config, parameters) =>{
	let roll20 = new Roll20(config);

	let trailingComment = parameters.slice(1).join(' ').trim();

	let rollOutput = roll20.evaluate(parameters[0]);
	if (roll20.error) {
		sendError(roll20.errorMessage);
	} else {
		sendSuccess(rollOutput + (trailingComment.length ? ' ' + trailingComment : ''));
	}
};

process.on('disconnect', () =>{
	process.exit(0);
});

process.on('message', (message) =>{
	switch (message.command) {
		case'roll':
			roll(message.config, message.parameters);
			break;
		default:
			sendError('Command invalid');
	}
});
