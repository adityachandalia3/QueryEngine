document.getElementById("get-history").addEventListener("click", historyListener);
document.getElementById("get-courses").addEventListener("click", coursesListener);

function historyListener() {
	let dept = "cpsc";
	let id = "310";
	const httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			// Everything is good, the response was received.
			if (httpRequest.status == 200) {
				console.log("success");
			} else if (httpRequest.status == 400) {
				console.log("query rejected");
			}
		} else {
			// Not ready yet.
		}
	};
	httpRequest.open("POST", "http://localhost:4321/query", true);
	httpRequest.setRequestHeader('Content-Type', 'application/json');
	console.log("sending http request");
	httpRequest.send(JSON.stringify(getHistoryQuery(dept, id)));
}

function coursesListener() {
	let dept = "cpsc";

	const httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			// Everything is good, the response was received.
			if (httpRequest.status == 200) {
				console.log("success");
			} else if (httpRequest.status == 400) {
				console.log("query rejected");
			}
		} else {
			// Not ready yet.
		}
	};
	httpRequest.open("POST", "http://localhost:4321/query", true);
	httpRequest.setRequestHeader('Content-Type', 'application/json');
	httpRequest.send(JSON.stringify({}));
}

// This function returns a JSON query to be used with User Story 2
// dept: string, id: string
function getHistoryQuery(dept, id) {
	return {
		"WHERE": {
			"AND": [
				{ "IS": { "sections_dept": dept } },
				{ "IS": { "sections_id": id } }
			]
		},
		"OPTIONS": { 
			"COLUMNS": ["average", "sections_year"],
			"ORDER": { "dir": "DOWN", "keys": ["sections_year"] } },
			"TRANSFORMATIONS": { 
				"APPLY": [{ "average": { "AVG": "sections_avg" } }],
				"GROUP": ["sections_year"]
			}
	}
}

// This function returns a JSON Query to be used with User Story 1
// dept: string
function getAveragesQuery(dept) {
	return {
		"WHERE": {
			"IS": {
				"sections_dept": dept
			}
		},
		"OPTIONS": {
			"COLUMNS": [
				"sections_title",
				"sections_id",
				"overallAvg"
			],
			"ORDER": {
				"dir": "DOWN",
				"keys": [
					"overallAvg"
				]
			}
		},
		"TRANSFORMATIONS": {
			"APPLY": [
				{
					"overallAvg": {
						"AVG": "sections_avg"
					}
				}
			],
			"GROUP": [
				"sections_title",
				"sections_id"
			]
		}
	};
}