;(function($){
	$.PB = $.progressBar = {
		options:{
			progressBarDataURL: "progressBar.action",
			progressBarDefURL:  $.global.functionDefinitionUrl+"?type=PB"
		},
		list:{},
		dataMap:{},
		runInstance:function(funcno,options){
			var op = $.extend(options,{
				complete:function(){},
				target:"progressBar"
				});
			if($.PB.list[funcno] == null){
				$.ajax({
					type: "POST",
					url:  $.PB.options.progressBarDefURL,
					data: {funcNo: funcno},
					dataType: "json",
					success:  function( data,textStatus ){
						var PBDef = data[0];
						PBDef.complete = op.complete;
						PBDef.target = op.target;
						$.PB.list[funcno] = PBDef;
						$.PB.createNew(PBDef,op.target);
					},
					error:function(e){
						alert(e.message);
					}
				});
			}else{
				var PBDef = $.PB.list[funcno];
				$.PB.createNew(PBDef,op.target);
			}
				
		},
		createNew:function(PBDef,target){
			var funcno = PBDef.funcno;
			var used_vars = PBDef.used_vars;
			var show_cond = PBDef.show_cond;
			//创建显示ProcessBar的Div
			var $targetWin = $("#"+target);
			//width:300px;height:60px;margin-left:-150px;margin-top:-32px;
			var $outterDiv = $("<div style='position:absolute;left:40%;top:50%;z-index:10001;color:fff;border-style:solid;border-color:#06C;border-width:thin;'></div>").appendTo($targetWin);
			var $div = $("<div id=PB'"+PBDef.funcno+"'></div>").css({width:"200px", height:"10px", overflow:"auto"}).progressBar(PBDef.percent).appendTo($outterDiv);
			this.refresh(funcno,null);
		},
		setPercent:function(funcno,percent){
			$("#PB"+funcno).progressBar(percent);
		},
		refresh:function(funcno,filter){
			var PBDef = $.PB.list[funcno];
			$.PB.CreateNew(PBDef, PBDef.target);
			$.ajax({
				type: "POST",
				url:  $.PB.options.progressBarDataURL,
				data: {funcNo: funcno},
				dataType: "json",
				success:  function( data,textStatus ){
					setPercent(funcno, data.percent);
					setTimeOut(refresh(funcno,filter), 3000);
				},
				error:function(e){
					alert(e.message);
				}
			});
		}
	}
})(jQuery)