;(function($){
	$.LW = $.ledWarning = {
			
		op:{
			dataBindURL:"ledWarning_getLedWarningGrid.action",		//绑定数据的url
			dataLed1ErrCntURL:"ledWarning_getLed1Cnt.action",		
			dataLed2ErrCntURL:"ledWarning_getLed2Cnt.action"
		},
		
		list:{},
		runInstance:function(funcno, options){
			var op = $.extend({
				complete:function(){},
				allComplete:function(){},
				target:		 "main"
				},options);
			var ledDef={};
			ledDef.funcno=funcno;
			ledDef.complete = op.complete;
			ledDef.allComplete = op.allComplete;
			$.LW.list[funcno] = ledDef;
			$.LW.createNew(ledDef,options.target);
		},
		createNew:function(ledDef,target){
			//1.获取数据并生成树
			$.ajax({
					type: "POST",
					url:  $.LW.op.dataBindURL,
					dataType: "json",
					success:function( data,textStatus ){
						var $target=$("#"+target);
						var rows=data;
						$target.empty();
						
						//1.生成tHead
						$.LW.genWarningThead(ledDef,$target);
						//2.生成后面的数据
						$.LW.genWarningBody(ledDef,$target,rows)
						
						if(typeof(ledDef.complete)=="function")
							ledDef.complete();
						if(typeof(ledDef.allComplete)=="function")
							ledDef.allComplete();			
					},
					error:function(e,textStatus){
						$.msgbox.show( "err", "LED警报灯信息获取失败:"+e.responseText);
					}
			});
		},
		
		genWarningThead:function(ledDef,$target){			
			var rowsStr="<tr class='ui-state-default'>"
			rowsStr+="<td style='text-align:center;padding-right:5px;padding-left:1px;width:240px'>指标</td>";
			rowsStr+="<td style='text-align:center;padding-right:5px;padding-left:1px;width:80px'>状态</td>";
			rowsStr+="</tr>";
			var $tab=$("<table class='ui-state-active' cellspacing='0' id='"+$.LW.idFuncs.getTableID(ledDef.funcno)+"'>"
			          +"</table>").appendTo($target);
			
		},
		genWarningBody:function(ledDef,$target,rows){
			var dealParentGroup=function($parent,grpErrCnt,delParent){
				if (delParent&&$parent!=undefined)//如果子节点都没有对应的话，删除大类
					$parent.remove();
				if ($parent!=undefined){
					$parent.find(".alarm").attr("src","img/LED_"+(grpErrCnt==0?"3":"1")+".gif")
					$parent.find("td:first").css("color",grpErrCnt==0?"":"red");
				}	                            
			}
			var $tab=$target.find("#"+$.LW.idFuncs.getTableID(ledDef.funcno));
			var rowStr="",cdate,errCnt,jobNo,modelCode,modelName,modelType;
			$tbody=$("<tbody class='drillTable'></tbody>").appendTo($tab);
			var $parent,grpErrCnt,delParent=false,parentIdx;
			for(var i=0;i<rows.length;i++){
				if (rows[i].GROUPPCODE==""){//大组
					if ($parent!=undefined)//如果子节点都没有对应的话，删除大类
						dealParentGroup($parent,grpErrCnt,delParent);
					delParent=true;
					grpErrCnt=0;
					parentIdx=i;
					rowsStr= "<tr idx="+i+" class='level0'>"
							+" <td colspan=2 class='cell' style='border-left:solid 1px #A6C9E2;width:370px;font-weight: bold;font-size:18px;text-align: left;cursor:pointer'>"
							+"  <img class='alarm' style='margin-left:10px;margin-top;2px;float:left'>"
							+"  <div style='width:200px;float:left;margin-top:6px;margin-left:6px'>"+rows[i].GROUPNAME.trim()+"</div>"
							+"  <img src='img/arDown.gif' style='float:right'>"
							+" </td>"
							+"</tr>";
					$parent=$(rowsStr).appendTo($tbody);
				}else{
				    jobNo=rows[i].JOBNO;
					if (jobNo!=""){
						delParent=false;
						errCnt=rows[i].DAYWARNING.substring(11,30).trim();
						grpErrCnt+=(errCnt==""?0:parseInt(errCnt));
						cdate=rows[i].DAYWARNING.substring(0,10);
						modelCode=rows[i].MODELCODE;
						modelName=rows[i].MODELNAME;
						modelType=rows[i].MODELTYPE;
						rowsStr= "<tr parent="+parentIdx+" class='errcnt' style='"+(errCnt==0?"":";cursor:pointer")+";display:none' jobno='"+jobNo+"' modelcode='"+modelCode+"' modeltype='"+modelType+"' cdate='"+cdate+"' errcnt='"+errCnt+"' modalname='"+modelName+"'>"
								+" <td class='cell' style='border-left:solid 1px #A6C9E2;width:240px;font-weight: bold;font-size:12px;text-align: left;padding-left: 41px;'>"
								+"  <span class='ui-icon ui-icon-bullet' style='float:left'></span>"
								+   rows[i].MODELNAME.trim()
								+" </td>"
								+" <td class='cell' style='width:80px'>"
								+"  <img style='margin-right:34px' src='img/"+(errCnt==0?"G":"R")+".gif'>"
								+" </td>"
								+"</tr>";
						$(rowsStr).appendTo($tbody);
					}
				}
			}
			dealParentGroup($parent,grpErrCnt,delParent);
			
			$tbody.find(".errcnt").click(function(){
				if ($(this).attr('errcnt')==0)
					return;
				$.LW.showError[$(this).attr("modeltype").trim()](ledDef,$(this));
			});
			$tbody.find(".level0").click(
				function(){
					if ($(this).attr('state')==undefined||$(this).attr('state')=="SHR"){
						$(this).parent().find("tr[parent="+$(this).attr("idx")+"]").show();
						$(this).attr("state","EXT");
						$(this).find("img:last").attr("src","img/arUp.gif");
					}else{
						$(this).parent().find("tr[parent="+$(this).attr("idx")+"]").hide();
						$(this).attr("state","SHR");
						$(this).find("img:last").attr("src","img/arDown.gif");
					}
				}
			);
			$tbody.find("td").css("border-right","none");
		},
		showError:{
			LED1:function(ledDef,$tr){
				$.LW.dialogErrData(ledDef.funcno,"'<img>',状态;cdate,日期;WARNINGS,错误数",
									   "ETL_MODEL_LED1_RST",
									   "jobno="+$tr.attr("jobno").trim()+" and modelcode='"+$tr.attr("modelcode").trim()+"'",
									   "cdate desc",
									   {dlgLevel:1,
									    colWid:[40,120,120],
									    complete:function(){
											$("#gbox_"+$.LW.idFuncs.getErrorGridID(ledDef.funcno,1)).find("table thead tr th:eq(1)").text("状态");
											$.each($("#"+$.LW.idFuncs.getErrorGridID(ledDef.funcno,1)).find("tr"),function(){
														var $td=$(this).find("td:eq(3)");
														var $td1=$(this).find("td:eq(1)");
														if ($td.text()>0){
															$td1.find("img").attr("src","img/R.gif")
																			.css("margin-left","16px");
															$td.css({"color":"red","font-weight":"bold","text-align":"right","cursor":"pointer"});
															$td.click(function(){
																var cdate=$(this).parent().find("td:eq(2)").text().trim();
																$.ajax({
																	type: "POST",
																	url:  $.LW.op.dataLed1ErrCntURL,
																	dataType: "json",
																	data:{cdate:cdate,
																			jobno:$tr.attr("jobno").trim(),
																			modelcode:$tr.attr("modelcode").trim()
																		   },
																	success:function( data,textStatus ){
																		$.LW.dialogErrData(ledDef.funcno,data[0].HISFIELDSDESC,data[0].HISTABLE,"HISSEQUID="+data[0].HISSEQUID,"",{dlgLevel:2});
																	},error:function(e,textStatus){
																		$.msgbox.show( "err", "LED1警报错误数信息获取失败:"+e.responseText);
																	}
																});
															});
														}else{
															$td1.find("img").attr("src","img/G.gif")
																			.css("margin-left","16px");
														}
													});
									    },
										
									   })
			},
			LED2:function(ledDef,$tr){
				var showError=function(colidx,cdate){
					$.ajax({
						type: "POST",
						url:  $.LW.op.dataLed2ErrCntURL,
						dataType: "json",
						data:{cdate:cdate,
								jobno:$tr.attr("jobno").trim(),
								modelcode:$tr.attr("modelcode").trim()
							   },
						success:function( data,textStatus ){
						    var hiSequID;
							if (colidx==3)
								hiSequID=data[0].HISSEQUID_NOEQUAL;
							else if(colidx==4)
								hiSequID=data[0].HISSEQUID_ONLYSETA;
							else
								hiSequID=data[0].HISSEQUID_ONLYSETB;
							$.LW.dialogErrData(ledDef.funcno,data[0].HISFIELDSDESC,data[0].HISTABLE,"HISSEQUID="+hiSequID,"",{dlgLevel:2});
						},
						error:function(e,textStatus){
							$.msgbox.show( "err", "LED2警报错误数信息获取失败:"+e.responseText);
						}
					})
				}
				$.LW.dialogErrData(ledDef.funcno,"'<img>',状态;cdate,日期;RST_NOEQUAL,不一致数;RST_ONLYSETA,A有B无;RST_ONLYSETB,B有A无",
									   "ETL_MODEL_LED2_RST",
									   "jobno="+$tr.attr("jobno").trim()+" and modelcode='"+$tr.attr("modelcode").trim()+"'",
									   "cdate desc",
									   {dlgLevel:1,
									    colWid:[40,120,120,120,120],
									    complete:function(){
											$("#gbox_"+$.LW.idFuncs.getErrorGridID(ledDef.funcno,1)).find("table thead tr th:eq(1)").text("状态");
											$.each($("#"+$.LW.idFuncs.getErrorGridID(ledDef.funcno,1)).find("tr"),function(){
														var $td1=$(this).find("td:eq(1)");
														var $td3=$(this).find("td:eq(3)");
														var $td4=$(this).find("td:eq(4)");
														var $td5=$(this).find("td:eq(5)");
														var cdate=$(this).parent().find("td:eq(2)").text().trim();
														if ($td3.text()>0||$td4.text()>0||$td5.text()>0)
															$td1.find("img").attr("src","img/R.gif")
																			.css("margin-left","16px");
														else
															$td1.find("img").attr("src","img/G.gif")
																			.css("margin-left","16px");
														if ($td3.text()>0){
															$td3.css({"color":"red","font-weight":"bold","text-align":"right","cursor":"pointer"});
															$td3.click(function(){
																showError(3,cdate);
															});
														}
														if ($td4.text()>0){
															$td4.css({"color":"red","font-weight":"bold","text-align":"right","cursor":"pointer"});
															$td4.click(function(){
																showError(4,cdate);
															});
														}
														if ($td5.text()>0){
															$td5.css({"color":"red","font-weight":"bold","text-align":"right","cursor":"pointer"});
															$td5.click(function(){
																showError(5,cdate);
															});
														}
													});
									    },
										
									   })
			}
		},
		genGrid:function($target,funcno,prjfields,tablenames,joinconditions,orderStr,options){
			var op = $.extend({rowNum:40,height:500,dlgLevel:1},options);
			var COL_WID=120;
			joinconditions=joinconditions==undefined?"":joinconditions.trim();
			var pagerid=$.LW.idFuncs.getErrorGridPagerID(funcno,op.dlgLevel);
			var tableid=$.LW.idFuncs.getErrorGridID(funcno,op.dlgLevel);
			
			$target.empty().append(
				$(" <div>"
				+"    <table id='"+tableid+"'></table>"
				+" </div>"
				+" <div id='"+pagerid+"'></div>"));
			
			var gridDef = {};
			gridDef.url = "commonQuery_doQuery.action?funcno=-1";
			gridDef.rowNum = op.rowNum;
			gridDef.height = op.height;
			gridDef.rownumbers = true;
			gridDef.viewrecords = true;
			gridDef.pginput = true;
			gridDef.multiselect = false;
			gridDef.datatype = "json";
			gridDef.mtype = "POST";
			
			if (orderStr!=undefined&&orderStr.trim()!=""){
				var arOrder=orderStr.split(" ");
				if (arOrder.length==2){
					gridDef.sortname = arOrder[0].trim();
					if (arOrder[1].trim().toUpperCase()=="DESC"){
						gridDef.sortorder = "DESC";
					}else{
						gridDef.sortorder = "ASC";
					}
				}else{
					gridDef.sortname = orderStr;
				}
			}
			
			
			//prjfields:A_no,号码1;A_zjname,名称1;A_amount,金额1;B_no,号码2
			var arFields=prjfields.split(";");
			gridDef.colNames=[];
			gridDef.colModel=[];
			var enProjFields="",colWid;
			for(var i=0;i<arFields.length;i++){
				var arOneField=arFields[i].split(",");
				if (arOneField.length==2){
					gridDef.colNames.push(arOneField[1].trim());
				}else{
					gridDef.colNames.push(arOneField[0].trim());
				}
				colWid=COL_WID;
				if (op.colWid!=undefined&&op.colWid[i]!=undefined)
					colWid=op.colWid[i];
				gridDef.colModel.push(
					{name : arOneField[0].trim(),
					 index : arOneField[0].trim(),
					 width : colWid,
					 resizable:true
					}
				);
				enProjFields+=arOneField[0];
				if (i!=arFields.length-1)
					enProjFields+=","
				arOneField.length=0;
			}
			arFields.length=0;
			
			gridDef.width = Math.min(1024,COL_WID*gridDef.colNames.length+50);///$$$///
			gridDef.width = Math.max(300,gridDef.width);
			
			gridDef.pager = $("#"+pagerid);
			gridDef.onSelectRow = function(){};
			gridDef.beforeRequest = function() {
				$("#"+tableid)
						.jqGrid(
								"appendPostData",
								{
									prjfields :enProjFields,
									tablenames : tablenames,
									joinconditions : joinconditions
								});
			}
			gridDef.onSortCol = function() {
				$("#" + tableid).jqGrid("removePostDataItem","ordStr");
			}
			gridDef.gridComplete = function() {
				if (op.complete!=undefined){
					op.complete();
				}
			}
			$("#" +tableid).jqGrid(gridDef);
			return gridDef.width;
		},
		//prjfields:A_no,号码1;A_zjname,名称1;A_amount$金额1;B_no,号码2
		//orderStr:XXX DESC/XXX ASC
		//options:rowNum:40,height:500,colWid:[],okClick:function,complete:functoin,dlgTitle:XXX
		dialogErrData:function(funcno,prjfields,tablenames,joinconditions,orderStr,options){
			var op = $.extend({rowNum:40,height:500},options);
			
			var $targetDiv=$("<div></div>").appendTo($("body"));
			if(!$.browser.mozilla)
				$targetDiv.addClass("ui-state-active");
				
			var gridWidth=$.LW.genGrid($targetDiv,funcno,prjfields,tablenames,joinconditions,orderStr,op);
			
			buttons=
			 {
			 	"返回": function() {
						$(this).dialog('close');
					}
				};
			if (op.okClick!=undefined){
				buttons["确定"]=op.okClick;
			}
			buttons=$.extend(buttons,op.buttons);
			$targetDiv.dialog({
				title:op.dlgTitle==undefined?"错误信息明细查询":op.dlgTitle.trim(),
				bgiframe: true,
				modal: true,
				resizable: false,
				zIndex:200,
				width:gridWidth+18,
				height:op.height+150,
				close:function(event, ui){
					$(this).dialog('destroy');
					$(this).remove();
				},
				buttons: buttons
		  });
		},
		resizeWin:function(funcno,left,top,width,height){
		},
		refresh:function(funcno, filter){
		},
		idFuncs:{
			getTableID:function(funcno){
				return "ledTab_"+funcno;
			},
			getErrorGridID:function(funcno,dlgLevel){
				return "tableErrors_"+funcno+"_"+dlgLevel;
			},
			getErrorGridPagerID:function(funcno,dlgLevel){
				return "tablePager_"+funcno+"_"+dlgLevel;
			}
		}
	}
})(jQuery)
		