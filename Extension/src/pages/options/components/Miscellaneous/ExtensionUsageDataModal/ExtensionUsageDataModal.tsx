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
import React from 'react';
import Modal from 'react-modal';

import { ModalContentWrapper } from '../../Filters/AddCustomModal/ModalContentWrapper';
import { PRIVACY_URL } from '../../../constants';
import { translator } from '../../../../../common/translators/translator';

import './extension-usage-data-modal.pcss';

type ExtensionUsageDataModalProps = {
    closeModalHandler: () => void;
    isOpen: boolean;
};

Modal.setAppElement('#root');

export const ExtensionUsageDataModal: React.FC<ExtensionUsageDataModalProps> = ({ closeModalHandler, isOpen }) => {
    const handleClose = () => {
        closeModalHandler();
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            overlayClassName="extension-usage-modal__overlay"
            className="extension-usage-modal__content"
        >
            <ModalContentWrapper
                closeModalHandler={handleClose}
                className="extension-usage-modal"
                title={translator.getMessage('options_anonymized_usage_data_modal_title')}
                actions={(
                    <div className="modal__actions extension-usage-modal__actions">
                        <button
                            type="button"
                            className="button button--l button--green-bg extension-usage-modal__btn"
                            onClick={handleClose}
                        >
                            {translator.getMessage('options_anonymized_usage_data_modal_got_it_button')}
                        </button>
                    </div>
                )}
            >
                <div>
                    <p>{translator.getMessage('options_anonymized_usage_data_modal_intro')}</p>
                    <ul>
                        <li>{translator.getMessage('options_anonymized_usage_data_modal_list_item_screens')}</li>
                        <li>{translator.getMessage('options_anonymized_usage_data_modal_list_item_buttons')}</li>
                        <li>{translator.getMessage('options_anonymized_usage_data_modal_list_item_session_ids')}</li>
                    </ul>

                    <p>{translator.getMessage('options_anonymized_usage_data_modal_reason')}</p>
                    <p>{translator.getMessage('options_anonymized_usage_data_modal_privacy_note')}</p>

                    <a
                        href={PRIVACY_URL}
                        className="button button--link button--link--green"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {translator.getMessage('options_privacy_policy')}
                    </a>
                </div>
            </ModalContentWrapper>
        </Modal>
    );
};
