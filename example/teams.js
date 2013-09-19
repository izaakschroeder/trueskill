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
	}, {
		name: 'Karnal',
		rating: trueSkill.createRating()
	}, {
		name: 'Arbab',
		rating: trueSkill.createRating()
	}, {
		name: 'Max',
		rating: trueSkill.createRating()
	}, {
		name: 'Mannan',
		rating: trueSkill.createRating()
	} ];

//Play a single match and update the player ratings
function playMatch(results) {
	//Create the teams
	var teams = [
		[ players[0].rating, players[1].rating ],
		[ players[2].rating, players[3].rating ],
		[ players[4].rating, players[5].rating ]
	];
	//Get the new ratings using the results
	newRatings = trueSkill.update(teams, results);

	//Update the player's rating
	for (var i = 0; i < teams.length; ++i) {
		players[i*2].rating = newRatings[i][0];
		players[i*2+1].rating = newRatings[i][1];
	}
}

//Show initial ratings
console.log('Initial ratings: '+players.map(function(p) { return p.name + ' = ' + p.rating.mu; }).join(', '));

//Play some games
playMatch([0,2,1]); //Team 1 came in 1st, team 2 in 3rd, team 3 in 2nd
playMatch([1,1,0]); //Team 3 came in 1st, team 2 tied with team 1 for 2nd
playMatch([2,1,0]); //Team 1 came in 3rd, team 2 in 2rd, team 3 in 1st
playMatch([1,2,0]); //Team 1 came in 2nd, team 2 in 3rd, team 3 in 1st

//Show final ratings
console.log('After ratings: '+players.map(function(p) { return p.name + ' = ' + Math.round(p.rating.mu); }).join(', '));
