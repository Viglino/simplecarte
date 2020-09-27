/** Lecture/ecriture de cartes au format Macarte.
 * @namespace ol.format.map
 */
var ol_format_map = {};
export {ol_format_map}

/** Lecture/ecriture de source au format Macarte.
 * @namespace ol_format_source
 */
var ol_format_source = {};
export {ol_format_source}

/** Lecture / ecriture de layers au format Macarte
 * @namespace ol.format.layer
 */
var ol_format_layer = {
  GeoImage: true,
  Geoportail: true, 
  Statistique: true,
  Vector: true
};
export {ol_format_layer}

/** Lecture/ecriture de controls au format Macarte.
 * @namespace ol.format.control
 */
var ol_format_control = {};
export {ol_format_control}

/* Old version ol-ext */
import ol_source_GeoImage from 'ol-ext/source/GeoImage'
import ol_source_ImageCanvas from 'ol/source/ImageCanvas'
if (!ol_source_GeoImage.prototype.getGeoImage) {
  ol_source_GeoImage.prototype.getGeoImage = ol_source_GeoImage.prototype.getImage;
  ol_source_GeoImage.prototype.getImage = ol_source_ImageCanvas.prototype.getImage;
}
