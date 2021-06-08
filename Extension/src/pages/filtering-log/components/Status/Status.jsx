import React from 'react';
import { Icon } from '../../../common/components/ui/Icon';
import './status.pcss';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

const Status = () => {
    return (
        <div className="status">
            <div className="status__item status__item--red">
                <Icon id="#ban" classname="status__icon" />
            </div>
            <div className="status__item status__item--gray">
                <Icon id="#arrow-status" classname="status__icon" />
            </div>
            <div className="status__item status__item--green">
                <Icon id="#profile-status" classname="status__icon" />
            </div>
            <div className="status__item status__item--orange">
                <Icon id="#transfer-status" classname="status__icon" />
            </div>
            <div className="status__item">
                <div className="status__info status__info--gray">
                    200
                </div>
            </div>
            <div className="status__item">
                <div className="status__info status__info--transparent">
                    OPTIONS
                </div>
            </div>
            <div className="status__item">
                <div className="status__info status__info--green">
                    302
                </div>
            </div>
            <div className="status__item status__item--red">
                <span className="status__label">
                    {reactTranslator.getMessage('filtering_log_filter_blocked')}
                </span>
                <Icon id="#ban" classname="status__icon" />
            </div>
        </div>
    );
};

export { Status };
