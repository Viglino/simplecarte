/* global $ */
/* global FileSaver */
import {inherits as ol_inherits} from 'ol'
import ol_layer_Vector from 'ol/layer/Vector'
import ol_Feature from 'ol/Feature'
import ol_source_Vector from 'ol/source/Vector'
import ol_geom_Point from 'ol/geom/Point'
import ol_geom_LineString from 'ol/geom/LineString'

import ol_control_Profil from 'ol-ext/control/Profile'

import GeoportailService from '../geoportail/GeoportailService'

/*	Copyright (c) 2016 Jean-Marc VIGLINO,
  released under the CeCILL-B license (French BSD license)
  (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/**
 * @classdesc OpenLayers 3 Profil Control.
 *	Draw a profil of a feature. Retrieve Z information using Geoportail services if none.
 *
 * @constructor
 * @extends {ol.control.Profil}
 * @param {} options extends ol.control.ProfilOptions
 *  @param { string } options.apiKey Geoportail api key
 *  @param { ol.Collection<ol.Feature> } options.feature Collection of feature : the first one will be display on the graph
 *  @param { ol.style.Style | Array<ol.style.Style> | ol.styleFunction | null } options.style layer style
 */
var ol_control_ProfilGP = function(options) {
  options = options || {};
  var self = this;

  var features = options.feature;
  delete options.feature;
  features.on('add', this.addFeature.bind(this));
  this.service = new GeoportailService(options.apiKey);

  ol_control_Profil.call(this, options);

  this.set('amplitude', options.amplitude || 500);

  // Export button
  $('<a>').text('Enregistrer')
    .click(function(e) {
      if (window.FileSaver) {
        try {
          self.getImage('canvas').toBlob(function(blob) {
            FileSaver.saveAs(blob, 'profil.png');
          }, 'image/png');
        } catch (e) {
          console.error('Bad canvas!');
        }
        return;
      } else console.error('FileSaver lib missing!');
      e.preventDefault();
    })
    .appendTo($('.ol-inner > div', this.element));
  // Info div
  $('<div>').hide()
    .addClass('ol-info')
    .appendTo($('.ol-inner', this.element));

  // Overlay to show a point when pointing the graph
  this.overlayLayer_ = new ol_layer_Vector({ 
    source: new ol_source_Vector({useSpatialIndex: false}),
    style: options.style,
  });
  var pt = new ol_Feature(new ol_geom_Point([0, 0]));
  pt.setStyle([]);
  this.overlayLayer_.getSource().addFeature(pt);

  this.on('over', (function(e) {
    // Show point at coord
    pt.setGeometry(new ol_geom_Point(e.coord));
    pt.setStyle(null);
    this.popup(e.coord[2]+' m');
  }).bind(this));
  this.on('out', function() {
    pt.setStyle([]);
  });

  // On show draw feature's profil
  this.on('show', (function(e) {
    pt.setStyle([]);
    if (e.show) this.addFeature({element: features.item(0)});
  }).bind(this));
};
ol_inherits(ol_control_ProfilGP, ol_control_Profil);

/**
 * Remove the control from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol_control_ProfilGP.prototype.setMap = function(map) {
  if (this.getMap()) this.getMap().removeLayer(this.overlayLayer_);
  ol_control_Profil.prototype.setMap.call(this, map);
  this.overlayLayer_.setMap(map);
};

/** A new feature has been added to the collection
*/
ol_control_ProfilGP.prototype.changeFeature = function() {
  if (this.currentFeature) {
      if(this.listener_change)
      {
        ol.Observable.unByKey(this.listener_change);
        this.listener_change = null;
      }
    this.currentFeature = null;
  }
};

/** A new feature has been added to the collection
*/
ol_control_ProfilGP.prototype.addFeature = function(e) {	// Show the graph
  if (this.isShown() && e.element) {
    if (e.element === this.currentFeature) {
      $('.ol-inner div', this.element).first().show();
      $('.ol-inner div', this.element).last().hide();
      return;
    }
    if (this.currentFeature){
      if(this.listener_change)
      {
        ol.Observable.unByKey(this.listener_change);
        this.listener_change = null;
      }
    } 
    this.currentFeature = e.element;
    this.listener_change = this.currentFeature.on('change', this.changeFeature.bind(this));
    var g = e.element.getGeometry();
    if (g.getType()==='LineString') {	
      // Allready get Z
      if (/Z/.test(g.getLayout())) {
        $('.ol-inner div', this.element).first().show();
        $('.ol-inner div', this.element).last().hide();
        this.setGeometry(g);
      }
      // Load Z
      else {	
        // Limit to 200 points
        var nb=0;
        while (g.getCoordinates().length>200) {
          var g2 = g.simplify(++nb);
          if (g2.getCoordinates().length<200) g = g2;
        }
        // Go
        g = g.clone().transform(this.getMap().getView().getProjection(), 'EPSG:4326').getCoordinates();
        var lon=[]; var lat=[];
        for (var i=0; i<g.length; i++) {
          lon.push(g[i][0]);
          lat.push(g[i][1]);
        }

        // Waiting info
        $('.ol-inner div', this.element).first().hide();
        $('.ol-inner div', this.element).last().html('Chargement...').addClass('ol-wait').show();
        var self = this;
        // Get altimetry
        var nbPts = Math.max(g.length, this.get('points') || 50);
        if (!this.requestCount) this.requestCount=0;
        var requestCount = ++this.requestCount;
        this.currentRequest = this.service.altimetryLine(lon, lat, nbPts, function(pts) {	// old request
          if (self.requestCount !== requestCount) return;
          if (pts) {
            var c = [];
            for (var i=0, l=pts.length; i<l; i++) {
              c.push([pts[i].lon, pts[i].lat, pts[i].z]);
            }
            g = new ol_geom_LineString(c);
            g.transform('EPSG:4326', self.getMap().getView().getProjection());
            self.setGeometry(g, {amplitude: self.get('amplitude')});
            // Loaded
            $('.ol-inner div', this.element).first().show();
            $('.ol-inner div', this.element).last().hide();
          }
        });
      }
      return;
    }
  }
  // Nothing to do
  $('.ol-inner div', this.element).first().hide();
  $('.ol-inner div', this.element).last().removeClass('ol-wait').html('Sélectionnez une ligne <br/> pour afficher son profil...').show();
};

export default ol_control_ProfilGP
