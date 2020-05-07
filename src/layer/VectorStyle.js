import {inherits as ol_inherits} from 'ol'
import ol_layer_Vector from 'ol/layer/Vector'
import ol_layer_Group from 'ol/layer/Group'
import ol_source_Cluster from 'ol/source/Cluster'
import ol_layer_AnimatedCluster from 'ol-ext/layer/AnimatedCluster'
import ol_Feature from 'ol/Feature'
import ol_geom_Point from 'ol/geom/Point'
import ol_geom_LineString from 'ol/geom/LineString'
import ol_geom_Polygon from 'ol/geom/Polygon'
import ol_geom_MultiPoint from 'ol/geom/MultiPoint'

import ol_style_Style from 'ol/style/Style'
import ol_style_Text from 'ol/style/Text'
import ol_style_Image from 'ol/style/Image'
import ol_style_Circle from 'ol/style/Circle'
import ol_style_Stroke from 'ol/style/Stroke'
import ol_style_Fill from 'ol/style/Fill'
import ol_style_Icon from 'ol/style/Icon'
import ol_style_Photo from 'ol-ext/style/Photo'
import ol_style_FontSymbol from 'ol-ext/style/FontSymbol'
import ol_style_Shadow from 'ol-ext/style/Shadow'

import {getCenter as ol_extent_getCenter} from 'ol/extent'
import {asArray as ol_color_asArray} from 'ol/color'
import {toContext as ol_render_toContext} from 'ol/render'
import {DEVICE_PIXEL_RATIO as ol_has_DEVICE_PIXEL_RATIO} from 'ol/has'
import {getArea, getDistance} from 'ol/sphere';
import {transform as ol_proj_transform} from 'ol/proj';
import {toStringHDMS as ol_coordinate_toStringHDMS} from 'ol/coordinate';

import WebFont from 'webfontloader'
import md2html from './md2html'

/** Layer with a style function based on IGN style.
 *	Features in the layer are linked to the layer (f.getLayer() to get the layer it belongs to).
 *
 * @constructor
 * @extends {ol_layer_Vector}
 * @param {olx.layer.VectorOptions=} opt_options Options, extend olx.layer.VectorOptions.
 *	- ghostStyle {boolean} true to show a ghost feature when size=0
 */
var ol_layer_VectorStyle = function(options) {
   options = options || {};

   // Constructor
   ol_layer_Group.call(this, options);

   // Render order based on the zindex
   options.renderOrder = ol_layer_VectorStyle.ordering;
   // Style function for the layer
   options.style = ol_layer_VectorStyle.getStyleFn({ghost: options.ghostStyle});
   //
   options.displayInLayerSwitcher = false;
   options.dessin = true;
   options.popupHoverSelect = false;
   // Create layer vector
   this.layerVector_ = new ol_layer_Vector(options);
   this.layerVector_.set('name', 'vector');
   this.getLayers().push(this.layerVector_);
   // Features
   var features = this.getSource().getFeatures();
   for (var i=0, f; f=features[i]; i++) f._layer = this;

   this.setType('vector');

   // Handle membership
   this.getSource().on('addfeature', function(e) {
      e.feature._layer = this;
      if (options.onaddfeature) {
         options.onaddfeature(e);
      }
   }.bind(this));
   this.getSource().on('removefeature', function(e) {
      delete e.feature._layer;
   }.bind(this));

   // override the cache for the styles when fonts are loaded
   this.loadFonts();
};
ol_inherits(ol_layer_VectorStyle, ol_layer_Group);

/** Cache for style common to all layers, override if you want to
*/
ol_layer_VectorStyle.prototype._cacheStyle = {};

/** Ordering function that use the zindex
*/
ol_layer_VectorStyle.prototype.getSource = function() {
   return this.layerVector_.getSource();
};

/** Ordering function that use the zindex
*/
ol_layer_VectorStyle.prototype.getStyle = function() {
   return this.layerVector_.getStyle();
};

/** Get geometry type of a layer or test if it has type as geometry
* @param {ol.geom.GeometryType|undefined} type the type of geom to look for or default to get an array of types, default undefined
* @return {boolean|Object} if type is specified return if all features are of this type, a array of type otherwise
*/
ol_layer_VectorStyle.prototype.getGeomTypes = function(type) {
   var types = {};
   var features = this.getSource().getFeatures();
   for (var i=0, f; f=features[i]; i++) {
      types[f.getGeometry().getType()] = true;
   }
   if (type) {
      if (Object.getOwnPropertyNames(types).length>2)	return false;
      else return types[type];
   } else return types;
};

/** Ordering function that use the zindex
*/
ol_layer_VectorStyle.ordering = function(f1, f2) {
   return (Number((f1.getIgnStyle()||{}).zIndex||0) > Number((f2.getIgnStyle()||{}).zIndex||0));
};

/** Get popupcontent for a feature
*	@param {ol_Feature|undefined} f the feature to get information on, if undefined get the popupcontent of the layer
*	@return {html} popupcontent
*/
ol_layer_VectorStyle.prototype.getPopupContent = function(f) {
   if (f) return f.getPopupContent( this._popupContent || {} );
   return this._popupContent || {};
};

/** Set popupcontent for a feature
*	@param {ol_Feature|undefined} f the feature, default set the poupcontent of the layer
*	@param {string} content
*/
ol_layer_VectorStyle.prototype.setPopupContent = function(content) {
   if (!content || content instanceof Array) this._popupContent = {};
   else this._popupContent = content;
};

