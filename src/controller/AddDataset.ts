import JSZip from "jszip";
import {IDataset, Room, RoomsDataset, Section, SectionsDataset} from "./Dataset";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {parse, defaultTreeAdapter} from "parse5";
import {table} from "console";
import {networkInterfaces} from "os";

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
		let tbodyNode = SearchNodeTag(document, "tbody");
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
	let shortname, href, buildingInfo, address: any;
	for (const zc of zipContent) {
		if (zc.htmlContent === "") {
			continue;
		}
		let parsedZCContent = parse(zc.htmlContent);
		let tbodyNode: any[] = SearchNodeTag(parsedZCContent, "tbody");
		if (tbodyNode) {
			tableContent = arrayManipulation((getTableContent(tbodyNode)));
			let buildingInfoScope = SearchNodeTag(SearchNodeTag(parsedZCContent, "section"),"h2");
			if(buildingInfoScope){
				buildingInfo = getBuildingInfo(buildingInfoScope);
				address = getAddressInfo(defaultTreeAdapter.getParentNode(buildingInfoScope));
				shortname = String(zc.file).substring(0,String(zc.file).length - 4);
				let index1 = links.indexOf("campus/discover/buildings-and-classrooms/" + String(zc.file));
				href = "http://students.ubc.ca/" + links[index1];
			} else {
				continue;
			};
			rooms = resultsToRooms(tableContent,shortname,href,buildingInfo,address);
			for(const content of rooms){
				roomsResult.push(content);
			}
		} else {
			continue;
		}
	}
	return new RoomsDataset(id, roomsResult.length, roomsResult);
}

function SearchNodeTag(node: any, toFind: string): any {
	if (defaultTreeAdapter.getTagName(node) === toFind) {
		return node;
	}

	if (defaultTreeAdapter.getChildNodes(node) === undefined || defaultTreeAdapter.getChildNodes(node).length === 0) {
		return undefined;
	}

	for (const child of defaultTreeAdapter.getChildNodes(node)) {
		let ret = SearchNodeTag(child, toFind);
		if (ret !== undefined) {
			return ret;
		}
	}
}

function getLinks(node: any): string[] {
	let links: string[] = [];
	let children = [node];
	while (children.length > 0) {
		let curr = children.pop();
		if (defaultTreeAdapter.getChildNodes(curr)) {
			for (const c of curr.childNodes) {
				children.push(c);
			}
		}

		if (defaultTreeAdapter.getTagName(curr) === "a") {
			for (const attr of defaultTreeAdapter.getAttrList(curr)) {
				if (attr.name === "href" &&
				 attr.value.startsWith("./campus/discover/buildings-and-classrooms/") &&
				 attr.value.endsWith(".htm")) {
					if (!links.includes(attr.value.slice(2))) {
						links.push(attr.value.slice(2));
					}
				}
			}
		}
	}
	return links;
}

function getTableContent(node: any): string[] {
	let result: any[] = [];
	let trNodes: any[] = [];
	let finalResult: any[] = [];
	let num: number = 0;

	for (const child of defaultTreeAdapter.getChildNodes(node)) {
		if (child.nodeName === "tr") {
			trNodes.push(child);
		}
	}
	for(const trNode of trNodes){
		let curr = trNode;
		for (const c of defaultTreeAdapter.getChildNodes(curr)) {
			if (c.nodeName === "td") {
				for (const a of defaultTreeAdapter.getChildNodes(c)) {
					if (a.nodeName === "a") {
						let temp: any = defaultTreeAdapter.getFirstChild(a);
						result.push(defaultTreeAdapter.getTextNodeContent(temp));
					} else {
						let temp2: any = a;
						result.push(defaultTreeAdapter.getTextNodeContent(temp2));
					}
				}
			}
		}
		result.pop();
		result.pop();
		result.pop();
		result.shift();
		result.splice(1, 1);
		finalResult.push(result);
		result = [];
	}
	return finalResult;
}

function arrayManipulation(array: any[]): any[] {
	let tempArray: any[] = [];
	let manipulatedArray: any[] = [];
	for(const elem of array){
		for(const elem1 of elem){
			let newElem = elem1.trim();
			tempArray.push(newElem);
		}
		manipulatedArray.push(tempArray);
		tempArray = [];
	}
	return manipulatedArray;
}

function getBuildingInfo(node: any): any{
	let curr: any;
	curr = defaultTreeAdapter.getFirstChild(node);
	let result: any = defaultTreeAdapter.getFirstChild(curr);
	result = defaultTreeAdapter.getTextNodeContent(result);
	return result;

}
function getAddressInfo(node: any): any {
	let result2: any;
	for(const child of defaultTreeAdapter.getChildNodes(node)) {
		let temp: any = child;
		if (defaultTreeAdapter.getTagName(temp) === "div") {
			let tempChild: any = defaultTreeAdapter.getFirstChild(temp);
			let tempChildChild: any = defaultTreeAdapter.getFirstChild(tempChild);
			result2 = defaultTreeAdapter.getTextNodeContent(tempChildChild);
			return result2;
		}
	}

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

function resultsToRooms(tableContent: any[], shortname: any, href: any, buildingInfo: any, address: any,): any[] {
	let roomName, number, capacity, furniture, roomType: any;
	let rooms: any = [];
	for (const content of tableContent) {
		number = content[0];
		capacity = content[1];
		furniture = content [2];
		roomType = content [3];
		roomName = shortname + number;
		rooms.push({
			fullname:buildingInfo, shortname: shortname, number:number, name:roomName, address:address,
			type:roomType, furniture:furniture, href:href, lat:0, lon:0, seats:capacity
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


