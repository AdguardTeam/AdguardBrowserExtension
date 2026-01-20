/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {
    useCallback,
    useContext,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';

import styles from './extension-update.module.pcss';

export const FiltersUpdate = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const [isUpdating, setIsUpdating] = useState(false);

    const updateClickHandler = useCallback(async () => {
        setIsUpdating(true);
        await settingsStore.updateExtensionMV3();
        setIsUpdating(false);
    }, [settingsStore, setIsUpdating]);

    const checkUpdatesTitle = translator.getMessage('update_check');
    const updateAvailableBtnTitle = translator.getMessage('update_available_update_btn');

    if (settingsStore.isExtensionCheckingUpdateOrUpdating) {
        return (
            <div className={styles.extensionUpdate}>
                <div className={styles.info}>
                    <Icon
                        id="#reload"
                        className="icon--24 icon--green-default"
                        animationCondition
                        animationClassName="icon--loading"
                        aria-hidden="true"
                    />
                    <div className={styles.text}>
                        <div className={styles.title}>
                            {translator.getMessage('update_checking_in_progress')}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isUpdating) {
        return (
            <div className={styles.extensionUpdate}>
                <div className={styles.info}>
                    <Icon
                        id="#loading"
                        className="icon--24"
                        animationCondition
                        animationClassName="icon--loading"
                        aria-hidden="true"
                    />
                    <div className={styles.text}>
                        <div className={styles.title}>
                            {translator.getMessage('update_installing_in_progress_title')}
                        </div>
                        <div className={styles.desc}>
                            {translator.getMessage('update_installing_in_progress_desc')}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (settingsStore.isExtensionUpdateAvailable) {
        return (
            <div className={styles.extensionUpdate}>
                <div className={styles.info}>
                    <Icon
                        id="#update-available"
                        className="icon--24 icon--green-default"
                        aria-hidden="true"
                    />
                    <div className={styles.text}>
                        <div className={styles.title}>
                            {translator.getMessage('update_available_title')}
                        </div>
                        <div className={styles.desc}>
                            {translator.getMessage('update_available_desc')}
                        </div>
                    </div>
                </div>
                <div className={styles.updateBtn}>
                    <button
                        type="button"
                        onClick={updateClickHandler}
                        className="button button--link button--link--underlined button--link--green"
                        title={updateAvailableBtnTitle}
                    >
                        {updateAvailableBtnTitle}
                    </button>
                </div>
            </div>
        );
    }

    // default case - check updates button
    return (
        <div className={styles.extensionUpdate}>
            <button
                type="button"
                onClick={settingsStore.checkUpdates}
                className={`${styles.info} ${styles.checkBtn}`}
                title={checkUpdatesTitle}
            >
                <Icon
                    id="#reload"
                    className="icon--24 icon--green-default"
                    aria-hidden="true"
                />
                <div className={styles.text}>
                    <div className={styles.title}>
                        {checkUpdatesTitle}
                    </div>
                </div>
            </button>
        </div>
    );
});