/** Set default IGN style for a layer
*	@param {string|ignStyle} property the property to set
*	@param {string|number} val the value to set
*/
ol_layer_VectorStyle.prototype.setIgnStyle = function(property, val) {
   if (!this._ignStyle) this._ignStyle = {};
   if (val===undefined) {
      this._ignStyle = property;
   } else if (val!=='' && /width|radius|size|offset/i.test(property)) {
      val = Number(val);
   }
   if (val !== '' && val != ol_layer_VectorStyle.prototype.defaultIgnStyle[property]) {
      this._ignStyle[property] = val;
   } else {
      delete this._ignStyle[property];
   }
};

/** Get list of IGN style
*	@param {ol_Feature | undefined} f the feature, undefined to get the layer's default style
*	@param {number} res current resolution
*	@param {Object} IGN style
*/
ol_layer_VectorStyle.prototype.getIgnStyle = function(f, res) {
   if (!f) return this._ignStyle;

   var icon = f.getIgnStyle('pointIcon');
   var isoffset = !icon && /poi|bubble|marker|coma|shield|triangle|blazon/.test(f.getIgnStyle('pointForm'));
   var result = {};
   for (var i in this.defaultIgnStyle) {
      result[i] = f.getIgnStyle(i);
   }
   result.pointShadow = isoffset;
   result.pointOffsetY = (isoffset ? 1:0);
   // old versions
   switch (result.strokeDash) {
      case 'flecheRond':
         result.strokeDash = '';
         result.strokeArrow = 'circle';
         break;
      case 'flecheCarre':
         result.strokeDash = '';
         result.strokeArrow = 'square';
         break;
      case 'flecheTriangle':
         result.strokeDash = '';
         result.strokeArrow = 'triangle';
         break;
      default: break;
   }
   return result;
};

/** Default IGN style
*/
ol_layer_VectorStyle.prototype.defaultIgnStyle =
{pointRadius: 15,
   pointIcon: '',
   pointGlyph: 'ign-form-poi',
   pointForm: 'none',
   pointOffsetY: 0,
   pointShadow: false,
   symbolColor: '#0000FF',
   pointColor: '#FFFFFF',
   pointStrokeColor: '#FFFFFF',
   pointStrokeWidth: 2,
   pointRotation: 0,
   pointGradient: 0,

   strokeWidth: 2,
   strokeDash: '',
   strokeArrow: '',
   strokeColor: '#f80',

   fillColor: 'rgba(255,136,0,0.6)',

   // Motif
   fillPattern: '',
   sizePattern: 5,
   spacingPattern: 10,
   anglePattern: 0,
   offsetPattern: 0,
   scalePattern: 1,
   fillColorPattern: 'rgba(0,0,0,0)',

   zIndex: 0,

   // Text
   labelAttribute: '',
   textColor: '#000',
   textStyle: 'normal',
   textSize: 12,
   textFont: 'Arial, Helvetica, sans-serif',
   textOutlineColor: '',
   textOutlineWidth: 3,
   textAlign: 'left',
   textBaseline: 'alphabetic',
};


/** Style ID used for cache key
* @param {} s IGN style
* @param {bool} clustered
* @return {string}
*/
ol_layer_VectorStyle.prototype.getStyleId = function(s, clustered) {
   return {
      main: (clustered?'mainc':'main:')+s.pointRadius+'-'+s.pointIcon+'-'+s.pointGlyph+'-'+s.pointForm+'-'+s.symbolColor+'-'+s.pointColor+'-'+s.pointStrokeColor+'-'
			+s.pointStrokeWidth+'-'+s.pointRotation+'-'+s.pointGradient+'-'+s.strokeWidth+'-'+s.strokeDash+'-'+s.strokeColor+'-'
			+s.fillColor+'-'+s.fillPattern+'-'+s.sizePattern+'-'+s.spacingPattern+'-'+s.anglePattern+'-'+s.offsetPattern+'-'+s.scalePattern+'-'+s.fillColorPattern+'-',
      shadow: 'shad:'+s.poointRadius,
      arrow: 'arrow:'+s.strokeWidth+'-'+s.strokeArrow+'-'+s.strokeColor+'-',
      text: 'text:'+s.pointRadius+'-'+s.textColor+'-'+s.textStyle+'-'+s.textSize+'-'+s.textFont
			+'-'+s.textOutlineColor+'-'+s.textOutlineWidth+'-'
			+'-'+s.textAlign+'-'+s.textBaseline+'-',
   };
};

/** Clear cache
*/
ol_layer_VectorStyle.prototype.clearCache = function() {
   ol_layer_VectorStyle.prototype._cacheStyle = {};
};

/** Chargement des fonts de Ma carte
* @param {function|undefined} onLoadFn function called when a font is loaded
*/
ol_layer_VectorStyle.prototype.loadFonts = function(onLoadFn) {
   var self = this;
   WebFont.load(
      {custom: {
         families: ['FontAwesome', 'fontign', 'fontmaki', 'fontsjjb', 'pirate', 'evilz'],
         testStrings: {'FontAwesome': '\uf240', 'fontign': '\ue800', 'fontmaki': '\ue800',
            'fontsjjb': '\ue800', 'pirate': '\ue801', 'evilz': '\ue800'},
      },
      classes: false,
      // Clear the cache and force redraw when fonts are loaded
      fontactive: function(f) {
         setTimeout(function() {
            self.clearCache();
            self.layerVector_.changed();
            if (onLoadFn) onLoadFn({type: 'loadfont', font: f});
         });
      // console.log("Loading font: "+f);
      },
      // oops
      fontinactive: function(f) {	// console.error ("Can't load font: "+f);
      },
      });
};

