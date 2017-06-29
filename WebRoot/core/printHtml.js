/*
 * 用于打印html内容
 * @author:zhanghao
 */
	String.prototype.replaceAll  = function(s1,s2){    
		return this.replace(new RegExp(s1,"gm"),s2);    
	} 

	function init(){
		var oEditor = FCKeditorAPI.GetInstance('text');
		oEditor.EditorDocument.body.contentEditable = false; //将fckeditor对象设为只读
	}
	
	function doReplace(){
		var oEditor = FCKeditorAPI.GetInstance('text');      
		var text = oEditor.GetXHTML(true);
		text = text.replaceAll(document.getElementById("type").value, document.getElementById("content").value);
		//text = text.replaceAll("##", "2003年11月9-11日");
		oEditor.SetHTML(text);
	}
	function disableFck(){
		var oEditor = FCKeditorAPI.GetInstance('text');
		oEditor.EditorDocument.body.contentEditable = false; //将fckeditor对象设为只读
		//oEditor.EditorWindow.parent.document.getElementById('xExpanded').style.display = 'none';    
		//oEditor.EditorWindow.parent.document.getElementById('xCollapsed').style.display = 'none';
	}
	function undisableFck(){
		var oEditor = FCKeditorAPI.GetInstance('text');
		oEditor.EditorDocument.body.contentEditable = true; //将fckeditor对象设为只读
		oEditor.EditorWindow.parent.document.getElementById('xExpanded').style.display = 'block';    
		oEditor.EditorWindow.parent.document.getElementById('xCollapsed').style.display = 'block';
	}

