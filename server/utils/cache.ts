import _ from 'lodash';
import cache from 'memory-cache';

const put = cache.put.bind(cache);
let caches: string[] = [];

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

export function fetch(id: string | number, resetTime?: number): any {
    const idIsString = _.isString(id);
    const idIsNumber =
        (_.isNumber(id) && isFinite(id)) ||
        (idIsString && isFinite(Number(id)));

    if (!(idIsString || idIsNumber)) {
        return;
    } else if (!(_.isNil(resetTime) || isFinite(resetTime))) {
        return _.cloneDeep(cache.get(id));
    }

    const cached = cache.get(id);
    cache.put(id, cached, resetTime);

    return cached;
}

export function store(key: string, value: any, time?: number): void {
    cache.put(key, value, time);
    caches.push(key);
}

export function storeById(values: any | any[], prefix: string): void {
    if (!_.isArray(values)) {
        values = [values];
    }

    for (const value of values) {
        storeItemById(value, prefix);
    }
}

export function storeItemById(value: any, prefix = ''): void {
    if (!_(value)
            .has('id')) {
        return;
    }

    cache.put(`${prefix}${value.id}`, value);
}

export function clearCaches(prefix: string): void {
    const tempCaches = caches.filter((c) => {
        return c.indexOf(prefix) === 0;
    });

    caches = caches.filter((c) => {
        return c.indexOf(prefix) === -1;
    });

    tempCaches.forEach((c) => {
        cache.del(c);
    });
}
