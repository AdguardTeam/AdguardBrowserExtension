import { translator } from "../../../../common/translators/translator";
import { SEARCH_FILTERS } from "./Search/constants";

export const sortFilterOptions = [
    {
        value: SEARCH_FILTERS.ALL,
        title: translator.getMessage('options_filters_list_search_display_option_all_filters'),
    },
    {
        value: SEARCH_FILTERS.ENABLED,
        title: translator.getMessage('options_filters_list_search_display_option_enabled'),
    },
    {
        value: SEARCH_FILTERS.DISABLED,
        title: translator.getMessage('options_filters_list_search_display_option_disabled'),
    },
];