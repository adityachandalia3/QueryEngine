import JSZip from "jszip";
import {Dataset, Room, RoomsDataset, Section, SectionsDataset} from "../Dataset";
import {InsightDatasetKind, InsightError} from "../IInsightFacade";
import {parse} from "parse5";
import {searchNodeTag, getLinks, arrayManipulation, getTableContent,
	searchNodeAttr, getFullname, getAddressInfo} from "./RoomParsing";
import http from "http";

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

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export function zipToSectionsDataset(zip: JSZip, id: string): Promise<Dataset> {
	let promises = zipToContent(zip);
	return Promise.all(promises).then((contents) => {
		let sections: Section[] = [];
		for (const content of contents) {
			if (content === "") {
				continue;
			}
			let results: Result[] = (JSON.parse(content) as Content).result;
			if (results.length > 0) {
				sections = sections.concat(resultsToSections(id, results));
			}
		}
		return new SectionsDataset(id, sections.length, sections);
	});
}

// to avoid nested callback
let links2: string[];
let files2: any[];
export function zipToRoomsDataset(zip: JSZip, id: string): Promise<Dataset> {
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
		const promises: any[] = [];
		const files: any[] = [];
		buildings.forEach((relativePath, file) => {
			if (links.includes(file.name)) {
				const promise = file.async("string");
				promises.push(promise);
				files.push(relativePath);
			}
		});
		links2 = links;
		files2 = files;
		return Promise.all(promises);

	}).then(async (p) => {
		let dataset: RoomsDataset = parseRoomData(id, p, links2, files2);
		await Promise.all(dataset.getData().map(async (data) => {
			let finalGeo: GeoResponse = await getGeolocation(data[id + "_address"] as string);
			data[id + "_lat"] = finalGeo.lat as number;
			data[id + "_lon"] = finalGeo.lon as number;
		}));
		return dataset;
	});;
}

function parseRoomData(id: string, htmlContent: any[], links: string[], files: any[]): RoomsDataset {

	let roomsResult: Room[] = [];
	let tableContent: any[] = [];
	let shortname, href, fullname, address: any;
	for (let i = 0; i < htmlContent.length; i++) {
		const hc = htmlContent[i];
		if (hc === "") {
			continue;
		}
		let parsedZCContent = parse(hc);
		let tbodyNode: any[] = searchNodeTag(parsedZCContent, "tbody");
		if (tbodyNode) {
			tableContent = arrayManipulation(getTableContent(tbodyNode));
			let buildingInfoScope = searchNodeAttr(parsedZCContent, "id", "building-info");
			if (buildingInfoScope) {
				fullname = getFullname(buildingInfoScope);
				address = getAddressInfo(buildingInfoScope);
				shortname = String(files[i]).substring(0, String(files[i]).length - 4);
				let index1 = links.indexOf("campus/discover/buildings-and-classrooms/" + String(files[i]));
				href = "http://students.ubc.ca/" + links[index1];
			} else {
				continue;
			};
			roomsResult.push(...resultsToRooms(id, tableContent, shortname, href, fullname, address, 0, 0));
		} else {
			continue;
		}
	}
	return new RoomsDataset(id, roomsResult.length, roomsResult);
}

function getGeolocation(address: string): Promise<any> {
	let geolocAdd: string = "";
	let geolocation: GeoResponse;
	let geoArray: any[] = [];
	let inputAddress = String(address).split(" ");
	for (const elem of inputAddress){
		geolocAdd = String(geolocAdd).concat(elem + "%20");
	}
	let geoLoc = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team104/" + geolocAdd;
	geoLoc = geoLoc.substring(0,geoLoc.length - 3);
	geolocAdd = "";
	return new Promise((resolve, reject) => {
		http.get(geoLoc, (result) => {
			let data = "";
			result.on("data", (d: any) => {
				data += d;
			});
			result.on("end",(finaldata: any) => {
				geolocation = JSON.parse(data);
				resolve(geolocation);
			});
		}).on("error", (err) => {
			reject(err);
		});
	});
}

function zipToContent(zip: JSZip): any[] {
	if (zip.folder("courses") === null) {
		return [Promise.reject(new InsightError("No directory named courses"))];
	} else {
		zip = zip.folder("courses") as JSZip;
	}
	const promises: any[] = [];
	zip.forEach((relativePath, file) => {
		const promise = file.async("string");
		promises.push(promise);
	});
	return promises;
}

function resultsToRooms(
	id: string, tableContent: any[], shortname: any,
	href: any, fullname: any, address: any, lat: any, lon: any
): Room[] {
	let roomName, number, capacity, furniture, roomType: any;
	let rooms: Room[] = [];
	for (const content of tableContent) {
		number = content[0];
		let temphref = String(href).substring(0, String(href).length - 4);
		temphref = temphref.slice(0,temphref.lastIndexOf("/")) + "/room" + temphref.slice(temphref.lastIndexOf("/"));
		let newHref = temphref.concat("-" + number);
		capacity = parseInt(content[1], 10);
		furniture = content[2];
		roomType = content[3];
		roomName = shortname + number;
		rooms.push({
			[id + "_fullname"]: fullname,
			[id + "_shortname"]: shortname,
			[id + "_number"]: number,
			[id + "_name"]: roomName,
			[id + "_address"]: address,
			[id + "_type"]: roomType,
			[id + "_furniture"]: furniture,
			[id + "_href"]: newHref,
			[id + "_lat"]: lat,
			[id + "_lon"]: lon,
			[id + "_seats"]: capacity
		});
	}
	return rooms;
}

function resultsToSections(id: string, results: Result[]): Section[] {
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
			[id + "_dept"]: result.Subject,
			[id + "_id"]: result.Course,
			[id + "_instructor"]: result.Professor,
			[id + "_title"]: result.Title,
			[id + "_uuid"]: result.id,
			[id + "_avg"]: result.Avg,
			[id + "_pass"]: result.Pass,
			[id + "_fail"]: result.Fail,
			[id + "_audit"]: result.Audit,
			[id + "_year"]: result.Year,
		});
	}
	return sections;
}


