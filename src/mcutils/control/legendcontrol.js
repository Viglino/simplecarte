/*
  Copyright (c) 2015 Jean-Marc VIGLINO,
  released under the CeCILL license (http://www.cecill.info/).
*/
/* global $ */
import WebFont from 'webfontloader';

import {inherits as ol_inherits} from 'ol'
import ol_control_Control from 'ol/control/Control'
import ol_Collection from 'ol/Collection'
import ol_Map from 'ol/Map'
import ol_Feature from 'ol/Feature'
import ol_geom_GeometryCollection from 'ol/geom/GeometryCollection'
import ol_geom_Point from 'ol/geom/Point'
import ol_geom_LineString from 'ol/geom/LineString'
import ol_geom_Polygon from 'ol/geom/Polygon'
import ol_style_Style from 'ol/style/Style'
import ol_style_Stroke from 'ol/style/Stroke'
import {toContext as ol_render_toContext} from 'ol/render'

import ol_layer_VectorStyle from '../layer/ol.layer.vectorstyle'

/**
 * OpenLayers 3 Legend Control.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @fires select
 * @param {} options Control options.
 *  @param {ol.style|function} options.style default style
 *  @param {top-left|top-right|bottom-right|bottom-rigth} options.position
 *  @param {String} options.name legend title
 *  @param {Number} options.line-height line height, default 25
 *  @param {bold|null} options.font_weight
 *  @param {Number} options.symb_width width of symbols, default 20
 *  @param {boolean} options.editable add edit button, default false
 */
var ol_control_Legend = function(options) {
  if (!options) options={};
  var self = this;
  var element = $('<div>').addClass('ol-legend ol-unselectable ol-control');

  $('<button>').addClass('ol-legend')
    .click(function() {
      $(self.element).removeClass('ol-collapsed');
    })
    .attr('title', 'Legend')
    .appendTo(element);
  // Layer that contains the legend: don't use spatial index (reorder features in the leayer...)
  this.features_ = new ol_Collection();

  // Prevent multiple change
  var count = 0;
  function delayChange() {
    count--;
    if (count==0) {
      self.canvas.width = 0;
      self.changed();
    }
  }
  this.features_.on(['add', 'remove'], function() {
    count++;
    setTimeout(delayChange, 1);
  }, this);

  // Style function
  var style = options.style || [];
  this.stylefn = (typeof(style) == 'function') ? style : style.length ? function() {
    return style;
  } : function() {
    return [style];
  };

  // Create the control
  ol_control_Control.call(this, {element: element.get(0), target: options.target});

  this.canvas = document.createElement('canvas');
  if (options.target) {
      this.target = $(options.target);
  }
  $(element).append(this.canvas);
  // $(".options").append(this.canvas);

  $('<ul>').appendTo(element);

  this.setPosition(options.position || 'bottom-right');
  this.set('name', options.name || 'Legend');
  this.set('visible', true);

  this.style = {
    width: options.width || element.innerWidth() || 200,
    height: options.height || element.innerHeight() || 200,
    padding: (element.innerWidth()-element.width())/2 || 20,
    line_height: options['line-height'] || 25,
    title_weight: options.font_weight || 'bold',
    font_size: $('li', element).css('font-size') || '15px', // options.font_size || "15px",
    font_color: $('li', element).css('color') || '#000', // options.font_color || "#000",
    font_family: $('li', element).css('font-family') || 'Arial', // options.font_family || "Arial",
    symb_width: options.symb_width || 20,
  };

  this.onclick = options.onclick;
  this.onadd = options.onadd;
  this.set('editable', options.editable);
  this.drawInMap(options.drawInMap||false);

  this.on('change', (function() {
    if (this.getMap()) this.getMap().renderSync();
  }).bind(this));
  this.loadFonts();
};
ol_inherits(ol_control_Legend, ol_control_Control);

/**
 * Remove the control from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol_control_Legend.prototype.setMap = function(map) {
  if(this.listener_postcompose)
  {
    ol.Observable.unByKey(this.listener_postcompose);
    this.listener_postcompose = null;
  }
  ol_control_Control.prototype.setMap.call(this, map);

  // Get change (new layer added or removed)
  if (map)
  {
     this.listener_postcompose = map.on('postcompose', this.drawLegend_.bind(this));
  } 
};

/** Draw the legend inside the map's canvas
* @param {bool} b
*/
ol_control_Legend.prototype.drawInMap = function(b) {
  if (b===false) {
    $('canvas', this.element).css('visibility', '');
    this.inMap_ = false;
  } else {
    $('canvas', this.element).css('visibility', 'hidden');
    this.inMap_= true;
  }
  this.changed();
};

