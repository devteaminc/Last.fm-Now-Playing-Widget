# Last.fm Now Playing Widget

A jQuery plugin for showing the currently playing track on Last.fm

### Using Last.fm Now Playing Widget

#### Requirements

The plugin requires [jQuery](http://jquery.com/download/), we recommend using the latest version. You also need to have a [Last.fm API key](http://www.last.fm/api/account/create).

#### Installation

1. **Add Required Scripts**

  Make sure you include jQuery before adding the plugin at the bottom of your HTML document

  ```html
  <script src="/scripts/vendor/jquery.js"></script>
  <script src="/scripts/plugins/lastfmnowplaying.js"></script>
  ```

2. **Add a Template**

  Add a template into your HTML document as in the example below. This can appear anywhere on your web page and can contain any markup you'd like. The template makes use of a number of custom tags surrounded by {}'s. Each template must have it's own ID.

  ````
  <script type="text/template" id="lastFmWidget">
  	<div>{ track.artist }</div>
  	<div>{ track.title }</div>
  	<div>{ track.album }</div>
  	<img src="{ track.image.medium }">
  </script>
  ````

3. **Call Widget**

  The widget is called using the following in your main JavaScript file.

  ```javascript
  $('#lastFmWidget').lastfmNowPlaying({
  	apiKey: 'YOUR-API-KEY',
  	members: ['YOUR-LASTFM-USERNAME']
  });
  ```
  Be sure to update the apiKey and members options with your own information.
  
4. **Place view**

Add a container with ```lastfmContainer``` id where the the template should be rendered into:

	<div id="lastfmContainer"></div>

5. _Optional:_ **Auto-update**

If you want the song to get updated automatically without the need of a page reload, use ```lastfmUpdateNowPlaying()``` and call it periodically, e.g.:

    (function worker() {
        $('#lastFmWidget').lastfmUpdateNowPlaying();
        setTimeout(worker, 5000);
    })(); 
