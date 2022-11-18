import {Dataset, SectionsDataset} from "./Dataset";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
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
	return fs.outputJson(persistDir + dataset.id + ".JSON", dataset).then(() => {
		return Promise.resolve(dataset.id);
	});
		// return Promise.reject(new InsightError("Unable to save file"));
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
	return fs.readJson(persistDir + id + ".JSON").then(
		(ret) => {
			return new Dataset(ret.id, ret.kind, ret.numRows, ret.data);
		},
		(err) => {
			return Promise.reject(new InsightError("Could not read file with given id"));
		});
}

export function unlinkDataset(id: string): Promise<any> {
	return fs.promises.unlink(persistDir + id + ".JSON");
}

export function loadIds(): Promise<string[]> {
	return fs.readJson(persistDir + "ids" + ".JSON").then(
		(ids) => ids,
		(err) => {
			if (err.code !== "ENOENT") {
				return Promise.reject(err);
			}
			return Promise.resolve([]);
		}
	);
}

export function saveIds(ids: string[]): Promise<string[]> {
	return fs.outputJson(persistDir + "ids" + ".JSON", ids).then(() => {
		return Promise.resolve(ids);
	});
}

/**
 * To be run once when currentIds has not been initialized yet
 *
 * @param ids
 * @returns
 */
export function updateIds(ids: string[] | null): Promise<string[]> {
	if (ids === null) {
		return loadIds();
	} else {
		return Promise.resolve(ids);
	}
}
