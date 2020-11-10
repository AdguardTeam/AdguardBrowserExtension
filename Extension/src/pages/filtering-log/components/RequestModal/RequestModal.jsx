import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import { rootStore } from '../../stores/RootStore';
import { RequestInfo } from '../RequestInfo';
import { REQUEST_WIZARD_STATES } from '../../stores/UiStore';

Modal.setAppElement('#root');

const RequestModal = observer(() => {
    const { uiStore } = useContext(rootStore);

    const { requestModalIsOpen, closeModal, requestModalState } = uiStore;

    let modalContent;

    switch (requestModalState) {
        case REQUEST_WIZARD_STATES.VIEW_REQUEST: {
            modalContent = <RequestInfo />;
            break;
        }
        default:
            modalContent = <RequestInfo />;
    }

    return (
        <Modal
            isOpen={requestModalIsOpen}
            onRequestClose={closeModal}
            style={{
                overlay: {
                    position: 'static',
                },
                content: {
                    position: 'fixed',
                    width: '500px', // TODO make responsive
                    right: '0px',
                    top: '0px',
                    bottom: '0px',
                    left: 'auto',
                },
            }}
        >
            {modalContent}
        </Modal>
    );
});

export { RequestModal };
