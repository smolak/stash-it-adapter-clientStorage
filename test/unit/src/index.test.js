import { expect } from 'chai';
import sinon from 'sinon';
import { createItem } from 'stash-it';
import {
    FOO_EXTRA,
    FOO_KEY,
    FOO_VALUE,
    FOO_WITH_EXTRA_KEY,
    NONEXISTENT_KEY,
    nonObjectValues
} from 'stash-it-test-helpers';

import createClientStorageAdapter from '../../../src/index';

const sandbox = sinon.createSandbox();

describe('clientStorageAdapter', () => {
    const getItemStub = sinon.stub();
    const fooItem = createItem(FOO_KEY, FOO_VALUE);
    const fooWithExtraItem = createItem(FOO_WITH_EXTRA_KEY, FOO_VALUE, FOO_EXTRA);
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
    const defaultOptions = { storage: storageDummy };

    beforeEach(() => {
        storageDummy.setItem.resetHistory();
        getItemStub.resetHistory();
        hasOwnPropertyStub.resetHistory();
        storageDummy.removeItem.resetHistory();
    });

    describe('storage validation', () => {
        context('when Storage is not an object', () => {
            it('should throw', () => {
                nonObjectValues.forEach((storage) => {
                    expect(createClientStorageAdapter.bind(null, { storage }))
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
                expect(createClientStorageAdapter.bind(null, { storage: {} })).to.throw(
                    'Storage (localStorage or sessionStorage) is not supported.'
                );
            });
        });
    });

    describe('buildKey', () => {
        it('should resolve with built key', () => {
            const adapter = createClientStorageAdapter(defaultOptions);

            expect(adapter.buildKey('key')).to.eventually.equal('key');
        });
    });

    describe('setItem', () => {
        beforeEach(() => {
            sandbox.spy(JSON, 'stringify');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should store an item', (done) => {
            const adapter = createClientStorageAdapter(defaultOptions);

            adapter.setItem(FOO_KEY, FOO_VALUE).then((item) => {
                expect(storageDummy.setItem)
                    .to.have.been.calledWith(FOO_KEY, fooItemStringified)
                    .to.have.been.calledOnce;
                expect(JSON.stringify)
                    .to.have.been.calledWith(item)
                    .to.have.been.calledOnce;

                done();
            });
        });

        it('should resolve with stored item', () => {
            const adapter = createClientStorageAdapter(defaultOptions);

            expect(adapter.setItem(FOO_KEY, FOO_VALUE)).to.eventually.deep.equal(fooItem);
        });

        context('when extra is passed', () => {
            it('should store an item with extra', (done) => {
                const adapter = createClientStorageAdapter(defaultOptions);

                adapter.setItem(FOO_WITH_EXTRA_KEY, FOO_VALUE, FOO_EXTRA).then((item) => {
                    expect(storageDummy.setItem)
                        .to.have.been.calledWith(FOO_WITH_EXTRA_KEY, fooWithExtraItemStringified)
                        .to.have.been.calledOnce;
                    expect(JSON.stringify)
                        .to.have.been.calledWith(item)
                        .to.have.been.calledOnce;

                    done();
                });
            });

            it('should resolve with stored item with extra', () => {
                const adapter = createClientStorageAdapter(defaultOptions);

                expect(adapter.setItem(FOO_WITH_EXTRA_KEY, FOO_VALUE, FOO_EXTRA))
                    .to.eventually.deep.equal(fooWithExtraItem);
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
            it('should resolve with that item', (done) => {
                const adapter = createClientStorageAdapter(defaultOptions);

                adapter.getItem(FOO_KEY).then((item) => {
                    expect(item).to.deep.eq(fooItem);
                    expect(storageDummy.getItem)
                        .to.have.been.calledWith(FOO_KEY)
                        .to.have.been.calledOnce;
                    expect(JSON.parse)
                        .to.have.been.calledWith(fooItemStringified)
                        .to.have.been.calledOnce;

                    done();
                });
            });
        });

        context('when item does not exist', () => {
            it('should resolve with undefined', (done) => {
                const adapter = createClientStorageAdapter(defaultOptions);

                adapter.getItem(NONEXISTENT_KEY).then((item) => {
                    expect(item).to.be.undefined;
                    expect(storageDummy.getItem)
                        .to.have.been.calledWith(NONEXISTENT_KEY)
                        .to.have.been.calledOnce;

                    done();
                });
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

        it('should add extra to existing one and resolve with combined extra', () => {
            const addedExtra = { something: 'else' };
            const expectedCombinedExtra = { ...FOO_EXTRA, ...addedExtra };
            const adapter = createClientStorageAdapter(defaultOptions);

            expect(adapter.addExtra(FOO_WITH_EXTRA_KEY, addedExtra)).to.eventually.deep.equal(expectedCombinedExtra);
        });

        context('when item does not exist', () => {
            it('should resolve with undefined', () => {
                const adapter = createClientStorageAdapter(defaultOptions);

                expect(adapter.addExtra(NONEXISTENT_KEY, FOO_EXTRA)).to.eventually.be.undefined;
            });
        });

        context('when added extra contains properties of existing extra', () => {
            it('should resolve with extra where existing properties are overwritten with new ones', () => {
                const adapter = createClientStorageAdapter(defaultOptions);
                const extraToAdd = { foo: 'entirely different foo extra' };
                const expectedCombinedExtra = { ...FOO_EXTRA, ...extraToAdd };

                expect(adapter.addExtra(FOO_WITH_EXTRA_KEY, extraToAdd))
                    .to.eventually.deep.equal(expectedCombinedExtra);
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

        it('should store extra', () => {
            const adapter = createClientStorageAdapter(defaultOptions);
            const newExtra = { something: 'else' };
            const stringifiedItemWithNewExtra = JSON.stringify(createItem(FOO_WITH_EXTRA_KEY, FOO_VALUE, newExtra));

            adapter.setExtra(FOO_WITH_EXTRA_KEY, newExtra).then(() => {
                expect(storageDummy.setItem).to.have.been.calledWith(FOO_WITH_EXTRA_KEY, stringifiedItemWithNewExtra);
            });
        });

        it('should resolve with extra', () => {
            const adapter = createClientStorageAdapter(defaultOptions);
            const newExtra = { something: 'else' };

            expect(adapter.setExtra(FOO_WITH_EXTRA_KEY, newExtra)).to.eventually.deep.equal(newExtra);
        });

        context('when item does not exist', () => {
            it('should resolve with undefined', () => {
                const adapter = createClientStorageAdapter(defaultOptions);

                expect(adapter.setExtra(NONEXISTENT_KEY, FOO_EXTRA)).to.eventually.be.undefined;
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
            it('should resolve with extra', (done) => {
                const adapter = createClientStorageAdapter(defaultOptions);

                adapter.getExtra(FOO_WITH_EXTRA_KEY).then((extra) => {
                    expect(extra).to.deep.equal(FOO_EXTRA);
                    expect(storageDummy.getItem)
                        .to.have.been.calledWith(FOO_WITH_EXTRA_KEY)
                        .to.have.been.calledOnce;

                    done();
                });
            });
        });

        context('when item does not exist', () => {
            it('should resolve with undefined', (done) => {
                const adapter = createClientStorageAdapter(defaultOptions);

                adapter.getExtra(NONEXISTENT_KEY).then((extra) => {
                    expect(extra).to.be.undefined;
                    expect(storageDummy.getItem)
                        .to.have.been.calledWith(NONEXISTENT_KEY)
                        .to.have.been.calledOnce;

                    done();
                });
            });
        });
    });

    describe('hasItem', () => {
        context('when item exists', () => {
            it('should resolve with true', (done) => {
                const adapter = createClientStorageAdapter(defaultOptions);

                adapter.hasItem(FOO_KEY).then((result) => {
                    expect(result).to.be.true;
                    expect(storageDummy.hasOwnProperty)
                        .to.have.been.calledWith(FOO_KEY)
                        .to.have.been.calledOnce;

                    done();
                });
            });
        });

        context('when item does not exist', () => {
            it('should resolve with false', (done) => {
                const adapter = createClientStorageAdapter(defaultOptions);

                adapter.hasItem(NONEXISTENT_KEY).then((result) => {
                    expect(result).to.be.false;
                    expect(storageDummy.hasOwnProperty)
                        .to.have.been.calledWith(NONEXISTENT_KEY)
                        .to.have.been.calledOnce;

                    done();
                });
            });
        });
    });

    describe('removeItem', () => {
        const customHasOwnPropertyStub = sinon.stub();

        beforeEach(() => {
            customHasOwnPropertyStub.reset();
        });

        context('when item exists', () => {
            it('should remove that item', (done) => {
                customHasOwnPropertyStub.onCall(0).returns(true);
                customHasOwnPropertyStub.onCall(1).returns(false);

                const customStorageDummy = Object.assign(
                    {},
                    storageDummy,
                    { hasOwnProperty: customHasOwnPropertyStub }
                );
                const adapter = createClientStorageAdapter({ storage: customStorageDummy });

                adapter.removeItem(FOO_KEY).then(() => {
                    expect(customHasOwnPropertyStub)
                        .to.have.been.calledWith(FOO_KEY)
                        .to.have.been.calledTwice;
                    expect(customStorageDummy.removeItem)
                        .to.have.been.calledWith(FOO_KEY)
                        .to.have.been.calledOnce;

                    done();
                });
            });

            it('should resolve with true', () => {
                customHasOwnPropertyStub.onCall(0).returns(true);
                customHasOwnPropertyStub.onCall(1).returns(false);

                const customStorageDummy = Object.assign(
                    {},
                    storageDummy,
                    { hasOwnProperty: customHasOwnPropertyStub }
                );
                const adapter = createClientStorageAdapter({ storage: customStorageDummy });

                expect(adapter.removeItem(FOO_KEY)).to.eventually.be.true;
            });
        });

        context('when item does not exist', () => {
            it('should not remove that item', (done) => {
                customHasOwnPropertyStub.returns(false);

                const customStorageDummy = Object.assign(
                    {},
                    storageDummy,
                    { hasOwnProperty: customHasOwnPropertyStub }
                );
                const adapter = createClientStorageAdapter({ storage: customStorageDummy });

                adapter.removeItem(NONEXISTENT_KEY).then(() => {
                    expect(customHasOwnPropertyStub)
                        .to.have.been.calledWith(NONEXISTENT_KEY)
                        .to.have.been.calledOnce;
                    expect(storageDummy.removeItem).to.not.have.been.called;

                    done();
                });
            });

            it('should resolve with false', () => {
                customHasOwnPropertyStub.returns(false);

                const customStorageDummy = Object.assign(
                    {},
                    storageDummy,
                    { hasOwnProperty: customHasOwnPropertyStub }
                );
                const adapter = createClientStorageAdapter({ storage: customStorageDummy });

                expect(adapter.removeItem(NONEXISTENT_KEY)).to.eventually.be.false;
            });
        });
    });
});
