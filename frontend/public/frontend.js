document.getElementById("click-me-button").addEventListener("click", handleClickMe);

function handleClickMe() {
	alert("Button Clicked!");
	console.log(getAveragesQuery("cpsc"));
}

// This function returns a JSON query to be used with User Story 2
// dept: string, id: string
function getYearlyQuery(dept, id) {
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