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
        storageDummy.setItem.resetHistory();
        getItemStub.resetHistory();
        hasOwnPropertyStub.resetHistory();
        storageDummy.removeItem.resetHistory();

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

    describe('getNamespace', () => {
        it('should return namespace', () => {
            const adapter = createClientStorageAdapter(defaultOptions);

            expect(adapter.getNamespace()).to.equal('namespace');
        });
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

    describe('addExtra', () => {
        beforeEach(() => {
            sandbox.stub(JSON, 'parse')
                .withArgs(fooWithExtraItemStringified)
                .returns(fooWithExtraItem);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should add extra to existing one and return combined extra', () => {
            const addedExtra = { something: 'else' };
            const expectedCombinedExtra = { ...FOO_EXTRA, ...addedExtra };
            const adapter = createClientStorageAdapter(defaultOptions);
            const returnedExtra = adapter.addExtra(FOO_WITH_EXTRA_KEY, addedExtra);

            expect(returnedExtra).to.deep.equal(expectedCombinedExtra);
        });

        context('when extra is not an object', () => {
            it('should throw', () => {
                const adapter = createClientStorageAdapter(defaultOptions);

                nonObjectValues.forEach((nonObjectValue) => {
                    if (nonObjectValue !== undefined) {
                        expect(adapter.addExtra.bind(adapter, FOO_KEY, nonObjectValue)).to.throw(
                            '`extra` must be an object.'
                        );
                    }
                });
            });
        });

        context('when item does not exist', () => {
            it('should return undefined', () => {
                const adapter = createClientStorageAdapter(defaultOptions);
                const addedExtra = adapter.addExtra(NONEXISTENT_KEY, FOO_EXTRA);

                expect(addedExtra).to.be.undefined;
            });
        });

        context('when added extra contains properties of existing extra', () => {
            it('should return extra with existing properties overwritten with new ones', () => {
                const adapter = createClientStorageAdapter(defaultOptions);
                const extraToAdd = { foo: 'entirely different foo extra' };
                const returnedExtra = adapter.addExtra(FOO_WITH_EXTRA_KEY, extraToAdd);
                const expectedCombinedExtra = { ...FOO_EXTRA, ...extraToAdd };

                expect(returnedExtra).to.deep.equal(expectedCombinedExtra);
            });
        });
    });

    describe('setExtra', () => {
        beforeEach(() => {
            sandbox.stub(JSON, 'parse')
                .withArgs(fooWithExtraItemStringified)
                .returns(fooWithExtraItem);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should store and return extra', () => {
            const adapter = createClientStorageAdapter(defaultOptions);
            const currentExtra = adapter.getExtra(FOO_WITH_EXTRA_KEY);
            const newExtra = { something: 'else' };
            const returnedExtra = adapter.setExtra(FOO_WITH_EXTRA_KEY, newExtra);

            expect(currentExtra).to.deep.equal(FOO_EXTRA);
            expect(returnedExtra).to.deep.equal(newExtra);
        });

        context('when extra is not an object', () => {
            it('should throw', () => {
                const adapter = createClientStorageAdapter(defaultOptions);

                nonObjectValues.forEach((nonObjectValue) => {
                    if (nonObjectValue !== undefined) {
                        expect(adapter.setExtra.bind(adapter, FOO_KEY, nonObjectValue)).to.throw(
                            '`extra` must be an object.'
                        );
                    }
                });
            });
        });

        context('when item does not exist', () => {
            it('should return undefined', () => {
                const adapter = createClientStorageAdapter(defaultOptions);
                const extra = adapter.setExtra(NONEXISTENT_KEY, FOO_EXTRA);

                expect(extra).to.be.undefined;
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

                expect(extra).to.deep.equal(FOO_EXTRA);
                expect(storageDummy.getItem)
                    .to.have.been.calledWith(FOO_WITH_EXTRA_KEY)
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
                expect(storageDummy.removeItem).to.not.have.been.called;
            });
        });
    });
});
