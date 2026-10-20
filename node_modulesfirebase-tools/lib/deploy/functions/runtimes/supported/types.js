"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RUNTIMES = void 0;
function runtimes(r) {
    return r;
}
exports.RUNTIMES = runtimes({
    nodejs6: {
        friendly: "Node.js 6",
        status: "decommissioned",
        deprecationDate: "2019-04-17",
        decommissionDate: "2020-08-01",
    },
    nodejs8: {
        friendly: "Node.js 8",
        status: "decommissioned",
        deprecationDate: "2020-06-05",
        decommissionDate: "2021-02-01",
    },
    nodejs10: {
        friendly: "Node.js 10",
        status: "GA",
        deprecationDate: "2024-01-30",
        decommissionDate: "2025-01-30",
    },
    nodejs12: {
        friendly: "Node.js 12",
        status: "GA",
        deprecationDate: "2024-01-30",
        decommissionDate: "2025-01-30",
    },
    nodejs14: {
        friendly: "Node.js 14",
        status: "GA",
        deprecationDate: "2024-01-30",
        decommissionDate: "2025-01-30",
    },
    nodejs16: {
        friendly: "Node.js 16",
        status: "GA",
        deprecationDate: "2024-01-30",
        decommissionDate: "2025-01-30",
    },
    nodejs18: {
        friendly: "Node.js 18",
        status: "GA",
        deprecationDate: "2025-04-30",
        decommissionDate: "2025-10-31",
    },
    nodejs20: {
        friendly: "Node.js 20",
        status: "GA",
        deprecationDate: "2026-04-30",
        decommissionDate: "2026-10-31",
    },
    nodejs22: {
        friendly: "Node.js 22",
        status: "beta",
        deprecationDate: "2027-04-30",
        decommissionDate: "2027-10-31",
    },
    python310: {
        friendly: "Python 3.10",
        status: "GA",
        deprecationDate: "2026-10-04",
        decommissionDate: "2027-04-30",
    },
    python311: {
        friendly: "Python 3.11",
        status: "GA",
        deprecationDate: "2027-10-24",
        decommissionDate: "2028-04-30",
    },
    python312: {
        friendly: "Python 3.12",
        status: "GA",
        deprecationDate: "2028-10-02",
        decommissionDate: "2029-04-30",
    },
});
