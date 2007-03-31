

//this is probably the better way to go.
function HawkingToolbarTracker(toolbar){
	//this function should be called on window load. It should assign
	//the first element in the context array to the toolbar document.getElementById('HawkingBar-Toolbar')
	//and it should initialize the index to -1
	if(!toolbar){
		alert("ERROR: Unable to locate the Hawking Toolbar in firefox");
		return;
	}
	this.ContextArray = [new ContextList(toolbar)];//essentially a stack
				//we only look at the top (end) ContextList
	this.ExitContext = function(){
		//this removes the top context
		if(this.ContextArray<=1){
			//we are at the basic toolbar level, exiting here would leave us with nothing
			//this should never come up (our toolbar shouldn't have an 'x' but just in case...
			return;
		}
		htbButtonBlur(this.getContext().getCurrent());
		this.ContextArray.pop(); //removes the last array entry
		htbButtonHover(this.getContext().getCurrent()); //back to where we used to be
	}
	this.EnterContext = function(ncon){
		//this adds a new context 'ncon' to the end of ContextArray
		htbButtonBlur(this.getContext().getCurrent());
		this.ContextArray.push(new ContextList(ncon));
		htbButtonHover(this.getContext().getCurrent());
	}
	this.next = function(){
		//moves to next clickable
		htbButtonBlur(this.getContext().getCurrent());
		this.getContext().next();
		htbButtonHover(this.getContext().getCurrent());
	}
	this.prev = function(){
		//moves to previous clickable
		htbButtonBlur(this.getContext().getCurrent());
		this.getContext().prev();
		htbButtonHover(this.getContext().getCurrent());
	}
	this.getCurrent = function(){
	   //returns the current clickable in the current scope
	   //or null if nothing
		return this.getContext().getCurrent();
	}
	this.getContext = function(){
    //this returns the current context pointed to
    return this.ContextArray[this.ContextArray.length-1];
  }
}

function ContextList(root){
	//this object should store 
	this.ContextRoot = root;
	this.WindowLocation = "about:blank"; //window location of this context
	this.ContextLinks = []; //array of all links in this context
	this.ContextPosition = -1;  //where we are in this array
}
ContextList.prototype.getCurrent = function(){
  //returns the clickable currently pointed to (and highlighted)
//	if(this.ContextRoot.hidden)
//		this.ContextRoot.hidden = false;
	if(this.ContextLinks.length==0 || this.ContextPosition<0)
		this.Setup();
	return this.ContextLinks[this.ContextPosition];
}

ContextList.prototype.next = function(){
  //moves pointer to the next clickable and highlights, returns nothing
	if(this.ContextLinks.length==0 || this.ContextPosition<0 || this.ContextPosition>this.ContextLinks.length){
		this.Setup();
//		alert("done with setup "+this.ContextLinks.length);
	}
	else{
		var iterations = 0;
		do{
			if(iterations>this.ContextLinks.length)
				break;
			iterations++;
  			this.ContextPosition++;
  			if(this.ContextPosition>=this.ContextLinks.length)
  		  	this.ContextPosition = 0;
		}
		while(!ObjectIsVisible(this.getCurrent()));
	}
}
ContextList.prototype.prev = function(){
  //move pointer to previous clickable
	if(this.ContextLinks.length==0 || this.ContextPosition<0)
		this.Setup();
	else{
		var iterations = 0;
		do{
			if(iterations>this.ContextLinks.length)
				break;
			iterations++;
  			this.ContextPosition--;
  			if(this.ContextPosition<0)
  		  		this.ContextPosition = this.ContextLinks.length-1;
  		}while(!ObjectIsVisible(this.getCurrent()));
	}
}
ContextList.prototype.Setup = function(){
  //find all the clickables in this.ContextRoot to this.ContextLinks
  //and sets this.ContextPosition = 0
  this.WindowLocation=window.content.document.location;
  this.ContextLinks = []; //clears out the old array
  FindLinks(this.ContextRoot, this.ContextLinks);
  this.ContextPosition = 0;
}

