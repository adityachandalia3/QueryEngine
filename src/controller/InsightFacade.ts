import {SectionsDataset, Section, Dataset} from "./Dataset";
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
import {isValidId} from "./Helpers";
import * as AD from "./AddDataset/AddDataset";
import {evaluateQuery} from "./PerformQuery/Evaluation";
import {saveDataset, saveIds, loadDataset, loadIds, updateIds, unlinkDataset} from "./FileUtils";
import * as fs from "fs";
import {html, parse} from "parse5";


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
				return JSZip.loadAsync(content, {base64: true});
			})
			.then((zip) => {
				if (kind === InsightDatasetKind.Rooms) {
					return AD.zipToRoomsDataset(zip, id);
				} else {
					return AD.zipToSectionsDataset(zip, id);
				}
			})
			.then(async (dataset) => {
				if (dataset.numRows < 1) {
					return Promise.reject(new InsightError("Dataset Contains less than one valid section/room!"));
				}
				this.currentDataset = dataset;
				(this.currentIds as string[]).push(id);
				return saveDataset(dataset);
			}).then(() => {
				return saveIds(this.currentIds as string[]);
			}).then(() => {
				return this.currentIds || [];
			});
	}


	public removeDataset(id: string): Promise<string> {
		return updateIds(this.currentIds).then(async (ids) => {
			if (!isValidId(id)) {
				return Promise.reject(new InsightError("id is not valid"));
			}
			if (this.currentIds?.includes(id)) {
				let index = this.currentIds?.indexOf(id);
				this.currentIds?.splice(index, 1);
			} else {
				return Promise.reject(new NotFoundError("dataset with id not found"));
			}
			return unlinkDataset(id);
		}).then(() => {
			return saveIds(this.currentIds as string[]).then(() => {
				return id;
			});
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		let id: string;

		try {
			id = checkAndStripId(JSON.stringify(query));
		} catch (err) {
			// console.log((err as Error).message);
			return Promise.reject(err);
		}

		if (isQuery(query)) {
			if (this.currentDataset !== null && this.currentDataset.id === id) {
				try {
					validateQuery(query, this.currentDataset.kind);
				} catch (err) {
					// console.log((err as Error).message);
					return Promise.reject(err);
				}
				return Promise.resolve(evaluateQuery(this.currentDataset as Dataset, query as Query));
			} else {
				return updateIds(this.currentIds).then(() => {
					return loadDataset(id);
				}).then(
					(dataset) => {
						this.currentDataset = dataset;
						try {
							validateQuery(query as Query, this.currentDataset.kind);
						} catch (err) {
							// console.log((err as Error).message);
							return Promise.reject(err);
						}
						return evaluateQuery(this.currentDataset as Dataset, query as Query);
					},
					(err) => {
						return Promise.reject(err);
					}
				);
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
