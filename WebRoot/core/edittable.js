/**
 * @author zh
 * @desc 可支持多行表单编辑控件
 */
;(function($){
	$.Z = $.edittable = {
			options:{
				tableParamURL:  $.global.functionDefinitionUrl+"?type=Z",
				dataBindingURL:"commonQuery_queryEditTable.action",
				BindingSqlURL:"common_getBindingData.action",
				operations:{}
			},
			validators:{},//缓存格式验证器
			operations:{},//缓存每行中的操作栏
			checkedRows:{},//缓存勾选中的行id
			rules:{},//缓存验证器规则
			list:{},
			runInstance: function( funcNo,options ){
				var op = $.extend({
					target:		 "main",
					allComplete: function(){}
					},options);
				if($.edittable.list[funcNo] == null){
					$.ajax({
						type: "POST",
						url:  $.edittable.options.tableParamURL,
						data: {funcNo: funcNo},  // 注意：这里的形参funcNo(第一个)，N是大写的。对应FunctionDefinitionAction.java的loadDefinition
						dataType: "json",
						success:  function( data,textStatus ){
							var tableDef = data[0];
							tableDef.target = op.target;
							tableDef.complete = op.complete;
							tableDef.allComplete = op.allComplete;
							//此处因为page.js是按照funcno识别的，所以生成的是按照funcno来的，而edittable里面是funcNo，故需增加转换
							//但是老版本的edittable却是funcNo
							if(tableDef.funcno){
								tableDef.funcNo = tableDef.funcno;
							}
							$.appendScript(funcNo,tableDef.script);
							$.edittable.list[funcNo] = tableDef;
							$.edittable.createNew( tableDef,op.target);
							tableDef.dataComp($.Z.idFuncs.getGridId(funcNo));
							$.Z.getSelTableData(funcNo);
						},
						error:function(e){
							$.msgbox.show("err","请求显示的功能"+funcNo+"不存在或存在定义错误：<br>"+e.responseText);
						}
					});
				}else{
					var tableDef = $.edittable.list[funcNo];
					tableDef.target = op.target;
					tableDef.complete = op.complete;
					tableDef.allComplete = op.allComplete;
					$.appendScript(funcNo,tableDef.script);
					//此处因为page.js是按照funcno识别的，所以生成的是按照funcno来的，而edittable里面是funcNo，故需增加转换
					//但是老版本的edittable却是funcNo
					if(tableDef.funcno){
						tableDef.funcNo = tableDef.funcno;
					}
					
					//var tableDef = $.edittable.list[funcNo];
					$.edittable.createNew(tableDef,options.target);
					tableDef.dataComp($.Z.idFuncs.getGridId(funcNo));
					$.Z.getSelTableData(funcNo);
					//$.userContext.setData(funcNo+"-alltabledata",$.Z.getTableData(funcNo));
				}
				return this;
			},
			refresh:function(funcNo,filter){
				var tableDef = $.Z.list[funcNo];
				$.Z.createNew( tableDef, tableDef.target );
				$.userContext.setData(funcNo+"-selrownums",0);//勾选中的行数
				$.userContext.setData(funcNo+"-currSelRowid","");
				tableDef.dataComp($.Z.idFuncs.getGridId(funcNo));
			},
            clear:function(funcNo){
				$.userContext.setData(funcNo+"-alltabledata","");
				$.userContext.setData(funcNo+"-currselrowid","");
				$.userContext.setData(funcNo+"-rownums","");
				$.userContext.setData(funcNo+"-selrownums","");
				$.userContext.setData(funcNo+"-seltabledata","");
			},
			resizeWin:function(funcno,left,top,width,height){
				$.Z.adjustGridSize(funcno);
			},
			idFuncs: {
				getGridId: function(funcno) {
					return "edittable"+funcno;
				},
				getPagerId: function(funcno) {
					return "pager_" + $.Z.idFuncs.getGridId(funcno);
				},
				getHeaderId: function (funcno) {
					return "h_"  + $.Z.idFuncs.getGridId(funcno);
				},
				getToolbarId: function(funcno) {
					return "t_" + $.Z.idFuncs.getGridId(funcno);
				},
				getDivId: function(funcno) {
					return "div_" + $.Z.idFuncs.getGridId(funcno);
				}
			},
			calcZGridOtherHeight:function(funcno){//计算表格其他部分的高度
				var grid_id = $.Z.idFuncs.getGridId(funcno);
				var pagerId = $.Z.idFuncs.getPagerId(funcno);
				var head_height=$.getElementHeight($.Z.idFuncs.getHeaderId(funcno),0);//表抬头的高度
				var tb_height = $.getElementHeight($.Z.idFuncs.getToolbarId(funcno),0);
				var pager_height=$.getElementHeight(pagerId,0);//页码条的高度
				return head_height+pager_height+head_height+5;

			},
			createNew: function(tableDef,target){
				var funcNo = tableDef.funcNo;
				var table_id = $.Z.idFuncs.getGridId(funcNo);
				var table_divId = $.Z.idFuncs.getDivId(funcNo);
                tableDef.colWidth = {};
				
                var w = tableDef.width==0? "100%" : tableDef.width+ 'px';
				//w="100%";
				var h = tableDef.height==0? "100%" : tableDef.height  + 'px';
				$("#"+target).empty().html("<form id='"+table_divId+
				  "' style='float:left;width:" + w + ";height:" + h + ";overflow:auto'>" +
				  "</form>");
			
				//配置工具栏
				$.edittable.setToolbar(tableDef);
				//生成内容栏
				$.edittable.generateContent(tableDef);
				
				if (tableDef.height > 0) {  // BUG 426 新增代码，但是一般好像没啥用。
					var zpagerid = $.Z.idFuncs.getPagerId(funcNo);
					var zheaderid = $.Z.idFuncs.getHeaderId(funcNo);
					var ztoolbarid = $.Z.idFuncs.getToolbarId(funcNo);
					$("#" + table_divId).height(tableDef.height - $.getCSSNum($("#"+zpagerid), "height")
							- $.getCSSNum($("#"+zheaderid), "height")
							- $.getCSSNum($("#"+ztoolbarid), "height"));
				}
				//执行datacomplete
			 	if(typeof(tableDef.complete) == "function"){
                                    tableDef.complete(tableDef.funcNo);
                                }
			},
			sqlComplete :function(funcNo,$table){
				var tableDef = $.Z.list[funcNo];
				var rules = {};
				//生成options
				for(var j=0;j<tableDef.columns.length;j++){
					var column = tableDef.columns[j];
					var col = j;
					if(column.bindData!=""&&column.bindData.substring(0,1)=="@"){//表示此列为select类型，绑定了sql
						var sid = funcNo+"_"+tableDef.columns[j].fieldname+"_bindData";
						if($.Z.list[sid]==null){
							$.ajax({
								type:"POST",
								url:$.edittable.options.BindingSqlURL,
								data:{sql:$.userContext.parser(column.bindData.substring(1)),bid:col},
								dataType:"text",
								success:function(data,textStatus){
									var data1 = data.split("^")[0];
									var data2 = data.split("^")[1];
									sid = funcNo+"_"+tableDef.columns[data1].fieldname+"_bindData";
									$.Z.list[sid] = data2;  
									$.each($table.find("tr"),function(i,n){
										var id = $(n).attr("id")+"_"+data1;
										var $select = $("#"+id);
										$select.append($.Z.getOptions(data));
										var key = $select.attr("selData");
										var index = $.Z.getIndex(data,key);
										$select.attr("selectedIndex",index);
									});
									$.Z.getTableData(funcNo); //内部已经setdata了。$.userContext.setData(funcNo+"-alltabledata", ，，，);
								}	
							});
						}else{
							var data = $.Z.list[sid];
							$.each($table.find("tr"),function(i,n){
								var id = $(n).attr("id")+"_"+col;
								var $select = $("#"+id);
								$select.append($.Z.getOptions(data));
								var key = $select.attr("selData");
								var index = $.Z.getIndex(data,key);
								$select.attr("selectedIndex",index);
							});
						}
					}
					var trSize = $table.find("tr").length;
					$.each($table.find("tr"),function(i,n){
						if(!column.hidden){
							var name = funcNo+"et_"+i+"_"+col;
							var name1 = funcNo+"et_"+(i+trSize)+"_"+col;
							var rule = {};
							if(!column.nullable){
								rule["required"] = true;
							}
							if( column.maxlen && (column.maxlen != "") )
								rule["maxlength"] = parseFloat(column.maxlen);
							else if( column.maxval && (column.maxval!="") )
								rule["max"] = parseFloat(column.maxval);
							
							if( column.minlen && (column.minlen!="") )
								rule["minlength"] = parseInt(column.minlen);
							else if( (column.minval!=null) && (column.minval!="") )
								rule["min"] = parseInt(column.minval);
							
							if( column.format && ( column.format!="")  )
								if( column.format.charAt(0) == "@")
									rule["remote"] = "common_validateData.action?funcName="+ column.format.substring(1);
								else  
									rule[column.format] = true;
							rules[name]=rule;
							rules[name1]=rule;
						}
					});
					
				}
				//生成验证
				var table_id = $.Z.idFuncs.getGridId(funcNo);
				var table_divId = $.Z.idFuncs.getDivId(funcNo);

				
				$.Z.rules[funcNo]=rules;
				var validator = $("#"+table_divId).validate({rules:rules});
				$.Z.validators[funcNo] = validator;
				
			
				//$.userContext.setData(funcNo+"-rownums",$table.find("tr").length);//当前页面中的行数
				var num = 0;
	   			$.each($table.find("tr"),function(i,n){
	   				if(this.style.display!="none") {
	   					num++;
	   				}
	   			});
	   			$.userContext.setData(funcNo+"-rownums",num);
	   			
				
	   			$.Z.getTableData(funcNo); //$.userContext.setData(funcNo+"-alltabledata",$.Z.getTableData(funcNo));
				tableDef.allComplete();
			},
			check :function(funcNo){
				/*
				 * 这部分是验证表的勾选行的内容
				 * 
				 */
				var currRows = $.userContext.bindData("#"+funcNo+"-currSelRowid#");//勾选中的行数 //$.Z.checkedRows[funcNo];
				if(currRows==""){
					alert("请勾选记录!");
					return false;
				}
				var rowIds = currRows.split(";"); 
				for(var i = 0; i<rowIds.length && rowIds[i]; i++){
					if(!$.Z.validateRow(funcNo,rowIds[i]))
						return false;
				}
				return true;
			},
			getTableData: function( funcNo){
				var tableDef = $.Z.list[funcNo];
				var data_form = tableDef.data_form;
				var data = "";
				if(data_form=="str"){
					data = $.Z.getDataByStr(tableDef,"whole");
				}else if(data_form=="xml"){
					data = $.Z.getDataByXml(tableDef,"whole");
				}
				$.userContext.setData(funcNo+"-alltabledata",data);
				return data;
			},
			getSelTableData: function(funcNo){
				var tableDef = $.Z.list[funcNo];
				var data_form = tableDef.data_form;
				var data = "";
				if(data_form=="str"){
					data = $.Z.getDataByStr(tableDef,"sel");
				}else if(data_form=="xml"){
					data = $.Z.getDataByXml(tableDef,"sel");
				}else
					data = $.Z.getDataByStr(tableDef,"sel");
				$.userContext.setData(funcNo+"-seltabledata",data);
				return data;
			},
		
			getSetValColNums:function(funcNo,columns){
				var count=0;
				for(var i=0;i<columns.length;i++){
					if(columns[i].setval)
						count=count+1;
				}
				return count;
			},
			getDataByStr: function(tableDef,scope){
				
				var data = "";
				var funcNo = tableDef.funcNo;
				var $table = $("#" + $.Z.idFuncs.getGridId(funcNo));
		   		var col_nums = $.Z.getSetValColNums(funcNo,tableDef.columns);//计算设置列的个数
		   		var count = 0;//计算目前设置列的个数
		   		var num = 0 ;//记录勾选的行数
		   		var id = "";//记录勾选的行的id
		   		var tmpdata = "";//临时数据
		   		var inputtype = "";//控件类型
		   		// TODO: 下面这个IF代码重复太多，可以重构。来自BUG 340的修改
		   		if(scope=="whole"){
		   			$.each($table.find("tr"),function(i,n){
		   				if(this.style.display!="none") {
		   					for(var j=0;j<tableDef.columns.length;j++){
		   						if($('#'+funcNo+'et_'+i+'_'+j).attr("setval")=="true"){
		   							if($('#'+funcNo+'et_'+i+'_'+j).length>0){
		   								count = count + 1;
		   								if(count!=col_nums){
		   									inputtype = $('#'+funcNo+'et_'+i+'_'+j).attr("type");
		   									if (inputtype == 'text'){
		   										tmpdata = $('#'+funcNo+'et_'+i+'_'+j).val();
		   										if (tmpdata != null){
		   											data = data+tmpdata.replace(/(\s*$)/g,"")+$.global.DATA_SPLIT_STR;
		   										} else {
		   											data = data+""+$.global.DATA_SPLIT_STR;
		   										}
		   									} else {
		   										data = data+$('#'+funcNo+'et_'+i+'_'+j).val()+$.global.DATA_SPLIT_STR;
		   									}
		   								}else{
		   									inputtype = $('#'+funcNo+'et_'+i+'_'+j).attr("type");
		   									if (inputtype == 'text'){
		   										tmpdata = $('#'+funcNo+'et_'+i+'_'+j).val();
		   										if (tmpdata != null){
		   											data = data+tmpdata.replace(/(\s*$)/g,"")+$.global.DATA_SPLIT_ROW;
		   										} else {
		   											data = data+""+$.global.DATA_SPLIT_ROW;
		   										}
		   									} else {
		   										data = data+$('#'+funcNo+'et_'+i+'_'+j).val()+$.global.DATA_SPLIT_ROW;
		   									}
		   									count = 0;
		   								}
		   							}
		   						}
		   					}
		   				}
		   			});
		   		}else{
		   			$.each($table.find("tr"),function(i,n){
		   				if((this.style.display!="none")&&($("#"+funcNo+"_"+i+"_checkbox").attr("checked"))){
		   					num++;
	   						id = id + i +";";
		   					for(var j=0;j<tableDef.columns.length;j++){  // BUG 340 这里j上限原来写成了col_nums。导致只会查前n列。
			   					if($('#'+funcNo+'et_'+i+'_'+j).attr("setval")=="true"){
			   						if($('#'+funcNo+'et_'+i+'_'+j).length>0){
			   							count = count + 1;
				   						if(count!=col_nums){
				   							inputtype = $('#'+funcNo+'et_'+i+'_'+j).attr("type");
				   							if (inputtype == 'text'){
					   							tmpdata = $('#'+funcNo+'et_'+i+'_'+j).val();
					   							if (tmpdata!=null){
					   								data = data+tmpdata.replace(/(\s*$)/g,"")+$.global.DATA_SPLIT_STR;
				   								} else {
				   									data = data+""+$.global.DATA_SPLIT_STR;
					   							}
					   						} else {
					   							data = data+$('#'+funcNo+'et_'+i+'_'+j).val()+$.global.DATA_SPLIT_STR;
					   						}
					   					}else{
				   							inputtype = $('#'+funcNo+'et_'+i+'_'+j).attr("type");
				   							if (inputtype == 'text'){
						   						tmpdata = $('#'+funcNo+'et_'+i+'_'+j).val();
						   						if (tmpdata!=null){
						   							data = data+tmpdata.replace(/(\s*$)/g,"")+$.global.DATA_SPLIT_ROW;
						   						} else {
						   							data = data+""+$.global.DATA_SPLIT_ROW;
						   						}
						   					} else {
						   						data = data+$('#'+funcNo+'et_'+i+'_'+j).val()+$.global.DATA_SPLIT_ROW;
						   					}
					   						count = 0;
					   					}
				   					}
			   					}
			   				}
		   				}
		   			});
		   			$.userContext.setData(funcNo+"-selrownums",num);//勾选中的行数
		   			$.userContext.setData(funcNo+"-currSelRowid",id);
		   		}
				//增加获取行数的
				var rownumcount = 0;
	   			$.each($table.find("tr"),function(i,n){
	   				if(this.style.display!="none") {
	   					rownumcount++;
	   				}
	   			});
	   			$.userContext.setData(funcNo+"-rownums",rownumcount);
				
				return data;
			},
			getDataByXml: function(tableDef,scope){
		   		var funcNo = tableDef.funcNo;
				var data = '<?xml version="1.0"?><Rows>';
		   		var col_nums = $.Z.getSetValColNums(funcNo,tableDef.columns);
		   		var count = 0;//计算目前设置列的个数
		   	
				var $table = $("#" + $.Z.idFuncs.getGridId(funcNo));
		   		
				var num = 0 ;//记录勾选的行数
		   		var id = "";//记录勾选的行的id
		   		// TODO: 下面这个IF代码重复太多，可以重构。来自BUG 340的修改
		   		if(scope=='whole'){
		   			$.each($table.find("tr"),function(i,n){
		   				if(this.style.display!="none") {
		   					for(var j=0;j<tableDef.columns.length;j++){
		   						if($('#'+funcNo+'et_'+i+'_'+j).attr("setval")=="true"){
		   							if($('#'+funcNo+'et_'+i+'_'+j).length>0){
		   								var colName = $('#'+funcNo+'et_'+i+'_'+j).attr("columnName");
		   								if(count==0)
		   									data = data+"<Row>";
		   								count = count + 1;
		   								data = data+"<"+colName+">"+$('#'+funcNo+'et_'+i+'_'+j).val()+"</"+colName+">";
		   								if(count==col_nums){
		   									data = data+"</Row>";
		   									count = 0;
		   								}
		   							}
		   						}
		   					}
		   				}
		   			});
		   			
		   		}else{
		   			$.each($table.find("tr"),function(i,n){
		   				if((this.style.display!="none")&&($("#"+funcNo+"_"+i+"_checkbox").attr("checked"))){
		   					num++;
	   						id = id + i +";";
		   					for(var j=0;j<tableDef.columns.length;j++){  // BUG 340 这里j上限原来写成了col_nums。导致只会查前n列。
			   					if($('#'+funcNo+'et_'+i+'_'+j).attr("setval")=="true"){
			   						if($('#'+funcNo+'et_'+i+'_'+j).length>0){
			   							var colName = $('#'+funcNo+'et_'+i+'_'+j).attr("columnName");
				   						if(count==0)
				   							data = data+"<Row>";
				   						count = count + 1;
				   						data = data+"<"+colName+">"+$('#'+funcNo+'et_'+i+'_'+j).val()+"</"+colName+">";
				   						if(count==col_nums){
				   							data = data+"</Row>";
				   							count = 0;
				   						}
				   					}
			   					}
			   				}
		   				}
		   			});
		   			$.userContext.setData(funcNo+"-selrownums",num);//勾选中的行数
		   			$.userContext.setData(funcNo+"-currSelRowid",id);
		   		}
	   			data+="</Rows>";
				//增加获取行数的
//				$.userContext.setData(funcNo+"-rownums",$table.find("tr").length);
				var rownumcount = 0;
	   			$.each($table.find("tr"),function(i,n){
	   				if(this.style.display!="none") {
	   					rownumcount++;
	   				}
	   			});
	   			$.userContext.setData(funcNo+"-rownums",rownumcount);
				return data;
			},
			onCheckboxClick: function($obj,funcNo){
				 /*$.each($obj.parent().parent().find("td:gt(2)"),function(i,n){
					if(typeof($(n).children().attr("noReadOnly"))!="undefined"){
						if($(n).children().attr("noReadOnly")=="true"){
							$(n).children().attr("noReadOnly",false)
							.attr("readOnly",true)
							.attr("disabled",true)
							.attr("readOnly",true)
						}else{
							$(n).children().attr("noReadOnly",true)
							.attr("readOnly",false)
							.attr("disabled",false)
							.attr("readOnly",false)
						}
					}
				});*/
				$.Z.getSelTableData(funcNo);
				$.Z.getTableData(funcNo); //$.userContext.setData(funcNo+"-alltabledata",$.Z.getTableData(funcNo));
			},
			addOneRow: function(tableDef,$table,$operation,$obj){
				
				var size = $table.find("tr").length + 1;
				
				var $tr = $("<tr col_nums="+tableDef.columns.length+" state=1 funcNo="+tableDef.funcNo+" ></tr>");
				var funcNo = tableDef.funcNo;
				//添加勾选框 10px
// 隐藏checkbox by wyj 给姜晓燕的版本，临时去掉。以后可以把“是否要勾选”变为可定义的。
				if (tableDef.selectMode == "none") {
//					$tr.append("<td style='width:10px; display:none'><input style='align:center' id="+funcNo+"_"+(size-1)+"_checkbox type='checkbox' onclick='$.Z.onCheckboxClick($(this),"+funcNo+")'></td>");
					$tr.append("<td style='width:"+tableDef.colWidth[0]+"px; display:none'><input style='align:center' id="+funcNo+"_"+(size-1)+"_checkbox type='checkbox' onclick='$.Z.onCheckboxClick($(this),"+funcNo+")'></td>");
				                                  //^^^^^^^^^^^^^^^^^^^ BUG 385 内容的宽度按实际来算了，那头3列也要按实际的算。
				}
				else {
//					$tr.append("<td style='width:10px'><input style='align:center' id="+funcNo+"_"+(size-1)+"_checkbox type='checkbox' onclick='$.Z.onCheckboxClick($(this),"+funcNo+")'></td>");
					$tr.append("<td style='width:"+tableDef.colWidth[0]+"px'><input style='align:center' id="+funcNo+"_"+(size-1)+"_checkbox type='checkbox' onclick='$.Z.onCheckboxClick($(this),"+funcNo+")'></td>");
					                             //^^^^^^^^^^^^^^^^^^^ BUG 385 
				}
					
				var checkboxid = funcNo+"_"+(size-1)+"_checkbox";
				//添加操作栏
//				$tr.append($operation.clone(true));
				$tr.append($operation.clone(true).css("width", tableDef.colWidth[1]));
				                                     //^^^^^^^^^^^^^^^^^^^ BUG 385 
				
				//添加order栏
//				$tr.append("<td class='ui-state-default'  style='width:25px;'><span>"+(size)+"</span></td>");
				$tr.append("<td class='ui-state-default'  style='width:"+tableDef.colWidth[2]+"px;'><span>"+(size)+"</span></td>");
				                                                        //^^^^^^^^^^^^^^^^^^^ BUG 385 
				var rowReadOnly = false;

				for(var j=0;j<tableDef.columns.length;j++){
					if(tableDef.columns[j].fieldname.toUpperCase() == "READONLY"){
						rowReadOnly = true;
						break;
					}
				};
				var readonly = "n";

				var colidx = 0;
				for(var j=0;j<tableDef.columns.length;j++){
                    var col = j;
					var column = tableDef.columns[j];
					var cid = tableDef.funcNo+"et_"+(size-1)+"_"+j;
					var jscontent = column.jscontent;
				
					if(rowReadOnly)//业务表中的READONLY字段表示该记录(行)是否可编辑
						readonly = row["READONLY"].toLowerCase();
					else {
						if( column.editable)//控制该列可否编辑，如果有READONLY字段控制则不进行列编辑设置
				    		readonly = "n";
						else 
							readonly = "y";
					}
					
					if(!column.hidden){
						//var $td = $("<td></td>");
						//var $td = $("<td style='width:"+column.width+"px'></td>");
						var $td = $("<td style='width:"+tableDef.colWidth[colidx+3]+"px'></td>");
						
						//select
						if(column.edittype=="select"){
							
							var $select = $("<select "+jscontent+" columnName="+column.fieldname+" id="+cid+" name="+cid+" editable='"+ column.editable + "' setval="+column.setval+" style='width:97%;'></select>");
							if(readonly=="y")
								$select.attr("disabled",true);
							else
								$select.attr("noReadOnly",true);
							$td.append($select);
							$tr.append($td);
							
							var sid = tableDef.funcNo+"_"+tableDef.columns[j].fieldname+"_bindData";
							if(column.bindData.substring(0,1) == "@"){
								if($.Z.list[sid]){
									$select.append($.Z.getOptions($.Z.list[sid]));
								} else {
									if(column.bindData!=""&&column.bindData.substring(0,1)=="@"){//表示此列为select类型，绑定了sql
										$.Z.fetchDataForSelect($select, column, j, sid);  // Bug 267
									}
								}
							}else{//直接绑定
								$select.append($.Z.getOptions(column.bindData));
							}
							$select.attr("selectedIndex",0);
                                                        $select.change(function(){
                                                            $("#"+checkboxid).attr("checked", true);
                                                            $.Z.onCheckboxClick($("#"+checkboxid), funcNo);
                                                        }); 
						}
						//checkbox
						else if(column.edittype=="checkbox"){
							var $checkbox = $("<input style='width:97%' id="+cid+" columnName="+column.fieldname+" name="+cid+" editable='"+ column.editable + "' value='n' setval="+column.setval+" type='checkbox'/>");
							if(readonly=="y")
								$checkbox.attr("disabled",true);
							else
								$checkbox.attr("noReadOnly",true);
							$td.append($checkbox);
							$tr.append($td); 
                                                        $checkbox.change(function(){
                                                            $("#"+checkboxid).attr("checked", true);
                                                            $.Z.onCheckboxClick($("#"+checkboxid), funcNo);
                                                        }); 
						}
						//date
						else if(column.edittype=="date"){
							var $dateInput = $("<input style='width:94%'"+jscontent+" columnName="+column.fieldname+" name="+cid+" id="+cid+" editable='"+ column.editable + "' type='text' style='border:none; class='dateInput' setval='"+column.setval+"'/>");
							if(readonly=="y")
								$dateInput.attr("readonly",true);
							$td.append($dateInput);
							$tr.append($td);
							$dateInput.datepicker({changeYear:true,
								changeMonth:true,
								duration:"fast"
							});
							$dateInput.datepicker( "option", "disabled", true );
                                                        $dateInput.change(function(){
                                                            $("#"+checkboxid).attr("checked", true);
                                                            $.Z.onCheckboxClick($("#"+checkboxid), funcNo);
                                                        }); 
						}
						//text
						else {
							//var $text = $("<input style='width:"+ (parseInt(tableDef.colWidth[colidx+3])-12) +"px' "+jscontent+" columnName="+column.fieldname+" editable='"+ column.editable + "' name="+cid+" id="+cid+" type='text'  setval="+column.setval+">");
							var $text = $("<input style='width:97%' "+jscontent+" columnName="+column.fieldname+" editable='"+ column.editable + "' name="+cid+" id="+cid+" type='text'  setval="+column.setval+">");
							if(readonly=="y")
								$text.attr("readonly",true);
							else
								$text.attr("noReadOnly",true);
							$text.change(function(){
								$("#"+checkboxid).attr("checked", true);
								$.Z.onCheckboxClick($("#"+checkboxid), funcNo);
							});
							$td.append($text);
							$tr.append($td);
						}
						colidx++;
					}
					else{
						$tr.append("<td style='display:none'><input "+jscontent+" id="+cid+" name="+cid+" type='text' "+
								"readOnly='true' columnName="+column.fieldname+" editable='false' setval="+column.setval+"></td>");
					}
					
				}
				//$obj.after($tr);
                                $table.append($tr);
				
				$table.css("border","solid 1px #A6C9E2")
					.find(' td')
					.css("border-bottom","solid 1px #A6C9E2")
					.css("border-right","solid 1px #A6C9E2")
					.find(' th')
					.css("border-bottom","solid 1px #A6C9E2")
					.css("border-right","solid 1px #A6C9E2");
			 	
			},
			fetchDataForSelect: function (select, column, col, sid) {   // Bug 267 新增一个方法来确保ajax的success能取到正确的select
				$.ajax({
					type:"POST",
					url:$.edittable.options.BindingSqlURL,
					data:{sql:$.userContext.parser(column.bindData.substring(1)),bid:col},
					dataType:"text",
					success:function(data,textStatus){
						var data1 = data.split("^")[0];
						var data2 = data.split("^")[1];
						//sid = funcNo+"_"+tableDef.columns[data1].fieldname+"_bindData";
						$.Z.list[sid] = data2;
						select.append($.Z.getOptions($.Z.list[sid]));
					},
					error:function(e){
						alert(e);
					}
				});				
			},
			getOptions: function(bindData){
				var options="";
				if (bindData != "") {
					var kvs=bindData.split(";");
					for(var i=0;i<kvs.length;i++){
						var kv=kvs[i].split(":");
						if (kv.length > 0 && kv[0] != "") {  // 这里要保护一下。某些情况下会传入莫名的单个冒号。在IE8下jquery会报错。IE8兼容  bug 272 下拉列表无值
							var tmpval = kv[0].split("^");
							var value = null;
							if(tmpval.length == 2){
								value = tmpval[1];
							} else {
								value = tmpval[0];
							}
							options+="<option value='"+value+"'>"+kv[1]+"</option>";
						}
					}
				}
				return options;
			},
			getIndex :function(bindData,key){
				var kvs=bindData.split(";");
				for(var i=0;i<kvs.length;i++){
					var kv=kvs[i].split(":");
					if (key == kv[0])
						return i;
				}
			},
			validateRow :function(funcNo,i){
				var c = $.Z.list[funcNo].columns.length;
				var v = $.Z.validators[funcNo];
				var tag = true;
				for(var j=0; j<c; j++){
					if( !v.element( $('#' + funcNo + "et_" + i + '_' + j)) ){
						tag = false;
					}
				}
				return tag;
			},
			
			generateRules :function(funcNo,columns,rownum){
				var rules = {};
				for(var i=0; i<$.Z.list[funcNo].maxRows; i++){
					for(var j = 0;j<columns.length;j++){
						if(!columns[j].hidden){
							var name = funcNo+"_"+i+"_"+j;
							var rule = {};
							if(!columns[j].nullable){
								rule["required"] = true;
							}
							if( columns[j].maxlen && (columns[j].maxlen != "") )
								rule["maxlength"] = parseFloat(columns[j].maxlen);
							else if( columns[j].maxval && (columns[j].maxval!="") )
								rule["max"] = parseFloat(columns[j].maxval);
							
							if( columns[j].minlen && (columns[j].minlen!="") )
								rule["minlength"] = parseInt(columns[j].minlen);
							else if( (columns[j].minval!=null) && (columns[j].minval!="") )
								rule["min"] = parseInt(columns[j].minval);
							
							if( columns[j].format && ( columns[j].format!="")  )
								if( columns[j].format.charAt(0) == "@")
									rule["remote"] = "common_validateData.action?funcName="+ columns[j].format.substring(1);
								else  
									rule[columns[j].format] = true;
							rules[name]=rule;
						}
					}
				}
				return rules;
			},
			generateOperBar :function(tableDef){
				var btnOptions;
				var layout = "left";
				var $operation = $("<td style='width:25px;'></td>");//.css("padding","2px");
				//添加增加按钮
				if(tableDef.addable){
			 		btnOptions={icon:"ui-icon-plus", 
								pos:layout,
								script:"var $table = $(this).parent().parent().parent();" +
									   "var funcNo = $(this).parent().parent().attr('funcNo');"+
									   "var tableDef = $.Z.list[funcNo];"+
									   "var $operation = $.Z.operations[funcNo];"+
									   "var $obj = $(this).parent().parent();"+
									   "$.Z.addOneRow(tableDef,$table,$operation,$obj);"+
									   "$.Z.getTableData(funcNo);"
					}
			 		$operation.append( $.button.createIcon(btnOptions));
			 	 }
			 	
			 	//添加删除按钮
			 	if(tableDef.deleteable){
			 		btnOptions={icon:"ui-icon-minus", 
								pos:layout,
								script: "var rowId = $(this).parent().parent().attr('value');" +
										"var funcNo = $(this).parent().parent().attr('funcNo');"+
										"var tableDef = $.Z.list[funcNo];"+
										"if(typeof(tableDef.removeId)=='undefined')"+
										"	tableDef.removeId='';"+
										"tableDef.removeId+=rowId+';';"+
										" var $delete = $(this);"+
										"$.msgbox.showConf('确认删除吗?',function(){" +
										"	$delete.parent().parent().hide();" +
									    "$.Z.getTableData(funcNo);});"
					}
			 		$operation.append( $.button.createIcon(btnOptions));
			 	 }
			 	
			 	//添加清空按钮
			 	if(tableDef.clearable){
			 		btnOptions={icon:"ui-icon-battery-0",  
								pos:layout,
								script: 
								   		"var funcNo = $(this).parent().parent().attr('funcNo');"+
								   		"var rowId = $(this).parent().parent().attr('value');"+
								   		"var col_nums = $(this).parent().parent().attr('col_nums');"+
								   		" for(var j=0;j<col_nums;j++){" +
								   		"	$('#'+funcNo+'_'+rowId+'_'+j).attr('value','');" +
									    "$.Z.getTableData(funcNo);}"
					}
			 		$operation.append( $.button.createIcon(btnOptions));
			 	 }
			 	$.Z.operations[tableDef.funcNo] = $operation;
			 	return $operation;
			},
			generateBody :function(tableDef,$table,page){
				
				var funcNo = tableDef.funcNo;
				var table_id =  $.Z.idFuncs.getGridId(funcNo);
				
				var $operation ;//生成每列中的操作栏
				if(typeof($.Z.operations[funcNo])!="undefined"){
					$operation = $.Z.operations[funcNo];
				}else{
					$operation = $.Z.generateOperBar(tableDef);
				}
				
			 	var bindSql = tableDef.bindSql;
			 	if(!bindSql||bindSql==""){//若非sql生成，则按照初始化行数生成表格
			 		
			 		for(var i=0;i<tableDef.rowNums;i++){
			 			//var $tr = $table.find("tr:last-child");
                                                var $tr = "";
			 			$.Z.addOneRow(tableDef,$table,$operation,$tr);
			 		}
					$.edittable.sqlComplete(tableDef.funcNo,$table);//生成验证规则
					
			 	}else{
			 		var columns = "";
			 		$.each(tableDef.columns,function(i,n){
			 			columns = columns + n.fieldname + ",";
			 		});
			 		$.ajax({
			 			type:"POST",
			 			url:$.Z.options.dataBindingURL,
			 			data:{funcno:funcNo,    // 注意：这里的形参 funcno（第一个 ）中的n是小写的。对应CommonQueryAction.java的 queryEditTable
			 				  sql:$.UC.parser(bindSql),
			 				  page:page,
			 				  pageRows:tableDef.maxRows,  // bug 166的问题。 没有把maxRows设为大于0
			 				  columns:columns
			 				  },
			 			dataType:"json",
			 			success:function(data){
			 				var total = data.total;
			 				var page = data.page;
			 				var records = data.records;
			 				var rows = data.rows;
			 				if(rows.length>0){
				 				$.Z.addRows(tableDef,$table,rows,$operation,page);
					 			$.Z.appendPageBar(tableDef,$table,page,total);
								$.edittable.sqlComplete(tableDef.funcNo,$table);
			 				} else {
			 					for(var i=0;i<tableDef.rowNums;i++){
						 			var $tr = $table.find("tr:last-child");
						 			$.Z.addOneRow(tableDef,$table,$operation,$tr);
						 		}
								$.edittable.sqlComplete(tableDef.funcNo,$table);//生成验证规则
			 				}
			 				$.Z.adjustGridSize(tableDef.funcNo);

			 				$.Z.getTableData(tableDef.funcNo); //$.userContext.setData(tableDef.funcNo+"-alltabledata",$.Z.getTableData(tableDef.funcNo));
			 			},
			 			error:function(e){
			 				alert(e.responseText);
			 			}
			 		});
			 	}
			},
			
			adjustGridSize: function(funcno) {
				var zgridid = $.Z.idFuncs.getGridId(funcno);
				var zdivid = $.Z.idFuncs.getDivId(funcno);
				var zpagerid = $.Z.idFuncs.getPagerId(funcno);
				var zheaderid = $.Z.idFuncs.getHeaderId(funcno);
				var ztoolbarid = $.Z.idFuncs.getToolbarId(funcno);
				var bHasVertScrl = false;
				$("#" + zdivid).width($("#" + zdivid).parent().width() - $.getCSSNum($("#" + zdivid).parent(), "padding-left")  // BUG 426 对宽度和高度进行了重新计算，避免由于padding等产生不必要的滚动条。
						- $.getCSSNum($("#" + zdivid).parent(), "padding-right") -1)
					.height($("#" + zdivid).parent().height()  - $.getCSSNum($("#" + zdivid).parent(), "padding-top")  
							- $.getCSSNum($("#" + zdivid).parent(), "padding-bottom") 
							- $.getElementHeight(zheaderid,0) - $.getElementHeight(ztoolbarid,0)-1);
				//调整表头的宽度
				if ($.getElementHeight(zpagerid,0) + $.getElementHeight(zgridid, 0) > $.getElementHeight(zdivid, 0)) {
					// 有纵向滚动条 
					$("#"+zheaderid).width($("#" + zdivid).width()-19);
					bHasVertScrl = true;
				}
				else {
					$("#"+zheaderid).width($("#" + zdivid).width());
				}
					
			    // 就表头的各列实际宽度
				var tableDef = $.Z.list[funcno];
				for (var i=0;i<$("#"+zheaderid+" th").length; i++){
					tableDef.colWidth[i] = $("#"+zheaderid+" th:eq("+i+")").width();
				}
				// 对表内容的各列重设宽度。
				$.each($("#" + zgridid + " tr"), function(i,n) {
					var $tds = $(n).find("td");
					var iWidth = 0;
					for (var itd=0;itd<$tds.length; itd++){
						var $td = $($tds[itd]);
						if ($td.css("display") == "none")
							continue;
						$($tds[itd]).width(tableDef.colWidth[iWidth]);
						iWidth++;
					}
				});
				if (bHasVertScrl) {
					// 有纵向滚动条 
					$("#" + zgridid).width($("#" + zdivid).width() -19);
				}
				else
					$("#" + zgridid).width($("#" + zdivid).width()-1);


			},
			// WARNING: 下面两个方法现在还无用！！ 遗留问题
			checkMoney :function(tableDef,$table){
				var columns = tableDef.columns;
				for(var i=0;i<columns.length;i++){
					if(columns[i].format=="money")
						$.Z.addMoneySum(tableDef,$table,columns[i]);
				}
			},
			addMoneySum:function(tableDef,$table,column){
				var id = tableDef.funcNo+"_"+column.fieldname+"_sum";
				var $span = $("<span class='ui-state-active'>"+column.fname_cn+" 合计:</span>&nbsp &nbsp<span id='"+id+"'></span><br>");
				$table.after($span);
				if(typeof($.Z.list["sumSpanIds"])=="undefined")
					$.Z.list["sumSpanIds"]="";
				$.Z.list["sumSpanIds"] += id+";";
			},
			// WARNING: 上面两个方法无用
			
			generateHeader :function(tableDef,$table){
				/*var tr = "<tr style='display:none'><td style='width:15px'></td>" +    勾选栏						"<td style='width:40px'>操作</td><td style='width:40px'>序号</td>";
				for(var i=0;i<tableDef.columns.length;i++){
					if(!tableDef.columns[i].hidden)
						tr = tr + "<td style='width:"+tableDef.columns[i].width+"px'>"+tableDef.columns[i].fname_cn+"</td>";
				}
				tr = tr + "</tr>";
				$table.html(tr);
				var tr = "<tr style='display:none'></tr>";
				$table.html(tr);*/
			},
			/*generateHeaderLast:function(table_id1,$table,table_divId,tableDef){
				var $table1 = $("<table cellspacing='0' id="+table_id1+" style='width:100%'></table>");
				var tr = "<tr class='ui-state-active'>";
				
				$.each($table.find("tr:eq(1)").find("td"),function(i,n){
					if(i==0)
						tr = tr + "<td style='width:"+$(n).width()+"px'></td>";
					else if(i==1)
						tr = tr + "<td style='width:"+$(n).width()+"px'>操作</td>";
					else if(i==2)
						tr = tr + "<td style='width:"+$(n).width()+"px'>序号</td>";
					else
						tr = tr + "<td style='width:"+$(n).width()+"px'>"+tableDef.columns[i-3].fname_cn+"</td>";
				});
				tr = tr + "</tr>";
				$table1.html(tr)
					.css("border","solid 1px #A6C9E2")
					.find(' td')
					.css("border-bottom","solid 1px #A6C9E2")
					.css("border-right","solid 1px #A6C9E2");
				$("#"+table_divId).before($table1);
			},*/
			generateContent: function(tableDef){
				var funcNo = tableDef.funcNo;
				var table_id =  $.Z.idFuncs.getGridId(funcNo);
				var table_headerid = $.Z.idFuncs.getHeaderId(funcNo); 
				var table_divId = $.Z.idFuncs.getDivId(funcNo);
				
				//生成列名
				//var $table1 = $("<table cellspacing='0' id="+table_headerid+" style='width:"+(tableDef.width==0?"100%":tableDef.width+"px")+";table-layout: fixed'></table>");
				var $table1 = $("<table cellspacing='0' id="+table_headerid+" style='width:100%; table-layout:fixed;'></table>");
//				
//隐藏checkbox by wyj 暂时给姜晓燕不带check的版本。以后要做成“是否显示勾选”
				var tr;
				if (tableDef.selectMode == "none") {
					tr = "<thead><tr class='ui-widget-header'><th style='width:10px; display:none'></th>" +    
					"<th style='width:25px'>操作</th><th style='width:15px'><span>序号</span></th>";
				}
				else
				{
					tr = "<thead><tr class='ui-widget-header'><th style='width:10px'></th>" +    
					"<th style='width:25px'>操作</th><th style='width:15px'><span>序号</span></th>";
				}

				for(var i=0;i<tableDef.columns.length;i++){
					if(!tableDef.columns[i].hidden)
						tr = tr + "<th style='width:"+tableDef.columns[i].width+"px'>"+tableDef.columns[i].fname_cn+"</th>";
				}
				tr = tr + "</tr></thead>";
				$table1.html(tr)
					.css("border","solid 1px #A6C9E2")
					.find(' tr')
					.css("border-bottom","solid 1px #A6C9E2")
					.css("border-right","solid 1px #A6C9E2");
				$table1.find(' th')
					.css("border-bottom","solid 1px #A6C9E2")
					.css("border-right","solid 1px #A6C9E2");
				$("#"+table_divId).before($table1);
				
				
				var $table = $("<table cellspacing='0' id="+table_id+" style='width:"+tableDef.width+"px;table-layout: fixed;'></table>");
                                
                                //$("#h_table1687 th:eq(3)")
                                //$("#"+table_id1+" th")
                                //读取标题的宽度，然后存入一个临时的数组，并在generateBody中调用
				for (var i=0;i<$("#"+table_headerid+" th").length; i++){
					tableDef.colWidth[i] = $("#"+table_headerid+" th:eq("+i+")").width();
				}

				$("#"+table_divId).append($table);

				$.Z.generateHeader(tableDef,$table);//生成列名栏
				$.Z.generateBody(tableDef,$table,1);

				
			},
                        
			appendPageBar:function(tableDef,$table,page,totalPages){
				var id = $.Z.idFuncs.getPagerId(tableDef.funcNo);
				var $target = $table.parent();
				var $pageBar = $("<table></table>").attr("id",id).css("width","100%");
				var $tr = $("<tr></tr>").appendTo($pageBar);
				var $td = $("<td></td>").html("<img src='img/left_edtable.png'/> <span>共"+totalPages+"页 跳至第<input type='text' currPage='1' value='1' style='width:15px'/>页</span> <span style='color:#56AFD1'>go</span> <img src='img/right_edtable.png'/>")
				.css("text-align","center")
				.appendTo($tr);
				
				$tr.find("td>img:eq(0)").click(function(){
					var page = parseInt($(this).next().find("input").attr('currPage'));
					if(page>1){
						$.edittable.navToPage(tableDef,$table,page-1,totalPages);
						$(this).next().find("input").val(page-1);
						$(this).next().find("input").attr('currPage',page-1);
					}
				}).css("cursor","pointer");
				
				$tr.find("td>img:eq(1)").click(function(){
					var page = parseInt($(this).prev().prev().find("input").attr('currPage'));
					if(page+1<=totalPages){
						$.edittable.navToPage(tableDef,$table,page+1,totalPages);
						$(this).prev().prev().find("input").val(page+1);
						$(this).prev().prev().find("input").attr('currPage',page+1);
					}
				}).css("cursor","pointer");
				
				$tr.find("td>span:eq(1)").click(function(){
					var page = parseInt($(this).prev().find("input").val());
					if(page>0 && page<=totalPages){
						$.edittable.navToPage(tableDef,$table,page,totalPages);
						$(this).prev().find("input").attr('currPage',page);
					}
				}).css("cursor","pointer");
				$target.append($pageBar);
				
			},
			navToPage :function(tableDef,$table,page,totalPages){
				
			 	var bindSql = tableDef.bindSql;
				$table.find("tr").remove();//删去除了标题栏，以下的记录
				
				var funcNo = tableDef.funcNo;
				var table_id = "table"+tableDef.funcNo;
				
				var $operation ;//生成每列中的操作栏
				if(typeof($.Z.operations[funcNo])!="undefined"){
					$operation = $.Z.operations[funcNo];
				}else{
					$operation = $.Z.generateOperBar(tableDef);
				}
				
		 		var columns = "";
		 		$.each(tableDef.columns,function(i,n){
		 			columns = columns + n.fieldname + ",";
		 		});
		 		$.ajax({
		 			type:"POST",
		 			url:$.Z.options.dataBindingURL,
		 			data:{funcno:funcNo,
		 				  sql:$.UC.parser(bindSql),
		 				  page:page,
		 				  pageRows:tableDef.maxRows,
		 				  columns:columns
		 				  },
		 			dataType:"json",
		 			success:function(data){
		 				var rows = data.rows;
		 				$.Z.addRows(tableDef,$table,rows,$operation,page);
						$.edittable.sqlComplete(tableDef.funcNo,$table);
						$.Z.adjustGridSize(tableDef.funcNo);

		 				$.Z.getTableData(tableDef.funcNo); //$.userContext.setData(tableDef.funcNo+"-alltabledata",$.Z.getTableData(tableDef.funcNo));

		 			},
		 			error:function(e){
		 				alert(e.responseText);
		 			}
		 		});
			 	
			 	if(typeof(tableDef.complete) == "function")
					tableDef.complete(funcNo);
				
			},
			addRows :function(tableDef,$table,rows,$operation,page){
				
				var colNums = tableDef.columns.length;
				var funcNo = tableDef.funcNo;
				var lastRow = (page-1) * tableDef.maxRows;
				
				var rowReadOnly = false;//检查是否有READONLY这样的字段，若有则表示有的行需要设置为只读
				
				$.each(tableDef.columns,function(i,n){
					if(n.fieldname.toUpperCase() == "READONLY"){
						rowReadOnly = true;
						return;
					}
				});
				
				$.each(rows,function(ii,n){
                                        var i = ii;
					var $tr = $("<tr id="+n.id+" col_nums="+colNums+" state=1 funcNo="+funcNo+" value="+i+"></tr>");
					//添加勾选框
// 隐藏by wyj 给姜晓燕的版本，临时去掉。以后可以把“是否要勾选”变为可定义的。
					if (tableDef.selectMode == "none") {
						$tr.append("<td style='width:"+tableDef.colWidth[0]+"px; display:none'><input style='align:center' id="+funcNo+"_"+i+"_checkbox type='checkbox' onclick='$.Z.onCheckboxClick($(this),"+funcNo+")'></td>");
					}
					else
					{
						$tr.append("<td style='width:"+tableDef.colWidth[0]+"px'><input style='align:center' id="+funcNo+"_"+i+"_checkbox type='checkbox' onclick='$.Z.onCheckboxClick($(this),"+funcNo+")'></td>");
					}
					var checkboxid = funcNo+"_"+i+"_checkbox";
                                        //添加操作栏
					$tr.append($operation.clone(true).css("width",tableDef.colWidth[1]));
					
					//添加order栏
					$tr.append("<td class='ui-state-default'  style='width:"+tableDef.colWidth[2]+"px;'><span>"+(lastRow+i+1)+"</span></td>");
					
					var readonly = "n";
					var row = n.cell;

					
					var colidx = 0;
					for(var j=0;j<colNums;j++){//逐列处理
						var column = tableDef.columns[j];
						var cid = n.id+"_"+j;
						var jscontent = column.jscontent;
					    
						if(rowReadOnly)//业务表中的READONLY字段表示该记录(行)是否可编辑
							readonly = row["READONLY"].toLowerCase();
						else {
						//if(!rowReadOnly){//控制该列可否编辑，如果有READONLY字段控制则不进行列编辑设置
					    	if( column.editable)
					    		readonly = "n";
							else 
								readonly = "y";
					    }
						
						if(!column.hidden){
							//var $td = $("<td style='width:"+column.width+"px'></td>");
							var $td = $("<td style='width:"+tableDef.colWidth[colidx+3]+"px'></td>");
							
							//select
							if(column.edittype=="select"){
								var $select = $("<select "+jscontent+" SelData="+row[column.fieldname]+" columnName="+column.fieldname+" id="+cid+" name="+cid+" editable='"+ column.editable + "' type='select' setval="+column.setval+" style='width:97%;'></select>");
								$select.change(function(){
									$("#"+checkboxid).attr("checked", true);
									$.Z.onCheckboxClick($("#"+checkboxid), funcNo);
								}); 
								if(readonly=="y")
									$select.attr("disabled",true);
								else
									$select.attr("noReadOnly",true);
								$td.append($select).appendTo($tr);
								var sid = funcNo+"_"+column.fieldname+"_bindData";
								if(column.bindData.substring(0,1) != "@"){//不是sql时直接绑定  /// 可能有bug：为什么只处理非@的情况？@的情况只在addOneRow里处理就可以了吗？
									$select.append($.Z.getOptions(column.bindData));
									var key = row[column.fieldname];
									var index = $.Z.getIndex(column.bindData,key);
									$select.attr("selectedIndex",index);
								}
								else {
									
								}
							}
							//checkbox
							else if(column.edittype=="checkbox"){
								
								var $checkbox = $("<input id="+cid+" name="+cid+"  columnName="+column.fieldname +" editable='"+ column.editable + "' value='n' setval="+column.setval+" type='checkbox' style='width:97%;'/>");
								if(row[column.fieldname].toUpperCase()=="Y" || row[column.fieldname].toUpperCase()=="TRUE")
									{
										$checkbox.attr("checked",true);
										$checkbox.val("y");
									}
								if(readonly=="y")
									$checkbox.attr("disabled",true);
								else
									$checkbox.attr("noReadOnly",true);                               
								$checkbox.change(function(){
									$("#"+checkboxid).attr("checked", true);
									$.Z.onCheckboxClick($("#"+checkboxid), funcNo);
								});

								$td.append($checkbox).appendTo($tr);
							}
							//date
							else if(column.edittype=="date"){
								var $dateInput = $("<input style='width:95%' id="+cid+" "+jscontent+"  columnName="+column.fieldname+" editable='"+ column.editable + "' type='text' name="+cid+" style='border:none;' class='dateInput' setval='"+column.setval+"'/>");
								if (row[column.fieldname] != "") {   // bug 270 原来的代码根本就没有填入日期串  // 这段代码写得更好一点的话，可以先match一下字段内容是不是符合日期格式。
									$dateInput.attr("value", row[column.fieldname]);
								}
								if(readonly=="y")
									$dateInput.attr("disabled",true);
								$td.append($dateInput).appendTo($tr);
								$dateInput.datepicker({changeYear:true,
									changeMonth:true,
									duration:"fast"
								});
								$dateInput.datepicker( "option", "disabled", true );
								$dateInput.change(function(){
									$("#"+checkboxid).attr("checked", true);
									$.Z.onCheckboxClick($("#"+checkboxid), funcNo);
								});
							}
							//text
							else {
								//var $text = $("<input style='width:"+ (parseInt(tableDef.colWidth[colidx+3])-12) +"px' "+jscontent+"  columnName="+column.fieldname+" editable='"+ column.editable + "' id="+cid+" name="+cid+" type='text' value='"+row[column.fieldname]+"' setval="+column.setval+">");
								var $text = $("<input style='width:97%' "+jscontent+"  columnName="+column.fieldname+" editable='"+ column.editable + "' id="+cid+" name="+cid+" type='text' value='"+row[column.fieldname]+"' setval="+column.setval+">");
								
								if(readonly=="y")
									$text.attr("readonly",true);
								else
									$text.attr("noReadOnly",true);
                                                                $text.change(function(){
                                                                    $("#"+checkboxid).attr("checked", true);
                                                                    $.Z.onCheckboxClick($("#"+checkboxid), funcNo);
                                                                });
                                                                
								$td.append($text).appendTo($tr);
							}
							colidx++;
							
						//	if(column.format=="money")
						//		$td.children().attr("moneySpan",tableDef.funcNo+"_"+column.fieldname+"_sum");
							
						}else{
							$tr.append("<td style='display:none'><input "+jscontent+" id="+cid+" name="+cid+" type='text' value='"+row[column.fieldname]+ "'" +
									" readOnly='true'  columnName="+column.fieldname+" editable='false' setval="+column.setval+"></td>");
							if(column.fieldname.toUpperCase()=="CHECKED"){
								$.Z.setCheckedRows(row[column.fieldname],$tr);
							}
						}
					}
					$table.append($tr);
				});
				
				$table.css("border","solid 1px #A6C9E2")
					.find(' td')
					.css("border-bottom","solid 1px #A6C9E2")
					.css("border-right","solid 1px #A6C9E2");
					
			},
			setCheckedRows:function(checked,$tr){
				if(checked.toUpperCase()=='Y')
					$tr.find("td:first-child").find("input").attr("checked",true);
			},
			setToolbar: function(toolbar){
				var funcNo = toolbar.funcNo;
				var toolNeed = false;
				var table_id = $.Z.idFuncs.getGridId(funcNo);
				var table_divId = $.Z.idFuncs.getDivId(funcNo);
				var toolbar_id = $.Z.idFuncs.getToolbarId(funcNo);
				var layout = "left";
				var btnOptions;
				
				$("#"+table_divId).before($("<div class='ui-state-default' id='"+toolbar_id+"'></div>"));
			 	//添加重载按钮
			 	if(toolbar.resetable){
			 		toolNeed = true;
			 		btnOptions={id:table_id + "_resetable",
								caption:"重载", 
								icon:"ui-icon-arrowstop-1-n", 
								pos:layout
					}
			 		$("#" + toolbar_id).html( $.button.createIcon(btnOptions));
			 	 	$("#" + table_id + "_resetable").click(function(){
			 	 		$.Z.refresh(funcNo,"");
			 	 	});
			 	 }
			 	
			 	//添加全选按钮
			 	if(toolbar.selectMode!="none" && toolbar.selectALL){
			 		toolNeed = true;
			 		btnOptions={id:table_id + "_selectAll",
								caption:"全选", 
								icon:"ui-icon-lightbulb", 
								pos:layout
					}
			 		$("#" + toolbar_id).append( $.button.createIcon(btnOptions));
			 	 	$("#" + table_id + "_selectAll").click(function(){
			 	 		$.each($("#"+table_id).find("tr"),function(i,n){
			 	 			if($('#'+funcNo+"_"+i+'_checkbox').length>0){
			 	 				$('#'+funcNo+"_"+i+'_checkbox').attr('checked',true);
			 	 			}
			 	 		});
						$.Z.getSelTableData(funcNo);
			 	 	});
			 	}
			 	
			 	//添加反选按钮
			 	if(toolbar.selectMode!="none" && toolbar.shiftSel){
			 		toolNeed = true;
			 		btnOptions={id:table_id + "_shiftSel",
								caption:"反选", 
								icon:"ui-icon-extlink", 
								pos:layout
					}
			 		$("#" + toolbar_id).append( $.button.createIcon(btnOptions));
			 	 	$("#" + table_id + "_shiftSel").click(function(){
			 	 		$.each($("#"+table_id).find("tr"),function(i,n){
			 	 			if($('#'+funcNo+"_"+i+'_checkbox').length>0){
			 	 				var original = $('#'+funcNo+"_"+i+'_checkbox').attr('checked');
			 	 				$('#'+funcNo+"_"+i+'_checkbox').attr('checked',!original);
			 	 			}
			 	 		});
						$.Z.getSelTableData(funcNo);
			 	 	});
			 	}
			 	
			 	if(toolNeed){
			 		 $("#"+toolbar_id).css({"padding":"4px","height":"20px","width":"100%"});  // toolbar.width + 'px'
			 	}else{
			 		 $("#"+toolbar_id).hide();
			 	}
			}
	}
})(jQuery)
