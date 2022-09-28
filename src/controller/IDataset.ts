import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import Section from "./Section";

export interface IDataset extends InsightDataset {
	readonly id: string;
	readonly kind: InsightDatasetKind;
	readonly numRows: number;
	readonly sections: Section[];

	/**
	 * Returns an InsightDataset.
	 *
	 * @return InsightDataset
	 *
	 * Returns an InsightDataset type for use with InsightFacade
	 */
	getInsightDataset(): InsightDataset;
}
