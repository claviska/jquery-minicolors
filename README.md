# jQuery Colour Picker: A tiny colour picker with useful extra features

> *Copyright 2017 [Dean Attali](http://deanattali.com), [David Griswold](http://davidgriswoldhh.mtbos.org/) and [Cory LaViska](http://www.abeautifulsite.net/). Licensed under the MIT license.*

v1.3

This is a jQuery plugin that creates a colour picker from an input field. It is a fork of [another plugin](https://github.com/claviska/jquery-minicolors) with many modifications made to make it more suited to integrate with [Shiny](http://shiny.rstudio.com/) and to add some useful features.

## Modifications by Dean Attali:  

- Added "limited" palette that allows the user to specify their only a set of allowed colour rather than any colour
- Added "allowTransparency" setting which allows users to check a checkbox to select the colour "transparent"
- Added "showColour" setting which determines if to show the selected colour as the text, as the background colour of the input field, or both
- Added "returnName" setting which makes the widget return a name instead of HEX value when possible
- Removed many unnecessary features 
- Removed dependency on images and made the colour picker completely CSS

## Additional modifications by David Griswold:

- added "allowAlpha" option that enables an alpha slider in square palette mode, returning hex8 colors suitable for R
- enabled palette colors with alpha channels
- made input more flexible: allowedCols and manually entered colors can be entered as names or as hex, rgb(), rgba(), hsl(), or hsla() strings

This plugin works for IE8+, Chrome, Firefox, mobile, and should work for all other major browsers.

Modified plugin is being used in [colourpicker](https://github.com/daattali/colourpicker/) - an R package providing colour pickers for Shiny apps.

The [`index.html`](./index.html) page contains very basic examples of how to use this plugin.

## Live demo

Colour input being used in a shiny application, with the "showColour" and "allowTransparency" features: [here](http://daattali.com/shiny/colourInput/)
