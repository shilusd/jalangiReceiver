/**文件名：jquery.grid.js
 *描述：该文件包含对jqgrid相关的按钮标签、消息参数、事件响应函数等的定义实现。
 *依赖:jquery-1.3.2.js;ui.core.js;ui.dialog.js;userContext.js;
 *@author:zyz
 *-----------------------------------------------------------------**/
;
(function($){
	$.Q = $.grid = {
			opitions:{
				gridParamURL:  $.global.functionDefinitionUrl+"?type=Q",
				doQueryURL:	 "commonQuery_doQuery.action",
				updateURL:"commonUpdate_responseButtonEvent.action",
				gridDispSetURL:"saveUserDispSetAction.action",
				dataBindingURL:"common_getBindingData.action"
			},

			list:{/*{funcno:gridDef}*/},
			lastRows:{/*{funcno:lastRowId}*/},  // 现在的含义是选中的最后一条记录，如果没有选中，则是undefined。
			onEdit:{}, 
			lastEdited:{},
			/**
			 * gird运行实例函数
			 * @funcNo 要创建的grid功能编号
			 * @model	grid的生成模式：可以为'indep','grud','step'
			 * @autoOpen grid创建完毕后是否自动打开
			 * @formComplete 创建完毕后回调函数 
			 * * */
			runInstance: function( funcNo,options ){
				var op = $.extend({
					complete:function(){},
					allComplete:function(){},
					rowSelected:function(){},
					target:		 "main",
					inContainer:false,
					grid_btns:[]
				},options);
				if($.grid.list[funcNo] == null){
					$.ajax({
						type: "POST",
						url:  $.grid.opitions.gridParamURL,
						data: {
							funcNo: funcNo
						},
						dataType: "json",
						success:  function( data,textStatus ){
							var gridDef = data[0];
							if(op.drill){
								var code = op.prjfields.split(",")[0];
								var name = op.prjfields.split(",")[1];
								gridDef.multifields = op.multifields;
								gridDef.prjfields = op.prjfields;
								gridDef.sortname = op.sortname;
								gridDef.tablenames = op.tablenames;
								gridDef.colModel[0].index = code;
								gridDef.colModel[0].name = code;
								gridDef.colModel[1].index = name;
								gridDef.colModel[1].name = name;
								gridDef.selconditions = op.selconditions;
							}
							gridDef.complete = op.complete;
							gridDef.allComplete = op.allComplete;
							gridDef.rowSelected = op.rowSelected;
							gridDef.inContainer = op.inContainer;
							gridDef.grid_btns   = op.grid_btns;
							$.appendScript(funcNo,gridDef.script);
							
							if (op.zIndex) {  // 用于超级查询（对话框式）
								gridDef.funcno = funcNo = op.zIndex; // 在hyperQuery情况下，funcno 改为zIndex 
								gridDef.initcond = op.paramstr;   //  超级查询中，initcond用于保存要传入的参数
							}
							else { 
								if (op.initcond){  // 用于 穿越（功能直接转移）
									gridDef.initcond = op.initcond;  // 装载数据的初始条件   bug 176
								}
								else {
									gridDef.initcond = undefined;
								}
							}

							$.grid.list[funcNo] = gridDef;

							$.userContext.appendDataType(gridDef.typeMap);
							$.grid.createNew( gridDef,op.target);
						},
						error:function(e){
							//$.msgbox.show("err","请求显示的功能"+funcNo+"不存在或存在定义错误：<br>"+e.responseText);
							alert(e.responseText);
						}
					});
				}else{
					if ($.UC.userData["0-CURRBTN"] && ! $.UC.userData["0-CURRBTN"].match(/<.*>/))
					//if ($.UC.userData["0-CURRBTN"] != "返回")  // BUG 314 新增。“返回”时不清条件。现在暂时约定按钮名称带有<>的不清。但是以后可能要用到调用链来判断。
						$.UC.setData(funcNo+"-COND","1=1");
					var gridDef = $.grid.list[funcNo];
	                
					// 以下两个参数只能一次性有效。// 2013-11-11  问题：如果是传引用的，那么这里修改funcno会导致后续运行中funcno错误
	                if (op.zIndex) {  // 用于 超级查询（对话框式）
	                	gridDef.funcno = funcNo = op.zIndex; // 在hyperQuery情况下，funcno 改为zIndex 
	                	gridDef.initcond = op.paramstr;   //  超级查询中，initcond用于保存要传入的参数
	                }
	                else {
	                	gridDef.funcno = funcNo ;  // 2013-11-11 续：因此加这一句
	                	if (op.initcond){  // 用于 穿越（功能直接转移）
	                		gridDef.initcond    = op.initcond;  // 装载数据的初始条件   bug 176
	                	}
	                	else {
	                		gridDef.initcond = undefined;
	                	}
	                }
					
					gridDef.inContainer = op.inContainer;
					if(op.drill){
						var code = op.prjfields.split(",")[0];
						var name = op.prjfields.split(",")[1];
						gridDef.multifields = op.multifields;
						gridDef.prjfields = op.prjfields;
						gridDef.sortname = op.sortname;
						gridDef.tablenames = op.tablenames;
						gridDef.colModel[0].index = code;
						gridDef.colModel[0].name = code;
						gridDef.colModel[1].index = name;
						gridDef.colModel[1].name = name;
						gridDef.selconditions = op.selconditions;
					}
					$.grid.createNew(gridDef,op.target);
				}
				return $("#div_grid"+funcNo);
			},

			createNew: function (gridDef,target){
				gridDef.onCreateProc=true;
				var grid_id = "grid" + gridDef.funcno;
				var grid_divId = "div_" + grid_id;
				var pager_id = "pager" + gridDef.funcno;
				var grid_chart_id = $.Q.getChartPanelID(gridDef.funcno);
				// 总是添加内嵌图表的div，但是并不一定会显示出来
				$("#"+target).append($("<div id=\"div_"+grid_chart_id+"\" style='display: none; float:left;width: 98%; height:98%;'></div>"));
				$("#div_" + grid_chart_id).append($("<div id=\"tb_" + grid_chart_id + "\" style='float: left; height: 26px; width: 98%;'></div>"));
				$("#div_" + grid_chart_id).append($("<div id=\"" + grid_chart_id + "\" style='float: left; width:100%; height:" 
						+ ($("#div_"+grid_chart_id).height() - 28) + "px;'></div>"));
				//添加恢复grid按钮
				var showGridBtnOptions={
						id:grid_chart_id + "_showgrid",
						caption:"表格", 
						icon:"ui-icon-image"//, 
							//pos:layout
				};
				$("#tb_" + grid_chart_id).append( $.button.createIcon(showGridBtnOptions));
				$("#" + grid_chart_id + "_showgrid").click(function(){
					$("#div_" + grid_chart_id).css("display", "none");
					$("#" + grid_divId).css("display", "block");
				});
				// 添加图表类型下拉框
				var chartTypeSelector = $('<select value="Column2D"><option value="Column2D">柱状图</option><option value="Bar2D">柱状图-横置</options><option value="Line">折线图</options></select>');
				$("#tb_" + grid_chart_id).append($('<span>&nbsp;&nbsp;图表类型&nbsp;</span>')).append(chartTypeSelector);
				$("#tb_" + grid_chart_id + ">select").change(function(){
					$.Q.showChart(gridDef.funcno, $.Q.getChartInfo(gridDef), $(this).val());
            	});
				// 添加最大化按钮
				var maxChartBtnOptions={
						id:grid_chart_id + "_maxchart",
						caption:"最大化", 
						icon:"ui-icon-arrow-1-ne"//, 
							//pos:layout
				};
				$("#tb_" + grid_chart_id).append( $.button.createIcon(maxChartBtnOptions));
				$("#" + grid_chart_id + "_maxchart").css("float", "right");
				var $chartMaxBtn = $("#" + grid_chart_id + "_maxchart");
				$chartMaxBtn.click(function(){
					$.dialogContent(gridDef.funcno, $("#" + grid_chart_id), $("#div_"+grid_chart_id), 
							$.grid.resizeChart); // 把chart dialog出来
				});
				
				///////////////

				// 这里补充设置gridDef中的hasChart属性。根据此，后面设置toolbar的时候决定是否显示“图表”按钮。
				var chartInfo = $.Q.getChartInfo(gridDef);
				if (chartInfo.hasChart) {
					gridDef.hasChart = true;
					gridDef.chartInfo = chartInfo;
				}

				//添加一个新的grid
				$("#"+target).append($("<div id=\""+grid_divId+"\" style='float:left;height:"+$("#"+target).height()+"px'><table  id=\""+grid_id+"\" ></table><div id=\""+pager_id+"\"></div></div>"));
				
				//配置grid各基本属性
				$.grid.setProperties(grid_id,pager_id,gridDef);
			
				// 动态列展开
				$.Q.expandColDef(gridDef); 
			
				//调用jqGrid生成
				$("#"+grid_id).jqGrid(gridDef);
				
				//配置grid工具栏
				$.grid.setToolbar(gridDef.funcno, gridDef);

				//添加搜索面板
				if(gridDef.panelSearch == 'show'){
					var $sp = $.grid.createSearchPanel(gridDef.funcno,gridDef.colModel,gridDef.colNames);
					var $btn = $($.button.create(
							{
								id: grid_id+"_query",
								caption:"查询", 
								icon:"ui-icon-search", 
								pos:"left",
								script:"$.grid.doQuery("+gridDef.funcno+")"
							}));
					$sp.find(">table>tbody>tr:last>td").prepend($btn);
					$sp.show();
				};

			},

			setHiddenCols:function(grid_id,colModel){
				var cols = [];
				for(var i=0;i<colModel.length;i++){
					if(!colModel[i].isshow){
						$("#"+grid_id).hideCol(colModel[i].name);
					}
				}
			},
			
			// 允许动态列名。
			// 在查询字段名中允许出现colname*[M-N]这样的标注。表示：colnameM, colname<M+1>, ... colnameN共N-M+1个列。
			// 同样在显示名中也允许用 *[M-N]这样的标注。并且这个标注可以在汉字后，汉字前，甚至两个汉字之间。例如 属性*[1-4]，或者 *[2011-2014]年，或者 第*[1-4]月. 显示时会自动替换成相应的数字。
			// M N 允许用变量。运行时会自动动态替换。
			// 用“影响”时，发生影响刷新后，grid的列会根据变量定义的M N自动增减，但这会导致整个grid重新刷新（可能稍慢，且闪烁一下）。
			// JqGrid.java更新，需要保存原始的定义（带*[]的版本）和实际创建用的版本。 因此，JSON版的编辑工具也需要同步更新。
			expandColDef: function(gridDef) {
				var expanded = false;
				if (!gridDef.prjfieldsRaw) return false;
				var fields = gridDef.prjfieldsRaw.split(',');
				for (var fieldIdx = 0; fieldIdx < fields.length; fieldIdx ++) {  // 只允许一个可扩展列
					if (fields[fieldIdx].match(/\*\[/)) {
						/// 每次都先恢复原始的colModel
						gridDef.colModel = [];
					    $.each(gridDef.colModelRaw, function(i, n){
					    	var nc = new Object();
					    	for (element in n) {
					    		nc[element] = n[element];
					    	}
					    	gridDef.colModel.push(nc);
					    });
					    //// colNames
					    gridDef.colNames = [];
					    $.each(gridDef.colNamesRaw, function(i, n){
					    	gridDef.colNames.push(n);
					    });
					    						
						var rawColDefString = fields[fieldIdx];
						var fieldBase = rawColDefString.split("*")[0];
						var colIdxString = rawColDefString.match(/\[.*\]/)[0];
						colIdxString = $.userContext.parser(colIdxString.substr(1, colIdxString.length-2));
						var colIdxBE = colIdxString.split('-');
						if (colIdxBE[0].length == 0 || colIdxBE.length <2 || colIdxBE[1].length == 0) {// 如果没有合适的数值，则在字段基上不附加任何东西。
							fields[fieldIdx] = fieldBase;
							var col = gridDef.colModel[fieldIdx];
							col.name = fieldBase;
							var colName = gridDef.colNames[fieldIdx];
							var colNameBase =  colName.replace(/\*\[.*\]/, "-");
							gridDef.colNames.splice(fieldIdx, 1, colNameBase);
						}
						else {
							var newCols = [];
							for (var i = parseInt(colIdxBE[0]); i<= parseInt(colIdxBE[1]); i++) {
								newCols.push(fieldBase + i);
							}
							fields[fieldIdx] = newCols.join(",");

							var col = gridDef.colModel[fieldIdx];
							col.name = fieldBase + colIdxBE[0];
							gridDef.typeMap[col.name] = gridDef.typeMap[rawColDefString];

							var colName = gridDef.colNames[fieldIdx];
							var colNameBase =  colName.replace(/\*\[.*\]/, "|");
							gridDef.colNames.splice(fieldIdx, 1, colNameBase.replace(/\|/, colIdxBE[0]));

							for (var i = parseInt(colIdxBE[1]); i>= parseInt(colIdxBE[0])+1; i--) {
								var nc = new Object();
								for (element in col) {
									nc[element] = col[element];
								}
								nc.name = fieldBase + i;
								gridDef.colModel.splice(fieldIdx + 1, 0, nc);
								gridDef.colNames.splice(fieldIdx +1, 0, colNameBase.replace(/\|/, i));

								gridDef.typeMap[nc.name] = gridDef.typeMap[rawColDefString];
							}

							// TODO: 尚未处理以下属性：
							//dataMapStr:仅供导入使用。若要可变列，就不允许的导入！

							expanded = true;
						}
						break;
					}
				}
				gridDef.prjfields = fields.join(",");	
				return expanded;
			},

			setProperties:function(grid_id,pager_id,gridDef){
				var genGridColorMap=function(){
					/*dispexp定义规则描述
					 * FCR-超标:red;达标:green;未达标:#CC0066   ---FC(Font Color)，字体的颜色;R表示对整行的颜色进行设定
					 * FCC-超标:red;达标:green;未达标:#CC0066   ---同上，C表示仅对本单元格的颜色进行设定
					 * BCR-超标:red;达标:green;未达标:#CC0066   ---BC(Background Color),背景的颜色;R表示对整行的颜色进行设
					 * BCC-超标:red;达标:green;未达标:#CC0066   ---同上，C表示仅对本单元格的颜色进行设
					 */
					gridDef.DispRuleMap=[];
					var ruleCnt=0;
					var dispexp="";
					//2.1. 生成一个格列的颜色map
					for(var i=0;i<=gridDef.colModel.length-1;i++){
						dispexp=gridDef.colModel[i].dispexp;
						if (dispexp!=null&&dispexp!=""){
							var sa=dispexp.split("-");
							if (sa[0]!=null&&sa[0]!=""&&sa.length>1){
								ruleCnt+=1;
								dispexp=dispexp.substring(sa[0].length+1);
								var saItemStr=dispexp.split(";");
								gridDef.DispRuleMap.push({
									"colIdx":"",
									"dispType":"",
									"colorMap":{}
								});
								for(var j=0;j<=saItemStr.length;j++){
									if (saItemStr[j]==null ||saItemStr[j]=="")
										break;
									var saItem=saItemStr[j].split(":");
									gridDef.DispRuleMap[ruleCnt-1].colIdx=i;
									gridDef.DispRuleMap[ruleCnt-1].dispType=sa[0];
									gridDef.DispRuleMap[ruleCnt-1].colorMap[saItem[0]]=saItem[1];
								}
							} 
						}
					}
				};
			    gridDef.url = $.grid.opitions.doQueryURL+"?funcno=" + gridDef.funcno ;
				gridDef.loadBeforeSend = function(xhr){
				};
				genGridColorMap();
				gridDef.pager = $("#"+pager_id);
				gridDef.scrollrows = true; // 自动滚动到所选的行
				
				gridDef.gridComplete =function(){
					
					var setRowDisp=function(){
						//1.做一些类型:led/procbar1/procbar2
						var formatter;
						for(var i=0;i<=gridDef.colModel.length-1;i++){
							formatter=gridDef.colModel[i].formatter;
							if ($.grid.colFuncs[formatter]!=undefined)
								$.grid.colFuncs[formatter](gridDef,i);	
						}

						//2.看dispexp来设显示

						//2.2.如果有定义的话，需要开始设定行/单元格颜色了
						var needDoRowColor=false;
						for(var i=0;i<gridDef.DispRuleMap.length;i++){
							var dispType=gridDef.DispRuleMap[i].dispType;
							needDoRowColor=(dispType=="FCR")||(dispType=="FCC")||(dispType=="BCR")||(dispType=="BCC");
						}

						if (needDoRowColor){
							var iColIdx;
							$("#"+grid_id+" tr.jqgrow").each(function(index,value){  // .jqgrow是为了向高版本的jqgrid兼容。jqgrid低版本可能存在一些问题，但升级本身可能有新的问题，因此暂未升级到最新版本。 by wyj
								for(var i=0;i<gridDef.DispRuleMap.length;i++){
									iColIdx=$.grid.fn.getGridColID(gridDef,gridDef.DispRuleMap[i].colIdx);
									var rowcolor=gridDef.DispRuleMap[i].colorMap[$(this).find("td:eq("+iColIdx+")")[0].innerHTML];
									if (rowcolor!=null&&rowcolor!=""){
										var dispType=gridDef.DispRuleMap[i].dispType;
										if (dispType=="FCR"){
											$(this).css("color",rowcolor);
										}else if (dispType=="FCC"){
											$(this).find("td:eq("+iColIdx+")").css("color",rowcolor);
										}else if (dispType=="BCR"){
											$(this).find("td").css("background-color",rowcolor);
										}else if (dispType=="BCC"){
											$(this).find("td:eq("+iColIdx+")").css("background-color",rowcolor);
										}
									}
								}
							});
						}
						
						// 3. 处理数据类型为NUMBER FLOAT INTEGER型的列，或者显示类型为integer currency的列，如果显示为NaN（实际上可能是一个空值），则替换成0(currency替换成0.00)。同时还处理date。  BUG 319
						var dt;
						for(var i=0;i<=gridDef.colModel.length-1;i++){
							var iColIdx = $.grid.fn.getGridColID(gridDef, i);
							dt=gridDef.colModel[i].datatype;
							formatter=gridDef.colModel[i].formatter;
							if (((dt == 'NUMBER') || (dt == 'FLOAT') || (dt == 'INTEGER') || (dt == 'DATE') 
									|| (formatter=='integer') || (formatter == 'currency'))) {
								$("#"+grid_id+" tr.jqgrow").each(function(index,value){
									var theCell = $(this).find("td:eq(" + iColIdx + ")")[0];
									var correctedValue = '0';
									if (formatter == 'currency') { 
										correctedValue = '0.00';
									}
									else if (formatter == 'date') {
										correctedValue = '';
									}
									if ((theCell.innerHTML == 'NaN') || ((formatter == 'currency') && (theCell.innerHTML == '0')) ||
											(formatter == 'date' && theCell.innerHTML =='NaN-NaN-NaN'))
										theCell.innerHTML = correctedValue;
									if (($(theCell).attr("title") == 'NaN') ||
											((formatter == 'currency') && ($(theCell).attr("title") == '0')) ||
											(formatter == 'date' && $(theCell).attr("title") =='NaN-NaN-NaN'))
										$(theCell).attr("title", correctedValue); 
								});
							}	
						}
						// end of BUG 319 修改
						
						//附带表格内容是否折行的控制  BUG 354 同时修改ui.jqgrid.css中的.ui-jqgrid tr.jqgrow td项，取消了写死的换行风格。
						if (typeof(gridDef.wordwrap) == "undefined" || gridDef.wordwrap === true) 
							$("#"+grid_id+" tr.jqgrow td").css("word-wrap", "break-word").css("word-break", "break-word");


						if (gridDef.hasChart) {
							gridDef.chartInfo = $.grid.getChartInfo(gridDef); // 刷新一下图标的显示信息。
							// 如果当前是图的状态，则刷新图  // 可能是 bug 355 的解决方案。  待测。
							if ($("#div_grid" + gridDef.funcno).css("display") == "none") {
								var grid_chart_id = $.Q.getChartPanelID(gridDef.funcno);
								$.Q.showChart(gridDef.funcno, gridDef.chartInfo, $("#tb_" + grid_chart_id + ">select").val());
							}	
						}
					};

					$.grid.fn.createColLinks(gridDef);
					//3.col上面功能按钮的加入
					$.grid.fn.createColBtns(gridDef);

					//隐藏列
					$.grid.setHiddenCols(grid_id,gridDef.colModel);

					//设置hint
					for(var i=0;i<gridDef.colModel.length;i++){
						if (gridDef.colModel[i].hint!=undefined&&gridDef.colModel[i].hint!=""){
							var colID=gridDef.colModel[i].name.replace(".","\\.");
							$.addHint($("#jqgh_"+colID),gridDef.colModel[i].hint);
						}

					}

					//
					if (!gridDef.inContainer && !gridDef.onCreateProc && ($.page.winSize != undefined))
						$.page.winSize.adjustWindowYPosbyFunc(gridDef.funcno);

					if ($("#"+grid_id).getGridParam( "lastpage" ) < $("#"+grid_id).getGridParam( "page" )) {
						  $("#"+grid_id).setGridParam( {"page": 1} );
					}
					
					//如果表格只有一页的话，下面的页码bar不显示
					if ($("#"+grid_id).getGridParam( "lastpage" )<=1){
						var pagerH=$("#pager" + gridDef.funcno).height();
						var gridH=$("#grid"+gridDef.funcno).getGridParam("height");
						$("#pager" + gridDef.funcno).css({
							"height":"0px"
						});
						$("#grid"+gridDef.funcno).setGridHeight(gridH+pagerH);
					} else {
						var pagerH=$("#pager" + gridDef.funcno).height();
						var gridH=$("#grid"+gridDef.funcno).getGridParam("height");
						$("#pager" + gridDef.funcno).css({
							"height":"25px"
						});
						if (pagerH > 0){
							$("#grid"+gridDef.funcno).setGridHeight(gridH);
						}else{
							$("#grid"+gridDef.funcno).setGridHeight(gridH-pagerH-25);
						}
					}
					//调整grid的高度
					if (!gridDef.inContainer&&!gridDef.inContainer&&gridDef.max_rowNum>0){
						var gridH=$.grid.fn.calcGridHeightByRows(gridDef.funcno)
						+$.grid.fn.calcGridOtherHeight(gridDef.funcno); 
						$.grid.adjustHeight(gridDef.funcno,gridH);
					}
					setRowDisp();
					
//					if (gridDef.shrinkToFit) {
//						if (gridDef.parentWidth && $("#grid" + gridDef.funcno).width() > gridDef.parentWidth )
//							// 调整grid的宽度（jgGrid在宽度设定上有小bug）。以下代码在resizeWin中也用到。
//							$.Q.adjustGridWidth(gridDef.funcno, gridDef.parentWidth, 
//									$.grid.fn.calcGridHeightByRows(gridDef.funcno));
//					}
//					
					//自动选中要选中的行
					if(!gridDef.multiselect){
						var lr = $.grid.lastRows[gridDef.funcno];
						$.grid.onEdit[gridDef.funcno] = "";  // 这里永远是没有选中行的。
						if(lr){
							$("#grid" + gridDef.funcno).jqGrid('setSelection',lr,true);
						}
					}else{//加载选择列的内容
						$.grid.loadMultiRows(gridDef.funcno);
					}
					
					gridDef.dataComp(grid_id);

					//如果行数为0，则不显示
					if ($.page.idFunc!=undefined){
						var recCnt=$("#grid"+gridDef.funcno).getGridParam( "reccount" );
						var $win=$("#"+$.page.idFunc.getWinid($.page.idFunc.funcno2winno(gridDef.funcno)));
						$win.show();
						if (recCnt==0&&gridDef.nullhide){
							$win.hide();
						}
					}
					
		


					gridDef.allComplete();  // 问题：为什么allComplete要做两次？？  by wyj
					if(typeof(gridDef.complete) == "function")
						gridDef.complete(gridDef.funcno);
					gridDef.allComplete();
					gridDef.onCreateProc=false;
				};

				gridDef.loadError = function(xhr,st,err) {
					//$.msgbox.show("err","grid 在加载数据时发生错误，可能是sql拼写有错误");
				};
				
				gridDef.onSelectRow = function(rowid, status){
					// gridDef.multiselect === true && status === false时表示该行未选
					$.grid.fn.getDataToContext(gridDef.funcno,rowid); 
					$.userContext.setData('0-currFunc',gridDef.funcno);

					if(gridDef.editable){
						if ($.grid.onEdit[gridDef.funcno] != rowid && $.grid.lastEdited[gridDef.funcno] != rowid) {
						  $.grid.fn.editRow(gridDef.funcno,rowid,gridDef.editCond);
						  $.grid.lastEdited[gridDef.funcno] = rowid;
						}
						else {
							$.grid.lastEdited[gridDef.funcno] = "";
						}
					}

					if(gridDef.multiselect === true){
						$.grid.fn.getMultiRowsToContext(gridDef.funcno,gridDef.multifields);  
					}
					else {
						$.grid.lastRows[gridDef.funcno] = rowid;       // bug 239 相关改动 
					}

					//如果是点击列中的按钮的话，不会触发影响。否则会出现一些异常：比如界面有两个功能A/B（B为通用查询），
					//点击A表格中的按钮，发生跳转。由于点击A按钮的时候，会自动选中A中的相应行，从而触发B加载数据的Ajax。
					//而同时，页面发生跳转，B被释放-会导致jqGrid错误:grid为空或不存在。
					if (!gridDef.trigByRowBtn && $.page!=undefined)
						$.page.triggerBy(gridDef.funcno);
					
					
					// gridDef.multiselect === true && status === false时表示该行未选
					if (!gridDef.multiselect || gridDef.multiselect === true && status === true) {  // bug 239 相关改动 
						gridDef.rowSelected(rowid);
					}
										
					gridDef.trigByRowBtn=false;//按钮
				};

				gridDef.onSelectAll = function(rowids,status){
					$.grid.lastRows[gridDef.funcno] = rowids[rowids.length-1];
					if(gridDef.multiselect){
						$.grid.fn.getMultiRowsToContext(gridDef.funcno,gridDef.multifields);
					}
				};

				gridDef.beforeRequest = function(){
					var joinCond=$.userContext.parser(gridDef.joinconditions);
					if (gridDef.selconditions!=undefined&&gridDef.selconditions!=""){
						if (joinCond=="") {
							joinCond=gridDef.selconditions;
						}
						else {
							joinCond+=' and '+gridDef.selconditions;
						}
					}
										

					$("#"+grid_id).jqGrid("appendPostData",{
						prjfields:$.userContext.parser(gridDef.prjfields),
						tablenames:$.userContext.parser(gridDef.tablenames),
						joinconditions:joinCond,
						userconditions:$.userContext.parser(gridDef.initcond)  // Bug 176 增加此属性。 parser对undefined会返回 空串。
					});
				};

				gridDef.onSortCol = function(){
					$("#"+grid_id).jqGrid("removePostDataItem","ordStr");
				};
			},
			
			

			setToolbar:function(funcno,toolbar){

				var toolNeed = false;
				var grid_id = "grid"+funcno;
				var layout = toolbar.toolbarlayout;
				$("#t_"+grid_id).empty();
				var btnOptions;
				//添加显示图表按钮
				if(toolbar.hasChart){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_showchart",
							caption:"图表", 
							icon:"ui-icon-image", 
							pos:layout
					};
					$("#t_" + grid_id).append( $.button.createIcon(btnOptions));
					$("#" + grid_id + "_showchart").click(function(){
						var grid_chart_id = $.Q.getChartPanelID(funcno);
						$.Q.showChart(funcno, toolbar.chartInfo, $("#tb_" + grid_chart_id + ">select").val());
					});
				}
				//添加选择列按钮
				if(toolbar.selcol){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_selcol",
							caption:"选择列", 
							icon:"ui-icon-transferthick-e-w", 
							pos:layout
					};
					$("#t_" + grid_id).append( $.button.createIcon(btnOptions));
					$("#" + grid_id + "_selcol").click(function(){
						$("#" + grid_id).jqGrid('setColumns');
					});
				}
				//添加排序按钮
				if(toolbar.sortable){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_sort",
							caption:"排序", 
							icon:"ui-icon-arrowthick-2-n-s", 
							pos:layout
					};
					$.grid.createSortDailog(funcno);
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));
					$("#"+grid_id+"_sort").click(function(){
						$.grid.fn.openSortDialog(funcno);
					});
				}
				//添加刷新按钮
				if(toolbar.refreshable){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_refresh",
							caption:"刷新", 
							icon:"ui-icon-refresh", 
							pos:layout
					};
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));
					$("#" + grid_id + "_refresh").click(function(){
						$("#" + grid_id).trigger('reloadGrid');
					});
				}
				//添加重载数据按钮
				if(toolbar.reloadable){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_reload",
							caption:"重载", 
							icon:"ui-icon-arrowthickstop-1-n", 
							pos:layout
					};
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));
					$("#" + grid_id + "_reload").click(function(){
						$("#" + grid_id).jqGrid("setPostData",{});
						if (toolbar.panelSearch == 'imbed') // 弹出搜索框 则清空条件  //BUG 402 针对BUG 314，在弹出搜索框的情况下需要重置条件为无条件。
							$.userContext.userData[funcno+"-COND"] = "1=1";  // BUG 314 顺带注释掉这一行
						$("#" + grid_id).trigger('reloadGrid');
						$.grid.onEdit[funcno] = "";

					});
				}

				//添加打印按钮
				if(toolbar.print){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_print",
							caption:"导出", 
							icon:"ui-icon-print", 
							pos:layout
					};
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));
					$("#"+grid_id+"_print").click(function(){
						$.grid.printGrid( funcno );
					});
				}

				//添加保存列表显示按钮
				if (toolbar.customizable){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_saveGrid",
							caption:"个人显示设置", 
							icon:"ui-icon-heart", 
							pos:layout
					};
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));
					$("#"+grid_id+"_saveGrid").click(function(){
						var colModel= $("#"+grid_id).jqGrid('getGridParam','colModel'); 
						var userGridSet="";//userGridSet显示格式如:ci.carid:200,true;ci.carowner:300,false;
						for(var i=1;i<colModel.length;i++){
							userGridSet+=colModel[i].name+":"+colModel[i].width+","+!colModel[i].hidden+";";
						}
						$.ajax({
							type: "POST",
							url: $.grid.opitions.gridDispSetURL,
							data: {
								funcNo:funcno,
								dispExp:userGridSet
							},
							dataType: "json",
							success: function( data,textStatus ){
								$.msgbox.show("succ","您的显示设置保存成功");
							},
							error:function(e){
								$.msgbox.show("err",e.responseText);
							}
						});

					});
				}

				//添加查询按钮
				if(toolbar.searchable){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_search",
							caption:"搜索", 
							icon:"ui-icon-search", 
							pos:layout
					};
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));
					$("#"+grid_id+"_search").click(function(){
						$("#" + grid_id).jqGrid('searchGrid',
								{
							sopt:['cn','bw','eq','ne','lt' ,'gt','ew'],
							multipleSearch:true,
							closeAfterSearch:true
								}
						);
					});
				}

				//添加查询按钮
				if(toolbar.panelSearch == 'imbed'){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_query",
							caption:"查询", 
							icon:"ui-icon-zoomin", 
							pos:layout
					};
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));
					$("#"+grid_id + "_query").click(function(){
						$.grid.openSearchPanel(funcno);
					});
				}

				//添加添加按钮
				if(toolbar.addable){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_add",
							caption:"添加", 
							icon:"ui-icon-plus", 
							pos:layout
					};
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));
					$("#"+grid_id+"_add").click(function(){
						$.grid.fn.addRow(funcno);
					});
				}
				//添加删除按钮
				if(toolbar.delable){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_del",
							caption:"删除", 
							icon:"ui-icon-trash", 
							pos:layout
					};
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));
					$("#"+grid_id+"_del").click(function(){
						var rowid = $.grid.lastRows[funcno];
						if(rowid!=null)
							$.grid.fn.delRow(funcno,rowid);
						else
							$.msgbox.show("msg","请选择一条记录");
					});
				}
				//添加导入按钮
				if(toolbar.impable){
					toolNeed = true;
					btnOptions={
							id:grid_id + "_imp",
							caption:"导入", 
							icon:"ui-icon-arrowthickstop-1-s", 
							pos:layout
					};
					$("#t_"+grid_id).append($.button.createIcon(btnOptions));

					if (toolbar.imptype=='dbf'){
						$("#"+grid_id+"_imp").uploadify({
							buttonImg	   :'img/imp.png',
							buttonText	   :'导入',
							uploader       : 'uploadFile/uploadify.swf',
							script         : 'impDbf.action',
							scriptData	   : {
								tableName:toolbar.tablenames,
								dataMapStr:encodeURI(toolbar.dataMapStr),
								isDiffUser:toolbar.impdiffuser,
								user_Id:$.UC.bindData("#0-USERINFO.USERID#")
							},
							fileDataName   : 'fileStream',
							sizeLimit	   : 60000000,
							cancelImg      : 'img/cancel.png',
							folder         : 'uploads',
							auto     	   : true,
							fileDesc  	   : '支持格式:dbf',
							fileExt   	   : '*.dbf',
							multi          : false,
							onOpen		   :function(){
								$("#div_"+grid_id).parent().next()
								.block({
									message:"<p class='ui-state-active'>正在导入文件,请稍等...</p>",
									overlayCSS:{
										backgroundColor: '#0F4569', 
										opacity:         0.4
									}
								});
							},
							onComplete     : function (event, queueID, fileObj, response, data){
								$("#div_"+grid_id).parent().next().unblock();
								if(!response.match(/^success/)){
									$.msgbox.show("err",response);
								}else{
									$("#"+grid_id).trigger('reloadGrid');
								}
							},    
							onError		   : function(event, queueID, fileObj){    
								$("#div_"+grid_id).parent().next().unblock();
								if(fileObj.size>60000000){
									$.msgbox.show("err","导入的dbf文件不能超过60M");
								}else{
									$.msgbox.show("err","导入失败,可能服务器繁忙,请重试");
								}
							},   
							onCancel	: function(event, queueID, fileObj){
								$("#div_"+grid_id).parent().next().unblock();
							}
						});
					}
					else if (toolbar.imptype == 'csv') {
						$("#"+grid_id+"_imp").uploadify({
							buttonImg	   :'img/imp.png',
							buttonText	   :'导入',
							uploader       : 'uploadFile/uploadify.swf',
							script         : 'impCsv.action',
							scriptData	   : {
								tableName:toolbar.tablenames,
								dataMapStr:encodeURI(toolbar.dataMapStr),
								isDiffUser:toolbar.impdiffuser,
								user_Id:$.UC.bindData("#0-USERINFO.USERID#")
							},
							fileDataName   : 'fileStream',
							sizeLimit	   : 60000000,
							cancelImg      : 'img/cancel.png',
							folder         : 'uploads',
							auto     	   : true,
							fileDesc  	   : '支持格式:逗号分隔的文本文件csv',
							fileExt   	   : '*.csv',
							multi          : false,
							onOpen			:function(){
								$("#div_"+grid_id).parent().next()
								.block({
									message:"<p class='ui-state-active'>正在导入文件,请稍等...</p>",
									overlayCSS:{
										backgroundColor: '#0F4569', 
										opacity:         0.4
									}
								});
							},
							onComplete     : function (event, queueID, fileObj, response, data){
								$("#div_"+grid_id).parent().next().unblock();
								if(!response.match(/^success/)){
									$.msgbox.show("err",response);
								}else{
									$("#"+grid_id).trigger('reloadGrid');
								}
							},    
							onError		   : function(event, queueID, fileObj){    
								$("#div_"+grid_id).parent().next().unblock();
								if(fileObj.size>60000000){
									$.msgbox.show("err","导入的CSV文件不能超过60M");
								}else{
									$.msgbox.show("err","导入失败,可能服务器繁忙,请重试");
								}
							},   
							onCancel	: function(event, queueID, fileObj){
								$("#div_"+grid_id).parent().next().unblock();
							}
						});
					}
					else{//默认支持excel
						$("#"+grid_id+"_imp").uploadify({
							buttonImg	   :'img/imp.png',
							buttonText	   :'导入',
							uploader       : 'uploadFile/uploadify.swf',
							script         : 'impExcel.action',
							scriptData	   : {
								tableName:toolbar.tablenames,
								dataMapStr:encodeURI(toolbar.dataMapStr),
								isDiffUser:toolbar.impdiffuser,
								user_Id:$.UC.bindData("#0-USERINFO.USERID#")
							},
							fileDataName   : 'fileStream',  // 以前是xlsStream。在增加csv类型时统一更新为现在的名称。同时涉及FileUploadAction.java
							sizeLimit	   : 60000000,
							cancelImg      : 'img/cancel.png',
							folder         : 'uploads',
							auto     	   : true,
							fileDesc  	   : '支持格式:xls',
							fileExt   	   : '*.xls',
							multi          : false,
							onOpen			:function(){
								$("#div_"+grid_id).parent().next()
								.block({
									message:"<p class='ui-state-active'>正在导入文件,请稍等...</p>",
									overlayCSS:{
										backgroundColor: '#0F4569', 
										opacity:         0.4
									}
								});
							},
							onComplete     : function (event, queueID, fileObj, response, data){
								$("#div_"+grid_id).parent().next().unblock();
								if(!response.match(/^success/)){
									$.msgbox.show("err",response);
								}else{
									$("#"+grid_id).trigger('reloadGrid');
								}
							},    
							onError		   : function(event, queueID, fileObj){    
								$("#div_"+grid_id).parent().next().unblock();
								if(fileObj.size>60000000){
									$.msgbox.show("err","导入的EXCEL文件不能超过60M");
								}else{
									$.msgbox.show("err","导入失败,可能服务器繁忙,请重试");
								}
							},   
							onCancel	: function(event, queueID, fileObj){
								$("#div_"+grid_id).parent().next().unblock();
							}
						});
					};

					$("#"+grid_id+"_impUploader")
					.css({
						width:"40px",
						height:"16px",
						"float":"left",
						marginLeft:"2px",
						marginTop:"2px"
					});

					$("#"+grid_id+"_impQueue").css("float","right");
				}

				if(toolNeed){
					$("#t_"+grid_id).css({
						height:"26px"
					});
				}else{
					$("#t_"+grid_id).hide();
				}

			}, 

			setDefault:function( funcno ){
				if($("#grid"+funcno+">tbody>tr.jqgrow").length >0 ){
					$.grid.lastRows[funcno] = funcno+"_0";
					$.grid.onEdit[funcno] = ""; //funcno+"_0";
					$("#grid"+funcno).jqGrid('setSelection',funcno+"_0",true);
				}
			},

			clear:function(funcno){
				//清空grid在uc中保存的数据
				$.UC.setData(funcno + "-COND", "");
				$.UC.setData(funcno + "-FITEMDEF.FEEITEMDEFORD", "");
				$.UC.setData(funcno + "-FITEMDEF.FEEITEMNAME", "");
				$.UC.setData(funcno + "-MULTICOLNAMES", "");
				$.UC.setData(funcno + "-MULTICOUNT", "");
				$.UC.setData(funcno + "-MULTIROWS", "");
				$.UC.setData(funcno + "-RN", "");
				$.UC.setData(funcno + "-SINGLECOLNAMES", "");
				$.UC.setData(funcno + "-SYSDEF.SYSNAME", "");
			},

			printGrid:function( funcno ){
				var gridDef = $.grid.list[ funcno ];
				var typeMap = gridDef.typeMap;
				var colNames = [];
				var columns = [];
				var types = [];
				var cm = gridDef.colModel;
				for(var i=0;i<cm.length;i++){
					if(cm[i].isshow){
						var column_name = $.trim((cm[i].name.split(".")[1]+"").toUpperCase());
						if (column_name.split(/\s+/).length > 1) {   // bug 306 添加对sql中别名字段的支持
							column_name = column_name.split(/\s+/)[1];
						} 
						columns.push(column_name);
						types.push( cm[i].datatype );
						colNames.push(gridDef.colNames[i]);
					}
				}

				printGrid(colNames,columns,types,funcno);
			},

			createSortDailog:function( funcno ){
				var gridDef = $.grid.list[funcno];
				var grid_id = "grid"+funcno;
				var colNames = gridDef.colNames;
				var colModel = gridDef.colModel;
				var zIndex =$("#"+grid_id).css("zIndex");
				if(zIndex){
					zIndex = zIndex + 1;
				}else{
					zIndex = 1000;
				}
				var head ='<h3 class="ui-widget-header ui-corner-all">'
					+'<div class="ui-dialog-title">高级排序</div>'
					+ '</h3>';
				var sortDialog = '<div id="'+grid_id+'_sortDlg" style="left:0px;top:30px;position:absolute;z-index:'+zIndex+';display:none;width: 370px;" class="form ui-widget-content ui-corner-all">'+head
				+ '<div class="form-body">'
				+ '<div style="float:left" class = "ui-state-default"><span style="padding:4px;">备选字段</span>'
				+ '<ul id="'+grid_id+'sortable1" class="connectedSortable sort-ul">';
				for(var i=0;i<colModel.length;i++){	    
					sortDialog +='<li title="按鼠标左键拖拽至右边" class="ui-state-default">'
						+'<span style="float:left">'+colNames[i]+'</span>'
						+'<div title="点击改变次序" class="order" style="float:right;cursor:pointer" name="'+colModel[i].name+'" order="asc">'
						+'<span style="float:left;margin:-2px" class="ui-icon  ui-icon-arrowthick-1-n"></span><span>升序</span>'
						+'</div></li>';
				}
				sortDialog += '</ul></div>'
					+ '<span style="float:left" class="ui-icon ui-icon-transferthick-e-w"></span>'
					+ '<div style="float:left" class = "ui-state-active"><span style="padding:4px;">排序字段</span>'
					+ '<ul id="'+grid_id+'sortable2" class="connectedSortable sort-ul "></ul>'
					+ '</div>'
					+'</div>'
					+'<div class="form-foot">'
					+ $.button.create({
						caption:"排    序 ",
						icon:"ui-icon-arrowthick-2-n-s",
						script:"$.grid.fn.sortGrid("+funcno+")"
					})
					+ $.button.create({
						caption:"关    闭",
						icon:"ui-icon-close",
						script:"$.grid.fn.closeSortDialog("+funcno+")"
					})
					+'</div></div>';

				$(sortDialog).appendTo($("#div_"+grid_id));
				$("#"+grid_id+"sortable1, #"+grid_id+"sortable2").sortable({
					connectWith: '.connectedSortable',
					placeholder: 'ui-state-highlight'

				}).disableSelection();

				$("#"+grid_id+"sortable1>li>div").toggle(

						function(){
							$(this).attr("order","desc").children()
							.removeClass("ui-icon-arrowthick-1-n")
							.addClass("ui-icon-arrowthick-1-s").text("降序");
						},

						function(){
							$(this).attr("order","asc").children()
							.removeClass("ui-icon-arrowthick-1-s")
							.addClass("ui-icon-arrowthick-1-n").text("升序");
						}
				);
				$('#'+grid_id+'_sortDlg').draggable({
					cancel:".form-body"
				});

			},

			openSearchPanel:function(funcno){
				var $sp = $("#grid"+funcno+"_sp");
				// TODO: 
				if($sp.length>0){
					$sp.dialog('option', 'zIndex', 100)
					.dialog("open");
				}else{
					var gridDef = $.grid.list[funcno];
					$.grid.createSearchPanel(funcno,gridDef.colModel,gridDef.colNames);
					$("#grid"+funcno+"_sp").dialog({
						title:"<span style='float:left' class='ui-icon ui-icon-search'></span>查询对话框",
						bgiframe:true,
						autoOpen:true,
						width:540,
						zIndex:100,
						draggable:false,
						modal: true,
						buttons:{
							"查询":function(){
								if($.grid.doQuery(funcno)){
									$(this).dialog("close");
									$.page.triggerBy( funcno );
								};

							},	
							"关闭":function(){
								$(this).dialog("close");
							}
						}
					});
				}
			},

			OnTextSearch:function(event){
				var code = null;
				if (event.keyCode){
					code = event.keyCode;
				} else if(event.which){
					code = event.which;
				}
				if (code == 13){
					$.grid.doQuery(funcno);
				}
			},
			OnSelectSearch: function(event){
				$.grid.doQuery(funcno);
			},
			OnCheckBoxSearch: function(event){
				$.grid.doQuery(funcno);
			},
			
			
			// 内嵌的Chart支持
			getChartPanelID: function(funcno) {
				return "grid" + funcno + "_chart";
			},
			getChartInfo: function(gridDef) {
				var funcno = gridDef.funcno;
				var colModel = gridDef.colModel;
				var colNames = gridDef.colNames;
				// 从colModel中获取value字段，从而的到series。再从表格内容中获得值。
				var keyFields = [];
				var xAxisNames = [];
				var seriesFieldNames = [];  // 序列的字段名
				var seriesNames = [];      // 序列的显示名称（从表格的字段显示名称里来）
				for (var i = 0; i < colModel.length; i ++) {
					var colDef = colModel[i];
					if (colDef.chart_col == "value") {
						seriesFieldNames.push(colDef.name);
						seriesNames.push(colNames[i]);
					}
					else if (colDef.chart_col == "key") {
						keyFields.push(colDef.name);
						xAxisNames.push(colNames[i]);
					}
				}
				var categories = [];
				var datasets = [];
				var hasChart = false;
				if (keyFields.length > 0 && seriesNames.length > 0) { 
					hasChart = true;
					// 获取本页所有的记录  // 
					//  BUG 260遗留.  getRowsData不支持分页多选。以后有可能需要改进为getRowsDataEx方法
					var rowids = [];
					if (gridDef.multiselect) { // 多选grid的话，管选中的行
						var $g = $("#grid"+funcno);
						if ($g.length > 0)
							rowids = $g.jqGrid('getGridParam','selarrrow');
					}
					else {
						var $gridRows = $("#grid" + funcno + " tr.jqgrow");  // 单选grid的话，只管当前页的行。
						$gridRows.each(function(i, n) {
							rowids.push($(n).attr("id"));
						});
					}
					if (rowids && rowids.length > 0) {
						// 生成各个category的名称
						var rowsCategoryData = $.grid.fn.getRowsData(funcno,rowids,keyFields.join(","));
						var rowsCatArray = rowsCategoryData.split(";");
						for(var i = 0;i < rowsCatArray.length; i++){
							var category = new Category({"Label":rowsCatArray[i]});
							categories.push(category);
						}

						var rowsData = $.grid.fn.getRowsData(funcno,rowids,seriesFieldNames.join(",")); // 取出的记录形如 1&123&234&aaa;2&234&345&bbb
						// 生成各个series的数据
						var dataset;
						var rowsDataArray = rowsData.split(";");
						for(var i = 0;i < seriesFieldNames.length; i++){  // 各个series
							dataset = new Dataset({seriesName: seriesNames[i]});
							for(var j = 0;j < rowsDataArray.length; j++){
								var oneRow = rowsDataArray[j].split("&");
								set = new Set({value:oneRow[i]});
								dataset.addSet(set);
							}
							datasets.push(dataset);
						}
					}
				}
				
				return {hasChart: hasChart, categories: categories, datasets: datasets, xAxis: xAxisNames.join(","), yAxis: seriesNames.join(";"), pageSize:rowsCatArray?rowsCatArray.length:10};
			},
			showChart: function(funcno, chartInfo, chartType) {
				var $grid = $("#div_grid" + funcno);
				$grid.css("display", "none");
				var $target = $("#"+ $.Q.getChartPanelID(funcno));
				$target.parent().css("display", "block");
				$target.css("height", $target.parent().height() - 26);

				if (chartInfo.categories.length > 0 && chartInfo.datasets.length > 0) {
					var attrs = {
							numberPrefix	:"",
							numberSuffix	:"",
							xAixsName		:chartInfo.xAxis,
							yAxisName		:chartInfo.yAxis,
							showvalues		:"true",//原结构没提供 如果设为false，那么图中的数值将不显示,如果数字很密则会很乱，此时这个属性会有用
							showLegend      :"true",
							legendPosition  :"RIGHT",
							caption			:"",
							baseFont		:"Times New Roman",
							baseFontSize	:11,
							baseFontColor	:"000000",
							bgColor			:"808080",
							bgAlpha			:10,
							pageSize		:chartInfo.pageSize,
							pieYScale:80,//控制3D饼图向上翻转的角度； 取值范围：30-80
							pieSliceDepth:6,  //属性：控制3D饼图的厚度；         取值范围：无
							placePercentInside:1
					};
					
					var getMSChartType = function(chartType) {
						return "MS" + chartType;
					};
					var mChart;
					if (chartInfo.datasets.length = 1) {  // 要生成单系列图
						mChart = new SingleSerieChart(chartType, attrs);
						var data = [];
						for (var i=0;i< chartInfo.categories.length;i++){
							mChart.appendData(chartInfo.categories[i].Label, chartInfo.datasets[0].sets[i].attr.value);
						}
					}
					else {// 要生成多系列图
						mChart = new MultiSeriesChart(getMSChartType(chartType), attrs);
						mChart.setCategory(chartInfo.categories);
						mChart.setDataset(chartInfo.datasets);

					}
					
					ChartAdapter.createChart($.Q.getChartPanelID(funcno), mChart);
				}
				
			},

			createSearchPanel:function(funcno,colModel,colNames){
				var $panel = $("<table cellspacing='0' style='width:100%' class='searchPanel'></table>");
				var $sPanel = $("<div style='display:none' id='grid"+funcno+"_sp'></div>").append($panel);
				$("#div_grid"+funcno).prepend($sPanel);
				for(var i=0;i<colModel.length;i++){
					var coldef = colModel[i];
					if(coldef.searchable){
						var inp = "";
						var id = "grid"+funcno+"_s_"+coldef.name.replace(".","-");
						var dt = coldef.datatype;
						var s_format = coldef.s_format;
						var bindData = coldef.bidingdata;
						var bindData2 = bindData+"^"+id;//因为多个绑定sql时会出现内容集中到一个下拉框中，所以此时把id送入
						if ($.userContext.userData[funcno+"-COND"] == "1=1")
							$.UC.setData(funcno + "-" + coldef.name + "_s", "");
						var valStr = $.UC.userData[(funcno + "-" + coldef.name + "_s").toUpperCase()];
						if((dt == 'NUMBER') || (dt == 'FLOAT') || (dt == 'INTEGER') || (dt == 'DATE') ){
							var val1 = valStr?valStr.split(";")[0]:"";
							var val2 = valStr?valStr.split(";")[1]:"";
							inp = "<td id='"+id+"'>";
							inp += "<input style='float:left;' type='text' onkeypress='$.grid.OnTextSearch' value='" + val1 +"'/>";
							inp += "<span style='float:left;'>至</span>";
							inp += "<input style='float:left;' type='text' onkeypress='$.grid.OnTextSearch' value='"+ val2 +"'/></td>";
							$panel.append("<tr><td style='width:20px;display:none;'><input id='"+id.replace("_s_", "_c_")+"' type='checkbox'/></td>" +
									"<td style='width:160px;'>"+colNames[i]+":</td>"+inp+"</tr>");
						}
						else if(s_format=="select"){

							var val = valStr?valStr:"";
							inp = "<td id='"+id+"'><select id='s_"+id+"' style='float:left' onchange='$.grid.OnSelectSearch' sdata='"+ val +"'></select></td>";
							$panel.append("<tr><td style='width:20px;display:none;'><input id='"+id.replace("_s_", "_c_")+"' type='checkbox'/></td>" +
									"<td style='width:160px;'>"+colNames[i]+":</td>"+inp+"</tr>");

							var getOptionsDOM = function(bindData){  // bug 303 在IE8下select显示宽度异常。点一下就好了。现在换成DOM添加options，目前下拉框宽度显示基本正常（还有一点点没对齐，有空再看）
								var optionsDOM={};
								var kvs=bindData.split(";");
								optionsDOM[0] = document.createElement("option");
								optionsDOM[0].text = "<请选择>";
								optionsDOM[0].value = "";
								for(var i=0;i<kvs.length;i++){
									var kv=kvs[i].split(":");
									optionsDOM[i+1] = document.createElement("option");
									optionsDOM[i+1].text = kv[1];
									optionsDOM[i+1].value = kv[0];
									//"<option value='"+kv[0]+"'>"+kv[1]+"</option>";
								}
								return optionsDOM;
							};
							if(bindData2.substring(0,1) == "@"){
								var bdata = bindData2.split("^")[0]; 
								var bid = bindData2.split("^")[1];    //
								$.ajax({
									type:"POST",
									url:$.Q.opitions.dataBindingURL,
									data:{
										bid:bid,
										sql:$.userContext.parser(bdata.substring(1))
									},
									dataType:"text",
									success:function(data,textStatus){
										var bid = data.split("^")[0];
										var ops = getOptionsDOM(data.split("^")[1]);  // bug 303
										if (ops) {
											$("#s_"+bid).empty();
											$.each(ops, function(i,n) {
												$("#s_"+bid).get(0).options.add(n);
											});
											if ($("#s_"+bid).attr("sdata")) {
												$("#s_"+bid).value($("#s_"+bid).attr("sdata"));
											} 
										}
										//$("#s_"+bid).append();  // bug 303
									}
								});
							}
							else//否则直接绑定 
							{
								var ops = getOptionsDOM(bindData);  // bug 303
								if (ops) {
									$("#s_"+id).empty();      // // BUG 310  原来这里直接copy了上面那个分支的bid。这导致会取错控件。现在都改回id
									$.each(ops, function(i,n) {
										$("#s_"+id).get(0).options.add(n);  // BUG 310 
									});
									if ($("#s_"+id).attr("sdata")) {
										$("#s_"+id).value($("#s_"+bid).attr("sdata"));
									} 
									//	$("#s_"+id).append();   // bug 303
								}
								
							}
						}
						else if(s_format=="checkbox"){
							var val = valStr?valStr:"false";
							inp = "<td id='"+id+"'><input style='float:left;' type='checkbox'  onchange='$.grid.OnCheckBoxSearch'/></td>";
							$panel.append("<tr><td style='width:20px;display:none;'><input id='"+id.replace("_s_", "_c_")+"' type='checkbox'/></td>" +
									"<td style='width:160px;'>"+colNames[i]+":</td>"+inp+"</tr>");
							$("#"+id.replace("_c_", "_s_")).children().attr("checked", val);
						}
						else{
							var val = valStr?valStr:"";
							inp = "<td id='"+id+"'><input style='float:left;' type='text' onkeypress='$.grid.OnTextSearch' value='" + val + "'/></td>";
							$panel.append("<tr><td style='width:20px;display:none;'><input id='"+id.replace("_s_", "_c_")+"' type='checkbox'/></td>" +
									"<td style='width:160px;'>"+colNames[i]+":</td>"+inp+"</tr>");
						} 

						if((dt == 'CHAR')||(dt == 'VARCHAR')||(dt == 'VARCHAR2')||
								(dt == 'NUMBER') || (dt == 'FLOAT') || (dt == 'INTEGER')){
							$("#"+id+">input").keyup(function(e){
								var keyCode = e.keyCode ? e.keyCode : e.which ? e.which : e.charCode;
								if (keyCode == 13){
									if ($("#grid"+funcno+"_sp")){
										if($.grid.doQuery(funcno)){
											$("#grid"+funcno+"_sp").dialog("close");
											$.page.triggerBy( funcno );
										};
									} else {
										$.grid.doQuery(funcno);
									}
								}
							});
						} else if(dt=='DATE'){
							$("#"+id+">input").attr("readonly",true).datepicker({
								changeYear:true,
								changeMonth:true,
								duration:"fast",
								beforeShow:function(input,inst){
									inst.dpDiv.css("z-index",1000);
								}
							});
						}
					}
				} 

				$panel.append("<tr><td colspan='3'><span class='ui-state-highlight' style='float:left' id='grid"+funcno+"_queryTip'></span></td></tr>");

				return $sPanel;
			},

			doQuery:function(funcno){
				$("#grid"+funcno+"_queryTip").html("");
				var gridDef = $.grid.list[funcno];
				var cond = "1=1";
				var c = gridDef.colModel.length;
				for(var i=0;i<c;i++){
					var coldef = gridDef.colModel[i];
					if(coldef.searchable){
						var id ="grid"+funcno+"_c_"+coldef.name.replace(".","-");
						//修改不根据checkbox来生成条件，根据是否为空来生成
						//if($("#"+id).attr("checked")){
						var dt = coldef.datatype;
						var s_format = coldef.s_format;
						if((dt == 'NUMBER') || (dt == 'FLOAT') || (dt == 'INTEGER')){
							var val1 = $("#"+id.replace("_c_", "_s_")+">input:first").val();
							var val2 = $("#"+id.replace("_c_", "_s_")+">input:last").val();
							if (coldef.s_exp) {   // bug 278 搜索的查询表达式。例如，填入 “*10000”，则搜索的时候会自动将搜索的数值*10000。目前只对数值型有效。
								if (val1 && /\d+$/.test(val1)) {
								  val1 = eval(val1 + coldef.s_exp);
								}
								if (val2 && /\d+$/.test(val2)) {
								  val2 = eval(val2 + coldef.s_exp);
								}
							}
							//如果不为空则继续
							if(val1 || val2){
								if(val1 && val2){
									if(/\d+$/.test(val1) && /\d+$/.test(val2)){
										cond += " and ("+coldef.name + " >= " + val1
										+ " and "+coldef.name +" <= " + val2 +")";
									}else{
										$("#grid"+funcno+"_queryTip").html(gridDef.colNames[i]+"只能是数字");
										return false;
									}
								}else if(val1){
									if(/\d+$/.test(val1)){
										cond += " and "+coldef.name + " >= " + val1;
									}else{
										$("#grid"+funcno+"_queryTip").html(gridDef.colNames[i]+"只能是数字");
										return false;
									}

								}else if(val2){
									if(/\d+$/.test(val2)){
										cond += " and "+coldef.name + " <= " + val2;
									}else{
										$("#grid"+funcno+"_queryTip").html(gridDef.colNames[i]+"只能是数字");
										return false;
									}
								}else{
									$("#grid"+funcno+"_queryTip").html(gridDef.colNames[i]+" 左右不能都为空值");
									return false;
								}
								$.UC.setData(funcno + '-' + coldef.name + '_s', val1 + ";" + val2);
							}
							else
								$.UC.setData(funcno + '-' + coldef.name + '_s', "");
						}else if(dt == 'DATE'){
							var val1 = $("#"+id.replace("_c_", "_s_")+">input:first").val();
							var val2 = $("#"+id.replace("_c_", "_s_")+">input:last").val();
							//如果不为空则继续
							if(val1 || val2){
								if(val1 && val2){
									cond += " and ( "+coldef.name + " between to_date('"+val1+"','yyyy-MM-dd') and to_date('"+val2+"','yyyy-MM-dd') )";
								}else if(val1){
									cond += " and "+coldef.name + " >= to_date('" + val1+"','yyyy-MM-dd')";

								}else if(val2){
									cond += " and "+coldef.name + " >= to_date('" + val2+"','yyyy-MM-dd')";

								}else{
									$("#grid"+funcno+"_queryTip").html(gridDef.colNames[i]+" 左右不能有空值");
									return false;
								}
								$.UC.setData(funcno + '-' + coldef.name + '_s', val1 + ";" + val2);
							}
							else
								$.UC.setData(funcno + '-' + coldef.name + '_s', "");

						}else if(s_format=='select'){
							var op = "=";
							var val = $("#"+id.replace("_c_", "_s_")+">select").val().replace("'","");
							/*
							 * if(val.match("%")||val.match("_"))
                                                                op = "like";
							 */
							if (val){
								cond += " and " + coldef.name + " "+op+" '"+val+"'";
								$.UC.setData(funcno + '-' + coldef.name + '_s', val);
							}
							else
								$.UC.setData(funcno + '-' + coldef.name + '_s', "");
						}else if (s_format=="checkbox"){

							var op = "=";
							var val = "";
							if( $("#"+id.replace("_c_", "_s_")).children().attr("checked"))
								val = "true";
							else 
								val = "false";
							cond += " and " + coldef.name + " "+op+" '"+val+"'";
							$.UC.setData(funcno + '-' + coldef.name + '_s', val);
						}
						else{
							//var op = "=";
							//var val = $("#"+id.replace("_c_", "_s_")+">input").val().replace("'","");
							//if(val.match("%")||val.match("_"))
							//	op = "like";
							//cond += " and " + coldef.name + " "+op+" '"+val+"'";
							var op = "like";
							var val = $("#"+id.replace("_c_", "_s_")+">input").val().replace("'","");
							if (val){
								$.UC.setData(funcno + '-' + coldef.name + '_s', val);
								val = val.replace(/[\s]+/g,"%");
								val = val.replace(/[　]+/g, "%");
								val = "%" + val + "%";
								cond += " and " + coldef.name + " "+op+" '"+val+"'";
							}
							else
								$.UC.setData(funcno + '-' + coldef.name + '_s', "");
						}
						//}	
					}  //end if of searchable
				}
				$.userContext.userData[funcno+"-COND"] = cond;
				$("#grid"+funcno).trigger('reloadGrid');
				if(cond=='1=1') {
					return false;
				}
				else
					return true;
				//$.grid.refresh(funcno,cond);
			},

			refresh:function(funcno,filter){
				var gridDef = $.grid.list[funcno];
				var grid_id = "grid" + gridDef.funcno;
				var grid_divId = "div_" + grid_id;
				var pager_id = "pager" + gridDef.funcno;

				if ($.Q.expandColDef(gridDef)) {
					$("#"+grid_id).parent().parent().parent().parent().remove();
					$("#"+pager_id).remove();
					$("#"+grid_divId).append("<table  id=\""+grid_id+"\" ></table><div id=\""+pager_id+"\"></div></div>");
					$("#"+grid_id).jqGrid(gridDef);
					$.grid.setToolbar(gridDef.funcno, gridDef);
				}
				else {
					if(filter && (filter != '$'))//有刷新过滤条件则带上条件刷新
						$("#grid"+funcno).jqGrid('setPostDataItem','selconditions',filter);

					$("#grid"+funcno).trigger('reloadGrid');
				}
			},

			refreshCallback:function(funcno, callback, filter){
				$.Q.refresh(funcno, filter);
				if (typeof(callback) == "function"){
					setTimeout(callback(), 1000);
				}
			},
			check:function(funcno){
				if(!$.grid.lastRows[funcno]){
					$.msgbox.show("msg","请先选择记录");
					return false;
				}else 
					return true;
			},

			// adjustGridWidth方法被删除。直接修改了jquery.jqGrid.min.js。发现其中的计算宽度的问题在于没有考虑td的padding和border。
			// 现在按照现有的td的padding 左右各2px，border右1px，进行了修正。同时对有纵向滚动条的最后一列的宽度修正进行了修正。
			// 经过修改，在shrinkToFit===true的情况下，没有问题。对于 shrinkToFit===false的情况，还需要resizewin进行进一步修正。
			// 原来对 bug 142的修正被废除。

			resizeWin:function(funcno,left,top,width,height){
				var bodyH=height-$.grid.fn.calcGridOtherHeight(funcno);	
				var gridDef = $.grid.list[funcno];

				$("#grid"+funcno).setGridHeight(bodyH);
				$("#grid"+funcno).setGridWidth(width);
				
				var $grid_div = $("#div_grid" + funcno);  // BUG 387补充修改。
				$grid_div.width(width).height(bodyH);

				var $target = $("#"+ $.Q.getChartPanelID(funcno));
				if ($target)
				  $target.css("height", $target.parent().height() - 26);

				// 有纵向滚动条，则要修正head的宽度：使之和数据部分右侧对齐。
				if ($("#grid"+funcno).height() > $("#grid"+funcno).parent().parent().height()) {
					var $gridHeadBand = $("#grid"+funcno).parent().parent().siblings().filter(".ui-jqgrid-hdiv");
					var $gridBodyDiv = $("#grid"+funcno).parent().parent();
					if ($gridHeadBand.width() > $gridBodyDiv.width() - 15) {
						$gridHeadBand.width($gridBodyDiv.width() - 15); 
					}
				}
			},
			
			resizeChart: function(funcno,left,top,width,height) {
				var $target = $("#"+ $.Q.getChartPanelID(funcno));
				if ($target) {
					$target.css("height", height).css("width", width);
				}
			},

			adjustHeight:function(funcno,newH){
				var girdBodyH=newH-$.grid.fn.calcGridOtherHeight(funcno);
				$("#grid"+funcno).setGridHeight(girdBodyH);

				var winno=$.page.idFunc.funcno2winno(funcno);
				$("#body_win"+winno ).css("height",newH);
			},
			loadMultiRows:function(funcno){
				var gridDef = $.grid.list[funcno];
				var colidx = -1;
				// 先看列定义中是否有rowcheck，有的话按msx的逻辑走，否则按原有逻辑走  // 未列入bugzilla，2013-10-30 by wyj
				for(var i=0;i<gridDef.colModel.length;i++){
					var coldef;
					coldef = gridDef.colModel[i];
					if (coldef.formatter=='rowcheck'){  // 支持列内勾选。但是同一行只支持一个可勾选列。以第一个设为rowcheck的列为准。
						colidx=this.fn.getGridColID(gridDef,i);
						break;
					}
				}
				if (colidx>=0){//需要进行列内勾选
					var rowid,cellData;
					$("#grid"+funcno+" tr.jqgrow").each(function(index,value){
						rowid=$(this).attr("id");
						cellData=$("#grid"+funcno).jqGrid('getCell',rowid,colidx);
						if (cellData!=0)
							$("#grid" + gridDef.funcno).jqGrid('setSelection',rowid,true);
					});
				}
				else {
					// 如果有选择，则选择，否则清空选择。
					// if  funcno-MULTICOUNT >= 1 
					// MULTICOLNAMES 逗号分隔，对grid每行，取出值。如果在MULTIROWS中，则check 
					var multiColNamesStr = $.UC.userData[funcno + "-MULTICOLNAMES"];
					if (typeof(multiColNamesStr) != "undefined") {
						var multiRowsStr = $.UC.userData[ funcno + "-MULTIROWS"];
						var multiColNames = multiColNamesStr.split(",");
						$("#grid"+funcno+" tr.jqgrow").each(function(index,value){
							var rowid=$(this).attr("id");
							var cellData = new Array();
							for (var i = 0; i < multiColNames.length; i ++) {
								cellData[i] = $("#grid"+funcno).jqGrid('getCell',rowid,multiColNames[i]);
							}
							var cellDataStr = cellData.join("&"); // 值用 & 连接
							if (cellDataStr != "") {
								if (multiRowsStr.search(cellDataStr) >= 0) 
									$("#grid" + funcno).jqGrid('setSelection',rowid,false);
							}
						});
						
					}
				}
				
			},
			colFuncs:{
				led:function(gridDef,iCol){
					var iColIdx=$.grid.fn.getGridColID(gridDef,iCol);
					$("#grid"+gridDef.funcno+" tr.jqgrow").find("td:eq("+iColIdx+")").each(function(index,value){
						$(this)[0].innerHTML="<img src=img/LED_"+$(this)[0].innerHTML+".gif />";
					});
				},
				procbar1:function(gridDef,iCol){
					var colMapIdx=-1;
					for(var i=0;i<gridDef.DispRuleMap.length;i++){
						if (gridDef.DispRuleMap[i].colIdx==iCol){
							colMapIdx=i;
							break;
						}
					}

					if (colMapIdx==-1||gridDef.DispRuleMap[colMapIdx].dispType!="PB1")
						return;
					var colorMap=gridDef.DispRuleMap[colMapIdx].colorMap;
					var iColIdx=$.grid.fn.getGridColID(gridDef,iCol);

					var idx=0;
					var colorArray=new Array();
					for(var key in colorMap){
						colorArray[idx]={
								"val":key,
								"color":colorMap[key]
						};
						idx+=1;
					}
					colorArray.sort(function(a,b){
						return a.val-b.val;
					});

					if (colorArray.length>0){
						var val,color;
						$("#grid"+gridDef.funcno+" tr.jqgrow").find("td:eq("+iColIdx+")").each(function(index,value){
							val=$(this)[0].innerHTML;
							if (val>=0){
								//找到对应的颜色
								color=colorArray[0].color;
								for(var i=0;i<colorArray.length;i++){
									if (val*1<colorArray[i].val*1){
										color=colorArray[i].color;
										break;
									}
								}
								$(this)[0].innerHTML="<img src='img/processbar/PB_"+color+"_"+val+".png'>";
							}else
								$(this)[0].innerHTML="";
						});
					}
					colorArray.length = 0;
				},
				procbar2:function(gridDef,iCol){
					var iColIdx=$.grid.fn.getGridColID(gridDef,iCol);
					var perc;
					$("#grid"+gridDef.funcno+" tr.jqgrow").find("td:eq("+iColIdx+")").each(function(index,value){
						perc=parseInt($(this)[0].innerHTML);
						$(this)[0].innerHTML="";
						$(this).progressbar({
							value:perc
						});
					});
				}
			},
			fn:{ 
				//将选择的行数据保存到上下文中
				getDataToContext:function(funcno,rowid, status){

					var rowdata = $("#grid"+funcno).jqGrid('getRowData',rowid);
					var colNames = "";
					$.each(rowdata,function(i){
						var val = rowdata[i];
						if(val.match(/<INPUT\s.*\/?>/)){
							val = $(val).val();
						}
						if(escape(val)=='%A0')
							val ='';
						$.userContext.userData[(funcno + "-" + i).toUpperCase()] = val;
						colNames += i + ",";
					});
					$.userContext.userData[(funcno + "-singleColNames").toUpperCase()] = colNames;
				},

				editRow:function(funcno,rowid,editCond){
					var grid_id = "grid"+funcno;
					if (($.grid.onEdit[funcno] != "") && ($.grid.onEdit[funcno] != rowid)) {
						var oldRowid = $.grid.onEdit[funcno];
						if ($("#" + oldRowid + ">td>input").length > 0) {
							if ($($("#" + oldRowid + ">td>input")[0]).attr('title') != $($("#" + oldRowid + ">td>input")[0]).text()) {
								//模拟按下回车就是保存
								var e = $.Event("keydown");//模拟一个键盘事件 
								e.keyCode = 13;//keyCode=13是回车
								$($("#" + oldRowid + ">td>input")[0]).trigger(e);
							}
							else {
								$("#"+grid_id).jqGrid('restoreRow', $.grid.onEdit[funcno]);
							}
						} 
					}
					$.grid.fn.getDataToContext(funcno,rowid);

					if(!condTester.ifCondition($.userContext.parser1(editCond))){
						// $("#grid"+funcno+">tbody>tr:[id="+rowid+"]>td").addClass("ui-state-active");  // bug 258
						return;
					}
					if ($.grid.onEdit[funcno] != rowid) {
						$.grid.onEdit[funcno] = rowid;
						$("#"+grid_id).jqGrid('editRow',
								rowid,
								true,  // 这个必须是true，使得grid用回车表示确定，esc表示取消。
								function(rowid){
						},
						function(rowid){
							//succEditfunc
						},
						"clientArray",
						{
							//extraparam
						},
						function(rowid){
							var gridDef = $.grid.list[funcno];

							var $inlineInputs = $("#" + rowid + ">td.edittableBG");
							$.each($inlineInputs, function(i,n) {  // 对内嵌input值做trim  bug 285
								var trimedText = $.trim($(n).text());
								$(n).text(trimedText);
								$(n).attr("title", trimedText);
							});

							$.grid.fn.getDataToContext(funcno,rowid);
							if(gridDef.multiselect){
								$.grid.fn.getMultiRowsToContext(gridDef.funcno,gridDef.multifields);
							}

							$.grid.onEdit[funcno] = "";  
							$.grid.lastEdited[funcno] = rowid;

							var cmd = $.page.btn.generateCmd( gridDef.update_check, [gridDef.update_proc] );
							$.page.btn.call_proc(cmd,function(data){
								var $grow = $("#grid"+funcno+">tbody>tr [id="+rowid+"]");
								if(!data.match(/^success/)){
									$grow.addClass("errRow");
									$grow.find(">td").css("color","red");
									data = data.split('@')[0];
									$.msgbox.show("err",data);
									$("#grid"+funcno).trigger('reloadGrid');
								}else{
									$grow.removeClass("errRow");
									$grow.find(">td").css("color","green");	
									if(gridDef.reload_after_sp)//执行存储过程后执行重载grid
									{
										$("#grid"+funcno).trigger('reloadGrid');
									}
								}
							});
							// aftersavefunc
						},
						function(rowid){
							//errorfunc
						},
						function(rowid){
							//afterrestorefunc
							$.grid.onEdit[funcno] = "";
							$.grid.lastEdited[funcno] = rowid;
						}
						);
					}
					
					//开始增加事件，用来处理blur事件 
					//$("#"+rowid+" :text").blur(
//					$("#"+rowid + ">td>input").blur(
//							function(){
//								if ($.grid.onEdit[funcno] != rowid) {
//									//模拟回车按下
//									var e = $.Event("keydown");//模拟一个键盘事件 
//									e.keyCode = 13;//keyCode=13是回车
//									$(this).trigger(e);//模拟按下回车就是保存
//								}
//							}
//					);
				},

				delRow:function(funcno,rowid){
					$.grid.fn.getDataToContext(funcno,rowid);
					$.msgbox.show("conf","确认要删除吗?",function(){
						var gridDef = $.grid.list[funcno];
						var cmd = $.page.btn.generateCmd( gridDef.delete_check, [gridDef.delete_proc] );
						$.page.btn.call_proc( cmd,function( msg ){
							if(msg.match("success")){
								$("#grid"+funcno).jqGrid('delRowData',rowid);
							}
						});
					});
				},

				addRow:function(funcno){
					var gridDef = $.grid.list[funcno];
					var cmd = $.page.btn.generateCmd( gridDef.insert_check, [gridDef.insert_proc] );
					$.page.btn.call_proc( cmd,function( msg ){
						if(msg.match("success")){
							$("#grid"+funcno).trigger("reloadGrid");
						}
					});
				},
				getMultiRowsToContext:function(funcno, fields){ // 各个fields用 , 隔开
					var rowids = $("#grid"+funcno).jqGrid('getGridParam','selarrrow');// 这里只能获取当前页的选中情况。
					$.grid.lastRows[funcno] = (rowids.length > 0? rowids[rowids.length-1] : undefined);  //bug 239

//					var multiRows = $.grid.fn.getRowsData(funcno,rowids,fields); // 取出的记录形如 1&123&234&aaa;2&234&345&bbb
//					var multiRowsCount = rowids.length;
//					$.userContext.setData(funcno+"-multiRows",multiRows);
//					$.userContext.setData(funcno+"-multiCount",multiRowsCount);
//					$.userContext.setData(funcno+"-multiColNames",fields);

					//  下面这段支持多页勾选。 BUG 260
					var currentRows = [];
					if ($.UC.bindData("#" + funcno+"-multiRows#")) 
						currentRows = $.UC.bindData("#" + funcno+"-multiRows#").split(';');
					var rowsStr = $.grid.fn.getRowsDataEx(funcno, rowids, fields); // 对于当前页的选中的行，同时 找到选的和没选的。
					var selRows = rowsStr.selected.split(';');
					var nonSelRows = rowsStr.deselected.split(';');
					$.each(selRows, function(i){  // 对选中的行，如果不在multiRows中，则加入。
						if (!(currentRows.contains(selRows[i])))
							currentRows.push(selRows[i]);
					});
					$.each(nonSelRows, function(i) {  // 对未选中的行，如果在multiRows中，则删除。
						var idx = currentRows.indexOf(nonSelRows[i]);
						if (idx >= 0)
							currentRows.splice(idx, 1);
					});
					$.userContext.setData(funcno+"-multiRows", currentRows.join(';'));
					$.userContext.setData(funcno+"-multiCount",currentRows.length);
					$.userContext.setData(funcno+"-multiColNames",fields);
				},

				getRowsData:function(funcno,rowids,fields){// 取出的记录形如 1&123&234&aaa;2&234&345&bbb
					var rowsDataStr = "";
					var $grid = $("#grid"+funcno);
					var flds = fields.split(",");
					for(var i=0; i<rowids.length; i++){
						var rowdata = $grid.jqGrid("getRowData",rowids[i]);
						rowsDataStr += $.grid.fn.getFieldsData(rowdata,flds) + (i<rowids.length-1?";":"");
					}
					return rowsDataStr;
				},
				
				getRowsDataEx: function(funcno, rowids,fields){  // 获取已选的行，也获取未选的行。为多页勾选服务。 BUG 260
					// 返回一个对象。selected表示选中的行数据；deselected表示未选中的行数据。都是形如 1&123&234&aaa;2&234&345&bbb
					var selRowsDataStr = "";
					var noSelRowsDataStr = "";
					var $grid = $("#grid"+funcno);
					var rows = $grid.find("tr.jqgrow");
					var flds = fields.split(",");
					for(var i = 0; i < rows.length; i++) { // 要对所有的行进行检查，如果选了，加进去，如果没选删掉。
						var rowdata = $grid.jqGrid("getRowData",rows[i].id);
						if (rowids.contains(rows[i].id)) {
							selRowsDataStr += $.grid.fn.getFieldsData(rowdata,flds) + ";";
						}
						else {
							noSelRowsDataStr += $.grid.fn.getFieldsData(rowdata,flds) + ";";
						}
					}
					selRowsDataStr = selRowsDataStr.substring(0, selRowsDataStr.length-1);
					noSelRowsDataStr = noSelRowsDataStr.substring(0, noSelRowsDataStr.length-1);
					
					return {selected: selRowsDataStr, deselected: noSelRowsDataStr};
					
				},

				getFieldsData:function(rowdata,fields){
					var rowdataStr = "";
					for(var i=0;i<fields.length;i++){
						var sss = rowdata[fields[i]];
						if (typeof(sss) == "undefined") 
							sss = "";
						if(sss.match(/<INPUT.*>/)){
							sss = $(sss).val() ;
						}
						rowdataStr += sss+(i<fields.length-1?"&":"");
					}
					return rowdataStr;
				},

				openSortDialog:function(funcno){
					$("#grid"+funcno+"_sortDlg").show();
				},
				closeSortDialog:function(funcno){
					$("#grid"+funcno+"_sortDlg").hide();
				},
				sortGrid:function(funcno){
					var ordStr = $.grid.fn.getOrderString(funcno);
					if(ordStr==""){
						$.tip("注意：请从左边框内选择字段拖拽到右边框，然后点击'排序'按钮","grid"+funcno+"_sortDlg");
						return ;
					}
					$("#grid"+funcno).jqGrid("appendPostData",{
						ordStr:ordStr
					});
					$("#grid"+funcno).trigger('reloadGrid');
				},
				getOrderString:function(funcno){
					var sortFlds = $("#grid"+funcno+"sortable2>li>div");
					var orderString = "";
					$.each(sortFlds,function(i){
						orderString += $(sortFlds[i]).attr("name")+" "+ $(sortFlds[i]).attr("order")+",";
					});

					orderString = orderString.substring(0, orderString.length-1);
					return orderString;
				},	

				//计算表格的高度:bar和title除外
				calcGridHeightByRows:function(funcno){
					var gridDef = $.grid.list[funcno];
					var grid_id = "grid"+funcno;
					var recCnt=$("#"+grid_id).getGridParam( "reccount" );
					var calcRows=Math.min(gridDef.max_rowNum,recCnt);
					var rowH=$("#"+grid_id+" tr.jqgrow td").height()+1;//+1是加上分隔线的高度

					var winno=$.page.idFunc.funcno2winno(funcno);
					var winDefH = 0;   // BUG 142 相关修改（在gridComplete中用到）避免winno为空的时候出错。在form的func型弹出框中用得到。此时funcno仅是一个模板。
					if (winno) {
						var winDef=$.page.idFunc.getWinDefbyWinno(winno);
						winDefH=winDef.height-$.grid.fn.calcGridOtherHeight(funcno)-2; 
					}
					return Math.max(calcRows*rowH+10,winDefH);
				},
				calcGridOtherHeight:function(funcno){//计算表格其他部分的高度
					var head_height=$.getElementHeight("t_grid"+funcno,0);//表抬头的高度
					var pager_height=$.getElementHeight("pager"+funcno,0);//页码条的高度
					var lab_height=$("#div_grid"+funcno+" .ui-jqgrid-labels").height();//列表的标题的高度
					var sp_height=$.getElementHeight("grid"+funcno+"_sp", 0); // 列表的搜索面板高度 。如果没有则为null。
					return head_height+pager_height+lab_height+sp_height;

				},
				createColLinks:function(gridDef){
					var gridid="grid"+gridDef.funcno;
					var $tr=$("#"+gridid+" tr.jqgrow"),$td;
					var btn,colBtnDef=gridDef.grid_btns;
					var winno=0;
					var btnDef,colIdx;
					//for(var i=0;i<=gridDef.colModel.length-1;i++){
					$.each(gridDef.colModel, function(i){
						if (gridDef.colModel[i].attachbtn!=undefined &&
								gridDef.colModel[i].attachbtn.length>0){  // 相关按钮
							var attachBtn=gridDef.colModel[i].attachbtn[0];
							if (winno==0)
								winno=$.page.idFunc.funcno2winno(gridDef.funcno);
							colIdx=$.grid.fn.getGridColID(gridDef,i);
							$tr.find("td:eq("+colIdx+")").each(function(index,value){
								$td=$(this);
								$td.css({
									'text-decoration':'underline',
									'color':'#0287CA',
									'cursor':'pointer'
								})
								.click(function(){
									gridDef.trigByRowBtn=true;//按钮
									gridDef.onSelectRow(gridDef.funcno+"_"+index);
									$.button.btnClickFunc(attachBtn,winno);
								});
							});
						}
						else if (gridDef.colModel[i].hqFuncno > 0) {  // 优先绑定按钮，如果没有绑定按钮，才处理超级查询。
							// 是超链接
							colIdx=$.grid.fn.getGridColID(gridDef,i);
							$tr.find("td:eq("+colIdx+")").each(function(index,value){
								$td=$(this);
								$td.css({
									'text-decoration':'underline',
									'color':'#0287CA',
									'cursor':'pointer'
								})
								.click(function(){
									gridDef.onSelectRow(gridDef.funcno+"_"+index);
									// 打开对话框 hyperquery
									var hyperparams = gridDef.colModel[i].hqParams.split("@"); // F@2804@#C-p2.id#
									// 目前只支持F
									$.F.openHyperQuery(gridDef.funcno,hyperparams[0],""/*flds[i].funcinmem*/,hyperparams[1],hyperparams[2]);
								});
							});

						}
					});
				},
				createColBtns:function(gridDef){  //  bug 279  grid行button的显示条件
					var gridid="grid"+gridDef.funcno;
					var $tr=$("#"+gridid+" tr.jqgrow");
					var btn,colBtnDef=gridDef.grid_btns;
					var winno=0;
					var colIdx,formatter,cellVal,dispBtns,createBtn;
					var btnShowConds={};
					var btnHideConds={};
					for(var i=0;i<=gridDef.colModel.length-1;i++){
						formatter=gridDef.colModel[i].formatter;
						if (formatter=="buttons"&&colBtnDef.length>0){
							// 解析条件colModel[i].dispexp。该条件是隐藏条件。即满足内部条件的相应按钮被隐藏
							// 格式：   按钮名称:条件表达式;按钮名称:条件表达式
							// 按钮名称不出现，标识该按钮总是创建。
							var hideConds = gridDef.colModel[i].dispexp.split(";");
							for(var j=0;j<hideConds.length;j++){  // 对每个有条件的按钮     按钮名称:条件表达式
								// 建立 隐藏条件 哈希表 btnHideConds[按钮名称]
								if (hideConds[j].trim()!=""){
									var btnCond = hideConds[j].trim().split(":");
									var rawCond = btnCond[1].trim();  // '[inf.state]' == '申报中' || '[inf.state]' == '审批中'
									// 后续真正创建按钮时，要替换成rowData
									btnHideConds[btnCond[0].trim()]=rawCond;
								}
							}
							
							if (winno==0)
								winno=$.page.idFunc.funcno2winno(gridDef.funcno);
							colIdx=this.getGridColID(gridDef,i);

							$tr.find("td:eq("+colIdx+")").each(function(index,value){
								var $td=$(value); // 拿到所有数据行的按钮这个单元格
								$td.empty();
								$td.attr("title","");								
								var rowid = $td.parent().attr("id");
								var rowdata = $("#" + gridid).jqGrid("getRowData", rowid);
								$.each(colBtnDef, function(k) {
								//for (var k = 0; k < colBtnDef.length; k ++) {
									var btnDef = colBtnDef[k];
									var createBtn = true; 
									if (btnHideConds[btnDef.caption]) {
										var rawCond = btnHideConds[btnDef.caption]; // "'[inf.state]' == '申报中' || '[inf.state]' == '审批中'"
										var condInstance = rawCond;  // 条件在本行上的示例
										var condVarNames = rawCond.match(/\[.*?\]/ig); // ["[inf.state]", "[inf.state]"]
										if (condVarNames && condVarNames.length > 0) {
											for (var m = 0; m < condVarNames.length; m ++) {
												var condVarNameBrk = condVarNames[m];   // "[inf.state]"
												var condVarName = condVarNameBrk.substr(1, condVarNameBrk.length -2);// "inf.state"
												if (typeof (rowdata[condVarName]) !== "undefined") {
													// 替换一处
													condInstance = condInstance.replace(condVarNameBrk, rowdata[condVarName] );
												} else {
													condInstance = condInstance.replace(condVarNameBrk, "" );
												}
											}
										}
										
										condInstance = condInstance.replace(/(!=)/g, "~=" );
										condInstance = $.UC.parser(condInstance);
										condInstance = condInstance.replace(/(~=)/g, "!=" );
										
										createBtn = !(eval(condInstance) || eval(condInstance) == "true" );
	
									}
									if (createBtn){
										//if (btnDef.btn_type.trim()=="pic"){
										if ($.trim(btnDef.btn_type) == "pic") {
											btnDef.width=16;
											btnDef.height=16;
											btnDef.top=5;
										}
										btn= $($.button.create(btnDef))
										.appendTo($td)
										.css("float","left")
										.css({
											"margin":"1px,1px auto",
											"margin-left":"2px"
										})
										.click(function(){
											gridDef.trigByRowBtn=true;//按钮 
											gridDef.onSelectRow(gridDef.funcno+"_"+index);
											$.button.btnClickFunc(btnDef,winno);
										});			
										$.button.addBtnOperations(btnDef,winno,btn);
									}
								});
								
							});
							break;   // 只支持一个buttons列。
						}		
					}
				},
				getGridColID:function(gridDef,srcIdx){
					if (gridDef.rownumbers)
						srcIdx+=1;
					if (gridDef.multiselect)
						srcIdx+=1;
					return srcIdx;
				}
			}
	};

})(jQuery);

