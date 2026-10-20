"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doSetup = void 0;
const logger_1 = require("../../logger");
const functions_1 = require("./functions");
const prompt_1 = require("../../prompt");
const spawn_1 = require("../spawn");
async function doSetup(setup, config, options) {
    var _a;
    if (((_a = setup.functions) === null || _a === void 0 ? void 0 : _a.languageChoice) !== "typescript") {
        const continueFunctions = await (0, prompt_1.promptOnce)({
            type: "confirm",
            message: "Genkit's Firebase integration uses Cloud Functions for Firebase with TypeScript. Initialize Functions to continue?",
            default: true,
        });
        if (!continueFunctions) {
            logger_1.logger.info("Stopped Genkit initialization");
            return;
        }
        setup.languageOverride = "typescript";
        await (0, functions_1.doSetup)(setup, config, options);
        delete setup.languageOverride;
        logger_1.logger.info();
    }
    const projectDir = `${config.projectDir}/${setup.functions.source}`;
    const installType = await (0, prompt_1.promptOnce)({
        type: "list",
        message: "Install the Genkit CLI globally or locally in this project?",
        choices: [
            { name: "Globally", value: "globally" },
            { name: "Just this project", value: "project" },
        ],
    });
    try {
        logger_1.logger.info("Installing Genkit CLI");
        if (installType === "globally") {
            await (0, spawn_1.wrapSpawn)("npm", ["install", "-g", "genkit"], projectDir);
            await (0, spawn_1.wrapSpawn)("genkit", ["init", "-p", "firebase"], projectDir);
            logger_1.logger.info("Start the Genkit developer experience by running:");
            logger_1.logger.info(`    cd ${setup.functions.source} && genkit start`);
        }
        else {
            await (0, spawn_1.wrapSpawn)("npm", ["install", "genkit", "--save-dev"], projectDir);
            await (0, spawn_1.wrapSpawn)("npx", ["genkit", "init", "-p", "firebase"], projectDir);
            logger_1.logger.info("Start the Genkit developer experience by running:");
            logger_1.logger.info(`    cd ${setup.functions.source} && npx genkit start`);
        }
    }
    catch (e) {
        logger_1.logger.error("Genkit initialization failed...");
        return;
    }
}
exports.doSetup = doSetup;
