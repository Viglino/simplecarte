/* global jQuery */
import ol_style_FillPattern from 'ol-ext/style/FillPattern'

(function($){

/** jQuery plugin to display a pattern selector
 *	Add a choice to load avaliable layers
* @function external:"jQuery.fn".patternSelector
* @param {} spectrumOptions
*/
$.fn.patternSelector = function(spectrumOptions){

  return this.each(function(){
    var self = $(this);

    $('[data-style="fillPattern"]', self).on('change', function(){
      input.val( $('[data-style="fillPattern"]', self).val() );
      getSelectedPattern();
    });

    self.hide();
    var input = $("<div>").addClass("patternSelector")
        .append($("<div>"))
        .insertAfter(this);
    var popup = $("<div>").addClass("patternSelector_popup")
        .appendTo("body")
        .hide();

    getSelectedPattern();

    function hidePopup(e){
      if (e && (e.target==input.get(0) || e.target==$("div", input).get(0))){
        return;
      }

      popup.hide();
      $(window).off('resize click mousewheel scroll', hidePopup);
      $('input[data-pattern-property="pattern-color"]').spectrum("hide");
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
      addPropertiesValue();
      $(window).on('resize click mousewheel scroll', hidePopup);
    }
    input.click(function(){
      if (popup.css('display')=='none'){
        showPopup();
      }
      else hidePopup();
    });
    popup.click(function(e){
      e.stopPropagation();
    });

    function getSelectedPattern(){
      var css;
      var chosenPattern = $('[data-style="fillPattern"]', self).val();
      if(chosenPattern == '') {
        css = {
          property : "background",
          value : '#fff' //TODO : Ã  customiser par l'utilisateur
        };
      } else {
        var p = new ol_style_FillPattern({ pattern:chosenPattern });
        css = {
          property : "background-image",
          value : 'url("'+p.getImage().toDataURL()+'")'
        };
      }
      $("div",input).css(css.property, css.value);
    }

    function addPropertiesValue(){
      $(patternPropertiesPart).html('');

      var chosenPattern = $('[data-style="fillPattern"]', self).val()

      $('<h4>').html('Paramétrage')
          .appendTo(patternPropertiesPart);

      var ul = $('<ul>').appendTo(patternPropertiesPart);

      for(var i in properties){
        var property = properties[i];

        var li = $('<li>')
            .css('text-align', 'right')
            .appendTo(ul);
        if( property['data-pattern-property'].indexOf('angle') > -1 ){
            $('<label>').html( property.html +'<span data-property="angle"></span> : ' )
                .appendTo(li);
        } else {
            $('<label>').html( property.html + " : " )
                .appendTo(li);
        }

        var propInput = $('<input>')
            .on('change keyup ', function(){
              var prop = $(this).attr('data-pattern-property');

              $($('[data-style="' + prop + '"]', self)[0]).val($(this).val()).change();
              self.change();
            })
            .appendTo(li);
        for (var j in property){
          $(propInput).attr(j, property[j]);
          if(j == 'value'){
            var val = $($('[data-style="' + property['data-pattern-property'] + '"]', self)[0]).val();
            if(val){
              $(propInput).attr(j, val);
            }
          }
        }

        if( property.type=='number' ){
          propInput.keydown(function(e){
            if ((e.key>="0" && e.key<="9")
              || e.key=='-'
              || e.key=='Tab'
              || e.key=='ArrowUp'
              || e.key=='ArrowDown'
              || e.key=='ArrowLeft'
              || e.key=='ArrowRight'
              || e.key=='Backspace'
              || e.key=='Delete'
            ) {
              return;
            }
            e.preventDefault();
          });
        }
      }

      if ( $.inArray(chosenPattern,["hatch","cross","dot","circle","square","tile"] ) < 0 ){
        $("[data-pattern-property*=size]", ul).prop("disabled",true);
        $("[data-pattern-property*=spacing]", ul).prop("disabled",true);
        $("[data-pattern-property*=angle]", ul).prop("disabled",true);
        $('span[data-property=angle]').html("");
      } else {
        $("[data-pattern-property*=size]", ul).prop("disabled",false);
        $("[data-pattern-property*=spacing]", ul).prop("disabled",false);
        $("[data-pattern-property*=angle]", ul).prop("disabled",false);
        if( chosenPattern == "hatch" ){
          $('span[data-property=angle]').html(" (deg)");
          $("[data-pattern-property*=angle]", ul).attr("max" , 90).attr("min", -90);
        } else {
          $('span[data-property=angle]').html(" (bool)");
          $($("[data-pattern-property*=angle]", ul)[0]).attr("max" , 1).attr("min", 0);
        }
      }

      $("<button>").addClass('patternPropertiesHideButton')
          .attr('type', 'button')
          .html('Réduire')
          .click(function(){
            popup.removeClass('patternExtended');
          })
          .appendTo(patternPropertiesPart);

      $("<button>").addClass('patternPropertiesOKButton')
          .attr('type', 'button')
          .html('OK')
          .click(function(){
            hidePopup();
          })
          .appendTo(patternPropertiesPart);

      $('input[data-pattern-property="fillColorPattern"]').spectrum(spectrumOptions);
    }

    /*
    * Ajoute les motifs Ã   la popup et le bouton options
    */
    var patternPart = $("<div>").addClass("patternSelectionPart")
            .appendTo(popup);

    function addPattern(i){
        var css;
        if(i == ''){
            css = {
                property : "background",
                value : '#fff' //TODO : Ã  customiser par l'utilisateur
            };

        }else{
            var p = new ol_style_FillPattern({ pattern:i });
            css = {
                property : "background-image",
                value : 'url("'+p.getImage().toDataURL()+'")'
            };
        }

        $("<div>").attr('title',i)
            .css(css.property, css.value)
            .click(function(){
                var pattern = $(this).attr("title");
                $('[data-style="fillPattern"]', self).val( pattern ).change();
                $("div",input).css(css.property, css.value);
                if (!popup.hasClass('patternExtended')){
                    hidePopup();
                }
                self.change();

                if ( $.inArray(pattern,["hatch","cross","dot","circle","square","tile"] ) < 0 ){
                    $("[data-pattern-property*=size]").prop("disabled",true);
                    $("[data-pattern-property*=spacing]").prop("disabled",true);
                    $("[data-pattern-property*=angle]").prop("disabled",true);
                    $("[data-pattern-property*=angle]").next().text("");
                }else{
                    $("[data-pattern-property*=size]").prop("disabled",false);
                    $("[data-pattern-property*=spacing]").prop("disabled",false);
                    $("[data-pattern-property*=angle]").prop("disabled",false);
                    if( pattern == "hatch" ){
                        $('span[data-property=angle]').html(" (deg)");
                        $($("[data-pattern-property*=angle]", self)[0]).attr("max" , 90).attr("min", -90);
                    }
                    else{
                        $('span[data-property=angle]').html(" (bool)");
                        $($("[data-pattern-property*=angle]", self)[0]).attr("max" , 1).attr("min", 0);
                    }
                }
            })
            .appendTo(patternPart);

    }

    addPattern('');
    for (var i in ol_style_FillPattern.prototype.patterns){
        addPattern(i);
    }

    $("<button>").addClass('patternPropertiesShowButton')
            .html('Options')
            .click(function(){
                popup.addClass('patternExtended');
            })
            .appendTo(patternPart);


    /*
    * Ajoute la partie options Ã  la popup
    */
    var properties = [
        { 'data-pattern-property' : 'sizePattern',     html : 'Taille',      type : 'number',    value : 5,  min : 0},
        { 'data-pattern-property' : 'spacingPattern',  html : 'Espacement',  type : 'number',    value : 10, min : 0},
        { 'data-pattern-property' : 'anglePattern',    html : 'Angle',       type : 'number',    value : 0 },
        { 'data-pattern-property' : 'offsetPattern',   html : 'Décalage',    type : 'number',    value : 0 },
        { 'data-pattern-property' : 'scalePattern',    html : 'Echelle',     type : 'number',    value : 1,  min : 0, step:0.5 },
        { 'data-pattern-property' : 'fillColorPattern',    html : 'Couleur du fond',     type : 'text',      value: ''}

    ];
    var patternPropertiesPart = $("<div>").addClass('patternPropertiesPart')
            .appendTo(popup);

    addPropertiesValue(properties);

  });

};

})(jQuery);
