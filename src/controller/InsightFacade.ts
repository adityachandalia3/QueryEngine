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
import {Filter, Query, Mkey, Skey} from "./PerformQuery/Query";
import JSZip from "jszip";
import {checkAndStripId, isQuery, validateQuery} from "./PerformQuery/Validation";
import {containsId, isValidId, loadDataset} from "./Helpers";
import * as AD from "./AddDatset";
import {evaluateQuery} from "./PerformQuery/Evaluation";

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

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.currentDataset = null;
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

		if (!isValidId(id)) {
			return Promise.reject(new InsightError("id is not valid"));
		}

		if (containsId(id)) {
			return Promise.reject(new InsightError("dataset with same id has already been added"));
		}

		return JSZip.loadAsync(content, {base64: true}).then((zip) => {
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
			return Promise.all(promises).then(async () => {
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
				this.currentDataset = new Dataset(id, kind, sections.length, sections);
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
			[id, queryString] = checkAndStripId(JSON.stringify(query));
		} catch (err) {
			console.log((err as Error).message);
			return Promise.reject(err);
		}

		query = JSON.parse(queryString);

		if (isQuery(query)) {
			try {
				validateQuery(query);
			} catch (err) {
				console.log((err as Error).message);
				return Promise.reject(err);
			}
			return loadDataset(this.currentDataset, id).then(
				() => evaluateQuery(this.currentDataset as Dataset, query as Query),
				(err) => {
					return Promise.reject(err);
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
