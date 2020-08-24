const { merge } = require('webpack-merge');
const { ENV_CONF } = require('./constants');
const packageJson = require('../../package.json');
const messages = require('../../Extension/_locales/en/messages.json');

const getConfig = (env) => {
    const envConfig = ENV_CONF[env];
    if (!envConfig) {
        throw new Error('There is not such env in the config map');
    }
    return envConfig;
};

const getName = () => {
    return messages.name.message;
};

const genName = (env) => {
    const { suffix } = getConfig(env);
    const name = getName();
    if (suffix) {
        return `${name} ${suffix}`;
    }
    return name;
};

const updateManifest = (env, targetPart, addedPart) => {
    const target = JSON.parse(targetPart.toString());
    const union = merge(target, addedPart);
    const name = genName(env);
    const result = {
        ...union,
        version: packageJson.version,
        name,
    };
    return Buffer.from(JSON.stringify(result, null, 4));
};

module.exports = {
    getConfig,
    updateManifest,
};
