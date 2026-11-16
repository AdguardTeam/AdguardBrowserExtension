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

import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest';
import { createActor, type ActorRefFrom } from 'xstate';

import {
    InlineEditingEvent,
    InlineEditingState,
    inlineEditingMachine,
} from '../../../../../../Extension/src/pages/options/components/UserRules/inline-editing-machine';

describe('inlineEditingMachine', () => {
    const actors: ActorRefFrom<typeof inlineEditingMachine>[] = [];

    /**
     * Context of the machine in view mode: the machine resets it on every exit
     * to View, so no stale line reference or draft survives.
     */
    const EMPTY_CONTEXT = {
        lineIndex: null,
        storedValue: '',
        storedIsComment: false,
        draft: '',
    };

    const createStartedActor = () => {
        const actor = createActor(inlineEditingMachine);
        actor.start();
        actors.push(actor);
        return actor;
    };

    afterEach(() => {
        actors.forEach((actor) => actor.stop());
        actors.length = 0;
    });

    it('starts in view mode with an empty context', () => {
        const actor = createStartedActor();

        expect(actor.getSnapshot().value).toBe(InlineEditingState.View);
        expect(actor.getSnapshot().context).toEqual(EMPTY_CONTEXT);
    });

    it('enters editing mode with the tracking text and the editor seed', () => {
        const actor = createStartedActor();

        actor.send({
            type: InlineEditingEvent.Edit,
            lineIndex: 3,
            // Comments are tracked and seeded by their marker-stripped text;
            // the marker is fixed context and is restored on save.
            storedValue: 'my comment',
            storedIsComment: true,
            draft: 'my comment',
        });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.Editing);
        expect(snapshot.context.lineIndex).toBe(3);
        expect(snapshot.context.storedValue).toBe('my comment');
        expect(snapshot.context.storedIsComment).toBe(true);
        expect(snapshot.context.draft).toBe('my comment');
    });

    it('ignores edit while another row is being edited', () => {
        const actor = createStartedActor();

        actor.send({
            type: InlineEditingEvent.Edit,
            lineIndex: 1,
            storedValue: 'first',
            storedIsComment: false,
            draft: 'first',
        });
        // The list starts a new edit only after the current one is closed, so
        // the machine must not move editing to another row (and silently
        // replace the active draft).
        actor.send({
            type: InlineEditingEvent.Edit,
            lineIndex: 5,
            storedValue: 'second',
            storedIsComment: false,
            draft: 'second',
        });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.Editing);
        expect(snapshot.context.lineIndex).toBe(1);
        expect(snapshot.context.storedValue).toBe('first');
        expect(snapshot.context.draft).toBe('first');
    });

    it('keeps the draft when the editor content changes', () => {
        const actor = createStartedActor();

        actor.send({
            type: InlineEditingEvent.Edit,
            lineIndex: 1,
            storedValue: 'original',
            storedIsComment: false,
            draft: 'original',
        });
        actor.send({ type: InlineEditingEvent.DraftChange, value: 'edited' });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.Editing);
        expect(snapshot.context.draft).toBe('edited');
        // The stored text and kind used to track the line must not change
        // while typing.
        expect(snapshot.context.storedValue).toBe('original');
        expect(snapshot.context.storedIsComment).toBe(false);
    });

    it('rebases the edited line index without losing the draft', () => {
        const actor = createStartedActor();

        actor.send({
            type: InlineEditingEvent.Edit,
            lineIndex: 1,
            storedValue: 'original',
            storedIsComment: false,
            draft: 'original',
        });
        actor.send({ type: InlineEditingEvent.DraftChange, value: 'edited' });
        actor.send({ type: InlineEditingEvent.Rebase, lineIndex: 4 });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.Editing);
        expect(snapshot.context.lineIndex).toBe(4);
        expect(snapshot.context.storedValue).toBe('original');
        expect(snapshot.context.storedIsComment).toBe(false);
        expect(snapshot.context.draft).toBe('edited');
    });

    it('returns to view mode and clears the context on save', () => {
        const actor = createStartedActor();

        actor.send({
            type: InlineEditingEvent.Edit,
            lineIndex: 1,
            storedValue: 'rule',
            storedIsComment: false,
            draft: 'rule',
        });
        actor.send({ type: InlineEditingEvent.Save });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.View);
        expect(snapshot.context).toEqual(EMPTY_CONTEXT);
    });

    it('returns to view mode and clears the context on cancel', () => {
        const actor = createStartedActor();

        actor.send({
            type: InlineEditingEvent.Edit,
            lineIndex: 1,
            storedValue: 'rule',
            storedIsComment: false,
            draft: 'rule',
        });
        actor.send({ type: InlineEditingEvent.Cancel });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.View);
        expect(snapshot.context).toEqual(EMPTY_CONTEXT);
    });

    it('ignores save and cancel in view mode', () => {
        const actor = createStartedActor();

        actor.send({ type: InlineEditingEvent.Save });
        actor.send({ type: InlineEditingEvent.Cancel });

        expect(actor.getSnapshot().value).toBe(InlineEditingState.View);
    });

    it('ignores draft changes and rebases in view mode', () => {
        const actor = createStartedActor();

        actor.send({ type: InlineEditingEvent.DraftChange, value: 'edited' });
        actor.send({ type: InlineEditingEvent.Rebase, lineIndex: 3 });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.View);
        expect(snapshot.context).toEqual(EMPTY_CONTEXT);
    });

    it('enters creating mode with an empty context on create', () => {
        const actor = createStartedActor();

        actor.send({ type: InlineEditingEvent.Create });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.Creating);
        expect(snapshot.context).toEqual(EMPTY_CONTEXT);
    });

    it('keeps the draft while creating', () => {
        const actor = createStartedActor();

        actor.send({ type: InlineEditingEvent.Create });
        actor.send({ type: InlineEditingEvent.DraftChange, value: '||new.example^' });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.Creating);
        expect(snapshot.context.draft).toBe('||new.example^');
    });

    it('returns to view mode and clears the context on save while creating', () => {
        const actor = createStartedActor();

        actor.send({ type: InlineEditingEvent.Create });
        actor.send({ type: InlineEditingEvent.DraftChange, value: '||new.example^' });
        actor.send({ type: InlineEditingEvent.Save });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.View);
        expect(snapshot.context).toEqual(EMPTY_CONTEXT);
    });

    it('returns to view mode and clears the context on cancel while creating', () => {
        const actor = createStartedActor();

        actor.send({ type: InlineEditingEvent.Create });
        actor.send({ type: InlineEditingEvent.DraftChange, value: '||new.example^' });
        actor.send({ type: InlineEditingEvent.Cancel });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.View);
        expect(snapshot.context).toEqual(EMPTY_CONTEXT);
    });

    it('ignores create while a row is being edited', () => {
        const actor = createStartedActor();

        actor.send({
            type: InlineEditingEvent.Edit,
            lineIndex: 1,
            storedValue: 'rule',
            storedIsComment: false,
            draft: 'rule',
        });
        actor.send({ type: InlineEditingEvent.Create });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.Editing);
        expect(snapshot.context.lineIndex).toBe(1);
        expect(snapshot.context.draft).toBe('rule');
    });

    it('ignores edit while creating', () => {
        const actor = createStartedActor();

        actor.send({ type: InlineEditingEvent.Create });
        actor.send({
            type: InlineEditingEvent.Edit,
            lineIndex: 2,
            storedValue: 'rule',
            storedIsComment: false,
            draft: 'rule',
        });

        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe(InlineEditingState.Creating);
        expect(snapshot.context).toEqual(EMPTY_CONTEXT);
    });
});
