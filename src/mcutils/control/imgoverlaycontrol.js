/*	Copyright (c) 2016 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/* global $ */
import {inherits as ol_inherits} from 'ol'
import ol_source_Vector from 'ol/source/Vector'

import ol_control_Overlay from 'ol-ext/control/Overlay'

/**
 * @classdesc An overlay to show images in a bottom bar.
 * @fires select
 * @constructor
 * @extends {ol.control.Overlay}
 * @param {Object=} options extends ol.control.OverlayOptions
 *  @param { ol.layer.Vector | Array<ol.layer.Vector> } options.layer source of features, default get all layers of the current map
 *  @param { function | undefined } options.filter a filter function that takes a layer and returns true if the layer contains images to show, default allways true
 *  @param { string | function } options.image an attribute name or a function that takes a feature and returns an image url
 *  @param { string | function } options.info an attribute name or a function that takes a feature and returns an info string
 *  @param { string | undefined } options.link color of the links, default no links
 *  @param { number } options.maxImage only the first images are displayed in the overlay, default 30
 */
var ol_control_ImgOverlay = function(options) {
  options = options || {};
  var self = this;

  options.hideOnClick = false;
  options.className = 'ol-image-overlay';
  ol_control_Overlay.call(this, options);
  this.show();

  if (options.layers && !(options.layers instanceof Array)) this.layers_ = [options.layers];
  else this.layers_ = options.layers;
  this.getImage = typeof (options.image) == 'function' ? options.image : function(f) {
    return f.get(options.image);
  };
  this.getInfo = typeof (options.info) == 'function' ? options.info : function(f) {
    return f.get(options.info);
  };
  this.max_ = options.maxImage || 30;
  this.color_ = options.link;
  this.filter_ = options.filter || function() {
    return true;
  };

  var screenX; 
  var speed; 
  var t; 
  function drag(e) {
    switch (e.type) {
      case 'mousemove':
      case 'touchmove': {
        var x = e.screenX
        || (e.originalEvent.touches && e.originalEvent.touches.length && e.originalEvent.touches[0].screenX)
        || (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length && e.originalEvent.changedTouches[0].screenX);
        var dx = x - screenX;
        var left = self.content_.position().left +dx;
        var w = $(self.element).outerWidth(true);
        var wc = self.content_.outerWidth(false);
        if (left>0 || wc<w) {
          left = 0;
        }
        self.content_.css('left', left);
        self.getMap().render();
        // Update
        screenX = x;
        speed = dx/(new Date()-t);
        t = new Date();
        break;
      }
      default: {
        self.content_.css({'transition': '', '-webkit-transition': ''});
        $(document).off('mouseup touchend touchcancel mousemove touchmove', drag);
        if (speed>0.01 || speed<-0.01) self.slide_(speed*150);
        speed=0;
        break;
      }
    }
  }
  this.content_ = $('<div>')
    .on('mousedown touchstart', function(e) {
      screenX = e.screenX
        || (e.originalEvent.touches && e.originalEvent.touches.length && e.originalEvent.touches[0].screenX)
        || (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length && e.originalEvent.changedTouches[0].screenX);
      self.content_.css({'transition': 'none', '-webkit-transition': 'none'});
      t = new Date();
      $(document).on('mouseup touchend touchcancel mousemove touchmove', drag);
    })
    .appendTo(this.element);
  $('<div>').addClass('arrow prev')
    .click(function() {
      self.slide_('left');
    })
    .appendTo(this.element);
  $('<div>').addClass('arrow next')
    .click(function() {
      self.slide_('right');
    })
    .appendTo(this.element);
};
ol_inherits(ol_control_ImgOverlay, ol_control_Overlay);

/**
 * Remove the control from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol_control_ImgOverlay.prototype.setMap = function(map) {
  if (this.listener_moveend) {
     ol.Observable.unByKey(this.listener_moveend);
     ol.Observable.unByKey(this.listener_postcompose);
     ol.Observable.unByKey(this.listener_change);
     
     this.listener_moveend = null;
     this.listener_postcompose = null;
     this.listener_change = null;
    
    // this.getMap().un('moveend', this.show_, this);
    // this.getMap().un('postcompose', this.drawLink_, this);
    // this.getMap().getLayerGroup().un('change', this.reset, this);
    this.context_ = null;
  }
  ol_control_Overlay.prototype.setMap.call(this, map);
  if (map) {
    this.listener_moveend = map.on('moveend', this.show_.bind(this));
    this.listener_postcompose = map.on('postcompose', this.drawLink_.bind(this));
    this.listener_change = map.getLayerGroup().on('change', this.reset.bind(this));
    this.showImages();
  }
};

ol_control_ImgOverlay.prototype.reset = function() {
  if (this.getMap()) {
    this.setCurrent_();
    this.show_(this.lastEvent_);
  }
};

/** Draw a link beetween image and current feature
* @param {ol.render.Event} e
*/
ol_control_ImgOverlay.prototype.drawLink_ = function(e) {
  var ctx = e.context;
  var ratio = e.frameState.pixelRatio;

  if (this.color_ && this.getCurrent_()) {
    var div = $(this.getCurrent_()).parent();
    var pos = div.offset();
    var posmap = $(this.getMap().getTargetElement()).offset();
    pos.top -= posmap.top; // - div.height()/2;
    pos.left += div.width()/2 - posmap.left;
    var geom = $(this.getCurrent_()).data('feature').getGeometry().getFirstCoordinate();
    geom = this.getMap().getPixelFromCoordinate(geom);
    ctx.save();
    ctx.fillStyle = this.color_;
    ctx.beginPath();
    if (geom[0]>pos.left) {
      ctx.moveTo((pos.left-5)*ratio, pos.top*ratio);
      ctx.lineTo((pos.left+5)*ratio, (pos.top+5)*ratio);
    } else {
      ctx.moveTo((pos.left-5)*ratio, (pos.top+5)*ratio);
      ctx.lineTo((pos.left+5)*ratio, pos.top*ratio);
    }
    ctx.lineTo(geom[0]*ratio, geom[1]*ratio);
    ctx.fill();
    ctx.restore();
  }
};

