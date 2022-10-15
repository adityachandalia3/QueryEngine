import {Dataset, Section} from "./Dataset";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {Query} from "./PerformQuery/Query";
import JSZip from "jszip";
import {checkAndStripId, isQuery, validateQuery} from "./PerformQuery/Validation";
import {containsId, isValidId} from "./Helpers";
import * as AD from "./AddDataset";
import {evaluateQuery} from "./PerformQuery/Evaluation";
import {saveDataset, saveIds, loadDataset, loadIds, updateIds} from "./FileUtils";
import * as fs from "fs";

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
	private currentIds: string[] | null;

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.currentDataset = null;
		this.currentIds = null;
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return updateIds(this.currentIds)
			.then((ids) => {
				this.currentIds = ids;
				if (!isValidId(id)) {
					return Promise.reject(new InsightError("id is not valid"));
				}
				if (this.currentIds.includes(id)) {
					return Promise.reject(new InsightError("dataset with same id has already been added"));
				}
				if (kind === InsightDatasetKind.Rooms) {
					return Promise.reject(new InsightError("Dataset of Rooms not allowed!"));
				}
				return JSZip.loadAsync(content, {base64: true});
			})
			.then((zip) => {
				let [promises, zipContent] = AD.zipToContent(zip);
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
					if (sections.length < 1) {
						return Promise.reject(new InsightError("Dataset Contains less than one valid section!"));
					}
					(this.currentIds as string[]).push(id);
					await saveDataset(this.currentDataset);
					await saveIds(this.currentIds as string[]);
				});
			})
			.then(() => {
				return Promise.resolve(this.currentIds || []);
			});
	}

	public removeDataset(id: string): Promise<string> {
		return updateIds(this.currentIds).then(async (ids) => {
			if (!isValidId(id)) {
				return Promise.reject(new InsightError("id is not valid"));
			}
			if (!ids.includes(id)) {
				return Promise.reject(new NotFoundError("dataset with id not found"));
			}
			if (this.currentIds?.includes(id)) {
				let index = this.currentIds?.indexOf(id);
				this.currentIds?.splice(index, 1);
			}
			await fs.unlink("./data/" + id + ".JSON", err => {
				if (err) throw err;
			})
			await saveIds(this.currentIds as string[]);
			return Promise.resolve(id);
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		let id: string;
		let queryString: string;

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
			if (this.currentDataset !== null && this.currentDataset.id === id) {
				return Promise.resolve(evaluateQuery(this.currentDataset as Dataset, query as Query));
			} else {
				return updateIds(this.currentIds).then(() => {
					// containsId();
					return loadDataset(id).then(
						(dataset) => {
							this.currentDataset = dataset;
							return evaluateQuery(this.currentDataset as Dataset, query as Query);
						},
						(err) => {
							return Promise.reject(err);
						}
					);
				});
			}
		} else {
			return Promise.reject(new InsightError("Query given is not a valid query"));
		}
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		let insightDatasets: InsightDataset[] = [];
		let promises: any[] = [];
		return updateIds(this.currentIds)
			.then((ids) => {
				for (const id of ids) {
					promises.push(loadDataset(id));
				}
				return Promise.all(promises);
			})
			.then((datasets) => {
				datasets.forEach((ds) => {
					let dataset: Dataset = ds;
					let res: InsightDataset = {id: dataset.id, kind: dataset.kind, numRows: dataset.numRows};
					insightDatasets.push(res);
				});
				return insightDatasets;
			});
	}
}
