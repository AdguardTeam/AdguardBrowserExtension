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
    useContext,
    useState,
    useEffect,
} from 'react';
import { observer } from 'mobx-react';

import { fromPromise } from 'xstate';
import { useMachine } from '@xstate/react';

import { ContentType as RequestType } from 'tswebextension';

import { Icon } from '../../../../common/components/ui/Icon';
import { translator } from '../../../../../common/translators/translator';
import {
    fetchMachine,
    FetchEvents,
    FetchStates,
} from '../../../../common/machines/fetchMachine';
import { rootStore } from '../../../stores/RootStore';

import { ImageRequest } from './ImageRequest';
import { TextRequest } from './TextRequest';
import { fetchText, fetchImage } from './fetchers';

import '../RequestInfo/request-image.pcss';
import './request-preview.pcss';

export const RequestPreview = observer(() => {
    const {
        wizardStore,
        logStore,
    } = useContext(rootStore);

    const { selectedEvent } = logStore;

    const { requestType, requestUrl } = selectedEvent;

    const isText = requestType === RequestType.Document
        || requestType === RequestType.Subdocument
        || requestType === RequestType.Script
        || requestType === RequestType.Stylesheet;

    const isImage = requestType === RequestType.Image;

    const getFetcher = () => {
        if (isText) {
            return fetchText;
        }
        if (isImage) {
            return fetchImage;
        }
        return null;
    };

    const [previewState, send] = useMachine(
        fetchMachine.provide({
            actors: {
                fetchData: fromPromise(getFetcher()),
            },
        }),
    );

    const [beautify, setBeautify] = useState(false);

    useEffect(() => {
        send({
            type: FetchEvents.FETCH,
            data: { url: requestUrl },
        });
    }, [requestUrl, send]);

    const onRetry = () => {
        send({
            type: FetchEvents.RETRY,
            data: { url: requestUrl },
        });
    };

    const handleBackToRequestClick = () => {
        wizardStore.setViewState();
    };

    const handleBeautifyClick = () => {
        setBeautify(true);
    };

    const tryAgainButtonTitle = translator.getMessage('filtering_log_details_modal_try_again');
    const backToRequestButtonTitle = translator.getMessage('filtering_log_details_modal_back_button');
    const beautifyButtonTitle = translator.getMessage('filtering_log_details_modal_beautify_button');

    const renderContent = () => {
        if (previewState.matches(FetchStates.LOADING)) {
            return (
                <div className="request-preview__status">
                    <span className="request-info__value request-preview__text">
                        {translator.getMessage('filtering_modal_status_text_loading')}
                    </span>
                </div>
            );
        }
        if (previewState.matches(FetchStates.FAILURE)) {
            return (
                <div className="request-preview__status">
                    <span className="request-info__error request-preview__text">
                        {translator.getMessage('filtering_modal_status_text_error')}
                    </span>
                    <button
                        type="button"
                        className="button button--l button--green-bg request-preview__button"
                        onClick={onRetry}
                        title={tryAgainButtonTitle}
                    >
                        {tryAgainButtonTitle}
                    </button>
                </div>
            );
        }
        if (previewState.matches(FetchStates.SUCCESS)) {
            if (isImage) {
                return (
                    <ImageRequest
                        src={previewState.context.data}
                    />
                );
            }
            if (isText) {
                return (
                    <TextRequest
                        text={previewState.context.data}
                        requestType={requestType}
                        shouldBeautify={beautify}
                    />
                );
            }
            return null;
        }
        return null;
    };

    return (
        <>
            <div className="request-modal__title">
                <button
                    type="button"
                    onClick={handleBackToRequestClick}
                    className="request-modal__navigation"
                >
                    <Icon
                        id="#arrow-left"
                        className="icon--24 icon--gray-default"
                    />
                    <span className="request-modal__header">
                        {translator.getMessage('filtering_modal_preview_title')}
                    </span>
                </button>
            </div>
            <div className="request-modal__content request-preview thin-scrollbar">
                {renderContent()}
            </div>
            <div className="request-modal__controls">
                <button
                    type="button"
                    className="button button--l button--transparent request-modal__button"
                    onClick={handleBackToRequestClick}
                    title={backToRequestButtonTitle}
                >
                    {backToRequestButtonTitle}
                </button>
                {isText && previewState.matches(FetchStates.SUCCESS) && (
                    <button
                        type="button"
                        className="button button--l button--transparent request-modal__button"
                        onClick={handleBeautifyClick}
                        title={beautifyButtonTitle}
                    >
                        {beautifyButtonTitle}
                    </button>
                )}
            </div>
        </>
    );
});
