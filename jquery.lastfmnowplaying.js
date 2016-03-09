/**
 * Last.fm Now Playing
 * v0.1.1
 * Author: Mike Mitchell <@innernets> | DevTeam Inc <http://devteaminc.co/>
 * Licensed under the MIT license
 */

(function ( $, window, document, undefined ) {

	'use strict';

	var pluginName = 'lastfmNowPlaying';
	var defaults = {};

	function Plugin( element, options ) {

		this.element = element;
		this.options = $.extend( {}, defaults, options) ;
		this._defaults = defaults;
		this._name = pluginName;
		this.filteredResults = [];
		this.displayTrack;

	}

	/**
	 * Init Plugin
	 */

	Plugin.prototype.init = function () {

		this.getData();
		this.sortData();

	};

	/**
	 * Get Data
	 */

	Plugin.prototype.getData = function () {

		var self = this;

		$( this.options.members ).each( function () {

			var username = this;

			$.ajax({
				url: 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + username + '&limit=1&nowplaying=true&api_key=' + self.options.apiKey + '&format=json',
				dataType: 'json'
			}).done( function( data ){

				var usersRecentTrack = data.recenttracks.track;
				self.filterData( usersRecentTrack );

			});

		});

	};

	/**
	* Filter Data
	*/

	Plugin.prototype.filterData = function ( data ) {

		var self = this;

		$( data ).each( function () {

			// Check if track is now playing
			var nowPlaying = $(this).attr('@attr');

			// Add date stamp to track if now playing
			if ( nowPlaying ) {
				self.addDateStamp( this );
			}

			self.filteredResults.push( this );

		});

	};

	/**
	 * Sort Data
	 */

	Plugin.prototype.sortData = function () {

		var self = this;

		// Perform sorting after we have all our data

		$(document).ajaxStop( function() {

			// Custom algorithm for sort() method
			function sortbyNewest ( a, b ) {
				return new Date( parseInt( a.date.uts, 10 ) ).getTime() - new Date( parseInt( b.date.uts, 10 ) ).getTime();
			}

			// Sort tracks from oldest to newest
			self.filteredResults = self.filteredResults.sort( sortbyNewest );

			var returnTrack = self.filteredResults[ self.filteredResults.length - 1 ]
			if ( ! self.displaying(returnTrack) ) {

				// Update current displayed track and render template
				self.displayTrack = returnTrack;
				self.renderTemplate( self.prepareTemplateData() );

			}

		});

	};

	/**
	 * Add Date Stamp
	 */

	Plugin.prototype.addDateStamp = function ( item ) {

		item.date = {};
		item.date.uts = Date.now().toString();

	};

	/**
	 * Prepare Template Data
	 */

	Plugin.prototype.prepareTemplateData = function () {

		var self = this;
		var results = self.displayTrack;

		// Prepare Last.fm track data
		var track = {
			artist: results.artist['#text'],
			album: results.album['#text'],
			title: results.name,
			image: {
				small: results.image[0]['#text'],
				medium: results.image[1]['#text'],
				large: results.image[2]['#text'],
				extralarge: results.image[3]['#text']
			},
			url: results.url
		};

		return track;

	};

	/**
	 * Render Template
	 */

	Plugin.prototype.renderTemplate = function ( track ) {

		// This is a bit dirty, but fine for purpose. If you know a nicer way, send a PR

		var self = this;
		var needle;
		var property;

		// Render template to HTML
		var template = $(self.element).html();

		// Iterate for properties in track
		for ( property in track ) {

			// Continue iteration if can has property
			if ( !track.hasOwnProperty( property ) ) {
				continue;
			}

			// If property is image
			if ( property === 'image' ) {

				for ( property in track.image ) {

					if ( !track.image.hasOwnProperty( property ) ) {
						continue;
					}

					needle = '{ track.image.' + property + ' }';
					template = template.replace( needle, track.image[ property ] );

				}

			} else {

				needle = '{ track.' + property + ' }';
				template = template.replace( needle, track[ property ] );

			}

		}

		// Wrap template up in div and remove previous display
		template = "<div class=\"lastFmWidgetDisplay\">" + template + "</div>";
		$( ".lastFmWidgetDisplay" ).remove();

		// Add template to DOM
		$( self.element ).after( template );

		// Clean template
		self.cleanTemplate();

	};

	/**
	 * Clean Template
	 */

	Plugin.prototype.cleanTemplate = function () {

		var self = this;
		var images = $( self.element ).next().find('img');

		images.each( function () {

			var imageURL = $(this).attr('src');

			if ( !imageURL.length ) {
				$(this).remove();
			}

		});

	};

	/**
	 * Determines if queried track is the current displaying one.
	 * Track is considered as the same when title, artist and album match.
	 */

	Plugin.prototype.displaying = function( track ) {

		var self = this;

		var display = true;
		if (track && self.displayTrack) {
			display &= self.displayTrack.name == track.name;
			display &= self.displayTrack.artist['#text'] == track.artist['#text'];
			display &= self.displayTrack.album['#text'] == track.album['#text'];
		} else {
			display = false;
		}

		return display;
	}

	$.fn[ pluginName ] = function ( options ) {

		return this.each( function () {

			var plugin = $.data(this, 'plugin_' + pluginName);
			if ( !plugin ) {
				plugin = $.data(this, 'plugin_' + pluginName, new Plugin( this, options ) );
			}
			plugin.init();

		});

	};

})( jQuery, window, document );
