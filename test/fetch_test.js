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
            expect(fetchMock.calls()[0][1].body).to.be('{"foo":"bar"}');
        });

        it('should handle unsuccessful request', () => {
            fetchMock.mock('/some/url', 404);
            return xhr.ajax('/some/url').then(r => {
                expect(r.status).to.be(404);
            });
        });

        it('should support url in settings', () => { // TODO deprecate?
            fetchMock.mock('/some/url', 200);
            return xhr.ajax({url: '/some/url'}).then(r => {
                expect(r.status).to.be(200)
            });
        });

        it('should have accept header set on application/json', () => {
            fetchMock.mock('/some/url', 200);
            xhr.ajax('/some/url')
            expect(fetchMock.calls()[0][1].headers.get('accept')).to.be('application/json; charset=utf-8');
        });
    });
});

