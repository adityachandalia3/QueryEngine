import {defaultTreeAdapter} from "parse5";

export function searchNodeTag(node: any, toFind: string): any {
	if (defaultTreeAdapter.getTagName(node) === toFind) {
		return node;
	}

	if (defaultTreeAdapter.getChildNodes(node) === undefined || defaultTreeAdapter.getChildNodes(node).length === 0) {
		return undefined;
	}

	for (const child of defaultTreeAdapter.getChildNodes(node)) {
		let ret = searchNodeTag(child, toFind);
		if (ret !== undefined) {
			return ret;
		}
	}
}
export function searchNodeAttr(node: any, attribute: string, value: string): any {
	let attrList = defaultTreeAdapter.getAttrList(node);
	if (attrList !== undefined) {
		for (const attr of attrList) {
			if (attr["name"] === attribute && attr["value"] === value) {
				return node;
			}
		}
	}

	if (defaultTreeAdapter.getChildNodes(node) === undefined || defaultTreeAdapter.getChildNodes(node).length === 0) {
		return undefined;
	}

	for (const child of defaultTreeAdapter.getChildNodes(node)) {
		let ret = searchNodeAttr(child, attribute, value);
		if (ret !== undefined) {
			return ret;
		}
	}
}
export function getLinks(node: any): string[] {
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
export function getTableContent(node: any): string[] {
	let result: any[] = [];
	let trNodes: any[] = [];
	let finalResult: any[] = [];
	let num: number = 0;

	for (const child of defaultTreeAdapter.getChildNodes(node)) {
		if (child.nodeName === "tr") {
			trNodes.push(child);
		}
	}
	for (const trNode of trNodes) {
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
export function arrayManipulation(array: any[]): any[] {
	let tempArray: any[] = [];
	let manipulatedArray: any[] = [];
	for (const elem of array) {
		for (const elem1 of elem) {
			let newElem = elem1.trim();
			tempArray.push(newElem);
		}
		manipulatedArray.push(tempArray);
		tempArray = [];
	}
	return manipulatedArray;
}
export function getFullname(node: any): any {
	let curr: any = searchNodeTag(node, "h2");
	curr = searchNodeAttr(curr, "class", "field-content");
	curr = defaultTreeAdapter.getFirstChild(curr);
	return defaultTreeAdapter.getTextNodeContent(curr);
}
export function getAddressInfo(node: any): any {
	let result: any;
	for (const child of defaultTreeAdapter.getChildNodes(node)) {
		let temp: any = child;
		if (defaultTreeAdapter.getTagName(temp) === "div") {
			let tempChild: any = defaultTreeAdapter.getFirstChild(temp);
			let tempChildChild: any = defaultTreeAdapter.getFirstChild(tempChild);
			result = defaultTreeAdapter.getTextNodeContent(tempChildChild);
			return result;
		}
	}
}
