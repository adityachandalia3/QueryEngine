import {InsightDatasetKind, InsightDataset} from "./IInsightFacade";

export interface Section {
	dept: string;
	id: string;
	instructor: string;
	title: string;
	uuid: number;
	avg: number;
	pass: number;
	fail: number;
	audit: number;
	year: number;
}

export interface Room {
	fullname: string;
	shortname: string;
	number: string;
	name: string;
	address: string;
	type: string;
	furniture: string;
	href: string;
	lat: number;
	lon: number;
	seats: number;
}

export interface IDataset extends InsightDataset {
	readonly id: string;
	readonly kind: InsightDatasetKind;
	readonly numRows: number;

	/**
	 * Returns an InsightDataset.
	 *
	 * @return InsightDataset
	 *
	 * Returns an InsightDataset type for use with InsightFacade
	 */
	getInsightDataset(): InsightDataset;
}

export class SectionsDataset implements IDataset {
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

export class RoomsDataset implements IDataset {
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;
	public readonly rooms: Room[];

	constructor(id: string, kind: InsightDatasetKind, numRows: number, rooms: Room[]) {
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
		this.rooms = rooms;
	}

	public getInsightDataset(): InsightDataset {
		return {id: this.id, kind: this.kind, numRows: this.numRows};
	}
}

