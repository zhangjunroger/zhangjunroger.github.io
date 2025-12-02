"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const dataconnectEmulator_1 = require("../emulator/dataconnectEmulator");
const error_1 = require("../error");
const graphqlError_1 = require("./graphqlError");
async function build(options, configDir) {
    var _a, _b;
    const buildResult = await dataconnectEmulator_1.DataConnectEmulator.build({ configDir });
    if ((_a = buildResult === null || buildResult === void 0 ? void 0 : buildResult.errors) === null || _a === void 0 ? void 0 : _a.length) {
        throw new error_1.FirebaseError(`There are errors in your schema and connector files:\n${buildResult.errors.map(graphqlError_1.prettify).join("\n")}`);
    }
    return (_b = buildResult === null || buildResult === void 0 ? void 0 : buildResult.metadata) !== null && _b !== void 0 ? _b : {};
}
exports.build = build;
