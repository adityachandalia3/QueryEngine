import * as fs from "fs-extra";
import {InsightDatasetKind, InsightError} from "./controller/IInsightFacade";
import Controller from "./rest/Controller";
import Server from "./rest/Server";

/**
 * Main app class that is run with the node command. Starts the server.
 */
export class App {
	public initServer(port: number) {
		console.info(`App::initServer( ${port} ) - start`);

		const server = new Server(port);
		return server.start().then(() => {
			console.info("App::initServer() - started");
		}).catch((err: Error) => {
			console.error(`App::initServer() - ERROR: ${err.message}`);
		});
	}
}

// This ends up starting the whole system and listens on a hardcoded port (4321)
console.info("App - starting");
const app = new App();
(async () => {
	await app.initServer(4321);
})();

// Add dataset for frontend - DOES NOT CLEAR DISK
(async () => {
	console.log("Adding starting dataset");
	try {
		await Controller.facade.addDataset("sections",
			fs.readFileSync("src/pair.zip").toString("base64"),
			InsightDatasetKind.Sections);
	} catch (err) {
		if (err instanceof InsightError) {
			console.log("Warning: disk has not been cleared");
		}
	}
})();
