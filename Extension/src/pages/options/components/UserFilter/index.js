import React from 'react';
// import Editor from '../Editor'; TODO fix editor

function UserFilter() {
    return (
        <>
            <h2 className="title">UserFilter</h2>
            {/* // TODO fix editor */}
            {/* <Editor /> */}
            <div className="actions">
                <button type="button" className="button button--m button--green actions__btn">
                    Import
                </button>
                <button type="button" className="button button--m button--green-bd actions__btn">
                    Export
                </button>
            </div>
        </>
    );
}

export default UserFilter;
