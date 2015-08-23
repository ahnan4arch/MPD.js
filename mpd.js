/**
 * The global MPD function is the main interface and only global varialbe of the MPD.js library.
 * This function returns an object representing an MPD web client.
 * All other methods documented here are member functions of the object returned by a call to the MPD function.
 *
 * @example
 * //EXAMPLE USAGE//
 * //retrives a MPD client interface on port 8800
 * var mpd_client = MPD(8800);
 * //set handler for when the state changes
 * mpd_client.on('StateChanged', updateUiFunction);
 * @class
 * @param {Integer} [port_number] - the portnumber our client should try to cennect to our winsockifyed MPD instance with
 */
function MPD(_port){

    /**
     * this will be the final output interface, but it is used to refer to the client as a 'this' like object
     * @lends MPD
     */
    var self = {};

    /********************\
    |* public interface *|
    \********************/

    /**
     * adds an event handler
     * @instance
     * @function
     * @throws {Error} an Error if you try to listen to an invalid event type
     * @param {String} event_name - what sort of event to listen for. must be one of the following:  'Error', 'Event', 'UnhandledEvent', 'DatabaseChanging', 'DataLoaded', 'StateChanged', 'QueueChanged', 'PlaylistsChanged', 'PlaylistChanged','Connect', 'Disconnect'
     * @param {disconnectEventHandler|connectEventHandler|playlistsChangedEventHandler|queueChangedEventHandler|stateChangedEventHandler|dataLoadedEventHandler|databaseChangingEventHandler|unhandledEventHandler|eventHandler|errorEventHandler} handler - function called when the given event happens
     */
    self.on = on;

    /**
     * returns an object representation of the current state of MPD as the client understands it right now
     * this does NOT map to the client's functional API
     * @instance
     * @returns {state} object representing the current state of MPD
     */
    self.getState = function(){
        var ret = cloneObject(_private.state);
        //there are a few things we can't easily clone, but I made a clone method for those, so we can deal with this
        ret.current_queue = _private.state.current_queue.clone();

        ret.playlists = [];
        _private.state.playlists.forEach(function(playlist){
            ret.playlists.push(playlist.clone());
        });

        return ret;
    };

    /**
     * call to turn off logging to the console
     * @instance
     */
    self.disableLogging = function(){
        _private.do_logging = false;
    };

    /**
     * call to turn logging to the console on (debugging)
     * @instance
     */
    self.enableLogging = function(){
        _private.do_logging = true;
    };

    /**
     * return the port number this client was instansiated with and thet it is (attempting to) connect with
     * @instance
     * @returns {Integer} the port number the MPD client is (trying to be) connected to
     */
    self.getPort = function(){
        return _port;
    };

    /**
     * gets the protocol versing reported on connection
     * @instance
     * @returns {String} string desxriping the protocol version i.e. "1.18.0"
     */
    self.getProtocolVersion = function(){
        return _private.state.version;
    };

    /**
     * retruns if we are connected or not
     * @instance
     * @returns {Boolean} true if we are connected, false if we are not
     */
    self.isConnected = function(){
        return _private.state.connected == true;
    };

    /**
     * Returns a string enum describing the playback state
     * @instance
     * @returns {String} - 'play', 'pause', 'stop'
     */
    self.getPlaystate = function(){
        return _private.state.playstate;
    };

    /**
     * returns the current volume
     * @instance
     * @returns {Float} between 0 and 1
     */
    self.getVolume = function(){
        return _private.state.volume;
    };

    /**
     * returns if we are in repeat mode or not
     * @instance
     * @returns {Boolean} true if we are in repeat mode, false otherwise
     */
    self.isRepeat = function(){
        return _private.state.repeat == true;
    };

    /**
     * returns if we are in single mode or not
     * @instance
     * @returns {Boolean} true if we are in single mode, false otherwise
     */
    self.isSingle = function(){
        return _private.state.single == true;
    };

    /**
     * returns if we are in consume mode or not
     * @instance
     * @returns {Boolean} true if we are in consume mode, false otherwise
     */
    self.isConsume = function(){
        return _private.state.consume == true;
    };

    /**
     * returns if we are in random playback mode or not
     * @instance
     * @returns {Boolean} true if we are in random mode, false otherwise
     */
    self.isRandom = function(){
        return _private.state.random == true;
    };

    /**
     * honestly don't know what this is, has something to do with some sort of fading mode I never use, but MPD reports it so I'm making an accessor for it in case someone else wants to use it
     * @instance
     * @returns {Float}
     */
    self.getMixRampThreashold = function(){
        return _private.state.mix_ramp_threshold;
    };


    /**
     * gets the currently playing song
     * @instance
     * @function
     * @returns {Song}
     */
    self.getCurrentSong = getCurrentSong;

    /**
     * gets the time of the current song. will calculate it based on the reported time, and how long it's been since that happened
     * @instance
     * @function
     * @returns {Float}
     */
    self.getCurrentSongTime = getCurrentSongTime;

    /**
     * get's the queue id of the currently playing song
     * @instance
     * @returns {Integer}
     */
    self.getCurrentSongID = function(){
        return _private.state.current_song.id;
    };

    /**
     *gets the position on the queue of the song currently playing
     * @instance
     * @returns {Integer}
     */
    self.getCurrentSongQueueIndex = function(){
        return _private.state.current_song.queue_idx;
    };


    /**
     * gets the song next to be played
     * @instance
     * @function
     * @returns {Song}
     */
    self.getNextSong =getNextSong;

    /**
     * gets the queue id of the next song to play
     * @instance
     * @returns {Integer}
     */
    self.getNextSongID = function(){
        return _private.state.next_song.id;
    };

    /**
     * returns the position on the queue of the next song on the queue to play
     * @instance
     * @returns {Integer}
     */
    self.getNextSongQueueIndex = function(){
        return _private.state.next_song.queue_idx;
    };


    /**
     * get the whole queue
     * @instance
     * @returns {Queue}
     */
    self.getQueue = function(){
        return _private.state.current_queue;
    };

    /**
     * returns the version of the queue, this number changes every time the queue does
     * @instance
     * @returns {Integer}
     */
    self.getQueueVersion = function(){
        return _private.state.queue_version;
    };


    /**
     * fetches a playlist from MPD identified by it's name
     * @instance
     * @param {String} playlist name - the name of the playlist you want
     * @param {playlistCallback} onDone - function to call with the playlist when we get it
     */
    self.getPlaylist = function(name, onDone){
        var ret = null;
        for(var i = 0; i<_private.state.playlists.length; i++){
            if(_private.state.playlists[i].playlist==name){
                idleHandler.postIdle = getPlaylistHandler(onDone, i);
                issueCommand('listplaylistinfo "'+name+'"');
                return;
            }
        };
        onDone(null);
    };


    /**
     * returns an array of strings that is the list of the names of all available saved playlists
     * @instance
     * @returns {String[]}
     */
    self.getPlaylists = function(){
        var playlists = [];
        _private.state.playlists.forEach(function(playlist){
            playlists.push(playlist.playlist);
        });
        return playlists;
    };

    /**
     * turns on consume mode
     * @instance
     */
    self.enablePlayConsume = function(){
        issueCommand('consume 1');
    };

    /**
     * turns off consume mode
     * @instance
     */
    self.disablePlayConsume = function(){
        issueCommand('consume 0');
    };

    /**
     * turns on crossfade
     * @instance
     */
    self.enableCrossfade = function(){
        issueCommand('crossfade 1');
    };

    /**
     * turns off crossfade
     * @instance
     */
    self.disableCrossfade = function(){
        issueCommand('crossfade 0');
    };

    /**
     * turns on random play mode
     * @instance
     */
    self.enableRandomPlay = function(){
        issueCommand('random 1');
    };

    /**
     * turns off random play mode
     * @instance
     */
    self.disableRandomPlay = function(){
        issueCommand('random 0');
    };

    /**
     * turns on repeat play mode
     * @instance
     */
    self.enableRepeatPlay = function(){
        issueCommand('repeat 1');
    };

    /**
     * turns of repeat play mode
     * @instance
     */
    self.disableRepeatPlay = function(){
        issueCommand('repeat 0');
    };

    /**
     * turns on single play mode
     * @instance
     */
    self.enableSinglePlay = function(){
        issueCommand('single 1');
    };

    /**
     * turns of single play mode
     * @instance
     */
    self.disableSinglePlay = function(){
        issueCommand('single 0');
    };

    /**
     * Sets the threshold at which songs will be overlapped. Like crossfading but doesn't fade the track volume, just overlaps. The songs need to have MixRamp tags added by an external tool. 0dB is the normalized maximum volume so use negative values, I prefer -17dB. In the absence of mixramp tags crossfading will be used. See http:     // sourceforge.net/projects/mixramp
     * @instance
     * @param {Float} decibels
     */
    self.setMixRampDb = function(decibels){
        issueCommand('mixrampdb '+decibels);
    };

    /**
     * Additional time subtracted from the overlap calculated by mixrampdb. A value of "nan" disables MixRamp overlapping and falls back to crossfading.
     * @instance
     * @param {(float|string)} seconds - time in seconds or "nan" to disable
     */
    self.setMixRampDelay = function(seconds){
        issueCommand('mixrampdelay '+seconds);
    };

    /**
     * Sets volume, the range of volume is 0-1.
     * @instance
     * @param {Float} volume - 0-1
     */
    self.setVolume = function(volume){
        volume = Math.min(1,volume);
        volume = Math.max(0,volume);
        issueCommand('setvol '+Math.round(volume*100));
    };

    /**
     * Begins playing if not playing already. optional parameter starts playing a particular song
     * @instance
     * @param {Integer} [queue_position=<current song>] - the song to start playing
     */
    self.play = function(queue_position){
        if(typeof queue_position != 'undefined'){
            issueCommand('play '+queue_position);
        }
        else{
            issueCommand('play');
        }
    };

    /**
     * Begins playing the playlist at song identified by the passed song_id.
     * @instance
     * @param {Integer} song_id - the queue id of the song you want to start playing
     */
    self.playById = function(song_id){
        issueCommand('playid '+song_id);
    };

    /**
     * pauses/resumes playing
     * @instance
     * @param {Boolean} [do_pause=true] - true if you want to pause, false if you want to be unpaused
     */
    self.pause = function(do_pause){
        if(typeof do_pause == 'undefined' || do_pause){
            issueCommand('pause 1');
        }
        else{
            issueCommand('pause 0');
        }
    };

    /**
     * Plays next song in the queue.
     * @instance
     */
    self.next = function(){
        issueCommand('next');
    };

    /**
     * Plays previous song in the queue.
     * @instance
     */
    self.previous = function(){
        issueCommand('previous');
    };

    /**
     * Seeks to the position time (in seconds) within the current song. If prefixed by '+' or '-', then the time is relative to the current playing position.
     * @instance
     * @param {(float|string)} - what point in the current song to seek to or string with a signed float in it for relative seeking. i.e. "+0.1" to seek 0.1 seconds into the future, "-0.1" to seek 0.1 seconds into the past
     */
    self.seek = function(time){
        issueCommand('seekid '+_private.state.current_song.id+' '+time);
    };

    /**
     * Stops playing.
     * @instance
     */
    self.stop = function(){
        issueCommand('stop');
    };

    /**
     * Adds the file to the playlist (directories add recursively).
     * @instance
     * @param {String} pathname - of a single file or directory. relative to MPD's mussic root directory
     */
    self.addSongToQueueByFile = function(filename){
        issueCommand('add "'+filename+'"');
    };

    /**
     * Clears the current queue
     * @instance
     */
    self.clearQueue = function(){
        issueCommand('clear');
    };

    /**
     * Deletes a song from the queue
     * @instance
     * @param {Integer} position - index into the queue to the song you don't want to be on the queue any more
     */
    self.removeSongFromQueueByPosition = function(position){
        issueCommand('delete '+position);
    };

    /**
     * Deletes a range of songs from the playlist.
     * @instance
     * @param {Integer} start - the queue index of the first song on the playlist you want to remove
     * @param {Integer} end - the queue index of the last song on the playlist you want to remove
     */
    self.removeSongsFromQueueByRange = function(start, end){
        issueCommand('delete '+start+' '+end);
    };

    /**
     * Deletes the song identified with the passed queue id from the playlist
     * @instance
     * @param {Integer} id - the queue id of the song you want to remove from the queue
     */
    self.removeSongsFromQueueById = function(id){
        issueCommand('deleteid '+id);
    };

    /**
     * a song from one position on the queue to a different position
     * @instance
     * @param {Integer} position - the position of the song to move
     * @param {Integer} to - where you want the sang to go
     */
    self.moveSongOnQueueByPosition = function(position, to){
        issueCommand('move '+position+' '+to);
    };

    /**
     * moves a range of songs on the queue
     * @instance
     * @param {Integer} start - the queue index of the first song on the queue you want to move
     * @param {Integer} end - the queue index of the last song on the queue you want to move
     * @param {Integer} to - the queue index were the first song should end up
     */
    self.moveSongsOnQueueByPosition = function(start, end, to){
        issueCommand('move '+start+':'+end+' '+to);
    };

    /**
     * moves the song identified with the passed queue id to the passed queue index
     * @instance
     * @param {Integer} id - queue id of the song you want to move
     * @param {Integer} to - the queue indes you want it to be
     */
    self.moveSongOnQueueById = function(id, to){
        issueCommand('moveid '+id+' '+to);
    };

    /**
     * Shuffles the current playlist.
     * @instance
     */
    self.shuffleQueue = function(){
        issueCommand('shuffle');
    };

    /**
     * Swaps the positions of two songs identified by their queue indexes
     * @instance
     * @param {Integer} pos1 - queue index of the first song
     * @param {Integer} pos2 - queue index of the second song
     */
    self.swapSongsOnQueueByPosition = function(pos1, pos2){
        issueCommand('swap '+pos1+' '+pos2);
    };

    /**
     * Swaps the positions of two songs identified by their queue ids
     * @instance
     * @param {Integer} id1 - queue id of the first song
     * @param {Integer} id2 - queue id of the second song
     */
    self.swapSongsOnQueueById = function(id1, id2){
        issueCommand('swapid '+id1+' '+id2);
    };

    /**
     * Loads the given playlist to the end of the current queue.
     * @instance
     * @param {String} playlist_name - the name of the playlist you want to append to the queue
     */
    self.appendPlaylistToQueue = function(playlist_name){
        issueCommand('load "'+playlist_name+'"');
    };

    /**
     * Loads the given playlist into the current queue replacing it.
     * @instance
     * @param {String} playlist_name - the name of the playlist you want to append to the queue
     */
    self.loadPlaylistIntoQueue = function(playlist_name){
        issueCommand('clear');
        issueCommand('load "'+playlist_name+'"');
    };

    /**
     * Saves the current queue as a the given playlist, overwrites exsisting playlist of that name if it exsists, otherwise makes a new one
     * @instance
     * @param {String} playlist_name - the name of the playlist you want to use as your new queue
     */
    self.saveQueueToPlaylist = function(playlist_name){
        issueCommand('save "'+playlist_name+'"');
    };

    /**
     * adds the given song (filename) to the given playlist
     * @instance
     * @param {String} playlist_name - the playlist to add the song to
     * @param {String} filename - the filename of the song you want to add
     */
    self.addSongToPlaylistByFile = function(playlist_name, filename){
        issueCommand('playlistadd "'+playlist_name+'" "'+filename+'"');
    };

    /**
     * Clears the playlist leaving it still in exsistance, but empty
     * @instance
     * @param {String} playlist_name - the poor unfortunate playlist you want to hollow out
     */
    self.clearPlaylist = function(playlist_name){
        issueCommand('playlistclear "'+playlist_name+'"');
    };

    /**
     * Deletes the song at the given position from the given playlist
     * @instance
     * @param {String} playlist_name - the name of the playlist with a song on it that you think shouldn't be there anymore
     * @param {Integer} position - the position in the playlist of the song you want to remove
     */
    self.removeSongFromPlaylistByPosition = function(playlist_name, position){
        issueCommand('playlistdelete "'+playlist_name+'" '+position);
    };

    /**
     * moves the song from one position on the playlist to another
     * @instance
     * @param {String} playlist_name - the name of the playlist on which you want to move a song
     * @param {Integer} from - position on the playlist of the song you want to move
     * @param {Integer} to - the position to which you want to move the song
     */
    self.moveSongOnPlaylistByPosition = function(playlist_name, from, to){
        issueCommand('playlistmove "'+playlist_name+'" '+from+' '+to);
    };

    /**
     * Renames the playlist
     * @instance
     * @param {String} playlist_name - the name is it right now
     * @param {String} new_name - the name it should be
     */
    self.renamePlaylist = function(playlist_name, new_name){
        issueCommand('rename "'+playlist_name+'" "'+new_name+'"');
    };

    /**
     * this kills the playlist
     * @instance
     * @param {String} playlist_name - the name of the playlist you want to obliterate and never see any trace of again
     */
    self.deletePlaylist = function(playlist_name){
        issueCommand('rm "'+playlist_name+'"');
    };

    /**
     * Updates the music database: find new files, remove deleted files, update modified files.
     * @instance
     */
    self.updateDatabase = function(){
        issueCommand('update');
    };

    /**
     * @instance
     * @param {String} [path] - path to the directory you are interested in relative to MPD's music root directory (root is a blank string, never start with '/')
     * @param {directoryContentsCallback}
     */
    self.getDirectoryContents = function(path, onDone){
        idleHandler.postIdle = getDirectoryHandler(onDone);
        issueCommand('lsinfo "'+path+'"');
    };

    /**
     * return an array of strings which are all of the valid tags
     * note there might be more undocumented tags that you can use just fine not listed here (like musicbrainz)
     * @instance
     * @returns {String[]}
     */
    self.getTagTypes = function getTagTypes(){
        return   ['any','artist','album','albumartist','title','track','name','genre','date','composer','performer','comment','disc'];

    };

    /**
     * params is a {tag<string> => value<string>} object, valid tags are enumerated in getTagTypes.
     * onDone is a function that should be called on complete, will be passed an array of strings that are the values of the tag identified by tag_type that are on songs that match the search critaria
     *
     * @example
     * client.tagSearch(
     *     'album',
     *     {artist:'bearsuit'},
     *     function(albums){
     *        //albums == ["Cat Spectacular", "Team Pingpong", "OH:IO", "The Phantom Forest"]
     *        //which are all of the albums of the band Bearsuit
     *     }
     * );
     * @instance
     * @param {Object[]} params - Array of objects that maps a tag to a value that you want to find matches on that tag for {tag<string> => value<string>}. For a list of acceptable tag/keys @see {@link getTagTypes}. For a list of acceptable values for a given tag @see {@link getTagOptions}.
     * @param {searchResultsCallback} onDone - function called when the search results have come back, is passed the results as it's only parameter
     */
    self.tagSearch = function doTagSearch(tag_type, params, onDone){
       var query = 'list '+tag_type;
       for(key in params){
           var value = params[key];
           query += ' '+key+' "'+value+'"';
       }
       idleHandler.postIdle = getTagSearchHandler(onDone, tag_type);
       issueCommand(query);
   };

    /**
     * params is a {tag<string> => value<string>} object, valid tags are enumerated in getTagTypes, onDone is a function that should be called on complete, will be passed an array of song objects
     * @instance
     * @param {Object[]} params - Array of objects that maps a tag to a value that you want to find matches on that tag for {tag<string> => value<string>}. For a list of acceptable tag/keys @see {@link getTagTypes}. For a list of acceptable values for a given tag @see {@link getTagOptions}.
     * @param {searchResultsCallback} onDone - function called when the search results have come back, is passed the results as it's only parameter
     */
    self.search = function(params, onDone){
         var query = 'search';
         for(key in params){
             var value = params[key];
             query += ' '+key+' "'+value+'"';
         }
         idleHandler.postIdle = getSearchHandler(onDone);
         issueCommand(query);
     };

    /**
     * like search except just for finding how many results you'll get (for faster live updates while criteria are edited)
     * params is a {tag<string> => value<string>} object, valid tags are enumerated in getTagTypes, onDone is a function that should be called on complete, will be passed the numver of results the search would produce
     * @instance
     * @param {Object[]} params - Array of objects that maps a tag to a value that you want to find matches on that tag for {tag<string> => value<string>} For a list of acceptable tag/keys @see {@link getTagTypes}. For a list of acceptable values for a given tag @see {@link getTagOptions}.
     * @param {searchCountCallback} onDone - function called when the search results have come back, is passed the results as it's only parameter
     */
    self.searchCount = function(params, onDone){
        var query = 'count';
        for(key in params){
            var value = params[key];
            query += ' '+key+' "'+value+'"';
        }
        idleHandler.postIdle = getSearchHandler(function(results){
            onDone(results[0]);
        });
        issueCommand(query);
    };

   /****************\
   |* private data *|
   \****************/

   var _private = {
     /**
      * THE web socket that is connected to the MPD server
      * @private
      */
     socket:null,

     /**
      * object {string:[function]} -- listing of funcitons to call when certain events happen
      *
      * valid handlers:
      * Connect
      * Disconnect
      * Queue
      * State
      * SongChange
      * Mpdhost
      * Error
      * @private
      */
     handlers:{},

     /**
      * basically the same as above, but private and imutable and it's just a single function
      * called before the external handlers so they can screw with the event if they want
      * @private
      */
     internal_handlers:{
       onConnect:onConnect,
       onDisconnect:onDisconnect,
       onStateChanged:onStateChanged
     },

     /**
      * number -- int number of milisecond to wait until reconnecting after loosing connection
      * set to something falsyto disable automatic reconnection
      * @private
      */
     reconnect_time: 3000,

     /**
      * true if we want logging turned on
      * @private
      */
     do_logging: true,

     /**
      * Our understanding of what the server looks like
      * @typedef {Object} state
      * @property {String} version - server protocol version
      * @property {Boolean} connected - if we are currently connected to the server or not
      * @property {String} playstate - enum, PLAYING, STOPPED, PAUSED
      * actual MPD attribute: state (int 0,1,2)
      * @property {Integer} volume - 0 to 1 the current volume
      * @property {Boolean} repeat - true if the server is configured to repeat the current song
      * @property {Boolean} single - true if the server is configured to just play one song then quit
      * @property {Boolean} consume - true if the server is configured to not repeat songs in a playlist
      * @property {Boolean} random - true if the server is configured to play music in a random order
      * @property {Float} mix_ramp_threshold - not sure what this is, but it's reported
      * actual MPD attribute: mixrampdb
      * @property {Object} current_song - info about the currently playing song
      * @property {Integer} current_song.queue_idx - which song in the current playlist is active
      * actual MPD attribute: song
      * @property {Float} current_song.elapsed_time - time into the currently playing song in seconds
      * actual MPD attribute: elapsed
      * @property {Integer} current_song.id - the id of the current song
      * actual MPD attribute: songid
      * @property {Object} next_song - info about the song next to play on the queue
      * @property {Integer} next_song.queue_idx - which song in the current playlist is active
      * actual attribute: song
      * @property {Integer} next_song.id - the id of the current song
      * actual attribute: songid
      * @property {Queue} current_queue - the songs that are currently in rotation for playing, in the order they are to play (unless random is set to true)
      * @property {Integer} queue_version - a number associated with the queue that changes every time the queue changes
      * @property {String[]} playlists - names of all of the saved playlists
      */
     state:{
         version: null,
         connected:false,
         playstate: null,
         volume: null,
         repeat: null,
         single: null,
         consume: null,
         random: null,
         mix_ramp_threshold: null,
         current_song: {
             queue_idx: null,
             elapsed_time: null,
              id: null
         },

         next_song: {
             queue_idx: null,
              id: null
         },
         current_queue: null,
         queue_version: null,
         playlists:[]
     },

     /**
      * when was the status last updated
      * @private
      */
     last_status_update_time: new Date(),

     /**
      * current processing method
      * called when ever we get some sort of responce
      * this gets changed as our expected responces changed
      * accepts an array WHICH IT WILL CHANGE eventually,
      * when the lines have comprised a complete command
      * this method may change it's self, so after calling this method,
      * this reference might point to a different method
      * defaults to do nothing
      *
      * understanding this variable is essential for understanding how this package works
      * this is basically a changable behaviour method
      * @private
      */
     responceProcessor:function(lines){}
   };


    /*******************\
    |* private methods *|
    \*******************/

    /**
     * logging function
     * @private
     */
    function log(message){
      if(_private.do_logging){
        console.log("MPD Client: "+message);
      }
    }

    /**
     * wrapper for sending a message to the server, allows logging
     * @private
     */
    function sendString(str){
        log('sending: "'+str+'"');
        _private.socket.send_string(str);
    }


    /**
     * initalization funciton
     * called near the end of this file and when we need to reconnect
     * @private
     */
    function init(){
      var websocket_url = getAppropriateWsUrl();
      var websocket = new Websock();
      websocket.open(websocket_url);

      //these can throw
      websocket.on(
          'open',
          function(){
              callHandler('Connect', arguments);
          }
      );
      websocket.on('message', onRawData);
      websocket.on(
          'close',
          function(){
              callHandler('Disconnect', arguments);
          }
      );
      _private.socket = websocket;
    }


    /**
     * issue a command to the server
     * this assumes we are starting in and wish to return to an idle state
     * @private
     */
    function issueCommand(command){
        if(!issueCommand.command){
            issueCommand.command = command+'\n';

            setTimeout(function(){
                sendString('noidle\n'+issueCommand.command+'idle\n');
                delete issueCommand.command;
            },50);
        }
        else{
            //append additional commands
            issueCommand.command += command+'\n';
        }
    }


    /**
     * private method that gets the right websocket URL
     * @private
     */
    function getAppropriateWsUrl()
    {
      var protocol = '';
      var url = document.URL;

      /*
       * We open the websocket encrypted if this page came on an
       * https:// url itself, otherwise unencrypted
       */

      //figure out protocol to use
      if (url.substring(0, 5) == "https") {
          protocol = "wss://";
          url = url.substr(8);
      } else {
          protocol = "ws://";
          if (url.substring(0, 4) == "http")
              url = url.substr(7);
      }

      //change the url so it points to the root
      url = protocol+(url.split('/')[0]);

      if(_port){
        //use the port this client was initialized with
        url = url.replace(/:\d*$/,'')+':'+_port;
      }

      return url;
    }


    /**
     * converts an string to a Date
     * @private
     */
    function parseDate(source){
        var value = null;
        var matches = null;
        if(matches = source.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z/)){
            value = new Date();
            value.setFullYear(parseInt(matches[1],10));
            value.setMonth(parseInt(matches[2],10)-1);
            value.setDate(parseInt(matches[3],10));
            value.setHours(parseInt(matches[4],10));
            value.setMinutes(parseInt(matches[5],10));
            value.setSeconds(parseInt(matches[6],10));
        }
        return value;
    }


    /***************************\
    |* internal event handlers *|
    \***************************/


    /**
     * function called when the websocke connects
     * @private
     */
    function onConnect(){
      log("connected");
      _private.state.connected = true;
      _private.responceProcessor = handleConnectionMessage;
    }


    /**
     * called when we disconnected (unexpectedly)
     * @private
     */
    function onDisconnect(){
      log("disconnected");

      _private.state.connected = false;
      _private.socket = null;
      _private.state.version = null;

      if(_private.reconnect_time){
        setTimeout(init, _private.reconnect_time);
      }

      _private.responceProcessor = function(){};//do nothing
    }


    /**
     * called when we have some data,
     * might be a message,
     * might be a fragment of a message,
     * might be multiple messages
     * @private
     */
    function onRawData(){
        if(typeof onRawData.buffer === 'undefined'){
            onRawData.buffer = '';
            onRawData.lines = [];
        }
        onRawData.buffer += _private.socket.rQshiftStr();
        var lines = onRawData.buffer.split('\n');
        onRawData.buffer = lines.pop(); //last line is incomplete
        onRawData.lines = onRawData.lines.concat(lines);

        lines.forEach(function(str){log('recived: "'+str+'"');});

        //keep processing untill we can't process any more
        var old_lines;
        while(onRawData.lines.length && old_lines != onRawData.lines.length){
            old_lines = onRawData.lines.length;
            _private.responceProcessor(onRawData.lines);
        }
    }


    /**
     * the MPD server's state changed in some way
     * this handler mainly mangles the raw data to be in a format I like better
     * because of course I know better than the MPD maintainer what things should be called and the ranges things should be in
     * @private
     */
    function onStateChanged(event){
        log('state');

        _private.last_status_update_time = new Date();

        //normalize some of the event properties because I don't like them the way they are
        event.current_song = {
            queue_idx: event.song,
            elapsed_time: event.elapsed,
            id: event.songid
        };
        delete event.song;
        delete event.elapsed;
        delete event.songid;

        event.mix_ramp_threshold = event.mixrampdb;
        event.playstate = event.state;
        event.queue_version = event.playlist;
        delete event.mixrampdb;
        delete event.state;
        delete event.playlist;

        event.next_song = {
            queue_idx: event.nextsong,
            id: event.nextsongid
        };
        delete event.nextsong;
        delete event.nextsongid;

        event.volume /= 100;

        for(property in event){
            _private.state[property] = event[property];
        }
    }


    /**
     * call all event handlers for the specified event
     * @private
     */
    function callHandler(event_name, args){
        var handler_name = 'on'+event_name;

        if(_private.internal_handlers[handler_name]){
            _private.internal_handlers[handler_name](args);
        }

        if(!_private.handlers[handler_name]){
            handler_name = 'onUnhandledEvent';
        }

        if(_private.handlers[handler_name]){
            _private.handlers[handler_name].forEach(function(func){
                try{
                    //put in a timeout so our current execution finishesand we aren't in a half formed state when client code reacts to the event
                    setTimeout(function(){
                        func(args, self);
                    }, 50);
                }
                catch(err){
                    dealWithError(err);
                }
            });
        }

        if(event_name !== 'Event'){
            callHandler('Event', {type:event_name, data:event.data});
        }
    }


    /**
     * add an event handler
     * @private
     */
    function on(event_name, handler){

        var acceptable_handlers = ['Error', 'Event', 'UnhandledEvent', 'DatabaseChanging', 'DataLoaded', 'StateChanged', 'QueueChanged', 'PlaylistsChanged', 'PlaylistChanged','Connect', 'Disconnect'];

        if(acceptable_handlers.indexOf(event_name) === -1){
            throw new Error("'"+event_name+"' is not a supported event");
        }


        //bind the passed method to the client interface
        handler = handler.bind(self);

        var handler_name = 'on'+event_name;
        if(_private.handlers[handler_name]){
            _private.handlers[handler_name].push(handler);
        }
        else{
            _private.handlers[handler_name] = [handler];
        }
    }

    /*************************************\
    |* process responces from the server *|
    |*          generates events         *|
    \*************************************/


    /**
     * we got some sort of error message from the server
     * @private
     */
    function dealWithError(line){
        debugger;
        callHandler('Error', line);
        log('***ERROR*** '+line);
    }


    /**
     * return all of the lines upto one that matches the passed line
     * MUTATES lines
     * @private
     */
    function getLines(lines, last_line){
        var end_line = -1;
        for(var i = 0; i<lines.length; i++){
            var line = lines[i];
            if(line === last_line){
                end_line = i;
                break;
            }
            if(line.indexOf('ACK') === 0){
                dealWithError(line);
                lines.splice(i,1);
                i--;
            }
        }

        if(end_line === -1){
            return null;
        }
        return lines.splice(0, end_line+1);
    }


    /**
     * generic responce handler
     * deals with a responce that is a list of some sort of datastructure repeated over and over
     * @private
     */
    function processListResponce(lines, new_file_marker){
        var output = [];
        var current_thing = null;
        var file_marker = null
        //so, we get an undiferentiated stream of key/value pairs
        lines.forEach(function(line){
            if(!current_thing){
                current_thing = {};
            }
            var key = line.replace(/([^:]+): (.*)/,'$1');
            var value = line.replace(/([^:]+): (.*)/,'$2');
            var date = null;
            if(value.length>0){
                if(value.match(/^\d*(\.\d*)?$/)){
                    value = parseFloat(value);
                }
                else if(date = parseDate(value)){
                    value = date;
                }
            }
            key = key.toLowerCase();
            key = key.replace(/[^\w\d]+/g, '_');

            //we are starting a new object
            if(file_marker && key.match(file_marker)){
                output.push(current_thing);
                current_thing = {};
            }
            current_thing[key] = value;

            //we want to skip the first, starting key so this is down here
            if(file_marker === null){
                if(new_file_marker){
                    file_marker = new_file_marker;
                }
                else{
                    file_marker = new RegExp('^'+key+'$');
                }
            }

        });

        //get the last one
        if(current_thing){
            output.push(current_thing);
        }

        return output;
    }


    /**
     * generic handler for loading a list of records in a responce
     * @private
     */
    function getlistHandler(onDone, event_type, new_file_marker, transformFunction){
        return function(lines){
            var message_lines = getLines(lines, 'OK');
            if(message_lines === null){
                return; //we got an incomplete list, bail wait for the rest of it
            }
            message_lines.pop();//get rid of the 'OK' line
            if(message_lines.length > 0){
                var list = processListResponce(message_lines, new_file_marker);
                //optional transformation function
                if(transformFunction){
                    list = transformFunction(list);
                }
                //we have an event!
                if(event_type){
                    callHandler(event_type,list);
                }
                onDone(list);
            }
            else{
                if(event_type){
                    callHandler(event_type,[]);
                }
                onDone([]);
            }
        };
    }

    /**
     * given a change key, return the command that will result in getting the changed data
     * @private
     */
    function figureOutWhatToReload(change, actions){
        switch(change){
            case 'database': //the song database has been modified after update.
                //reload
                //everything
                actions.everything = true;
            break;

            case 'stored_playlist': //a stored playlist has been modified, renamed, created or deleted, no idea which one
                actions.playlist = true;
            break;

            case 'playlist': //the current playlist has been modified
                actions.queue = true;
            break;

            /*these are all status changed*/
            case 'player': //the player has been started, stopped or seeked
            case 'mixer': //the volume has been changed
            case 'output': //an audio output has been enabled or disabled
            case 'options': //options like repeat, random, crossfade, replay gain
                actions.status = true;
            break;

            /*these are things I'm not interested in (yet)*/
            case 'update': //a database update has started or finished. If the database was modified during the update, the database event is also emitted.
                //we don't want to do anything, but the front end might be interested in knowing about it
                callHandler('DatabaseChanging');
            case 'sticker': //the sticker database has been modified.
            case 'subscription': //a client has subscribed or unsubscribed to a channel
            case 'message': //a message was received on a channel this client is subscribed to; this event is only emitted when the queue is empty
            default:
                //default do nothing
        }
    }

    /**
     * wait for something to change
     * this is the state we spend most of out time in
     * @private
     */
    function idleHandler(lines){
        var message_lines = getLines(lines, 'OK');
        message_lines.pop();//get rid of the 'OK' line
        if(message_lines.length > 0){
            var actions = {};
            message_lines.forEach(function(line){
                var change = line.replace(/([^:]+): (.*)/,'$2');
                figureOutWhatToReload(change, actions);
            });

            if(actions.everything){
                //don't even bother doing anything fancy
                loadEverything();
            }
            else{
                //now we have to make this hellish patchwork of callbacks for loading all the stuff we need
                //in the right order
                //I could probly just rename these and move them somewhere and this would be a lot more readable...

                //this is the basic one, we should always end with this
                function goBackToWaiting(){
                    _private.responceProcessor = idleHandler;
                    sendString('idle\n');
                }

                //reload the statuses
                function reloadStatus(){
                    _private.responceProcessor = getStateHandler(goBackToWaiting);
                    sendString('status\n');
                }

                //reload the queue, the status, then go back to waiting
                function reloadQueue(){
                    _private.responceProcessor = getQueueHandler(goBackToWaiting,'QueueChanged');
                    sendString('playlistinfo\n');
                }

                if(actions.queue){
                    reloadQueue();
                }
                else if(actions.status){
                    reloadStatus();
                }
                else if(actions.playlist){
                    loadAllPlaylists(goBackToWaiting);
                }
                else{
                    goBackToWaiting();
                }
            }
        }
        else{
            if(idleHandler.postIdle){
                _private.responceProcessor = idleHandler.postIdle;
                delete idleHandler.postIdle;
            }
        }
    }


    /**
     * we are expecting a connection responce
     * @private
     */
    function handleConnectionMessage(lines){
        if(lines.length < 1){
            return;
        }
        var line = lines.shift(1);
        _private.state.version = line.replace(/^OK MPD /, '');

        loadEverything();
    }


    /**
     * method name says it all
     * @private
     */
    function loadEverything(){
        //this loads all of the data from the MPD server we need
        //it gets the queue first, then the state (because the state references the queue), then all of the playlist data
        _private.responceProcessor = getQueueHandler(function(){
            _private.responceProcessor = getStateHandler(function(){
                loadAllPlaylists(function(){

                    //ok everything is loaded...
                    //just wait for something to change and deal with it
                    _private.responceProcessor = idleHandler;
                    sendString('idle\n');

                    callHandler('DataLoaded',_private.state);
                });
            });
            sendString('status\n');
        }, 'QueueChanged');

        //request state info, start the initial data load cascade
        sendString('playlistinfo\n');
    }


    /**
     * reload all playlists
     * @private
     */
    function loadAllPlaylists(onDone){
        _private.responceProcessor = getPlaylistsHandler(function(){
            //we have loaded all playlists
            onDone();
            callHandler('PlaylistsChanged',_private.state.playlists);
        });
        sendString('listplaylists\n');
    }


    /**
     * we are expecting a state responce
     * this is what we do when we get it
     * @private
     */
    function getStateHandler(onDone){
        return function(lines){
            var message_lines = getLines(lines, 'OK');
            message_lines.pop();//get rid of the 'OK' line
            if(message_lines.length > 0){
                var state = {};
                message_lines.forEach(function(line){
                    var key = line.replace(/([^:]+): (.*)/,'$1');
                    var value = line.replace(/([^:]+): (.*)/,'$2');
                    if(value.match(/^\d*(\.\d*)?$/)){
                        value = parseFloat(value);
                    }
                    state[key] = value;
                });
                //we have a state event!
                callHandler('StateChanged',state);
                onDone();
            }
        };
    }


    /**
     * handler for the current queue
     * @private
     */
    function getQueueHandler(onDone, event_type){
        return getlistHandler(
            function(event){
                //update the internal state with the new queue
                _private.state.current_queue = event;
                onDone.apply(null, arguments);
            },
            event_type,
            null,
            function(list){
                return MPD.Queue(
                    self,
                    {
                        songs:list.map(function(song){
                            return MPD.QueueSong(self,song);
                        })
                    }
                );
            }
        );
    }


    /**
     * handler for the list of playlists
     * @private
     */
    function getPlaylistsHandler(onDone){
        return getlistHandler(function(event){
            _private.state.playlists = event;
            onDone.apply(null, arguments);
        });
    }


    /**
     * get a handler wrapper for the results of a search
     * @private
     */
    function getSearchHandler(onDone){
        return getlistHandler(
            function(){
                onDone.apply(null, arguments);
                _private.responceProcessor = idleHandler;
            },
            null,
            null,
            function(list){
                return list.map(function(song){
                    return MPD.Song(self,song);
                });
            }
        );
    }


    /**
     * get a handler wrapper for the results of a tag search
     * @private
     */
    function getTagSearchHandler(onDone, tag){
        return getlistHandler(
            function(){
                onDone.apply(null, arguments);
                _private.responceProcessor = idleHandler;
            },
            null,
            null,
            function(list){
                return list.map(function(result){
                    return result[tag];
                });
            }
        );
    }


    /**
     * handler for the list of directories (is exactly the same as the search handler :/ )
     * @private
     */
    function getDirectoryHandler(onDone){
        return getlistHandler(
            function(){
                onDone.apply(null, arguments);
                _private.responceProcessor = idleHandler;
            },
            null,
            /^file$|^directory$/,
            function(list){
                return list.map(function(file){
                    if(typeof file.file !== 'undefined'){
                        return MPD.Song(self,file);
                    }
                    else{
                        return MPD.Directory(self,file);
                    }
                });
            }
        );
    }


    /**
     * handler for loading a single playlist
     * @private
     */
    function getPlaylistHandler(onDone, queue_idx){
        return getlistHandler(
            function(){
                onDone.apply(null, arguments);
                _private.responceProcessor = idleHandler;
            },
            null,
            null,
            function(list){
                var source = cloneObject(_private.state.playlists[queue_idx]);
                source.songs = list.map(function(song){
                    return MPD.Song(self,song);
                });
                return MPD.Playlist(self,source);
            }
        );
    }


    /******************\
    |* public methods *|
    \******************/


    /**
     * get the current play time
     * @private
     */
    function getCurrentSongTime(){
        var current_song = getCurrentSong();
        if(!current_song){
            return 0;
        }

        var offset = 0;
        if(_private.state.playstate === 'play'){
            var now = new Date();

            offset = (now.getTime() - _private.last_status_update_time.getTime())/1000;
        }

        var last_time = _private.state.current_song.elapsed_time;
        last_time = last_time?last_time:0;

        return Math.min(last_time + offset, current_song.getDuration());
    }


    /**
     * get the song identified by it's position on the current queue, or null
     * @private
     */
    function getSongOnQueue(idx){
        var song = null;
        if(idx !== null && _private.state.current_queue.getSongs()[idx]){
            song = _private.state.current_queue.getSongs()[idx];
        }
        return song;
    }


    /**
     * get the current song, or null
     * @private
     */
    function getCurrentSong(){
        return getSongOnQueue(_private.state.current_song.queue_idx);
    }


    /**
     * get the song next on the queue, or null
     * @private
     */
    function getNextSong(){
        return getSongOnQueue(_private.state.next_song.queue_idx);
    }

    /**
     * make a deep copy of the passed object/array/primitive
     * @private
     */
    function cloneObject(obj){
        return JSON.parse(JSON.stringify(obj));
    }


    /********\
    |* INIT *|
    \********/
    init();
    //see I told you it was called down here

    return self;

};


