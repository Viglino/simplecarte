/**	@copy (c) IGN - 2017
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
import {inherits as ol_inherits} from 'ol'

import ol_format_layer_Base from './ol.layerformat'
import ol_format_source_Vector from './ol.sourceformat.vector'
import ol_layer_VectorStyle from '../layer/ol.layer.vectorstyle'

/** Lecture/ecriture de layer au format macarte.
 *
 * @constructor
 * @extends {ol.format.layer.Base}
 * @param {} options Options.
 */
var ol_format_layer_Vector = function(/* options */) {
  // Constructor
  ol_format_layer_Base.call(this);
};
ol_inherits(ol_format_layer_Vector, ol_format_layer_Base);


/** Lecture
*	@param {} source json data source
*	@return {ol.layer.VectorStyle}
*/
ol_format_layer_Vector.prototype.read = function (source, options)
{	options = options||{};
  // Create a source
  options.source = (new ol_format_source_Vector()).read(source.features);
  // The layer
  var layer = new ol_layer_VectorStyle( options );
  this.setLayerOptions(layer, source);
  layer.setPopupContent(source.popupContent || source.popupcontent);
  var style = source.style||{};
        if (!style.pointStrokeWidth) {
            style.pointStrokeWidth = 2;
            style.pointStrokeColor = 'rgba(0,0,0,0)';
        }
        layer.setIgnStyle(style);        
  layer.set('allwaysOnTop',true);
  // Chargement des attributions
  layer.getSource().setAttributions(layer.get('copyright') || "");
  return layer;
};

/** Ecriture
* @param {ol.layer.VectorStyle}
* @param {} options
*	@param {number} options.trunc truncation factor (1000 = 3 digits)
* @return {object} json data
*/
ol_format_layer_Vector.prototype.write = function (layer, options)
{	if (!(layer instanceof ol_layer_VectorStyle)) return false;
  var s = this.getLayerOptions(layer, { dessin:true, type:"Vector", popupHoverSelect: layer.get("popupHoverSelect") });
  s.popupContent = layer.getPopupContent();
  s.style = layer.getIgnStyle()||{};
  s.features = (new ol_format_source_Vector()).write(layer.getSource(), options);
  return s;
};

import { ol_format_layer } from './ol.format'
ol_format_layer.Vector = ol_format_layer_Vector

export default ol_format_layer_Vector