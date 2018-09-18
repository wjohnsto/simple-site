import CleanCss from 'clean-css';
import express from 'express';
import htmlMinifier from 'html-minifier';
import htmlParser from 'htmlparser2';
import _ from 'lodash';
import path from 'path';
import request from 'request';
import uglifyJs from 'uglify-js';
import { config } from '../config';
import * as utils from '../utils';
import * as cache from '../utils/cache';

const MINIFY = false;
const enum TYPE {
    TEXT,
    FILE,
}
interface ITagInfo {
    type: TYPE;
    value?: string;
}

async function getTags(tags: ITagInfo[]): Promise<string[]> {
    return utils.mapAsync(tags, async (tag) => {
        if (tag.type === TYPE.TEXT) {
            return <string>tag.value;
        }

        if ((<string>tag.value).indexOf('/static/') === 0) {
            tag.value = path.resolve(
                config.root,
                'public',
                (<string>tag.value).slice(8)
            );

            let result = await utils.readFile(<string>tag.value);

            if (result === 'undefined') {
                result = '';
            }

            return result;
        } else if ((<string>tag.value).indexOf('static/') === 0) {
            tag.value = path.resolve(
                config.root,
                'public',
                (<string>tag.value).slice(7)
            );

            let result = await utils.readFile(<string>tag.value);
            if (result === 'undefined') {
                result = '';
            }

            return result;
        }

        return new Promise<string>((resolve, reject) => {
            request.get(<string>tag.value, (err, response, body) => {
                if (!!err) {
                    reject(err);

                    return;
                }
                if (!!body || body === 'undefined') {
                    resolve('');

                    return;
                }

                resolve(<string>body);
            });
        });
    });
}

function parseHtml(html: string) {
    const scriptTags: ITagInfo[] = [];
    const styleTags: ITagInfo[] = [];
    let scriptActive = false;
    let styleActive = false;

    const parser = new htmlParser.Parser(
        {
            onopentag: (name, attribs) => {
                scriptActive =
                    name === 'script' &&
                    !_.isString(attribs.ignore) &&
                    (attribs.type === 'text/javascript' ||
                        (_.isString(attribs.src) && !_.isEmpty(attribs.src)));

                if (scriptActive) {
                    scriptTags.push({
                        type:
                            !_.isString(attribs.src) || _.isEmpty(attribs.src)
                                ? TYPE.TEXT
                                : TYPE.FILE,
                    });

                    if (_.isString(attribs.src) && !_.isEmpty(attribs.src)) {
                        scriptTags[scriptTags.length - 1].value = attribs.src;
                    }
                }

                styleActive =
                    (!_.isString(attribs.ignore) &&
                        (name === 'style' && attribs.type === 'text/css')) ||
                    (name === 'link' && attribs.rel === 'stylesheet');

                if (styleActive) {
                    styleTags.push({
                        type:
                            !_.isString(attribs.href) || _.isEmpty(attribs.href)
                                ? TYPE.TEXT
                                : TYPE.FILE,
                    });

                    if (_.isString(attribs.href) && !_.isEmpty(attribs.href)) {
                        styleTags[styleTags.length - 1].value = attribs.href;
                    }

                    if (name === 'link') {
                        styleActive = false;
                    }
                }
            },
            ontext: (text) => {
                if (scriptActive) {
                    const s = scriptTags[scriptTags.length - 1];

                    if (s.type === TYPE.TEXT) {
                        s.value = text.trim();
                    }
                }

                if (styleActive) {
                    const s = styleTags[styleTags.length - 1];

                    if (s.type === TYPE.TEXT) {
                        s.value = text.trim();
                    }
                }
            },
            onclosetag: (tagName) => {
                scriptActive = scriptActive && tagName === 'script';
                if (scriptActive) {
                    scriptActive = false;
                }

                styleActive =
                    styleActive && (tagName === 'style' || tagName === 'link');
                if (styleActive) {
                    styleActive = false;
                }
            },
        },
        { decodeEntities: true }
    );

    parser.write(html);

    if (_.isFunction(parser.reset)) {
        parser.reset();
    }

    if (_.isFunction(parser.end)) {
        parser.end();
    }

    if (_.isFunction(parser.done)) {
        parser.done();
    }

    return Promise.all([getTags(scriptTags), getTags(styleTags)]);
}

function minifyScripts(code: string[]) {
    if (code.length === 0) {
        return '';
    }

    if (!MINIFY) {
        return Promise.resolve(code.join(''));
    }

    return Promise.resolve(
        uglifyJs.minify(code, {
            warnings: false,
        }).code
    );
}

async function minifyStyles(code: string[]) {
    if (code.length === 0) {
        return '';
    }

    if (!MINIFY) {
        return Promise.resolve(code.join(''));
    }

    const css = await (<Promise<any>>(<any>new CleanCss(<any>{
        level: { 1: { all: true, specialComments: 'none' } },
        returnPromise: true,
    }).minify(code.join(''))));

    return css.styles;
}

function minifyHtml(html: string) {
    if (html.length === 0) {
        return '';
    }

    if (!config.ENV.prod) {
        return html;
    }

    return htmlMinifier.minify(html, {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        conservativeCollapse: false,
        minifyURLs: true,
        removeComments: true,
        removeRedundantAttributes: true,
    });
}

function appendScripts(html: string, scripts: string, styles: string) {
    html = html.replace(
        /<!-- Remove Script -->[\s\S]*?<!-- \/Remove Script -->/g,
        ''
    );

    if (scripts.length > 0) {
        const rest = html.slice(html.lastIndexOf('</body>'));
        html = `${html.slice(
            0,
            html.lastIndexOf('</body>')
        )}    <script type="text/javascript">${scripts}</script>\n${rest}`;
    }

    html = html.replace(
        /<!-- Remove Style -->[\s\S]*?<!-- \/Remove Style -->/g,
        ''
    );

    if (styles.length === 0) {
        return html;
    }

    return html.replace(
        '</head>',
        `    <style type="text/css">${styles}</style>\n</head>`
    );
}

function parse(req: express.Request, route: string, html: string = '') {
    html = html.replace(/public\//g, 'static/');

    if (route.indexOf('/amp/') > -1) {
        return Promise.resolve(html);
    }

    const cached = cache.fetch(`hbs-${route}`);

    if (!!cached) {
        return Promise.resolve(cached);
    }

    return parseHtml(html)
        .then(([scripts, styles]) => {
            return Promise.all([minifyScripts(scripts), minifyStyles(styles)]);
        })
        .then(([scripts, styles]) => {
            return appendScripts(html, scripts, styles);
        })
        .then((h) => {
            return minifyHtml(h);
        })
        .then((h) => {
            h = h
                .replace(/link\signore="true"/g, 'link')
                .replace(/style\signore="true"/g, 'style')
                .replace(/script\signore="true"/g, 'script');

            // Cache for 1 year
            if (config.ENV.prod) {
                cache.store(`hbs-${route}`, h);
            }

            return h;
        });
}

export = parse;
