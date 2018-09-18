import express from 'express';
import _ from 'lodash';
import util from 'util';
import { redirects } from '../config';

function handleRedirect(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    const url = req.url;

    const queryIndex = url.indexOf('?');
    const query = queryIndex > -1 ? url.slice(queryIndex).trim() : '';

    const found = redirects.some((redirect) => {
        const pattern = redirect.pattern;
        const regex = new RegExp(pattern);
        const match = url.match(regex);

        if (_.isNil(match)) {
            return false;
        }

        match.shift();

        const to = util.format.apply(util, [redirect.to].concat(match));
        res.redirect(redirect.status, `${to}${query}`.trim());

        return true;
    });

    if (found) {
        return;
    }

    next();
}

export = handleRedirect;
