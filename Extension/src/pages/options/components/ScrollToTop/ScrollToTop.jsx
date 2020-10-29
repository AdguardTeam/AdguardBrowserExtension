import React, { useEffect, useRef } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

const ScrollToTop = ({ children, location }) => {
    const usePrevious = (value) => {
        const ref = useRef();
        useEffect(() => {
            ref.current = value;
        });
        return ref.current;
    };

    useEffect(() => {
        const prevLocation = usePrevious(location);
        if (location !== prevLocation) {
            window.scrollTo(0, 0);
        }
    });

    return (
        <>
            {children}
        </>
    );
};

ScrollToTop.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    location: PropTypes.object.isRequired,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

const scrollToTop = withRouter(ScrollToTop);

export { scrollToTop };
