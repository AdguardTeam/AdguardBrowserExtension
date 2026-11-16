/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import React from 'react';

import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { observable, runInAction } from 'mobx';

import { Allowlist } from '../../../../../../Extension/src/pages/options/components/Allowlist/Allowlist';
import { rootStore } from '../../../../../../Extension/src/pages/options/stores/RootStore';

vi.mock('../../../../../../Extension/src/pages/options/components/Settings/SettingsSection', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SettingsSection: ({
        title,
        titleIcon,
        description,
        actions,
        inlineControl,
        className,
    }: any) => (
        <section data-testid="settings-section" data-class-name={className ?? ''}>
            <div>
                {titleIcon}
                {title}
            </div>
            <div>{description}</div>
            <div>{actions}</div>
            <div>{inlineControl}</div>
        </section>
    ),
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Allowlist/AllowlistMenu', () => ({
    AllowlistMenu: () => <div data-testid="allowlist-menu" />,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Allowlist/AllowlistSwitcher', () => ({
    AllowlistSwitcher: () => <div data-testid="allowlist-switcher" />,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: ({ id }: { id: string }) => <svg data-testid={`icon-${id}`} />,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Allowlist/AllowlistSavingButton', () => ({
    AllowlistSavingButton: ({ onClick }: { onClick: () => Promise<void> }) => (
        <button type="button" data-testid="allowlist-save-button" onClick={onClick} />
    ),
}));

/**
 * Selection shape of the fake editor handle. It mirrors the real
 * `EditorSelectionState`, like the rest of the handle stub.
 */
type FakeSelection = {
    ranges: Array<{
        anchor: { line: number; ch: number };
        head: { line: number; ch: number };
    }>;
    mainIndex: number;
};

// Shared mutable state between the hoisted Editor mock and the test body.
const editorState = vi.hoisted(() => ({
    value: '',
    setValueCalls: [] as string[],
    resetValueCalls: [] as string[],
    selection: {
        ranges: [{ anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 0 } }],
        mainIndex: 0,
    } as FakeSelection,
    selectionCalls: [] as FakeSelection[],
}));

vi.mock('../../../../../../Extension/src/pages/common/components/Editor', () => ({
    // The editor exposes an imperative handle we drive in place of CodeMirror.
    Editor: ({ editorRef }: { editorRef: { current: unknown } }) => {
        React.useEffect(() => {
            editorRef.current = {
                getValue: () => editorState.value,
                setValue: (value: string) => {
                    editorState.value = value;
                    editorState.setValueCalls.push(value);

                    // The real `EditorHandle.setValue` places the caret at the
                    // end of the document.
                    const lines = value.split('\n');
                    const lastLineIndex = lines.length - 1;
                    const cursor = {
                        line: lines.length,
                        ch: lines[lastLineIndex]?.length ?? 0,
                    };

                    editorState.selection = {
                        ranges: [{ anchor: cursor, head: cursor }],
                        mainIndex: 0,
                    };
                },
                // Initial seeding goes through the non-undoable reset.
                resetValue: (value: string) => {
                    editorState.value = value;
                    editorState.resetValueCalls.push(value);

                    // The real `EditorHandle.resetValue` also moves the caret to
                    // the end of the document.
                    const lines = value.split('\n');
                    const lastLineIndex = lines.length - 1;
                    const cursor = {
                        line: lines.length,
                        ch: lines[lastLineIndex]?.length ?? 0,
                    };

                    editorState.selection = {
                        ranges: [{ anchor: cursor, head: cursor }],
                        mainIndex: 0,
                    };
                },
                getCursor: () => ({ line: 1, ch: 0 }),
                setCursor: () => {},
                getSelection: () => editorState.selection,
                setSelection: (selection: FakeSelection) => {
                    // Mirror the line and character clamping of the real
                    // `EditorHandle.setSelection`.
                    const lines = editorState.value.split('\n');
                    const clampCursor = ({ line, ch }: { line: number; ch: number }) => {
                        const targetLine = Math.min(Math.max(line, 1), lines.length);

                        return {
                            line: targetLine,
                            ch: Math.min(Math.max(ch, 0), lines[targetLine - 1]?.length ?? 0),
                        };
                    };
                    const clamped: FakeSelection = {
                        ranges: selection.ranges.map(({ anchor, head }) => ({
                            anchor: clampCursor(anchor),
                            head: clampCursor(head),
                        })),
                        mainIndex: selection.mainIndex,
                    };

                    editorState.selection = clamped;
                    // Record the raw argument so an out-of-range mapping
                    // cannot pass by relying on this clamp.
                    editorState.selectionCalls.push(selection);
                },
                setWrap: () => {},
                setReadOnly: () => {},
                focus: () => {},
            };

            return () => {
                editorRef.current = null;
            };
        }, [editorRef]);

        return <div data-testid="allowlist-editor" />;
    },
    EditorLeaveModal: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/components/SavingButton', () => ({
    SavingErrorMessage: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/options/components/Warnings', () => ({
    DynamicRulesLimitsWarning: () => null,
    ClipboardPermissionWarning: () => null,
}));

