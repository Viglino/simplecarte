/*
  Copyright (c) 2015 Jean-Marc VIGLINO, 
  released under the CeCILL license (http://www.cecill.info/).
  
*/
import ol_Map from 'ol/Map'
import {transform as ol_proj_transform} from 'ol/proj'
import {easeOut as ol_easing_easeOut} from 'ol/easing'
import {unByKey as ol_Observable_unByKey} from 'ol/Observable'

/** Pulse a point on postcompose
 * @param {ol.coordinates} point to pulse
 * @param {ol.pulse.options} pulse options param
 *  @param {ol.projection|String} options.projection projection of coords
 *  @param {Number} options.duration animation duration in ms, default 3000
 *  @param {Number} options.radius radius of the circle (in px), default 30
 *  @param {Number} options.amplitude movement amplitude (in px), default 0 
 *  @param {ol.easing} options.easing easing function, default ol.easing.easeOut
 *  @param {Number} options.width line width, default 2
 *  @param {ol.color} options.color line color, default red
 */
ol_Map.prototype.pulse = function(coords, options) {
  var listenerKey;
  options = options || {};

  // Change to map's projection
  if (options.projection) {
    coords = ol_proj_transform(coords, options.projection, this.getView().getProjection());
  }
  
  // options
  var start = new Date().getTime();
  var duration = options.duration || 3000;
  var maxRadius = options.radius || 30;
  if (maxRadius<0) maxRadius = 5;
  var minRadius = maxRadius - (options.amplitude || maxRadius); //options.minRadius || 0;
  var easing = options.easing || ol_easing_easeOut;
  var width = options.lineWidth || 2;
  var color = options.color || 'red';

  // Animate function
  function animate(event) {
    var frameState = event.frameState;
    var ratio = frameState.pixelRatio;
    var elapsed = frameState.time - start;
    if (elapsed > duration) ol_Observable_unByKey(listenerKey);
    else {
      var elapsedRatio = elapsed / duration;
      var p = this.getPixelFromCoordinate(coords);
      var context = event.context;
      context.save();
      context.scale(ratio,ratio);
      context.beginPath();
      var e = easing(elapsedRatio)
      var r =  (1-e) * minRadius + e * maxRadius;
      context.arc(p[0], p[1], (r>0?r:0), 0, 2 * Math.PI, false);
      context.globalAlpha = easing(1 - elapsedRatio);
      context.lineWidth = width;
      context.strokeStyle = color;
      context.stroke();
      context.restore();
      // tell OL3 to continue postcompose animation
      frameState.animate = true;
    }
  }

  // Launch animation
  listenerKey = this.on('postcompose', animate, this);
  this.renderSync();
};

