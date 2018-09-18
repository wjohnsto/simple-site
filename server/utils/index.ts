import fs from 'fs-extra';
import _ from 'lodash';
import moment from 'moment-timezone';

export function readTime(str: string = '') {
    const wordCount = str.trim().split(' ');
    const length = wordCount.length;
    const time = length / 200;

    return Math.floor(time);
}

export function isEmptyString(value: any) {
    return (
        _.isNull(value) ||
        _.isUndefined(value) ||
        (_.isString(value) && _.isEmpty(value))
    );
}

export function isExpired(date: string | Date | moment.Moment): boolean {
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
        return value;
    }

    return value;
}

export function pluralize(str: string): string {
    const last = str.slice(-2);

    if (last[1] === 'y') {
        return `${str.slice(0, -1)}ies`;
    } else if (/(?:.[s|z|x]|ch|sh)$/.test(last)) {
        return `${str}es`;
    }

    return `${str}s`;
}

export function readDir(dir: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!_.isString(dir)) {
            resolve([]);

            return;
        }

        fs.readdir(dir, (err, files) => {
            if (_.isObject(err)) {
                reject(err);

                return;
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
                reject(err);

                return;
            }

            resolve(buffer.toString());
        });
    });
}

export function fileExists(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.lstat(path, (err: NodeJS.ErrnoException, stats: fs.Stats) => {
            if (!_.isNil(err)) {
                reject(err);

                return;
            }

            if (stats.isFile()) {
                resolve();
            }
        });
    });
}

export function wait(ms: number = 0, value?: any): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(
            (v) => {
                resolve(v);
            },
            ms,
            value
        );
    });
}

export function mapAsync<T, TResult>(
    collection: _.List<T> | null | undefined,
    iterator: _.ListIterator<T, Promise<TResult>>
): Promise<TResult[]> {
    return Promise.all<TResult>(
        _(collection)
            .map(iterator)
            .value()
    );
}
