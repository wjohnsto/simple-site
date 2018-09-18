import express from 'express';
import _ from 'lodash';
import parse from '../middleware/parse';

export function render(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    const { head } = req.context;

    if (_.isNil(head) || _.isNil(head.meta) || !head.meta.amp) {
        next();
        return;
    }

    req.context.layout = false;

    res.render('amp', req.context, (err, html) => {
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
