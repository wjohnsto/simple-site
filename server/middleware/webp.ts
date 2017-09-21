import { resolve, join } from 'path';
import { stat } from 'fs';
import { Request, Response } from 'express';
import * as _ from 'lodash';

const vary = require('vary');

function valueInArray(value: string, array: Array<string>) {
    for (let i = 0, len = array.length; i < len; i++) {
        if (value === array[i]) {
            return true;
        }
    }
    return false;
}

export default function webp(dirname: string, extensions?: Array<string>) {
    let msieRegex = /msie/i,
        tridenRegex = /\strident\//i;

    if (_.isUndefined(extensions)) {
        extensions = ['jpg', 'png', 'jpeg'];
    } else if (!_.isArray(extensions)) {
        extensions = [<string><any>extensions];
    }

    return (req: Request, res: Response, next: Function) => {
        let method = req.method.toUpperCase();

        if (method !== 'GET' && method !== 'HEAD') {
            next(); return;
        }

        let pathname = req.path.replace('/static/', ''),
            extpos = pathname.lastIndexOf('.'),
            ext = pathname.slice(extpos + 1),
            ua = <string>req.headers['user-agent'],
            ie = msieRegex.test(ua) || tridenRegex.test(ua),
            accept: string = (<any>req.headers).accept,
            webp = !!accept && accept.indexOf('image/webp') > -1,
            canAccept = valueInArray(ext, extensions) && (ie || webp);

        if (!canAccept) {
            next(); return;
        }

        let newPathname = pathname.substr(0, extpos) + (ie ? '.jxr' : '.webp'),
            filePath = join(dirname, newPathname);

        stat(filePath, function (err, stats) {
            if (!err && stats.isFile()) {
                req.url = req.url.replace(pathname, newPathname);
                vary(res, 'Accept');

                if (ie) {
                    res.setHeader('Content-Type', 'image/vnd.ms-photo');
                }
            }

            next();
        });
    };
}
