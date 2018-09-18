import express from 'express';
import path from 'path';
import url from 'url';
import _ from 'lodash';
import config from '../config';
import * as cache from '../utils/cache';
import * as utils from '../utils';
import parse from '../middleware/parse';

import fm from 'front-matter';
import sort from 'stable';

let blogPath = path.resolve(config.root, 'server/blogs');

async function findFiles(req: express.Request): Promise<Array<IFileObject>> {
    let files: Array<IFileObject> = cache.fetch('blog-files');
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
        host,
    });

    try {
        const files = await utils.readDir(blogPath);
        const newFiles = await utils.mapAsync(files, async (file) => {
            if (file.indexOf('.md') === -1) {
                return;
            }

            let filePath = path.resolve(blogPath, file);

            const contents = await utils.readFile(filePath);
            const frontMatter = fm<any>(contents);
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

        const sortedFiles: IFileObject[] = _.map(
            sort(
                _.filter(newFiles, _.isObject),
                (a: IFileObject, b: IFileObject) => {
                    return a.attributes.created <= b.attributes.created;
                }
            )
        );
        const filteredFiles = _.filter(sortedFiles, (file) => {
            return file.attributes.published !== false;
        });

        if (config.ENV.prod) {
            cache.store('blog-files', files);
        }

        return filteredFiles;
    } catch (err) {
        console.log(err);
        return [];
    }
}

export function context(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    req.context = {
        head: {
            title: 'Blog, Stay Up To Date With Us | My Site',
            meta: {
                description: 'Hear about our company.',
                images: [{ url: '/public/img/meta/blog.jpg' }],
            },
        },
        main: {
            blogs: [],
        },
    };

    findFiles(req)
        .then((files) => {
            let page = !!req.params.page
                ? Number(req.params.page)
                : req.params.page;
            let main = req.context.main;
            let pageCount = 9;

            if (!_.isNumber(page) || page < 1) {
                page = 1;
            }

            main.currentPage = page;
            page -= 1;

            let blogs = files.slice(
                page * pageCount,
                page * pageCount + pageCount
            );

            main.pages = [];

            for (
                let i = 0, l = Math.ceil(files.length / pageCount);
                i < l;
                ++i
            ) {
                let url = '/blog/';

                if (i !== 0) {
                    url += 'page/' + (i + 1) + '/';
                }

                main.pages.push({ url, currentPage: i === page });
            }

            if (files.length > page * pageCount + pageCount) {
                main.next = '/blog/page/' + (page + 2) + '/';
            }

            if (page > 1) {
                main.prev = '/blog/page/' + page + '/';
            } else if (page === 1) {
                main.prev = '/blog/';
            }

            main.blogs = blogs;
        })
        .catch(_.noop)
        .then(() => {
            next();
        });
}

export function render(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    req.context.layout = 'articles';
    res.render('blogs', req.context, (err, html) => {
        parse(req, req.url, html).then(
            (html) => {
                res.send(html);
            },
            (err) => {
                next(err);
            }
        );
    });
}

export interface IFileObject {
    file: string;
    attributes: any;
}
