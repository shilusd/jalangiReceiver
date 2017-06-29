/**
 * @author dyf
 * 新版本的可编辑grid
 */
;(function($){
	$.Z = $.editGrid = {
			options:{
				tableParamURL:  $.global.functionDefinitionUrl+"?type=Z",
				dataBindingURL:"commonQuery_queryEditTable.action",
				BindingSqlURL:"common_getBindingData.action",
				operations:{}
			},
			validators:{},//缓存格式验证器
			list:{},//定义的缓存
			currow:{},//当前行的定义
			runInstance: function(funcNo, options){
				var op = $.extend({
					target:		 "main",
					allComplete: function(){}
					},options);
				if($.Z.list[funcNo] == null){
					$.ajax({
						type: "POST",
						url:  $.Z.options.tableParamURL,
						data: {funcNo: funcNo},
						dataType: "json",
						success:  function( data,textStatus ){
							var tableDef = data[0];
							tableDef.target = op.target;
							tableDef.complete = op.complete;
							tableDef.allComplete = op.allComplete;
							$.appendScript(funcNo,tableDef.script);
							$.Z.list[funcNo] = tableDef;
							$.Z.createNew( tableDef,op.target);
							tableDef.dataComp("edittable"+funcNo);
						},
						error:function(e){
							$.msgbox.show("err","请求显示的功能"+funcNo+"不存在或存在定义错误：<br>"+e.responseText);
						}
					});
				}else{
					var tableDef = $.Z.list[funcNo];
					$.Z.createNew(tableDef, options.target);
					tableDef.dataComp("edittable"+funcNo);
				}
			},
			refresh:function(funcno,filter){
				var tableDef = $.Z.list[funcno];
				$.Z.createNew( tableDef, tableDef.target );
                                $.userContext.setData(funcno+"-selrownums",0);//勾选中的行数
                                $.userContext.setData(funcno+"-currSelRowid","");
				tableDef.dataComp("edittable"+funcno);
			},
			resizeWin:function(funcno,left,top,width,height){
				var bodyH=height-$.Z.calcZGridOtherHeight(funcno);	
				var zgrid = $("#" + $.Z.idFuncs.getGridId(funcno))
				zgrid.setGridHeight(bodyH);
				zgrid.setGridWidth(width);
				// IE下对setGridWidth好像是对的。但是Chrome却不对。 BUG 142 横向滚动调问题。
				if (!($.browser.msie && Number($.browser.version) <= 10 || $.browser.mozilla && Number($.browser.version) >= 11)) {
					var adjustWidth = 5;
					while (zgrid.width() > width) {
						zgrid.setGridWidth(width - adjustWidth, true);
						adjustWidth += 5;
					}
					if (zgrid.height() > bodyH) { // 这样就是有纵向滚动条的情况
						adjustWidth += 10;
					}
					zgrid.setGridWidth(width - adjustWidth, true);
					zgrid.setGridWidth(width, false);
				}
				
			},
			idFuncs: {
				getGridId: function(funcno) {
					return "edittable"+funcNo;
				},
				getPagerId: function(funcno) {
					return "pager_" + $.Z.idFuncs.getGridId(funcno);
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
				var head_height=$.getElementHeight($.Z.idFuncs.getToolbarId(funcno),0);//表抬头的高度
				var pager_height=$.getElementHeight(pagerId,0);//页码条的高度
				return head_height+pager_height;

			},
            clear:function(funcno){
				$.userContext.setData(funcno+"-alltabledata","");
				$.userContext.setData(funcno+"-currselrowid","");
				$.userContext.setData(funcno+"-rownums","");
				$.userContext.setData(funcno+"-selrownums","");
				$.userContext.setData(funcno+"-seltabledata","");
			},
			createNew: function(tableDef, target){
				var tableId = "edittable" + tableDef.funcNo;
				var table = $("<table id=\"" + tableId + "\"></table>");
				var pagerId = "pager_edittable" + tableDef.funcNo;
				var pager = $("<div id=\"gridPager\"></div>");
				$("#"+target).empty().append(table);
				$("#"+target).append(pager);
				//产生coluname属性
				var colNames = new Array();
				var colModel = new Array();
				var i = 0;
				for(var colindex=0; colindex<tableDef.columns.length; colindex++){
					var col = tableDef.columns[colindex];
					colNames[i] = col.fname_cn;
					//{name:'id',editable:true,edittype:"text",index:'id', width:60, sorttype:"int"},
					var edittype = col.edittype;
					if((edittype==null)||(edittype=='')){
						edittype = "text";
					}
					var editrules = new Object();
					if(!col.nullable){
						editrules.required = true;
					}
					if((col.minval!=null)&&(col.minval!='')){
						editrules.minValue = col.minval;
					}
					if((col.maxval!=null)&&(col.maxval!='')){
						editrules.maxValue = col.maxval;
					}
					/*var selectDataInit = function(elem){
						var sid = tableDef.funcNo+"_"+tableDef.columns[j].fieldname+"_bindData";
						if($.Z.list[sid]==null){
							$.ajax({
								type:"POST",
								url:$.edittable.options.BindingSqlURL,
								data:{sql:$.userContext.parser(col.bindData.substring(1)),bid:colindex},
								dataType:"text",
								success:function(data,textStatus){
									var data1 = data.split("^")[0];
									var data2 = data.split("^")[1];
									sid = tableDef.funcNo+"_"+tableDef.columns[data1].fieldname+"_bindData";
									$.Z.list[sid] = data2;
									$select.append($.Z.getOptions(data));
									var key = $select.attr("selData");
									var index = $.Z.getIndex(data,key);
									$select.attr("selectedIndex",index);
									$.userContext.setData(funcNo+"-alltabledata",$.Z.getTableData(funcNo));
								}	
							});
						} else {
							var data = $.Z.list[sid];
							$select.append($.Z.getOptions(data));
							var key = $select.attr("selData");
							var index = $.Z.getIndex(data,key);
							$select.attr("selectedIndex",index);
						}
					};*/
					var model = null;
					if(edittype=="select"){
						if((col.bindData!='')&&(col.bindData.substring(0,1)!="@")){
							model = {name:col.fieldname,editable:col.editable,edittype:edittype,
								 index:col.fieldname, width:col.width, sorttype:"string",formatter: "select",
								 editoptions:{value: col.bindData}}; 
						} if((col.bindData!='')&&(col.bindData.substring(0,1)=="@")){
							model = {name:col.fieldname,editable:col.editable,edittype:edittype,
									 index:col.fieldname, width:col.width, sorttype:"string",formatter: "select",
									 editoptions:{value: "0:请选择"}};
						}
						
					} else {
						model = {name:col.fieldname,editable:col.editable,edittype:edittype,
								 index:col.fieldname, width:col.width, sorttype:"string"};
					}					
					colModel[i] = model;
					i++;
				}
				$("#"+tableId).jqGrid({
	                datatype: "local",
	                height: tableDef.height,
	                width: tableDef.width,
	                colNames:colNames,
	                colModel:colModel,
	                sortname:'id',
	                sortorder:'asc',
	                viewrecords:true,
	                rowNum:10,
	                toolbar:[true,"top"],
	                toolbarlayout: "left",
	                cellEdit:true,
	                cellsubmit:'clientArray',
	                pager:"#gridPager",
	                caption: "",
	                gridComplete: function(){
	    				$.Z.sqlDataComp(tableDef);
	                },
	                onCellSelect: function(){
	                	//alert('oncellselect');
	                	//return false;
	                }
				}).navGrid('#' + pagerId,{edit:false,add:false,del:false});
				$.Z.setToolbar(tableDef);
				$.Z.loadData(tableDef);
				tableDef.dataComp(tableId);
			},
			sqlDataComp: function(tableDef){
				var tableId = "edittable" + tableDef.funcNo;
				for(var colindex=0; colindex<tableDef.columns.length; colindex++){
					var col = tableDef.columns[colindex];
					if((col.bindData!='')&&(col.bindData.substring(0,1)=="@")){
						var sid = tableDef.funcNo+"_"+col.fieldname+"_bindData";
						//if($.Z.list[sid]==null){
							$.ajax({
								type:"POST",
								url:$.Z.options.BindingSqlURL,
								data:{sql:$.userContext.parser(col.bindData.substring(1)),bid:colindex},
								dataType:"text",
								success:function(data,textStatus){
									var data1 = data.split("^")[0];
									var data2 = data.split("^")[1];
									sid = tableDef.funcNo+"_"+tableDef.columns[data1].fieldname+"_bindData";
									$.Z.list[sid] = data2;
									//$select.append($.Z.getOptions(data));
									$("#"+tableId+" select[name='"+tableDef.columns[data1].fieldname+"']").html($.Z.getOptions(data));
									$("#"+tableId+" select[name='"+tableDef.columns[data1].fieldname+"']").css("width", "100%");
									
									$.userContext.setData(tableDef.funcNo+"-alltabledata",$.Z.getTableData(tableDef.funcNo));
								}	
							});
						/*} else {
							var data = $.Z.list[sid];
							$("#"+tableId+" select[name='"+tableDef.columns[colindex].fieldname+"']").html($.Z.getOptions(data));
						}*/
					}
				}
			},
			getOptions: function(bindData){
				var options="";
				var kvs=bindData.split(";");
				for(var i=0;i<kvs.length;i++){
					var kv=kvs[i].split(":");
					var tmpval = kv[0].split("^");
					var value = null;
					if(tmpval.length == 2){
						value = tmpval[1];
					} else {
						value = tmpval[0];
					}
					options+="<option value='"+value+"'>"+kv[1]+"</option>";
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
			setToolbar: function(tableDef){
				
		        var funcNo = tableDef.funcNo;
		        var grid_id = "edittable"+funcNo;
		        var layout = toolbar.toolbarlayout;
		        $("#t_"+grid_id).empty();	
		        var btnOptions;
		        //添加增删改按钮
		        btnOptions={
		                id:grid_id + "_add",
		                caption:"增加", 
		                icon:"ui-icon-transferthick-e-w", 
		                pos:layout
		            };
	            $("#t_" + grid_id).append( $.button.createIcon(btnOptions));
	            $("#" + grid_id + "_add").click(function(){
	 		        var o_ids = $("#"+grid_id).jqGrid('getDataIDs');
	 		        var o_id = o_ids[o_ids.length-1];
	 		        var n_id = parseInt(o_id) + 1;
	            	var datarow = {};
	                $("#" + grid_id).jqGrid('addRowData',n_id, datarow);
	 		        var ids = $("#"+grid_id).jqGrid('getDataIDs');
	 		        var id = ids[ids.length-1];
					$("#"+grid_id).editRow(id);
	            });
		        /*btnOptions={
		                id:grid_id + "_modify",
		                caption:"修改", 
		                icon:"ui-icon-transferthick-e-w", 
		                pos:layout
		            };
	            $("#t_" + grid_id).append( $.button.createIcon(btnOptions));
	            $("#" + grid_id + "_modify").click(function(){
	                $("#" + grid_id).jqGrid('setColumns');
	            });*/
		        btnOptions={
		                id:grid_id + "_del",
		                caption:"删除", 
		                icon:"ui-icon-transferthick-e-w", 
		                pos:layout
		            };
	            $("#t_" + grid_id).append( $.button.createIcon(btnOptions));
	            $("#" + grid_id + "_del").click(function(){
	                $("#" + grid_id).jqGrid('setColumns');
	            });
		        //添加从Excel粘贴按钮
		        btnOptions={
		                id:grid_id + "_pastexls",
		                caption:"粘贴", 
		                icon:"ui-icon-transferthick-e-w", 
		                pos:layout
		            };
	            $("#t_" + grid_id).append( $.button.createIcon(btnOptions));
	            $("#" + grid_id + "_pastexls").click(function(){
	            	//弹出窗口，然后让粘贴数据
	            	$inputDlg = $("#d_" + grid_id);
	            	if($inputDlg){
	            		$inputDlg.empty();
	            	}
	            	$inputDlg = $("<div><textarea id='excel_paste' spellcheck='false' placeholder='按下Ctrl+V粘贴' wrap='off' style='resize: none; width: 300px; height:300px'></textarea></div>");
	            	$inputDlg.dialog({
                        title:"粘贴",
                        bgiframe: true,
                        modal: true,
                        resizable: false,
                        zIndex:10001,
                        height:'auto',
                        width:'auto',
                        buttons: {
                            "取消": function() {
                                $(this).dialog('close');
                                return;
                            },
                            "确定":function(){
                                $(this).dialog('close');
            	            	//读取
            	            	var str = $("#excel_paste").val();
            	            	rows = str.split('\n');
            	            	for (var r=0; r<rows.length; r++){
            	            		cols = rows[r].split('\t');
            	            		if((cols!=null)&&(cols!='')){
            	            			//增加新行，并添加进去 循环产生新行
                    	 		        var o_ids = $("#"+grid_id).jqGrid('getDataIDs');
                    	 		        var o_id = o_ids[o_ids.length-1];
                    	 		        var n_id = parseInt(o_id) + 1;
                    	            	var datarow = {};
                    					for(var colindex=0; colindex<tableDef.columns.length; colindex++){
                    						var col = tableDef.columns[colindex];
                    						if(cols[colindex]){
                        						datarow[col.fieldname] = cols[colindex];
                    						} else {
                        						datarow[col.fieldname] = '';
                    						}
                    					}
                    	                $("#" + grid_id).jqGrid('addRowData',n_id, datarow);
                    	 		        var ids = $("#"+grid_id).jqGrid('getDataIDs');
                    	 		        var id = ids[ids.length-1];
                    					$("#"+grid_id).editRow(id);
            	            		}
            	            	}
                            }
                        }
                    });
	            });
			},
			loadData: function(tableDef){
				//检查是否需要有绑定sql，有的话根据sql生成，没有的话，根据定义产生空行
				var tableId = "edittable" + tableDef.funcNo;
				var funcNo = tableDef.funcNo;
				var bindSql = tableDef.bindSql;
			 	if(!bindSql||bindSql==""){//若非sql生成，则按照初始化行数生成表格
			 		for(var i=0;i<tableDef.rowNums;i++){
						var datarow = {};
						$("#"+tableId).jqGrid('addRowData',i, datarow);
			 		}
			 	}else{
			 		var columns = "";
			 		$.each(tableDef.columns,function(i,n){
			 			columns = columns + n.fieldname + ",";
			 		});
			 		$.ajax({
			 			type:"POST",
			 			url:$.Z.options.dataBindingURL,
			 			data:{funcno:tableDef.funcNo,
			 				  sql:$.UC.parser(bindSql),
			 				  page:1,
			 				  pageRows:tableDef.maxRows,
			 				  columns:columns
			 				  },
			 			dataType:"json",
			 			success:function(data){
			 		        for(var i=0;i<data.rows.length;i++){
			 		        	$("#"+tableId).jqGrid('addRowData',i+1,data.rows[i].cell);
			 		        }
			 		        var ids = jQuery("#"+tableId).jqGrid('getDataIDs');
			 		        //启动编辑模式
			 		        for(var idx=0; idx<ids.length; idx++){
			 		        	var id = ids[idx];
								$("#"+tableId).editRow(id);
			 		        }
			 			},
			 			error:function(e){
			 				alert(e.responseText);
			 			}
			 		});
			 	}
			},
			check :function(funcno){
				//这部分是验证表的勾选行的内容
				var currRows = $.userContext.bindData("#"+funcno+"-currSelRowid#");//勾选中的行数 //$.Z.checkedRows[funcno];
				if(currRows==""){
					alert("请勾选记录!");
					return false;
				}
				/*var rowIds = currRows.split(";"); 
				for(var i = 0; i<rowIds.length && rowIds[i]; i++){
					if(!$.Z.validateRow(funcno,rowIds[i]))
						return false;
				}*/
				return true;
			},
			getTableData: function(funcno){
				var tableDef = $.Z.list[funcno];
				var data_form = tableDef.data_form;
				var data = "";
				if(data_form=="str"){
					data = $.Z.getDataByStr(tableDef,"whole");
				}else if(data_form=="xml"){
					data = $.Z.getDataByXml(tableDef,"whole");
				}
				return data;
			},
			getDataByStr: function(tableDef,scope){
				var data = "";
				var funcNo = tableDef.funcNo;
				var $table = $("#edittable" + funcNo);
				var curid = $table.jqGrid('getGridParam','selrow');
				var tmpdata = null;
				var allcount = $table.jqGrid('getGridParam','records');
				if(scope == "whole"){
					var allids = $table.jqGrid('getDataIDs');
					for (var idx_row=0; idx_row<allids.length; idx_row++){
						id = allids[idx_row];
						for (var idx_col=0; idx_col<tableDef.columns.length; idx_col++){
							col = tableDef.columns[idx_col];
							//tmpdata = $table.getCell(id,col.fieldname);
							tmpdata = $("#edittable"+funcNo+" #"+id+"_"+col.fieldname).val();
							if (tmpdata != null){
								data = data+tmpdata.replace(/(\s*$)/g,"")+$.global.DATA_SPLIT_STR;
							} else {
								data = data+""+$.global.DATA_SPLIT_STR;
							}
						}
						data = data+""+$.global.DATA_SPLIT_ROW;
					}
				} else {
					var allcount = $table.jqGrid('getGridParam','records');
					var allids = $table.getGridParam("selarrrow");//选中行id
					for (var idx_row=0; idx_row<allids.length; idx_row++){
						id = allids[idx_row];
						for (var idx_col=0; idx_col<tableDef.columns.length; idx_col++){
							col = tableDef.columns[idx_col];
							tmpdata = $("#edittable"+funcNo+" #"+id+"_"+col.fieldname).val();
							if (tmpdata != null){
								data = data+tmpdata.replace(/(\s*$)/g,"")+$.global.DATA_SPLIT_STR;
							} else {
								data = data+""+$.global.DATA_SPLIT_STR;
							}
						}
						data = data+""+$.global.DATA_SPLIT_ROW;
					}
				}
				
	   			$.userContext.setData(funcNo+"-selrownums",$table.getGridParam("selarrrow").length);//勾选中的行数
	   			$.userContext.setData(funcNo+"-currSelRowid",curid);
				//增加获取行数的
				$.userContext.setData(funcNo+"-rownums",$table.find("tr").length);
				
				//alert(data);
				return data;
			},
			getDataByXml: function(tableDef,scope){
				var data = '<?xml version="1.0"?><Rows>';
				var funcNo = tableDef.funcNo;
				var $table = $("#edittable" + funcNo);
				var curid = $table.jqGrid('getGridParam','selrow');
				var tmpdata = null;
				var allcount = $table.jqGrid('getGridParam','records');
				if(scope == "whole"){
					var allids = $table.jqGrid('getDataIDs');
					for (var idx_row=0; idx_row<allids.length; idx_row++){
						id = allids[idx_row];
						data = data + "<Row>";
						for (var idx_col=0; idx_col<tableDef.columns.length; idx_col++){
							col = tableDef.columns[idx_col];
							tmpdata = $("#edittable"+funcNo+" #"+id+"_"+col.fieldname).val();
							if (tmpdata != null){
								data = data+"<"+col.fieldname+">"+tmpdata+"</"+col.fieldname+">";
							} else {
								data = data+"<"+col.fieldname+"></"+col.fieldname+">";
							}
						}
						data = data+"</Row>";
					}
				} else {
					var allcount = $table.jqGrid('getGridParam','records');
					var allids = $table.getGridParam("selarrrow");//选中行id
					for (var idx_row=0; idx_row<allids.length; idx_row++){
						id = allids[idx_row];
						data = data + "<Row>";
						for (var idx_col=0; idx_col<tableDef.columns.length; idx_col++){
							col = tableDef.columns[idx_col];
							tmpdata = $("#edittable"+funcNo+" #"+id+"_"+col.fieldname).val();
							if (tmpdata != null){
								data = data+"<"+col.fieldname+">"+tmpdata+"</"+col.fieldname+">";
							} else {
								data = data+"<"+col.fieldname+"></"+col.fieldname+">";
							}
						}
						data = data+"</Row>";
					}
				}
				data = data + "</Rows>";
				
	   			$.userContext.setData(funcNo+"-selrownums",$table.getGridParam("selarrrow").length);//勾选中的行数
	   			$.userContext.setData(funcNo+"-currSelRowid",curid);
				//增加获取行数的
				$.userContext.setData(funcNo+"-rownums",$table.find("tr").length);
				
				//alert(data);
				return data;
			}
	};
})(jQuery)