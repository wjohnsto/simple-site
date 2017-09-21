import * as express from 'express';
import { HTTP_CODES } from '../config';
const { HTTP_SUCCESS } = HTTP_CODES;

export default (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');

    // Set custom headers for CORS
    res.header('Access-Control-Allow-Headers',
        'Content-type,Accept,X-Access-Token,X-Key');

    if (req.method === 'OPTIONS') {
        res.status(HTTP_SUCCESS).end();
    } else {
        next();
    }
};
