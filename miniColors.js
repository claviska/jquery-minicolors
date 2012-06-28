/*
 * jQuery miniColors: A small color selector
 *
 * Copyright 2011 Cory LaViska for A Beautiful Site, LLC. (http://abeautifulsite.net/)
 *
 * Dual licensed under the MIT or GPL Version 2 licenses
 *
*/
(function($) {

	$.miniColors = function(o) {
		var api = this;	// public methods

		var buildSelector = function(hsb) {

			// Generate the selector
			var selector = $('<div style="display: none;" class="miniColors-selector"></div>');
			selector
				.append('<div class="miniColors-colors" style="background-color: #FFF;"><div class="miniColors-colorPicker"><div class="miniColors-colorPicker-inner"></div></div></div>')
				.append('<div class="miniColors-hues"><div class="miniColors-huePicker"></div></div>');
			
			// Set background for colors
			selector
				.find('.miniColors-colors')
				.css('backgroundColor', '#' + hsb2hex({ h: hsb.h, s: 100, b: 100 }));
			
			// initial position 
			setSelectorPositionStyleFromHSB(selector, hsb);
			
			// Prevent text selection in IE
			selector.bind('selectstart', function() { return false; });

			// store initial value
			selector.data('hsb', hsb);

			return selector;
			
		};

		var updateSelector = function(selector, hsb) {
		};

		var bindSelectorEvents = function(selector) {

			var mouseDown = false, moving;

			$(document).bind('mousedown.miniColors touchstart.miniColors', function(event) {
				
				mouseDown = true;
				var testSubject = $(event.target).parents().andSelf();
				
				if( testSubject.hasClass('miniColors-colors') ) {
					event.preventDefault();
					moving = 'colors';
					moveColor(selector, event);
				}
				
				if( testSubject.hasClass('miniColors-hues') ) {
					event.preventDefault();
					moving = 'hues';
					moveHue(selector, event);
				}
				
				if( testSubject.hasClass('miniColors-selector') ) {
					event.preventDefault();
					return;
				}
				
				if( testSubject.hasClass('miniColors') ) return;
				
				// fallthrough; no click inside selector
				selector.trigger('clickOutsideBounds');
			});
			
			$(document)
				.bind('mouseup.miniColors touchend.miniColors', function(event) {
					event.preventDefault();
					mouseDown = false;
					moving = undefined;
				})
				.bind('mousemove.miniColors touchmove.miniColors', function(event) {
					event.preventDefault();
					if( mouseDown ) {
						if( moving === 'colors' ) moveColor(selector, event);
						if( moving === 'hues' ) moveHue(selector, event);
					}
				});
		};

		var unBindSelectorEvents = function() {

			$(document).unbind('.miniColors');

		};

		var moveColor = function(selector, event) {

			var position = {
				x: event.pageX,
				y: event.pageY
			};

			var offset = selector.find('.miniColors-colors').offset();
			
			// Touch support
			if( event.originalEvent.changedTouches ) {
				position.x = event.originalEvent.changedTouches[0].pageX;
				position.y = event.originalEvent.changedTouches[0].pageY;
			}
			position.x = position.x - offset.left - 5;
			position.y = position.y - offset.top - 5;
			if( position.x <= -5 ) position.x = -5;
			if( position.x >= 144 ) position.x = 144;
			if( position.y <= -5 ) position.y = -5;
			if( position.y >= 144 ) position.y = 144;
			
			// Calculate saturation
			var s = Math.round((position.x + 5) * 0.67);
			if( s < 0 ) s = 0;
			if( s > 100 ) s = 100;
			
			// Calculate brightness
			var b = 100 - Math.round((position.y + 5) * 0.67);
			if( b < 0 ) b = 0;
			if( b > 100 ) b = 100;
			
			// Update HSB values
			var hsb = selector.data('hsb');
			hsb.s = s;
			hsb.b = b;
			
			// Set color
			setSelectorColor(selector, hsb, true);
		};
		
		var moveHue = function(selector, event) {
			
			var position = {
				y: event.pageY
			};
			
			var offset = selector.find('.miniColors-colors').offset();

			// Touch support
			if( event.originalEvent.changedTouches ) {
				position.y = event.originalEvent.changedTouches[0].pageY;
			}
			
			position.y = position.y - offset.top - 1;
			if( position.y <= -1 ) position.y = -1;
			if( position.y >= 149 ) position.y = 149;
			
			// Calculate hue
			var h = Math.round((150 - position.y - 1) * 2.4);
			if( h < 0 ) h = 0;
			if( h > 360 ) h = 360;
			
			// Update HSB values
			var hsb = selector.data('hsb');
			hsb.h = h;
			
			// Set color
			setSelectorColor(selector, hsb, true);
			
		};

		var setSelectorPositionStyleFromHSB = function(selector, hsb) {

			// Set colorPicker position
			var colorPosition = getColorPositionFromHSB(hsb);
			var colorPicker = selector.find('.miniColors-colorPicker');
			colorPicker.css('top', colorPosition.y + 'px').css('left', colorPosition.x + 'px').show();
			
			// Set huePosition position
			var huePosition = getHuePositionFromHSB(hsb);
			var huePicker = selector.find('.miniColors-huePicker');
			huePicker.css('top', huePosition.y + 'px').show();
		};
		
		var setSelectorColor = function(selector, hsb, updateInput) {
			setSelectorPositionStyleFromHSB(selector, hsb);
			selector.data('hsb', hsb);
			var hex = hsb2hex(hsb);	
			if( updateInput ) {
				selector.trigger( 'updateInput', { 'hex' : hex} );	
			}
			selector.find('.miniColors-colors').css('backgroundColor', '#' + hsb2hex({ h: hsb.h, s: 100, b: 100 }));
			selector.trigger('setColor', { 'hex' : hex });
			
		};
		
		var getColorPositionFromHSB = function(hsb) {				
			var x = Math.ceil(hsb.s / 0.67);
			if( x < 0 ) x = 0;
			if( x > 150 ) x = 150;
			var y = 150 - Math.ceil(hsb.b / 0.67);
			if( y < 0 ) y = 0;
			if( y > 150 ) y = 150;
			return { x: x - 5, y: y - 5 };
		};
		
		var getHuePositionFromHSB = function(hsb) {
			var y = 150 - (hsb.h / 2.4);
			if( y < 0 ) h = 0;
			if( y > 150 ) h = 150;				
			return { y: y - 1 };
		};
		
		
		var hsb2rgb = function(hsb) {
			var rgb = {};
			var h = Math.round(hsb.h);
			var s = Math.round(hsb.s*255/100);
			var v = Math.round(hsb.b*255/100);
			if(s === 0) {
				rgb.r = rgb.g = rgb.b = v;
			} else {
				var t1 = v;
				var t2 = (255 - s) * v / 255;
				var t3 = (t1 - t2) * (h % 60) / 60;
				if( h === 360 ) h = 0;
				if( h < 60 ) { rgb.r = t1; rgb.b = t2; rgb.g = t2 + t3; }
				else if( h < 120 ) {rgb.g = t1; rgb.b = t2; rgb.r = t1 - t3; }
				else if( h < 180 ) {rgb.g = t1; rgb.r = t2; rgb.b = t2 + t3; }
				else if( h < 240 ) {rgb.b = t1; rgb.r = t2; rgb.g = t1 - t3; }
				else if( h < 300 ) {rgb.b = t1; rgb.g = t2; rgb.r = t2 + t3; }
				else if( h < 360 ) {rgb.r = t1; rgb.g = t2; rgb.b = t1 - t3; }
				else { rgb.r = 0; rgb.g = 0; rgb.b = 0; }
			}
			return {
				r: Math.round(rgb.r),
				g: Math.round(rgb.g),
				b: Math.round(rgb.b)
			};
		};
		
		var rgb2hex = function(rgb) {
			var hex = [
				rgb.r.toString(16),
				rgb.g.toString(16),
				rgb.b.toString(16)
			];
			var i, len = hex.length, val;
			for (i = 0; i < len; i++) {
				val = hex[i];
				if (val.length === 1) hex[i] = '0' + val;
			}
			return hex.join('');
		};
		
		var hsb2hex = function(hsb) {
			return rgb2hex(hsb2rgb(hsb));
		};

		// reveal public methods
		api.setSelectorColor = setSelectorColor;
		api.buildSelector = buildSelector;
		api.bindSelectorEvents = bindSelectorEvents;
		api.unBindSelectorEvents = unBindSelectorEvents;

		return api;
	};
	
	
})(jQuery);
