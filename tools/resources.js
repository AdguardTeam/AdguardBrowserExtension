import { downloadFilters } from './resources/download-filters';
import { updateLocalScriptRules } from './resources/update-local-script-rules';

const resources = async () => {
    await downloadFilters();
    await updateLocalScriptRules();
};

(async () => {
    await resources();
})();
