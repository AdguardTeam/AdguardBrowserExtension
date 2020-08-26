import { downloadFilters } from './resources/download-filters';
import { updatePublicSuffixes } from './resources/update-public-suffixes';
import { updateLocalScriptRules } from './resources/update-local-script-rules';

const resources = async () => {
    await downloadFilters();
    await updateLocalScriptRules();
    await updatePublicSuffixes();
};

resources();
