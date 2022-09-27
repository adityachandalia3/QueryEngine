import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
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
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}

	/**
	 * Saves a dataset (stored in memory in the InsightDataset object) to disk as a JSON file.
	 *
	 * @param dataset  The dataset to be saved to disk.
	 *
	 * @return Promise <string>
	 *
	 * The promise should fulfill with the id of the saved dataset.
	 * The promise should fulfill with an InsightError (for any other source of failure) describing the error.
	 */
	private saveDataset(dataset: InsightDataset): Promise<string> {
		// use fs.outputJson
		return Promise.reject("Not implemented");
	}

	/**
	 * Loads a dataset from disk to memory to the InsightDataset object.
	 *
	 * @param jsonData  The JSON data to be loaded from disk.
	 *
	 * @return Promise <string>
	 *
	 * The promise should fulfill with the id of the loaded dataset.
	 * The promise should fulfill with an InsightError (for any other source of failure) describing the error.
	 */
		 private loadDataset(jsonData: unknown): Promise<string> {
			// use fs.readJson
			return Promise.reject("Not implemented");
		}
}
