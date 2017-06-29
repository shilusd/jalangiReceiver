$.R_YFC = $.report = {
		option : {
			url: $.global.functionDefinitionUrl+"?type=R"
		},
		list : {},
		runInstance : function(funcNo, target){
			var op = {};
			op.target = target;
			if(this.list[ funcNo ] == null){
				$.ajax({
					type: "POST",
					url:  $.R.option.url,
					data: {funcNo:funcNo},
					dataType: "json",
					success: function( data,textStatus ){
						var reportDef = data[0];
						$.R.list[funcNo] = reportDef;
						$.R.createNew( reportDef,op.target );
					},
					error:function(e){
						alert(e);
					}
				});
			}else{
				var reportDef = $.R.list[funcNo];
				$.R.createNew( reportDef,  op.target );
			}
		},
		createNew : function(reportDef, target){
			reportDef.target = target;
			var $tgt = $("#" + target);
			var width = $tgt.parent().width() - 1;
			var height = $tgt.parent().height() - 1;
			
			$tgt.block({message:"<p class='ui-state-active'>请稍等...</p>",
				overlayCSS:{backgroundColor: '#0F4569', 
    			opacity:         0.4 
			}});
			
			$.ajax({
				   type: "POST",
				   url: "reportAction_report.action",
				   data: {funcno : reportDef.funcno, parStr:$.report.getParseStr(reportDef.varStr)},
				   dataType:"text",
				   success: function(rid){
					   var reportID = "freeReport" + reportDef.funcno;
					   $tgt.append(
							  
				   			"<iframe id='" + reportID +"' src='DocumentEdit.jsp?RecordID=" + rid + "' width='"
				   			+ width + "' height='" + height + "'></iframe>"
				   		);
					   $tgt.unblock();
				   },
				   error : function(e){
					   alert("报表错误");
				   }
			});
			
		},
		refresh : function(funcno){
			$("#freeReport" + funcno).remove();
			var reportDef = $.report.list[funcno];
			$.report.createNew(reportDef,reportDef.target);
		},
		getParseStr : function(varStr){
			var parStr = "";
			var vars = varStr.split(";");
			for(var i = 0; i < vars.length; i++){
				parStr += vars[i].split(":")[0] + ":" + $.UC.bindData( vars[i].split(":")[1] ) + ";";
			}
			var ind = parStr.length;
			return parStr.substring(0,ind-1);
		}
}