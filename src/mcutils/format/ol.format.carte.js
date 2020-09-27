/**	@copy (c) IGN - 2018 
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
/* global $ */
import { inherits as ol_inherits } from 'ol'
import ol_Object from 'ol/Object'
import ol_control_Zoom from 'ol/control/Zoom'
import ol_control_ScaleLine from 'ol/control/ScaleLine'
import ol_control_MousePosition from 'ol/control/MousePosition'
import { transform as ol_proj_transform } from 'ol/proj'
import ol_layer_Group from 'ol/layer/Group'

import ol_control_LayerSwitcher from 'ol-ext/control/LayerSwitcher'
import ol_control_SearchGeoportail from 'ol-ext/control/SearchGeoportail'

import ol_control_Legend from '../control/legendcontrol'
import { ol_format_layer } from './ol.format'
import './ol.layerformat.geoimage'
import './ol.layerformat.geoportail'
import './ol.layerformat.imagestyle'
import './ol.layerformat.statistic'
import './ol.layerformat.vector'
import './ol.layerformat.wms'
import ol_format_control_LayerSwitcher from './ol.controlformat.layerswitcher'
import ol_format_control_Legend from './ol.controlformat.legend'
import ol_format_control_ScaleLine from './ol.controlformat.scaleline'
import ol_format_control_MousePosition from './ol.controlformat.mouseposition'


import Map from 'ol/Map'
Map.prototype.getControlByClass = function(k) {
  this.getControls().forEach((c) => {
    if (c instanceof k) return c;
  })
};

/** Lecture/ecriture de cartes au format Macarte.
 * @constructor
 * @extends {ol.Object}
 * @param {} options Options, extend olx.layer.VectorOptions.
 */
var ol_format_map_Macarte = function (/* options */) {
  // Constructor
  ol_Object.call(this);
};
ol_inherits(ol_format_map_Macarte, ol_Object);

/** Read layers into a map
* @param {} json carte
* @param {} options
*	@param {ol.Map} options.map the map to insert layers in
*	@param {bool} options.removeLayers remove existing layers in the map, default true
*	@param {vector|image|cluster} options.vectorType vector layer type, default vector
* @return {Array<ol.layer>}
*/
ol_format_map_Macarte.prototype.readLayers = function (carte, options) {
  options = options || {};
  var i, tab = [];
  var map = options.map;
  // Supprimer les layers existant
  if (map && options.removeLayers !== false) {
    var layers = map.getLayers().getArray() || [];
    for (i = layers.length - 1; i >= 0; i--) {
      map.removeLayer(layers[i]);
    }
  }
  // On rajoute les groups Dessin et Fond de plan si non présents
  if (map.getLayers().getArray().length == 0) {
    // Création d'un groupe de layer dessin et d'un groupe de fonds
    var fondsLayers = new ol_layer_Group({
      title: 'Fond de plan',
      openInLayerSwitcher: true,
      layers: []
    });

    var vectorLayers = new ol_layer_Group({
      title: 'Dessin',
      openInLayerSwitcher: true,
      layers: []
    });
    // Ajout des groupes
    map.addLayer(fondsLayers);
    map.addLayer(vectorLayers);
  }


  // Gestion des layers
  var l;
  for (i = 0; l = carte.layers[i]; i++) {
    var layer;
    if (ol_format_layer[l.type]) {
      var format = new ol_format_layer[l.type]();
      layer = format.read(l);
      if (l.cluster || options.vectorType && layer.setType) layer.setType(l.cluster ? "cluster" : options.vectorType);
      if (l.cluster) {
        layer.set("cluster", true);
      }
      if (layer) {
        layer.set("maxZoomCluster", l.maxZoomCluster || 20);
        // On vérifie la présence ou non du layer
        var verify = function (name) {
          var taille = options.map.getLayers().getLength();
          var names = [];
          for (var i = 0; i < taille; i++) {
            var nLayer = options.map.getLayers().getArray()[i].get('layer');
            if (nLayer) names.push(nLayer);
          }
          if ($.inArray(name, names) >= 0) return true;
          return false;
        }
        // On vérifie que le layer n'est pas déjà présent auquel cas on sort
        var pres;
        if (options.verify) pres = verify(layer.get('layer'));
        if (!pres) {
          tab.push(layer);
          if (map) {
            if (options.group) {
              // On ajoute au groupe concerné
              if (layer.get('dessin'))
                this.getGroupByTitle(map, 'Dessin').getLayers().push(layer);
              else // Fond de plan
              {
                this.getGroupByTitle(map, 'Fond de plan').getLayers().push(layer);
                this.getGroupByTitle(map, 'Fond de plan').setGPPKey(apiKey);
              }
            } else {
              map.addLayer(layer);
            }
          }
        }
      } else {
        console.error("Error reading layer type " + l.type);
      }
    }
    else {
      console.error("No reader for layer type " + l.type);
    }
  }
  return tab;
};

