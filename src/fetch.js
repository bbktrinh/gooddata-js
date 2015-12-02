import 'isomorphic-fetch'; // do not import fetch from 'isomorphic-fetch'!!

function authorize(domain) {
    let url = '/gdc/account/token',
        requestOptions = {};

    if (domain) {
        url = domain + url;
        requestOptions.credentials = 'include';
    }

    let request = new Request(url, requestOptions);

    return fetch(request).then(response => {
        if (isUnauthorized(response)) {
            return Promise.reject('Token refresh failed!');
        }
    });
}

function isUnauthorized(response) {
    return response.status === 401;
}

function createFetch(options) {
    let authPromise = null;

    return function fetchWrapper() {
        let realFetch = () => fetch(...arguments);

        // try and fetch data using window.fetch
        return realFetch().then(response => {
            if (isUnauthorized(response)) {
                // try to refresh token once for all waiting requests
                authPromise = authPromise || authorize(options.domain);

                // once refresh retry the request
                return authPromise
                        .then(realFetch)
                        .finally(() => { authPromise = null; };
            } else {
                return response;
            }
        });
    };
}
