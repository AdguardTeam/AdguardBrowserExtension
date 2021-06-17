import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { useMachine } from '@xstate/react';

import { Icon } from '../../../../common/components/ui/Icon';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { rootStore } from '../../../stores/RootStore';
import { RequestTypes } from '../../../../../background/utils/request-types';
import { ImageRequest } from './ImageRequest';
import { TextRequest } from './TextRequest';
import { PREVIEW_EVENTS, PREVIEW_STATES, previewLoadMachine } from './previewLoadMachine';

export const RequestPreview = observer(() => {
    const {
        wizardStore,
        logStore,
    } = useContext(rootStore);

    const { selectedEvent } = logStore;

    const [previewLoadCurrent, send] = useMachine(previewLoadMachine);

    const [beautify, setBeautify] = useState(false);

    const onPreviewLoadError = () => {
        send(PREVIEW_EVENTS.ERROR);
    };

    const onPreviewLoadSuccess = () => {
        send(PREVIEW_EVENTS.SUCCESS);
    };

    let showBeautify = false;
    let renderingInfo = null;
    switch (selectedEvent.requestType) {
        case RequestTypes.IMAGE:
            renderingInfo = (
                <ImageRequest
                    url={selectedEvent.requestUrl}
                    onError={onPreviewLoadError}
                    onSuccess={onPreviewLoadSuccess}
                />
            );
            break;
        case RequestTypes.DOCUMENT:
        case RequestTypes.SUBDOCUMENT:
        case RequestTypes.SCRIPT:
        case RequestTypes.STYLESHEET:
            renderingInfo = (
                <TextRequest
                    url={selectedEvent.requestUrl}
                    requestType={selectedEvent.requestType}
                    shouldBeautify={beautify}
                    onError={onPreviewLoadError}
                    onSuccess={onPreviewLoadSuccess}
                />
            );
            showBeautify = true;
            break;
        default:
            break;
    }

    const handleBackToRequestClick = () => {
        wizardStore.setViewState();
    };

    const handleBeautifyClick = () => {
        setBeautify(true);
    };

    const backToRequestButtonTitle = reactTranslator.getMessage('filtering_log_details_modal_back_button');
    const beautifyButtonTitle = reactTranslator.getMessage('filtering_log_details_modal_beautify_button');

    const previewStatesMap = {
        [PREVIEW_STATES.LOADING]: {
            status: reactTranslator.getMessage('filtering_modal_status_text_loading'),
        },
        [PREVIEW_STATES.ERROR]: {
            status: reactTranslator.getMessage('filtering_modal_status_text_error'),
        },
        [PREVIEW_STATES.SUCCESS]: null,
    };

    const previewLoadCurrentData = previewStatesMap[previewLoadCurrent.value];
    const errorOccurred = previewLoadCurrent.matches(PREVIEW_STATES.ERROR);

    let statusComponent;
    if (errorOccurred) {
        statusComponent = (
            <span className="request-info__error">
                {previewLoadCurrentData.status}
            </span>
        );
    } else {
        statusComponent = previewLoadCurrentData?.status;
    }

    return (
        <>
            <div className="request-modal__title">
                <button
                    type="button"
                    onClick={wizardStore.closeModal}
                    className="request-modal__navigation request-modal__navigation--close"
                >
                    <Icon id="#cross" classname="icon--contain" />
                </button>
                <span className="request-modal__header">
                    {reactTranslator.getMessage('filtering_modal_preview_title')}
                </span>
            </div>
            <div className="request-modal__content">
                {previewLoadCurrentData && (
                    <div className="request-info">
                        <div className="request-info__key">
                            {reactTranslator.getMessage('filtering_modal_status_text_desc')}
                        </div>
                        <div className="request-info__value">
                            {statusComponent}
                        </div>
                    </div>
                )}
                {renderingInfo}
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

                {showBeautify && !errorOccurred && (
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
