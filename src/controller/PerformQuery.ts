import {Dataset} from "./Dataset";
import {isValidId} from "./Helpers";
import {InsightError, InsightResult} from "./IInsightFacade";
import {Filter, Mkey, Query, Skey} from "./Query";

/**
 * Returns id and query with id stripped.
 *
 * @param query
 * @returns [id, query]
 *
 * Will throw InsightError if id is invalid.
 *
 */
export function checkAndStripId(query: string): [string, string] {
	let id = "";
	const regex = /(?<=")[^"]*_/g; // will break if an underscore is outside of quotes
	let matches = Array.from(query.matchAll(regex));

	let idsAllMatch = matches.every((match) => {
		id = match[0];
		return id === matches[0][0];
	});

	if (!idsAllMatch) {
		throw new InsightError("not all ids match");
	}

	id = id.slice(0, -1);

	if (!isValidId(id)) {
		throw new InsightError("id is not valid");
	}

	query = query.replaceAll(regex, "");
	return [id, query];
}

/**
 *
 * Does the following:
 *
 * @param query
 *
 * Throws many errors to be caught by caller
 *
 */
export function validateQuery(query: Query) {
	if (Object.values(query.WHERE).length === 1) {
		validateFilter(query.WHERE);
	} else if (Object.values(query.WHERE).length > 1) {
		throw new InsightError("WHERE should only have 1 key");
	}
	validateOptions(query);
}

export function validateFilter(filter: Filter) {
	if (Object.values(filter).length !== 1) {
		throw new InsightError("Should only have 1 key, has " + Object.values(filter).length);
	}

	if (filter.AND !== undefined) {
		if (!Array.isArray(filter.AND) || filter.AND.length === 0) {
			throw new InsightError("AND must be a non-empty array");
		}
		for (const f of filter.AND) {
			validateFilter(f as Filter);
		}
	} else if (filter.OR !== undefined) {
		if (!Array.isArray(filter.OR) || filter.OR.length === 0) {
			throw new InsightError("OR must be a non-empty array");
		}
		for (const f of filter.OR) {
			validateFilter(f as Filter);
		}
	} else if (filter.LT !== undefined) {
		if (!isMkey(filter.LT)) {
			// TODO !!!!!!!!!!!!!!!!!
			throw new InsightError("Invalid key in LT");
		}
	} else if (filter.GT !== undefined) {
		if (!isMkey(filter.GT)) {
			throw new InsightError("Invalid key in GT");
		}
	} else if (filter.EQ !== undefined) {
		if (!isMkey(filter.EQ)) {
			throw new InsightError("Invalid key in EQ");
		}
	} else if (filter.IS !== undefined) {
		console.log(filter.IS);
		if (!isSkey(filter.IS)) {
			throw new InsightError("Invalid key in IS");
		}
	} else if (filter.NOT !== undefined) {
		validateFilter(filter.NOT as Filter);
	} else {
		throw new InsightError("Invalid filter key");
	}
}

export function validateOptions(query: Query) {
	if (!Array.isArray(query.OPTIONS.COLUMNS) || query.OPTIONS.COLUMNS.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}

	for (const k of Object.keys(query)) {
		if (k !== "WHERE" && k !== "OPTIONS") {
			throw new InsightError("Invalid keys in query");
		}
	}

	for (const k of Object.keys(query.OPTIONS)) {
		if (k !== "COLUMNS" && k !== "ORDER") {
			throw new InsightError("Invalid keys in OPTIONS");
		}
	}

	for (const i in query.OPTIONS.COLUMNS) {
		if (!isField(query.OPTIONS.COLUMNS[i])) {
			throw new InsightError("Invalid key in COLUMNS");
		}
	}

	if (query.OPTIONS.ORDER !== undefined) {
		if (!isField(query.OPTIONS.ORDER)) {
			throw new InsightError("Invalid ORDER type");
		}
		if (!query.OPTIONS.COLUMNS.includes(query.OPTIONS.ORDER)) {
			throw new InsightError("ORDER key must be in COLUMNS");
		}
	}
}

/**
 * Apply query to dataset and return result
 *
 * @param filter, columns, order
 *
 *
 * @return InsightResult[]
 *
 * Will throw ResultTooLargeError if length > 5000
 */
export function evaluateQuery(dataset: Dataset, query: Query): InsightResult[] {
	// iterate dataset
	// if PREDICATE return mapped version (2 functions)
	// newlist = list.filter(predicate)
	// check length (in filter?)
	// map(callbackFn)
	// sort
	return [];
}

export function isQuery(query: unknown): query is Query {
	return (
		query !== null &&
		query !== undefined &&
		typeof query === "object" &&
		(query as Query).WHERE !== undefined &&
		(query as Query).OPTIONS !== undefined &&
		!Array.isArray((query as Query).WHERE) &&
		!Array.isArray((query as Query).OPTIONS !== undefined)
	);
}

export function isField(field: string): boolean {
	return (
		field === "avg" ||
		field === "pass" ||
		field === "fail" ||
		field === "audit" ||
		field === "year" ||
		field === "dept" ||
		field === "id" ||
		field === "instructor" ||
		field === "title" ||
		field === "uuid"
	);
}

export function isMkey(mkey: unknown): mkey is Mkey {
	return (
		mkey !== null &&
		mkey !== undefined &&
		typeof mkey === "object" &&
		Object.values(mkey).length === 1 &&
		typeof Object.values(mkey)[0] === "number"
	);
}

export function isSkey(skey: unknown): skey is Skey {
	return (
		skey !== null &&
		skey !== undefined &&
		typeof skey === "object" &&
		Object.values(skey).length === 1 &&
		typeof Object.values(skey)[0] === "string" &&
		isValidInputString(Object.values(skey)[0])
	);
}

export function isValidInputString(input: string): boolean {
	return !(input.length > 2 && input.slice(1, -1).includes("*"));
}
