;(function($){
	$.MC = $.msgContent =  {
		options:{
		    contentParamURL:  $.global.functionDefinitionUrl+"?type=MC",
		    MORE_H:22
		},
		 
		list:{},
		validators:{},
		runInstance: function( funcNo,options ){
			var op = $.extend({
					complete:function(){},
					allComplete:function(){},
					rowSelected:function(){},
					target:		 "main"
					
					},options);
			if($.msgContent.list[funcNo] == null){
				$.ajax({
					type: "POST",
					url:  $.msgContent.options.contentParamURL,
					data: {funcNo: funcNo},
					dataType: "json",
					success:  function( data,textStatus ){
						var contentDef = data[0];
						contentDef.complete = op.complete;
						contentDef.allComplete = op.allComplete;
						contentDef.winTitle=$.MC.getTitleDivbytarget(op.target);
						contentDef.target=op.target;
						
						$.msgContent.list[funcNo] = contentDef;
						$.msgContent.createNew(contentDef,op.target);
					},
					error:function(e){
						$.msgbox.show("err","请求显示的功能"+funcNo+"不存在或存在定义错误：<br>"+e.responseText);
					}
				});
			}else{
				var contentDef = $.msgContent.list[funcNo];
				$.msgContent.createNew(contentDef,op.target);
			}
			return contentDef;
		},
		
		createNew:function(contentDef,target){
			if (contentDef.adTimer!=undefined)
				clearInterval(contentDef.adTimer);
			var targetwin=$("#"+target) 
			$contMain=$("<div id='"+$.MC.idFuncs.getContMainID(contentDef.funcno)+"'></div>")
			           .css({width:targetwin.width()-2,height:targetwin.height(),overflow:"hidden","font-size":"12px"})
			           .appendTo(targetwin);
			
			
			//添加页面选项卡
			if (contentDef.subgrps.length>0){
				titleH=$("#"+contentDef.winTitle).height()+3;
				$("#"+contentDef.winTitle).remove();
				targetwin.css({height:targetwin.height()+titleH});
				$contMain.css({height:targetwin.height()});
				
				$("<ul></ul>").appendTo($contMain);
				$contMain.tabs();
				for(var i=0;i<contentDef.subgrps.length;i++){
				    $contMain.tabs("add",
								   "#"+$.MC.idFuncs.getPagerID(contentDef.funcno,i),
								   _cutStr(contentDef.subgrps[i],6,"..."),
								   i);
				    $contMain.tabs("select",i);
				    var mcH=$contMain.height();
				    if (i!=0)
				    	mcH+=$.MC.options.MORE_H;
				    var $div = $("<div id='"+$.MC.idFuncs.getMsgContDivID(contentDef.funcno,i)+"'></div>")
					.css({width:"100%"/*$contMain.width()*/,height:mcH,overflow:"hidden",position:"absolute"})
					.appendTo($("#"+$.MC.idFuncs.getPagerID(contentDef.funcno,i)));
					$.msgContent.content[contentDef.showstyle](contentDef,targetwin,i,contentDef.subgrps[i]);  
				}
				$contMain.tabs("select",0);
			}
			else{
			    //新闻的话，标题的字靠左
			    $("#"+contentDef.winTitle).css({"text-align":"left"});
				
				var $div = $("<div id='"+$.MC.idFuncs.getMsgContDivID(contentDef.funcno,0)+"'></div>")
				.css({width:"100%"/*$contMain.width()*/,height:$contMain.height(),overflow:"hidden",position:"absolute"})
				.appendTo($contMain);
				$.msgContent.content[contentDef.showstyle](contentDef,targetwin,0,"");
			}
			if(typeof(contentDef.complete) == "function")
				contentDef.complete();
			if(typeof(contentDef.allComplete)=="function")
						contentDef.allComplete();
		},
		content:{
			pic:function(contentDef,targetwin,grpIdx,grpTitle){
			    var target=targetwin.find("#"+$.MC.idFuncs.getMsgContDivID(contentDef.funcno,grpIdx));
				var showImg=function(index){
			        var adHeight = target.height();
					$("#"+$.MC.idFuncs.getUlScrollID(contentDef.funcno,grpIdx)).stop(true,false).animate({top : -adHeight*index},1000);
					$("#"+$.MC.idFuncs.getUlScIdxID(contentDef.funcno,grpIdx)+" li").removeClass("on")
						.eq(index).addClass("on");
					$("#"+$.MC.idFuncs.getUlScIdxID(contentDef.funcno,grpIdx)+" li").css({color:"#6FA7D1",width:"16px",height:"16px",margin:"3px 1px",border:"1px solid #6FA7D1",
						         "font-size":"12px","line-height":"16px","font-weight":"bold","background-color":"#fff"});
					
					$(".on").css({color:"#fff",width:"21px",height:"21px",margin:"0 1px",border:0,
						         "font-size":"16px","line-height":"21px","font-weight":"bold","background-color":"#6FA7D1"});
				}
				var scrollImg=function(itemsCnt){
					 var index = 0;
					 $("#"+$.MC.idFuncs.getUlScIdxID(contentDef.funcno,grpIdx)+" li").mouseover(function(){
						index  = $("#"+$.MC.idFuncs.getUlScIdxID(contentDef.funcno,grpIdx)+" li").index(this);
						showImg(index);
					 }).eq(0).mouseover();	
					 //滑入 停止动画，滑出开始动画.
					 if (contentDef.autoscroll){
						 $(target).hover(function(){
								 clearInterval(adTimer);
							 },function(){
								 adTimer = setInterval(function(){
								    showImg(index)
									index++;
									if(index==itemsCnt){index=0;}
								  } , contentDef.scrolltime);
						 }).trigger("mouseleave");
					 }
				}
			    var itemsCnt=contentDef.contentinfo.length;
				var ulScroll,ulIdx;
				var imgCnt=$.MC.getContInfoCnt(contentDef,grpTitle);
				if (imgCnt>0){
					//滚动图像的ul
					ulScroll=$("<ul class=ul id="+$.MC.idFuncs.getUlScrollID(contentDef.funcno,grpIdx)+" style='position:absolute;list-style:none'>")
					         .appendTo(target);
					//索引标签ul
					if (itemsCnt>1)
				    	ulIdx=$("<ul class=idx id="+$.MC.idFuncs.getUlScIdxID(contentDef.funcno,grpIdx)+" style='position:absolute;right:5px;bottom:5px;display:block;'>")
					          .appendTo(target);
				}
				for (var i=0;i<itemsCnt;i++){
					if (contentDef.contentinfo[i].grptitle==grpTitle){
						$("<li style='height:"+target.height()+"px;cursor:pointer;' idx="+i+">"
							//+"<img src='"+contentDef.contentinfo[i].img+"' width="+target.width()+"px height="+target.height()+"px></li>")
								+"<img src='"+contentDef.contentinfo[i].img+"' width='auto' height="+target.height()+"px></li>")
						.appendTo(ulScroll)
						.click(function(){
							index=$(this).attr("idx");
							var contInfo=contentDef.contentinfo[index]; 
							$.userContext.setData(contentDef.funcno+"-CONTID",contInfo.contentid);
					    	if (contInfo.selmode!=""){
							    var clickFunc=$.MC.doHref[contInfo.selmode];
								if (clickFunc!=undefined)
						        	clickFunc(contInfo.contentlink,contInfo.relkey, "#" + contentDef.funcno+"-CONTID#");
						    }
						 });
						 if (imgCnt>1)
							 var ulIdxItem=$("<li style='float:left;color: #6FA7D1;text-align: center;line-height: 16px;width: 16px;height: 16px;font-family: Arial;"
							 +"font-size: 12px;cursor: pointer;overflow: hidden;margin: 3px 1px;border: 1px solid #6FA7D1;background-color: #fff;'>"
						     +(i+1)+"</li>")
						     .appendTo(ulIdx);
					}
				}
				if (imgCnt>1)
				    scrollImg(imgCnt);
			},
			list:function(contentDef,targetwin,grpIdx,grpTitle){
				var target=targetwin.find("#"+$.MC.idFuncs.getMsgContDivID(contentDef.funcno,grpIdx));
				var moveList=function(scrollul){
					var scrollli=scrollul.find("li:first");
					scrollul.animate({ marginTop: -scrollli.height()-2+"px" }, contentDef.scrolltime -40 , function(){
				        scrollul.css({marginTop:0}).find("li:first").appendTo(scrollul);}) //appendTo能直接移动元素
				};
				var scrollList=function(){
					if (contentDef.autoscroll){
						var scrollList = $("#"+$.MC.idFuncs.getUlScrollID(contentDef.funcno,grpIdx));
						var scrollTimer;
						scrollList.hover(function(){
							  clearInterval(scrollTimer);
						 },function(){
						   scrollTimer = setInterval(function(){
										 moveList( scrollList );
									}, contentDef.scrolltime );
						}).trigger("mouseleave");
					}
				};
				var listCnt=$.MC.getContInfoCnt(contentDef,grpTitle);
				//加上底下的更多
				//$.MC.appendMoreBtn(contentDef,targetwin,grpIdx);
				var ulScroll;
				if (listCnt>0){
					ulScroll=$("<ul class=ul id="+$.MC.idFuncs.getUlScrollID(contentDef.funcno,grpIdx)+">")
					          .appendTo(target);
					ulScroll.css({"padding":"6px 0px 5px 8px","margin":"0px","list-style":"none"});
				}
				for (var i=0;i<contentDef.contentinfo.length;i++){
					if (contentDef.contentinfo[i].grptitle==grpTitle){
						var contInfomation=contentDef.contentinfo[i]; 
						$("<li style='cursor:pointer;padding:1px;margin:1px' idx="+i+">"
						 +"  <a href='#' title='"+contInfomation.contenttitle+"' style='color:#0287CA;text-decoration:none;"
						 +     "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display: block;'>"
						 +   contInfomation.contenttitle+"</a>"
						 +"  <img src='img/dotLine.gif' style='width:98%;height:1px;display:block'>"
						 +"</li>")
						 .appendTo(ulScroll)
						 .click(function(){
							index=$(this).attr("idx");
							var contInfo=contentDef.contentinfo[index];
							$.userContext.setData(contentDef.funcno+"-CONTID",contInfo.contentid);
					    	if (contInfo!=null && contInfo.selmode!=""){
							    var clickFunc=$.MC.doHref[contInfo.selmode];
								if (clickFunc!=undefined)
						        	clickFunc(contInfo.contentlink,contInfo.relkey, "#" + contentDef.funcno+"-CONTID#");
						    }
					     });
					}
				}
				if (listCnt>1)
			    	scrollList();	
			},
			//pic and word://图文混和
			paw:function(contentDef,targetwin,grpIdx,grpTitle){
				//const
				var PAW_LI_HEIGHT=104;
				var LI_PIC_WIDTH =120;
				
				var target=targetwin.find("#"+$.MC.idFuncs.getMsgContDivID(contentDef.funcno,grpIdx));	
				var listCnt=$.MC.getContInfoCnt(contentDef,grpTitle);
				
				//加上底下的更多
				
				//$.MC.appendMoreBtn(contentDef,targetwin,0);
				
				var ulScroll;
				if (listCnt>0){
					ulScroll=$("<ul class=ul id="+$.MC.idFuncs.getUlScrollID(contentDef.funcno,grpIdx)+">")
							  .css({"padding":"0px","margin":"0px","list-style":"none"})
					          .appendTo(target);
				}
				for (var i=0;i<contentDef.contentinfo.length;i++){
					if (contentDef.contentinfo[i].grptitle==grpTitle){
						var contInfomation=contentDef.contentinfo[i]; 
						//1.加上li
						$pawli=$("<li style='cursor:pointer;padding:1px;margin:1px;height:"+PAW_LI_HEIGHT+"px' idx="+i+">")
						.appendTo(ulScroll)
				 		.click(function(){
							index=$(this).attr("idx");
							var contInfo=contentDef.contentinfo[index]; 
							$.userContext.setData(contentDef.funcno+"-CONTID",contInfo.contentid);
			    			if (contInfo.selmode!=""){
					    		var clickFunc=$.MC.doHref[contInfo.selmode];
								if (clickFunc!=undefined)
				        		clickFunc(contInfo.contentlink,contInfo.relkey, "#" + contentDef.funcno+"-CONTID#");
				    		}
			     		});
						
						$divMain=$("<div style='height:"+(PAW_LI_HEIGHT-3)+"px'>").appendTo($pawli);
						//2.加上图片显示区域
						$divImg=$("<div style='float:left;padding:0px;margin:0px;height:"+PAW_LI_HEIGHT+"px;width:"+LI_PIC_WIDTH+"px'>").appendTo($divMain);
						$("<img src='"+contentDef.contentinfo[i].img+"' width="+$divImg.width()+"px height="+$divImg.height()+"px>").appendTo($divImg);
						
						$divWords=$("<div style='float:left;height:"+PAW_LI_HEIGHT+"px;width:"+(target.width()-LI_PIC_WIDTH-7)+"px'>")
						          .appendTo($divMain);
						//3.加上Title区域
						$("<div>"+contentDef.contentinfo[i].contenttitle+"</div>")
						.css({height:(PAW_LI_HEIGHT/3)+"px","font-size":"14px","text-align":"center",color:"#0287CA","font-weight":"bold",
							  margin:"3px 20px 3px 20px",overflow:"hidden"}) 
						.appendTo($divWords);
						 
						//4.加上内容索引区域
						$("<div>"+contentDef.contentinfo[i].contabst+"</div>")
						.css({height:(PAW_LI_HEIGHT*2/3-10)+"px","font-size":"10px",color:"#0287CA",margin:"4px",overflow:"hidden"}) 
						.appendTo($divWords);
						
						//5.加上分隔线
						$("<div style='height:1px'><img src='img/dotLine.gif' style='width:98%;height:1px;display:block'></div>").appendTo($pawli);
						//"+(target.width()-20)+"px
					}
				}
			},
			date:function(contentDef,targetwin,grpIdx,grpTitle){
				var target=targetwin.find("#"+$.MC.idFuncs.getMsgContDivID(contentDef.funcno,grpIdx));
				target.datepicker({
					inline: true
				});
			}
		},
		refresh:function(funcno, filter){
			$("#"+$.MC.getMoreContID(funcno)).remove();
			var contentDef = $.MC.list[funcNo];
			$.MC.createNew(contentDef,op.target);
		},
		resizeWin:function(funcno,left,top,width,height){},
		check:function(funcno){},
		
		doHref:{
			html:function(href,realkey){
			    window.open(href+realkey);
			},
			win:function(href,realkey, contid){
				var ar=realkey.split(",");
				if (ar[1]==undefined)
					ar[1]="";
				if (typeof(contid) != "undefined")
					$.page.openExternal(ar[0],ar[1], null, contid)
				else
					$.page.openExternal(ar[0],ar[1]);
			}
		}
		,
		getTitleDivbytarget:function(target){
			var al=target.split("body_win");
			return "win"+al[1]+"_head";
		},
		showMoreCont:function(contentDef){
			window.showModalDialog("moreContent.html",contentDef.funcno+"|"+contentDef.userfilter,
				                   "dialogHeight="+screen.availHeight+";dialogWidth="+screen.availWidth +";resizable=false;");
		},
		appendMoreBtn:function(contentDef,target,grpIdx){
			tabNavH=$.MC.getTabNavHeight(contentDef.funcno);
			mcDiv=target.find("#"+$.MC.idFuncs.getMsgContDivID(contentDef.funcno,grpIdx));
			target.find("#"+$.MC.idFuncs.getMsgContDivID(contentDef.funcno,grpIdx)).css({height:mcDiv.height()-$.MC.options.MORE_H-tabNavH});
			if ($("#"+$.MC.idFuncs.getMoreContID(contentDef.funcno)).size()==0){
				target.find("#"+$.MC.idFuncs.getContMainID(contentDef.funcno)).css({height:target.height()-$.MC.options.MORE_H});
				$("<div class='ui-widget-header ui-corner-all' style='text-align:right;height:"+$.MC.options.MORE_H+"px'>"
					+"<span style='float:right;cursor:pointer' id='"+$.MC.idFuncs.getMoreContID(contentDef.funcno)+"'>更多>></span>"
					+"</div>")
				    .appendTo(target);
			    $("#"+$.MC.idFuncs.getMoreContID(contentDef.funcno)).click(function(){
			    	$.MC.showMoreCont(contentDef)
			    });
			}
		},
		getTabNavHeight:function(funcno){
			var contMID=$.MC.idFuncs.getContMainID(funcno);
			if ($("#"+contMID+" .ui-tabs-nav").size()==0)
				return 0;
		    else
		    	return $("#"+contMID+" .ui-tabs-nav").height();
		},
		getContInfoCnt:function(contentDef,grpTitle){
			var itemCnt=0;
			for(var i=0;i<contentDef.contentinfo.length;i++){
			 	if (contentDef.contentinfo[i].grptitle==grpTitle){
			 		itemCnt+=1;
			 	}
			}	
			return itemCnt;
		},
		idFuncs:{
			getMoreContID:function(funcno){
				return "moreCont_"+funcno;
			},
			getContMainID:function(funcno){
				return "contMain"+funcno;
			},
			getMsgContDivID:function(funcno,grpIdx){
			    return "msgCont"+funcno+"_"+grpIdx;
			},
			getUlScrollID:function(funcno,grpIdx){
				return "ulScroll"+funcno+"_"+grpIdx;
			},
			getUlScIdxID:function(funcno,grpIdx){
				return "ulScIdx"+funcno+"_"+grpIdx;
			},
			getPagerID:function(funcno,grpIdx){
				return "mcPage_"+funcno+"_"+grpIdx;
			}
		}
	}
})(jQuery);