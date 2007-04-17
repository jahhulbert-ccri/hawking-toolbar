var autoInterval;

function htbToggleAuto(){
	var mode = htbGetPref("autoMode");
	if(mode==true){
		htbDisableAuto();
	}
	else{
		htbEnableAuto();
	}
}

function htbEnableAuto(){
	htbSetPref("autoMode", true, "Bool");
	var timing = parseFloat(htbGetPref("autoInterval"));
	if(timing<1 || isNaN(timing)){
		timing = 2;
		htbSetPref("autoInterval", 2, "Integer"); //sets an erroneous preference back
	}
	timing = timing*1000;//from seconds to miliseconds
	autoInterval = setInterval("htbAutoIterate();", timing);
//	alert(autoInterval+" set");
}

function htbDisableAuto(){
	htbSetPref("autoMode", false, "Bool");
//	alert("got: "+autoInterval);
	clearInterval(autoInterval);
}

function htbAutoIterate(){
	var simple = htbGetPref("literacybar");
	if(simple)//we're in literacy mode
		HawkingPageNext();
	else //we're in normal toolbar mode
		ContextManager.next();		
}
