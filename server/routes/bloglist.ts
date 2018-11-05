import express from 'express';
import _ from 'lodash';
import path from 'path';
import url from 'url';
import { config } from '../config';
import parse from '../middleware/parse';
import * as utils from '../utils';
import * as cache from '../utils/cache';

import fm from 'front-matter';
import sort from 'stable';

const blogPath = path.resolve(config.root, 'server/blogs');

async function findFiles(req: express.Request): Promise<IFileObject[]> {
    const files: IFileObject[] = cache.fetch('blog-files');
    const promise = Promise.resolve(files);

    if (!_.isNil(files)) {
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
        const blogFiles = await utils.readDir(blogPath);
        const newFiles = <IFileObject[]>(await utils.mapAsync(
            blogFiles,
            async (file) => {
                if (file.indexOf('.md') === -1) {
                    return;
                }

                const filePath = path.resolve(blogPath, file);

                const contents = await utils.readFile(filePath);
                const frontMatter = fm<any>(contents);
                const attributes = frontMatter.attributes;
                const body = frontMatter.body;
                const slug = file.replace('.md', '');

                attributes.body = body;
                attributes.url = `${baseUrl}/blog/${slug}/`;
                attributes.fullImage = `${baseUrl}${attributes.image}`;
                attributes.slug = slug;
                attributes.created = new Date(attributes.created);
                attributes.readTime = utils.readTime(body);

                return <IFileObject>{ file: filePath, attributes };
            }
        )).filter(_.isObject);

        const sortedFiles: IFileObject[] = sort(
            _(newFiles).value(),
            (a: IFileObject, b: IFileObject) => {
                return a.attributes.created <= b.attributes.created;
            }
        );

        const filteredFiles = _(sortedFiles)
            .filter((file) => {
                return file.attributes.published !== false;
            })
            .value();

        if (config.ENV.prod) {
            cache.store('blog-files', blogFiles);
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
            let page: number = !!req.params.page
                ? Number(req.params.page)
                : req.params.page;
            const main = req.context.main;
            const pageCount = 9;

            if (!_.isNumber(page) || page < 1) {
                page = 1;
            }

            main.currentPage = page;
            page -= 1;

            const blogs = files.slice(
                page * pageCount,
                page * pageCount + pageCount
            );

            main.pages = [];

            const l = Math.ceil(files.length / pageCount);

            for (let i = 0; i < l; i = i + 1) {
                let pageUrl = '/blog/';

                if (i !== 0) {
                    pageUrl += `page/${i + 1}/`;
                }

                main.pages.push({ pageUrl, currentPage: i === page });
            }

            if (files.length > page * pageCount + pageCount) {
                main.next = `/blog/page/${page + 2}/`;
            }

            if (page > 1) {
                main.prev = `/blog/page/${page}/`;
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
    res.render('blogs', req.context, async (err: Error, html: string) => {
        try {
            html = await parse(req, req.url, html);
            res.send(html);
        } catch (e) {
            next(e);
        }
    });
}

export interface IFileObject {
    file: string;
    attributes: any;
}
