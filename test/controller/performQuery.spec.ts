import InsightFacade from "../../src/controller/InsightFacade";

import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {InsightDatasetKind, InsightResult} from "../../src/controller/IInsightFacade";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {Section} from "../../src/controller/Dataset";

chai.use(chaiAsPromised);

describe("PQ", function () {
	let facade: InsightFacade;

	before(async function () {
		clearDisk();
		let content: string = getContentFromArchives("pair.zip");
		facade = new InsightFacade();
		console.log(await facade.addDataset("sections", content, InsightDatasetKind.Sections));
	});

	const and = {
		WHERE: {
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
				{
					IS: {
						sections_id: "329",
					},
				},
			],
		},
		OPTIONS: {
			COLUMNS: ["sections_dept", "sections_avg"],
			ORDER: "sections_avg",
		},
	};

	const andResult = [
		{sections_dept: "adhe", sections_avg: 90.02},
		{sections_dept: "adhe", sections_avg: 90.82},
		{sections_dept: "adhe", sections_avg: 92.54},
		{sections_dept: "adhe", sections_avg: 93.33},
		{sections_dept: "adhe", sections_avg: 96.11},
	];

	it("should AND", async function () {
		let ir: InsightResult[] = await facade.performQuery(and);
		expect(ir).to.deep.equal(andResult);
	});
});
