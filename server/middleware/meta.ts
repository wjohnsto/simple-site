import express from 'express';
import _ from 'lodash';
import url from 'url';
import { config } from '../config';

function normalizeUrl(u: string) {
    return `${u}${u.slice(-1) === '/' ? '' : '/'}`;
}

function meta(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    _.defaultsDeep(req.context, {
        head: {
            meta: {},
        },
        main: {
            url: normalizeUrl(req.url),
        },
    });

    let m = _.isNil(req.context.head) ? {} : req.context.head.meta;

    if (_.isNil(m)) {
        m = {};
    }

    if (_.isArray(m.images)) {
        m.images.push({ url: '/public/img/meta/home.jpg' });
    } else {
        m.images = [{ url: '/public/img/meta/home.jpg' }];
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
        pathname: '',
    });

    let reqUrl = url.format({
        protocol,
        host,
        pathname: req.url,
    });

    baseUrl = normalizeUrl(baseUrl);
    reqUrl = normalizeUrl(reqUrl);

    if (!_.isArray(m.breadcrumbs)) {
        m.breadcrumbs = _(req.url.split('/'))
            .map((partial, index, list) => {
                let name = _.startCase(_.toLower(partial.replace(/-/g, ' ')));

                if (index > 1) {
                    partial = (<any>list).slice(0, index + 1).join('/');
                }

                let u = baseUrl + partial;

                if (index === 0) {
                    name = 'Home';
                } else {
                    u += '/';
                }

                return {
                    url: u,
                    index: index + 1,
                    name,
                };
            })
            .value()
            .slice(0, -1);
    }

    _(m.images).each((image) => {
        if (!_.isEmpty(image.url) && image.url.indexOf('/') === 0) {
            image.url = url.format({
                protocol,
                host,
                pathname: image.url,
            });
        }
    });

    m.baseUrl = baseUrl;
    m.canonical = _.isString(m.canonical) ? m.canonical : reqUrl;
    m.canonical = m.canonical.replace(/\/amp\//g, '/');

    next();
}

export = meta;