/**
 * A song that exsists in the MPD database
 * @class Song
 * @param {MPD} client - the MPD client object that owns this
 * @param {song_metadata} source - raw metadata javascript object that contains the MPD reported data for this song
 */
MPD.Song = function(client, source){
     /**
      * @lends Song
      */
     var me = {};

     /**
      * get the MPD reported metadata, raw
      * @instance
      * @returns {song_metadata} gets the all of the raw metadata MPD provided
      */
     me.getMetadata = function(){
         return JSON.parse(JSON.stringify(source));
     };

     /**
      * get the best looking name for this song, prefer Title, fallback to something derived from filename
      * @instance
      * @returns {String} a good looking display name for this sing, suitable for presenting to the user
      */
     me.getDisplayName = function(){
         if(typeof source.title === 'undefined'){
            return source.file;
         }
         return source.title;
     };

     /**
      * get the filename
      * @instance
      * @returns {String} the full path to the music file in MPD's music directory. relative path.
      */
     me.getPath = function(){
         return source.file;
     };

     /**
      * when was the song file last altered
      * @instance
      * @returns {Date} when the song file last altered
      */
     me.getLastModified = function(){
         return source.last_modified;
     };

     /**
      * get the song's duration
      * @instance
      * @returns {Number} song duration in number of seconds
      */
     me.getDuration = function(){
         return source.time;
     };

     /**
      * get the song's artist
      * @instance
      * @returns {String} from the song metadata
      */
     me.getArtist = function(){
         return source.artist;
     };

     /**
      * get the song's title
      * @instance
      * @returns {String} from the song metadata
      */
     me.getTitle = function(){
         return source.title;
     };

     /**
      * get the song's album
      * @instance
      * @returns {String} from the song metadata
      */
     me.getAlbum = function(){
         return source.album;
     };

     /**
      * get the song's track
      * @instance
      * @returns {String} from the song metadata
      */
     me.getTrack = function(){
         return source.track;
     };

     /**
      * get the song's genre
      * @instance
      * @returns {String} from the song metadata
      */
     me.getGenre = function(){
         return source.genre;
     };

     /**
      * get the reported disk number from of the song, note this need not be a number or numeric, also need not exsist
      * @instance
      * @returns {String} reported disk
      */
     me.getDisk = function(){
         return source.disk;
     };

     /**
      * if this song is on the Queue, get the QueueSong
      * @instance
      * @returns {QueueSong}
      */
     me.getQueueSong = function(){
        var queue = client.getQueue().getSongs();
        for(var i = 0; i<queue.length; i++){
            if(queue[i].getPath() === me.getPath()){
                return queue[i];
            }
        }
        return null;
     };

     /**
      * return a copy of this object. the point of this is to return an object that the used cannot use to mutate this one, but that has the exact same behaviour
      * @instance
      * @returns {Song}
      */
     me.clone = function(){
         return MPD.Song(client, source);
     };

     return me;
     /**
      * Object representation of a song. This is a direct translation of the data that MPD returns, if MPD does not think a particular
      * song should have a property it won't return one. What is documented here are the properties I have seen MPD return, not all of
      * these will be returned all of the time. The properties file, date, and time appear to be consistently returned, but MPD makes
      * no promises. All other properties I frequently find missing, you will need to check to make sure they are present before using.
      * @typedef {Object} song_metadata
      * @property {String} file - the full path to the music file in MPD's music directory. relative path.
      * @property {Date} last_modified - last time the file was altered
      * @property {Integer} time - duration of song in seconds
      * @property {String=} artist - optional metadata
      * @property {String=} title - optional metadata
      * @property {String=} album - optional metadata
      * @property {String=} track - optional metadata
      * @property {String=} genre - optional metadata
      * @property {String=} disk - optional metadata
      * @property {Integer} id - (*** queue songs only @see {@link QueueSong} ***) a persistent identifer for this song on the queue, is only relevent to the queue, is not associated with the song it's self
      * @property {Integer} pos - (*** queue songs only @see {@link QueueSong} ***) the position of the song on the queue. the queue index.
      */
 }

 /**
  * A song that is on the queue
  * @class QueueSong
  * @augments Song
  * @param {MPD} client - the MPD client object that owns this
  * @param {song_metadata} source - raw metadata javascript object that contains the MPD reported data for this song
  */
