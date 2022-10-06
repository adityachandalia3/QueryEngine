import Dataset from "./Dataset";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import {Filter, Query, Mkey, Skey} from "./Query";
import Section from "./Section";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	/**
	 * currentDataset will be undefined until either:
	 * 1) addDataset from content
	 * 2) performQuery loads dataset from disk
	 *
	 * performQuery must check if currentDataset === undefined
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
		let id, queryString;

		try {
			[id, queryString] = this.checkAndStripId(JSON.stringify(query).toLowerCase());
		} catch (err) {
			console.log((err as Error).message);
			return Promise.reject(err);
		}

		query = JSON.parse(queryString);

		if (this.isQuery(query)) {
			let filterFun: (s: Section) => boolean;
			try {
				filterFun = this.validateQuery(query);
			} catch (err) {
				console.log((err as Error).message);
				return Promise.reject(err);
			}
			return this.loadDataset(id).then(
				() => this.evaluateQuery(filterFun),
				(error) => {
					return error;
				}
			);
		} else {
			console.log("not a valid query");
			return Promise.reject(new InsightError("query given is not a valid query"));
		}
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}

	/**
	 * Returns id and query with id stripped.
	 *
	 * @param query
	 * @returns [id, query]
	 *
	 * Will throw InsightError if id is invalid.
	 *
	 */
	private checkAndStripId(query: string): [string, string] {
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

		if (!this.isValidId(id)) {
			throw new InsightError("id is not valid");
		}

		query = query.replaceAll(regex, "");
		return [id, query];
	}

	/**
	 *
	 * Does the following:
	 * 4) skeleton TODO: return a MAPPING for columns as well (new function?)
	 * 5) skeleton TODO: ordering?
	 *
	 * @param query
	 *
	 * @return [string, (s: Section) => boolean]
	 *
	 * Returns  filter/predicate function
	 *
	 */
	private validateQuery(query: Query): (s: Section) => boolean {

		// validate WHERE

		if (Object.values(query.where).length === 1) {
			this.validateFilter(query.where);
		} else if (Object.values(query.where).length > 1) {
			throw new InsightError("WHERE should only have 1 key");
		}

		// validate OPTIONS

		if (query.options.columns.length === 0) {
			throw new InsightError("COLUMNS must be a non-empty array");
		}

		for (const i in query.options.columns) {
			if (!this.isKey(query.options.columns[i])) {
				throw new InsightError("Invalid key in COLUMNS");
			}
		}

		if (query.options.order !== undefined) {
			if (!this.isKey(query.options.order)) {
				throw new InsightError("Invalid ORDER type");
			}
			if (!query.options.columns.includes(query.options.order as unknown as string)) {
				throw new InsightError("ORDER key must be in COLUMNS");
			}
		}

		// probably delete this
		function filterFun(s: Section) {
			return false;
		}

		return filterFun;
	}

	private validateFilter(filter: Filter) {
		throw new InsightError("where validation not implemented yet");
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
	private evaluateQuery(filter: (s: Section) => boolean): InsightResult[] {
		// iterate dataset
		// if PREDICATE return mapped version (2 functions)
		// newlist = list.filter(predicate)
		// check length (in filter?)
		// map(callbackFn)
		// sort
		return [];
	}

	private isQuery(query: unknown): query is Query {
		return (
			query !== null &&
			query !== undefined &&
			typeof query === "object" &&
			(query as Query).where !== undefined &&
			(query as Query).options !== undefined
		);
	}

	private isKey(key: unknown): key is Mkey | Skey {
		return (
			key !== null &&
			key !== undefined &&
			((key as unknown as string) === "avg" ||
				(key as unknown as string) === "pass" ||
				(key as unknown as string) === "fail" ||
				(key as unknown as string) === "audit" ||
				(key as unknown as string) === "year" ||
				(key as unknown as string) === "dept" ||
				(key as unknown as string) === "id" ||
				(key as unknown as string) === "instructor" ||
				(key as unknown as string) === "title" ||
				(key as unknown as string) === "uuid")
		);
	}

	/**
	 *
	 * Return true if id is valid, false otherwise.
	 *
	 * @param id
	 *
	 * @returns boolean
	 *
	 */
	private isValidId(id: string): boolean {
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
