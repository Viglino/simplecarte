/** Copyright (c) IGN-2016 Jean-Marc VIGLINO,
 *
 *	ol_layer_Statistic : the layer is composed of a vector layer and a heatmap layer
 *
 * @require
 */
/* global $ */
import {inherits as ol_inherits} from 'ol'
import ol_geom_SimpleGeometry from 'ol/geom/SimpleGeometry'
import ol_geom_Point from 'ol/geom/Point'
import ol_geom_LineString from 'ol/geom/LineString'
import ol_geom_Polygon from 'ol/geom/Polygon'
import ol_Feature from 'ol/Feature'
import ol_source_Vector from 'ol/source/Vector'
import ol_layer_Vector from 'ol/layer/Vector'
import ol_layer_Heatmap from 'ol/layer/Heatmap'
import ol_layer_Group from 'ol/layer/Group'
import ol_style_Style from 'ol/style/Style'
import ol_style_Fill from 'ol/style/Fill'
import ol_style_Stroke from 'ol/style/Stroke'
import ol_style_Circle from 'ol/style/Stroke'
import {asString as ol_color_asString} from 'ol/color'

import ol_filter_Composite from 'ol-ext/filter/Composite'
import ol_style_Chart from 'ol-ext/style/Chart'
import ol_style_FontSymbol from 'ol-ext/style/FontSymbol'

import chroma from 'chroma-js'

import ol_layer_VectorStyle from './ol.layer.vectorstyle'

/** Recherche d'un point interieur a une geometrie (1 seul, celui du plus gros)
 */
ol_geom_SimpleGeometry.prototype.getInteriorPoint = function() {
  if (!this.getType) {
    return new ol_geom_Point([0, 0]);
  }
  switch (this.getType()) {	// Get coordinate of the largest polygon
    case 'MultiPolygon': {
      var p = this.getPolygons();
      if (!p.length) {
        return this;
      }
      var max = 0;
      var g;
      for (var i = 0; i < p.length; i++) {
        var area = p[i].getArea();
        if (area > max) {
          max = area;
          g = p[i];
        }
      }
      return g.getInteriorPoint();
    }
    case 'Polygon':
      return this.getInteriorPoint();
    case 'Point':
      return this;
    default:
      return new ol_geom_Point(this.getFirstCoordinate());
  }
};

/**
 * Layer pour l'affichage des statistiques
 * Le layer contient 2 calques : un calque vecteur et un calque heatmap
 * @constructor
 * @extends {ol.layer.Group}
 * @param {olx.layer.Statistic} options
 *	@param {ol.source.Vector|undefined} options.source source a utiliser
 *	@param {bool} options.vector pour forcer un layer vector plutot qu'un ImageVector
 *	@param {ol.Control.Legend} options.legendCtrl legende pour l'affichage
 *	@param {} options.typeGeom Liste de type de geometrie utilise
 *  @param {function} onsave callback on click on save button, if none no save button is shown
 */
