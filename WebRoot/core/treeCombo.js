;(function($){
	$.TC = $.treeCombo = {
		options:{
			dataBindURL:"common_getBindingData.action",//绑定数据的url
			definitionURL:$.global.functionDefinitionUrl+"?type=TC",//获取树定义的url
			doQueryURL:"commonQuery_doQuery.action"
		},
		list:{},//树形窗定义缓存
		runInstance:function(funcno, options){
			var op = $.extend({
				complete:function(){},
				allComplete:function(){},
				target:		 "main"
				},options);
			if(this.list[funcno] == null)
				$.ajax({
					type: "POST",
					url: $.treeCombo.options.definitionURL,
					data: {funcNo:funcno},
					dataType: "json",
					success: function( data,textStatus ){
						var treeDef = data[0];
						treeDef.complete = op.complete;
						treeDef.allComplete = op.allComplete;
						treeDef.funcno=funcno;
						$.treeCombo.list[funcno] = treeDef;
						$.userContext.appendDataType(treeDef.typeMap);
						$.treeCombo.createNew(treeDef,op.target);
					},
					error:function(e){
						//$.msgbox.show("err","树"+funcno+"不存在或存在定义错误：<br>"+e.responseText);
					}
				});
			else {
				var tdef= this.list[funcno] 
				$.treeCombo.createNew(tdef,options.target);
			}
		},
		createNew:function(treeDef,target){
			var targetwin=$("#"+target) 
			var $div = $("<div></div>")
			.css({width:targetwin.width(),height:targetwin.height()-12,overflow:"auto"})
			.appendTo(targetwin);
			var $ul = $("<ul root='root' id='tree" + treeDef.funcno + "'></ul>").appendTo($div);
			
			var table_id = "tcTable_" + treeDef.funcno;
			var table_divId = "div_" + table_id;
			var tr_id = "tr_"+table_id;
			var targetH = $div.height()-12;
			var targetW = $div.width()-12;
			var cbxWidth= Math.max(targetW/(treeDef.leaf_level+1),100);
			treeDef.comboWidth = cbxWidth;
			
			//添加一个新的table
            $div.append($("<div class='form' id='"+table_divId+"' style='overflow:auto;width:"+targetW+"px;height:"+targetH+"px'>"
            	                  +"<div class='form-body' id='fb_"+table_divId+"'>"
            	                  +"<table cellspacing='0' id='"+table_id+"' ><tr id='"+tr_id+"'></tr>"
            	                  +"</table></div></div>"));
            for(var i=0;i<=treeDef.leaf_level;i++){
				//加载的时候，全部选择都重来
				var fieldName = treeDef.funcno+"-"+treeDef.levels[i].key_name;
				$.userContext.setData(fieldName,"");
				fieldName = treeDef.funcno+"-"+treeDef.levels[i].val_name;
				$.userContext.setData(fieldName,"");
				$.treeCombo.createOneCombo(treeDef,tr_id,i);
			}
            treeDef.allComplete();
		},
		
		createOneCombo:function(treeDef,target,cIdx){
			var comboID=$.treeCombo.fn.genComboID(treeDef,cIdx);  
			var key_field="",val_field="",key="",val="";
            $("#"+target).append($("<td style='width:100px'>"+treeDef.levels[cIdx].lvl_desp+"</td>"
            	                  +"<td style='width:"+treeDef.comboWidth+"px'>"
            	                  +"  <select id='"+comboID+"' style='float:left;width:100%'>"
            	                  +"</select></td>"));
        	$("#"+comboID).change(function(){
            	//1.获取select的Key和Value放入到userContext中
            	key_field = treeDef.funcno+"-"+treeDef.levels[cIdx].key_name;
            	val_field = treeDef.funcno+"-"+treeDef.levels[cIdx].val_name;
            	val=$(this).find("option:selected").text();
            	if (val==($.global.SEL_DEF_ITEM)){
            		$.userContext.setData(key_field,"");
            		$.userContext.setData(val_field,"");
            	}else{
            		key=$(this).val();
            		$.userContext.setData(key_field,key);
            		$.userContext.setData(val_field,val);
            	}
            	//2.cIdx+1的select去bindComboData;	
            	if (cIdx!=treeDef.leaf_level)
            	    $.treeCombo.fn.bindComboData(treeDef,cIdx+1,true);
            	//3.cIdx+2及其后面的select全部清空
            	for(var i=cIdx+2;i<=treeDef.leaf_level;i++)
            	    $.treeCombo.fn.clearCombo(treeDef,i);
            	$.page.triggerBy(treeDef.funcno);
            });
            if (cIdx==0)//默认第一个select加载数据
            	$.treeCombo.fn.bindComboData(treeDef,0);
		},
		//刷新函数
		refresh:function(funcno, filter){
			var treeDef = $.treeCombo.list[funcno];
			$.treeCombo.fn.bindComboData(treeDef,0);
			for(var i=1;i<=treeDef.leaf_level;i++){
				$.treeCombo.fn.clearKeyVal(treeDef,i);
			}
		},
		check:function(funcno){
			var treeDef = $.treeCombo.list[funcno];
			var fieldName = "#"+treeDef.funcno+"-"+treeDef.levels[0].key_name+"#";
			if ($.userContext.bindData(fieldName)==""){
					$.msgbox.show("msg","请先选择一行记录");
					return false;
				}else 
					return true;
		},
		
		fn:{
			genComboID:function(treeDef,comboIdx){
			    var comboID="TreeCombo_"+treeDef.funcno+"cbx_"+comboIdx;
			    return comboID;
			},
			clearKeyVal:function(treeDef,comboIdx){
		        var fieldName = treeDef.funcno+"-"+treeDef.levels[comboIdx].key_name;
				$.userContext.setData(fieldName,"");
				fieldName = treeDef.funcno+"-"+treeDef.levels[comboIdx].val_name;
				$.userContext.setData(fieldName,"");
			},
			bindComboData:function(treeDef,comboIdx){
				$.treeCombo.fn.clearCombo(treeDef,comboIdx);
				var bindData=treeDef.levels[comboIdx].bind_data;
				var comboID = $.treeCombo.fn.genComboID(treeDef,comboIdx);
				
				var getOptions = function(bindData){
					var options="";
					if (bindData!=""){
						var kvs=bindData.split(";");
						for(var i=0;i<kvs.length;i++){
							var kv=kvs[i].split(":");
							options+="<option value='"+kv[0]+"'>"+kv[1]+"</option>";
						}
					}
					return options;
				}
				if(bindData.substring(0,1) == "@")
					$.ajax({
						type:"POST",
						url:$.form.options.dataBindingURL,
						data:{sql:$.userContext.parser(bindData.substring(1))},
						dataType:"text",
						success:function(data,textStatus){
							$("#"+comboID).append(getOptions(data));
						},
						error:function(e){
							$.msgbox.show(e.responseText);
						}
					});
				else{//否则直接绑定
				    if (bindData!="")
						$("#"+comboID).append(getOptions(bindData));
				}
			},
		    clearCombo:function(treeDef,combo_idx){
				$.treeCombo.fn.clearKeyVal(treeDef,combo_idx);
				var comboID = $.treeCombo.fn.genComboID(treeDef,combo_idx);
				$("#"+comboID).attr("innerHTML","");
				$("#"+comboID).append("<option value=''>"+$.global.SEL_DEF_ITEM+"</option>");
					
			}
	    }
	}
	
})(jQuery)