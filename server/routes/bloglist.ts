import * as Promise from 'promise';
import * as express from 'express';
import * as path from 'path';
import * as url from 'url';
import * as _ from 'lodash';
import config from '../config';
import * as cache from '../utils/cache';
import * as utils from '../utils';
import parse from '../middleware/parse';
import {render as md} from '../helpers/markdown';

const fm = require('front-matter');
const sort = require('stable');

let blogPath = path.resolve(config.root, 'server/blogs');

function findFiles(req: express.Request): Promise<Array<{ file: string; attributes: any; }>> {
    let files: Array<{ file: string; attributes: any; }> = cache.fetch('blog-files');
    let promise = Promise.resolve(files);

    if (!!files) {
        return promise;
    }

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

    return utils.readDir(blogPath).then((files) => {
        return utils.mapAsync(files, (file, index) => {
            if (file.indexOf('.md')  === -1) {
                return;
            }

            let filePath = path.resolve(blogPath, file);

            return utils.readFile(filePath).then((contents) => {
                const frontMatter = fm(contents);
                const attributes = frontMatter.attributes;
                const body = frontMatter.body;
                const slug = file.replace('.md', '');

                attributes.body = body;
                attributes.url = baseUrl + '/blog/' + slug + '/';
                attributes.fullImage = baseUrl + attributes.image;
                attributes.slug = slug;
                attributes.created = new Date(attributes.created);
                attributes.readTime = utils.readTime(body);

                return { file: filePath, attributes };
            });
        }).then((newFiles) => {
            return _.map(sort(_.filter(newFiles, _.isObject), (a, b) => {
                return a.attributes.created <= b.attributes.created;
            }));
        });
    }).then((files: Array<{ file: string; attributes: any; }>) => {
        files = _.filter(files, (file) => {
            return file.attributes.published !== false;
        });

        if (config.ENV.prod) {
            cache.store('blog-files', files);
        }

        return <any>files;
    }).catch((err) => {
        console.log(err);
        return [];
    });
}

export function context(req: express.Request, res: express.Response, next: express.NextFunction) {
    req.context = {
        head: {
            title: 'Blog, Stay Up To Date With Us | My Site',
            meta: {
                description: 'Hear about our company.',
                images: [
                    { url: '/public/img/meta/blog.jpg' }
                ]
            }
        },
        main: {
            blogs: []
        }
    };

    findFiles(req).then((files) => {
        let page = !!req.params.page ? Number(req.params.page) : req.params.page;
        let main = req.context.main;
        let pageCount = 9;

        if (!_.isNumber(page) || page < 1) {
            page = 1;
        }

        main.currentPage = page;
        page -= 1;

        let blogs = files.slice(page * pageCount, (page * pageCount) + pageCount);

        main.pages = [];

        for (let i = 0, l = Math.ceil(files.length / pageCount); i < l; ++i) {
            let url = '/blog/';

            if (i !== 0) {
                url += 'page/' + (i + 1) + '/';
            }

            main.pages.push({ url, currentPage: i === page });
        }

        if (files.length > (page * pageCount + pageCount)) {
            main.next = '/blog/page/' + (page + 2) + '/';
        }

        if (page > 1) {
            main.prev = '/blog/page/' + page + '/';
        } else if (page === 1) {
            main.prev = '/blog/';
        }

        main.blogs = blogs;
    }).catch(_.noop).then(() => {
        next();
    });
}

export function render(req: express.Request, res: express.Response, next: express.NextFunction) {
    req.context.layout = 'articles';
    res.render('blogs', req.context, (err, html) => {
        parse(req, req.url, html).then((html) => {
            res.send(html);
        }, (err) => {
            next(err);
        });
    });
}