/***
 * Get groupe by name
 */
ol_format_map_Macarte.prototype.getGroupByTitle = function (map, title) {
  var group = map.getLayers().getArray().filter(
    function (item) {
      if (item.get('title') == title)
        return true;
    });
  return group[0];
};

/** Write layers of a map
* @param {Array<ol.layer>} layers array of layers to write
* @param {} options
* @return {Array} exported layers
*/
ol_format_map_Macarte.prototype.writeLayers = function (layers, options) {
  options = options || {};
  var tab = [];
  // Gestion des layers
  for (var i = 0, l; l = layers[i]; i++) {
    for (var lf in ol_format_layer) {
      var format = new ol_format_layer[lf]();
      var layer = format.write(l, options);
      if (layer) {
        if (l.get("cluster"))
          layer.cluster = true;
        if (l.get("maxZoomCluster"))
          layer.maxZoomCluster = l.get("maxZoomCluster");
        tab.push(layer);
        break;
      }
    }
  }
  return tab;
};

/** Lecture des controles presents sur la carte
* @param {} carte json carte
* @param {} opt_options
*	@param {} opt_options.map la map dans laquelle on charge
* @return {Array<ol.control>} liste de controls
*/
ol_format_map_Macarte.prototype.readControls = function (carte, opt_options) {
  var controls = [];
  var map = opt_options.map || { getControlByClass: function () { return false; } };
  for (var i in carte.param.controlParams) {
    var options = { visible: carte.param.controlParams[i] == "1" };
    var c;
    switch (i) {
      case 'zoomBtn':
        var control = map.getControlByClass(ol_control_Zoom);
        if (control) {
          control.setVisible(options.visible);
        } else {
          c = new ol_control_Zoom(options);
          map.addControl(c);
          c.setVisible(options.visible);
        }
        break;
      case 'selectLayer':
      case 'layerswitcher':
        options.control = map.getControlByClass(ol_control_LayerSwitcher);
        if (options.control && !options.visible) {
          options.control.setVisible(options.visible);
          break;
        }
        c = (new ol_format_control_LayerSwitcher).read(options);
        if (!options.control) {
          map.addControl(c);
          c.setVisible(options.visible);
        } else {
          options.control.setVisible(options.visible);
        }
        break;
      case 'legend':
        // TODO n'affiche pas au chargement voir pourquoi
        // if(!options.visible) break;
        var legOptions = $.extend(true, {}, carte.legende || {});
        if (!legOptions.legend) {
          legOptions.legendVisible = false;
        }
        if (legOptions.legendParam) legOptions.lineHeight = legOptions.legendParam.lineHeight;
        legOptions.control = map.getControlByClass(ol_control_Legend);
        c = (new ol_format_control_Legend).read(legOptions);
        if (!legOptions.control) {
          map.addControl(c);
          c.setVisible(legOptions.legendVisible);
        } else {
          legOptions.control.setVisible(options.visible);
        }
        break;
      case 'scaleLine':
        if (!options.visible) break;
        options.control = map.getControlByClass(ol_control_ScaleLine);
        c = (new ol_format_control_ScaleLine).read(options);
        if (!options.control) {
          map.addControl(c);
          c.setVisible(options.visible);
        } else {
          options.control.setVisible(options.visible);
        }
        break;
      case 'coords':
        if (!options.visible) break;
        options.unite = carte.param.proj.unite;
        options.projection = carte.param.proj.valeur;
        options.className = "custom-ol-mouse-position";
        options.control = map.getControlByClass(ol_control_MousePosition);
        c = (new ol_format_control_MousePosition).read(options);
        if (!options.control) {
          map.addControl(c);
          c.setVisible(options.visible);
        } else {
          options.control.setVisible(options.visible);
        }
        break;
      case 'pSearchBar':
        if (!options.visible) break;
        options.control = map.getControlByClass(ol_control_earchGeoportail);
        options.apiKey = map.gppKey;
        options.placeholder = "Rechercher une adresse...";
        c = new ol_control_SearchGeoportail(options);
        if (!options.control) {
          map.addControl(c);
          c.setVisible(options.visible);
          c.on('select', function (r) {
            map.getView().setCenterAtLonlat([r.search.x, r.search.y]);
            map.getView().setZoom(17);
            $(this).css('display', 'none');
          });
        } else {
          options.control.setVisible(options.visible);
        }
        break;
      case 'attribution':
        var k = 0;
        var att_l = map.getLayers().getArray();
        for (k = 0; k < map.getLayers().getArray().length; k++) {
          if (att_l[k].get('copyright')) {
            var attr = '' + att_l[k].get('copyright') + '';
            // Mise à jour des attributions
            att_l[k].getSource().setAttributions(attr);
          }
        }
        break;
      case 'limitGeo':
      case 'contextMap':
      default:
        break;
    }
    if (c) controls.push(c);
  }
  return controls;
};


