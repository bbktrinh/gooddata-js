// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
import { ajax, get, post } from './xhr';

/**
 * @module user
 * @class user
 */

/**
 * Find out whether a user is logged in
 *
 * Returns a promise which either:
 * **resolves** - which means user is logged in or
 * **rejects** - meaning is not logged in
 * @method isLoggedIn
 */
export function isLoggedIn() {
    return get('/gdc/account/token').then(r => {
        if (r.ok) {
            return true;
        }

        return false;
    });
}


/**
 * This function provides an authentication entry point to the GD API. It is needed to authenticate
 * by calling this function prior any other API calls. After providing valid credentials
 * every subsequent API call in a current session will be authenticated.
 *
 * @method login
 * @param {String} username
 * @param {String} password
 */
export function login(username, password) {
    return post('/gdc/account/login', {
        body: JSON.stringify({
            postUserLogin: {
                login: username,
                password: password,
                remember: 1,
                captcha: '',
                verifyCaptcha: ''
            }
        })
    }).then(r => r.ok ? r.json() : r);
}

/**
 * Logs out current user
 * @method logout
 */
export function logout() {
    return isLoggedIn().then((loggedIn) => {
        if (loggedIn) {
            return get('/gdc/app/account/bootstrap').then(r => r.ok ? r.json() : r).then((result) => {
                const userUri = result.bootstrapResource.accountSetting.links.self;
                const userId = userUri.match(/([^\/]+)\/?$/)[1];

                return ajax('/gdc/account/login/' + userId, {
                    method: 'delete'
                });
            });
        }

        return Promise.resolve();
    });
}

/**
 * Updates user's profile settings
 * @method updateProfileSettings
 * @param {String} profileId - User profile identifier
 * @param {Object} profileSetting
*/
export function updateProfileSettings(profileId, profileSetting) {
    /*eslint-disable new-cap*/
    const d = $.Deferred();
    /*eslint-enable new-cap*/

    put('/gdc/account/profile/' + profileId + '/settings', {
        data: profileSetting
    }).then(d.resolve, d.reject);

    return d.promise();
}

/**
 * Returns info about currently logged in user from bootstrap resource
 * @method getAccountInfo
 */
export function getAccountInfo() {
    return get('/gdc/app/account/bootstrap')
        .then(r => r.json())
        .then(function resolveBootstrap(result) {
            const br = result.bootstrapResource;
            const accountInfo = {
                login: br.accountSetting.login,
                loginMD5: br.current.loginMD5,
                firstName: br.accountSetting.firstName,
                lastName: br.accountSetting.lastName,
                organizationName: br.settings.organizationName,
                profileUri: br.accountSetting.links.self
            };

            return accountInfo;
        });
}
