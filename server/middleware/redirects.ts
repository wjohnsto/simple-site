import util from 'util';
import express from 'express';
import _ from 'lodash';
import { redirects } from '../config';

export default (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    let url = req.url;

    let queryIndex = url.indexOf('?'),
        query = queryIndex > -1 ? url.slice(queryIndex).trim() : '';

    let found = redirects.some((redirect) => {
        let pattern = redirect.pattern;
        let regex = new RegExp(pattern);
        let match = url.match(regex);

        if (_.isNil(match)) {
            return false;
        }

        match.shift();

        let to = util.format.apply(util, [redirect.to].concat(match));
        res.redirect(redirect.status, (to + query).trim());

        return true;
    });

    if (found) {
        return;
    }

    next();
};
