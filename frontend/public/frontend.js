document.getElementById("get-courses").addEventListener("click", coursesListener);
document.getElementById("get-history").addEventListener("click", historyListener);

function coursesListener() {
	let dept = document.getElementById("averages").value;
	console.log(dept);
	const httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			// Everything is good, the response was received.
			if (httpRequest.status == 200) {
				console.log("success");
				/*The application presents the title, 
				id, and overall average of ten courses,
				or less if less than ten courses exist,
				from the chosen department with the highest averages in descending order.
				*/
				document.getElementById("output").innerHTML = "TODO: display result here";

				// If result is empty
				document.getElementById("output").innerHTML = "Invalid department";


			} else if (httpRequest.status == 400) {
				// should not reject
				console.log("query rejected");
			}
		}
	};
	httpRequest.open("POST", "http://localhost:4321/query", true);
	httpRequest.setRequestHeader('Content-Type', 'application/json');
	httpRequest.send(JSON.stringify(getAveragesQuery(dept)));
}

function historyListener() {
	let values = String(document.getElementById("history").value).split(" ");
	let dept = values[0];
	let id = values[1];
	const httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			// Everything is good, the response was received.
			if (httpRequest.status == 200) {
				console.log("success");
				// The application presents the title, id, year, and yearly average of each course in order of year.
				document.getElementById("output").innerHTML = "TODO: display result here";
			} else if (httpRequest.status == 400) {
				console.log("query rejected");
				document.getElementById("output").innerHTML = "Invalid department and id";
			}
		}
	};
	httpRequest.open("POST", "http://localhost:4321/query", true);
	httpRequest.setRequestHeader('Content-Type', 'application/json');
	console.log("sending http request");
	httpRequest.send(JSON.stringify(getHistoryQuery(dept, id)));
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