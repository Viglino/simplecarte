/**	@copy (c) IGN - 2018 
	@author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
import {inherits as ol_inherits} from 'ol'
import ol_layer_Image from 'ol/layer/Image'
import ol_source_GeoImage from 'ol-ext/source/GeoImage'
import ol_format_layer_Base from './ol.layerformat'

/* Lecture de layer image au format macarte.
 *
 * @constructor
 * @extends {ol.format.layer.Base}
 * @param {} options Options.
 */
var ol_format_layer_GeoImage = function(/* options */) {
	// Constructor
	ol_format_layer_Base.call(this);
};
ol_inherits(ol_format_layer_GeoImage, ol_format_layer_Base);

/* Lecture
*	@param {} source
*	@return {ol.layer.VectorStyle} 
*/
ol_format_layer_GeoImage.prototype.read = function (options) {
  if (!options || !options.src)
  var source = new ol_source_GeoImage({
    "url": options.url,
    "imageCenter": options.imageCenter,
    "imageRotate": options.imageRotate,
    "imageScale": options.imageScale,
    "imageMask": options.imageMask
  });
  var layer = new ol_layer_Image({
    source: source
  });
  this.setLayerOptions(layer, options);
  return layer;
};

/* Ecriture
* @param {ol.layer.Image} 
* @param {} options
* @return {object} source
*/
ol_format_layer_GeoImage.prototype.write = function (layer /*, options */) {
  if (!(layer instanceof ol_layer_Image) 
  || !(layer.getSource() instanceof ol_source_GeoImage)) {
    return false;
  }
	var s = this.getLayerOptions(layer, { type: "GeoImage" });
  s.url = layer.getSource().getGeoImage().src;
  s.imageCenter = layer.getSource().getCenter();
  s.imageRotate = layer.getSource().getRotation();
  s.imageScale = layer.getSource().getScale();
  s.imageMask = layer.getSource().getMask();
  return s;
};

import { ol_format_layer } from './ol.format'
ol_format_layer.GeoImage = ol_format_layer_GeoImage

export default ol_format_layer_GeoImage
