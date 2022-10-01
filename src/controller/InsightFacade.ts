import {stringify} from "querystring";
import Dataset from "./Dataset";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import Section from "./Section";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	/**
	 * currentDataset will be undefined until:
	 * 1) addDataset from content
	 * 2) performQuery loads dataset from disk
	 *
	 * performQuery must check if === undefined
	 */
	private currentDataset?: Dataset;

	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return Promise.reject("Not implemented.");
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}
	public performQuery(query: unknown): Promise<InsightResult[]> {
		let id,
			filterFun = this.parseAndValidateQuery(query);
		// TODO: check id is valid dataset ex) checkId(id)
		// TODO: load dataset
		let result: InsightResult[] = this.evaluateQuery();
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}

	/**
	 *
	 * Does the following:
	 * 1) gets session
	 * 2) strips session & checks all match (new function?)
	 * 3) parse data to function
	 * 4) skeleton TODO: return a MAPPING for columns as well (new function?)
	 * 5) skeleton TODO: ordering?
	 *
	 * @param query
	 *
	 * @return [string, (s: Section) => boolean]
	 *
	 * Returns id of dataset to be queried and a filter/predicate function
	 *
	 */
	private parseAndValidateQuery(query: unknown): [string, (s: Section) => boolean] {
		let id: string = "";

		function filterFun(s: Section) {
			return false;
		}

		return [id, filterFun];
	}

	/**
	 * Apply query to dataset and return result
	 *
	 * @param ...
	 *
	 *
	 * @return InsightResult[]
	 *
	 * Will throw ResultTooLargeError if length > 5000
	 */
	private evaluateQuery(): InsightResult[] {
		// iterate dataset
		// if PREDICATE return mapped version (2 functions)
		// newlist = list.filter(predicate)
		// check length (in filter?)
		// map(callbackFn)
		// sort
		return [];
	}

	/**
	 * Saves a dataset (stored in memory in the InsightDataset object) to disk as a JSON file.
	 * Will update (or create if none) a metadata file mapping ids to file path
	 *
	 *
	 * @param dataset  The dataset to be saved to disk.
	 *
	 * @return Promise <string>
	 *
	 * The promise should fulfill with the id of the saved dataset.
	 * The promise should fulfill with an InsightError (for any other source of failure) describing the error.
	 */
	private saveDataset(dataset: Dataset): Promise<string> {
		// use fs.outputJson
		return Promise.reject("Not implemented");
	}

	/**
	 * Loads a dataset from disk to the Dataset object.
	 * Searches for id in metadata file to find dataset.
	 *
	 * @param id  The id of the dataset to be loaded.
	 *
	 * @return Promise <string>
	 *
	 * The promise should fulfill with the id of the loaded dataset.
	 * The promise should fulfill with an InsightError (for any other source of failure) describing the error.
	 */
	private loadDataset(id: string): Promise<string> {
		// use fs.readJson
		return Promise.reject("Not implemented");
	}
}