var ol_layer_Statistic = function(options) {
  options = options || {};
  var self = this;

  this.vectorSource = options.source || new ol_source_Vector();
    this.onsave = (typeof (options.onsave) == "function" ? options.onsave: null);
  // Type de geometrie du layer
  this.typeGeom = options.typeGeom || {};
  var clearsource = this.vectorSource.clear;
  this.vectorSource.clear = function() {
    self.typeGeom = {};
    clearsource.call(this);
  };
  this.vectorSource.on('addfeature', (function(e) {
    this.typeGeom[e.feature.getGeometry().getType()] = true;
  }).bind(this));
     // Handle membership
  this.vectorSource.on('addfeature', (function(e) {
    e.feature._layer = this;
  }).bind(this));
  
  var features = this.vectorSource.getFeatures();
  for (var i = 0, f; f = features[i]; i++) {
    f._layer = this;
    this.typeGeom[f.getGeometry().getType()] = true;
  }

  this.vectorSource.on('removefeature', (function(e) {
    delete e.feature._layer;
  }).bind(this));
  // Layer vector
  this.layerStat = new ol_layer_Vector({
    source: this.vectorSource,
    renderMode: options.vector ? 'vector' : 'image',
    displayInLayerSwitcher: false,
  });

  // Heatmap
  this.layerHeat = new ol_layer_Heatmap({
    source: this.vectorSource,
    visible: false,
    displayInLayerSwitcher: false,
    radius: 5,
    blur: 15,
  });

  // Legende
  this.legendCtrl = options.legendCtrl;

  // Create layer
  options.layers = [this.layerStat, this.layerHeat];
  ol_layer_Group.call(this, options);

  // Anciennes stats
  this.stat = options.stat || {};

  this.filter = new ol_filter_Composite({});
  this.layerStat.addFilter(this.filter);
  this.layerHeat.addFilter(this.filter);

  // Style par defaut pour le layer
  this.defaultStyle = {
    fill: new ol_style_Fill({color: 'rgba(255,255,255,0.4)'}),
    stroke: new ol_style_Stroke({color: '#3399CC', width: 1.25}),
    whiteStroke: new ol_style_Stroke({color: '#fff', width: 1.25}),
  };
  // Default style
  this.defaultStyle.style = new ol_style_Style({
    image: new ol_style_Circle({
      fill: this.defaultStyle.fill,
      stroke: this.defaultStyle.stroke,
      radius: 5,
    }),
    fill: this.defaultStyle.fill,
    stroke: this.defaultStyle.stroke,
  });
  // default area style
  this.defaultStyle.area = new ol_style_Style({
    fill: this.defaultStyle.fill,
    stroke: this.defaultStyle.stroke,
  });
};
ol_inherits(ol_layer_Statistic, ol_layer_Group);

/** Get popupcontent for a feature
* @param {ol.Feature|undefined} f the feature to get information on, if undefined get the popupcontent of the layer
* @return {html} popupcontent
*/
ol_layer_Statistic.prototype.getPopupContent = function(f) {
  if (f) return f.getPopupContent( this._popupContent || {} );
  return this._popupContent || {};
};
/** Set popupcontent for a feature
* @param  default set the poupcontent of the layer
* @param {string} content
*/
ol_layer_Statistic.prototype.setPopupContent = function(content) {
  if (!content || content instanceof Array) this._popupContent = {};
  else this._popupContent = content;
};


/** Get vector source
 *	@return ol.source.Vector
 */
ol_layer_Statistic.prototype.getSource = function() {
  return this.vectorSource;
};

/** Set composite operation
 * @param {boolean} set or not
 */
ol_layer_Statistic.prototype.setComposite = function(b) {
  if (b) {
    this.filter.setOperation('multiply');
  } else {
    this.filter.setOperation();
  }
};

/** Get layer type geom
 *	@param {Point|Polygon|Line} type of geom
 *	@return {bool}
 */
ol_layer_Statistic.prototype.isGeom = function(type) {
  switch (type) {
    case 'Point':
      return this.typeGeom.Point || this.typeGeom.MultiPoint;
    case 'Polygon':
      return this.typeGeom.Polygon || this.typeGeom.MultiPolygon;
    case 'Line':
      return this.typeGeom.LineString || this.typeGeom.MultiLineString;
    default:
      return false;
  }
};

/** Fonction de style pour les objets suivant une statistique donnee
 *	@param {statOptions} stat
 *	@return {function} ol.style.function
 *	@private
 */
