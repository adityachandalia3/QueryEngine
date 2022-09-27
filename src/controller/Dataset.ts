import {IDataset} from "./IDataset";
import {InsightDatasetKind, InsightDataset} from "./IInsightFacade";
import Section from "./Section";

export default class Dataset implements IDataset {
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;
	public readonly sections: Section[];

	constructor(id: string, kind: InsightDatasetKind, numRows: number, sections: Section[]) {
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
		this.sections = sections;
	}

	public getInsightDataset(): InsightDataset {
		return {id: this.id, kind: this.kind, numRows: this.numRows};
	}
}
