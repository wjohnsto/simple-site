import express from 'express';
import log from '../log';

export default (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    let { method } = req;

    const { url, body } = req;

    method = method.toUpperCase();

    log.error(`Fail -> ${method} ${url}`);
    if (method === 'POST' || method === 'PUT') {
        log.error(`body is -> ${JSON.stringify(body)}`);
    }

    if (err.stack) {
        log.error(err.stack);
    } else if (err.message) {
        log.error(err.message);
    } else {
        log.error(err);
    }

    next(err);
};
