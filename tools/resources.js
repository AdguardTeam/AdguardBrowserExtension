// TODO update filters, update suffixes
import { downloadFilters } from './resources/download-filters';
import { updatePublicSuffixes } from './resources/update-public-suffixes';

const resources = async () => {
    await downloadFilters();
    await updatePublicSuffixes();
};

resources();
