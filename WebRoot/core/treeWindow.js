;(function($){
	$.TW = $.treeWindow = {
			
		options:{
			dataBindURL:"common_getBindingData.action",			//绑定数据的url
			definitionURL:$.global.functionDefinitionUrl+"?type=TW",//获取树定义的url
			doQueryURL:	 "commonQuery_doQuery.action"
		},
		
		list:{},//树形窗定义缓存
		windowCnt:0,//窗口的数目
		runInstance:function(funcno, options){
			var op = $.extend({
				complete:function(){},
				allComplete:function(){},
				target:		 "main"
				
				},options);
			if(this.list[funcno] == null)
				$.ajax({
					type: "POST",
					url: $.treeWindow.options.definitionURL,
					data: {funcNo:funcno},
					dataType: "json",
					success: function( data,textStatus ){
						var treeDef = data[0];
						treeDef.complete = op.complete;
						treeDef.allComplete = op.allComplete;
						treeDef.funcno=funcno;
						$.treeWindow.list[funcno] = treeDef;
						$.userContext.appendDataType(treeDef.typeMap);
						$.treeWindow.createNew(treeDef,op.target);
					},
					error:function(e){
						//$.msgbox.show("err","树"+funcno+"不存在或存在定义错误：<br>"+e.responseText);
					}
				});
			else {
				var tdef= this.list[funcno]; 
				$.treeWindow.createNew(tdef,options.target);
			}
		},
		createNew:function(treeDef,target){
			var targetwin=$("#"+target) 
			var $div = $("<div id='" + $.TW.fn.genTWHolderID(treeDef) + "'></div>")
			.css({width:targetwin.width(),height:targetwin.height()-24,overflow:"auto"})
			.appendTo(targetwin);
			
			windowCnt=treeDef.leaf_level+1;
			var fieldName=""; 
			for(var i=0;i<=treeDef.leaf_level;i++){
				//树加载的时候，全部选择都重来
				fieldName = treeDef.funcno+"-"+treeDef.levels[i].key_name;
				$.userContext.setData(fieldName,"");
				fieldName = treeDef.funcno+"-"+treeDef.levels[i].val_name;
				$.userContext.setData(fieldName,"");
				
				$.treeWindow.createOneWindow(treeDef,$div,i);
			}
			treeDef.complete();
			treeDef.allComplete();
		},
		
		createOneWindow:function(treeWDef,target,wIdx){
		    var grid_id = $.treeWindow.fn.genGridID(treeWDef,wIdx);
			var grid_divId = $.treeWindow.fn.genGridDivID(treeWDef,wIdx);
			var pager_id = $.treeWindow.fn.genGridPagerID(treeWDef,wIdx);
			var targetH = target.height();
            var oneWidth = target.width() / (treeWDef.leaf_level+1);
            var drawLeft = wIdx*oneWidth;
            
			//添加一个新的grid
            target.append($("<div id=\""+grid_divId+"\" style='position:absolute;left:"+drawLeft+"px;height:"+targetH+"px;width:"+oneWidth+"px'>"
            	                  +"<table  id=\""+grid_id+"\" ></table><div id=\""+pager_id+"\"></div></div>"));
			
			treeWDef.OneWidth = oneWidth;
			treeWDef.OneHeight = targetH;
            //配置grid各基本属性
			$.treeWindow.genOneGrid(grid_id,pager_id,treeWDef,wIdx);
		},
		
		genOneGrid:function(grid_id,pager_id,treeDef,wIdx){
			    //根据fields中的字段f1,f2获得jqGrid的colNames格式:["f1","f2","f3"]
			    var getColNamesbyStr=function(fields){
			        var result="";
			    	var arFields=fields.split(",");
			        for(var i=0;i<arFields.length;i++)
			        	result=result+"\""+arFields[i]+"\",";
			        if (result!="")
			        	result="["+result.substring(0,result.length-1)+"]"
			        else
			        	result="[]";
			        
			        return result;
			    }
			    //根据fields中的字段f1,f2，获得jqGrid的colModal格式:[{name:"f1",id:"f1",width:100},{}]
			    var getColModelbyStr=function(fields,treeDef){
			    	var result="";
			    	var arFields=fields.split(",");
			    	if (arFields.length==0)
			    		return result
			    	else{
			    		var colWidth=(treeDef.OneWidth-28)/3;
			    		for(var i=0;i<arFields.length;i++){
			    			if (i<=1)//只显示Key和name两列
			    				colWidth=colWidth*(i+1);
			    			else 
			    				colWidth=0;
			    			
			    			result=result+"{"
			    			             +"name:\""+arFields[i]+"\","
			    			             +"index:\""+arFields[i]+"\","
			    			             +"align:\"left\","
			    			             +"resizable:true,"
			    			             +"sortable:true,"
                                         +"width:"+colWidth+"},";
			    		}
			    		if (result!="")
			    			result="["+result.substring(0,result.length-1)+"]";

			    		return result;
			    	}
			        
			    }
			    //根据fields中的字段f1,f2，获得第一个字段的名字f1
			    var getFirstFieldName=function(fields){
			    	var result="";
			    	var arFields=fields.split(",");
			        if (arFields.length>0)
			        	result=arFields[0];
			        return result;
			    }
			    
			    //设置jqGrid属性开始了
			    var gridDef={}; 
				gridDef.url = $.grid.opitions.doQueryURL+"?funcno=" + treeDef.funcno ;
				gridDef.pager = $("#"+pager_id);
				gridDef.rowNum =100;
				gridDef.width = treeDef.OneWidth;
				gridDef.height = treeDef.OneHeight-50;
				gridDef.rownumbers = true;
				gridDef.viewrecords = true;
				gridDef.pginput = true;
				gridDef.multiselect = false;
				gridDef.datatype = "json";
				gridDef.mtype = "POST";
				gridDef.colNames = eval(getColNamesbyStr(treeDef.levels[wIdx].bind_fields));
				gridDef.colModel= eval(getColModelbyStr(treeDef.levels[wIdx].bind_fields,treeDef));
				gridDef.sortname =getFirstFieldName(treeDef.levels[wIdx].bind_fields);
				
				gridDef.gridComplete =function(){
					// 有纵向滚动条，则要修正head的宽度：使之和数据部分右侧对齐。
					if ($("#"+grid_id).height() > $("#"+grid_id).parent().parent().height()) {
						var $gridHeadBand = $("#"+grid_id).parent().parent().siblings().filter(".ui-jqgrid-hdiv");
						var $gridBodyDiv = $("#"+grid_id).parent().parent();
						if ($gridHeadBand.width() > $gridBodyDiv.width() - 15) {
							$gridHeadBand.width($gridBodyDiv.width() - 15); 
						}
					}
				};
				gridDef.loadBeforeSend = function(xhr){};
				gridDef.loadError = function(xhr,st,err) {
			    	//$.msgbox.show("err","grid 在加载数据时发生错误，可能是sql拼写有错误");
			    };
			    gridDef.onSelectRow = function(rowid){
			    	$.userContext.setData('0-currFunc',treeDef.funcno);
			    	var rowdata = $("#"+grid_id).jqGrid('getRowData',rowid);
			    	var bind_field=treeDef.levels[wIdx].bind_fields;
			    	var arFields=bind_field.split(",");
					var key = rowdata[arFields[0]];
					var val = rowdata[arFields[1]];
					var fieldName = treeDef.funcno+"-"+treeDef.levels[wIdx].key_name;
					
					$.userContext.setData(fieldName,key);
					fieldName = treeDef.funcno+"-"+treeDef.levels[wIdx].val_name;
					$.userContext.setData(fieldName,val);
					
					$.userContext.setData(treeDef.funcno+"-currentKey",key);  // bug 301
					$.userContext.setData(treeDef.funcno+"-currentVal",val);
					
					if (wIdx!=treeDef.leaf_level){//不是最后一个窗口的话
					    var affect_grid_id =$.treeWindow.fn.genGridID(treeDef,wIdx+1);
					    $("#"+affect_grid_id).trigger("reloadGrid");
					    $.treeWindow.fn.clearKeyVal(treeDef,wIdx+1);
					    $.treeWindow.fn.refreshGrid(treeDef,wIdx+2);
					}
					$.page.triggerBy(treeDef.funcno);
				};
				gridDef.onSelectAll = function(rowids,status){};
				gridDef.beforeRequest = function(){
					var bindSql=treeDef.levels[wIdx].bind_data;
					bindSql=bindSql.substring(1,bindSql.length);
					
					$("#"+grid_id).jqGrid("appendPostData",{
						prjfields:$.userContext.parser(treeDef.levels[wIdx].bind_fields),
						tablenames:$.userContext.parser("("+bindSql+")"),
						joinconditions:""
					});
				};
				gridDef.onSortCol = function(){
					$("#"+grid_id).jqGrid("removePostDataItem","ordStr");
				};
				//调用jqGrid生成
		     	$("#"+grid_id).jqGrid(gridDef);
			},
		//刷新函数
		refresh:function(funcno, filter){
			var treeDef = $.treeWindow.list[funcno];
			$.TW.fn.clearKeyVal(treeDef,0);
			$.TW.fn.refreshGrid(treeDef,0);
		},
		resizeWin: function(funcno, left,top,width,height) {
			var treeDef = $.treeWindow.list[funcno];
			var oneWidth = (width-10) / (treeDef.leaf_level+1) -2;  // BUG 387 微调宽度和left
			for (var i = 0; i <= treeDef.leaf_level; i++){  
				var gridid = $.treeWindow.fn.genGridID(treeDef, i);
				var griddivid = $.treeWindow.fn.genGridDivID(treeDef, i);
				$("#" + griddivid).css({
					width: oneWidth, 
					height: height, 
					left: 8+ i * (oneWidth+2) });
				$("#" + gridid).setGridWidth(oneWidth -8);  // BUG 387 微调宽度和left
				$("#" + gridid).setGridHeight(height -$.getElementHeight($.treeWindow.fn.genGridPagerID(treeDef, i),0)
						 - 30 /*hdiv*/);
				
			}
			var $griddivHolder = $("#" + $.TW.fn.genTWHolderID(treeDef) );   // BUG 387补充修改。
			$griddivHolder.width(width-1).height(height-1);
		},
		check:function(funcno){
			var treeDef = $.treeWindow.list[funcno];
			var fieldName ="#"+treeDef.funcno+"-"+treeDef.levels[0].key_name+"#";
			if ($.userContext.bindData(fieldName)==""){
					$.msgbox.show("msg","请先选择一行记录");
					return false;
				}else 
					return true;
		},
		fn:{
				genGridID:function(treeDef,wIdx){
				    var grid_id = "gridTreeWin" + treeDef.funcno+"_"+wIdx;
				    return grid_id;
				},
				genGridDivID: function(treeDef, wIdx) {
					return "div_" + $.TW.fn.genGridID(treeDef, wIdx);
				},
				genGridPagerID: function(treeDef, wIdx) {
					return "pager" + treeDef.funcno+"_"+wIdx;
				},
				genTWHolderID: function(treeDef){
					var holderId = "twHolder" + treeDef.funcno;
				    return holderId;
				},
				clearKeyVal:function(treeDef,fromIdx){
				    for (var i=fromIdx;i<=treeDef.leaf_level;i++){
						var fieldName = treeDef.funcno+"-"+treeDef.levels[i].key_name;
						$.userContext.setData(fieldName,"");
						fieldName = treeDef.funcno+"-"+treeDef.levels[i].val_name;
						$.userContext.setData(fieldName,"");
					}
				},
			    refreshGrid:function(treeDef,fromIdx){
					 for (var i=fromIdx;i<=treeDef.leaf_level;i++){   
						var clear_grid_id=$.treeWindow.fn.genGridID(treeDef,i);
					    //////$("#"+clear_grid_id).jqGrid("clearGridData");//用clearGridData有些小问题，要点击两次才出数据
					    $("#"+clear_grid_id).trigger("reloadGrid");
					}
						
				}
		    }
	}
	
})(jQuery)