const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const glob = require('glob');
const uglifyJs = require('uglify-js');
const exit = require('exit');
const Promise = require('promise');
const utils = require('../server/utils');

let files = glob.sync('public/js/**/*.js', {
    cwd: process.cwd()
});

utils.mapAsync(files, (file) => {
    return utils.readFile(file).then((contents) => {
        if (_.isEmpty(contents)) {
            return;
        }

        return Promise.resolve(uglifyJs.minify(contents, {
            warnings: false
        }).code);
    }).then((output) => {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, output, (err) => {
                if (!!err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    });
}).then(() => {
    console.info('Finished minifying js.');
    exit(0);
}, (err) => {
    console.error(err);
    exit(1);
});
