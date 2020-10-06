import { DevToolsRulesConstructor } from './devtools-rules-constructor';
import { DevToolsHelper } from './devtools-helper';

const init = () => {
    global.DevToolsRulesConstructor = DevToolsRulesConstructor;
    global.DevToolsHelper = DevToolsHelper;
};

export const devtools = {
    init,
};
