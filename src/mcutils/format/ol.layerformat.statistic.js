/**	@copy (c) IGN - 2017
  @author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
import {inherits as ol_inherits} from 'ol'

import ol_format_layer_Base from './ol.layerformat'
import ol_format_source_Vector from './ol.sourceformat.vector'
import ol_layer_Statistic from '../layer/statisticlayer'

/** Layer statistic format reader/writer.
 * @constructor
 * @extends {ol.format.layer.Base}
 * @requires utils/WMSCapabilities.js
 * @param {} options Options.
 */
var ol_format_layer_Statistique = function(/* options */) {
  // Constructor
  ol_format_layer_Base.call(this);
};
ol_inherits(ol_format_layer_Statistique, ol_format_layer_Base);

/** Lecture
*	@param {} source
*	@return {ol.layer.WMS}
*/
ol_format_layer_Statistique.prototype.read = function (source /*, options */) {
  var lsource = (new ol_format_source_Vector()).read(source.features);
  var layer = new ol_layer_Statistic( { source: lsource } );
  this.setLayerOptions(layer, source);
  // En mode custom on connait le nombre de classe
  if (source.stat.mode==='c') source.stat.classe = true;
  layer.setStatistic(source.stat);
    // Contenu de la popup
  if(source.popupContent)
         layer.setPopupContent(source.popupContent);
  // layer.setComposite (source.stat.compose);
  if (source.stat.compose) layer.filter.set('operation','multiply');
  return layer;
};

/** Ecriture
*	@param {ol.layer.WMS} layer
*	@return {object} source
*/
ol_format_layer_Statistique.prototype.write = function (layer) {
  if (!ol_layer_Statistic || !(layer instanceof ol_layer_Statistic)) return false;
  var s = this.getLayerOptions(layer, { type:"Statistique" });

  var stat = layer.getStatistic();
  // Sauvegarde de tous les autres champs
  s.stat = {
    "typeMap": 1, "cols": 1, "mode": 1, "nbClass": 1,
    "symbol": 1, "rmin": 1, "rmax": 1, "stroke": 1,
    "alpha": 1, "compose": 1, "chartType": 1, "colors": 1,
    "hradius": 1, "hblur": 1
  };

  for (var u in s.stat) s.stat[u] = stat[u];

  if (stat.mode==='c') {
    s.stat.limits = stat.limits;
  }

  if(stat.brewer) {
    // Enregistrement dans Ma carte statistique
    s.stat.brewerColors = stat.brewer.getColors();
  } else {
    // Enregistrement dans Ma carte 
    s.stat.brewerColors = stat.brewerColors;
  }
  //Enregistrement de la Popup
   if(layer.onsave){
     var popup =  layer.onsave();
     layer.setPopupContent(popup);
   }         
  s.popupContent = layer.getPopupContent();

  s.stat.compose = (layer.filter.get('operation')=='multiply');
  s.features = (new ol_format_source_Vector()).write(layer.getSource());
  return s;
};

import { ol_format_layer } from './ol.format'
ol_format_layer.Statistique = ol_format_layer_Statistique

export default ol_format_layer_Statistique
