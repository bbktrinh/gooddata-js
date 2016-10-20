// Copyright (C) 2007-2013, GoodData(R) Corporation. All rights reserved.
/*eslint no-use-before-define: [2, "nofunc"]*/
import * as config from './config';
import {
    isPlainObject,
    isFunction,
    isArray,
    merge,
    result
} from 'lodash';
import 'isomorphic-fetch'

/**
 * Ajax wrapper around GDC authentication mechanisms, SST and TT token handling and polling.
 * Inteface is same as original jQuery.ajax.

 * If token is expired, current request is "paused", token is refreshed and request is retried and result.
 * is transparently returned to original call.

 * Additionally polling is handled. Only final result of polling returned.
 * @module xhr
 * @class xhr
 */

const DEFAULT_POLL_DELAY = 1000;

let tokenRequest;

function enrichSettingWithCustomDomain(url, settings, domain) {
    if (domain) {
        // protect url to be prepended with domain on retry
        if (url.indexOf(domain) === -1) {
            url = domain + url;
        }
        settings.mode = 'cors';
        settings.credentials = 'include';
    }

    return { url, settings };
}

function continueAfterTokenRequest(url, settings) {
    return tokenRequest.then(response => {
        if (!response.ok) {
            throw new Error('Unauthorized');
        }
        tokenRequest = null;

        return ajax(url, settings);
    }, reason => {

        tokenRequest = null;
        return reason;
    });
}

function handleUnauthorized(originalUrl, originalSettings) {
    if (!tokenRequest) {
        // Create only single token request for any number of waiting request.
        // If token request exist, just listen for it's end.
        const { url, settings } = enrichSettingWithCustomDomain('/gdc/account/token', createSettings({}), config.domain);

        tokenRequest = fetch(url, settings).then(response => {
            // tokenRequest = null;
            // TODO jquery compat - allow to attach unauthorized callback and call it if attached
            // if ((xhrObj.status === 401) && (isFunction(req.unauthorized))) {
            //     req.unauthorized(xhrObj, textStatus, err, deferred);
            //     return;
            // }
            // unauthorized handler is not defined or not http 401
            // unauthorized when retrieving token -> not logged
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }

            return response;
        });
    }
    return continueAfterTokenRequest(originalUrl, originalSettings);
}

function isLoginRequest(url) {
    return url.indexOf('/gdc/account/login') !== -1;
}

export function ajax(originalUrl, tempSettings = {}) {
    let firstSettings = createSettings(tempSettings);
    const { url, settings } = enrichSettingWithCustomDomain(originalUrl, firstSettings, config.domain);
    if (tokenRequest) {
        return continueAfterTokenRequest(url, settings);
    }

    return fetch(url, settings).then(response => {
        // If response.status id 401 and it was a login request there is no need
        // to cycle back for token - login does not need token and this meand you
        // are not authorized
        if (response.status === 401) {
            if (isLoginRequest(url)) {
                throw new Error('Unauthorized');
            }

            return handleUnauthorized(url, settings);
        }

        if (response.status === 202 && !settings.dontPollOnResult) {
            // if the response is 202 and Location header is not empty, let's poll on the new Location
            let finalUrl = url;
            let finalSettings = settings;
            if (response.headers.has('Location')) {
                finalUrl = response.headers.get('Location');
            }
            finalSettings.method = 'GET';
            delete finalSettings.data;
            delete finalSettings.body;
            return handlePolling(finalUrl, finalSettings);
        }
        return response;
    }); // TODO handle polling
}

function createSettings(settings) {
    const headers = new Headers({
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/json'
    });

    settings.pollDelay = (settings.pollDelay !== undefined) ? settings.pollDelay : DEFAULT_POLL_DELAY;

    // TODO merge with headers from config
    settings.headers = headers;

    // TODO jquery compat - add to warnings
    settings.body = (settings.data) ? settings.data : settings.body;
    settings.mode = 'same-origin';
    settings.credentials = 'same-origin';

    if (isPlainObject(settings.body)) {
        settings.body = JSON.stringify(settings.body);
    }

    return settings;
}

function handlePolling(url, settings) {
    return new Promise((resolve, reject) => {
        setTimeout(function poller() {
            ajax(url, settings).then(resolve, reject);
        }, settings.pollDelay); // TODO add settings.pollDelay
    })
}
function xhrMethod(method) {
    return function methodFn(url, settings) {
        const opts = merge({ method }, settings);

        return ajax(url, opts);
    };
}

/**
 * Wrapper for xhr.ajax method GET
 * @method get
 */
export const get = xhrMethod('GET');

/**
 * Wrapper for xhr.ajax method POST
 * @method post
 */
export const post = xhrMethod('POST');

/**
 * Wrapper for xhr.ajax method PUT
 * @method put
 */
export const put = xhrMethod('PUT');

