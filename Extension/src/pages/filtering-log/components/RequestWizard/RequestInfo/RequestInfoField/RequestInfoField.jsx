/*
eslint-disable
jsx-a11y/click-events-have-key-events,
jsx-a11y/no-static-element-interactions
*/
import React, {
    useState, useLayoutEffect, useRef,
} from 'react';

import '../request-info.pcss';
import cn from 'classnames';

import { reactTranslator } from '../../../../../../common/translators/reactTranslator';
import { CopyToClipboard } from '../../../../../common/components/CopyToClipboard';
import { optionsStorage } from '../../../../../options/options-storage';
import { messenger } from '../../../../../services/messenger';
import { measureTextWidth } from '../../../../../helpers';
import { DEFAULT_MODAL_WIDTH_PX } from '../../constants';

const RequestInfoField = (props) => {
    const {
        data,
        title,
        event,
    } = props;

    const textRef = useRef(null);

    // We show full text and no showHide button by default, before determining if it's too long
    const [isLongTextHandlerButtonShown, setLongTextHandlerButtonShown] = useState(false);
    const [isFullTextShown, setFullTextShown] = useState(true);

    const isRequestUrl = data === event.requestUrl;
    const isRule = data === event.ruleText;
    const isFilterName = data === event.filterName;

    const canCopyToClipboard = isRequestUrl || isRule || isFilterName;
    const hasShowHideTextButton = isRequestUrl || isRule;
    const shouldHaveRef = isRequestUrl || isRule;
    let lineCountLimit;
    if (isRequestUrl) {
        lineCountLimit = 3;
    } else {
        lineCountLimit = 5;
    }

    useLayoutEffect(() => {
        const MODAL_PADDINGS_PX = 70;
        const startModalWidth = optionsStorage.getItem(optionsStorage.KEYS.REQUEST_INFO_MODAL_WIDTH)
            || DEFAULT_MODAL_WIDTH_PX;

        const textWidth = measureTextWidth(textRef?.current?.innerText);

        const urlWidthLimitPerLine = startModalWidth - MODAL_PADDINGS_PX;

        const isLongText = textWidth > lineCountLimit * urlWidthLimitPerLine;

        if (isLongText) {
            setLongTextHandlerButtonShown(true);
            setFullTextShown(false);
        } else {
            setLongTextHandlerButtonShown(false);
            setFullTextShown(true);
        }
    }, [event.eventId, lineCountLimit]);

    const openInNewTabHandler = async () => {
        const url = event.requestUrl;
        await messenger.openTab(url, { inNewWindow: true });
    };

    const showHideTextHandler = () => {
        setFullTextShown(!isFullTextShown);
    };

    const renderInNewTabButton = (e) => {
        // there is nothing to open if log event reveals blocked element or cookie
        const showOpenInNewTabButton = !(
            e.element
            || e.cookieName
            || e.script
        );

        return (
            <>
                {showOpenInNewTabButton && (
                    <div
                        className="request-modal__url-button"
                        type="button"
                        onClick={openInNewTabHandler}
                    >
                        {reactTranslator.getMessage('filtering_modal_open_in_new_tab')}
                    </div>
                )}
            </>
        );
    };

    const renderShowHideTextButton = () => {
        let showHideButtonText = '';
        if (isRequestUrl) {
            if (isFullTextShown) {
                showHideButtonText = reactTranslator.getMessage('filtering_modal_hide_full_url');
            } else {
                showHideButtonText = reactTranslator.getMessage('filtering_modal_show_full_url');
            }
        } else if (isRule) {
            if (isFullTextShown) {
                showHideButtonText = reactTranslator.getMessage('filtering_modal_hide_full_rule');
            } else {
                showHideButtonText = reactTranslator.getMessage('filtering_modal_show_full_rule');
            }
        }

        return (
            <>
                {isLongTextHandlerButtonShown && (
                    <div
                        className="request-modal__url-button"
                        type="button"
                        onClick={showHideTextHandler}
                    >
                        {showHideButtonText}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="request-info">
            <div className="request-info__key">{title}</div>
            <div className="request-info__value">
                {canCopyToClipboard
                    ? (
                        <>
                            <CopyToClipboard
                                ref={shouldHaveRef ? textRef : null}
                                wrapperClassName="request-info__copy-to-clipboard-wrapper"
                                className={cn(
                                    'request-info__copy-to-clipboard',
                                    hasShowHideTextButton && !isFullTextShown
                                        ? 'request-info__text-short'
                                        : 'request-info__text-full',
                                )}
                            >
                                {data}
                            </CopyToClipboard>
                            {isRequestUrl && renderInNewTabButton(event)}
                            {hasShowHideTextButton
                                ? renderShowHideTextButton()
                                : null}
                        </>
                    )
                    : data}
            </div>
        </div>
    );
};

export { RequestInfoField };