vi.mock('../../../../../../Extension/src/pages/common/hooks/usePreventUnload', () => ({
    usePreventUnload: () => {},
}));

vi.mock('../../../../../../Extension/src/pages/common/telemetry', () => ({
    useTelemetryPageViewEvent: () => {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TelemetryStore: vi.fn(function (this: any) {
        this.sendCustomEvent = vi.fn();
    }),
}));

vi.mock('../../../../../../Extension/src/common/telemetry', () => ({
    TelemetryEventName: {
        AllowlistImportClick: 'allowlist_import_click',
        AllowlistSaveClick: 'allowlist_save_click',
    },
    TelemetryScreenName: {
        WebsiteAllowListScreen: 'website_allow_list_screen',
    },
}));

vi.mock('../../../../../../Extension/src/common/translators/translator', () => ({
    translator: { getMessage: (key: string) => key },
}));

vi.mock('../../../../../../Extension/src/common/user-agent', () => ({
    UserAgent: { isFirefoxMobile: false },
}));

vi.mock('../../../../../../Extension/src/pages/common/components/Editor/savingFSM', () => ({
    SavingFSMState: { Idle: 'idle', Saving: 'saving' },
    createSavingService: () => ({
        getSnapshot: () => ({ value: 'idle' }),
        subscribe: () => () => {},
        send: vi.fn(),
    }),
}));

const rootValue = {
    // Observable, so that the `observer` wrapper re-renders the component when
    // the allowlist changes outside of it (e.g. a domain added from the popup).
    settingsStore: observable.object({
        getAllowlist: vi.fn().mockResolvedValue(undefined),
        saveAllowlist: vi.fn().mockResolvedValue(undefined),
        checkLimitations: vi.fn().mockResolvedValue(undefined),
        setAllowlistEditorContentChangedState: vi.fn(),
        allowlist: 'example.org',
        allowlistEditorContentChanged: false,
        allowlistEditorWrap: false,
        allowlistSizeReset: false,
        savingAllowlistState: 'idle',
        settings: {
            names: {
                AllowlistEnabled: 'allowlist-enabled',
                DefaultAllowlistMode: 'default-allowlist-mode',
            },
            values: {
                'default-allowlist-mode': true,
            },
        },
    }, {}, { deep: false }),
    uiStore: { setShowLoader: vi.fn(), addNotification: vi.fn() },
    telemetryStore: { sendCustomEvent: vi.fn() },
};

const renderAllowlist = () => render(
    React.createElement(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rootStore.Provider as any,
        { value: rootValue },
        React.createElement(Allowlist),
    ),
);

describe('Allowlist layout', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders separate title/action and switch rows', async () => {
        renderAllowlist();

        const sections = await screen.findAllByTestId('settings-section');
        expect(sections).toHaveLength(2);

        const [headerSection, switchSection] = sections;
        if (!headerSection || !switchSection) {
            throw new Error('Expected separate Allowlist header and switch sections');
        }

        expect(within(headerSection).getByTestId('allowlist-menu')).toBeTruthy();
        expect(within(headerSection).getByText('options_allowlist_desc')).toBeTruthy();
        expect(within(headerSection).queryByTestId('allowlist-switcher')).toBeNull();

        expect(switchSection.getAttribute('data-class-name')).toBe('settings__group--editor-switch');
        expect(within(switchSection).getByTestId('icon-#user-rules')).toBeTruthy();
        expect(within(switchSection).getByTestId('allowlist-switcher')).toBeTruthy();
        expect(within(switchSection).queryByTestId('allowlist-menu')).toBeNull();
    });
});

