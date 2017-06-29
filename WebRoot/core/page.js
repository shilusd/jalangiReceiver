/**************
 * page.js的职责是
 * 1.生成所属页面的所有窗口及其按钮，并进行定义管理
 * 2.接收窗口内部默认事件，并触发执行相关动作
 * 3.维护按钮事件动作机制
 * 4.注意：page和winGroup都负责win的布局，因此，这两个js的高度耦合
 * 
 **************/

//var _mainScreenH = window.screen.height-236;
var _mainScreenW ;
;(function($){
	
	$(window).resize(function() {
		var bodyH = $.getBodyHeight($.page.topSpace + ($.UC.userData["WINMODEL"] == "indep"?48:0) ); 
		if ($.page.menuLeft == "T"){
			$("#leftMenu").css({"height": bodyH - 60 + "px"});		
			                                   // 补偿用户名div的高度
		}
		$("#main").css({
					  "position":"absolute",
					  "top": $.page.topSpace + "px",
					  "left": ($("#main").attr("lmHidden")=="true")? ($.page.leftSpace - $.page.leftMenuHideMargin + "px") : ($.page.leftSpace +"px"),
					  "width": ($("#main").attr("lmHidden")=="true")? ($.getBrowserWidth()- $.page.leftSpace + $.page.leftMenuHideMargin + "px") : ($.getBrowserWidth()- $.page.leftSpace +"px"),
					  "height":bodyH -6 + "px",
					  "over-flow":"auto",
					  "float":"none"
					});

		$.page.winSize.doWinsAlign("main");
	});
		$.page={
			CONST:{
		        BAR_BOTTOM:"bottom",
		        BAR_TOP:"top",
		        BAR_BOTH:"both"
			},
			// 常量配置
			options: {
				pageParamURL:$.global.functionDefinitionUrl+"?type=W",
				eventURL:"commonUpdate_responseButtonEvent.action",
				contentURL:"getHelpContentAction.action"
			},
			//页面窗口最大高宽的对象
			screen: {},
			//页面定义缓存，存放每次请求后的页面描述参数对象 
			list:{},		
			
			// wingroup下的主窗体用来找wg窗体编号 
			WGMainWinMap: {},
			
			//当前打开页面
			currPage: null,	
			//获取是否需要多窗口Tabs模式，T是，F不是
			multiWin: null,
			//是否左侧纵向菜单(注意：不同于menuVertical)
			menuLeft: null,
			//main的左侧偏移（是否有左侧菜单）和顶部偏移（是否多窗口模式）。在system_init中设初值。
			leftSpace: null,
			topSpace: null, // 顶部偏移为多窗口预留，但目前多窗口的窗口栏仍然在main里面，因此该值不变。待窗口栏移出main后，需要设定不同的值。
			leftMenuHideMargin: 160, // 左侧菜单收起时的 向左偏移
			//记录所有打开页面的当前主窗口
			mainWin:{},
			
			// 记录warp后要返回的窗口
			backWin:{},
			
			// 超级查询相关参数（zIndex统一处理）
	        hyperQueries: {
	        	initZindex: $.F.options.hyperQueryBase,
	        	zIndex: $.F.options.hyperQueryBase,
	        	pushZindex: function(){
	        		this.zIndex = this.zIndex +1;
	        		return this.zIndex;
	        	},
	        	popZindex: function(){
	        		var oldZ = this.zIndex;
	        		if (this.zIndex > this.initZindex) {
	        			this.zIndex = this.zIndex -1;
	        			return oldZ;
	        		}
	        		else {
	        			return -1;
	        		}
	        	}
	        },
	        
	        pushBackWin: function(backWinno, toWinno) {
	        	this.backWin[toWinno] = backWinno;
	        },
	        popBackWin: function(toWinno) {
	        	var backWinno = this.backWin[toWinno];
	        	this.backWin[toWinno] = undefined;
	        	return backWinno;
	        },	        
	        // 打开外部页面函数
			openExternal: function(mainWinno,pageName,dialogshow, initcond) {  
				// initcond bug 176 grid的附加条件，形如p2.state=2 and p2.substate='open' （也可以有变量）。需要传表达式，grid会自动附加到查询sql中
				//          bug xxx form的条件替换，形如 #yyyy-p2.id#;#zzzz-p3.id#，只需要传变量，form自己对同源变量进行替换，替换到bindsql中（利用了hqParams）
				//			bug xxx printHtml的条件替换，同form
				// initcond 用于带指定条件的窗口跳转。Q：附加条件；F和P：替换变量
				//若页面定义在缓存中不存在
				$.userContext.setData('0-currBtn',"");  // bug 314 顺带增加此句：原来这个变量只在common.js中点击按钮时设置。但实际上，打开新页面的时候应该要明确没有点击按钮。这对于为grid判断是否要保留查询条件是必须的。
				if ($.page.WGMainWinMap[mainWinno])   // BUG xxx 在允许WG下的主窗口可以当作同步条的主窗口后产生了WG下第一个page出不来的bug。解决：如果WG是同步条下的唯一直接窗口，那么主窗口实际上是这个WG，因此做一个转换。
					mainWinno = $.page.WGMainWinMap[mainWinno]
	        	if(this.list[mainWinno] == null)
					$.ajax({ 
						type: "POST",
						url:  $.page.options.pageParamURL,
						data: {funcNo:mainWinno},
						dataType: "json",
						
						success: function( pageDef,textStatus ) {
							// 如果mainwin在wingroup里，那么main要换成wingroup，如果这个wingroup还有wingroup，那么main还要换成再上一层的winggroup. winGroup下面的主窗体自动归结到winGroup上。直到winGroup不再属于winGroup为止。           
							var i = 0;
							var oldMainWinno = mainWinno;
							while ( i < pageDef.wins.length) {
								if (mainWinno == pageDef.wins[i].winno) {
									if (pageDef.wins[i].wingrpno != "" ) {
										pageDef.mainWinno = mainWinno = pageDef.wins[i].wingrpno;
										i = 0;
									}
									else {
										if (oldMainWinno != mainWinno)
											$.page.WGMainWinMap[oldMainWinno] = pageDef.mainWinno;
										break;
									}
								}
								else {
									i ++;
								}
							}
							//////////////////////
							
							$.page.pushBackWin($.page.currPage, mainWinno);

				        	$.page.currPage = mainWinno;
							$.page.mainWin[$.page.currPage] = mainWinno;
							if (typeof(pageName) != "undefined"   // Bug 155 修改了jqWindow，在传来的pageDef中增加了默认的pageName属性。在页面跳转时就可以不传pageName。主要给DriveForm跳转用 。
									&& pageName != null)
								pageDef.pageName = pageName;
							if (typeof(initcond) != "undefined") {
								pageDef.initcond = initcond;  // bug 176 添加初始条件
							}
							else
								pageDef.initcond = undefined;
							if(dialogshow){
								var mainWinDef;
								var winDefs=pageDef.wins;
								//var winByOrd=this.sortFuncsByOrd(pageDef);
							    for(var i=0;i<winDefs.length;i++){
									if(winDefs[i].winno == pageDef.mainWinno){
										mainWinDef = winDefs[i];
										mainWinDef.dialogshow = true;
										break;
									}
								}
							}
							$.page.list[mainWinno]=pageDef;	
							
							

							
							if(dialogshow){
								//此处dialogshow代表是弹出窗口是否显示选项卡的意思，用于李海华和袁嘉超的系统的合体
								$.page.createPage(pageDef, true);
							}else{
								$.page.createPage(pageDef);
							}
						},
						
						error:function(e){
							//alert(e.responseText);
							$.msgbox.show("err","请求显示的主窗口"+mainWinno+"不存在或存在定义错误：<br>"+e.responseText);
						}
						
					});
				else {
		        	$.page.pushBackWin($.page.currPage, mainWinno);

		        	// 传统情况：如果不是多窗口，要创建页面。如果多窗口，但是该页面还没创建，则要创建页面。
					if ($.page.multiWin=="F"||$("#page"+mainWinno).length==0 || 
							// Bug 130的情况：如果是多窗口，且该页面存在，并且currPage就是mainWinno，并且当前窗口（$.page.mainWin[$.page.currPage] 不同于 mainWinno，则要创建页面。
							($.page.currPage == mainWinno && $.page.mainWin[$.page.currPage] != mainWinno)) {  // 2014-1-11 第一个 == 之前居然误写成 = ，导致在改grid的内置chart时，重复点同一个菜单会出错！现在已经修正。
						if ($.page.multiWin!="F"  && $("#page"+mainWinno).length>0 ) {// 是bug 130的情况
							// 把当前窗口先关掉
							$("#main>ul>li>a:[href=#page"+mainWinno+"]").parent().find("span.ui-icon-close").click();
						} 
						$.page.currPage = mainWinno;
						$.page.mainWin[$.page.currPage] = mainWinno;  // 因为这里是创建新的page，所以将$.page.mainWin中放上该页的第一个mainWinno。当该页被点后，
						var pageDef = $.page.list[mainWinno];
						if (typeof(initcond) != "undefined") {   // add by msx 2013-11-11
							pageDef.initcond = initcond; 
						}
						else
							pageDef.initcond = undefined;
						this.createPage(pageDef);
					}
					else {
						$.page.currPage = mainWinno;
						// 2014-1-11 做grid内嵌chart时，发现的一个新bug：与bug 130相似，但不完全一样。130解决的是当前窗口点过以后不返回而再次点同一个菜单的问题。而现在是需要更改当前窗口时，目标窗口的原始主窗体不是实际的主窗体（就是目标窗口被点过了，变了一个主窗体）。这时候，似乎不应该重设mainwin。
						//	$.page.mainWin[$.page.currPage] = mainWinno; // 这句应该用不着了。当修改了currPage后，真正的mainWin就从$.page.mainWin里找到了！这句话影响的是common.js中btnClickFunc的winFunc的查找（第三个赋值；json版是第四个）
						$("#main>ul>li>a:[href=#page"+mainWinno+"]").click();
					}
				}
			},
			
			//内部页面跳转
			open:function(fromWin,toWin){
				if (toWin==undefined){
					  toWin=fromWin;
				}

				var winJump=function(fromWin,toWin,pageDef){
					var currP = $.page.currPage;
					var mainWin = $.page.mainWin[currP];
					var nowPage=$.page.idFunc.getPageDefbyWinno(fromWin);
					var dialogShow=false;
					
					
					if (nowPage!=undefined&&nowPage.dialogPreWin==toWin){//说明是关闭弹出的dialog
				    		$("#"+$.page.idFunc.getDialogOuterid(nowPage.mainWinno)).dialog("close");
				    }else{//不是关闭弹出的dialog
					    for(var i=0;i<pageDef.wins.length;i++){
							if(pageDef.wins[i].winno == toWin){
								dialogShow=pageDef.wins[i].dialogshow;
								break;
							}
						}
					    if (dialogShow){//弹出框的跳转
						    	$.page.mainWin[$.page.currPage] = toWin;
								//pageDef.dialogPreWin=fromWin;   // BUG xxx  对话框返回时，如果之前是副窗口弹出的，则不是fromWin而是主窗体的winno。在改graph的弹出框时候发现此问题。
								// dialogPreWin是用作“对话框”式窗口关闭时，要返回的“主窗口”。
						    	// fromWin是对话框窗口的来源窗口（是连线来的地方），因此两者不同。
						    	// 在graph中，需要识别这两种不同的情况：对话框返回主窗口，但是要记录来源的这个窗口（也就是FreeGraph所在的窗口）对其刷新
						    	// 这里不采用通过主窗口来刷新从窗口（FreeGraph窗口）是因为主窗口的刷新（影响）可能做多次，导致FG无谓地多次刷新。
						    	// 因此这里增加一个参数dialogRefreshWin，用来记录连线起点的哪个窗口。
						    	// 在dialog关闭时，如果dialogRefreshWin==dialogPreWin则根据配置决定是否刷新，若刷新也只刷新一次。
						    	// 如果dialogRefreshWin != dialogPreWin，则根据配置，两个窗体都刷新（先刷直接先导RefreshWin，再刷先导主窗体PreWin）
						    	pageDef.dialogPreWin = nowPage.mainWinno;
						    	pageDef.dialogRefreshWin = fromWin;
						    	$.page.createFuncs(pageDef);
					    }else{//在一个同步条之下的跳转 
					    	if($.page.list[mainWin].funcMap[toWin] ){//已经在内存中的跳转
								$.page.act.hide(fromWin);
								$.page.act.show(toWin);
								$.page.act.refresh($.page.list[mainWin].funcMap[fromWin].func,toWin+"^$");
								
							}else{//不同同步条之间的跳转
								$("#page"+$.page.currPage).empty();
								$.page.mainWin[$.page.currPage] = toWin;
								var maxHeight = $.page.getWinsHeightMax(pageDef.wins);
								$.page.setMainHeight(maxHeight); 
								// TODO: 这里因为修改了page的主窗口，因此#pagexxxx在createFuncs中不准确了，无法block掉。
								
								$.page.createFuncs(pageDef);   // TODO: BUG 328 C-、P-变量无法获得值。可能在这需要修改。
							}
						}
				    }
				}
				
				if(this.list[toWin] == null)
					$.ajax({ 
						type: "POST",
						url:  $.page.options.pageParamURL,
						data: {funcNo:toWin},
						dataType: "json",
						
						success: function( pageDef,textStatus ) {
							$.page.list[toWin]=pageDef; 
							//根据该页面内的窗口高度最大值设置height
							winJump(fromWin,toWin,pageDef);
						},
						error:function(e){
							$.msgbox.show("err","跳转错误：<br>"+e.responseText);
						}
					});
				else {
					var pageDef = $.page.list[toWin];
					//根据该页面内的窗口高度最大值设置height
					winJump(fromWin,toWin,pageDef);
				}
			},
			
			//根据页面json定义创建该页面,showtab参数代表李海华和袁嘉超系统合体时候的弹出框是否添加选项卡
		createPage: function( pageDef, showtab ) {
			if ($.page.multiWin == 'F'){
				var $page = $( "<div id='" + $.page.idFunc.getPageid(pageDef.mainWinno) + "' style='float:left;'></div>" );					
				$("#main").empty().html($page);
				//根据该页面内的窗口高度最大值设置height
				var maxHeight =  this.getWinsHeightMax(pageDef.wins);
			    this.setMainHeight(maxHeight);
			    //创建属于该页面的每个窗口
				$.page.createFuncs(pageDef);
			} else {
				var pageno = pageDef.mainWinno;
				var pageid = $.page.idFunc.getPageid(pageno);
				var index = $("#main>ul>li").length;
				
				//添加页面选项卡
				$("#main").tabs("add",
						"#"+pageid,
						_cutStr($.UC.parser(pageDef.pageName),6,"..."),
						index+1);//这里应该是tabs的bug，如果不加+1的话，会出现insert位置和index不相符的情况
				$("#main>ul>li>a[href='#" + pageid + "']").click(function(){  // 点到某个tab时，就将currPage设置一下，以确保能按照当前页返回调用页。注意：$.page.backWin[toWinno]=backWinno
					$.page.currPage = $(this).attr("href").substr(5);
				});
				$("#main").tabs("select",index);
				
				$("#"+pageid).attr("pageno",pageno);
				
				var $label = $("#main>ul>li:eq("+index+")");
				$label.attr("title",$.UC.parser(pageDef.pageName));
				$("<span style='float:left;margin-top:4px;border:solid 1px transparent'></span>")
				.addClass("ui-icon ui-icon-close")
				.prependTo( $label )
				.css("cursor","pointer")
				.click(function(){
					var as = $("#main>ul>li>a");
					var index = 0;
					for(;index<as.length;index++){
						if( $(as[index]).attr("href") == $(this).parent().find(">a").attr("href") )
							break;
					}
					
					var backWinno = $.page.popBackWin($.page.currPage);
		        	$("#main").tabs("remove",index);
					
					if (backWinno) {
						$("#main>ul>li>a[href='#page" + backWinno + "']").click();
					}
					
				}).hover(function(){$(this).css("border","solid 1px #F9BD01")},
						function(){$(this).css("border","solid 1px transparent")});

				$("<span  style='float:left;margin-top:4px;border:solid 1px transparent'></span>")
				.addClass("ui-icon ui-icon-refresh")
				.prependTo( $label )
				.css("cursor","pointer")
				.click(function(){
					$label.find("a").click();
					$.page.reload( pageno );
				}).hover(function(){$(this).css("border","solid 1px #F9BD01")},
						function(){$(this).css("border","solid 1px transparent")});
				//根据该页面内的窗口高度最大值设置height
				var maxHeight =  this.getWinsHeightMax(pageDef.wins);
			    this.setMainHeight(maxHeight);
				
			    var $pagebar=$("#pageBar");
			    //如果长度过长，就关掉第一个窗口
			    var $lastli=$pagebar.find("li:last");
			    if (typeof($lastli[0]) == "undefined") return; 
				if ($pagebar.height()>36||($pagebar.width()-$lastli[0].offsetLeft-$lastli.width()<30)){
					$("#main").tabs("remove",0);
				}
				
				//创建属于该页面的每个窗口
			    $.page.createFuncs(pageDef);
			}
		},
		//设置overflow属性
		setOverFlow:function(winno){
			$("#body_win" + winno).css("overflow", "auto");
			$("#body_win" + winno).css("overflow-x", "auto");
			$("#body_win" + winno).css("overflow-y", "hidden");
		},
			// 创建功能窗口
			createFuncWin:function(pageno,winDef,mainWinno,isDialog,winComplete, initcond){  // bug 176 添加initcond
				// 定义窗口 id号
				var winno = "body_win"+winDef.winno;
				if( $("#"+winno).length>0)
					return;
				if (winDef.wingrpno!=""&&$("#"+$.page.idFunc.getWinid(winDef.winno)).length==0){//WG中在page模式下，后面的tab
					winComplete();
					return;
				}
				//画出该窗口
				this.drawWindow(pageno,winDef,mainWinno,isDialog);
				
				//加载窗口功能, (窗口id，功能类型,		  功能序号）
				this.loadFunc(winno, winDef.func_type, winDef.funcno,winComplete,winDef.grid_btns, initcond);
				
			},
			
			//绘制窗口
			drawWindow:function(pageno,winDef,mainwinno,isdialog){
				var winno = $.page.idFunc.getWinid(winDef.winno);
				
				//看看是否需要创建dialog的div
				var dialogwinno=$.page.idFunc.getDialogWinid(mainwinno);
				var dialogOuter=$.page.idFunc.getDialogOuterid(mainwinno);
				var $dialogwin;
				var pageDef=$.page.list[mainwinno];
				var dlgFrame;
				if (isdialog){
					var dlgTitleH=$.ECOND.dialogTitleHeight();
					if (winno==$.page.idFunc.getWinid(mainwinno)){
						dlgFrame=$.page.getDialogWinsFrame(pageDef.wins);
						pageDef.dlgFrame=dlgFrame;
						dlgFrame.height=dlgFrame.height+(winDef.frame&&winDef.showtitle?20:0);
						dlgFrame.width=dlgFrame.width-17;
						var $dialogOuter=$("<div id='"+dialogOuter+"' style='width:"+dlgFrame.width+"px;height:"+dlgFrame.height+"px'></div>")
						               .appendTo($("#page" + pageno));
						$dialogwin=$("<div id='"+dialogwinno+"' style='width:"+dlgFrame.width+"px;height:"+dlgFrame.height+"px;overflow:auto'></div>")
						.appendTo($dialogOuter);
					}else{
						dlgFrame=pageDef.dlgFrame;
						$dialogwin=$("#"+dialogwinno);
					}
				}
				
				//绘制窗框
				var winHead = "";
				if(winDef.frame&&winDef.showtitle) {
					winHead = "<h3 class='ui-widget-header ui-corner-all' style='text-align:center' id='"+winno+"_head'>" 
								+ "<div  class='ui-dialog-title' style='height: 18px; padding:4px;'>" // height: 18px by wyj 
								+ "<span style='float:left' class='ui-icon "+$.global.iconSet[winDef.func_type]+"'></span>"
								+ "<span id='"+winno+"_title'>"+$.userContext.parser(winDef.init_title,true)+"&nbsp;</span>"
								+ "</div></h3>";
				}
					
				
				//绘制窗口实体, 并挂在页面上
				if (winDef.wingrpno==""){
					if (isdialog){
						var y = winDef.y-dlgFrame.top+dlgTitleH+$.ECOND.dialogFooter();
						var x = winDef.x-dlgFrame.left+4;
					}else{
						var y = winDef.y+_shiftY;
						var x = winDef.x+_shiftX;
					}
					var $win = $("<div id='"+winno+"' style='position:absolute;padding:1px;width:"+winDef.width+"px;left:"+x+"px;top:"+y+"px;"+
							     "border-color: #979797;border-width: 2px;border-style: solid;padding: 1px;border-top: 0;border-left: 0;'"+//这是阴影的效果
								 " class='ui-widget-content ui-corner-all'>"
									+	winHead 
									+	"<div id='body_"+winno+"'></div>"
									+	"</div>");
					if (isdialog) {
						$dialogwin.append($win);
						$win.height($dialogwin.height());
					}
					else
						$( "#page" + pageno ).append( $win );

				}else{
					var $win=$("#"+winno);
					if ($win.size()==0)
						return;
					$win.append($(winHead+"<div id='body_"+winno+"'></div>"));
				}
				if (winDef.hint!=undefined)
					$.addHint($("#"+winno+"_head"),winDef.hint);
				
				$win.click(function(){
					$.userContext.setData('0-currFunc',winDef.funcno);
				});
				if (winDef.wingrpno==""){
					//窗口最大化
					this.btn.titleBtns.createMaxBtn(winDef,$win);
					//窗口的伸缩按钮
					this.btn.titleBtns.createExpandBtn(winDef,$win);
				}
				//窗口的帮助按钮
				this.btn.titleBtns.createHelpBtn(winDef,$win);
					
				//初始时是否显示
				if( !winDef.isshow ){
					//$win.get(0).style.visibility= 'hidden';
					$win.get(0).style.display= 'none';
				}
				
				//是否可拖拽
				/*if( winDef.draggable ){
					$win.draggable({cancel:"#body_"+winno+",#foot_" + winno});
					$( "#"+winno + " h3" ).css("cursor","move");
				}*/
				
				//创建底部窗口按钮栏
				this.createBtnsBar( winDef);
				var wHeight = winDef.height+winDef.foot_height+30;//$win.css("height");   // by wyj 为什么要+30？是为了预留head？
				this.setMainWidthHeight(x,y,winDef.width,wHeight);
				
				//全部创建完毕后，如果窗口在窗口组容器内的话，自动设其大小
				if (winDef.wingrpno!=""){
					var wgFuncno=$.page.idFunc.getWinDefbyWinno(winDef.wingrpno).funcno;
					
					winDef.width=$win.width();
					winDef.height=$win.height()
								  -$.getElementHeight($.page.idFunc.getTitleid(winDef.winno),0)
								  -$.page.winSize.getBtnBarHeight(winDef.winno)
								  -$.exploreCond.borderSpacing($win)*6;
				}
				$( "#body_"+winno ).css({
					width:winDef.width,
					height:winDef.height,
					"overflow-x":"hidden",
					"overflow-y":"hidden"
				});
				$.page.winSize.rightExtWin(winDef);
			},
			
			// 新平台中以下三个方法已经废弃！！
			//根据页面中窗口出现的高宽设置main div的长宽
			setMainWidth:function(width){},
			setMainHeight:function(height){},
			setMainWidthHeight:function(x,y,width,height){
			//	this.setMainHeight(y+height);
				this.setMainWidth(x+width);
			},
			
			//将某类型功能加载到指定窗口
			loadFunc: function(winno,type,funcno,winComplete,grid_btns, initcond){  // : bug 176 添加initcond
				var func = $[type];
				$.userContext.setData('0-currFunc',funcno);
				func.runInstance(funcno,{target:winno,complete:winComplete,grid_btns:grid_btns, initcond:initcond});
			},
			//创建功能按钮集，btns为待创建的按钮json对象数组
			createBtnsBar:function(winDef){
				var winno=winDef.winno;
                var createBtnsonBar=function(btns,bar,$win){
                	$.each( btns,function(i) {
						//创建按钮 
						var btnDef = btns[i];
						
						var btnObj = $($.button.create(btnDef));
						if (typeof(btnObj)!="undefined"){		
							var btn = $(btnObj)
						        .appendTo(bar)
						    	.css("float","left").css("margin","2px,5px auto")
								.click( function(){
									$.button.btnClickFunc(btnDef,winno);
								});	
						$.button.addBtnOperations(btnDef,winno,btn);
						}
					});//end for each;
                };
				var headid = "win" + winDef.winno+"_head";
			    var $win = $( "#win" + winno );
			    var barid = "foot_win" +  winno;
				
				// 创建盛放按钮的bar
				var bar;
				//1.创建头上的
				if(winDef.top_btns.length>0){
					bar= $( '<div class="ui-widget-header ui-corner-all '+barid+'" id="'+barid+'" style="height:'+winDef.foot_height+'px;" ></div>' )
					     .insertAfter($("#"+headid));
					createBtnsonBar(winDef.top_btns,bar,$win);
				}
				//2.创建底部的
				if (winDef.func_btns.length>0){
					bar= $( '<div class="ui-widget-header ui-corner-all '+barid+'" id="'+barid+'" style="height:'+winDef.foot_height+'px;" ></div>' )
					     .appendTo($win);
					createBtnsonBar(winDef.func_btns,bar,$win);
				}
				
			},
			
			reload:function( pageNo ){
				var pageDef = $.page.list[pageNo];
				$.page.currPage = pageNo;
				$.page.mainWin[pageNo] = pageNo;
				$("#page"+pageNo).empty();
				$.page.createFuncs(pageDef);
			},
			
			handleMsg:function( msgStr, msgCallback ){
				//pass:msg:local(key:val)   或是success;(pass的话直接通过;success的话提示成功)
				var dealLocalval=function(){//处理返回msgStr中的local的变量，存到上下文中
					var msgs=msgStr.split("local(");
					if (msgs.length<=1)
						return;
					msgStr=msgs[0];
					msgs=msgs[1].split(")");
					var keyval=msgs[0].split(":");
					if (keyval.length==2)
						$.UC.setData(keyval[0],keyval[1]);
				};
				dealLocalval();
				if(msgStr.substr(0,4)=="pass"){
					return true;
				}
				else if(msgStr.substr(0,7)=="success" ){
					$.msgbox.show("succ", msgStr.substring(8).replace(/@/g,"<br><br>") );
					return true;
				}
				else if(msgStr.substr(0,5)=="judge"){  // BUG 408: check存储过程返回后供用户选择。“继续”则回调待执行的存储过程。涉及common.js
					$.msgbox.show("conf", msgStr.substring(6).replace(/@/g,"<br><br>"),msgCallback);
					return false;
				}
//				else if(msgStr.substr(0,5) == "pause") {  // BUG 408: 点继续算pass，点取消什么都不做  // 没这个需求。目前不提供。
//					var result = false;
//					$.msgbox.show("conf", msgStr.substring(6).replace(/@/g,"<br><br>"), msgCallback);
//					return result;
//				}
				msgStr = msgStr.replace(/@/g,"<br><br>");
				msgStr = msgStr.replace(/.*\:/,"");
				$.msgbox.show("err",msgStr);
				return false;
		    },
			
			/*功能事件触发函数，该函数提供给各个功能调用
			* 当任何功能的默认事件发生时，会调用此函数，
			* srcFuncno为默认事件发生的所属源功能号，
			* 根据该功能号，反向查找到要响应的动作，并执行 */
			triggerBy:function(srcFuncno){
		    	var mainWinno = $.page.mainWin[this.currPage];
		    	var pageDef=$.page.list[mainWinno];
				var actMap = $.page.list[mainWinno].actMap;
				var acts = actMap[srcFuncno];
				if( !acts || (acts == "") )
					return;
				var act = this.act.routeAffects(acts);
				$.page.act.affectsWins(srcFuncno,act);
			},
			
			//动作执行函数定义，动作分为跳转和刷新（影响）两种
			act:{
				affectsWins:function(srcFuncno,affectsStr ) {
					var affects = ( affectsStr + "" ).split(";");
					var mainWinno = $.page.mainWin[$.page.currPage];
	                var pageDef=$.page.list[mainWinno];
					for( var i=0; i<affects.length; i++){
						this.refresh(srcFuncno,affects[i] );
						pageDef.createFinCnt-=1;
					}
				},
				
				jump:function( fromWin, toWin ){
					if(toWin == '#'){
						$.msgbox.show("msg","未满足条件,无法进行下一步操作")
						return;
					}
					else if ( toWin == "0") {  // 窗口编号为0表示不跳转 by wyj  2013-5-23
						return;
					}else if( toWin == "-1" ){
						var as = $("#main>ul>li>a");
						var index = 0;
						for(;index<as.length;index++){
							if( $(as[index]).attr("href") == "#page"+currP )
								break;
						}
						if ($.page.multiWin == 'F'){
							$("#main").empty();
						} else {
							$("#main").tabs("remove",index);
						}
						
						return;
					}
					
					$.page.open(fromWin,toWin);
					
					$("#tiptip_holder").fadeOut(100);
				},
					
				refresh:function( srcFuncno,affect ){
					try{ 
						if( affect == '#' ) 
							return;
						var winno = affect.split("^")[0];
						var filter = affect.split("^")[1];
						
						//获得该功能号对应的窗口定义细节
						var winfunc = $.page.list[$.page.mainWin[$.page.currPage]].funcMap[winno];
						
						if( !winfunc )
							return $.msgbox.show("err","该页面不包含要刷新的功能窗口:"+winfunc.func);
						
						var funcRefresh = $[winfunc.type].refresh;
						
						$.userContext.setFuncRef(srcFuncno, winfunc.func);
				     	$.userContext.setData('0-currFunc',winfunc.func);
						
						if( typeof funcRefresh == "function"){
							
							var wins = $.page.list[$.page.mainWin[$.page.currPage]].wins;//取出被刷新窗口的定义winDef
							var winDef;
							for(var i=0;i<wins.length;i++){
								if(wins[i].winno == winno){
									winDef = wins[i];
									break;
								}
							}
							
							// 刷新该窗口的标题
							// 优先级：func的title > win的title > win的init_title。  BUG 381
							var sNewTitle = (winfunc.title?winfunc.title:(winDef.title?winDef.title:winDef.init_title));
							$( "#win"+winno+"_title" ).html( $.userContext.parser(sNewTitle,true) );
							
							if(winDef.signable && winDef.wf_enabled){
								funcRefresh = $[winfunc.type].refresh1;
								funcRefresh(winfunc.func, filter, winDef.winno,winDef.wf_name,winDef.signcode,winDef.signunikey)
							}else{
								funcRefresh( winfunc.func, filter );
							}
						}
						else
							return $.msgbox.show("err","未提供 刷新函数，无法刷新窗口:"+winfunc.func);
						
					}catch(e){
					
					}
				},
				
				//显示指定窗口
				show:function( winno ) {
					//$("#win"+winno).get(0).style.visibility= 'visible';
					$("#win"+winno).get(0).style.display= 'block';
				},
				
				//隐藏指定窗口
				hide:function( winno ) {
					var funcno = $.page.list[winno].funcMap[winno].func;
					$("#win"+winno).get(0).style.display= 'none';
					$("#flash_footer_"+funcno).css("display", "none");
				},
				
				//路由条件跳转动作 acts 的格式参见数据库文档 功能按钮定义部分
				routeActs:function(acts){
					var actsStr = $.userContext.parser1(acts);
					var actArray = actsStr.split("@");
					
					for(var i=0; i<actArray.length; i++){
						var act = actArray[i].split(":");
						if( condTester.ifCondition(act[0]) )
							return act[1];
					}
					
					return "#";
				},
				
				//路由刷新跳转动作 affects 格式参见文档 功能按钮定义部分
				routeAffects:function(affects){
					var affectsStr = $.userContext.parser1(affects);
					var affectsArray = affectsStr.split("@");
					var rAffects = "";
					
					for(var i=0; i<affectsArray.length; i++){
						var act = affectsArray[i].split(":");
						if( condTester.ifCondition(act[0]) )
							rAffects += act[1] + ";";
					}
					
					return rAffects+"#";
				}
			},/*end for page.act*/
			
			//按钮后台调用相关定义
			btn:{
				//按钮点击前可能要调用该函数进行前置检验，以决定是否要进行下一步动作
				pre_check:function(funcno,type){
					var checkfun = $[type].check;
					if(typeof(checkfun) != "function"){
						$.msgbox.show("msg","未指定check函数,无法做相关检查");
						return false;
					
					}else if(checkfun(funcno)){
						return true;
					}else{
						return false;
					}
				},
				
				call_proc:function(cmd,callBack){
					$.ajax({
						type:"POST",
						url:$.page.options.eventURL,
						data:{cmd:cmd},
						dataType:"text",
						success:function(msg,textStatus){
							callBack(msg);
						}
					});
				},
				
				
				call_proc2:function(actionId,cmd,callBack){
					
					$.ajax({
						type:"POST",
						url:actionId+".action",
						data:{cmd:cmd},
						dataType:"text",
						success:function(msg,textStatus){
							callBack(msg);
						}
					});
				},
				/*根据需要调用的function 和procs 生成本次后台要执行的指令
				 *  该指令是与后台UpdateCommand类对应的json对象字符串
				 */
				generateCmd:function(func,procs){
					
					var cmd = "{";
					var i = 0;
					try{
						if((func == "@" )||(func == "$")||(func == "")||(func == "escape"))
							cmd += 'check_func:"escape",';
						
						else if(func.charAt(0)=="@")
							cmd += 'check_func:"' + $.userContext.parser(func)+'",';
						
						else{
							var funcCall =  func.split(":");
							cmd += 'check_func:"' + funcCall[0]+'",';
							cmd += 'check_data:' + this.parseParamsToData(funcCall[1])+',';
						}
						
						for(;i<procs.length; i++) {
							if( procs[i].charAt(0) == "@")
								cmd += 'proc'+i+':"'+$.userContext.parser(procs[i])+'"';
							
							else{
								var procCall =  procs[i].split(":");
								cmd += 'proc'+i+':"'+procCall[0]+'",';
								cmd += 'data'+i+':'+this.parseParamsToData(procCall[1]);
							}
							cmd += (i == procs.length-1)?"":",";
						}
					}catch(e){
						$.msgbox.show("err","待执行的存储过程指令中存在错误:<br><br>check_func:"+func+"<br><br>proc:"+procs[i]);
						throw e;
					}
					
					cmd +="}";
					return cmd;
				},
				
				generateCmd2:function(func,procs){
					
					var cmd = "{";
					var i = 0;
					try{
						if(func){
							cmd += 'check_data:' + this.parseParamsToData( func )+',';
						}
						if(procs){
							for(;i<procs.length; i++) {
								cmd += 'proc_data'+i+':'+this.parseParamsToData(procs[i]);
								cmd += (i == procs.length-1)?"":",";
							}
						}
					}catch(e){
						$.msgbox.show("err","待执行的存储过程指令中存在错误:<br><br>check_func:"+func+"<br><br>proc:"+procs[i]);
						throw e;
					}
					
					cmd +="}";
					return cmd;
				},
				/*
				 * 将调用参数字符串转解析成命令字符串
				 * 参数字符串：#param1#,#param2#,#param3#...
				 * 转换后 [{name:n1,type:t1,value:val1},{...},...]
				 * * */
				parseParamsToData:function(paramsStr){
					if(paramsStr == "")
						alert("存储过程或函数必须有参数");
					var params = (paramsStr+"").split(";");
					var len = params.length;
					
					var dataList="[";
					
					for(var i=0;i<len;i++)
						dataList += $.userContext.getData(params[i])+(i<len-1?",":"");
					
					dataList += "]";
					return dataList;
				},
				titleBtns:{
					createHelpBtn:function(winDef,$win){
						//窗口的帮助按钮
						if (winDef.helptitle!=""){
							var helpbtnid="win" + winDef.winno+"_helpbtn";
							var $headTitle=$("#win"+winDef.winno+"_head .ui-dialog-title");
							$winHelp=$("<span id='"+helpbtnid+"' style='float:right' style='padding:5px;'>"
	                           +"<img src='img/help.png' width='16px' height='16px' class='ui-corner-all"
	                           +" onmousedown=\"$(this).addClass('ui-state-active');\""
							   +" onmouseup=\"$(this).removeClass('ui-state-active');\""
							   +" onmouseout=\"$(this).removeClass('ui-state-hover').removeClass('ui-state-active');\""
							   +" onmouseover=\"$(this).addClass('ui-state-hover');\">"
	                           +"</img></span>")
	                           .appendTo($headTitle)
	                           .click(function(){
							        $.ajax({ 
									type: "POST",
									url:  $.page.options.contentURL,
									data: {helptitle:winDef.helptitle},
									dataType: "json",
									
									success: function( contentInfos,textStatus ) {
									    if (contentInfos.length==0)
									    	$.msgbox.show("err","请求的帮助信息("+winDef.helptitle+")不存在<br>请检查帮助信息定义");
										var contInfo=contentInfos[0]; 
						    			if (contInfo.selmode!=""){
								    		var clickFunc=$.MC.doHref[contInfo.selmode];
											if (clickFunc!=undefined)
							        		clickFunc(contInfo.contentlink,contInfo.relkey);
							    		}
									},
								
									error:function(e){
										$.msgbox.show("err","请求的帮助信息("+winDef.helptitle+")不存在或存在定义错误：<br>"+e.responseText);						}
								}); 
							});	
						}
					},
					createExpandBtn:function(winDef,$win){
						if (winDef.canexpand){
							var $headTitle=$("#win"+winDef.winno+"_head .ui-dialog-title");
							var expbtnid="win" + winDef.winno+"_expandbtn";
							$("<span id='"+expbtnid+"' style='float:right'>"
	                           +"<img src='img/shrink.png' width='16px' height='16px' class='ui-corner-all"
	                           +" onmousedown=\"$(this).addClass('ui-state-active');\""
							   +" onmouseup=\"$(this).removeClass('ui-state-active');\""
							   +" onmouseout=\"$(this).removeClass('ui-state-hover').removeClass('ui-state-active');\""
							   +" onmouseover=\"$(this).addClass('ui-state-hover');\">"
	                           +"</img></span>")
	                           .appendTo($headTitle)
							   .click(function(){
									if (!winDef.expanded)
										$.page.winSize.expandWin(winDef.winno);
									else
										$.page.winSize.shrinkWin(winDef.winno);
									
									$.page.winSize.doWinsAlign("main");
									
							   });
						}
					},
					createMaxBtn:function(winDef,$win){
						var $headTitle=$("#win"+winDef.winno+"_head .ui-dialog-title");
						if (winDef.maximizable){
							var maxbtnid="win" + winDef.winno+"_maxbtn";
							var $maxWin=$("<span id='"+maxbtnid+"' style='float:right'>"
								      	+"<img src='img/maxwin.png' width='16px' height='16px' class='ui-corner-all"
	                           			+" onmousedown=\"$(this).addClass('ui-state-active');\""
							  			+" onmouseup=\"$(this).removeClass('ui-state-active');\""
							   			+" onmouseout=\"$(this).removeClass('ui-state-hover').removeClass('ui-state-active');\""
							   			+" onmouseover=\"$(this).addClass('ui-state-hover');\">"
	                           			+"</img></span>")
										.appendTo($headTitle)
										.click(function(){
											if (!winDef.maxed)
												$.page.winSize.maximizeWin($(this),winDef.winno);
											else
												$.page.winSize.restoreWin($(this),winDef.winno);
											winDef.maxed=!winDef.maxed;
										});
						}
					}
				}
			},/*end for page.btn*/
			sortFuncsByOrd:function(pageDef){
				pageDef.wins.sort(function(a,b){
					return a.createord-b.createord;
				});
				return pageDef.wins[pageDef.wins.length-1].createord!=0;//如果最后一个窗口的定义也不为0，说明要按照顺序创建
			},
			doAlignWhenFin: function(pageDef) {
				// BUG 387 弹出框的宽度和内容不能匹配。如果主窗体是dialogshow，则不能用main做标杆。
				if (pageDef && pageDef.wins.length > 0 && pageDef.wins[0].dialogshow) {
					// 如果是dialogShow则放在实际dialog出来以后再布局：createFuncs中的$.page.createFuncWin中的回调方法中进行布局。
				} 
				else {
					$.page.winSize.doWinsAlign("main");
				}
				//另外，那些本身没有align的WG也要去触发一下他的align
				var wins=pageDef.wins;
				for(var i=0;i<wins.length;i++){
					if (wins[i].func_type=="WG"&&(wins[i].align==""||wins[i].align=="alNone")){//顶层的非Align的WG由于没有人触发它的resize，所以需要这里来手工的触发他的align,好让它内部有Align的wins得到布局
						$.WG.triggerAlign($.page.idFunc.getWinDefbyWinno(wins[i].winno).funcno);	
					}
				}
			},
			recurseCreate:function(pageDef,winDefIdx,mainWinno,isDialog){
				var winDefs=pageDef.wins;
				var nextWinIdx = winDefIdx +1;
				if (winDefIdx<winDefs.length){
					if (winDefs[winDefIdx].winno == pageDef.mainWinno) {//遇到主窗口，往后 
						$.page.recurseCreate(pageDef,winDefIdx+1,mainWinno,isDialog);
					}
					else//非主窗口，正常创建
						$.page.createFuncWin( $.page.currPage, winDefs[winDefIdx],mainWinno,isDialog,function(){
												if (winDefs[winDefIdx].canexpand&&!winDefs[winDefIdx].defaultexpand&&winDefs[winDefIdx].expanded==undefined)//自动收缩
													$.page.winSize.shrinkWin(winDefs[winDefIdx].winno);
												$.page.notifyCreateFin(pageDef);
												$.page.recurseCreate(pageDef,nextWinIdx,mainWinno,isDialog);
											}
										);
					if (winDefIdx == 0 && !(pageDef.allCompleteCnt==pageDef.wins.length||pageDef.createFinCnt==pageDef.wins.length)) {  //Chrome递归变量bug
						$.page.doAlignWhenFin(pageDef);
					}
				}
			},
			createOneWin:function(innerWinno){//这个函数主要就是给WG在page模式下调用的
				//$screen=$("#"+$.page.idFunc.getWinDivID(innerWinno)).parent().parent();
				//$screen.block({message:"<p class='ui-state-active' style='color:blue'><img src='img/ajax.gif' width=17 height=17 />加载中...</p>",
				//		 overlayCSS:{backgroundColor: '#0F4569', opacity:0.6 }	
				//});
				try{
					var winDef=$.page.idFunc.getWinDefbyWinno(innerWinno);
					var pageDef=$.page.idFunc.getPageDefbyWinno(innerWinno);
					$.page.createFuncWin($.page.currPage,winDef,pageDef.mainWinno,false,function(){
						var innerWinId = $.page.idFunc.getWinid(innerWinno);
						var $win=$("#"+innerWinId);
						var wgWinId = $.page.idFunc.getWinid(winDef.wingrpno);
						var $wgWin=$("#"+wgWinId);
						var innerHeight=$.getCSSNum($wgWin,"height")-$wgWin.find(">h3").height()
						                                             //  ^ 标题                                                                              
								-$wgWin.find(">div>div>ul").height() - $wgWin.find(">div.foot_"+wgWinId).height()-9; // -9 是BUG 409的附带修改。
						        // ^ page方式下WG的头                                                                                 // 有可能有底部栏     
						var top = $wgWin.find(">h3").height()+$wgWin.find(">div>div>ul").height()+8;
						// 底部栏有可能在顶部还有一个
						if ($wgWin.find(">div:eq(0)")[0].id.match("foot_"+wgWinId)) {  // BUG 409 如果第一个就是foot_win，则还好再扣一次foot_win
							innerHeight -= $wgWin.find(">div.foot_"+wgWinId).height()+1;
							top += $wgWin.find(">div.foot_"+wgWinId).height() +1;
						}
						$.page.winSize.resizeWinDiv(0, top,$.getCSSNum($wgWin,"width")-4,innerHeight,innerWinno);
						if (winDef.func_type == "WG") {
							var insideWGDef = $.WG.list[winDef.funcno];
							if (insideWGDef.layout == "grid") {
								for (var i = 0; i < insideWGDef.contwins.length; i ++) {
									var inside_innerwinno = insideWGDef.contwins[i].innerwinno;
									var insideWinDef = $.page.idFunc.getWinDefbyWinno(inside_innerwinno);
									$.page.createFuncWin($.page.currPage,insideWinDef,pageDef.mainWinno,false,function(funcno){  // Bug 164 解决某些窗口在第二次打开的时候宽度只有100px。增加唉参数funcno
										var v_winno = (funcno? $.page.idFunc.funcno2winno(funcno): inside_innerwinno);
										var v_windef = $.page.idFunc.getWinDefbyWinno(v_winno);
										var $win=$("#"+ $.page.idFunc.getWinid(v_winno));
										var v_wgWinId = $.page.idFunc.getWinid(v_windef.wingrpno)
										var $wgWin=$("#"+v_wgWinId);
										var innerHeight=$.getCSSNum($wgWin,"height")-$wgWin.find(">h3").height()       // BUG 409 的潜在待修改的地方。因为又下了一层，所以一般不太会再安排一个顶部的footer。所以这里还没有报过错误。暂时未改。
												-$wgWin.find(">div>div>ul").height()- $wgWin.find(">div.foot_"+v_wgWinId).height()-3;
										var x, y, w, h;
										if(insideWGDef.custom == 'Y'){
											var contWin = $.WG.findContWinsByInnerWinno(insideWGDef, v_winno);
											x=contWin.x;
											y=contWin.y;
											w = (contWin.width==0? $wgWin.width()/insideWGDef.colcount: contWin.width);
											h = (contWin.height== 0? $wgWin.height()/insideWGDef.rowcount: contWin.height);
										} else {
											//按照自动布局来布局，均分
											var wgDetail = insideWinDef; //insideWGDef.contwins[i];
											var tdWH=$.WG.sizeFuncs.getGridDivPos(insideWGDef,wgDetail);//计算td的高和宽  // BUG 416 所受影响的地方。这里当width为百分比时，getGridDivPos原来会将width设为0以作为警示。现在会先尝试用parent的宽度，若还不行才置为0.
											x = tdWH.left; y = tdWH.top; w = (tdWH.width==0?"100%":tdWH.width); h = tdWH.height;
										}
										
										setTimeout(function() {
											$.page.winSize.resizeWinDiv(x,y,w,h,v_winno);  // BUG 416 顺便发现的问题：第二次刷wg里的form时，总是无法调整内部inputs的宽度（因为宽度是百分比）。但加一个延时就好了（宽度就有px值了）。
										}, 200);
									});
								}
							}
						}
					});

				}finally{
				//	$screen.unblock();
				}
			},
			getWinsHeightMax:function(winDefs){
				var heights = [];
				for(var i=0;i<winDefs.length;i++){
					heights.push(winDefs[i].height+winDefs[i].foot_height+winDefs[i].y+ (winDefs[i].frame&&winDefs[i].showtitle?20:0)); 
                                                                                      // ^^^^^^BUG 390 带有标题的和不带有标题的弹出框弹出后的高度不一样。原来没有考虑这种不同，而直接在返回值里+30。
				}
				var maxHeight = Math.max.apply(Math,heights);
				return maxHeight + _shiftY +3;  
			},
			getWinsWidthMax:function(winDefs){
				var widths = [];
				for(var i=0;i<winDefs.length;i++){
					widths.push(winDefs[i].width+winDefs[i].x);
				}
				var maxWidth = Math.max.apply(Math,widths);
				return maxWidth + _shiftX;  
			},
			getDialogWinsFrame:function(winDefs){
				var dlgFrame={left:3000,top:3000,width:0,height:0};
				for(var i=0;i<winDefs.length;i++){
					dlgFrame.width=Math.max(dlgFrame.width,winDefs[i].width+winDefs[i].x);
					dlgFrame.height=Math.max(dlgFrame.height,winDefs[i].height+winDefs[i].foot_height+winDefs[i].y);
					dlgFrame.left=Math.min(dlgFrame.left,winDefs[i].x);
					dlgFrame.top=Math.min(dlgFrame.top,winDefs[i].y);
				}
				dlgFrame.width=dlgFrame.width-dlgFrame.left;
				dlgFrame.height=dlgFrame.height-dlgFrame.top;
				return dlgFrame;
			},
			getCenterWinsFrame:function(winDefs){
				var dlgFrame={left:3000,top:3000,width:0,height:0};
				var $winDiv;
				for(var i=0;i<winDefs.length;i++){
					$winDiv=$("#"+$.page.idFunc.getWinDivID(winDefs[i].winno));
					dlgFrame.width=Math.max(dlgFrame.width,$.getCSSNum($winDiv,"width")+$.getCSSNum($winDiv,"left"));
					dlgFrame.height=Math.max(dlgFrame.height,$.getCSSNum($winDiv,"height")+$.getCSSNum($winDiv,"top"));
					dlgFrame.left=Math.min(dlgFrame.left,$.getCSSNum($winDiv,"left"));
					dlgFrame.top=Math.min(dlgFrame.top,$.getCSSNum($winDiv,"top"));
				}
				dlgFrame.width=dlgFrame.width-dlgFrame.left;
				dlgFrame.height=dlgFrame.height-dlgFrame.top;
				return dlgFrame;
			},
			createFuncs:function(pageDef){   // bug 176 pageDef中已经添加initcond
				pageDef.createFinCnt=0;
				pageDef.allCompleteCnt=0;
				var mainWinDef;
				var winDefs=pageDef.wins;
				var winByOrd=this.sortFuncsByOrd(pageDef);
			    for(var i=0;i<winDefs.length;i++){
					if(winDefs[i].winno == pageDef.mainWinno){
						mainWinDef = winDefs[i];
						break;
					}
				}
			    
				// BUG 383 (两处)
			    // 为了优化复杂窗口的加载体验，将当前page先置为不可见？
				// 遮住正在load和布局的过程
			    var pageid =  $.page.idFunc.getPageid($.page.currPage);
				var $page = $("#" + pageid);
				var pagebarHeight = $.getElementHeight("pageBar", 0);
				$page.parent().block({
					"message":"请稍候...",
					"overlayCSS":{
						"backgroundColor": "#c0cde0", 
						"opacity":         0.2
					}
				});
				$page.css({"visibility": "hidden"});
				if (typeof($.page.refreshDialogOrd) == "undefined") {
					$.page.refreshDialogOrd = 0;
				}
				else {
					$.page.refreshDialogOrd += 1;
					$.page.refreshDialogOrd = $.page.refreshDialogOrd % 500; 
				}
				var rdo = $.page.refreshDialogOrd;
				setTimeout(function() {  // 增加一个页面相应超时判断：如果超过30秒仍然未刷出页面，则给出提示，允许用户重新刷新。用户也可选择等待，直到页面出现后，本对话框自动关闭。
					if (rdo == $.page.refreshDialogOrd && $page.css("visibility") == "hidden" && $("#pageBrokenHint").length == 0) {
						var $refreshDialog = $("<div id='pageBrokenHint'><br />页面暂时不可用。这可能是由于服务器忙或者网络拥挤导致的。<br /><br />请点击“重新加载”刷新页面或者继续等待。谢谢！</div>");
						$refreshDialog.dialog({
							title:"页面暂时不可用",
							bgiframe: true,
							modal: true,
							resizable: false,
							zIndex:20010,
							height:200,
							width:300,
							buttons: {
								"重新加载": function() {
									$(this).dialog('close');
									location.reload(true);
								}
							}
						});
					}
				}, 30000);

				$.page.createFuncWin( $.page.currPage, mainWinDef,mainWinDef.winno,mainWinDef.dialogshow,function(){
					if (mainWinDef.wingrpno==""&&mainWinDef.canexpand&&!mainWinDef.defaultexpand&&winDefs[i].expanded==undefined)//自动收缩
				    	$.page.winSize.shrinkWin(mainWinDef.winno);
					
					$.page.notifyCreateFin(pageDef);
					if (winByOrd){//按顺序依次创建
						$.page.recurseCreate(pageDef,0,mainWinDef.winno,mainWinDef.dialogshow);
						//$.page.notifyCreateFin(pageDef);
					}else{
						$.each(winDefs,function(i){//并行创建
							if (winDefs[i]!=mainWinDef)
								$.page.createFuncWin( $.page.currPage, winDefs[i],mainWinDef.winno,mainWinDef.dialogshow,function(){
									if (winDefs[i].wingrpno==""&&winDefs[i].canexpand&&!winDefs[i].defaultexpand&&winDefs[i].expanded==undefined)//自动收缩
				    					$.page.winSize.shrinkWin(winDefs[i].winno);
									$.page.notifyCreateFin(pageDef);
									}
								);
						});
					};
					if (mainWinDef.dialogshow){
						var dialogH=$.page.getWinsHeightMax(winDefs); // BUG 390 高度计算问题。宽度计算漏方法问题。与JSON版保持一致。
						var dialogW=$.page.getWinsWidthMax(winDefs);  
						var dialogOuterId = $.page.idFunc.getDialogOuterid(mainWinDef.winno);
						$("#"+dialogOuterId).dialog({			
							title:$.UC.parser(mainWinDef.init_title,true),
							bgiframe: true,
							modal: true,
							resizable: false,
							zIndex:10001,
							height: dialogH,//'auto',
							width: dialogW, //'auto',
							open:function(event, ui){
								//如果不remove的话，会出现排版乱的的情况-dialog在open的时候，h3中的div会自动加上ui-dialog-title类
								$(this).find(".ui-dialog-title").removeClass("ui-dialog-title");
								
							},
							close:function(event, ui){
								$.page.mainWin[$.page.currPage] =$.page.idFunc.getPageDefbyWinno(pageDef.dialogPreWin).mainWinno;
								$(this).remove();
								//再去影响
								if (mainWinDef.dlgcloserefresh) {
									if (pageDef.dialogPreWin == pageDef.dialogRefreshWin) {
										$.page.act.refresh(mainWinDef.funcno,pageDef.dialogPreWin+"^$");
									}
									else {
										$.page.act.refresh(mainWinDef.funcno,pageDef.dialogRefreshWin+"^$");
										$.page.act.refresh(mainWinDef.funcno,pageDef.dialogPreWin+"^$");
									}
								}
					     }});	
						 $.page.winSize.doWinsAlign(dialogOuterId); // BUG 387 显示后再次布局
					}
						
				},
				pageDef.initcond);  // bug 176 添加初始条件
			},
			notifyCreateFin:function(pageDef){//具体的func通知page，自己创建完毕了
				pageDef.allCompleteCnt+=1;
				pageDef.createFinCnt+=1;
				if (pageDef.allCompleteCnt>=pageDef.wins.length)//全部创建完毕及以后
					$.page.winSize.adjustWindowYPos(pageDef,0);
				if (pageDef.allCompleteCnt>=pageDef.wins.length||pageDef.createFinCnt==pageDef.wins.length){//全部创建完毕及以后
					//                    ^^^  注意这里是>=。原因是在grid按列排序后，也会触发complete，从而调用本方法，因此allCompleteCnt会不断增加。
					//                    如果是原来的== ，则在后续增加的时候可能不能正确判断是否所有窗体都创建完。结果导致在grid排序时，时而调用resize，时而不调用resize。 2014-4-9
					//            WARNING: 有后遗症:对dialog类型的窗体，在这一步时也拉伸了，导致dialog的内容超出边界!!
					pageDef.createFinCnt=0;

					$.page.doAlignWhenFin(pageDef);
					
					// 取消loading提示  BUG 383 (两处)
					var $page = $("#" + $.page.idFunc.getPageid($.page.currPage));//$.page.idFunc.getPageid(pageDef.mainWinno));
					$page.css("visibility", "visible")
					$page.parent().unblock();
					$("#pageBrokenHint").dialog("close");
				}
			},
			winSize:{
				PADDING_PX:3,
				
				getTopHeight:function(){//获取页面顶部的高度
				    /*var tabH=0;
				    if ($("#main ul:first").size()>0)
				    	tabH=$("#main ul:first").height();
				    var menuH    =$.getElementHeight("menuTree",0);菜单的高度				    
				    var headPicH =$.getElementHeight("headpic",0);图片的高度				    
				    var toolbarH =$.getElementHeight("toolbar",0);欢迎xxx的高度
				    return tabH+menuH+headPicH+toolbarH+8;*/
				    //$$$///
				    return 0;
				},
				getBtnBarHeight:function(winno){
					$bar=$(".foot_win"+winno);
					if ($bar.size()==0)
						return 0;
					else
						return $bar.size()*$bar.height()+4;
				},
				resizeWin:function(wLeft,wTop,wWidth,wHeight,winno){
					//$win.animate({left:wLeft+"px",top:wTop+"px",width:wWidth},100);
					var $win=$( "#win" + winno );
					var winDef=$.page.idFunc.getWinDefbyWinno(winno);
					$win.css("left",wLeft);
					$win.css("top",wTop);
					$win.css("width",wWidth);
					$("#main").find("div[id^=win]").css("z-index",0);
					$("#body_win"+winno ).css("width","100%");
					$("#body_win"+winno ).css("height",wHeight);
					//if ($[winDef.func_type].resizeWin!=null)
					//    $[winDef.func_type].resizeWin(winDef.funcno,wLeft,wTop,wWidth,wHeight);
					//下面是更新msx程序（支持布局位置设置）时发现的代码
					if ($[winDef.func_type]!=undefined &&typeof($[winDef.func_type].resizeWin)=="function")
						$[winDef.func_type].resizeWin(winDef.funcno,wLeft,wTop,wWidth,wHeight);					
				},
				resizeWinDiv:function(wLeft,wTop,wWidth,wHeight,winno){
					//$win.animate({left:wLeft+"px",top:wTop+"px",width:wWidth},100);
					var $win=$( "#win" + winno );
					var $bodyWin=$("#body_win"+winno );
					var winDef=$.page.idFunc.getWinDefbyWinno(winno);
					if (!isNaN(wHeight)) {
						$win.css({"height":wHeight});
					}
					if (!isNaN(wLeft)) {
						$win.css({"left":wLeft});
					}
					if (!isNaN(wTop)) {
						$win.css({"top":wTop});
					}
					if (!isNaN(wWidth)) {
						$win.css({"width":wWidth});
					}
					else if (wWidth.match(/[%]/)) {
						$win.css({"width": wWidth});
					}
					//$win.css({"left":wLeft,"top":wTop,"width":wWidth,"height":wHeight});
					$("#main").find("div[id^=win]").css("z-index",0);
					//$bodyWin.css("width","100%");
					$bodyWin.width("100%");
					
					if (!isNaN(wHeight)) {

						var bodyHeight=wHeight;
						var $titleBar=$win.find(">h3:first");
						if ($titleBar.length>0)
							bodyHeight=bodyHeight-($titleBar.height()==0?32:$titleBar.height())-2;//在tab切换到时候，明明有titlebar，但是height()却是0
						var $btnBar=$win.find(".foot_win"+winno);
						bodyHeight=bodyHeight-($btnBar.height()==0?32:$btnBar.height())*$btnBar.length;

						$bodyWin.css("height",bodyHeight);
						if ($[winDef.func_type]!=undefined &&typeof($[winDef.func_type].resizeWin)=="function"){
							$[winDef.func_type].resizeWin(winDef.funcno,wLeft,wTop,wWidth,bodyHeight-6);
						}
					}
					
				},
				maximizeWin:function(maxBtn,winno){
					var $win=$( "#win" + winno);
					var winDef=$.page.idFunc.getWinDefbyWinno(winno);
					//记录下win原来的position
					var bodywin=$("#body_win"+winno);
					winDef.oriPos={left:$win[0].offsetLeft,top:$win[0].offsetTop,
						           width:bodywin.width(),height:bodywin.height()};
					var left=0,top=$.page.winSize.getTopHeight();
					var width=$("#main").width()-2;
					var height=$.getBodyHeight()+_shiftY
					         -top //头上的标签页等的高度
					         -$.page.winSize.getBtnBarHeight(winno)//按钮bar的高度
					         -$("#win"+winno+"_head").height()//title的高度
					         -$.page.winSize.PADDING_PX*4//padding的高度
					         +4;
					$.page.winSize.resizeWin(left,top,width,height,winno);
					$win.css("z-index",100);
					maxBtn.find("img").attr("src","img/restorewin.png");
				},
				restoreWin:function(maxBtn,winno){
					var $win=$( "#win" + winno );
					var winDef=$.page.idFunc.getWinDefbyWinno(winno);
					var left=winDef.x+_shiftX;
					var top=winDef.y+_shiftY;
					var width=winDef.width;
					var height=winDef.height
					$.page.winSize.resizeWin(winDef.oriPos.left,winDef.oriPos.top,winDef.oriPos.width,winDef.oriPos.height,winno);
					maxBtn.find("img").attr("src","img/maxwin.png");
				},
				expandWin:function(winno){
					var winDef=$.page.idFunc.getWinDefbyWinno(winno);
					var expbtnid="win" + winDef.winno+"_expandbtn";
					//$("#body_win"+winno).css({"visibility":"visible","height":winDef.shrinkHeight+"px"});
					//$(".foot_win"+winno).css({"visibility":"visible"});
					
					$("#body_win"+winno).css({"display":"block","height":winDef.shrinkHeight+"px"});
					$(".foot_win"+winno).css({"display":"block"});
					
					$("#win"+winno).css({"height":""});
					$("#"+expbtnid).find("img").attr("src","img/shrink.png");
					this.adjustWindowYPosbyFunc(winDef.funcno);
					winDef.expanded=true;
				},
				shrinkWin:function(winno){
					var winDef=$.page.idFunc.getWinDefbyWinno(winno);
					var expbtnid="win" + winDef.winno+"_expandbtn";
					winDef.shrinkHeight=$("#body_win"+winno).height();
					$("#win"+winno).css({"height":($("#win"+winno+"_head").height()+2)+"px"});
					//$("#body_win"+winno).css({"height":"0px","visibility":"hidden"});
					//$(".foot_win"+winno).css({"visibility":"hidden"});
					$("#body_win"+winno).css({"height":"0px","display":"none"});
					$(".foot_win"+winno).css({"display":"none"});
					$("#"+expbtnid).find("img").attr("src","img/expand.png");
					this.adjustWindowYPosbyFunc(winDef.funcno);
					winDef.expanded=false;
				},
				adjustWindowYPos:function(pageDef,topWinno){
				    var yposOrderWin=[];
				    var winno,i,j,idx;
				    var topPos=0,winPos;
				    var winHeight=0;
				    var $win;
				    if (topWinno>0&&$("#win"+topWinno).length>0)
				        topPos=$("#win"+topWinno)[0].offsetTop;
					//1.按照所有窗口的y坐标，从低到高，建立次序
				    idx=0;
					for(i=0;i<pageDef.wins.length;i++){
						winno=pageDef.wins[i].winno;
						if (pageDef.wins[i].wingrpno!="")//窗口容器中的子窗，不参与高度调整
							continue;
						$win=$("#win"+winno);
						if ($win.length==0)//说明窗口都没有创建完毕，不用调整高度;
						    return;
						winPos=$win[0].offsetTop;
						if (winPos>topPos){
							yposOrderWin[idx]={};
							yposOrderWin[idx].winno=winno;
							yposOrderWin[idx].ypos=winPos;	
							yposOrderWin[idx].height=$("#win"+winno).height();
							idx+=1;
						}
					}
					//1.2.冒泡一把
					var tempWinYPos;
					for (i=0;i<yposOrderWin.length;i++){
						for(j=0;j<yposOrderWin.length-i-1;j++){
							if (yposOrderWin[j].ypos>yposOrderWin[j+1].ypos){
								tempWinYPos=yposOrderWin[j];
								yposOrderWin[j]=yposOrderWin[j+1];
								yposOrderWin[j+1]=tempWinYPos;
							}		
						}
					};
					//2.按照yposOrderWin的顺序来调整高度了
					var maxTop;
					if (yposOrderWin.length>0){
						for(i=0;i<yposOrderWin.length;i++){
							winno=yposOrderWin[i].winno;
							var winDef=$.page.idFunc.getWinDefbyWinno(winno);
                                                        if (winDef){
                                                            if (winDef.posbywin!=""){//说明被窗口影响
                                                                    maxTop=$.page.winSize.calcMaxTop(winDef.posbywin);
                                                                    $("#win"+winno).css("top",maxTop+4+"px");
                                                                    winHeight=Math.max(winHeight,maxTop+4+$("#win"+winno).height());
                                                            }else{
                                                                    winHeight=Math.max(winHeight,$("#win"+winno)[0].offsetTop+$("#win"+winno).height());
                                                            }
                                                        } else {
                                                            winHeight=Math.max(winHeight,$("#win"+winno)[0].offsetTop+$("#win"+winno).height());
                                                        }
						}
					}
					yposOrderWin.length=0;

					$.page.setMainHeight(winHeight-$.page.winSize.getTopHeight());
				},
				adjustWindowYPosbyFunc:function(trigFuncno){//具体的功能窗（如grid）大小发生变化后，调用此方法来调整大小
					var winno=$.page.idFunc.funcno2winno(trigFuncno);
					if (winno!=undefined){
						var pageDef=$.page.idFunc.getPageDefbyfuncno(trigFuncno);
						this.adjustWindowYPos(pageDef,winno);
					}
				},
				calcMaxTop:function(posbywin){//根据被谁影响来计算这些窗口的最大的高
				    var wins=posbywin.split(",");
				    var maxH=0;
				    for (var i=0;i<wins.length;i++){
				    	if (wins[i]!=null&&wins[i]!=""){
				    	    maxH=Math.max($("#win"+wins[i])[0].offsetTop+ $("#win"+wins[i]).height(),maxH);	
				    	}
				    }
				    return maxH;
				    wins.length=0;
				},
				rightExtWin:function(winDef){
					//组合窗口的自动扩展由组合窗口来管理
					if (winDef.wingrpno==""){
						if (winDef.rightext){
							var width=$("#main").width()-(winDef.x+_shiftX) - 22;
							this.resizeWin(winDef.x+_shiftX,winDef.y+_shiftY,width,winDef.height,winDef.winno);
						}
						if(winDef.bottomext){
							var height=$("#main").height()-(winDef.y-_shiftY)-5;
							this.resizeWin(winDef.x+_shiftX,winDef.y+_shiftY,winDef.width,height,winDef.winno);
						}
					}
				},
				//策略,和Delphi一样，alTop-->alBottom-->alLeft-->alRight的优先级顺序
				doWinsAlign:function(target,pageWins,targetWinno){
					var CLIENT_GAP=5;
					//var alignRect={left:_shiftX+CLIENT_GAP,top:_shiftY+48+CLIENT_GAP,
					//				width:$.getBrowserWidth()-CLIENT_GAP*2-10,
					//				height:$.getBrowserHeight()-50-_shiftY-CLIENT_GAP*2};
					var $main = $("#"+target);
					var alignRect;
						
					//以下为默认值的赋值....主要就是为了main和WG来用的
					if (pageWins==undefined){
						var pageDef = $.page.list[$.page.mainWin[$.page.currPage]];
						if (typeof(pageDef) == "undefined") {
							return;
						};
						pageWins=pageDef.wins;	
					};
					if (targetWinno==undefined){//说明是main
						if (target == "main") {
							alignRect={left:CLIENT_GAP,top:($.page.multiWin!="F"?26:0)+CLIENT_GAP,
									width:$main.width()-CLIENT_GAP*2-16,
									height:$main.height()-($.page.multiWin!="F"?26:0)-CLIENT_GAP*2-16};
						}
						else { // 非main，一般是对话框  // BUG 387 
							alignRect={left:7,top:32,
								width:$main.width(),
								height:$main.height()};
						}
					}else{//说明是WG
					    var titleH=$.getElementHeight($.page.idFunc.getTitleid(targetWinno),0);
						alignRect={left:CLIENT_GAP,top:titleH+CLIENT_GAP,
								   width:$main.width()-CLIENT_GAP*2-16,
								   height:$main.height()-titleH-CLIENT_GAP*2-16};
					}
					
					var wins=[];
					for (var i=0;i<pageWins.length;i++){
						if ((pageWins[i].wingrpno==""&&targetWinno==undefined)//顶层的align
							||(pageWins[i].wingrpno==targetWinno)){
							wins[wins.length]=pageWins[i];
						}
					}
					
					//排序算法，都是sortField升序
					function sortWins(wins,arWins,sortField,isAsc){
						if (arWins.length==0)
							return;
						var tempVar;
						for(var i=0;i<arWins.length-1;i++){
							for(var j=0;j<arWins.length-i-1;j++)
							if (isAsc&&wins[arWins[j]][sortField]>wins[arWins[j+1]][sortField]){
								tempVar=arWins[j+1];
								arWins[j+1]=arWins[j];
								arWins[j]=tempVar;
							}
							if (!isAsc&&wins[arWins[j]][sortField]<wins[arWins[j+1]][sortField]){
								tempVar=arWins[j+1];
								arWins[j+1]=arWins[j];
								arWins[j]=tempVar;
							}
						}
					}
					
					function winsLayout(alignRect,arTopWins,arBottomWins,arLeftWins,arRightWins,arCenterWins,clientWin){
						//获取一块区域，并挖走这块区域
						var srcRect=$.extend(alignRect,{});
						var GAP=5;
						function getRect($winDiv,align){
							function ocupyRect(rstRect,align){
								if (align!="alTop"&&(rstRect.width>alignRect.width||rstRect.height>alignRect.height))
									return false;
								switch (align){
									case "alTop":
										alignRect=$.extend(alignRect,{top:alignRect.top+rstRect.height+GAP,
															height:alignRect.height-rstRect.height-GAP});									
										break;
									case "alBottom":
										alignRect=$.extend(alignRect,{height:alignRect.height-rstRect.height-GAP});									
										break;
									case "alLeft":
										alignRect=$.extend(alignRect,{left:alignRect.left+rstRect.width+GAP,
															width:alignRect.width-rstRect.width-GAP});										
										break;
									case "alRight":
										alignRect=$.extend(alignRect,{width:alignRect.width-rstRect.width-GAP});										
										break;
									case "alClient":
								}
								return true;
							}
							var oriRect={left:$.getCSSNum($winDiv,"left"),
										 top:$.getCSSNum($winDiv,"top"),
										 width:$.getCSSNum($winDiv,"width"),
										 height:$.getCSSNum($winDiv,"height")};
							var rstRect;
							switch (align){
								case "alTop":
									rstRect={left:	alignRect.left,
											 top:	alignRect.top,
											 width:	alignRect.width,
											 height:$.getCSSNum($winDiv,"height")
											};
									break;
								case "alBottom":
									rstRect={left:	alignRect.left,
											 top:	alignRect.top+alignRect.height-$.getCSSNum($winDiv,"height"),
											 width:	alignRect.width,
											 height:$.getCSSNum($winDiv,"height")
											};
									break;
								case "alLeft":	
									rstRect={left:	alignRect.left,
											 top:	alignRect.top,
											 width:	$.getCSSNum($winDiv,"width"),
											 height:alignRect.height
											};
									break;
								case "alRight":	
									rstRect={left:	alignRect.left+alignRect.width-$.getCSSNum($winDiv,"width"),
											 top:	alignRect.top,
											 width:	$.getCSSNum($winDiv,"width"),
											 height:alignRect.height
											};
									break;
								case "alClient":
									rstRect=alignRect;
									break;
							}
							if (ocupyRect(rstRect,align))
								return rstRect;
							else
								return oriRect;
						}
						function doOneTypeWins(arOneWins){
							var $winDiv,winRect;
							for(var i=0;i<arOneWins.length;i++){
								$winDiv=$("#"+$.page.idFunc.getWinDivID(wins[arOneWins[i]].winno));
								if ($winDiv.css("display")=="none")
									continue;
								winRect=getRect($winDiv,wins[arOneWins[i]].align);
								$.page.winSize.resizeWinDiv(winRect.left,winRect.top,winRect.width,winRect.height,wins[arOneWins[i]].winno);
							}
						}
						doOneTypeWins(arTopWins);
						doOneTypeWins(arBottomWins);
						doOneTypeWins(arLeftWins);
						doOneTypeWins(arRightWins);
						if (clientWin!=undefined)
							doOneTypeWins([clientWin]);
						//再单独处理arCenterWins
						var centerRect=$.page.getCenterWinsFrame(arCenterWins);
						var detaX=srcRect.width/2-centerRect.width/2+srcRect.left-centerRect.left;
						var detaY=srcRect.height/2-centerRect.height/2+srcRect.top-centerRect.top;
						var $winDiv;
						for(var i=0;i<arCenterWins.length;i++){
							$winDiv=$("#"+$.page.idFunc.getWinDivID(arCenterWins[i].winno));
							$.page.winSize.resizeWinDiv(
													Math.max($.getCSSNum($winDiv,"left")+detaX,srcRect.left),
													Math.max($.getCSSNum($winDiv,"top")+detaY,srcRect.top),
													$.getCSSNum($winDiv,"width"),
													$.getCSSNum($winDiv,"height"),
													arCenterWins[i].winno);
						}		
					}
					
					//1.先整出各个align的窗口，clientWin不允许多个，否则没法整
					var arTopWins=[],arBottomWins=[],arLeftWins=[],arRightWins=[],clientWin,arCenterWinNums=[],arCenterWins=[];
					for (var i=0;i<wins.length;i++){
						switch (wins[i].align){
							case "alTop":	
								arTopWins[arTopWins.length]=i;
								break;
							case "alBottom":
								arBottomWins[arBottomWins.length]=i;
								break;
							case "alLeft":	
								arLeftWins[arLeftWins.length]=i;
								break;
							case "alRight":	
								arRightWins[arRightWins.length]=i;
								break;
							case "alClient":
								clientWin=i;
								break;
							case "alCenter":
								arCenterWinNums[arCenterWinNums.length]=i;
								break;
						}
					};
					//2.按照窗口布局，排序一下
					sortWins(wins,arTopWins,"y",true);
					sortWins(wins,arBottomWins,"y",false);
					sortWins(wins,arLeftWins,"x",true);
					sortWins(wins,arRightWins,"x",false);
					sortWins(wins,arCenterWinNums,"y",true);
					for(var i=0;i<arCenterWinNums.length;i++)
						arCenterWins[i]=wins[arCenterWinNums[i]];
						
					
					//3.布局开始了...
					winsLayout(alignRect,arTopWins,arBottomWins,arLeftWins,arRightWins,arCenterWins,clientWin);
					
					arTopWins=undefined;
					arBottomWins=undefined;
					arLeftWins=undefined;
					arRightWins=undefined;
					arCenterWins=undefined;
					arCenterWinNums=undefined;
					wins=undefined;

				}
			},
		    
		    
			idFunc:{
				getWinDivID:function(winno){
				    return "win"+winno;
				},
				getWinDefbyWinno:function(winno){
					for (var mainWinno in $.page.list){
					    for(var i=0;i<$.page.list[mainWinno].wins.length;i++){
					    	if ($.page.list[mainWinno].wins[i].winno==winno){
					    		return $.page.list[mainWinno].wins[i];
					    	}
					    }
					}
				},
				getPageDefbyfuncno:function(funcno){
					var pageDef=null;
					for(var mainWinno in $.page.list){
						pageDef=$.page.list[mainWinno];
						for(var i=0;i<pageDef.wins.length;i++){
							if (pageDef.wins[i].funcno==funcno)
								return pageDef;
						}
					}
				},
				getPageDefbyWinno:function(winno){
					var pageDef=null;
					for(var mainWinno in $.page.list){
						pageDef=$.page.list[mainWinno];
						for(var i=0;i<pageDef.wins.length;i++){
							if (pageDef.wins[i].winno==winno)
								return pageDef;
						}
					}
				},
				funcno2winno:function(funcno){
					var foundWinno = undefined;
					var mainWinno=$.page.mainWin[$.page.currPage];
					for(var i=0;i<$.page.list[mainWinno].wins.length;i++){
				    	if ($.page.list[mainWinno].wins[i].funcno==funcno){
				    		foundWinno = $.page.list[mainWinno].wins[i].winno;
				    	}
				    }
					// BUG 394 对于有弹出框的页面，mainWinno会变为弹出框。而此时要找funcno对应的winno，实际上不能只在弹出框后面的同步条上找，而可能要在前面的currPage上找。
					// 因此增加下面一段，在找不到的时候，退到currPage再找一遍，应该就能找到。
					if (foundWinno == undefined) {
						var formerWins = $.page.list[$.page.currPage].wins;
						for(var i=0;i<formerWins.length;i++){
					    	if (formerWins[i].funcno==funcno){
					    		foundWinno = formerWins[i].winno;
					    	}
					    }
					}
					return foundWinno;
				},
				getPageid: function(winno) {
					return "page" + winno;
				}, 
				getWinid:function(winno){
					return "win"+winno;
				},
				getTitleid:function(winno){
					return "win"+winno+"_head";
				},
				getBodyWinid:function(winno){
					return "body_win"+winno;
				},
				getDialogWinid:function(mainwinno){
					return "dialogwin_"+mainwinno;
					
				},
				getDialogOuterid:function(mainwinno){
					return "dialogOuter_"+mainwinno;
					
				}
			
			}
			
	}/*end for page*/
	
})(jQuery);