/** Is legend drawn inside the map's canvas
* @return {bool}
*/
ol_control_Legend.prototype.inMap = function() {
  return this.inMap_;
};

/**
 * Trigger when a legend item is clicked
 * @param {integer} index of the item.
 * @private
 */
ol_control_Legend.prototype.onclick_ = function(i, symbol) {	// Click an item of the legend
  if (this.onclick) {
    this.onclick.call(this, i, symbol);
  }
  this.dispatchEvent({type: 'select', symbol: symbol, item: i, feature: this.features_.item(i)});
  // console.log(i+" - "+this.features_[i].get('title'));
};

/**
 * Trigger when the |+] button is clicked
 * @private
 */
ol_control_Legend.prototype.addItem_ = function() {
  if (this.onadd) this.onadd();
};

/**
 * Return the features of the legend.
 * @return {ol.Collection} the feature collection
 * @api stable
 */
ol_control_Legend.prototype.getFeatures = function() {
  return this.features_;
};

/**
 * Return the ieme feature of the legend.
 * @return {ol.Feature} the feature
 * @api stable
 */
ol_control_Legend.prototype.getFeature = function(i) {
  return this.features_.item(i);
};

/**
 * Sets a value.
 * @param {string} key Key name.
 * @param {*} value Value.
 * @api stable
 */
ol_control_Legend.prototype.set = function(key, val) {
  ol_control_Control.prototype.set.call(this, key, val);
  this.canvas.width = 0;
  this.changed();
};

/**
 * Sets the position of the legend.
 * @param {string} the position : {top|bottom}-{left|right}.
 * @api stable
 */
ol_control_Legend.prototype.setPosition = function(pos) {
  this.set('position', pos);
  $(this.element).removeClass('ol-right ol-left ol-top ol-bottom');
  if (/right/.test(pos)) $(this.element).css({right: 0, left: 'auto'}).addClass('ol-right');
  else $(this.element).css({left: 0, right: 'auto'}).addClass('ol-left');
  if (/bottom/.test(pos)) $(this.element).css({bottom: 0, top: 'auto'}).addClass('ol-bottom');
  else $(this.element).css({top: 0, bottom: 'auto'}).addClass('ol-top');
};

/**
 * Set the visiblity of the legend.
 * @param {bool}
 * @api stable
 */
ol_control_Legend.prototype.setVisible = function(b) {
  if (b===false) {
    $(this.element).addClass('ol-hidden');
    this.set('visible', false);
  } else {
    $(this.element).removeClass('ol-hidden');
    this.set('visible', true);
  }
};

/**
 * Get the visiblity of the legend.
 * @return {bool}
 * @api stable
 */
ol_control_Legend.prototype.getVisible = function() {
  return this.get('visible');
};

/** Get legend image
*	@return {canvas}
*/
ol_control_Legend.prototype.getImage = function() {
  return this.canvas;
};

/**
 * Sets legend style.
 * @param {string} the position : {top|bottom}-{left|right}.
 * @api stable
 */
ol_control_Legend.prototype.setStyle = function(style) {
  for (var s in style) {
    switch (s) {
      case 'line-height':
      case 'font-color':
      case 'font-family':
      case 'font-size': {
        this.style[s.replace('-', '_')] = style[s];
        break;
      }
      case 'font-weight': {
        this.style.title_weight = style[s];
        break;
      }
      case 'width': {
        $(this.element).innerWidth(style.width);
        this.style.width = style.width;
        break;
      }
      default: break;
    }
  }
  this.canvas.width = 0;
  this.changed();
};

/**
 * Add a feature to the legend.
 * @param {ol.Feature} feature to add.
 * @api stable
 */
ol_control_Legend.prototype.addFeature = function(f) {
  this.features_.push(f);
};

