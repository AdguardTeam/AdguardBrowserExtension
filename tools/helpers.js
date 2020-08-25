import { merge } from 'webpack-merge';
import { ENV_CONF, ENVS, BROWSERS } from './constants';
import packageJson from '../package.json';

export const getConfig = (env) => {
    const envConfig = ENV_CONF[env];
    if (!envConfig) {
        throw new Error('There is not such env in the config map');
    }
    return envConfig;
};

export const updateManifest = (env, targetPart, addedPart) => {
    const target = JSON.parse(targetPart.toString());
    const union = merge(target, addedPart);

    delete union.version;

    const result = {
        version: packageJson.version,
        ...union,
    };

    return Buffer.from(JSON.stringify(result, null, 4));
};

const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// TODO add documentation + test work in the firefox builds
const getNameSuffix = (buildEnv, browser, standalone) => {
    switch (browser) {
        case BROWSERS.FIREFOX:
            if (standalone) {
                if (buildEnv === ENVS.BETA) {
                    return ' (Standalone)';
                } if (buildEnv === ENVS.DEV) {
                    return ' (Standalone Dev)';
                }
            } else {
                if (buildEnv === ENVS.BETA) {
                    return ' (Beta)';
                } if (buildEnv === ENVS.DEV) {
                    return ' (AMO Dev)';
                }
            }
            break;
        default:
            if (buildEnv !== ENVS.RELEASE) {
                return ` (${capitalize(buildEnv)})`;
            }
            break;
    }
    return '';
};

// TODO build firefox with allowRemoteScript parameter for standalone builds
export const updateLocalesMSGName = (content, env, browser, standalone) => {
    const suffix = getNameSuffix(env, browser, standalone);

    const messages = JSON.parse(content.toString());
    messages.name.message += suffix;
    messages.short_name.message += suffix;

    return JSON.stringify(messages, null, 4);
};
