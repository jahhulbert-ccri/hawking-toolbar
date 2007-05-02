/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Initial Developers of the Original Code are John Foushee, Andrew Hulbert,
 * and Brian Louden
 *
 * The current homepage for the FireHawk Toolbar and updates
 * http://code.google.com/p/hawking-toolbar/ 
 *
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
 
//http://www.webreference.com/programming/javascript/mozillaapps/chap5/3/2.html

/**
 * htbSoundManager
 * class provided to play sounds from the hawking toolbars sound directory
 */
var htbSoundManager = Class.create();
htbSoundManager.prototype = {
	sound: null,
	initialize: function(){},
	
	/**
	 * playSound(prefName)
	 * plays a sound based on the string stored in the prefname passed to the function
	 */
	playSound: function(prefName) {
        try {
        	// Get the filename stored in the preferences:
	        var file = htbGetPref(prefName);
	        if(file=="")
	        	file = "click.wav"; //default noise
	        file = "chrome://hawkingbar/content/sounds/"+file;
	        // Play the sound:
			var url = Components.classes["@mozilla.org/network/standard-url;1"].createInstance(Components.interfaces.nsIURL);
		   	url.spec = file;

	        this.getSound().play(url);
		} catch(ex) {
			// No file found
			//FireHawk.htbAlert(ex.name+": "+ex.message);
		}
	},
	
	/**
	 * getSound()
	 * gets the mozilla sound service component
	 */
	getSound: function() {
		if(this.sound == null)
			this.sound = Components.classes['@mozilla.org/sound;1'].createInstance(Components.interfaces.nsISound);
		return this.sound;
	}
}