/**
 * Add an objetc to the legend.
 * @param {Object} an object containing the feature's properties
 *		the title is display in the legend,
*		the geometry type is used to draw the chart.
* @api stable
*/
ol_control_Legend.prototype.addFeatureTitle = function(options) {
  if (!options) options = {};
  options.geometry = new ol_geom_GeometryCollection(new ol_geom_Point([0, 0]));
  this.features_.push(new ol_Feature(options));
};

/**
 * Add a point objetc to the legend.
 * @param {Object} an object containing the feature's properties
 *		the title is display in the legend,
* @api stable
*/
ol_control_Legend.prototype.addFeaturePoint = function(options, style) {
  if (!options) {
    options = {};
  }
  options.geometry = new ol_geom_Point([0, 0]);
  var f = new ol_Feature(options);
  if (options.ignStyle) f.setIgnStyle(style);
  else if (style) f.setStyle(style);
  this.features_.push(f);
};

/**
 * Add a LineString objetc to the legend.
 * @param {Object} an object containing the feature's properties
 *		the title is display in the legend,
* @api stable
*/
ol_control_Legend.prototype.addFeatureLine = function(options, style) {
  if (!options) {
    options = {};
  }
  options.geometry = new ol_geom_LineString([]);
  var f = new ol_Feature(options);
  if (options.ignStyle) f.setIgnStyle(style);
  else if (style) f.setStyle(style);
  this.features_.push(f);
};

/**
 * Add a polygon objetc to the legend.
 * @param {Object} an object containing the feature's properties
 *		the title is display in the legend,
* @api stable
*/
ol_control_Legend.prototype.addFeaturePolygon = function(options, style) {
  if (!options) {
    options = {};
  }
  options.geometry = new ol_geom_Polygon([]);
  var f = new ol_Feature(options);
  if (options.ignStyle) f.setIgnStyle(style);
  else if (style) f.setStyle(style);
  this.features_.push(f);
};

/**
 * Change the position of an item in the legend.
 * @param {integer} item position.
 * @api stable
 */
ol_control_Legend.prototype.moveup = function(pos) {
  if (pos) {
    var f = this.features_.removeAt(pos);
    this.features_.insertAt(pos-1, f);
  }
};
/**
 * Change the position of an item in the legend.
 * @param {integer} item position.
 * @api stable
 */
ol_control_Legend.prototype.movedown = function(pos) {
  var f = this.features_.removeAt(pos);
  this.features_.insertAt(pos+1, f);
};
/**
 * Remove an item in the legend.
 * @param {integer} item position.
 * @api stable
 */
ol_control_Legend.prototype.del = function(pos) {
  this.features_.removeAt(pos);
};

