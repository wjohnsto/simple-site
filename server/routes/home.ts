import express from 'express';
import parse from '../middleware/parse';

export function context(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    req.context = {
        head: {
            title: 'Home | My Site',
            meta: {
                description: 'This is a meta description.',
                images: [
                    {
                        url: '/static/img/home/hero.png',
                    },
                ],
            },
        },
        main: {},
    };

    next();
}

export function render(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    res.render('home', req.context, async (err: Error, html: string) => {
        try {
            html = await parse(req, req.url, html);
            res.send(html);
        } catch (e) {
            next(e);
        }
    });
}
