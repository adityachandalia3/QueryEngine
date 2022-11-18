// import InsightFacade from "../../src/controller/InsightFacade";

// import chai, {expect} from "chai";
// import chaiAsPromised from "chai-as-promised";
// import {InsightDatasetKind, InsightResult} from "../../src/controller/IInsightFacade";
// import {clearDisk, getContentFromArchives} from "../TestUtil";
// import {Section} from "../../src/controller/Dataset";
// import {loadIds, saveIds, updateIds} from "../../src/controller/FileUtils";

// chai.use(chaiAsPromised);

// describe("DP", function () {
// 	let facade: InsightFacade;

// 	this.afterEach(async function () {
// 		clearDisk();
// 	});

// 	it("save and load", async function () {
// 		let arr = ["a", "b"];
// 		await saveIds(arr);
// 		let brr = await loadIds();
// 		expect(brr).to.deep.equal(arr);
// 	});

// 	it("load empty", async function () {
// 		let arr = await loadIds();
// 		expect(arr).to.deep.equal([]);
// 	});

// 	it("updateIds", async function () {
// 		let ids = null;
// 		ids = await updateIds(ids);
// 		expect(ids).to.deep.equal([]);
// 	});

// 	it("updateIds", async function () {
// 		let ids = ["a"];
// 		let ret = await updateIds(ids);
// 		expect(ids).to.deep.equal(ret);
// 	});
// });
