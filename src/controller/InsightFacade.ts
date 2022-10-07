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
import {Query} from "./Query";
import Section from "./Section";
import JSZip from "jszip";

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

		JSZip.loadAsync(content).then(function (zip){

			if (zip.folder(/courses/).length > 0){
				console.log("root directory validated!");
			} else {
				throw InsightError;
				return Promise.reject("Root Directory is not courses");
			}
		});
		return Promise.reject("Not implemented.");
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}
	public performQuery(query: unknown): Promise<InsightResult[]> {
		let id, queryString;
		try {
			[id, queryString] = this.checkAndStripId(JSON.stringify(query).toLowerCase());
			query = JSON.parse(queryString);
		} catch (err) {
			return Promise.reject(err);
		}

		if (this.isQuery(query)) {
			let filterFun = this.parseAndValidateQuery(query);
			// TODO: check id is valid dataset ex) checkId(id)
			return this.loadDataset(id).then(
				() => this.evaluateQuery(filterFun),
				(error) => {
					return error;
				}
			);
		} else {
			return Promise.reject(new InsightError("query given is not a valid query"));
		}
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
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
		};
		if (id.length === 0) {
			return false;
		}
		if (!id.trim()) {
			return false;
		}
		return true;
	}

	/**
	 * Returns id and query with id stripped.
	 *
	 * @param query
	 * @returns [id, query]
	 *
	 * Will ??? if not all ids are the same.
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
		if (!this.isValidId(id)) {
			throw new InsightError("id is not valid");
		}

		query = query.replaceAll(regex, "");
		return [id, query];
	}

	// TODO
	private isQuery(query: unknown): query is Query {
		return true;
	}

	/**
	 *
	 * Does the following:
	 * 3) parse data to Query.ts/function
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
	private parseAndValidateQuery(query: Query): (s: Section) => boolean {
		let id: string = "";

		function filterFun(s: Section) {
			return false;
		}

		return filterFun;
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

	// /**
	//  *
	//  * @param id The id of the dataset to be validates
	//  * @param content The base64 content of the dataset. This content should be in the form of a serialized zip file.
	//  * @param kind The kind of the dataset
	//  *
	//  * @return Promise <string>
	//  *
	//  * The promise should fulfill with the id of the validated dataset
	//  * The promise should reject if the dataset is not valid describing the error
	//  */

// 	private async validatingDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string> {
//
// 		const JSZip = require("jszip");
// 		const fs = require("fs");
//
//
//
// 		fs.readFile(content,
// 			function (err: any, zip: string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream) {
// 			 JSZip.loadAsync(zip)
// 				 .then(function (zip: { folder: (arg0: RegExp) => { (): any; new(): any; length: number; }; }) {
// 					if(zip.folder(/courses/).length > 0) {
//
// 					} else {
// 						return Promise.reject("Root Directory is not courses");
// 					}
//
// 				})
// 		})
//
// 		return Promise.reject("Not implemented completely")
// 	}

	/**
	 * Checks/validates the id of the dataset that needs to be added according to the specification of addDataset
	 *
	 * @param id The id of the dataset that needs to be added
	 * @private
	 *
	 * @return a number indicating the time of error
	 */

	private checkID(id: string):number {
		return 1;
	}
}