MPD.QueueSong = function(client, source){
    /**
     * @lends QueueSong
     */
    var me = MPD.Song(client, source);

    /**
     * get the queue song id for this song
     * @instance
     * @returns {Integer} a persistent identifer for this song on the queue, is only relevent to the queue, is not associated with the song it's self
     */
    me.getId = function(){
        return source.id;
    };

    /**
     * get the song's position on the queue
     * @instance
     * @returns {Integer} the position of the song on the queue. the queue index.
     */
    me.getQueuePosition = function(){
        return source.id;
    };

    /**
     * play this song
     * @instance
     */
    me.play = function(){
        return client.playSongById(me.getId());
    };

    /**
     * overrideing this becaue we already are a QueueSong
     * @instance
     * @override
     * @returns {QueueSong}
     */
    me.getQueueSong = function(){
       return me;
    };

    /**
     * return a copy of this object. the point of this is to return an object that the used cannot use to mutate this one, but that has the exact same behaviour
     * @instance
     * @override
     * @returns {QueueSong}
     */
    me.clone = function(){
        return MPD.QueueSong(client, source);
    };

    return me;
}

/**
 * Object representation of a directory. Directories are representations of folders that contain other folders and songs, they
 * map to directories on the MPD server's machine. This appears to be a fairly stable structure returned by MPD.
 * I could see an argument in favor of a common ancesstor with Song, because everything in this class has a direct analog in Song.
 * @class Directory
 * @param {MPD} client - the MPD client object that owns this
 * @param {directory_metadata} source - raw metadata javascript object that contains the MPD reported data for this song
 */
