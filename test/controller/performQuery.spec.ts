import InsightFacade from "../../src/controller/InsightFacade";

import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("PerformQueryUnitTests", function () {
	let facade: InsightFacade;

	beforeEach(function () {
		facade = new InsightFacade();
	});

	// it("should AND", function() {
	// 	facade.performQuery({
	// 		"WHERE": {
	// 			"AND": [
	// 				{
	// 				   "GT": {
	// 					  "sections_avg": 90
	// 				   }
	// 				},
	// 				{
	// 				   "IS": {
	// 					  "sections_dept": "adhe"
	// 				   }
	// 				},
	// 				{
	// 				   "IS": {
	// 					  "sections_id": "329"
	// 				   }
	// 				}
	// 			 ]
	// 		},
	// 		"OPTIONS": {
	// 			"COLUMNS": [
	// 				"sections_dept",
	// 				"sections_avg"
	// 			],
	// 			"ORDER": "sections_avg"
	// 		}
	// 	});
	// })

	// it("should OR", function() {
	// 	facade.performQuery({
	// 		"WHERE": {
	// 			"OR": [
	// 				{
	// 				   "GT": {
	// 					  "sections_avg": 90
	// 				   }
	// 				},
	// 				{
	// 				   "IS": {
	// 					  "sections_dept": "adhe"
	// 				   }
	// 				},
	// 				{
	// 				   "IS": {
	// 					  "sections_id": "329"
	// 				   }
	// 				}
	// 			 ]
	// 		},
	// 		"OPTIONS": {
	// 			"COLUMNS": [
	// 				"sections_dept",
	// 				"sections_avg"
	// 			],
	// 			"ORDER": "sections_avg"
	// 		}
	// 	});
	// })
});
