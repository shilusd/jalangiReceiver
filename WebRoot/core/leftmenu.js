      var tempinnertext1,tempinnertext2,outlooksmoothstat
        outlooksmoothstat=0;
    var outlookbar;
    var menuShowed=false;
    var menudiv;
       
    function showitem(id,target,name,picname,clickfunc,css)
    {
    	var targetStr=target==""?"":" target="+target;
		//return ("<span><a target=" + target + "  href='"+id+"'>"+name+"</a></span><br>"
		return ("<span><a class='leftmenuitema'"+targetStr+"  href='javascript:void(0)' onclick=\""+clickfunc+"\">" 
				+ "<img src='" +picname+ "' width='" +"40' height='" + "40' "+css+"><br>" +name+ "</a></span><br><br>")
	   
	}
	function switchoutlookBar(number) {
		var i = outlookbar.opentitle;
		outlookbar.opentitle = number;
		var id1, id2, id1b, id2b
		if (number != i && outlooksmoothstat == 0) {
			if (number != -1) {
				if (i == -1) {
					id2 = "blankdiv";
					id2b = "blankdiv";
				} else {
					id2 = "outlookdiv" + i;
					id2b = "outlookdivin" + i;
					
				}
				id1 = "outlookdiv" + number
				id1b = "outlookdivin" + number
				
				smoothout(id1, id2, id1b, id2b, 0);
			} else {
				$("#blankdiv").css({"display":"","height":"100%"});
				$("#outlookdiv"+i).css({"display":"none","height":"0%"});
			}
		}

	}
	function smoothout(id1, id2, id1b, id2b, stat) {
		if (stat == 0) {
			tempinnertext1 = $("#"+id1b)[0].innerHTML;
			tempinnertext2 = $("#"+id2b)[0].innerHTML;
			$("#"+id1b)[0].innerHTML = "";
			$("#"+id2b)[0].innerHTML = "";
			outlooksmoothstat = 1;
			$("#"+id1b).css({"overflow":"hidden"});
			$("#"+id2b).css({"overflow":"hidden"});
			$("#"+id1).css({"height":"0px"});
			$("#"+id1b).css({"height":"0px"});
			$("#"+id1).css({"display":""});
			setTimeout("smoothout('" + id1 + "','" + id2 + "','" + id1b + "','"
					+ id2b + "'," + outlookbar.inc + ")", outlookbar.timedalay);
		} else {
			stat += outlookbar.inc;
			if (stat > outlookbar.scrollH)
				stat = outlookbar.scrollH;
			$("#"+id2).css({"height":outlookbar.scrollH-stat+"px"});
			$("#"+id2b).css({"height":outlookbar.scrollH-stat+"px"});
			$("#"+id1).css({"height":stat+"px"});
			$("#"+id1b).css({"height":stat+"px"});
			if (stat < outlookbar.scrollH)
				setTimeout("smoothout('" + id1 + "','" + id2 + "','" + id1b
						+ "','" + id2b + "'," + stat + ")",
						outlookbar.timedalay);
			else {
				$("#"+id1b)[0].innerHTML = tempinnertext1;
				$("#"+id2b)[0].innerHTML = tempinnertext2;
				outlooksmoothstat = 0;
				$("#"+id1b).css({"overflow":"auto"});
				$("#"+id2).css({"display":"none"});
			}
		}
	}
	function getOutLine() {
		var strStyle;
		outline = "<table id='tabLeftMenu'" + outlookbar.otherclass + ">";
		for (i = 0; i < (outlookbar.titlelist.length); i++) {
			outline += "<tr><td class='lmenu' name=outlooktitle" + i + " id=outlooktitle" + i
					+ " ";
			if (i != outlookbar.opentitle)
				outline += " nowrap align=center  ";
			else
				outline += " nowrap align=center ";
			outline += outlookbar.titlelist[i].otherclass
			outline += " onclick='switchoutlookBar(" + i
					+ ")'><span class=smallFont>";
			outline += outlookbar.titlelist[i].title + "</span></td></tr>";
			outline += "<tr><td name=outlookdiv" + i
					+ " valign=top align=center id=outlookdiv" + i
					+ " style='width:100%"
			if (i != outlookbar.opentitle)
				outline += ";display:none;height:0%;";
			else
				outline += ";display:;height:"+outlookbar.scrollH+"px;";
			outline += "'><div name=outlookdivin" + i + " id=outlookdivin" + i
					+ " style='overflow:auto;width:100%;height:"+outlookbar.scrollH+"px'>";
			for (j = 0; j < outlookbar.itemlist[i].length; j++){
				strStyle="";
				if (j==0)
					strStyle=" style='padding-top:20px' ";
				outline += showitem(outlookbar.itemlist[i][j].key,
						outlookbar.itemlist[i][j].target,
						outlookbar.itemlist[i][j].title,
						outlookbar.itemlist[i][j].picname,
						outlookbar.itemlist[i][j].clickfunc,strStyle);
			}
			outline += "</div></td></tr>"
		}
          
		outline += "</table>"
		return outline
	}
	function show(targetID) {
		var $target=$("#" + targetID);
		var outline;
		//outline="<div id=outLookBarDiv name=outLookBarDiv style='width=100%;height:100%'>"

		outline = outlookbar.getOutLine(targetID);

		$target.append($(outline));
		
		
	}
	function theitem(intitle, instate, intarget, inkey,picname,clickfunc) {
		this.state = instate;
		this.otherclass = " nowrap ";
		this.key = inkey;
		this.target = intarget;
		this.title = intitle;
		this.picname=picname;
		this.clickfunc=clickfunc;
	}
	function addtitle(intitle) {
		outlookbar.itemlist[outlookbar.titlelist.length] = new Array();
		outlookbar.titlelist[outlookbar.titlelist.length] = new theitem(
				intitle, 1, 0);
		return (outlookbar.titlelist.length - 1);
	}
	function additem(intitle, parentid, intarget, inkey, picname,clickfunc) {
		if (parentid >= 0 && parentid <= outlookbar.titlelist.length) {
			outlookbar.itemlist[parentid][outlookbar.itemlist[parentid].length] = new theitem(
					intitle, 2, intarget, inkey,picname,clickfunc);
			outlookbar.itemlist[parentid][outlookbar.itemlist[parentid].length - 1].otherclass = " nowrap align=left style='height:5' ";
			return (outlookbar.itemlist[parentid].length - 1);
		} else
			additem = -1;
	}
	function outlook() {
		this.titlelist = new Array();
		this.itemlist = new Array();
		this.divstyle = "style='height:100%;width:100%;overflow:auto' align=center";
		this.otherclass = "border=0 cellspacing='0' cellpadding='0' style='height:100%;width:100%'valign=middle align=center ";
		this.addtitle = addtitle;
		this.additem = additem;
		this.starttitle = -1;
		this.show = show;
		this.getOutLine = getOutLine;
		this.opentitle = this.starttitle;
		this.reflesh = outreflesh;
		this.timedelay = 20;
		this.inc = 200;//每次的变化量(px)
		this.titleBarH=35;
		this.scrollH=0;

	}
	function outreflesh() {
		$("#outLookBarDiv")[0].innerHTML = outlookbar.getOutLine();
	}
	function locatefold(foldname) {
		for ( var i = 0; i < outlookbar.titlelist.length; i++)
			if (foldname == outlookbar.titlelist[i].title) {
				outlookbar.starttitle = i;
				outlookbar.opentitle = i;
			}

	}
	function loadLeftmenuByulID(ulid,targetID){
		outlookbar=new outlook();
		var $ahref,ar;
		var level1btn;
		var firstTitle="",title,img,clickfunc;
		var $li1s=$("."+ulid+" >li");
		var $li2s;//第二层的菜单
		for(var i=0;i<$li1s.size()-1;i++){
			title=$($li1s[i]).find(">a >span")[0].innerHTML;
			if (i==0)
				firstTitle=title;
			level1btn=outlookbar.addtitle(title);
			$li2s=$($li1s[i]).find(">div >ul li");
			for(var j=0;j<$li2s.size();j++){
			    $ahref=$($li2s[j]).find(">a");
				title=$($li2s[j]).find(">a >span")[0].innerHTML;

				clickfunc="";
		    	//ar=$ahref[0].outerHTML.split("onclick=\""); //FireFox不支持outerHTML属性
		    	ar=$li2s[j].innerHTML.split("onclick=\"");
		    	if (ar.length>1){
		    	    ar=ar[1].split("\">");
		    	    clickfunc=ar[0];
		    	}
			    additem(title,level1btn,'','javascript:void(0)','img\\menuico\\'+$ahref.attr("ico"),clickfunc);
			}
		}
		outlookbar.scrollH=$("#"+targetID).height()-outlookbar.titleBarH*($li1s.size()-1);
		if (firstTitle!="")
			locatefold(firstTitle);

	    show(targetID);
	    menudiv=targetID;
	    insertMenuIco(targetID,"pageBar");
	    $("#leftMenu,.leftmenuitema").click(function(event){
	    	event.stopPropagation();
	    });
	    
	}
	function insertMenuIco(menuDivId,icoTarget){
		var $icobar=$("#"+icoTarget);
		$icobar.css({"padding-left":"35px"});
		$("<div class='icoMouseOut'></div>").prependTo($icobar)
		.mousemove(function(e){
			$(this).removeClass('icoMouseOut');
			$(this).addClass('icoMouseOn');
		})
		.mouseout(function(e){
			$(this).removeClass('icoMouseOn');
			$(this).addClass('icoMouseOut');
		})
		.click(function(event){
			if (menuShowed)
				$("#"+menudiv).hide();
			else
				$("#"+menudiv).show();
			
			menuShowed=!menuShowed;
			event.stopPropagation();
		});
		$("html").click(function(event){
			if (menuShowed){
				$("#"+menudiv).hide();
				menuShowed=false;
			}
		})
	}