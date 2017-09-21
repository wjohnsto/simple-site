import * as express from 'express';
import { HTTP_CODES } from '../config';
const { HTTP_SERVER_ERROR } = HTTP_CODES;

export default (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(HTTP_SERVER_ERROR);
    res.render('error', { error: err });
};