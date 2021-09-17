import { promises as fsp } from 'fs';
import path from 'path';
import { ElementCollapser } from '../../../../Extension/src/content-script/element-collapser';

describe('ElementCollapser', () => {
    beforeAll(async () => {
        const html = await fsp.readFile(path.resolve(__dirname, './element-collapser.html'), 'utf-8');
        document.documentElement.innerHTML = html.toString();
    });

    it('Test Element Collapser', () => {
        ElementCollapser.clear();
        const element = document.getElementById('test-div');
        let style = window.getComputedStyle(element);
        expect(style.display).toEqual('block');
        expect(ElementCollapser.isCollapsed(element)).toBeFalsy();

        ElementCollapser.collapseElement(element, element.getAttribute('src'));
        style = window.getComputedStyle(element);
        expect(style.display).toBe('none');
        expect(element.style.cssText).toBe('display: none !important;');
        expect(ElementCollapser.isCollapsed(element)).toBeTruthy();
        element.removeAttribute('style');
    });

    it('Test Collapse by src', () => {
        ElementCollapser.clear();

        const element = document.getElementById('test-image');

        let style = window.getComputedStyle(element);
        // TODO figure out how to run tests in the real chrome
        //  jsdom returns empty string, while real chrome returns inline
        // expect(style.display).toEqual('inline');
        expect(style.display).toEqual('');
        expect(ElementCollapser.isCollapsed(element)).toBeFalsy();

        ElementCollapser.collapseElement(element, element.src);
        style = window.getComputedStyle(element);
        expect(style.display).toEqual('none');
        expect(ElementCollapser.isCollapsed(element)).toBeTruthy();
    });
});