describe('Allowlist content sync', () => {
    const defaultSelection = (): FakeSelection => ({
        ranges: [{ anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 0 } }],
        mainIndex: 0,
    });

    /**
     * Renders the component and emulates fetching normalized content from the
     * store.
     *
     * @param typedContent Content currently shown in the editor.
     * @param savedContent Normalized content returned by the store.
     */
    const renderWithContentSync = async (typedContent: string, savedContent: string) => {
        editorState.value = typedContent;

        rootValue.settingsStore.getAllowlist.mockImplementation(async () => {
            runInAction(() => {
                rootValue.settingsStore.allowlist = savedContent;
            });
        });

        renderAllowlist();

        await waitFor(() => {
            expect(editorState.setValueCalls).toContain(savedContent);
        });
    };

    beforeEach(() => {
        editorState.value = '';
        editorState.setValueCalls.length = 0;
        editorState.resetValueCalls.length = 0;
        editorState.selection = defaultSelection();
        editorState.selectionCalls.length = 0;
        rootValue.settingsStore.allowlist = 'example.org';
        rootValue.settingsStore.allowlistEditorContentChanged = false;
        rootValue.settingsStore.getAllowlist.mockReset().mockResolvedValue(undefined);
        rootValue.settingsStore.saveAllowlist.mockReset().mockResolvedValue(undefined);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('seeds the first load through resetValue so it is not undoable', async () => {
        editorState.value = '';

        renderAllowlist();

        await waitFor(() => {
            expect(editorState.resetValueCalls).toContain('example.org');
        });

        expect(editorState.setValueCalls).toHaveLength(0);
    });

    it('does not replace the document when the editor already shows the store content', async () => {
        editorState.value = 'example.org';

        renderAllowlist();

        await waitFor(() => {
            expect(rootValue.settingsStore.getAllowlist).toHaveBeenCalled();
        });

        // Replacing the document with an identical value moves the caret to the
        // end of the editor and adds an unnecessary undo step, so it must be
        // skipped.
        expect(editorState.resetValueCalls).toHaveLength(0);
        expect(editorState.setValueCalls).toHaveLength(0);
        expect(editorState.selectionCalls).toHaveLength(0);
        expect(editorState.value).toBe('example.org');
    });

    it('replaces typed domains with the normalized store content and restores the selection', async () => {
        // The background normalizes the allowlist on saving: it lowercases the
        // domains, drops blank lines and strips the `www.` prefix. The editor
        // must show these normalized values instead of the typed ones.
        editorState.value = 'Example.COM\n\nwww.Example.ORG';
        const selection = {
            ranges: [{ anchor: { line: 1, ch: 5 }, head: { line: 1, ch: 5 } }],
            mainIndex: 0,
        };
        editorState.selection = selection;

        rootValue.settingsStore.getAllowlist.mockImplementation(async () => {
            runInAction(() => {
                rootValue.settingsStore.allowlist = 'example.com\nexample.org';
            });
        });

        renderAllowlist();

        await waitFor(() => {
            expect(editorState.setValueCalls).toContain('example.com\nexample.org');
        });

        expect(editorState.value).toBe('example.com\nexample.org');
        expect(editorState.selectionCalls).toEqual([selection]);
    });

    it('places the caret at the end when the initial editor is empty', async () => {
        editorState.value = '';
        rootValue.settingsStore.getAllowlist.mockImplementation(async () => {
            runInAction(() => {
                rootValue.settingsStore.allowlist = 'example.com';
            });
        });

        renderAllowlist();

        await waitFor(() => {
            expect(editorState.resetValueCalls).toContain('example.com');
        });

        expect(editorState.setValueCalls).toHaveLength(0);
        expect(editorState.selectionCalls).toHaveLength(0);
        expect(editorState.selection).toEqual({
            ranges: [{ anchor: { line: 1, ch: 11 }, head: { line: 1, ch: 11 } }],
            mainIndex: 0,
        });
    });

    it('maps a selection to the same text when a prefix is removed', async () => {
        const expectedSelection = {
            ranges: [{
                anchor: { line: 1, ch: 0 },
                head: { line: 1, ch: 7 },
            }],
            mainIndex: 0,
        };
        editorState.selection = {
            ranges: [{
                anchor: { line: 1, ch: 4 },
                head: { line: 1, ch: 11 },
            }],
            mainIndex: 0,
        };

        await renderWithContentSync('www.Example.COM', 'example.com');

        expect(editorState.selectionCalls).toEqual([expectedSelection]);
    });

    it('keeps the caret on a saved entry that is not normalized', async () => {
        const selection = {
            ranges: [{ anchor: { line: 1, ch: 6 }, head: { line: 1, ch: 6 } }],
            mainIndex: 0,
        };
        editorState.selection = selection;

        // The settings import keeps entries as they are, so the store can
        // return a line that normalizes to a different value. The caret must
        // stay on that line when a domain is added from another place, e.g.
        // the popup.
        await renderWithContentSync('WWW.A.COM\nb.com', 'WWW.A.COM\nb.com\nc.com');

        expect(editorState.selectionCalls).toEqual([selection]);
    });

    it('maps a caret inside a URL host to the saved domain', async () => {
        const expectedSelection = {
            ranges: [{ anchor: { line: 1, ch: 3 }, head: { line: 1, ch: 3 } }],
            mainIndex: 0,
        };
        editorState.selection = {
            ranges: [{ anchor: { line: 1, ch: 15 }, head: { line: 1, ch: 15 } }],
            mainIndex: 0,
        };

        await renderWithContentSync('https://www.example.net/path', 'example.net');

        expect(editorState.selectionCalls).toEqual([expectedSelection]);
    });

    it('keeps the caret at the end of the list when normalization drops a trailing line', async () => {
        editorState.value = 'example.com\n';
        editorState.selection = {
            ranges: [{ anchor: { line: 2, ch: 0 }, head: { line: 2, ch: 0 } }],
            mainIndex: 0,
        };

        rootValue.settingsStore.getAllowlist.mockImplementation(async () => {
            runInAction(() => {
                rootValue.settingsStore.allowlist = 'example.com';
            });
        });

        renderAllowlist();

        await waitFor(() => {
            expect(editorState.setValueCalls).toContain('example.com');
        });

        const expectedSelection = {
            ranges: [{ anchor: { line: 1, ch: 11 }, head: { line: 1, ch: 11 } }],
            mainIndex: 0,
        };

        // The trailing line is gone, so the caret must move to the end of the
        // remaining line instead of the start of the document.
        expect(editorState.selectionCalls).toEqual([expectedSelection]);
        expect(editorState.selection).toEqual(expectedSelection);
    });

    it('keeps the caret on a later line when an earlier line is shortened', async () => {
        const selection = {
            ranges: [{ anchor: { line: 2, ch: 5 }, head: { line: 2, ch: 5 } }],
            mainIndex: 0,
        };
        editorState.selection = selection;

        await renderWithContentSync(
            'www.example.com\nexample.org',
            'example.com\nexample.org',
        );

        // The first line lost the `www.` prefix, but the caret stays at the
        // same position on the second line.
        expect(editorState.selectionCalls).toEqual([selection]);
    });

    it('keeps the caret on a later line when a duplicate before it is dropped', async () => {
        const expectedSelection = {
            ranges: [{ anchor: { line: 2, ch: 1 }, head: { line: 2, ch: 1 } }],
            mainIndex: 0,
        };
        editorState.selection = {
            ranges: [{ anchor: { line: 3, ch: 1 }, head: { line: 3, ch: 1 } }],
            mainIndex: 0,
        };

        await renderWithContentSync(
            'a.com\nwww.a.com\nb.com\nc.com',
            'a.com\nb.com\nc.com',
        );

        expect(editorState.selectionCalls).toEqual([expectedSelection]);
    });

    it('moves a caret on a dropped duplicate to the next saved line', async () => {
        const expectedSelection = {
            ranges: [{ anchor: { line: 2, ch: 0 }, head: { line: 2, ch: 0 } }],
            mainIndex: 0,
        };
        editorState.selection = {
            ranges: [{ anchor: { line: 2, ch: 4 }, head: { line: 2, ch: 4 } }],
            mainIndex: 0,
        };

        await renderWithContentSync(
            'a.com\nwww.a.com\nb.com',
            'a.com\nb.com',
        );

        expect(editorState.selectionCalls).toEqual([expectedSelection]);
    });

    it('keeps the caret on a domain when an earlier domain is removed externally', async () => {
        const expectedSelection = {
            ranges: [{ anchor: { line: 2, ch: 2 }, head: { line: 2, ch: 2 } }],
            mainIndex: 0,
        };
        editorState.selection = {
            ranges: [{ anchor: { line: 3, ch: 2 }, head: { line: 3, ch: 2 } }],
            mainIndex: 0,
        };

        await renderWithContentSync(
            'a.com\nb.com\nc.com\nd.com',
            'a.com\nc.com\nd.com',
        );

        expect(editorState.selectionCalls).toEqual([expectedSelection]);
    });

    it('keeps the caret on a later line after a long URL line', async () => {
        const selection = {
            ranges: [{ anchor: { line: 2, ch: 11 }, head: { line: 2, ch: 11 } }],
            mainIndex: 0,
        };
        editorState.selection = selection;

        await renderWithContentSync(
            'https://www.example.com/a\nexample.org\nother.com',
            'example.com\nexample.org\nother.com',
        );

        // The shortened URL line must not push the caret to the document end.
        expect(editorState.selectionCalls).toEqual([selection]);
    });

    it('keeps the caret at the start of the last line after a long URL line', async () => {
        const selection = {
            ranges: [{ anchor: { line: 3, ch: 0 }, head: { line: 3, ch: 0 } }],
            mainIndex: 0,
        };
        editorState.selection = selection;

        await renderWithContentSync(
            'https://www.example.com/a\nexample.org\nother.com',
            'example.com\nexample.org\nother.com',
        );

        expect(editorState.selectionCalls).toEqual([selection]);
    });

    it('keeps the caret when a trailing line is dropped and an earlier line is shortened', async () => {
        const selection = {
            ranges: [{ anchor: { line: 2, ch: 5 }, head: { line: 2, ch: 5 } }],
            mainIndex: 0,
        };
        editorState.selection = selection;

        await renderWithContentSync(
            'https://www.example.com/a\nexample.org\n',
            'example.com\nexample.org',
        );

        expect(editorState.selectionCalls).toEqual([selection]);
    });

    it('shows the normalized list after saving and keeps the caret position', async () => {
        editorState.value = 'example.org';
        const selection = {
            ranges: [{ anchor: { line: 1, ch: 4 }, head: { line: 1, ch: 4 } }],
            mainIndex: 0,
        };

        renderAllowlist();

        await waitFor(() => {
            expect(rootValue.settingsStore.getAllowlist).toHaveBeenCalled();
        });

        expect(editorState.resetValueCalls).toHaveLength(0);

        // The user types a domain as they want it, e.g. with uppercase letters.
        editorState.value = 'Example.COM';
        editorState.selection = selection;
        runInAction(() => {
            rootValue.settingsStore.allowlistEditorContentChanged = true;
        });

        // After the save, the background returns the normalized list.
        rootValue.settingsStore.getAllowlist.mockImplementation(async () => {
            runInAction(() => {
                rootValue.settingsStore.allowlist = 'example.com';
            });
        });

        fireEvent.click(screen.getByTestId('allowlist-save-button'));

        await waitFor(() => {
            expect(editorState.setValueCalls).toContain('example.com');
        });

        // The editor shows the saved list, and the caret stays where it was.
        expect(rootValue.settingsStore.saveAllowlist).toHaveBeenCalledWith('Example.COM');
        expect(editorState.value).toBe('example.com');
        expect(editorState.selectionCalls).toEqual([selection]);
    });

    it('seeds a non-empty first load through resetValue', async () => {
        editorState.value = '';
        rootValue.settingsStore.allowlist = 'example.com';

        renderAllowlist();

        await waitFor(() => {
            expect(editorState.resetValueCalls).toContain('example.com');
        });

        expect(editorState.setValueCalls).toHaveLength(0);
        expect(editorState.value).toBe('example.com');
    });

    it('replaces the document when the allowlist is updated from another place', async () => {
        editorState.value = 'example.org';

        renderAllowlist();

        await waitFor(() => {
            expect(rootValue.settingsStore.getAllowlist).toHaveBeenCalled();
        });
        expect(editorState.setValueCalls).toHaveLength(0);

        // A domain is added from the popup, for example.
        runInAction(() => {
            rootValue.settingsStore.allowlist = 'example.org\nexample.com';
        });

        await waitFor(() => {
            expect(editorState.setValueCalls).toContain('example.org\nexample.com');
        });
    });
});
