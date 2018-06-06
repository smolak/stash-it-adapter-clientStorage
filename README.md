![logo-stash-it-color-dark 2x](https://user-images.githubusercontent.com/1819138/30385483-99fd209c-98a7-11e7-85e2-595791d8d894.png)

# stash-it-adapter-clientstorage

[![build status](https://img.shields.io/travis/smolak/stash-it-adapter-clientStorage/master.svg?style=flat-square)](https://travis-ci.org/smolak/stash-it-adapter-clientStorage)
[![Coverage Status](https://coveralls.io/repos/github/smolak/stash-it-adapter-clientStorage/badge.svg?branch=master)](https://coveralls.io/github/smolak/stash-it-adapter-clientStorage)


Client storage for stash-it. You can use either **localStorage** or **sessionStorage**.

It's build in **ES6** for modern browsers. If you need to run it in older ones,
you will have to transpile it. See `.babelrc` file for more details.

## Installation

```sh
npm i stash-it-adapter-clientstorage --save
```

## Usage

**Mind that you have to run this in browser environment, where you have access to localStorage or sessionStorage.**

```javascript
import { createCache } from 'stash-it';
import createClientStorageAdapter from 'stash-it-adapter-clientstorage';

const adapter = createClientStorageAdapter({ namespace: 'some-namespace', storage: window.localStorage });
const cache = createCache(adapter);
```

And that's it. You are ready to go.

The only configuration you need to provide is:
 - `namespace` (as a property in passed object).
   `namespace` must be a string consisting only out of letters (azAZ), numbers, and -, _ characters in any combination.
   E.g. `some-namespace_123`.

   If validation fails, it will throw an error.

 - `storage` - a reference to localStorage or sessionStorage

For available methods, check [adapters section in stash-it](https://smolak.github.io/stash-it/adapters.html) (all adapters have the same API).

### Heads-up!

For adapters with the same namespace, and run in the same browser for the same domain,
any instance of cache will have access to all items stored in used storage, regardless of which cache instance was used:

```javascript
// file1.js - executed BEFORE
import { createCache } from 'stash-it';
import createClientStorageAdapter from 'stash-it-adapter-clientstorage';

const adapter = createClientStorageAdapter({ namespace: 'some-namespace', storage: window.localStorage });
const cache1 = createCache(adapter);

cache1.setItem('key', 'value');


// file2.js - executed AFTER
import { createCache } from 'stash-it';
import createClientStorageAdapter from 'stash-it-adapter-clientstorage';

const adapter = createClientStorageAdapter({ namespace: 'some-namespace', storage: window.localStorage });
const cache2 = createCache(adapter);

cache2.hasItem('key'); // true
```

And that goes for all of the methods.

#### How to prevent this?

Use different namespaces for each adapter:

```javascript
// file1.js - executed BEFORE
import { createCache } from 'stash-it';
import createClientStorageAdapter from 'stash-it-adapter-clientstorage';

const adapter = createClientStorageAdapter({ namespace: 'some-namespace', storage: window.localStorage });
const cache1 = createCache(adapter);

cache1.setItem('key', 'value');


// file2.js - executed AFTER
import { createCache } from 'stash-it';
import createClientStorageAdapter from 'stash-it-adapter-clientstorage';

const adapter = createClientStorageAdapter({ namespace: 'some-other-namespace', storage: window.localStorage });
const cache2 = createCache(adapter);

cache2.hasItem('key'); // false
```
