# TrueSkill

A purely functional implementation of a TrueSkill-compatible ranking system compatible with your web browser and nodejs.

[![Build Status](https://travis-ci.org/izaakschroeder/com.izaakschroeder.trueskill.png?branch=master)](https://travis-ci.org/izaakschroeder/com.izaakschroeder.trueskill)

```
npm install com.izaakschroeder.trueskill
```


## Usage

Examples can be found in the examples folder.

```javascript
var 
	//Create TrueSkill instance with default parameters
	trueSkill = require('com.izaakschroeder.trueskill').create(),
	//Create some players
	players = [ { 
		name: 'Justin', 
		rating: trueSkill.createRating() 
	}, { 
		name: 'James',
		rating: trueSkill.createRating()
	} ];

//Play a single match and update the player ratings
function playMatch(results) {
	//Get the new ratings by creating one player teams for each player
	newRatings = trueSkill.update(players.map(function(player) { return [player.rating]; }), results);
	//Update the player's rating
	players.forEach(function(player, i) {
		player.rating = newRatings[i][0];
	});
}

//Show initial ratings
console.log('Initial ratings: Justin = '+players[0].rating.mu+', James = '+players[1].rating.mu);

//Play some games
playMatch([1,0]); //James wins
playMatch([0,1]); //Justin wins
playMatch([1,0]); //James wins
playMatch([1,0]); //James wins

//Show final ratings
console.log('Final ratings: Justin = '+players[0].rating.mu+', James = '+players[1].rating.mu);
```
