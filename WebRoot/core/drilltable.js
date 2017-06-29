/*一些全局变量说明
	drillDef.lastRow:是表头的二维数组，中每个cell的说明(json):
			{
				title:"XXX",//列名
				sum:true/false,//是否为合计列
				spantype:R/C,//rowspan/colspan
				span:X,//跨越多少个格子
				
				itemidx:X,//哪个计算项(items),实体列有效
				hide:true/false//是否显示,实体列有效
				displayFmt:led/txt/pbar
				dispExpr:XXXX
			}
			
	2.drillDef.sumAffect中的每一个元素(json):下例表示1,2,3sum到0列上
			{
				upperfield:0,
				fields:1,2,3
			}
			
	3.drillDef.lastItems:
			{
				realidx		:i,
				itemidx		:itemidx
			}
	
	4.resetThead过程中用到的变量arHeadTitleMatrix是表头的二维数组，中每个cell的说明(json):
			{
				title:"XXX",//列名
				sum:true/false,//是否为合计列
				spantype:R/C,//rowspan/colspan
				span:X,//跨越多少个格子
				
				itemidx:X,//哪个计算项(items),实体列有效
				hide:true/false//是否显示,实体列有效
			}
*/
;(function($){
	$.E = $.drilltable = {
		op:{
			indent: 40,
			dataUrl:"statistic_doStatistic.action",
			code0Url:"statistic_getSqlACodes.action",
			codeMapUrl:"statistic_getCodeMaps.action",
			reselectUrl:"statistic_getReselectNames.action",
			drillParamURL:$.global.functionDefinitionUrl+"?type=E",
			codeMap:"xcodemap",
			treeWidth:240,
			cellWidth:120,
			cellLedWidth:24,
			baseTable:"",
			NULL_NODE:" ",
			inRunTime:false
		},
		CONST:{
			SPLITER:"$|$",
			TABCHART_ALL:"all",
			TABCHART_TABLE:"table",
			TABCHART_CHART:"chart",
			
			LAYOUT_UD:0,
			LAYOUT_LR:1,
			KV_SPLITER:"|$|",
			HOR_LVL_SPLITER:"$|$",
			HOR_HEAD_SPLITER:"$$$",
			PERSONAL_FILTER:"P_FILTER",
			DTOOL_H:26
		},
		chartType:[{chartSerial:'S',chartType:'Column2D.swf',chartName:'柱状图',chgChart:'MSColumn2D.swf'},
		           {chartSerial:'S',chartType:'Bar2D.swf',chartName:'柱状图-横置',chgChart:'MSBar2D.swf'},
		           {chartSerial:'S',chartType:'Pie2D.swf',chartName:'二维饼图',chgChart:'MSColumn2D.swf'},
		           {chartSerial:'S',chartType:'Pie3D.swf',chartName:'三维饼图',chgChart:'MSColumn2D.swf'},
		           {chartSerial:'S',chartType:'Line.swf',chartName:'折线图',chgChart:'MSLine.swf'},
		           {chartSerial:'M',chartType:'MSColumn2D.swf',chartName:'多系列柱状图',chgChart:'Column2D.swf'},
		           {chartSerial:'M',chartType:'MSBar2D.swf',chartName:'多系列柱状图-横置',chgChart:'Bar2D.swf'},
		           {chartSerial:'M',chartType:'MSLine.swf',chartName:'多系列折线图',chgChart:'Line.swf'}],
		list:{},
		lastRow:null,
		
		gridLoadStart:null,
		gridLoadEnd:null,
		
		runInstance:function(funcNo,options){
			var opts = $.extend({tplFuncno:"",complete:function(){}},options);
			if (opts.tplFuncno==""){
				opts.tplFuncno=funcNo;
			}
			if( !$.drilltable.list[funcNo] )
				$.ajax({
					url:$.drilltable.op.drillParamURL,
					type:"POST",
					dataType:"json",
					data:{funcNo:opts.tplFuncno},
					success:function( data ){
						var drillDef = data[0];
						drillDef.complete=opts.complete;
						drillDef.funcno=funcNo;
						drillDef.tplFuncno=opts.tplFuncno;
						drillDef.viewno=opts.viewno;
						drillDef.viewname=opts.viewname;
						if (opts.cond!=undefined)
							drillDef.cond=opts.cond;
						$.drilltable.list[ funcNo ] = drillDef ;
						$.drilltable.createNew( drillDef, options.target );
					},
					error:function(e){
						//$.msgbox.show( "err", e.responseText );
					}
				})
			else{
				var drillDef= $.drilltable.list[funcNo];
				drillDef.tplFuncno=opts.tplFuncno;
				drillDef.complete=opts.complete;
				drillDef.funcno=funcNo;
				drillDef.viewno=opts.viewno;
				drillDef.viewname=opts.viewname;
				if (opts.cond!=undefined)
					drillDef.cond=opts.cond;
				
				$.drilltable.createNew( $.drilltable.list[funcNo], options.target );
			}
		},
		createNew:function(drillDef,target){
			$("#"+$.E.idFuncs.getSectionDialogID(drillDef.funcno)).remove();
			drillDef.int_drill=drillDef.int_drill==undefined?"Y":drillDef.int_drill;
			drillDef.ext_drill=drillDef.ext_drill==undefined?"Y":drillDef.ext_drill;
			drillDef.exp_xls=drillDef.exp_xls==undefined?"Y":drillDef.exp_xls;
			$.ajax({
				url:"getTableMap.action",
				type:"POST",
				dataType:"json",
				data:{funcNo:drillDef.tplFuncno},
				success:function( data ){
					drillDef.tableMap = data[0];
					drillDef.baseTable = data[1].baseTable;
					drillDef.target=target;
					//初始化一些变量
					if (drillDef.tplFuncno=="")
						drillDef.tplFuncno=drillDef.funcno;
					if (drillDef.inRunTime==undefined)
						drillDef.inRunTime=true;
					
					var id= $.E.idFuncs.getDrilltableID(drillDef.funcno);
					var fixid=$.E.idFuncs.getFixDrilltableID(drillDef.funcno);
					
					var $target = $( "#"+target );
					var $sectionDialog = $("<div title='切面置换' id='"+$.E.idFuncs.getSectionDialogID(drillDef.funcno)+"' style='display:none'></div>")
												.appendTo( $target );
					var drillHeight=$target.height();
					if (drillDef.chartDef==undefined)
						drillHeight=drillHeight-23;
					
					var horSec=0;
					for (var i=0;i<drillDef.sections.length;i++){
						if (drillDef.sections[i].secMode.trim()=="H"){
							horSec++;
						}
					}
					
					var fixHeight=(horSec+1)*24;
					var $screenFix = $("<div style='border:0px;margin-left:1px'></div>").attr("id",fixid)
					.width($target.width())
					.height(fixHeight)
					.css("overflow","hidden")
					.appendTo( $target );
										
					var $screen = $("<div style='border:1px solid #E2E2E2'></div>").attr("id",id)
										.width($target.width())
										.height(drillHeight-fixHeight)
										.css({"overflow":"auto","margin-left":"-1px"})
										.appendTo( $target );
					
					if(!$.browser.mozilla){
						$screen.addClass("ui-state-active");
						$screenFix.addClass("ui-state-active");
					}
					
					var $table = $("<table cellspacing='0' id="+$.E.idFuncs.getDrillTabletabID(drillDef.funcno)+"></table>")
									.appendTo( $screen );
					
					$.drilltable.initSectionDialog( drillDef );
					
					$.drilltable.initToolbar( drillDef,target );
					
					$.drilltable.initDrillTable( drillDef,null );
					
					
					//因为drilltable目前没有影响别的func的功能，所以可以不考虑ajax，就在这里执行
					if(typeof(drillDef.complete) == "function")
						drillDef.complete();
				},
				error:function(e){
					$.msgbox.show( "err", e.responseText );
				}
			});
		},
		dialogCloseFunc:function(funcno){
			var drillDef=$.E.list[funcno];
			$("#max"+drillDef.funcno).css("visibility","visible");
			
			var drillDef=$.E.list[funcno];
			
			var defTop=$.E.CONST.DTOOL_H+3,defLeft=0;
			var $viewC=$("#"+$.E.idFuncs.getViewCID(drillDef.funcno));
			if ($viewC.attr('layout')==0){//上图下表
				defTop+=$viewC.height();
			}
			$fixC=$("#"+$.E.idFuncs.getFixCornerID(funcno));
			if ($fixC.length>0){
				$fixC.css({'left':defLeft+'px','top':defTop+'px','position':'absolute'});
			}
		},
		dialogDill:function(funcno,left,top,width,height){
			$.E.resizeWin(funcno,left,top,width,height);
			
			$fixC=$("#"+$.E.idFuncs.getFixCornerID(funcno));
			var drillDef=$.E.list[funcno];
			var topH=20;
			var $tabHead=$("#"+$.E.idFuncs.getFixDrilltableID(funcno));
			var defTop=$.E.CONST.DTOOL_H+42,defLeft=15;
			var $viewC=$("#"+$.E.idFuncs.getViewCID(drillDef.funcno));
			if ($viewC.attr('layout')==0){//上图下表
				defTop+=$viewC.height();
			}
			if ($fixC.length>0){
				$fixC.css({'left':defLeft+'px','top':defTop+'px','position':'absolute'});
			}
		},
		resizeWin:function(funcno,left,top,width,height){
			var drillDef= $.drilltable.list[funcno];
			var fixW=drillDef.fixWidth==undefined?0:drillDef.fixWidth+2;
			var horTitleH=(drillDef.horSecCnt)*24;
			$("#"+$.E.idFuncs.getFixLeftID(drillDef.funcno)+" table").css({"margin-top":'0px'});
			$("#"+$.E.idFuncs.getFixDrilltableID(drillDef.funcno)).css({"margin-left":'1px'});
			var drillTHeight=0;
			if (drillDef.tablechart==$.E.CONST.TABCHART_ALL){//有图有表
				fixW+=4;
				$hostDiv=$("#"+drillDef.target).parent();
				$hostDiv.width(width).height(height);
				if ($("#"+$.E.idFuncs.getViewCID(drillDef.funcno)).attr('layout')==0){//上下
					if ($.browser.mozilla||$.browser.safari){
						drillTHeight=(height-68-horTitleH)/2;
						$("#"+$.E.idFuncs.getViewCID(drillDef.funcno)).width(width-4).height((height-24)/2);
						$("#"+$.E.idFuncs.getViewTID(drillDef.funcno)).width(width-4).height(drillTHeight-1);
						$("#"+$.E.idFuncs.getDrilltableID(drillDef.funcno)).width(width-4-fixW).height(drillTHeight);
						
						ChartAdapter.resizeChart($.E.idFuncs.getViewCID(drillDef.funcno),(height-24)/2);
					}else{
						drillTHeight=(height-70-horTitleH)/2;
						$("#"+$.E.idFuncs.getViewCID(drillDef.funcno)).width(width-4).height((height-32)/2)
						$("#"+$.E.idFuncs.getViewTID(drillDef.funcno)).width(width-4).height(drillTHeight);
						$("#"+$.E.idFuncs.getDrilltableID(drillDef.funcno)).width(width-4-fixW).height(drillTHeight);
						ChartAdapter.resizeChart($.E.idFuncs.getViewCID(drillDef.funcno),(height-24)/2);
					}
					
				}else{//左右
					if ($.browser.mozilla||$.browser.safari){
						drillTHeight=height-47-horTitleH;
						$("#"+$.E.idFuncs.getViewCID(drillDef.funcno)).width(width/2-2).height(height-20);
						$("#"+$.E.idFuncs.getViewTID(drillDef.funcno)).width(width/2-2).height(drillTHeight+1);
						$("#"+$.E.idFuncs.getDrilltableID(drillDef.funcno)).width(width/2-2-fixW).height(drillTHeight);
						ChartAdapter.resizeChart($.E.idFuncs.getViewCID(drillDef.funcno),height-21);
					}else{	
						drillTHeight=height-51-horTitleH;
						$("#"+$.E.idFuncs.getViewCID(drillDef.funcno)).width(width/2-2).height(height-24)
						$("#"+$.E.idFuncs.getViewTID(drillDef.funcno)).width(width/2-2).height(drillTHeight+1);
						$("#"+$.E.idFuncs.getDrilltableID(drillDef.funcno)).width(width/2-2-fixW).height(drillTHeight);
						ChartAdapter.resizeChart($.E.idFuncs.getViewCID(drillDef.funcno),height-23);
					}
				}
				
			}else if(drillDef.tablechart==$.E.CONST.TABCHART_TABLE){//只有grid
				$hostDiv=$("#"+drillDef.target);
				$hostDiv.width(width).height(height);
				drillTHeight=height-48-horTitleH;
				$("#"+$.E.idFuncs.getDrilltableID(drillDef.funcno)).width(width-4-fixW).height(drillTHeight);
			}else{//drillDef.tablechart==$.E.CONST.TABCHART_CHART//只有chart
				var $vc=$("#"+$.E.idFuncs.getViewCID(drillDef.funcno));
				if ($.browser.mozilla||$.browser.safari){
					$vc.width(width-4).height(height-22);
					$vc.parent().width(width).height(height);
					drillTHeight=height-23;
					$("#"+$.E.idFuncs.getDrilltableID(drillDef.funcno)).width(width-4).height(drillTHeight);
					ChartAdapter.resizeChart($.E.idFuncs.getViewCID(drillDef.funcno),height-23);
				}else{	
					$vc.width(width-4).height(height-26);
					$vc.parent().width(width).height(height);
					drillTHeight=height-27;
					$("#"+$.E.idFuncs.getDrilltableID(drillDef.funcno)).width(width-4).height(drillTHeight);
					ChartAdapter.resizeChart($.E.idFuncs.getViewCID(drillDef.funcno),height-23);
				}
			}
			$("#"+$.E.idFuncs.getFixLeftID(drillDef.funcno)).height(drillTHeight);
		},
		dealPersonCond:function(oneCond){
			//xxx;yyy;zzz 或者 'xxx';'yyy';'zzz' 或者 "xxx";"yyy";"zzz" 
			//xxx,yyy,zzz 或者 'xxx','yyy','zzz' 或者 "xxx","yyy","zzz" 
			//以及外面包了括号的情况
			//全部转为==>'xxx','yyy','zzz'
			oneCond=oneCond.trim();
			//1.分号(;)替换为逗号(,) ;双引号(")替换为单引号(')
			oneCond=oneCond.replace(/\;/g,",").replace(/\"/g,"'");
			//2.如有括号，去掉
			if (oneCond.charAt(0)=="(")
				oneCond=oneCond.substring(1);
			if (oneCond.charAt(oneCond.length-1)==")")
				oneCond=oneCond.substring(0,oneCond.length-1);
			if (oneCond.charAt(oneCond.length-1)==",")
				oneCond=oneCond.substring(0,oneCond.length-1);
			//3.无单引号或者双引号替换为单引号
			var arItems=oneCond.split(",");
			
			for(var i=0;i<arItems.length;i++){
				oneItem=arItems[i].trim();
				if (oneItem.charAt(0)!="'")
					oneItem="'"+oneItem;
				if (oneItem.charAt(oneItem.length-1)!="'")
					oneItem=oneItem+"'";
				arItems[i]=oneItem;
			}
			oneCond=arItems.join(",");
			
			if (arItems.length==0)
				return " = ''";
			else if (arItems.length>1)
				return " in ("+oneCond+")";
			else
				return " = "+oneCond;
		},
		initReselect:function(drillDef){
		    var sections = $.E.getVSections( drillDef.funcno);
			var $dtool=$("#"+$.E.idFuncs.getDToolID(drillDef.funcno));
			$dtool.find(".reselectSpan").remove();
			var $multi=$dtool.find(".reselect");
			if ($multi.length>0)
				$multi.multiselect("destroy").remove();
			drillDef.reselectCond=undefined;
			//reselect列出
			var sec,drillSec,codemaps="",mapcodes="",mapnames="",conds="",secs="",arTmp,oneItem;
			for(var i=0;i<sections.length;i++){
				sec=sections[i];
				if (sec.reselect){
				    drillSec=$.E.idFuncs.getDrillDefSectionbySecName(drillDef,sec.sec);
					if (drillDef.cond.trim()!=""){//截取出用户本身自带的条件
					    arTmp=drillDef.cond.split(drillSec.secField+" "+$.E.CONST.PERSONAL_FILTER+" ");
						if (arTmp.length>1){
							var stemp=$.UC.parser(arTmp[1].split(";")[0]);
							
							conds+=drillSec.mapcode+$.E.dealPersonCond(stemp)+"$$$";
							codemaps+=drillSec.codemap+",";
							mapcodes+=drillSec.mapcode+",";
							mapnames+=drillSec.mapname.replace("#","")+",";
							secs+=drillSec.secField+",";
						}
					}
				}
			}
			if (codemaps!=""){//需要ajax去加载了
				codemaps=codemaps.substring(0,codemaps.length-1);
				mapcodes=mapcodes.substring(0,mapcodes.length-1);
				mapnames=mapnames.substring(0,mapnames.length-1);
				conds=conds.substring(0,conds.length-3);
				secs=secs.substring(0,secs.length-1);
				$.ajax({
					type: "POST",
					url:  $.drilltable.op.reselectUrl,
					data: {
					        codemaps:codemaps,
							mapcodes:mapcodes,
							mapnames:mapnames,
							conds:conds,
							secs:secs
					      }, 
					dataType: "text",
					success:function( data,textStatus ){
						var arSecs=data.split("|$|");
						var selectStr;
						var arSecVals,arKV,arSecKVs;
						for(var i=0;i<arSecs.length;i++){
						    arSecVals=arSecs[i].split(":",2);
							arSecKVs=arSecVals[1].split(";");
							selectStr="<select class='reselect' name="+$.E.idFuncs.getReselectid(drillDef.funcno,arSecVals[0])+" sec='"+arSecVals[0]+"' multiple='multiple' style='width:100px'>";
							
							for (var j=0;j<arSecKVs.length;j++){
								if (arSecKVs[j].trim()=="")
									continue;
								arKV=arSecKVs[j].split(",");
							    selectStr+="<option value="+arKV[0]+">"+arKV[1]+"</option>";
							}
							selectStr+="</select>";
							var $reselect=$(selectStr);
							
							var secName=$.E.getSecNameBySecID(drillDef.Vsections,arSecVals[0]);
							$("<span style='margin-top:6px;float:left' class='reselectSpan'>&nbsp&nbsp"+secName+":</span>").appendTo($dtool);
							$reselect.appendTo($dtool);
							$reselect.multiselect({
								noneSelectedText:secName,
								checkAllText:"全选",
								uncheckAllText:"全不选",
								selectedText: '# 项被选择',
								close: function(event, ui){
									drillDef.reselectCond=drillDef.reselectCond==undefined?{}:drillDef.reselectCond;
									var arSelected=$(this).multiselect("getChecked");
									var selectCond="";
									for(var i=0;i<arSelected.length;i++){
										selectCond+="'"+$(arSelected[i]).attr("value")+"'";
										if (i!=arSelected.length-1)
											selectCond+=",";
									}
									var redrawTab=true;
									if (selectCond==""){
									    redrawTab=drillDef.reselectCond!=undefined&&drillDef.reselectCond[$(this).attr("sec")]!=undefined;
										drillDef.reselectCond[$(this).attr("sec")]=undefined;
									}else{
										var nowCond=drillDef.reselectCond[$(this).attr("sec")];
										redrawTab=nowCond==undefined||nowCond.cond!=selectCond;
										drillDef.reselectCond[$(this).attr("sec")]={"cond":selectCond,"multi":arSelected.length>0}
									}
									if (redrawTab)
										$.drilltable.initDrillTable(drillDef ,null);
								}
							});
							$reselect.next().css({"margin-top":"1px","height":$.E.CONST.DTOOL_H+"px","background-color":"rgb(190, 237, 248)"});
						}
					},
					error:function(e,textStatus){
						$.msgbox.show( "err", "自筛选条件获取失败:"+textStatus+":"+e.responseText.substring(0,20)+")" );
					}
				});
			}
		},
		initToolbar:function( drillDef,target ){
			maxBtnVisible=function(){
				if (drillDef.inDialog)
					return "hidden";
				else
					return "visible";
			}
			var $dtool=$("#"+$.E.idFuncs.getDToolID(drillDef.funcno));
			$dtool.empty();
			if ($dtool.css("visibility")=="hidden")
				return;
			//导出excel
			var liExpXls="";
			if (drillDef.exp_xls=="Y")
				liExpXls="<li class='htmlMI ui-state-default ui-corner-all' id='expXls"+drillDef.funcno+"'><span class='ui-icon ui-icon-calculator' style='float:left'></span></li>";
			//切换图形
			var liChangeChart="";
			if (drillDef.chartDef!=undefined){
				liChangeChart="<li class='htmlMI ui-state-default ui-corner-all' id='changeChart_"+drillDef.funcno+"'><span class='ui-icon ui-icon-image' style='float:left'></span></li>"
							 +"<li class='htmlMI ui-state-default ui-corner-all' style='display:none' id='liChartType"+drillDef.funcno+"'>"
							 +"		<select id='selChartType_"+drillDef.funcno+"'>"
				var serialType="S";
				if (drillDef.calItems.length!=1)
					serialType="M";
				var oneChart;
				for(var i=0;i<$.E.chartType.length;i++){
					oneChart=$.E.chartType[i];
					if (oneChart.chartSerial==serialType)
						liChangeChart+="<option value='"+oneChart.chartType+"'>"+oneChart.chartName+"</option>";
				}
				liChangeChart+="	</select></li>";
			}
			//自动展开/收缩
			var liExpand="<li class='htmlMI ui-state-default ui-corner-all' id='autoExpand_"+drillDef.funcno+"'><span class='ui-icon ui-icon-plus' style='float:left'></span></li>"
							+"<li class='ui-state-default ui-corner-all' style='display:none;float:left' id='liAutoExpand"+drillDef.funcno+"'></li>";
			
			//展示图/表
			var liTabChartToggle="";
			if (drillDef.chartDef!=undefined)
				liTabChartToggle="<span style='float:left;margin-top:3px'>&nbsp&nbsp图表切换:</span>"
								+"<select style='height:26px;background-color:rgb(190, 237, 248);float:left;margin-top:1px' id="+$.E.idFuncs.getChangeViewStyleID(drillDef.funcno)+">"
								+" <option value='N'>请选择</option>"
								+" <option value='T'>仅显示表</option>"
								+" <option value='TCLR'>左表右图</option>"
								+" <option value='TCUD'>上图下表</option>"
								+" <option value='C'>仅显示图</option>"
								+"</select>";
								
			$mi=$("<li class='htmlMI ui-state-default ui-corner-all' id='changeSec"+drillDef.funcno+"'><span class='ui-icon ui-icon-transferthick-e-w' style='float:left'></span></li>"
				 +liExpXls
				 +liChangeChart
				 +liExpand			
				 +liTabChartToggle	
				 +"<span style='float:left;margin-top:3px'>&nbsp&nbsp统计单位:</span>"
				 +"<li style='background-color:rgb(190, 237, 248);float:left;height:24px;margin-top:1px'  class='ui-state-default ui-corner-all' id='units"+drillDef.funcno+"'>"
				 +"	<input style='margin-top:5px' type='radio' name='rdUnit_"+drillDef.funcno+"' value='0$默认' checked='checked'/>默认"
				 +"	<input type='radio' name='rdUnit_"+drillDef.funcno+"' value='1$ '/>元"
				 +"	<input type='radio' name='rdUnit_"+drillDef.funcno+"' value='1000$千'/>千元"
				 +"	<input type='radio' name='rdUnit_"+drillDef.funcno+"' value='10000$万'/>万元"
				 +"	<input type='radio' name='rdUnit_"+drillDef.funcno+"' value='100000000$亿'/>亿元"
				 +"</li>"
				 +"<li class='htmlMI ui-state-default ui-corner-all maxWin' style='visibility:"+maxBtnVisible()+"' id='max"+drillDef.funcno+"'><span class='ui-icon ui-icon-newwin' style='float:left'></span></li>");
			
			$mi.appendTo($dtool);
			$(".htmlMI").css({"float":"left","list-style-type":"none","width":$.E.CONST.DTOOL_H+"px","height":$.E.CONST.DTOOL_H+"px"})
						.hover(
								function() { $(this).addClass('ui-state-hover'); },
								function() { $(this).removeClass('ui-state-hover'); }
						);
			$(".htmlMI").find("span").css("margin","4px 4px");
			
			$(".maxWin").css({"float":"right","width":$.E.CONST.DTOOL_H+"px","height":$.E.CONST.DTOOL_H+"px"});
			$(".maxWin").find("span").css("margin","4px 4px");
			$dtool.find(">span").css("margin-top","6px");
			
			$.addHint($("#changeSec"+drillDef.funcno),"切面置换");
			$.addHint($("#expXls"+drillDef.funcno),"导出Excel");
			$.addHint($("#changeChart_"+drillDef.funcno),"切换图表样式");
			$.addHint($("#autoExpand_"+drillDef.funcno),"自动展开/收起");
			$.addHint($(".maxWin"),"最大化窗口");
			
			
			$("#changeSec"+drillDef.funcno)					
			.click(function(){$("#"+$.E.idFuncs.getSectionDialogID(drillDef.funcno)).dialog({
    			autoOpen:true,
    			bgiframe: true,
				modal: true,
				resizable: false,
				zIndex:10001,
				height:480,
				width:800,
				close:function(event, ui){
					$(this).dialog('destroy');
				},
				buttons: {
					"取        消": function() {
						$(this).dialog('destroy');
					},
					"确        定":function(){
						$.E.initReselect(drillDef);
						var state = $.E.initDrillTable( drillDef ,$(this))
						if ( state == "ok")
							$(this).dialog( 'destroy' );
						
						else if(state == "0"){
							var $tip = $("<p class='ui-state-active' style='padding:3px;'>请至少选择一维纵切面和一项统计项!</p>")
							.appendTo( $(this).find("div") );
							setTimeout(function(){
								$tip.fadeOut(1500,function(){$(this).remove()})
							},3000)
							
						}/*else if(state == "1"){
							var $tip = $("<p class='ui-state-active' style='padding:3px;'>横切面只能有一维</p>")
							.appendTo( $(this).find("div") );
							setTimeout(function(){
								$tip.fadeOut(1500,function(){$(this).remove()})
							},3000)
						}*/
					}
				}
    		});})
    		
			
			$("#expXls"+drillDef.funcno).click(function(){
				var title = drillDef.xlsTitle;
				var detail = "";
				var trs =$("#"+ $.E.idFuncs.getDrilltableID(drillDef.funcno)+" tr");
				for (var i = 0; i < trs.length; i++){
					var tr = trs[i];
					var viceDetail = "";
					if (tr.id.indexOf("_") == 0){
						var tds = tr.childNodes;
						for (var j = 0; j < tds.length; j++){
							if (j != 0){
								viceDetail += ":";
							}
							if (j == 0){
								var paddingLeft = parseInt(tds[j].style.paddingLeft.split("px")[0]) - 1;
								var index = paddingLeft/40;
								if (index != 0){
									for (var k = index * 2; k >=0; k--){
										viceDetail += "   ";
									}
								}
							}
							viceDetail += tds[j].innerText;
						}
						if (detail != ""){
							detail += ";";
						}
						detail += viceDetail;
					}
				}
				detail = detail.replace(/:/g, "__c");
				detail = detail.replace(/%/g, "__pe");
				detail = detail.replace(/\+/g, "__pl");
				detail = detail.replace(/\*/g, "__s");
				
				document.getElementById("title").value = title;
				document.getElementById("detail").value = detail;
				document.getElementById("viewname").value = drillDef.viewname;
				document.getElementById("frm").submit();	
				
			});
			
			$("#changeChart_"+drillDef.funcno).click(function(){
				var $liChart=$("#liChartType"+drillDef.funcno);
				if ($liChart.css("display")=="none")
					$liChart.css("display","list-item");
				else
					$liChart.css("display","none");
			});
			
			var $selChgChart=$("#selChartType_"+drillDef.funcno);
			if ($selChgChart.length>0){
				$selChgChart.change(function(){
					drillDef.chartDef.type=$(this).val();
					$("#"+drillDef.target).empty();
					$dtool.empty();
					$.E.createNew(drillDef,drillDef.target);
				}).val(drillDef.chartDef.type);
			}
			
			
			$("[name=rdUnit_"+drillDef.funcno+"]").click(function(){
				drillDef.unit=$(this).attr("value");
				$.drilltable.initDrillTable(drillDef ,null);
			});
			

			
			//自动展开
			$("#autoExpand_"+drillDef.funcno).click(function(){
				var $liLevel=$("#liAutoExpand"+drillDef.funcno);
				if ($liLevel.css("display")=="none"){
				  $liLevel.css("display","list-item");
				}else
					$liLevel.css("display","none");
			});
			
			$("#"+$.E.idFuncs.getChangeViewStyleID(drillDef.funcno)).change(function(){
				var srcFunc=drillDef.funcno.split("_")[0];
				var view=$.DC.list[srcFunc][drillDef.viewno];
				var viewStyle,layout;
				if ($(this).attr("value")=="N")
					return;
				else if ($(this).attr("value")=="T")
					view.def["T"].tablechart=$.E.CONST.TABCHART_TABLE;
				else if ($(this).attr("value")=="TCLR"){
					view.def["T"].tablechart=$.E.CONST.TABCHART_ALL;
					view.layout=$.E.CONST.LAYOUT_LR;
				}
				else if ($(this).attr("value")=="TCUD"){
					view.def["T"].tablechart=$.E.CONST.TABCHART_ALL;
					view.layout=$.E.CONST.LAYOUT_UD;
				}
				else if ($(this).attr("value")=="C")
					view.def["T"].tablechart=$.E.CONST.TABCHART_CHART;
				
				$("#"+$.DC.getRegionScreenID(srcFunc)).empty();
				$.DC.showOneView(srcFunc,view,drillDef.$target,undefined,drillDef.gridShow);
				
			});
			
			//最大化
			$("#max"+drillDef.funcno).click(function(){
					var $hostDiv;
					if (target==$.E.idFuncs.getViewTID(drillDef.funcno))
						$hostDiv=$("#"+target).parent();
					else
						$hostDiv=$("#"+target);
					
					$.dialogContent(drillDef.funcno,$hostDiv,$hostDiv.parent(),$.E.dialogDill,$.E.dialogCloseFunc);
					$(this).css("visibility","hidden");
			});
			$.E.initReselect(drillDef);
		},
		
		
		initSectionDialog:function(drillDef){
			
			var id = $.E.idFuncs.getSectionDialogID(drillDef.funcno);
			
			var tip = "<div class='ui-state-active' style='padding:4px;margin-bottom:15px;'><p><span class='ui-icon ui-icon-lightbulb' style='float:left'></span><span>提示:</span></p><p><span class='ui-icon ui-icon-check' style='float:left'></span><span>表示当前已选择项</span></p> <p><span class='ui-icon ui-icon-minus' style='float:left'></span><span>表示未选择项</span></p><p>点击项可改变该项是否选中,拖拽可调整顺序,横纵切面可置换</p></div>";
			
			$("#"+id).append( tip )
			
			$.drilltable.initItemList(drillDef.funcno,drillDef.calItems);
			
			$.drilltable.initSectionList(drillDef.funcno,drillDef.sections);
		},
		getBlockDiv:function(drillDef){
			if (drillDef.chartDef!=undefined){
				return $("#"+drillDef.target).parent();
			}else
				return $("#"+drillDef.target);
		},
		initDrillTable:function( drillDef ,$btn){
			
			var vsections = $.drilltable.getVSections( drillDef.funcno,$btn);
			var hSections =$.drilltable.getHSections( drillDef.funcno ,$btn);
			var items = $.drilltable.getItems( drillDef ,$btn);
			drillDef.Vsections=vsections;
			
			if( (vsections.length == 0) || ( items.length == 0 ) )
				return "0";
			
			var $screen=$.E.getBlockDiv(drillDef);
			$screen.block({message:"<p id='drilltip' class='ui-state-active'>正在获取维度列表...</p>",
				 overlayCSS:{backgroundColor: '#0F4569', opacity:0.6 }	
			});
			
			$.drilltable.resetTable( drillDef,$screen.find("table[id='"+$.E.idFuncs.getDrillTabletabID(drillDef.funcno)+"']"),
											vsections, 
											hSections,
											items,
											drillDef.filter,
											function(){$screen.unblock()}
			);
			
			return "ok";
		},
		
		initSectionList:function(funcno,sections){ 
			var drillDef=$.E.list[funcno];
			var vid = $.E.idFuncs.getVSectionsID(drillDef.funcno);
			var $vul = $("<ul id = '"+vid+"' class='sortable connectedSortable'></ul>");
			$vul.append("<li class='ui-widget-header'>纵切面列表</li>");
			$vul.appendTo( $( "#"+$.E.idFuncs.getSectionDialogID(drillDef.funcno)) );
			
			var hid = $.E.idFuncs.getHSectionsID(drillDef.funcno);
			var $hul = $("<ul id = '"+hid+"' class='sortable connectedSortable'></ul>");
			$hul.append("<li class='ui-widget-header'>横切面列表</li>");
			$hul.appendTo( $( "#"+$.E.idFuncs.getSectionDialogID(drillDef.funcno)) );
			
			for(var i=0; i<sections.length; i++){
				var $li = $.drilltable.wrapSection( sections[i] );
				if(sections[i].secMode == 'V')
					$vul.append( $li )
				else
					$hul.append( $li );
			}
			$("#"+vid + ",#"+hid).sortable({
				items:'li.ui-state-default',
				connectWith: '.connectedSortable',
				placeholder: 'ui-state-active'
			}).disableSelection();
		},
		recursionExpand:function($tr,drillDef,sections, hSections, items, filter,MaxLevel,completeFunc){
			if ($tr.attr("value")=="undefined"||$tr.length==0){//最后一行
				$.closeProcessBar();
				if (typeof(completeFunc)=='function')
					completeFunc();
				return;
			}
			if ($tr.attr("level")!=undefined){//==undefined的话表示是第一行
				var lvl=parseInt($tr.attr("level"));
				
				if (lvl==MaxLevel){
					//如果最后一层是“-”号的话，收起
					if ($tr.find("td:first span").hasClass("ui-icon-minus")){
		     		var $fltbody=$("#"+$.E.idFuncs.getFixLeftID(drillDef.funcno)).find("tbody");
		     		var $fixTr=$fltbody.find("tr:[id='"+$tr.attr("id")+"']");
		     		$.E.collapse($tr.parent());
		     		$.E.collapse($fixTr);
		    	}
				}else if (lvl<MaxLevel){//MaxLevel之内的，需要看看
					if ($tr.find("td:first span").hasClass("ui-icon-plus")){//“+”号，展开后再做下一个点
						$.E.toggleNode(drillDef,$tr, sections, hSections, items, filter,1,function(){
							if ($tr.attr("parent")=="none")
								$.incProcessByOne();
							$.E.recursionExpand($tr.next(),drillDef,sections, hSections, items, filter,MaxLevel,completeFunc);
						},true);
						return;
					}
				}
			}else{//第一行：显示进度
				$.showProcessBar("自动展开，请稍等...","自动展开中，请稍等...",400,120,$tr.parent().find("tr[parent='none']").length);
			}
			$.E.recursionExpand($tr.next(),drillDef,sections, hSections, items, filter,MaxLevel,completeFunc);
		},
		initAutoExpand:function(drillDef,sections, hSections, items, filter){
			  var $liLevel=$("#liAutoExpand"+drillDef.funcno);
			  $liLevel.empty();
				var $Vsecs=$.E.getVSections(drillDef.funcno);
				var strSel="<select style='height:26px;background-color:rgb(190, 237, 248)' id='selAutoExpand_"+drillDef.funcno+"'>";
				if ($Vsecs.length>1){
					strSel+="<option value='0'>全部收起</option>";
					for(var i=1;i<$Vsecs.length;i++)
						strSel+="<option value='"+i+"'>展开到第"+(i+1)+"层</option>";
					strSel+="	</select>";
					$(strSel).appendTo($liLevel)
					         .change(function(){
					             var val=$(this).val();
					         	   if (val==0){//全部收起
					         	   	   var $td=$("#"+$.E.idFuncs.getDrillTabletabID(drillDef.funcno)+" tbody tr").find("td:first");
					         	   	   var $fltbody=$("#"+$.E.idFuncs.getFixLeftID(drillDef.funcno)).find("tbody");
					         	   	   var $fixTr,$fixSpan,$node;
					         	   	   for(var i=0;i<$td.length;i++){
					         	   	   	   $node=$($td[i]);
					         	   	       if ($node.find("span").hasClass("ui-icon-minus")){
					         	   	       	 $fixTr=$fltbody.find("tr:[id='"+$node.parent().attr("id")+"']");
					         	   	       	 $.E.collapse($node.parent());
					         	   	       	 $.E.collapse($fixTr);
					         	   	       } 
					         	   	   }
					         	   }else{//展开到第i层
					         	       $.E.recursionExpand($("#"+$.E.idFuncs.getDrillTabletabID(drillDef.funcno)+" tbody tr:first"),
					         	   	                                 drillDef,sections,hSections,items,filter,val);
					         	   }
										});
					
				}
		},
		addToggleState:function($span){
			$span.hover(
					function(){$(this).addClass("ui-state-hover")},
					function(){$(this).removeClass("ui-state-hover ")})
							.mousedown(function(){$(this).addClass("ui-state-active")})
							.mouseup(function(){$(this).removeClass("ui-state-active")})
				.click(function(){
					var $span = $(this);
					if( $span.hasClass( "ui-icon-minus" ) )
						$span.removeClass( "ui-icon-minus" )
								.addClass( "ui-icon-check" )
								.parent().addClass("checked");
					else
						$span.removeClass( "ui-icon-check" )
								.addClass( "ui-icon-minus" )
								.parent().removeClass( "checked" );
				});
			
		},
		initItemList:function(funcno,items){
			var drillDef=$.E.list[funcno];
			var id = $.E.idFuncs.getCalItemsID(drillDef.funcno);
			var $ul = $("<ul id = '"+id+"' class='sortable'></ul>");
			
			$ul.append("<li class='ui-widget-header'>统计项列表</li>");
			$ul.appendTo( $( "#"+$.E.idFuncs.getSectionDialogID(drillDef.funcno)) );
			for(var i=0; i<items.length; i++){
				$ul.append( $.drilltable.wrapCalItem( items[i], i ) );
			}
			$ul.sortable({
				items:"li.ui-state-default"
			})
		},
		
		wrapSection:function( section ){
			if(!section)//for ie bug
				return;
			var $li = $( "<li>" + section.secName + "</li>" )
			.css("cursor","pointer")
			.addClass("ui-state-default")
			.attr("sec",section.secField)
	
			var $span = $( "<span></span>" ).css("float","right").addClass("ui-icon");
			if( section.enabled ){
				$li.addClass( "checked" );
				$span.addClass( "ui-icon-check" );
			}else
				$span.addClass( "ui-icon-minus" );
			
			$.E.addToggleState($span);
			$li.append( $span ).dblclick(function(){
				var $span = $(this).find(">span");
				if( $span.hasClass( "ui-icon-minus" ) )
					$span.removeClass( "ui-icon-minus" )
							.addClass( "ui-icon-check" )
							.parent().addClass("checked");
				else
					$span.removeClass( "ui-icon-check" )
							.addClass( "ui-icon-minus" )
							.parent().removeClass( "checked" );
			});
			
			$li.append("<span style='float:right'>&nbsp</span>");
			//加上reselect的span
			var $span = $( "<span></span>" ).css("float","right").addClass("ui-icon");
			if( section.reselect ){
				$li.addClass( "reselect" );
				$span.addClass( "ui-icon-circle-check" );
			}
			$span.hover(function(){$(this).addClass("ui-state-hover")},
						function(){$(this).removeClass("ui-state-hover ")})
				.mousedown(function(){$(this).addClass("ui-state-active")})
				.mouseup(function(){$(this).removeClass("ui-state-active")})
			$span.click(function(){
					var $span = $(this);
					if( $span.hasClass( "ui-icon ui-icon-circle-close" ) )
						$span.removeClass( "ui-icon ui-icon-circle-close" )
								.addClass( "ui-icon ui-icon-circle-check" )
								.parent().addClass("reselect");
					else
						$span.removeClass( "ui-icon ui-icon-circle-check" )
								.addClass( "ui-icon ui-icon-circle-close" )
								.parent().removeClass( "reselect" );
				});
			if (section.reselect)
				$li.append( $span );
			return $li;
		},
		
		wrapCalItem:function(item, ord)	{
			if(!item)//for ie bug
				return;
			var $li = $( "<li title='双击可启用/禁用'>" + item.itemName +"  (" + item.unit + ")</li>" )
					.css("cursor","pointer")
					.addClass("ui-state-default")
					.attr("expr",item.formula + " S" + ord )
					.attr("index",ord)
			
			var $span = $( "<span></span>" ).css("float","right").addClass("ui-icon");
			if( item.enabled ){
				$li.addClass( "checked" );
				$span.addClass( "ui-icon-check" );
			}else
				$span.addClass( "ui-icon-minus" );
			$.E.addToggleState($span);
			$li.append( $span ).dblclick(function(){
				var $span = $(this).find(">span");
				if( $span.hasClass( "ui-icon-minus" ) )
					$span.removeClass( "ui-icon-minus" )
							.addClass( "ui-icon-check" )
							.parent().addClass("checked");
				else
					$span.removeClass( "ui-icon-check" )
							.addClass( "ui-icon-minus" )
							.parent().removeClass( "checked" );
			});
			
			var $spanIsShow = $( "<div id='show' class='ui-corner-all' style='float:left;cursor:pointer' title='报表中显示此计算项'>"
													+"	<span class='ui-icon ui-icon-lightbulb'></span>"
													+"</div>" )
													.click(function(){
														$(this).toggleClass("ui-state-active");
													}); 
			if (item.isShow==undefined|| item.isShow)
				$spanIsShow.addClass("ui-state-active");
			
			var $spanIsSum = $( "<div id='sum' class='ui-corner-all' style='float:left;cursor:pointer' title='此计算项是否求和'>"
													+"	<span class='ui-icon ui-icon-calculator'></span>"
													+"</div>" )
													.click(function(){
														$(this).toggleClass("ui-state-active");
													}); 
			if (item.isSum)
				$spanIsSum.addClass("ui-state-active");
				
			$li.append($spanIsShow).append($spanIsSum);
			return $li;
		},
		
		getVSections:function( funcno,$btn ){
			var $ul;
			var drillDef=$.E.list[funcno];
			if ($btn==null)
				$ul = $("#"+$.E.idFuncs.getVSectionsID(drillDef.funcno));
			else
				$ul=$($btn.parent()).find("#"+$.E.idFuncs.getVSectionsID(drillDef.funcno))
			var $lis = $ul.find(">li.checked");
			var sections = [];
			for(var i=0; i<$lis.length; i++)
					sections.push({
						sec:$($lis[i]).attr("sec"),
						name:$($lis[i]).text(),
						reselect:$($lis[i]).hasClass("reselect")
					});
			
			return sections;
		},
		
		getHSections:function(funcno,$btn){
			var $ul;
			var drillDef=$.E.list[funcno];
			if ($btn==null)
				$ul = $("#"+$.E.idFuncs.getHSectionsID(drillDef.funcno));
			else
				$ul=$($btn.parent()).find("#"+$.E.idFuncs.getHSectionsID(drillDef.funcno))
				
			
			var $lis = $ul.find(">li.checked");
			var hSections = "";
			for(var i=0; i<$lis.length; i++)
					hSections += $($lis[i]).attr("sec") + (i<$lis.length-1?",":"");
					
			return hSections;
		},
		changeUnit:function(srcUnitExpr,newUnit,oriUnit){
			oriUnit=oriUnit.replace('亿','').replace('万','').replace('千','');
			var desUnitExpr;
			var idxUnit=srcUnitExpr.lastIndexOf("(");
			var srcUnit=srcUnitExpr.substring(idxUnit,srcUnitExpr.length)
			if (srcUnit.indexOf('元')==-1)//人/个之类的单位，就不要处理了
				return srcUnitExpr;
			else{
				newUnit=newUnit.replace(/\s+/g,"");     
				if (idxUnit==-1)//这个情况应该不会出现，除非是计算项计算失败
					desUnitExpr=srcUnitExpr+" ("+newUnit+oriUnit+")";
			    else
			    	//desUnitExpr=srcUnitExpr.substring(0,idxUnit+1)+newUnit+srcUnitExpr.substring(srcUnitExpr.length-2);
			    	desUnitExpr=srcUnitExpr.substring(0,idxUnit+1)+newUnit+oriUnit+')';
				return desUnitExpr;
			}
		},
		//根据总的单位，来调整报表的单位
		dealItemUnit:function(unit,oneItem){
			if (unit!=undefined){
				if (oneItem.oriUnit.indexOf('元')==-1)
					return oneItem;
				var units=unit.split("$");
				var unitDiv=units[0];
				var unitTitle=units[1];
				if (unitDiv!=0){
					//看看是否需要进行单位替换
					var idxBlock,needReplace=false;
					var idxDiv=oneItem.expr.lastIndexOf("/1");
					if (idxDiv==-1){//说明原来没有单位的，没有/1号，那就需要替换了
						idxBlock=oneItem.expr.lastIndexOf(" ");
						idxDiv=idxBlock
						needReplace=true;
					}else{//原来已经有除号(/1)，这个时候就比较麻烦了。
						//判断的依据是:最后一个除号(/1)和最后一个空格之间的字符全部是0
						idxBlock=oneItem.expr.lastIndexOf(" ");
						var strBetween=oneItem.expr.substring(idxDiv+2,idxBlock);
						needReplace=true;
						for(var i=0;i<strBetween.length;i++){
							if (strBetween[i]!="0"){
								needReplace=false;
								break;
							}
						}
					}
					if (needReplace){
						if (oneItem.itemtype!="C")
							oneItem.expr=oneItem.expr.substring(0,idxDiv)+"/"+unitDiv+oneItem.expr.substring(idxBlock);
						oneItem.name=this.changeUnit(oneItem.name,unitTitle,oneItem.oriUnit);
					}
				}
			}	
			return oneItem;
		},
		genFormularC:function(drillDef,formular){
			var $ul =  $("#"+$.E.idFuncs.getCalItemsID(drillDef.funcno));
			var $lis = $ul.find(">li.checked");
			var formulaC=formular;
			for(var i=0; i<$lis.length;i++){
				var regStr=$($lis[i]).text().split(" (")[0].trim().replace(/\*/g,"\\*").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
				var reg=new RegExp(regStr,"g");
													
				formulaC=formulaC.replace(reg,i);
			}
			return formulaC;
		},
		
		//将dispExpr的格式进行如下转变:”40:B;80:Y;200:R”==>
		//[{val:40,disp:”B”},{val:40,disp:”B”},{val:200,disp:”R”}] 的json格式
		genItemDispExpr:function(strDispExpr){
			strDispExpr=strDispExpr.trim();
			if (strDispExpr==undefined || strDispExpr=="undefined"||strDispExpr=="")
				return [];
				
			var arDispExprs=strDispExpr.split(";");
			var arOneDisps;
			var itemDispExpr=[];
			for(var i=0;i<arDispExprs.length;i++){
				if (arDispExprs[i]=="")
					continue;
				arOneDisps=arDispExprs[i].split(":");
				/*var jsonOneItem={val:0,disp:""};
				jsonOneItem.val  = parseInt(arOneDisps[0]);
				jsonOneItem.disp = ;*/
				itemDispExpr.push({val:parseInt(arOneDisps[0]),disp:arOneDisps[1].trim().toUpperCase()});
			}
			//按照val的值冒泡一把,大的值靠后
			var chgExpr;
			for(var i=0;i<itemDispExpr.length;i++){
				for(var j=0;j<itemDispExpr.length-i-1;j++){
					if (itemDispExpr[j].val>itemDispExpr[j+1].val){
						chgTemp=itemDispExpr[j];
						itemDispExpr[j]=itemDispExpr[j+1];
						itemDispExpr[j+1]=chgExpr;
					}
				}
			}
			return itemDispExpr;
		},
		getItems:function( drillDef,$btn ){
			//1.生成计算的items
			var $ul;
			if ($btn==null)
				$ul =  $("#"+$.E.idFuncs.getCalItemsID(drillDef.funcno));
			else
				$ul=$($btn.parent()).find("#"+$.E.idFuncs.getCalItemsID(drillDef.funcno));
				
			var $lis = $ul.find(">li.checked");
			var items = [] ;
			var oneItem,srcItemDef;
			var formulaC,expr,splitExpr,dispExpr;
			drillDef.visibleItems=null;
			drillDef.visibleItems=[];
			drillDef.sumCnt=0;
			
			var $oneli;
			for(var i=0; i<$lis.length;i++){
				srcItemDef=drillDef.calItems[$($lis[i]).attr("index")];
				$oneli=$($lis[i]);
				expr=$oneli.attr("expr");
				isSum=$oneli.find("#sum").hasClass("ui-state-active");
				isShow=$oneli.find("#show").hasClass("ui-state-active");
				formulaC="";
				dispExpr=[];
				if (srcItemDef.itemtype=="C"){
					splitExpr=expr.split(" ");
					expr="1 "+splitExpr[splitExpr.length-1];
					formulaC=$.E.genFormularC(drillDef,srcItemDef.formula);
					dispExpr=$.E.genItemDispExpr(srcItemDef.dispExpr);
				}
				oneItem={
					expr:expr,
					name:$oneli.text(),
					formulaC:formulaC,
					itemtype:srcItemDef.itemtype,
					colIdx:i,
					suffix:srcItemDef.suffix,
					prefix:srcItemDef.prefix,
					errDefault:srcItemDef.errDefault,
					displayFmt:(srcItemDef.displayFmt==undefined)||(srcItemDef.displayFmt=="undefined")?"txt":srcItemDef.displayFmt,
					dispExpr:dispExpr,
					cellWidth:srcItemDef.displayFmt=="led"?$.E.op.cellLedWidth:$.E.op.cellWidth,
					oriUnit:srcItemDef.unit,
					noChart:srcItemDef.noChart?true:false,
					sort:srcItemDef.sort,
					isShow:isShow,
					isSum:isSum
				};
				if (oneItem.isSum)
					drillDef.sumCnt++;
				if (oneItem.isShow==undefined|| oneItem.isShow)
					drillDef.visibleItems.push($.E.dealItemUnit(drillDef.unit,oneItem));
				items.push($.E.dealItemUnit(drillDef.unit,oneItem));
			}
			
			//2.产生钻取的字段对照表
			drillDef.drillMap={};
			if (drillDef.drillsDef!=undefined){
				var drillField;
				
				$.each(drillDef.drillsDef,function(fieldname){
					for(var j=0;j<items.length;j++){
						oneItem=items[j];
						if (oneItem.itemtype=="C")
							continue;//计算项不钻取
						if (oneItem.name.split(" ")[0]==fieldname){
							drillDef.drillMap[j]=fieldname;
							break;
						}
					}
				});
			}
			
			
			return items;
		},
		//计算项显示方式(pbar,led)的处理
		dispDeal:{
			//dispExpr的格式如下,且已经排序好了
			//[{val:40,disp:”B”},{val:40,disp:”B”},{val:200,disp:”R”}]
			genImgIdx:function(val,dispExpr){
				for(var i=0;i<dispExpr.length;i++){
					if (val<=dispExpr[i].val){
						return dispExpr[i].disp;
					}
				}
				return dispExpr[dispExpr.length-1].disp;
			},
			led:function($td,val,dispExpr){
				var imgName=this.genImgIdx(val,dispExpr);
				imgName="img/LED_"+imgName+".gif";
				$td[0].innerHTML="<img src="+imgName+" />";
			},
			pbar:function($td,val,dispExpr){
				var iVal=Math.abs(Math.round(parseFloat(val)));
				if (iVal>300)
					iVal=300;
				var imgName=this.genImgIdx(iVal,dispExpr);
				imgName="img/processbar/PB_"+imgName+"_"+iVal+".png";
				$td[0].innerHTML="<img src='"+imgName+"'>";
			}
		},
		getCalItems:function(items){
			var calItems=[];
			var oneItem;
			for(var i=0;i<items.length;i++){
				oneItem=items[i];
				if (oneItem.itemtype=="C")
					calItems.push(oneItem);
			}
			return calItems;
		},
		addRowData:function($tr,bufRD){
			var $td=$tr.find("td");
			var newCreate=false;
			if (bufRD==undefined||bufRD==null){
				bufRD=[];
				newCreate=true;
			}else if (bufRD.length==0){
				newCreate=true;
			}
			var val;
			for(var i=1;i<$td.size();i++){
				val=$($td[i]).attr("value");
				if (val=="null")
					val=0;
				if (newCreate)
					bufRD.push(val);
				else
					bufRD[i-1]=bufRD[i-1]*1.0+val*1.0;
			}
			return bufRD;
		},
		dealHeadDispfmt:function($tr,drillDef){
			var $td,cell;
			var $tds=$tr.find("td");
			for(var i=0;i<drillDef.lastRow.length;i++){
				cell=drillDef.lastRow[i];
				if (!cell.sum&&cell.displayFmt!=undefined&&cell.displayFmt!="txt"){
					$td=$($tds[i+1]);
					$.E.dispDeal[cell.displayFmt]($td,$td.attr("value"),cell.dispExpr);
				}
					
			}
		},
		resetTable:function(drillDef,$tab, sections, hSections,items,filter,afterReset){
			$.E.initAutoExpand(drillDef,sections, hSections, items, filter);//重刷一下打开第几层
			
			$tab.empty();
			$("#"+$.E.idFuncs.getFixCornerID(drillDef.funcno)).remove();
			
			var arHSections=hSections.split(",");
			if (arHSections.length>0&&arHSections[arHSections.length-1].trim()=="")
				arHSections.pop();
			var fixh=(arHSections.length+1)*24;
			
			$("#"+$.E.idFuncs.getFixDrilltableID(drillDef.funcno)).empty().height(fixh);
			
			var $firstRow;//第一行；在此前要插入汇总的
			var tid = "";
			var $thead = $("<thead id='"+$.E.idFuncs.getTableHeadID(drillDef.funcno)+"' class='drillTableHead'></thead>").appendTo($tab);
			var $tbody = $("<tbody class='drillTable'></tbody>").appendTo($tab);
			var calItems=$.E.getCalItems(items);
			this.resetThead(drillDef,$thead,sections,hSections,items,filter,function(scalar){
				var postdata = $.drilltable.generateStatisticCmdData(drillDef,sections, hSections,[], items,filter,scalar);
				var loadInitData = function(rows){
					var len = rows.length;
					drillDef.totSum=null;
					drillDef.totSum=[];
					var $tr=[];
					
					for (var i=0;i<len;i++){
						$tr=$.E.genTRData(rows[i],drillDef,items,sections,hSections,filter,scalar,false);
						$.E.addRowData($tr,drillDef.totSum);
					}
					drillDef.grpSum=drillDef.totSum;
					for( var i=0; i<len; i++){
						if(!rows[i]) break;//for ie bug
						
						
						var $tr =$.E.genTRData(rows[i],drillDef,items,sections,hSections,filter,scalar,true)
									.attr("id",tid+"_"+i)
									.attr("parent","none")
									.attr("level",0)
									.click(function(){
										$.drilltable.clickTr($(this),drillDef);
									})
						if (i==0)
							$firstRow=$tr;
						
						$tbody.append($tr);
						
						var $ftd = $tr.find(">td:first")
						if( $.drilltable.op.numbers ){
							$ftd.prepend("<span class='ui-state-default' style='float:left;width:24px;height:100%;padding:1px;'>"+(i+1)+"</span>");
						}
						
						if(sections.length == 1)
							$ftd.css("cursor","default")
							.find(">span").removeClass("ui-icon-plus").addClass("ui-icon-bullet");
						else
							$ftd.click(function(){
								$.drilltable.toggleNode(drillDef,$(this).parent(), sections,hSections,items,filter,scalar);
							})
					}
					//插入汇总行
					var arTotSum=[];
					for(var i=0;i<drillDef.totSum.length;i++)
						arTotSum.push({value:drillDef.totSum[i]});
					$.E.doCalcFields(arTotSum,drillDef,items);
					
					var $tabHead=$("#"+$.E.idFuncs.getFixDrilltableID(drillDef.funcno));
					if ($firstRow!=undefined){
						trSum="<tr value='000' id='_sum' parent='root'>"
						     +"<td class='fcell'>" 
						     +"<span class='ui-icon ui-icon-calculator' style='float:left'></span>"
						     +"总计</td>";
						
						var cell,isShow;
						for(var j=0;j<drillDef.totSum.length;j++){
								cell=drillDef.lastRow[j];
								isShow=cell.hide?" style='display:none' ":"";
							  trSum+="<td class='cell' value='"+arTotSum[j].value+"'"+isShow+">"+$.formatNumberToShow(arTotSum[j].value)+"</td>";
						}
						trSum+="</tr>";
						
						//汇总行的计算列的计算
						$tr=$(trSum);
						$.E.dealHeadDispfmt($tr,drillDef);
						drillDef.grpSum=drillDef.totSum;
						
						$tr.insertBefore($firstRow);
						
					}
					var scales=drillDef.horColCnt==0?1:drillDef.horColCnt;
					var $placeholder=$.drilltable.getPlaceHolder($.drilltable.op.treeWidth,drillDef,items);
					$tbody.append($placeholder);
					$("#"+$.E.idFuncs.getFixTabBodyID(drillDef.funcno)).append($placeholder);
					if(afterReset)
						afterReset();
					
					//插入fixCorner
					
					var fixW=$tabHead==undefined?0:$($tabHead.find("td:eq(0)")).width();
					if (drillDef.inRuntime){
						var fixCID=$.E.idFuncs.getFixCornerID(drillDef.funcno);
						
						drillDef.fixWidth=fixW;
						$("#"+fixCID).remove();
						var fixCornor= "<div>"
							      +"  <span class='ui-icon ui-icon-calculator' style='float:right'></span>"  
							      +"  <span style='float:right'>统计项</span>"
								  +"</div>";
						if ($tabHead.length==0||$tabHead.parent()==undefined) 
						    return;
						var topH=$.E.CONST.DTOOL_H+3;;
						var $divChart=$("#"+$.E.idFuncs.getViewCID(drillDef.funcno));
						if (drillDef.chartDef!=undefined &&$divChart.attr("layout")==0){
							topH=$divChart.height()+$.E.CONST.DTOOL_H+3;
						}
							
						$(fixCornor).appendTo($tabHead.parent())
						.css({
							'position'			:'absolute',
							'left'				:'0px',
							'top'				:topH+'px',
							'width'				:fixW+'px',
							'height'			:((arHSections.length+1)*24-3)+'px',
							'padding'			:'1px',
							'background-color'	:'#E4E4E3',
							'font-weight'       :'bold',
							'margin-left'       :'-1px',
							'border'						:'1px solid',
							'border-color'			:'#B1B1B1 black #A6C9E2 rgb(228, 228, 227)'///$$$///style中的颜色风格变的话，这里也要改掉
						})
						.attr({
							'id':fixCID
							//'class':'ui-state-active'
						});
					}
					//插入fixLeft
					var fixLeftID=$.E.idFuncs.getFixLeftID(drillDef.funcno);
					$("#"+fixLeftID).remove();
					var $fixLeft= $("<div>"
							  +"  <table cellspacing='0'>" 
							  +"  	<tbody class='drillTable'>"
							  +"		</tbody>"
							  +"	</table>"
							  +"</div>");
					var $drillBody=$tbody.parent().parent();
					$drillBody.css({'float':'left',width:($drillBody.parent().width()-fixW-6)+'px'});
					$drillBody.before($fixLeft
									  .css({
									  		'width'				:(fixW+1)+'px',
									  		'height'			:$tbody.parent().parent().height(),
											'float'				:'left',
											'overflow'			:'hidden'
									  })
									  .attr({
									  	  'id'		:fixLeftID,
									  	  'class'	:'ui-state-active'
									  })
					  				)
					var $srcTr,$srcTd,$desTr,$desTd;
					var $fixLeftTable=$fixLeft.find("tbody");
					var $trs=$tbody.find("tr");
					for(var i=0;i<$trs.length;i++){
						$srcTr=$($trs[i]);
						$srcTd=$srcTr.find("td:eq(0)");
						$desTd=$srcTd.clone();
						$desTd.click(function(){
							$tbody.find("tr:[id='"+$(this).parent().attr("id")+"'] td:first").click();
						})
						
						$srcTd.css("display","none");
						$desTr=$("<tr value='"+$srcTr.attr("value")+"' id='"+$srcTr.attr("id")+"' parent='"+$srcTr.attr("parent")+"'></tr>")
						        .append($desTd)
						        .appendTo($fixLeftTable);
						if (i==$trs.length-1)
							$desTr.height(26);
					}
					$("#"+$.E.idFuncs.getDrilltableID(drillDef.funcno)).scroll(function(){
						var srcWidth=$($tabHead.parent()).width();
						$tabHead.css({"margin-left":(-$(this).scrollLeft()+2)+'px',"width":($(this).scrollLeft()+srcWidth)+"px"});
						$fixLeft.find('table').css({"margin-top":(-$(this).scrollTop())+'px'});
					});			
					
					//一些细节位置的调整
					if (arHSections.length>0){
						$tab.parent().css("margin-left","-2px");
					}
					
					if (drillDef.treeChart&&drillDef.Vsections.length>=2){
						//自动展开到底一层
						var $rootRows=$tbody.find("tr[parent='none']");
						$.E.recursionExpand($tbody.find("tr:first"),drillDef,sections, hSections, items, filter,1,function(){
							//画各个图
							var treeChartDivID,$treeChartDiv;
							var sizeRate=0.62;
							var perHeight,perWidth;
							if ($divChart.width()<$divChart.height()){//竖着的
								perWidth=$divChart.width()-18;
								perHeight=$divChart.width()*sizeRate;
								$divChart.css({"overflow-y":"auto","overflow-x":"hidden"});
							}else{//横着的
								perHeight=$divChart.height()-2;
								perWidth=perHeight/0.52;
								$divChart.css({"overflow-x":"auto","overflow-y":"hidden"});
							}
							var $winHead,drawedIcon=false,$preHead;
							var $arrowBtn=$("	<span class='lbtn arrowMore ui-icon ui-icon-circle-triangle-e'  style='float:right;cursor: pointer'></span>"  
    		                +"	<span class='rbtn arrowMore ui-icon ui-icon-circle-triangle-w' style='float:right;cursor: pointer'></span>");
							for(var i=0;i<$rootRows.length;i++){
								//1.创建div
								$treeChartDiv=$("<div class='treeChartDiv'></div>").css({width:perWidth+'px',height:perHeight+'px',"float":"left","padding-right":"2px"})
																.appendTo($divChart);
								
								
								//2.画上表头
								$winHead = $("<h3 class='ui-widget-header ui-corner-all' style='text-align:center'>" 
									+ "<div  class='ui-dialog-title' style='padding:5px;'>"
									+ "<span style='float:left' class='ui-icon ui-icon-image'></span>"
									+ "<span id='"+$.E.idFuncs.getTreeChartHeadID(drillDef.funcno,i)+"'>"+$($rootRows[i]).find("td:first")[0].innerText+"</span>"
									+ "</div></h3>");
								$winHead.appendTo($treeChartDiv);
								if (!drawedIcon&&$treeChartDiv[0].offsetTop>0){//画上前后的箭头按钮
									var tabsgo=function($nav,lr){//前后走动的按钮function
								    if (lr){  
								        if($nav.find(".treeChartDiv:hidden:last")[0]==$nav.find(".treeChartDiv:last")[0]){
								        	$nav.find(".treeChartDiv:visible:first").hide();
								        	$nav.find(".treeChartDiv:visible:last").next().show();
								        }else{
								        	$.msgbox.show( "msg", "已经是最后一个视图！" );
								        	return;
								        }
								    }  
								    else{  
								    	if($nav.find(".treeChartDiv:visible:first")[0]==$nav.find(".treeChartDiv:first")[0]){
								    		$.msgbox.show( "msg", "已经是第一个视图！" );
								    		return;
								    	}else{
								    			$nav.find(".treeChartDiv:visible:last").hide();
								    			$nav.find(".treeChartDiv:visible:first").prev(".treeChartDiv").show();
					    			  } 
					    			}
					    			$nav.find(".arrowMore").remove();
					    			var $lastHead=$nav.find(".treeChartDiv:visible:last .ui-dialog-title");
					    			$arrowBtn.appendTo($lastHead);
					    			$lastHead.find(".lbtn").click(function(){
						    			tabsgo($divChart,1);
						    		});
						    		$lastHead.find(".rbtn").click(function(){
						    			tabsgo($divChart,0);
						    		});
					    		}
									
    		         	$arrowBtn.appendTo($preHead.find(".ui-dialog-title"));
    		          $preHead.find(".lbtn").click(function(){
					    			tabsgo($divChart,1);
					    		});
					    		$preHead.find(".rbtn").click(function(){
					    			tabsgo($divChart,0);
					    		});
    		          $treeChartDiv.css("display","none");
									drawedIcon=true;
								}else{
									if (drawedIcon)
										$treeChartDiv.css("display","none");
								}
								
								$preHead=$winHead;
								treeChartDivID=$.E.idFuncs.getTreeChartID(drillDef.funcno,i);
								$("<div></div>").attr("id",treeChartDivID)
									.css({width:perWidth+'px',height:(perHeight-26)+'px'})
									.appendTo($treeChartDiv);
								
								//2.画上chart
								$.E.drawChartIFDefC($tbody.find("tr[parent='"+$($rootRows[i]).attr("id")+"']"),drillDef,sections, hSections,items,calItems,i,true);															
							}
						});
						if (drillDef.tablechart==$.E.CONST.TABCHART_CHART){
							var realFuncno=$.E.idFuncs.getRealFuncno(drillDef.funcno);
							var $nav=$("#"+$.DC.getRegionNavID(realFuncno));
							if ($nav.find("li").length==1){
								$nav.remove();
								var $reg=$("#"+$.DC.getRegionScreenID(realFuncno));
								$reg.find("div:first").remove();
								$reg.height($reg.height()+48);
								$divChart.height($divChart.height()+48);
							}
						}
						
						
					}else{
						$.E.drawChartIFDefC($tbody.find("tr[parent='none']"),drillDef,sections, hSections,items,calItems);
					}
				  
				}
				
				$.drilltable.getStatisticData(postdata,0, loadInitData);
			});

		},//end for resettable
		doCalcFields:function(arData,drillDef,items){
			var calItems=$.E.getCalItems(items);
			var sbCalCols,colId,strPre3,calCol,repCol,calFormular,showVal,cellVal;
			var repCalcCell;
			var itemCnt=items.length;
			for(var i=0;i<drillDef.lastItems.length/items.length|0;i++){
				for(var j=0;j<calItems.length;j++){
					calFormular=calItems[j].formulaC;
					sbCalCols = calItems[j].formulaC.split('#');
					repCol=i*itemCnt+calItems[j].colIdx;
					for(var iColIdx=1; iColIdx<sbCalCols.length;iColIdx=iColIdx+2){
						colId=sbCalCols[iColIdx];
						
						strPre3=colId.substring(0,3).toUpperCase();
						
						if (strPre3=="SUM"){
							colId=colId.substring(3);
							var reg=new RegExp("#SUM"+colId+"#","g");
							calCol=i*itemCnt+Number(colId);
							calFormular=calFormular.replace( reg,drillDef.totSum[drillDef.lastItems[calCol].realidx]);
							reg=null;
						}else if(strPre3=="UPS"){
							colId=colId.substring(3);
							var reg=new RegExp("#UPS"+colId+"#","g");
							calCol=i*itemCnt+Number(colId);
							calFormular=calFormular.replace("#UPS"+colId+"#",drillDef.grpSum[drillDef.lastItems[calCol].realidx]);
							reg=null;
						}else{//一般的行
							calCol=i*itemCnt+Number(colId);
							
							cellVal=arData[drillDef.lastItems[calCol].realidx].value;
							if (cellVal=="null"){
								calFormular="";
								break;
							}
							var reg=new RegExp("#"+colId+"#","g")
							calFormular=calFormular.replace(reg,cellVal);
							reg=null;
						};
					}
					if (calFormular!=""){
						calFormular=calFormular.replace(/\-\-/g,"+");
						calFormular=calFormular.replace(/\+\+/g,"+");
						calFormular=calFormular.replace(/\+\-/g,"-");
						calFormular=calFormular.replace(/\-\+/g,"-");
						try{
							showVal=eval(calFormular);
						}catch(err){
							showVal=calItems[j].errDefault;
						}
						if (showVal==Infinity)
							showVal=calItems[j].errDefault;
						
						repCalcCell=arData[drillDef.lastItems[repCol].realidx];
						repCalcCell.value=showVal;
						repCalcCell.fmtShowVal=calItems[j].prefix+$.formatNumberToShow(showVal)+calItems[j].suffix;
						
					}else{
						repCalcCell=arData[drillDef.lastItems[repCol].realidx];
						repCalcCell.value="null";
						repCalcCell.fmtShowVal="";
					}
				}
			}
		},
		genTRData:function(data,drillDef,items,sections,hSections,filter,scalar,dealDispfmt){
			/*
				1.将data填入到arLine中
				2.根据sumAffect计算合计
				3.做计算项CalcFields
				4.再生成$tr
					1)生成td的click事件--钻取
			 		2)生成led/pbar等的显示
			*/
			
			//1.data值填入drillDef.lastRow中
			var arRowData=data.rowdata.split("$$$");
			var fillidx=0,cell;
			for(var i=0;i<drillDef.lastRow.length;i++){
				cell=drillDef.lastRow[i];
				cell.value=0.00;
				if (!cell.sum){
					cell.value=arRowData[fillidx++];
				}
			}
			//2.sumAffect
			var oneAffect,arSumFields,sumF;
			for(var i=drillDef.sumAffect.length-1;i>=0;i--){
				for(var j=0;j<drillDef.sumAffect[i].length;j++){
					oneAffect=drillDef.sumAffect[i][j];
					sumF=0.00;
					arSumFields=oneAffect.fields.split(",");
					for(var k=0;k<arSumFields.length;k++){
						if (arSumFields[k].trim()=="")
							continue;
						sumF+=drillDef.lastRow[arSumFields[k]].value==""?0:drillDef.lastRow[arSumFields[k]].value*1.00;
					}
					drillDef.lastRow[oneAffect.upperfield].value=sumF;
				}
			}
			//3.计算项
			if (dealDispfmt)
				$.E.doCalcFields(drillDef.lastRow,drillDef,items);

			
			//4.生成最后的$tr;
			var tr="";
			tr+="<tr value='"+data.rowvalue+"'>";
			tr+="<td class='fcell'><span class='ui-icon ui-icon-plus' style='float:left'></span>" + data.rowname + "</td>";
			tr+="</tr>";
			var $tr=$(tr);
			var $td;
			
			var sumAttr,fmtValue,cell,td,cell,pathval;
			//钻取中用到的变量
			var fieldname,title,postdata,secvals,secTexts,realSecs,drillField;
			for(var i=0;i<drillDef.lastRow.length;i++){
				//如果是sum的话，加上一个标志,以便生成图表的时候可以过滤掉
				cell=drillDef.lastRow[i];
				fmtValue=cell.fmtShowVal==undefined?$.formatNumberToShow(cell.value):cell.fmtShowVal;
				if (fmtValue=="NaN.00"){
				    fmtValue="";
				    cell.value="0.00";
				}
				pathval=cell.sum?"":" titlepaths='"+cell.titlepaths+"' titlevalues='"+cell.titlevalues+"'";
				$td=$("<td class='cell' value='"+cell.value+"' "+pathval+" itemname='"+cell.title+"'>"+fmtValue+"</td>");			
				if (cell.hide)
					$td.css("display","none");
				
				if (dealDispfmt&&!cell.sum){
					//4.1)钻取
					fieldname=drillDef.drillMap[cell.itemidx];				
					if (fieldname!=undefined){
						var drillField=drillDef.drillsDef[fieldname];
						if ((drillField.drillMode=="INT"&&drillDef.int_drill=="Y")||
							(drillField.drillMode=="EXT"&&drillDef.ext_drill=="Y")){
								$td.css({"color":"blue","cursor":"pointer"})
								    .click(function(){
								    	secvals=$.E.getPathVal($(this).parent());
								    	secTexts=$.E.getPathText($(this).parent(),sections);
								    	realSecs=sections.slice(0);
								    	var horTexts=$(this).attr("titlepaths");
								    	if (hSections!=""){
								    		secvals=$.E.addHorPathVal($(this),secvals);
								    		secTexts=$.E.addHorPathText($(this),hSections,secTexts);
								    		var arHorSecs=hSections.split(",");
								    		var arHorTexts=horTexts.split(",");;
								    		for(var i=0;i<arHorSecs.length;i++){
									    		realSecs.unshift(
									    				{sec:arHorSecs[i],
									    				 name:arHorTexts[i]
									    				});
									    	}
								    	}
								    	postdata=$.E.generateStatisticCmdData(drillDef,realSecs,hSections,secvals,items,filter,scalar)
								    	title=$(this).parent().find("td:eq(0)").text()+"|";
								    	title+=horTexts.replace(/,/g, "|")+"|";
								    	title+=$(this).attr("itemname");
								    	$.DG.dialogGrid(drillField,postdata,1,title,secTexts);
								});
						}
					}
					//2.显示设置
					if (cell.displayFmt!="txt")//需要图形展示
							$.E.dispDeal[cell.displayFmt]($td,cell.value,cell.dispExpr);
				}	
					
				$tr.append($td);
			}
			
			if($.E.op.hover)
				$tr.mouseover(function(){
					$(this).addClass("ui-state-default");
				}).mouseout(function(){
					$(this).removeClass("ui-state-default");
				});
			
		  return $tr;
		},
		
		getStatisticData:function(postdata,times,callback){
			var drillDef=$.E.list[postdata.instFuncno];
			var date = new Date();
			var maxMS=0;
			//设计期且加速测试的时候,且没有在slowList中，才会有超时
			if (!drillDef.inRunTime && postdata.speedUp=="Y" && 
					("-"+drillDef.slowSecList).indexOf("-"+postdata.sections+"-")==-1)
				maxMS=drillDef.maxSecond*1000;
			$.E.gridLoadStart=date.getTime();
			$.ajax({
				type: "POST",
				url:  $.drilltable.op.dataUrl,
				data: postdata, 
				dataType: "json",
				timeout:maxMS,
				success:  function( data,textStatus ){
								$("#drilltip").html("分析完毕,正在生成报表...");
								callback(data);
								if (!drillDef.inRunTime){
									if (drillDef.fastSecList==undefined)
										drillDef.fastSecList="";
									if (drillDef.slowSecList==undefined)
										drillDef.slowSecList="";
									$.E.gridLoadEnd=new Date().getTime();
									var str='执行时间:';
									if (times==1){
										str='超时执行时间:';
									}
									var $timeSpan=$("<span style='float:right' class='spanTime'>"+str+($.E.gridLoadEnd-$.E.gridLoadStart)/1000+"秒</span>");
									$(".spanTime").remove();
									$("#drillSelect").append($timeSpan);
									if (drillDef.maxSecond>0 && drillDef.speedUp=="Y"){
										if (($.E.gridLoadEnd-$.E.gridLoadStart)/1000<=drillDef.maxSecond){ //指定时间内sql出来，那么就记录下fastList
											if (("-"+drillDef.fastSecList).indexOf("-"+postdata.sections+"-")==-1&&
												("-"+drillDef.slowSecList).indexOf("-"+postdata.sections+"-")==-1){//
												drillDef.fastSecList+=postdata.sections+'-';
											}
										}else{
											if (("-"+drillDef.fastSecList).indexOf("-"+postdata.sections+"-")==-1&&
												("-"+drillDef.slowSecList).indexOf("-"+postdata.sections+"-")==-1){//
												drillDef.slowSecList+=postdata.sections+'-';
											}
										}
									}
								}
				},
				error:function(e,textStatus){
					var screenClear=true;
					if (textStatus=='timeout'){
						var reGet=false;
						if (!drillDef.inRunTime){//短(6秒)时间内连续的alert屏蔽掉
							if (("-"+drillDef.slowSecList).indexOf("-"+postdata.sections+"-")==-1)//
								drillDef.slowSecList+=postdata.sections+'-';
							
							var nowTime=(new Date()).getTime();
							if (drillDef.lastAlert==undefined || (nowTime- drillDef.lastAlert)>6000)
								reGet=true;
							drillDef.lastAlert=nowTime;
						}
						screenClear=!reGet;
						if (reGet){
							postdata.speedUp="N";
							$.E.getStatisticData(postdata,1,callback);
						}
					}else
						$.msgbox.show( "err", "获取数据失败:可能由于切面/计算项配置错误或数据过大("+textStatus+":"+e.responseText.substring(0,20)+")" );
					
					if (screenClear){
						var drillDef=$.E.list[postdata.instFuncno];
						var $screen = $("#"+drillDef.target);
						$screen.unblock();
					}
				}
			});
		},
		
		getCodeMaps:function(drillDef,postdata,callback){
			drillDef.horCols="";
			drillDef.horColCnt=0;
			if(postdata.sections.split(",").length>1)
				$.ajax({
					type: "POST",
					url:  $.drilltable.op.codeMapUrl,
					data: postdata, 
					dataType: "text",
					success:function( data,textStatus ){
						callback(data);
					},
					error:function(e,textStatus){
						$.msgbox.show( "err", "表头获取失败:可能由于切面/计算项配置错误或数据量过大("+textStatus+":"+e.responseText.substring(0,20)+")" );
					}
				});
			else callback([]);
		},
		resetThead:function(drillDef,$tabHead,sections,hSections,items,filter,complete){
			var postData=$.E.generateStatisticCmdData(drillDef,sections,hSections,[], items,filter,1);
			this.getCodeMaps(drillDef,postData,function(data){
				//一、对data进行形式上的转换
				//for debug
				//////data="工资|$|工资$|$2009|$|2009$|$男|$|男$$$工资|$|工资$|$2009|$|2009$|$女|$|女$$$工资|$|工资$|$2010|$|2010$|$男|$|男$$$工资|$|工资$|$2010|$|2010$|$女|$|女$$$奖金|$|奖金$|$2010|$|2010$|$男|$|男$$$奖金|$|奖金$|$2010|$|2010$|$女|$|女";
				//end for debug
				drillDef.horCols=data;
				var horSecCnt=postData.sections.split(",").length-1;
				drillDef.horSecCnt=horSecCnt;
				$("#drilltip").html("数据维度分析完毕,正在生成数据...");
				var arHeadTitleMatrix=[];
				if (horSecCnt>=1){
					/*data的形式
					工资|$|工资 $|$ 2009|$|2009 $|$ 男|$|男 $$$
					工资|$|工资 $|$ 2009|$|2009 $|$ 女|$|女 $$$
					工资|$|工资 $|$ 2010|$|2010 $|$ 男|$|男 $$$
					工资|$|工资 $|$ 2010|$|2010 $|$ 女|$|女 $$$
					奖金|$|奖金 $|$ 2010|$|2010 $|$ 男|$|男 $$$
					奖金|$|奖金 $|$ 2010|$|2010 $|$ 女|$|女
					==1==>(arMapMatrix)
					[
					  [
					    [	工资|$|工资,		2009|$|2009,		男|$|男 	],
							[	工资|$|工资,		2009|$|2009,		女|$|女 	],
							[	工资|$|工资,		2010|$|2010,		男|$|男 	],
							[	工资|$|工资,		2010|$|2010,		女|$|女 	],
							[	奖金|$|奖金,		2010|$|2010,		男|$|男 	],
							[	奖金|$|奖金,		2010|$|2010,		女|$|女		]
							]
					  ]
					]
					==2==>(arDesMatrix)
					[
					  [{code:"工资",name:"工资",colspan:4},	{code:"工资",name:"工资",colspan:0},{code:"工资",name:"工资",colspan:0},{code:"工资",name:"工资",colspan:0},{code:"奖金",name:"奖金",colspan:2},{code:"奖金",name:"奖金",colspan:0}], //第一行tr
					  [{code:"2009",name:"2009",colspan:2},	{code:"2009",name:"2009",colspan:0},{code:"2010",name:"2010",colspan:2},{code:"2010",name:"2010",colspan:0},{code:"2010",name:"2010",colspan:2},{code:"2010",name:"2010",colspan:0}],//第二行tr
					  [{code:"男",name:"男",colspan:1},			{code:"女",name:"女",colspan:1},		{code:"男",name:"男",colspan:1},		{code:"女",name:"女",colspan:1},		{code:"男",name:"男",colspan:1},		{code:"女",name:"女",colspan:1}]//第三行tr
					]
					==3.1==>假设计算项为(实发数	拟发数)  (arHeadTitleMatrix)
					合计:R-4	工资:C-15	工资			工资			工资		工资		工资		工资		工资		工资			工资	工资		工资		工资	工资		工资		奖金	奖金	奖金	奖金		奖金		奖金	奖金		奖金
					合计:R		合计:R-3	2009:C-7	2009			2009		2009		2009		2009		2009		2010:C-7	2010	2010		2010		2010	2010		2010		合计	2010	2010	2010		2010		2010	2010		2010
					合计:R		合计:R		合计:R-2	男:C-3		男			男			女:C-3	女			女			合计:R-2	男		男			男			女		女			女			合计	合计	男		男			男			女		女			女
					合计:R		合计:R		合计:R		合计:R-1	实发数	拟发数	合计		实发数	拟发数	合计			合计	实发数	拟发数	合计	实发数	拟发数	合计	合计	合计	实发数	拟发数	合计	实发数	拟发数
					
					==3.2==>形成sum的影响关系。由于计算项可能会不同，因此这里的列数可能会大于3.1的数组列数
					sum数组		合计			合计:0		合计:1		合计:2	实发数:3	拟发数:4	合计	实发数	拟发数	合计	合计	实发数	拟发数	合计	实发数	拟发数	合计	合计	合计	实发数	拟发数	合计	实发数	拟发数
										0					1					2					3				4					5					6			7				8				9			10		11			12			13		14			15			16		17		18		19			20			21		22			23

					形成sum				0		0:1|16					
					影响关系			1		1:2|9	16:17				
					数组					2		2:3|6	9:10|13	17:18|21			
					arAffectSum		3		3:4|5	6:7|8	10:11|12	13:14|15	18:19|20	21:22|23
					*/
					
					//检查头上是不是一直都没有合并
					var checkPathEqual=function(arCheckMatrix,iRow,iCol){
						if (iRow==arCheckMatrix.length-1)
							return false;
						for(var i=iCol;i>=0;i--){
							if (arCheckMatrix[iRow][i]!=arCheckMatrix[iRow+1][i])
								return false;
						}
						return true;
					}
					//1.先将data split为一个二维数组;
					var arMap=data.split($.E.CONST.HOR_HEAD_SPLITER);
					drillDef.horColCnt=arMap.length;
					var arMapMatrix=[];
					for(var i=0;i<arMap.length;i++){
						arMapMatrix.push(arMap[i].split($.E.CONST.HOR_LVL_SPLITER));
					}
					//2.转为2的合并表头，但未sum的格式
					var arDesMatrix=[];
					var arKV=[];
					for(var iCol=0;iCol<arMapMatrix[0].length;iCol++){
						var arOneRow=[];
						var colspan=1;
						var spanidx=0;
						for(var iRow=0;iRow<arMapMatrix.length;iRow++){
							//colspan停止增长(结束合并)的条件是:
							//1.最后一行或者2.
							//2.从col-1一直到0列都进行判断，不是全部相同
							arKV=arMapMatrix[iRow][iCol].split($.E.CONST.KV_SPLITER);
							arOneRow.push({
								"code":arKV[0],
								"name":arKV[1],
								"span":0
							});
							if ((iCol+1)==horSecCnt||!checkPathEqual(arMapMatrix,iRow,iCol)){
								arOneRow[spanidx].span=colspan;
								spanidx=iRow+1;
								colspan=1;	
							}else{
								colspan++;
							};
							
						}
						arDesMatrix.push(arOneRow);
					}
					
					//3.1.根据计算项，生成3.1
					if (drillDef.sumCnt>0){
						//  1)先插入头列:sum
						for(var iRow=0;iRow<=horSecCnt;iRow++){
							arHeadTitleMatrix.push([]);
							arHeadTitleMatrix[iRow].push({
								title:"合计",
								sum:true,
								spantype:"R",
								span:iRow==0?horSecCnt+1:0
							});
						}
						//  2)后面的部分的数组
						/*  +sum列的matrix算法
								(1) arMapMatrix中的每一列从第二行开始往下扫描(假设当前扫描到第iCol列,iRow行)
								(2) 如果iRow-1行是一个新的合并行(span>1),arHeadTitleMatrix中的iRow行插入一个合计:R-x(注:x=表格头的总高度-iRow)
						*/
						var fillCol=1,fillRow=0;
						for(var iCol=0;iCol<arDesMatrix[0].length;iCol++){
							for(var iRow=0;iRow<horSecCnt;iRow++){
								
								if (iRow==0||arDesMatrix[iRow-1][iCol].span==0){//头上一行无合并
									arHeadTitleMatrix[fillRow++].push({
										title:arDesMatrix[iRow][iCol].name,
										code :arDesMatrix[iRow][iCol].code,
										sum:false,
										spantype:"C",
										span:0
									});
								}else{//头上一行是合并行
									//(1)先把fillRow之后的行都填上“合计”
									//(2)再从新一列的0行一直到iRow行都填上arMapMatrix中的信息
									
									//(1)
									for(var firstCell=true;fillRow<arDesMatrix.length+1;fillRow++){
										arHeadTitleMatrix[fillRow].push({
											title:"合计",
											sum:true,
											spantype:"R",
											span:firstCell?arDesMatrix.length+1-fillRow:0
										});
										firstCell=false;
									}
									//(2).
									fillRow=0;
									for(;fillRow<=iRow;fillRow++){
										arHeadTitleMatrix[fillRow].push({
											title:arDesMatrix[fillRow][iCol].name,
											code :arDesMatrix[fillRow][iCol].code,
											sum:false,
											spantype:"C",
											span:0
										});
									}	
								}
								//最后一行，加上计算项
								/*
									(1).先加上合计
									(2).各个items都生成完整的列
								*/
								if (iRow==horSecCnt-1){
									//(1)
									arHeadTitleMatrix[arDesMatrix.length].push({
										title:"合计",
					 					sum:true,
					 					spantype:"R",
					 					span:1
					 				});
									//(2)
									for(var i=0;i<items.length;i++){
										for(fillRow=0;fillRow<horSecCnt+1;fillRow++){
											arHeadTitleMatrix[fillRow].push({
												title			:	fillRow==horSecCnt?items[i].name.split(" ")[0]:arDesMatrix[fillRow][iCol].name,
												code			:	fillRow==horSecCnt?"":arDesMatrix[fillRow][iCol].code,
												sum				:	false,
												spantype	:	"C",
												span			:	fillRow==horSecCnt?1:0,
												itemidx		:	i,
												hide			:	(fillRow==horSecCnt&&!(items[i].isShow==undefined||items[i].isShow))?true:false
											});
										}
									}
									fillRow=0;
								}
							}
						}
					}else{//无sum的计算项
						for(var iRow=0;iRow<arDesMatrix.length+1;iRow++){
							arHeadTitleMatrix.push([]);
							for(var iCol=0;iCol<arDesMatrix[0].length;iCol++){
								for(var itemidx=0;itemidx<items.length;itemidx++){
									arHeadTitleMatrix[iRow].push({
										title			:iRow==arDesMatrix.length?items[itemidx].name.split(" ")[0]:arDesMatrix[iRow][iCol].name,
										code			:iRow==arDesMatrix.length?"":arDesMatrix[iRow][iCol].code,
										sum				:false,
										spantype	:"C",
										span			:iRow==arDesMatrix.length?1:0,
										itemidx		:itemidx,
										hide			:iRow==arDesMatrix.length&&!(items[itemidx].isShow==undefined||items[itemidx].isShow)
									});
								}	
							}
						}
					}
					
					//   3)合并表头，生成colspan
					var checkTitlePathEqual=function(arCheckMatrix,iRow,iCol){
						if (iCol==arCheckMatrix[0].length-1)
							return false;
						for(var i=iRow;i>=0;i--){
							if (arCheckMatrix[i][iCol].title!=arCheckMatrix[i][iCol+1].title)
								return false;
						}
						return true;
					}
					var cell,lastCellR;
					var horColCnt=arHeadTitleMatrix[0].length;
					var horRowCnt=arHeadTitleMatrix.length;
					for(var iRow=0;iRow<horRowCnt-1;iRow++){
						var colspan=1;
						var spanidx=0;
						for(var iCol=0;iCol<horColCnt;iCol++){
							//colspan停止增长(结束合并)的条件是:
							//1.最后一行或者2.
							//2.从col-1一直到0列都进行判断，不是全部相同
							cell=arHeadTitleMatrix[iRow][iCol];
							if (drillDef.sumCnt==0&&cell.spantype=="C"&&cell.itemidx==0&&!items[cell.itemidx].isShow)
								colspan=0;
								
							if ((iCol+1)==horColCnt||!checkTitlePathEqual(arHeadTitleMatrix,iRow,iCol)){
								if (cell.spantype=="C")
									arHeadTitleMatrix[iRow][spanidx].span=colspan;
								colspan=1;	
								spanidx=iCol+1;
							}else{
								lastCellR=arHeadTitleMatrix[horRowCnt-1][iCol+1];
								
								if (lastCellR.spantype=="C"&&!items[lastCellR.itemidx].isShow)
									continue
								else
									colspan++;
							};
						}
					}
				}else{//无横向section	
					arHeadTitleMatrix.push([]);
					if (drillDef.sumCnt>=1){
						arHeadTitleMatrix[0].push({
								title:"合计",//列名
								sum:true,
								spantype:"C",
								span:1//跨越多少个格子
						});
					}
					for(var iCol=0;iCol<items.length;iCol++){
						arHeadTitleMatrix[0].push({
								title:items[iCol].name.split(" ")[0],//列名
								sum:false,
								spantype:"C",
								span:1,
								itemidx:iCol,
								hide:!items[iCol].isShow
						});
					}
				}
				//3.2.生成sum的影响关系
				var getTitlePath=function(arHeadTitleMatrix,iCol){
					var result={
								titlepaths:"",
								titlevalues:""
							};
					var cell;
					for(var iRow=0;iRow<arHeadTitleMatrix.length-1;iRow++){
						cell=arHeadTitleMatrix[iRow][iCol];
						result.titlepaths+=cell.title;
						result.titlevalues+=cell.code;
						if (iRow<arHeadTitleMatrix.length-2){
							result.titlepaths+=",";
							result.titlevalues+=",";
						}	
					}
					return result;
				}
				var arLine=[];//最后一行
				var iLastRow=arHeadTitleMatrix.length-1;
				var itemidx,titlePath,arCell;
				for(var i=0;i<arHeadTitleMatrix[iLastRow].length;i++){
					arCell=arHeadTitleMatrix[iLastRow][i];
					if (!arCell.sum){
						itemidx=arHeadTitleMatrix[iLastRow][i].itemidx;
						arCell.displayFmt=items[itemidx].displayFmt;
						arCell.dispExpr=items[itemidx].dispExpr;
						titlePath=getTitlePath(arHeadTitleMatrix,i);
						arCell.titlepaths=titlePath.titlepaths;
						arCell.titlevalues=titlePath.titlevalues;
					}
					arLine[i]=arCell;
				}
				var SumAffect=[];//生成sum的影响关系
				if (drillDef.sumCnt>0){
					var sumIdx;
					var cell,lowerCell;
					var sumFields="";
					for(var iRow=0;iRow<arHeadTitleMatrix.length-1;iRow++){//
						sumIdx=-1;
						for(var iCol=0;iCol<arHeadTitleMatrix[0].length;iCol++){
							cell=arHeadTitleMatrix[iRow][iCol];
							if ((cell.sum&&cell.span>0)||iCol==arHeadTitleMatrix[0].length-1){//需要记录下前面的影响关系了
								if (sumIdx!=-1){//记录下影响关系
									sumFields=sumFields.substring(0,sumFields.length-1);
									if (SumAffect[iRow]==undefined)
										SumAffect.push([]);
									SumAffect[iRow].push({
										upperfield:sumIdx,
										fields:sumFields
									});
								}
								sumIdx=iCol;
								sumFields="";
							}else{
								if (sumIdx==-1)
									continue;
								lowerCell=arHeadTitleMatrix[iRow+1][iCol];
								if (lowerCell.sum&&lowerCell.span>0){//影响当前sumIdx的汇总
									sumFields+=iCol+",";
								}
							}
						}
					}
					//  加上最后一行的sum关系;当出现cell.sum&&cell.span>0的时候开始记录；cell.sum的时候结束
					SumAffect.push([]);
					sumFields="";
					sumIdx=-1;
					for(var iCol=0;iCol<arHeadTitleMatrix[0].length;iCol++){
						cell=arHeadTitleMatrix[arHeadTitleMatrix.length-1][iCol];
						if (cell.sum||iCol==arHeadTitleMatrix[0].length-1){
							if (iCol==arHeadTitleMatrix[0].length-1&&items[cell.itemidx].isSum){
								sumFields+=iCol+",";
							}
							if (sumIdx!=-1&&sumFields!=""){//说明要记录影响关系
								sumFields=sumFields.substring(0,sumFields.length-1);
								SumAffect[arHeadTitleMatrix.length-1].push({
									upperfield:sumIdx,
									fields:sumFields
								});
								sumFields="";
							}
							if (cell.span>0){//重新开始
								sumIdx=iCol;
								sumFields="";
							}
						}else{//sumFields累加;
							if (sumIdx!=-1&&items[cell.itemidx].isSum)//这个条件应该是必然成立的
								sumFields+=iCol+",";
						}
					}
				}

				//4、生成表头
				//1.生成上面的合并头
				var $tr;
				for(var i=0; i<arHeadTitleMatrix.length; i++){
					$tr = $.drilltable.wrapHeadTr(drillDef.funcno,arHeadTitleMatrix[i],i==arHeadTitleMatrix.length-1,items);
					$tabHead.append($tr);
				}

				//5.加上固定的title
				var $tablediv=$("#"+$.E.idFuncs.getFixDrilltableID(drillDef.funcno));
				var $fixHead=$tabHead.clone();
				$fixHead.find("span").click(function(){
					//排序按钮的点击排序
					if ($(this).hasClass('sortU')){
						$.E.sortGrid($(this).parent().attr("idx"),drillDef.funcno,true);
					}else if ($(this).hasClass('sortD')){
						$.E.sortGrid($(this).parent().attr("idx"),drillDef.funcno,false);
					}
				});
				
				$fixHead.attr("id",$.E.idFuncs.getFixTableHeadID(drillDef.funcno))
				$tablediv.append($fixHead)
						 .append($("<tbody id='"+$.E.idFuncs.getFixTabBodyID(drillDef.funcno)+"' class='drillTable'></tbody>"));
				$tabHead.css("display","none");
				
				//6.设置一些全局变量
				drillDef.sumAffect=null;
				drillDef.lastRow=null;
				drillDef.lastItems=null;
				drillDef.sumAffect=SumAffect;
				drillDef.lastRow=arLine;
				
				drillDef.lastItems=[];
				for(var i=0;i<arLine.length;i++){
					if (!arLine[i].sum){
						itemidx=arLine[i].itemidx;
						drillDef.lastItems.push({
							realidx		:i,
							itemidx		:itemidx
						});
					}
				}
			
				//7.生成xlsTilte,导出Excel的时候用的drillDef.xlsTitle
				drillDef.xlsTitle="";
				for(var i=0;i<arHeadTitleMatrix.length;i++){
					for(var j=0;j<arHeadTitleMatrix[0].length;j++){
						cell=arHeadTitleMatrix[i][j];
						drillDef.xlsTitle+=cell.title+$.E.CONST.KV_SPLITER+cell.span+$.E.CONST.KV_SPLITER+cell.spantype+$.E.CONST.HOR_HEAD_SPLITER;
					}
					if (i!=arHeadTitleMatrix.length-1)
						drillDef.xlsTitle+=$.E.CONST.HOR_LVL_SPLITER;
				}
				
				//8.加载数据
				complete(1);
			});
			
		},
		
		sortGrid:function(idx,funcno,asc){
			var $tbody=$("#"+$.E.idFuncs.getDrillTabletabID(funcno)+" tbody");
			var $trs=$tbody.find("tr");
			var $tr;
			//1.先把排序的数据放到一个数组中：ord,value,parent,sortVal
			//  sortVal的值的规则是:一路parent的值+自己的value。这样一次排序便可以全部排完
			var arRow=[];
			var COL_ORD=0,COL_VALUE=1,COL_PARENT=2,COL_SORTVAL=3;//当常量用
			var pRow=-1;
			var nowParent,nowParentVal;
			var pathValue,trParent,val;
			var maxLen=20;
			for(var i=1;i<$trs.length-1;i++){
				$tr=$($trs[i]);
				arRow.push([]);
				val=parseFloat($tr.find("td:eq("+idx+")").attr("value")).toFixed("2");
				trParent=$tr.attr("parent").trim();
				if (trParent=="none"){
					pathValue="";
					nowParent=trParent;
					nowParentVal=val;
				}else{
					if (trParent!=nowParent){
						pathValue+=$.padLeft(nowParentVal,20," ");
					}
					nowParent=trParent;
					nowParentVal=val;
				}
				arRow[i-1]=[i,val,trParent,pathValue+$.padLeft(val,20," ")];
				maxLen=Math.max(maxLen,pathValue.length+20);
			}
			//2.对数组的sortVal字段进行排序
			if (!asc){
				for(var i=0;i<arRow.length;i++){
					arRow[i][COL_SORTVAL]=$.padRight(arRow[i][COL_SORTVAL],maxLen,"9");
				}
			}
			var tmp;
			for(var i=0;i<arRow.length-1;i++)
				for(var j=0;j<arRow.length-1-i;j++){
					if ((arRow[j][COL_SORTVAL]>arRow[j+1][COL_SORTVAL]&&asc)||
					    (arRow[j][COL_SORTVAL]<arRow[j+1][COL_SORTVAL]&&!asc)){
						tmp=arRow[j];
						arRow[j]=arRow[j+1];
						arRow[j+1]=tmp;
					}
				}
			
			//3.按照排序的结果，对grid进行重新的整理
			$cloneTrs=$trs;
			$tbody.append($($cloneTrs[0]));
			for(var i=1;i<$cloneTrs.length-1;i++){
				$tbody.append($($cloneTrs[arRow[i-1][COL_ORD]]));
			}
			$tbody.append($($cloneTrs[$cloneTrs.length-1]));
			
			//4.做fixLeft
			var $fixLeftTable=$("#"+$.E.idFuncs.getFixLeftID(funcno)+" tbody");
			$fixLeftTable.empty();
			var $srcTr,$desTr,$srcTd,$desTd;
			$trs=$tbody.find("tr");
			for(var i=0;i<$trs.length;i++){
				$srcTr=$($trs[i]);
				$srcTd=$srcTr.find("td:eq(0)");
				$desTd=$srcTd.clone();
				if ($srcTr.css("display")!="none")
					$desTd.css("display","block");
				$desTd.click(function(){
					$tbody.find("tr:[id='"+$(this).parent().attr("id")+"'] td:first").click();
				})
				
				$desTr=$("<tr value='"+$srcTr.attr("value")+"' id='"+$srcTr.attr("id")+"' parent='"+$srcTr.attr("parent")+"'></tr>")
				        .append($desTd)
				        .appendTo($fixLeftTable);
				if (i==$trs.length-1){
					$desTr.height(26);
					$desTr.find("td").height(22);
				}
			}
		},
		
		wrapHeadTr:function(funcno,trRow,lastTitle,items){
			var $tr = $("<tr class='ui-state-default'><td style='width:"+$.drilltable.op.treeWidth+"px;'>&nbsp;</td></tr>");
			var oneTd,strDisplay,sortBtn,idx=0;
			for(var i=0;i<trRow.length;i++){
				oneTd=trRow[i];
				strDisplay="";
				sortBtn="";
				if (oneTd.hide)
					strDisplay+=";display:none";
				if (lastTitle){
					idx++;
					sortBtn="<span class='ui-icon ui-icon-circle-arrow-n sortU' style='float:left;cursor:pointer'></span>"
				         +"<span class='ui-icon ui-icon-circle-arrow-s sortD' style='float:left;cursor:pointer'></span>";
					if (oneTd.itemidx!=undefined && items[oneTd.itemidx].displayFmt=="led")
						strDisplay+=";width:24px;padding:1px";
					else
						strDisplay+=";padding-right:5px;padding-left:1px;width:"+$.E.op.cellWidth+"px";
				}
					
				if (oneTd.span>0){
					if (oneTd.spantype=="R"){
						sortBtn="<span class='ui-icon ui-icon-circle-arrow-n sortU' style='float:left;cursor:pointer'></span>"
				          +"<span class='ui-icon ui-icon-circle-arrow-s sortD' style='float:left;cursor:pointer'></span>";
						
						$tr.append("<td rowspan='"+oneTd.span+"' style='text-align:center"+strDisplay+"'>"+sortBtn+oneTd.title+"</td>");
					}else
						$tr.append("<td idx="+idx+" colspan='"+oneTd.span+"' style='text-align:center"+strDisplay+"'>"
						          +sortBtn
						          +oneTd.title+"</td>");
				}
			}
			return $tr;
		},
		
		generateStatisticCmdData:function(drillDef,sections,hSections,secvals,items,filter,scalar){
			var tMap = drillDef.tableMap;
			var currSec = sections[ secvals.length ];
			if (currSec==undefined)
				currSec = sections[ secvals.length-1 ];
			var fItems = "";
			var drillDef=$.E.list[drillDef.funcno];
			var sort ="";
			var arExpr;
			for(var i=0; i<items.length; i++){
				fItems +=  (items[i].expr==undefined?(items[i].formula+" S"+i):items[i].expr)+",";
				if (items[i].sort!=undefined && items[i].sort!=''){
					arExpr=items[i].expr.split(" ");
					sort+=arExpr[arExpr.length-1]+" "+items[i].sort+",";
				}
			}
			delete arExpr;
			if (sort!="")
				sort=sort.substring(0, sort.length-1);
			fItems=fItems.substring(0, fItems.length-1);
			
			var selCond = "";
			for(var i=0; i<secvals.length; i++){
				if (secvals[i]!=$.E.op.NULL_NODE){
					var sec = sections[i].sec;
					selCond += sec + " = '" +secvals[i] + "' and ";
				}
			}
			if (selCond!="")
				selCond=selCond.substr(0,selCond.length-4);
			for(var i=0; i<sections.length; i++){
				var sec = sections[i].sec;
				tMap[sec.split(".")[0]].enable = true;
			}
			
			var hs = hSections.split(",");
			
			for(var i=0; i<hs.length;i++)
				if(hs[i]!="")
					tMap[ hs[i].split(".")[0] ].enable = true;
			
			var tables = drillDef.baseTable;
			var joinCond = "1=1";
			$.each(tMap,function(i){
				if(i!=drillDef.baseTable && (tMap[i].enable || filter.match(i+".")) ){
					tables += "," + i;
					joinCond += " AND " + tMap[i].joinCond; 
					tMap[i].enable = false;
				}
			});
			joinCond = joinCond.replace("1=1 AND", "");
			if (drillDef.fastSecList==undefined)
				drillDef.fastSecList="";
		    if (drillDef.slowSecList==undefined)
				drillDef.slowSecList="";
		    
			var dealPersonalFilter=function(cond){
				//cond:Y_DEPART.DEPARTA P_FILTER #0-USERINFO.SPEC1#;Y_DEPART.DEPARTA in ('A') 
				if (cond.indexOf($.E.CONST.PERSONAL_FILTER)!=-1){
					var arConds=cond.split(";");//arConds:[Y_DEPART.DEPARTA P_FILTER #0-USERINFO.SPEC1# , Y_DEPART.DEPARTA in ('A')]
					var pCond="";
					for(var i=0;i<arConds.length;i++){
						if (arConds[i].indexOf($.E.CONST.PERSONAL_FILTER)!=-1){
							
							var arOneCond=arConds[i].split($.E.CONST.PERSONAL_FILTER);//arOneCond:[Y_DEPART.DEPARTA,#0-USERINFO.SPEC1#];
							pCond=$.UC.parser(arOneCond[1]).trim();
							
							arConds[i]=arOneCond[0]+$.E.dealPersonCond(pCond);
							delete arOneCond;
						}
					}
					var result=arConds.join(";");
					delete arConds;
					return result;
				}else
					return cond;
			}
			var cond=dealPersonalFilter(drillDef.cond);//替换上本地上下文中的变量
			if (drillDef.reselectCond!=undefined){
				$.each(drillDef.reselectCond,function(secField){
					var oneCond=drillDef.reselectCond[secField];
					if (oneCond!=undefined){
						if (oneCond.multi)
							cond+=";"+secField+" in ("+oneCond.cond+")";
						else
							cond+=";"+secField+" = "+oneCond.cond;
					}
				});
			}	
			
			return {
				sections : currSec.sec+(hSections?","+hSections:""),
				items:fItems,
				tables : tables,
				joinCond : joinCond,
				selCond : selCond,
				filter : $.userContext.parser( filter ),
				order	:"ASC",
				scalar:scalar,
				codeMap:$.drilltable.op.codeMap,
				funcNo: drillDef.tplFuncno ,
				instFuncno:drillDef.funcno,
				cond:cond,
				fastSecList:drillDef.fastSecList,
				slowSecList:drillDef.slowSecList,
				maxSecond:drillDef.maxSecond,
				speedUp:drillDef.speedUp,
				sort:sort,
				horcols:drillDef.horCols==undefined?"":drillDef.horCols
			}
		},
		getUnit:function(srcUnitExpr){
			var idxUnitStart=srcUnitExpr.lastIndexOf("(")+1;
			var idxUnitEnd=srcUnitExpr.lastIndexOf(")")-1;
			return srcUnitExpr.substring(idxUnitStart,idxUnitEnd);
			
		},
		getItemsFirstUnit:function(items){
			if (items==undefined||items[0]==undefined)
				return "";
			else
				return this.getUnit(items[0].name);
		},
		collapse:function($node){
			var $span=$node.find(">td:first>span");
			if ($span.hasClass("ui-icon-minus")){
				var id = $node.attr("id");
				
				var boot = $node.parent();
				boot.find(">tr[parent^="+id+"]").hide();
				$span.removeClass("ui-icon-minus").addClass("ui-icon-plus");
			}
		},
		
		expand:function ($node){
			var id = $node.attr("id");
			var boot = $node.parent();
			boot.find(">tr[parent="+id+"]").show();
			$node.find(">td:first>span").removeClass("ui-icon-plus").addClass("ui-icon-minus");
		
		},
		toggleNode:function (drillDef,$node, sections, hSections, items, filter,scalar,completeFunc,onCreate){
			var $span = $node.find(">td:first>span");
			var treeChartIdx;
			if (drillDef.chartDef!=undefined&&drillDef.treeChart){
				var rootID=$.E.idFuncs.getRootRowID($node);
				var treeIdx=rootID.substring(1,rootID.length); 
				var $rootRow=$node.parent().find("tr[id='"+rootID+"']");
				treeChartIdx=parseInt(rootID.split("_")[1]);
				if ($span.hasClass("ui-icon-minus")){//返回上层
					var $parentRow=$node.parent().find("tr[id='"+$node.attr("parent")+"']");
					$rootRow.attr("nowParentIndex",$parentRow.attr("id"));
					$("#"+$.E.idFuncs.getTreeChartHeadID(drillDef.funcno,treeIdx)).text($parentRow.find("td:first")[0].innerText);
				}else{
					$rootRow.attr("nowParentIndex",$node.attr("id"));
					$("#"+$.E.idFuncs.getTreeChartHeadID(drillDef.funcno,treeIdx)).text($node.find("td:first")[0].innerText);
				}
			}
			
			if (!onCreate){
				//上下文变量和影响
				var realFuncno=$.E.idFuncs.getRealFuncno(drillDef.funcno);
				$.UC.setData(realFuncno+'-code',$node.attr("value"));
				$.UC.setData(realFuncno+'-name',$node.find("td:first").text().trim());
				//刷新影响关系
				$.page.triggerBy(realFuncno);
			}
			
			drillDef.grpSum=[];
			$.E.addRowData($node,drillDef.grpSum);
			
			var calItems=$.E.getCalItems(items);
			
			var $fltbody=$("#"+$.E.idFuncs.getFixLeftID(drillDef.funcno)).find("tbody");
			var $fixTr=$fltbody.find("tr:[id='"+$node.attr("id")+"']");
			var $fixSpan = $fixTr.find(">td:first>span");
			
			
			if($span.hasClass("ui-icon-minus")){
				$.E.drawChartIFDefC($node.parent().find("tr:[parent='"+$node.attr("parent")+"']"),drillDef,sections, hSections,items,calItems,treeChartIdx,$.E.isRootNode($node));
				$.drilltable.collapse($fixTr);
				if (typeof(completeFunc) == "function")
					completeFunc();
				return $.drilltable.collapse($node);
			}
			
			if( $span.hasClass("binded") ){
				$.E.drawChartIFDefC($node.parent().find("tr:[parent='"+$node.attr('ID')+"']"),drillDef,sections, hSections,items,calItems,treeChartIdx,false);
				$.drilltable.expand($fixTr);
				$.drilltable.expand($node);
				if (typeof(completeFunc) == "function")
					completeFunc(); 
			}else{
				var secvals = $.drilltable.getPathVal( $node );
				var postdata = this.generateStatisticCmdData(drillDef,sections,hSections, secvals, items,filter,scalar);
				var $screen=$.E.getBlockDiv(drillDef);
				$screen.block({message:"<p class='ui-state-active'>钻取数据...</p>",
						 overlayCSS:{backgroundColor: '#0F4569', opacity:0.6 }	
				});
				
				this.getStatisticData(postdata,0, function( rows ){
					var id = $node.attr("id");
					var left = parseInt( $node.find(">td:first").css("padding-left").match(/\d+/) ) + $.drilltable.op.indent;
					var len = rows.length;
					var insOneTr=function($tr,i,$insNode,$this){
						$tr.attr("id",id+"_"+i)
								.attr("parent",id)
								.attr("level",parseInt($node.attr("level"))+1)
								.insertAfter( $insNode )
								.click(function(){
									$.drilltable.clickTr( $(this),drillDef);
								})
							$ftd = $tr.find( ">td:first" )
								.css( "padding-left",left+"px" );
								
							if(secvals.length == sections.length-1)
								$ftd.css("cursor","default")
									.find(">span").removeClass("ui-icon-plus").addClass("ui-icon-bullet");
							else
								$ftd.click(function(){
									$.drilltable.toggleNode(drillDef,$(this).parent(), sections,hSections, items,filter,scalar);
								})
					}
					
					if (len==0){
						$tr=$node.clone();
						insOneTr($tr,0,$node,$(this));
						$tr.attr("value",$.E.op.NULL_NODE);
					}else{
						var $insNode=$node;
						for( var i=0; i<len; i++){
							if(!rows[i]) break;
							
							var $tr =$.E.genTRData(rows[i],drillDef,items,sections,hSections,filter,scalar,true);
							insOneTr($tr,i,$insNode,$(this));
							$insNode=$tr;
						}
					};
					var $trs=$node.parent().find("tr:[parent='"+$node.attr("id")+"']");
					$.E.drawChartIFDefC($trs,drillDef,sections, hSections,items,calItems,treeChartIdx,false);
					
					//做左边的fix的部分
					var $srcTr,$srcTd,$desTr,$desTd;
					var $insTr=$fixTr
					for(var i=0;i<$trs.length;i++){
						$srcTr=$($trs[i]);
						$srcTd=$srcTr.find("td:eq(0)");
						$desTd=$srcTd.clone();
						$desTd.css('display','block');
						$desTd.click(function(){
							$node.parent().find("tr:[id='"+$(this).parent().attr("id")+"'] td:first").click();
						})
						
						$srcTd.css("display","none");
						$desTr=$("<tr value='"+$srcTr.attr("value")+"' id='"+$srcTr.attr("id")+"' parent='"+$srcTr.attr("parent")+"'></tr>")
						        .append($desTd)
						        .insertAfter($insTr);
						$insTr=$desTr;
					}
					
					//判断一下是不是有不完整的数据:sqlA中有，sqlB中没有
					var sumNodes=[];
					for(var i=0;i<$trs.length;i++)
						$.E.addRowData($($trs[i]),sumNodes);
					var firstIdx=drillDef.lastItems[0].realidx;
					if ($.formatNumberToShow(sumNodes[firstIdx])!=$.formatNumberToShow(drillDef.grpSum[firstIdx])){//说明不相同
						$.ajax({
							type: "POST",
							url:  $.E.op.code0Url,
							data: postdata, 
							dataType: "json",
							success:  function( data,textStatus ){
								var strCode0s=$.E.CONST.SPLITER+data[0].codes+$.E.CONST.SPLITER;
								var code0;
								for(var i=0;i<$trs.length;i++){
									code0=$($trs[i]).attr("value").trim()+$.E.CONST.SPLITER;
									if (strCode0s.indexOf($.E.CONST.SPLITER+code0)!=-1)
										strCode0s=strCode0s.replace(code0,"");
								}
								var arCode0s=strCode0s.split($.E.CONST.SPLITER);
								code0="";
								for(var i=0;i<arCode0s.length;i++){
									if (arCode0s[i].trim()!="")
										code0+=arCode0s[i].trim()+",";
								}
								if (code0.length>0){
									code0=code0.substring(0,code0.length-1);
									$.addHint($node.find("td"),"数据对照不完整:切面代码"+code0+"在代码表中不存在");
									$node.find("td").css("background-color","rgb(241, 234, 154)");
									
									$.addHint($fixTr.find("td"),"数据对照不完整:切面代码"+code0+"在代码表中不存在");
									$fixTr.find("td").css("background-color","rgb(241, 234, 154)");
								}	
							},
							error:function(e){
								alert(e.responseText);
							}
						});
					}
					
					
					$screen.unblock();
					$span.addClass("binded").removeClass("ui-icon-plus").addClass("ui-icon-minus");
					$fixSpan.addClass("binded").removeClass("ui-icon-plus").addClass("ui-icon-minus");
					if (typeof(completeFunc) == "function")
						completeFunc();
				});
				
			}
		},
		addHorPathVal:function($cell,vals){
			var titlevalues=$cell.attr("titlevalues");
			var arvalues=titlevalues.split(",");
			for(var i=0;i<arvalues.length;i++){
				if (arvalues[i]!="")
					vals.unshift(arvalues[i]);
			}
			return vals;
		},
		addHorPathText:function($cell,horSec,vals){
			var titlepaths=$cell.attr("titlepaths");
			var arPaths=titlepaths.split(",");
			var arHorSecs=horSec.split(",");
			for(var i=0;i<arPaths.length;i++){
				if (arPaths[i]!="")
					vals=$.E.CONST.SPLITER+arHorSecs[i]+"="+arPaths[i]+vals;
			}
			return vals;
		},
		getPathVal:function ($node){
			var $n = $node;
			var pid = $n.attr( "parent" )
			var vals =  $n.attr( "value" );
			while(pid != "none"){
				$n = $( "#" + pid );
				pid = $n.attr( "parent" );
				vals = $n.attr( "value" ) + "@" + vals;
			}
			return vals.split('@');
		},
		getPathText:function ($node,sections){
			var $n = $node;
			var pid = $n.attr( "parent" )
			var vals =  $n.find("td:eq(0)").text().trim();
			while(pid != "none"){
				$n = $( "#" + pid );
				pid = $n.attr( "parent" );
				vals = $n.find("td:eq(0)").text().trim() + $.E.CONST.SPLITER + vals;
			}
			var arPath=vals.split($.E.CONST.SPLITER);
			vals="";
			for(var i=0;i<arPath.length;i++)
				vals+=sections[i].sec.trim()+"="+arPath[i]+$.E.CONST.SPLITER;
			
			return $.E.CONST.SPLITER+vals;
		},
        getPlaceHolder:function(treeWidth,drillDef,items){
        	var getSpace = function(cnt){
        		var stuff = "";
        		for(var i=0;i<cnt;i++){
        			if ($.browser.safari)
        				stuff += "&nbsp&nbsp";
        			else
        				stuff += "&nbsp";
        		}
        		return stuff;
        	}
        	var base = 3;
        	if($.browser.safari)
        		base = 6;
        	else if($.browser.mozilla)
        		base = 4;
        	var treeSpace = getSpace(treeWidth/base);
        	var cellSpace;
        	var tr = "<td style='height:2px;padding:1px'>"+treeSpace+"</td>";
        	
        	var cell,cellWidth,isShow;
        	for(var i=0;i<drillDef.lastRow.length;i++){
        		cell=drillDef.lastRow[i];
        		cellWidth=$.E.op.cellWidth;
        		if (!cell.sum)
        			cellWidth=items[cell.itemidx].cellWidth;
        		
      			cellSpace = getSpace(cellWidth/base)
      			isShow=cell.hide?";display:none":"";
      			tr +="<td style='padding:1px"+isShow+"'>"+cellSpace+"</td>";
        	
        	}
        	return "<tr>"+tr+"</tr>"
        } ,
        
    	openSectionDialog: function(funcno){
        	var drillDef=$.E.list[funcno];
    		$("#"+$.E.idFuncs.getSectionDialogID(drillDef.funcno)).dialog("open");
    	},
    	
    	clickTr:function( $tr,drillDef){
    		if(this.lastRow)
    			this.lastRow.removeClass("ui-state-active");
    		$tr.addClass("ui-state-active");
    		this.lastRow = $tr;
    		
    		if (drillDef.inRuntime){
	    		//显示出路径
	    		var $titleDiv=$("#"+$.E.idFuncs.getFixCornerID(drillDef.funcno));
	    		var spanLen=$titleDiv.width()-90;
	    		var MAXLEN=spanLen*Math.round((drillDef.horSecCnt+1)*1.3);
	    		
	    		$titleDiv.find(".titleSpan").remove();
	    		var $span=$("<span style='float:left' class='titleSpan'></span>");
	    		$titleDiv.append($span);
	    		
	    		//标题显示的规则：
	    		//1.当前层一定显示
	    		//2.如果长度足够，先补上i+j，再补上i-j    		
	    		var lvl=$tr.attr("id").split("_").length-2;
	    		var title="<font color='#e17009'>"+drillDef.sections[lvl].secName.trim()+"</font>";
	    		var fixedTitle=title;
	    		$span.html(fixedTitle);
	    		if ($span.width()<MAXLEN){
		    		for(var j=1;j<=Math.max(drillDef.Vsections.length-1-lvl,lvl);j++){
		    			//先往下试试
		    			if (lvl+j<drillDef.Vsections.length){
		    				title+="-"+drillDef.Vsections[lvl+j].name.trim();
		    				$span.html(title);
		    				if ($span.width()>MAXLEN)
		    					break;
		    				else
		    					fixedTitle=title;
		    			}
		    			//再往前试试
		    			if (lvl-j>=0){
		    				title=drillDef.Vsections[lvl-j].name.trim()+"-"+title;
		    				$span.html(title);
		    				if ($span.width()>MAXLEN)
		    					break;
		    				else
		    					fixedTitle=title;
		    			}
		    		}
	    		}
	    		$span.html(fixedTitle).css("width",spanLen);
    		}
    	},
    	
    	saveDatatoContext:function(funcno,$tr ){
    		$.userContext.setData(funcno+"-"+"code",$tr.attr("value"));
    		$.userContext.setData(funcno+"-"+"name",$tr.find("td:first").text());
    	},
    	
    	destroyTable:function(funcno){
    		var drillDef=$.E.list[funcno];
    		$("#"+$.E.idFuncs.getSectionDialogID(drillDef.funcno)).dialog("destroy")
    		$("#"+$.E.idFuncs.getDrilltableID(drillDef.funcno)).remove();
    	},
    	
    	parseJSONToString:function( drillDef ){
    		var str = "{";
    		$.each(drillDef,function(i){
    			if(i=="sections" || i =="calItems"||i=="Vsections"||i=="drillMap"||i=="tableMap"||i=="drillFuncs"||i=="visibleItems"
    				||i=="sumAffect"||i=="lastItems"||i=="lastRow"	)
    				return;
    			else if(i=="hover"|| i=="numbers" || i=="secChangable"||i=="treeChart"){
    				str += i + ":" + drillDef[i] + ",";
    				return;
    			}
    			str += i + ":\"" + drillDef[i] + "\","; 
    		});
    		var secs = drillDef.sections;
    		str += "sections:["
    		for(var i=0;i<secs.length;i++){
    			var secStr = "{";
    			secStr += "secField:\"" + secs[i].secField + "\",";
    			secStr += "secName:\"" + secs[i].secName.trim() + "\",";
    			secStr += "secMode:\"" + secs[i].secMode + "\",";
				
				secStr += "codemap:\"" + secs[i].codemap + "\",";
				secStr += "mapcode:\"" + secs[i].mapcode + "\",";
				secStr += "mapname:\"" + secs[i].mapname.substring(1) + "\",";
				
    			secStr += "enabled:" + secs[i].enabled + ",";
				secStr += "reselect:" + secs[i].reselect ;
    			secStr += "}" + (i<secs.length-1?",":"");
    			str += secStr;
    		}
    		str += "],";
    		
    		var items = drillDef.calItems;
    		str += "calItems:["
    		for(var i=0;i<items.length;i++){
    			var item = "{";
    			item += "itemName:\"" + items[i].itemName.trim() + "\",";
    			item += "formula:\"" + items[i].formula.trim() + "\",";
    			item += "unit:\"" + items[i].unit + "\",";
    			item += "enabled:" + items[i].enabled+"," ;
    			item += "itemtype:\"" + items[i].itemtype+ "\",";
    			item += "suffix:\"" + items[i].suffix+ "\",";
    			item += "prefix:\"" + items[i].prefix+ "\",";
    			item += "errDefault:\"" + items[i].errDefault+ "\",";
    			item += "displayFmt:\"" + items[i].displayFmt+ "\",";
    			item += "dispExpr:\"" + items[i].dispExpr+ "\",";
    			item += "sort:\"" + items[i].sort+ "\",";
    			item += "noChart:" + (items[i].noChart?"true":"false")+",";
    			item += "isShow:" + items[i].isShow+"," ;
    			item += "isSum:" + items[i].isSum;
    			item += "}" + (i<items.length-1?",":"");
    			str += item;
    		}
    		str += "],"
    		
    		str +="drillsDef:"+JSON.stringify(drillDef.drillsDef).replace(/#/g, "__x")+"}";
    			
    		return str;
    	},
    	refresh:function(funcno,filter){
    		var drillDef= $.E.list[funcNo];
    		$.E.createNew(drillDef,drillDef.target);
    	},
    	isRootNode:function($node){
    		return $node.attr("parent").split("_").length==2;
    	},
    	/**************************************画图表的方法****BEGIN***************************/
    	drawChartIFDefC:function(rows,drillDef,sections, hSections,items,calItems,treeChartIdx,isRootDraw){
    		if (drillDef.treeChart&&treeChartIdx==undefined)
    			return;
    		
    		if (drillDef.chartDef!=undefined){
    			var chartData=$.E.genChartData(rows,drillDef,sections, hSections,items);
				drillDef.chartDef.funcv=drillDef.funcno;
				$.E.drawChart(drillDef,chartData,treeChartIdx,isRootDraw);
			}
    	},
    	genChartData:function(rows,drillDef,sections, hSections,items){
    		var getSerialName=function(horCol){
    			var result="";
    			var arTitles=horCol.split($.E.CONST.HOR_LVL_SPLITER);
    			for(var i=0;i<arTitles.length;i++){
    				result+=arTitles[i].split($.E.CONST.KV_SPLITER)[1]+'-';
    			}
    			return result.substring(0,result.length-1);
    		} 
    		var unit;
    		if (drillDef.unit!=undefined){
    			unit=drillDef.unit.split("$")[1];
    			if (unit=="默认")
    				unit=this.getItemsFirstUnit(items);
    		}else
    			unit=this.getItemsFirstUnit(items);
    		
    		var categories = [],dataset=[];
    		var oneSerial;
				var arHorCols=[];
				if (drillDef.horCols!=undefined&&drillDef.horCols!=""){
				    arHorCols=drillDef.horCols.split($.E.CONST.HOR_HEAD_SPLITER);
				}
			
				//1.生成categories
				var hasLastRow=false;
				var rowCategories="";
				for (var iRow=0;iRow<rows.length;iRow++){
					rowCategories=$(rows[iRow]).find('td:eq(0)').text().trim();
					if (rowCategories==""){
						hasLastRow=true;
						break;
					}	
					rowCategories=rowCategories.length>4?rowCategories.substring(0,4)+"..":rowCategories;
					categories.push(rowCategories);
				}
				
				//2.生成数据
			  var oneItem,itemidx,iCol,iRowCnt; 
			  var seriesName;
				for(var i=0;i<drillDef.lastItems.length;i++){
					iCol=drillDef.lastItems[i].realidx+1;
					itemidx=drillDef.lastItems[i].itemidx;
					oneItem=items[itemidx];
					if (oneItem!=undefined&&oneItem.noChart)
						continue;
					
					oneSerial=[];
					iRowCnt=hasLastRow?rows.length-1:rows.length;
					
					for (var iRow=0;iRow<iRowCnt;iRow++)
						oneSerial.push($(rows[iRow]).find('td:eq('+iCol+')').attr('value'));
					
					if (hSections!="")
						seriesName=getSerialName(arHorCols[i/items.length|0])+'-'+items[itemidx].name.split(' ')[0];
					else
						seriesName=items[itemidx].name.split(' ')[0];
					
					dataset.push({seriesName:seriesName,
												values 		:oneSerial});
				}
    		return {Category:categories,Dataset:dataset,Unit:unit}
    	},
    	judgeShowVal:function(ctype){
    	//legendPosition  :'RIGHT',//默认bottom
    		result={showvalues:0,showLegend:1,legendPosition:'BOTTOM'};
    		if (ctype.substring(0,3).toUpperCase().trim()=='PIE'){
    			result.showvalues=1;
    			result.showLegend=1;
    			result.legendPosition='RIGHT';
    		};
    		return result;
    	},
    	setUC:function(data){
    		//data=funcno,section,itemname
    		var dataArr = data.split(",");
    		funcno=dataArr[0];
    	  $.UC.setData(funcno+'-SECTION',dataArr[1]);
    	  $.UC.setData(funcno+'-ITEMNAME',dataArr[2]==undefined?"":dataArr[2]);
			},
    	drawChart:function(drillDef,cBodyData,treeChartIdx,isRootDraw){
				var adjuestChartType=function(isMulti,chartType){
					var ctItem;
					for(var i=0;i<$.E.chartType.length;i++){
						if ($.E.chartType[i].chartType.trim().toUpperCase()==chartType.trim().toUpperCase()){
							ctItem=$.E.chartType[i];
							break;
						}
					}	
					if (ctItem.chartSerial=="S"&&isMulti)
						return ctItem.chgChart.split(".")[0];
					else if (ctItem.chartSerial=="M"&&!isMulti)
						return ctItem.chgChart.split(".")[0];
					else
						return chartType.split(".")[0];
							
				}
				var adjuestHeightIsOnePage=function(isOnePage){
					if (isOnePage){
						var $pageControll=$("#viewC"+cDef.funcv+"controller");
						if ($pageControll.length>0){
							$pageControll.parent().remove();
							var $viewChart=$("#viewC"+cDef.funcv+"_chart");
							$viewChart.height($viewChart.height()+32);
							ChartAdapter.resizeChart($.E.idFuncs.getViewCID(cDef.funcv),$viewChart.height+64);
						}
					}
				};
				//点击事件的回调
				var callbackDraw=function(chartIdx){
					//0.删除掉最后一个图的颜色
					var $chartDiv=$("#"+$.E.idFuncs.getTreeChartID(drillDef.funcno,chartIdx));
					///$$$///$chartDiv.find(".highcharts-legend").find("path:last").remove();
					var $tbody=$("#"+$.E.idFuncs.getDrillTabletabID(drillDef.funcno)+" .drillTable");
					$chartDiv.find(".highcharts-legend").find("text").click(function(){//.find(".highcharts-legend text")在chrome就是找不到元素
						//1.如果有钻的话，钻取
						var $rootRow=$tbody.find("tr[id='_"+chartIdx+"']");
						
						var $parentRow=$tbody.find("tr[id='"+$rootRow.attr("nowParentIndex")+"']");
						var nowidx=$tbody.find("tr:visible").index($parentRow);
						var $texts=$(this).parent().find("text");
						var idx;
						if ($texts.index(this)==$texts.length-1&&$(this)[0].textContent=="返回"){//最后一个节点
							idx=nowidx;
						}else{
							idx=parseInt(nowidx)+$texts.index(this)+1;
						}
						var $node=$("#"+$.E.idFuncs.getFixLeftID(drillDef.funcno)+" tr:visible:eq("+idx+") td:first");
						var $span = $node.find("span");
						if($span.hasClass("ui-icon-minus")||$span.hasClass("ui-icon-plus")) 
							$node.click();
						 
					});
					$chartDiv.find(".highcharts-legend").find("path").click(function(){
						var idx=$(this).parent().index(this);
						$(this).parent().find("text:eq("+idx+")").click();
					});
				}
				
				var cDef=drillDef.chartDef;
				var cTarget=treeChartIdx==undefined?$.E.idFuncs.getViewCID(drillDef.funcno):$.E.idFuncs.getTreeChartID(drillDef.funcno,treeChartIdx);
				if ($("#"+cTarget).length==0)
					return;
				var showOpts=$.E.judgeShowVal(cDef.type);
    		var mChart ;
    		
    		var attrs = {
    				numberPrefix	:cDef.yPrefix,
    				numberSuffix	:cBodyData.Unit,
    				xAixsName		:cDef.xAixsName,
    				yAxisName		:cDef.yAxisName,
    				showvalues		:showOpts.showvalues,//原结构没提供 如果设为false，那么图中的数值将不显示,如果数字很密则会很乱，此时这个属性会有用
    				showLegend      :showOpts.showLegend,
    				legendPosition  :showOpts.legendPosition,
    				caption			:cDef.caption,
    				baseFont		:cDef.axisFont,
    				baseFontSize	:cDef.axisFontSize,
    				baseFontColor	:cDef.axisFontColor,
    				bgColor			:cDef.bgColor,
    				bgAlpha			:cDef.bgAlpha,
    				pageSize		:cDef.categoryPerPage
    		};
    		
    		if (treeChartIdx!=undefined)
    			attrs=$.extend(attrs,{showLabels:0,//图上不显示标签
    								showValues:0,//图上不显示标签的值
									enableSmartLabels:0,
									legendIconScale:0.8,//系列的图标显示小一些
									showReturnButton :isRootDraw?0:1//显示返回按钮
									});
    			
    		var chartType=adjuestChartType(cBodyData.Dataset.length>1,cDef.type);
    		if (cBodyData.Dataset.length>1){
				mChart = new MultiSeriesChart(chartType, attrs);
				var categories = [];
				for(var i = 0;i < cBodyData.Category.length;i++){
					var category = new Category({"Label":cBodyData.Category[i]});
					categories.push(category);
				}
				mChart.setCategory(categories);
				//mChart.setDataset(cBodyData.Dataset);
				var datasets = [];
				for(var i = 0;i < cBodyData.Dataset.length;i++){
					var temp = cBodyData.Dataset[i];
					var dataset = new Dataset({seriesName:temp.seriesName});
					for(var j = 0;j < temp.values.length;j++){
						var set = new Set({value:temp.values[j]},new Link("$.E.setUC",cDef.funcno,cBodyData.Category[j],temp.seriesName));
						dataset.addSet(set);
					}
					datasets.push(dataset);
				}
				mChart.setDataset(datasets);
    		}else{
    			mChart = new SingleSerieChart(chartType, attrs);
    			var allZero=true;
    			for (var i=0;i<cBodyData.Category.length;i++){
    				if (cBodyData.Dataset[0].values[i]!=0){
    					allZero=false;
    					break;
    				}
    			}
    			for (var i=0;i<cBodyData.Category.length;i++){
    				if (allZero&&(chartType=='Pie3D'||chartType=='Pie2D'))//如果全0的话，饼图会不显示
    					cBodyData.Dataset[0].values[i]=0.01;
    				mChart.appendData(cBodyData.Category[i],cBodyData.Dataset[0].values[i],new Link("$.E.setUC",cDef.funcno,cBodyData.Category[i]));
    			}
    		}
			ChartAdapter.createChart(cTarget, mChart,undefined,undefined,callbackDraw,treeChartIdx);
			adjuestHeightIsOnePage(cDef.onlyFirstPage);
    	},
    	/**************************************画图表的方法--END**********************************/
    	
    	/*************************************获取角色钻取权限的方法**************************************/
    	/*********这个方法本应放在system_init.js里面，但是考虑到平台的通用性，方法才放在当前文件中***********/
    	getRoleTplDrillOps:function(roleid,tplFuncno,callback,data1,data2){
    		$.ajax({
				type: "POST",
				url:  "roleTpl_getRoleTplDrillOps.action",
				data: {roleid:roleid,tplFuncno:tplFuncno}, 
				dataType: "json",
				success:  function( data,textStatus ){
					$.UC.setData('0-USERINFO.INT_DRILL',data.int_drill);
					$.UC.setData('0-USERINFO.EXT_DRILL',data.int_drill);
					$.UC.setData('0-USERINFO.EXP_XLS',data.int_drill);
					callback(data1,data2);
				},
				error:function(e){
					alert(e.responseText);
				}
			});
    	},
		getSecNameBySecID:function(sections,secField){
			var sec;
			for(var i=0;i<sections.length;i++){
				sec=sections[i];
				if (sec.sec.trim()==secField.trim())
					return sec.name;
			}
			return "";
		},
    	/*************************************获取角色钻取权限的方法-END**********************************/
    	idFuncs:{
    		getSectionDialogID:function(funcno){
    			return "drilltable_" + funcno+ "_sectionDialog";
    		},
    		getDrilltableID:function(funcno){
    			return "drilltable_" + funcno;
    		},
    		getDrillTabletabID:function(funcno){
    			return "drilltable_tab_"+funcno;
    		},
    		getFixDrilltableID:function(funcno){
    			return "drilltable_fix_" + funcno
    		},
    		getViewCID:function(funcno){
    			return "viewC"+funcno;
    		},
    		getViewTID:function(funcno){
    			return "viewT"+funcno;
    		},
    		getDToolID:function(funcno){
    			return "DtoolBar_"+funcno;
    		},
    		getVSectionsID:function(funcno){
    			return "drilltable"+funcno+"_vsections";
    		},
    		getHSectionsID:function(funcno){
    			return "drilltable"+funcno+"_hsections";
    		},
    		getCalItemsID:function(funcno){
    			return "drilltable_" + funcno + "_calItems" ;
    		},
    		getTableHeadID:function(funcno){
    			return "drillTableHead_"+funcno;
    		},
    		getFixTableHeadID:function(funcno){
    			return "drillTableHead_fix_"+funcno;
    		},
    		getFixTabBodyID:function(funcno){
    			return "drill_tbody_fix_"+funcno;
    		},
    		getFixLeftID:function(funcno){
    			return "drill_left_fix_"+funcno;
    		},
    		getFixCornerID:function(funcno){
    			return "drill_corner_fix_"+funcno;
    		},
    		getRealFuncno:function(funcno){
    			return funcno.split("_")[0];
    		},
    		getBlockScreenID:function(funcno){
    			return $.DC.getRegionScreenID($.E.idFuncs.getRealFuncno(funcno));
    		},
    		getTreeChartID:function(funcno,i){
    			return $.E.idFuncs.getViewCID(funcno)+"_"+i;
    		},
    		getTreeChartHeadID:function(funcno,i){
    			return $.E.idFuncs.getViewCID(funcno)+"_head_"+i;
    		},
    		getRootRowID:function($row){
	    		return "_"+$row.attr("id").split("_")[1];
	    	},
			getChangeViewStyleID:function(funcno){
				return "selChangeViewStyle_"+funcno;
			},
			getReselectid:function(funcno,secField){
				return "reselect_"+funcno+"_"+secField;
			},
			getDrillDefSectionbySecName:function(drillDef,sec){
				for (var i=0;i<drillDef.sections.length;i++){
					if (drillDef.sections[i].secField==sec){
						return drillDef.sections[i];
					}
				}
			}
    	}
	}
	
})(jQuery)