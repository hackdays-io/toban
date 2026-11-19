import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

// Hardhat 2's toolbox registered chai-as-promised globally; Hardhat 3 does not.
chai.use(chaiAsPromised);

export const { expect } = chai;