MPD.Directory = function(client, source){
     /**
      * @lends Songlist
      */
    var me = {};

    /**
     * get the MPD reported metadata, raw
     * @instance
     * @returns {directory_metadata} gets the all of the raw metadata MPD provided
     */
    me.getMetadata = function(){
        return JSON.parse(JSON.stringify(source));
    };

    /**
     * get the path to (including) this directory. relative to the MPD server's media root
     * @instance
     * @returns {String} path to this directory. relative to the MPD server's media root
     */
    me.getPath = function(){
        return source.directory;
    }

    /**
     * when was the directory last altered
     * @instance
     * @returns {Date} when the song file last altered
     */
    me.getLastModified = function(){
        return source.last_modified;
    };

    return me;

    /**
     * return a copy of this object. the point of this is to return an object that the used cannot use to mutate this one, but that has the exact same behaviour
     * @instance
     * @returns {Directory}
     */
    me.clone = function(){
        return MPD.Directory(client, source);
    };

    /**
     * metadata returned about a directory from MPD
     * @typedef directory_metadata
     * @property {String} directory - file path relative to MPD's music folders
     * @property {Date} last_modified - last time this directory was modified
     */
}

/**
 * Generic playlist like interface. The Songlist function takes an object and returns
 * a Songlist object which representing a list of songs. This can be used to represent
 * the queue or a playlist
 * @class Songlist
 * @param {MPD} client - the MPD client object that owns this Songlist
 * @param {Object} source - configuration object that contains a list of songs
 */
