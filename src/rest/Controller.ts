import {Request, Response} from "express";
import {InsightDatasetKind, InsightError, NotFoundError, ResultTooLargeError} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

export default class Controller {
	public static facade: InsightFacade = new InsightFacade();

	public static async addDataset(req: Request, res: Response) {
		try {
			console.log("Server::addDataset(..)");
			console.log("\t", `- params: ${JSON.stringify(req.params)}`);
			const response = await Controller.facade.addDataset(req.params.id, req.body,
				req.params.kind as InsightDatasetKind);
			res.status(200).json({result: response});
		} catch (err) {
			let msg = "unknown";
			if (err instanceof Error) {
				msg = err.message;
			}
			res.status(400).json({error: msg});
		}
	}

	public static async removeDataset(req: Request, res: Response) {
		try {
			console.log("Server::removeDataset(..)");
			console.log("\t", `- params: ${JSON.stringify(req.params)}`);
			const response = await Controller.facade.removeDataset(req.params.id);
			res.status(200).json({result: response});
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(404).json({error: err.message});
			} else if (err instanceof InsightError) {
				res.status(400).json({error: err.message});
			} else {
				res.status(400).json({error: "unknown"});
			}
		}
	}

	public static async listDatasets(req: Request, res: Response) {
		try {
			console.log("Server::listDatasets(..)");
			const response = await Controller.facade.listDatasets();
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: "unknown"});
		}
	}

	public static async performQuery(req: Request, res: Response) {
		try {
			console.log("Server::performQuery(..)");
			const response = await Controller.facade.performQuery(req.body);
			res.status(200).json({result: response});
		} catch (err) {
			let msg = "unknown";
			if (err instanceof Error) {
				msg = err.message;
			}
			res.status(400).json({error: msg});
		}
	}

	// The next two methods handle the echo service.
	public static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Controller.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}
}
