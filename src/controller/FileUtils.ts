import { Dataset } from "./Dataset";
import { InsightError } from "./IInsightFacade";
import * as fs from "fs-extra";

const persistDir = "./data/";

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
 export function saveDataset(dataset: Dataset): Promise<string> {
	try {
		return fs.outputJson(persistDir + dataset.id + ".JSON", dataset).then(async () => {
			// await saveIds(dataset.id)
			return Promise.resolve(dataset.id);
		});
	} catch {
		return Promise.reject(new InsightError("Unable to save file"));
	}
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
export function loadDataset(id: string): Promise<Dataset> {
	try {
		return fs.readJson(persistDir + id + ".JSON").then((loading) => {
			let newDataset = new Dataset(loading.id, loading.kind, loading.sections.length, loading.sections);
			return Promise.resolve(newDataset);
		});
	} catch {
		return Promise.reject(new InsightError("Could not read file with given id"));
	}
}

export function loadIds(): Promise<string> {
	try {
		return fs.readFile(persistDir + "currentIds", "utf-8").then((stringArray) => {
			return Promise.resolve(stringArray);
		});
	} catch {
		return Promise.reject(new InsightError("Current Ids could not be loaded"));
	}
}

export function saveIds(id: string): Promise<string> {
	try {
		return fs.appendFile(persistDir + "currentIds", "," + id, "utf-8").then(() => {
			return Promise.resolve("Id has been saved");
		});
	} catch {
		return Promise.reject("Id could not be saved");
	}
}