/** @private
*/
ol_control_Legend.prototype.drawLegend_ = function(e) {
  var self = this;
  var ctx = e.context;
  var canvas = ctx.canvas;

  // Symbol size
  var symbWidth = 30;
  var symbHeight2 = 10;
  var spacing = 10;

  // Retina device
  var ratio = e.frameState.pixelRatio;

  var cwidth = this.style.width*ratio;
  var cheight = (this.style.line_height*(this.features_.getLength()+1) + this.style.padding) *ratio;

  // Calculate new image
  if (!this.canvas || this.canvas.width != cwidth || this.canvas.height != cheight) {	// Save for refresh
    var i, k, s, text, nb, f;
    var ctx2 = this.canvas.getContext('2d');

    // Current vector context
    var vc = ol_render_toContext(ctx2, {size: [cwidth/ratio, cheight/ratio]});

    ctx2.fillStyle = '#fff';
    ctx2.fillRect(0, 0, cwidth, cheight);

    // BUG > force line with butt caps
    vc.setStyle(new ol_style_Style({stroke: new ol_style_Stroke({width: 1, color: 'transparent'})}));
    ctx2.lineCap = 'butt';
    vc.drawGeometry(new ol_geom_LineString([[0, 0], [0, 0]]));

    var pos = [this.style.padding, this.style.padding/2+this.style.line_height/2];
    // Title
    var title = this.get('title') || this.get('name');
    if (title) {
      ctx2.save();
      ctx2.font = this.style.title_weight+' '+this.style.font_size+ ' '+this.style.font_family;
      ctx2.textAlign = 'center';
      ctx2.fillStyle = this.style.font_color;
      ctx2.scale(ratio, ratio);
      text = title.split('\n');
      nb = Math.min(text.length, 2);
      for (i=0; i<nb; i++) {
          if (nb==1) ctx2.textBaseline = 'middle';
          else {
            if (i==0) ctx2.textBaseline = 'bottom';
            else ctx2.textBaseline = 'top';
          }
          ctx2.fillText(text[i], cwidth/ratio/2, pos[1]);
      }
      ctx2.restore();
    }

    var editable = this.get('editable');

    // Draw features
    var pt;

    // Draw Features
    var features = this.features_;
    for (k=0; f=features.item(k); k++) {
      var g = f.getGeometry();
      var collection = false;
      pos[1] += self.style.line_height;

      var style = f.getStyle() || self.stylefn(f);
      if (!style.length) style = [style];

      switch (g.getType()) {
        case 'Point':
          for (i=0; s=style[i]; i++) {
            // Bug name sur les symboles
            if (s.getText) {
              if (s.getText()) s.getText().setText(f.get('text') || "");
            }
                
            var imgs = s.getImage();
            // OL < v4.3 : setImageStyle don't check retina
            var sc = 0;
            if (imgs && !ol_Map.prototype.getFeaturesAtPixel) {
              sc = imgs.getScale();
              imgs.setScale(sc*ratio);
            }
            pt = [pos[0]+symbWidth/2, pos[1]];
            // OL3 > v3.14
            if (vc.setStyle) {
              vc.setStyle(s);
              vc.drawGeometry(new ol_geom_Point(pt));
            }
            // OL3 < v3.14
            else {
              if (imgs) vc.setImageStyle(imgs);
              vc.setTextStyle(s.getText());
              vc.drawPointGeometry(new ol_geom_Point(pt));
            }
            if (sc) imgs.setScale(sc);
          }
          break;
        case 'LineString':
          for (i=0; s=style[i]; i++) {
            // Bug name sur les symboles
            if(s.getText) {
              if(s.getText()) s.getText().setText("");
            }

            pt = [[pos[0], pos[1]], [pos[0]+symbWidth, pos[1]]];
            if (vc.setStyle) {	// ctx2.lineCap="butt";
              ctx2.save();
              ctx2.beginPath();
              ctx2.rect(pos[0]*ratio, 0, symbWidth*ratio, cheight);
              ctx2.clip();
              vc.setStyle(s);
              vc.drawGeometry(new ol_geom_LineString(pt));
              ctx2.restore();
              // Reset style (draw transparent line, because restore)
              vc.setStyle(new ol_style_Style({stroke: new ol_style_Stroke({width: 0, color: 'rgba(0,0,0,0)'})}));
              vc.drawGeometry(new ol_geom_LineString(pt));
            } else {
              vc.setFillStrokeStyle(null, s.getStroke());
              vc.setTextStyle(s.getText());
              // ctx2.lineCap="butt";
              ctx2.save();
              ctx2.rect(50, 20, 200, 120);
              ctx2.clip();
              vc.drawLineStringGeometry(new ol_geom_LineString(pt));
              ctx2.restore();
            }
          }
          break;
        case 'Polygon':
          for (i=0; s=style[i]; i++) {
            // Bug name sur les symboles
            if(s.getText) {
              if(s.getText()) s.getText().setText("");
            }
            pt = [
              [pos[0], pos[1]-symbHeight2], [pos[0]+symbWidth, pos[1]-symbHeight2],
              [pos[0]+symbWidth, pos[1]+symbHeight2], [pos[0], pos[1]+symbHeight2],
              [pos[0], pos[1]-symbHeight2],
            ];
            if (vc.setStyle) {
              vc.setStyle(s);
              vc.drawGeometry(new ol_geom_Polygon([pt]));
            } else {
              vc.setFillStrokeStyle(s.getFill(), s.getStroke());
              vc.setTextStyle(s.getText());
              vc.drawPolygonGeometry(new ol_geom_Polygon([pt]));
            }
          }
          break;
        default:
          collection = true;
          break;
      }
      // Draw label
      ctx2.save();
      text = (f.get('title')||'').split('\n');
      nb = Math.min(text.length, 2);
      ctx2.textAlign = 'left';
      ctx2.scale(ratio, ratio);
      ctx2.font = (collection ? self.style.title_weight+' ':'') + self.style.font_size +' '+ self.style.font_family;
      ctx2.fillStyle = self.style.font_color;
      for (i=0; i<nb; i++) {
        if (nb==1) ctx2.textBaseline = 'middle';
        else {
          if (i==0) ctx2.textBaseline = 'bottom';
          else ctx2.textBaseline = 'top';
        }
        ctx2.fillText(text[i], pos[0]+(collection?0:(symbWidth+spacing)), pos[1]);
      }
      ctx2.restore();
    }

    // Draw the control div
    if (this.drawRevision_ != this.getRevision() || $(this.element).innerHeight() != Math.round(cheight/ratio)) {
      this.drawRevision_ = this.getRevision();
      $(this.element).height(Math.round(cheight/ratio));
      // Draw controls
      $('li', this.element).remove();
      var ul = $('ul', this.element);
      var close = $('<button>').addClass('ol-close')
        .click(function() {
          $(self.element).addClass('ol-collapsed');
        });
      var li = $('<li>').height(this.style.line_height)
        .append(close)
        .appendTo(ul);
      if (editable && this.onadd) {
        var ediv = $('<div>').addClass('ol-button').appendTo(li);
        $('<div>').addClass('ol-button-plus').appendTo(ediv)
          .on('click', function(e) {
            self.addItem_(); e.stopPropagation();
          });
      }

      // Add an item to the control
      for (k=0; f=features.item(k); k++) {
        li = $('<li>').height(self.style.line_height)
          .addClass('ol-item')
          .data('item', k)
          .on('click', function() {
            self.onclick_($(this).data('item'));
          })
          .appendTo(ul);
        // Symbol div
        if (f.getGeometry().getType() != 'GeometryCollection') {
          $('<div>').addClass('ol-button-symb').appendTo(li)
            .on('click', function(e) {
              self.onclick_($(this).parent().data('item'), true); e.stopPropagation();
            });
        }
        // Editable
        if (editable) {
          var ed = $('<div>').addClass('ol-button').appendTo(li);
          $('<div>').addClass('ol-button-up').appendTo(ed)
            .on('click', function(e) {
              self.moveup($(this).parent().parent().data('item')); e.stopPropagation();
            });
          $('<div>').addClass('ol-button-down').appendTo(ed)
            .on('click', function(e) {
              self.movedown($(this).parent().parent().data('item')); e.stopPropagation();
            });
          $('<div>').addClass('ol-button-del').appendTo(ed)
            .on('click', function(e) {
              self.del($(this).parent().parent().data('item')); e.stopPropagation();
            });
        }
      }
    }
  }

  // Draw outside
  if (!this.inMap_ || this.target || !this.get('visible')) return;

  // Legend position
  var r = [0, 0];
  if (/right/.test(this.get('position'))) r[0] = Math.max(0, canvas.width - cwidth);
  if (/bottom/.test(this.get('position'))) r[1] = Math.max(0, canvas.height - cheight);
  ctx.drawImage(this.canvas, 0, 0, cwidth, cheight, Math.round(r[0]), Math.round(r[1]), cwidth, cheight);
};