ol_layer_Statistic.prototype.getStyle = function(stat) {
  var self = this;

  if (!stat) {
    stat = {};
  }

  // Point interieur a une geometrie (en cache sur la feature)
  function getInteriorPoint(feature) {
    var g = feature.get('interior');
    if (!g) {
      g = feature.getGeometry().getInteriorPoint();
      feature.set('interior', g);
    }
    return g;
  }

  var styleCache = {};
  window.styleCache = styleCache;

  var isPolygon = this.isGeom('Polygon');
  var isPoint = this.isGeom('Point');
  var isLine = this.isGeom('Line');

  // Fonction de style
  return function(feature /*, res */) {
    var r, style, data, color, fill, stroke;
    if (stat.color || stat.colors) {
      var col = stat.cols[0];
      switch (stat.typeMap) {
        case 'sectoriel': {
          r = stat.radius(feature.get('_sum'));
          if (!r) {
            return [self.defaultStyle.style];
          }
          var index = r + '-' + feature.get('_data').join('-');
          style = styleCache[index];
          if (!style) {
            style = styleCache[index] = stat.stroke ? [self.defaultStyle.area] : [];
            style.push(new ol_style_Style({
              image: new ol_style_Chart({
                type: stat.chartType,
                radius: r,
                // offsetY: -20,
                data: feature.get('_data') || [],
                colors: stat.colors,
                stroke: new ol_style_Stroke({
                  color: stat.colors == 'neon' ? '#000' : '#fff',
                  width: 2,
                }),
              }),
              geometry: getInteriorPoint(feature),
            }));
          }
          return style;
        }
        case 'symbol': {
          data = feature.get(col);
          color = stat.color(data).rgb();
          color.push(stat.alpha);
          r = stat.radius(data).toFixed(2);
          style = styleCache[color + '-' + r];
          if (!style) {	// Graphe Polygones
            if (isPolygon || isPoint) {
              r = stat.radius(data);
              fill = new ol_style_Fill({color: color});
              style = styleCache[color] = stat.stroke ? [self.defaultStyle.area] : [];
              var image;
              if (!stat.symbol || stat.symbol == 'ign-form-rond') {
                image = new ol_style_Circle({
                  fill: fill,
                  stroke: stat.stroke ? self.defaultStyle.stroke : null,
                  radius: r,
                });
              } else {
                stroke = self.defaultStyle.whiteStroke;
                image = new ol_style_FontSymbol({
                  glyph: stat.symbol,
                  fill: fill,
                  stroke: stroke,
                  radius: r,
                });
                feature.setIgnStyle({
                  pointRadius: r,
                  pointGlyph: stat.symbol,
                  pointColor: stroke ? ol_color_asString(stroke.getColor()) : null,
                  symbolColor: fill ? ol_color_asString(fill.getColor()) : 'rgba(0,0,0,0)',
                });
              }
              style.push(new ol_style_Style({
                image: image,
                zIndex: stat.rmax - r,
                geometry: getInteriorPoint,
              }));
            }
            // Graphe de lignes
            else if (isLine) {
              style = styleCache[color] = [
                new ol_style_Style({
                  stroke: new ol_style_Stroke({
                    width: stat.radius(data),
                    color: color,
                  }),
                }),
              ];
            } else {
              style = [self.defaultStyle.style];
            }
          }
          return style;
        }
        default:{
          data = feature.get(col);
          color = stat.color(data).rgb();
          style = styleCache[color];
          if (!style) {	// Graphe Polygones
            if (isPolygon || isPoint) {
              fill = new ol_style_Fill({color: color});
              stroke = stat.stroke ? new ol_style_Stroke({color: '#3399CC', width: 1.25}) : null;
              style = styleCache[color] = [
                new ol_style_Style({
                  image: new ol_style_Circle({
                    fill: fill,
                    stroke: stroke,
                    radius: 5,
                  }),
                  fill: fill,
                  stroke: stroke,
                }),
              ];
            }
            // Graphe de lignes
            else if (isLine) {
              style = styleCache[color] = [
                new ol_style_Style({
                  stroke: new ol_style_Stroke({
                    color: color,
                    width: 3,
                  }),
                }),
              ];
            } else {
              style = [self.defaultStyle.style];
            }
          }
          return style;
        }
      }
    } else {
      return [self.defaultStyle.style];
    }
  };
};

/** Recupere les param ayant servi a calculer la statistique
 * @return {stat} parametres de statistique
 * @API
 */
ol_layer_Statistic.prototype.getStatistic = function() {
   return this._stat;
};

/** Calcul des statistiques pour le layer
 * @param {stat} stat statistique
 * @param {bool} calcClasses recalule des classes en mode manuel
 * @return {bool} true si la statistique est possible
 * @API
 */
