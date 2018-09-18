import express from 'express';
import parse from '../middleware/parse';

export function context(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    req.context = {
        head: {
            title: 'About Us | My Site',
            meta: {
                description: 'Learn about us.',
            },
        },
    };

    next();
}

export function render(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    res.render('about', req.context, async (err: Error, html: string) => {
        try {
            html = await parse(req, req.url, html);
            res.send(html);
        } catch (e) {
            next(e);
        }
    });
}
