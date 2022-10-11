import {Dataset} from "./Dataset";

/**
 *
 * Return true if id is valid, false otherwise.
 *
 * @param id
 *
 * @returns boolean
 *
 */
export function isValidId(id: string): boolean {
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
 * Returns true if id is id of an added dataset, false otherwise.
 * @param id
 * @returns boolean
 */
export function containsId(id: string): boolean {
	// TODO
	return false;
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
export function saveDataset(dataset: Dataset): Promise<string> {
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
export function loadDataset(dataset: Dataset | null, id: string): Promise<string> {
	// use fs.readJson
	return Promise.reject("Not implemented");
}

// export function JSONParsing(file: string): Promise<any[]>{
// 		let parsing =  JSON.parse(file)4
// 		let parsed: any[] = [];
//
// 		for(let i in parsing){
// 			parsed.push(parsing[i]);
// 		}
//
// 		return Promise.resolve(parsed);
//
// }
