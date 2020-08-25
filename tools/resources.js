// TODO update filters, update suffixes
import { downloadFilters } from './resources/download-filters';

const resources = async () => {
    try {
        await downloadFilters();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
    }
};

resources();
