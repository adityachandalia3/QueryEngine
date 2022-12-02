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
				let result = JSON.parse(httpRequest.responseText).result;
				table = document.createElement("table");
				row = table.insertRow(0);
				title   = row.insertCell(0);
				id      = row.insertCell(1);
				average = row.insertCell(2);
				title.innerHTML = "Title";
				id.innerHTML = "ID";
				average.innerHTML = "Average";
				for (let i = 0; i < 10 && i < result.length; i++) {
					row = table.insertRow(-1);
					title   = row.insertCell(0);
					id      = row.insertCell(1);
					average = row.insertCell(2);
					title.innerHTML = result[i].sections_title;
					id.innerHTML = result[i].sections_id;
					average.innerHTML = result[i].overallAvg;
				}

				if (result.length == 0) {
					table = document.createElement("span");
					table.innerHTML = "Invalid department";
				}
				
				oldChild = document.getElementById("output").firstChild;
				document.getElementById("output").replaceChild(table, oldChild);
			} else if (httpRequest.status == 400) {
				errorMsg = document.createElement("span");
				errorMsg.innerHTML = "Invalid department";
				oldChild = document.getElementById("output").firstChild;
				document.getElementById("output").replaceChild(errorMsg, oldChild);
			}
		}
	};
	httpRequest.open("POST", "http://localhost:4321/query", true);
	httpRequest.setRequestHeader('Content-Type', 'application/json');
	httpRequest.send(JSON.stringify(getAveragesQuery(dept)));
}

function historyListener() {
	let values = String(document.getElementById("history").value).split(" ");
	let _dept = values[0];
	let _id = values[1];
	const httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			// Everything is good, the response was received.
			if (httpRequest.status == 200) {
				console.log("success");
				// The application presents the title, id, year, and yearly average of each course in order of year.
				let result = JSON.parse(httpRequest.responseText).result;
				table = document.createElement("table");
				row = table.insertRow(0);
				title   = row.insertCell(0);
				id      = row.insertCell(1);
				year      = row.insertCell(2);
				average = row.insertCell(3);
				title.innerHTML = "Title";
				id.innerHTML = "ID";
				year.innerHTML = "Year";
				average.innerHTML = "Average";
				for (let i = 0; i < result.length; i++) {
					row = table.insertRow(-1);
					title   = row.insertCell(0);
					id      = row.insertCell(1);
					year    = row.insertCell(2);
					average = row.insertCell(3);
					title.innerHTML = _dept;
					id.innerHTML = _id;
					year.innerHTML = result[i].sections_year;
					average.innerHTML = result[i].average;
				}

				if (result.length == 0) {
					table = document.createElement("span");
					table.innerHTML = "Invalid department and id";
				}

				oldChild = document.getElementById("output").firstChild;
				document.getElementById("output").replaceChild(table, oldChild);
			} else if (httpRequest.status == 400) {
				errorMsg = document.createElement("span");
				errorMsg.innerHTML = "Invalid department and id";
				oldChild = document.getElementById("output").firstChild;
				document.getElementById("output").replaceChild(errorMsg, oldChild);
			}
		}
	};
	httpRequest.open("POST", "http://localhost:4321/query", true);
	httpRequest.setRequestHeader('Content-Type', 'application/json');
	console.log("sending http request");
	httpRequest.send(JSON.stringify(getHistoryQuery(_dept, _id)));
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