ol_layer_Statistic.prototype.setStatistic = function(stat, calcClasses) {	// Sauvegarde pour rejeu
  this._stat = $.extend(true, {}, stat);
  // Couche a afficher
  this.layerHeat.setVisible(stat.typeMap == 'heatmap');
  this.layerStat.setVisible(stat.typeMap != 'heatmap');

  // Il faut des points pour afficher une heatmap
  if (stat.typeMap == 'heatmap' && !this.typeGeom.Point) {
    return false;
  }

  // Valeurs min et max
  var min = Infinity; var max = 0;

  // Initialisation
  //	stat.limits = null;
  stat.values = {att: stat.cols[0], length: 0, val: {}};
  var features = this.vectorSource.getFeatures();
  stat.features = features;

  // Calcul deja fait ?
  function isEqual(stat0, stat) {
  if (stat0.typeMap !== stat.typeMap
    || stat0.mode !== stat.mode
    || stat0.nbClass !== stat.nbClass
    || stat0.cols != stat.cols.length) {
    return false;
  }
  for (var i = 0; i < stat0.length; i++) {
    if (this.stat.cols[0] !== stat.cols[0]) {
      return false;
    }
  }
  return true;
  }

  // Repartition par classes
  if (!isEqual(this.stat, stat)) {
    var i, k, f, tab, val;
    switch (stat.typeMap) {	// Categorie > Calcul des valeurs
      case 'categorie': {
        if (stat.cols.length) {
          var col = stat.cols[0];
          if (col != -1) {
            tab = {};
            for (i=0; f=features[i]; i++) {
              tab[f.get(col)] = true;
            }
            // Trier par valeur
            var keys = (Object.keys(tab)).sort();
            var nb = keys.length;
            tab = {};
            for (k=0; k<nb; k++) {
              tab[keys[k]] = k;
            }
            // Les valeurs (triees)
            stat.values = {att: col, length: nb, val: tab};
          }
        }
        stat.limits = [];
        break;
      }
      // Sectoriel > calcul des min, max + data
      case 'sectoriel':
      {
        var cols = stat.cols;
        for (i = 0; i < features.length; i++) {
          var d = [];
          var s = 0;
          for (k = 0; k < cols.length; k++) {
            var dk = Number(features[i].get(cols[k]));
            s += dk;
            d.push(dk);
          }
          max = Math.max(max, s);
          min = Math.min(min, s);
          features[i].set('_data', d);
          features[i].set('_sum', s);
        }
        stat.limits = [];
        break;
      }
      // Calcul min et max + classification
      case 'heatmap':
      default: {
        tab = [];
        for (i = 0; i < features.length; i++) {
          var data = features[i].get(stat.cols[0]);
          if (!data) {
            continue;
          }

          val = Number(data);
          tab.push(val);
          features[i].set('_sum');
          features[i].set('_data');
          max = Math.max(max, val);
          min = Math.min(min, val);
        }

        // Classification > http://gka.github.io/chroma.js/#chroma-limits
        // q = quantile, k = k-means, e = equidistance, c = custom
        switch (stat.mode) {	// Custom classification, stat.classe gère le fait que l'on modifie ou non le nombre de classe
          case 'c': {
            if (calcClasses) {
              stat.limits = chroma.limits(tab, 'e', stat.nbClass || 5);
            }
            break;           
          }
          // Calcul de la classification
          case 'q':
          case 'k':
          case 'e': {
            stat.limits = chroma.limits(tab, stat.mode, stat.nbClass || 5);
            break;
          }
          default: {
            stat.mode = 'q';
            stat.limits = chroma.limits(tab, stat.mode, stat.nbClass || 5);
            break;
          }
        }
        break;
      }
    }
    this.stat = {
      typeMap: stat.typeMap,
      mode: stat.mode,
      nbClass: stat.nbClass,
      cols: $.extend([], stat.cols),
      min: min,
      max: max,
      limits: stat.limits,
      values: stat.values,
    };
    stat.min = min;
    stat.max = max;
  } else {
    stat.min = this.stat.min;
    stat.max = this.stat.max;
    stat.limits = this.stat.limits;
    stat.values = this.stat.values;
  }
  this.stat.brewerColors = stat.brewerColors;

  if (this.stat.values.length > 100) {
    return false;
  }

  // Fonction de repartition couleurs / classes
  var colors;
  switch (stat.typeMap) {
    case 'sectoriel': {
      if (stat.brewer) {
        stat.brewer.setClass(stat.cols.length);
        colors = stat.brewer.getColors();
      } else {
        colors = stat.brewerColors;
      }
      stat.colors = colors;
      break;
    }
    case 'categorie': {
      if (stat.brewer) {
        stat.brewer.setClass(stat.values.length);
        colors = stat.brewer.getColors();
      } else {
        colors = stat.brewerColors;
      }
      if (stat.values.length) {
        stat.color = function(v) {
            return chroma(colors[stat.values.val[v]]);
        };
      } else {
        stat.color = function() {
            return chroma('#ccc');
        };
      }
      break;
    }
    default: {
      if (stat.limits && stat.limits.length) {
        if (stat.brewer) {
          stat.brewer.setClass(stat.limits.length - 1);
          colors = stat.brewer.getColors();
        } else {
          colors = stat.brewerColors;
        }
        stat.color = chroma.scale(colors).classes(stat.limits);
      } else {
        stat.color = function() {
          return chroma('#ccc');
        };
      }
      break;
    }
  }

  // Force redraw
  this.vectorSource.changed();

  // Fonction de repartition / rayon
  switch (stat.typeMap) {
    case 'heatmap': {
      this.layerHeat.setBlur(stat.hblur);
      this.layerHeat.setRadius(stat.hradius);
      for (i = 0; i < features.length; i++) {
        val = Number(features[i].get(stat.cols[0]));
        if (min < 0) {
          features[i].set('weight', (val - min) / (max - min));
        } else {
          features[i].set('weight', val / max);
        }
      }
      break;
    }
    case 'sectoriel': {
      var smin = Math.sqrt(min);
      var smax = Math.sqrt(max);
      if (stat.rmin < 0) {
        stat.radius = function(v) {
          var r = stat.rmax * Math.sqrt(v) / smax;
          return r > 0 ? r : 0;
        };
      } else {
        stat.radius = function(v) {
          return stat.rmin + (Math.sqrt(v) - smin) / (smax - smin) * (stat.rmax - stat.rmin);
        };
      }
      break;
    }
    case 'categorie': {
      stat.radius = function() {
        return 5;
      };
      break;
    }
    default: {
      if (stat.rmin < 0) {
        stat.radius = function(v) {
          var r = stat.rmax * v / max;
          return r > 0 ? r : 0;
        };
      } else {
        stat.radius = function(v) {
          var l = stat.limits.length;
          for (var i = 1; i < l; i++) {
            if (v < stat.limits[i]) {
              break;
            }
          }
          return stat.rmin + i * (stat.rmax - stat.rmin) / l;
        };
      }
      break;
    }
  }

  // Calcul de la fonction de style
  if (stat.typeMap != 'heatmap') {
    var styleFn = this.getStyle(stat);
    if (this.layerStat.getSource().setStyle) {
      this.layerStat.getSource().setStyle(styleFn);
    } else {
      this.layerStat.setStyle(styleFn);
    }
  }

  // Affichage de la legende
  try {
    this.drawlegend(stat, styleFn);
  } catch (e) {
    if (console.error) {
      console.error(e);
    }
    return false;
  }

  return true;
};

