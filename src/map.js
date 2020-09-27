import 'ol/ol.css';
import 'ol-ext/dist/ol-ext.css';
import './map.css'
import './layer/md2html.css'

import {Map,View} from 'ol'
import {defaults as defaultControls} from 'ol/control.js';
import {defaults as defaultInteractions, Select} from 'ol/interaction.js';
import Permalink from 'ol-ext/control/Permalink'
import VectorStyle from './layer/VectorStyle'
import LayerGeoportail from 'ol-ext/layer/Geoportail'
import olAjax from 'ol-ext/util/Ajax'
import VectorStyleFormat from './layer/VectorStyleFormat'

import MapZone from 'ol-ext/control/MapZone'
import Tile from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import {click} from 'ol/events/condition'
import LayerSwitcher from 'ol-ext/control/LayerSwitcher'
import Popup from 'ol-ext/overlay/Popup'
import ScaleLine from 'ol-ext/control/CanvasScaleLine'

//import md2html from './layer/md2html';

import jQuery from 'jquery';
window.$ = jQuery;
window.jQuery = jQuery;
import FormatCarte from './mcutils/format/ol.format.carte'


/** Create a default map
 */
function createMap(target) {
  const url = target.getAttribute('data-carte');
  if (!url) return
  const map = new Map({
    target: target,
    view: new View({
      center: [273746, 5850095],
      zoom: 6
    })
  });

  olAjax.get({
    url: url,
    success: (macarte) => {
      const format = new FormatCarte();
      console.log(format, carte)
      format.readCarte(map, macarte)
    },
    error: () => console.log('oops')
  });
  return;


  // Add Geoportail layers 
  const photo = new LayerGeoportail({ 
    layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
    visible: false
  });
  map.addLayer(photo);
  const carte = new LayerGeoportail({ 
    layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD'
  });
  map.addLayer(carte);

  let mkdown = "##%nom% (%insee%)\n"
      +"[Info Agence Régionale de Santé :fa-external-link:](%info_ars%)\n"
      +"[Info Préfecture :fa-external-link:](%info_prefecture%)";

  olAjax.get({
    url: './data/info.md',
    dataType: 'text',
    success: (md) => {
      mkdown = md.replace(/\r\n/g,'\n');
    }
  });

  // DOM + metropole
  MapZone.zones.DOM.unshift(MapZone.zones.DOMTOM[0]);
  const zones = new MapZone({ 
    zones: MapZone.zones.DOM,
    layer:  new Tile({
      source: new XYZ({
        url: 'https://wxs.ign.fr/pratique/geoportail/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}}&TileRow={y}'
      })
    })  
  });
  map.addControl(zones);

  // Layer Ma carte
  let vector;

  olAjax.get({
    url: './data/guichet.carte',
    success: (macarte) => {
      const format = new VectorStyleFormat();
      const features = macarte.layers[1].features;
      const source = format.read(features)
      vector = new VectorStyle({
        name:"Déconfinement",
        source: source
      });
      if (macarte.layers[1].popupContent && macarte.layers[1].popupContent.desc) {
        mkdown = macarte.layers[1].popupContent.desc.replace(/\r\n/g, '');
      }
      vector.setType('image');
      map.addLayer(vector);
      // add to zones
      zones.getMaps().forEach((m) => {
        m.addLayer(new VectorStyle({
          name:"Déconfinement",
          source: source
        }));
      })
    },
    error: () => console.log('oops')
  });


  const popup = new Popup({ className: 'default shadow anim', closeBox: true });
  map.addOverlay(popup);

  //import Select from 'ol/interaction/Select'
  const select = new Select({
    condition: click
  });
  select.on('select', (e) => {
    const f = e.selected[0];
    popup.hide();
    if (f) {
      var content = '<div class="md">' + md2html(mkdown, f.getProperties()) +'</div>';
      popup.show(e.mapBrowserEvent.coordinate, content)
    }
  })
  map.addInteraction(select);
}

/* Create all maps */
const mapDiv = document.querySelectorAll('div.macarte-widget');
for (let i=0, c; c =mapDiv[i]; i++) {
  createMap(c);
}

/* Create maps in iframe */
const iframe = document.querySelectorAll('iframe.macarte-widget');
for (let i=0, c; c=iframe[i]; i++) {
  const doc = c.contentWindow.document;
  //doc.write('<script src="./font-awesome.min.js"></script>');
  //doc.write('<link rel="stylesheet" href="./www/macarte.css"></head>');
}

export default {
  create: createMap
}

