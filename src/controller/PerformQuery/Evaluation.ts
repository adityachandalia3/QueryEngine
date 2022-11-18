import Decimal from "decimal.js";
import {SectionsDataset, Section, Dataset} from "../Dataset";
import {InsightError, InsightResult, ResultTooLargeError} from "../IInsightFacade";
import {Query, Filter, Mkey, Skey, Sort, ApplyRule, ApplyBody} from "./Query";

/**
 * Apply query to dataset and return result
 *
 * @param dataset, query
 *
 * REQUIRE: query must be validated
 *
 * @return InsightResult[]
 *
 * Will throw ResultTooLargeError if length > 5000
 */
export function evaluateQuery(dataset: Dataset, query: Query): InsightResult[] {
	const maxResultLength: number = 5000;
	let filteredData: any[]; // Section[] | Room[] (+ applykeys)
	if (Object.values(query.WHERE).length === 0) {
		filteredData = dataset.getData();
	} else {
		filteredData = evaluateFilter(dataset.getData(), query.WHERE);
	}
	let results: InsightResult[] = filteredData;
	if (query.TRANSFORMATIONS !== undefined) {
		results = applyTransformation(results, query);
	}

	results = dataToInsightResults(results, query.OPTIONS.COLUMNS);

	if (results.length > maxResultLength) {
		throw new ResultTooLargeError(results.length + " found sections/rooms");
	}
	// sortResultsBy(query.OPTIONS.ORDER, results, dataset.id);
	return results;
}

function sortResultsBy(order: string | Sort | undefined, results: InsightResult[], id: string) {
	if (typeof order === "string") {
		results.sort((a, b) => {
			if (a[order] < b[order]) {
				return -1;
			}
			if (a[order] > b[order]) {
				return 1;
			}
			return -1;
		});
	} else if (order !== undefined) {
		results.sort((a, b) => {
			for (const k of order.keys) {
				if (a[k] < b[k]) {
					return -1;
				}
				if (a[k] > b[k]) {
					return 1;
				}
			}
			return -1;
		});
		if (order.dir === "DOWN") {
			results.reverse();
		}
	}
}

function evaluateFilter(data: any[], filter: Filter): InsightResult[] {
	let result: any[] = [];
	if (filter.AND) {
		result = data;
		for (const f of filter.AND) {
			let temp: any[] = evaluateFilter(result, f as Filter);
			result = result.filter(Set.prototype.has, new Set(temp));
		}
	} else if (filter.OR) {
		result = [];
		for (const f of filter.OR) {
			let temp: any[] = evaluateFilter(data, f as Filter);
			result = [...new Set([...temp, ...result])];
		}
	} else if (filter.LT) {
		let key: string = getField(filter.LT);
		result = data.filter((section) => section[key] < filter.LT[key as keyof Mkey]);
	} else if (filter.GT) {
		let key: string = getField(filter.GT);
		result = data.filter((section) => section[key] > filter.GT[key as keyof Mkey]);
	} else if (filter.EQ) {
		let key: string = getField(filter.EQ);
		result = data.filter((section) => section[key] === filter.EQ[key as keyof Mkey]);
	} else if (filter.IS) {
		let key: string = getField(filter.IS);
		result = data.filter((section) => {
			return isMatch(section[key] as string, filter.IS[key as keyof Skey]);
		});
	} else if (filter.NOT) {
		let temp: Set<any> = new Set(...[evaluateFilter(data, filter.NOT as Filter)]);
		result = data.filter((d) => !temp.has(d));
	}
	return result;
}

/**
 *
 * Converts data to insight results with specified columns and id attached to fields
 *
 * @param data
 * @param dataset
 * @returns translated InsightResults
 *
 */
function dataToInsightResults(data: any[], columns: string[]): InsightResult[] {
	let results: InsightResult[] = [];
	for (const d of data) {
		let result: InsightResult = {};
		for (const col of columns) {
			result[col] = d[col];
		}
		results.push(result);
	}
	return results;
}

function isMatch(field: string, comparator: string): boolean {
	let asterisks: number = comparator.split("*").length - 1;
	if (asterisks === 0) {
		return field === comparator;
	}
	if (asterisks === 1) {
		if (comparator[0] === "*") {
			return field.endsWith(comparator.slice(1));
		} else {
			return field.startsWith(comparator.slice(0, -1));
		}
	} else {
		return field.includes(comparator.slice(1, -1));
	}
}

function getField(key: Mkey | Skey): string {
	for (const [k, v] of Object.entries(key)) {
		if (v !== undefined) {
			return k;
		}
	}
	throw new Error("Invalid state.");
}
function applyTransformation(results: any[], query: Query): InsightResult[] {
	// 1. Group -> will only have one result per group
	let groups: Map<string, any> = groupResults(results, query.TRANSFORMATIONS.GROUP);

	// 2. Apply
	return apply(groups, query.TRANSFORMATIONS.GROUP, query.TRANSFORMATIONS.APPLY);
}

function groupResults(results: any[], groupNames: string[]): Map<string, any> {
	let groupedResults = new Map<string, any[]>();

	results.forEach((result) => {
		let key = "";
		for (const group of groupNames) {
			key += result[group];
		}
		if (groupedResults.has(key)) {
			groupedResults.get(key)?.push(result);
		} else {
			groupedResults.set(key, [result]);
		}
	});
	return groupedResults;
}

function apply(groupedResults: Map<string, any>, groupNames: string[], applyRules: ApplyRule[]): InsightResult[] {
	let results: InsightResult[] = [];
	for (const group of groupedResults.values()) {
		let result: InsightResult = {};
		for (const rule of applyRules) {
			// apply the rule
			let applyResult: number = calculate(Object.values(rule)[0], group);

			result[Object.keys(rule)[0]] = applyResult;
		}
		for (const name of groupNames) {
			result[name] = group[0][name];
		}
		results.push(result);
	}
	return results;
}

function calculate(token: ApplyBody, group: []): number {
	if (token.COUNT !== undefined) {
		let fields = new Set();
		for (const result of group) {
			fields.add(result[token.COUNT]);
		}
		return fields.size;
	} else if (token.AVG !== undefined) {
		let total = new Decimal(0);
		for (const result of group) {
			total = total.add(result[token.AVG]);
		}
		let avg = total.toNumber() / group.length;
		let res = Number(avg.toFixed(2));
		return res;
	} else if (token.MAX !== undefined) {
		let max = Number.MIN_VALUE;
		for (const result of group) {
			if (result[token.MAX] > max) {
				max = result[token.MAX];
			}
		}
		return max;
	} else if (token.MIN !== undefined) {
		let min = Number.MAX_VALUE;
		for (const result of group) {
			if (result[token.MIN] < min) {
				min = result[token.MIN];
			}
		}
		return min;
	} else {
		// token.SUM
		let total = new Decimal(0);
		for (const result of group) {
			total = total.add(result[token.SUM]);
		}
		let res = Number(total.toFixed(2));
		return res;
	}
}

