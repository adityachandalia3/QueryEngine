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
import {clearDisk, getContentFromArchives} from "../TestUtil";

chai.use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: InsightFacade;

	const persistDirectory = "./data";
	const datasetContents = new Map<string, string>();
	let content: string;

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		sections: "./test/resources/archives/pair.zip",
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
			it("should list/contain 0 datasets initially", function () {
				return facade.listDatasets().then((insightdatasets) => {
					expect(insightdatasets).to.deep.equal([]);
				});
			});

			it("Should add a valid dataset", function () {
				this.timeout(10000);
				const id: string = "sections";
				const expected: string[] = [id];
				return facade
					.addDataset(id, content, InsightDatasetKind.Sections)
					.then((result: string[]) => expect(result).to.deep.equal(expected));
			});

			it("should add two datasets", function () {
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

			it("should add dataset with id with whitespace", function () {
				this.timeout(10000);
				return facade.addDataset("sections 1", content, InsightDatasetKind.Sections).then((addedIds) => {
					expect(addedIds).to.deep.equal(["sections 1"]);
				});
			});

			it("should reject two datasets of same id", async function () {
				this.timeout(10000);
				await facade.addDataset("sections", content, InsightDatasetKind.Sections);
				try {
					await facade.addDataset("sections", content, InsightDatasetKind.Sections);
					expect.fail("Should have rejected!");
				} catch (err) {
					expect(err).to.be.instanceOf(InsightError);
				}
			});

			it("should not add dataset id with an underscore", function () {
				const result = facade.addDataset("sections_1", content, InsightDatasetKind.Sections);

				return expect(result).eventually.to.be.rejectedWith(InsightError);
			});

			it("should not add dataset with empty id", function () {
				const result = facade.addDataset("", content, InsightDatasetKind.Sections);

				return expect(result).eventually.to.be.rejectedWith(InsightError);
			});

			it("should not add dataset with id with only whitespace", function () {
				const result = facade.addDataset("   ", content, InsightDatasetKind.Sections);

				return expect(result).eventually.to.be.rejectedWith(InsightError);
			});

			it("should reject dataset of rooms", function () {
				const result = facade.addDataset("rooms", content, InsightDatasetKind.Rooms);

				return expect(result).eventually.to.be.rejectedWith(InsightError);
			});

			it("should reject if dataset is not JSON", function () {
				const content1 = getContentFromArchives("CPSC210.zip");
				return expect(facade.addDataset("CPSC210", content1, InsightDatasetKind.Sections)).to.be.rejectedWith(
					InsightError
				);
			});
		});

		describe("Remove Dataset", function () {
			it("should reject if no datasets available", function () {
				return expect(facade.removeDataset("sections")).eventually.to.be.rejectedWith(NotFoundError);
			});

			it("should remove a dataset", async function () {
				await facade.addDataset("sections", content, InsightDatasetKind.Sections);
				let result = await facade.removeDataset("sections");

				expect(result).to.equal("sections");

				let insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.have.length(0);
			});

			it("should remove first of two datasets", async function () {
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
				await facade.addDataset("sections 1", content, InsightDatasetKind.Sections);

				let result = await facade.removeDataset("sections 1");

				expect(result).to.equal("sections 1");

				let insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.have.length(0);
			});

			it("should add a dataset that has been previously removed", function () {
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

		describe("List Dataset", function () {
			it("should list no datasets", function () {
				this.timeout(10000);
				return facade.listDatasets().then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(0);
				});
			});

			it("should list one dataset", function () {
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

			it("should list multiple datasets", function () {
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
						const insightDatasetsSections = insightDatasets.find((dataset) => dataset.id === "sections");
						expect(insightDatasetsSections).to.exist;
						expect(insightDatasetsSections).to.deep.equal({
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
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
