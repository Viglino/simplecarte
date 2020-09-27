import ol_Map from 'ol/Map'

/** Get control of a map
* @param {} cl the class to test
* @return {ol.control|false} the first control found or false
*/
ol_Map.prototype.getControlByClass = function (cl) {
  if (!cl) return false;
  var ctrls = this.getControls().getArray();
  for (var i=0, c; c=ctrls[i]; i++) {
    if (c instanceof cl) return c;
  }
  return false;
};


