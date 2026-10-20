"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.vsceLogEmitter = void 0;
const winston = require("winston");
const utils_1 = require("./utils");
const events_1 = require("events");
exports.vsceLogEmitter = new events_1.EventEmitter();
function expandErrors(logger) {
    const oldLogFunc = logger.log.bind(logger);
    const newLogFunc = function (levelOrEntry, message, ...meta) {
        if (message && message instanceof Error) {
            message = message.stack || message.message;
            return oldLogFunc(levelOrEntry, message, ...meta);
        }
        return oldLogFunc(levelOrEntry, message, ...meta);
    };
    logger.log = newLogFunc;
    return logger;
}
function annotateDebugLines(logger) {
    const debug = logger.debug.bind(logger);
    const newDebug = function (message, ...meta) {
        if (typeof message === "string") {
            message = `[${new Date().toISOString()}] ${message || ""}`;
        }
        return debug(message, ...meta);
    };
    logger.debug = newDebug;
    return logger;
}
function maybeUseVSCodeLogger(logger) {
    if (!(0, utils_1.isVSCodeExtension)()) {
        return logger;
    }
    const oldLogFunc = logger.log.bind(logger);
    const vsceLogger = function (levelOrEntry, message, ...meta) {
        if (message) {
            exports.vsceLogEmitter.emit("log", { level: levelOrEntry, message });
        }
        else {
            exports.vsceLogEmitter.emit("log", levelOrEntry);
        }
        return oldLogFunc(levelOrEntry, message, ...meta);
    };
    logger.log = vsceLogger;
    return logger;
}
const rawLogger = winston.createLogger();
rawLogger.add(new winston.transports.Console({ silent: true }));
rawLogger.exitOnError = false;
exports.logger = maybeUseVSCodeLogger(annotateDebugLines(expandErrors(rawLogger)));