function FindLinks(node, arr){
	//if there is nothing in this node, it doesn't exist, or has no children
	//firefox randomly adds #text nodes into the dom which don't have any attributes
	//and in fact cause a "getAttribute" to fail if called on it
	//for this reason, if we see a #text or #comment get out
	if(!node || node.nodeName=="#text" || node.nodeName=="#comment"){
		return;
	}
	/*
		We should look for the following:
			<a> tags with href attribute defined
			any node with an onclick event attatched
			<input> tags with type="submit"
	*/
	if((node.nodeName=="A" && node.getAttribute('href')) || node.getAttribute('onclick') || node.getAttribute('oncommand') || (node.nodeName=="INPUT" && node.getAttribute("type") && node.getAttribute("type")=="submit")){
		arr.push(node);
//		alert("this node is valid: "+node.nodeName);
//		return;
	}
/*	else{
	 try{
      if(typeof node.onclick =='function')
	     arr.push(node);
	 }
	 catch(e){}
	}
*/
	//check inside  frames and iframes
  if(node.nodeName=="FRAME" || node.nodeName=="IFRAME"){
    try{
      FindLinks(node.contentDocument.getElementsByTagName("body")[0], arr);
    }
    catch(exception){
      //sometimes weird stuff happens, nothing we can do, just skip whatever was in that iframe
      alert("I take exception to such behaviour!");
    }
//    alert("made it");
    return;
  }
	
	//check for images or event captures later
	if(!node.childNodes || node.childNodes.length==0){
		//it has no children, and isn't itself clickable, so return;
		return;
	}
	//it has child nodes we should now check
	for(var i=0; i<node.childNodes.length; i++){
		FindLinks(node.childNodes[i], arr);
	}
}
var ContextManager;
addEvent(window, "load", HawkingTrackerSetup, true);
//used to be called on page load		htbButtonHover(ContextManager.getCurrent());
//this is the setup function which determines how the toolbar starts up
function HawkingTrackerSetup(){
	var tb = document.getElementById("HawkingToolBar");
	if(!tb){
		setTimeout("HawkingTrackerSetup()", 1000); //not ready, wait 1 second
		return;
	}
	//this should only be called once
	this.done = true;
	ContextManager = new HawkingToolbarTracker(tb);
	htbButtonHover(ContextManager.getCurrent());
	//transforms window events into move and engage
	var simple = htbGetPref("literacybar");
	if(simple){
		//simple toolbar, hide the htb
		tb.hidden = true;
		var mItem = document.getElementById("htbLiteracyMenuItem");
		if(mItem)
			mItem.setAttribute("checked", "true");
	}
	addEvent(window, "keydown", htbActionTransform, true);
	//removes the event from window.onload so it is not called every time
	window.removeEventListener("load", HawkingTrackerSetup, true);
}
function UnScope(){
	if(!ContextManager)
		return;
	ContextManager.getContext().ContextRoot.hidden = true;
	ContextManager.ExitContext();
	ContextManager.getContext().ContextRoot.hidden = false;
	ReLight(0);
}
function Scope(idstr){
	//takes in idstring, we'll document.getElementById it
	//and if it exists, we'll open scope
	var obj = document.getElementById(idstr);
	if(!obj)return;
	if(!ContextManager)
		return;
	ContextManager.getContext().ContextRoot.hidden = true;
	obj.hidden = false;
	ContextManager.EnterContext(obj);
	ReLight(0);
}
function ReLight(times){
	// this function focuses on the current
	// button many times in a row since it doesn't
	//
	htbButtonHover(ContextManager.getCurrent());
	if(times>5)
		return;
	setTimeout("ReLight("+parseInt(times+1)+")", 100);
}
//window.onkeydown = htbActionTransform;
function htbActionTransform(ev){
	//this function captures key presses
	//and translates them into clicks
	var dis = htbGetPref("disabled");
	if(dis==false){
		return true; //toolbar disabled, normal action allowed
	}

//	var ev = ev || window.event;
	if(!ev) return false;
//	alert("transforming action");
	if (htbIsEventClick(ev)) {
	//engage
		var simple = htbGetPref("literacybar");
		if(simple){
			HawkingPageClick();
		}
		else{
			ClickObject(ContextManager.getCurrent());
		}
		if(ev.preventDefault)
			ev.preventDefault();
		ev.returnValue = false;
		return false;
	}
	else if(htbIsEventMove(ev)){
	//move
		var simple = htbGetPref("literacybar");
		if(simple){
			HawkingPageNext();
		}
		else{
			ContextManager.next();
		}
		if(ev.preventDefault)
			ev.preventDefault();
		ev.returnValue = false;
		return false;
	}
	return true;
}
/*
function htbSimpleActionTransform(ev){
	//this function captures key presses
	//and translates them into next link or click link
	//specific for the literacy website
	var dis = htbGetPref("disabled");
	if(dis==false){
		return true; //toolbar disabled, normal action allowed
	}

	var ev = ev || window.event;
	if(!ev) return;
//	alert("transforming event");
	if (htbIsEventClick(ev)) {
	//engage
//		ClickObject(ContextManager.getCurrent());
		HawkingPageClick();
		if(ev.preventDefault)
			ev.preventDefault();
		ev.returnValue = false;
		return false;
	}
	else if(htbIsEventMove(ev)){
	//move
//		ContextManager.next();
		HawkingPageNext();
		if(ev.preventDefault)
			ev.preventDefault();
		ev.returnValue = false;
		return false;
	}
}
*/
function htbIsEventMove(ev){
//takes in an event object and determines if it matches
//the move characteristic of an event

	if(!ev || !ev.which) return false;
	return (String.fromCharCode(ev.which) == '2');
}