/** Set the current image
* @param {ol.Feature} f
*/
ol_control_ImgOverlay.prototype.setCurrent = function(f) {
  var self = this;
  var found = false;
  $('img', this.content_).each(function() {
    if ($(this).data('feature') === f) {
      self.setCurrent_(this);
      found = true;
    }
  });
  return found;
};

/** Set the current image
* @param {} DOM element
*/
ol_control_ImgOverlay.prototype.setCurrent_ = function(img) {
  this.img_ = img;
  this.getMap().render();
};

/** Get the current image
* @return {} DOM element
*/
ol_control_ImgOverlay.prototype.getCurrent_ = function() {
  return this.img_;
};

/** Display image in extent
*/
ol_control_ImgOverlay.prototype.showImages = function() {
  this.show_({frameState: {extent: this.getMap().getView().calculateExtent(this.getMap().getSize())}});
};

/** Draw slides
*/
ol_control_ImgOverlay.prototype.slide_ = function(d) {
  var left = this.content_.position().left;
  var w = $(this.element).outerWidth(true);
  var wc = this.content_.outerWidth(false);
  var children = this.content_.children();
  var lastchild = children[children.length-1];
  var lastchildWidth = lastchild.clientWidth;
  var lastchildLeft = lastchild.getBoundingClientRect().left + window.pageXOffset;

  if (d=='right') {
    if ( (lastchildLeft - lastchildWidth ) < wc ) {
      return;
    }
    left -= 3 * lastchildWidth;
    this.content_.position().left = left;
  } else if (d=='left') left += w/2;

  if (left>0 || wc<w) {
    left = 0;
  }
  this.content_.css('left', left);
  this.setCurrent_();
};

ol_control_ImgOverlay.prototype.getSources_ = function(layers) {
  var sources = [];
  for (var i=0, l; l=layers[i]; i++) {
    if (l.getVisible() && this.filter_(l)) {
      if (l.getLayers) {
        sources = sources.concat(this.getSources_(l.getLayers().getArray()));
      } else if (l.getSource && (l.getSource() instanceof ol_source_Vector)) {
        sources.push(l.getSource());
      }
    }
  }
  return sources;
};

/** Display features in the view
* @param {ol.Mapenvent} e
*/
ol_control_ImgOverlay.prototype.show_ = function(e) {
  var self = this;
  this.lastEvent_ = e;
  var sources;
  if (this.layers_) sources = this.getSources_(this.layers_);
  else {
    sources = this.getSources_(this.getMap().getLayers().getArray());
  }
  this.setCurrent_();
  var elt = $(this.content_).html('').css('left', 0);
  for (var k=0; k<sources.length; k++) {
    var features = sources[k].getFeaturesInExtent(e.frameState.extent);
    for (var i=0, f; f = features[i]; i++) {
      var img = this.getImage(f);
      if (img) {
          var info = this.getInfo(f);
          var div = $('<div>').appendTo(elt);
          $('<img>').attr('src', img)
            .on('load', function() {
              $(this).addClass('visible');
              // $(this).width(this.naturalWidth*$(this).height()/this.naturalHeight);
            })
            .on('dragstart', function(e) {
              e.preventDefault();
            })
            .data('feature', f)
            .click(function() {
              self.dispatchEvent({type: 'select',
              feature: $(this).data('feature'),
              img: this});
            })
            .mouseenter(function() {
              self.setCurrent_(this);
            })
            .mouseleave(function() {
              self.setCurrent_();
            })
            .appendTo(div);
          if (info) {
            $('<div>').addClass('info')
              .text(info)
              .appendTo(div);
          }
      }
      if (i> this.max_) return;
    }
  }
};

export default ol_control_ImgOverlay
