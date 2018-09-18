const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const uglifyJs = require('uglify-js');
const utils = require('../server/utils');
const exit = require('exit');

const cwd = process.cwd();
const files = [
    path.resolve(cwd, 'node_modules/jquery/dist/jquery.min.js'),
    path.resolve(cwd, 'node_modules/popper.js/dist/umd/popper.min.js'),
    path.resolve(cwd, 'node_modules/bootstrap/dist/js/bootstrap.min.js'),
];

utils
    .mapAsync(files, (file) => {
        return utils.readFile(file);
    })
    .then((contents) => {
        if (_.isEmpty(contents)) {
            return;
        }

        return uglifyJs.minify(contents, {
            warnings: false,
        }).code;
    })
    .then((code) => {
        if (_.isEmpty(code)) {
            code = '';
        }

        fs.ensureDirSync('public/lib');

        return new Promise((resolve, reject) => {
            fs.writeFile('public/lib/lib.js', code, (err) => {
                if (!!err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    })
    .then(
        () => {
            console.info('Finished compiling lib.');
            exit(0);
        },
        (err) => {
            console.error(err);
            exit(1);
        }
    );
