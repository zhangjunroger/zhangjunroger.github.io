"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const apphosting = require("../gcp/apphosting");
const logger_1 = require("../logger");
const command_1 = require("../command");
const projectUtils_1 = require("../projectUtils");
exports.command = new command_1.Command("apphosting:builds:create <backendId>")
    .description("create a build for an App Hosting backend")
    .option("-l, --location <location>", "specify the region of the backend", "us-central1")
    .option("-i, --id <buildId>", "id of the build (defaults to autogenerating a random id)", "")
    .option("-b, --branch <branch>", "repository branch to deploy (defaults to 'main')", "main")
    .before(apphosting.ensureApiEnabled)
    .action(async (backendId, options) => {
    var _a;
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const location = options.location;
    const buildId = options.buildId ||
        (await apphosting.getNextRolloutId(projectId, location, backendId));
    const branch = (_a = options.branch) !== null && _a !== void 0 ? _a : "main";
    const op = await apphosting.createBuild(projectId, location, backendId, buildId, {
        source: {
            codebase: {
                branch,
            },
        },
    });
    logger_1.logger.info(`Started a build for backend ${backendId} on branch ${branch}.`);
    logger_1.logger.info("Check status by running:");
    logger_1.logger.info(`\tfirebase apphosting:builds:get ${backendId} ${buildId} --location ${location}`);
    return op;
});
