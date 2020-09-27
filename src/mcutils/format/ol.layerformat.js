/**	@copy (c) IGN - 2017
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
/* global $ */
import {inherits as ol_inherits} from 'ol'
import ol_Object from 'ol/Object'

/** Generic format for reading/writing layer.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {} opt_options Options.
 */
var ol_format_layer_Base = function(/* options */) {
  // Constructor
  ol_Object.call(this);
};
ol_inherits(ol_format_layer_Base, ol_Object);

/** read
*/
ol_format_layer_Base.prototype.read = function(/* layer, options */) {
  return false;
};

/** write
*/
ol_format_layer_Base.prototype.write = function(/* layer, options */) {
  return false;
};

/** Set the layers options (visibility, opacity, etc.)
 * @param {ol.layer} layer ol layer
 * @param {} options
 * 	@param {String} options.name name of the layer
 * 	@param {String} options.titre title of the layer
 * 	@param {bool} options.opacity opacity of the layer, default 1
 * 	@param {bool} options.visibility visibility of the layer
*/
ol_format_layer_Base.prototype.setLayerOptions = function(layer, options) {
  options = options || {};
  layer.set('name', options.name);
  layer.set('title', options.name || options.titre);
  layer.set('dessin', options.dessin);
  layer.set('popupHoverSelect', options.popupHoverSelect);
  if (options.opacity!==undefined) layer.setOpacity(options.opacity);
  layer.setVisible(options.visibility);
  layer.set('copyright', options.copyright);
  layer.set('description', options.description);
  layer.set('cluster', options.cluster);
  layer.set("maxZoomCluster", options.maxZoomCluster || 20);
};

/** Get the layers options (visibility, opacity, etc.)
 * @param {ol.layer} layer ol layer
 * @param {} options a list of options to extend
 * @return {} the options
*/
ol_format_layer_Base.prototype.getLayerOptions = function(layer, options) {
  return $.extend(options||{}, {
    name: layer.get("name")||"sans-titre",
    titre: layer.get("title")||"sans-titre",
    visibility: layer.getVisible(),
    opacity: layer.getOpacity(),
    copyright : layer.get('copyright'),
    description : layer.get('desc'),
  });
};

export default ol_format_layer_Base
