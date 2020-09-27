/* global $ */
import {inherits as ol_inherits} from 'ol'
import ol_interaction_Draw from 'ol/interaction/Draw'
import ol_geom_Point from '../geom/Point.js';
import ol_geom_LineString from '../geom/LineString.js';
import ol_geom_Polygon from '../geom/Polygon.js';
import ol_geom_MultiPoint from '../geom/MultiPoint.js';
import ol_geom_MultiLineString from '../geom/MultiLineString.js';
import ol_geom_MultiPolygon from '../geom/MultiPolygon.js';
import ol_geom_GeometryCollection from '../geom/GeometryCollection.js';

/**
 * @classdesc
 * Interaction for drawing feature geometries with cancel options
 * to remove the current drawing (ESC) or the last point (Suppr)
 * and validate drawing (ENTER).
 * Add a 'drawing' event when drawing.
 *
 * @constructor
 * @fires drawing
 * @fires drawcancel
 * @param {} options ol.interaction.Draw Options.
 * @extends {ol.interaction.Draw}
 * @api
 */
var ol_interaction_DrawCancel = function(options) {
  options = options || {};
  var self = this;
  if (!options.keys) options.keys = {};
  var keys = {};
  keys.FINISH = options.keys.FINISH || 13;
  keys.CANCEL = options.keys.CANCEL || 27;
  keys.UNDO = options.keys.UNDO || 46;

  // Current sketch feature
  this._currentFeature = null;

  // Drawing function (Dispatch a drawing event)
  var type = options.type;
  var geoms = {
    Point: ol_geom_Point,
    LineString: ol_geom_LineString,
    Polygon: ol_geom_Polygon,
    MultiPoint: ol_geom_MultiPoint,
    MultiLineString: ol_geom_MultiLineString,
    MultiPolygon: ol_geom_MultiPolygon,
    GeometryCollection: ol_geom_GeometryCollection
  }
  var geometryFunction;
  if (options.geometryFunction) {
    geometryFunction = options.geometryFunction;
  } else {
    geometryFunction = function(coordinates, geometry) {
      if (geometry) {
        if (type==='Polygon') {
          // Add a closing coordinate to match the first
          if (coordinates[0].length) {
            geometry.setCoordinates([coordinates[0].concat([coordinates[0][0]])]);
          } else {
            geometry.setCoordinates([]);
          }
        } else {
          geometry.setCoordinates(coordinates);
        }
      } else {
        geometry = new geoms[type](coordinates);
      }
      return geometry;
    };
  }
  options.geometryFunction = function(coordinates, geometry) {
    var coord = (type==='Polygon') ? coordinates[0]: coordinates;
    var geom = geometryFunction(coordinates, geometry);
    if (geometry) {
      self.dispatchEvent({
        type: 'drawing',
        feature: self._currentFeature,
        coordinate: coord[coord.length-1],
      });
    }
    return geom;
  };

  // inherit draw
  ol_interaction_Draw.call(this, options);

  // Key handler
  var keyHandler_ = function(event) {	// prevent action on focus input
    if ($('input:focus, textarea:focus').length) return;
    if (!self._currentFeature) return;
    switch (event.keyCode) {
        case keys.FINISH:
          self.finishDrawing();
          break;
        case keys.CANCEL:
          if (self.getActive()) {
              self.setActive(false);
              self.setActive(true);
          }
          break;
        case keys.UNDO:
          self.removeLastPoint();
          break;
    }
  };

  // Handle key up when drawing
  this.on('drawstart', function(e) {
    this._currentFeature = e.feature;
    $(document).on('keyup', keyHandler_);
  }, this);

  this.on(['drawend', 'drawcancel'], function() {
    this._currentFeature = null;
    $(document).off('keyup', keyHandler_);
  }, this);
};
ol_inherits(ol_interaction_DrawCancel, ol_interaction_Draw);

/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol_interaction_DrawCancel.prototype.setMap = function(map) {
  if (this._currentFeature) this.dispatchEvent('drawcancel');
  ol_interaction_Draw.prototype.setMap.call(this, map);
};

/** Activate or deactivate the interaction
* @param {boolean} b
*/
ol_interaction_DrawCancel.prototype.setActive = function(b) {
  if (this._currentFeature) this.dispatchEvent('drawcancel');
  ol_interaction_Draw.prototype.setActive.call(this, b);
};

/** Bug on removeLastPoint
*/
ol_interaction_DrawCancel.prototype.removeLastPoint = function() {
  if (this._currentFeature) {
    var geom = this._currentFeature.getGeometry();
    if ((geom.getType()=='Polygon' && geom.getCoordinates().length && geom.getCoordinates()[0].length<3)
    || (geom.getType()=='LineString' && geom.getCoordinates().length<2)) return;
    ol_interaction_Draw.prototype.removeLastPoint.call(this);
  }
};

/** Bug on finishdrawing
*/
ol_interaction_DrawCancel.prototype.finishDrawing = function() {
  if (this._currentFeature) {
    // Prevent bad geometry
    var geom = this._currentFeature.getGeometry();
    if ((geom.getType()=='Polygon' && geom.getCoordinates().length && geom.getCoordinates()[0].length<5)
    || (geom.getType()=='LineString' && geom.getCoordinates().length<3)) return;
    // Finish
    ol_interaction_Draw.prototype.finishDrawing.call(this);
  }
};

export default ol_interaction_DrawCancel