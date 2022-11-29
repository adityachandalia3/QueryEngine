document.getElementById("click-me-button").addEventListener("click", handleClickMe);

function handleClickMe() {
	alert("Button Clicked!");
	console.log(getAveragesQuery("cpsc"));
}

// This function returns a JSON Query to be used with User Story 1
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