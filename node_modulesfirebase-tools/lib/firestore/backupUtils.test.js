"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const backupUtils_1 = require("./backupUtils");
describe("calculateRetention", () => {
    it("should accept minutes", () => {
        (0, chai_1.expect)((0, backupUtils_1.calculateRetention)("5m")).to.eq(300);
    });
    it("should accept hours", () => {
        (0, chai_1.expect)((0, backupUtils_1.calculateRetention)("3h")).to.eq(10800);
    });
    it("should accept days", () => {
        (0, chai_1.expect)((0, backupUtils_1.calculateRetention)("2d")).to.eq(172800);
    });
    it("should accept weeks", () => {
        (0, chai_1.expect)((0, backupUtils_1.calculateRetention)("3w")).to.eq(1814400);
    });
});
