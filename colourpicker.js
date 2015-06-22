/*
  * jQuery Colour picker: A tiny color picker
  *
  * Copyright: Cory LaViska for A Beautiful Site, LLC: http://www.abeautifulsite.net/
  * Modifications by Dean Attali
  *
  * Contribute: https://github.com/daattali/jquery-colourpicker
  *
  * @license: http://opensource.org/licenses/MIT
  *
  */
  (function (factory) {
    /* jshint ignore:start */
      if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
      } else if (typeof exports === 'object') {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
      } else {
        // Browser globals
        factory(jQuery);
      }
    /* jshint ignore:end */
  }(function ($) {

    // Defaults
    $.colourpicker = {
      defaults: {
        animationSpeed: 50,
        animationEasing: 'swing',
        change: null,
        changeDelay: 0,
        defaultValue: '',
        hide: null,
        hideSpeed: 100,
        position: 'bottom left',
        show: null,
        showSpeed: 100,
        showColour: 'both',
        allowTransparent: false
      }
    };

    // Public methods
    $.extend($.fn, {
      colourpicker: function(method, data) {

        switch(method) {

          // Destroy the control
          case 'destroy':
            $(this).each( function() {
              destroy($(this));
            });
          return $(this);

          // Hide the color picker
          case 'hide':
            hide();
          return $(this);

          // Get/set settings on the fly
          case 'settings':
            if( data === undefined ) {
              return $(this).data('colourpicker-settings');
            } else {
              // Setter
              $(this).each( function() {
                var settings = $(this).data('colourpicker-settings') || {};
                destroy($(this));
                $(this).colourpicker($.extend(true, settings, data));
              });
            }
          return $(this);

          // Show the color picker
          case 'show':
            show( $(this).eq(0) );
          return $(this);

          // Get/set the hex color value
          case 'value':
            if( data === undefined ) {
              // Getter
              if ($(this).data('allow-transparent') &&
                  $(this).data('transparent')) {
                return "transparent";
              }
              if (!parseHex($(this).val())) {
                return $(this).data('colourpicker-lastChange');
              }

              return parseHex($(this).val(), true);
            } else {
              // Setter
              $(this).each( function() {
                if (data == "transparent") {
                  if ( $(this).data('allow-transparent') ) {
                    $(this).data('transparent', true);
                  } else {
                    $(this).data('transparent', false);
                    $(this).val(getLastVal($(this)));
                  }
                } else {
                  $(this).data('transparent', false);
                  $(this).val(data);
                }
                updateFromInput($(this));
              });
            }
          return $(this);

          // Initializes the control
          default:
            if( method !== 'create' ) data = method;
          $(this).each( function() {
            init($(this), data);
          });
          return $(this);

        }

      }
    });

    // Initialize input elements
    function init(input, settings) {

      var colourpicker = $('<div class="colourpicker" />'),
      defaults = $.colourpicker.defaults;

      // Do nothing if already initialized
      if( input.data('colourpicker-initialized') ) return;

      // Handle settings
      settings = $.extend(true, {}, defaults, settings);

      // Custom positioning
      if( settings.position !== undefined ) {
        $.each(settings.position.split(' '), function() {
          colourpicker.addClass('colourpicker-position-' + this);
        });
      }

      if( settings.allowTransparent ) {
        colourpicker.addClass('input-group');
      }

      // The input
      input
      .addClass('colourpicker-input')
      .data('colourpicker-initialized', false)
      .data('colourpicker-settings', settings)
      .prop('size', 7)
      .wrap(colourpicker)
      .after(
        '<div class="colourpicker-panel">' +
          '<div class="colourpicker-slider colourpicker-sprite">' +
            '<div class="colourpicker-slider-picker"></div>' +
          '</div>' +
          '<div class="colourpicker-grid colourpicker-sprite">' +
            '<div class="colourpicker-grid-inner"></div>' +
            '<div class="colourpicker-picker">' +
              '<div></div>' +
            '</div>' +
          '</div>' +
        '<div>'
      );

      // If we want to add transparent button, make an input group
      if ( settings.allowTransparent ) {
        input.parent().find('.colourpicker-panel').after(
          '<label class="input-group-addon">' +
            '<input type="checkbox" class="colourpicker-istransparent">' +
            ' Transparent' +
          '</label>'
        );
        input.data('allow-transparent', true);
      } else {
        input.data('allow-transparent', false);
      }

      // Prevent text selection in IE
      input.parent().find('.colourpicker-panel').on('selectstart', function() { return false; }).end();

      updateFromInput(input, false);

      input.data('colourpicker-initialized', true);
    }

    // Returns the input back to its original state
    function destroy(input) {

      var colourpicker = input.parent();

      // Revert the input element
      input
      .removeData('colourpicker-initialized')
      .removeData('colourpicker-settings')
      .removeProp('size')
      .removeClass('colourpicker-input');

      // Remove the wrap and destroy whatever remains
      colourpicker.before(input).remove();

    }

    // Shows the specified dropdown panel
    function show(input) {

      var colourpicker = input.parent(),
      panel = colourpicker.find('.colourpicker-panel'),
      settings = input.data('colourpicker-settings');

      // Do nothing if uninitialized, disabled, or already open
      if( !input.data('colourpicker-initialized') ||
          input.prop('disabled') ||
          colourpicker.hasClass('colourpicker-focus')
      ) return;

      hide();

      colourpicker.addClass('colourpicker-focus');
      panel
      .stop(true, true)
      .fadeIn(settings.showSpeed, function() {
        if( settings.show ) settings.show.call(input.get(0));
      });

    }

    // Hides all dropdown panels
    function hide() {

      $('.colourpicker-focus').each( function() {

        var colourpicker = $(this),
        input = colourpicker.find('.colourpicker-input'),
        panel = colourpicker.find('.colourpicker-panel'),
        settings = input.data('colourpicker-settings');

        panel.fadeOut(settings.hideSpeed, function() {
          if( settings.hide ) settings.hide.call(input.get(0));
          colourpicker.removeClass('colourpicker-focus');
        });

      });
    }

    // Moves the selected picker
    function move(target, event, animate) {

      var input = target.parents('.colourpicker').find('.colourpicker-input'),
      settings = input.data('colourpicker-settings'),
      picker = target.find('[class$=-picker]'),
      offsetX = target.offset().left,
      offsetY = target.offset().top,
      x = Math.round(event.pageX - offsetX),
      y = Math.round(event.pageY - offsetY),
      duration = animate ? settings.animationSpeed : 0,
      wx, wy, r, phi;

      // Touch support
      if( event.originalEvent.changedTouches ) {
        x = event.originalEvent.changedTouches[0].pageX - offsetX;
        y = event.originalEvent.changedTouches[0].pageY - offsetY;
      }

      // Constrain picker to its container
      if( x < 0 ) x = 0;
      if( y < 0 ) y = 0;
      if( x > target.width() ) x = target.width();
      if( y > target.height() ) y = target.height();

      // Move the picker
      if( target.is('.colourpicker-grid') ) {
        picker
        .stop(true)
        .animate({
          top: y + 'px',
          left: x + 'px'
        }, duration, settings.animationEasing, function() {
          updateFromControl(input, target);
        });
      } else {
        picker
        .stop(true)
        .animate({
          top: y + 'px'
        }, duration, settings.animationEasing, function() {
          updateFromControl(input, target);
        });
      }

    }

    // Sets the input based on the color picker values
    function updateFromControl(input, target) {

      function getCoords(picker, container) {

        var left, top;
        if( !picker.length || !container ) return null;
        left = picker.offset().left;
        top = picker.offset().top;

        return {
          x: left - container.offset().left + (picker.outerWidth() / 2),
          y: top - container.offset().top + (picker.outerHeight() / 2)
        };

      }

      var hue, saturation, brightness, x, y, r, phi,

      hex = input.val(),

      // Helpful references
      colourpicker = input.parent(),
      settings = input.data('colourpicker-settings'),

      // Panel objects
      grid = colourpicker.find('.colourpicker-grid'),
      slider = colourpicker.find('.colourpicker-slider'),

      // Picker objects
      gridPicker = grid.find('[class$=-picker]'),
      sliderPicker = slider.find('[class$=-picker]'),

      // Picker positions
      gridPos = getCoords(gridPicker, grid),
      sliderPos = getCoords(sliderPicker, slider);

      // Handle colors
      if( target.is('.colourpicker-grid, .colourpicker-slider') ) {
        // Calculate hue, saturation, and brightness
        hue = keepWithin(360 - parseInt(sliderPos.y * (360 / slider.height()), 10), 0, 360);
        saturation = keepWithin(Math.floor(gridPos.x * (100 / grid.width())), 0, 100);
        brightness = keepWithin(100 - Math.floor(gridPos.y * (100 / grid.height())), 0, 100);
        hex = hsb2hex({
          h: hue,
          s: saturation,
          b: brightness
        });

        // Update UI
        grid.css('backgroundColor', hsb2hex({ h: hue, s: 100, b: 100 }));

        // Adjust case
        input.val(hex.toUpperCase());

      }

      // Update text colour and background colour
      switch (settings.showColour) {
        case "text":
          input.css('color', '');
          input.css('background-color', '');
          break;
        case "background":
          input.css('color', "transparent");
          input.css('background-color', hex);
          break;
        default:
          input.css('color', getTextCol(hex));
          input.css('background-color', hex);
      }

      // Handle change event
      doChange(input, hex, input.data('transparent'));

    }

    // Sets the color picker values from the input
    function updateFromInput(input, preserveInputValue) {

      var hex,
      hsb,
      x, y, r, phi,

      // Helpful references
      colourpicker = input.parent(),
      settings = input.data('colourpicker-settings'),

      // Panel objects
      grid = colourpicker.find('.colourpicker-grid'),
      slider = colourpicker.find('.colourpicker-slider'),

      // Picker objects
      gridPicker = grid.find('[class$=-picker]'),
      sliderPicker = slider.find('[class$=-picker]');

      // Determine hex/HSB values
      hex = parseHex(input.val(), true).toUpperCase();
      if( !hex ){
        hex = getLastVal(input);
      }
      hsb = hex2hsb(hex);

      // Update input value
      if( !preserveInputValue ) input.val(hex);

      // Update text colour and background colour
      switch (settings.showColour) {
        case "text":
          input.css('color', '');
          input.css('background-color', '');
          break;
        case "background":
          input.css('color', "transparent");
          input.css('background-color', hex);
          break;
        default:
          input.css('color', getTextCol(hex));
          input.css('background-color', hex);
      }

      // Set grid position
      x = keepWithin(Math.ceil(hsb.s / (100 / grid.width())), 0, grid.width());
      y = keepWithin(grid.height() - Math.ceil(hsb.b / (100 / grid.height())), 0, grid.height());
      gridPicker.css({
        top: y + 'px',
        left: x + 'px'
      });

      // Set slider position
      y = keepWithin(slider.height() - (hsb.h / (360 / slider.height())), 0, slider.height());
      sliderPicker.css('top', y + 'px');

      // Update panel color
      grid.css('backgroundColor', hsb2hex({ h: hsb.h, s: 100, b: 100 }));

      // Fire change event, but only if colourpicker is fully initialized
      if( input.data('colourpicker-initialized') ) {
        doChange(input, hex, input.data('transparent'));
      }
      if( input.data('transparent') ) {
        colourpicker.find('.colourpicker-istransparent').prop('checked', true);
        colourpicker.addClass('istransparent');
      } else {
        colourpicker.find('.colourpicker-istransparent').prop('checked', false);
        colourpicker.removeClass('istransparent');
      }

      input.trigger('change').trigger('input');
    }

    // Runs the change and changeDelay callbacks
    function doChange(input, hex, transparent) {

      var settings = input.data('colourpicker-settings'),
      lastChange = input.data('colourpicker-lastChange'),
      lastTransparent = input.data('colourpicker-lastTransparent');

      // Only run if it actually changed
      if( !lastChange || lastChange !== hex || lastTransparent !== transparent ) {

        // Remember last-changed value
        input.data('colourpicker-lastChange', hex);
        input.data('colourpicker-lastTransparent', transparent);

        // Fire change event
        if( settings.change ) {
          if( settings.changeDelay ) {
            // Call after a delay
            clearTimeout(input.data('colourpicker-changeTimeout'));
            input.data('colourpicker-changeTimeout', setTimeout( function() {
              settings.change.call(input.get(0), hex);
            }, settings.changeDelay));
          } else {
            // Call immediately
            settings.change.call(input.get(0), hex);
          }
        }
        input.trigger('change').trigger('input');
      }

    }

    // Parses a string and returns a valid hex string when possible
    function parseHex(string, expand) {
      string = string.replace(/[^A-F0-9]/ig, '');
      if( string.length !== 3 && string.length !== 6 ) return '';
      if( string.length === 3 && expand ) {
        string = string[0] + string[0] + string[1] + string[1] + string[2] + string[2];
      }
      return '#' + string;
    }

    // Keeps value within min and max
    function keepWithin(value, min, max) {
      if( value < min ) value = min;
      if( value > max ) value = max;
      return value;
    }

    // Converts an HSB object to an RGB object
    function hsb2rgb(hsb) {
      var rgb = {};
      var h = Math.round(hsb.h);
      var s = Math.round(hsb.s * 255 / 100);
      var v = Math.round(hsb.b * 255 / 100);
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
    }

    // Converts an RGB object to a hex string
    function rgb2hex(rgb) {
      var hex = [
        rgb.r.toString(16),
        rgb.g.toString(16),
        rgb.b.toString(16)
        ];
      $.each(hex, function(nr, val) {
        if (val.length === 1) hex[nr] = '0' + val;
      });
      return '#' + hex.join('');
    }

    // Converts an HSB object to a hex string
    function hsb2hex(hsb) {
      return rgb2hex(hsb2rgb(hsb));
    }

    // Converts a hex string to an HSB object
    function hex2hsb(hex) {
      var hsb = rgb2hsb(hex2rgb(hex));
      if( hsb.s === 0 ) hsb.h = 360;
      return hsb;
    }

    // Converts an RGB object to an HSB object
    function rgb2hsb(rgb) {
      var hsb = { h: 0, s: 0, b: 0 };
      var min = Math.min(rgb.r, rgb.g, rgb.b);
      var max = Math.max(rgb.r, rgb.g, rgb.b);
      var delta = max - min;
      hsb.b = max;
      hsb.s = max !== 0 ? 255 * delta / max : 0;
      if( hsb.s !== 0 ) {
        if( rgb.r === max ) {
          hsb.h = (rgb.g - rgb.b) / delta;
        } else if( rgb.g === max ) {
          hsb.h = 2 + (rgb.b - rgb.r) / delta;
        } else {
          hsb.h = 4 + (rgb.r - rgb.g) / delta;
        }
      } else {
        hsb.h = -1;
      }
      hsb.h *= 60;
      if( hsb.h < 0 ) {
        hsb.h += 360;
      }
      hsb.s *= 100/255;
      hsb.b *= 100/255;
      return hsb;
    }

    // Converts a hex string to an RGB object
    function hex2rgb(hex) {
      hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
      return {
        /* jshint ignore:start */
        r: hex >> 16,
        g: (hex & 0x00FF00) >> 8,
        b: (hex & 0x0000FF)
        /* jshint ignore:end */
      };
    }

    // Get the text colour to use inside the box if the background interferes with it
    function getTextCol(hex) {
      return getLuminance(hex) > 0.22 ? '#000' : '#ddd';
    }

    // Calculate the luminance of the chosen colour to determine if too dark for text
    function getLuminance(hex) {
      var rgb = hex2rgb(hex);
      rgb = $.map(rgb, function(x) {
        x = x / 255;
        x = x <= 0.03928 ? x / 12.92 : Math.pow(((x + 0.055) / 1.055), 2.4);
        return x;
      });
      var luminance = rgb[0]*0.2126 + rgb[1]*0.7152 + rgb[2]*0.0722;
      return luminance;
    }


    function getLastVal(input) {
      if (input.data('colourpicker-lastChange')) {
        return input.data('colourpicker-lastChange');
      } else {
        return "#FFFFFF";
      }
    }

    // Handle events
    $(document)
    // Hide on clicks outside of the control
    .on('mousedown.colourpicker touchstart.colourpicker', function(event) {
      if( !$(event.target).parents().add(event.target).hasClass('colourpicker') ) {
        hide();
      }
    })
    // Start moving
    .on('mousedown.colourpicker touchstart.colourpicker', '.colourpicker-grid, .colourpicker-slider', function(event) {
      var target = $(this);
      event.preventDefault();
      $(document).data('colourpicker-target', target);
      move(target, event, true);
    })
    // Move pickers
    .on('mousemove.colourpicker touchmove.colourpicker', function(event) {
      var target = $(document).data('colourpicker-target');
      if( target ) move(target, event);
    })
    // Stop moving
    .on('mouseup.colourpicker touchend.colourpicker', function() {
      $(this).removeData('colourpicker-target');
    })
    // Show on focus
    .on('focus.colourpicker', '.colourpicker-input', function() {
      var input = $(this);
      if( !input.data('colourpicker-initialized') ) return;
      input.data('transparent', false);
      show(input);
      updateFromInput($(this));
    })
    // Fix hex on blur
    .on('blur.colourpicker', '.colourpicker-input', function() {
      var input = $(this),
      settings = input.data('colourpicker-settings');
      if( !input.data('colourpicker-initialized') ) return;

      // Parse Hex
      input.val(parseHex(input.val(), true));

      // Is it blank?
      if( input.val() === '' ) {
        input.val(getLastVal(input));
      }

      // Adjust case
      input.val(input.val().toUpperCase());
    })
    // Handle keypresses
    .on('keydown.colourpicker', '.colourpicker-input', function(event) {
      var input = $(this);
      if( !input.data('colourpicker-initialized') ) return;
      switch(event.keyCode) {
        case 9: // tab
        hide();
        break;
        case 13: // enter
        case 27: // esc
        hide();
        input.blur();
        break;
      }
    })
    // Update on keyup
    .on('keyup.colourpicker', '.colourpicker-input', function() {
      var input = $(this);
      if( !input.data('colourpicker-initialized') ) return;
      updateFromInput(input, true);
    })
    // Update on paste
    .on('paste.colourpicker', '.colourpicker-input', function() {
      var input = $(this);
      if( !input.data('colourpicker-initialized') ) return;
      setTimeout( function() {
        updateFromInput(input, true);
      }, 1);
    })
    // Update when setting transparent option
    .on('change.colourpicker-istransparent', '.input-group-addon', function(event) {
      var input = $(this).siblings(".colourpicker-input");
      var colourpicker = input.parent();
      var checkbox = $(this).find(".colourpicker-istransparent");
      hide();
      input.data('transparent', checkbox.is(":checked"));
      updateFromInput(input);
    });

  }));
