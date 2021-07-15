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
import { WIZARD_STATES } from '../../../stores/WizardStore';
import { RequestCreateRule } from '../RequestCreateRule';
import { optionsStorage } from '../../../../options/options-storage';
import { RequestPreview } from '../RequestPreview';
import { DEFAULT_MODAL_WIDTH_PX } from '../constants';

import './RequestModal.pcss';

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

    const dragBar = useRef(null);

    const {
        isModalOpen,
        closeModal,
        requestModalState,
        requestModalStateEnum,
    } = wizardStore;

    let modalContent;

    switch (requestModalState) {
        case WIZARD_STATES.VIEW_REQUEST: {
            modalContent = <RequestInfo />;
            break;
        }

        case WIZARD_STATES.BLOCK_REQUEST:
        case WIZARD_STATES.UNBLOCK_REQUEST: {
            modalContent = <RequestCreateRule />;
            break;
        }

        case WIZARD_STATES.PREVIEW_REQUEST: {
            modalContent = <RequestPreview />;
            break;
        }

        default:
            modalContent = <RequestInfo />;
    }

    const className = cn('ReactModal__Content request-modal', {
        'request-modal__view': requestModalStateEnum.isView,
        'request-modal__block': requestModalStateEnum.isBlock,
        'request-modal__unblock': requestModalStateEnum.isUnblock,
    });

    const persistModalWidth = (width) => {
        setModalWidth(width);
        optionsStorage.setItem(optionsStorage.KEYS.REQUEST_INFO_MODAL_WIDTH, width);
    };

    const drag = (e) => {
        const newWidth = window.innerWidth - e.pageX;
        if (newWidth < DEFAULT_MODAL_WIDTH_PX
            || newWidth > window.innerWidth * MAX_MODAL_WIDTH_RATIO) {
            return;
        }

        persistModalWidth(newWidth);
    };

    const mouseDownHandler = () => {
        const cleaner = () => {
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', cleaner);
        };
        document.addEventListener('mouseup', cleaner);
        document.addEventListener('mousemove', drag);
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onRequestClose={closeModal}
            className={className}
            overlayClassName="ReactModal__Overlay request-modal__overlay"
            style={{
                content: {
                    width: `${modalWidth}px`,
                },
            }}
        >
            <div
                ref={dragBar}
                className="request-modal__dragbar"
                onMouseDown={mouseDownHandler}
            />
            {modalContent}
        </Modal>
    );
});

export { RequestModal };
