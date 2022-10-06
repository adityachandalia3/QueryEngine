import InsightFacade from "../../src/controller/InsightFacade";

import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("PerformQueryUnitTests", function () {
	let facade: InsightFacade;

	beforeEach(function () {
		facade = new InsightFacade();
	});
});
