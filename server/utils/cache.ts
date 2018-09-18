import cache from 'memory-cache';
import _ from 'lodash';

const put = cache.put.bind(cache);
let caches: Array<string> = [];

(<any>cache).put = (
    key: any,
    value: any,
    time?: number,
    timeoutCallback?: (key: any) => void
) => {
    if (!(_.isNil(time) || isFinite(time))) {
        // 7 days
        time = 604800000;
    }

    return put(key, _.cloneDeep(value), time, timeoutCallback);
};

export function fetch(id: number, resetTime?: number): any;
export function fetch(id: string, resetTime?: number): any;
export function fetch(id: any, resetTime?: number): any {
    let idIsString = _.isString(id),
        idIsNumber = isFinite(id) || (idIsString && isFinite(id));

    if (!(idIsString || idIsNumber)) {
        return;
    } else if (!(_.isNil(resetTime) || isFinite(resetTime))) {
        return _.cloneDeep(cache.get(id));
    }

    let cached = cache.get(id);
    cache.put(id, cached, resetTime);

    return cached;
}

export function store(key: string, value: any, time?: number): void {
    cache.put(key, value, time);
    caches.push(key);
}

export function storeById(values: Array<any>, prefix: string): void;
export function storeById(values: any, prefix: string): void;
export function storeById(values: any, prefix = ''): void {
    if (!_.isArray(values)) {
        values = [values];
    }

    for (let value of values) {
        storeItemById(value, prefix);
    }
}

export function storeItemById(value: any, prefix = ''): void {
    if (!_.isObject(value) || _.isNull(value.id)) {
        return;
    }

    cache.put(prefix + value.id, value);
}

export function clearCaches(prefix: string): void {
    let tempCaches = caches.filter((c) => {
        return c.indexOf(prefix) === 0;
    });

    caches = caches.filter((c) => {
        return c.indexOf(prefix) === -1;
    });

    tempCaches.forEach((c) => {
        cache.del(c);
    });
}
