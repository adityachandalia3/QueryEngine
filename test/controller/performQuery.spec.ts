import InsightFacade from "../../src/controller/InsightFacade";

import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("PerformQueryUnitTests", function () {
	let facade: InsightFacade;

	beforeEach(function () {
		facade = new InsightFacade();
	});

	// TEMP TEST
	it("should not throw an error", function () {
		facade.performQuery({
			WHERE: {
				OR: [
					{
						AND: [
							{
								GT: {
									sections_avg: 90,
								},
							},
							{
								IS: {
									sections_dept: "adhe",
								},
							},
						],
					},
					{
						EQ: {
							sections_avg: 95,
						},
					},
				],
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_id", "sections_avg"],
				ORDER: "sections_avg",
			},
		});
	});
});
