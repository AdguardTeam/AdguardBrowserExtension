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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { rootStore } from '../../stores/RootStore';
import { FilterList } from './FilterList';

import styles from './customizeModal.module.pcss';

export const CustomizeModal = observer(() => {
    const { logStore } = useContext(rootStore);

    const {
        isCustomizeModalOpen,
        setIsCustomizeModalOpen,
        requestSourceFilters,
        setRequestSourceFilters,
        miscellaneousFilters,
        setMiscellaneousFilters,
        eventTypesFilters,
        setEventTypesFilters,
    } = logStore;

    const closeModal = () => {
        setIsCustomizeModalOpen(false);
    };
    //FIXME: It be good to create common modal component for filtering log and request wizard

    return (
        <Modal
            isOpen={isCustomizeModalOpen}
            onRequestClose={closeModal}
            className={`request-modal ${styles.modal}`}
            overlayClassName="request-modal__overlay"
        >
            <div className="request-modal__title">
                <button
                    type="button"
                    onClick={closeModal}
                    className="request-modal__navigation"
                    aria-label={translator.getMessage('close_button_title')}
                >
                    <Icon
                        id="#arrow-left"
                        className="icon--24 icon--gray-default"
                        aria-hidden="true"
                    />
                </button>
                <span className="request-modal__header">
                    {translator.getMessage('filtering_menu_open_filters')}
                </span>
            </div>
            <div className="request-modal__content thin-scrollbar">
                <FilterList
                    label={translator.getMessage('filtering_log_tag_request_source')}
                    tags={requestSourceFilters}
                    setTags={setRequestSourceFilters}
                    groupName="request-source"
                />
                <FilterList
                    label={translator.getMessage('filtering_log_tag_request_status')}
                    tags={miscellaneousFilters}
                    setTags={setMiscellaneousFilters}
                    groupName="request-status"
                />
                <FilterList
                    label={translator.getMessage('filtering_log_tag_request_type')}
                    tags={eventTypesFilters}
                    setTags={setEventTypesFilters}
                    groupName="request-type"
                />
            </div>
        </Modal>
    );
});
