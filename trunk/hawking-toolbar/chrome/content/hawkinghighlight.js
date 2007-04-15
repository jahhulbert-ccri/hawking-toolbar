var htbHighlightCSS = "chrome://hawking-toolbar/skin/highlight.css";

var htbHighlighter = Class.create();

htbHighlighter.prototype = {
	initialize: function(){
		try{
			var div = document.createElement("div");
			div.id = "htbHighlightDiv";
			var rend = document.createTextNode("h");
			div.appendChild(rend);
			div.removeChild(rend);
//			div.style.display = "none";
			this.highlighter = div;
		}
		catch(e){
			alert(e.name+" exception: "+e.message);
		}
	},
	highlight: function(obj){
		if(!obj)return;
		obj = $(obj);
		var style = this.createStyleSheet(obj.ownerDocument, htbHighlightCSS);
		this.addStyleSheet(obj.ownerDocument, style);
//		this.highlighter.style.display ="block";
//		var dim = obj.getDimensions();
		var dim = this.getOffsetSize(obj);
		var loc = this.getViewOffset(obj, true);
		this.body = (obj.ownerDocument.body)?obj.ownerDocument.body:obj.ownerDocument.getElementsByTagName("body")[0];
		this.body.appendChild(this.highlighter);
//		alert(loc.x+" - "+loc.y+" : "+dim.width+" - "+dim.height);
		this.move(this.highlighter, loc.x, loc.y);
		this.resize(this.highlighter, dim.width, dim.height);
	},
	unhighlight: function(){
//		this.highlighter.style.display="none";
	},
	getClientOffset: function(elt){
	    function addOffset(elt, coords, view)
	    {
	        var p = elt.offsetParent;
	
	        var style = view.getComputedStyle(elt, "");
	
	        if (elt.offsetLeft)
	            coords.x += elt.offsetLeft + parseInt(style.borderLeftWidth);
	        if (elt.offsetTop)
	            coords.y += elt.offsetTop + parseInt(style.borderTopWidth);
	
	        if (p)
	        {
	            if (p.nodeType == 1)
	                addOffset(p, coords, view);
	        } 
	        else if (elt.ownerDocument.defaultView.frameElement)
	            addOffset(elt.ownerDocument.defaultView.frameElement, coords, elt.ownerDocument.defaultView);
	    }
	    
	    var coords = {x: 0, y: 0};
	    if (elt)
	    {
	        var view = elt.ownerDocument.defaultView;
	        addOffset(elt, coords, view);
	    }
	
	    return coords;
	},
	getViewOffset: function(elt, singleFrame){
	    function addOffset(elt, coords, view){
	        var p = elt.offsetParent;
	        coords.x += elt.offsetLeft - (p ? p.scrollLeft : 0);
	        coords.y += elt.offsetTop - (p ? p.scrollTop : 0);
	                
	        if (p)
	        {
	            if (p.nodeType == 1)
	            {
	                var parentStyle = view.getComputedStyle(p, "");
	                if (parentStyle.position != "static")
	                {
	                    coords.x += parseInt(parentStyle.borderLeftWidth);
	                    coords.y += parseInt(parentStyle.borderTopWidth);
	                    
	                    if (p.localName == "TABLE")
	                    {
	                        coords.x += parseInt(parentStyle.paddingLeft);
	                        coords.y += parseInt(parentStyle.paddingTop);
	                    }
	                    else if (p.localName == "BODY")
	                    {
	                        var style = view.getComputedStyle(elt, "");
	                        coords.x += parseInt(style.marginLeft);
	                        coords.y += parseInt(style.marginTop);
	                    }
	                }
	                else if (p.localName == "BODY")
	                {
	                    coords.x += parseInt(parentStyle.borderLeftWidth);
	                    coords.y += parseInt(parentStyle.borderTopWidth);
	                }
	
	                var parent = elt.parentNode;
	                while (p != parent)
	                {
	                    coords.x -= parent.scrollLeft;
	                    coords.y -= parent.scrollTop;
	                    parent = parent.parentNode;
	                }
	                addOffset(p, coords, view);
	            }
	        } 
	        else
	        {
	            if (elt.localName == "BODY")
	            {
	                var style = view.getComputedStyle(elt, "");
	                coords.x += parseInt(style.borderLeftWidth);
	                coords.y += parseInt(style.borderTopWidth);
	
	                var htmlStyle = view.getComputedStyle(elt.parentNode, "");
	                coords.x -= parseInt(htmlStyle.paddingLeft);
	                coords.y -= parseInt(htmlStyle.paddingTop);
	            }
	
	            if (elt.scrollLeft)
	                coords.x += elt.scrollLeft;
	            if (elt.scrollTop)
	                coords.y += elt.scrollTop;
	            
	            var win = elt.ownerDocument.defaultView;
	            if (win && (!singleFrame && win.frameElement))
	                addOffset(win.frameElement, coords, win);
	        } 
	        
	    }
		var coords = {x: 0, y: 0};
    	if (elt)
        	addOffset(elt, coords, elt.ownerDocument.defaultView);
    	return coords;
	},
	getOffsetSize: function(elt){
    	return {width: elt.offsetWidth, height: elt.offsetHeight};
	},

	move: function(element, x, y){
    	element.style.left = x + "px";
    	element.style.top = y + "px";
	},

	resize: function(element, w, h){
		element.style.width = w + "px";
		element.style.height = h + "px";
	},
	createStyleSheet: function(doc, url){
	    var link = doc.createElementNS("http://www.w3.org/1999/xhtml", "link");
	    link.firebugIgnore = true;
	    link.setAttribute("rel", "stylesheet");
	    link.setAttribute("type", "text/css");
	    link.setAttribute("href", url);
	    return link;
	},

	addStyleSheet: function(doc, link)
	{
	    var heads = doc.getElementsByTagName("head");
	    if (heads.length)
	        heads[0].appendChild(link);
	    else
	        doc.documentElement.appendChild(link);
	}
};

