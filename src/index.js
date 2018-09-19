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

            return stringifiedItem === null ? undefined : JSON.parse(stringifiedItem);
        },

        addExtra(key, extra) {
            const item = this.getItem(key);

            if (!item) {
                return Promise.resolve(undefined);
            }

            const currentExtra = item.extra;
            const combinedExtra = Object.assign({}, currentExtra, extra);

            return this.setItem(key, item.value, combinedExtra).then((newItem) => newItem.extra);
        },

        setExtra(key, extra) {
            const item = this.getItem(key);

            if (!item) {
                return Promise.resolve(undefined);
            }

            return this.setItem(key, item.value, extra).then((newItem) => newItem.extra);
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