/** Calcul de la legende en fonction d'une statistique
 * @private
 */
ol_layer_Statistic.prototype.drawlegend = function(stat, styleFn) {	// Rien a faire !
  if (!this.legendCtrl) {
  return;
  }
  var legendCtrl = this.legendCtrl;

  // On vide la légende
  legendCtrl.getFeatures().clear();

  function getName(n) {
    var max = 25;
    // Calcul de la largeur
    var l = legendCtrl.style.width;
    var fs = parseInt(legendCtrl.style.font_size);
    max = l / fs * 2;

    if (n.length < max) {
      return n;
    }
    var t = n.split(' ');
    n = '';
    var i = 0;
    while (i < t.length && n.length + t[i].length < max) {
      n += (n.length ? ' ' : '') + t[i];
      i++;
    }
    n += '\n';
    while (i < t.length && n.length + t[i].length < 2 * max) {
      n += (n.length ? ' ' : '') + t[i];
      i++;
    }
    if (i < t.length) {
      n += '(...)';
    }
    return n;
  }

  var f, d;
  switch (stat.typeMap) {
    case 'choroplethe':
    case 'symbol': {
      if (stat.cols[0] < 0) {
        break;
      }
      legendCtrl.set('name', getName(stat.cols[0]));
      for (var i = stat.limits.length - 1; i > 0; i--) {
        d = {};
        d[stat.cols[0]] = (stat.limits[i - 1] + stat.limits[i]) / 2;
        if (this.isGeom('Polygon') || this.isGeom('Point') || !this.isGeom('Line')) {
          if (stat.typeMap == 'symbol') {
            f = new ol_Feature(new ol_geom_Point([0,0]));
          } else {
            f = new ol_Feature(new ol_geom_Polygon([[[0, 0], [0, 0], [0, 0],
              [0, 0], [0, 0]]]));
          }
        } else {
          f = new ol_Feature(new ol_geom_LineString([[0,0],[0,0]]));
        }
        f.setProperties($.extend({
          title: parseFloat(stat.limits[i - 1].toFixed(2)) + ' - ' + parseFloat(stat.limits[i].toFixed(2))
        }, d));
        f.classe = i - 1;
        f.setStyle(styleFn(f));
        legendCtrl.addFeature(f);
      }
      break;
    }
    case 'categorie': {
      legendCtrl.set('name', getName(stat.cols[0]));
      for (i in stat.values.val) {
        if (this.isGeom('Polygon') || this.isGeom('Point') || !this.isGeom('Line')) {
            if (stat.typeMap == 'symbol') {
              f = new ol_Feature(new ol_geom_Point([0,0]));
            } else {
              f = new ol_Feature(new ol_geom_Polygon([[[0, 0], [0, 0], [0, 0],
              [0, 0], [0, 0]]]));
            }
        } else {
            f = new ol_Feature(new ol_geom_LineString([[0,0],[0,0]]));
        }
        d = {title: i};
        d[stat.cols[0]] = i;
        f.setProperties(d);
        f.setStyle(styleFn(f));
        legendCtrl.addFeature(f);
        f.classe = stat.values.val[i];
      }
      break;
    }
    case 'sectoriel': {
      // var colors = ol.style.Chart.colors[stat.colors];
      legendCtrl.set('name', 'Légende');
      var colors = stat.colors;
      for (i = 0; i < stat.cols.length; i++) {
        f = new ol_Feature(new ol_geom_Polygon([[[0, 0], [0, 0], [0, 0],
              [0, 0], [0, 0]]]));
        f.setProperties({
          title: stat.cols[i],
        });
        f.setStyle(new ol_style_Style({
          stroke: this.defaultStyle.stroke,
          fill: new ol_style_Fill({color: colors[i]}),
        }));
        legendCtrl.addFeature(f);
        f.classe = i;
      }
      break;
    }
    default:
        break;
  }
};

