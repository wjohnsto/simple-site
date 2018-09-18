const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const glob = require('glob');
const scss = require('node-sass');
const postCss = require('postcss');
const autoPrefixer = require('autoprefixer');
const CleanCss = require('clean-css');
const exit = require('exit');
const Promise = require('promise');
const utils = require('../server/utils');
const purify = require('purify-css');

let files = glob.sync('scss/*.scss', {
    cwd: process.cwd(),
});

let views = glob
    .sync('ts/layouts/**/*.ts', {
        cwd: process.cwd(),
    })
    .concat(
        glob.sync('ts/partials/**/*.ts', {
            cwd: process.cwd(),
        }),
        glob.sync('views/layouts/**/*.hbs', {
            cwd: process.cwd(),
        }),
        glob.sync('views/partials/**/*.hbs', {
            cwd: process.cwd(),
        })
    );

utils
    .mapAsync(files, (file) => {
        return utils
            .readFile(file)
            .then((contents) => {
                if (_.isEmpty(contents)) {
                    return;
                }

                return new Promise((resolve, reject) => {
                    scss.render(
                        {
                            data: contents,
                            includePaths: [
                                'scss',
                                'node_modules/bootstrap/scss/',
                            ],
                        },
                        (err, result) => {
                            if (!!err) {
                                reject(err);
                                return;
                            }

                            resolve(result);
                        }
                    );
                });
            })
            .then((output) => {
                if (_.isEmpty(output)) {
                    return;
                }

                let hbs = file
                    .replace('scss/', 'views/')
                    .replace('.scss', '.hbs');
                let ts = file.replace('scss/', 'ts/').replace('.scss', '.ts');
                let content = views.concat([hbs, ts]);

                if (file.indexOf('base.scss') > -1) {
                    content = views.concat(
                        glob.sync('views/*.hbs', {
                            cwd: process.cwd(),
                        }),
                        glob.sync('ts/*.ts', {
                            cwd: process.cwd(),
                        })
                    );
                }

                return new Promise((resolve, reject) => {
                    purify(
                        content,
                        output.css.toString(),
                        {
                            whitelist: [
                                '*active*',
                                '*disabled*',
                                '*collapsing*',
                                '*error*',
                                '*modal-open*',
                                '*show*',
                            ],
                        },
                        (result) => {
                            resolve(result);
                        }
                    );
                });
            })
            .then((css) => {
                if (_.isEmpty(css)) {
                    return;
                }

                return postCss([autoPrefixer]).process(css, {
                    from: undefined,
                });
            })
            .then(function(result) {
                if (_.isEmpty(result)) {
                    return;
                }

                result.warnings().forEach((warn) => {
                    console.warn(warn.toString());
                });

                return result.css;
            })
            .then((css) => {
                if (_.isEmpty(css)) {
                    return { styles: '' };
                }

                return new CleanCss({
                    level: { 1: { all: true, specialComments: 'none' } },
                    returnPromise: true,
                }).minify(css);
            })
            .then((output) => {
                file = file
                    .replace('scss/', 'public/css/')
                    .replace('.scss', '.css');
                fs.ensureDirSync(file.slice(0, file.lastIndexOf('/')));

                return new Promise((resolve, reject) => {
                    fs.writeFile(file, output.styles, (err) => {
                        if (!!err) {
                            reject(err);
                            return;
                        }

                        resolve();
                    });
                });
            });
    })
    .then(
        () => {
            console.info('Finished compiling scss.');
            exit(0);
        },
        (err) => {
            console.error(err);
            exit(1);
        }
    );
