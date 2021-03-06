var Metalsmith = require("metalsmith");
var collections = require("metalsmith-collections");
var layouts = require("metalsmith-layouts");
var markdown = require("metalsmith-markdown");
var permalinks = require("metalsmith-permalinks");
var sass = require("metalsmith-sass");
var fingerprint = require("metalsmith-fingerprint-ignore");
var filenameMetadata = require("metalsmith-metadata-in-filename");
var moment = require("moment");
var paginate = require("metalsmith-pager");
var inplace = require("metalsmith-in-place");
var debug = require("metalsmith-debug");
var serve = require("metalsmith-serve");
var production = process.env.NODE_ENV === "production";

// Helpers
// --------------------------------------------

var Handlebars = require("handlebars");
Handlebars.registerHelper("formatDate", function(date, format) {
  var mmnt = moment(date);
  return mmnt.format(format);
});

Handlebars.registerHelper("removeFilename", function(str) {
  return str.substring(0, str.lastIndexOf("/"));
});

Handlebars.registerHelper("debug", function(obj) {
  console.log("---> NEW DEBUG");
  console.log(obj);
});

// Defaults
// --------------------------------------------

var build = Metalsmith(__dirname);

if (!production) {
  build = build.use(
    serve({
      port: 1234
    })
  );
}

build = build
  .use(debug())
  .metadata({
    sitename: "Rune Madsen - Designer, Artist, Educator",
    siteurl: "https://runemadsen.com/",
    description:
      "Rune Madsen is a designer, artist and educator who uses programming languages to create things with the computer.",
    keyword:
      "algorithmic, graphic, design, systems, generative, Processing, creative, code, programming, P5.js"
  })
  .source("./src")
  .destination("./build")
  .clean(true)
  .use(
    collections({
      blog: {
        pattern: "blog/*.md",
        sortBy: "date",
        reverse: true
      },
      work: {
        pattern: "work/*.md",
        sortBy: "date",
        reverse: true
      },
      talks: {
        pattern: ["talks/*.md", "talks/*.html"],
        sortBy: "date",
        reverse: true
      },
      syllabi: {
        pattern: ["syllabi/*.md"],
        sortBy: "date",
        reverse: true
      }
    })
  )
  .use(
    paginate({
      collection: "blog",
      elementsPerPage: 5,
      pagePattern: "blog/page:PAGE/index.html.hbs",
      index: "blog/index.html.hbs",
      paginationTemplatePath: "../layouts/partials/blogPagination.html",
      layoutName: "default.html"
    })
  )
  .use(
    filenameMetadata({
      match: "**/*.{md,html}"
    })
  )
  .use(markdown())
  .use(
    sass({
      outputStyle: production ? "compressed" : "expanded"
    })
  )
  .use(
    permalinks({
      relative: false,
      pattern: ":slug",
      linksets: [
        {
          match: { collection: "blog" },
          pattern: "blog/:slug"
        },
        {
          match: { collection: "work" },
          pattern: "work/:slug"
        },
        {
          match: { collection: "talks" },
          pattern: "talks/:slug"
        },
        {
          match: { collection: "syllabi" },
          pattern: "syllabi/:slug"
        }
      ]
    })
  )
  // Run handlebars on any individual pages,
  // especially the pagination pages named .html.hbs
  .use(
    inplace({
      engineOptions: {
        partials: "./layouts/partials",
        cache: false
      }
    })
  )
  .use(fingerprint({ pattern: "css/app.css" }))
  .use(
    layouts({
      engine: "handlebars",
      partials: "layouts/partials",
      partialExtension: ".html"
    })
  );

if (production) {
  var htmlMinifier = require("metalsmith-html-minifier");

  build = build.use(
    htmlMinifier({
      removeAttributeQuotes: false,
      removeRedundantAttributes: false
    })
  );
} else {
  var watch = require("metalsmith-watch");
  build = build.use(
    watch({
      paths: {
        "src/**/*": true,
        "layouts/**/*": true,
        "src/css/*.scss": "**/*"
      },
      livereload: false
    })
  );
}

build.build(function(err) {
  if (err) throw err;
});
