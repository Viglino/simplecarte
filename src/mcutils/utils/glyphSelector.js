/** jQuery plugin to display a popup to choose glyph
*/
/* global jQuery */
import ol_style_FontSymbol from 'ol-ext/style/FontSymbol'

(function($){

var tableGlyph, tableFont, tableTheme;
var nbFilter=0;

function filterGlyph (div, delayed) {
  if (!delayed) {
    nbFilter++;
    setTimeout(function(){ filterGlyph (div,true); },100);
    return;
  }
  nbFilter--;
  if (nbFilter>0) return;

  // No more delayed filters
  var q = $("input", div).val();
  var font = $(".font option:selected", div).val();
  var theme = $(".theme option:selected", div).val();
  var nosel = $(".noselection", div).show();

  q = new RegExp(q,"i");
  $("i",div).each(function() {
    var i = $(this)
    var g = tableGlyph[i.attr("class")];
    if (g) {
      if ((q.test(g.name) || q.test(g.search)) && (!font || g.font == font) && (!theme || g.theme == theme)) {i.css('display','');
        nosel.hide();
      }
      else i.hide();
    }
  });
}

/**	jQuery plugin to transform an input element into a glyph selector
 * to select glyph from ol.style.FontSymbol.
 * @function external:"jQuery.fn".glyphSelector
 */
jQuery.fn.glyphSelector = function() {
  var self = this;
  var i;
  
  if (!tableGlyph) {
    tableGlyph = ol_style_FontSymbol.prototype.defs.glyphs;
    tableFont = ol_style_FontSymbol.prototype.defs.fonts;
    tableTheme = {};
    for (i in tableGlyph) if (tableGlyph[i].theme) tableTheme[tableGlyph[i].theme] = true;
  }

  return self.each(function() {
    var self = $(this).hide();
    var input = $("<i>").addClass("glyphSelector")
        .insertAfter(this);
    //var pos = input.offset();
    var popup = $("<div>").addClass("glyphSelector_popup")
        .appendTo("body")
        .hide()
        .css({
          position:"absolute",
          'z-index':100,
          border:"1px solid #369",
          'box-shadow':"1px 1px 3px rgba(0, 0, 0, 0.6)",
          background:"#fff"
        });

    function setValue(val) {
      if (tableGlyph[val]) input.removeClass().addClass(val).addClass("glyphSelector").text("");
      else input.removeClass().addClass(val).addClass("glyphSelector").text(val.substring(0,1));
    }
    setValue(self.val());

    function hidePopup(e) {
      if (e && e.target && $(e.target).closest(".glyphSelector_popup").length>0) return;
      popup.hide();
      $(window).off('resize click mousewheel scroll', hidePopup);
    }

    function showPopup(){
      var pos = input.offset();
      var top = pos.top + input.outerHeight();
      var left = pos.left;
      var wtop = $(window).scrollTop();
      var wleft = $(window).scrollLeft();
      var w = $(window).width();
      var h = $(window).height();
      popup.css({top:top, left:left}).show();
      var width = popup.outerWidth();
      var height = popup.outerHeight();
      if (top-wtop+height > h) top = Math.max(0, h+wtop-height);
      if (left-wleft+width > w) left = Math.max(0,w+wleft-width);
      popup.css({top:top, left:left});
      $(window).on('click mousewheel scroll', hidePopup);
    }

    var menu = $("<div>").addClass("font").appendTo(popup);
    var search = $("<div>").addClass("search").appendTo(popup);
    var symb = $("<div>").addClass("symboles").appendTo(popup);
    $("<div>").addClass("noselection").html("Aucun r&eacute;sultat...").hide().appendTo(popup);

    // Search bar
    $("<div>").addClass("reset").appendTo(search)
      .click(function(e) {
        $(this).next().val("");
        filterGlyph (popup);
        setTimeout(showPopup,200);
        e.stopPropagation();
      });
    $("<input>").appendTo(search)
      .on("keyup", function(){
        filterGlyph (popup);
      })
      .on("change", function(){
        setTimeout(function(){ if (popup.css('display')!='none') showPopup(); }, 200);
      })
      .click(function(e){ e.stopPropagation(); });

    // Font menu
    $("<span>").addClass("title").appendTo(menu);
    var m = $("<select>").addClass("font")
      .click(function(e){ e.stopPropagation(); })
      .appendTo(menu)
      .on("change",function(){
        filterGlyph (popup);
        setTimeout(showPopup,200);
      });
    $("<option>").appendTo(m)
      .text("toutes les polices...")
      .css("font-style", "italic")
      .val("");
    for (i in tableFont) {
      $("<option>").appendTo(m)
        .text(tableFont[i].name)
        .val(tableFont[i].font);
    }

    // Theme menu
    m = $("<select>").addClass("theme")
      .click(function(e){ e.stopPropagation(); })
      .appendTo(menu)
      .on("change",function()
          {	filterGlyph (popup);
            setTimeout(showPopup,200);
          });
    $("<option>").appendTo(m)
      .text("tous les thèmes...")
      .css("font-style", "italic")
      .val("");
    for (i in tableTheme) {
      $("<option>").appendTo(m)
        .text(i);
    }

    // Symbols
    for (i in tableGlyph){
      $("<i>").addClass(i)
        .attr("title",tableGlyph[i].name.replace("_"," "))
        .appendTo(symb);
    }
    self.on("change", function() {
      setValue(this.value)
    });
    self.on("setvalue", function() {
      setValue(this.value)
    });
    // Select an item
    $("i", popup).click(function() {
      var g = $(this).attr('class');
      self.val(g);
      self.trigger("change");
      input.removeClass().addClass(g).addClass("glyphSelector");
      hidePopup();
    });

    // Show popup
    input.click(function(e) {
      showPopup();
      e.stopPropagation();
    });
  });

}
})(jQuery);
