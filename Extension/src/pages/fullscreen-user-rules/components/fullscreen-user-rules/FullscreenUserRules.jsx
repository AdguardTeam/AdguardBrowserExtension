import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { UserRulesEditor } from '../../../common/components/UserRulesEditor';
import { FULLSCREEN_USER_RULES_EDITOR, NotifierType } from '../../../../common/constants';
import { messenger } from '../../../services/messenger';
import { Log } from '../../../../common/log';
import { fullscreenUserRulesStore } from '../../stores/FullscreenUserRulesStore';
import { useAppearanceTheme } from '../../../common/hooks/useAppearanceTheme';
import { Icons } from '../../../common/components/ui/Icons';

import '../../../options/styles/styles.pcss';
import '../../../options/components/UserRules/styles.pcss';

export const FullscreenUserRules = observer(() => {
    const store = useContext(fullscreenUserRulesStore);

    useAppearanceTheme(store.appearanceTheme);

    // append message listeners
    useEffect(() => {
        store.getFullscreenUserRulesData();

        let removeListenerCallback = async () => {};

        (async () => {
            const events = [
                NotifierType.SettingUpdated,
            ];

            removeListenerCallback = messenger.createLongLivedConnection(
                FULLSCREEN_USER_RULES_EDITOR,
                events,
                async (message) => {
                    const { type } = message;

                    switch (type) {
                        case NotifierType.SettingUpdated: {
                            await store.getFullscreenUserRulesData();
                            break;
                        }
                        default: {
                            Log.debug('There is no listener for type:', type);
                            break;
                        }
                    }
                },
            );
        })();

        return () => {
            removeListenerCallback();
        };
    }, [store]);

    return (
        <>
            <Icons />
            <UserRulesEditor fullscreen />
        </>
    );
});
