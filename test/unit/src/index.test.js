import { expect } from 'chai';
import sinon from 'sinon';
import { createItem } from 'stash-it';
import {
    FOO_EXTRA,
    FOO_KEY,
    FOO_VALUE,
    FOO_WITH_EXTRA_KEY,
    NONEXISTENT_KEY,
    nonObjectValues,
    testKey,
    testNamespace
} from 'stash-it-test-helpers';

import createClientStorageAdapter from '../../../src/index';

const sandbox = sinon.createSandbox();

describe('clientStorageAdapter', () => {
    const namespace = 'namespace';
    const getItemStub = sinon.stub();
    const fooItem = createItem(FOO_KEY, FOO_VALUE, namespace);
    const fooWithExtraItem = createItem(FOO_WITH_EXTRA_KEY, FOO_VALUE, namespace, FOO_EXTRA);
    const fooItemStringified = JSON.stringify(fooItem);
    const fooWithExtraItemStringified = JSON.stringify(fooWithExtraItem);

    getItemStub.withArgs(FOO_KEY).returns(fooItemStringified);
    getItemStub.withArgs(FOO_WITH_EXTRA_KEY).returns(fooWithExtraItemStringified);
    getItemStub.withArgs(NONEXISTENT_KEY).returns(null);

    const hasOwnPropertyStub = sinon.stub();

    hasOwnPropertyStub.withArgs(FOO_KEY).returns(true);
    hasOwnPropertyStub.withArgs(FOO_WITH_EXTRA_KEY).returns(true);
    hasOwnPropertyStub.withArgs(NONEXISTENT_KEY).returns(false);

    const storageDummy = {
        setItem: sinon.spy(),
        getItem: getItemStub,
        hasOwnProperty: hasOwnPropertyStub,
        removeItem: sinon.spy()
    };
    const defaultOptions = { storage: storageDummy, namespace };

    beforeEach(() => {
        storageDummy.setItem.reset();
        getItemStub.resetHistory();
        hasOwnPropertyStub.resetHistory();
        storageDummy.removeItem.reset();

        sandbox.spy(JSON, 'stringify');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('storage validation', () => {
        context('when Storage is not an object', () => {
            it('should throw', () => {
                nonObjectValues.forEach((storage) => {
                    expect(createClientStorageAdapter.bind(null, { storage, namespace }))
                        .to.throw('`storage` must be an object.');
                });
            });
        });

        context('when Storage interface is not present in window', () => {
            const storage = window.Storage;

            beforeEach(() => {
                window.Storage = undefined;
            });

            afterEach(() => {
                window.Storage = storage;
            });

            it('should throw', () => {
                expect(createClientStorageAdapter.bind(null, { storage: {}, namespace })).to.throw(
                    'Storage (localStorage or sessionStorage) is not supported.'
                );
            });
        });
    });

    describe('namespace validation', () => {
        testNamespace(createClientStorageAdapter, { storage: {} });
    });

    describe('buildKey', () => {
        it('should return key string composed of passed key and namespace', () => {
            const adapter = createClientStorageAdapter(defaultOptions);

            expect(adapter.buildKey('key')).to.eq('namespace.key');
        });
    });

    describe('setItem', () => {
        describe('key validation', () => {
            const adapter = createClientStorageAdapter(defaultOptions);

            testKey(adapter.setItem);
        });

        describe('extra validation', () => {
            context('when extra contains namespace property', () => {
                it('should throw', () => {
                    const adapter = createClientStorageAdapter(defaultOptions);

                    expect(adapter.setItem.bind(adapter, FOO_KEY, FOO_VALUE, { namespace })).to.throw(
                        '`extra` can\'t contain `namespace` property.'
                    );
                });
            });
        });

        it('should store and return item', () => {
            const adapter = createClientStorageAdapter(defaultOptions);
            const item = adapter.setItem(FOO_KEY, FOO_VALUE);

            expect(item).to.deep.eq(fooItem);
            expect(storageDummy.setItem)
                .to.have.been.calledWith(FOO_KEY, fooItemStringified)
                .to.have.been.calledOnce;
            expect(JSON.stringify)
                .to.have.been.calledWith(item)
                .to.have.been.calledOnce;
        });

        context('when extra is passed', () => {
            it('should store and return item with extra', () => {
                const adapter = createClientStorageAdapter(defaultOptions);
                const item = adapter.setItem(FOO_WITH_EXTRA_KEY, FOO_VALUE, FOO_EXTRA);

                expect(item).to.deep.eq(fooWithExtraItem);
                expect(storageDummy.setItem)
                    .to.have.been.calledWith(FOO_WITH_EXTRA_KEY, fooWithExtraItemStringified)
                    .to.have.been.calledOnce;
                expect(JSON.stringify)
                    .to.have.been.calledWith(item)
                    .to.have.been.calledOnce;
            });
        });
    });

    describe('getItem', () => {
        beforeEach(() => {
            sandbox.stub(JSON, 'parse').returns(fooItem);
        });

        afterEach(() => {
            sandbox.restore();
        });

        context('when item exists', () => {
            it('should return that item', () => {
                const adapter = createClientStorageAdapter(defaultOptions);
                const item = adapter.getItem(FOO_KEY);

                expect(item).to.deep.eq(fooItem);
                expect(storageDummy.getItem)
                    .to.have.been.calledWith(FOO_KEY)
                    .to.have.been.calledOnce;
                expect(JSON.parse)
                    .to.have.been.calledWith(fooItemStringified)
                    .to.have.been.calledOnce;
            });
        });

        context('when item does not exist', () => {
            it('should return undefined', () => {
                const adapter = createClientStorageAdapter(defaultOptions);
                const item = adapter.getItem(NONEXISTENT_KEY);

                expect(item).to.be.undefined;
                expect(storageDummy.getItem)
                    .to.have.been.calledWith(NONEXISTENT_KEY)
                    .to.have.been.calledOnce;
            });
        });
    });

    describe('getExtra', () => {
        beforeEach(() => {
            sandbox.stub(JSON, 'parse').returns(fooWithExtraItem);
        });

        afterEach(() => {
            sandbox.restore();
        });

        context('when item exists', () => {
            it('should return extra', () => {
                const adapter = createClientStorageAdapter(defaultOptions);
                const extra = adapter.getExtra(FOO_WITH_EXTRA_KEY);
                const expectedExtra = Object.assign({}, FOO_EXTRA, { namespace: defaultOptions.namespace });

                expect(extra).to.deep.equal(expectedExtra);
                expect(storageDummy.getItem)
                    .to.have.been.calledWith(FOO_WITH_EXTRA_KEY)
                    .to.have.been.calledOnce;
                expect(JSON.parse)
                    .to.have.been.calledWith(fooWithExtraItemStringified)
                    .to.have.been.calledOnce;
            });
        });

        context('when item does not exist', () => {
            it('should return undefined', () => {
                const adapter = createClientStorageAdapter(defaultOptions);
                const extra = adapter.getExtra(NONEXISTENT_KEY);

                expect(extra).to.be.undefined;
                expect(storageDummy.getItem)
                    .to.have.been.calledWith(NONEXISTENT_KEY)
                    .to.have.been.calledOnce;
            });
        });
    });

    describe('hasItem', () => {
        context('when item exists', () => {
            it('should return true', () => {
                const adapter = createClientStorageAdapter(defaultOptions);

                expect(adapter.hasItem(FOO_KEY)).to.be.true;
                expect(storageDummy.hasOwnProperty)
                    .to.have.been.calledWith(FOO_KEY)
                    .to.have.been.calledOnce;
            });
        });

        context('when item does not exist', () => {
            it('should return false', () => {
                const adapter = createClientStorageAdapter(defaultOptions);

                expect(adapter.hasItem(NONEXISTENT_KEY)).to.be.false;
                expect(storageDummy.hasOwnProperty)
                    .to.have.been.calledWith(NONEXISTENT_KEY)
                    .to.have.been.calledOnce;
            });
        });
    });

    describe('removeItem', () => {
        const customHasOwnPropertyStub = sinon.stub();

        beforeEach(() => {
            customHasOwnPropertyStub.reset();
        });

        context('when item exists', () => {
            it('should remove that item returning true', () => {
                customHasOwnPropertyStub.onCall(0).returns(true);
                customHasOwnPropertyStub.onCall(1).returns(false);

                const customStorageDummy = Object.assign(
                    {},
                    storageDummy,
                    { hasOwnProperty: customHasOwnPropertyStub }
                );
                const adapter = createClientStorageAdapter({ storage: customStorageDummy, namespace });
                const result = adapter.removeItem(FOO_KEY);

                expect(result).to.be.true;
                expect(customHasOwnPropertyStub)
                    .to.have.been.calledWith(FOO_KEY)
                    .to.have.been.calledTwice;
                expect(customStorageDummy.removeItem)
                    .to.have.been.calledWith(FOO_KEY)
                    .to.have.been.calledOnce;
            });
        });

        context('when item does not exist', () => {
            it('should not remove that item and return false', () => {
                customHasOwnPropertyStub.returns(false);

                const customStorageDummy = Object.assign(
                    {},
                    storageDummy,
                    { hasOwnProperty: customHasOwnPropertyStub }
                );
                const adapter = createClientStorageAdapter({ storage: customStorageDummy, namespace });
                const result = adapter.removeItem(NONEXISTENT_KEY);

                expect(result).to.be.false;
                expect(customHasOwnPropertyStub)
                    .to.have.been.calledWith(NONEXISTENT_KEY)
                    .to.have.been.calledOnce;
                expect(storageDummy.removeItem).to.not.have.beenCalled;
            });
        });
    });
});
