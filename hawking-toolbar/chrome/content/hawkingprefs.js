const htbPrefPrefix = "extensions.hawking.";
function htbGetPrefs() {
	return 
}

function htbSetPref(name,value,type){
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	if(!prefs) return;
	if(type=='Int')
		prefs.setIntPref(htbPrefPrefix+name,value);
	else if(type=='Bool')
		prefs.setBoolPref(htbPrefPrefix+name,value);
	else if(type=='Char')
		prefs.setCharPref(htbPrefPrefix+name,value);
}

function htbGetPref(name){
	var prefix = htbPrefPrefix;
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	if(!prefs) return "";
	var gotten = "";
	if (prefs.getPrefType(prefix+name) == prefs.PREF_STRING){
		gotten = prefs.getCharPref(prefix+name);
	}
	else if (prefs.getPrefType(prefix+name) == prefs.PREF_BOOL){
		gotten = prefs.getBoolPref(prefix+name);
	}
	else if (prefs.getPrefType(prefix+name) == prefs.PREF_INT){
		gotten = prefs.getIntPref(prefix+name);
	}
	return gotten;
}

//@line 38 "/cygdrive/c/builds/tinderbox/Fx-Mozilla1.8-release/WINNT_5.2_Depend/mozilla/browser/components/preferences/security.js"

var classHawkingPane = {
  _pane: null,

  //init function called by XUL file upon pane load
  init : function() {
    this._pane = document.getElementById("paneHawking");
	//this._populatePrefPane();
	//alert("hawking pane loaded");
  },

  test:function(){
	var pref= htbGetPref("borderHighlightColor");
	alert(pref);
  },
};


function captureMoveEvent(ev){
	if(!ev){
		alert('nope');
		return;
	}
	alert(String.fromCharCode(ev.which));
	//htbSetPref("moveEvent",String.fromCharCode(event.which),"Char");
	//alert('hei');
}

var htbCapturing = false;
var htbCaptureWhich = "";
var htbCaptureTimeout;

function htbSetCapturing(b){
	//b should be boolean
	htbCapturing = b;
}


function htbCaptureEventMove(ev){
	document.getElementById("htbEngageButton").disabled =true;
	document.getElementById("htbMoveButton").disabled =true;
	document.getElementById("htbMoveButton").label = "Capturing Move...";

	ev.preventDefault();
	ev.stopPropagation();
	htbSetCapturing(true);
	htbCaptureWhich = "move";
	htbCaptureTimeout = setTimeout("htbNothingCaptured();", 5000);
	return false;
}
function htbCaptureEventEngage(ev){
	document.getElementById("htbEngageButton").disabled =true;
	document.getElementById("htbMoveButton").disabled =true;
	document.getElementById("htbMoveButton").label = "Capturing Engage...";

	ev.preventDefault();
	ev.stopPropagation();
	htbSetCapturing(true);
	htbCaptureWhich = "engage";
	htbCaptureTimeout = setTimeout("htbNothingCaptured();", 5000);
	return false;
}

function htbNothingCaptured(){
	alert("No event was captured");
	htbResetCapture();
}


function htbCaptureEventPref(ev){
	if(!htbCapturing)return true;
	var act = "";
	var prefClick; //moveAct, engageAct (either true for a click or false for a keypress)
	var prefVal; //moveVal, engageVal (either the button number, or the keycode)
	if(htbCaptureWhich=="move"){
		prefClick = "moveAct";
		prefVal = "moveVal";
	}
	else if(htbCaptureWhich=="engage"){
		prefClick = "engageAct";
		prefVal = "engageVal";
	}
	else{
		return true;
	}
	var etype = ev.type;//either 'click' or 'keydown'
	if(etype=="click"){
		//they clicked. was it right/left?
		htbSetPref(prefClick, true, "Bool");
		var button = ev.button;
		htbSetPref(prefVal, button, "Int"); //usually 0 for left, 1 for middle, 2 for right
		htbDoneCapturing();
		ev.preventDefault();
		ev.stopPropagation();
		return false;
	}
	else if(etype=="keydown"){
		//this should be the only other kind, but just in case...
		//now figure out which button was pressed (don't worry about shift/ctrl)
		htbSetPref(prefClick, false, "Bool");
		var key = ev.which;
		htbSetPref(prefVal, key, "Int"); //store keycode of key pressed
		htbDoneCapturing();
		ev.preventDefault();
		ev.stopPropagation();
		return false;
	}
	return true;
}

function htbDoneCapturing(){
	clearTimeout(htbCaptureTimeout);
	htbResetCapture();
}
//htbSetPref("name", "value", "type");
//htbGetPref("name")

function htbResetCapture(){
	htbSetCapturing(false);//done capturing
	htbCaptureWhich = "";
	document.getElementById("htbEngageButton").disabled =false;
	document.getElementById("htbMoveButton").disabled =false;
	document.getElementById("htbMoveButton").label = "Set 'Move' Action";
	document.getElementById("htbEngageButton").label = "Set 'Engage' Action";	
}
