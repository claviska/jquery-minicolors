# jQuery miniColors: A small color selector

_Copyright 2011 Cory LaViska for A Beautiful Site, LLC. (http://abeautifulsite.net/)_

_Dual licensed under the MIT / GPLv2 licenses_


## Demo

http://labs.abeautifulsite.net/jquery-miniColors/


## Usage

1. Link to jQuery: `<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>`
2. Link to miniColors: `<script type="text/javascript" src="jquery.miniColors.js"></script>`
3. Include miniColors stylesheet: `<link type="text/css" rel="stylesheet" href="jquery.miniColors.css" />`
4. Apply $([selector]).miniColors() to one or more INPUT elements


## Options

* __disabled__ _[true,false]_ - Disables the control on init
* __readonly__ _[true,false]_ - Makes the control read-only on init


## Specify options on creation:

	$([selector]).miniColors({
		optionName: value,
		optionName: value,
		...
	});


## Methods

Methods are called using this syntax:

	$([selector]).miniColors('methodName', [value]);

### Available Methods

* __letterCase__ _[uppercase|lowercase|null]_ - forces the hex value into upper or lowercase
* __disabled__ _[true|false]_ - sets the disabled status
* __readonly__ _[true|false]_ - sets the readonly status
* __value__ _(none)_ - gets the current value; guaranteed to return a valid hex color
* __value__ _[hex value]_ - sets the control's value
* __destroy__ _(none)_


## Events

* __change__*(hex, rgb)* - called when the color value changes
* __open__*(hex, rgb)* - called when the color picker is opened
* __close__*(hex, rgb)* - called when the color picker is hidden

*In all callbacks, 'this' refers to the original input element*


### Example

	$([selector]).miniColors({
		change: function(hex, rgb) { ... }
	});


## Attribution

* The color picker icon is based on an icon from the amazing Fugue icon set: http://p.yusukekamiyamane.com/
* The gradient image, the hue image, and the math functions are courtesy of the eyecon.co jQuery color picker: http://www.eyecon.ro/colorpicker/