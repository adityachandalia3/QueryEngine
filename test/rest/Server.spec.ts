import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect, use} from "chai";
import chaiHttp from "chai-http";
import * as fs from "fs-extra";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";
import Controller from "../../src/rest/Controller";

describe("Server", function () {

	let facade: InsightFacade;
	let server: Server;
	const SERVER_URL: string = "http://localhost:4321";

	const persistDirectory = "./data";
	const pair = "test/resources/archives/pair.zip";
	const rooms = "test/resources/archives/rooms.zip";
	let pairBuffer: Buffer;
	let roomsBuffer: Buffer;
	let pair64: string;

	use(chaiHttp);

	before(function () {
		facade = Controller.facade;

		server = new Server(4321);
		server.start().catch(() => {
			throw new Error("Error starting server");
		});

		pairBuffer = fs.readFileSync(pair);
		roomsBuffer = fs.readFileSync(rooms);
		pair64 = fs.readFileSync(pair).toString("base64");
		fs.removeSync(persistDirectory);
	});

	after(async function () {
		server.stop().catch(() => {
			throw new Error("Error stopping server");
		});
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what"s going on
		fs.removeSync(persistDirectory);
	});

	it("PUT test for courses dataset - 200 status", function () {
		const id: string = "sectionsDataset";
		const kind: InsightDatasetKind = InsightDatasetKind.Sections;
		const expected: string[] = [id];
		const ENDPOINT_URL: string = `/dataset/${id}/${kind}`;
		const ZIP_FILE_DATA: Buffer = pairBuffer;
		try {
			return chai.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					logBody(res);
					expect(res.status).to.be.equal(200);
					expect(res.body["result"]).to.deep.equal(expected);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			// console.log(err);
		}
	});

	it("PUT test for courses dataset - 400 status", function () {
		const id: string = "_";
		const kind: InsightDatasetKind = InsightDatasetKind.Sections;
		const ENDPOINT_URL: string = `/dataset/${id}/${kind}`;
		const ZIP_FILE_DATA: Buffer = pairBuffer;
		try {
			return chai.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					logBody(res);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("DELETE test for courses dataset - 200 status", async () => {
		const id: string = "sections";
		const ENDPOINT_URL: string = `/dataset/${id}`;
		await facade.addDataset(id, pair64, InsightDatasetKind.Sections);
		try {
			return chai.request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					logBody(res);
					expect(res.status).to.be.equal(200);
					expect(res.body["result"]).to.deep.equal(id);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("DELETE test for courses dataset - 404 status", function () {
		const id: string = "sections";
		const ENDPOINT_URL: string = `/dataset/${id}`;
		try {
			return chai.request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					logBody(res);
					expect(res.status).to.be.equal(404);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("DELETE test for courses dataset - 404 status", function () {
		const id: string = "_";
		const ENDPOINT_URL: string = `/dataset/${id}`;
		try {
			return chai.request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					logBody(res);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("POST test for query - 200 status", async () => {
		const ENDPOINT_URL: string = "/query";
		const expected = {
			result: [{sections_dept: "adhe", sections_id: "329", sections_avg: 92.54},
				{sections_dept: "adhe", sections_id: "329", sections_avg: 93.33},
				{sections_dept: "adhe", sections_id: "329", sections_avg: 96.11}]
		};
		const QUERY_JSON_DATA = {
			WHERE: {OR: [{AND: [{GT: {sections_avg: 92}}, {IS: {sections_dept: "adhe"}}]}]},
			OPTIONS: {COLUMNS: ["sections_dept", "sections_id", "sections_avg"], ORDER: "sections_avg"}
		};

		const id = "sections";
		await facade.addDataset(id, pair64, InsightDatasetKind.Sections);

		try {
			return chai.request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(QUERY_JSON_DATA)
				.set("Content-Type", "application/json")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					logBody(res);
					expect(res.status).to.be.equal(200);
					expect(res.body).to.deep.equal(expected);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("POST test for query - 400 status", async () => {
		const ENDPOINT_URL: string = "/query";
		const QUERY_JSON_DATA = {
			WHERE: {
				OR: [
					{
						AND: []
					},
					{
						EQ: {
							sections_avg: 95
						}
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"sections_dept",
					"sections_id",
					"sections_avg"
				],
				ORDER: "sections_avg"
			}
		};

		const id = "sections";
		await facade.addDataset(id, pair64, InsightDatasetKind.Sections);

		try {
			return chai.request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(QUERY_JSON_DATA)
				.set("Content-Type", "application/json")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					logBody(res);
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});


	it("GET test", async () => {
		const ENDPOINT_URL: string = "/datasets";

		const id = "sections";
		await facade.addDataset(id, pair64, InsightDatasetKind.Sections);

		try {
			return chai.request(SERVER_URL)
				.get(ENDPOINT_URL)
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					logBody(res);
					expect(res.status).to.be.equal(200);
					expect(res.body["result"]).to.deep.equal([
						{
							id: "sections",
							kind: InsightDatasetKind.Sections,
							numRows: 64612,
						},
					]);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});

	it("GET test empty", async () => {
		const ENDPOINT_URL: string = "/datasets";

		try {
			return chai.request(SERVER_URL)
				.get(ENDPOINT_URL)
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					logBody(res);
					expect(res.status).to.be.equal(200);
					expect(res.body["result"]).to.deep.equal([]);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail(err);
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
		}
	});
});

function logBody(res: ChaiHttp.Response) {
	console.log("\t - response received: ", res.body);
}
