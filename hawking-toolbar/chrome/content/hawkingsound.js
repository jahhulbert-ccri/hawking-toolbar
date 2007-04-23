//http://www.webreference.com/programming/javascript/mozillaapps/chap5/3/2.html

var htbSoundManager = Class.create();
htbSoundManager.prototype = {
//	ios: null,
	sound: null,
	initialize: function(){},
	playSound: function(prefName) {
        try {
        	// Get the filename stored in the preferences:
	        var file = htbGetPref(prefName);
	        if(file=="")
	        	file = "BARK.wav"; //default file?
	        file = "chrome://hawkingbar/content/sounds/"+file;
	        // Play the sound:
			var url = Components.classes["@mozilla.org/network/standard-url;1"].createInstance(Components.interfaces.nsIURL);
		   	url.spec = file;

	        this.getSound().play(url);
		} catch(ex) {
			// No file found
			//alert(ex.name+": "+ex.message);
		}
	},
	/*
	getIOS: function() {
		if(this.ios == null)
			this.ios = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		return this.ios;
	},*/
	getSound: function() {
		if(this.sound == null)
			this.sound = Components.classes['@mozilla.org/sound;1'].createInstance(Components.interfaces.nsISound);
		return this.sound;
	}
}