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

import { assign, setup } from 'xstate';

/**
 * Inline editing state machine states.
 */
export const enum InlineEditingState {
    /**
     * No row is being edited and no new rule is being created.
     */
    View = 'view',

    /**
     * A row is being edited inline.
     */
    Editing = 'editing',

    /**
     * A new rule is being created in an inline editing row at the top of the
     * list.
     */
    Creating = 'creating',
}

/**
 * Inline editing state machine events.
 */
export const enum InlineEditingEvent {
    /**
     * Requests the inline create row for a new rule.
     */
    Create = 'create',

    /**
     * Requests inline editing for a row.
     */
    Edit = 'edit',

    /**
     * Reports the current editor content so the machine keeps the draft.
     */
    DraftChange = 'draftChange',

    /**
     * Points editing at the edited line after the list shifted it to a new
     * index (optimistic delete/undo, refetch).
     */
    Rebase = 'rebase',

    /**
     * Requests leaving editing mode after a successful save. Like
     * {@link InlineEditingEvent.Cancel} it drops the draft — the caller is
     * responsible for having persisted it beforehand, e.g. it sends Save only
     * once the save request has succeeded.
     */
    Save = 'save',

    /**
     * Requests leaving editing mode without keeping the draft. Sent when the
     * draft should be discarded: the user cancelled, or the tracked row is
     * gone (e.g. deleted from elsewhere). A failed save keeps the editor open
     * instead, so it never sends this.
     */
    Cancel = 'cancel',
}

/**
 * Inline editing machine context.
 */
type InlineEditingContext = {
    /**
     * 0-based source line index of the row being edited, `null` in view mode
     * and while a new rule is being created.
     */
    lineIndex: number | null;

    /**
     * Text used to track the edited row across list changes: the group's
     * marker-stripped seed (`getInlineEditorGroupSeed`), i.e. the whole block
     * for a comment group and the single line's displayed text for a rule.
     * Stable across `!off` toggles because the marker is stripped either way.
     * Never updated by typing.
     */
    storedValue: string;

    /**
     * Whether the tracked line is a comment. Kept alongside the text so a
     * same-text line of the other kind (a comment and a rule with identical
     * text) cannot take over the editing state. Never updated by typing.
     */
    storedIsComment: boolean;

    /**
     * Current editor content. Kept in the machine so a row remounted after a
     * rebase resumes with the draft instead of the stored text.
     */
    draft: string;
};

type InlineEditingEventType =
    | { type: InlineEditingEvent.Create }
    | {
        type: InlineEditingEvent.Edit;
        lineIndex: number;
        storedValue: string;
        storedIsComment: boolean;
        draft: string;
    }
    | { type: InlineEditingEvent.DraftChange; value: string }
    | { type: InlineEditingEvent.Rebase; lineIndex: number }
    | { type: InlineEditingEvent.Save }
    | { type: InlineEditingEvent.Cancel };

const INLINE_EDITING_MACHINE_ID = 'inlineEditing';

/**
 * Setup for {@link inlineEditingMachine}: typed context and events plus the
 * editing actions shared by the view and editing states.
 */
const inlineEditingSetup = setup({
    types: {} as {
        context: InlineEditingContext;
        events: InlineEditingEventType;
    },
    actions: {
        /**
         * Stores the row selected by an `edit` event together with its editor
         * seed.
         */
        startEditing: assign(({ event }) => {
            if (event.type !== InlineEditingEvent.Edit) {
                return {};
            }
            return {
                lineIndex: event.lineIndex,
                storedValue: event.storedValue,
                storedIsComment: event.storedIsComment,
                draft: event.draft,
            };
        }),

        /**
         * Clears the context when an inline editor is left or a new rule
         * starts, so no stale line reference or draft survives in the machine.
         */
        resetEditing: assign({
            lineIndex: null,
            storedValue: '',
            storedIsComment: false,
            draft: '',
        }),
    },
});

/**
 * Machine describing the inline editing states of the user rules list.
 *
 * Only one inline editor (an edited row or the create row) can exist at a
 * time: `edit` and `create` are ignored by the state that already has an
 * editor open, so the machine agrees with the list's outside-click blocker on
 * which draft is active. Editing therefore never moves to another row — the
 * list starts a new edit only after the current one is closed.
 */
export const inlineEditingMachine = inlineEditingSetup.createMachine({
    id: INLINE_EDITING_MACHINE_ID,
    initial: InlineEditingState.View,
    context: {
        lineIndex: null,
        storedValue: '',
        storedIsComment: false,
        draft: '',
    },
    states: {
        [InlineEditingState.View]: {
            on: {
                [InlineEditingEvent.Create]: {
                    target: InlineEditingState.Creating,
                    actions: 'resetEditing',
                },
                [InlineEditingEvent.Edit]: {
                    target: InlineEditingState.Editing,
                    actions: 'startEditing',
                },
            },
        },
        [InlineEditingState.Editing]: {
            on: {
                [InlineEditingEvent.DraftChange]: {
                    actions: assign({ draft: ({ event }) => event.value }),
                },
                [InlineEditingEvent.Rebase]: {
                    actions: assign({ lineIndex: ({ event }) => event.lineIndex }),
                },
                [InlineEditingEvent.Save]: {
                    target: InlineEditingState.View,
                    actions: 'resetEditing',
                },
                [InlineEditingEvent.Cancel]: {
                    target: InlineEditingState.View,
                    actions: 'resetEditing',
                },
            },
        },
        [InlineEditingState.Creating]: {
            on: {
                [InlineEditingEvent.DraftChange]: {
                    actions: assign({ draft: ({ event }) => event.value }),
                },
                [InlineEditingEvent.Save]: {
                    target: InlineEditingState.View,
                    actions: 'resetEditing',
                },
                [InlineEditingEvent.Cancel]: {
                    target: InlineEditingState.View,
                    actions: 'resetEditing',
                },
            },
        },
    },
});
