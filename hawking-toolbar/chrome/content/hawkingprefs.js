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
	if(!prefs) return;
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
