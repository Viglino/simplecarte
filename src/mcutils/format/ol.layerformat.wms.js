/**	@copy (c) IGN - 2017 
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
import {inherits as ol_inherits} from 'ol'

import ol_format_layer_Base from './ol.layerformat'
import WMSCapabilities from '../utils/WMSCapabilities'

/** Layer WMS format reader/writer.
 *
 * @constructor
 * @extends {ol.format.layer.Base}
 * @requires utils/WMSCapabilities.js
 * @param {} options Options.
 */
var ol_format_layer_WMS = function(/* options */) {
  // Constructor
  ol_format_layer_Base.call(this);
};
ol_inherits(ol_format_layer_WMS, ol_format_layer_Base);

/** Lecture
*	@param {} source
*	@return {ol.layer.WMS} 
*/
ol_format_layer_WMS.prototype.read = function (source) {
  if (source.wmsparam) {
    var layer = WMSCapabilities.getLayer(source.wmsparam);
    layer.set('wmsparam', source.wmsparam);
    this.setLayerOptions(layer, source);
    if (!layer.get('title')) layer.set('title', source.wmsparam.layer.title);
    return layer;
  }
  else return false;
};

/** Ecriture
*	@param {ol.layer.WMS} 
*	@return {object} source
*/
ol_format_layer_WMS.prototype.write = function (layer) {
  // layer.WMSParams : old version deprecated
  if (!layer.get('wmsparam') && !layer.WMSParams) return false;
  var s = this.getLayerOptions(layer, { wms:true, type:"WMS" });
  s.wmsparam = layer.get('wmsparam') || layer.WMSParams;
  return s;
};

import { ol_format_layer } from './ol.format'
ol_format_layer.WMS = ol_format_layer_WMS
