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

/* eslint-disable jsx-a11y/no-static-element-interactions */

import React, {
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
} from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { rootStore } from '../../../stores/RootStore';
import { RequestInfo } from '../RequestInfo';
import { RequestCreateRule } from '../RequestCreateRule';
import { optionsStorage } from '../../../../options/options-storage';
import { WizardRequestState } from '../../../constants';
import { RequestPreview } from '../RequestPreview';
import { DEFAULT_MODAL_WIDTH_PX } from '../constants';

import './request-modal.pcss';

Modal.setAppElement('#root');

const RequestModal = observer(() => {
    const { wizardStore } = useContext(rootStore);
    const onKeyUp = useCallback((e) => {
        if (e.key === 'Escape') {
            wizardStore.closeModal();
        }
    }, [wizardStore]);

    useEffect(() => {
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [onKeyUp]);

    const MAX_MODAL_WIDTH_RATIO = 0.75;

    const startModalWidth = optionsStorage.getItem(optionsStorage.KEYS.REQUEST_INFO_MODAL_WIDTH)
        || DEFAULT_MODAL_WIDTH_PX;

    const [modalWidth, setModalWidth] = useState(startModalWidth);
    const isDraggingRef = useRef(false);

    const {
        isModalOpen,
        closeModal,
        requestModalState,
        requestModalStateEnum,
    } = wizardStore;

    let modalContent;

    switch (requestModalState) {
        case WizardRequestState.View: {
            modalContent = <RequestInfo />;
            break;
        }

        case WizardRequestState.Block:
        case WizardRequestState.Unblock: {
            modalContent = <RequestCreateRule />;
            break;
        }

        case WizardRequestState.Preview: {
            modalContent = <RequestPreview />;
            break;
        }

        default:
            modalContent = <RequestInfo />;
    }

    const className = cn('request-modal thin-scrollbar', {
        'request-modal__view': requestModalStateEnum.isView,
        'request-modal__block': requestModalStateEnum.isBlock,
        'request-modal__unblock': requestModalStateEnum.isUnblock,
    });

    const persistModalWidth = (width) => {
        setModalWidth(width);
        optionsStorage.setItem(optionsStorage.KEYS.REQUEST_INFO_MODAL_WIDTH, width);
    };

    const pointerMoveHandler = (e) => {
        if (!isDraggingRef.current) {
            return;
        }

        const newWidth = window.innerWidth - e.pageX;
        if (newWidth < DEFAULT_MODAL_WIDTH_PX
            || newWidth > window.innerWidth * MAX_MODAL_WIDTH_RATIO) {
            return;
        }

        persistModalWidth(newWidth);
    };

    const BODY_RESIZE_CLASS_NAME = 'col-resize';

    const pointerDownHandler = (e) => {
        e.target.setPointerCapture(e.pointerId);
        isDraggingRef.current = true;
        document.body.classList.add(BODY_RESIZE_CLASS_NAME);
    };

    const pointerUpHandler = (e) => {
        const target = e.target;
        if (!target.hasPointerCapture(e.pointerId)) {
            return;
        }

        target.releasePointerCapture(e.pointerId);
        isDraggingRef.current = false;
        document.body.classList.remove(BODY_RESIZE_CLASS_NAME);
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onRequestClose={closeModal}
            className={className}
            overlayClassName="request-modal__overlay"
            style={{
                content: {
                    width: `${modalWidth}px`,
                },
            }}
        >
            <div
                className="request-modal__dragbar"
                onPointerMove={pointerMoveHandler}
                onPointerDown={pointerDownHandler}
                onPointerUp={pointerUpHandler}
                onPointerLeave={pointerUpHandler}
                aria-hidden="true"
            />
            {modalContent}
        </Modal>
    );
});

export { RequestModal };