function htbIsEventClick(ev){
//takes in an event object and determines if it matches
//the click characteristic of an event
	if(!ev || !ev.which) return false;
	return (String.fromCharCode(ev.which) == '1');
}

function ObjectIsVisible(obj){
//consider using getComputedStyle instead of style
//also may want to check here: http://dean.edwards.name/my/cssQuery/

/*
        var offsetParent = element.offsetParent;
        if (!offsetParent)
            return;

        var parentStyle = window.getComputedStyle(offsetParent, "");
        if(parentStyle.display == "none' || parentStyle.visibility =="none")
          return false; //it's hidden
*/
	if(!obj) return false;
	while(obj){
    var style = window.getComputedStyle(obj, "");
    if(style && (style.display=="none" || style.visibility=="hidden"))
      return false;
    obj = obj.offsetParent;
  }
  return true;
/*
actual method
	if(!obj) return false;
	while(obj){
		if(obj.style && (obj.style.display=="none" || obj.style.visibility=="hidden")){
//			alert("it's hidden");
			return false;
		}
		obj = obj.parentNode;
	}
//	alert("it's visible");
	return true;
*/
}
function ClickObject(object){
	//pass this function the object you want to click
	if(!object){
    		alert("you clicked, but i saw no object");
    		return;
  	}
	if(object.getAttribute("oncommand")){
		object.doCommand();
	}
	else{
		var evObj = document.createEvent('MouseEvents');
		evObj.initEvent( "click", true, true );
		object.dispatchEvent(evObj);
	}
}

function htbFindRealHighlight(obj){
	if(!obj){
		return null;
	}
  	if(obj.nodeName=="A"){
		if(obj.childNodes && htbCountRealChildren(obj)==1){
			var nobj = htbGetFirstRealChild(obj);
			if(nobj && nobj.nodeName=="IMG"){
	  			return nobj;
	  		}
	  	}
		if(obj.parentNode && htbCountRealChildren(obj.parentNode)==1){
			/*  if the <a> is in something all by itself, highlight that instead;
			    this is to counteract the annoying "no-highlight" bug when we find an
			    <a> tag inside a <div> with an id so it appears as a clickable logo
			*/
			return obj.parentNode;
		}
	}
	return obj;
}


function Highlight(realObj){
	var obj = htbFindRealHighlight(realObj);
	if(!obj){
		alert("I tried to highlight, but you gave me nothing");
		return;
	}
//  	alert("looking at: "+obj.nodeName);
	var oStyle = "";
	if(obj.style && obj.style.border)
		oStyle = obj.style.border;
	obj.style.border = "solid #f00 5px";
	obj.setAttribute("old_style", oStyle);
	obj.focus();
}

