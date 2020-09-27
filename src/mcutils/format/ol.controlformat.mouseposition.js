/**	@copy (c) IGN - 2017
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
import {inherits as ol_inherits} from 'ol'
import ol_control_MousePosition from 'ol/control/MousePosition'
import {format as ol_coordinate_format} from 'ol/coordinate'
import {toStringHDMS as ol_coordinate_toStringHDMS} from 'ol/coordinate'
import {createStringXY as ol_coordinate_createStringXY} from 'ol/coordinate'

import ol_format_control_Base from './ol.controlformat'

/** Generic format for reading/writing layer.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {} options Options.
 */
var ol_format_control_MousePosition = function(/* options */) {
  // Constructor
  ol_format_control_Base.call(this);
};
ol_inherits(ol_format_control_MousePosition, ol_format_control_Base);

/** Formatage des coordonnees
*/
ol_format_control_MousePosition.prototype.getCoordinateFormat = function(options) {
  switch (options.projection) {
    case 'EPSG:3857': {
      return function(coord) {
        ol_coordinate_format(coord, "<div>Est: {x}m </div><div> Nord: {y}m</div>", 2);
      }
    }
    case 'EPSG:4326': {
      if (options.unite === "ds") {
        return function(coord) {
          return ol_coordinate_toStringHDMS(coord).replace(/ /g,"").replace("N","N ").replace("S","S ");
        }
      } else {
        return function(coord) {
          return ol_coordinate_format(coord, "<div>Longitude: {x}°</div><div> Latitude: {y}°</div>", 6);
        }
      }
    }
    default: return ol_coordinate_createStringXY(5);
  }
};

/** read
 * @param {} options
 * 	@param {ol.control} options.control an existing control
 */
ol_format_control_MousePosition.prototype.read = function(options) {
  options =  options || {};
  options.className = options.className || "ol-control ol-mouse-position";
  options.coordinateFormat = this.getCoordinateFormat(options);
  var c = options.control || new ol_control_MousePosition(options);
  c.setVisible(options.visible);
  return c;
};

/** write
 * @todo implementer la fonction
*/
ol_format_control_MousePosition.prototype.write = function(/* map, options */) {
  return false;
};

export default ol_format_control_MousePosition