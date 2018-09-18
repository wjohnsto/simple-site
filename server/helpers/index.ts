import getHelpers from 'handlebars-helpers';
import _ from 'lodash';
import { toMarkdown } from './markdown';

const helpers = _(getHelpers())
    .assign({
        md: toMarkdown,
    })
    .value();

export = helpers;
