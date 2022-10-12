import {Dataset, Section} from "./Dataset";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult,} from "./IInsightFacade";
import JSZip from "jszip";
import * as PQ from "./PerformQuery";
import {isValidId, loadDataset} from "./Helpers";
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
	private currentIds: string[];

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.currentDataset = null;
		this.currentIds = [];

	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {

		if (!isValidId(id)) {
			return Promise.reject(new InsightError("id is not valid"));
		}

		if (this.currentIds.includes(id)) {
			return Promise.reject(new InsightError("dataset with same id has already been added"));
		}

		if(kind === InsightDatasetKind.Rooms){
			return Promise.reject(new InsightError("Dataset of Rooms not allowed!"))
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

				if(sections.length<1){
					return Promise.reject(new InsightError("Dataset Contains less than one valid section!"));
				}
				this.currentIds.push(id);
				console.log(this.currentIds)

			});
		}).then(() => {
			return Promise.resolve(this.currentIds);
		});
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
