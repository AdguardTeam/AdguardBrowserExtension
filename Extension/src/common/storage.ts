/**
 * Common storage interfaces
 */
export interface StorageInterface<K = string, V = unknown, Mode extends 'sync' | 'async' = 'sync'> {
    set(key: K, value: V): Mode extends 'async' ? Promise<void> : void

    get(key: K): Mode extends 'async' ? Promise<V> : V

    remove(key: K): Mode extends 'async' ? Promise<void> : void
}
