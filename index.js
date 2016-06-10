/*!
 * manage-htaccess
 *
 * Copyright (c) 2016, kroko / Reinis Adovics.
 * Licensed under the MIT License.
 */

'use strict';

// custom functions for attributes

// attributes function always expects string to manipulate and whole attributes object to work with
// this is for port changing

// function attributesRemoveEmptyLines (string, attributes) {
//   // just pass through, illustrates the concept
//   return string;
// }

var attributesPortRewrite = function (string, attributes) {
  if (('port' in attributes)) {
    // seach for port in string that is assumed to look like this
    // RewriteRule ^abc\/def/(.+) http://dev.warp.lv:3334/path/to/abc/def/$1 [P]
    // we could do it better, right now just search for first :NUMBER nad replace it

    var newString = string.replace(/:\d+/g, ':' + attributes.port);
    return newString;
  }
  return string;
};

/**
 * Htaccess managing function
 * Reference:
 * @param  {Array} Array containing objects that describe tags, their state
 * @param  {String} Path to .htaccess file
 * @param  {String} Special string (.htaccess comment) that is used for enabling/disabling blocks
 * @return
 */

function manageHtaccess (conf, htaccessPath, specialChars) {
  htaccessPath = typeof htaccessPath !== 'undefined' ? htaccessPath : '.htaccess';
  specialChars = typeof specialChars !== 'undefined' ? specialChars : '#%!';

  if (conf.length < 1) {
    console.warn('manage-htaccess', '\x1b[36m', 'configuration is empty', '\x1b[0m');
  }

  var fs = require('fs');
  var file;
  try {
    file = fs.readFileSync(htaccessPath).toString();
  } catch (e) {
    console.error('manage-htaccess', '\x1b[36m', 'ERR!', '\x1b[0m', e);
    return;
  }

  file = file.split('\n');
  var specialCharsValid = (specialChars.indexOf('#') === 0) ? specialChars : '#' + specialChars;

  for (var cIdx = 0; cIdx < conf.length; ++cIdx) {
    if (!('tag' in conf[cIdx]) || !('enabled' in conf[cIdx])) {
      console.error('manage-htaccess', '\x1b[36m', 'ERR!', '\x1b[0m', 'configuration must have tag and enabled keys, skipping');
      continue;
    }

    var tag = conf[cIdx].tag;
    var enabled = conf[cIdx].enabled;

    var tagOpen = specialCharsValid + '<' + tag + '>';
    var tagClose = specialCharsValid + '</' + tag + '>';

    var attributes = {};
    if ('attributes' in conf[cIdx]) {
      attributes = conf[cIdx].attributes;
      console.log('manage-htaccess', '\x1b[36m', tag, 'has attributes', '\x1b[0m');
    }

    var pingPong = true;

    var lastOpenLineIdx = -1;
    for (var lIdx = 0; lIdx < file.length; ++lIdx) {
      // file[fIdx] = attributesRemoveEmptyLines(file[lIdx], attributes);
      if (pingPong) {
        if (file[lIdx].indexOf(tagOpen) >= 0) {
          lastOpenLineIdx = lIdx;
          pingPong = !pingPong;
        }
      } else {
        if (file[lIdx].indexOf(tagClose) >= 0) {
          for (var fIdx = lastOpenLineIdx + 1; fIdx < lIdx; ++fIdx) {
            if (enabled) {
              // remove first occurance of specialChars
              file[fIdx] = file[fIdx].replace(specialChars, '');
              file[fIdx] = attributesPortRewrite(file[fIdx], attributes);
            } else {
              if (file[fIdx].indexOf(specialChars) < 0) {
                // comment out only if specialChar is not already there
                file[fIdx] = specialChars + file[fIdx];
                file[fIdx] = attributesPortRewrite(file[fIdx], attributes);
              }
            }
          }
          pingPong = !pingPong;
          lastOpenLineIdx = -1;
        }
      }
    }
  }
  var output = file.join('\n');
  fs.writeFileSync(htaccessPath, output);
}

module.exports = manageHtaccess;
