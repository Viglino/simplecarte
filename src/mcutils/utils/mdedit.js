/* global $ */
var setValue = $.fn.val;

(function(){

  
/** Markdown editor
 * Ajoute une barre d'édition sur un textara
 * @function external:"jQuery.fn".mdedit
 */
$.fn.mdedit = function() {
  var icons=[
    'fa-smile-o', 'fa-meh-o', 'fa-frown-o', 'fa-eye', 'fa-heart', 'fa-times', 'fa-star', 'fa-tag', 'fa-map-o',
    'fa-map-marker', 'fa-wheelchair', 'fa-car', 'fa-anchor', 'fa-camera', 'fa-clock-o', 'fa-coffee', 'fa-gear',
    'fa-calendar', 'fa-eye', 'fa-circle', 'fa-play', 'fa-pause',
    'fa-comment', 'fa-comments', 
    'fa-download', 'fa-envelope', 'fa-reply', 'fa-share', 'fa-rss', 'fa-wifi', 'fa-bluetooth-b', 'fa-retweet',
    'fa-book', 'fa-bookmark',
    'fa-warning',
    'fa-file-o', 'fa-file-photo-o', 'fa-folder', 
    'fa-lock', 'fa-unlock', 'fa-mobile', 'fa-paint-brush', 'fa-pencil',
    'fa-phone', 'fa-shopping-cart', 
    'fa-thumbs-up', 'fa-user', 'fa-volume-up', 
    'fa-ban', 'fa-chain', 'fa-pie-chart', 'fa-check','fa-square-o', 'fa-check-square-o',
    //'logo-ign-complet', 'logo-ign-couleur'
  ];

  /* Dialog icons */
  var iconDlg = $('form.iconDlg');
  if (!iconDlg.length) {
    iconDlg = $('<form>').addClass('mdEditDialog iconDlg').appendTo('body').hide();
    var div = $('<div>').appendTo(iconDlg);
    $('<div>').addClass('content').appendTo(div);
    $('<input>').attr('type', 'button')
        .val('Annuler')
        .click(function(){ iconDlg.hide(); })
        .appendTo(div);
  }

  /* Dialog */
  var dlog = $('form.urlDlg');
  if (!dlog.length) {
    dlog = $('<form>').addClass('mdEditDialog urlDlg').appendTo('body').hide();
    div = $('<div>').html(
'<h1>Insérer</h1> \
<label class="mdalt">Texte alternatif :</label> \
<input type="text" class="mdalt"> \
<label>Url de <span>du média</span> :</label> \
<input class="durl" type="text" placeholder="https://"> \
<i class="twitter">Afficher un tweet : https://twitter.com/{user}/<b>status</b>/{id}</i> \
<i class="twitter">Timeline d\'un utilisateur : https://twitter.com/{user}/<b>timeline</b></i> \
<i class="twitter">Afficher <a href="https://tweetdeck.twitter.com/" target="_blank">une timeline</a> : https://twitter.com/{user}/<b>timelines</b>/{id}</i> \
<i class="twitter">Afficher <a href="https://tweetdeck.twitter.com/" target="_blank">une grille</a> : https://twitter.com/{user}/<b>timegrid</b>/{id}</i> \
<label class="mdimgsize">Taille du média :</label> \
<span class="twitter">Nombre de tweets / afficher l\'image du tweet :</span> \
<input class="width mdimgsize" type="number" min="0" placeholder="auto"> \
<span class="mdimgsize"> x </span> \
<br class="twitter"/> \
<span class="twitter">Taille du média:</span> \
<input class="height mdimgsize" type="number" min="0" placeholder="auto"> \
<div class="mdbuttons"></div>'
    ).appendTo(dlog);
	
   $('<input>').attr('type', 'button')
    .val('Annuler')
    .click(function(){ dlog.hide(); })
    .appendTo($('.mdbuttons', div));
   
    var btok = $('<input id ="btok">').attr('type', 'submit')
    .val('OK')
    .appendTo($('.mdbuttons', div));
  }
  
  var dalt = $('input[type="text"].mdalt');
  var durl = $('input[type="text"].durl');

  /* End dialog */

  /** Insert an url
   */
  function insertUrl(elt, text, p, options){
    var t = text.substring(p.start,p.end);
    var rexurl = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/;
    var nb = text.length;
    var isimg = /^!/.test(options.val);
    var twit = /twitter/.test(options.val);
    if (twit) isimg = true;
    dlog.show();
    durl.removeClass('mderror');
    $('input[type="text"]').val('');
    $('input[type="number"]').val('');
    if (twit) {
      dlog.attr('class','mdEditDialog twitter');
      $('h1', dlog).text('Insertion Twitter');
      $('label span', dlog).text('du tweet');
      durl.val(options.val);
    } else if (isimg) {
      dlog.attr('class','mdEditDialog media');
      $('h1', dlog).text('Insérer un média');
      $('label span', dlog).text('du média');
    }
    else {
      dlog.attr('class','mdEditDialog url');
      $('h1', dlog).text('Insérer un lien');
      $('label span', dlog).text('du lien');
    }
    while (t.substr(-1)==='\n') {
      p.end--;
      t = text.substring(p.start,p.end);
    }
    if (rexurl.test(t)) {
      durl.val(t);
      setTimeout(function(){ dalt.focus(); });
    } else {
      dalt.val(t);
      setTimeout(function(){ durl.focus(); });
    }
    $('#btok').off('click')
      .click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        var alt = dalt.val().replace(/\]/g,'');
        var url = durl.val();
        if (!rexurl.test(url)) {
          durl.focus();
          durl.addClass('mderror');
          return;
        }
        dlog.hide();
        if (t) {
          text = removeAt(text, p.start, t.length);
        }
        var sizex = $('input[type="number"]').first().val();
        var sizey = $('input[type="number"]').last().val();
        if (sizex || sizey) sizex = ' '+sizex+'x'+sizey;
        text = insertAt(text, p.start, '('+(url||'http://')+sizex+') ');
        if (alt) text = insertAt(text, p.start, '['+alt+']');
        if (isimg) text = insertAt(text, p.start, '!');
        setValue.call(elt,text);
        elt.focus();
        elt.prop('selectionStart', p.start+text.length-nb+t.length);
        elt.prop('selectionEnd', p.start+text.length-nb+t.length);
        elt.change();
      });
  }

  /** List of button to add to the bar
   */
  var mdbar = [
    // header
    { title:'titres', icon: 'title', val: '#', type: 'line' },
    // separateur
    { icon: 'separator', type: 'separator' },
    // bold
    { title:'gras', icon: 'fa-bold', val: '**', type: 'selection' },
    // italic
    { title:'italique', icon: 'fa-italic', val: '*', type: 'selection' },
    // underline
    { title:'souligné', icon: 'fa-underline', val: '__', type: 'selection' },
    // strike
    { title:'barré', icon: 'fa-strikethrough', val: '~~', type: 'selection' },
    // separateur
    { icon: 'separator', type: 'separator' },
    // justify
    { title:'justifié', icon: 'fa-align-justify', val: '', type: 'fn', fn: function(text, p, options) {
      var t = text.substr(p.startln, 2);
      if (t==='|<' || t==='|>' || t==='|\t') {
        text = removeAt(text, p.startln, 2);
        p.start -= 2;
        p.end -= 2;
      } else if (text.charAt(p.startln)==='#') {
        return align(text, p, options);
      } 
      return text;
    }},
    // left
    { title:'aligné à gauche', icon: 'fa-align-left', val: '|<', type: 'fn', fn: function(text, p, options) {
      return align(text, p, options);
    }},
    // center
    { title:'centré', icon: 'fa-align-center', val: '|\t', type: 'fn', fn: function(text, p, options) {
      return align(text, p, options);
    }},
    // right
    { title:'aligné à droite', icon: 'fa-align-right', val: '|>', type: 'fn', fn: function(text, p, options) {
      return align(text, p, options);
    }},
    // separateur
    { icon: 'separator', type: 'separator' },
    // list-ul
    { title:'listes', icon: 'fa-list-ul', val: '* ', type: 'fn', fn: function(text, p, options) {
      if (text.substring(p.startln,p.startln+2)==='* ') {
        return insertAt(text, p.startln, '  ');
      } else {
        return insertAt(text, p.startln, options.val);
      }
    }},
    // list-ol
    { title:'liste', icon: 'fa-list-ol', val: '1. ', type: 'line' },
    // separateur
    { icon: 'separator', type: 'separator' },
    // code
    { title:'code', icon: 'fa-code', val: '', type: 'fn',
      fn: function(text, p, options) {
        if (p.start===p.end) {
          if (text.substr(p.startln, 4)==='    ') {
            text = removeAt(text, p.startln, 4);
            options.start = p.start - 4;
            options.end = p.end - 4;
          } else {
            text = insertAt(text, p.startln, '    ');
            options.start = p.start + 4;
            options.end = p.end + 4;
          }
        } else {
          text = insertAt(text, p.end, '`');
          text = insertAt(text, p.start, '`');
          options.start = p.start + 1;
          options.end = p.end + 1;
        }
        return text;
    }},
    // indent
    { title:'citation', icon: 'fa-indent', val: '', type: 'fn',
      fn: function(text, p, options) {
        if (text.charAt(p.startln)==='>') {
          text = removeAt(text, p.startln, 1);
          options.start = p.start -1;
          options.end = p.end -1;
        } else {
          text = insertAt(text, p.startln, '>');
          options.start = p.start +1;
          options.end = p.end +1;
        }
        return text;
    }},
    // separateur
    { icon: 'separator', type: 'separator' },
    // line
    { title:'insérer une ligne', icon: 'line', val: '\n------\n', type: 'insert'},
    // link
    { title:'insérer un lien', icon: 'fa-link', val: '[alt](url)', type: 'dialog', fn: insertUrl },
    // picture
    { title:'insérer un média', icon: 'fa-picture-o', val: '!(url)', type: 'dialog', fn: insertUrl },
    // table
    { title:'insérer un tableau', icon: 'fa-table', val: '\n\n T1 | T2 \n----|----\n 1  | 2  \n\n', type: 'insert' },
    // list-alt
    { title:'insérer un bloc', icon: 'fa-list-alt', val: '', 
      wrap: ['\n\n[-- Titre --]\n', '\n[----]\n\n'], type:'fn', 
      fn: function(text, p, options) {
        var content = 'contenu';
        if (p.start !== p.end) {
          content = text.substring(p.start,p.end);
          text = removeAt(text, p.start, content.length);
        }
        text = insertAt(text, p.start, options.wrap[0]+content+options.wrap[1]);
        options.start = p.start + options.wrap[0].length;
        options.end = p.start + options.wrap[0].length + content.length;
        return text;
      }
    },
    // separateur
    { icon: 'separator', type: 'separator' },
    // Twitter
    { title:'Twitter', icon: 'fa-twitter-square', val: ' ![Vous avez vu ma carte ?](https://twitter.com/share) ', type: 'insert' },
    // Tweet
    { title:'insérer un tweet', icon: 'fa-twitter', val: 'https://twitter.com/{user}/status/{id}', type: 'dialog', fn: insertUrl },
    // FaceBook
    { title:'Facebook', icon: 'fa-facebook-square', val: ' !(https://www.facebook.com/like) ', type: 'insert' },
    // Emoticons
    { title:'émoticône', icon: 'fa-smile-o', val: ':fa-smile-o:', type: 'dialog', 
      fn: function(elt, text, p){
        console.log(arguments)
        var div = $('.content', iconDlg).html('');
        for (var i=0; i<icons.length; i++) {
          $('<i>').addClass('fa '+icons[i])
            .data('icon', icons[i])
            .click(function() {
              iconDlg.hide();
              var val = ' :'+$(this).data('icon')+': ';
              text = insertAt(text, p.end, val);
              setValue.call(elt, text);
              elt.focus();
              elt.prop('selectionStart', p.end+1);
              elt.prop('selectionEnd', p.end+val.length-1);
              elt.change();
              return text;
            })
            .appendTo(div);
        }
        iconDlg.show();
      }
    },
  ];

  /** Insert Markdown alignement
   * @param {string} text
   * @param {*} p
   * @param {*} options
   */
  function align (text, p, options) {
    var s = text.length;
    var st = text.substring(p.startln,p.startln+2);
    if (st==='|\t' || st==='|>' || st==='|<') {
      text = removeAt(text, p.startln, 2);
    }
    // Title
    if (st = text.substr(p.startln, 1)==='#') {
      var n = 1;
      while (text.substr(p.startln+n, 1)==='#') n++;
      if (options.val==='|\t' && text.substr(p.startln+n, 1)!=='\t') text = insertAt(text, p.startln+n, '\t');
      else if (text.substr(p.startln+n, 1)==='\t') text = removeAt(text, p.startln+n, 1);
    } else {
      text = insertAt(text, p.startln, options.val);
    }
    options.start = p.start+text.length-s;
    options.end = p.end+text.length-s;
    return text;
  }

  /** insert val in t at pos */
  function insertAt(t, pos, val) {
    return t.substring(0, pos) + val + t.substring(pos, t.length)
  }
  /** Remove nb char in t at pos */
  function removeAt(t, pos, nb) {
    return t.substring(0, pos) + t.substring(pos+nb, t.length)
  }
  
  /** Markdown editor
   * @param {DOMElement} elt
   * @param {*} options
   *  @param {line|insert|selection|fn} options.type
   *  @param {} options.val
   *  @param {Array<string>} options.wrap
   *  @param {function} options.fn
   */
  function mdedit(elt, options) {
    var start = elt.prop('selectionStart');
    var end = elt.prop('selectionEnd');
    var text = elt.val();
    var startnl = text.lastIndexOf('\n', start-1)+1;
    switch (options.type) {
      case 'line':
        text = insertAt(text, startnl, options.val)
        break;
      case 'selection':
        if (start !== end && text.charAt(end-1) === ' ') end--;
        text = insertAt(text, end, options.val);
        text = insertAt(text, start, options.val)
        break;
      case 'insert':
        if (options.wrap) {
          text = insertAt(text, start, options.wrap[0]);
          start += options.wrap[0].length;
          options.start = start;
        }
        text = insertAt(text, start, options.val);
        if (options.wrap) {
          text = insertAt(text, start+options.val.length, options.wrap[1]);
          options.end = start+options.val.length;
        }
        break;
      case 'fn':
        text = options.fn(text, { start: start, end:end, startln: startnl }, options)
        break;
      case 'dialog':
        options.fn(elt, text, { start: start, end:end, startln: startnl }, options)
        break;
      default: break;
    }
    // Undo/redo
    setValue.call(elt,text);
    elt.focus();
    elt.prop('selectionStart', options.start || (start + options.val.length));
    elt.prop('selectionEnd', options.end || (end + options.val.length));
    elt.change();
  }

  // Main
  return this.each(function(){
    // Reset undo /redo
    if ($(this).data('undo')) {
      $(this).data('undo', [{ sel:$(this).prop('selectionEnd'), text: $(this).val() }]);
      $(this).data('redo', []);
    } else {
      // Create the editor
      var tarea = $(this);
//      var wrapper = $(this).wrap('<div>').addClass('mdEditor');
      var bar = $("<div>").addClass('mdEditBar').insertBefore(this);
      for (var i=0; i<mdbar.length; i++) {
        $('<i>').addClass('fa '+mdbar[i].icon)
          .attr('title', mdbar[i].title)
          .data('fn', mdbar[i])
          .click(function() { 
            mdedit(tarea, $(this).data('fn'));
          })
          .appendTo(bar);
      }

      /** Return on list add a new line in the list
       * @param {string} v list type
       */
      var testul = function (v) {
        var start = tarea.prop('selectionStart');
        var text = tarea.val();
        var startln = text.lastIndexOf('\n', start-2)+1;
        var st = text.substring(startln, startln+v.length);
        if (st===v) {
          // is a list?
          if (text.substring(startln, start-1)===v) {
            // Sublist? > down list
            if (v==='  * ') {
              text = removeAt(text, start-1, 1);
              text = removeAt(text, startln, 2);
              setValue.call(tarea,text);
              tarea.prop('selectionStart', startln+2);
              tarea.prop('selectionEnd', startln+2);
            } else {
              // Remove line list
              text = removeAt(text, startln, v.length+1);
              setValue.call(tarea,text);
              tarea.prop('selectionStart', startln);
              tarea.prop('selectionEnd', startln);
            }
          } else {
            // Insert a new line in the list
            text = insertAt(text, start, v);
            setValue.call(tarea,text);
            tarea.prop('selectionStart', start+v.length);
            tarea.prop('selectionEnd', start+v.length);
          }
          tarea.change();
          return true;
        }
        return false;
      }

      // Handle lists
      $(this).on('keyup', function (e) {
        if (e.key==='Enter') {
          testul('* ') || testul('  * ') || testul('1. ') || testul('    ') || testul('>') || testul('\t');
        }
      });

      $(this).data('undo', [{ sel:$(this).prop('selectionEnd'), text: $(this).val() }]);
      $(this).data('redo', []);
      // Undo/redo
      $(this).on('change keyup click', function (e) {
        var undo = $(this).data('undo');
        var redo = $(this).data('redo');
        var s;
        if (e.key==='z' && e.ctrlKey) {
          console.log('undo')
          if (undo.length>1) {
            // console.log('undo')
            redo.unshift(undo.shift());
            s = undo[0];
            //$(this).val(s.text);
            setValue.call($(this), s.text);
            $(this).prop('selectionStart', redo[0].pos);
            $(this).prop('selectionEnd', redo[0].pos);
          }
        } else if ((e.key==='Z' || e.key==='y') && e.ctrlKey) {
          if (redo.length) {
            // console.log('redo')
            s = redo.shift();
            undo.unshift(s);
            setValue.call($(this), s.text);
            $(this).prop('selectionStart', s.pos2);
            $(this).prop('selectionEnd', s.pos2);
          }
        } else {
          s = {
            pos: $(this).data('position') || $(this).prop('selectionEnd'),
            pos2: $(this).prop('selectionEnd'),
            text: $(this).val()
          }
          if (!undo.length || undo[0].text != s.text) {
            undo.unshift(s);
            $(this).data('redo', []);
            // Max 200 undo
            if (undo.length > 200) undo.pop();
          }
          $(this).data('position',  $(this).prop('selectionEnd'));
        }
      });
    }
  });
};

$.fn.val = function() {
  var val = setValue.apply(this, arguments);
  // Reset undo / redo
  if (arguments.length) {
    if ($(this).data('undo')) {
      $(this).data('undo', [{ sel:$(this).prop('selectionEnd'), text: $(this).val() }]);
      $(this).data('redo', []);
    }
  }
  return val;
}
  
})()
