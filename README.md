# Website Boilerplate

Are you looking to build a website that is easily updatable/maintainable? Do you hate Wordpress and other bloated website platforms? Do you understand that simple websites do not require the use of a SPA framework? Do you still want to needlessly optimize your site to the nth degree, and get a 100 on [Google PageSpeed](https://developers.google.com/speed/pagespeed/insights/)? Well this is the project for you.

You can see a working demo of this project [here](https://simple-website-demo.herokuapp.com/).

## Getting Started

So you're ready to build an awesome new website. Good, this is the place to be. This project helps you setup a site using Bootstrap 4, TypeScript, SASS, Handlebars, NodeJS/Express, Markdown, and a few optimizations for serving webp, AMP, bundling js/css, inlining js/css, and helping with SEO/Structured Data.

### Layout

The site has the following directories

- `build`: Contains some build scripts for running the server
- `public`: Where all the public assets go. Note that the CSS and JS folders will be created automatically by the build process.
- `scss`: Where you put all your SASS files.
  - `includes`: Used for global styles, bootstrap overrides, etc
  - `layouts`: Used for main layout styles
  - `partials`: Used for partial layout styles
- `server`: Contains all the files necessary to run the server
  - `blogs`: Put all your blog markdown here
  - `config`: Stores global configuration for the server
  - `helpers`: Stores handlebars helpers
  - `log`: A simple logging utility class
  - `middleware`: Has files for CORS, errors, setting meta context, serving webp, handling redirects, and parsing/compiling Handlebars files
  - `routes`: Defines all the pages for the site
  - `typings`: Adds some types to the project
  - `utils`: Has utility methods and a caching class
- `ts`: Where you put all your TS files.
  - `layouts`: Used for TS scripts that can be included in many pages
  - `partials`: Used for TS scripts that need only be included in specific pages
- `views`: Where you put all your Handlebars files for your pages.
  - `layouts`: Used for Handlebars layout pages
  - `partials`: Used for Handlebars partials

### Features

Here are a few cool things this project is designed to do.

#### Webp

The express server can serve [webp](https://developers.google.com/speed/webp/) assets alongside pngs and jpgs. So in your html you might have `<img src="path/to/image.jpg">`, and if the server finds a file `path/to/image.webp` it will serve it instead.

#### AMP

This project comes with blog scaffolding for you, which includes an AMP template. If you run the project and go to any blog post, you can see the AMP version by visiting the blog `<url>/amp`.

#### Build Process

The build process includes a few custom scripts in the `build` directory. There is a `minify` script that will compile and minify TypeScript files and output to a public JS directory. There is also a `lib` build script that will build 3rd-party libraries for you and output to a `public/js/lib.js`. By default it builds bootstrap and its dependencies (jQuery, popper, etc). The last script is the `scss` script. This will compile your SASS files (in the `scss` directory) per-page. So you don't have to worry about including unnecessary css per page, and you also don't have issues with overriding styles.

#### Inlining Styles and Scripts

When this project was created, the intention was to perform all optimizations to make the site as fast as possible while allowing for ease of deployment. The express server is designed to allow you to declare styles and scripts that you with to inline with your HTML pages. If you put the following in a .hbs page:

```
<!-- Remove Script -->
<script src="/public/lib/lib.js"></script>
<!-- /Remove Script -->

<!-- Remove Style -->
<link rel="stylesheet" href="/public/css/about.css">
<!-- /Remove Style -->
```

There is a method that runs after the Handlebars page is rendered. It pulls out the scripts and styles, concatenates them, and then puts them in 1 style or script tag. After that it caches the pages to save some time with multiple requests. Of course there are times when you don't want to concatenate the styles/scripts. You can do so using an "ignore" attribute like so:

```
<link ignore="true" href="https://fonts.googleapis.com/css?family=Lato:100,300,400,700,900" rel="stylesheet">
```

#### Read Time

There is a simple reading time calculator for blog posts, which can help entice users to read a post knowing that it should only take 3-5 minutes.

#### SEO

This project has example structured data that you can replace with your own properties. There is structured data for an [Organization](https://developers.google.com/search/docs/guides/intro-structured-data), [Breadscrumbs](https://developers.google.com/search/docs/data-types/breadcrumbs), and [Articles](https://developers.google.com/search/docs/data-types/articles). It's also designed to allow you to specify title, description, image, and video meta information for every page when you add a new route.

#### Markdown Front Matter

You will notice in `server/blogs` there are blog markdown files. They include some front matter that has information about the blog. The server interprets this and sets the right context when rendering a page.

### Prerequisites

The only requirements to build this project are Node and npm.

### Installing

Setting up this project is incredibly simple:

```
npm install
```

```
npm run dev
```

Then navigate to http://localhost:3000/ and see a sample mini-site built out for you.

### Adding a Page

When you want to add a page, there are a couple things to do:

0. Create a new Handlebars file in `views`
0. Create a new route in `server/routes`
0. Add the route to the Express router in `server/routes/index.ts`

## Deployment

This site can be deployed on AWS, GCP, Azure, Heroku, etc. I didn't include any deployment instructions, so you will have to figure that part out on your own.

## Built With

* [Express](http://expressjs.com/) - Used to render pages and serve assets
* [Bootstrap 4](https://getbootstrap.com/) - Used for the easy layout, duh
* [Handlebars](http://handlebarsjs.com/) - Used to render pages and apply simple context
* [Remarkable](https://github.com/jonschlinkert/remarkable) - Used for markdown rendering on blog pages
* [TypeScript](https://www.typescriptlang.org/) - Used to allow you to write simple scripts in TypeScript that will be included with your pages
* [SASS](http://sass-lang.com/) - CSS precompiler

## Demo

You can see a working demo of this project [here](https://simple-website-demo.herokuapp.com/).

## Authors

* **William Johnston** - *Initial work* - [wjohnsto](https://github.com/wjohnsto)

## Contributors

* **Jesse Li** - [veggiedefender](https://github.com/veggiedefender)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