MPD.Songlist = function(client, source){
     /**
      * @lends Songlist
      */
     var me = {};

     /**
      * given a song filename add it to this Songlist
      * @instance
      * @abstract
      * @param {String} pathname - relative path to the song file in the MPD database
      */
     me.addSongByFile = function(pathname){
         throw new Error('must be implemented by subclass!');
     };

     /**
      * remove all songs from this Songlist
      * @instance
      * @abstract
      */
     me.clear = function(){
         throw new Error('must be implemented by subclass!');
     };

     /**
      * remove a song as identified
      * @instance
      * @abstract
      * @param {Integer} position - position on the list of the song you want to remove
      */
     me.removeSongByPosition = function(position){
         throw new Error('must be implemented by subclass!');
     };

     /**
      * remove a song as identified
      * @instance
      * @abstract
      * @param {Integer} position - position on the list of the song you want to remove
      * @param {Integer} to - position on the list where you want the song to to be
      */
     me.moveSongByPosition = function(position, to){
         throw new Error('must be implemented by subclass!');
     };

     /**
      * get the list of songs
      * @instance
      * @returns {Song[]}
      */
     me.getSongs = function(){
         return source.songs;
     };

     /**
      * return a copy of this object. the point of this is to return an object that the used cannot use to mutate this one, but that has the exact same behaviour
      * @instance
      * @returns {Songlist}
      */
     me.clone = function(){
         return MPD.Songlist(client, source);
     };

     return me;
 }

