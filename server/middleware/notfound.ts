import express from 'express';
import { HTTP_CODES } from '../config';
const { HTTP_NOT_FOUND } = HTTP_CODES;

export default (req: express.Request, res: express.Response) => {
    res.sendStatus(HTTP_NOT_FOUND);
};
