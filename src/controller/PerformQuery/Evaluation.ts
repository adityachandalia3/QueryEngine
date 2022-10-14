import {Dataset, Section} from "../Dataset";
import {InsightError, InsightResult, ResultTooLargeError} from "../IInsightFacade";
import {Query, Filter, Mkey, Skey} from "./Query";

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
	let filteredSections: Section[];
	if (Object.values(query.WHERE).length === 0) {
		filteredSections = dataset.sections;
	} else {
		filteredSections = evaluateFilter(dataset.sections, query.WHERE);
	}
	if (filteredSections.length > 5000) {
		throw new ResultTooLargeError(filteredSections.length + " found sections");
	}
	let results: InsightResult[] = sectionsToInsightResults(filteredSections, dataset.id, query.OPTIONS.COLUMNS);
	if (query.OPTIONS.ORDER) {
		let fieldToOrder: string = dataset.id + "_" + query.OPTIONS.ORDER;
		results.sort((a, b) => {
			if (a[fieldToOrder] < b[fieldToOrder]) {
				return -1;
			}
			if (a[fieldToOrder] > b[fieldToOrder]) {
				return 1;
			}

			return 0;
		});
	}
	return results;
}

function evaluateFilter(sections: Section[], filter: Filter): Section[] {
	let result: Section[] = [];
	if (filter.AND) {
		result = sections;
		for (const f of filter.AND) {
			let temp: Section[] = evaluateFilter(result, f as Filter);
			// referenced https://stackoverflow.com/a/43820518 to reduce time complexity
			result = result.filter(Set.prototype.has, new Set(temp));

		}
	} else if (filter.OR) {
		result = [];
		for (const f of filter.OR) {
			let temp: Section[] = evaluateFilter(sections, f as Filter);
			result = [...new Set([...temp, ...result])];
		}
	} else if (filter.LT) {
		let key: string = getMfield(filter.LT);
		result = sections.filter((section) => section[key as keyof Section] < filter.LT[key as keyof Mkey]);
	} else if (filter.GT) {
		let key: string = getMfield(filter.GT);
		result = sections.filter((section) => section[key as keyof Section] > filter.GT[key as keyof Mkey]);
	} else if (filter.EQ) {
		let key: string = getMfield(filter.EQ);
		result = sections.filter((section) => section[key as keyof Section] === filter.EQ[key as keyof Mkey]);
	} else if (filter.IS) {
		let key: string = getSfield(filter.IS);
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

function getMfield(key: Mkey): string {
	if (key.audit) {
		return "audit";
	} else if (key.avg) {
		return "avg";
	} else if (key.fail) {
		return "fail";
	} else if (key.pass) {
		return "pass";
	} else if (key.year) {
		return "year";
	}
	throw new Error("Invalid state.");
}

function getSfield(key: Skey): string {
	if (key.dept) {
		return "dept";
	} else if (key.id) {
		return "id";
	} else if (key.instructor) {
		return "instructor";
	} else if (key.title) {
		return "title";
	} else if (key.uuid) {
		return "uuid";
	}
	throw new Error("Invalid state.");
}
