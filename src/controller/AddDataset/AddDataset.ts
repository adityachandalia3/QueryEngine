import JSZip from "jszip";
import {IDataset, Room, RoomsDataset, Section, SectionsDataset} from "../Dataset";
import {InsightDatasetKind, InsightError} from "../IInsightFacade";
import {parse} from "parse5";
import {searchNodeTag, getLinks, arrayManipulation, getTableContent,
	searchNodeAttr, getFullname, getAddressInfo} from "./RoomParsing";

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
	if (index === null) {
		return Promise.reject(new InsightError("No file named index.htm"));
	}
	return index.async("string").then((idx) => {
		let document = parse(idx);
		let tbodyNode = searchNodeTag(document, "tbody");
		return getLinks(tbodyNode);
	}).then((links) => {
		let buildings = zip.folder("campus/discover/buildings-and-classrooms");
		if (buildings === null) {
			return Promise.reject(new InsightError("No directory named campus/discover/buildings-and-classrooms"));
		}
		const zipContent: any[] = [];
		const promises: any[] = [];
		buildings.forEach(async (relativePath, file) => {
			if (links.includes(file.name)) {
				const promise = file.async("string");
				promises.push(promise);
				zipContent.push({file: relativePath, htmlContent: await promise});
			}
		});
		return Promise.all(promises).then(() => parseRoomData(id, zipContent, links));
	});
}

function parseRoomData(id: string, zipContent: any[], links: string[]): IDataset {
	let roomsResult: Room[] = [];
	let rooms: Room[] = [];
	let tableContent: any[] = [];
	let shortname, href, fullname, address: any;
	for (const zc of zipContent) {
		if (zc.htmlContent === "") {
			continue;
		}
		let parsedZCContent = parse(zc.htmlContent);
		let tbodyNode: any[] = searchNodeTag(parsedZCContent, "tbody");
		if (tbodyNode) {
			tableContent = arrayManipulation((getTableContent(tbodyNode)));
			let buildingInfoScope = searchNodeAttr(parsedZCContent, "id", "building-info");
			if (buildingInfoScope) {
				fullname = getFullname(buildingInfoScope);
				address = getAddressInfo(buildingInfoScope);
				shortname = String(zc.file).substring(0, String(zc.file).length - 4);
				let index1 = links.indexOf("campus/discover/buildings-and-classrooms/" + String(zc.file));
				href = "http://students.ubc.ca/" + links[index1];
			} else {
				continue;
			};
			roomsResult.push(...resultsToRooms(tableContent, shortname, href, fullname, address));
		} else {
			continue;
		}
	}
	return new RoomsDataset(id, roomsResult.length, roomsResult);
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

function resultsToRooms(tableContent: any[], shortname: any, href: any, fullname: any, address: any,): Room[] {
	let roomName, number, capacity, furniture, roomType: any;
	let rooms: Room[] = [];
	for (const content of tableContent) {
		number = content[0];
		capacity = content[1];
		furniture = content[2];
		roomType = content[3];
		roomName = shortname + number;
		rooms.push({
			fullname: fullname, shortname: shortname, number: number, name: roomName, address: address,
			type: roomType, furniture: furniture, href: href, lat: 0, lon: 0, seats: capacity
		});
	}
	return rooms;
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