(function() {
   var luminanceCache = {};
   var luminanceMax = 0.3; // Math.sqrt(1.05 * 0.05) - 0.05;

   /** Check if is color is dark
* @param {Array<Number>} color [r,g,b]
* @param {Number|undefined} max, default 0.3
* @return {boolean}
*/
   ol_layer_VectorStyle.isDarkColor = function(color, max) {
      var id = color.join(',');
      if (!luminanceCache.hasOwnProperty(id)) {
         try {
            var col=[];
            for (var i=0; i<3; i++) {
               var c = color[i] / 255.0;
               if (c <= 0.03928) col[i] = c / 12.92;
               else col[i] = Math.pow((c + 0.055) / 1.055, 2.4);
            }
            luminanceCache[id] = 0.2126 * col[0] + 0.7152 * col[1] + 0.0722 * col[2];
         } catch (e) {
            luminanceCache[id] = 1;
         }
      }
      return (luminanceCache[id] < (max || luminanceMax));
   };
})();


/**
 * Create a ol_style_Image for a cluster
 * @param {number} size the cluster size
 * @param {Array<number>} clusterColor the cluster color as [r,v,b]
 * @return {ol_style_Image} the cluster image
 */
ol_layer_VectorStyle.clusterImage = function(size, clusterColor) {
   var color = clusterColor || (size>25 ? [192, 0, 0] : size>8 ? [255, 128, 0] : [0, 128, 0]);
   var radius = Math.max(8, Math.min(size*0.75, 20));
   var dash;
   if (options.clusterDash!==false) {
      dash = 2*Math.PI*radius/6;
      dash = [0, dash, dash, dash, dash, dash, dash];
   }
   return new ol_style_Circle(
      {radius: radius,
         stroke: new ol_style_Stroke(
            {color: 'rgba('+color.join(',')+',0.5)',
               width: 15,
               lineDash: dash,
               lineCap: 'butt',
            }),
         fill: new ol_style_Fill(
            {color: 'rgba('+color.join(',')+',1)',
            }),
      });
};


