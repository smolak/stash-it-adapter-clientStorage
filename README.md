# stash-it-adapter-clientStorage

Client storage for stash-it. You can use either **localStorage** or **sessionStorage**.

## Installation

```sh
npm i stash-it-adapter-clientStorage --save
```

## Usage

**Mind that you have to run this in browser environment, where you have access to localStorage or sessionStorage.**

```javascript
import { createCache } from 'stash-it';
import createClientStorageAdapter from 'stash-it-adapter-clientStorage';

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
import createClientStorageAdapter from 'stash-it-adapter-clientStorage';

const adapter = createClientStorageAdapter({ namespace: 'some-namespace', storage: window.localStorage });
const cache1 = createCache(adapter);

cache1.setItem('key', 'value');


// file2.js - executed AFTER
import { createCache } from 'stash-it';
import createClientStorageAdapter from 'stash-it-adapter-clientStorage';

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
import createClientStorageAdapter from 'stash-it-adapter-clientStorage';

const adapter = createClientStorageAdapter({ namespace: 'some-namespace', storage: window.localStorage });
const cache1 = createCache(adapter);

cache1.setItem('key', 'value');


// file2.js - executed AFTER
import { createCache } from 'stash-it';
import createClientStorageAdapter from 'stash-it-adapter-clientStorage';

const adapter = createClientStorageAdapter({ namespace: 'some-other-namespace', storage: window.localStorage });
const cache2 = createCache(adapter);

cache2.hasItem('key'); // false
```
