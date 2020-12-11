import React, {
    useContext,
    useEffect,
} from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { observer } from 'mobx-react';

import { General } from '../General';
import { Sidebar } from '../Sidebar';
import { Filters } from '../Filters';
import { Stealth } from '../Stealth';
import { Allowlist } from '../Allowlist';
import { UserRules } from '../UserRules';
import { Miscellaneous } from '../Miscellaneous';
import { About } from '../About';
import { Footer } from '../Footer';
import { rootStore } from '../../stores/RootStore';
import { Notifications } from '../Notifications';
import { messenger } from '../../../services/messenger';
import { log } from '../../../../common/log';
import { Icons } from '../../../common/components/ui/Icons';

import '../../styles/styles.pcss';

const Options = observer(() => {
    const { settingsStore } = useContext(rootStore);

    useEffect(() => {
        let removeListenerCallback = () => {};

        (async () => {
            await settingsStore.requestOptionsData();

            // TODO put constants in common directory
            const REQUEST_FILTER_UPDATED = 'event.request.filter.updated';
            const UPDATE_ALLOWLIST_FILTER_RULES = 'event.update.allowlist.filter.rules';
            const FILTERS_UPDATE_CHECK_READY = 'event.update.filters.check';

            const events = [
                REQUEST_FILTER_UPDATED,
                UPDATE_ALLOWLIST_FILTER_RULES,
                FILTERS_UPDATE_CHECK_READY,
            ];

            removeListenerCallback = await messenger.createEventListener(
                events,
                async (message) => {
                    const { type } = message;

                    switch (type) {
                        case REQUEST_FILTER_UPDATED: {
                            await settingsStore.getUserRules();
                            const [{ rulesCount }] = message.data;
                            await settingsStore.updateRulesCount(rulesCount);
                            break;
                        }
                        case UPDATE_ALLOWLIST_FILTER_RULES: {
                            await settingsStore.getAllowlist();
                            break;
                        }
                        case FILTERS_UPDATE_CHECK_READY: {
                            const { data: updatedFilters } = message;
                            settingsStore.refreshFilters(updatedFilters);
                            break;
                        }
                        default: {
                            log.debug('Undefined message type:', type);
                            break;
                        }
                    }
                },
            );
        })();

        return () => {
            removeListenerCallback();
        };
    }, []);

    if (!settingsStore.optionsReadyToRender) {
        return null;
    }

    return (
        <HashRouter hashType="noslash">
            <Icons />
            <div className="page">
                <Sidebar />
                <div className="content">
                    <Switch>
                        <Route path="/" exact component={General} />
                        <Route path="/filters" component={Filters} />
                        <Route path="/stealth" component={Stealth} />
                        <Route path="/allowlist" component={Allowlist} />
                        <Route path="/user-filter" component={UserRules} />
                        <Route path="/miscellaneous" component={Miscellaneous} />
                        <Route path="/about" component={About} />
                        <Route component={General} />
                    </Switch>
                </div>
            </div>
            <Footer />
            <Notifications />
        </HashRouter>
    );
});

export { Options };
