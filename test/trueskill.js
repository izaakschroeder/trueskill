
var 
	TrueSkill = require('com.izaakschroeder.trueskill'), 
	assert = require('assert'),
	precision = 10e-5;

describe('TrueSkill', function() {
	describe('#createRating', function() {
		it('default rating should be at 50%', function() {
			var ts = TrueSkill.create(), rank = ts.createRating();
			assert.ok(.50 - ts.betterThan(rank) < precision);
		});

		it('should create mu values', function() {
			var ts = TrueSkill.create();
			assert.ok(.75 - ts.betterThan(ts.createRating(0.75)) < precision);
			assert.ok(.25 - ts.betterThan(ts.createRating(0.25)) < precision);
			assert.ok(.33 - ts.betterThan(ts.createRating(0.33)) < precision);
		})
	});

	describe('#betterThan',function() {
		it('should rank ratings > mu to be > 0.5', function() {
			var ts = TrueSkill.create();
			assert.ok(ts.betterThan(ts.createRating()) < ts.betterThan(ts.createRating(0.6)));
		});

		it('should rank ratings < mu to be < 0.5', function() {
			var ts = TrueSkill.create();
			assert.ok(ts.betterThan(ts.createRating()) > ts.betterThan(ts.createRating(0.4)));
		});
	});

	describe('#update', function() {

	});

	describe('#quality', function() {
		it('should increase between equal players as their match count increases', function() {

		});
	});
})
