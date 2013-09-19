
var 
	TrueSkill = require('com.izaakschroeder.trueskill'), 
	assert = require('assert'),
	precision = 10e-6;

describe('TrueSkill', function() {
	describe('#createRating', function() {
		it('default rating should be at 50%', function() {
			var ts = TrueSkill.create(), rank = ts.createRating();
			assert.ok(.50 - ts.betterThan(rank) < precision);
		});
	});

	describe('#betterThan',function() {
		it('should rank ratings > mu to be > 0.5', function() {
			var ts = TrueSkill.create(), base = ts.createRating(), rank = ts.createRating(ts.mu+ts.sigma);
			assert.ok(ts.betterThan(base) < ts.betterThan(rank));
		});

		it('should rank ratings < mu to be < 0.5', function() {
			var ts = TrueSkill.create(), base = ts.createRating(), rank = ts.createRating(ts.mu-ts.sigma);
			assert.ok(ts.betterThan(base) > ts.betterThan(rank));
		});
	});

	describe('#update', function() {
		
	});

	describe('#quality', function() {
		it('should increase between equal players as their match count increases', function() {

		});
	});
})
