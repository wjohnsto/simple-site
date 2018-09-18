import _ from 'lodash';
import md from './markdown';

const helpers = require('handlebars-helpers')();

export default _.assign(helpers, {
    md,
});
