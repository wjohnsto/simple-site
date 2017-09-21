import * as express from 'express';
import * as path from 'path';
import * as url from 'url';
import * as _ from 'lodash';
import config from '../config';
import * as utils from '../utils';
import log from '../log';
import parse from '../middleware/parse';

const fm = require('front-matter');

export function context(req: express.Request, res: express.Response, next: express.NextFunction) {
    let context = req.context = {
        head: {
            meta: {
                amp: true
            }
        },
        main: {
            blog: {
                file: '',
                content: ''
            }
        }
    };

    let filePath = context.main.blog.file = path.resolve(config.root, 'server/blogs', req.params.title + '.md');

    utils.readFile(filePath).then((contents) => {
        let content = fm(contents);
        let attributes = content.attributes;
        let head: any = context.head;

        content.file = filePath;

        const slug = req.params.title;

        let host = req.hostname;
        let protocol = req.protocol;

        if (config.ENV.prod) {
            host = 'mysite.com';
            protocol = 'https';
        }

        const baseUrl = url.format({
            protocol,
            host
        });

        attributes.url = baseUrl + '/blog/' + slug + '/';
        attributes.fullImage = baseUrl + attributes.image;
        attributes.slug = slug;
        attributes.created = new Date(attributes.created);
        attributes.readTime = utils.readTime(content.body);

        head.title = attributes.title;
        head.meta.description = attributes.description;
        head.meta.images = [
            { url: attributes.image },
            { url: '/public/img/meta/blog.jpg' }
        ];
        context.main.blog = content;

        next();
    }).catch((err) => {
        log.error(err);
        next();
    });
}

export function render(req: express.Request, res: express.Response, next: express.NextFunction) {
    utils.fileExists(req.context.main.blog.file).then(() => {
        let layout: any = 'article';
        let page = 'blog';

        if (req.url.indexOf(req.params.title + '/amp/') > -1) {
            layout = false;
            page = 'amp';
        }

        req.context.layout = layout;
        res.render(page, req.context, (err, html) => {
            if (!!layout) {
                parse(req, req.url, html).then((html) => {
                    res.send(html);
                }, (err) => {
                    next(err);
                });
            } else {
                res.send(html);
            }
        });
    }).catch(() => {
        next();
    });
}
