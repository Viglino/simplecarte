/** Interaction rotate
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires rotatestart|rotating|rotateend
 * @param {olx.interaction.RotateOptions} features: collection of feature to rotate, cursor: cursor when rotating
 */
ol.interaction.Rotate = function(options) {
   if (!options) options={};

   ol.interaction.Pointer.call(this,
      {handleDownEvent: this.handleDownEvent,
         handleDragEvent: this.handleDragEvent,
         handleMoveEvent: this.handleMoveEvent,
         handleUpEvent: this.handleUpEvent,
      });

   /** Collection of feature to roate */
   this.features_ = options.features;
   /** Cursor */
   this.cursor_ = options.cursor || 'move';

   /** Selected feature */
   this.feature_ = null;
   /** Rotation center */
   this.center_ = null;
   /** Initial geom */
   this.geom_ =null;
   /** Start angle */
   this.angle_ = 0;
};
ol.inherits(ol.interaction.Rotate, ol.interaction.Pointer);

ol.interaction.Rotate.prototype.getFeatureAtPixel_ = function(pixel) {
   return this.getMap().forEachFeatureAtPixel(pixel,
      function(feature, layer) {
         if (this.features_) {
            var found = false;
            this.features_.forEach(function(f) {
               if (f===feature) found=true;
            });
            if (found) return feature;
            else return null;
         } else return feature;
      }, this);
};
/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `true` to start the drag sequence.
 */
ol.interaction.Rotate.prototype.handleDownEvent = function(evt) {
// console.log("handleDownEvent");
   var map = evt.map;

   var feature = this.getFeatureAtPixel_(evt.pixel);

   if (feature) {
      this.feature_ = feature;
      this.center_ = ol.extent.getCenter(this.feature_.getGeometry().getExtent());
      this.geom_ = this.feature_.getGeometry().clone();
      this.angle_ = Math.atan2(this.center_[1]-evt.coordinate[1], this.center_[0]-evt.coordinate[0]);

      // dispatchEvent
      this.dispatchEvent({type: 'rotatestart', feature: feature, pixel: evt.pixel, coordinate: evt.coordinate});
   }

   return !!feature;
};


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 */
ol.interaction.Rotate.prototype.handleDragEvent = function(evt) {
// console.log("handleDragEvent");
   var map = evt.map;

   var a = Math.atan2(this.center_[1]-evt.coordinate[1], this.center_[0]-evt.coordinate[0]);

   if (this.geom_.getType() !== 'Point') {
      var geometry = this.geom_.clone();
      geometry.rotate(a-this.angle_, this.center_);
      this.feature_.setGeometry(geometry);
   }

   // dispatchEvent
   this.dispatchEvent({type: 'rotating', feature: this.feature_, angle: a-this.angle_, pixel: evt.pixel, coordinate: evt.coordinate});
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 */
ol.interaction.Rotate.prototype.handleMoveEvent = function(evt) {
// console.log("handleMoveEvent");
   if (this.cursor_) {
      var map = evt.map;
      var feature = this.getFeatureAtPixel_(evt.pixel);
      var element = evt.map.getTargetElement();
      if (feature) {
         if (element.style.cursor != this.cursor_) {
            this.previousCursor_ = element.style.cursor;
            element.style.cursor = this.cursor_;
         }
      } else if (this.previousCursor_ !== undefined) {
         element.style.cursor = this.previousCursor_;
         this.previousCursor_ = undefined;
      }
   }
};


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `false` to stop the drag sequence.
 */
ol.interaction.Rotate.prototype.handleUpEvent = function(evt) {	// dispatchEvent
   this.dispatchEvent({type: 'rotateend', feature: this.feature_, oldgeom: this.geom_});

   this.feature_ = null;
   return false;
};