/**
 * Object that represents a stored playlist
 * @class Playlist
 * @augments Songlist
 * @param {MPD} client - the MPD client object that owns this Songlist
 * @param {Object} source - configuration object that contains a list of songs
 * @param {String} playlist_name - the name of the playlist
 */
MPD.Playlist = function(client, source){
    var me = MPD.Songlist(client, source);

    me.addSongByFile = function(pathname){
        client.addSongToPlaylistByFile(me.getName(), pathname);
    };
    me.clear = function(){
        client.clearPlaylist(me.getName());
    };
    me.removeSongByPosition = function(position){
        client.removeSongFromPlaylistByPosition(me.getName(), position);
    };
    me.moveSongByPosition = function(position, to){
        client.moveSongOnPlaylistByPosition(me.getName(), position, to);
    };

    /**
     * return the name of this playlist
     * @instance
     * @returns {String}
     */
    me.getName = function(){
        return source.playlist;
    }

    /**
     * return a copy of this object. the point of this is to return an object that the used cannot use to mutate this one, but that has the exact same behaviour
     * @instance
     * @returns {Playlist}
     */
    me.clone = function(){
        return MPD.Playlist(client, source);
    };

    return me;
}

/**
 * Object that represents the queue
 * @class Queue
 * @augments Songlist
 * @param {MPD} client - the MPD client object that owns this Songlist
 * @param {Object} source - configuration object that contains a list of songs
 */
