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
import JSZip from "jszip";
import * as pq from "./PerformQuery";
import {loadDataset} from "./Helpers";

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
			[id, queryString] = pq.checkAndStripId(JSON.stringify(query));
		} catch (err) {
			console.log((err as Error).message);
			return Promise.reject(err);
		}
		query = JSON.parse(queryString);

		if (pq.isQuery(query)) {
			try {
				pq.validateQuery(query);
			} catch (err) {
				console.log((err as Error).message);
				return Promise.reject(err);
			}
			return loadDataset(id).then(
				() => pq.evaluateQuery(),
				(error) => {
					return error;
				}
			);
		} else {
			return Promise.reject(new InsightError("Query given is not a valid query"));
		}
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
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

	private checkID(id: string): number {
		return 1;
	}
}
