# manage-htaccess
---

Enable or disable statement blocks / features within .htaccess based on some state from node.js

## Example of use case

Can be used when developing stuff on non-webapp-dedicated LAMP server whlist using Webpack build system / module bundler and [webpack-dev-server](https://webpack.github.io/docs/webpack-dev-server.html) for hot reloading.

* When building for deploy: files for js, css, images, fonts etc. are spewed out in filesystem (i.e., http://devserver.tld/path/to/app/assets/site.js)
* When building for development: webpack-dev-server hot reloading is used - js is served by node.js on some port, css is inlined within js, images are somewhere in between (i.e., http://devserver.tld:1234/site.js)

This means that paths change (HTML asking for js, CSS asking for images etc.). A really simple proxying (or in this case just url rewriting) does the job.

This hack comments or uncomments tagged blocks in `.htaccess` based on what environment (target) combinations webpack is run for.

### Usage

```
/**
 * Htaccess managing function
 * Reference:
 * @param  {Array} Array containing objects that describe tags, their state
 * @param  {String} Path to .htaccess file
 * @param  {String} Special string (.htaccess comment) that is used for enabling/disabling blocks
 * @return
 */

```


An example for `webpack.config.js`

```
'use strict';

// development by default
const production = process.env.NODE_ENV === 'production';
const staging = process.env.NODE_ENV === 'staging';

const webpackMyHtaccess = require('manage-htaccess');

webpackMyHtaccess(
  [
    {
      tag: 'DUMMY',
      enabled: staging,
    },
    {
      tag: 'MYAWESOMETAG',
      enabled: !production,
      attributes: {
        port: 1234
      }
    },
    {
      tag: 'MYOTHERTAG',
      enabled: staging,
    }
  ],
  path.join(__dirname, '.htaccess'), // optional
  '#%!' // optional
);

let config = {
  entry: {
    site: path.join(__dirname, 'src/site.js')
  },
  output: {
    path: path.join(__dirname, 'abc/def'),
    publicPath: 'http://devserver.tld/path/to/abc/def/',
    filename: "[name].js"
  }
};

config.module = {
	....
};

config.plugins = [
	...
];

module.exports = config;

```

Sample .htaccess config

```
<IfModule mod_rewrite.c>
    
    RewriteEngine On
    
#%!<MYAWESOMETAG>
    # Proxy assets in memory to webpack-dev-server when developing
    # Disable during production
    RewriteRule ^abc\/def/(.+) http://devserver.tld:1234/path/to/abc/def/$1 [P]
#%!</MYAWESOMETAG>

</IfModule>

#%!<MYOTHERTAG>
    # Whatever
#%!</MYOTHERTAG>

```

Example HTML/PHP file assumed to be at `abc`. In this configuration `public/site.js` will be found both on static deploy as well as hotreloading webpack-dev-server based on wether content of `MYAWESOMETAG` is disabled/enabled in `.htaccess`.

```
<!DOCTYPE HTML>
<html>
<head>
  <meta charset="utf-8">
  <title>APP</title>
  <link rel="stylesheet" type="text/css" href="public/site.css">
</head>
<body>
  <div class="app"></div>
  <script async src="public/site.js"></script>
</body>
</html>
```

##TODO

This is really hackish straight forward way for a very specific issue. Make it smarter? Don't parse existing .htaccess file, but make it as a part of building system?




