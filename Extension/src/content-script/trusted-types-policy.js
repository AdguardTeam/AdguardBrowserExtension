import { nanoid } from 'nanoid';

const createPolicy = () => {
    const defaultPolicy = {
        createHTML: (input) => {
            return input;
        },
        createScript: (input) => {
            return input;
        },
        createScriptURL: (input) => {
            return input;
        },
    };

    if (window.trustedTypes && window.trustedTypes.createPolicy) {
        return window.trustedTypes.createPolicy(`AGPolicy-${nanoid()}`, defaultPolicy);
    }

    return defaultPolicy;
};

export const AGPolicy = createPolicy();
