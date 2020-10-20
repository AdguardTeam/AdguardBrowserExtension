const NODE_TYPES = {
    PLACEHOLDER: 'placeholder',
    TEXT: 'text',
    TAG: 'tag',
    VOID_TAG: 'void_tag',
};

const isTextNode = (node) => {
    return node?.type === NODE_TYPES.TEXT;
};

const isTagNode = (node) => {
    return node?.type === NODE_TYPES.TAG;
};

const isPlaceholderNode = (node) => {
    return node?.type === NODE_TYPES.PLACEHOLDER;
};

const isVoidTagNode = (node) => {
    return node?.type === NODE_TYPES.VOID_TAG;
};

const placeholderNode = (value) => {
    return { type: NODE_TYPES.PLACEHOLDER, value };
};

const textNode = (str) => {
    return { type: NODE_TYPES.TEXT, value: str };
};

const tagNode = (tagName, children) => {
    const value = tagName.trim();
    return { type: NODE_TYPES.TAG, value, children };
};

const voidTagNode = (tagName) => {
    const value = tagName.trim();
    return { type: NODE_TYPES.VOID_TAG, value };
};

const isNode = (checked) => {
    return !!checked?.type;
};

module.exports = {
    isPlaceholderNode,
    isVoidTagNode,
    isTextNode,
    isTagNode,
    placeholderNode,
    voidTagNode,
    textNode,
    tagNode,
    isNode,
};