function unHighlight(realObj){
	var obj = htbFindRealHighlight(realObj);
	if(!obj){ //nothing to unhighlight
		return;
	}
	var oStyle = "";
	if(obj.getAttribute("old_style"))
		oStyle = obj.getAttribute("old_style");
	if(obj.style && obj.style.border)
		obj.style.border = oStyle;	
}


function HawkingBarGoHome(){
    window.content.document.location = "http://code.google.com/p/hawking-toolbar";
//    window.content.focus();
}
var PageContext = null;
function HawkingPageNext(){
	//first check if we have instantiated PageContext or if the PageContext's location
	//does not match the current page's location (they have since clicked a link and gone
	//to a new page)
	if(!PageContext || PageContext.WindowLocation!=window.content.document.location){
//		alert("page reset or new");
		PageContext = new ContextList(window.content.document.body);
	}
	else	
		unHighlight(PageContext.getCurrent());
	PageContext.next();
	Highlight(PageContext.getCurrent());
//	alert("looking at "+PageContext.getCurrent().nodeName);
//	alert("done");
}
function HawkingPagePrev(){
	//first check if we have instantiated PageContext or if the PageContext's location
	//does not match the current page's location (they have since clicked a link and gone
	//to a new page)
	if(!PageContext || PageContext.WindowLocation!=window.content.document.location){
//		alert("page reset or new");
		PageContext = new ContextList(window.content.document.body);
	}
	else
		unHighlight(PageContext.getCurrent());
	PageContext.prev();
	Highlight(PageContext.getCurrent());
//	alert("looking at "+PageContext.getCurrent().nodeName);
//	alert("done");
}
function HawkingPageClick(){
	ClickObject(PageContext.getCurrent());
}

function OpenPrefs(ev){
	alert("These are the preferences");
	return;
}
function HawkingScrollDown(){
  window.content.scrollBy(0,100);
}

function HawkingScrollUp(){
  window.content.scrollBy(0,-100);
}
function HawkingScrollLeft(){
  window.content.scrollBy(-50,0);
}

function HawkingScrollRight(){
  window.content.scrollBy(50,0);
}

function htbButtonHover(obj){
	if(!obj || !obj.style)
		return;
	obj.focus();
	obj.style.color = 'red';
	obj.className = "over";
}

function htbButtonBlur(obj){
	if(!obj || !obj.style)
		return;
	obj.style.color = 'black';
//	obj.style.listStyleImage = "url('chrome://hawkingbar/skin/close_n.png')";
	obj.className = "";
//	if(obj.getAttribute && obj.getAttribute("high"))
//		alert("changed to "+obj.getAttribute("high"));
}

function hawkingDisableCapture(){
	var dis = htbGetPref("disabled");
	var button = document.getElementById("HawkingBarPrefs");
	if(dis==true){
		htbSetPref("disabled", false, "Bool");
		if(button)
		button.label = "Enable";
		else
		alert("disabled");
	}
	else{
		htbSetPref("disabled", true, "Bool");
		if(button)
		button.label = "Disable";
		else
		alert("activated");
	}
}

function htbEnableLiteracy(){
	htbSetPref("literacybar", true, "Bool");
	alert("You must restart FireFox for the changes to take effect");
}

function htbToggleLiteracy(){
	var lbar = htbGetPref("literacybar");
	var mItem = document.getElementById("htbLiteracyMenuItem");
	var tb = document.getElementById("HawkingToolBar");
	if(lbar){
		//go back to full feature set
		htbSetPref("literacybar", false, "Bool");
		if(tb)
			tb.hidden = false;
		if(mItem)
			mItem.setAttribute("checked", "false");
	}
	else{
		//reduce to literacy center feature
		htbSetPref("literacybar", true, "Bool");
		if(tb)
			tb.hidden = true;
		if(mItem)
			mItem.setAttribute("checked", "true");
	}
}


