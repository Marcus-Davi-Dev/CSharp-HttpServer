export function normalizeVector(v) {
	const length = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
	return [v[0] / length, v[1] / length, v[2] / length];
}

export function crossProduct(a, b) {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]
	]
}

export function subtractVectors(a, b) {
	return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}