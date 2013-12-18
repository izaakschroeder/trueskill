/**
 *
 *
 *
 */

if (typeof define !== 'function') { var define = require('amdefine')(module) };

define(['./matrix'], function(Matrix) {

	"use strict";

	/**
	 *
	 *
	 *
	 */
	function TrueSkill(mu, sigma, beta, tau) {
		if (this instanceof TrueSkill === false) 
			return new TrueSkill(mu, sigma, beta, tau);
		this.mu = mu || 25;
		this.sigma = sigma || this.mu / 3;
		this.beta = beta || this.sigma / 2;
		this.tau = tau || this.sigma / 100;
	}

	/**
	 *
	 *
	 *
	 */
	TrueSkill.create = function(mu, sigma, beta, tau) {
		return new TrueSkill(mu, sigma, beta, tau);
	}

	TrueSkill.erfinv = function(x){
		if(0 != x) {
			var ln_1minus_x_sqrd = Math.log(1-x*x);
			var ln_1minusxx_by_a = ln_1minus_x_sqrd / 0.147;
			var ln_1minusxx_by_2 = ln_1minus_x_sqrd / 2;
			var ln_etc_by2_plus2 = ln_1minusxx_by_2 + (2/(Math.PI * 0.147));
			var first_sqrt = Math.sqrt((ln_etc_by2_plus2*ln_etc_by2_plus2)-ln_1minusxx_by_a);
			var second_sqrt = Math.sqrt(first_sqrt - ln_etc_by2_plus2);
			return x > 0 ? second_sqrt : -second_sqrt;
		} 
		else {
			return 0
		}
	}

	/**
	 *
	 *
	 *
	 */
	TrueSkill.erf = function(x) {
		var t = 1.0 / (1.0 + 0.5 * Math.abs(x));
		return (x > 0 ? 1 : -1) * (1 - t * Math.exp(-x * x -
			1.26551223 + t * (1.00002368 + t * (
			0.37409196 + t * (0.09678418 + t * (
			-0.18628806 + t * (0.27886807 + t * (
			-1.13520398 + t * (1.48851587 + t * (
			-0.82215223 + t * 0.17087277))))))))));
	}

	/**
	 *
	 *
	 *
	 */
	TrueSkill.cdf = function(x, mu, sigma) {
		return 0.5 * (1 + TrueSkill.erf((x - mu) / (sigma * Math.sqrt(2))));
	}

	/**
	 *
	 *
	 *
	 */
	TrueSkill.pdf = function(x, mu, sigma) {
		return (1 / Math.sqrt(2 * Math.PI) * Math.abs(sigma) * Math.exp(-(Math.pow((x - mu) / Math.abs(sigma), 2) / 2)));
	}

	/**
	 *
	 *
	 *
	 */
	TrueSkill.probit = function(p, mu, sigma) {
		return mu + sigma*Math.sqrt(2)*TrueSkill.erfinv(2*p - 1)
	}

	/**
	 * Create a new rating as one which is better than x%
	 * of the population or 50% if not given.
	 *
	 */
	TrueSkill.prototype.createRating = function(x, sigma) {
		return { mu: x ? TrueSkill.probit(x, this.mu, this.sigma) : this.mu, sigma: sigma || this.sigma };
	}

	/**
	 *
	 *
	 *
	 */
	TrueSkill.prototype.expose = function(rating) {
		return rating.mu - (this.mu / this.beta) * rating.sigma
	}

	/**
	 * The update factor for wins/ties/losses.
	 *
	 *
	 */
	TrueSkill.score = function(a, b) {
		if (a > b)
			return 1;
		else if (a === b)
			return 0.5;
		else
			return 0;
	}

	/**
	 * Determine the percentage of the population a given
	 * rating is expected to perform better than.
	 *
	 */
	TrueSkill.prototype.betterThan = function(rating) {
		return TrueSkill.cdf(rating.mu, this.mu, this.sigma);
	}

	/**
	 * Create a single rating that punishes members with higher
	 * variances.
	 *
	 */
	TrueSkill.prototype.augmentedRatings = function(teams, _partials) {
		var self = this, partials = _partials || function(){ return 1; };
		return teams.map(function(a) {
			return TrueSkill.cdf(a.reduce(function(a,b,i) { 
				return a + self.expose(b) * partials(b); 
			}, 0), self.mu, self.sigma);
		});
	}

	/**
	 * Estimate the fairness of a particular match based on how
	 * close all the teams' win-chances are.
	 *
	 */
	TrueSkill.prototype.fairness = function(teams, _partials) {
		return this.winChances(teams, _partials).reduce(function(fairness, x) {
			return fairness * (1 - Math.abs(1/teams.length - x));
		}, 1);
	}

	/**
	 * Estimate the win chances of a particular set of teams based
	 * on their "better-than-ness".
	 *
	 */
	TrueSkill.prototype.winChances = function(teams, _partials) {
		var powers = this.augmentedRatings(teams, _partials), totalPower = powers.reduce(function(a,b) {
			return a+b;
		});
		return powers.map(function(p) {
			return p/totalPower;
		})
	}

	/**
	 * Calculate the updates to player ratings that would
	 * be performed given a particular set of ranks and partials.
	 *
	 */
	TrueSkill.prototype.deltas = function(teams, ranks, _partials) {
		var beta = this.beta, tau = this.tau, partials = _partials || function(){ return 1; };
		return teams.map(function(a) {
			return {
				players: a,
				sigmasq: a.reduce(function(a,b,i) { return a + (Math.pow(tau, 2)+Math.pow(b.sigma,2))*Math.pow(partials(b),2) + tau; }, 0),
				mu: a.reduce(function(a,b,i) { return a + b.mu * partials(b); }, 0)
			}
		}).map(function(a, i, teams) {
			var update = teams.reduce(function(result, b, j) {
				if (a === b) return result;
				var 
					ciq = Math.sqrt(a.sigmasq + b.sigmasq + 2*beta*beta),
					piq = 1/(1+Math.exp((b.mu-a.mu)/ciq)),
					sigsqToCiq = a.sigmasq/ciq,
					gamma = Math.sqrt(a.sigmasq)/ciq;
				return { 
					omega: result.omega + sigsqToCiq*(TrueSkill.score(ranks[j],ranks[i])-piq),
					delta: result.delta + gamma*sigsqToCiq/ciq*piq*(1-piq)
				}
			}, { omega: 0, delta: 0 });


			return a.players.map(function(p) {
				var sigmasq = p.sigma * p.sigma;
				return { 
					mu: sigmasq/a.sigmasq*update.omega,
					sigma: Math.sqrt(Math.max(1-sigmasq/a.sigmasq*update.delta, 0.0001))
				}
			})
			
		})
	}

	/**
	 * Update player ratings given a particular set of ranks and
	 * partials.
	 *
	 */
	TrueSkill.prototype.update = function(teams, ranks, _partials) {
		return this.deltas(teams, ranks, _partials).map(function(players, i) {
			return players.map(function(rating, j) {
				return { mu: rating.mu + teams[i][j].mu, sigma: rating.sigma*teams[i][j].sigma }
			})
		})
	}

	/**
	 * Determine the quality of a match as the probability all
	 * teams will tie with one another.
	 *
	 */
	TrueSkill.prototype.quality = function(teams, _partials) {
		var 
			players = teams.reduce(function(a, b) { return a.concat(b); }, []),
			u = Matrix.create(players.map(function(p) { return [p.mu] })),
			E = Matrix.diagonal(players.map(function(p) { return p.sigma*p.sigma; })),
			B2 = this.beta * this.beta,
			teamPairs = teams.map(function(team, i) {
				return { left: team, right: teams[i+1] }
			}).slice(0,-1),
			partials = _partials || function() { return 1; },
			A = Matrix.create(players.map(function(p) { 
				return teamPairs.map(function(pair) {
					if (!~pair.left.indexOf(p))
						return -partials(p)
					else if (!~pair.right.indexOf(p))
						return partials(p)
					else
						return 0;
				});
			})),
			AT = A.transpose(),
			B2ATA = AT.multiply(B2).multiply(A),
			ATEA = AT.multiply(E).multiply(A),
			middle = B2ATA.add(ATEA),
			e = u.transpose().multiply(-0.5).multiply(A).multiply(middle.inverse()).multiply(AT).multiply(u).determinant(),
			s = B2ATA.determinant() / middle.determinant();

		return Math.exp(e) * Math.sqrt(s)
	}

	return TrueSkill;
});

