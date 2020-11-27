import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import { rootStore } from '../../../stores/RootStore';
import { RequestInfo } from '../RequestInfo';
import { WIZARD_STATES } from '../../../stores/WizardStore';
import { RequestCreateRule } from '../RequestCreateRule';

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
            <button
                type="button"
                onClick={closeModal}
            >
                close
            </button>
            {modalContent}
        </Modal>
    );
});

export { RequestModal };
