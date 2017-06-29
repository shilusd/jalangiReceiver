;(function($){
	$.G = $.geditor = {
			errRows:{},
			runInstance: function( funcNo,options ){
				
				var op = $.extend({
					complete:function(){},
					allComplete:function(){},
					rowSelected:function(){},
					target:		 "main"			
					},options);
				
				if($.grid.list[funcNo] == null){
					$.ajax({
						type: "POST",
						url:  $.global.functionDefinitionUrl+"?type=G",
						data: {funcNo: funcNo},
						dataType: "json",
						success:  function( data,textStatus ){
							var gridDef = data[0];
							gridDef.complete = op.complete;
							gridDef.allComplete = op.allComplete;
							gridDef.rowSelected = op.rowSelected;
							$.appendScript(funcNo,gridDef.script);
							$.grid.list[funcNo] = gridDef;
							$.userContext.appendDataType(gridDef.typeMap);
							$.grid.createNew( gridDef,op.target);
						},
						error:function(e){
							//$.msgbox.show("err","请求显示的功能"+funcNo+"不存在或存在定义错误：<br>"+e.responseText);
						}
					});
				}else{
					var gridDef = $.grid.list[funcNo];
					$.grid.createNew(gridDef,op.target);
				}
				//$.grid.lastRows[funcNo] = null;
				//$.grid.onEdit[funcNo] = false;
				return $("#div_grid"+funcNo);
			},
			refresh:function(funcno,filter){
				$.Q.refresh(funcno,filter);
				return;
			},
			
			check:function(funcno){
				if($.grid.onEdit[funcno]){
					$.msgbox.show("msg","请先完成编辑");
					return false;
				}else if($("#grid"+funcno+">tbody>tr.errRow").length>0){
					$.msgbox.show("msg","请先修改错误的行<a style='color:red'>(红色标出)</a>");
					return false;
				}
				return true;
			},
			resizeWin:function(funcno,left,top,width,height){ //bug 280 原来没这个方法。导致G类型的无法调整大小。
				$.Q.resizeWin(funcno, left, top, width, height);
			}
	}
})(jQuery);