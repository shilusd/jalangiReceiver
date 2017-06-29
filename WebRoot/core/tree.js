/**一颗树的html构造如下：
* <ul root = 'root'>
*	<li val='key' onclick = "expand" ><span onclick = "clickItem">value</span>
* 		<ul>
* 			<li val='key'><span onclick="clickItem">value</span></li>
* 			<li val='key'><span onclick="clickItem">value</span></li>
* 			...
* 		</ul>
* 	</li>
* 	<li val='key'> ...</li>
*   <li val='key'> ...</li>
*  ...
* </ul>
* @author zyz
* @dependence :jquery.js;treeview.js;page.js;userContext.js
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
;(function($){
	/*注：代码中$开头的变量均为jquery对象，如$li,$ul等。其他为一般对象或变量 */
	$.T = $.tree = {
			
		options:{
			dataBindURL:"common_getBindingData.action",			//绑定数据的url
			treeDataBindURL:"getTreeNodeInfoAction.action",			//绑定数据的url
			definitionURL:$.global.functionDefinitionUrl+"?type=T"//获取树定义的url
		},
		
		list:{},//树定义缓存
		lastNode:{},//上一次选中的节点
		lastLevels:{},//上一次点击的层item集合
		runInstance:function(funcno, options){
			var op = $.extend({
				complete:function(){},
				allComplete:function(){},
				target:		 "main"
				
				},options);
			if(this.list[funcno] == null)
				$.ajax({
					type: "POST",
					url: $.tree.options.definitionURL,
					data: {funcNo:funcno},
					dataType: "json",
					success: function( data,textStatus ){
						var treeDef = data[0];
						treeDef.complete = op.complete;
						treeDef.allComplete = op.allComplete;
						$.appendScript(funcno,treeDef.script);
						$.tree.list[funcno] = treeDef;
						$.userContext.appendDataType(treeDef.typeMap);
						$.tree.createNew(treeDef,op.target);
					},
					error:function(e){
						//$.msgbox.show("err","树"+funcno+"不存在或存在定义错误：<br>"+e.responseText);
					}
				});
			else {
				var tdef= this.list[funcno] 
				$.tree.createNew(tdef,options.target);
			}
		},
		
		createNew:function(treeDef,target){
			var $targetWin = $("#" + target);
			
			//创建树头部，标识当前选中的树节点
			if(treeDef.showpath)
				$("<div>当前选中:无</div>")
					.attr("id","selTag"+treeDef.funcno)
					.css("padding","3px")
					.addClass("ui-state-default")
					.appendTo($targetWin);
			
			//创建根节点
			var $div = $("<div></div>")
			.css({width:$targetWin.width(),height:$targetWin.height()-24,overflow:"auto"})
			.appendTo($targetWin);
//			.click(function(event){
//				event.stopPropagation();
//			});
			var $ul = $("<ul root='root' id='tree" + treeDef.funcno + "'></ul>").appendTo($div);
			
			//定义数据绑定回调函数
			var afterBindData = function(){
				$.tree.doNodes(treeDef,0,$ul);
				//调用插件构造菜单树，并标记该层数据已绑定
				$ul.treeview({
					animated:treeDef.exp_speed,
					unique:treeDef.exp_unique,
					collapsed: true
				}).attr("binded","binded");	//标记
				
				// 首个li点一下自动展开
				//$ul.find(">li:first>span").click();
				
				if(typeof(treeDef.complete)=="function"){
					treeDef.complete();
				}
				treeDef.allComplete();
				
			}
			//绑定第一层数据
			
			this.bindData(treeDef.levels[0],$ul, afterBindData);
		},
		/*
		 * 将li整理成ul/li，并且配上图标
		*/
		doNodes:function(treeDef,level,$ul){
			//为ul绑定后的所有li节点及span绑定点击事件处理函数
			if(treeDef.folder_icon)
			    $ul.addClass("filetree");
			
			var $li = $ul.find(">li");
			
			for(var i=0;i<$li.size();i++){
				var cnt=$($li[i]).attr("sub_cnt");
				if ((cnt==undefined || cnt!=0)&&level!=treeDef.leaf_level)
					$($li[i]).append("<ul style='background-color:transparent'></ul>")
					.find(">span")
					.addClass("folder");
				else{
					$($li[i]).css("cursor","pointer")
					.prepend("<span style='float:left' class='ui-icon "+treeDef.leaf_icon+"'></span>")
					.attr("binded","binded");
				}
			}
				
			$li.click(function(event){
				
				if((event.target == this.firstChild)
					|| (event.target == this.firstChild.nextSibling)
				){
					$.tree.expand(treeDef.funcno, $(this));
					$.tree.clickItem(treeDef.funcno,$(this).find(">span"));
				}
			});
//			$li.find(">span").click(function(event){
//				var $hitarea = $(this).parent().find("div.hitarea");
//				if ($hitarea.length > 0) {
//					$hitarea.click();
//				}
//				else {
//					$.tree.clickItem(treeDef.funcno,$(this));
//				};
//				event.stopPropagation();
//				
//			});
//			.click(function(event){
//				//if(event.target == this){
//				//	$.tree.clickItem(treeDef.funcno,$(this));
//				//}
//			});
		},
		/*
		 * 节点数据绑定函数
		 * @bind_data 绑定的数据，可以是@sql，也可以是键值对字符串
		 * @$ul 要绑定数据的根节点
		 * @afterBindData 数据绑定完毕后的回调处理函数，内容由调用端指定
		 * **/	
		bindData:function(level,$ul,afterBindData){
			
				afterBindData = afterBindData?afterBindData:function(){};
				var bind_data=level.bind_data;
				var next_node_cnt=level.next_node_cnt;
				
				if (bind_data.charAt(0) == '@'&&next_node_cnt != ''){
					var bind_sql=$.userContext.parser(bind_data.substring(1));
					var cnt_sql=$.userContext.parser(next_node_cnt);
					$.ajax({
							type:"POST",
							url:$.tree.options.treeDataBindURL,
							data:{sql:bind_sql,cnt:cnt_sql},
							dataType:"text",
							success:function(kvcStr){
								/*kvcStr 是由后台加工好的键值对字符串，格式：key1:val1:cnt1;key2:val2:cnt2;...
								 *后台加工逻辑 参看 wingsoft.core.action.CommonAction 类 getBindingData方法*/
								if(kvcStr == ""){
									afterBindData();
									return;
								}
								var lis = $.tree.createSubLis(kvcStr);
								$ul.append(lis);
								afterBindData();
							},
							error:function(e){
								$.msgbox.show("err","菜单树在绑定数据时发生了错误");
							}
						})
				} 
				else{
					if(bind_data.charAt(0) == '@'){
						//替换sql中的变量值
						var bind_sql = $.userContext.parser(bind_data.substring(1));
						
						$.ajax({
							type:"POST",
							url:$.tree.options.dataBindURL,
							data:{sql:bind_sql},
							dataType:"text",
							success:function(kvStr){
								/*kvStr 是由后台加工好的键值对字符串，格式：key1:val1;key2:val2;...
								 *后台加工逻辑 参看 wingsoft.core.action.CommonAction 类 getBindingData方法*/
								if(kvStr == ""){
									afterBindData();
									return;
								}
								var lis = $.tree.createSubLis(kvStr);
								$ul.append(lis);
								afterBindData();
							},
							error:function(e){
								$.msgbox.show("err","菜单树在绑定数据时发生了错误");
							}
						})
					//键值对直接绑定
					}else{
						var lis = $.tree.createSubLis(bind_data);
						$ul.append($(lis));
						afterBindData();
					}
				}
		},
		
		/*
		 * 根据键值对字符串创建li节点
		 * @keyvaluesStr 键值对字符串
		 * 格式：key1:val1;key2:val2;...
		 * **/
		createSubLis: function(keyvaluestr){
			
			var key_vals = keyvaluestr.split(";");
			var lis = "";
			var key_val;
			var sub_cnt = "";
			for(var i=0;i<key_vals.length;i++){
				sub_cnt="";
				key_val = key_vals[i].split(":")
				if (key_val.length>=3)
					sub_cnt=" sub_cnt='"+key_val[2]+"'";
				lis += "<li style='cursor:pointer'  val='"+key_val[0]+"'"+sub_cnt+"><span>"+key_val[1]+"</span>" + "</li>";
			}
			return lis;
		},
		
		/*
		 * li节点展开处理函数
		 * @funcno 被展开节点所属的功能号
		 * @$li 当前要展开的li节点
		 * **/
		expand:function(funcno, $li){
			
			var treeDef = $.tree.list[funcno];
			if( treeDef.leaf_level == 0 )
				return;
			
			var currLevel = $.tree.getLevel($li)
			var subLevel = currLevel + 1;
			var subLevelDef = treeDef.levels[subLevel];
			
			//保存点击该节点产生的键值变量值
			this.saveKeyValToContext(funcno, $li, treeDef.levels[currLevel]);
			
			//若该节点已经绑定下层节点值，则直接返回
			var expanded=$li.attr("expanded");
			if (expanded==undefined||expanded=="false")
				expanded=false
			else
				expanded=true;
			
			expanded = !expanded;
				
			$li.attr("expanded",expanded);

			$li.find(">ul").css("display", expanded?"block":"none");
			
			if ($li.hasClass("expandable") && expanded) {
				$li.removeClass("expandable").addClass("collapsable");
				$li.find(">div").removeClass("expandable-hitarea").addClass("collapsable-hitarea");
			};
			if ($li.hasClass("collapsable") && !expanded) {
				$li.removeClass("collapsable").addClass("expandable");
				$li.find(">div").removeClass("collapsable-hitarea").addClass("expandable-hitarea");
			};

			if($li.attr("binded") == "binded")
				return;
			
			$li.block({message:"<p class='ui-state-active'>展开中...</p>"})
			//获得绑定位置并绑定子菜单数据
			$ul = $li.find(">ul");
			this.bindData(treeDef.levels[subLevel], $ul, function(){
				//若展开的这一层是叶子层
				$.tree.doNodes(treeDef,subLevel,$ul)
				$li.attr("binded","binded");
				//添加到树中
				$("#tree" + funcno).treeview({
					add:$ul
				});
				$li.unblock();
			});
		},
		
		//将当前点击的某个几点li的键值保存到上下文中
		saveKeyValToContext:function(funcno,$li,leveldef){
			var key = $li.attr("val");
			var val = $li.find(">span").text();
			var fieldName = funcno+"-"+leveldef.key_name;
			$.userContext.setData(fieldName,key);
			fieldName = funcno+"-"+leveldef.val_name;
			$.userContext.setData(fieldName,val);
			
			$.userContext.setData(funcno+"-currentKey",key);
			$.userContext.setData(funcno+"-currentVal",val);
		},
		
		//寻找节点所在层号 
		getLevel:function($li){
			var $p = $li.parent();
			var level = 0;	
			while($p.attr("root") == null){
				level++;
				$p = $p.parent().parent();
			}
			return level;
		},
		
		//获得点击节点的路径文本
		getPathText:function($item){
			var $p = $item.parent().parent();
			var pText = $item.parent().find(">span").text();
			while($p.attr("root") == null){
				$item = $p.prev();
				pText = $item.text() + " > " + pText;
				$p = $p.parent().parent();
			}
			return "当前选中:"+pText;
		},
		
		// 菜单节点span点击处理函数
		clickItem:function(funcno,$item){
			var $li = $item.parent();
			var level = this.getLevel($li);
			
			//保存当前上下文
			this.saveKeyValToContext(funcno, $li, $.tree.list[funcno].levels[level]);
			
			//高亮显示选中的节点
			var lastItem = $.T.lastNode[funcno];
			if(lastItem)
				lastItem.removeClass("ui-state-active");
			$item.addClass("ui-state-active");
			$.T.lastNode[funcno] = $item;
			           
			//标记当前点击层
			var pText = this.getPathText($item);
			$("#selTag"+funcno).text(pText);
			this.lastLevels[funcno] = level+"";
			
			//将当前点击的节点所在层号保存在上下文中
			$.userContext.setData(funcno+"-level",level);
			
			//触发动作
			$.page.triggerBy(funcno);
			
			$.tree.itemClicked($item,$.tree.list[funcno].levels[level].jscontent);
		},
		itemClicked:function($item,jscontent){
			if(jscontent!=""){
				eval(jscontent);
			}
			
		},
		check:function(funcno){
			if(!$.tree.lastLevels[funcno]){
				$.msgbox.show("msg","请先选择菜单项");
				return false;
			}else {
				return true;
			}
		},
		
		//刷新函数
		refresh:function(funcno, filter){
			
			//清除选中记录
			$.tree.lastLevels[funcno] = null;
			$("#selTag"+funcno).text("当前选中:无");
			var treeDef = $.tree.list[funcno];
			$ul = $("#tree"+funcno).empty();
			var afterBindData = function(){
				$.tree.doNodes(treeDef,0,$ul);
				
				//调用插件构造菜单树，并标记该层数据已绑定
				$ul.treeview({ 
					add:$ul
				})	//标记
			}
			//绑定第一层数据
			$.tree.bindData(treeDef.levels[0],$ul, afterBindData);
		},		
		resizeWin: function(funcno, left,top,width,height) {
			var $treediv = $("#tree"+funcno).parent();
			$treediv.width(width-1).height(height -1 - $("#selTag"+funcno).height());
		}
		
	}
	
})(jQuery)