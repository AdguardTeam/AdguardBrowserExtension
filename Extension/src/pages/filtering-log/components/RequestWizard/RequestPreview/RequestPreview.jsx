import React, { useContext, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useMachine } from '@xstate/react';

import { Icon } from '../../../../common/components/ui/Icon';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { fetchMachine, FetchEvents, FetchStates } from '../../../../common/machines/fetchMachine';
import { rootStore } from '../../../stores/RootStore';
import { RequestTypes } from '../../../../../background/utils/request-types';
import { ImageRequest } from './ImageRequest';
import { TextRequest } from './TextRequest';
import { fetchText, fetchImage } from './fetchers';

import './request-preview.pcss';
import '../RequestInfo/request-image.pcss';

export const RequestPreview = observer(() => {
    const {
        wizardStore,
        logStore,
    } = useContext(rootStore);

    const { selectedEvent } = logStore;

    const { requestType, requestUrl } = selectedEvent;

    const isText = requestType === RequestTypes.DOCUMENT
        || requestType === RequestTypes.SUBDOCUMENT
        || requestType === RequestTypes.SCRIPT
        || requestType === RequestTypes.STYLESHEET;

    const isImage = requestType === RequestTypes.IMAGE;

    const getFetcher = () => {
        if (isText) {
            return fetchText;
        }
        if (isImage) {
            return fetchImage;
        }
        return null;
    };

    const [previewState, send] = useMachine(fetchMachine, {
        services: {
            fetchData: getFetcher(),
        },
    });

    const [beautify, setBeautify] = useState(false);

    useEffect(() => {
        send(FetchEvents.FETCH, { url: requestUrl });
    }, [requestUrl, send]);

    const onRetry = () => {
        send(FetchEvents.RETRY, { url: requestUrl });
    };

    const handleBackToRequestClick = () => {
        wizardStore.setViewState();
    };

    const handleBeautifyClick = () => {
        setBeautify(true);
    };

    const tryAgainButtonTitle = reactTranslator.getMessage('filtering_log_details_modal_try_again');
    const backToRequestButtonTitle = reactTranslator.getMessage('filtering_log_details_modal_back_button');
    const beautifyButtonTitle = reactTranslator.getMessage('filtering_log_details_modal_beautify_button');

    const renderContent = () => {
        if (previewState.matches(FetchStates.LOADING)) {
            return (
                <div className="request-preview__status">
                    <span className="request-info__value request-preview__text">
                        {reactTranslator.getMessage('filtering_modal_status_text_loading')}
                    </span>
                </div>
            );
        }
        if (previewState.matches(FetchStates.FAILURE)) {
            return (
                <div className="request-preview__status">
                    <span className="request-info__error request-preview__text">
                        {reactTranslator.getMessage('filtering_modal_status_text_error')}
                    </span>
                    <button
                        type="button"
                        className="request-preview__button request-preview__button--white"
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
                    className="request-modal__navigation request-modal__navigation--back"
                >
                    <Icon id="#arrow-left" classname="icon--contain" />
                </button>
                <span className="request-modal__header">
                    {reactTranslator.getMessage('filtering_modal_preview_title')}
                </span>
            </div>
            <div className="request-modal__content request-preview">
                {renderContent()}
            </div>
            <div className="request-modal__controls">
                <button
                    type="button"
                    className="request-modal__button request-modal__button--white"
                    onClick={handleBackToRequestClick}
                    title={backToRequestButtonTitle}
                >
                    {backToRequestButtonTitle}
                </button>
                {isText && previewState.matches(FetchStates.SUCCESS) && (
                    <button
                        type="button"
                        className="request-modal__button request-modal__button--white"
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
