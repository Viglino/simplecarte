﻿/* global $*/
import {inherits as ol_inherits} from 'ol'
import ol_control_Control from 'ol/control/Control'

import GeoportailService from '../geoportail/GeoportailService'

/** Print control to manage print preview on an ol3 map
 * @require printcontrol.css
 * @require printcontrolprint.css media="print"
 *
 * @constructor
 * @extends {ol.control.Control}
 * @trigger: preview, close, print, change:orientation
 * @param {} options Control options.
 *  @param {string} options.apiKey Geoportail api key
 */
var ol_control_GeoportailLocate = function(options) {
  options = options || {};
  var self = this;

  // Control
  var element = $('<form>').addClass('ol-locate ol-collapse');
  if (!options.target) element.addClass('ol-unselectable ol-control ol-collapsed');
  var autocomp = $('<ul>').addClass('autocomplete').appendTo(element);
  var input = $('<input>').attr('placeholder', 'rechercher...')
    .attr('type', 'search')
    .prependTo(element);

  // Service de geocodage
  var service = new GeoportailService(options.apiKey);
  var goptions = {
    territoire: 'ALL',
    max: 20,
    poi: true,
    adresse: true,
  };

  // Geocode/autocomplete
  var dComplete = 0;
  var dGeocode = 0;
  var isok = true;

  // Autocompletion
  function autocomplete(t, force) {
    isok = true;
    if ((new Date() - dGeocode) < 500) {
      dComplete=0;
      return;
    }

    if (!force) {
      dComplete++;
      setTimeout(function() {
        autocomplete(t, true);
      }, 500);
      return;
    }
    dComplete--;
    if (dComplete>0) return;

    // Lancer une recherche
    if (t.length>3) {
      autocomp.html($('<li>').text('Recherche en cours...'));
      element.addClass('ol-loading');
      service.autocomplete(t, function(r) {
        autocomp.html('');
        element.removeClass('ol-collapse ol-loading');
        if (r && r.length) {
          for (var i=0; i<r.length; i++) {
            $('<li>').text(r[i].fulltext)
              .on('click touchstart', function() {
                var resp = $(this).data('resp');
                if (resp.y) {
                  isok = false;
                  element.addClass('ol-collapse');
                  if (options.onGeocode) options.onGeocode([resp.x, resp.y], resp);
                  else self.getMap().getView().setCenterAtLonlat([resp.x, resp.y]);
                } else geocode($(this).text(), true);
              })
              .data('resp', r[i])
              .appendTo(autocomp);
          }
        } else {
          var li = $('<li>').html('Impossible de trouver &laquo; <i></i> &raquo;').appendTo(autocomp.html(''));
          $('i', li).text(t);
        }
      }, goptions);
    } else {
      autocomp.html('');
      element.addClass('ol-collapse').removeClass('ol-loading');
    }
  }

  // Geocode
  function geocode(t, center) {
    if (!isok) return;

    dGeocode = new Date();
    // Lancer une recherche
    autocomp.html($('<li>').text('Recherche en cours...'));
    element.addClass('ol-loading');
    service.geocode(t, function(r) {
      var a, li;
      if (r && r.length) {
        if (center) {
          isok = false;
          element.addClass('ol-collapse').removeClass('ol-loading');
          autocomp.html('');
          if (options.onGeocode) options.onGeocode([r[0].lon, r[0].lat], r[0]);
          else self.getMap().getView().setCenterAtLonlat([r[0].lon, r[0].lat]);
        } else {
          element.removeClass('ol-collapse ol-loading');
          autocomp.html('');
          for (var i=0; i<r.length; i++) {
            a = r[i];
            var txt = (a.adresse.num?a.adresse.num:'') + ' '
              + a.adresse.rue + ' ' + a.place.commune +' ('+a.place.departement+') '
              + a.place.nature;
            li = $('<li>').text(txt)
              .on('click touchstart', function() {
                var resp = $(this).data('resp');
                if (resp.lat) {
                  isok = false;
                  element.addClass('ol-collapse').removeClass('ol-loading');
                  if (options.onGeocode) options.onGeocode([resp.lon, resp.lat], resp);
                  else self.getMap().getView().setCenterAtLonlat([resp.lon, resp.lat]);
                }
              })
              .data('resp', a)
              .appendTo(autocomp);
          }
        }
      } else {
        li = $('<li>').html('Impossible de trouver &laquo;&nbsp;<i></i>&nbsp;&raquo;').appendTo(autocomp.html(''));
        $('i', li).text(t);
        element.addClass('ol-collapse').removeClass('ol-loading');
      }
    }, goptions);
  }

  input.blur( function() {
    setTimeout(function() {
      element.addClass('ol-collapse').removeClass('ol-loading');
    }, 300);
  });
  input.keyup(function(e) {
    if (e.key!='Enter') autocomplete($(this).val());
  });
  element.submit(function(e) {
    e.preventDefault();
    geocode(input.val());
  });

  // Init
  ol_control_Control.call(this,{
    element: element.get(0),
    target: options.target,
  });
};
ol_inherits(ol_control_GeoportailLocate, ol_control_Control);

export default ol_control_GeoportailLocate
