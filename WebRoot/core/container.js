;(function($){
	$.CT = $.container = {
		options:{
			containerParamURL:  $.global.functionDefinitionUrl+"?type=CT"
		},
		list:{/*{funcno:container}*/},
		runInstance: function( funcNo,options ){
			var op = $.extend({
					complete:function(){},
					allComplete:function(){},
					rowSelected:function(){},
					target:		 "main"
					
					},options);
			if($.CT.list[funcNo] == null){
				$.ajax({
					type: "POST",
					url:  $.CT.options.containerParamURL, 
					data: {funcNo: funcNo},
					dataType: "json",
					success:  function( data,textStatus ){
						var containerDef = data[0];
						containerDef.complete = op.complete;
						containerDef.allComplete = op.allComplete;
						containerDef.target=op.target;
						
						$.CT.list[funcNo] = containerDef;
						$.CT.createNew(containerDef,op.target);

					},
					error:function(e){
						$.msgbox.show("err","请求显示的功能"+funcNo+"不存在或存在定义错误：<br>"+e.responseText);
					}
				});
			}else{
				var containerDef = $.CT.list[funcNo];
				$.CT.createNew(containerDef,op.target);
			}
			return containerDef;
		},
		createNew:function(containerDef,target){
			var targetwin=$("#"+target);
			var topdivid=$.CT.idFuncs.getTopDivid(containerDef.funcno);
			var $div = $("<div id='"+topdivid+"'></div>")
			.css({width:(targetwin.width()-2),height:(targetwin.height()-2)})//,overflow:"auto"
			.appendTo(targetwin);
			if ($.CT.createSubFuncs[containerDef.layout]!=undefined)
				$.CT.createSubFuncs[containerDef.layout](containerDef,$div);
			
			if(typeof(containerDef.complete) == "function")
				containerDef.complete();
			if(typeof(containerDef.allComplete)=="function")
				containerDef.allComplete();
		},
		createSubFuncs:{
			grid:function(containerDef,target){
				var targetwin=target;
				var tabid=$.CT.idFuncs.getTableID(containerDef.funcno),cellid,celldivid;
				var tabstr="<table width='100%' height='100%' border='1' cellpadding='0' cellspacing='0' id='"
				          +tabid+"' bordercolor='#BDD6ED'>";
				var cellid,dtlIdx=0,tdWH;
				var ctDetail;
				for(var i=1;i<=containerDef.rowcount;i++){
					tabstr+="<tr>";
					for(var j=1;j<=containerDef.colcount;j++){
						ctDetail=containerDef.contfuncs[dtlIdx];
						cellid=$.CT.idFuncs.getCellID(containerDef.funcno,i,j);
						celldivid=$.CT.idFuncs.getCellDivID(containerDef.funcno,i,j);
						
						tdWH=$.CT.sizeFuncs.gettdWidthHeight(ctDetail);//计算td的高和宽
						
						tabstr+="<td id='"+cellid+"' width='"+tdWH.width+"px' height='"+tdWH.height+"px' "
						       +"style='padding-left:"+ctDetail.padleft+"px; padding-top:"+ctDetail.padtop+"px;"
						       +"       padding-bottom:"+ctDetail.padbottom+"px;padding-right:"+ctDetail.padright+"px'>";
						
						tabstr+="<div id='"+celldivid+"' style='width:"+(tdWH.width-3)+"px;height:"+(tdWH.height-3)+"px;overflow-x: auto; overflow-y: hidden;'></div>";
						
						tabstr+="</td>";
						dtlIdx+=1;
					}
					tabstr+="</tr>";
				}
				tabstr+="</table>";
				targetwin.append($(tabstr));
				
				var func;
				var dtlIdx=0;
				var ctDetail;
				var celldivid;
				for(var i=1;i<=containerDef.rowcount;i++){
					for(var j=1;j<=containerDef.colcount;j++){
						ctDetail=containerDef.contfuncs[dtlIdx];
						celldivid=$.CT.idFuncs.getCellDivID(containerDef.funcno,i,j);
						
						func = $[ctDetail.functype];
						if (func!=undefined)
							func.runInstance(ctDetail.funcno,{target:celldivid,inContainer:true});	
						dtlIdx+=1;
					}
				}
			},
			page:function(containerDef,target){
				var ulid=$.CT.idFuncs.getPagerUlID(containerDef.funcno);
				$("<ul id='"+ulid+"'></ul>").appendTo(target);
				target.tabs();
				
				var func;
				var dtlIdx=0;
				var ctDetail;
				var pagerid,pagerdivid;
				var mcH=target.height();
				for(var i=1;i<=containerDef.rowcount;i++){
					for(var j=1;j<=containerDef.colcount;j++){
						ctDetail=containerDef.contfuncs[dtlIdx];
						pagerid=$.CT.idFuncs.getPagerID(containerDef.funcno,dtlIdx);
						pagerdivid=$.CT.idFuncs.getPagerDivID(containerDef.funcno,dtlIdx);
						target.tabs("add",
								    "#"+pagerid,
								    _cutStr(ctDetail.funcname,6,"..."),
								    dtlIdx);
					    target.tabs("select",dtlIdx);
					    if (dtlIdx==0)
					    	mcH-=$("#"+ulid).height()+4;
					    
					    var $div = $("<div id='"+pagerdivid+"'></div>")
						.css({width:target.width()-2,height:mcH,overflow:"hidden",position:"absolute"})
						.appendTo($("#"+pagerid));
						
					    func = $[ctDetail.functype];
						if (func!=undefined)
							func.runInstance(ctDetail.funcno,{target:pagerdivid,inContainer:true});	
						dtlIdx+=1;
					}
				}
				if (dtlIdx>0)
					target.tabs("select",0);
			}
		},
		resizeWin:function(funcno,left,top,width,height){
			var containerDef = $.CT.list[funcno];
			var $topdiv=$("#"+$.CT.idFuncs.getTopDivid(funcno));
			$topdiv.css({'width':(width-2)+'px','height':(height-2)+'px'});
			if (this.sizeFuncs.resizeRealType[containerDef.layout]!=undefined)
				this.sizeFuncs.resizeRealType[containerDef.layout](funcno,left,top,width,height);

		},
		refresh:function(funcno, filter){},//container暂时不受影响
		check:function(funcno){},//container暂时无check
		idFuncs:{
			getTopDivid:function(funcno){
				return "ct_topdiv"+funcno;
			},
			getTableID:function(funcno){
			    return "ct_table_"+funcno;
			},
			getCellID:function(funcno,row,col){
				return "ct_cell_"+row+"_"+col;
			},
			getCellDivID:function(funcno,row,col){
				return "ct_cell_div_"+row+"_"+col;
			},
			getPagerID:function(funcno,idx){
				return "ctPager_"+funcno+"_"+idx;
			},
			getPagerDivID:function(funcno,idx){
			    return "ctPagerDiv"+funcno+"_"+idx;
			},
			getPagerUlID:function(funcno){
				return "ct_ul_"+funcno;
			}
		},
		sizeFuncs:{
			resizeRealType:{
				page:function(funcno,left,top,width,height){
					var func,ctDetail;
					var dtlIdx=0;
					var ulid=$.CT.idFuncs.getPagerUlID(funcno);
					var newH=height-$("#"+ulid).height()-4;
					var newW=width-2;
					var containerDef=$.CT.list[funcno];
					
					for(var i=1;i<=containerDef.rowcount;i++){
						for(var j=1;j<=containerDef.colcount;j++){
							ctDetail=containerDef.contfuncs[dtlIdx];
							pagerdivid=$.CT.idFuncs.getPagerDivID(funcno,dtlIdx);
							
							$("#"+pagerdivid).css({width:newW,height:newH});
							
							func = $[ctDetail.functype];
							if (func!=undefined&&func.resizeWin!=null)
								func.resizeWin(ctDetail.funcno,0,0,newW,newH);	
							dtlIdx+=1;
						}
					}
				},
				grid:function(funcno,left,top,width,height){
					var $tab=$("#"+$.CT.idFuncs.getTableID(funcno));
					var func,ctDetail,tdLT;
					var dtlIdx=0;
					var $cell,$celldiv,newH,newW;
					var containerDef=$.CT.list[funcno];
					
					for(var i=1;i<=containerDef.rowcount;i++){
						for(var j=1;j<=containerDef.colcount;j++){
							ctDetail=containerDef.contfuncs[dtlIdx];
							tdLT=$.CT.sizeFuncs.gettdLeftTop(funcno,ctDetail);//计算td的高和宽
							$celldiv=$("#"+$.CT.idFuncs.getCellDivID(containerDef.funcno,i,j));
							$cell=$("#"+$.CT.idFuncs.getCellID(funcno,i,j));
							
							newW=$cell.width();
							newH=$cell.height();
							$celldiv.css({"width":newW+"px","height":newH+"px","left":tdLT.left+"px","top":tdLT.top+"px","position":"absolute"});
							
							func = $[ctDetail.functype];
							if (func!=undefined&&func.resizeWin!=null)
								func.resizeWin(ctDetail.funcno,0,0,newW,newH);	
							dtlIdx+=1;
						}
					}
				}
			},
			gettdWidthHeight:function(oneFunc){
				var wh={width:0,height:0};
				wh.width=oneFunc.width+oneFunc.padleft+oneFunc.padright;
				wh.height=oneFunc.height+oneFunc.padtop+oneFunc.padbottom;
				
				return wh;				
			},
			gettdLeftTop:function(funcno,oneFunc){
				var lt={left:0,top:0};
				var winno=$.page.idFunc.funcno2winno(funcno);
				//var winid=$.page.idFunc.getWinid(winno);
				var winheadid=$.page.idFunc.getTitleid(winno);
				var $cell=$("#"+$.CT.idFuncs.getCellID(funcno,oneFunc.rowno,oneFunc.colno));
				lt.top=$.getElementHeight(winheadid)+$cell[0].offsetTop+4;
				lt.left=$cell[0].offsetLeft+1;
				return lt;
			}
		}
	}
})(jQuery);
