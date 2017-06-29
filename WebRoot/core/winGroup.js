;(function($){
	$.WG = $.wingroup = {
		options:{
			winGroupParamURL:  $.global.functionDefinitionUrl+"?type=WG"
		},
		list:{/*{funcno:container}*/},
		hiddenlist:{},
		runInstance: function( funcNo,options ){
			var op = $.extend({
					complete:function(){},
					allComplete:function(){},
					rowSelected:function(){},
					target:		 "main"
					},options);
			if($.WG.list[funcNo] == null){   // 每次都重新获取，这样在两层WG的情况下，不会出现宽度错误问题。 Bug 164的衍生问题。
				$.ajax({
					type: "POST",
					url:  $.WG.options.winGroupParamURL, 
					data: {funcNo: funcNo},
					dataType: "json",
					success:  function( data,textStatus ){
						var winGrpDef = data[0];
						winGrpDef.complete = op.complete;
						winGrpDef.allComplete = op.allComplete;
						winGrpDef.target=op.target;
						
						$.WG.list[funcNo] = winGrpDef;
						$.WG.createNew(winGrpDef,op.target);

					},
					error:function(e){
						$.msgbox.show("err","请求显示的功能"+funcNo+"不存在或存在定义错误：<br>"+e.responseText);
					}
				});
			}else{
				var winGrpDef = $.WG.list[funcNo];
				winGrpDef.complete = op.complete;
				winGrpDef.allComplete = op.allComplete;
				$.WG.createNew(winGrpDef,op.target);
				
			}
			return $.WG;
		},
		createNew:function(winGrpDef,target){
			var targetwin=$("#"+target);
			var topdivid=$.WG.idFuncs.getTopDivid(winGrpDef.funcno);
			var $div = $("<div id='"+topdivid+"'></div>")
			.css({width:(targetwin.width()-2),height:(targetwin.height()-2)})//,overflow:"auto"
			.appendTo(targetwin);
			if ($.WG.createSubFuncs[winGrpDef.layout]!=undefined)
				$.WG.createSubFuncs[winGrpDef.layout](winGrpDef,$div);
			
			if(typeof(winGrpDef.complete) == "function")
				winGrpDef.complete();
			if(typeof(winGrpDef.allComplete)=="function")
				winGrpDef.allComplete();
			//判断如果是grid模式的话，暂不支持隐藏
			if (winGrpDef.layout == "page"){
				if($.WG.hiddenlist[winGrpDef.funcno]){
					for(i=0; i<$.WG.hiddenlist[winGrpDef.funcno].length; i++){
						$div.tabs("remove", $.WG.hiddenlist[winGrpDef.funcno][i]);
					}
				}
			}
		},
		createSubFuncs:{
			grid:function(winGrpDef,target){
				var targetwin=target;
				var gridStr="";
				var cellid,dtlIdx=0,tdWH;
				var wgDetail;
				for(var i=1;i<=winGrpDef.rowcount;i++){
					for(var j=1;j<=winGrpDef.colcount;j++){
						wgDetail=winGrpDef.contwins[dtlIdx];
						//区分情况，如果是custom类型的话，则读取上下左右来布局，如果是自动布局的话，则按照以前的方法来
						
						//判断字段是否存在，不存在为旧版本，做兼容性处理
						var customexist = false;
						if (typeof(winGrpDef.custom)!="undefined"){
							customexist = true;
						}
						cellid=$.WG.idFuncs.getCellID(winGrpDef.funcno,i,j);
						celldivid=$.page.idFunc.getWinDivID(wgDetail.innerwinno);
						if(customexist && (winGrpDef.custom == 'Y')){
							//按照设置的大小来布局 y所加的26是标题栏的高度
							gridStr+="<div id='"+celldivid+"' style='width:"+(wgDetail.width-4)+"px;height:"+(wgDetail.height-4)+"px;"
							        +	"left:"+(wgDetail.x)+"px;top:"+(wgDetail.y+26)+"px;overflow-x: hidden; overflow-y: hidden;position:absolute;"
							        +	"border-width:1px;border-style:solid;border-color:#BDD6ED'>"
							        +"</div>";
						} else {
							//按照自动布局来布局，均分
							tdWH=$.WG.sizeFuncs.getGridDivPos(winGrpDef,wgDetail);//计算td的高和宽
							
							if (tdWH.width > 0) {  // bug 273 增加此判断。width为0标识是百分比宽度。
								gridStr+="<div id='"+celldivid+"' style='width:"+(tdWH.width-4)+"px;height:"+(tdWH.height-4)+"px;"
							        +	"left:"+(tdWH.left)+"px;top:"+(tdWH.top+3)+"px;overflow-x: hidden; overflow-y: hidden;position:absolute;"
							        +	"border-width:1px;border-style:solid;border-color:#BDD6ED'>"
							        +"</div>";
							}
							else {
								var width_percent = 100 / winGrpDef.colcount;
								gridStr+="<div id='"+celldivid+"' style='width:"+(width_percent-2)+"%;height:"+(tdWH.height-4)+"px;"
						        +	"left:"+(tdWH.left)+"px;top:"+(tdWH.top+3)+"px;overflow-x: hidden; overflow-y: hidden;position:absolute;"
						        +	"border-width:1px;border-style:solid;border-color:#BDD6ED'>"
						        +"</div>";
							}
						}
						
						
						
						dtlIdx+=1;
					}
				}
				targetwin.append($(gridStr));
			},
			normal:function(winGrpDef,target){
				var targetwin=target;
				var gridStr="";
				var cellid,dtlIdx=0,tdWH;
				var wgDetail;
				for(var i=1;i<=winGrpDef.rowcount;i++){
					for(var j=1;j<=winGrpDef.colcount;j++){
						wgDetail=winGrpDef.contwins[dtlIdx];
						
						cellid=$.WG.idFuncs.getCellID(winGrpDef.funcno,i,j);
						celldivid=$.page.idFunc.getWinDivID(wgDetail.innerwinno);
						var winDef=$.page.idFunc.getWinDefbyWinno(wgDetail.innerwinno);
						//按照设置的大小来布局 y所加的26是标题栏的高度
						gridStr+="<div id='"+celldivid+"' style='width:"+(winDef.width)+"px;height:"+(winDef.height)+"px;"
								+	"left:"+(winDef.x)+"px;top:"+(winDef.y)+"px;overflow-x: hidden; overflow-y: hidden;position:absolute;"
								+	"border-width:1px;border-style:solid;border-color:#BDD6ED'>"
								+"</div>";
						dtlIdx+=1;
					}
				}
				targetwin.append($(gridStr));
			},
			page:function(winGrpDef,target){
				var ulid=$.WG.idFuncs.getPagerUlID(winGrpDef.funcno);
				$("<ul id='"+ulid+"'></ul>").appendTo(target);
				target.tabs();
				
				var dtlIdx=0;
				var wgDetail;
				var pagerid,pagerdivid;
				var mcH=target.height();
				for(var i=1;i<=winGrpDef.rowcount;i++){
					for(var j=1;j<=winGrpDef.colcount;j++){
						//修改支持隐藏等内容
				
						wgDetail=winGrpDef.contwins[dtlIdx];
						pagerid=$.WG.idFuncs.getPagerID(winGrpDef.funcno,dtlIdx);
						
						pagerdivid=$.page.idFunc.getWinDivID(wgDetail.innerwinno);
						target.tabs("add",
								    "#"+pagerid,
								    _cutStr(wgDetail.funcname,10,"..."),
								    dtlIdx);
					    if (dtlIdx==0)
					    	mcH-=$("#"+ulid).height()+2;
					    
					    if (dtlIdx==0){
							var $div = $("<div id='"+pagerdivid+"'></div>")
							.css({width:target.width()-2,height:mcH,overflow:"hidden",position:"absolute"})
							.appendTo($("#"+pagerid));
							target.find("li a:eq(0)").attr({"loadWin":true});
						}
						target.find("li a:eq("+dtlIdx+")").attr("innerWinno",wgDetail.innerwinno);
						
					    if(typeof(wgDetail.visible)!="undefined"){
							if(wgDetail.visible=="N"){
								$.WG.hiddenlist[winGrpDef.funcno].push(dtlIdx);
							}
					    }
						dtlIdx+=1;
					}
				}
				target.bind(
	    				"tabsselect" ,function(evt,ui){
	    					if (!$(ui.tab).attr("loadWin")){
								$(ui.tab).attr("loadWin",true);
								var innerWinno=$(ui.tab).attr("innerWinno");
								var pagerdivid=$.page.idFunc.getWinDivID(innerWinno);
								var pagerid=$.WG.idFuncs.getPagerID(winGrpDef.funcno,ui.index);
								var $div = $("<div id='"+pagerdivid+"'></div>")
											.css({width:target.width()-2,height:mcH,overflow:"hidden",position:"absolute"})
											.appendTo($("#"+pagerid));
								$.page.createOneWin(innerWinno);
							}
	    				});
			}
		},
		triggerAlign:function(funcno){
			var winGrpDef = $.WG.list[funcno];
			if (typeof(winGrpDef) != "undefined") {  // 如果是page形式，则后面的WG还没有创建出来。  -Bug 141 临时解决方案
			  if (winGrpDef.layout!="normal")
				  return;
			  this.resizeWin(funcno);
			}
		},
		resizeWin:function(funcno,left,top,width,height){
			var winGrpDef = $.WG.list[funcno];
			if (typeof(winGrpDef) === "undefined") return;
			var $topdiv=$("#"+$.WG.idFuncs.getTopDivid(funcno));
			$topdiv.css({'width':(width-2)+'px','height':(height-2)+'px'});
			
			if (this.sizeFuncs.resizeRealType[winGrpDef.layout]!=undefined)
				this.sizeFuncs.resizeRealType[winGrpDef.layout](funcno,left,top,width,height);
		},
		refresh:function(funcno, filter){},//container暂时不受影响
		check:function(funcno){return true},//container暂时无check
		selectTab:function(funcno,innerwinno){
			var $ul=$("#"+$.WG.idFuncs.getPagerUlID(funcno));
			var winGrpDef = $.WG.list[funcno];
			if ($ul.size()>0){
			    var $target=$("#"+$.WG.idFuncs.getTopDivid(funcno));
			    //找到那个innerwinno
			    var i,j,dtlIdx=0,wgDetail;
			    //此处是修改支持隐藏标签
//			    if (winGrpDef.layout=="page"){
//			    	for(var i=1;i<=winGrpDef.contwins.length;i++){
//						wgDetail=winGrpDef.contwins[dtlIdx];
//						if (wgDetail.innerwinno==innerwinno)
//							break;
//						dtlIdx+=1;
//					}
//			    } else {
				    for(var i=1;i<=winGrpDef.rowcount;i++){
						for(var j=1;j<=winGrpDef.colcount;j++){
							wgDetail=winGrpDef.contwins[dtlIdx];
							if (wgDetail.innerwinno==innerwinno)
								break;
							dtlIdx+=1;
						}
					}			    	
//			    }
			    if (wgDetail!=undefined)
			    	$target.tabs("select",dtlIdx);
			}
		},
		select0Tab:function(funcno){
			var $target=$("#"+$.WG.idFuncs.getTopDivid(funcno));
			$target.tabs("select",0);
		},
		idFuncs:{
			getTopDivid:function(funcno){
				return "wg_topdiv"+funcno;
			},
			getCellID:function(funcno,row,col){
				return "wg_cell_"+row+"_"+col;
			},
			getPagerID:function(funcno,idx){
				return "wgPager_"+funcno+"_"+idx;
			},
			getPagerUlID:function(funcno){
				return "wg_ul_"+funcno;
			}
		},
		findContWinsByInnerWinno: function(WGDef, innerWinno) {
			for (var i = 0; i <WGDef.contwins.length; i++) {
				if (WGDef.contwins[i].innerwinno == innerWinno)
					return WGDef.contwins[i];
			}
		},
		sizeFuncs:{
			resizeRealType:{
				page:function(funcno,left,top,width,height){
					var winno=$.page.idFunc.funcno2winno(funcno);
					var wgDetail,bodyH,dtlIdx=0;
					
					var ulid=$.WG.idFuncs.getPagerUlID(funcno);
					var ulH=$("#"+ulid).height();
					var winHeight=height-ulH-4,newH;
					var newW=width-2;
					var winGrpDef=$.WG.list[funcno];
					
					var top=ulH+$("#"+$.page.idFunc.getTitleid(winno)).height()+8;
					var $target=$("#"+$.WG.idFuncs.getTopDivid(funcno));
					var nowidx=$target.tabs('option', 'selected');
					var $ul=$("#"+$.WG.idFuncs.getPagerUlID(funcno));
					var $a;
					for(var i=1;i<=winGrpDef.rowcount;i++){
						for(var j=1;j<=winGrpDef.colcount;j++){
							$a=$ul.find("a:eq("+dtlIdx+")");
							if ($a.attr("loadWin")){
								$target.tabs("select",dtlIdx);
								wgDetail=winGrpDef.contwins[dtlIdx];
								
								$celldiv=$("#"+$.page.idFunc.getWinDivID(wgDetail.innerwinno));
								$celldiv.css({height:winHeight});
								
								bodyH=winHeight-$.page.winSize.getBtnBarHeight(wgDetail.innerwinno)
									-$("#"+$.page.idFunc.getTitleid(wgDetail.innerwinno)).height()-4;  // bug 178  加了边框后，按钮的下边线会被遮挡。因此把可用高度再扣掉一点 （ -2 --> -4）
								
								$.page.winSize.resizeWin(0,top,newW,bodyH,wgDetail.innerwinno);
							}
							dtlIdx+=1;
						}
					}
					$target.tabs("select",nowidx);
				},
				grid:function(funcno,left,top,width,height){
					var wgDetail,newDivPos,newH;
					var dtlIdx=0;
					var $celldiv;
					var winGrpDef=$.WG.list[funcno];
					
					
					for(var i=1;i<=winGrpDef.rowcount;i++){
						for(var j=1;j<=winGrpDef.colcount;j++){
							// 用来支持隐藏页面tab
							wgDetail=winGrpDef.contwins[dtlIdx];
							//TODO now
							newDivPos=$.WG.sizeFuncs.getGridDivPos(winGrpDef,wgDetail);//计算td的高和宽

							$celldiv=$("#"+$.page.idFunc.getWinDivID(wgDetail.innerwinno));
							$celldiv.css({height:newDivPos.height});

							newH=newDivPos.height-$.page.winSize.getBtnBarHeight(wgDetail.innerwinno)
								-$("#"+$.page.idFunc.getTitleid(wgDetail.innerwinno)).height()-4 ;    // bug 178     -2 ->  -4
							if (newDivPos.width > 0) { // bug 273 百分比宽度单独处理
								$.page.winSize.resizeWin(newDivPos.left,newDivPos.top,newDivPos.width,newH,wgDetail.innerwinno);
							}
							else {
								var width_percent = 100 / winGrpDef.colcount;
								$.page.winSize.resizeWin(newDivPos.left,newDivPos.top,width_percent + "%",newH,wgDetail.innerwinno);
							}
							dtlIdx+=1;
						}
					}

				},
				normal:function(funcno,left,top,width,height){
					var winno=$.page.idFunc.funcno2winno(funcno);
					$.page.winSize.doWinsAlign($.page.idFunc.getWinid(winno),undefined,winno);
				}
			},
			getGridDivPos:function(winGrpDef,oneWin){
				var wh={left:0,top:0,width:0,height:0};
				var winno=$.page.idFunc.funcno2winno(winGrpDef.funcno);
				var $bodywin=$("#"+$.page.idFunc.getBodyWinid(winno));
				var headH=$("#"+$.page.idFunc.getTitleid(winno)).height();

				if (winGrpDef.custom == "Y") { // WG自定义大小
					wh.width = (oneWin.width == 0? $bodywin.width()/winGrpDef.colcount: oneWin.width);
					wh.height = (oneWin.height== 0? $bodywin.height()/winGrpDef.rowcount: oneWin.height);
					wh.top = oneWin.y;
					wh.left = oneWin.x;
				}
				else {
					var totalWidth = $bodywin.width();  
					var totalHeight = $bodywin.height();  // bug 245, 259的修改不彻底。
					if ($bodywin && $bodywin.css("width") && $bodywin.css("width").match(/[%]/)) {// 专门处理100%被识别为100px的情况  // bug 273
						if ($bodywin.parent().css("width") && !($bodywin.parent().css("width").match(/[%]/))) {
							totalWidth = $bodywin.parent().width()-5;  // BUG 416 简单设为0的话，在page.createOneWin中自动布局部分就会将win的宽度设为0，导致看不见窗口内容。现在先用parent的宽度处理一下。
						}
						else
							totalWidth = 0; 	
					}
					if (totalWidth == null) // ie8好像会得到null值。特地保护一下。
						totalWidth = 0;
					if (totalHeight == null) 
						totalHeight = 0;
					wh.width=totalWidth/winGrpDef.colcount;
					wh.height=totalHeight/winGrpDef.rowcount;
					wh.top=(oneWin.rowno-1)*wh.height+headH;
					wh.left=(oneWin.colno-1)*wh.width;
				}
				return wh;				
			}
		}
	}
})(jQuery);
