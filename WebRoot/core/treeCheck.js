;(function($){
	$.TK = $.treeCheck = {
			
		options:{
			dataBindURL:"createCheckTree.action",		//绑定数据的url
			definitionURL:$.global.functionDefinitionUrl+"?type=TK1"//获取树定义的url
		},
		
		list:{},//树定义缓存
		runInstance:function(funcno, options){
			var op = $.extend({
				complete:function(){},
				allComplete:function(){},
				target:		 "main"
				},options);
			if(this.list[funcno] == null)
				$.ajax({
					type: "POST",
					url: $.treeCheck.options.definitionURL,
					data: {funcNo:funcno},
					dataType: "json",
					success: function( data,textStatus ){
						var treeDef = data[0];
						treeDef.complete = op.complete;
						treeDef.allComplete = op.allComplete;
						$.treeCheck.list[funcno] = treeDef;
						$.userContext.appendDataType(treeDef.typeMap);
						$.treeCheck.createNew(treeDef,op.target);
					},
					error:function(e){
						//$.msgbox.show("err","树"+funcno+"不存在或存在定义错误：<br>"+e.responseText);
					}
				});
			else {
				var tdef= this.list[funcno];
				$.treeCheck.createNew(tdef,options.target);
			}
		},
		
		createNew:function(treeDef,target){
			/*var userAgent = window.navigator.userAgent.toLowerCase();
	        $.browser.msie8 = $.browser.msie && /msie 8\.0/i.test(userAgent);
	        $.browser.msie7 = $.browser.msie && /msie 7\.0/i.test(userAgent);
	        $.browser.msie6 = !$.browser.msie8 && !$.browser.msie7 && $.browser.msie && /msie 6\.0/i.test(userAgent);*/
	        var $targetWin = $("#" + target);
	       
			var $bDiv = $("<div style='margin-bottom:5px;'></div>");
			var $button1 = $("<a class='button' href='javascript:void(0);' id='"
	        		+treeDef.funcno+"_showcurrent'>获得当前节点</a><br>");
			var $button2 = $("<a class='button' href='javascript:void(0);' id='"
	        		+treeDef.funcno+"_showchecked'>获得选中节点</a>");
			$bDiv.append($button1).append($button2).appendTo($targetWin);
			

	        //创建根节点
			var $div = $("<div id='tree"+ treeDef.funcno +"'></div>")
			.css({width:$targetWin.width(),height:$targetWin.height()-24,overflow:"auto"})
			.appendTo($targetWin);
			
			//获得各层的bindData
			var bindDatas = $.TK.getBindDatas(treeDef.levels);
			
	        var o = {showcheck: true,
	                //onnodeclick:function(item){alert(item.text);},          
	                url: $.TK.options.dataBindURL
	              };
	        o.data = [ {
	              "id" : "root",
	              "text" : "root",
	              "value" : "root",
	              "showcheck" : true,
	              complete : false,
	              "isexpand" : false,
	              "checkstate" : 0,
	              "hasChildren" : true,
	              "level" : -1,
	              "bindDatas" : bindDatas,
	              "funcno" : treeDef.funcno
	        }];                  
	        $div.treeviewNew(o);
	        
	        if(typeof(treeDef.complete)=="function"){
				treeDef.complete();
			}
			treeDef.allComplete();
	        
			$("#"+treeDef.funcno+"_showchecked").click(function(e){
                alert($.TK.getCheckedNodes(treeDef.funcno));
            });
             $("#"+treeDef.funcno+"_showcurrent").click(function(e){
                alert($.TK.getCurrentNode(treeDef.funcno));
             });
	   
		},
		
		getBindDatas:function(levels){
			var bindDatas = "";
			for(var i=0;i<levels.length;i++){
				bindDatas += ("&" + levels[i].bind_data);
			}
			return bindDatas.substring(1);
		},
		
		//将当前点击的某个几点li的键值保存到上下文中
		saveKeyValToContext:function(funcno,key,val,level){
			if(level==-1)//如果是root，直接返回
				return;
			var leveldef = $.TK.list[funcno].levels[level];
			
			var fieldName = funcno+"-"+leveldef.key_name;
			/*var o_key = $.UC.userData[fieldName];//取出原有的key值
			if(o_key!="undefined"){
				o_key = o_key + "," + key;
			}else{
				o_key = key;
			}*/
			$.userContext.setData(fieldName,key);
			
			fieldName = funcno+"-"+leveldef.val_name;
			/*var o_val = $.UC.userData[fieldName];//取出原有的val值
			if(o_val!="undefined"){
				o_val = o_val + "," + val;
			}else{
				o_val = val;
			}*/
			$.userContext.setData(fieldName,val);
			
			$.userContext.setData(funcno+"-currentKey",key);
			$.userContext.setData(funcno+"-currentVal",val);
		},
		
		
		
		//刷新函数
		refresh:function(funcno, filter){
			//清除选中记录
			var $div = $("#tree"+funcno);
			$div.empty();
			var treeDef = $.TK.list[funcno];
			var bindDatas = $.TK.getBindDatas(treeDef.levels);
			
	        var o = {showcheck: true,
	                //onnodeclick:function(item){alert(item.text);},          
	                url: "createCheckTree.action"
	              };
	        o.data = [ {
	              "id" : "root",
	              "text" : "root",
	              "value" : "86",
	              "showcheck" : true,
	              complete : false,
	              "isexpand" : false,
	              "checkstate" : 0,
	              "hasChildren" : true,
	              "level" : -1,
	              "bindDatas" : bindDatas,
	              "funcno" : treeDef.funcno
	        }];                  
	        $div.treeviewNew(o);
		},
		
		//得到选中的值
        getCheckedNodes :function(funcno){
			 var s=$("#tree"+funcno).getCheckedNodes();
             if(s !=null)
            	 return s.join(",");
             else
             	 return "";
		},
		
		//得到当前选中的值
		getCurrentNode :function(funcno){
			 var s=$("#tree"+funcno).getCurrentNode();
             if(s !=null)
                return s.text;
             else
                return "";
		}
		
		
		
	}
	
})(jQuery)