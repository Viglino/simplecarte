/*
	Copyright (c) 2013 Jean-Marc VIGLINO,
	released under the CeCILL license (http://www.cecill.info/).

	Geoportail API config object.
	Default parameters to access Geoportail's services.
	The capabilities can be enumerated for each API key.

*/
var geoportailConfig =
{	// url of the services
   url: '//wxs.ign.fr/',
   // Default layer capabilities
   capabilities:
	{'default':
		{'BASELAYER': {'minZoom': 0, 'maxZoom': 20, 'visibility': false, 'displayInLayerSwitcher': false, 'title': 'Baselayer', 'format': 'image/jpeg', 'tilematrix': 'PM', 'style': 'normal', 'bbox': [-178.187, -84, 178, 84], 'originators': {}},

		   'GEOGRAPHICALGRIDSYSTEMS.MAPS.OVERVIEW': {'server': 'http://wxs.ign.fr/geoportail/wmts', 'title': 'Carte Mondiale pour la mini-vue', 'format': 'image/jpeg', 'tilematrix': 'PM', 'style': 'normal', 'minZoom': 1, 'maxZoom': 8, 'bbox': [-179.5, -75, 179.5, 75], 'desc': 'Carte Mondiale pour la mini-vue', 'keys': 'Mini-Vue', 'legend': [], 'originators': {'NATURALEARTH': {'href': 'http://www.naturalearthdata.com', 'attribution': 'Natural Earth', 'logo': 'https://wxs.ign.fr/static/logos/NATURALEARTH/NATURALEARTH.gif', 'minZoom': 0, 'maxZoom': 8, 'constraint': [{'minZoom': 1, 'maxZoom': 8, 'bbox': [-179.5, -75, 179.5, 75]}]}}},
		   'ORTHOIMAGERY.ORTHOPHOTOS': {'server': 'http://wxs.ign.fr/geoportail/wmts', 'title': 'Photographies aériennes', 'order': '9990000', 'format': 'image/jpeg', 'tilematrix': 'PM', 'style': 'normal', 'minZoom': 0, 'maxZoom': 20, 'bbox': [-180, -86, 180, 84], 'desc': 'Photographies aériennes', 'keys': 'Photographies', 'qlook': 'https://wxs.ign.fr/static/pictures/ign_ortho.jpg', 'legend': [{'zoom': 19, 'url': 'http://wxs.ign.fr/static/legends/ign_bdortho_legende.jpg'}], 'originators': {'SIGLR': {'href': 'http://www.siglr.org//', 'attribution': 'SIGLR', 'logo': 'https://wxs.ign.fr/static/logos/SIGLR/SIGLR.gif', 'minZoom': 10, 'maxZoom': 19, 'constraint': [{'minZoom': 19, 'maxZoom': 19, 'bbox': [3.2470036, 43.441483, 4.8729386, 44.47377]}, {'minZoom': 13, 'maxZoom': 18, 'bbox': [1.6784439, 42.316307, 4.8729386, 44.978218]}]}, 'CRCORSE': {'href': 'http://www.corse.fr//', 'attribution': 'CRCORSE', 'logo': 'https://wxs.ign.fr/static/logos/CRCORSE/CRCORSE.gif', 'minZoom': 13, 'maxZoom': 19, 'constraint': [{'minZoom': 13, 'maxZoom': 19, 'bbox': [8.428783, 41.338627, 9.688606, 43.08541]}]}, 'FEDER_PAYSDELALOIRE': {'href': 'http://www.europe-en-paysdelaloire.eu/', 'attribution': 'Pays-de-la-Loire', 'logo': 'https://wxs.ign.fr/static/logos/FEDER_PAYSDELALOIRE/FEDER_PAYSDELALOIRE.gif', 'minZoom': 13, 'maxZoom': 19, 'constraint': [{'minZoom': 13, 'maxZoom': 19, 'bbox': [-1.4114912, 46.949543, 0.27533764, 47.86273]}]}, 'IGN': {'href': 'http://www.ign.fr', 'attribution': 'Institut national de l\'information géographique et forestière', 'logo': 'https://wxs.ign.fr/static/logos/IGN/IGN.gif', 'minZoom': 13, 'maxZoom': 20, 'constraint': [{'minZoom': 19, 'maxZoom': 19, 'bbox': [-63.160706, -21.401262, 55.84643, 51.094486]}, {'minZoom': 13, 'maxZoom': 18, 'bbox': [-178.18713, -21.401329, 55.85611, 51.094486]}, {'minZoom': 20, 'maxZoom': 20, 'bbox': [2.2243388, 43.153347, 5.7168245, 45.11295]}]}, 'FEDER2': {'href': 'http://www.europe-en-france.gouv.fr/', 'attribution': 'Fonds européen de développement économique et régional', 'logo': 'https://wxs.ign.fr/static/logos/FEDER2/FEDER2.gif', 'minZoom': 13, 'maxZoom': 20, 'constraint': [{'minZoom': 19, 'maxZoom': 19, 'bbox': [2.9441726, 48.824635, 4.269964, 50.080326]}, {'minZoom': 13, 'maxZoom': 18, 'bbox': [1.3577043, 48.824635, 4.269964, 50.37648]}]}, 'RGD_SAVOIE': {'href': 'http://www.rgd.fr', 'attribution': 'Régie de Gestion de Données des Pays de Savoie (RGD 73-74)', 'logo': 'https://wxs.ign.fr/static/logos/RGD_SAVOIE/RGD_SAVOIE.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [5.5923314, 45.017353, 7.2323394, 46.438328]}]}, 'CNES_971': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES_971/CNES_971.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [-61.82342, 15.819616, -60.99497, 16.521578]}]}, 'CRAIG': {'href': 'http://www.craig.fr', 'attribution': 'Centre Régional Auvergnat de l\'Information Géographique (CRAIG)', 'logo': 'https://wxs.ign.fr/static/logos/CRAIG/CRAIG.gif', 'minZoom': 13, 'maxZoom': 20, 'constraint': [{'minZoom': 19, 'maxZoom': 19, 'bbox': [2.2656832, 44.734104, 4.5090737, 46.8038]}, {'minZoom': 13, 'maxZoom': 18, 'bbox': [2.0398402, 44.60505, 4.5090737, 46.8038]}, {'minZoom': 20, 'maxZoom': 20, 'bbox': [2.2243388, 44.76621, 2.7314367, 45.11295]}]}, 'CG45': {'href': 'http://www.loiret.com', 'attribution': 'Le conseil général du Loiret', 'logo': 'https://wxs.ign.fr/static/logos/CG45/CG45.gif', 'minZoom': 13, 'maxZoom': 20, 'constraint': [{'minZoom': 13, 'maxZoom': 19, 'bbox': [1.4883244, 47.471867, 3.1349874, 48.354233]}]}, 'PPIGE': {'href': 'http://www.ppige-npdc.fr/', 'attribution': 'PPIGE', 'logo': 'https://wxs.ign.fr/static/logos/PPIGE/PPIGE.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [1.5212119, 49.957302, 4.2673664, 51.090965]}]}, 'e-Megalis': {'href': 'http://www.e-megalisbretagne.org//', 'attribution': 'Syndicat mixte de coopération territoriale (e-Megalis)', 'logo': 'https://wxs.ign.fr/static/logos/e-Megalis/e-Megalis.gif', 'minZoom': 13, 'maxZoom': 19, 'constraint': [{'minZoom': 19, 'maxZoom': 19, 'bbox': [-3.7487078, 47.23789, -1.9810898, 48.263657]}, {'minZoom': 13, 'maxZoom': 18, 'bbox': [-5.1937118, 47.23789, -0.98568505, 48.980812]}]}, 'CNES_972': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES_972/CNES_972.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [-61.247208, 14.371855, -60.778458, 14.899901]}]}, 'CG06': {'href': 'http://www.cg06.fr', 'attribution': 'Département Alpes Maritimes (06) en partenariat avec : Groupement Orthophoto 06 (NCA, Ville de Cannes, CARF, CASA,CG06, CA de Grasse) ', 'logo': 'https://wxs.ign.fr/static/logos/CG06/CG06.gif', 'minZoom': 13, 'maxZoom': 19, 'constraint': [{'minZoom': 13, 'maxZoom': 19, 'bbox': [6.6093955, 43.44647, 7.7436337, 44.377018]}]}, 'DITTT': {'href': 'http://www.dittt.gouv.nc/portal/page/portal/dittt/', 'attribution': 'Direction des Infrastructures, de la Topographie et des Transports Terrestres', 'logo': 'https://wxs.ign.fr/static/logos/DITTT/DITTT.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [163.47784, -22.767689, 167.94624, -19.434975]}]}, 'CNES_978': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES_978/CNES_978.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [-63.160706, 18.04345, -62.962185, 18.133898]}]}, 'CNES_ALSACE': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES_ALSACE/CNES_ALSACE.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [6.8086324, 47.39981, 7.668318, 48.32695]}]}, 'FEDER': {'href': 'http://www.europe-en-france.gouv.fr/', 'attribution': 'Fonds européen de développement économique et régional', 'logo': 'https://wxs.ign.fr/static/logos/FEDER/FEDER.gif', 'minZoom': 13, 'maxZoom': 19, 'constraint': [{'minZoom': 13, 'maxZoom': 19, 'bbox': [-1.9662633, 42.316307, 8.25674, 49.77852]}]}, 'CNES': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES/CNES.gif', 'minZoom': 13, 'maxZoom': 16, 'constraint': [{'minZoom': 13, 'maxZoom': 16, 'bbox': [-55.01953, 1.845384, -50.88867, 6.053161]}]}, 'ASTRIUM': {'href': 'http://www.geo-airbusds.com/', 'attribution': 'Airbus Defence and Space', 'logo': 'https://wxs.ign.fr/static/logos/ASTRIUM/ASTRIUM.gif', 'minZoom': 13, 'maxZoom': 16, 'constraint': [{'minZoom': 13, 'maxZoom': 16, 'bbox': [-55.01953, 1.845384, -50.88867, 6.053161]}]}, 'CNES_974': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES_974/CNES_974.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [55.205757, -21.401262, 55.84643, -20.862825]}]}, 'CNES_975': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES_975/CNES_975.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [-56.410988, 46.734093, -56.10308, 47.149963]}]}, 'CNES_976': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES_976/CNES_976.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [44.916977, -13.089187, 45.30442, -12.564543]}]}, 'CNES_977': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES_977/CNES_977.gif', 'minZoom': 13, 'maxZoom': 18, 'constraint': [{'minZoom': 13, 'maxZoom': 18, 'bbox': [-62.952805, 17.862621, -62.78276, 17.98024]}]}, 'CNES_AUVERGNE': {'href': 'http://www.cnes.fr/', 'attribution': 'Centre national d\'études spatiales (CNES)', 'logo': 'https://wxs.ign.fr/static/logos/CNES_AUVERGNE/CNES_AUVERGNE.gif', 'minZoom': 13, 'maxZoom': 19, 'constraint': [{'minZoom': 13, 'maxZoom': 19, 'bbox': [2.2656832, 45.279934, 4.0227704, 46.8038]}]}, 'PLANETOBSERVER': {'href': 'http://www.planetobserver.com/', 'attribution': 'PlanetObserver (images satellites)', 'logo': 'https://wxs.ign.fr/static/logos/PLANETOBSERVER/PLANETOBSERVER.gif', 'minZoom': 12, 'maxZoom': 16, 'constraint': [{'minZoom': 0, 'maxZoom': 12, 'bbox': [-180, -86, 180, 84]}]}, 'MPM': {'href': 'http://www.marseille-provence.com/', 'attribution': 'Marseille Provence Métropole', 'logo': 'https://wxs.ign.fr/static/logos/MPM/MPM.gif', 'minZoom': 0, 'maxZoom': 20, 'constraint': [{'minZoom': 20, 'maxZoom': 20, 'bbox': [5.076959, 43.153347, 5.7168245, 43.454994]}]}}},
		   'GEOGRAPHICALGRIDSYSTEMS.MAPS': {'server': 'http://wxs.ign.fr/geoportail/wmts', 'title': 'Cartes IGN', 'order': '9980000', 'format': 'image/jpeg', 'tilematrix': 'PM', 'style': 'normal', 'minZoom': 0, 'maxZoom': 18, 'bbox': [-180, -68.138855, 180, 80], 'desc': 'Cartes IGN', 'keys': 'Cartes', 'qlook': 'https://wxs.ign.fr/static/pictures/ign_carte2.jpg', 'legend': [], 'originators': {'IGN': {'href': 'http://www.ign.fr', 'attribution': 'Institut national de l\'information géographique et forestière', 'logo': 'https://wxs.ign.fr/static/logos/IGN/IGN.gif', 'minZoom': 6, 'maxZoom': 20, 'constraint': [{'minZoom': 17, 'maxZoom': 17, 'bbox': [-63.189117, -21.428364, 55.84698, 51.175068]}, {'minZoom': 18, 'maxZoom': 18, 'bbox': [-63.189068, -21.428364, 55.846638, 18.133902]}, {'minZoom': 7, 'maxZoom': 8, 'bbox': [-178.20573, -68.138855, 144.84375, 51.909786]}, {'minZoom': 13, 'maxZoom': 14, 'bbox': [-178.20573, -67.101425, 142.03836, 51.44377]}, {'minZoom': 11, 'maxZoom': 12, 'bbox': [-178.20573, -67.101425, 142.03836, 51.444122]}, {'minZoom': 9, 'maxZoom': 10, 'bbox': [-178.20573, -68.138855, 144.84375, 51.444016]}, {'minZoom': 15, 'maxZoom': 16, 'bbox': [-178.20573, -46.502903, 77.60037, 18.179071]}, {'minZoom': 0, 'maxZoom': 6, 'bbox': [-180, -60, 180, 80]}]}, 'NCL-DITTT': {'href': 'http://www.dittt.gouv.nc/portal/page/portal/dittt', 'attribution': 'Direction des Infrastructures, de la Topographie et des Transports Terrestres du gouvernement de la Nouvelle-Calédonie', 'logo': 'https://wxs.ign.fr/static/logos/NCL-DITTT/NCL-DITTT.gif', 'minZoom': 0, 'maxZoom': 16, 'constraint': [{'minZoom': 8, 'maxZoom': 10, 'bbox': [163.47784, -22.854631, 168.24048, -19.402704]}, {'minZoom': 11, 'maxZoom': 13, 'bbox': [163.47784, -22.972307, 168.24327, -19.494438]}, {'minZoom': 14, 'maxZoom': 15, 'bbox': [164.53125, -22.75592, 168.22266, -20.303417]}, {'minZoom': 16, 'maxZoom': 16, 'bbox': [163.47784, -22.79525, 168.19109, -19.494438]}]}}},
		},
	},
};

/** Jquery autoconf
	key			{String} the API key
	success		{function} a collaback function
*/
geoportailConfig.jqautoconf = function(key, success, all) {
   var geopresolutions = [156543.03390625, 78271.516953125, 39135.7584765625, 19567.87923828125, 9783.939619140625, 4891.9698095703125, 2445.9849047851562, 1222.9924523925781, 611.4962261962891, 305.74811309814453, 152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135, 0.29858214169740677, 0.14929107084870338];
   function getZoom(res) {
      res = Number(res) * 0.000281;
      for (var r=0; r<geopresolutions.length; r++) {
         if (res>geopresolutions[r]) return r;
      }
   }
   function getBbox(bbox) {
      bbox = bbox.split(',');
      for (var k=0; k<bbox.length; k++) bbox[k] = Number(bbox[k]);
      return bbox;
   }
   $.ajax('http://wxs.ign.fr/'+key+'/autoconf/?output=json',
      {dataType: 'jsonp',
         success: function(resp, status) {
            var xml = $.parseXML(resp.xml.replace(/xlink:|sld:|gpp:/g, ''));
            var o; var zmin; var zmax; var js = {};
            if (!key) js.BASELAYER = geoportailConfig.capabilities['default'].BASELAYER;
            var layers = $(xml).find('Layer');
            for (var i=0; i<layers.length; i++) {
               var l = $(layers[i]);
               if (!/WMTS/.test(l.find('Server').attr('service'))) continue;
               if (!all && !/geoportail\/wmts/.test(l.find('OnlineResource').attr('href'))) continue;
               var service = js[l.find('Name:first').text()] = {};
               // service.server = l.find("Server").find("OnlineResource").attr("href");
               service.server = l.find('Key').text().replace(key+'/', '');
               if (!service.server) delete service.server;
               service.title = l.find('Title:first').text();
               service.order = l.find('Extension Layer').attr('order');
               service.format = l.find('Format:first').text();
               service.tilematrix = 'PM';
               service.style = l.find('Style:first Name').text();
               service.minZoom = getZoom(l.find('MaxScaleDenominator:first').text());
               service.maxZoom = getZoom(l.find('MinScaleDenominator:first').text());
               service.bbox = getBbox(l.find('Extension BoundingBox:first').text());
               service.desc = l.find('Abstract:first').text();
               service.keys = l.find('Thematic').text();
               service.qlook = l.find('QuickLook OnlineResource').attr('href').replace('http://', 'https://');
               if (/NOPIC|defaut/.test(service.qlook)) delete service.qlook;
               service.legend = [];
               l.find('Legend').each(function() {
                  var legend = $(this).find('OnlineResource').attr('href');
                  if (legend && !/NOLEGEND/.test(legend)) {
                     service.legend.push(
                        {zoom: getZoom($(this).find('MinScaleDenominator:first').text()),
                           url: legend,
                        });
                  }
               });

               service.originators = {};
               l.find('Originators Originator').each(function() {
                  o =
					{href: $(this).find('URL').text(),
					   attribution: $(this).find('Attribution').text(),
					   logo: $(this).find('Logo').text().replace('http://', 'https://'),
					   minZoom: 20,
					   maxZoom: 0,
					   constraint: [],
					};
                  // Contrainte d'echelle
                  $(this).find('Constraint').each(function() {
                     zmax = getZoom($(this).find('MinScaleDenominator:first').text());
                     if (zmin>o.maxZoom) o.maxZoom = zmin;
                     if (zmin<o.minZoom) o.minZoom = zmin;
                     zmin = getZoom($(this).find('MaxScaleDenominator:first').text());
                     if (zmax>o.maxZoom) o.maxZoom = zmax;
                     if (zmax<o.minZoom) o.minZoom = zmax;

                     o.constraint.push(
                        {minZoom: zmin,
                           maxZoom: zmax,
                           bbox: getBbox($(this).find('BoundingBox:first').text()),
                        });
                  });
                  // Fusionner les contraintes
                  for (var i=o.constraint.length-1; i>0; i--) {
                     for (var j=0; j<i; j++) {
                        var bok = true;
                        for (k=0; k<4; k++) {
                           if (o.constraint[i].bbox[k] != o.constraint[j].bbox[k]) {
                              bok = false;
                              break;
                           }
                        }
                        if (!bok) continue;
                        if (o.constraint[i].maxZoom == o.constraint[j].minZoom
							 || o.constraint[j].maxZoom == o.constraint[i].minZoom
							 || o.constraint[i].maxZoom+1 == o.constraint[j].minZoom
							 || o.constraint[j].maxZoom+1 == o.constraint[i].minZoom
							 || o.constraint[i].minZoom-1 == o.constraint[j].maxZoom
							 || o.constraint[j].minZoom-1 == o.constraint[i].maxZoom) {
                           o.constraint[j].maxZoom = Math.max(o.constraint[i].maxZoom, o.constraint[j].maxZoom);
                           o.constraint[j].minZoom = Math.min(o.constraint[i].minZoom, o.constraint[j].minZoom);
                           o.constraint.splice(i, 1);
                           break;
                        }
                     }
                  }
                  service.originators[$(this).attr('name')] = o;
               });
            }
            geoportailConfig.capabilities[(key?key:'default')] = js;
            if (typeof success == 'function') success(js);
         },
         error: function() {
            if (typeof success == 'function') success(false);
         },
      });
};
