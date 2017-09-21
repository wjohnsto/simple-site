import * as fs from 'fs-extra';
import * as path from 'path';
import * as express from 'express';
import * as moment from 'moment-timezone';
import * as Promise from 'promise';
import * as _ from 'lodash';
import config from '../config';

export function readTime(str: string = '') {
    let wordCount = str.trim().split(' ');
    let length = wordCount.length;
    let time = length / 200;
    let minutes = Math.floor(time);
    let seconds = Math.floor((time % 1) * 60);

    return minutes;
}

export function isEmptyString(value: any) {
    return _.isNull(value) || _.isUndefined(value) || (_.isString(value) && _.isEmpty(value));
}

export function isExpired(date: string): boolean
export function isExpired(date: Date): boolean
export function isExpired(date: moment.Moment): boolean
export function isExpired(date: any): boolean {
    if (!_.isDate(date) && _.isEmpty(date)) {
        return true;
    }

    return moment.utc(date).isBefore();
}

export function toString(value: any): string {
    if (!_.isString(value)) {
        return value;
    }

    value = value.trim();

    if (_.isEmpty(value)) {
        return;
    }

    return value;
}

export function pluralize(str: string): string {
    let last = str.slice(-2);

    if (last[1] === 'y') {
        return str.slice(0, -1) + 'ies';
    } else if (/(?:.[s|z|x]|ch|sh)$/.test(last)) {
        return str + 'es';
    }

    return str + 's';
}

export function readDir(dir: string): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
        if (!_.isString(dir)) {
            resolve([]);
            return;
        }

        fs.readdir(dir, (err, files) => {
            if (_.isObject(err)) {
                return reject(err);
            }

            resolve(files);
        });
    });
}

export function readFile(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!_.isString(filename)) {
            resolve();
            return;
        }

        fs.readFile(filename, (err, buffer) => {
            if (_.isObject(err)) {
                return reject(err);
            }

            resolve(buffer.toString());
        });
    });
}

export function fileExists(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.lstat(path, (err: NodeJS.ErrnoException, stats: fs.Stats) => {
            if (err) {
                return reject(err);
            }

            if (stats.isFile) {
                resolve();
            }
        });
    });
}

export function wait(ms: number = 0, value?: any): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms, value);
    });
}

export function mapAsync<T, R>(collection: ArrayLike<T>, iterator: (value: T, key: any, obj: any) => Promise<R>): Promise<Array<R>> {
    return Promise.all<R>(<any>_.map(collection, iterator));
}
