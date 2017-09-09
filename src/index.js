import { createItem } from 'stash-it';

function validateStorage(storage) {
    if (typeof storage !== 'object' || storage === null || Array.isArray(storage)) {
        throw new Error('`storage` must be an object.');
    }

    if (typeof window.Storage === 'undefined') {
        throw new Error('Storage (localStorage or sessionStorage) is not supported.');
    }
}

function validateNamespace(namespace) {
    if (typeof namespace !== 'string') {
        throw new Error('`namespace` must be a string.');
    }

    if (false === /^[A-Za-z0-9_-]+$/i.test(namespace)) {
        throw Error('`namespace` can contain only letters, numbers, `_` or `-`.');
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

const ClientStorageAdapter = ({ storage, namespace }) => {
    validateStorage(storage);
    validateNamespace(namespace);

    return {
        buildKey(key) {
            return `${namespace}.${key}`;
        },

        setItem(key, value, extra = {}) {
            validateKey(key);

            const item = createItem(key, value, namespace, extra);
            const stringifiedItem = JSON.stringify(item);

            storage.setItem(key, stringifiedItem);

            return item;
        },

        getItem(key) {
            const stringifiedItem = storage.getItem(key);

            return stringifiedItem === null ? undefined : JSON.parse(stringifiedItem);
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
