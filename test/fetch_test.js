// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
import * as xhr from '../src/xhr';
import fetchMock from 'fetch-mock';

describe.only('fetch', () => {
    describe('xhr.ajax request', () => {
        it('should handle successful request', () => {
            fetchMock.mock('/some/url', { status: 200, body: 'hello'});
            return xhr.ajax('/some/url').then(response => {
                expect(response.status).to.be(200);
                return response.text();
            })
            .then(body => {
                expect(body).to.be('hello');
            });
        });
    });
});

