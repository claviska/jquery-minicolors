/**
  * jQuery Colour picker: A tiny colour picker with useful extra features
  *
  * Copyright:
  * Dean Attali, http://deanattali.com
  * Cory LaViska for A Beautiful Site, LLC: http://www.abeautifulsite.net/
  * David Griswold http://davidgriswoldhh.mtbos.org/
  *
  * Version: 1.4
  *
  * Contribute: https://github.com/daattali/jquery-colourpicker
  *
  * @license: http://opensource.org/licenses/MIT
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
        hide: null,
        hideSpeed: 100,
        show: null,
        showSpeed: 100,
        // added by Dean Attali modified in some cases by David Griswold
        showColour: 'both',
        allowTransparent: false,
        transparentText: 'Transparent',
        palette: 'square',
        allowedCols:
          ["#000000FF", "#333333FF", "#4D4D4DFF", "#666666FF", "#7F7F7FFF", "#999999FF", "#B3B3B3FF", "#E5E5E5FF",
           "#FFFFFFFF", "#27408BFF", "#000080FF", "#0000FFFF", "#1E90FFFF", "#63B8FFFF", "#97FFFFFF", "#00FFFFFF",
           "#00868BFF", "#008B45FF", "#458B00FF", "#008B00FF", "#00FF00FF", "#7FFF00FF", "#54FF9FFF", "#00FF7FFF",
           "#7FFFD4FF", "#8B4500FF", "#8B0000FF", "#FF0000FF", "#FF6A6AFF", "#FF7F00FF", "#FFFF00FF", "#FFF68FFF",
           "#F4A460FF", "#551A8BFF", "#8B008BFF", "#8B0A50FF", "#9400D3FF", "#FF00FFFF", "#FF1493FF", "#E066FFFF"],
        returnName: false,
        // added by David Griswold
        allowAlpha: false
      }
    };

    // Public methods
    $.extend($.fn, {
      colourpicker: function(method, data) {

        switch(method) {

          // the control
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

            var alpha = $(this).data('allow-alpha');
            var colRGB = $(this).data('colour');
            var fmt =  $(this).data('return-format');

            var colReturn = rgb2str(colRGB, fmt, alpha, "hex");

            return colReturn;
          } else {
              // Setter
              $(this).each( function() {
                // temporarily let the value be whatever they put.
                // updateFromInput will handle the error correction.
                $(this).val(data);
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
      inputcontainer = $('<div class="colourpicker-input-container" />'),
      inputgroup = $('<div class="input-group" />'),
      defaults = $.colourpicker.defaults;

      // Do nothing if already initialized
      if( input.data('colourpicker-initialized') ) return;

      // Handle settings
      settings = $.extend(false, {}, defaults, settings);
      // for backwards compatibility
      if ($.type(settings.allowedCols) === "string") {
        settings.allowedCols = settings.allowedCols.split(" ");
      }
      // Palette type, alpha or not, make it an input group.
      var wide = settings.allowAlpha;
      if (settings.palette=="limited") wide = false;




      colourpicker
      .addClass('palette-' + settings.palette)
      .toggleClass('colourpicker-with-alpha',wide);

      // save some important settings
      input.data('allow-alpha', settings.allowAlpha);
      input.data('palette-type',settings.palette);

      // The input
      input
      .prop('spellcheck', false)
      .addClass('colourpicker-input')
      .data('colourpicker-initialized', false)
      .data('colourpicker-lastChange', false)
      .data('colourpicker-settings', settings)
      .prop('size', 7)
      .wrap(colourpicker)
      .wrap(inputcontainer);



      if( settings.palette == "square" ) {
       input
       .after(
        '<div class="colourpicker-panel">' +
        '<div class="colourpicker-slider colourpicker-sprite">' +
        '<div class="colourpicker-slider-picker"></div>' +
        '</div>' +
        '<div class="colourpicker-alpha-slider">' +
        '<div class="colourpicker-alpha-inner-slider"></div>' +
        '<div class="colourpicker-slider-picker"></div>' +
        '</div>' +
        '<div class="colourpicker-grid">' +
        '<div class="colourpicker-grid-inner colourpicker-sprite">' +
        '<div class="colourpicker-grid-inner-2"></div>' +
        '</div>' +
        '<div class="colourpicker-picker">' +
        '<div></div>' +
        '</div>' +
        '</div>' +
        '</div>'
        );
     } else if( settings.palette == "limited" ) {
      var coloursHtml = '<div class="colourpicker-list">';
      var hex8Allowed = [];
      $.each(settings.allowedCols, function(idx, col) {
        var rgb = str2rgb(col);
          // alpha assumed true for palette = limited, because why would you specifiy it if you don't want
          // to allow it?
          input.data('allow-alpha',true);
          // create string to set the background color
          var hex8string = rgb2hex(rgb,8);
          hex8Allowed.push(hex8string);
          var hexstring = rgb2hex(rgb);
          var backgroundstring = "";
          if (rgb.a===0) {
            backgroundstring = "background-color: transparent";
          }else if (jQuery.support.opacity || rgb.a === 1 || rgb.a === false) {
            backgroundstring ="background-color: " + rgb2str(rgb,"rgb");
          }else {
            // IE8 with alpha.
            backgroundstring = "background-color: " + rgb2str(rgb,"rgb",false) +
                                "; -ms-filter: 'progid:DXImageTransform.Microsoft.Alpha(Opacity = " +
                                Math.round(rgb.a * 100) + ")';";
          }
          coloursHtml += '<span class="cp-list-col-outer"><span class="cp-list-col" data-cp-col="' + hexstring +'" ' +
          'style="' + backgroundstring + '" + ></span></span>';
        });

        input.data('hex8-allowed',hex8Allowed);
        input
        .after(
          '<div class="colourpicker-panel">' +
          coloursHtml +
          '</div>'
          );
      } else {
        console.log("colourpicker: invalid palette type (" + settings.palette + ")");
      }
      // If we want to add transparent button, make an input group
      if ( settings.allowTransparent ) {
        input.wrap(inputgroup);
        input.after(
          '<label class="input-group-addon">' +
          '<input type="checkbox" class="colourpicker-istransparent"> ' +
          '<span class="colourpicker-transparent-text">' + settings.transparentText + '</span>' +
          '</label>'
          );
        input.data('allow-transparent', true);
      } else {
        input.data('allow-transparent', false);
      }
      // If only background colour is shown, don't let the user select the text
      if ( settings.showColour == "background" ) {
        input.attr('readonly', 'readonly');
      } else {
        input.removeAttr('readonly');
      }
      // Return a colour name instead of HEX when possible
      if ( settings.returnName ) {
        input.data('return-format',"name");
      } else {
        input.data('return-format', "hex");
      }

      // Prevent text selection in IE
      input.closest('.colourpicker').find('.colourpicker-panel').on('selectstart', function() { return false; }).end();

      updateFromInput(input, false);

      input.data('colourpicker-initialized', true);
    }

    // Returns the input back to its original state
    function destroy(input) {

      var colourpicker = input.closest('.colourpicker');

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

      var colourpicker = input.closest('.colourpicker'),
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

      var input = target.closest('.colourpicker').find('.colourpicker-input'),
      settings = input.data('colourpicker-settings'),
      picker = target.find('[class$=-picker]'),
      offsetX = target.offset().left,
      offsetY = target.offset().top,
      x = Math.round(event.pageX - offsetX),
      y = Math.round(event.pageY - offsetY),
      duration = animate ? settings.animationSpeed : 0;

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

      var hue, saturation, brightness,  rgb, alpha, hex,

      // Helpful references
      colourpicker = input.closest('.colourpicker'),
      settings = input.data('colourpicker-settings'),

      // Panel objects
      grid = colourpicker.find('.colourpicker-grid'),
      innergrid = colourpicker.find('.colourpicker-grid-inner'),
      slider = colourpicker.find('.colourpicker-slider'),
      alphaslider = colourpicker.find('.colourpicker-alpha-slider'),
      alphainnerslider = colourpicker.find('.colourpicker-alpha-inner-slider'),


      // Picker objects
      gridPicker = grid.find('[class$=-picker]'),
      sliderPicker = slider.find('[class$=-picker]'),
      alphapicker = alphaslider.find('[class$=-picker]'),

      // Picker positions
      gridPos = getCoords(gridPicker, grid),
      sliderPos = getCoords(sliderPicker, slider),
      alphaPos = getCoords(alphapicker,alphaslider);

      // Handle colors when there's a palette
      if( target.is('.colourpicker-grid, .colourpicker-slider, .colourpicker-alpha-slider') ) {
        // Calculate hue, saturation, and brightness
        hue = keepWithin(360 - parseInt(sliderPos.y * (360 / slider.height()), 10), 0, 360);
        saturation = keepWithin(Math.floor(gridPos.x * (100 / grid.width())), 0, 100);
        brightness = keepWithin(100 - Math.floor(gridPos.y * (100 / grid.height())), 0, 100);
        alpha = settings.allowAlpha ? keepWithin(1-alphaPos.y * (1 / alphaslider.height()),0,1) : false;
        rgb = hsb2rgb({
          h: hue,
          s: saturation,
          b: brightness,
          a: alpha
        });
        hex = rgb2hex(rgb);

        // Update UI
        innergrid.css('backgroundColor', rgb2hex(hsb2rgb({ h: hue, s: 100, b: 100, a : 1})));

        if (alpha !== false) {
          var rgbstring = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",",
            lgradstring = "linear-gradient(" + rgbstring + "1) 0, " + rgbstring + "0) 100%)",
            filterstring = "progid:DXImageTransform.Microsoft.gradient( startColorstr=#FF" +
                           hex.substr(1,7) + ", endColorstr=#00000000, GradientType=0 );";
          alphainnerslider.css('background',lgradstring);
          alphainnerslider.css('filter',filterstring);
        }
      }

      // Handle colours when there is a limited selection of colours
      if( target.is('.cp-list-col') ) {
       hex = target.data('cp-col');
       rgb = str2rgb(hex);
       colourpicker.find('.cp-list-col').removeClass('selected-col');
       colourpicker.find('.cp-list-col[data-cp-col="' + hex + '"]')
       .addClass('selected-col')
       .addClass(isColDark(rgb) ? 'dark' : 'light');
     }

      // save colour and update value
      input.data('colour',rgb);
      var fmt = input.data('return-format');
      var fbfmt = "hex";
      var allow = input.data('allow-alpha');
      input.val(rgb2str(rgb,fmt,allow,fbfmt));

      // Update text colour and background colour
      switch (settings.showColour) {
        case "text":
        input.css('color', '');
        input.css('background-color', '');
        break;
        case "background":
        if (! jQuery.support.opacity) {
          if ( rgb.a!==false && rgb.a < 1) {
            input.css('background-color',rgb2str(rgb,"rgb",false));
            input.css('color',rgb2str(rgb,"rgb",false));
            input.css('filter','progid:DXImageTransform.Microsoft.Alpha(Opacity = ' + Math.round(rgb.a*100) + ');');
          }else {
            input.css('background-color',rgb2str(rgb,"rgb",false));
            input.css('color',rgb2str(rgb,"rgb",false));
            input.css('filter','');
          }
        }else {
          input.css('color', "transparent");
          input.css('background-color', rgb2str(rgb,"rgb"));
        }
        break;
        default:
        input.css('color', isColDark(rgb) ? '#ddd' : '#000');
        if (! jQuery.support.opacity) {
          if (rgb.a===0) {
            input.css('background-color','transparent');
          }else if (rgb.a !== false && rgb.a < 1) {
            input.css('background-color',rgb2str(rgb,"rgb",false));
            input.css('filter','progid:DXImageTransform.Microsoft.Alpha(Opacity = ' + Math.round(rgb.a*100) + ');');
          }else {
            input.css('background-color',rgb2str(rgb,"rgb",false));
            input.css('filter','');
          }
        }else {
          input.css('background-color', rgb2str(rgb,"rgb"));
        }
      }      // Handle change event
      if (!rgb) rgb = getLastColor(input);
      doChange(input, rgb, input.data('transparent'));

    }

    // Sets the color picker values from the input
    function updateFromInput(input, preserveInputValue) {

      var x, y, hsb, hex,

      // Helpful references
      colourpicker = input.closest('.colourpicker'),
      settings = input.data('colourpicker-settings'),

      // Panel objects
      grid = colourpicker.find('.colourpicker-grid'),
      innergrid = colourpicker.find('.colourpicker-grid-inner'),
      slider = colourpicker.find('.colourpicker-slider'),
      alphaslider = colourpicker.find('.colourpicker-alpha-slider'),
      alphainnerslider = colourpicker.find('.colourpicker-alpha-inner-slider'),


      // Picker objects
      gridPicker = grid.find('[class$=-picker]'),
      sliderPicker = slider.find('[class$=-picker]'),
      alphapicker = alphaslider.find('[class$=-picker]'),

      // useful sttings and initial color
      fmt = input.data('return-format'),
      allowAlpha = input.data('allow-alpha'),
      rgb = allowedColor(input, str2rgb(input.val()));

      // if allowedColor returns false, something is wrong with      // the input OR the color is not allowed in palette limited.
      // Replace with last color.
      if (!rgb) rgb = getLastColor(input);
      // one more safety check: if alpha not allowed, force alpha bit to false.
      if (! allowAlpha) rgb.a=false;

      if (allowAlpha && rgb.a===false) rgb.a=1;

      // Update input value with fixed version
      if( !preserveInputValue ) input.val(rgb2str(rgb,fmt,allowAlpha,"hex"));
      input.data('colour',rgb);
      hex = rgb2hex(rgb);
      hsb = rgb2hsb(rgb);

      // Update text colour and background colour
      switch (settings.showColour) {
        case "text":
        input.css('color', '');
        input.css('background-color', '');
        break;
        case "background":
        if (! jQuery.support.opacity) {
          if ( rgb.a!==false && rgb.a < 1) {
            input.css('background-color',rgb2str(rgb,"rgb",false));
            input.css('color',rgb2str(rgb,"rgb",false));
            input.css('filter','progid:DXImageTransform.Microsoft.Alpha(Opacity = ' +
                       Math.round(rgb.a*100) + ');');
          }else {
            input.css('background-color',rgb2str(rgb,"rgb",false));
            input.css('color',rgb2str(rgb,"rgb",false));
            input.css('filter','');
          }
        }else {
          input.css('color', "transparent");
          input.css('background-color', rgb2str(rgb,"rgb"));
        }
        break;
        default:
        input.css('color', isColDark(rgb) ? '#ddd' : '#000');
        if (! jQuery.support.opacity) {
          if (rgb.a===0) {
            input.css('background-color','transparent');
          }else if (rgb.a !== false && rgb.a < 1) {
            input.css('background-color',rgb2str(rgb,"rgb",false));
            input.css('filter','progid:DXImageTransform.Microsoft.Alpha(Opacity = ' +
                       Math.round(rgb.a*100) + ');');
            input.css('filter','');
          }else {
            input.css('background-color',rgb2str(rgb,"rgb",false));
          }
        }else {
          input.css('background-color', rgb2str(rgb,"rgb"));
        }
      }
      // Update select colour
      if( settings.palette == 'limited') {
        colourpicker.find('.cp-list-col').removeClass('selected-col');
        colourpicker.find('.cp-list-col[data-cp-col="' + hex + '"]')
        .addClass('selected-col')
        .addClass(isColDark(rgb) ? 'dark' : 'light');
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
      innergrid.css('backgroundColor', rgb2hex(hsb2rgb({ h: hsb.h, s: 100, b: 100, a: 1})));

      if (rgb.a !== false) {
        var rgbstring = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",";
        var lgradstring = "linear-gradient(" + rgbstring + "1) 0, " + rgbstring + "0) 100%)";
        var filterstring = "progid:DXImageTransform.Microsoft.gradient( startColorstr=#FF" +
                           hex.substr(1,7) + ", endColorstr=#00000000, GradientType=0 );";
        alphainnerslider.css('background',lgradstring);
        alphainnerslider.css('filter',filterstring);
        // set alpha slider position
        y = keepWithin(alphaslider.height() - (rgb.a / (1 / alphaslider.height())),0,alphaslider.height());
        alphapicker.css('top',y+'px');
      }
      // Fire change event, but only if colourpicker is fully initialized
      if( input.data('colourpicker-initialized') ) {
        doChange(input, rgb, input.data('transparent'));
      }
      if( input.data('transparent') ) {
        colourpicker.find('.colourpicker-istransparent').prop('checked', true);
        colourpicker.addClass('istransparent');
        input.data("colour","transparent");
      } else {
        colourpicker.find('.colourpicker-istransparent').prop('checked', false);
        colourpicker.removeClass('istransparent');
      }

      input.trigger('change').trigger('input');
    }

    // Runs the change and changeDelay callbacks
    function doChange(input, rgb, transparent) {

      var settings = input.data('colourpicker-settings'),
      lastChange = input.data('colourpicker-lastChange'),
      lastTransparent = input.data('colourpicker-lastTransparent'),
      sameAsLast = (rgb.r===lastChange.r && rgb.b===lastChange.b && rgb.g===lastChange.g && rgb.a===lastChange.a);

      // Only run if it actually changed


      if( !lastChange || !sameAsLast || lastTransparent !== transparent ) {

        // Remember last-changed value
        input.data('colourpicker-lastChange', rgb);
        input.data('colourpicker-lastTransparent', transparent);

        // Fire change event
        if( settings.change ) {
          if( settings.changeDelay ) {
            // Call after a delay
            clearTimeout(input.data('colourpicker-changeTimeout'));
            input.data('colourpicker-changeTimeout', setTimeout( function() {
              settings.change.call(input.get(0), rgb);
            }, settings.changeDelay));
          } else {
            // Call immediately
            settings.change.call(input.get(0), rgb);
          }
        }
        input.trigger('change').trigger('input');
      }

    }

    // returns an rgb color limited to reasonable values
    // OR returns false if the color is not allowed
    // also makes sure r,g,b are ints and alpha is between 0 and 1 for good measure.
    function allowedColor(input,col) {

      col = correctedRGB(col);
      if (!col) return false;
      if (input.data('palette-type') !== 'limited') return col;
      var hex8 = rgb2hex(col,8);
      if ($.inArray(hex8, input.data('hex8-allowed')) !== -1) return col; else return false;
    }

    // Giant list of hex->colors. Defaults to "gray" for the grays and has no duplicates (e.g. no "red4", uses "darkred" instead)
    var colsToNames = {"#00000000":"transparent",  "#FFFFFFFF":"white",  "#F0F8FFFF":"aliceblue",  "#FAEBD7FF":"antiquewhite", "#FFEFDBFF":"antiquewhite1",  "#EEDFCCFF":"antiquewhite2",  "#CDC0B0FF":"antiquewhite3",  "#8B8378FF":"antiquewhite4",  "#7FFFD4FF":"aquamarine", "#76EEC6FF":"aquamarine2",  "#458B74FF":"aquamarine4",  "#F0FFFFFF":"azure",  "#E0EEEEFF":"azure2", "#C1CDCDFF":"azure3", "#838B8BFF":"azure4", "#F5F5DCFF":"beige",  "#FFE4C4FF":"bisque", "#EED5B7FF":"bisque2",  "#CDB79EFF":"bisque3",  "#8B7D6BFF":"bisque4",  "#000000FF":"black",  "#FFEBCDFF":"blanchedalmond", "#0000FFFF":"blue", "#0000EEFF":"blue2",  "#8A2BE2FF":"blueviolet", "#A52A2AFF":"brown",  "#FF4040FF":"brown1", "#EE3B3BFF":"brown2", "#CD3333FF":"brown3", "#8B2323FF":"brown4", "#DEB887FF":"burlywood",  "#FFD39BFF":"burlywood1", "#EEC591FF":"burlywood2", "#CDAA7DFF":"burlywood3", "#8B7355FF":"burlywood4", "#5F9EA0FF":"cadetblue",  "#98F5FFFF":"cadetblue1", "#8EE5EEFF":"cadetblue2", "#7AC5CDFF":"cadetblue3", "#53868BFF":"cadetblue4", "#7FFF00FF":"chartreuse", "#76EE00FF":"chartreuse2",  "#66CD00FF":"chartreuse3",  "#458B00FF":"chartreuse4",  "#D2691EFF":"chocolate",  "#FF7F24FF":"chocolate1", "#EE7621FF":"chocolate2", "#CD661DFF":"chocolate3", "#FF7F50FF":"coral",  "#FF7256FF":"coral1", "#EE6A50FF":"coral2", "#CD5B45FF":"coral3", "#8B3E2FFF":"coral4", "#6495EDFF":"cornflowerblue", "#FFF8DCFF":"cornsilk", "#EEE8CDFF":"cornsilk2",  "#CDC8B1FF":"cornsilk3",  "#8B8878FF":"cornsilk4",  "#00FFFFFF":"cyan", "#00EEEEFF":"cyan2",  "#00CDCDFF":"cyan3",  "#00008BFF":"darkblue", "#008B8BFF":"darkcyan", "#B8860BFF":"darkgoldenrod",  "#FFB90FFF":"darkgoldenrod1", "#EEAD0EFF":"darkgoldenrod2", "#CD950CFF":"darkgoldenrod3", "#8B6508FF":"darkgoldenrod4", "#A9A9A9FF":"darkgray", "#006400FF":"darkgreen",  "#BDB76BFF":"darkkhaki",  "#8B008BFF":"darkmagenta",  "#556B2FFF":"darkolivegreen", "#CAFF70FF":"darkolivegreen1",  "#BCEE68FF":"darkolivegreen2",  "#A2CD5AFF":"darkolivegreen3",  "#6E8B3DFF":"darkolivegreen4",  "#FF8C00FF":"darkorange", "#FF7F00FF":"darkorange1",  "#EE7600FF":"darkorange2",  "#CD6600FF":"darkorange3",  "#8B4500FF":"darkorange4",  "#9932CCFF":"darkorchid", "#BF3EFFFF":"darkorchid1",  "#B23AEEFF":"darkorchid2",  "#9A32CDFF":"darkorchid3",  "#68228BFF":"darkorchid4",  "#8B0000FF":"darkred",  "#E9967AFF":"darksalmon", "#8FBC8FFF":"darkseagreen", "#C1FFC1FF":"darkseagreen1",  "#B4EEB4FF":"darkseagreen2",  "#9BCD9BFF":"darkseagreen3",  "#698B69FF":"darkseagreen4",  "#483D8BFF":"darkslateblue",  "#2F4F4FFF":"darkslategray",  "#97FFFFFF":"darkslategray1", "#8DEEEEFF":"darkslategray2", "#79CDCDFF":"darkslategray3", "#528B8BFF":"darkslategray4", "#00CED1FF":"darkturquoise",  "#9400D3FF":"darkviolet", "#FF1493FF":"deeppink", "#EE1289FF":"deeppink2",  "#CD1076FF":"deeppink3",  "#8B0A50FF":"deeppink4",  "#00BFFFFF":"deepskyblue",  "#00B2EEFF":"deepskyblue2", "#009ACDFF":"deepskyblue3", "#00688BFF":"deepskyblue4", "#696969FF":"dimgray",  "#1E90FFFF":"dodgerblue", "#1C86EEFF":"dodgerblue2",  "#1874CDFF":"dodgerblue3",  "#104E8BFF":"dodgerblue4",  "#B22222FF":"firebrick",  "#FF3030FF":"firebrick1", "#EE2C2CFF":"firebrick2", "#CD2626FF":"firebrick3", "#8B1A1AFF":"firebrick4", "#FFFAF0FF":"floralwhite",  "#228B22FF":"forestgreen",  "#DCDCDCFF":"gainsboro",  "#F8F8FFFF":"ghostwhite", "#FFD700FF":"gold", "#EEC900FF":"gold2",  "#CDAD00FF":"gold3",  "#8B7500FF":"gold4",  "#DAA520FF":"goldenrod",  "#FFC125FF":"goldenrod1", "#EEB422FF":"goldenrod2", "#CD9B1DFF":"goldenrod3", "#8B6914FF":"goldenrod4", "#BEBEBEFF":"gray", "#030303FF":"gray1",  "#050505FF":"gray2",  "#080808FF":"gray3",  "#0A0A0AFF":"gray4",  "#0D0D0DFF":"gray5",  "#0F0F0FFF":"gray6",  "#121212FF":"gray7",  "#141414FF":"gray8",  "#171717FF":"gray9",  "#1A1A1AFF":"gray10", "#1C1C1CFF":"gray11", "#1F1F1FFF":"gray12", "#212121FF":"gray13", "#242424FF":"gray14", "#262626FF":"gray15", "#292929FF":"gray16", "#2B2B2BFF":"gray17", "#2E2E2EFF":"gray18", "#303030FF":"gray19", "#333333FF":"gray20", "#363636FF":"gray21", "#383838FF":"gray22", "#3B3B3BFF":"gray23", "#3D3D3DFF":"gray24", "#404040FF":"gray25", "#424242FF":"gray26", "#454545FF":"gray27", "#474747FF":"gray28", "#4A4A4AFF":"gray29", "#4D4D4DFF":"gray30", "#4F4F4FFF":"gray31", "#525252FF":"gray32", "#545454FF":"gray33", "#575757FF":"gray34", "#595959FF":"gray35", "#5C5C5CFF":"gray36", "#5E5E5EFF":"gray37", "#616161FF":"gray38", "#636363FF":"gray39", "#666666FF":"gray40", "#6B6B6BFF":"gray42", "#6E6E6EFF":"gray43", "#707070FF":"gray44", "#737373FF":"gray45", "#757575FF":"gray46", "#787878FF":"gray47", "#7A7A7AFF":"gray48", "#7D7D7DFF":"gray49", "#7F7F7FFF":"gray50", "#828282FF":"gray51", "#858585FF":"gray52", "#878787FF":"gray53", "#8A8A8AFF":"gray54", "#8C8C8CFF":"gray55", "#8F8F8FFF":"gray56", "#919191FF":"gray57", "#949494FF":"gray58", "#969696FF":"gray59", "#999999FF":"gray60", "#9C9C9CFF":"gray61", "#9E9E9EFF":"gray62", "#A1A1A1FF":"gray63", "#A3A3A3FF":"gray64", "#A6A6A6FF":"gray65", "#A8A8A8FF":"gray66", "#ABABABFF":"gray67", "#ADADADFF":"gray68", "#B0B0B0FF":"gray69", "#B3B3B3FF":"gray70", "#B5B5B5FF":"gray71", "#B8B8B8FF":"gray72", "#BABABAFF":"gray73", "#BDBDBDFF":"gray74", "#BFBFBFFF":"gray75", "#C2C2C2FF":"gray76", "#C4C4C4FF":"gray77", "#C7C7C7FF":"gray78", "#C9C9C9FF":"gray79", "#CCCCCCFF":"gray80", "#CFCFCFFF":"gray81", "#D1D1D1FF":"gray82", "#D4D4D4FF":"gray83", "#D6D6D6FF":"gray84", "#D9D9D9FF":"gray85", "#DBDBDBFF":"gray86", "#DEDEDEFF":"gray87", "#E0E0E0FF":"gray88", "#E3E3E3FF":"gray89", "#E5E5E5FF":"gray90", "#E8E8E8FF":"gray91", "#EBEBEBFF":"gray92", "#EDEDEDFF":"gray93", "#F0F0F0FF":"gray94", "#F2F2F2FF":"gray95", "#F7F7F7FF":"gray97", "#FAFAFAFF":"gray98", "#FCFCFCFF":"gray99", "#00FF00FF":"green",  "#00EE00FF":"green2", "#00CD00FF":"green3", "#008B00FF":"green4", "#ADFF2FFF":"greenyellow",  "#F0FFF0FF":"honeydew", "#E0EEE0FF":"honeydew2",  "#C1CDC1FF":"honeydew3",  "#838B83FF":"honeydew4",  "#FF69B4FF":"hotpink",  "#FF6EB4FF":"hotpink1", "#EE6AA7FF":"hotpink2", "#CD6090FF":"hotpink3", "#8B3A62FF":"hotpink4", "#CD5C5CFF":"indianred",  "#FF6A6AFF":"indianred1", "#EE6363FF":"indianred2", "#CD5555FF":"indianred3", "#8B3A3AFF":"indianred4", "#FFFFF0FF":"ivory",  "#EEEEE0FF":"ivory2", "#CDCDC1FF":"ivory3", "#8B8B83FF":"ivory4", "#F0E68CFF":"khaki",  "#FFF68FFF":"khaki1", "#EEE685FF":"khaki2", "#CDC673FF":"khaki3", "#8B864EFF":"khaki4", "#E6E6FAFF":"lavender", "#FFF0F5FF":"lavenderblush",  "#EEE0E5FF":"lavenderblush2", "#CDC1C5FF":"lavenderblush3", "#8B8386FF":"lavenderblush4", "#7CFC00FF":"lawngreen",  "#FFFACDFF":"lemonchiffon", "#EEE9BFFF":"lemonchiffon2",  "#CDC9A5FF":"lemonchiffon3",  "#8B8970FF":"lemonchiffon4",  "#ADD8E6FF":"lightblue",  "#BFEFFFFF":"lightblue1", "#B2DFEEFF":"lightblue2", "#9AC0CDFF":"lightblue3", "#68838BFF":"lightblue4", "#F08080FF":"lightcoral", "#E0FFFFFF":"lightcyan",  "#D1EEEEFF":"lightcyan2", "#B4CDCDFF":"lightcyan3", "#7A8B8BFF":"lightcyan4", "#EEDD82FF":"lightgoldenrod", "#FFEC8BFF":"lightgoldenrod1",  "#EEDC82FF":"lightgoldenrod2",  "#CDBE70FF":"lightgoldenrod3",  "#8B814CFF":"lightgoldenrod4",  "#FAFAD2FF":"lightgoldenrodyellow", "#D3D3D3FF":"lightgray",  "#90EE90FF":"lightgreen", "#FFB6C1FF":"lightpink",  "#FFAEB9FF":"lightpink1", "#EEA2ADFF":"lightpink2", "#CD8C95FF":"lightpink3", "#8B5F65FF":"lightpink4", "#FFA07AFF":"lightsalmon",  "#EE9572FF":"lightsalmon2", "#CD8162FF":"lightsalmon3", "#8B5742FF":"lightsalmon4", "#20B2AAFF":"lightseagreen",  "#87CEFAFF":"lightskyblue", "#B0E2FFFF":"lightskyblue1",  "#A4D3EEFF":"lightskyblue2",  "#8DB6CDFF":"lightskyblue3",  "#607B8BFF":"lightskyblue4",  "#8470FFFF":"lightslateblue", "#778899FF":"lightslategray", "#B0C4DEFF":"lightsteelblue", "#CAE1FFFF":"lightsteelblue1",  "#BCD2EEFF":"lightsteelblue2",  "#A2B5CDFF":"lightsteelblue3",  "#6E7B8BFF":"lightsteelblue4",  "#FFFFE0FF":"lightyellow",  "#EEEED1FF":"lightyellow2", "#CDCDB4FF":"lightyellow3", "#8B8B7AFF":"lightyellow4", "#32CD32FF":"limegreen",  "#FAF0E6FF":"linen",  "#FF00FFFF":"magenta",  "#EE00EEFF":"magenta2", "#CD00CDFF":"magenta3", "#B03060FF":"maroon", "#FF34B3FF":"maroon1",  "#EE30A7FF":"maroon2",  "#CD2990FF":"maroon3",  "#8B1C62FF":"maroon4",  "#66CDAAFF":"mediumaquamarine", "#0000CDFF":"mediumblue", "#BA55D3FF":"mediumorchid", "#E066FFFF":"mediumorchid1",  "#D15FEEFF":"mediumorchid2",  "#B452CDFF":"mediumorchid3",  "#7A378BFF":"mediumorchid4",  "#9370DBFF":"mediumpurple", "#AB82FFFF":"mediumpurple1",  "#9F79EEFF":"mediumpurple2",  "#8968CDFF":"mediumpurple3",  "#5D478BFF":"mediumpurple4",  "#3CB371FF":"mediumseagreen", "#7B68EEFF":"mediumslateblue",  "#00FA9AFF":"mediumspringgreen",  "#48D1CCFF":"mediumturquoise",  "#C71585FF":"mediumvioletred",  "#191970FF":"midnightblue", "#F5FFFAFF":"mintcream",  "#FFE4E1FF":"mistyrose",  "#EED5D2FF":"mistyrose2", "#CDB7B5FF":"mistyrose3", "#8B7D7BFF":"mistyrose4", "#FFE4B5FF":"moccasin", "#FFDEADFF":"navajowhite",  "#EECFA1FF":"navajowhite2", "#CDB38BFF":"navajowhite3", "#8B795EFF":"navajowhite4", "#000080FF":"navy", "#FDF5E6FF":"oldlace",  "#6B8E23FF":"olivedrab",  "#C0FF3EFF":"olivedrab1", "#B3EE3AFF":"olivedrab2", "#698B22FF":"olivedrab4", "#FFA500FF":"orange", "#EE9A00FF":"orange2",  "#CD8500FF":"orange3",  "#8B5A00FF":"orange4",  "#FF4500FF":"orangered",  "#EE4000FF":"orangered2", "#CD3700FF":"orangered3", "#8B2500FF":"orangered4", "#DA70D6FF":"orchid", "#FF83FAFF":"orchid1",  "#EE7AE9FF":"orchid2",  "#CD69C9FF":"orchid3",  "#8B4789FF":"orchid4",  "#EEE8AAFF":"palegoldenrod",  "#98FB98FF":"palegreen",  "#9AFF9AFF":"palegreen1", "#7CCD7CFF":"palegreen3", "#548B54FF":"palegreen4", "#AFEEEEFF":"paleturquoise",  "#BBFFFFFF":"paleturquoise1", "#AEEEEEFF":"paleturquoise2", "#96CDCDFF":"paleturquoise3", "#668B8BFF":"paleturquoise4", "#DB7093FF":"palevioletred",  "#FF82ABFF":"palevioletred1", "#EE799FFF":"palevioletred2", "#CD6889FF":"palevioletred3", "#8B475DFF":"palevioletred4", "#FFEFD5FF":"papayawhip", "#FFDAB9FF":"peachpuff",  "#EECBADFF":"peachpuff2", "#CDAF95FF":"peachpuff3", "#8B7765FF":"peachpuff4", "#CD853FFF":"peru", "#FFC0CBFF":"pink", "#FFB5C5FF":"pink1",  "#EEA9B8FF":"pink2",  "#CD919EFF":"pink3",  "#8B636CFF":"pink4",  "#DDA0DDFF":"plum", "#FFBBFFFF":"plum1",  "#EEAEEEFF":"plum2",  "#CD96CDFF":"plum3",  "#8B668BFF":"plum4",  "#B0E0E6FF":"powderblue", "#A020F0FF":"purple", "#9B30FFFF":"purple1",  "#912CEEFF":"purple2",  "#7D26CDFF":"purple3",  "#551A8BFF":"purple4",  "#FF0000FF":"red",  "#EE0000FF":"red2", "#CD0000FF":"red3", "#BC8F8FFF":"rosybrown",  "#FFC1C1FF":"rosybrown1", "#EEB4B4FF":"rosybrown2", "#CD9B9BFF":"rosybrown3", "#8B6969FF":"rosybrown4", "#4169E1FF":"royalblue",  "#4876FFFF":"royalblue1", "#436EEEFF":"royalblue2", "#3A5FCDFF":"royalblue3", "#27408BFF":"royalblue4", "#8B4513FF":"saddlebrown",  "#FA8072FF":"salmon", "#FF8C69FF":"salmon1",  "#EE8262FF":"salmon2",  "#CD7054FF":"salmon3",  "#8B4C39FF":"salmon4",  "#F4A460FF":"sandybrown", "#2E8B57FF":"seagreen", "#54FF9FFF":"seagreen1",  "#4EEE94FF":"seagreen2",  "#43CD80FF":"seagreen3",  "#FFF5EEFF":"seashell", "#EEE5DEFF":"seashell2",  "#CDC5BFFF":"seashell3",  "#8B8682FF":"seashell4",  "#A0522DFF":"sienna", "#FF8247FF":"sienna1",  "#EE7942FF":"sienna2",  "#CD6839FF":"sienna3",  "#8B4726FF":"sienna4",  "#87CEEBFF":"skyblue",  "#87CEFFFF":"skyblue1", "#7EC0EEFF":"skyblue2", "#6CA6CDFF":"skyblue3", "#4A708BFF":"skyblue4", "#6A5ACDFF":"slateblue",  "#836FFFFF":"slateblue1", "#7A67EEFF":"slateblue2", "#6959CDFF":"slateblue3", "#473C8BFF":"slateblue4", "#708090FF":"slategray",  "#C6E2FFFF":"slategray1", "#B9D3EEFF":"slategray2", "#9FB6CDFF":"slategray3", "#6C7B8BFF":"slategray4", "#FFFAFAFF":"snow", "#EEE9E9FF":"snow2",  "#CDC9C9FF":"snow3",  "#8B8989FF":"snow4",  "#00FF7FFF":"springgreen",  "#00EE76FF":"springgreen2", "#00CD66FF":"springgreen3", "#008B45FF":"springgreen4", "#4682B4FF":"steelblue",  "#63B8FFFF":"steelblue1", "#5CACEEFF":"steelblue2", "#4F94CDFF":"steelblue3", "#36648BFF":"steelblue4", "#D2B48CFF":"tan",  "#FFA54FFF":"tan1", "#EE9A49FF":"tan2", "#8B5A2BFF":"tan4", "#D8BFD8FF":"thistle",  "#FFE1FFFF":"thistle1", "#EED2EEFF":"thistle2", "#CDB5CDFF":"thistle3", "#8B7B8BFF":"thistle4", "#FF6347FF":"tomato", "#EE5C42FF":"tomato2",  "#CD4F39FF":"tomato3",  "#8B3626FF":"tomato4",  "#40E0D0FF":"turquoise",  "#00F5FFFF":"turquoise1", "#00E5EEFF":"turquoise2", "#00C5CDFF":"turquoise3", "#00868BFF":"turquoise4", "#EE82EEFF":"violet", "#D02090FF":"violetred",  "#FF3E96FF":"violetred1", "#EE3A8CFF":"violetred2", "#CD3278FF":"violetred3", "#8B2252FF":"violetred4", "#F5DEB3FF":"wheat",  "#FFE7BAFF":"wheat1", "#EED8AEFF":"wheat2", "#CDBA96FF":"wheat3", "#8B7E66FF":"wheat4", "#F5F5F5FF":"whitesmoke", "#FFFF00FF":"yellow", "#EEEE00FF":"yellow2",  "#CDCD00FF":"yellow3",  "#8B8B00FF":"yellow4",  "#9ACD32FF":"yellowgreen"};
    
    //flipped version of colsToNames but includes all duplicates - "gray0", "grey0", and "black" all give the same result.
    var namesToCols = {"transparent":"#00000000", "white":"#FFFFFFFF",  "aliceblue":"#F0F8FFFF",  "antiquewhite":"#FAEBD7FF", "antiquewhite1":"#FFEFDBFF",  "antiquewhite2":"#EEDFCCFF",  "antiquewhite3":"#CDC0B0FF",  "antiquewhite4":"#8B8378FF",  "aquamarine":"#7FFFD4FF", "aquamarine1":"#7FFFD4FF",  "aquamarine2":"#76EEC6FF",  "aquamarine3":"#66CDAAFF",  "aquamarine4":"#458B74FF",  "azure":"#F0FFFFFF",  "azure1":"#F0FFFFFF", "azure2":"#E0EEEEFF", "azure3":"#C1CDCDFF", "azure4":"#838B8BFF", "beige":"#F5F5DCFF",  "bisque":"#FFE4C4FF", "bisque1":"#FFE4C4FF",  "bisque2":"#EED5B7FF",  "bisque3":"#CDB79EFF",  "bisque4":"#8B7D6BFF",  "black":"#000000FF",  "blanchedalmond":"#FFEBCDFF", "blue":"#0000FFFF", "blue1":"#0000FFFF",  "blue2":"#0000EEFF",  "blue3":"#0000CDFF",  "blue4":"#00008BFF",  "blueviolet":"#8A2BE2FF", "brown":"#A52A2AFF",  "brown1":"#FF4040FF", "brown2":"#EE3B3BFF", "brown3":"#CD3333FF", "brown4":"#8B2323FF", "burlywood":"#DEB887FF",  "burlywood1":"#FFD39BFF", "burlywood2":"#EEC591FF", "burlywood3":"#CDAA7DFF", "burlywood4":"#8B7355FF", "cadetblue":"#5F9EA0FF",  "cadetblue1":"#98F5FFFF", "cadetblue2":"#8EE5EEFF", "cadetblue3":"#7AC5CDFF", "cadetblue4":"#53868BFF", "chartreuse":"#7FFF00FF", "chartreuse1":"#7FFF00FF",  "chartreuse2":"#76EE00FF",  "chartreuse3":"#66CD00FF",  "chartreuse4":"#458B00FF",  "chocolate":"#D2691EFF",  "chocolate1":"#FF7F24FF", "chocolate2":"#EE7621FF", "chocolate3":"#CD661DFF", "chocolate4":"#8B4513FF", "coral":"#FF7F50FF",  "coral1":"#FF7256FF", "coral2":"#EE6A50FF", "coral3":"#CD5B45FF", "coral4":"#8B3E2FFF", "cornflowerblue":"#6495EDFF", "cornsilk":"#FFF8DCFF", "cornsilk1":"#FFF8DCFF",  "cornsilk2":"#EEE8CDFF",  "cornsilk3":"#CDC8B1FF",  "cornsilk4":"#8B8878FF",  "cyan":"#00FFFFFF", "cyan1":"#00FFFFFF",  "cyan2":"#00EEEEFF",  "cyan3":"#00CDCDFF",  "cyan4":"#008B8BFF",  "darkblue":"#00008BFF", "darkcyan":"#008B8BFF", "darkgoldenrod":"#B8860BFF",  "darkgoldenrod1":"#FFB90FFF", "darkgoldenrod2":"#EEAD0EFF", "darkgoldenrod3":"#CD950CFF", "darkgoldenrod4":"#8B6508FF", "darkgray":"#A9A9A9FF", "darkgreen":"#006400FF",  "darkgrey":"#A9A9A9FF", "darkkhaki":"#BDB76BFF",  "darkmagenta":"#8B008BFF",  "darkolivegreen":"#556B2FFF", "darkolivegreen1":"#CAFF70FF",  "darkolivegreen2":"#BCEE68FF",  "darkolivegreen3":"#A2CD5AFF",  "darkolivegreen4":"#6E8B3DFF",  "darkorange":"#FF8C00FF", "darkorange1":"#FF7F00FF",  "darkorange2":"#EE7600FF",  "darkorange3":"#CD6600FF",  "darkorange4":"#8B4500FF",  "darkorchid":"#9932CCFF", "darkorchid1":"#BF3EFFFF",  "darkorchid2":"#B23AEEFF",  "darkorchid3":"#9A32CDFF",  "darkorchid4":"#68228BFF",  "darkred":"#8B0000FF",  "darksalmon":"#E9967AFF", "darkseagreen":"#8FBC8FFF", "darkseagreen1":"#C1FFC1FF",  "darkseagreen2":"#B4EEB4FF",  "darkseagreen3":"#9BCD9BFF",  "darkseagreen4":"#698B69FF",  "darkslateblue":"#483D8BFF",  "darkslategray":"#2F4F4FFF",  "darkslategray1":"#97FFFFFF", "darkslategray2":"#8DEEEEFF", "darkslategray3":"#79CDCDFF", "darkslategray4":"#528B8BFF", "darkslategrey":"#2F4F4FFF",  "darkturquoise":"#00CED1FF",  "darkviolet":"#9400D3FF", "deeppink":"#FF1493FF", "deeppink1":"#FF1493FF",  "deeppink2":"#EE1289FF",  "deeppink3":"#CD1076FF",  "deeppink4":"#8B0A50FF",  "deepskyblue":"#00BFFFFF",  "deepskyblue1":"#00BFFFFF", "deepskyblue2":"#00B2EEFF", "deepskyblue3":"#009ACDFF", "deepskyblue4":"#00688BFF", "dimgray":"#696969FF",  "dimgrey":"#696969FF",  "dodgerblue":"#1E90FFFF", "dodgerblue1":"#1E90FFFF",  "dodgerblue2":"#1C86EEFF",  "dodgerblue3":"#1874CDFF",  "dodgerblue4":"#104E8BFF",  "firebrick":"#B22222FF",  "firebrick1":"#FF3030FF", "firebrick2":"#EE2C2CFF", "firebrick3":"#CD2626FF", "firebrick4":"#8B1A1AFF", "floralwhite":"#FFFAF0FF",  "forestgreen":"#228B22FF",  "gainsboro":"#DCDCDCFF",  "ghostwhite":"#F8F8FFFF", "gold":"#FFD700FF", "gold1":"#FFD700FF",  "gold2":"#EEC900FF",  "gold3":"#CDAD00FF",  "gold4":"#8B7500FF",  "goldenrod":"#DAA520FF",  "goldenrod1":"#FFC125FF", "goldenrod2":"#EEB422FF", "goldenrod3":"#CD9B1DFF", "goldenrod4":"#8B6914FF", "gray":"#BEBEBEFF", "gray0":"#000000FF",  "gray1":"#030303FF",  "gray2":"#050505FF",  "gray3":"#080808FF",  "gray4":"#0A0A0AFF",  "gray5":"#0D0D0DFF",  "gray6":"#0F0F0FFF",  "gray7":"#121212FF",  "gray8":"#141414FF",  "gray9":"#171717FF",  "gray10":"#1A1A1AFF", "gray11":"#1C1C1CFF", "gray12":"#1F1F1FFF", "gray13":"#212121FF", "gray14":"#242424FF", "gray15":"#262626FF", "gray16":"#292929FF", "gray17":"#2B2B2BFF", "gray18":"#2E2E2EFF", "gray19":"#303030FF", "gray20":"#333333FF", "gray21":"#363636FF", "gray22":"#383838FF", "gray23":"#3B3B3BFF", "gray24":"#3D3D3DFF", "gray25":"#404040FF", "gray26":"#424242FF", "gray27":"#454545FF", "gray28":"#474747FF", "gray29":"#4A4A4AFF", "gray30":"#4D4D4DFF", "gray31":"#4F4F4FFF", "gray32":"#525252FF", "gray33":"#545454FF", "gray34":"#575757FF", "gray35":"#595959FF", "gray36":"#5C5C5CFF", "gray37":"#5E5E5EFF", "gray38":"#616161FF", "gray39":"#636363FF", "gray40":"#666666FF", "gray41":"#696969FF", "gray42":"#6B6B6BFF", "gray43":"#6E6E6EFF", "gray44":"#707070FF", "gray45":"#737373FF", "gray46":"#757575FF", "gray47":"#787878FF", "gray48":"#7A7A7AFF", "gray49":"#7D7D7DFF", "gray50":"#7F7F7FFF", "gray51":"#828282FF", "gray52":"#858585FF", "gray53":"#878787FF", "gray54":"#8A8A8AFF", "gray55":"#8C8C8CFF", "gray56":"#8F8F8FFF", "gray57":"#919191FF", "gray58":"#949494FF", "gray59":"#969696FF", "gray60":"#999999FF", "gray61":"#9C9C9CFF", "gray62":"#9E9E9EFF", "gray63":"#A1A1A1FF", "gray64":"#A3A3A3FF", "gray65":"#A6A6A6FF", "gray66":"#A8A8A8FF", "gray67":"#ABABABFF", "gray68":"#ADADADFF", "gray69":"#B0B0B0FF", "gray70":"#B3B3B3FF", "gray71":"#B5B5B5FF", "gray72":"#B8B8B8FF", "gray73":"#BABABAFF", "gray74":"#BDBDBDFF", "gray75":"#BFBFBFFF", "gray76":"#C2C2C2FF", "gray77":"#C4C4C4FF", "gray78":"#C7C7C7FF", "gray79":"#C9C9C9FF", "gray80":"#CCCCCCFF", "gray81":"#CFCFCFFF", "gray82":"#D1D1D1FF", "gray83":"#D4D4D4FF", "gray84":"#D6D6D6FF", "gray85":"#D9D9D9FF", "gray86":"#DBDBDBFF", "gray87":"#DEDEDEFF", "gray88":"#E0E0E0FF", "gray89":"#E3E3E3FF", "gray90":"#E5E5E5FF", "gray91":"#E8E8E8FF", "gray92":"#EBEBEBFF", "gray93":"#EDEDEDFF", "gray94":"#F0F0F0FF", "gray95":"#F2F2F2FF", "gray96":"#F5F5F5FF", "gray97":"#F7F7F7FF", "gray98":"#FAFAFAFF", "gray99":"#FCFCFCFF", "gray100":"#FFFFFFFF",  "green":"#00FF00FF",  "green1":"#00FF00FF", "green2":"#00EE00FF", "green3":"#00CD00FF", "green4":"#008B00FF", "greenyellow":"#ADFF2FFF",  "grey":"#BEBEBEFF", "grey0":"#000000FF",  "grey1":"#030303FF",  "grey2":"#050505FF",  "grey3":"#080808FF",  "grey4":"#0A0A0AFF",  "grey5":"#0D0D0DFF",  "grey6":"#0F0F0FFF",  "grey7":"#121212FF",  "grey8":"#141414FF",  "grey9":"#171717FF",  "grey10":"#1A1A1AFF", "grey11":"#1C1C1CFF", "grey12":"#1F1F1FFF", "grey13":"#212121FF", "grey14":"#242424FF", "grey15":"#262626FF", "grey16":"#292929FF", "grey17":"#2B2B2BFF", "grey18":"#2E2E2EFF", "grey19":"#303030FF", "grey20":"#333333FF", "grey21":"#363636FF", "grey22":"#383838FF", "grey23":"#3B3B3BFF", "grey24":"#3D3D3DFF", "grey25":"#404040FF", "grey26":"#424242FF", "grey27":"#454545FF", "grey28":"#474747FF", "grey29":"#4A4A4AFF", "grey30":"#4D4D4DFF", "grey31":"#4F4F4FFF", "grey32":"#525252FF", "grey33":"#545454FF", "grey34":"#575757FF", "grey35":"#595959FF", "grey36":"#5C5C5CFF", "grey37":"#5E5E5EFF", "grey38":"#616161FF", "grey39":"#636363FF", "grey40":"#666666FF", "grey41":"#696969FF", "grey42":"#6B6B6BFF", "grey43":"#6E6E6EFF", "grey44":"#707070FF", "grey45":"#737373FF", "grey46":"#757575FF", "grey47":"#787878FF", "grey48":"#7A7A7AFF", "grey49":"#7D7D7DFF", "grey50":"#7F7F7FFF", "grey51":"#828282FF", "grey52":"#858585FF", "grey53":"#878787FF", "grey54":"#8A8A8AFF", "grey55":"#8C8C8CFF", "grey56":"#8F8F8FFF", "grey57":"#919191FF", "grey58":"#949494FF", "grey59":"#969696FF", "grey60":"#999999FF", "grey61":"#9C9C9CFF", "grey62":"#9E9E9EFF", "grey63":"#A1A1A1FF", "grey64":"#A3A3A3FF", "grey65":"#A6A6A6FF", "grey66":"#A8A8A8FF", "grey67":"#ABABABFF", "grey68":"#ADADADFF", "grey69":"#B0B0B0FF", "grey70":"#B3B3B3FF", "grey71":"#B5B5B5FF", "grey72":"#B8B8B8FF", "grey73":"#BABABAFF", "grey74":"#BDBDBDFF", "grey75":"#BFBFBFFF", "grey76":"#C2C2C2FF", "grey77":"#C4C4C4FF", "grey78":"#C7C7C7FF", "grey79":"#C9C9C9FF", "grey80":"#CCCCCCFF", "grey81":"#CFCFCFFF", "grey82":"#D1D1D1FF", "grey83":"#D4D4D4FF", "grey84":"#D6D6D6FF", "grey85":"#D9D9D9FF", "grey86":"#DBDBDBFF", "grey87":"#DEDEDEFF", "grey88":"#E0E0E0FF", "grey89":"#E3E3E3FF", "grey90":"#E5E5E5FF", "grey91":"#E8E8E8FF", "grey92":"#EBEBEBFF", "grey93":"#EDEDEDFF", "grey94":"#F0F0F0FF", "grey95":"#F2F2F2FF", "grey96":"#F5F5F5FF", "grey97":"#F7F7F7FF", "grey98":"#FAFAFAFF", "grey99":"#FCFCFCFF", "grey100":"#FFFFFFFF",  "honeydew":"#F0FFF0FF", "honeydew1":"#F0FFF0FF",  "honeydew2":"#E0EEE0FF",  "honeydew3":"#C1CDC1FF",  "honeydew4":"#838B83FF",  "hotpink":"#FF69B4FF",  "hotpink1":"#FF6EB4FF", "hotpink2":"#EE6AA7FF", "hotpink3":"#CD6090FF", "hotpink4":"#8B3A62FF", "indianred":"#CD5C5CFF",  "indianred1":"#FF6A6AFF", "indianred2":"#EE6363FF", "indianred3":"#CD5555FF", "indianred4":"#8B3A3AFF", "ivory":"#FFFFF0FF",  "ivory1":"#FFFFF0FF", "ivory2":"#EEEEE0FF", "ivory3":"#CDCDC1FF", "ivory4":"#8B8B83FF", "khaki":"#F0E68CFF",  "khaki1":"#FFF68FFF", "khaki2":"#EEE685FF", "khaki3":"#CDC673FF", "khaki4":"#8B864EFF", "lavender":"#E6E6FAFF", "lavenderblush":"#FFF0F5FF",  "lavenderblush1":"#FFF0F5FF", "lavenderblush2":"#EEE0E5FF", "lavenderblush3":"#CDC1C5FF", "lavenderblush4":"#8B8386FF", "lawngreen":"#7CFC00FF",  "lemonchiffon":"#FFFACDFF", "lemonchiffon1":"#FFFACDFF",  "lemonchiffon2":"#EEE9BFFF",  "lemonchiffon3":"#CDC9A5FF",  "lemonchiffon4":"#8B8970FF",  "lightblue":"#ADD8E6FF",  "lightblue1":"#BFEFFFFF", "lightblue2":"#B2DFEEFF", "lightblue3":"#9AC0CDFF", "lightblue4":"#68838BFF", "lightcoral":"#F08080FF", "lightcyan":"#E0FFFFFF",  "lightcyan1":"#E0FFFFFF", "lightcyan2":"#D1EEEEFF", "lightcyan3":"#B4CDCDFF", "lightcyan4":"#7A8B8BFF", "lightgoldenrod":"#EEDD82FF", "lightgoldenrod1":"#FFEC8BFF",  "lightgoldenrod2":"#EEDC82FF",  "lightgoldenrod3":"#CDBE70FF",  "lightgoldenrod4":"#8B814CFF",  "lightgoldenrodyellow":"#FAFAD2FF", "lightgray":"#D3D3D3FF",  "lightgreen":"#90EE90FF", "lightgrey":"#D3D3D3FF",  "lightpink":"#FFB6C1FF",  "lightpink1":"#FFAEB9FF", "lightpink2":"#EEA2ADFF", "lightpink3":"#CD8C95FF", "lightpink4":"#8B5F65FF", "lightsalmon":"#FFA07AFF",  "lightsalmon1":"#FFA07AFF", "lightsalmon2":"#EE9572FF", "lightsalmon3":"#CD8162FF", "lightsalmon4":"#8B5742FF", "lightseagreen":"#20B2AAFF",  "lightskyblue":"#87CEFAFF", "lightskyblue1":"#B0E2FFFF",  "lightskyblue2":"#A4D3EEFF",  "lightskyblue3":"#8DB6CDFF",  "lightskyblue4":"#607B8BFF",  "lightslateblue":"#8470FFFF", "lightslategray":"#778899FF", "lightslategrey":"#778899FF", "lightsteelblue":"#B0C4DEFF", "lightsteelblue1":"#CAE1FFFF",  "lightsteelblue2":"#BCD2EEFF",  "lightsteelblue3":"#A2B5CDFF",  "lightsteelblue4":"#6E7B8BFF",  "lightyellow":"#FFFFE0FF",  "lightyellow1":"#FFFFE0FF", "lightyellow2":"#EEEED1FF", "lightyellow3":"#CDCDB4FF", "lightyellow4":"#8B8B7AFF", "limegreen":"#32CD32FF",  "linen":"#FAF0E6FF",  "magenta":"#FF00FFFF",  "magenta1":"#FF00FFFF", "magenta2":"#EE00EEFF", "magenta3":"#CD00CDFF", "magenta4":"#8B008BFF", "maroon":"#B03060FF", "maroon1":"#FF34B3FF",  "maroon2":"#EE30A7FF",  "maroon3":"#CD2990FF",  "maroon4":"#8B1C62FF",  "mediumaquamarine":"#66CDAAFF", "mediumblue":"#0000CDFF", "mediumorchid":"#BA55D3FF", "mediumorchid1":"#E066FFFF",  "mediumorchid2":"#D15FEEFF",  "mediumorchid3":"#B452CDFF",  "mediumorchid4":"#7A378BFF",  "mediumpurple":"#9370DBFF", "mediumpurple1":"#AB82FFFF",  "mediumpurple2":"#9F79EEFF",  "mediumpurple3":"#8968CDFF",  "mediumpurple4":"#5D478BFF",  "mediumseagreen":"#3CB371FF", "mediumslateblue":"#7B68EEFF",  "mediumspringgreen":"#00FA9AFF",  "mediumturquoise":"#48D1CCFF",  "mediumvioletred":"#C71585FF",  "midnightblue":"#191970FF", "mintcream":"#F5FFFAFF",  "mistyrose":"#FFE4E1FF",  "mistyrose1":"#FFE4E1FF", "mistyrose2":"#EED5D2FF", "mistyrose3":"#CDB7B5FF", "mistyrose4":"#8B7D7BFF", "moccasin":"#FFE4B5FF", "navajowhite":"#FFDEADFF",  "navajowhite1":"#FFDEADFF", "navajowhite2":"#EECFA1FF", "navajowhite3":"#CDB38BFF", "navajowhite4":"#8B795EFF", "navy":"#000080FF", "navyblue":"#000080FF", "oldlace":"#FDF5E6FF",  "olivedrab":"#6B8E23FF",  "olivedrab1":"#C0FF3EFF", "olivedrab2":"#B3EE3AFF", "olivedrab3":"#9ACD32FF", "olivedrab4":"#698B22FF", "orange":"#FFA500FF", "orange1":"#FFA500FF",  "orange2":"#EE9A00FF",  "orange3":"#CD8500FF",  "orange4":"#8B5A00FF",  "orangered":"#FF4500FF",  "orangered1":"#FF4500FF", "orangered2":"#EE4000FF", "orangered3":"#CD3700FF", "orangered4":"#8B2500FF", "orchid":"#DA70D6FF", "orchid1":"#FF83FAFF",  "orchid2":"#EE7AE9FF",  "orchid3":"#CD69C9FF",  "orchid4":"#8B4789FF",  "palegoldenrod":"#EEE8AAFF",  "palegreen":"#98FB98FF",  "palegreen1":"#9AFF9AFF", "palegreen2":"#90EE90FF", "palegreen3":"#7CCD7CFF", "palegreen4":"#548B54FF", "paleturquoise":"#AFEEEEFF",  "paleturquoise1":"#BBFFFFFF", "paleturquoise2":"#AEEEEEFF", "paleturquoise3":"#96CDCDFF", "paleturquoise4":"#668B8BFF", "palevioletred":"#DB7093FF",  "palevioletred1":"#FF82ABFF", "palevioletred2":"#EE799FFF", "palevioletred3":"#CD6889FF", "palevioletred4":"#8B475DFF", "papayawhip":"#FFEFD5FF", "peachpuff":"#FFDAB9FF",  "peachpuff1":"#FFDAB9FF", "peachpuff2":"#EECBADFF", "peachpuff3":"#CDAF95FF", "peachpuff4":"#8B7765FF", "peru":"#CD853FFF", "pink":"#FFC0CBFF", "pink1":"#FFB5C5FF",  "pink2":"#EEA9B8FF",  "pink3":"#CD919EFF",  "pink4":"#8B636CFF",  "plum":"#DDA0DDFF", "plum1":"#FFBBFFFF",  "plum2":"#EEAEEEFF",  "plum3":"#CD96CDFF",  "plum4":"#8B668BFF",  "powderblue":"#B0E0E6FF", "purple":"#A020F0FF", "purple1":"#9B30FFFF",  "purple2":"#912CEEFF",  "purple3":"#7D26CDFF",  "purple4":"#551A8BFF",  "red":"#FF0000FF",  "red1":"#FF0000FF", "red2":"#EE0000FF", "red3":"#CD0000FF", "red4":"#8B0000FF", "rosybrown":"#BC8F8FFF",  "rosybrown1":"#FFC1C1FF", "rosybrown2":"#EEB4B4FF", "rosybrown3":"#CD9B9BFF", "rosybrown4":"#8B6969FF", "royalblue":"#4169E1FF",  "royalblue1":"#4876FFFF", "royalblue2":"#436EEEFF", "royalblue3":"#3A5FCDFF", "royalblue4":"#27408BFF", "saddlebrown":"#8B4513FF",  "salmon":"#FA8072FF", "salmon1":"#FF8C69FF",  "salmon2":"#EE8262FF",  "salmon3":"#CD7054FF",  "salmon4":"#8B4C39FF",  "sandybrown":"#F4A460FF", "seagreen":"#2E8B57FF", "seagreen1":"#54FF9FFF",  "seagreen2":"#4EEE94FF",  "seagreen3":"#43CD80FF",  "seagreen4":"#2E8B57FF",  "seashell":"#FFF5EEFF", "seashell1":"#FFF5EEFF",  "seashell2":"#EEE5DEFF",  "seashell3":"#CDC5BFFF",  "seashell4":"#8B8682FF",  "sienna":"#A0522DFF", "sienna1":"#FF8247FF",  "sienna2":"#EE7942FF",  "sienna3":"#CD6839FF",  "sienna4":"#8B4726FF",  "skyblue":"#87CEEBFF",  "skyblue1":"#87CEFFFF", "skyblue2":"#7EC0EEFF", "skyblue3":"#6CA6CDFF", "skyblue4":"#4A708BFF", "slateblue":"#6A5ACDFF",  "slateblue1":"#836FFFFF", "slateblue2":"#7A67EEFF", "slateblue3":"#6959CDFF", "slateblue4":"#473C8BFF", "slategray":"#708090FF",  "slategray1":"#C6E2FFFF", "slategray2":"#B9D3EEFF", "slategray3":"#9FB6CDFF", "slategray4":"#6C7B8BFF", "slategrey":"#708090FF",  "snow":"#FFFAFAFF", "snow1":"#FFFAFAFF",  "snow2":"#EEE9E9FF",  "snow3":"#CDC9C9FF",  "snow4":"#8B8989FF",  "springgreen":"#00FF7FFF",  "springgreen1":"#00FF7FFF", "springgreen2":"#00EE76FF", "springgreen3":"#00CD66FF", "springgreen4":"#008B45FF", "steelblue":"#4682B4FF",  "steelblue1":"#63B8FFFF", "steelblue2":"#5CACEEFF", "steelblue3":"#4F94CDFF", "steelblue4":"#36648BFF", "tan":"#D2B48CFF",  "tan1":"#FFA54FFF", "tan2":"#EE9A49FF", "tan3":"#CD853FFF", "tan4":"#8B5A2BFF", "thistle":"#D8BFD8FF",  "thistle1":"#FFE1FFFF", "thistle2":"#EED2EEFF", "thistle3":"#CDB5CDFF", "thistle4":"#8B7B8BFF", "tomato":"#FF6347FF", "tomato1":"#FF6347FF",  "tomato2":"#EE5C42FF",  "tomato3":"#CD4F39FF",  "tomato4":"#8B3626FF",  "turquoise":"#40E0D0FF",  "turquoise1":"#00F5FFFF", "turquoise2":"#00E5EEFF", "turquoise3":"#00C5CDFF", "turquoise4":"#00868BFF", "violet":"#EE82EEFF", "violetred":"#D02090FF",  "violetred1":"#FF3E96FF", "violetred2":"#EE3A8CFF", "violetred3":"#CD3278FF", "violetred4":"#8B2252FF", "wheat":"#F5DEB3FF",  "wheat1":"#FFE7BAFF", "wheat2":"#EED8AEFF", "wheat3":"#CDBA96FF", "wheat4":"#8B7E66FF", "whitesmoke":"#F5F5F5FF", "yellow":"#FFFF00FF", "yellow1":"#FFFF00FF",  "yellow2":"#EEEE00FF",  "yellow3":"#CDCD00FF",  "yellow4":"#8B8B00FF",  "yellowgreen":"#9ACD32FF"}
    
    // Keeps value within min and max
    function keepWithin(value, min, max) {
      if( value < min ) value = min;
      if( value > max ) value = max;
      return value;
    }
    // roundTo function

    function roundTo(num,dec) {
      return Math.round(num *  Math.pow(10,dec)) / (Math.pow(10,dec));
    }

    // Much of the code that follows was taken from the TinyColor library and modified
    // https://bgrins.github.io/TinyColor/

    // regex matchers for str2rgb below
    var matchers = (function() {

      // <http://www.w3.org/TR/css3-values/#integers>
      var CSS_INTEGER = "[-\\+]?\\d+%?";

      // <http://www.w3.org/TR/css3-values/#number-value>
      var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

      // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
      var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

      // Actual matching.
      // Parentheses and commas are optional, but not required.
      // Whitespace can take the place of commas or opening paren
      var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
      var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

      return {
        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
        hsv: new RegExp("hs[vb]" + PERMISSIVE_MATCH3),
        hsva: new RegExp("hs[vb]a" + PERMISSIVE_MATCH4),
        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
      };
    })();
    
    // parses any of many strings to an RGB color
    function str2rgb(color) {
      var match;
      var hsl;
      var hsb;
        // if a name is given...
        if (color.toLowerCase() in namesToCols) {
          return hex2rgb(namesToCols[color.toLowerCase()]);
        }
        if ((match = matchers.rgb.exec(color))) {
          return { r: keepWithin(parseInt(match[1]),0,255),
                    g: keepWithin(parseInt(match[2]),0,255),
                    b: keepWithin(parseInt(match[3]),0,255),
                    a: false };
        }
        if ((match = matchers.rgba.exec(color))) {
          return { r: keepWithin(parseInt(match[1]),0,255),
                    g: keepWithin(parseInt(match[2]),0,255),
                    b: keepWithin(parseInt(match[3]),0,255),
                    a: keepWithin(parseFloat(match[4]),0,1)};
        }
        if ((match = matchers.hsl.exec(color))) {
          hsl = { h: keepWithin(parseFloat(match[1]),0,360),
                  s: keepWithin(parseFloat(match[2]),0,100),
                  l: keepWithin(parseFloat(match[3]),0,100),
                  a: false };
          return hsl2rgb(hsl);
        }
        if ((match = matchers.hsla.exec(color))) {
          hsl = { h: keepWithin(parseFloat(match[1]),0,360),
                  s: keepWithin(parseFloat(match[2]),0,100),
                  l: keepWithin(parseFloat(match[3]),0,100),
                  a: keepWithin(parseFloat(match[4]),0,1)};
          return hsl2rgb(hsl);
        }
        if ((match = matchers.hsv.exec(color))) {
          hsb = { h: keepWithin(parseFloat(match[1]),0,360),
                  s: keepWithin(parseFloat(match[2]),0,100),
                  b: keepWithin(parseFloat(match[3]),0,100),
                  a: false };
          return hsb2rgb(hsb);
        }
        if ((match = matchers.hsva.exec(color))) {
          hsb = { h: keepWithin(parseFloat(match[1]),0,360),
                  s: keepWithin(parseFloat(match[2]),0,100),
                  b: keepWithin(parseFloat(match[3]),0,100),
                  a: keepWithin(parseFloat(match[4]),0,1)};
          return hsb2rgb(hsb);
        }
        if ((match = matchers.hex8.exec(color))) {
          return {
            r: parseInt(match[1],16),
            g: parseInt(match[2],16),
            b: parseInt(match[3],16),
            a: parseInt(match[4],16)/255
          };
        }
        if ((match = matchers.hex6.exec(color))) {
          return {
            r: parseInt(match[1],16),
            g: parseInt(match[2],16),
            b: parseInt(match[3],16),
            a: false
          };
        }
        if ((match = matchers.hex3.exec(color))) {
          return {
            r: parseInt(match[1] + '' + match[1],16),
            g: parseInt(match[2] + '' + match[2],16),
            b: parseInt(match[3] + '' + match[3],16),
            a: false
          };
        }
        if ((match = matchers.hex4.exec(color))) {
          return {
            r: parseInt(match[1] + '' + match[1],16),
            g: parseInt(match[2] + '' + match[2],16),
            b: parseInt(match[3] + '' + match[3],16),
            a: parseInt(match[4] + '' + match[4],16)/255
          };
        }

        return false;
      }

    // returns 'false' if rgb is broken. Otherwise corrects numeric values if needed.
    function correctedRGB(col) {
      if (!col || isNaN(col.r) || isNaN(col.g) || isNaN(col.b)) return false;
      if (isNaN(col.a)) col.a = false;
      var r = Math.round(keepWithin(col.r,0,255));
      var g = Math.round(keepWithin(col.g,0,255));
      var b = Math.round(keepWithin(col.b,0,255));
      var a = col.a ? roundTo(keepWithin(col.a,0,1),3) : col.a;
      return {r:r, g:g, b:b, a:a};
    }
    // returns an HSB color with corrected values, or false if broken
    function correctedHSB(col) {
      if (!col || isNaN(col.h) || isNaN(col.s) || isNaN(col.b)) return false;
      if (isNaN(col.a)) col.a = false;
      var h = roundTo(keepWithin(col.h,0,360),1);
      var s = roundTo(keepWithin(col.s,0,100),1);
      var b = roundTo(keepWithin(col.b,0,100),1);
      var a = col.a ? keepWithin(col.a,0,1) : col.a;
      return {h:h, s:s, b:b, a:a};
    }
    // returns an HSL color with corrected values, or false if broken
    function correctedHSL(col) {
      if (!col || isNaN(col.h) || isNaN(col.s) || isNaN(col.l)) return false;
      if (isNaN(col.a)) col.a = false;
      var h = roundTo(keepWithin(col.h,0,360),1),
      s = roundTo(keepWithin(col.s,0,100),1),
      l = roundTo(keepWithin(col.l,0,100),1),
      a = col.a ? keepWithin(col.a,0,1) : col.a;
      return {h:h, s:s, l:l, a:a};
    }
    // returns a hexstring with corrected values, or false if broken
    function correctedHex(col, force) {
      if (force === undefined) force = 0;
      if ($.type(col) !== "string") return false;
      col = col.toUpperCase();
      // strip all non-hex characters including # sign
      col = col.replace(/[^0-9A-F]/g, '');
      if (col.length === 3 || col.length === 4) {
        // have hex3 or hex4, expand to hex6/hex8
        var col2="";
        for (var i = 1; i === col.length; i++) {
          col2=col2+col[i]+col[i];
        }
        col=col2;
      }
      if (col.length === 6 && force===8) col = col + "FF";
      if (col.length === 8 && force===6) col = col.substring(0,6);
      if (col.length === 8 && force !== 8 && col.slice(-2)=="FF") col = col.substring(0,6);
      if (col.length !== 8 && col.length !== 6) return false;
      return "#" + col;
    }

    // convert RGB to string of the selected format
    function rgb2str(rgb, format,alpha,fallback) {
      if (format === undefined) format = "hex";
      if (alpha === undefined) alpha = true;
      if (fallback === undefined) fallback = "hex";
      rgb = correctedRGB(rgb);
      if (alpha===false) rgb.a = false;
      switch (format) {
        case "rgb":
          if (rgb.a===false || rgb.a===1) {
            return "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
          }else{
           return "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + rgb.a + ")";
          }
        break;
        case "hex":
          if (alpha === false) rgb.a=false;
          return rgb2hex(rgb);

        case "hsl":
          var hsl = rgb2hsl(rgb);
          if (hsl.a===false || hsl.a===1) {
            return "hsl(" + hsl.h + ", " + hsl.s + ", " + hsl.l + ")";
          }else{
            return "hsla(" + hsl.h + ", " + hsl.s + ", " + hsl.l + ", " + hsl.a + ")";
          }
          break;
        // return as hsv even if they ask for hsb for some reason
        case "hsv": case "hsb":
          var hsb = rgb2hsb(rgb);
          if (hsb.a===false || hsb.a===1) {
            return "hsv(" + hsb.h + ", " + hsb.s + ", " + hsb.b + ")";
          }else{
            return "hsva(" + hsb.h + ", " + hsb.s + ", " + hsb.b + ", " + hsb.a + ")";
          }
          break;
        case "name":
          var nm = rgb2name(rgb);
          if (nm[0]==="#") {
            // we have a hex string - it wasn't in the names list
            if (fallback !== "rgb" && fallback !== "hsl" && fallback !== "hsv") return nm; // return hex if hex name or other is fallback
              return rgb2str(rgb,fallback,true);
            }
          return nm;

          default: return '';
        }
      }
    // functions below are all self-explained converters.
    // for non-alpha situations, HSL, HSV/B, and RGB all return a=false
    // hex returns hex6 or hex8 based on alpha

    function rgb2hex(rgb, force) {
      if (force === undefined) force = 0;
      rgb = correctedRGB(rgb);
      if (!rgb) return "";
      var a;
      if (rgb.a===1 || rgb.a===false || force===6) a=""; else a = Math.round(rgb.a*255).toString(16).toUpperCase();
      if (force===8 && a === '') a = "FF";
      var hex = [
      rgb.r.toString(16).toUpperCase(),
      rgb.g.toString(16).toUpperCase(),
      rgb.b.toString(16).toUpperCase(),
      a
      ];
      $.each(hex, function(nr, val) {
        if (val.length === 1) hex[nr] = '0' + val;
      });
      return '#' + hex.join('');
    }
    function rgb2hsb(rgb) {
      rgb = correctedRGB(rgb);
      var r = keepWithin(rgb.r/255,0,1), g = keepWithin(rgb.g/255,0,1), b = keepWithin(rgb.b/255, 0,1),
      a = (rgb.a===false) ? false : keepWithin(rgb.a,0,1);
      var h, s, rr, gg, bb,
       v = Math.max(r,g,b),
       diff = v - Math.min(r,g,b),
       diffc = function(c) { return (v-c) / 6 / diff + 1/2;};

      if (diff === 0) {
        h = s = 0;
      } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
          h = bb - gg;
        }else if (g === v) {
          h = (1 / 3) + rr - bb;
        }else if (b === v) {
          h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
          h += 1;
        }else if (h > 1) {
          h -= 1;
        }
      }
      return {
        h: roundTo(h*360,1),
        s: roundTo(s*100,1),
        b: roundTo(v*100,1),
        a: (a ? roundTo(a,3) : a)
      };
    }

    function rgb2hsl(rgb) {
      rgb = correctedRGB(rgb);

      var r,g,b,a;
      r = keepWithin(rgb.r,0,255)/255;
      g = keepWithin(rgb.g,0,255)/255;
      b = keepWithin(rgb.b,0,255)/255;
      if (!("a" in rgb)) rgb.a = false;
      a = (rgb.a===false) ? false : keepWithin(rgb.a,0,1);


      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;

      if(max == min) {
          h = s = 0; // achromatic
        } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
      }

      return { h: roundTo(h*360,1), s: roundTo(s*100,1), l: roundTo(l*100,1), a: (a ?  roundTo(a,3) : a)};
    }
    function rgb2name(rgb) {
      return hex2name(rgb2hex(rgb,8));
    }

    function hsb2rgb(hsb) {
      hsb = correctedHSB(hsb);
      var rgb = {};
      var h = Math.round(hsb.h);
      var s = Math.round(hsb.s * 255 / 100);
      var v = Math.round(hsb.b * 255 / 100);
      var a = (hsb.a === false) ? false : keepWithin(hsb.a,0,1);
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
        b: Math.round(rgb.b),
        a: (a ? roundTo(a,3) : a)
      };
    }

    function hex2rgb(hex) {
      hex = correctedHex(hex);
      return str2rgb(hex);
    }
    function hex2name(hex) {
      hex = correctedHex(hex);
      var hex8 = correctedHex(hex,8);
      if (!hex || !hex8) return '';
    // if alpha = 0 return 'transparent' no matter what the other values are
    if (hex8.slice(-2) === "00") return 'transparent';
    // otherwise look it up using hex8, or return the hex code itself if need be.
    if (hex8 in colsToNames) return colsToNames[hex8]; else return hex;
    }

    function hsl2rgb(hsl) {
      hsl = correctedHSL(hsl);
      var r,g,b,
      h = keepWithin(hsl.h,0,360)/360,
      s = keepWithin(hsl.s,0,100)/100,
      l = keepWithin(hsl.l,0,100)/100,
      a = (hsl.a===false) ? false : keepWithin(hsl.a,0,1);
      function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }

      if(s === 0) {
          r = g = b = l; // achromatic
        } else {
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
        }
        return {r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255), a: (a ? roundTo(a,3) : a)};
      }

    // Determine if the selected colour is dark or not
    function isColDark(rgb) {
      rgb = correctedRGB(rgb);
      if (! rgb) return false;
      if (rgb.a !== false && rgb.a < 0.5) return false;
      return getLuminance(rgb) > 0.22 ? false : true;
    }

    // Calculate the luminance of the chosen colour to determine if too dark for text
    function getLuminance(rgb) {
      rgb = correctedRGB(rgb);
      var rgb2 = {r:rgb.r, g:rgb.g, b:rgb.b};
      rgb2 = $.map(rgb2, function(x) {
        x = x / 255;
        x = x <= 0.03928 ? x / 12.92 : Math.pow(((x + 0.055) / 1.055), 2.4);
        return x;
      });
      var luminance = rgb2[0]*0.2326 + rgb2[1]*0.6952 + rgb2[2]*0.0722;
      return luminance;
    }


    function getLastColor(input) {
      if (input.data('colourpicker-lastChange')) {
        return input.data('colourpicker-lastChange');
      } else if (input.closest('.colourpicker').is('.palette-limited')) {
        var firstCol = input.data('hex8-allowed')[0];
        firstCol = str2rgb(firstCol);
        if (! input.data('allow-alpha')) firstCol.a=false;
        return firstCol;
      } else {
        var a = input.data('allow-alpha') ? 1 : false;
        return {r: 255, g:255, b: 255, a: a};
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
    // Click on a colour from a limited-selection palette
    .on('mousedown.colourpicker touchstart.colourpicker', '.cp-list-col, .cp-list-col-outer', function(event) {
      var target = $(this);
      if (target.hasClass('cp-list-col-outer')) {
        target = target.find('.cp-list-col');
      }
      event.preventDefault();
      var input = target.closest('.colourpicker').find('.colourpicker-input');
      updateFromControl(input, target);
    })
    // Start moving in a palette
    .on('mousedown.colourpicker touchstart.colourpicker', '.colourpicker-grid, .colourpicker-slider, .colourpicker-alpha-slider', function(event) {
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
      var input = $(this);

      if( !input.data('colourpicker-initialized') ) return;

      var rgb = allowedColor(input.data('colour'));

      // Is it broken?
      if( !rgb) rgb=getLastColor(input);
      var fmt = input.data('return-format');
      var alpha = input.data('allow-alpha');
      // Adjust case
      input.val(rgb2str(rgb,fmt,alpha,"hex"));
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
      var checkbox = $(this).find(".colourpicker-istransparent");
      hide();
      input.data('transparent', checkbox.is(":checked"));
      updateFromInput(input);
    });

}));
