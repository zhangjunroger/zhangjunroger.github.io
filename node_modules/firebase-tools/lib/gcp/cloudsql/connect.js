"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDatabaseUser = exports.setupIAMUsers = exports.getIAMUser = exports.getDataConnectP4SA = exports.executeSqlCmdsAsSuperUser = exports.executeSqlCmdsAsIamUser = exports.execute = void 0;
const pg = require("pg");
const cloud_sql_connector_1 = require("@google-cloud/cloud-sql-connector");
const requireAuth_1 = require("../../requireAuth");
const projectUtils_1 = require("../../projectUtils");
const api_1 = require("../../api");
const cloudSqlAdminClient = require("./cloudsqladmin");
const utils = require("../../utils");
const logger_1 = require("../../logger");
const error_1 = require("../../error");
const fbToolsAuthClient_1 = require("./fbToolsAuthClient");
const permissions_1 = require("./permissions");
async function execute(sqlStatements, opts) {
    const logFn = opts.silent ? logger_1.logger.debug : logger_1.logger.info;
    const instance = await cloudSqlAdminClient.getInstance(opts.projectId, opts.instanceId);
    const user = await cloudSqlAdminClient.getUser(opts.projectId, opts.instanceId, opts.username);
    const connectionName = instance.connectionName;
    if (!connectionName) {
        throw new error_1.FirebaseError(`Could not get instance connection string for ${opts.instanceId}:${opts.databaseId}`);
    }
    let connector;
    let pool;
    switch (user.type) {
        case "CLOUD_IAM_USER": {
            connector = new cloud_sql_connector_1.Connector({
                auth: new fbToolsAuthClient_1.FBToolsAuthClient(),
            });
            const clientOpts = await connector.getOptions({
                instanceConnectionName: connectionName,
                ipType: cloud_sql_connector_1.IpAddressTypes.PUBLIC,
                authType: cloud_sql_connector_1.AuthTypes.IAM,
            });
            pool = new pg.Pool(Object.assign(Object.assign({}, clientOpts), { user: opts.username, database: opts.databaseId }));
            break;
        }
        case "CLOUD_IAM_SERVICE_ACCOUNT": {
            connector = new cloud_sql_connector_1.Connector();
            const clientOpts = await connector.getOptions({
                instanceConnectionName: connectionName,
                ipType: cloud_sql_connector_1.IpAddressTypes.PUBLIC,
                authType: cloud_sql_connector_1.AuthTypes.IAM,
            });
            pool = new pg.Pool(Object.assign(Object.assign({}, clientOpts), { user: opts.username, database: opts.databaseId }));
            break;
        }
        default: {
            if (!opts.password) {
                throw new error_1.FirebaseError(`Cannot connect as BUILT_IN user without a password.`);
            }
            connector = new cloud_sql_connector_1.Connector({
                auth: new fbToolsAuthClient_1.FBToolsAuthClient(),
            });
            const clientOpts = await connector.getOptions({
                instanceConnectionName: connectionName,
                ipType: cloud_sql_connector_1.IpAddressTypes.PUBLIC,
            });
            pool = new pg.Pool(Object.assign(Object.assign({}, clientOpts), { user: opts.username, password: opts.password, database: opts.databaseId }));
            break;
        }
    }
    const conn = await pool.connect();
    logFn(`Logged in as ${opts.username}`);
    for (const s of sqlStatements) {
        logFn(`Executing: '${s}'`);
        try {
            await conn.query(s);
        }
        catch (err) {
            throw new error_1.FirebaseError(`Error executing ${err}`);
        }
    }
    conn.release();
    await pool.end();
    connector.close();
}
exports.execute = execute;
async function executeSqlCmdsAsIamUser(options, instanceId, databaseId, cmds, silent = false) {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const { user: iamUser } = await getIAMUser(options);
    return await execute(cmds, {
        projectId,
        instanceId,
        databaseId,
        username: iamUser,
        silent: silent,
    });
}
exports.executeSqlCmdsAsIamUser = executeSqlCmdsAsIamUser;
async function executeSqlCmdsAsSuperUser(options, instanceId, databaseId, cmds, silent = false) {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const superuser = "firebasesuperuser";
    const temporaryPassword = utils.generateId(20);
    await cloudSqlAdminClient.createUser(projectId, instanceId, "BUILT_IN", superuser, temporaryPassword);
    return await execute([`SET ROLE = cloudsqlsuperuser`, ...cmds], {
        projectId,
        instanceId,
        databaseId,
        username: superuser,
        password: temporaryPassword,
        silent: silent,
    });
}
exports.executeSqlCmdsAsSuperUser = executeSqlCmdsAsSuperUser;
function getDataConnectP4SA(projectNumber) {
    return `service-${projectNumber}@${(0, api_1.dataconnectP4SADomain)()}`;
}
exports.getDataConnectP4SA = getDataConnectP4SA;
async function getIAMUser(options) {
    const account = await (0, requireAuth_1.requireAuth)(options);
    if (!account) {
        throw new error_1.FirebaseError("No account to set up! Run `firebase login` or set Application Default Credentials");
    }
    return toDatabaseUser(account);
}
exports.getIAMUser = getIAMUser;
async function setupIAMUsers(instanceId, databaseId, options) {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const { user, mode } = await getIAMUser(options);
    await cloudSqlAdminClient.createUser(projectId, instanceId, mode, user);
    const projectNumber = await (0, projectUtils_1.needProjectNumber)(options);
    const { user: fdcP4SAUser, mode: fdcP4SAmode } = toDatabaseUser(getDataConnectP4SA(projectNumber));
    await cloudSqlAdminClient.createUser(projectId, instanceId, fdcP4SAmode, fdcP4SAUser);
    await (0, permissions_1.setupSQLPermissions)(instanceId, databaseId, options, true);
    const grants = [
        `GRANT "${(0, permissions_1.firebaseowner)(databaseId)}" TO "${user}"`,
        `GRANT "${(0, permissions_1.firebasewriter)(databaseId)}" TO "${fdcP4SAUser}"`,
    ];
    await executeSqlCmdsAsSuperUser(options, instanceId, databaseId, grants, true);
    return user;
}
exports.setupIAMUsers = setupIAMUsers;
function toDatabaseUser(account) {
    let mode = "CLOUD_IAM_USER";
    let user = account;
    if (account.endsWith(".gserviceaccount.com")) {
        user = account.replace(".gserviceaccount.com", "");
        mode = "CLOUD_IAM_SERVICE_ACCOUNT";
    }
    return { user, mode };
}
exports.toDatabaseUser = toDatabaseUser;
