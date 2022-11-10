import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import * as fs from "fs-extra";

import {folderTest} from "@ubccpsc310/folder-test";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {getContentFromArchives} from "../TestUtil";

chai.use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: InsightFacade;

	const persistDirectory = "./data";
	const datasetContents = new Map<string, string>();
	let content: string;
	let roomsContent: string;

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		sections: "./test/resources/archives/pair.zip",
		rooms: "./test/resources/archives/rooms.zip",
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const cont = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, cont);
		}
		// Just in case there is anything hanging around from a previous run of the test suite
		fs.removeSync(persistDirectory);

		content = datasetContents.get("sections") ?? "";
		roomsContent = datasetContents.get("rooms") ?? "";
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			facade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fs.removeSync(persistDirectory);
		});
		describe("Add Dataset", function () {
			describe("Add Sections dataset", function(){
				it("should list/contain 0 datasets initially", function () {
					return facade.listDatasets().then((insightdatasets) => {
						expect(insightdatasets).to.deep.equal([]);
					});
				});

				it("Should add a valid sections dataset", function () {
					this.timeout(10000);
					const id: string = "sections";
					const expected: string[] = [id];
					return facade
						.addDataset(id, content, InsightDatasetKind.Sections)
						.then((result: string[]) => expect(result).to.deep.equal(expected));
				});

				it("should add two sections datasets", function () {
					this.timeout(10000);
					return facade
						.addDataset("sections", content, InsightDatasetKind.Sections)
						.then((addedIds) => {
							expect(addedIds).to.deep.equal(["sections"]);
							return facade.addDataset("sections-2", content, InsightDatasetKind.Sections);
						})
						.then((addedIds) => {
							expect(addedIds).to.be.an.instanceOf(Array);
							expect(addedIds).to.have.length(2);
						});
				});

				it("should add sections dataset with id with whitespace", function () {
					this.timeout(10000);
					return facade.addDataset("sections 1", content, InsightDatasetKind.Sections).then((addedIds) => {
						expect(addedIds).to.deep.equal(["sections 1"]);
					});
				});

				it("should reject two sections datasets of same id", async function () {
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					try {
						await facade.addDataset("sections", content, InsightDatasetKind.Sections);
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(InsightError);
					}
				});

				it("should not add sections dataset id with an underscore", function () {
					const result = facade.addDataset("sections_1", content, InsightDatasetKind.Sections);

					return expect(result).eventually.to.be.rejectedWith(InsightError);
				});

				it("should not add sections dataset with empty id", function () {
					const result = facade.addDataset("", content, InsightDatasetKind.Sections);

					return expect(result).eventually.to.be.rejectedWith(InsightError);
				});

				it("should not add sections dataset with id with only whitespace", function () {
					const result = facade.addDataset("   ", content, InsightDatasetKind.Sections);
					return expect(result).eventually.to.be.rejectedWith(InsightError);
				});

				// it("should reject dataset of rooms", function () {
				// 	const result = facade.addDataset("rooms", content, InsightDatasetKind.Rooms);
				//
				// 	return expect(result).eventually.to.be.rejectedWith(InsightError);
				// });

				it("should reject if sections dataset is not JSON", function () {
					const content1 = getContentFromArchives("CPSC210.zip");
					return expect(facade.addDataset
					("CPSC210", content1, InsightDatasetKind.Sections)).to.be.rejectedWith(InsightError);
				});

			});

			describe("Add Rooms Datasets", function () {
				it("should add a valid rooms dataset", function() {
					this.timeout(10000);
					const id: string = "rooms";
					const expected: string[] = [id];
					return facade
						.addDataset(id,roomsContent,InsightDatasetKind.Rooms)
						.then((result: string[]) => {
							expect(result).to.deep.equal(expected);
						});
				});

				it("should add two valid room datasets", function () {
					this.timeout(10000);
					return facade
						.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms)
						.then((addedIds) => {
							expect(addedIds).to.deep.equal(["rooms"]);
							return facade.addDataset("rooms-2", roomsContent, InsightDatasetKind.Sections);
						})
						.then((addedIds) => {
							expect(addedIds).to.be.an.instanceOf(Array);
							expect(addedIds).to.have.length(2);
						});
				});

				it("should add rooms dataset with id with whitespace", function () {
					this.timeout(10000);
					return facade.addDataset("rooms 1", roomsContent, InsightDatasetKind.Rooms)
						.then((addedIds) => {
							expect(addedIds).to.deep.equal(["rooms 1"]);
						});
				});

				it("should reject two room datasets of same id", async function () {
					this.timeout(10000);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
					try {
						await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(InsightError);
					}
				});

				it("should not add room dataset id with an underscore", function () {
					const result = facade.addDataset("rooms_1", roomsContent, InsightDatasetKind.Rooms);
					return expect(result).eventually.to.be.rejectedWith(InsightError);
				});

				it("should not add room dataset with empty id", function () {
					const result = facade.addDataset("", roomsContent, InsightDatasetKind.Rooms);
					return expect(result).eventually.to.be.rejectedWith(InsightError);
				});

				it("should not add room dataset with id with only whitespace", function () {
					const result = facade.addDataset("   ", roomsContent, InsightDatasetKind.Rooms);
					return expect(result).eventually.to.be.rejectedWith(InsightError);
				});

				it("should reject if dataset is not JSON", function () {
					const content1 = getContentFromArchives("CPSC210.zip");
					return expect(facade.addDataset
					("CPSC210", content1, InsightDatasetKind.Rooms)).to.be.rejectedWith(InsightError);
				});

			});

			describe("Add Rooms and sections datasets together", function(){

				it("Should add rooms dataset and then sections dataset", async function(){
					this.timeout(10000);
					return facade
						.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms)
						.then((addedIds) => {
							expect(addedIds).to.deep.equal(["rooms"]);
							return facade.addDataset("sections", content, InsightDatasetKind.Sections);
						})
						.then((addedIds) => {
							expect(addedIds).to.be.an.instanceOf(Array);
							expect(addedIds).to.have.length(2);
						});
				});

				it("Should add sections dataset first and then rooms dataset", async function(){
					this.timeout(10000);
					return facade
						.addDataset("sections", content, InsightDatasetKind.Sections)
						.then((addedIds) => {
							expect(addedIds).to.deep.equal(["sections"]);
							return facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
						})
						.then((addedIds) => {
							expect(addedIds).to.be.an.instanceOf(Array);
							expect(addedIds).to.have.length(2);
						});
				});
			});
		});

		describe("Remove Dataset", function () {

			describe("Remove for sections", function () {
				it("should reject if no datasets available", function () {
					return expect(facade.removeDataset("sections")).eventually.to.be.rejectedWith(NotFoundError);
				});

				it("should remove a sections dataset", async function () {
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					let result = await facade.removeDataset("sections");

					expect(result).to.equal("sections");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(0);
				});

				it("should remove first of two datasets", async function () {
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					await facade.addDataset("sections-2", content, InsightDatasetKind.Sections);

					let result = await facade.removeDataset("sections");

					expect(result).to.equal("sections");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
					expect(insightDatasets).to.deep.equal([
						{
							id: "sections-2",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);
				});

				it("should remove second of two datasets", async function () {
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					await facade.addDataset("sections-2", content, InsightDatasetKind.Sections);

					let result = await facade.removeDataset("sections-2");

					expect(result).to.equal("sections-2");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
					expect(insightDatasets).to.deep.equal([
						{
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);
				});

				it("should remove a dataset with id that has a space", async function () {
					this.timeout(10000);
					await facade.addDataset("sections 1", content, InsightDatasetKind.Sections);

					let result = await facade.removeDataset("sections 1");

					expect(result).to.equal("sections 1");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(0);
				});

				it("should add a dataset that has been previously removed", function () {
					this.timeout(10000);
					return facade
						.addDataset("sections", content, InsightDatasetKind.Sections)
						.then((addedIds) => {
							expect(addedIds).to.deep.equal(["sections"]);
							return facade.removeDataset("sections");
						})
						.then((removedId) => {
							expect(removedId).to.equal("sections");
							return facade.addDataset("sections", content, InsightDatasetKind.Sections);
						})
						.then((addedIds) => {
							expect(addedIds).to.deep.equal(["sections"]);
						});
				});

				it("should reject dataset that has not been added yet", async function () {
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					try {
						await facade.removeDataset("rooms");
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(NotFoundError);
					}
					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
				});

				it("should reject id with underscore", async function () {
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					try {
						await facade.removeDataset("sections_1");
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(InsightError);
					}
					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
				});

				it("should reject id with only whitespace", async function () {
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					try {
						await facade.removeDataset("   ");
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(InsightError);
					}

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
				});

				it("should reject blank id", async function () {
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					try {
						await facade.removeDataset("");
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(InsightError);
					}

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
				});
			});

			describe("Remove for rooms datasets", function () {

				it("should reject if no rooms datasets available", function () {
					return expect(facade.removeDataset("rooms")).eventually.to.be.rejectedWith(NotFoundError);
				});

				it("should remove a room dataset", async function () {
					this.timeout(10000);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
					let result = await facade.removeDataset("rooms");

					expect(result).to.equal("rooms");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(0);
				});

				it("should remove first of two rooms datasets", async function () {
					this.timeout(10000);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Sections);
					await facade.addDataset("rooms-2", roomsContent, InsightDatasetKind.Sections);

					let result = await facade.removeDataset("rooms");

					expect(result).to.equal("rooms");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
					expect(insightDatasets).to.deep.equal([
						{
							id: "rooms-2",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						},
					]);
				});

				it("should remove a room dataset with id that has a space", async function () {
					this.timeout(10000);
					await facade.addDataset("rooms 1", roomsContent, InsightDatasetKind.Rooms);

					let result = await facade.removeDataset("rooms 1");

					expect(result).to.equal("rooms 1");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(0);
				});

				it("should add a room dataset that has been previously removed", function () {
					this.timeout(10000);
					return facade
						.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms)
						.then((addedIds) => {
							expect(addedIds).to.deep.equal(["rooms"]);
							return facade.removeDataset("rooms");
						})
						.then((removedId) => {
							expect(removedId).to.equal("rooms");
							return facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
						})
						.then((addedIds) => {
							expect(addedIds).to.deep.equal(["rooms"]);
						});
				});

				it("should reject dataset that has not been added yet(for rooms)", async function () {
					this.timeout(10000);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
					try {
						await facade.removeDataset("sections");
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(NotFoundError);
					}
					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
				});

				it("should reject rooms dataset id with underscore", async function () {
					this.timeout(10000);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
					try {
						await facade.removeDataset("rooms_1");
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(InsightError);
					}
					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
				});

				it("should reject rooms id with only whitespace", async function () {
					this.timeout(10000);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
					try {
						await facade.removeDataset("   ");
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(InsightError);
					}

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
				});

				it("should reject blank id for rooms type", async function () {
					this.timeout(10000);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
					try {
						await facade.removeDataset("");
						expect.fail("Should have rejected!");
					} catch (err) {
						expect(err).to.be.instanceOf(InsightError);
					}

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
				});

			});2

			describe("Remove for rooms and sections together", function () {

				it("Remove sections from a list of rooms and sections", async function(){
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);

					let result = await facade.removeDataset("sections");
					expect(result).to.equal("sections");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
					expect(insightDatasets).to.deep.equal([
						{
							id: "rooms",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						},
					]);
				});

				it("Remove rooms from a list of rooms and sections", async function(){
					this.timeout(10000);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);

					let result = await facade.removeDataset("rooms");
					expect(result).to.equal("rooms");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(1);
					expect(insightDatasets).to.deep.equal([
						{
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);
				});

				it("Remove sections from a list of multiple rooms and sections datasets", async  function(){
					this.timeout(10000);
					await facade.addDataset("rooms 1", roomsContent, InsightDatasetKind.Rooms);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
					await facade.addDataset("sections 1", content, InsightDatasetKind.Sections);

					let result = await facade.removeDataset("sections");
					expect(result).to.equal("sections");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(3);
					expect(insightDatasets).to.deep.equal([
						{
							id: "rooms 1",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						},
						{
							id: "rooms",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						},
						{
							id: "sections 1",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);
				});

				it("should remove rooms from a list of multiple rooms and sections datasets", async function(){
					this.timeout(10000);
					await facade.addDataset("rooms 1", roomsContent, InsightDatasetKind.Rooms);
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					await facade.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms);
					await facade.addDataset("sections 1", content, InsightDatasetKind.Sections);

					let result = await facade.removeDataset("rooms");
					expect(result).to.equal("rooms");

					let insightDatasets = await facade.listDatasets();
					expect(insightDatasets).to.have.length(3);

					expect(insightDatasets).to.deep.equal([
						{
							id: "rooms 1",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						},
						{
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
						{
							id: "sections 1",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);

				});
			});
		});


		describe("List Dataset", function () {
			this.timeout(10000);
			it("should list no datasets", function () {
				this.timeout(10000);
				return facade.listDatasets().then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(0);
				});
			});

			it("should list one dataset of type sections only", function () {
				this.timeout(10000);
				fs.removeSync("project_team104/currentIds");
				this.timeout(10000);
				return facade
					.addDataset("sections", content, InsightDatasetKind.Sections)
					.then(() => facade.listDatasets())
					.then((insightDatasets) => {
						expect(insightDatasets).to.deep.equal([
							{
								id: "sections",
								kind: InsightDatasetKind.Sections,
								numRows: 64612,
							},
						]);
					});
			});

			it("should list multiple datasets of type sections only", function () {
				fs.removeSync("project_team104/currentIds");
				this.timeout(10000);
				return facade
					.addDataset("sections", content, InsightDatasetKind.Sections)
					.then(() => {
						return facade.addDataset("sections-2", content, InsightDatasetKind.Sections);
					})
					.then(() => {
						return facade.listDatasets();
					})
					.then((insightDatasets) => {
						expect(insightDatasets).to.be.an.instanceOf(Array);
						expect(insightDatasets).to.have.length(2);
						const insightDatasetsSections = insightDatasets
							.find((dataset) => dataset.id === "sections");
						expect(insightDatasetsSections).to.exist;
						expect(insightDatasetsSections).to.deep.equal({
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						});
					});
			});

			it("should list one dataset of type rooms only", function() {
				this.timeout(10000);
				fs.removeSync("project_team104/currentIds");
				this.timeout(10000);
				return facade
					.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms)
					.then(() => facade.listDatasets())
					.then((insightDatasets) => {
						expect(insightDatasets).to.deep.equal([
							{
								id: "rooms",
								kind: InsightDatasetKind.Sections,
								numRows: 364,
							},
						]);
					});
			})

			it("should list multiple datasets of type rooms only ", function (){
				fs.removeSync("project_team104/currentIds");
				this.timeout(10000);
				return facade
					.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms)
					.then(() => {
						return facade.addDataset("rooms-2", roomsContent, InsightDatasetKind.Rooms);
					})
					.then(() => {
						return facade.listDatasets();
					})
					.then((insightDatasets) => {
						expect(insightDatasets).to.be.an.instanceOf(Array);
						expect(insightDatasets).to.have.length(2);
						const insightDatasetsSections = insightDatasets
							.find((dataset) => dataset.id === "rooms");
						expect(insightDatasetsSections).to.exist;
						expect(insightDatasetsSections).to.deep.equal({
							id: "rooms",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						});
					});
			})

			it("should list multiple datasets of type rooms and sections", function () {
				fs.removeSync("project_team104/currentIds");
				this.timeout(10000);
				return facade
					.addDataset("rooms", roomsContent, InsightDatasetKind.Rooms)
					.then(() => {
						return facade.addDataset("sections", content, InsightDatasetKind.Sections);
					})
					.then(() => {
						return facade.listDatasets();
					})
					.then((insightDatasets) => {
						expect(insightDatasets).to.be.an.instanceOf(Array);
						expect(insightDatasets).to.have.length(2);
						const insightDatasetsSections = insightDatasets
							.find((dataset) => dataset.id === "sections");
						expect(insightDatasetsSections).to.exist;
						expect(insightDatasetsSections).to.deep.equal({
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						});
						const insightDatasetsRooms = insightDatasets
							.find((dataset) => dataset.id === "rooms");
						expect(insightDatasetsRooms).to.exist;
						expect(insightDatasetsRooms).to.deep.equal({
							id: "rooms",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						});
					});
			});
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			this.timeout(10000);
			console.info(`Before: ${this.test?.parent?.title}`);

			facade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				facade.addDataset("sections", datasetContents.get("sections") ?? "", InsightDatasetKind.Sections),
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDirectory);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult: (actual, expected) => {
					// does not test for order
					expect(actual).to.have.deep.members(expected);
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});