/** Chargement des fonts de Ma carte
* @param {function|undefined} onLoadFn function called when a font is loaded
*/
ol_control_Legend.prototype.loadFonts = function(onLoadFn) {
  if (!window.WebFont) {
    console.error('WebFont lib not loaded...');
    return;
  }
  var self = this;
  WebFont.load({
    custom: {
      families: ['FontAwesome', 'fontign', 'fontmaki', 'fontsjjb', 'pirate', 'evilz'],
      testStrings: {'FontAwesome': '\uf240', 'fontign': '\ue800', 'fontmaki': '\ue800',
          'fontsjjb': '\ue800', 'pirate': '\ue801', 'evilz': '\ue800'},
    },
    classes: false,
    // Clear the cache and force redraw when fonts are loaded
    fontactive: function(f) {
      setTimeout(function() {
        self.getFeatures().forEach(function(f) {
          f.setStyle( ol_layer_VectorStyle.getStyleFn()(f) );
        });
        self.canvas.width = 0;
        self.changed();
        if (onLoadFn) onLoadFn({type: 'loadfont', font: f});
      });
      // console.log("Loading font: "+f);
    },
    // oops
    fontinactive: function(/* f */) {	
      // console.error ("Can't load font: "+f);
    },
  });
};

export default ol_control_Legend
