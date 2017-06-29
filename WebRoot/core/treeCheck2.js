;(function($){
	$.AT = $.treeCheck = {
			
		options:{
			dataBindURL:"createCheckTreeData.action",		//绑定数据的url
			definitionURL:$.global.functionDefinitionUrl+"?type=AT"//获取树定义的url
		},
		
		list:{},//树定义缓存
		data:{},//树数据缓存
		setting:{},//树配置缓存
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
						treeDef.funcInMem = op.funcInMem;
						$.treeCheck.createNew(treeDef,op.target);
					},
					error:function(e){
						$.msgbox.show("err","树"+funcno+"不存在或存在定义错误：<br>"+e.responseText);
					}
				});
			else {
				var tdef= this.list[funcno];
				tdef.funcInMem = op.funcInMem;
				$.treeCheck.createNew(tdef,options.target);
			}
		},
		setUCDatabyMem:function(tDef){
			if (tDef.funcInMem==""||typeof(tDef.funcInMem)=="undefined")
				return;
			var ids = tDef.funcInMem.split($.global.DATA_SPLIT_STR);
			var treeObj = $.fn.zTree.getZTreeObj("tree"+tDef.funcno);
			var node;
			$.each(ids,function(i,n){
				if(n!=""){
					node = treeObj.getNodeByParam("id", n);
					if(node){
						treeObj.checkNode(node, true, false);
					}
				}
				
			});
			
		},
		setCheck :function(funcno,val){
			var ids = val.split(";");
			var treeObj = $.fn.zTree.getZTreeObj("tree"+funcno);
			var node;
			$.each(ids,function(i,n){
				if(n!=""){
					node = treeObj.getNodeByParam("id", n);
					if(node){
						treeObj.checkNode(node, true, false);
					}
				}
			});
		},
		setSelect :function(funcno,val){
			var treeObj = $.fn.zTree.getZTreeObj("tree"+funcno);
			var node = treeObj.getNodeByParam("id", val);
			if(node){
				treeObj.selectNode(node);
			}
		},
		genSetting :function(treeDef){
			var onCheck = function(e, treeId, treeNode) {
				var treeObj = $.fn.zTree.getZTreeObj("tree"+treeDef.funcno);
				var nodes = treeObj.getCheckedNodes(true);
				
				if(nodes.length==0){
					return;
				}
				
				if(treeDef.check_type=="B"||treeDef.check_type=="D"){
					var s_count = treeObj.getCheckedNodes(true).length;
					if(s_count>treeDef.check_count){
						treeObj.checkNode(treeNode, false, true);
						return;
					}
				}
				
				var ids = "";
				var names = "";
				$.each(nodes,function(i,n){
					ids += n.id+";";
					names += n.name+";"
				});
				var fieldName = treeDef.funcno+"-CHECKEDID";
				$.userContext.setData(fieldName,ids);
				
				fieldName = treeDef.funcno+"-CHECKEDNAME";
				$.userContext.setData(fieldName,names);
				
			};	
			var zTreeOnClick = function(event, treeId, treeNode) {
			    var id = treeNode.id;
			    var name = treeNode.name;
			    $.userContext.setData(treeDef.funcno+"-currentKey",id);
				$.userContext.setData(treeDef.funcno+"-currentVal",name);
			};
			
			var setting = {
					check: {
						enable: true
					},
					data: {
						simpleData: {
							enable: true
						}
					},
					callback: {
						onCheck: onCheck,
						onClick: zTreeOnClick
					}
			};
			
			// A,C两种类型下只允许选择一个节点，radio型,勾选后不影响父子
			if(treeDef.check_type=="A"||treeDef.check_type=="C"){
				setting = $.extend(setting,{
					check:{
						enable: true,
						chkStyle: "radio",
						radioType: "all",
						chkboxType: { "Y": "", "N": "" }
					}
				});
			}
			
			//B：可以勾选确定个数的叶子节点，勾选后不影响父子
			if(treeDef.check_type=="B"){
				setting = $.extend(setting,{
					check:{
						enable: true,
						chkboxType: { "Y": "", "N": "" }
					}
				});
			}
			
			$.AT.setting[treeDef.funcno] = setting;
			return setting;
		},
		genTree :function(treeDef,setting,$ul){
			if($.AT.data[treeDef.funcno] == null){
				var sql = $.AT.genSql(treeDef);
				$.ajax({
					type: "POST",
					url: $.treeCheck.options.dataBindURL,
					data: {sql:sql,
						   levelToExpand:treeDef.expand_level,
						   checkType:treeDef.check_type,
						   code:treeDef.code,
						   name:treeDef.name,
						   f1_key:treeDef.f1_name,
						   f2_key:treeDef.f2_name,
						   f3_key:treeDef.f3_name,
						   f4_key:treeDef.f4_name,
						   f5_key:treeDef.f5_name
						   },
					dataType: "text",
					success: function( data,textStatus ){
						var zNodes =eval(data);
						if(treeDef.buffer_data){
							$.treeCheck.data[treeDef.funcno] = zNodes;
						}
						$.fn.zTree.init($ul, setting, zNodes);
						
						var fieldName = treeDef.funcno+"-CHECKEDID";
						var val = $.userContext.userData[fieldName];
						if(val){
							$.AT.setCheck(treeDef.funcno,val);
						}
						
						fieldName = treeDef.funcno+"-CURRENTKEY";
						var val = $.userContext.userData[fieldName];
						if(val){
							$.AT.setSelect(treeDef.funcno,val);
						}
						
						if(typeof(treeDef.complete)=="function"){
								treeDef.complete();
						}
					    treeDef.allComplete();
						$.AT.setUCDatabyMem(treeDef);//设置传入的值勾选节点
					},
					error:function(e){
						$.msgbox.show("err","树"+treeDef.funcno+"数据不存在或存在定义错误：<br>"+e.resoponseText);
					}
				});
			}else{
				var zNodes = $.treeCheck.data[treeDef.funcno];
				$.fn.zTree.init($ul, setting, zNodes);
				
				var fieldName = treeDef.funcno+"-CHECKEDID";
				var val = $.userContext.userData[fieldName];
				if(val){
					$.AT.setCheck(treeDef.funcno,val);
				}
				
				fieldName = treeDef.funcno+"-CURRENTKEY";
				var val = $.userContext.userData[fieldName];
				if(val){
					$.AT.setSelect(treeDef.funcno,val);
				}
				
				if(typeof(treeDef.complete)=="function"){
						treeDef.complete();
				}
			    treeDef.allComplete();
				$.AT.setUCDatabyMem(treeDef);//设置传入的值勾选节点
			}
		},
		createNew:function(treeDef,target){
	        var $targetWin = $("#" + target);
	       
	        //创建根节点
			var $ul = $("<ul id='tree"+ treeDef.funcno +"' class='ztree'></ul>")
			.css({width:$targetWin.width(),height:$targetWin.height(),overflow:"auto"})
			.appendTo($targetWin);
			
			var setting = $.AT.genSetting(treeDef);
			$.AT.genTree(treeDef,setting,$ul);
		},
		
		check:function(funcno){
			return true;
		},
			
		genSql:function(treeDef){
			var sql = "select * from "+treeDef.tree_name+" order by ";
			if(treeDef.f1_name){
				sql += treeDef.f1_name;
				if(treeDef.f2_name){
					sql += ","+treeDef.f1_name;
					if(treeDef.f3_name){
						sql += ","+treeDef.f3_name;
						if(treeDef.f4_name){
							sql += ","+treeDef.f4_name;
							if(treeDef.f5_name){
								sql += ","+treeDef.f5_name;
							}
						}
					}
				}
			}
			return sql;
		},
		
		//刷新函数
		refresh:function(funcno, filter){
			var $ul = $("#tree"+funcno);
			$ul.empty();
			var treeDef = $.AT.list[funcno];
			var setting = $.AT.setting[funcno];
			$.AT.genTree(treeDef,setting,$ul);
		},
		
		//重绘函数
		resizeWin:function(funcno,left,top,width,height){
			//$("#treeWBody"+funcno).css("width",width);
			//$("#treeWBody"+funcno).css("height",height);
		},
		
		//生成选中checkBox的id
		genFuncDatainMem:function(funcno){
			var treeObj = $.fn.zTree.getZTreeObj("tree"+funcno);
			var nodes = treeObj.getCheckedNodes(true);
			var value = "";
			$.each(nodes,function(i,n){
				value += (n.id+$.global.DATA_SPLIT_STR);
			});
			return value;
		}
	}
	
})(jQuery)