import React from 'react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';

import './empty-custom.pcss';

const EmptyCustom = () => (
    <div className="empty-custom">
        <Icon id="#empty" classname="icon--empty empty-custom__ico" />
        <div className="empty-custom__desc">{reactTranslator.translate('options_empty_custom_filter')}</div>
    </div>
);

export { EmptyCustom };
