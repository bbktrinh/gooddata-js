// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
import * as xhr from '../src/xhr';
import fetchMock from 'fetch-mock';

describe('xhr', () => {
    describe.only('$.ajax request', () => {
        beforeEach(() => {
            fetchMock.mock('/some/url', 200);
        });

        it('should handle successful request', done => {
            expect(xhr.ajax('/some/url')).done(function(data, textStatus, xhrObj) {
                expect(data).to.be('hello');
                expect(xhrObj.status).to.be(200);
                done();
            });
        });
    });
});

