'use strict';

var http = require('http');

var Akun = function(){
};

Akun.prototype.eval = function(inputString, callback){
	inputString = inputString.trim();
	if (inputString === 'live' || inputString === 'livelink') {
		http.request({
			host: 'anonkun.com',
			path: '/api/anonkun/board/live',
			headers: {
				'Cookie': '__cfduid=d95fdab71be8cd3017fe3d6796bfed6931473093587; ajs_group_id=null; ajs_anonymous_id=%222cced225-0eea-4026-b2ad-d6ff046b4d51%22; loginToken=%7B%22loginToken%22%3A%22qTANYN89zyFKvyEQf%22%2C%22userId%22%3A%22C8x2fwWvtRvr4CyFm%22%7D; ajs_user_id=%22C8x2fwWvtRvr4CyFm%22'
			}
		}, function(response){
			var str = '';

			response.on('data', function(chunk){
				str += chunk;
			});

			response.on('end', function(){
				try {
					var json = JSON.parse(str);
				} catch (err) {
					console.log(err);
				}
				if (json['stories'] && Array.isArray(json['stories'])) {
					var output = '';
					for (var storyIndex = 0; storyIndex < json['stories'].length; storyIndex++) {
						var story = json['stories'][storyIndex];
						if (inputString === 'livelink') {
							// Wrapping links in angle brackets stops discord from previewing it
							output += '<https://anonkun.com/stories/' + story['t'].replace(/ /g, '_').replace('<br>', '') + '/' + story['_id'] + '>';
							if (storyIndex < json['stories'].length - 1) {
								output += '\n';
							}
						} else {
							output += story['t'].replace('<br>', '');
							if (storyIndex < json['stories'].length - 1) {
								output += ', ';
							}
						}
					}
					callback(output);
				} else {
					callback('Akun is being screwy.');
				}
			});
		}).end();
	}
};

module.exports = new Akun();
