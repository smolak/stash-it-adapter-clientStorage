import { createItem } from 'stash-it';

function validateStorage(storage) {
    if (typeof storage !== 'object' || storage === null || Array.isArray(storage)) {
        throw new Error('`storage` must be an object.');
    }

    /* eslint-disable no-undef */
    if (typeof window.Storage === 'undefined') {
        throw new Error('Storage (localStorage or sessionStorage) is not supported.');
    }
}

const ClientStorageAdapter = ({ storage }) => {
    validateStorage(storage);

    return {
        buildKey(key) {
            return Promise.resolve(key);
        },

        setItem(key, value, extra = {}) {
            const item = createItem(key, value, extra);
            const stringifiedItem = JSON.stringify(item);

            storage.setItem(key, stringifiedItem);

            return Promise.resolve(item);
        },

        getItem(key) {
            const stringifiedItem = storage.getItem(key);
            const result = stringifiedItem === null ? undefined : JSON.parse(stringifiedItem);

            return Promise.resolve(result);
        },

        addExtra(key, extra) {
            return this.getItem(key).then((item) => {
                if (!item) {
                    return undefined;
                }

                const currentExtra = item.extra;
                const combinedExtra = Object.assign({}, currentExtra, extra);

                return this.setItem(key, item.value, combinedExtra).then((newItem) => newItem.extra);
            });
        },

        setExtra(key, extra) {
            return this.getItem(key).then((item) => {
                if (!item) {
                    return undefined;
                }

                return this.setItem(key, item.value, extra).then((newItem) => newItem.extra);
            });
        },

        getExtra(key) {
            return this.getItem(key).then((item) => {
                return item ? item.extra : undefined;
            });
        },

        hasItem(key) {
            return storage.hasOwnProperty(key);
        },

        removeItem(key) {
            if (this.hasItem(key)) {
                storage.removeItem(key);

                return !this.hasItem(key);
            }

            return false;
        }
    };
};

export default ClientStorageAdapter;
