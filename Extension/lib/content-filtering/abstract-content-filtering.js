const errorFunction = () => {
    throw new Error('Seems like webpack didn\'t inject proper content rules implementation');
};

export const contentFiltering = {
    apply: errorFunction,
};
