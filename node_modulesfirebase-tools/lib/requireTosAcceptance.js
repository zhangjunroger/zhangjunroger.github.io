"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTosAcceptance = void 0;
const error_1 = require("./error");
const firedata_1 = require("./gcp/firedata");
const api_1 = require("./api");
const consoleLandingPage = new Map([
    [firedata_1.APPHOSTING_TOS_ID, `${(0, api_1.consoleOrigin)()}/project/_/apphosting`],
    [firedata_1.DATA_CONNECT_TOS_ID, `${(0, api_1.consoleOrigin)()}/project/_/dataconnect`],
]);
function requireTosAcceptance(tosId) {
    return () => requireTos(tosId);
}
exports.requireTosAcceptance = requireTosAcceptance;
async function requireTos(tosId) {
    const res = await (0, firedata_1.getTosStatus)();
    if ((0, firedata_1.isProductTosAccepted)(res, tosId)) {
        return;
    }
    const console = consoleLandingPage.get(tosId) || (0, api_1.consoleOrigin)();
    throw new error_1.FirebaseError(`Your account has not accepted the required Terms of Service for this action. Please accept the Terms of Service and try again. ${console}`);
}
