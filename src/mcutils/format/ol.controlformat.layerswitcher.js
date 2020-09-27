/**	@copy (c) IGN - 2017 
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
import {inherits as ol_inherits} from 'ol'

import ol_control_LayerSwitcher from 'ol-ext/control/LayerSwitcher'

import ol_format_control_Base from './ol.controlformat'

/** Generic format for reading/writing layer.
 *
 * @constructor
 * @extends {ol.format.control.Base}
 * @param {} options Options.
 */
var ol_format_control_LayerSwitcher = function(/* options */) {
  // Constructor
  ol_format_control_Base.call(this);
};
ol_inherits(ol_format_control_LayerSwitcher, ol_format_control_Base);

/** read
 * @param {} options
 * 	@param {ol.control} options.control an existing control
 */
ol_format_control_LayerSwitcher.prototype.read = function(options) {
  options =  options || {};
  var lswitch = options.control || new ol_control_LayerSwitcher(options);
  lswitch.setVisible(options.visible);
  return lswitch;
};

/** write
 * @todo implementer la fonction
 */
ol_format_control_LayerSwitcher.prototype.write = function(/* map, options */) {
  return false;
};

export default ol_format_control_LayerSwitcher
