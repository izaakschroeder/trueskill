if (typeof define !== 'function') { var define = require('amdefine')(module) };

define([], function() {

	//Via Sylvester for now
	function Matrix(elements) {
		if (!Array.isArray(elements))
			throw new TypeError(elements);
		if (!Array.isArray(elements[0]))
			throw new TypeError(elements[0]);
		this.elements = elements;

	}

	// Maps the matrix to another matrix (of the same dimensions) according to the given function
	Matrix.prototype.map = function(fn) {
		var els = [], ni = this.elements.length, ki = ni, i, nj, kj = this.elements[0].length, j;
		do { i = ki - ni;
			nj = kj;
			els[i] = [];
			do { j = kj - nj;
				els[i][j] = fn(this.elements[i][j], i + 1, j + 1);
			} while (--nj);
		} while (--ni);
		return Matrix.create(els);
	};

	// Returns true iff the argument has the same dimensions as the matrix
	Matrix.prototype.isSameSizeAs = function(matrix) {
		var M = matrix.elements || matrix;
		if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
		return (this.elements.length == M.length &&
				this.elements[0].length == M[0].length);
	};

	// Returns the result of adding the argument to the matrix
	Matrix.prototype.add = function(matrix) {
		var M = matrix.elements || matrix;
		if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
		if (!this.isSameSizeAs(M)) { return null; }
		return this.map(function(x, i, j) { return x + M[i-1][j-1]; });
	};

	// Returns true iff the matrix can multiply the argument from the left
	Matrix.prototype.canMultiplyFromLeft = function(matrix) {
		var M = matrix.elements || matrix;
		if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
		// this.columns should equal matrix.rows
		return (this.elements[0].length == M.length);
	};

	// Returns the result of multiplying the matrix from the right by the argument.
	// If the argument is a scalar then just multiply all the elements. If the argument is
	// a vector, a vector is returned, which saves you having to remember calling
	// col(1) on the result.
	Matrix.prototype.multiply = function(matrix) {
		if (!matrix.elements) {
			return this.map(function(x) { return x * matrix; });
		}
		var M = matrix.elements || matrix;
		if (typeof(M[0][0]) == 'undefined') { M = Matrix.create(M).elements; }
		if (!this.canMultiplyFromLeft(M)) { return null; }
		var ni = this.elements.length, ki = ni, i, nj, kj = M[0].length, j;
		var cols = this.elements[0].length, elements = [], sum, nc, c;
		do { i = ki - ni;
			elements[i] = [];
			nj = kj;
			do { j = kj - nj;
				sum = 0;
				nc = cols;
				do { c = cols - nc;
					sum += this.elements[i][c] * M[c][j];
				} while (--nc);
				elements[i][j] = sum;
			} while (--nj);
		} while (--ni);
		return Matrix.create(elements);
	};

	// Returns the transpose of the matrix
	Matrix.prototype.transpose = function() {
		var rows = this.elements.length, cols = this.elements[0].length;
		var elements = [], ni = cols, i, nj, j;
		do { i = cols - ni;
			elements[i] = [];
			nj = rows;
			do { j = rows - nj;
				elements[i][j] = this.elements[j][i];
			} while (--nj);
		} while (--ni);
		return Matrix.create(elements);
	};

	// Returns true iff the matrix is square
	Matrix.prototype.isSquare = function() {
		return (this.elements.length == this.elements[0].length);
	};

	// If the matrix is square, returns the diagonal elements as a vector.
	// Otherwise, returns null.
	Matrix.prototype.diagonal = function() {
		if (!this.isSquare) { return null; }
		var els = [], n = this.elements.length, k = n, i;
		do { i = k - n;
			els.push(this.elements[i][i]);
		} while (--n);
		return Vector.create(els);
	};

	// Make the matrix upper (right) triangular by Gaussian elimination.
	// This method only adds multiples of rows to other rows. No rows are
	// scaled up or switched, and the determinant is preserved.
	Matrix.prototype.toRightTriangular = function() {
		var M = this.elements.slice(), els;
		var n = this.elements.length, k = n, i, np, kp = this.elements[0].length, p;
		do { i = k - n;
			if (M[i][i] == 0) {
				for (j = i + 1; j < k; j++) {
					if (M[j][i] != 0) {
						els = []; np = kp;
						do { p = kp - np;
							els.push(M[i][p] + M[j][p]);
						} while (--np);
						M[i] = els;
						break;
					}
				}
			}
			if (M[i][i] != 0) {
				for (j = i + 1; j < k; j++) {
					var multiplier = M[j][i] / M[i][i];
					els = []; np = kp;
					do { p = kp - np;
						// Elements with column numbers up to an including the number
						// of the row that we're subtracting can safely be set straight to
						// zero, since that's the point of this routine and it avoids having
						// to loop over and correct rounding errors later
						els.push(p <= i ? 0 : M[j][p] - M[i][p] * multiplier);
					} while (--np);
					M[j] = els;
				}
			}
		} while (--n);
		return Matrix.create(M);
	};

	// Returns the determinant for square matrices
	Matrix.prototype.determinant = function() {
		if (!this.isSquare()) { return null; }
		var M = this.toRightTriangular();
		var det = 1, n = M.elements.length;
		for (var i = 0; i < n; ++i)
			det = det * M.elements[i][i];
		return det;
	};

	// Returns true iff the matrix is singular
	Matrix.prototype.isSingular = function() {
		return (this.isSquare() && this.determinant() === 0);
	};

	// Returns the result of attaching the given argument to the right-hand side of the matrix
	Matrix.prototype.augment = function(matrix) {
		return Matrix.create(this.elements.map(function(row, i) {
			return row.concat(matrix.elements[i])
		}))
	};

	// Returns the inverse (if one exists) using Gauss-Jordan
	Matrix.prototype.inverse = function() {
		if (!this.isSquare() || this.isSingular()) { return null; }
		var ni = this.elements.length, ki = ni, i, j;
		var M = this.augment(Matrix.I(ni)).toRightTriangular();
		var np, kp = M.elements[0].length, p, els, divisor;
		var inverse_elements = [], new_element;
		// Matrix is non-singular so there will be no zeros on the diagonal
		// Cycle through rows from last to first
		do { i = ni - 1;
			// First, normalise diagonal elements to 1
			els = []; np = kp;
			inverse_elements[i] = [];
			divisor = M.elements[i][i];
			do { p = kp - np;
				new_element = M.elements[i][p] / divisor;
				els.push(new_element);
				// Shuffle of the current row of the right hand side into the results
				// array as it will not be modified by later runs through this loop
				if (p >= ki) { inverse_elements[i].push(new_element); }
			} while (--np);
			M.elements[i] = els;
			// Then, subtract this row from those above it to
			// give the identity matrix on the left hand side
			for (j = 0; j < i; j++) {
				els = []; np = kp;
				do { p = kp - np;
					els.push(M.elements[j][p] - M.elements[i][p] * M.elements[j][i]);
				} while (--np);
				M.elements[j] = els;
			}
		} while (--ni);
		return Matrix.create(inverse_elements);
	};




	// Constructor function
	Matrix.create = function(elements) {
		return new Matrix(elements);
	};

	// Identity matrix of size n
	Matrix.I = function(n) {
		var els = [], k = n, i, nj, j;
		do { i = k - n;
			els[i] = []; nj = k;
			do { j = k - nj;
				els[i][j] = (i == j) ? 1 : 0;
			} while (--nj);
		} while (--n);
		return Matrix.create(els);
	};

	// Diagonal matrix - all off-diagonal elements are zero
	Matrix.diagonal = function(elements) {
		var els = [], n = elements.length, k = n, i, nj, j;
		do { i = k - n;
			els[i] = []; nj = k;
			do { j = k - nj;
				els[i][j] = (i == j) ? elements[i] : 0;
			} while (--nj);
		} while (--n);
		return Matrix.create(els);
	};

	// Matrix filled with zeros
	Matrix.zero = function(n, m) {
		var els = [], ni = n, i, nj, j;
		do { i = n - ni;
			els[i] = [];
			nj = m;
			do { j = m - nj;
				els[i][j] = 0;
			} while (--nj);
		} while (--ni);
		return Matrix.create(els);
	};
	return Matrix;
});