;(function($){
	
	$.P = $.printHtml = {
		options:{
			printParamURL:$.global.functionDefinitionUrl+"?type=P"
		},
	
		list:{},
		runInstance:function(funcNo,options){
			var op = $.extend({
						complete:function(){},
						printComplete:function(){},	
						target:		 "main"
						},options);
			this.funcNo=funcNo;
			if(this.list[funcNo] == null){
				$.ajax({
					type: "POST",
					url:  $.printHtml.options.printParamURL,
					data: {funcNo:funcNo},
					dataType: "json",
					success: function( data,textStatus ){
						var printDef = data[0];
						printDef.target = op.target;
						printDef.complete = op.complete;
						$.printHtml.list[funcNo] = printDef;
						// initcond 传来的参数仅一次有效
						if (op.initcond) 
							printDef.initcond = op.initcond;
						$.printHtml.createNew( printDef,op.target );
						if(typeof(op.complete) == "function"){
							op.complete();
						}
						op.printComplete();
					},
					error:function(e){
						alert(e.responseText);
						//$.msgbox.show("err","状态码:"+XMLHttpRequest.readyState+"<br>"+"textStatus:"+textStatus+"<br>errorThrown:"+errorThrown);
					}
				});
			}else{
				var printDef = this.list[funcNo];
				// initcond 传来的参数仅一次有效
				if (op.initcond) 
					printDef.initcond = op.initcond;
				this.createNew( printDef,  op.target, op.editable );
				if(typeof(op.complete) == "function"){
					op.complete();
				}
				op.printComplete();
			}
			return this;
		},
		createNew:function(printDef,target){
			var funcno = printDef.funcno;
			//通过正则表达式截取出要打印的<div>..</div>
			var printHtml = this.getPrintContent(printDef);
			var used_vars = printDef.used_vars;
			var bindSql = printDef.bindSql;
			var editable = printDef.editable;
			//做上下文变量替换
			this.parserContent(printHtml,used_vars,bindSql,function(printHtml){
				//添加到主窗口中
				$.P.drawNew(funcno,target,printHtml,editable);
			}, printDef.initcond);
		},
		refresh:function(funcno,filter){
			var printDef = $.printHtml.list[funcno];
			$.P.createNew( printDef,  printDef.target );
		},
		getPrintContent:function(printDef){
			var reg = /<body>.*<\/body>/;			//匹配html中body内div的内容
			var result = reg.exec(printDef.content);
			return result==null?"":result[0];
		},
		replaceContext:function(content,key,value){
			var reg = new RegExp(key, "g");			//匹配html中body内div的内容
			return content.replace(reg,value);
		},
		parserContent:function(content,vars,bindSql,dataComp, initCond){
			//从上下文环境中替换变量
			var replaceFromContext = function(content,varSet,vMap){
				var result = content;
				for(var i=0;i<varSet.length;i++){
					var key = varSet[i].split("#");
					var value="";
				
					if(vMap){
						if(typeof(vMap[getColName(varSet[i])])=="undefined"){
							value = $.userContext.userData[key[1].toUpperCase()];
						}else{
							value = vMap[getColName(varSet[i])];
						}
					}else{
						value = $.userContext.userData[key[1].toUpperCase()];
					}
					result = $.P.replaceContext(result,varSet[i],value);
				}
				return result;
			};
			
			var getColName = function(oneVar){
				var key =  oneVar.split("#");
				var key1 = key[1].split("-");
				var key2 = key1[1].split(".");
				var colName;
				if(key2.length==2)
					colName = key2[1];
				else
					colName = key2[0];
				return colName.toUpperCase();
			};
			
			if(!vars||vars==""){
				return dataComp(content);
			}
			var varSet = vars.split(";");
			var vmap={}
			var result;
			if(!bindSql||bindSql==""){
				result = replaceFromContext(content,varSet,vmap);
				dataComp(result);
			}else{
				// 如果有条件传入，则替换条件变量
	            if (initCond && initCond != "") {  
	        		var sql_seg = bindSql.split("#");

	        		var paramList = initCond.split(";");
	            	for (var i = 0; i < paramList.length; i++) {
	            		var param = paramList[i];
	            		var param_core = param.replaceAll('#', '').split("-")[1];
	            		for (var j = 1; j < sql_seg.length; j+=2) {  // 找sql语句中的变量
	            			if (sql_seg[j].match(param_core))
	            				sql_seg[j] = param.replaceAll('#', '');
	            		}
	            	}
	            	bindSql = sql_seg.join("#");
	            }
	            /////////////
	            
	            $.C.getDatasFromDB($.UC.parser(bindSql), function(datas) {
					var data;
					if (datas.length == 1) {
						data = datas[0];
						if (!data)
							return;
						for ( var i = 0; i < varSet.length; i++) {
							var colName = getColName(varSet[i]);
							//取出了 变量名的表名点字段名 比如 #100-u.name# 取出 name
						vmap[colName] = data[colName];
						}
					} else if(datas.length>1){
						for ( var i = 0; i < varSet.length; i++) {
							var colName = getColName(varSet[i]);
							//取出了 变量名的表名点字段名 比如 #100-u.name# 取出 name
							var val = "<div style='float:left'>";
							if(typeof(datas[0][colName])!="undefined"){//只計入sql查出的字段
								for ( var j = 0; j < datas.length; j++) {
									val += datas[j][colName] + "<br>";
								}
								val +="</div>";
								vmap[colName] = val;
							}
						}
					} else
						return;
					result = replaceFromContext(content, varSet, vmap);  // 这个方法暂时没看懂 by wyj  2013-9-2
					dataComp(result);
				});	
			}
		},
		drawNew:function(funcno,target,html,editable){
			
			if(html==null||html==""){
				return;
			}
			
			var len = html.length;
			var divContent = html.substring(6,len-7);//<body> </body>
			
			var $printDiv = $("<div id='"+funcno+"_div_print'></div>");//只打印id为div_print的div内的内容
			$("#"+target).append($printDiv);
			
			$printDiv.html(divContent);
			
			//设置checkbox
			var divHtml = this.getHtmlAfterCheckbox($printDiv);
			
			//加载FCK编辑框
			var $input = $("<input id='"+funcno+"_printText' name='printText' type='hidden' />");
			$input.attr("value",divHtml);
			var h1 = $("#"+target).height();
			var $div = $("<div id='"+funcno+"_div' style='height:"+h1+"px;width:100%;position:absolute;z-index:10;background:transparent;'></div>");
			
			$("#"+target).empty().append( $div );
			var width = $div.width()-20;
			var height = $div.height()-30;
			var $textArea = $("<textarea id='"+funcno+"_TA' name='"+funcno+"_TA'></textarea>");
			$textArea.val(divHtml);
			$div.append($textArea);
			
			var oFCKeditor = new FCKeditor(funcno+"_TA");
			oFCKeditor.BasePath = "./fckeditor/";
			oFCKeditor.Height = $div.height();
			oFCKeditor.ReplaceTextarea();
			
			if(editable=='N'||editable=='n'){
				$("#"+target).append("<div style='position:absolute;height:"+height+"px;width:"+width+"px;margin-top:28px;z-index:20;background:gray;filter:alpha(opacity=20);opacity:0.2;'></div>")
			}
		},
		getHtmlAfterCheckbox:function($target){
			$.each($target.find(":checkbox"),function(index,value){
				var value = $(this).attr("value");
				if(value!=""&&value!=null){
					var set = value.split(";");
					var cond = set[1].split(":");
					if(set[0]==cond[0])
						this.checked=true;
					}
				});
			return $target.html();
		}
	};
})(jQuery)