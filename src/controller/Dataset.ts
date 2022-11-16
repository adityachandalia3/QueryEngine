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

export class Dataset implements InsightDataset {
	public readonly id: string;
	public readonly kind: InsightDatasetKind;
	public readonly numRows: number;
	public readonly data: any[];

	constructor(id: string, kind: InsightDatasetKind, numRows: number, data: any[]) {
		this.id = id;
		this.kind = kind;
		this.numRows = numRows;
		this.data = data;
	}

	/**
	 * Returns an InsightDataset.
	 *
	 * @return InsightDataset
	 *
	 * Returns an InsightDataset type for use with InsightFacade
	 */
	public getInsightDataset(): InsightDataset {
		return {id: this.id, kind: this.kind, numRows: this.numRows};
	}

	public getData(): any[] {
		return this.data;
	}
}

export class SectionsDataset extends Dataset {

	constructor(id: string, numRows: number, sections: Section[]) {
		super(id, InsightDatasetKind.Sections, numRows, sections);
	}

	public getData(): Section[] {
		return this.data;
	}
}

export class RoomsDataset extends Dataset {

	constructor(id: string, numRows: number, rooms: Room[]) {
		super(id, InsightDatasetKind.Rooms, numRows, rooms);
	}

	public getData(): Room[] {
		return this.data;
	}
}
