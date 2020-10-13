import React from 'react';
import Editor from '../Editor';

const UserRules = () => (
    <>
        {/* TODO fix translations */}
        <h2 className="title">User rules</h2>
        <div className="desc">
            You can add your own rules here. This option is recommended for advanced users familiar
            with HTML/CSS. Read the
            {' '}
            <a
                className="desc--link"
                href="https://adguard.com/forward.html?action=userfilter_description&from=options&app=browser_extension"
            >
                filter
                rules tutorial
            </a>
            {' '}
            to learn how to write your own filter rules.
        </div>
        <Editor />
        <div className="actions">
            <button type="button" className="button button--m button--green actions__btn">
                Import
            </button>
            <button type="button" className="button button--m button--green-bd actions__btn">
                Export
            </button>
            <button type="button" className="button button--m button--green actions__btn">Save</button>
        </div>
    </>
);

export { UserRules };
