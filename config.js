let appConfig = {};

appConfig.port = 3000;
appConfig.allowedCorsOrigin = "*";
appConfig.env = "dev";
appConfig.db = {
    uri: 'mongodb://127.0.0.1:27017/dazolive'
}
appConfig.rootDirectory = __dirname
appConfig.accountSid = 'AC2ce3ef35811672997fe075d61fd24292',
    appConfig.authToken = '2a1e4b4412a634292e2a577f8ddbbf72',
    appConfig.awsKey = 'AKIA6N5M7JQTQ2HQXGXB',
    appConfig.awsSecret = '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'

module.exports = {
    port: appConfig.port,
    allowedCorsOrigin: appConfig.allowedCorsOrigin,
    environment: appConfig.env,
    db: appConfig.db,
    directoryPath: appConfig.rootDirectory,
    accountSid: appConfig.accountSid,
    authToken: appConfig.authToken,
    awsKey: appConfig.awsKey,
    awsSecret: appConfig.awsSecret
};