/** Create style function to draw features
*	ie. transform ignStyle in OL3 style
* @param {} options
*	@param {boolean} options.ghost true to show a ghost feature when size=0
*	@param {string} options.clusterColor a color, default red / orange / green
*	@param {boolean} options.clusterDash border is dash, default true
*/
ol_layer_VectorStyle.getStyleFn = function(options) {
   if (!options) options = {};
   var self = ol_layer_VectorStyle.prototype;

   var clusterColor; var clusterTextColor='#fff';
   if (options.clusterColor) {
      clusterColor = $.extend([], ol_color_asArray(options.clusterColor)).splice(0, 3);
      clusterTextColor = ol_layer_VectorStyle.isDarkColor(clusterColor) ? '#fff' : '#000';
   }

   return function(f, res, clustered) {	// Clusters style
      if (f.get('features')) {
         var cluster = f.get('features');
         if (cluster.length == 1) {
            f = cluster[0];
         } else {
            var size = cluster.length;
            var id = 'cluster:'+size+'-'+(options.clusterColor||'')+'-'+(options.clusterDash===false?0:1);
            var style = self._cacheStyle[id];
            if (!style) {
               style = self._cacheStyle[id] = new ol_style_Style(
                  {image: ol_layer_VectorStyle.clusterImage(size, clusterColor),
                     text: new ol_style_Text(
                        {text: size.toString(),
                           fill: new ol_style_Fill(
                              {color: clusterTextColor,
                              }),
                        }),
                  });
            }
            return [style];
         }
      }
      // Convert ignStyle to ol3 style
      var s = self.getIgnStyle(f, res);
      var typeGeom = f.getGeometry().getType();
      // Etiquette
      var label = f.get(s.labelAttribute) || s.labelAttribute;

      // Cache id for the style
      var id = self.getStyleId(s, clustered);
      // Main style
      var st;
      if (!(st = self._cacheStyle[id.main])) {
         var strokeDash = s.strokeDash;
         if (strokeDash && typeof(strokeDash) == 'string') {
            strokeDash = s.strokeDash.split(',');
            if (s.strokeWidth > 0) {
               for (var i in strokeDash) {
                  strokeDash[i] = Math.max(0, (Number(strokeDash[i])+2*(i%2)-1) * s.strokeWidth) * (ol_has_DEVICE_PIXEL_RATIO||1);
               }
            }
         }
         var img;
         if (clustered && typeGeom!=='Point') {
            img = ol_layer_VectorStyle.clusterImage(1, clusterColor);
         } else if (s.pointIcon) {
            img = new ol_style_Photo(
               {src: s.pointIcon,
                  radius: s.pointRadius,
                  onload: function() {
                     f.changed();
                  },
                  stroke: new ol_style_Stroke(
                     {width: 0,
                        color: 'transparent',
                     }),
               });
         } else {
            if (options.ghost && !label && !s.pointRadius) {
               img = new ol_style_Circle(
                  {radius: 5,
                     fill: new ol_style_Fill(
                        {color: 'rgba(0,0,0,0.5)',
                        }),
                     stroke: new ol_style_Stroke(
                        {color: 'rgba(255,255,255,1)',
                           width: 1.5,
                        }),
                  });
            } else {
               img = new ol_style_FontSymbol(
                  {radius: s.pointRadius,
                     glyph: s.pointGlyph,
                     color: s.symbolColor,
                     form: s.pointForm || (s.pointGlyph ? undefined : 'circle'),
                     rotation: s.pointRotation *Math.PI/180,
                     gradient: Number(s.pointGradient),
                     offsetX: 0,
                     offsetY: -s.pointOffsetY * s.pointRadius,
                     fill: new ol_style_Fill(
                        {color: s.pointGlyph ? s.pointColor : s.symbolColor,
                        }),
                     stroke: new ol_style_Stroke(
                        {color: s.pointStrokeWidth ? s.pointStrokeColor : 'transparent',
                           width: Math.min(s.pointStrokeWidth, s.pointRadius/2),
                        }),
                  });
            }
         }
         var fill;
         if (s.fillPattern && s.fillPattern != 'vide') {
            fill = new ol_style_FillPattern(
               {pattern: s.fillPattern,
                  image: (s.fillPattern == 'Image (PNG)') ? new ol_style_Icon({src: PATH_MACARTE + 'macarte/img/pattern.png'}) : undefined,
                  ratio: 1,
                  color: s.fillColor,
                  size: s.sizepattern,
                  spacing: s.spacingPattern,
                  angle: s.anglePattern,
                  offset: s.offsetPattern,
                  scale: s.scalePattern,
                  fill: new ol_style_Fill({color: s.fillColorPattern}),
               });
         } else {
            fill = new ol_style_Fill(
               {color: s.fillColor,
               });
         }
         var stroke = new ol_style_Stroke(
            {color: s.strokeWidth ? s.strokeColor : ((options.ghost && /line/i.test(typeGeom)) ? 'rgba(0,0,0,0.25)' : 'transparent'),
               width: s.strokeWidth || ((options.ghost && /line/i.test(typeGeom)) ? 0.5 : 0),
               lineDash: strokeDash,
            });
         st = self._cacheStyle[id.main] = new ol_style_Style(
            {image: img,
               fill: fill,
               stroke: stroke,
               geometry: function(f) {
                  // Cluster ?
                  var features = f.get('features');
                  return (features && features.length===1) ? f.get('features')[0].getGeometry() : f.getGeometry();
               },
            });
         // console.log("style main")
      }
      var style = [st];
      // Shadow
      if (s.pointShadow && typeGeom == 'Point') {
         if (!(st = self._cacheStyle[id.shadow+'-'+s.pointRadius])) {
            st = self._cacheStyle[id.shadow+'-'+s.pointRadius] = new ol_style_Style(
               {image: new ol_style_Shadow(
                  {radius: s.pointRadius * 0.5,
                  }),
               zIndex: -1,
               geometry: function(f) {
                  // Cluster ?
                  var features = f.get('features');
                  return (features && features.length===1) ? f.get('features')[0].getGeometry() : f.getGeometry();
               },
               });
         // console.log("style shadow")
         }
         style.unshift( st );
      }
      // Stroke Arrow
      else if (!clustered && s.strokeArrow && typeGeom == 'LineString') {
         var g = f.getGeometry().getCoordinates();
         var p1 = g.pop();
         var p2 = g.pop();
         var rot = 0;
	          if (p1 && p2) {
            rot = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
         }
         if (!(st = self._cacheStyle[id.arrow])) {
            var width = s.strokeWidth + 6;
            self._cacheStyle[id.arrow] =
				st = new ol_style_Style(
				   {image: new ol_style_FontSymbol(
				      {form: s.strokeArrow,
				         radius: width,
				         offsetY: s.strokeArrow==='triangle' ? -5 : 0,
				         rotation: rot,
				         rotateWithView: true,
				         fill: new ol_style_Fill(
				            {color: s.strokeColor,
				            }),
				      }),
				   geometry: function(f) {
				      // Cluster ?
				      return (f.get('features')) ? new ol_geom_Point(f.get('features')[0].getGeometry().getLastCoordinate()) : new ol_geom_Point(f.getGeometry().getLastCoordinate());
				   },
				   });
            // console.log("style arrow")
         }
         st.getImage().setRotation(rot);
         style.push(st);
      }
      // Label
      if (label) {
         if (!(st = self._cacheStyle[id.text])) {
            if (typeGeom != 'Point') {
               s.textAlign = 'center';
               s.textBaseline = 'middle';
            }
            if (!s.textOutlineColor) {
               try {
                  s.textOutlineColor = ol_layer_VectorStyle.isDarkColor(ol_color_asArray(s.textColor)) ? [255, 255, 255, 0.6] : [0, 0, 0, 0.6];
               } catch (e) {
                  s.textOutlineColor = [255, 255, 255, 0.6];
               }
            }
            st = self._cacheStyle[id.text] = new ol_style_Style(
               {text: new ol_style_Text(
                  {font: s.textStyle + ' ' + s.textSize + 'px ' + s.textFont,
                     fill: new ol_style_Fill({color: s.textColor}),
                     stroke: new ol_style_Stroke({color: s.textOutlineColor, width: s.textOutlineWidth}),
                     textAlign: s.textAlign,
                     textBaseline: s.textBaseline,
                     //overflow: true,
                     offsetX: (s.textAlign=='left') ? s.pointRadius : (s.textAlign=='right') ? -s.pointRadius : 0,
                     offsetY: /^top|^hanging/.test(s.textBaseline) ? s.pointRadius : /^bottom|^alphabetic/.test(s.textBaseline) ? -s.pointRadius : 0,
                  }),
               geometry: function(f) {
                  // Cluster ?
                  var features = f.get('features');
                  return (features && features.length===1) ? f.get('features')[0].getGeometry() : f.getGeometry();
               },
               });
         // console.log("style text",s)
         }
         // Label
         st.getText().setText(label.replace ? f.getLabelContent(label.replace(/\\n/g, '\n')) : f.getLabelContent(label));
         style.push( st );
      }
      if (!label)	label = '';
      // cas annotation, affiche un petit disque
      if (!label.trim().length && !s.pointRadius) {
         var ret = [new ol_style_Style({
            fill: new ol_style_Fill({
               color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new ol_style_Stroke({
               color: '#ffcc33',
               width: 2,
            }),
            image: new ol_style_Circle({
               radius: 4,
               fill: new ol_style_Fill({
                  color: '#ffcc33',
               }),
            }),
            geometry: function(f) {
            // Cluster ?
               var features = f.get('features');
               return (features && features.length===1) ? f.get('features')[0].getGeometry() : f.getGeometry();
            },
         })];
         return ret;
      }
      return style;
   };
};

/** Get all points in coordinates
*/
var ol_geom_getFlatCoordinates = function(coords) {
   if (coords && coords[0].length && coords[0][0].length) {
      var c = [];
      for (var i=0; i<coords.length; i++) {
         c = c.concat(this.getFlatCoordinates(coords[i]));
      }
      return c;
   } else return coords;
};

/** Get select Style
*  @param {} options
*	- type {zoom | overlay | highlight [ box } select style type, default box
*	- showObject {boolen} show the object, default true
*	- points {ol_style_Image | function | false | undefined} style for the points or false to hide points, default red points
*	- stroke { ol_style_Stroke | undefined } default red, 2px
*	- radius {number | undefined} radius for the points, default 5
*	- styleFn {function | undefined} a style function
*  @return {function} style function
*/
ol_layer_VectorStyle.getSelectStyleFn = function(options) {
   options = options || {};
   var self = this;
   var style = options.styleFn || this.getStyleFn();

   var stroke = options.stroke || new ol_style_Stroke(
      {color: 'red',
         width: 2,
      });
   var fill = options.fill || new ol_style_Fill(
      {color: 'rgba(255,0,0,0.5)',
      });
   var showPts = (options.points !== false);
   var showPoints = (typeof(options.points)=='function' ? options.points : function() {
      return showPts;
   } );
   var radius = options.radius || 5;
   var color = stroke.getColor();
   var showObject = options.showObject !== false;

   var pts = options.points instanceof ol_style_Image ? options.points : new ol_style_Circle(
      {stroke: new ol_style_Stroke(
         {color: color,
            width: 1,
         }),
      radius: 5,
      });
   var ptsStyle = new ol_style_Style(
      {image: pts,
         geometry: function(f) {
            return new ol_geom_MultiPoint( ol_geom_getFlatCoordinates(f.getGeometry().getCoordinates()) );
         },
      });
   var strokePoint = new ol_style_Stroke(
      {color: color,
         width: 5,
      });

   var fillStyle = new ol_style_Style(
      {	// stroke: new ol_style_Stroke({ color:'transparent'}),
         fill: fill,
      });

   var overlay = new ol_style_Style(
      {image: new ol_style_Circle(
         {stroke: stroke,
            fill: fill,
            radius: radius,
         }),
      stroke: stroke,
      fill: fill,
      });

   switch (options.type) {
      case 'highlight':
      case 'zoom': return function(f, res) {	// Feature style
         var s0 = style(f, res);
         var s = [];
         for (var i=0, si0; si0=s0[i]; i++) {
            var si = si0.clone();
            if (si.getImage()) {
               si.getImage().setScale(1.25);
               si.getImage().setRotation(si0.getImage().getRotation());
            }
            var a = si.getStroke();
            if (a) {
               a.setWidth(a.getWidth()+3);
            }
            s.push(si);
         }
         s.push(fillStyle);
         if (showPoints()) s.push(ptsStyle);
         return s;
      };
      case 'overlay': return function(f, res) {	// Feature style
         var s = showObject ? style(f, res) : [];
         s.push(overlay);
         if (showPoints()) s.push(ptsStyle);
         return s;
      };
      default: return function(f, res) {	// Feature style
         var s = showObject ? style(f, res) : [];
         // Add
         var g = f.getGeometry();
         if (g.getType()=='Point') {
            var cluster = f.get('features');
            if (cluster) {
               if (cluster.length==1) {
                  f = cluster[0];
                  cluster = false;
               }
            }
            if (!cluster) {
               s.unshift(new ol_style_Style(
                  {image: new ol_style_Circle(
                     {stroke: strokePoint,
                        radius: (f.getIgnStyle('pointRadius') || 5) +radius,
                     }),
                  }));
            }
         } else {
            if (showPoints()) {
               s.push(ptsStyle);
            }
            s.unshift(new ol_style_Style(
               {stroke: stroke,
                  geometry: ol_geom_Polygon.fromExtent( g.getExtent() ),
               }));
         }

         return s;
      };
   };
};

/** Get style as an image
* @param {Array<ol_style_Style>} style
* @param {} options
*	- ratio {Number} pixel ratio default 1
*	- width {Number} image height in px, default 60
*	- height {Number} image height in px, default 60
*	- type {Text|Point|LineString|Polygon} type to draw
*	- padding {Number} right offset to draw an arrow
*	- offset {ol.Size} offset to draw a point
*	- calcStyleGeom {function|undefined} a function to recalculate style according a geometry get {ol.geom} and return {Array<ol_style_Style>}
* @return {image}
*/
var ol_style_getImage4Style = function(style, options) {
   options = options || {};

   var ratio = options.ratio || ol_has_DEVICE_PIXEL_RATIO;
   var canvas = document.createElement('canvas');
   canvas.width = canvas.height = 1;
   if (!style) return canvas;
   var ctx = canvas.getContext('2d');
   var w = canvas.width = options.width || 60;
   var h = canvas.height = options.height || 45;

   function drawStyle(style, geom) {
      var vc = ol_render_toContext(ctx, {size: [w, h]});
      for (var i=0, s; s=style[i]; i++) {
         var imgs = s.getImage();
         if (imgs) {
            var sc = imgs.getScale();
            imgs.setScale(sc*ratio); // setImageStyle don't check retina
         }
         vc.setStyle(s);
         if (typeof(s.getGeometry()) == 'function') {
            geom = s.getGeometry()( new ol_Feature(geom) );
         } else geom = s.getGeometry() || geom;
         vc.drawGeometry(geom);
         if (imgs) imgs.setScale(sc);
      }
   };

   function getStrokeWidth(style) {
      var w = 0;
      for (var i=0, s; s=style[i]; i++) {
         var s = s.getStroke();
         if (s) w = Math.max(s.getWidth(), w);
      }
      return w;
   };

   function getFont(style) {
      var f = '';
      for (var i=0, s; s=style[i]; i++) {
         var s = s.getText();
         if (s) return s.getFont();
      }
      return f;
   };
   function getLabel(style) {
      var f = '';
      for (var i=0, s; s=style[i]; i++) {
         var s = s.getText();
         if (s) return s.getText();
      }
      return f;
   };

   function getPointSize(style) {
      var sz = [0, 0];
      for (var i=0, s; s=style[i]; i++) {
         var s = s.getImage();
         if (s && s.getImage) {
            var img = s.getImage();
            sz = [Math.max(sz[0], img.width), Math.max(sz[1], img.height)];
         }
      }
      if (sz[0]==0) return [w, h];
      return sz;
   };

   switch (options.type) {
      case 'Text':
         var t = getLabel(style);
         ctx.save();
         ctx.font = getFont(style);
         var l = ctx.measureText(t).width;
         w = canvas.width = l+4;
         ctx.font = getFont(style);
         h = canvas.height = 1.6* ctx.measureText('M').width;
         ctx.restore();
         var geom = new ol_geom_Point([w/2, h/2]);
         if (options.calcStyleGeom) style = options.calcStyleGeom(geom);
         drawStyle(style, geom);
         break;
      case 'Point':
         var sz = getPointSize(style);
         w = canvas.width = sz[0]+2;
         h = canvas.height = sz[1]+2;
         var offset = options.offset || [0, 0];
         var geom = new ol_geom_Point([w/2+offset[0], h/2+offset[1]]);
         if (options.calcStyleGeom) style = options.calcStyleGeom(geom);
         drawStyle(style, geom);
         break;
      case 'LineString':
         var dl = options.padding||0;
         h = canvas.height = getStrokeWidth(style) + 2*dl;
         var geom = new ol_geom_LineString([[0, h/2], [w-dl-2, h/2]]);
         if (options.calcStyleGeom) style = options.calcStyleGeom(geom);
         drawStyle(style, geom);
         break;
      case 'Polygon':
         var dl = getStrokeWidth(style)/2;
         var geom = new ol_geom_Polygon([[[dl, dl], [w-dl, dl], [w-dl, h-dl], [dl, h-dl], [dl, dl]]]);
         if (options.calcStyleGeom) style = options.calcStyleGeom(geom);
         drawStyle(style, geom);
         break;
      default:
         break;
   };
   return canvas;
};

/** Get style as an image
* @param {Array<ol_style_Style>} style
* @param {} options
*	- type {Text|Point|LineString|Polygon} type to draw
*	- ratio {Number} pixel ratio default 1
*	- width {Number} image height in px, default 60
*	- height {Number} image height in px, default 60
* @return {image}
*/
var ol_style_getImage4IgnStyle = function(style, options) {
   var f;
   switch (options.type) {
      case 'Polygon':
         f = new ol_Feature(new ol_geom_Polygon([[[0, 0], [0, 0]]]));
         break;
      case 'LineString':
         f = new ol_Feature(new ol_geom_LineString([[0, 0], [0, 0]]));
         break;
      default:
         f = new ol_Feature(new ol_geom_Point([0, 0]));
         break;
   }
   f.setIgnStyle(style);
   return f.getImage4Style(options);
};

/** Get image style of a feature
* @param {ol_Feature} f feature
* @param {} options
*	- ratio {Number} pixel ratio default 1
*	- width {Number} image height in px, default 60
*	- height {Number} image height in px, default 60
* @return {image}
*/
ol_Feature.prototype.getImage4Style = function(options) {
   options = options || {};

   var f0 = this.clone();
   var istyle = ol_layer_VectorStyle.prototype.getIgnStyle(this);
   f0.setIgnStyle(istyle);
   if (options.noRotation) istyle.pointRotation = 0;
   istyle.textAlign = 'center';
   istyle.textBaseline = 'middle';
   if (!istyle.pointRadius) f0.set(istyle.labelAttribute, 'Abc');
   else f0.set(istyle.labelAttribute, '');

   return ol_style_getImage4Style( ol_layer_VectorStyle.getStyleFn()(f0),
      {ratio: options.ratio,
         width: options.width,
         height: options.height,
         type: istyle.pointRadius ? f0.getGeometry().getType() : 'Text',
         padding: istyle.strokeArrow ? istyle.strokeWidth+6 : 0,
         offset: istyle.pointShadow ? [0, istyle.pointRadius] : [0, 0],
         calcStyleGeom: function(geom) {
            f0.setGeometry(geom);
            return ol_layer_VectorStyle.getStyleFn()(f0);
         },
      });
};

/** Set render as an image
*	@param {vector|image|cluster} type render type
*	@param {} options
*/
ol_layer_VectorStyle.prototype.setType = function(type, options) {
   options = options || {};
   this.set('type', type);
   this.layerVector_.setVisible(false);
   if (this.layerImage_) this.layerImage_.setVisible(false);
   if (this.layerCluster_) this.layerCluster_.setVisible(false);
   switch (type) {
      case 'image':
      {if (!this.layerImage_) {
         this.layerImage_ = new ol_layer_Vector(
            {name: 'image',
               displayInLayerSwitcher: false,
               renderMode: 'image',
               source: this.getSource(),
               style: this.getStyle(),
               attributions: this.getSource().getAttributions(),
               // logo: this.getSource().getLogo(),
               projection: this.getSource().getProjection(),
               minResolution: this.layerVector_.getMinResolution(),
               maxResolution: this.layerVector_.getMaxResolution(),
            });
         this.getLayers().push(this.layerImage_);
      }
      this.layerImage_.setVisible(true);
      break;
      }
      case 'cluster':
      {if (!this.layerCluster_ ) {
         var clusterSource = new ol_source_Cluster({
            geometryFunction: function(f) {
               var g = f.getGeometry();
               if (g.getType()==='Point') return g;
               else return new ol_geom_Point(ol_extent_getCenter(g.getExtent()));
            },
            distance: 40,
            source: this.getSource(),
         });
         this.layerCluster_ = new ol_layer_AnimatedCluster(
            {name: 'cluster',
               displayInLayerSwitcher: false,
               source: clusterSource,
               animationDuration: options.animationDuration,
            });
         this.getLayers().push(this.layerCluster_);
      }
      this.layerCluster_.setStyle(ol_layer_VectorStyle.getStyleFn(options));
      this.layerCluster_.setVisible(true);
      break;
      }
      default:
         this.layerVector_.setVisible(true);
         break;
   }
};

/** Get render type
*	@return {vector|image|cluster} render type
*/
ol_layer_VectorStyle.prototype.getType = function() {
   return this.get('type');
};

/** Get layer for a feature
*	@return { ol_layer_VectorStyle | undefined } the layer
*/
ol_Feature.prototype.getLayer= function(property) {
   return this._layer;
};

/** Get IGN style for a feature
 *	@param { string | true | undefined } property
 *		1/ the property to get
 *		2/ true to get all properties
 *		3/ undefined to get the properties on the feature
 *	@return {string|number|Array} the style
 */
ol_Feature.prototype.getIgnStyle = function(property) {
   if (!this._ignStyle) {
      this._ignStyle = {};
   }
   // Test property
   if (!property) {
      return this._ignStyle;
   } else if (property===true) {
      var style = {};
      // Get all properties
      for (var i in ol_layer_VectorStyle.prototype.defaultIgnStyle) {
         style[i] = this.getIgnStyle(i);
      }
      return style;
   } else {
      var val;
      // Feature property
      if (this._ignStyle.hasOwnProperty(property)) {
         val = this._ignStyle[property];
      }
      // or default layer property
      else if (this.getLayer() && this.getLayer()._ignStyle && this.getLayer()._ignStyle.hasOwnProperty(property)) {
         val = this.getLayer()._ignStyle[property];
      }
      // or default property
      else {
         val = ol_layer_VectorStyle.prototype.defaultIgnStyle[property];
      }
      return val;
   }
};

/** Set IGN style for a feature
*	@param {string|ignStyle} property the property to set
*	@param {string|number} val the value to set
*/
/** Set IGN style for a feature
 *	@param {string|ignStyle} property the property to set
 *	@param {string|number} val the value to set
 */
ol_Feature.prototype.setIgnStyle = function(property, val) {
   if (!this._ignStyle) {
      this._ignStyle = {};
   }
   if (val === undefined) {
      if (property && typeof(property) !== 'string') {
         this._ignStyle = property;
      }
      return;
   } else if (val !== '' && /width|radius|size|offset/i.test(property)) {
      val = Number(val);
   }
   if (this.getLayer()
            && this.getLayer()._ignStyle
            && this.getLayer()._ignStyle.hasOwnProperty(property)
            && val != this.getLayer()._ignStyle[property]) {
      this._ignStyle[property] = val;
   } else if (val !== '' && val != ol_layer_VectorStyle.prototype.defaultIgnStyle[property]) {
      this._ignStyle[property] = val;
   } else {
      delete this._ignStyle[property];
   }
};

/** Check if a feature has a popupcontent
*/
ol_Feature.prototype.hasPopupContent = function() {
   if ((this._popupContent && this._popupContent.active!==false)
	|| (this.getLayer() && this.getLayer().getPopupContent && this.getLayer().getPopupContent())) return true;
   return false;
};

(function() {
/**
* Format length output.
* @param {ol_geom_LineString} line The line.
* @return {string} The formatted length.
* @private
*/
   var formatLength = function(line) {
      var length;
      var coordinates = line.getCoordinates();
      length = 0;
      for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
         var c1 = ol_proj_transform(coordinates[i], 'EPSG:3857', 'EPSG:4326');
         var c2 = ol_proj_transform(coordinates[i + 1], 'EPSG:3857', 'EPSG:4326');
         length += getDistance(c1, c2);
      }
      var output = (length > 100) ? (Math.round(length / 1000 * 100) / 100) + ' ' + 'km'
         : (Math.round(length * 100) / 100) + ' ' + 'm';
      return output;
   };


   /**
* Format area output.
* @param {ol_geom_Polygon} polygon The polygon.
* @return {string} Formatted area.
* @private
*/
   var formatArea = function(polygon) {
      var area;
      var geom = /** @type {ol_geom_Polygon} */(polygon.clone().transform('EPSG:3857', 'EPSG:4326'));
      var coordinates = geom.getLinearRing(0).getCoordinates();
      area = Math.abs(getArea(coordinates));
      var output = (area > 10000) ? (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>'
         : (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
      return output;
   };

   /** Get popupcontent for a feature
*	@param {Object|true|undefined} options popupoptions (with a content propertie) or undefined to get the popupcontent object
*		- titre
*		- desc
*		- img
*		- coord
*	@return {html} popupcontent
*/
   ol_Feature.prototype.getPopupContent = function(content) {
      if (!content) return (this._popupContent || {});

      if (this._popupContent && this._popupContent.active) content = this._popupContent;
      else if (content===true) content = (this.getLayer() && this.getLayer().getPopupContent ? this.getLayer().getPopupContent() : '');
      if (!content) return '';

      var format = (content.titre ? '####' + content.titre + '\n' : '')
				+ (content.desc ? content.desc + '\n': '')
				+ (content.img ? '!(' + content.img + ')' + '\n' : '')
				+ (content.coord ? '**%COORD%**' : '');
      format = format.replace(/\n$/, '');

      var list = this.getProperties();
      var pt; var geom = this.getGeometry();
      switch (geom.getType()) {
         case 'LineString':
            pt = geom.getClosestPoint(ol_extent_getCenter(geom.getExtent()));
            if (!list.LENGTH) list.LENGTH = formatLength(geom);
            break;
         case 'Polygon':
            pt = geom.getInteriorPoint().getCoordinates();
            if (!list.AREA) list.AREA = formatArea(geom);
            break;
         default:
            pt = geom.getFirstCoordinate();
      }
      var coord = ol_proj_transform(pt, 'EPSG:3857', 'EPSG:4326');
      var lon = coord[0].toFixed(6);
      var lat = coord[1].toFixed(6);
      list.COORD = (lat < 0 ? -lat : lat) + '&deg;' + (lat < 0 ? 'S' : 'N')
			   + ' ' + (lon < 0 ? -lon : lon) + '&deg;' + (lon < 0 ? 'O' : 'E');
      list.COORDMS = ol_coordinate_toStringHDMS(coord).replace(/ /g, '').replace('N', 'N ').replace('S', 'S ');
      if (!list.LON) list.LON = lon;
      if (!list.LAT) list.LAT = lat;

      var md = md2html(format, list);
      return md ? '<div class="md">' + md + '</div>' : '';
   };
})();

/** Set popupcontent for a feature
*	@param {} options
*		- active {boolean}
*		- titre {string}
*		- desc {string}
*		- img {string}
*/
ol_Feature.prototype.setPopupContent = function(content) {
   if (!content || content instanceof Array) this._popupContent = {};
   else this._popupContent = content;
};

/** Get labelcontent for a feature
*	@param {Object|true|undefined} options popupoptions (with a content propertie) or undefined to get the popupcontent object
*
*	@return {html} labelcontent
*/
ol_Feature.prototype.getLabelContent = function(content) {
   if (!content) return '';

   var format = content;
   format = format.replace(/\n$/, '');
   var list = this.getProperties();
   var md = md2html.doData (format, list);
   md = md.replace(/<br \/>/, '');
   md = md.replace(/<br\/>/, '');
   return md;
};

/** Show a popup at the right place
*	If the feature has no content the popup is hidden.
*	The popup is placed on the object (closest point)
*	and use the feature style to calculate the offset from the point symbol.
* @param {ol.Overlay.Popup} popup the popup to display on the map
* @param {ol.Coordinate} coord popup position (the closest point will be used)
* @param {ol.geom|undefined} geom use as geometry
* @return {string} the popup content
*/
ol_Feature.prototype.showPopup = function(popup, coord, geom) {
   var f = this;
   var content = this.getPopupContent(true);
   if (content) {
      popup.setOffset([0, 0]);
      switch (this.getGeometry().getType()) {
         case 'Point':
         {var offset = popup.offsetBox;
            var style = f.getLayer().getIgnStyle(f);
            var offsetX = /left|right/.test(popup.autoPositioning[0]) ? style.pointRadius : 0;
            popup.offsetBox = [-offsetX, (style.pointOffsetY ? -2:-1)*style.pointRadius, offsetX, style.pointOffsetY ? 0:style.pointRadius];
            if (geom) popup.show(geom.getClosestPoint(coord), content);
            else popup.show(this.getGeometry().getClosestPoint(coord), content);
            popup.offsetBox = offset;
            break;
         }
         default:
         {if (/polygon/i.test(this.getGeometry().getType())) popup.show(coord, content);
         else popup.show(this.getGeometry().getClosestPoint(coord), content);
         }
      }
   } else popup.hide();
   return content;
};

export default ol_layer_VectorStyle