//drilltable和chart上面加了一层
;(function($){
	$.DC = $.drillChart = {
    	op:{
    		hrParamURL:$.global.functionDefinitionUrl+"?type=DC",
    		ORD_LEN:4
    	},
    	list:{},
    	runInstance:function(funcNo,options){
    		var op = $.extend({complete:function(){}},
    						  options);
    		if( $.drillChart.list[funcNo] )
    			$.drillChart.list[funcNo]=null;
			$.ajax({
				url:$.drillChart.op.hrParamURL+"&userRole="+$.UC.bindData("#0-USERINFO.USERROLE#").trim(),
				type:"POST",
				dataType:"json",
				data:{funcNo:funcNo},
				success:function( data ){
					var dcDef = data;
					$.drillChart.list[ funcNo ] = dcDef ;
					dcDef.complete=op.complete;
					$.drillChart.createNew( dcDef,funcNo,options.target );
				},
				error:function(e,textStatus){
					$.msgbox.show( "err", e.responseText +":"+textStatus);
				}
			})
    	},
    	createNew:function( dcDef,funcno, target ){
    		$("#"+target).empty();
    		dcDef.funcno=funcno;
    		dcDef.target=target;
    		$.DC.createRegion(funcno,target);
    		$.DC.loadViews(dcDef,target);
    		if(typeof(dcDef.complete) == "function")
    			dcDef.complete();
    	},
    	loadViews:function(dcDef,target){
    		var views=dcDef;
    		var funcno=dcDef.funcno;
    		$tgt=$("#"+target);
    		//获取视图的数量
    		dcDef.viewCnt=0;
    		$.each(views,function(i){
    			var v = views[i]; 
    			if (v.viewname!=undefined)
    				dcDef.viewCnt+=1;
    		});
    		
    		$("#"+$.DC.getTitleDivbytarget(target)).remove();
    		
    		var $li;
    		var viewgrp=[];
    		$.each(views,function(i){
    			var v = views[i];
    			if (v.showgroup!=""&&v.showgroup!=null){
    				if(viewgrp[v.showgroup]==undefined)
    					viewgrp[v.showgroup]={views:v.lpord+v.viewno,minX:v.xpos==null?0:v.xpos,grpTitle:v.viewname,viewtype:'default'};
    				else{
    					viewgrp[v.showgroup].views+=","+v.lpord+v.viewno;
    					if (v.xpos!=null&& viewgrp[v.showgroup].minX>v.xpos){
    						viewgrp[v.showgroup].minX=v.xpos;
    						viewgrp[v.showgroup].grpTitle=v.viewname;
    					}
    				}
    				if (v.viewtype!='default')
    					viewgrp[v.showgroup].viewtype=v.viewtype;
    			}
    		});
    		
    		//对viewgrp中的views按照view的ord进行排序
    		var sViews,arViews;
    		for (var i=0;i<viewgrp.length;i++){
    			if (viewgrp[i]==undefined)
    				continue;
    			arViews=viewgrp[i].views.split(',');
    			//前面补0，防止出现不同位排序不对的情况
    			arViews.sort();
    			sViews="";
    			for (var j=0;j<arViews.length;j++)
    				sViews+=','+arViews[j].substring($.DC.op.ORD_LEN,arViews[j].length);
    			sViews=sViews.substring(1,sViews.length);
    			viewgrp[i].views=sViews;
    		}
    		
    		//对viewgrp和非group的view遍历一把，生成leftViewList
    		var leftViewList={};
    		
    		//生成tabs
    		//先对所有的viewgrp生成tab
    		var $ul=$("#"+$.DC.getRegionNavID(funcno));
    		var $tab=$("#"+$.DC.getRegionID(funcno));
    		for(var i=0;i<viewgrp.length;i++){
    			if (viewgrp[i]!=undefined){
    				var grpTitle=viewgrp[i].grpTitle;
    				    var title=grpTitle;
						$li = $("<li showgroup='"+i+"' views='"+viewgrp[i].views+"' title='"+grpTitle+"'><a href='#"+$.DC.getRegionScreenID(funcno)+"'>"+title+"</a></li>");
						$li.appendTo($ul);
						
						var viewtype=viewgrp[i].viewtype;
						if (leftViewList[viewtype]==undefined){
							leftViewList[viewtype]=[];
						}
						var leftItemType=leftViewList[viewtype];
						leftItemType.push({
									"isGroup":true,
									"showgroup":i,
									"views":viewgrp[i].views,
									"title":grpTitle,
									"grpTitle":grpTitle,
									"href":"#"+$.DC.getRegionScreenID(funcno)
								});
    			}
    		}
    		//再对所有的非group显示的view生成tab
    		$.each(views,function(i){
    			var v = views[i]; 
    			if (v.viewname!=undefined){//因为拼了一个funcno在里面
    				if (v.def["T"] && v.def["T"].srcFuncno==undefined)
        				v.def["T"].srcFuncno=v.def["T"].funcno;
    				if (v.showgroup==null){
		    			v.viewname=$.UC.parser(v.viewname);
		    			var title = v.viewname;
		    			$li = $("<li cond=\"" + v.cond + "\" viewname='" + v.viewname + "' viewno='"+i+"' title='"+v.viewname+"'><a href='#"+$.DC.getRegionScreenID(funcno)+"'>"+title+"</a></li>");
		    			$li.appendTo( $ul )
			    				 .dblclick(function(){})
    				}
    				
    				var viewtype=v.viewtype;
    				if (leftViewList[viewtype]==undefined){
							leftViewList[viewtype]=[];
						}
						var leftItemType=leftViewList[viewtype];
						leftItemType.push({
									"isGroup":false,
									"cond":v.cond,
									"viewname":v.viewname,
									"viewno":i,
									"title":v.viewname,
									"href":"#"+$.DC.getRegionScreenID(funcno)
								});
    			}
    		})
    			
    		
				var navID =$.DC.getRegionNavID(funcno);
    			var $nav=$("#"+navID);
				var scrId =$.DC.getRegionScreenID(funcno);
				$tab.tabs({
	    				show:function(evt,ui){
	    					var viewno = $( $("#"+navID+">li")[ ui.index ] ).attr("viewno");
	    					var grpViews=$( $("#"+navID+">li")[ ui.index ] ).attr("views");
	    					$.DC.showView(views,viewno,grpViews,scrId);
	
	    				}
	    	});
	    	
		    //////$.DC.adjustTabs($tab,false);
				//如果没有折行的话，就不需要显示两个箭头了
				if ($nav.find("li:visible:last").length>0){
					if($nav.find("li:visible:last").offset().top<=130){
						$nav.find(".moreOpBtn").css({'visibility':'hidden'});
					}
				}
				
    		//生成左边的view以及控制	
    		var $viewlist=$("#"+$.DC.getViewListID(funcno)+" #viewlist");
    		
    		$.each(leftViewList,function(viewtype){
    			var oneDef=leftViewList[viewtype];
    			viewtype=viewtype=="default"?"默认分组":viewtype;
    			var grpViews="",liAttr=""
    			var oneViewDef;
    			for(var i=0;i<oneDef.length;i++){
    				oneViewDef=oneDef[i];
    				if (oneViewDef.isGroup)
    					liAttr = "showgroup='"+oneViewDef.showgroup+"' views='"+oneViewDef.views+"' title='"+oneViewDef.grpTitle+"'";
    				else
    					liAttr = "cond='" + oneViewDef.cond + "' viewname='" + oneViewDef.viewname + "' viewno='"+oneViewDef.viewno+"'"
    									+" title='"+oneViewDef.viewname+"'";
    				grpViews+="<li class='ui-state-default ui-corner-all'  "+liAttr+">"
										 +"	<span style='float:left;' class='ui-icon ui-icon-calculator'></span>"
										 +"	<span style='float:left'>"+oneViewDef.title+"</span>"
										 +"</li>";
    			}
    			
    			var $oneGrp=$("<div class='viewgrp'>"
											 +"	<h3><a href='#'>"+viewtype+"</a></h3>"
											 +" <div>"
											 +" 	<ul class='ui-sortable' style='list-style-type: none'>"
											 +			grpViews
											 +" 	</ul>"
											 +" </div>"
											 +"</div>");
    			if (viewtype=="默认分组"){
    				var $firstgrp=$viewlist.find("div[class=viewgrp]:first");
    				if ($firstgrp.length!=0)
    					$firstgrp.before($oneGrp);
    				else
    					$viewlist.append($oneGrp);
    			}else
    				$viewlist.append($oneGrp);
    			
    		});
    		
    		var $lis=$viewlist.find("li");
    		$lis.css({"float":"left","height":"18px","padding":"2px","margin-top":"2px","width":"220px","margin-left":"-20px","cursor": "pointer"})
    			.click(function(){
    				//J:判断是否已经有了这个tab
    				//1.1.如果已经有了:看看是否已经是have class:ui-tabs-selected
    				//    1.1.1.如果已经显示了，什么都不用干
    				//    1.1.2.如果尚未显示，tab(select,idx)
    				//1.2.如果没有这个tab的话，看看tab的长度是否足够。enoughplace
    				//    1.2.1.如果没有足够空间的话,删除第一个
    				//    增加一个tab,并且选中
    				$lis.removeClass("ui-state-active");
    				$(this).addClass("ui-state-active");
    				var viewno=$(this).attr('viewno')==undefined?$(this).attr('views'):$(this).attr('viewno');
    				var $li;
    				var tabIdx=$.DC.findTabIdx(funcno,viewno)
    				
    				if (tabIdx>=0){//1.1
    					$li=$ul.find("li:eq("+tabIdx+")");
    					if (!$li.hasClass("ui-tabs-selected"))//1.1.2.
    						$tab.tabs("select",tabIdx);
    				}else{//1.2.
    					if (!$.DC.enoughTabSpace(funcno)){
					    	var selTabIdx=$tab.tabs('option', 'selected');
					    	$tab.tabs("remove",selTabIdx==0?1:0);
					    }
    					//增加一个tab，并且选中
    					$tab.tabs('add',"#"+$.DC.getRegionScreenID(funcno),$(this).attr("title"),$ul.find("li").length);
    					$li=$ul.find("li:last");
    					if ($(this).attr("viewno")==undefined)//group
    						$li.attr({
    							showgroup:$(this).attr("showgroup"),
    							views:$(this).attr("views"),
    							title:$(this).attr("title")
    						});
    					else
    						$li.attr({
    							cond:$(this).attr("cond"),
    							viewname:$(this).attr("viewname"),
    							viewno:$(this).attr("viewno"),
    							title:$(this).attr("title")
    						});
    					var selTabIdx=$tab.tabs('option', 'selected');
    					$li=$ul.find("li:eq("+selTabIdx+")"); 
    					$li.removeClass("ui-tabs-selected ui-state-active").addClass("ui-state-default");
					    $tab.tabs("select",$ul.find("li").length-1);
    				}
    				
    		});
    		if ($viewlist.length>0)
    			$viewlist.accordion({ header: "h3",fillSpace: true});
    		viewgrp.length=0;
    	},
    	//整理过长的ul
    	adjustTabs:function($tab,moveFirst){
    		var $ul=$tab.find("ul:first");
    		while ($ul.height()>40){
    			if(moveFirst)
    				$tab.tabs('remove',0);
    			else
    				$tab.tabs('remove',$ul.find("li").length-1);
    		}
    	},
    	//判断还够不够tab空间
    	enoughTabSpace:function(funcno){
    		var $ul=$("#"+$.DC.getRegionNavID(funcno));
    		var $lis=$ul.find("li");
    		var totW=$ul.width();
    		for(var i=0;i<$lis.length;i++){
    			totW-=$($lis[i]).width();
    		}
    		return totW>100;
    	},
    	findTabIdx:function(funcno,viewno){
    		result=-1;
    		var $lis=$("#"+$.DC.getRegionNavID(funcno)+" li")
    		var $li;
    		for(var i=0;i<$lis.length;i++){
    			$li=$($lis[i]);
    			if ($li.attr('viewno')==viewno||$li.attr('views')==viewno){
    				result=i;
    				break;
    			}
    		}
    		return result;
    	},
    	//创建左边的视图列表
    	createLeftViewList:function(funcno,$target){
    		var VIEW_LIST_WIDTH=250;
    		var $viewList=$( 
    						 "<div id=>" 
    						+"	<h3 class='ui-widget-header ui-corner-all' style='text-align:center'>"
    						+"   	<div class='ui-dialog-title' style='padding:5px;height:18px'>"
    						+"			<span style='float:left' class='ui-icon ui-icon-bookmark'></span>"
    						+"			<span style='float:left'> 视图列表</span>"
    						+"   		<span style='float:right;cursor: pointer' class='ui-icon ui-icon-circle-arrow-w' id='btn'></span>"
    						+"		</div>"
    						+" </h3>"
    						+"	<div id='viewlist'>              "
								+"	</div>"             
    						+"</div>").attr("id",$.DC.getViewListID(funcno))
    					.css({
    					   "float":"left",
    					   "width":(VIEW_LIST_WIDTH-1)+"px",
    					   "height":($target.height()-35)+"px"
    				   }).appendTo( $target );
    		$viewList.find("li").css({"float":"left",
    															"height":"18px",
    															"padding":"2px",
    															"margin-top":"2px",
    															"width":"190px",
    															"margin-left":"2px"})
    		var $btn=$viewList.find("#btn");
    		$.addHint($btn,"收起视图列表");
    		$btn.click(function(){
    			$("#tiptip_holder").css("display","none");
    			$viewList.animate({width:0},500);
    			var $reg=$("#"+$.DC.getRegionID(funcno));
    			var $tab=$("#"+$.DC.getRegionID(funcno));
    			var selTabIdx=$tab.tabs('option', 'selected');
    			var $li=$tab.find("li:eq("+selTabIdx+")");
    			var $ul=$tab.find("ul:first");
    			
    			var newWidth=$reg.width()+VIEW_LIST_WIDTH;
    			$reg.animate({width:newWidth},500);
    			$ul.animate({width:newWidth-2},500);
    			setTimeout(function(){
						if ($li.attr("viewno")!=undefined)
    				$.E.resizeWin(funcno+"_"+$li.attr("viewno"),0,0,newWidth,$reg.height()-30);}
    				,510);
    			//再加上一个重新展开的按钮
    			$spanExpand=$("<span style='float:right;margin-top:5px;cursor: pointer' class='ui-icon ui-icon-circle-arrow-e'></span>")
    									.appendTo($($ul[0]))
    									.click(function(){
    										$("#tiptip_holder").css("display","none");
    										$viewList.animate({width:VIEW_LIST_WIDTH-1},500);
    										var selTabIdx=$tab.tabs('option', 'selected');
							    			var $li=$tab.find("li:eq("+selTabIdx+")");
							    			var $ul=$tab.find("ul");
							    			
							    			var newWidth=$reg.width()-VIEW_LIST_WIDTH;
							    			$reg.animate({width:newWidth},500);
							    			$ul.animate({width:newWidth-2},500);
							    			setTimeout(function(){
							    				if ($li.attr("viewno")!=undefined)
							    					$.E.resizeWin(funcno+"_"+$li.attr("viewno"),0,0,newWidth,$reg.height()-30);
							    			},510);
												if ($li.attr("viewno")!=undefined)
							    				$.E.resizeWin(funcno+"_"+$li.attr("viewno"),0,0,newWidth,$reg.height()-30);
							    			$(this).remove();
    									});
    			$.addHint($spanExpand,"展开视图列表");
    		});												
    	},
    	//创建区域
    	createRegion:function(funcno,target){
    		var VIEW_LIST_WIDTH=0;//////250;
    		var regID=$.DC.getRegionID(funcno);
    		var navID=$.DC.getRegionNavID(funcno);
    		var scrID=$.DC.getRegionScreenID(funcno);
    		var $target=$("#"+target);
    		///$$$///$.DC.createLeftViewList(funcno,$target);
    		var $reg = $("<div></div>").attr("id",regID)
    					.addClass("view_region")
    				   .css({
    					   "float":"left"
    				   }).appendTo( $target );
    		var tabsgo=function($nav,lr){
			    if (lr){  
			    	  var lastidx;
			        if($nav.find("li:visible:last").offset().top>130){
			        	var $visLi=$nav.find("li:visible");
			        	for(var i=0;i<$visLi.length;i++){
			        		if ($($visLi[i]).offset().top>130){
			        			lastIdx=i;
			        			break;
			        		}
			        	}
			        	$nav.find("li:visible:lt("+lastIdx+")").hide();
			        }else
			        	$.msgbox.show( "msg", "已经是最后一个视图！" );
			    }  
			    else  
			    	if($nav.find("li:visible:first")[0]==$nav.find("li:first")[0])
			    		$.msgbox.show( "msg", "已经是第一个视图！" );
			    	else{
			    		var $visibleFirst=$nav.find("li:visible:first");
			    		while($nav.find("li:hidden").length!=0&&$visibleFirst.offset().top<=130){
			    			$nav.find("li:hidden:last").show();
			    		}
    			  } 
    		}
    		var $nav = $("<ul>"
    		            +"	<span class='moreOpBtn ui-icon ui-icon-circle-triangle-e'  style='float:right;margin: 6px 4px;cursor: pointer'></span>"  
    		            +"	<span class='moreOpBtn ui-icon ui-icon-circle-triangle-w' style='float:right;margin: 6px 4px;cursor: pointer'></span>"  
    					+"</ul>").attr("id",navID).css({width:$target.width()-4-VIEW_LIST_WIDTH,height:'27px','overflow':'hidden'})
    					.appendTo( $reg );
    		$nav.find("span:eq(0)").click(function(){
    			tabsgo($nav,1);
    		});
    		$nav.find("span:eq(1)").click(function(){
    			tabsgo($nav,0);
    		});
    		var $screen = $("<div id='"+scrID+"' style='width:"+($target.width()-1-VIEW_LIST_WIDTH)+"px;"
    		               +"height:"+($target.height()-30)+"px;overflow:hidden;'></div>").appendTo( $reg );
			
    		return $reg;
    		
    	},
    	refresh:function(funcno,filter){
    		var rgIdx=1,tabIdx;
    		var views=$.DC.list[funcno];
    		tabIdx=$("#"+$.DC.getRegionID(funcno)).tabs('option', 'selected');
    		if (tabIdx==0){
    			var navID =$.DC.getRegionNavID(funcno);
				var scrId =$.DC.getRegionScreenID(funcno);
					
				var viewno = $( $("#"+navID+">li")[ tabIdx ] ).attr("viewno");
				var grpViews = $( $("#"+navID+">li")[ tabIdx ] ).attr("views");
				$.DC.showView(views,viewno,grpViews,scrId);
    		}else
    			$("#"+$.DC.getRegionID(funcno)).tabs("select",0);
    	},
    	parseAbsg2Abs:function(maxRow,maxCol,arGrpViews,views,$target){
    		var colW=$target.width()/maxRow-2,colH=$target.height()/maxCol-2;
    		var view;
    		for(var i=0;i<arGrpViews.length;i++){
    			view=views[arGrpViews[i]];
    			if (view.postype=="absg"){
    				view.xpos =(view.xpos-1)*colW;
    				view.ypos =(view.ypos-1)*colH;
    				view.xspan=view.xspan*colW-1;
    				view.yspan=view.yspan*colH-1;
    				view.postype="abs";
    			}
    		}
    	},
    	parseGrid2Abs:function(dcXspan,dcYspan,arGrpViews,views,$target){
    		var MAX_LEN=30;//认为最大有30个行了不起了
    		var getFixPos=function(arPosMatrix,xspan,yspan){
    			for(var i=0;i<MAX_LEN;i++)
    				for(var j=0;j<dcXspan;j++){
    					if (arPosMatrix[i][j]==0&&dcXspan-j>=xspan){//有一个空位
    						var enoughPlace=true;
    						for(var iRow=i;iRow<i+yspan;iRow++){
    							for(var jCol=j;jCol<j+xspan;jCol++){
    								if (arPosMatrix[iRow][jCol]!=0){
    									enoughPlace=false;
    									break;
    								}
    							}
    							if (!enoughPlace)
    								break;
    						}
    						if (enoughPlace){
    							var fixPos={xpos:j+1,ypos:i+1,xspan:xspan,yspan:yspan};
    							//设置占位情况
    							for(var ii=fixPos.ypos-1;ii<fixPos.ypos-1+yspan;ii++)
    		        				for(var jj=fixPos.xpos-1;jj<fixPos.xpos-1+fixPos.xspan;jj++)
    		        					arPosMatrix[ii][jj]=1;
    							return fixPos;
    						}
    					}
    				}	
    		};
    		var createPosMatrix=function(dcXspan,dcYspan){
    			var arPosMatrix=new Array();
    			for(var i=0;i<MAX_LEN;i++){
    				arPosMatrix[i]=new Array();
    				for(var j=0;j<dcXspan;j++)
    					arPosMatrix[i][j]=0;//1表示被占了
    			}
    			return arPosMatrix;
    		};
    		var colW=$target.width()/dcXspan,colH=$target.height()/dcYspan;
    		var xOcup=1,yOcup=1;
    		var view;
    		var arPosMatrix=createPosMatrix(dcXspan,dcYspan);
    		var fixPos;
    		for(var i=0;i<arGrpViews.length;i++){
    			view=views[arGrpViews[i]];
    			//1.先找到位置
    			fixPos=getFixPos(arPosMatrix,view.xspan,view.yspan);
    			//2.再转变为绝对坐标
    			if (view.postype=="grid"){
    				view.xpos =(fixPos.xpos-1)*colW;
    				view.ypos =(fixPos.ypos-1)*colH;
    				view.xspan=fixPos.xspan*colW-1;
    				view.yspan=fixPos.yspan*colH-1;
    				view.postype="abs";
    			}
    		}
    		//释放数组
    		for(var i=0;i<MAX_LEN;i++){
    			arPosMatrix[i].length=0;
			}
    		arPosMatrix.length=0;
    		
    	},
    	showViewGrp:function(views,grpViews,$target){
    		var $srcDiv=$("#"+$.DC.getRegionScreenID(views.funcno));
    		$srcDiv.height($srcDiv.height()-30);
    		var arGrpViews=grpViews.split(",");
    		var view,showStyle="abs";
    		var maxRow=0,maxCol=0;//这两个变量给absg形式用
    		var dcXspan,dcYspan;//这两个变量给grid形式用
    		
    		//1.如果定位是grid形式的话，需要计算出最大的col和row
    		for(var i=0;i<arGrpViews.length;i++){
    			view=views[arGrpViews[i]];
    			if (view.postype=="absg"){
    				showStyle="absg";
    				maxRow=Math.max(maxRow,view.xpos+view.xspan-1);
    				maxCol=Math.max(maxCol,view.ypos+view.yspan-1);
    			}else if (view.postype=="grid"){
    				showStyle="grid";
    				dcXspan=view.dcxspan;
    				dcYspan=view.dcyspan;
    				if (arGrpViews.length==views.viewCnt){//只有一组grid的话，头上的tab去掉；并且做一些位置的调整
    					$("#"+$.DC.getRegionNavID(views.funcno)).remove();
    					var $rs=$("#"+$.DC.getRegionScreenID(views.funcno));
    					$rs.height($rs.height()+30);
    					views.showStyle="grid";
    				}
    				break;
    			}
    		}
    		if (views.showStyle=="grid"){
    			$("#"+$.DC.getRegionNavID(views.funcno)).remove();
				var $rs=$("#"+$.DC.getRegionScreenID(views.funcno));
				$rs.height($rs.height()+30);
				$("#"+$.page.idFunc.getWinDivID(views.funcno)).css({
					"border-color":"none",
					"padding":"0px",
					"border-width":"0px"
				});
    		}
    		//2.如果定位是grid,absg的话，将坐标转为abs坐标
    		if (showStyle=="absg")
    			$.DC.parseAbsg2Abs(maxRow,maxCol,arGrpViews,views,$target);
    		else if (showStyle=="grid")
    			$.DC.parseGrid2Abs(dcXspan,dcYspan,arGrpViews,views,$target);
    		
    		//3.开始画每一个view
       		var maxH=0;
    		for(var i=0;i<arGrpViews.length;i++){
       			view=views[arGrpViews[i]];
       			var funcv=views.funcno+"_"+view.viewno;
       			var divid="viewGrpCont_"+funcv;
       			var topGap=views.showStyle=="grid"?0:30;
    			var $viewDiv =$("<div style='position:absolute'></div>").attr("id",divid)
							.css({"left":view.xpos,"top":view.ypos+topGap,width:view.xspan,height:view.yspan})
							.appendTo($target);
    			maxH=Math.max(maxH,view.ypos+topGap+view.yspan);
    			$.DC.showOneView(views.funcno,views[arGrpViews[i]],$viewDiv,divid,true);
    		}
    		if (maxH>$target.height()+20)
    			$target.height(maxH);
    	},
    	
    	showOneView:function(funcno,view,$target,targetid,gridShow){
			var cond=view.cond;
    		var viewname=view.viewname;
    		var screenid=targetid;
    		if (screenid==undefined)
    			screenid=$target.selector.substring(1);
    		var viewno=view.viewno;
    		if (funcno==undefined){
					funcno=9999;
				}
    		
    		if (cond==undefined)
    			cond="";
    		var navH=22;
    		var funcv=funcno+"_"+viewno;
    		var viewCID=$.E.idFuncs.getViewCID(funcv);
    		var viewTID=$.E.idFuncs.getViewTID(funcv);
    		if (view.def["H"]){//htmlReport
    			var funcno=view.def["H"].funcno;;
    			var $viewC =  $("<div style='overflow:auto'></div>").attr("id",viewCID)
    			.height($target.height()-2)
    			.width($target.width())
    			.appendTo($target);
    			$.H.runInstance(view.def["H"].unirepid,{target:viewCID,realVals:view.def["H"].realvals,viewname:view.viewname});
    		}else{
			    view.def["T"].$target=$target;
				view.def["T"].gridShow=gridShow;
    			var DtoolID=$.E.idFuncs.getDToolID(funcv);
    			if (view.def["T"].srcFuncno==undefined)
						view.def["T"].srcFuncno=view.def["T"].funcno;
    			var tplFuncno = view.def["T"].srcFuncno;
    			if (view.def["C"])
    				view.def["C"].funcno=funcno;
    			
    			var $ul;
    			if (gridShow)
    				$ul=$("<div class='ui-state-default' style='height:28px;background-color:white'><ul id='"+DtoolID+"'></ul><div style='padding-top:3px;text-align: center'>"+view.viewname+"</div><div>");
    			else
    				$ul=$("<div class='ui-state-default' style='height:28px;background-color:white'><ul id='"+DtoolID+"'></ul><div>");	
    				
				
				
				if(view.def["C"]&&!(view.def["T"]&&view.def["T"].tablechart==$.E.CONST.TABCHART_TABLE)){//有图有表或是图表皆有的情况
    				if (view.def["T"]&&view.def["T"].tablechart==undefined)
    					view.def["T"].tablechart=$.E.CONST.TABCHART_ALL;
    				var defT=view.def["T"]&&view.def["T"].tablechart==$.E.CONST.TABCHART_ALL;
    				var divCnt=defT?2:1;
    				if(view.layout==0){
    					$ul.appendTo($target);
    					var $viewC =  $("<div layout=0></div>").attr("id",viewCID)
    						.height(($target.height()-navH)/divCnt)
    						.width($target.width())
    						.appendTo($target);
    				
    					var $viewT = $("<div></div>").attr("id",viewTID)
    						.height(defT?($target.height()-navH)/2:0)
    						.width(defT?$target.width():0)
    						.appendTo($target);
    				}else{
    					$ul.appendTo($target);
    					var $viewT = $("<div></div>").attr("id",viewTID)
    						.height(defT?$target.height()-navH:0)
    						.width(defT?$target.width()/2:0)
    						.appendTo($target)
    						.css("float","left");
    				
    					var $viewC =  $("<div layout=1></div>").attr("id",viewCID)
    						.height($target.height()-navH+2)
    						.width($target.width()/divCnt)
    						.appendTo($target)
    						.css("float","right");
    				}
    				if (!defT){//如果是仅仅只有图的话
    					$("#"+viewTID).css("visibility","hidden");
    				} 
    				if (!view.def["T"]){//老的仅仅图的版本
    					view.def["C"].sql=$.UC.parser(view.def["C"].sql);
    					$.D.list[funcno] = view.def["C"];
    					$.D.runInstance(funcno,{target:viewCID});
    				}else{
						$.E.list[funcv] = view.def["T"];
						$.E.list[funcv].chartDef=view.def["C"];
						$.E.runInstance(funcv,{target:viewTID,tplFuncno:tplFuncno,viewno:viewno,viewname:view.viewname,cond:cond});
    				}
				}else if (view.def["T"]){
					view.def["T"].tablechart=$.E.CONST.TABCHART_TABLE;
    			
					$ul.appendTo($target);
					$.E.list[funcv] = view.def["T"];
					if (view.def["C"])
						$.E.list[funcv].chartDef=view.def["C"];
					$.E.runInstance(funcv,{target:screenid,tplFuncno:tplFuncno,viewno:viewno,viewname:view.viewname,cond:cond});
    			}
    		}
    	},
    	showView:function (views,viewno,grpViews,screenid){
    		var $sn = $("#"+screenid).empty();
    		if (viewno==undefined&&grpViews!=undefined){
    			$.DC.showViewGrp(views,grpViews,$sn);
    		}else{
    			var view = views[ viewno ];
    			$.DC.showOneView(views.funcno,view,$sn,undefined,false)
    		}
    	},
    	getTitleDivbytarget:function(target){
			var al=target.split("body_win");
			return "win"+al[1]+"_head";
		},
		getRegionID:function(funcno){
			return "region_1_"+funcno;
		},
		getRegionNavID:function(funcno){
			return "region_1_"+funcno+"_nav";
		},
		getRegionScreenID:function(funcno){
			return "region_1_"+funcno+"_screen";
		},
		getViewListID:function(funcno){
			return "dc_viewlist_"+funcno;
		}
	}
})(jQuery)