/**	@copy (c) IGN - 2017 
	@author Jean-Marc VIGLINO jean-marc.viglino@ign.fr
*/
/* Lecture de layer image au format macarte.
 *
 * @constructor
 * @extends {ol.format.layer.Base}
 * @param {} options Options.
 * /
ol.format.layer.ImageStyle = function(options)
{	options = options || {};

	// Constructor
	ol.format.layer.Vector.call(this, options);

};
ol.inherits(ol.format.layer.ImageStyle, ol.format.layer.Vector);


/* Lecture
*	@param {} source
*	@return {ol.layer.VectorStyle} 
* /
ol.format.layer.ImageStyle.prototype.read = function (source, options)
{	var vector = ol.format.layer.Vector.prototype.read.call(this, source, options);
	return new ol.layer.ImageStyle( { layer:vector } );
};


/* Ecriture
* @param {ol.layer.ImageStyle} 
* @param {} options
*	- trunc {number} truncation factor (1000 = 3 digits)
* @return {object} source
* /
ol.format.layer.ImageStyle.prototype.write = function (layer, options)
{	if (!(layer instanceof ol.layer.ImageStyle)) return false;
	return ol.format.layer.Vector.prototype.write.call(this, layer.get('vector'), options);
};
/**/