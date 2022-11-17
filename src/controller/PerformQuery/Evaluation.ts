import {SectionsDataset, Section, Dataset} from "../Dataset";
import {InsightError, InsightResult, ResultTooLargeError} from "../IInsightFacade";
import {Query, Filter, Mkey, Skey, Sort} from "./Query";

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

	// NOTE: applykey may be a field
	// title vs sections_title
	// must check apply key has underscore
	// maybe can tag apply key with _ in beginning and remove later

	// TODO transformation here
	// add fields/applykeys to filteredData?

	if (filteredData.length > maxResultLength) {
		throw new ResultTooLargeError(filteredData.length + " found sections/rooms");
	}
	let results: InsightResult[] = dataToInsightResults(filteredData, dataset.id, query.OPTIONS.COLUMNS);
	// TODO implement C2 sorting
	sortResultsBy(query.OPTIONS.ORDER, results, dataset.id);
	return results;
}

function sortResultsBy(order: string | Sort | undefined, results: InsightResult[], id: string) {
	if (typeof order === "string") {
		let field: string = id + "_" + order;
		results.sort((a, b) => {
			if (a[field] < b[field]) {
				return -1;
			}
			if (a[field] > b[field]) {
				return 1;
			}
			return 0;
		});
	} else if (order !== undefined) {
		throw new Error("TODO: C2 ordering not implemented yet");
	}
}

function evaluateFilter(data: any[], filter: Filter): any[] {
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
function dataToInsightResults(data: any[], id: string, columns: string[]): InsightResult[] {
	let results: InsightResult[] = [];
	for (const d of data) {
		let result: InsightResult = {};
		for (const col of columns) {
			result[id + "_" + col] = d[col];

			// TODO

			// if (col is a regular field) {
			// 	result[id + "_" + col] = d[col];
			// } else {
			// 	// col/applykey must be a field in res/filteredData
			// 	result[col] = d[col];
			// }
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
	for (const [k,v] of Object.entries(key)) {
		if (v !== undefined) {
			return k;
		}
	}
	throw new Error("Invalid state.");
}
