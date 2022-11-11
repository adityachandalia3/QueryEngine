/**
 *
 * Return true if id is valid, false otherwise.
 *
 * @param id
 *
 * @returns boolean
 *
 */
export function isValidId(id: string): boolean {
	if (id.includes("_")) {
		return false;
	}
	if (id.length === 0) {
		return false;
	}
	if (!id.trim()) {
		return false;
	}
	return true;
}

export function containsId(id: string): boolean {
	return true;
}

