/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import cn from 'classnames';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../../../common/components/ui/Icon';
import { rootStore } from '../../stores/RootStore';
import theme from '../../styles/theme';

import { FilterList } from './FilterList';

import styles from './customizeModal.module.pcss';

/**
 * Filter group names for customize modal.
 */
enum FilterGroup {
    RequestSource = 'request-source',
    RequestStatus = 'request-status',
    RequestType = 'request-type',
}

/**
 * Customize modal component for filtering log.
 * Contains filters for request source, filtering status, and request type.
 *
 * @returns Customize modal component.
 */
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

    return (
        <Modal
            isOpen={isCustomizeModalOpen}
            onRequestClose={closeModal}
            className={cn(theme.sideModal.sideModal, styles.modal)}
            overlayClassName={theme.sideModal.overlay}
        >
            <div className={theme.sideModal.title}>
                <button
                    type="button"
                    onClick={closeModal}
                    className={theme.sideModal.navigation}
                    aria-label={translator.getMessage('close_button_title')}
                >
                    <Icon
                        id="#arrow-left"
                        className="icon--24 icon--gray-default"
                        aria-hidden="true"
                    />
                </button>
                <span className={theme.sideModal.header}>
                    {translator.getMessage('filtering_menu_open_filters')}
                </span>
            </div>
            <div className={cn(theme.sideModal.content, 'thin-scrollbar')}>
                <FilterList
                    label={translator.getMessage('filtering_log_tag_request_source')}
                    tags={requestSourceFilters}
                    setTags={setRequestSourceFilters}
                    groupName={FilterGroup.RequestSource}
                />
                <FilterList
                    label={translator.getMessage('filtering_log_tag_request_status')}
                    tags={miscellaneousFilters}
                    setTags={setMiscellaneousFilters}
                    groupName={FilterGroup.RequestStatus}
                />
                <FilterList
                    label={translator.getMessage('filtering_log_tag_request_type')}
                    tags={eventTypesFilters}
                    setTags={setEventTypesFilters}
                    groupName={FilterGroup.RequestType}
                />
            </div>
        </Modal>
    );
});
