const origin = navigator.userAgent;
let fakeUserAgent: string | undefined;

Object.defineProperty(navigator, 'userAgent', {
    get() {
        return fakeUserAgent === undefined ? origin : (fakeUserAgent || '');
    },
});

export const clear = (): void => {
    fakeUserAgent = undefined;
};

export const mockUserAgent = (agent: string): void => {
    fakeUserAgent = agent;
};
