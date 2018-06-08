import { createItem } from 'stash-it';

function validateStorage(storage) {
    if (typeof storage !== 'object' || storage === null || Array.isArray(storage)) {
        throw new Error('`storage` must be an object.');
    }

    if (typeof window.Storage === 'undefined') {
        throw new Error('Storage (localStorage or sessionStorage) is not supported.');
    }
}

function validateKey(key) {
    if (typeof key !== 'string') {
        throw new Error('`key` must be a string.');
    }

    if (false === /^[A-Za-z0-9._-]+$/i.test(key)) {
        throw Error('`key` can contain only letters, numbers, `_`, `.` or `-`.');
    }
}

function validateExtra(extra) {
    if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) {
        throw new Error('`extra` must be an object.');
    }
}

const ClientStorageAdapter = ({ storage }) => {
    validateStorage(storage);

    return {
        buildKey(key) {
            return key;
        },

        setItem(key, value, extra = {}) {
            validateKey(key);

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
            validateExtra(extra);

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
            validateExtra(extra);

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
