// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
import * as xhr from '../src/xhr';
import fetchMock from 'fetch-mock';

describe.only('fetch', () => {
    afterEach(() => {
        fetchMock.restore();
    });

    describe('xhr.ajax request', () => {
        it('should handle successful request', () => {
            fetchMock.mock('/some/url', { status: 200, body: 'hello'});
            return xhr.ajax('/some/url').then(response => {
                expect(response.status).to.be(200);
                return response.text();
            }).then(body => {
                expect(body).to.be('hello');
            });
        });

        it('should stringify JSON data for GDC backend', () => {
            fetchMock.mock('/some/url', { status: 200 });
            const mockBody = { foo: 'bar' };
            xhr.ajax('/some/url', {
                body: mockBody // TODO for jQuery compat this should be "data"
            });
            expect(fetchMock.calls().matched[0][1].body).to.be('{"foo":"bar"}');
        });

        it('should handle unsuccessful request', () => {
            fetchMock.mock('/some/url', 404);
            return xhr.ajax('/some/url').then(r => {
                expect(r.status).to.be(404);
            });
        });

        it('should have accept header set on application/json', () => {
            fetchMock.mock('/some/url', 200);
            xhr.ajax('/some/url');
            expect(fetchMock.calls().matched[0][1].headers.get('accept')).to.be('application/json; charset=utf-8');
        });
    });

    describe('xhr.ajax unauthorized handling', () => {
        it('should renew token when TT expires', () => {
            expect(true).to.be.ok();
            fetchMock.mock('/some/url', (url, opts) => {
                // for the first time return 401 - simulate no token
                if (fetchMock.calls('/some/url').length === 1) {
                    return 401;
                }

                return 200;
            })
            .mock('/gdc/account/token', 200);
            return xhr.ajax('/some/url').then(r => {
                expect(r.status).to.be(200);
            });
        });

        it('should fail if token renewal fails', () => {
            fetchMock.mock('/some/url', 401)
                     .mock('/gdc/account/token', 401);
            return xhr.ajax('/some/url').then(null, r => {
                expect(r).to.eql(new Error('Unauthorized'));
            });
        });

        it('should correctly handle multiple requests with token request in progress', () => {
            const firstFailedMatcher = (url, opts) => {
                if (fetchMock.calls('/some/url/1').length === 1) {
                    return 401;
                }

                return 200;
            };

            fetchMock.mock('/some/url/1', firstFailedMatcher)
                     .mock('/some/url/2', firstFailedMatcher)
                     .mock('/gdc/account/token', 200);

            return Promise.all([xhr.ajax('/some/url/1'), xhr.ajax('/some/url/2')]).then(r => {
                expect(r[0].status).to.be(200);
                expect(r[1].status).to.be(200);
            });
        });
    });

    describe('xhr.ajax polling', () => {

    });
});

