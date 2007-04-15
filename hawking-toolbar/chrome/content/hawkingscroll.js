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
	}
	timing = timing*1000;//from seconds to miliseconds
	autoInterval = setInterval("ContextManager.next();", timing);
//	alert(autoInterval+" set");
}

function htbDisableAuto(){
	htbSetPref("autoMode", false, "Bool");
//	alert("got: "+autoInterval);
	clearInterval(autoInterval);
}
