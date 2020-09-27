/**	@copy (c) IGN - 2017
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
/* global $ */
import {inherits as ol_inherits} from 'ol'
import ol_Feature from 'ol/Feature'
import ol_geom_Point from 'ol/geom/Point'
import ol_geom_LineString from 'ol/geom/LineString'
import ol_geom_Polygon from 'ol/geom/Polygon'
import {asString as ol_color_asString} from 'ol/color'

import ol_control_Legend from '../control/legendcontrol'
import ol_layer_VectorStyle from '../layer/ol.layer.vectorstyle'

import ol_format_control_Base from './ol.controlformat'

/** Generic format for reading/writing layer.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {} options Options.
 */
var ol_format_control_Legend = function(/* options */) {
  // Constructor
  ol_format_control_Base.call(this);
};
ol_inherits(ol_format_control_Legend, ol_format_control_Base);

/** read
 * @param {} options
 * 	@param {ol.control} options.control an existing control
 * 	@param {} options.legend array of legend content
 */
ol_format_control_Legend.prototype.read = function(options) {
  options =  options || {};
  var legend = options.control || new ol_control_Legend();
  legend.setVisible(options.legendVisible);
  legend.setPosition(options.legendPos || "bottom-left");
  legend.setStyle ({
    width: options.legendWidth || 300,
    'line-height': options.lineHeight || 25
  });
  legend.set('title', options.legendtitle);
  if (options.legend) for (var k=0, l; l=options.legend[k]; k++) {
    if (l.type == "Titre") {
      l.title = l.name;
      legend.addFeatureTitle(l);
    } else {
      var f;
      if (/LineString/.test(l.type)) {
        f = new ol_Feature(new ol_geom_LineString([]));
      } else if (/Polygon/.test(l.type)) {
        f = new ol_Feature(new ol_geom_Polygon([]));
      } else {
        f = new ol_Feature(new ol_geom_Point([]));
      }
      f.set('title',l.name);
      //>> BUG v1
      if(l.style.strokeDash)
      if (l.style.strokeDash.join) {
        l.style.strokeDash = l.style.strokeDash.join(',');
        if (l.style.strokeDash=="0") l.style.strokeDash="";
      }
      //<< BUG
      f.setIgnStyle(l.style);
      f.setStyle( ol_layer_VectorStyle.getStyleFn()(f) );
      legend.addFeature(f);
    }
  }
  return legend;
};

/** write
* @param {ol.control.Legend} ctrl the control
* @param {} options (unused)
* @return {} exported control
*/
ol_format_control_Legend.prototype.write = function(ctrl /*, options */) {
  if (!ctrl) return false;
  var r = {};
  var $c = $(ctrl.element);
  r.legendVisible = ctrl.getVisible();
  r.legendPos = ($c.hasClass('ol-bottom') ? 'bottom':'top') +"-"+ ($c.hasClass('ol-left') ? 'left':'right');
  r.legendWidth = ctrl.style.width;
  r.lineHeight = ctrl.style.line_height;
  r.legendParam = { width: r.legendWidth, lineHeight: r.lineHeight };
  r.legendtitle = ctrl.get('title') || ctrl.get('name') ;
  r.legend = [];
  ctrl.getFeatures().forEach(function(f){
    var t = f.getGeometry().getType();
    ol_format_control_Legend.prototype.getStyle(f);
    r.legend.push ({
      name: f.get('title'),
      style: f.getIgnStyle(),
      type: (t=="GeometryCollection") ? "Titre" : t
    });
  }
  );
  return r;
};


/**
* Calcul l'ignstyle de l'objet de la legende a partir de son style (cartes thematique)
* @param {type} f feature
* @todo gerer les glyphs des points > transferer dans les cartes stat ?
*/
ol_format_control_Legend.prototype.getStyle = function (f) {
  // Deja fait!
  if (Object.keys(f.getIgnStyle()).length) return;

  // Convertir le style de l'objet en ignStyle
  var style = f.getStyle();

	// Définition du ignStyle pour Ma carte
	if (style) {
		if (style.length) style = style[0];
		// Cas Points
		if (f.getGeometry().getType()=== 'Point') {
                           var image = f.getStyle()[0].getImage();

                           if(!image) // cas où l'info se trouve sur le deuxième style
                           {
                              image = f.getStyle()[1].getImage();
                           }

   			var stroke = image.getStroke();
			var fill = image.getFill();

			f.setIgnStyle({
				pointRadius: image.getRadius(),
				pointForm: "circle",
				pointGlyph: "ign-form-rond",
				pointColor: stroke ? ol.color.asString(stroke.getColor()) : "rgba(0,0,0,0)",
				symbolColor: fill ? ol.color.asString(fill.getColor()) : "rgba(0,0,0,0)",
				strokeColor: "#3399CC",
				strokeWidth: "1"
			});
		} else {
			// Surface
			var stroke = style.getStroke();
			var fill = style.getFill();
			f.setIgnStyle({
				fillColor: fill ? ol.color.asString(fill.getColor()) : "rgba(0,0,0,0)",
				strokeWidth: stroke ? stroke.getWidth() : "0",
				strokeColor: stroke ? ol.color.asString(stroke.getColor()) : null,
				textColor: "rgba(0, 0, 0, 0)",
				textOutlineColor: "rgba(0, 0, 0, 0)"
			});
		}
	}
};

export default ol_format_control_Legend
