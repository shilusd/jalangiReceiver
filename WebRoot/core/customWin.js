(function($){
	$.C = $.customWin = {
			
			opitions:{
				customWinURL:  $.global.functionDefinitionUrl+"?type=C"
			},
			
			dataMap:{},
			list:{},
			ready:{},
			tip:{},
			runInstance:function(funcno,options){
				var op = $.extend({
					complete:function(){},
					rowSelected:function(){},
					target:		 "main"
					
					},options);
				if($.customWin.list[funcno] == null){
					$.ajax({
						type: "POST",
						url:  $.customWin.opitions.customWinURL,
						data: {funcNo: funcno},
						dataType: "json",
						success:  function( data,textStatus ){
							var customDef = data[0];
							customDef.complete = op.complete;
							customDef.allComplete = op.allComplete;
							$.customWin.list[funcno] = customDef;
							$.customWin.createNew(customDef,op.target);
						},
						error:function(e){
							$.msgbox.show( "err", e.responseText );
						}
					});
				}else{
					var customDef = $.customWin.list[funcno];
					$.customWin.createNew(customDef,op.target);
				}
				
			},
			
			createNew:function(customDef,target){
				var funcno = customDef.funcno;
				$.customWin.tip[funcno] = "请先完成该窗口相关操作!";
				$.customWin.initDataMap(funcno,customDef.vars);
				setTimeout(function(){$.customWin.loadWin(target,customDef.url,funcno);
					if(typeof(customDef.complete)=="function")
						customDef.complete();
					if(typeof(customDef.allComplete)=="function")
						customDef.allComplete();
				},300);
				
			},
			
			initDataMap:function(funcno,vars){
				var callNum = 0;
				for(var i=0;i<vars.length;i++){
					$.customWin.dataMap[ vars[i].varname.toUpperCase() ] = vars[i].mapname;
					callNum ++;
					if(vars[i].mapname == 'custom'){
						$.customWin.callFunc(vars[i].varname,vars[i].func,function(varname,data){
							$.customWin.setValue(funcno,varname,data);
							callNum--;
						});
					}
				}
			},
			
			loadWin:function( target, url ,funcno){
				
				$.ajax({
					type: "POST",
					url: url,
					dataType: "text",
					success: function( data,textStatus ){ 
						$("<div></div>")
						.attr("id","customWin"+funcno)
						.appendTo($("#"+target))
						.html(data);
					},
					error:function(e){
						$("#"+target).html("窗口加载错误");
					}
				});
			},
			
			refresh:function( funcno, filter ){
				var url = $.customWin.list[ funcno ].url;
				var $win = $("#customWin"+funcno);
				$.customWin.requestURL(url, {}, function(data){
					$win.html(data);
				}, function(e){
					$win.html("窗口刷新错误");
				});
			},
			
			callFunc:function(varname,func,callback){
				if(func == ""){
					callback(varname,"");
					return; 
				}
				//@ 表示变量表达式  只需要本地计算
				if(func.charAt(0) == '@'){
					var v = $.userContext.parser1(func.substring(1));
					var vv = caculator.caculate( v,true );
					if(vv != ""){
						v = vv;
					}
					callback(varname,v);
					return;
					
				}else {
					var funcName = func.split(":")[0];
					var paramsStr = func.split(":")[1];
					var params = $.F.parseParamsToData( paramsStr );
					var funcStr = '{name:"'+funcName+'",params:'+params+'}';
					$.ajax({
						type:"POST",
						data:{funcStr:funcStr},
						datatype:"text",
						url:$.form.options.inputDataURL,
						success:function( data ){
							callback(varname, data );
						},
						error:function( e ){
							$.msgbox.show("err","绑定值时发生错误:"+func);
						}
					});
				}
			},
			
			check:function( funcno ){
				if( typeof( $.customWin.ready[funcno]) != 'function' ){
					$.msgbox.show("err","自定义窗口未指定ready函数,无法进行下一步操作");
					return false;
				}else if( !$.customWin.ready[funcno]( funcno ) ){
					$.msgbox.show("msg",$.customWin.tip[funcno]);
					return false;
				}else {
					return true;
				}
			},
			
			getContextVal:function(varName){
				return $.UC.bindData("#"+varName+"#");
			},
			
			/*以下是提供给自定义窗口内部使用的库函数*/
			getValue:function(varName){
				var rvarName =  $.customWin.dataMap[varName.toUpperCase()];
				if( !rvarName ){
					 alert("未注册该变量"+varName+"的使用.(大小写无区分)");
					 return "";
				}else{
					return $.userContext.bindData( rvarName );
				}
			},
			
			setValue:function(funcno,name,value){
				name = name.toUpperCase();
				var rname = funcno + "-" + name;
				$.customWin.dataMap[name] = "#" + rname + "#";
				$.userContext.userData[rname] = value;
			},
			
			requestURL : function(url,dataMap,succBack,errBack){
				$.ajax({
					type:"POST",
					data:dataMap,
					datatype:"text",
					url:url,
					success:succBack,
					error:errBack
				});
			},
			
			getDatasFromDB : function(sql,succBack,errBack){
				$.customWin.requestURL(
					"common_bindSQLData.action",
					{sql:sql},
					function( data ){
						succBack( eval( data ) );
					},
					errBack
				);
				
			},
			
			getOneDataFromDB : function(sql,succBack,errBack){
				$.customWin.requestURL(
						"common_bindInputData.action",
						{funcStr:"@"+sql},
						
						succBack,
						errBack
				);
			},
			 
			getKeyValsFromDB : function(sql,succBack,errBack){
				$.customWin.requestURL(
						"common_getBindingData.action",
						{sql:sql},
						succBack,
						errBack
				);
			},
			setReady:function(funcno,dosome){
				$.customWin.ready[funcno] = dosome;
			}
			
	}
})(jQuery)