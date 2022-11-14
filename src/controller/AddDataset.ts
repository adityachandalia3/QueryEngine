import JSZip from "jszip";
import {IDataset, Room, RoomsDataset, Section, SectionsDataset} from "./Dataset";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export interface Content {
	result: Result[];
}

export interface Result {
	Subject: string;
	Course: string;
	Professor: string;
	Title: string;
	id: number;
	Avg: number;
	Pass: number;
	Fail: number;
	Audit: number;
	Year: number;
	Section: string;
}

export function zipToSectionsDataset(zip: JSZip, id: string): Promise<IDataset> {
	let [promises, zipContent] = zipToContent(zip);
	return Promise.all(promises).then(async () => {
		let sections: Section[] = [];
		for (const zc of zipContent) {
			if (zc.content === "") {
				continue;
			}
			let results: Result[] = (JSON.parse(zc.content) as Content).result;
			if (results.length > 0) {
				sections = sections.concat(resultsToSections(results));
			}
		}
		return new SectionsDataset(id, sections.length, sections);
	});
}

export function zipToRoomsDataset(zip: JSZip, id: string): Promise<IDataset> {
	let index = zip.file("index.htm");
	if (index == null) {
		return Promise.reject(new InsightError("No file named index.htm"));
	}
	index.async("string").then((idx) => {
		// idx is index.htm as a string
		// console.log(idx);
	});

	let buildings = zip.folder("campus/discover/buildings-and-classrooms");
	if (buildings === null) {
		return Promise.reject(new InsightError("No directory named campus/discover/buildings-and-classrooms"));
	}

	const zipContent: any[] = [];
	const promises: any[] = [];
	buildings.forEach(async (relativePath, file) => {
		const promise = file.async("string");
		promises.push(promise);
		zipContent.push({file: relativePath, content: await promise});
	});

	return Promise.all(promises).then(() => {
		let rooms: Room[] = [];
		for (const zc of zipContent) {
			if (zc.content === "") {
				continue;
			}
			// TODO parse zc.content into a result
			let results: Result[] = [];
			if (results.length > 0) {
				rooms = rooms.concat(resultsToRooms(results));
			}
		}
		return new RoomsDataset(id, rooms.length, rooms);
	});
}

function zipToContent(zip: JSZip): any[] {
	if (zip.folder("courses") === null) {
		return [Promise.reject(new InsightError("No directory named courses"))];
	} else {
		zip = zip.folder("courses") as JSZip;
	}
	const zipContent: any[] = [];
	const promises: any[] = [];
	zip.forEach(async (relativePath, file) => {
		const promise = file.async("string");
		promises.push(promise);
		zipContent.push({file: relativePath, content: await promise});
	});
	return [promises, zipContent];
}

function resultsToRooms(results: Result[]): Room[] {
	// TODO
	return [];
}

function resultsToSections(results: Result[]): Section[] {
	let sections: Section[] = [];
	for (const result of results) {
		if (result.Section === "overall") {
			result.Year = 1900;
		}
		if (
			result.Subject === undefined ||
			result.Course === undefined ||
			result.Professor === undefined ||
			result.Title === undefined ||
			result.id === undefined ||
			result.Avg === undefined ||
			result.Pass === undefined ||
			result.Fail === undefined ||
			result.Audit === undefined ||
			result.Year === undefined
		) {
			continue;
		}
		sections.push({
			dept: result.Subject,
			id: result.Course,
			instructor: result.Professor,
			title: result.Title,
			uuid: result.id,
			avg: result.Avg,
			pass: result.Pass,
			fail: result.Fail,
			audit: result.Audit,
			year: result.Year,
		});
	}
	return sections;
}
