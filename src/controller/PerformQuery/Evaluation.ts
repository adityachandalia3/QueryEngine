import {Dataset, Section} from "../Dataset";
import {InsightResult, ResultTooLargeError} from "../IInsightFacade";
import {Query, Filter} from "./Query";

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
	let filteredSections: Section[];
	if (Object.values(query.WHERE).length === 0) {
		filteredSections = dataset.sections;
	} else {
		filteredSections = evaluateFilter(dataset.sections, query.WHERE);
	}
	if (filteredSections.length > 1) {
		throw new ResultTooLargeError(filteredSections.length + " found sections");
	}
	// sort and filter columns
	let results: InsightResult[] = sectionsToInsightResults(filteredSections, dataset.id, query.OPTIONS.COLUMNS);
	return results;
}

function evaluateFilter(sections: Section[], filter: Filter): Section[] {
	// if (filter.);
	return [];
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
	return [];
}
