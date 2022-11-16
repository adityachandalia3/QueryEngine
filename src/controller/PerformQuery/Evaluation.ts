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
	let filteredData: any[];
	if (Object.values(query.WHERE).length === 0) {
		filteredData = dataset.getData();
	} else {
		filteredData = evaluateFilter(dataset.getData(), query.WHERE);
	}
	if (filteredData.length > maxResultLength) {
		throw new ResultTooLargeError(filteredData.length + " found sections/rooms");
	}
	let results: InsightResult[] = sectionsToInsightResults(filteredData, dataset.id, query.OPTIONS.COLUMNS);
	sortResultsBy(query.OPTIONS.ORDER, results, dataset.id);
	return results;
}

function sortResultsBy(order: string | Sort | undefined, results: InsightResult[], id: string) {
	if (order) {
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
	}
}

function evaluateFilter(sections: Section[], filter: Filter): Section[] {
	let result: Section[] = [];
	if (filter.AND) {
		result = sections;
		for (const f of filter.AND) {
			let temp: Section[] = evaluateFilter(result, f as Filter);
			result = result.filter(Set.prototype.has, new Set(temp));
		}
	} else if (filter.OR) {
		result = [];
		for (const f of filter.OR) {
			let temp: Section[] = evaluateFilter(sections, f as Filter);
			result = [...new Set([...temp, ...result])];
		}
	} else if (filter.LT) {
		let key: string = getField(filter.LT);
		result = sections.filter((section) => section[key as keyof Section] < filter.LT[key as keyof Mkey]);
	} else if (filter.GT) {
		let key: string = getField(filter.GT);
		result = sections.filter((section) => section[key as keyof Section] > filter.GT[key as keyof Mkey]);
	} else if (filter.EQ) {
		let key: string = getField(filter.EQ);
		result = sections.filter((section) => section[key as keyof Section] === filter.EQ[key as keyof Mkey]);
	} else if (filter.IS) {
		let key: string = getField(filter.IS);
		result = sections.filter((section) => {
			return isMatch(section[key as keyof Section] as unknown as string, filter.IS[key as keyof Skey]);
		});
	} else if (filter.NOT) {
		let temp: Set<Section> = new Set(...[evaluateFilter(sections, filter.NOT as Filter)]);
		result = sections.filter((section) => !temp.has(section));
	}
	return result;
}

/**
 *
 * Converts sections to insight results with specified columns and id attached to fields
 *
 * @param sections
 * @param dataset
 * @returns translated InsightResults
 *
 */
function sectionsToInsightResults(sections: Section[], id: string, options: string[]): InsightResult[] {
	let results: InsightResult[] = [];
	for (const section of sections) {
		let res: InsightResult = {};
		for (const opt of options) {
			res[id + "_" + opt] = section[opt as keyof Section];
		}
		results.push(res);
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
