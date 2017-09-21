import * as express from 'express';
import * as htmlParser from 'htmlparser2';
import * as _ from 'lodash';
import * as Promise from 'promise';
import * as request from 'request';
import * as path from 'path';
import * as uglifyJs from 'uglify-js';
import * as htmlMinifier from 'html-minifier';
import * as utils from '../utils';
import config from '../config';
import * as cache from '../utils/cache';

const CleanCss = require('clean-css');

const MINIFY = false;
const enum TYPE { TEXT, FILE };
interface ITagInfo { type: TYPE; value?: string; };

function getTags(tags: Array<ITagInfo>): Promise<Array<string>> {
    return Promise.all(tags.map((tag) => {
        if (tag.type === TYPE.TEXT) {
            return tag.value;
        }

        if (tag.value.indexOf('/static/') === 0) {
            tag.value = path.resolve(config.root, 'public', tag.value.slice(8));

            return utils.readFile(tag.value).then((result) => {
                if (result === 'undefined') {
                    result = '';
                }

                return result;
            });
        } else if (tag.value.indexOf('static/') === 0) {
            tag.value = path.resolve(config.root, 'public', tag.value.slice(7));

            return utils.readFile(tag.value).then((result) => {
                if (result === 'undefined') {
                    result = '';
                }

                return result;
            });
        }

        return new Promise<string>((resolve, reject) => {
            request
                .get(tag.value, (err, response, body) => {
                    if (!!err) {
                        reject(err);
                        return;
                    }
                    if (!!body || body === 'undefined') {
                        resolve('');
                        return;
                    }

                    resolve(body);
                });
        });
    }));
}

function parseHtml(html: string) {
    let scriptActive = false,
        scriptTags: Array<ITagInfo> = [],
        styleActive = false,
        styleTags: Array<ITagInfo> = [];

    const parser = new htmlParser.Parser({
        onopentag: (name, attribs) => {
            scriptActive = name === 'script' && !attribs.ignore && (attribs.type === 'text/javascript' || !!attribs.src);

            if (scriptActive) {
                scriptTags.push({ type: !attribs.src ? TYPE.TEXT : TYPE.FILE });

                if (!!attribs.src) {
                    scriptTags[scriptTags.length - 1].value = attribs.src;
                }
            }

            styleActive = !attribs.ignore && (name === 'style' && attribs.type === 'text/css') || (name === 'link' && attribs.rel === 'stylesheet');

            if (styleActive) {
                styleTags.push({ type: !attribs.href ? TYPE.TEXT : TYPE.FILE });

                if (!!attribs.href) {
                    styleTags[styleTags.length - 1].value = attribs.href;
                }

                if (name === 'link') {
                    styleActive = false;
                }
            }
        },
        ontext: (text) => {
            if (scriptActive) {
                let s = scriptTags[scriptTags.length - 1];

                if (s.type === TYPE.TEXT) {
                    s.value = text.trim();
                }
            }

            if (styleActive) {
                let s = styleTags[styleTags.length - 1];

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

            styleActive = styleActive && (tagName === 'style' || tagName === 'link');
            if (styleActive) {
                styleActive = false;
            }
        }
    }, { decodeEntities: true });

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

    return Promise.all([
        getTags(scriptTags),
        getTags(styleTags)
    ]);
}

function minifyScripts(code: Array<string>) {
    if (code.length === 0) {
        return '';
    }

    if (!MINIFY) {
        return Promise.resolve(code.join(''));
    }

    return Promise.resolve(uglifyJs.minify(code, {
        warnings: false
    }).code);
}

function minifyStyles(code: Array<string>) {
    if (code.length === 0) {
        return '';
    }

    if (!MINIFY) {
        return Promise.resolve(code.join(''));
    }

    return new CleanCss({
        level: { 1: { all: true, specialComments: 'none' } },
        returnPromise: true
    }).minify(code.join('')).then((css) => {
        return css.styles;
    });
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
    html = html.replace(/<!-- Remove Script -->[\s\S]*?<!-- \/Remove Script -->/g, '');

    if (scripts.length > 0) {
        let rest = html.slice(html.lastIndexOf('</body>'));
        html = html.slice(0, html.lastIndexOf('</body>')) + '    <script type="text/javascript">' + scripts + '</script>\n' + rest;
    }

    html = html.replace(/<!-- Remove Style -->[\s\S]*?<!-- \/Remove Style -->/g, '');

    if (styles.length === 0) {
        return html;
    }

    return html.replace('</head>', '    <style type="text/css">' + styles + '</style>\n</head>');
}

export default function parse(req: express.Request, route: string, html: string = '') {
    html = html.replace(/public\//g, 'static/');

    if (route.indexOf('/amp/') > -1) {
        return Promise.resolve(html);
    }

    const cached = cache.fetch('hbs-' + route);

    if (!!cached) {
        return Promise.resolve(cached);
    }

    return parseHtml(html).then(([scripts, styles]) => {
        return Promise.all([
            minifyScripts(scripts),
            minifyStyles(styles)
        ]);
    }).then(([scripts, styles]) => {
        return appendScripts(html, scripts, styles);
    }).then((html) => {
        return minifyHtml(html);
    }).then((html) => {
        html = html.replace(/link\signore="true"/g, 'link').replace(/style\signore="true"/g, 'style').replace(/script\signore="true"/g, 'script');

        // Cache for 1 year
        if (config.ENV.prod) {
            cache.store('hbs-' + route, html);
        }

        return html;
    });
};
