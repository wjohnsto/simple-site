import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as hbs from 'handlebars';
import * as utils from '../utils';

const Remarkable = require('remarkable');
const fm = require('front-matter');

function prepareSnippet(md: any) {
    _.forEach(md.renderer.rules, (rule: Function, key: string) => {
        if (key.indexOf('_') > -1 || key.indexOf('br') > -1 || key.indexOf('hr') > -1) {
            md.renderer.rules[key] = () => '';
            return;
        }

        md.renderer.rules[key] = rule;
    });
}

export function render(str: string, options: any) {
    const content = fm(str);
    const text = content.body;
    let out = '';

    const md = new Remarkable({
        html: true,               // Enable HTML tags in source
        breaks: false,            // Convert '\n' in paragraphs into <br>
        langPrefix: 'language-',  // CSS language prefix for fenced blocks
    });

    if (!!options.limit) {
        prepareSnippet(md);
    }

    out = md.render(text);

    if (!!options.amp) {
        out = out.replace(/<img([^>]*)>/g, '<amp-img$1 layout="flex-item"></amp-img>');
    }

    if (!!options.limit) {
        //trim the string to the maximum length
        out = out.substr(0, options.limit);

        //re-trim if we are in the middle of a word
        out = out.substr(0, Math.min(out.length, out.lastIndexOf(' ')));
        if (_.isString(options.ending)) {
            out += options.ending;
        } else if (options.ending !== false) {
            out += '...';
        }
    }

    return out;
}

export default function (context: any, options: any = { hash: {} }) {
    if (context.slice(-3) === '.md') {
        let buffer = fs.readFileSync(context);

        if (!buffer) {
            return '';
        }

        return new hbs.SafeString(render(buffer.toString(), options.hash));
    }

    return new hbs.SafeString(render(context, options.hash));
}
