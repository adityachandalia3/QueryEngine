import {isValidId} from "../Helpers";
import {InsightDatasetKind, InsightError, InsightResult} from "../IInsightFacade";
import {ApplyBody, Filter, Mkey, Query, Skey} from "./Query";
import {SectionsDataset, Section} from "../Dataset";

let isSections: boolean;
let transformationKeys: string[];
let ID: string;
/**
 * Returns id and query with id stripped.
 *
 * @param query
 * @returns [id, query]
 *
 * Will throw InsightError if id is invalid.
 *
 */
export function checkAndStripId(query: string): string {
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
	ID = id;
	return id;
}

/**
 *
 * Validates WHERE then validates OPTIONS
 *
 * @param query
 *
 * Throws errors to be caught by caller
 *
 */
export function validateQuery(query: Query, kind: InsightDatasetKind) {
	isSections = kind === InsightDatasetKind.Sections;
	transformationKeys = [];

	for (const k of Object.keys(query)) {
		if (k !== "WHERE" && k !== "OPTIONS" && k !== "TRANSFORMATIONS") {
			throw new InsightError("Invalid keys in query");
		}
	}

	validateTransformations(query);

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
			throw new InsightError("Invalid key in LT");
		}
		checkFilterKeyIsKey(filter.LT);
	} else if (filter.GT !== undefined) {
		if (!isMkey(filter.GT)) {
			throw new InsightError("Invalid key in GT");
		}
		checkFilterKeyIsKey(filter.GT);
	} else if (filter.EQ !== undefined) {
		if (!isMkey(filter.EQ)) {
			throw new InsightError("Invalid key in EQ");
		}
		checkFilterKeyIsKey(filter.EQ);
	} else if (filter.IS !== undefined) {
		if (!isSkey(filter.IS)) {
			throw new InsightError("Invalid key in IS");
		}
		checkFilterKeyIsKey(filter.IS);
	} else if (filter.NOT !== undefined) {
		validateFilter(filter.NOT as Filter);
	} else {
		throw new InsightError("Invalid filter key");
	}
}

function checkFilterKeyIsKey(key: Mkey | Skey) {
	if (!Object.keys(key).reduce((a,b) => a || isKey(b), false)) {
		throw new InsightError("Invalid key field");
	}
}

function validateOptions(query: Query) {
	if (!Array.isArray(query.OPTIONS.COLUMNS) || query.OPTIONS.COLUMNS.length === 0) {
		throw new InsightError("COLUMNS must be a non-empty array");
	}

	for (const k of Object.keys(query.OPTIONS)) {
		if (k !== "COLUMNS" && k !== "ORDER") {
			throw new InsightError("Invalid keys in OPTIONS");
		}
	}
	if (transformationKeys.length === 0) {
		for (const i in query.OPTIONS.COLUMNS) {
			if (!isKey(query.OPTIONS.COLUMNS[i])) {
				throw new InsightError("Invalid key in COLUMNS");
			}
		}
	} else {
		for (const i in query.OPTIONS.COLUMNS) {
			if (!transformationKeys.includes(query.OPTIONS.COLUMNS[i])) {
				throw new InsightError("Keys in COLUMNS must be in GROUP or APPLY");
			}
		}
	}
	if (query.OPTIONS.ORDER !== undefined) {
		if (typeof query.OPTIONS.ORDER === "string") {
			if (!query.OPTIONS.COLUMNS.includes(query.OPTIONS.ORDER)) {
				throw new InsightError("ORDER key must be in COLUMNS");
			}
		} else {
			let dir = query.OPTIONS.ORDER.dir;
			if (typeof dir !== "string" || (dir !== "UP" && dir !== "DOWN")) {
				throw new InsightError("ORDER dir must be either UP or DOWN");
			}
			let keys = query.OPTIONS.ORDER.keys;
			if (!Array.isArray(keys) || keys.length === 0) {
				throw new InsightError("ORDER keys must be a non-empty array");
			}
		}
	}
}

function validateTransformations(query: Query) {
	if (query.TRANSFORMATIONS === undefined) {
		return;
	}
	if (query.TRANSFORMATIONS.APPLY === undefined || query.TRANSFORMATIONS.GROUP === undefined) {
		throw new InsightError("TRANSFORMATIONS must have GROUP and APPLY");
	}
	if (!Array.isArray(query.TRANSFORMATIONS.GROUP) ||
		query.TRANSFORMATIONS.GROUP.length === 0) {
		throw new InsightError("GROUP must be a non-empty array");
	}
	for (const k of query.TRANSFORMATIONS.GROUP) {
		if (!isKey(k)) {
			throw new InsightError("Key is not a valid key");
		}
		transformationKeys.push(k);
	}
	if (!Array.isArray(query.TRANSFORMATIONS.APPLY)) {
		throw new InsightError("APPLY must be an array");
	}

	for (const rule of query.TRANSFORMATIONS.APPLY) {
		if (Object.keys(rule).length !== 1) {
			throw new InsightError("APPLY rule should only have 1 key");
		}
		let anykey = Object.keys(rule)[0];
		let body = Object.values(rule)[0];
		if (anykey.includes("_")) {
			throw new InsightError("APPLY key may not contain underscore");
		}
		if (transformationKeys.includes(anykey)) {
			throw new InsightError("Duplicate APPLY key");
		}
		transformationKeys.push(anykey);
		if (Object.keys(body).length !== 1) {
			throw new InsightError("APPLY body should only have 1 key");
		}
		let token = Object.keys(body)[0];
		let key: string = Object.values(body)[0];
		if (isToken(token)) {
			checkValidTokenOnKey(token, key);
		} else {
			throw new InsightError("Invalid transformation operator");
		}
		if (!isKey(key)) {
			throw new InsightError("Invalid key " + key + " in " + token);
		}
	}
}

function checkValidTokenOnKey(token: string, key: string) {
	if (token !== "COUNT") {
		let field = key.substring(key.indexOf("_") + 1);
		if ("dept" === field ||
			"id" === field ||
			"instructor" === field ||
			"title" === field ||
			"uuid" === field ||
			"fullname" === field ||
			"shortname" === field ||
			"number" === field ||
			"name" === field ||
			"address" === field ||
			"type" === field ||
			"furniture" === field ||
			"href" === field) {
			throw new InsightError("APPLY token can not be applied to string type");
		}
	}
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

function isToken(token: string): boolean {
	return token === "MAX" ||
		   token === "MIN" ||
		   token === "AVG" ||
		   token === "COUNT" ||
		   token === "SUM";
}

export function isKey(field: string): boolean {
	if (isSections) {
		return (
			field === ID + "_avg" || field === ID + "_pass" ||
			field === ID + "_fail" || field === ID + "_audit" ||
			field === ID + "_year" || field === ID + "_dept" ||
			field === ID + "_id" || field === ID + "_instructor" ||
			field === ID + "_title" || field === ID + "_uuid"
		);
	} else {
		return (
			field === ID + "_fullname" || field === ID + "_shortname" ||
			field === ID + "_number" || field === ID + "_name" ||
			field === ID + "_address" || field === ID + "_lat" ||
			field === ID + "_lon" || field === ID + "_seats" ||
			field === ID + "_type" || field === ID + "_furniture" ||
			field === ID + "_href"
		);
	}
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
