import express from 'express';
import fm from 'front-matter';
import _ from 'lodash';
import path from 'path';
import url from 'url';
import { config } from '../config';
import log from '../log';
import parse from '../middleware/parse';
import * as utils from '../utils';

export function context(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    const ctxt = (req.context = {
        head: {
            meta: {
                amp: true,
            },
        },
        main: {
            blog: {
                file: '',
                content: '',
            },
        },
    });

    const filePath = (ctxt.main.blog.file = path.resolve(
        config.root,
        'server/blogs',
        `${req.params.title}.md`
    ));

    utils
        .readFile(filePath)
        .then((contents) => {
            const content = fm<any>(contents);
            const attributes = content.attributes;
            const head: any = ctxt.head;

            (<any>content).file = filePath;

            const slug = req.params.title;

            let host = req.hostname;
            let protocol = req.protocol;

            if (config.ENV.prod) {
                host = 'mysite.com';
                protocol = 'https';
            }

            const baseUrl = url.format({
                protocol,
                host,
            });

            attributes.url = `${baseUrl}/blog/${slug}/`;
            attributes.fullImage = `${baseUrl}${attributes.image}`;
            attributes.slug = slug;
            attributes.created = new Date(attributes.created);
            attributes.readTime = utils.readTime(content.body);

            head.title = attributes.title;
            head.meta.description = attributes.description;
            head.meta.images = [
                { url: attributes.image },
                { url: '/public/img/meta/blog.jpg' },
            ];
            ctxt.main.blog = <any>content;

            next();
        })
        .catch((err) => {
            log.error(err);
            next();
        });
}

export function render(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    utils
        .fileExists(req.context.main.blog.file)
        .then(() => {
            let layout: any = 'article';
            let page = 'blog';

            if (req.url.indexOf(`${req.params.title}/amp/`) > -1) {
                layout = false;
                page = 'amp';
            }

            req.context.layout = layout;
            res.render(page, req.context, async (err: Error, html: string) => {
                if (!!layout) {
                    try {
                        html = await parse(req, req.url, html);
                        res.send(html);
                    } catch (e) {
                        next(e);
                    }
                } else {
                    res.send(html);
                }
            });
        })
        .catch(() => {
            next();
        });
}
