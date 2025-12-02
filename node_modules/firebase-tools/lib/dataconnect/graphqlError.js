"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettify = void 0;
function prettify(err) {
    var _a, _b, _c, _d;
    const message = err.message;
    let header = (_b = (_a = err.extensions) === null || _a === void 0 ? void 0 : _a.file) !== null && _b !== void 0 ? _b : "";
    if (err.locations && err.locations.length) {
        const line = (_d = (_c = err.locations[0]) === null || _c === void 0 ? void 0 : _c.line) !== null && _d !== void 0 ? _d : "";
        if (line) {
            header += `:${line}`;
        }
    }
    return header.length ? `${header}: ${message}` : message;
}
exports.prettify = prettify;
