;(function($){
	$.MB = $.messageBox = {
		options:{
				messageBoxURL:  $.global.functionDefinitionUrl+"?type=MB"
			},
		list:{},
		dataMap:{},
		runInstance:function(funcno,options){
			var op = $.extend({
				complete:function(){},
				target:"main"
				},options);
			if($.MB.list[funcno] == null){
				$.ajax({
					type: "POST",
					url:  $.MB.options.messageBoxURL,
					data: {funcNo: funcno},
					dataType: "json",
					success:  function( data,textStatus ){
						var MBDef = data[0];
						MBDef.complete = op.complete;
						MBDef.target = op.target;
						$.MB.list[funcno] = MBDef;
						$.MB.createNew(MBDef,op.target);
					},
					error:function(e){
						alert(e.message);
					}
				});
			}else{
				var MBDef = $.MB.list[funcno];
				$.MB.createNew(MBDef,op.target);
			}
				
		},
		createNew:function(MBDef,target){
			var funcno = MBDef.funcno;
			var used_vars = MBDef.used_vars;
			var show_cond = MBDef.show_cond;
			if(show_cond.charAt(0)=="@"){//显示条件为存储过程
				var cmd = $.page.btn.generateCmd("", eval(show_cond.substring(1)));
				$.page.btn.call_proc( cmd, function( msg ) {
					if(msg.substr(0,4)=="false"){
						var winno = $.page.idFunc.funcno2winno(funcno);
						$("#win"+winno).remove();
						return;
					}
				});
			}else if(!condTester.ifCondition($.userContext.parser1(show_cond))){ //若未达到显示条件，直接返回
				var winno = $.page.idFunc.funcno2winno(funcno);
				$("#win"+winno).remove();
				return;
			}
			var html = MBDef.html;
			//做上下文变量替换
			
			this.initDataMap(funcno,MBDef.vars,html,used_vars,target);
			
			/* this.parserContent(html,used_vars,function(html){
				添加到主窗口中				$.MB.drawNew(funcno,target,html);
				if(typeof($.MB.list[funcno].complete) == "function")
					$.MB.list[funcno].complete();
			});*/
			
		},
		initDataMap:function(funcno,vars,html,used_vars,target){
			var tag = {};
			var checkIfAllReady = function(tags,vars){
				for(var i=0;i<vars.length;i++){
					if(!tags[vars[i].varname])
						return;
				}
				$.MB.parserContent(html,used_vars,function(html){
					//添加到主窗口中
				$.MB.drawNew(funcno,target,html);
				if(typeof($.MB.list[funcno].complete) == "function")
					$.MB.list[funcno].complete();
				});
			}
			var MBDef = $.MB.list[funcno];
			if(vars.length==0){
				$.MB.parserContent(html,used_vars,function(html){
					//添加到主窗口中
				$.MB.drawNew(funcno,target,html);
				if(typeof($.MB.list[funcno].complete) == "function")
					$.MB.list[funcno].complete();
				});
			}else{
				for(var i=0;i<vars.length;i++){
					tag[vars[i].varname]=false;
				}
				for(var i=0;i<vars.length;i++){
					$.MB.dataMap[ vars[i].varname.toUpperCase() ] = vars[i].mapname;
					if(vars[i].mapname == 'message'){
						$.MB.callFunc(vars[i].varname,vars[i].func,function(varname,data){
							$.MB.setValue(funcno,varname,data);
							tag[varname]=true;
							checkIfAllReady(tag,vars);
						});
					}
				}
			}
			
		},
		callFunc:function(varname,func,callback){
			if(func == ""){
				callback(varname,"");
				return; 
			}
			
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
		setValue:function(funcno,name,value){
			name = name.toUpperCase();
			var rname = funcno + "-" + name;
			$.MB.dataMap[name] = "#" + rname + "#";
			$.userContext.userData[rname] = value;
		},
		refresh:function(funcno,filter){
			var MBDef = $.MB.list[funcno];
			$.MB.createNew(MBDef,MBDef.target);
		},
		parserContent:function(content,vars,dataComp){
			//从上下文环境中替换变量
			var replaceFromContext = function(content,varSet){
				var result = content;
				for(var i=0;i<varSet.length;i++){
					var key = varSet[i].split("#");
					var value="";
					value = $.userContext.userData[key[1].toUpperCase()];
					result = replaceContext(result,varSet[i],value);
				}
				return result;
			};
			
			var replaceContext = function(content,key,value){
				var reg = new RegExp(key, "g");			
				return content.replace(reg,value);
			};
			
			if(!vars||vars==""){
				return dataComp(content);
			}
			var varSet = vars.split(";");
			var result = replaceFromContext(content,varSet);
			dataComp(result);
		},
		drawNew:function(funcno,target,html){
			if(html==null||html==""){
				return;
			}
			
			var len = html.length;
			var divContent = html.substring(6,len-7);//<body> </body>
			
			var $MBDiv = $("<div id='"+funcno+"_div'></div>");
			$MBDiv.html(divContent);
			$("#"+target).empty().append($MBDiv);
		}
	}
})(jQuery)