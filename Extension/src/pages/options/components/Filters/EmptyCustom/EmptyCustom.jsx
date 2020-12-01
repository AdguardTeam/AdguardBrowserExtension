import React from 'react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './empty-custom.pcss';

const EmptyCustom = () => (
    <div className="empty-custom">
        <div className="empty-custom__ico" />
        <div className="empty-custom__desc">{reactTranslator.translate('options_empty_custom_filter')}</div>
    </div>
);

export { EmptyCustom };
