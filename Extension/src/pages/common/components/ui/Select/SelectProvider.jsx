import React, {
    createContext,
    useState,
    useMemo,
    useContext,
    useCallback,
} from 'react';

const noop = () => {};

export const SelectContext = createContext({
    currentSelect: null,
    setCurrentSelect: noop,
});

export const SelectProvider = ({ currentSelect: currentSelectProp = null, children }) => {
    const [currentSelect, setCurrentSelect] = useState(currentSelectProp);

    const context = useMemo(() => {
        return {
            currentSelect,
            setCurrentSelect,
        };
    }, [currentSelect]);

    return (
        <SelectContext.Provider value={context}>
            {children}
        </SelectContext.Provider>
    );
};

export const useSelect = (id) => {
    const { currentSelect, setCurrentSelect } = useContext(SelectContext);

    const hidden = currentSelect !== id;

    const setHidden = useCallback((hide) => {
        setCurrentSelect(hide ? null : id);
    }, [setCurrentSelect, id]);

    return [hidden, setHidden];
};
