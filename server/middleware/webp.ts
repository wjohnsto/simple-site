import { Request, Response } from 'express';
import { stat } from 'fs';
import _ from 'lodash';
import { join } from 'path';
import vary from 'vary';

function valueInArray(value: string, array: string[]) {
    for (const el of array) {
        if (value === el) {
            return true;
        }
    }

    return false;
}

function webp(dirname: string, extensions?: string[]) {
    const msieRegex = /msie/i;
    const tridenRegex = /\strident\//i;

    if (_.isUndefined(extensions)) {
        extensions = ['jpg', 'png', 'jpeg'];
    } else if (!_.isArray(extensions)) {
        extensions = [<string>(<any>extensions)];
    }

    return (req: Request, res: Response, next: Function) => {
        const method = req.method.toUpperCase();

        if (method !== 'GET' && method !== 'HEAD') {
            next();

            return;
        }

        const pathname = req.path.replace('/static/', '');
        const extpos = pathname.lastIndexOf('.');
        const ext = pathname.slice(extpos + 1);
        const ua = <string>req.headers['user-agent'];
        const ie = msieRegex.test(ua) || tridenRegex.test(ua);
        const accept: string = (<any>req.headers).accept;
        const acceptWebp =
            _.isString(accept) && accept.indexOf('image/webp') > -1;
        const canAccept =
            valueInArray(ext, <string[]>extensions) && (ie || acceptWebp);

        if (!canAccept) {
            next();

            return;
        }

        const newPathname =
            pathname.substr(0, extpos) + (ie ? '.jxr' : '.webp');
        const filePath = join(dirname, newPathname);

        stat(filePath, (err, stats) => {
            if (!_.isNil(err) && stats.isFile()) {
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

export = webp;
