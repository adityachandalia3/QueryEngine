import {defaultTreeAdapter} from "parse5";
/**
 *
 * Return true if id is valid, false otherwise.
 *
 * @param id
 *
 * @returns boolean
 *
 */
export function isValidId(id: string): boolean {
	if (id.includes("_")) {
		return false;
	}
	if (id.length === 0) {
		return false;
	}
	if (!id.trim()) {
		return false;
	}
	return true;
}

export function containsId(id: string): boolean {
	return true;
}

export function SearchNode(node:any[]): any{

	const toFind: string = "head";
	let num: number = 0
	console.log("doing the first check");

	for (const child of node){
		console.log(child)
		if (defaultTreeAdapter.getTagName(child) === toFind){
			return node;
		}
		if(defaultTreeAdapter.isCommentNode(child)){
			console.log("A comment node")
			continue;
		}
		if(defaultTreeAdapter.isTextNode(child)){
			console.log("A Text node")
			continue;
		}
		SearchNode(defaultTreeAdapter.getChildNodes(child));
	}





}

