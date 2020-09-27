/*	@copy (c) IGN - 2017 
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
/* global $ */
import {inherits as ol_inherits} from 'ol'
import ol_Object from 'ol/Object'
import ol_control_Control from 'ol/control/Control'

/** Add set visible on ol.control
 */
if (!ol_control_Control.prototype.setVisible) {
  /** Set control visibility
  * @param {bool} b the visibility, default true
  */
  ol_control_Control.prototype.setVisible = function (b) {
    if (b===false) $(this.element).addClass("inactif");
    else $(this.element).removeClass("inactif");
    this.changed();
  }

  /** Get control visibility
   */
  ol_control_Control.prototype.getVisible = function () {
    return !$(this.element).hasClass("inactif");
  }
}

/**
 * Abstract base class for reading/writing controls; normally only used for creating subclasses and not instantiated in apps. 
 *
 * @constructor
 * @extends {ol.Object}
 * @param {} options 
 */
var ol_format_control_Base = function(/* options */) {
  // Constructor
  ol_Object.call(this);
};
ol_inherits(ol_format_control_Base, ol_Object);

/** read function
*/
ol_format_control_Base.prototype.read = function(/* map, options */) {
  return false;
};

/** write function
*/
ol_format_control_Base.prototype.write = function(/* map, options */) {
  return false;
};

export default ol_format_control_Base