MPD.Queue = function(client, source){
   var me = MPD.Songlist(client, source);

   me.addSongByFile = function(pathname){
       client.addSongToQueueByFile(pathname);
   };
   me.clear = function(){
       client.clearQueue();
   };
   me.removeSongByPosition = function(position){
       client.removeSongFromQueueByPosition(position);
   };
   me.moveSongByPosition = function(position, to){
       client.moveSongOnQueueByPosition(position, to);
   };

   /**
    * return a copy of this object. the point of this is to return an object that the used cannot use to mutate this one, but that has the exact same behaviour
    * @instance
    * @returns {Queue}
    */
   me.clone = function(){
       return MPD.Queue(client, source);
   };

   return me;
}

/**
 * Is passed a playlist
 * @callback playlistCallback
 * @param {Playlist} playlist - a playlist
 */
/**
 * Lists all songs and directories in path (blank string for root). also returns song file metadata info
 * @callback directoryContentsCallback
 * @param {directory[]} [directory_contents] - the contents of the directory, will be an array of objects representing director(y|ies) and/or song(s) interleived
/**
 * is given search results when the search is complete
 * @callback searchResultsCallback
 * @param {song[]} search_results - all of the songs that match the tag values you asked for
 */
/**
 * is passed the number of songs matching the given search criteria
 * @callback searchCountCallback
 * @param {Integer} search_result_count - number of songs matched by the tag values
 */

