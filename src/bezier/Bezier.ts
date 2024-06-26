/**
 * https://github.com/gre/bezier-easing BezierEasing - use bezier curve for
 * transition easing function by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

import type { ReadableBezier } from './ReadableBezier.js';

const enum B {
	NEWTON_ITERATIONS = 4,
	NEWTON_MIN_SLOPE = 0.001,
	SUBDIVISION_PRECISION = 0.0000001,
	SUBDIVISION_MAX_ITERATIONS = 10,
	SPLINE_TABLE_SIZE = 11,
	SAMPLE_STEP_SIZE = 0.1,
}

export class Bezier implements ReadableBezier {
	private static a(aA1: number, aA2: number) {
		return 1 - 3 * aA2 + 3 * aA1;
	}

	private static b(aA1: number, aA2: number) {
		return 3 * aA2 - 6 * aA1;
	}

	private static c(aA1: number) {
		return 3 * aA1;
	}

	// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
	private static calcBezier(aT: number, aA1: number, aA2: number) {
		return (
			((Bezier.a(aA1, aA2) * aT + Bezier.b(aA1, aA2)) * aT +
				Bezier.c(aA1)) *
			aT
		);
	}

	// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
	private static getSlope(aT: number, aA1: number, aA2: number) {
		return (
			3 * Bezier.a(aA1, aA2) * aT * aT +
			(2 * Bezier.b(aA1, aA2) * aT + Bezier.c(aA1))
		);
	}

	// eslint-disable-next-line max-params
	private static binarySubdivide(
		aX: number,
		aA: number,
		aB: number,
		mX1: number,
		mX2: number,
	) {
		let currentX: number;
		let currentT: number;
		let i = 0;

		do {
			currentT = aA + (aB - aA) / 2;
			currentX = Bezier.calcBezier(currentT, mX1, mX2) - aX;

			if (currentX > 0) aB = currentT;
			else aA = currentT;
		} while (
			Math.abs(currentX) > B.SUBDIVISION_PRECISION &&
			++i < B.SUBDIVISION_MAX_ITERATIONS
		);

		return currentT;
	}

	private static newtonRaphsonIterate(
		aX: number,
		aGuessT: number,
		mX1: number,
		mX2: number,
	) {
		for (let i = 0; i < B.NEWTON_ITERATIONS; ++i) {
			const currentSlope = Bezier.getSlope(aGuessT, mX1, mX2);

			if (currentSlope === 0) return aGuessT;

			const currentX = Bezier.calcBezier(aGuessT, mX1, mX2) - aX;

			aGuessT -= currentX / currentSlope;
		}

		return aGuessT;
	}

	private readonly sampleValues: Float32Array | number[] =
		typeof Float32Array === 'function'
			? new Float32Array(B.SPLINE_TABLE_SIZE)
			: new Array(B.SPLINE_TABLE_SIZE);

	constructor(
		private readonly x1: number,
		private readonly y1: number,
		private readonly x2: number,
		private readonly y2: number,
	) {
		if (x1 !== y1 || x2 !== y2)
			// calculate sample values
			for (let i = 0; i < B.SPLINE_TABLE_SIZE; ++i) {
				this.sampleValues[i] = Bezier.calcBezier(
					i * B.SAMPLE_STEP_SIZE,
					x1,
					x2,
				);
			}
	}

	public at(v: number) {
		if (this.x1 === this.y1 && this.x2 === this.y2) return v;

		return Bezier.calcBezier(
			this.getT(v, this.x1, this.x2),
			this.y1,
			this.y2,
		);
	}

	private getT(aX: number, mX1: number, mX2: number) {
		let intervalStart = 0;
		let currentSampleIndex = 1;
		const FINAL_SAMPLE_INDEX = B.SPLINE_TABLE_SIZE - 1;

		while (
			currentSampleIndex !== FINAL_SAMPLE_INDEX &&
			this.sampleValues[currentSampleIndex]! <= aX
		) {
			intervalStart += B.SAMPLE_STEP_SIZE;
			++currentSampleIndex;
		}

		--currentSampleIndex;

		const currentSample = this.sampleValues[currentSampleIndex]!;
		const nextSample = this.sampleValues[currentSampleIndex + 1]!;

		// interpolate to provide an initial guess for t
		const dist = (aX - currentSample) / (nextSample - currentSample);
		const guessForT = intervalStart + dist * B.SAMPLE_STEP_SIZE;
		const initialSlope = Bezier.getSlope(guessForT, mX1, mX2);

		if (initialSlope >= B.NEWTON_MIN_SLOPE)
			return Bezier.newtonRaphsonIterate(aX, guessForT, mX1, mX2);

		if (initialSlope === 0) return guessForT;

		return Bezier.binarySubdivide(
			aX,
			intervalStart,
			intervalStart + B.SAMPLE_STEP_SIZE,
			mX1,
			mX2,
		);
	}
}
