$(document).ready(function(){
	$(document).keypress(function(e){
		if(e.which == 13){
			e.which = 9;
			//return false;
		}
	});
	
	//加载菜单
	$.ajax({
		type:"POST",
		dataType:"text",
		url:"loadRolesMenu.action",
		success:function(menuHtml){
			var leftMenuToggle = function() {  // 处理左侧菜单的缩进
				var $move=$("#menuHideBtn");
				var $leftMenu=$("#leftMenu");
				var $roleuser=$("#userWelcome");
				var $main=$("#main");
				var menuMargin=$.page.leftMenuHideMargin;
				var animating;
				function animateFin(doAlign){
					if (!animating)
						return;
					animating=false;
					$.page.winSize.doWinsAlign("main");
				}
				$move.toggle(function(){
					if (animating)
						return;
					animating=true;
					$(this).attr("src","img/right.png");
					$leftMenu.animate({"margin-left":"-"+menuMargin+"px"},500);
					$roleuser.animate({"margin-left":"-"+menuMargin+"px"},500);
					$main.animate({"left":$.getCSSNum($main,"left")-menuMargin+"px",
									"width":$.getCSSNum($main,"width")+menuMargin+"px"},500
									,undefined,animateFin);
					$roleuser.parent().css("width","20px");
					$main.attr("lmHidden", "true");
					
				},function(){
					if (animating)
						return;
					animating=true;
					$(this).attr("src","img/left.png");
					$main.animate({"left":$.getCSSNum($main,"left")+menuMargin+"px",
									"width":$.getCSSNum($main,"width")-menuMargin+"px"},500);
					$leftMenu.animate({"margin-left":"0px"},500);
					$roleuser.animate({"margin-left":"0px"},500);
					$roleuser.parent().animate({"width":"200px"},500,undefined,animateFin);
					$main.attr("lmHidden", "false");
				});

			}
			
			//添加菜单
			$("#menuTree").hide().append(menuHtml).css("float","left");
			
			//加载用户登录信息，保存至上下文
			var userContext = $("#userContext").val().replace(/\_\@/g,"\"");
			//alert(userContext);
			var uc = eval(userContext);
			$.userContext.userData = uc[0];
			
			//设置窗口模式 
			var winModel = uc[0]["WINMODEL"];
			$.page.multiWin = $.userContext.userData["MULTIWIN"]; 
			$.page.menuLeft = $.userContext.userData["MENULEFT"]; 
			 
			$.page.leftSpace = ($.page.menuLeft == "T")?185:5;
			$.page.leftMenuHideMargin = 160;
			
			if ($.page.menuLeft == "T") {
				leftMenuToggle();
			}
			else {
				$("#userWelcome").css("display", "none");
			}

// toolbar的刷新没用了 2014-5-7			
//			if ($.page.multiWin=="F"){
//				$("#toolbar").append($.button.createIcon({
//					caption:"刷新",
//					icon:"ui-icon-refresh",
//					pos:"right",
//					script:"$.page.openExternal($.page.currPage,'')"
//				})).addClass("ui-state-default")
//			}
			if(winModel == "indep"){  // by wyj 表示不在WFManager中
				_shiftX = 0;
				_shiftY = 0;  // // 控制窗体偏移的职责不复存在。main直接偏移 ($.page.topSpace). 
				if ($.page.multiWin == 'F'){
					$.page.topSpace = $.getElementHeight("divTitle",0) + 105; // 以后要把多窗口的bar移到main外面的时候 ，再改  //wyj 2013-6-8   //
					                                                    // 105= banner高度+菜单高度+缝隙
					//_shiftY = 75; 
				} else {
					$.page.topSpace = $.getElementHeight("divTitle",0) + 105;
					//_shiftY = 125;
				}
			}else{  /// 在WFManager
				_shiftX = 0;
				_shiftY = 0;  // // 控制窗体偏移的职责不复存在。main直接偏移 ($.page.topSpace). 
				$.page.topSpace = $.getElementHeight("divTitle",0)+36;
			}
			//微调
			if ($.page.menuLeft == "F") {
				$.page.topSpace += 6;
			}
			
			//加载系统初始变量定义
			$.ajax({
				type:"POST",
				dataType:"json",
				url:"loadInitFunction.action",
				success:function( initFs ){
					var vars = initFs[0].vars;
					var tags = {};//记录自定义变量就绪与否的对象。
					var checkIfAllReady = function(tags,vars){
						var data = {};
						for(var i=0;i<vars.length;i++){
							if(!tags[vars[i].varname])
								return;
							data["0-"+vars[i].varname]=$.UC.bindData("#0-"+vars[i].varname+"#");
						}
						$.ajax({
							type:"POST",
							dataType:"json",
							url:"setCustomSession.action",
							data:{data:JSON.stringify(data)}
						});
					}
					for(var i = 0;i<vars.length;i++){
						tags[vars[i].varname]=false;
					}
					for(var i=0;i<vars.length;i++){
						if (vars[i].func[0]!='@' && vars[i].func.indexOf(':')<=0)//直接一个常量，比如msLeft
							$.UC.setData("0-"+vars[i].varname,vars[i].func);
						else{
							$.customWin.callFunc(vars[i].varname,vars[i].func,function(varname,data){
								$.UC.setData("0-"+varname,data);
								tags[varname]=true;
								checkIfAllReady(tags,vars);
							});
							$.UC.dataType[vars[i].varname.toUpperCase()] = vars[i].type;	
						}
					}
					
				},
				error:function(){
					if ($.page.menuLeft != "T")
						$("#menuTree").show();
				}
			});
			
			var bodyH = $.getBodyHeight($.page.topSpace + (winModel == "indep"? 48: 0)); 
			if ($.page.menuLeft == "T"){
				$("#leftMenu").css({"height": bodyH -60 + "px"});
												 // 补偿用户名div的高度
			}
			$("#main").css({
				"position":"absolute",
				"top": $.page.topSpace + "px",
				"left": $.page.leftSpace +"px",
				"width": $.getBrowserWidth()- $.page.leftSpace + "px",
				"height": bodyH + "px",
				"overflow":"auto",
				"float":"none"
			});	
			$("#main").attr("lmHidden", "false"); // 初始左侧菜单为显示（不隐藏）
			
			
  			//请求获取角色id和name的对应关系
			$.ajax({
				type:"POST",
				dataType:"json",
				url:"loadRolesName.action",
				success:function(data){
					//产生切换角色的代码
					var $RoleSelecter = $("<div id='divlRoleSelect' style='height:20px;margin-top:10px'>"+"选择角色："+"</div>");
//					var $RoleSelecter = $("<span style=\"float:right;margin:1px id='RoleSelect'\">"+"选择角色："+"</span>");
					var $RoleSelect = $("<select id='roleSelect'></select>");
                                        //设置一个默认值
                                        $.UC.setData('0-USERINFO.USERROLE',"-1");
					if(data){
						for(var i=0; i<data.length; i++){
							var sRole = data[i];
                                                        if (i == 0){
                                                            $RoleSelect.append("<option selected='true' value ='"+sRole.roleid+"'>"+sRole.rolename+"</option>");
                                                            $.UC.setData('0-USERINFO.USERROLE',sRole.roleid);
                                                        } else {
                                                            $RoleSelect.append("<option value ='"+sRole.roleid+"'>"+sRole.rolename+"</option>");
                                                        }
						}
					}
					$RoleSelecter.append($RoleSelect);
					//标识登录用户
					var uname = $.userContext.bindData("#0-userinfo.username#");
					var $TmpDiv = $("<div></div>").append($RoleSelecter);
					
					// toolbar中必须要保留roleselect 2014-5-7	
					$("#toolbar").append("<div style='height:20px;'>"+
                                                                    "<span class='ui-icon ui-icon-person' style='float:left'></span>"+
                                                                    "<span style='float:left;margin:1px'>"+uname+",您好!</span>"+$TmpDiv.html()+
                                                            "</div>");
					//切换按钮
					$("#aUserRole").click(function(){
						$("#divlRoleSelect").dialog({			
							title:"请选择用户角色",
							bgiframe: true,
							modal: true,
							resizable: false,
							zIndex:10001,
							height:50,
							width:200,
							close:function(event, ui){
								$(this).dialog("destroy");
							},
							buttons: {
								"确定":function(){
									$(this).dialog("close");
								}
							}
					    });
					});
					$("#roleSelect").change(function(){
						$.ajax({
							type:"POST",
							dataType:"text",
							data:{role:$("#roleSelect").val()},
							url:"loadRolesMenu.action",
							success:function(menus){
								if($.page.multiWin == 'F'){
                                    $("#main").empty();
                                }
								$.UC.setData('0-USERINFO.USERROLE',$("#roleSelect").val());
								$("#menuTree").empty();
								$("#menuTree").append(menus).css("float","left");
								$("#spUsername").html(uname+"<br/>"+$("#roleSelect option:selected'").text());
								
								var $menuUL=$("#menu ul[class=menu]");
								if ($menuUL.height()>50){
									var wid=$menuUL.width();
									while ($menuUL.height()>50){
										wid+=20;
										$menuUL.css('width',wid+"px");
									}
								}
								
								
								var clearFunc=function(func){
									$.each(func.list,function(i){
										func.list[i]=null;
									})
									func.list={};
								}
								clearFunc($.DC);
								
								
								if ($.page.menuLeft == "T"){

									var $li1s=$(".menu>li"),title,title0,$newli;
									var $target=$("#ulLevel1List");
									$target.empty();
									for(var i=0;i<$li1s.size()-1;i++){
										title=$($li1s[i]).find(">a >span")[0].innerHTML;
										if (i==0)
											title0=title;
										
										
										// 自动点击第一个onclick（这个在推敲按钮的功能时，有点怪）
										var onclickStringMatch = $($li1s[i]).html().match(/onclick=".*?"/);
										
										var onclickString;
										if (onclickStringMatch != null) {
											onclickString = onclickStringMatch[0];
										}
										else {
											onclickString = "";
										}
										
										$newli=$("<li class='level1menu'><a href='#' style='text-decoration:none;cursor:pointer' " +
												onclickString + ">"
												+"	<span>"+title+"</span></a>"
												+"</li>");
									
										
										$target.append($newli);
									}
									$(".level1menu").hover(
										function(){
											$(".level1menu").removeClass("level1hover");
											$(this).addClass("level1hover");
										},
										function(){
											$(this).removeClass("level1hover");
										}
									);
									
									$.getDataByNowTree("menu");
									$.genAccordionMenuByAllMenus(title0,"leftMenu");
									$(".level1menu").click(function(){
										var title=$(this).find("span").text();
										$.genAccordionMenuByAllMenus(title,"leftMenu");
										$(".level1menu").removeClass("level1selected level1hover");
										$(this).addClass("level1selected");
									});
								}
								else{
									$("#menuTree").show();
									$("#leftMenu").hide();
									$(".accordMenu").hide();
									// TODO 还要把角色选择的div挪到能处理的地方——div需要一个id
									
								}
								
								//加载初始功能窗   // bug 329 从前面挪到加载菜单完毕以后。
								$.ajax({
									type:"POST",
									dataType:"text",
									url:"getDefaultWinno.action",
									success:function( defaultWin ){
										if( defaultWin || (defaultWin !=""))
											$.page.openExternal(defaultWin.split(":")[1],defaultWin.split(":")[0]);
										
									},
									error:function(){
										$.msgbox.show("msg","初始化功能窗口错误");
									}
								});
							},
							error:function(data, text){
								alert(text);
							}
						});
					});
                    //根据默认值读取一次菜单
                    $("#roleSelect").trigger("change");
				}
			});
			
			
		}
	});
	
	//初始化窗口面板
	$("#main").tabs({
		show:function(event,ui){
			var currP = $(ui.panel).attr("pageno") ;
			if(currP)
				$.page.currPage = currP;
		}
	}).css("background","url('img/bg.gif')");
	// toolbar的退出系统和修改密码没用了 2014-5-7	
//        if(!(self.frameElement != null && (self.frameElement.tagName == "IFRAME" || self.frameElement.tagName == "iframe"))){
//            //配置工具栏
//            $("#toolbar").append($.button.createIcon({
//                    caption:"退出系统",
//                    icon:"ui-icon-arrowthickstop-1-e",
//                    pos:"right",
//                    script:"window.close();window.open('logout.jsp');"
//            })).addClass("ui-state-default")
//            .append($.button.createIcon({
//                    caption:"修改密码",
//                    icon:"ui-icon-wrench",
//                    pos:"right",
//                    script:"$.changePass()"
//            }));
//        } else {
//            $("#toolbar").addClass("ui-state-default");
//        }
	//配置消息隐藏域
	$.msgbox.ready("hiddenDiv");
	
	
});
//修改为10分钟
var time = 1000*60*10;
setInterval(function(){
	$.ajax({
		type: "POST",
		url:  "common_keepSession.action",
		data: {user:$.userContext.bindData("#0-userinfo.username#")},
		dataType: "text",
		success: function( data,textStatus ){
			if(data != "ok"){
				$("<div>警告：当前服务器连接繁忙，请重新登录</div>").dialog({
					autoOpen:true,
					buttons:{
						"确定":function(){
							$(this).dialog("destroy");
							window.location.href = "login.html";
						}
					}
				});
				
			}
		},
		error:function(e){
			$("<div>服务器连接已断开,请重新登录</div>").dialog({
				autoOpen:true,
				buttons:{
					"确定":function(){
						$(this).dialog("destroy");
						window.location.href = "login.html";
					}
				}
			});
		}
	})
},time);