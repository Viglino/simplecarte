/**
 * An ol.interaction.Modify with a 'modifying' event when modifying a feature.
 *
 * @constructor
 * @fires modifying
 * @param {} options ol.interaction.Draw Options.
 * @extends {ol.interaction.Draw}
 * @api
 * @TODO utiliser ol.interaction.ModifyFeature
 */
ol.interaction.Modifying = function(options) {
   options = options || {};

   // inherit
   ol.interaction.Modify.call(this, options);

   // Current feature
   this._currentFeature = null;

   var defaultHandler = this.handleEvent;
   var self = this;
   this.handleEvent = function(e) {
      if (self._currentFeature && e.type==='pointerdrag') {
         self.dispatchEvent({
            type: 'modifying',
            feature: self._currentFeature,
            coordinate: e.coordinate,
         });
      }
      return defaultHandler.call(self, e);
   };

   // Get current feature
   this.on('modifystart', function(e) {
      this._currentFeature = e.features.item(0);
   }, this);

   this.on('modifyend', function(e) {
      this._currentFeature = null;
   }, this);
};
ol.inherits(ol.interaction.Modifying, ol.interaction.Modify);
