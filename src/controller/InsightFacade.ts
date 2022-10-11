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
import {containsId, isValidId, loadDataset} from "./Helpers";

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

		if (!isValidId(id)) {
			return Promise.reject(new InsightError("id is not valid"));
		}

		if (containsId(id)) {
			return Promise.reject(new InsightError("dataset with same id has already been added"));
		}

		return JSZip.loadAsync(content, {base64: true}).then(function (zip) {
			if (zip.folder(/courses/).length > 0) {
				console.log("root directory validated!");
			} else {
				return Promise.reject(new InsightError("Root directory is not courses"));
			}
			const zipContent: any[] = [];
			const promises: any[] = [];
			let parsed: any[] = [];
			let num = 0;
			zip.forEach(async (relativePath, file) => {
				const promise = file.async("string");
				promises.push(promise);
				zipContent.push({
					file: relativePath,
					content: await promise
				});
			});
			Promise.all(promises).then(async () => {

				for (let i = 0; i < zipContent.length; i++) {
					try {
						let parsing = JSON.parse(zipContent[i].content);
						parsed[i] = parsing;
					} catch (e) {
						console.log(e);
					}
				}
				console.log(parsed);


			});
			return Promise.reject("blah");
		});
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

}
