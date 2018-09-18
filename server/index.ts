import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import handlebars from 'express-handlebars';
import _ from 'lodash';
import moment from 'moment-timezone';
import logger from 'morgan';
import path from 'path';
import url from 'url';
import log from './log';
import * as cache from './utils/cache';

import { config } from './config';
import helpers from './helpers';
import cors from './middleware/cors';
import logError from './middleware/logerror';
import notFound from './middleware/notfound';
import redirects from './middleware/redirects';
import serverError from './middleware/servererror';
import webp from './middleware/webp';
import routes from './routes';

const app = express();

const publicPath = path.join(config.root, 'public');

logger.token('date', () => moment().format('DD/MMM/YYYY:HH:mm:ss ZZ'));

app.disable('x-powered-by');
app.use(logger(':status :method :url \t :date[clf] \t :response-time[1]ms'));
app.use(bodyParser.json());

// Remove parsed hbs cache
app.use('/clear-cache', (req, res, next) => {
    cache.clearCaches('hbs-');
    res.sendStatus(200);
});

app.use(compression());

app.use(webp(publicPath));
app.use('/static', express.static(publicPath));

// Setup cache control for 1 day caching
app.use((req, res, next) => {
    const cacheControl = req.headers['cache-control'];

    if (_.isString(cacheControl) && cacheControl.indexOf('no-') > -1) {
        res.setHeader('Cache-Control', cacheControl);
    } else {
        res.setHeader(
            'Cache-Control',
            'public, max-age=86400, stale-while-revalidate=604800'
        );
    }

    next();
});

// Canonical redirect, use after serving static assets
app.use((req, res, next) => {
    if (req.path.slice(-1) !== '/' && req.path.length > 1) {
        res.redirect(
            301,
            url.format({
                pathname: `${req.path}/`,
                query: req.query,
            })
        );
    } else {
        next();
    }
});

// Setup hbs
app.engine(
    '.hbs',
    handlebars({
        defaultLayout: 'main',
        extname: '.hbs',
        helpers,
    })
);
app.set('view engine', '.hbs');

if (config.ENV.prod) {
    app.enable('view cache');
}

app.use('*', cors);
app.use('/', routes);
app.use(redirects);

// Remove cache control so we don't cache 4XX + routes
app.use((req, res, next) => {
    res.removeHeader('Cache-Control');
    next();
});

app.use(notFound);
app.use(logError);
app.use(serverError);

app.set('port', config.PORT);
app.listen(app.get('port'), () => {
    log.info(
        `WebService has started on http://${config.IP}:${
            config.PORT
        } running in ${config.ENV.value} mode`
    );

    if (!config.ENV.prod) {
        log.info(
            'PLEASE NOTE: your webservice is running not in a production mode!'
        );
    }
});