/** Renvoie un ol.layer.VectorStyle ou false si inmpossible (heatmap, sectoriel)
 * @return {ol.layer.VectorStyle|false} 
 */
ol_layer_Statistic.prototype.getVectorStyleLayer = function() {
  var stat = this.getStatistic();
  if (stat.typeMap === 'heatmap') return false
  if (stat.typeMap === 'sectoriel') return false
  if (stat.typeMap === 'symbol') return false

  var source = new ol_source_Vector();
  var features = this.getSource().getFeatures();
  var styleFn = this.getLayers().item(0).getStyleFunction();
  for (var k=0, f; f=features[k]; k++) {
    var style = styleFn(f);
    var ignStyle = {};
    if (style[0].getFill()) {
      ignStyle.fillColor = ol_color_asString(style[0].getFill().getColor());
    }
    if (style[0].getStroke()) {
      ignStyle.strokeColor = ol_color_asString(style[0].getStroke().getColor());
      ignStyle.strokeWidth = style[0].getStroke().getWidth();
    } else {
      ignStyle.strokeColor = 'rgba(255,255,255,0)';
    }
    var geom = f.getGeometry();
    switch (geom.getType()) {
      case 'MultiPoint': 
      case 'MultiLineString': 
      case 'MultiPolygon': {
        geom = geom.getPoints ? geom.getPoints() : geom.getLineStrings ? geom.getLineStrings() : geom.getPolygons();
        for (var i=0, g; g=geom[i]; i++) {
          f = f.clone();
          f.setIgnStyle(ignStyle);
          f.setGeometry(g);
          source.addFeature(f);
        }
        break;
      }
      case 'Point':
      case 'LineString':
      case 'Polygon': {
        f.setIgnStyle(ignStyle);
        source.addFeature(f);
        break;
      }
      default: break;
    }
  }
  return new ol_layer_VectorStyle({ source: source });
};

export default ol_layer_Statistic
