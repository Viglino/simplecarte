/*
*	Copyright (c) 2016 Jean-Marc VIGLINO (https://github.com/Viglino),
*	released under the CeCILL-B license (French BSD license)
*	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*
*/
/* global jQuery */
/*eslint no-useless-escape: "off" */
/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/

/** Simple markdown to html convertor
 * @param {String} md the markdown text
 * @param {} data a list of key value to replace in the markdown %key%
 * @return {HTMl} HTML code
 */
var md2html = function (md, data) {
  var i;
  data = data || {};
  // Encoder les URI
  for (i in data) {
    if (/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/.test(data[i])
      && !/%/.test(data[i])){
      data[i] = encodeURI(data[i]).replace(/\'/g,"%27");
    }
  }

  // Secure md string
  md = "\n" + md2html.doSecure(md) +"\n";

  // Images Base64 (save)
  var data64 = [];
  md = md2html.saveImage64(md, data64);

  // Handle icons
  md = md2html.doIcons(md);

  // Handle blocks
  md = md2html.doBlocks(md);

  // Table management
  md = md2html.doTable(md);
  // Data management
  md = md2html.doData(md, data);
  md = md2html.saveImage64(md, data64);
  // RegEpx rules
  for (i=0; i<md2html.rules.length; i++) {
    md = md.replace(md2html.rules[i][0], md2html.rules[i][1]);
  }
  // Clean up
  md = md2html.cleanUp(md);
//	console.log(md)

  // Images Base64 (injection)
  md = md2html.restoreImage64(md, data64);
  // Floating images
  md = md2html.floatingImages(md);
  return md;
};

/** Transform md to simple text
 * /
var md2text = function (md, data) {
    return md2html.doData(md, data);

    //return $("<div>").html(md2html(md, data)).text();
}
/**/

/**
 * Server to load image (default use the current url)
 */
md2html.server = ''; //'http://localhost.ign.fr/macarte/app_dev.php/';
if (window.symfony) md2html.server = symfony.url;

/** 
 * floating images
 */
md2html.floatingImages = function (md) {
  md = md.replace (/<div class='right'><img([^\<]*)<\/div>/g,"<img class='floatRight' $1");
  md = md.replace (/<div class='left'><img([^\<]*)<\/div>/g,"<img class='floatLeft' $1");
  md = md.replace (/<a ([^\<]*)<br \/><img/g,"<a $1<img");
  return md;
};

/**
 * Create collapsible blocks
 */
md2html.doBlocks = function (md) {
  md = md.replace(/\n\[----\]/g, '\n</div></div>');
  var nb = 0;
  var md2;
  var rex = /\n\[--(.*)--\]/;
  while (true) {
    md2 = md.replace(rex, 
      '\n</div></div>'
      +'<input class="mdBlock" id="_mdBlock_'+nb+'" type="checkbox"/>'
      +'<div class="mdBlock">'
      +'<label for="_mdBlock_'+nb+'" class="mdBlockTitle">\n'
      +'$1'
      +'\n</label>'
      +'<div class="mdBlockContent">'
    );
    if (md2===md) break;
    else md = md2;
    nb++;
  }
  rex = /\n\[\+\+(.*)\+\+\]/;
  while (true) {
    md2 = md.replace(rex, 
      '\n</div></div>'
      +'<input class="mdBlock" id="_mdBlock_'+nb+'" checked="checked" type="checkbox"/>'
      +'<div class="mdBlock">'
      +'<label for="_mdBlock_'+nb+'" class="mdBlockTitle">\n'
      +'$1'
      +'\n</label>'
      +'<div class="mdBlockContent">'
    );
    if (md2===md) break;
    else md = md2;
    nb++;
  }

  return md;
};

/** Save base64 image to avoid large file processing
 * @param {string} md the markdown
 * @param {Array<string>} d64 an array of base64
 */
md2html.saveImage64 = function(md, d64) {
  var rex = /\!\(data:image\/[^;]*;base64,([^\)]*)\)/g;
  d64.push (md.match(rex));
  return md.replace(rex, '<base64-'+d64.length+'/>');
};

