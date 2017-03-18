'use strict';

const https = require('https');
const querystring = require('querystring');
const Dice = require('./dice.js');

const HOSTNAME = 'anonkun.com';
const COOKIE = '__cfduid=d95fdab71be8cd3017fe3d6796bfed6931473093587; ' +
	'ajs_group_id=null; ' +
	'ajs_anonymous_id=%222cced225-0eea-4026-b2ad-d6ff046b4d51%22; ' +
	'loginToken=%7B%22loginToken%22%3A%22qTANYN89zyFKvyEQf%22%2C%22userId%22%3A%22C8x2fwWvtRvr4CyFm%22%7D; ' +
	'ajs_user_id=%22C8x2fwWvtRvr4CyFm%22';

class Akun {
	static live(message, parameters) {
		if (parameters[0] === 'link') {
			Akun.livelink(message, parameters.slice(1));
		} else {
			Akun._get('/api/anonkun/board/live').then(responseJson => {
				let reply = 'Akun is being screwy.';
				if (responseJson['stories'] && Array.isArray(responseJson['stories'])) {
					reply = Akun._storiesToTitleList(responseJson['stories']);
				}
				message.channel.sendMessage(reply);
			}).catch(err => {
				message.reply(Akun._errorMessage(err));
			});
		}
	}

	static livelink(message, parameters) {
		Akun._get('/api/anonkun/board/live').then(responseJson => {
			let reply = 'Akun is being screwy.';
			if (responseJson['stories'] && Array.isArray(responseJson['stories'])) {
				reply = Akun._storiesToLinkList(responseJson['stories']);
			}
			message.channel.sendMessage(reply);
		}).catch(err => {
			message.reply(Akun._errorMessage(err));
		});
	}

	static dice(message, parameters) {
		message.reply(Dice.evaluate(parameters.join(' ')));
	}

	static _errorMessage(err) {
		return `Something went wrong: ${err}`;
	};

	static _storiesToLinkList(stories) {
		return stories.map(story => {
			// Wrapping links in angle brackets stops discord from previewing it
			return `<https://${HOSTNAME}/stories/${story['t'].replace(/ /g, '_').replace('<br>', '')}/${story['_id']}>`;
		}).join('\n');
	}

	static _storiesToTitleList(stories) {
		return stories.map(story => {
			return story['t'].replace('<br>', '');
		}).join(', ');
	}

	static _get(path) {
		let options = {
			hostname: HOSTNAME,
			path: path,
			method: 'GET',
			headers: {
				'Cookie': COOKIE
			}
		};
		return Akun._request(options);
	}

	static _post(path, postData) {
		let postDataString = querystring.stringify(postData);
		let options = {
			hostname: HOSTNAME,
			path: path,
			method: 'POST',
			headers: {
				'Cookie': COOKIE,
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(postDataString)
			}
		};
		return Akun._request(options, postDataString);
	}

	static _request(options, postDataString) {
		return new Promise((resolve, reject) => {
			let request = https.request(options, response => {
				let str = '';

				response.on('data', chunk => {
					str += chunk;
				});

				response.on('end', () => {
					try {
						let json = JSON.parse(str);
						resolve(json);
					} catch (err) {
						reject(err);
					}
				});
			});

			request.on('error', e => reject);
			if (postDataString) {
				request.write(postDataString);
			}
			request.end();
		});
	}
}

module.exports = Akun;
