/* 
	WMS Layer with EPSG:4326 projection.
	The tiles will be reprojected to map pojection (EPSG:3857).
	NB: reduce tileSize to minimize deformations on small scales.
*/
/* Need proj4js to load IGN-France projections
*/
/* global $ */
import $ from 'jquery'
import ol_source_TileWMS from 'ol/source/TileWMS'
import ol_layer_Tile from 'ol/layer/Tile'
import {transformExtent as ol_proj_transformExtent} from 'ol/proj'
import {get as ol_proj_get} from 'ol/proj'
import ol_format_WMSCapabilities from 'ol/format/WMSCapabilities'

if (window.proj4) {
	if (!window.proj4.defs["EPSG:2154"]) window.proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
	if (!window.proj4.defs["IGNF:LAMB93"]) window.proj4.defs("IGNF:LAMB93","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
}

/** WMSCapabilities
 * @constructor
 * @param {String} proxy proxy to use when requesting Getcapabilites, default none (suppose the service use CORS)
 */
var WMSCapabilities = function (proxy) {
  this.proxy = proxy;
};

/** Enable trace, ie. display the resulting parameters on console
 * @param {bool} b true to display trace, default false
 */
WMSCapabilities.setTrace = function(b) {
	WMSCapabilities.prototype.trace = b;
}

/** Convert capabilities to options
 * @param {} layer layer capabilities (read from the capabilities)
 * @param {} options
 * @return {} the options to create the ol.layer.WMS
*/
WMSCapabilities.prototype.getOptionsFromCap = function(layer, options) {
	var i;
	if (!options) options={};
	options = $.extend({
    isBaseLayer: false,
    minScale: layer.MinScaleDenominator,
    maxScale: layer.MaxScaleDenominator,
    attribution: layer.Attribution
  }, options);
	var format = false;
	// Look for prefered format first
	var pref =[/png/,/jpeg/,/gif/];
	for (i=0; i<3; i++) {
    for (var f=0; f<layer.Format.length; f++) {
      if (pref[i].test(layer.Format[f])) {
        format=layer.Format[f];
				break;
			}
		}
		if (format) break;
	}
	if (!format) format = layer.Format[0];

	// Check srs
	var srs = options.srs || 'EPSG:3857';
//	var srserror = false;

	if (!layer.CRS || layer.CRS.indexOf(srs)<0) {
    //srserror = true;
	/* try to change srs ??? */
		if (window.proj4) {
      //if (layer.CRS && layer.CRS.indexOf("EPSG:4326")>=0) srs = "EPSG:4326";
//			console.log(layer.CRS)
			if (layer.CRS && layer.CRS.indexOf("EPSG:2154")>=0) srs = "EPSG:2154";
			else if (layer.CRS && layer.CRS.indexOf("EPSG:4326")>=0) srs = "EPSG:4326";
			else console.log("ERROR "+srs);
		}
	/**/
	}
	
	var bbox, bb = layer.BoundingBox;
  if (bb) {
    for (i = 0; i < bb.length; i++) {
      // On reconstruit les extent pour avoir la bonne etendue
      var ext = bb[i].extent;
      var extent = [ext[1], ext[0], ext[3], ext[2]];
      
      // le formatage des extent n'est pas standard, donc on gere differents cas
      if (/4326/.test(bb[i].crs) || /CRS:84/.test(bb[i].crs)) {
        if (bb[i].extent[0] > 100) bbox = extent;
        else {
          if (ext[1] < 0) {
            bbox = ol_proj_transformExtent(extent, bb[i].crs, 'EPSG:3857');
          } else {
            bbox = ol_proj_transformExtent(ext, bb[i].crs, 'EPSG:3857');
          }
          var world = ol_proj_get("EPSG:3857").getExtent();
          for (var p=0; p<4; p++) {
            if (!bbox[p]) bbox[p] = world[p];
          }
        }
        break;
      }

      if (/3857/.test(bb[i].crs)) {
        bbox = ext;
        break;
      }
    }
  }
	
	function getresolution(m, layer, val) {
    var att;
		if (m=="min") att = "MinScaleDenominator";
		else att = "MaxScaleDenominator";

		if (typeof (layer[att]) != "undefined") return layer[att]/(72/2.54*100);

		if (!layer.Layer) return (m=="min" ? 0 : 156543.03392804097);

		// Get min / max of contained layers
		val = (m=="min" ? 156543.03392804097 : 0);
		for (var i=0; i<layer.Layer.length; i++) {
      var res = getresolution(m, layer.Layer[i], val);
			if (typeof(res) != "undefined") val = Math[m](val, res);
		}
		return val;
  }
  
	function getattribution(layer) {
    if (layer.Attribution) {
      return "<a href='"+layer.Attribution.OnlineResource+"'>&copy; "+layer.Attribution.Title+'</a>';
    }
		if (layer.Layer) {
      for (var i=0; i<layer.Layer.length; i++) {
        var attrib = getattribution(layer.Layer[i]);
				if (attrib) return attrib;
			}
		}
		return null;
	}
	var originator;
	if (layer.Attribution) {
    originator = {};
		originator[layer.Attribution.Title] = {
      attribution: layer.Attribution.Title,
      constraint: [],
      href: layer.Attribution.OnlineResource,
      logo: layer.Attribution.LogoURL ? layer.Attribution.LogoURL.OnlineResource : null
    }
	}
	var layer_opt = {
    title: options.title || layer.Title,
		extent: bbox,
		minResolution: getresolution("min",layer),
		maxResolution: getresolution("max",layer)
	};
	if (layer_opt.maxResolution==0) layer_opt.maxResolution = 156543.03392804097;

	var attr_opt = 	{ html:getattribution(layer) };
	var source_opt = {
    url: layer.url,
		projection: srs,
		crossOrigin: options.cors ? 'anonymous':null,
		params: {
      'LAYERS': layer.Name,
			'FORMAT': format,
//			'EXCEPTIONS': 'application/vnd.ogc.se_xml', // 'application/vnd.ogc.se_inimage' 'application/vnd.ogc.se_blank'
			'VERSION': layer.version || "1.3.0"
		}
	}
	// Set map if exists
	if (layer.map) source_opt.params.MAP = layer.map;

	// Trace
	if (this.trace) {
    if (attr_opt.html) source_opt.attributions = [	"new ol.Attribution("+JSON.stringify(attr_opt).replace(/\\"/g,'"')+")" ];
		var tso = JSON.stringify([ source_opt ], null, "\t").replace(/\\"/g,'"');
		layer_opt.source = "new ol.source.TileWMS("+tso+")";
		var t = "new ol.layer.Tile (" +JSON.stringify(layer_opt, null, "\t")+ ")" 
		t = t.replace(/\\"/g,'"')
			.replace(/"new/g,'new')
			.replace(/\)"/g,')')
			.replace(/\\t/g,"\t").replace(/\\n/g,"\n")
			.replace("([\n\t","(")
			.replace("}\n])","})");
		console.log(t);
	}

	// Legend
	var legend = [];
	for (i in layer.Style) if (layer.Style[i].LegendURL) {
    legend.push(layer.Style[i].LegendURL[0].OnlineResource);
	}

	return { 
    layer: layer_opt, 
    source: source_opt, 
    attribution: attr_opt, 
    originator: originator, 
    legend: legend 
  };
};

/** Return a WMS ol.layer.Tile for the given options
 * @param {} options
 * @static
 */
WMSCapabilities.getLayer = function(options) {
  var opt = $.extend(true, {}, options);

	// Create layer
	if (opt.attribution.html) opt.source.attributions = [ 
		opt.attribution.html 
	];

	opt.layer.source = new ol_source_TileWMS(opt.source);
	var wms = new ol_layer_Tile (opt.layer);
	wms._originators = opt.originator;
	// Save WMS options
	// wms.WMSParams = options;
	wms.set('wmsparam', options);
	return wms;
}

/** Return a WMS ol.layer.Tile for the given capabilities
 * @param {} layer layer capabilities (read from the capabilities)
 * @param {} options 
 */
WMSCapabilities.prototype.getLayerFromCap = function(layer, options) {
  var opt = this.getOptionsFromCap(layer, options);
	return WMSCapabilities.getLayer(opt);
}

/** Get WMS capabilities for a server
 * @param {string} url service url
 * @param {function} callback function called with an array of layers 
 * @param {string} map map of the service, default no map
 * @param {string} version WMS version, default 1.3.0
 * @param {Number} timeout
*/
WMSCapabilities.prototype.get = function(url, callback, map, version, timeout) {
  // Format url	
	var uri = url + "?SERVICE=WMS&VERSION="+(version||'1.3.0')+"&REQUEST=GetCapabilities";
	if (map) uri += "&map="+map;
	if (this.proxy) uri = this.proxy +"?url="+ encodeURIComponent( url + "?SERVICE=WMS&VERSION="+(version||'1.3.0')+"&REQUEST=GetCapabilities" );

	$.ajax(uri, { timeout:timeout||10000, dataType:'text' })
	.fail(function(/*response*/) {
    if (callback) callback ([]);
	})
	.done(function(response) {
    var layers = [];

		if (response) {
      var parser = new ol_format_WMSCapabilities();

			var xmlDoc, $xml;
			try {
        xmlDoc = $.parseXML( response ); 
				$xml = $(xmlDoc);
			} catch(e) {
        if (callback) callback ([]);
				return;
			}
			
			var nodes = $("Capability > Layer", $xml);
			var r;

			var addLayers = function(l, crs, level) {
        if (!level) level = 0;
				l.url = url;
				l.service = r.Service;
				if (map) l.map = map;
				l.Format = r.Capability.Request.GetMap.Format;
				l.version = r.version;
				l.level = level;
				if (crs) {
          if (l.CRS) l.CRS = l.CRS.concat(crs);
					else l.CRS = crs;
				}
				if (!l.Name) l.Name = l.Title;
				if (l.Name) layers.push(l);
				for (var i=0; i<l.length; i++) {
          addLayers(l[i], l.CRS, level+1);
				}
				if (l.Layer) addLayers(l.Layer, l.CRS, level);
			}
			while (nodes.length) {
        r = parser.read(xmlDoc);
				var l = r.Capability.Layer;
				addLayers (l);
				// next
				$(nodes.get(nodes.length-1)).remove();
				nodes = $("Capability > Layer", $xml);
			}

			// console.log(layers);
		}
		if (callback) callback (layers);
	});
};

/** Gets all layers for a server
 * @param {string} url service url
 * @param {function} callback function called with a list of layers 
*/
WMSCapabilities.prototype.getLayers = function(url, callback) {
  var self = this;
	this.get(url, function(layers) {
    if (layers) for (var i=0; i<layers.length; i++) {
      layers[i] = self.getLayerFromCap(layers[i]);
		}
		if (callback) callback (layers);
	});
};


(function ( $ ) {

/** jQuery plugin to get capabilities
 *	Add a choice to load avaliable layers 
 * @function external:"jQuery.fn".wmsCapabilities
 * @param {string} url the service url
 * @param {} options
 * 	@param {String} options.proxy
 * 	@param {Number} options.selectSize size of the select, default 6
 * 	@param {function} options.onSelect callback when select a service
 * 	@param {String} options.srs srs
 * 	@param {bool|auto} options.cors if you want cors request
 * 	@param {ol.Map} options.map a map to put the result in
 * 	@param {String} options.version WMS version number
 * 	@param {Number} options.timeout timeout
 * @example
$("#capabilities").wmsCapabilities($("#service").val(), 
{ 	proxy: "proxy.php", 
	map: null, // map du service
	selectSize: 6,
	onChange: function(l)
	{	// Do something with the layer
	},
	onSelect: function(l, opt)
	{	// Add the selected layer to the map
		map.addLayer(l);
		// or get it throw option
		var wms = WMSCapabilities.getLayer(opt);
		// test if CORS enabled
		if (!opt.source.crossOrigin) alert ("CORS Headers missing");
	},
	cors: true | false | "auto", // auto will autodetect CORS Headers
	srs: projection
});
 */
$.fn.wmsCapabilities = function(url, options) {
  if (!options) options={};
	var self = this;
	self.html(self.data("loading")||"loading...").addClass("wms-capabilities loading");
	var cap = new WMSCapabilities(options.proxy);
	cap.get(url, function(layers) {
    self.html("").removeClass("loading");
		if (!layers || !layers.length) {
      $("<p>").addClass("error").text(self.data("error")||"service non reachable...").appendTo(self);
			return;
		}
		var select = $("<select>").appendTo(self);
		select.attr("size", options.selectSize || 6);
		var btn, proj;
		if (options.onSelect) btn = $("<button>").text(self.data("btn-add") || "Select").appendTo(self);
		proj = $("<div>").addClass("crs-error")
					.appendTo(self);
		var info = $("<div>").addClass("wms-info").appendTo(self);
		select.on ("change", function() {
      var n = $("option:selected", this).val();
				var l = layers[n];
				if (options.srs) {
          if (!l.CRS || l.CRS.indexOf(options.srs)<0) proj.text(self.data("crs-error")||"bad projection");
					else proj.text("");
				}
				info.html("");
				$("<h1>").text(l.Title).appendTo(info);
				$("<p>").text(l.Abstract || "").appendTo(info);
				if (l.Style) {
          for (var i in l.Style) if (l.Style[i].LegendURL) {
    		 // Gestion du cas où l'utilisateur n'a pas fait attention au http ou https	
          	 if(!url.contains('https') && url.contains('http') && l.Style[i].LegendURL[0].OnlineResource.contains('https'))
          	 {
				 $('#listWMS input#service').val(url.replace('http','https'));
     			 $('#listWMS #find').click();
          	 }	
      	 	 else if( url.contains('https') && !url.contains('http') && l.Style[i].LegendURL[0].OnlineResource.contains('http'))
     		 {
				 $('#listWMS input#service').val(url.replace('https','http'));
     			 $('#listWMS #find').click();
     		 }

            $("<img>").attr("src",l.Style[i].LegendURL[0].OnlineResource).appendTo(info);
					}
				}

				// The layer
				var lay = cap.getLayerFromCap(l, { srs:options.srs, cors:options.cors });
				if (options.onChange) options.onChange(lay);
			});
		if (options.onSelect) btn.click(function() {
      var n = $("option:selected", select).val();
				if (typeof n == "undefined") return;
				info.html("");
				// Auto-detect CORS headers
				if (options.cors=="auto") {
          var klay = cap.getLayerFromCap(layers[n], {srs:options.srs, cors:options.cors });
					$("p.crs-error", self).remove();
					// Get auto cors
					$.ajax({
						url: klay.getPreview()[0],
						type:'HEAD',
						//crossDomain: true,
						withCredentials: true
					})
					.done(function(data, status, request) {
						// console.warn("Download enabled - CORS Headers present or not required");
						// things worked out, we can add the CORS attribute and reset the source
						var cors = request.getResponseHeader('Access-Control-Allow-Origin');
						// Firefox > cors is null / 
						var opt = cap.getOptionsFromCap(layers[n], { srs:options.srs, cors:!cors || cors=="*" });
						var l = WMSCapabilities.getLayer(opt);
						options.onSelect(l, opt);
					})
					.fail(function() {
						// console.warn("Download disabled - CORS Headers missing");
						// things worked out, we can add the CORS attribute and reset the source
						$("<p>").addClass("crs-error").text(self.data("cors-error")||"Download disabled - CORS Headers missing").appendTo(self);
						var opt = cap.getOptionsFromCap(layers[n], { srs:options.srs, cors:false });
						var l = WMSCapabilities.getLayer(opt);
						options.onSelect(l, opt);
					});
				} else {
          var opt = cap.getOptionsFromCap(layers[n], { srs:options.srs, cors:options.cors });
					var l = WMSCapabilities.getLayer(opt);
					options.onSelect(l, opt);
				}
			});
		for (var i=0; i<layers.length; i++) {
      $("<option>").text(layers[i].Name)
        .val(i)
        .addClass("level_"+layers[i].level)
        .appendTo(select);
		}
	}, options.map, options.version, options.timeout);
}
}( $ ));

export default WMSCapabilities