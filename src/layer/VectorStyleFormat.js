/*	@copy (c) IGN - 2017
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
import {inherits as ol_inherits} from 'ol'
import ol_Object from 'ol/Object'
import ol_source_Vector from 'ol/source/Vector'
import ol_Feature from 'ol/Feature'

import ol_geom_Point from 'ol/geom/Point.js';
import ol_geom_LineString from 'ol/geom/LineString.js';
import ol_geom_Polygon from 'ol/geom/Polygon.js';
import ol_geom_MultiPoint from 'ol/geom/MultiPoint.js';
import ol_geom_MultiLineString from 'ol/geom/MultiLineString.js';
import ol_geom_MultiPolygon from 'ol/geom/MultiPolygon.js';
import ol_geom_GeometryCollection from 'ol/geom/GeometryCollection.js';

/** Lecture de layer au format macarte.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {} options Options.
 */
var ol_format_source_Vector = function(/* options */) {
  // Constructor
  ol_Object.call(this);
};
ol_inherits(ol_format_source_Vector, ol_Object);


/** Lecture
*	@param {Array} features a list of json feature to read
*	@return {ol.source.Vector}
*/
ol_format_source_Vector.prototype.read = function (features)
{	// Create a source
  var source = new ol_source_Vector();
  //
  var geoms = {
    Point: ol_geom_Point,
    LineString: ol_geom_LineString,
    Polygon: ol_geom_Polygon,
    MultiPoint: ol_geom_MultiPoint,
    MultiLineString: ol_geom_MultiLineString,
    MultiPolygon: ol_geom_MultiPolygon,
    GeometryCollection: ol_geom_GeometryCollection
  }
  // Add features
  for (var i=0, f; f=features[i]; i++){
    var feature = new ol_Feature(f.attributes);
    feature.setGeometry(new geoms[f.type](f.coords));
    if (f.style) feature.setIgnStyle(f.style);
    if (f.popupcontent) feature.setPopupContent(f.popupcontent);
    source.addFeature(feature);
  }
  return source;
};


(function(){
/** Truncate an array of coordinates
* @param { Array<ol.coordinates> | Array<Array<ol.coordinates>> } coords coordinates
* @param { Number } n truncation factor (1000 = 3 digits)
* @private
*/
function filterCoords (coords, n) {
  var i;
  if (coords.length && coords[0] instanceof Array){
    for (i=0; i<coords.length; i++) filterCoords(coords[i], n);
  } else {
    for (i=0; i<coords.length; i++) coords[i] = Math.round(coords[i]*n)/n;
  }
}

/** Ecriture
* @param {ol.source.Vector} source Vector source to write
* @param {} options
*	- trunc {number} truncation factor (1000 = 3 digits)
* @return {Array} an array of json features
*/
ol_format_source_Vector.prototype.write = function (source, options) {
  var trunc = (options && options.trunc) ? options.trunc : 1000;
  var s = [];
  var features = source.getFeatures();
  for (var i=0, f; f=features[i]; i++) {
    var fi = {	
      attributes: f.getProperties(),
      type: f.getGeometry().getType(),
      coords: f.getGeometry().getCoordinates()
    };
    delete fi.attributes.geometry;
    delete fi.attributes.interior;
    filterCoords(fi.coords, trunc);
    if (f.getIgnStyle()) {
      fi.style = f.getIgnStyle();		
      if (fi.style instanceof Array){
        var fistyle = {};
        for (var k in fi.style){
          fistyle[k] = fi.style[k];
        }
        fi.style = fistyle;
      }	
    }
    if (f.getPopupContent()) {
      fi.popupcontent = f.getPopupContent();
    }
    s.push(fi);
  }
  return s;
};

})();

export default ol_format_source_Vector