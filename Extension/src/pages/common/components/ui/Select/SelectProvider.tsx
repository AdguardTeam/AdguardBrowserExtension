/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {
    createContext,
    useState,
    useMemo,
    useContext,
    useCallback,
} from 'react';

const noop = () => {};

export interface ISelectContext {
    currentSelect: null | string;
    setCurrentSelect: (id: null | string) => void;
}

export const SelectContext = createContext<ISelectContext>({
    currentSelect: null,
    setCurrentSelect: noop,
});

export interface SelectProviderProps {
    currentSelect?: null | string;
    children?: React.ReactNode;
}

export const SelectProvider = ({ currentSelect: currentSelectProp = null, children }: SelectProviderProps) => {
    const [currentSelect, setCurrentSelect] = useState<string | null>(currentSelectProp);

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

export const useSelect = (id: string) => {
    const { currentSelect, setCurrentSelect } = useContext(SelectContext);

    const hidden = currentSelect !== id;

    const setHidden = useCallback((hide: boolean) => {
        setCurrentSelect(hide ? null : id);
    }, [setCurrentSelect, id]);

    return [hidden, setHidden] as const;
};
