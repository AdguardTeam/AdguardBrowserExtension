import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores/RootStore';
import { RequestInfo } from '../RequestInfo';
import { WIZARD_STATES } from '../../../stores/WizardStore';
import { RequestCreateRule } from '../RequestCreateRule';
import './RequestModal.pcss';

Modal.setAppElement('#root');

const RequestModal = observer(() => {
    const { wizardStore } = useContext(rootStore);

    const { isModalOpen, closeModal, requestModalState } = wizardStore;

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

        default:
            modalContent = <RequestInfo />;
    }

    return (
        <Modal
            isOpen={isModalOpen}
            onRequestClose={closeModal}
            className="ReactModal__Content request-modal"
            overlayClassName="ReactModal__Overlay request-modal__overlay"
        >
            {modalContent}
        </Modal>
    );
});

export { RequestModal };