/** Restore base64 image after processing
 * @param {string} md the markdown
 * @param {Array<string>} d64 an array of base64
 */
md2html.restoreImage64 = function(md, d64) {
  for (var k=0; k<d64.length; k++) {
    var rex = new RegExp ('<base64-'+(k+1)+'/>');
    var img64 = d64[k];
    if (img64 && img64.length) {
      for (var i=0; i<img64.length; i++) {
        md = md.replace(rex, '<img src="'+img64[i].replace(/^\!\(/, "").replace(/\)$/, "")+'" />')
      }
    }
  }
  return md;
};

/** Add new rule
*	@param {RegExp} rex RegExp to use in replacement
*	@param {string} rep replacement string
*	@return {string} result md
*/
md2html.addRule = function(rex, rep) {
  md2html.rules.push(rex, rep);
}

/** Secure md string: remove code
*	@param {string} md the markdown
*	@return {string} result md
*/
md2html.doSecure = function(md) {
  return md.replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\'/g,"&apos;")
    .replace(/\"/g,"&quot;");
}

/**
 * 
 */
md2html.doIcons = function(md) {
  md = md.replace(/:([a-z]*)-([_,a-z,0-9,-]*):(([a-z,0-9,-]*)?( ([a-z,0-9,-]+))?:)?(([#,0-9,a-z,A-Z]*):)?/g, '<i class="fa $1-$2 fa-$4 fa-$6" style="color:$8 !important"></i>');
  return md;
}

/** A list of key value to replace as %key% > value in md
*	@param {string} md the markdown
*	@param {Objevt} data list of key/value
*	@return {string} result md
*/
md2html.doData = function(md, data) {
  // Save ends of exp
  md = md.replace(/\)\)/g,"‡");
  md = md.replace(/\|\|/g,"‾");
  for (var i in data) if (data[i]) {
    // Conditional display
    md = md.replace(new RegExp("\\(\\(\\?\%"+i+"%([^‡]*)‡",'g'), "$1");
//		md = md.replace(new RegExp("\\(\\(?\%"+i+"%",'g'), "((?%%");
    md = md.replace(new RegExp("%"+i+"%",'g'), data[i]);
  }
  // Conditional display: ((!%att% exp )) => exp / si att est vide
  md = md.replace (/\(\(!\%([^\%](.*))\%([^‡]*)(‡)/g, "$3");
  md = md.replace (/\(\(!([^‡]*)(‡)/g, "");
  // Conditional display: ((?%att% exp )) => exp / si att est rempli
//	md = md.replace (/\(\(\?\%\%([^\)\)]*)(\)\))/g, "$1");
  md = md.replace (/\(\(\?([^‡]*)(‡)/g, "");
  // Conditional display: (( exp %att% exp )) => exp att exp
  md = md.replace (/(\(\()([^\%|‡]*)\%([^\%](.*))\%([^‡|‾]*)(‾)?([^‡|‾]*)(‡)/g, "$7");
  md = md.replace (/\(\(([^‡|‾]*)(‾)?(.*)‡/g, "$1");
  md = md.replace (/%%/g, "%");
  // restore
  md = md.replace(/‡/g,"))");
  md = md.replace(/‾/g,"||");
  return md;
}

/** Table handler
*	@param {string} md the markdown
*	@return {string} result md
*/
md2html.doTable = function(md) {
  // Detect ---- | ----
  md = md.replace(/\n\ ?-{3,}\ ?\|/g, '<table></table>|');
  while (/<\/table>\|\ ?-{3,}/.test(md)) {
    md = md.replace(/<\/table>\|\ ?-{3,}\ ?/g, '</table>');
  }
  // Header
  md = md.replace(/(.*)<table>/g, '<table><tr><td>$1</td></tr>');
  while (/<td>(.*)\|/.test(md)) {
    md = md.replace(/<td>(.*)\|/g, '<td>$1</td><td>');
  }
  // Lines
  while (/<\/table>\n([^\n]*)\|/.test(md)) {
    md = md.replace(/<\/table>\n(.*)/g, '<tr><td>$1</td></tr></table>');
    while (/<td>(.*)\|/.test(md)) {
      md = md.replace(/<td>(.*)\|/g, '<td>$1</td><td>');
    }
  }
  md = md.replace(/<\/table>\n/g,"</table>");
  md = md.replace(/<td>\t/g,"<td class='center'>");
  return md;
}

/** Clean endl
*	@param {string} md the markdown
*	@return {string} result md
*/
md2html.cleanUp = function(md) {	
  md = md.replace(/(\<\/h[1-5]\>)\n/g, "$1");
  md = md.replace(/^\n/, '');
  if (md==='\n') md = '';

  // Remove timeline tweet
  md = md.replace(/data-tweet-limit\=\"\"/g,'data-tweet-limit="1"');
  md = md.replace (/<div class='right'><a class="twitter-/g,"<div class='floatRight'><a class=\"twitter-")
  md = md.replace (/<div class='left'><a class="twitter-/g,"<div class='floatLeft'><a class=\"twitter-")
  md = md.replace (/<div class='right'><blockquote /g,"<div class='floatRight' style=\"min-width:200px\"><blockquote ")
  md = md.replace (/<div class='left'><blockquote /g,"<div class='floatLeft' style=\"min-width:200px\"><blockquote ")
  if (/class\="twitter-/.test(md)) {
    md = md + '<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>'
  }
  // Facebook
  md = md.replace (/URL_PAGE_CARTE/g, encodeURIComponent(window.location.href));
  
  // Clollapsible blocks
  md = md.replace(/mdBlockTitle\">\n/g,'mdBlockTitle">');
  md = md.replace(/mdBlockContent\">\n/g,'mdBlockContent">');
  md = md.replace(/\n<\/label>/g,'</label>');
  md = md.replace(/\n<\/div><\/div>/g,'</div><\/div>');
  md = md.replace(/<\/div>\n/g,'</div>');

//	md = md.replace(/<\/ul>\n{1,2}/g, '</ul>');
//	md = md.replace(/\<\/ol\>\n{1,2}/g, '</ol>');

  md = md.replace(/<\/p>\n/g, '</p>');

  md = md.replace(/(\<\/h[0-9]>)\n/g, '$1');
  md = md.replace(/(\<hr \/>)\n/g, '$1');
  md = md.replace(/\n/g, '<br />');
  md = md.replace(/\t/g, ' ');

  // Image server
  md = md.replace(/src="image\/voir\//g, 'src="'+md2html.server+'image/voir/');
  return md;
}

/** Array of RegExp rules for conversion
*/
md2html.rules = [
  // Headers
  [/#?(.*)\n={5}(.*)/g, "<h1>$1</h1>"],				// h1
// [/#?(.*)\n\-{5}(.*)/g, "<h2>$1</h2>"],				// h2

  [/\n#{6}(.*)/g, "\<h6>$1</h6>"],					// h5
  [/\n#{5}(.*)/g, "\n<h5>$1</h5>"],					// h5
  [/\n#{4}(.*)/g, "\n<h4>$1</h4>"],					// h4
  [/\n#{3}(.*)/g, "\n<h3>$1</h3>"],					// h3
  [/\n#{2}(.*)/g, "\n<h2>$1</h2>"],					// h2
  [/\n#{1}(.*)/g, "\n<h1>$1</h1>"],					// h1

  [/<h([1-6])>\t/g, "<h$1 class='center'>"],			// Center header with tab

  // Blocks
  [/\n\&gt\;(.*)/g, '<blockquote>$1</blockquote>'],	// blockquotes
  [/\<\/blockquote\>\<blockquote\>/g, '\n'],			// fix
  [/\n-{5,}/g, "\n<hr />"],							// hr

  // Lists
  [/\n\* (.*)/g, '\n<ul><li>$1</li></ul>'],			// ul lists
  [/\n {1,}\*\ ([^\n]*)/g, '<ul2><li>$1</li></ul2>'],	// ul ul lists
  [/\n\t\*\ ([^\n]*)/g, '<ul2><li>$1</li></ul2>'],	// ul ul lists
  [/<\/ul2><ul2>/g, ''],								// concat
  [/<\/ul><ul2>([^\n]*)<\/ul2>\n/g, '<ul>$1</ul></ul>'],// indent
  [/\n\<ul\>/g, '<ul>'],								// fix
  [/<\/ul><ul>/g, ''],								// concat

  // Ordered list
  [/\n[0-9]+\.(.*)/g, '<ol><li>$1</li></ol>'],		// ol lists
  [/\<\/ol\>\<ol\>/g, ''],							// fix

  // Automatic links
  [/([^\(])(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))( ?)/g, '$1<a href=\'$2\' target="_blank">$2</a>'],
  // Mailto
  [/([^\(])\bmailto\b\:(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)/gi, '$1<a href=\'mailto:$2\'>$2</a>'],


  /* Twitter */

  // Twitter Share
  [ /\!(\[([^\[|\]]+)?\])?\(https:\/\/twitter.com\/share ?(\d+)?x?(\d+)?\)/g,
    '<a href="https://twitter.com/share" data-text="$2" data-hashtags="macarte" data-related="IGNFrance" class="twitter-share-button" data-show-count="true" target="_blank">Tweet</a>'],

  // User timeline
  [ /\!(\[([^\[|\]]+)?\])?\(https:\/\/twitter.com\/([^\/)]*)\/timeline ?(\d+)?x?(\d+)?\)/g,
    '<a class="twitter-timeline" href="https://twitter.com/$3" data-tweet-limit="$4" data-width="$5"><a href="https://twitter.com/$3?cards=false"></a></blockquote>'],
  // Twitter timeline
  [ /\!(\[([^\[|\]]+)?\])?\(https:\/\/twitter.com\/([^\/)]*)\/timelines\/([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<a class="twitter-timeline" href="https://twitter.com/$3/timelines/$4" data-tweet-limit="$5" data-width="$6"><a href="https://twitter.com/$3?cards=false"></a></blockquote>'],
  // Twitter grid
  [ /\!(\[([^\[|\]]+)?\])?\(https:\/\/twitter.com\/([^\/)]*)\/timegrid\/([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<a class="twitter-grid" href="https://twitter.com/$3/timelines/$4" data-limit="$5"  data-width="$6"><a href="https://twitter.com/$3?cards=false"></a></blockquote>'],
  // Tweet
  [ /\!(\[([^\[|\]]+)?\])?\(https:\/\/twitter.com\/([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<blockquote class="twitter-tweet" data-cards="$4hidden" data-dnt="true" data-width="$5" width="$5"><a href="https://twitter.com/$3?cards=false"></a></blockquote>'],

  // FaceBook like
  [ /\!(\[([^\[|\]]+)?\])?\(https:\/\/www.facebook.com\/like ?(\d+)?x?(\d+)?\)/g,
    '<iframe src="https://www.facebook.com/plugins/like.php?href=URL_PAGE_CARTE&width=136&layout=button_count&action=like&size=small&show_faces=false&share=true&height=20&appId" width="136" height="20" class="facebook-share-button" scrolling="no" frameborder="0" allowTransparency="true" allow="encrypted-media"></iframe>'],

  // Page FaceBook
  [ /\!(\[([^\[|\]]+)?\])?\(https:\/\/www.facebook.com\/([^\/)]*)\/posts\/([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2F$3%2Fposts%2F$4&width=$5&height=$6" width="$5" height="$6" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true" allow="encrypted-media"></iframe>'],
  [ /\!(\[([^\[|\]]+)?\])?\(https:\/\/www.facebook.com\/([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2F$3&tabs=timeline&width=$4" width="$4" height="$5" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true" allow="encrypted-media"></iframe>'],

  /* Media */

  // INA.fr
  [ /\!(\[([^\[|\]]+)?\])?\(https:\/\/player.ina.fr\/player\/embed\/([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<iframe class="video" width="300" height="180" frameborder="0" marginheight="0" marginwidth="0" scrolling="no" style="overflow:hidden;width:$4px; height:$5px;" src="https://player.ina.fr/player/embed/$3/wide/0" allowfullscreen></iframe>'],
  // INA/Jalon
  [ /\!(\[([^\[|\]]+)?\])?\(InaEdu([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<iframe class="video" width="300" height="180" style="width:$4px; height:$5px;" src="https://fresques.ina.fr/jalons/export/player/InaEdu$3/360x270" allowfullscreen></iframe>'],
  // Youtube
  [ /\!(\[([^\[|\]]+)?\])?\(https?:\/\/youtu.be\/([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<iframe class="video" width="300" height="180" style="width:$4px; height:$5px;" src="https://www.youtube.com/embed/$3" frameborder="0" allowfullscreen></iframe>'],
  // Dailymotion
  [ /\!(\[([^\[|\]]+)?\])?\(https?:\/\/dai.ly\/([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<iframe class="video" frameborder="0" width="300" height="180" style="width:$4px; height:$5px;" src="https://www.dailymotion.com/embed/video/$3" allowfullscreen></iframe>'],
  // Vimeo
  [ /\!(\[([^\[|\]]+)?\])?\(https?:\/\/vimeo.com\/([^ |\)]*) ?(\d+)?x?(\d+)?\)/g,
    '<iframe class="video" frameborder="0" width="300" height="180" style="width:$4px; height:$5px;" src="https://player.vimeo.com/video/$3" allowfullscreen></iframe>'],

  // Audio
  [/\!(\[([^\[|\]]+)?\])?\((https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=\(\)]*)\.mp3) ?(\d+)?x?(\d+)?\)/g,
    '<audio controls style="width:$6px; height:$7px;" title="$2"><source src="$3" type="audio/mpeg">Your browser does not support the audio element.</audio>'],
  // Video
  [/\!(\[([^\[|\]]+)?\])?\((https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=\(\)]*)\.mp4) ?(\d+)?x?(\d+)?\)/g,
    '<video controls style="width:$6px; height:$7px;" title="$2"><source src="$3" type="video/mp4">Your browser does not support the video tag.</video>'],

  // Internal images
  [/\!(\[([^\[|\]]+)?\])?\((img_|thumb_)([a-z]{3}[0-9]+\.(jpe?g|png|gif|svg)) ?(\d+)?x?(\d+)?\)/g,
    '<img style="width:$6px; height:$7px;" src="image/voir/$3$4" title="$2" />'],

  // Images
  [/!(\[([^[|\]]+)?\])?\((https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=()]*)) ?(\d+)?x?(\d+)?\)/g,
    '<img style="width:$6px; height:$7px;" src="$3" title="$2" />'],
  // Local images
  [/!(\[([^[|\]]+)?\])?\((file:\/\/\/([-a-zA-Z0-9@:%_+.~#?&//=()]*)) ?(\d+)?x?(\d+)?\)/g,
    '<img style="width:$5px; height:$6px;" src="$3" title="$2" />'],

  // links
  [/\[([^[]+)?\]\((https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*))( ?)([^)]*)\)/g,
    '<a href=\'$2\' title="$6" target="_blank">$1</a>'],
  [/\((https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*))( ?)([^)]*)\)/g,
    '<a href=\'$1\' title="$5" target="_blank">$1</a>'],
  // Mailto
  [/\[([^[]+)?\]\(\bmailto\b:(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)\)/gi, '<a href=\'mailto:$2\'>$1</a>'],
  [/\(\bmailto\b:(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)\)/gi, '<a href=\'mailto:$1\'>$1</a>'],
  // tel
  [/\[([^[]+)?\]\(tel:([0-9+-]+)\)/g, '<a href=\'tel:$2\'>$1</a>'],
  [/\(tel:([0-9+-]+)\)/g, '<a href=\'tel:$1\'>$1</a>'],

  // Code
  [/`(.*?)`/g, '<code>$1</code>'],					    // inline code
  [/\n {4,}(.*)/g, '<pre>$1</pre>'],					  // Code
  [/\n\t(.*)/g, '<pre>$1</pre>'],						    // Code
  [/<\/pre><pre>/g, '<br/>'],							      // fix
  [/<\/pre>\n/g, '</pre>'],							        // fix

  // format
  [/(\\\*)/g, '&#42;'],								          // escape *
  [/(\*\*)([^]*?)\1/g, '<strong>$2</strong>'],  // bold
  [/(\*)([^]*?)\1/g, '<em>$2</em>'],					  // emphasis
  [/<strong><\/strong>/g, '****'],				      // fix bold
  [/<em><\/em>/g, '**'],							          // fix em
  [/(__)(.*?)\1/g, '<u>$2</u>'],						    // underline
  [/(~~)(.*?)\1/g, '<del>$2</del>'],				    // del

  // alignement https://github.com/jgm/pandoc/issues/719
  [/\n\|&lt;&gt;([^\n]*)/g, "\n<pc>$1</pc>"],			// center |<>
  [/\n\|\t([^\n]*)/g, "\n<pc>$1</pc>"],				// center |[tab]
  [/\n\|&lt;([^\n]*)/g, "\n<pl>$1</pl>"],				// left |<
  [/\n\|&gt;([^\n]*)/g, "\n<pr>$1</pr>"],				// rigth |>
  [/<\/pc>\n<pc>/g, "<br/>"],
  [/<\/pl>\n<pl>/g, "<br/>"],
  [/<\/pr>\n<pr>/g, "<br/>"],
  [/<pc>/g, "<div class='center'>"],					//	fix
  [/<pl>/g, "<div class='left'>"],					//	fix
  [/<pr>/g, "<div class='right'>"],					//	fix
  [/<\/pc>|<\/pl>|<\/pr>/g, "</div>"],					//	fix

  //
  [/\(c\)/g, "&copy;"],									// (c)
  [/\(r\)/g, "&reg;"],									// (R)
  [/\(TM\)/g, "&trade;"]									// (TM)

];

/**	jQuery plugin to display markdown content of a textarea into resulting div.
 * @function external:"jQuery.fn".md
 * @param {} dest output element to display the result
 * @param {} data a list of key/value to replace in the markdown (using %key%)
 * @example
// Put content of the markdown textarea in the result div.
$(".markdown").md(".result", { name: "hello world!" })
* /
(function($) {
  var hit=0;
  // Delay refresh when typping
  function refresh(from, to, data, delay) {
    if (!delay) {
      hit++;
      setTimeout (function(){refresh(from, to, data, true)}, 500);
    }
    else {
      hit--;
      if (!hit) {
        $(to).html ( md2html($(from).val(), data) );
      }
    }
  }

  // Insert char at caret pos in a textarea
  $.fn.insertChar = function(t0, t1) {
    if (this.prop('tagName')=="TEXTAREA") {
    var selStart = this.prop('selectionStart')
      var selEnd = this.prop('selectionEnd')
      var val = this.val();
      this.val(val.substring(0, selStart) + (t0||"") + val.substring(selStart, selEnd) + (t1||"") + val.substring(selEnd) );
      var pos = selEnd + (t0||"").length + (t1||"").length;
      this.prop('selectionStart', pos);
      this.prop('selectionEnd', pos);
    }
    return this;
  }

  //
  $.fn.md = function(dest, data) {
    data = data || {};
    refresh (this, dest, data);
    return this
      // Prevent tab default behavior
      .keydown (function(e) {
        // Prevent tab default behavior
        if (e.keyCode==9) {
          $(this).insertChar('\t');
          e.preventDefault();
        }
      })
      // Refresh
      .keyup (function(e) {
        if (e.keyCode==13 || e.keyCode==8 || e.keyCode==32 || (e.keyCode>40 && e.keyCode<200)) refresh (this, dest, data);
        //console.log(e.keyCode)
      })
      .change (function() {
        refresh (this, dest, data);
      });
  };
}(jQuery));
/* */

export default md2html;