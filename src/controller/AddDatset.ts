import {Section} from "./Dataset";

export interface Content {
	result: Result[]
}

export interface Result {
	Subject: string,
	Course: string,
	Professor: string,
	Title: string,
	id: number,
	Avg: number,
	Pass: number,
	Fail: number,
	Audit: number,
	Year: number,
	Section: string
}

export function resultsToSections(results: Result[]): Section[] {
	let sections: Section[] = [];
	for (const result of results) {
		if (result.Section === "overall") {
			result.Year = 1900;
		}
		sections.push({dept: result.Subject,
			id: result.Course,
			instructor: result.Professor,
			title: result.Title,
			uuid: result.id,
			avg: result.Avg,
			pass: result.Pass,
			fail: result.Fail,
			audit: result.Audit,
			year: result.Year
		});
	}

	return sections;
}
