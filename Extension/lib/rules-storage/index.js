// !IMPORTANT!
// './rules-storage.__ABSTRACT_BROWSER__' is replaced during webpack compilation
// with NormalModuleReplacementPlugin to proper browser implementation
// './rules-storage.chrome' or ./rules-storage.firefox

import rulesStorageImpl from './rules-storage.__ABSTRACT_BROWSERS__';

export { rulesStorageImpl };
