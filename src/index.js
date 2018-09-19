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

            return item;
        },

        getItem(key) {
            const stringifiedItem = storage.getItem(key);

            return stringifiedItem === null ? undefined : JSON.parse(stringifiedItem);
        },

        addExtra(key, extra) {
            const item = this.getItem(key);

            if (!item) {
                return undefined;
            }

            const currentExtra = item.extra;
            const combinedExtra = Object.assign({}, currentExtra, extra);
            const newItem = this.setItem(key, item.value, combinedExtra);

            return newItem.extra;
        },

        setExtra(key, extra) {
            const item = this.getItem(key);

            if (!item) {
                return undefined;
            }

            const newItem = this.setItem(key, item.value, extra);

            return newItem.extra;
        },

        getExtra(key) {
            const item = this.getItem(key);

            return item ? item.extra : undefined;
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
