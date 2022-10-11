import {Dataset, Section} from "./Dataset";
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
import JSZip from "jszip";
import * as PQ from "./PerformQuery";
import {containsId, isValidId, loadDataset} from "./Helpers";
import * as AD from "./AddDatset";

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
	private currentDataset: Dataset | null;
	private a: number;

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.currentDataset = null;
		this.a = 1;
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

		if (!isValidId(id)) {
			return Promise.reject(new InsightError("id is not valid"));
		}

		if (containsId(id)) {
			return Promise.reject(new InsightError("dataset with same id has already been added"));
		}

		return JSZip.loadAsync(content, {base64: true}).then(function (zip) {
			if (zip.folder("courses") === null) {
				return Promise.reject(new InsightError("No directory named courses"));
			} else {
				zip = zip.folder("courses") as JSZip;
			}

			const zipContent: any[] = [];
			const promises: any[] = [];

			zip.forEach(async (relativePath, file) => {
				const promise = file.async("string");
				promises.push(promise);
				zipContent.push({
					file: relativePath,
					content: await promise
				});
			});
			return Promise.all(promises).then(async function(this: any) {
				let sections: Section[] = [];

				for (const zc of zipContent) {
					if (zc.content === "") {
						continue;
					}
					let results: AD.Result[] = (JSON.parse(zc.content) as AD.Content).result;
					if (results.length > 0) {
						sections = sections.concat(AD.resultsToSections(results));
					}
				}
				// this.currentDataset = new Dataset(id, kind, sections.length, sections);
				// TypeError: Cannot set properties of undefined (setting 'currentDataset')
			});
		}).then(() => {
			return Promise.resolve(["TODO"]);
		});;
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		let id, queryString;

		try {
			[id, queryString] = PQ.checkAndStripId(JSON.stringify(query));
		} catch (err) {
			console.log((err as Error).message);
			return Promise.reject(err);
		}
		query = JSON.parse(queryString);

		if (PQ.isQuery(query)) {
			try {
				PQ.validateQuery(query);
			} catch (err) {
				console.log((err as Error).message);
				return Promise.reject(err);
			}
			return loadDataset(id).then(
				() => PQ.evaluateQuery(),
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
