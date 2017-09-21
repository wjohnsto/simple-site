import * as url from 'url';
import * as express from 'express';
import * as _ from 'lodash';
import config from '../config';

function normalizeUrl(url: string) {
    return url + (url.slice(-1) === '/' ? '' : '/')
}

export default function meta(req: express.Request, res: express.Response, next: express.NextFunction) {
    _.defaultsDeep(req.context, {
        head: {
            meta: {}
        },
        main: {
            url: normalizeUrl(req.url)
        }
    });

    let meta = req.context.head.meta;

    if (_.isArray(meta.images)) {
        meta.images.push({ url: '/public/img/meta/home.jpg' });
    } else {
        meta.images = [{ url: '/public/img/meta/home.jpg' }];
    }

    let host = req.hostname;
    let protocol = req.protocol;

    if (config.ENV.prod) {
        host = 'mysite.com';
        protocol = 'https';
    }

    let baseUrl = url.format({
        protocol,
        host,
        pathname: ''
    });

    let reqUrl = url.format({
        protocol,
        host,
        pathname: req.url,
    });

    baseUrl = normalizeUrl(baseUrl);
    reqUrl = normalizeUrl(reqUrl);

    if (!meta.breadcrumbs) {
        meta.breadcrumbs = _.map(req.url.split('/'), (partial, index, list) => {
            let name = _.startCase(_.toLower(partial.replace(/-/g, ' ')));

            if (index > 1) {
                partial = (<any>list).slice(0, index + 1).join('/');
            }

            let url = baseUrl + partial;

            if (index === 0) {
                name = 'Home';
            } else {
                url += '/';
            }

            return {
                url,
                index: index + 1,
                name
            };
        }).slice(0, -1);
    }

    _.each(meta.images, (image) => {
        if (!_.isEmpty(image.url) && image.url.indexOf('/') === 0) {
            image.url = url.format({
                protocol,
                host,
                pathname: image.url,
            });
        }
    });

    meta.baseUrl = baseUrl;
    meta.canonical = meta.canonical || reqUrl;
    meta.canonical = meta.canonical.replace(/\/amp\//g, '/');

    next();
}
