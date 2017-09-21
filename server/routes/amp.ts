import * as express from 'express';
import parse from '../middleware/parse';

export function render(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (!req.context.head.meta.amp) {
        next();
        return;
    }

    req.context.layout = false;

    res.render('amp', req.context, (err, html) => {
        parse(req, req.url, html).then((html) => {
            res.send(html);
        }, (err) => {
            next(err);
        });
    });
}
