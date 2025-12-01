/**
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

import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { ConfirmModal } from '../../../common/components/ConfirmModal';
import { translator } from '../../../../common/translators/translator';
import { CheckMarkCheckbox } from '../../../common/components/ui/Checkbox/CheckmarkCheckbox';
import { rootStore } from '../../stores/RootStore';
import { optionsStorage } from '../../../options/options-storage';

import './preserveLogModal.pcss';
import '../../../common/styles/modal.pcss';

const PreserveLogModal = observer(() => {
    const { logStore } = useContext(rootStore);

    const [showModalInFuture, setShowModalInFuture] = useState(true);

    const hidePreserveLogModalInFuture = () => {
        optionsStorage.setItem(optionsStorage.KEYS.SHOW_PRESERVE_LOG_MODAL, false);
    };

    const confirmModal = async () => {
        await logStore.setPreserveLog(true);
        if (!showModalInFuture) {
            hidePreserveLogModalInFuture();
        }
    };

    const handleShowModal = () => {
        setShowModalInFuture(!showModalInFuture);
    };

    const renderSubtitle = () => (
        <>
            <div className="modal__subtitle">
                {translator.getMessage('filtering_log_preserve_log_modal_description')}
            </div>
            <CheckMarkCheckbox
                checked={!showModalInFuture}
                id="preserve_log"
                handler={handleShowModal}
                label={translator.getMessage('filtering_log_preserve_log_skip_modal_in_future')}
            />
        </>
    );

    return (
        <ConfirmModal
            title={translator.getMessage('filtering_log_preserve_log_modal_title')}
            subtitle={renderSubtitle()}
            isOpen={logStore.isPreserveLogModalOpen}
            onConfirm={confirmModal}
            customConfirmTitle={translator.getMessage('filtering_log_preserve_log_modal_confirm')}
            setIsOpen={logStore.setIsPreserveLogModalOpen}
            isConsent
        />
    );
});

export { PreserveLogModal };
