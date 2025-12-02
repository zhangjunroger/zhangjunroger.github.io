"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const command_1 = require("../command");
const projectUtils_1 = require("../projectUtils");
const error_1 = require("../error");
const utils_1 = require("../utils");
const apphosting = require("../gcp/apphosting");
const apphosting_backends_list_1 = require("./apphosting-backends-list");
exports.command = new command_1.Command("apphosting:backends:get <backend>")
    .description("print info about a Firebase App Hosting backend")
    .option("-l, --location <location>", "backend location", "-")
    .before(apphosting.ensureApiEnabled)
    .action(async (backend, options) => {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const location = options.location;
    let backendsList = [];
    try {
        if (location !== "-") {
            const backendInRegion = await apphosting.getBackend(projectId, location, backend);
            backendsList.push(backendInRegion);
        }
        else {
            const resp = await apphosting.listBackends(projectId, "-");
            const allBackends = resp.backends || [];
            backendsList = allBackends.filter((bkd) => bkd.name.split("/").pop() === backend);
        }
    }
    catch (err) {
        throw new error_1.FirebaseError(`Failed to get backend: ${backend}. Please check the parameters you have provided.`, { original: err });
    }
    if (backendsList.length === 0) {
        (0, utils_1.logWarning)(`Backend "${backend}" not found`);
        return;
    }
    (0, apphosting_backends_list_1.printBackendsTable)(backendsList);
    return backendsList[0];
});
