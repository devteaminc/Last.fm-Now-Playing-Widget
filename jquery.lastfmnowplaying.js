/**
 * Last.fm Now Playing
 * v0.1.1
 * Author: Mike Mitchell <@innernets> | DevTeam Inc <http://devteaminc.co/>
 * Licensed under the MIT license
 */

(function ( $, window, document, undefined ) {

	'use strict';

	var pluginName = 'lastfmNowPlaying';
    var pluginUpdateFunctionName = 'lastfmUpdateNowPlaying';

    // Div where the info should placed into
    var lastfmContainerName = '#lastfmContainer';

    // Set to true if Apple web service should be used to try to fetch an artwork if last.fm fails to provide one
    var requestFallbackArtworkEnabled = true;

	var defaults = {};

	function Plugin( element, options ) {

		this.element = element;
		this.options = $.extend( {}, defaults, options) ;
		this.filteredResults = [];
        this.resultingTrack = null;
        this.lastTrack = null;
		this.init();

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

			// Return only the newest track
            self.resultingTrack = self.filteredResults[ self.filteredResults.length - 1 ];

            function callRender() {
                // Render Template
                self.renderTemplate( self.prepareTemplateData() );
                self.filteredResults = [];
            }

            if (self.resultingTrack) {
                // Check if the same song is playing since the last check
                var stillSameSong = true;
                if (self.lastTrack) {
                    // A song is considered as the same when title, artist and album match
                    stillSameSong &= self.lastTrack.name == self.resultingTrack.name;
                    stillSameSong &= self.lastTrack.artist['#text'] == self.resultingTrack.artist['#text'];
                    stillSameSong &= self.lastTrack.album['#text'] == self.resultingTrack.album['#text'];
                } else {
                    stillSameSong = false;
                }
                self.lastTrack = self.resultingTrack;
                // if still the same song is played, no need to render
                if (stillSameSong) {
                    return;
                }
                if (!requestFallbackArtworkEnabled
                    || (self.resultingTrack.image[0]['#text'] &&
                        self.resultingTrack.image[1]['#text'] &&
                        self.resultingTrack.image[2]['#text'] &&
                        self.resultingTrack.image[3]['#text'])) {
                    // Render immediately if the artwork has been provided already or the fallback is disabled
                    callRender();
                } else {
                    // Request artwork from fallback source
                    // Try searching for title, artist and album
                    var searchString = self.resultingTrack.name + " " + self.resultingTrack.artist['#text'] + " " + self.resultingTrack.album['#text'];
                    self.requestFallbackArtwork(self, searchString, function(success) {
                        if (success) {
                            // Artwork has been found, render template
                            callRender();
                        } else {
                            // No luck again, try one last time with title and artist (skipping album this time)
                            var searchString = self.resultingTrack.name + " " + self.resultingTrack.artist['#text'];
                            // No matter how this request turns out, render template afterwards anyway
                            self.requestFallbackArtwork(self, searchString, callRender);
                        }
                    });
                }
            }
		});

	};

    /**
     * Request artwork for the current song separately from a fallback source.
     * @param self Reference to this object.
     * @param searchString (Unescaped) string which should be searched for.
     * @param callback Block which should be called after web service call returns.
     */
    Plugin.prototype.requestFallbackArtwork = function ( self, searchString, callback ) {
        $.ajax({
            url: 'https://itunes.apple.com/search?media=music&term=' + encodeURI(searchString),
            dataType: 'jsonp',
            useDefaultXhrHeader: false
        }).done( function( data ){
            var success = false;
            if (data.results.length > 0) {
                // Only try to fetch the artwork if we actually got a result
                var imageURL = data.results[0].artworkUrl100;
                // iTunes API returns a URL for 100x100 pixels images, so we have to adopt the URL accordingly
                self.resultingTrack.image[0]['#text'] = imageURL.replace('100x100', '34x34');
                self.resultingTrack.image[1]['#text'] = imageURL.replace('100x100', '64x64');
                self.resultingTrack.image[2]['#text'] = imageURL.replace('100x100', '126x126');
                self.resultingTrack.image[3]['#text'] = imageURL.replace('100x100', '300x300');
                success = true;
            }
            callback(success);
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
		var results = self.resultingTrack;

		// Prepare Last.fm track data
		return {
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
        var htmlContainer = $(lastfmContainerName);
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

		// Add template to DOM
        htmlContainer.html( template );

		// Clean template
		self.cleanTemplate();

	};

	/**
	 * Clean Template
	 */

	Plugin.prototype.cleanTemplate = function () {

		var images = $(lastfmContainerName).find('img');

		images.each( function () {

			var imageURL = $(this).attr('src');

			if ( !imageURL.length ) {
                // the Kudos for this default pic goes to XideXL from RootzWiki (http://rootzwiki.com/topic/20106-icon-default-album-artwork/)
				$(this).attr('src', 'images/default_album_art.jpg');
                $(this).attr('width', '300');
                $(this).attr('height', '300');
			}

		});

	};

	$.fn[ pluginName ] = function ( options ) {

		return this.each( function () {

			if ( !$.data(this, 'plugin_' + pluginName) ) {
				$.data(this, 'plugin_' + pluginName, new Plugin( this, options ) );
			}

		});

	};

    $.fn[ pluginUpdateFunctionName ] = function () {

        return this.each( function () {

            var plugin = $.data(this, 'plugin_' + pluginName);
            if (plugin) {
                plugin.getData();
                plugin.sortData();
            }

        });

    };

})( jQuery, window, document );
