;(function($){
	$.TT = $.treeTable = {
		options:{
				TTParamURL:  $.global.functionDefinitionUrl+"?type=TT",
				updateURL:"commonUpdate_responseButtonEvent.action"
		},
		list:{},
		runInstance: function( funcNo,options ){
				var op = $.extend({
					complete:function(){},
					allComplete:function(){},
					target:		 "main"
					},options);
				if($.TT.list[funcNo] == null){
					$.ajax({
						type: "POST",
						url:  $.TT.options.TTParamURL,
						data: {funcNo: funcNo},
						dataType: "json",
						success:  function( data,textStatus ){
							var TTDef = data[0];
							TTDef.complete = op.complete;
							TTDef.allComplete = op.allComplete;
							$.appendScript(funcNo,TTDef.script);
							$.TT.list[funcNo] = TTDef;
							$.TT.createNew( TTDef,op.target);
						},
						error:function(e){
							//$.msgbox.show("err","请求显示的功能"+funcNo+"不存在或存在定义错误：<br>"+e.responseText);
						}
					});
				}else{
					var TTDef = $.TT.list[funcNo];
					$.TT.createNew(TTDef,op.target);
				}
			},
		createNew :function(TTDef,target){
				
		}
	}
})(jQuery)