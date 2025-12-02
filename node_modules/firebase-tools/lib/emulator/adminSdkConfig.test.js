"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const adminSdkConfig_1 = require("./adminSdkConfig");
describe("adminSdkConfig", () => {
    describe("getProjectAdminSdkConfigOrCached", () => {
        it("should return a fake config for a demo project id", async () => {
            const projectId = "demo-project-1234";
            await (0, chai_1.expect)((0, adminSdkConfig_1.getProjectAdminSdkConfigOrCached)(projectId)).to.eventually.deep.equal({
                projectId: "demo-project-1234",
                databaseURL: "https://demo-project-1234.firebaseio.com",
                storageBucket: "demo-project-1234.appspot.com",
            });
        });
    });
});
