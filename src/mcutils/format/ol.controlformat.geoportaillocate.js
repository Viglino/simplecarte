/**	@copy (c) IGN - 2017 
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
import {inherits as ol_inherits} from 'ol'

import ol_format_control_Base from './ol.controlformat'
import ol_control_GeoportailLocate from '../control/geoportaillocate'

/** Generic format for reading/writing layer.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {} options Options.
 */
var ol_format_control_GeoportailLocate = function(/* options */) {
  // Constructor
  ol_format_control_Base.call(this);
};
ol_inherits(ol_format_control_GeoportailLocate, ol_format_control_Base);

/** read
 * @param {} options
 * 	@param {ol.control} options.control an existing control
 */
ol_format_control_GeoportailLocate.prototype.read = function(options) {
  options =  options || {};
  var c = options.control || new ol_control_GeoportailLocate(options);
  c.setVisible(options.visible);
  return c;
};

/** write
 * @todo implementer la fonction
 */
ol_format_control_GeoportailLocate.prototype.write = function(/* map, options */) {
  return false;
};

export default ol_format_control_GeoportailLocate