/** Read carte
* @param {ol.Map} map the map to read
* @param {} carte json carte object
* @param {} options
*/
ol_format_map_Macarte.prototype.readCarte = function (map, carte, options) {
  options = options || {};
  // Gestion de la carte
  map.set('carte', carte.param);
  if (options.center) {
    map.getView().setCenterAtLonlat([Number(carte.param.lon), Number(carte.param.lat)], Number(carte.param.zoom));
    map.getView().setRotation(Number(carte.param.rot) || 0);
  }
  // Gestion des layers
  options.map = map;
  this.readLayers(carte, options);
  // Gestion des controls
  this.readControls(carte, options);
  // Symboles
  map.symbolLib = carte.symbolLib;
};

/** Write carte
* @param {ol.Map} map the map to write
* @param {} options
* @return {} exported json carte
*/
ol_format_map_Macarte.prototype.writeCarte = function (map, options) {
  options = options || {};
  var carte = { param: {}, legende: {}, layers: {}, symbolLib: {} };
  var lonlat;
  // Gestion de la carte
  carte.param = map.get('carte');
  if (carte.param && options.controlParams) carte.param.controlParams = options.controlParams;
  if (!carte.param) {
    lonlat = ol_proj_transform(map.getView().getCenter(), map.getView().getProjection(), "EPSG:4326");
    carte.param = {
      "lon": lonlat[0],
      "lat": lonlat[1],
      "rot": map.getView().getRotation(),
      "zoom": map.getView().getZoom(),
      "titre": "Sans titre",
      "description": "Pas de description",
      "status": "brouillon",
      "controlParams": options.controlParams || { "limitGeo": "1", "zoomBtn": "1", "selectLayer": "1", "contextMap": "1", "legend": "1", "scaleLine": "1", "pSearchBar": "0", "coords": "1", "attribution": "1" },
      "proj": options.proj || { "valeur": "EPSG:4326", "unite": "ds" }
    };
  } else {
    lonlat = ol_proj_transform(map.getView().getCenter(), map.getView().getProjection(), "EPSG:4326");
    carte.param.lon = lonlat[0];
    carte.param.lat = lonlat[1];
    carte.param.zoom = map.getView().getZoom();
    carte.param.rot = map.getView().getRotation();
  }
  // Gestion des layers
  carte.layers = this.writeLayers(map.getLayers().getArray(), options);
  // Legende
  carte.legende = (new ol_format_control_Legend).write(map.getControlByClass(ol_control_Legend), options);
  // Symboles
  carte.symbolLib = map.symbolLib;
  // Symboles
  return carte;
};

export default ol_format_map_Macarte
