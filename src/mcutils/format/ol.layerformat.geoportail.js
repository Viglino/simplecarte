/**	@copy (c) IGN - 2017
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
import {inherits as ol_inherits} from 'ol'
import ol_format_layer_Base from './ol.layerformat'
import ol_layer_Geoportail from 'ol-ext/layer/Geoportail'

/** Layer Geoportail format reader/writer.
 *
 * @constructor
 * @extends {ol.format.layer.Base}
 * @param {} options Options.
 */
var ol_format_layer_Geoportail = function(/* options */) {
  // Constructor
  ol_format_layer_Base.call(this);
};
ol_inherits(ol_format_layer_Geoportail, ol_format_layer_Base);

/** Lecture
*	@param {} json source
*	@return {ol.layer.VectorStyle}
*/
ol_format_layer_Geoportail.prototype.read = function (source /*, options*/) {
  var layer;
  try {
    layer = new ol_layer_Geoportail( source.layer );
    this.setLayerOptions(layer, source);
    // Ajout d'un identifiant ign sur les fonds Géoportail
    layer.set("ign", true);
    return layer;
  } catch (e) {
    console.error(e.message);
    return false;
  }
};

/** Ecriture
*	@param {ol.layer.Geoportail}
*	@return {object} json data
*/
ol_format_layer_Geoportail.prototype.write = function (layer) {
  if (!(layer instanceof ol_layer_Geoportail)) return false;
  var s = this.getLayerOptions(layer, { type:"Geoportail" });
  s.layer = layer.get('layer');
  return s;
};

import { ol_format_layer } from './ol.format'
ol_format_layer.Geoportail = ol_format_layer_Geoportail

export default ol_format_layer_Geoportail