import React, {
    useContext,
    useEffect,
} from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { observer } from 'mobx-react';
import '../../styles/styles.pcss';

import General from '../General';
import Sidebar from '../Sidebar/Sidebar';
import Filters from '../Filters';
import Stealth from '../Stealth';
import Whitelist from '../Whitelist';
import { UserRules } from '../UserRules';
import Miscellaneous from '../Miscellaneous';
import About from '../About';
import Footer from '../Footer/Footer';

import { rootStore } from '../../stores/RootStore';
import { Notifications } from '../Notifications';

const App = observer(() => {
    const { settingsStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await settingsStore.requestOptionsData();
        })();
    }, []);

    if (!settingsStore.optionsReadyToRender) {
        return null;
    }

    return (
        <HashRouter hashType="noslash">
            <div className="page container">
                <Sidebar />
                <div className="content">
                    <Switch>
                        <Route path="/" exact component={General} />
                        <Route path="/filters" component={Filters} />
                        <Route path="/stealth" component={Stealth} />
                        <Route path="/whitelist" component={Whitelist} />
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

export default App;