/**
 * event handler for 'Error' events
 * error event hander callback
 * @event Error
 * @type {Object}
 * @callback errorEventHandler
 * @param {Object} [responce_event] -
 * @param {MPD} client - the client that this event happened on
 */
/**
 * generic event hander callback called when any sort of event happens
 * @event Event
 * @type {Object}
 * @callback eventHandler
 * @param {Object} [responce_event] - {type:String:data:Object} data depends onf type, see the other event handlers
 * @param {MPD} client - the client that this event happened on
 */
/**
 * generic event hander callback called when any sort of event happens that doesn't have any handler set for it
 * @event Event
 * @type {Object}
 * @callback unhandledEventHandler
 * @param {Object} [responce_event] - {type:String:data:Object} data depends onf type, see the other event handlers
 * @param {MPD} client - the client that this event happened on
 */
/**
 * event handler for 'DatabaseChanging' events
 * event hander callback for when the music database has started changing, there will be a DataLoaded event following this (unless something goes HORRIBLY wrong)
 * @event DatabaseChanging
 * @type {Object}
 * @callback databaseChangingEventHandler
 * @param {Object} [responce_event] -
 * @param {MPD} client - the client that this event happened on
 */
/**
 * event handler for 'DataLoaded' events
 * called when a bulk dataload has completed and the mpd client's data is in a ocnsistent state. fired when a client has finished recovering from a reload which might be caused by a database change or (re)connecting
 * @event DataLoaded
 * @type {Object}
 * @callback dataLoadedEventHandler
 * @param {state} state - state object, the same as is returned by getState
 * @param {MPD} client - the client that this event happened on
 */
/**
 * event handler for 'StateChanged' events
 * called when the state of the player has changed. This can be an scalar value. Things like currently playing song changing, volume, settings (consume, repeat, etc)
 * NOT called when the current play time changes, because that changes continuusly, you will need to poll that
 * @event StateChanged
 * @type {Object}
 * @callback stateChangedEventHandler
 * @param {state} state - state object, the same as is returned by getState
 * @param {MPD} client - the client that this event happened on
 */
/**
 * event handler for 'QueueChanged' events
 * something about the queue of playing songs changed
 * @event QueueChanged
 * @type {Queue}
 * @callback queueChangedEventHandler
 * @param {Queue} queue - the new queue
 * @param {MPD} client - the client that this event happened on
 */
/**
 * event handler for 'PlaylistsChanged' events
 * some playlist somewhere changed. is an array of {playlist:String, last_modified:Date}
 * @event PlaylistsChanged
 * @type {Object[]}
 *
 * @callback playlistsChangedEventHandler
 * @param {array} [playlists] - [string] array of names of all playlists. note: there doesn't seem to be a way to get just the changed ones, so you get the list of everything, you can tell if something was added or removed but you have no way of telling if any particular playlist has been changed. this is a limitation of MPD
 * @param {MPD} client - the client that this event happened on
 */
/**
 * event handler for 'Connect' events
 * the client has connected, but no data has yet loaded
 * you can use this to setup event handlers, or just do that before connecting
 * @event Connect
 * @type {Object}
 * @callback connectEventHandler
 * @param
 * @param {MPD} client - the client that this event happened on
 */
/**
 * event handler for 'Disconnect' events
 * the client has disconnected
 * @event Disconnect
 * @type {Object}
 * @callback disconnectEventHandler
 * @param
 * @param {MPD} client - the client that this event happened on
 */
