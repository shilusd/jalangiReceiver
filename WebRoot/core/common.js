

if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;  
     var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len; 
     for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

function _cutStr(str,len,fix){
		if(str.length<=len)
			return str;
		return str.substring(0,len-1)+fix;
}
;(function($){
	$.global = {
			functionDefinitionUrl:"loadDefinition.action",
			iconSet:{"Q":"ui-icon-search","G":"ui-icon-search","F":"ui-icon-pencil","D":"ui-icon-image","C":"ui-icon-newwin","T":"ui-icon-carat-2-n-s","P":"ui-icon-print"},
			//常量定义全部用大写字母
			SEL_DEF_ITEM:"<请选择>",
			DATA_SPLIT_STR:"$|",
			DATA_SPLIT_ROW:"^|",
			USER_ICO_ROOT:"img/user_ico/"
	};
	$.chDigits = ["零","一","二","三","四","五","六","七","八","九","十"];
	
	$.getBidingData = function(sql,callback){
		$.ajax({
			type:"POST",
			data:{sql:sql},
			datatype:"text",
			url:"common_getBindingData.action",
			success:function( data ){
				try{
					callback(data);
				}catch(e){
					callback("");
				}
			},
			error:function( e ){
				callback({});
				$.msgbox.show("err","获取select sql 绑定数据错误:"+sql);
			}
		});
	};
  $.substring=function(str,subLen) { 
	    var len = 0;
	    for (var i = 0; i < str.length; i++) {  
	    	if (str.charCodeAt(i) > 255 || str.charCodeAt(i)<0) len += 2; else len ++;
	        
	        if (len>subLen){
	        	return str.substring(0,i);
	        }
	    }  
	    return str;  
	};	
	$.strlen=function(str) {   
		var len = 0;
	    for (var i = 0; i < str.length; i++) {  
	    	if (str.charCodeAt(i) > 255 || str.charCodeAt(i)<0) len += 2; else len ++;
	        
	    }  
	    return len;  
	} 
	$.getDataBySQL = function(sql,callback){
		$.ajax({
			type:"POST",
			data:{sql:sql},
			datatype:"text",
			url:"common_bindSQLData.action",
			success:function( data ){
				try{
					callback(eval(data)[0]);
				}catch(e){
					//alert(e.message+"|"+e.Value+"|"+e.toString());
					//callback({});
				}
			},
			error:function( e ){
				callback({});
				$.msgbox.show("err","获取数据错误:"+sql);
			}
		});
	};
	$.appendScript = function(sid,script){
		$("<div></div>")
		.attr("id","script_"+sid)
		.css("display","none")
		.appendTo($("#hiddenDiv"))
		.html(script);
	}
	$.closeWinDialog=function(mainWinno){
		var dialogid=$.page.idFunc.getDialogOuterid(mainWinno);
		$("#"+dialogid).dialog('close'); 
		$("#"+dialogid).dialog('destroy'); 
		$("#"+dialogid).remove();
	}
	$.setFieldVal=function(fid,val){
		$("#"+fid).val(val);
		$("#"+fid).focus();
		$("#"+fid).blur();
		$("#"+fid).change();
	}
	$.msgbox = {
			msgbox:"<div id='msgBox' style='display:none;'>" +
					"<div id='msgMsgBox' title='请注意'><span class='ui-icon ui-icon-notice' style='float:left; margin:0 7px 50px 0;'></span><span id='msgDes' style='color:#336699'></span></div>" +
					"<div id='succMsgBox' title='提示信息'><span class='ui-icon ui-icon-circle-check' style='float:left; margin:0 7px 50px 0;'></span><span id='succDes' style='color:green'></span></div>" +
					"<div id='errMsgBox' title='错误信息'><span class='ui-icon ui-icon-circle-close' style='float:left; margin:0 7px 50px 0;'></span><span id='errDes' style='color:red'></span></div>" +
					"<div id='warnMsgBox' title='警告信息'><span class='ui-icon ui-icon-info' style='float:left; margin:0 7px 50px 0;'></span><span id='warnDes' style='color:red;'></span></div></div>"
			,
			ready: function( divId ){
				$("#"+divId).append(this.msgbox);
			},
			
			show: function(model,msg,callBack){
				switch(model){
					case "err":this.showErr(msg,callBack);return;
					case "succ":this.showSucc(msg,callBack);return;
					case "conf":this.showConf(msg,callBack);return;
					case "msg":this.showMsg(msg,callBack);return;
					default :showErr(msg);return;
				}
				return;
			},
			
			showConf:function(msg,callBack){
				$("#warnDes").html(msg);
				$("#warnMsgBox").dialog({
					bgiframe: true,
					modal: true,
					resizable: false,
					zIndex:10001,
					height:200,
					width:300,
					close:function(event, ui){
						$(this).dialog('destroy');
					},
					buttons: {
						"取        消": function() {
							$(this).dialog('destroy');
						},
						"继        续":function(){
							if(callBack){
								callBack();}
							$(this).dialog('destroy');
						}
					}
				});
			},
			
			showErr: function(msg,callBack){
		    	$("#errDes").html(msg);
				$("#errMsgBox").dialog({
					bgiframe: true,
					modal: true,
					resizable: true,
					zIndex:10001,
					//height:200,
					width:400,
					maxWidth:800,
					minWidth:300,
					close:function(event, ui){
						$(this).dialog('destroy');
					},
					buttons: {
						"确认": function() {
							if(callBack)
								callBack();
							$(this).dialog('destroy');
						}
					}
				});
		    },
			
			showSucc:function(msg,callBack){
		    	$("#succDes").html(msg);
				$("#succMsgBox").dialog({
					bgiframe: true,
					modal: true,
					resizable: false,
					zIndex:10001,
					height:200,
					width:300,
					minWidth:300,
					close:function(event, ui){
						$(this).dialog('destroy');
					},
					buttons: {
						"确认": function() {
							if(callBack)
								callBack();
							$(this).dialog('destroy');
						}
					}
				});
		    },
		    showMsg:function(msg,callBack){
		    	$("#msgDes").html(msg);
				$("#msgMsgBox").dialog({
					bgiframe: true,
					modal: true,
					resizable: false,
					zIndex:10001,
					minWidth:300,
					close:function(event, ui){
						$(this).dialog('destroy');
					},
					buttons: {
						"确认": function() {
							if(callBack)
								callBack();
							$(this).dialog('destroy');
						}
					}
				});
		    }
		    
	};
	
	//进度条构件
	$.showProcessBar=function(title,msg,width,height,totalParts){
	    var $pb=$("#barBody");
	    var totalP=totalParts==undefined?100:totalParts;
	    if ($pb.length==0){
	      $pb=$( "<div id='barBody' totalParts="+totalP+">"
							+"	  <div style='margin-top: 10px;font-weight: bold;'>"
							+"	    <span id='msg' style='margin-left: 5px;'>"+msg+"</span>"
							+"		  <span id='perc' style='float:right'>0%</span>"
							+"	  </div>"
							+"	  <div id='processBar' style='margin-top: 5px;'>"
							+"	  </div>"
							+"	</div>");
		    $pb.appendTo($("#hiddenDiv"));
	    }
	    $pb.find("#processBar").progressbar({
				value: 0
			});
			$pb.dialog({
					bgiframe: true,
					modal: true,
					resizable: false,
					zIndex:10001,
					height:height,
					width:width,
					title:title,
					closeOnEscape :false,
					close:function(event, ui){
						$(this).dialog('destroy');
					},
					open:function (event,ui){
						$(this).parent().find("a").remove();
					}
				});
	};
	$.setProcessPerc=function(perc,msg){
		var $body=$("#barBody");
		$body.attr("finishParts",0);
		$body.find("#processBar").progressbar("value",perc);
		$body.find("#perc").html(perc+"%");
		if (msg!=undefined)
			$body.find('#msg').html('msg');
	};
	$.incProcessByOne=function(msg){
		var $body=$("#barBody");
		var totalParts=parseInt($body.attr("totalParts"));
		var nowParts=$body.attr("finishParts");
		nowParts=parseInt(nowParts==undefined?0:nowParts);
		var perc=Math.round(((nowParts+1)/totalParts)*100);
		$body.attr("finishParts",nowParts+1);
		$body.find("#processBar").progressbar("value",perc);
		$body.find("#perc").html(perc+"%");
		if (msg!=undefined)
			$body.find('#msg').html('msg');
	};
	$.closeProcessBar=function(){
		$.setProcessPerc(0);
		$("#barBody").dialog('close');
	};
	//end of 进度条构件
	
	$.tip = function(content,area){
		var tipId = "tip"+new Date().getMilliseconds();
		
		var $area;
		if(!area){
			$area = $("#main");
		}else{
			$area = $("#"+area);
		}
		var left = $area.width()/2-100;
		var top =$area.height()/2-30;
		if(top<0){top = 300};
		$("<div id="+tipId+"  style='width:200px;padding:5px;position:absolute;left:"+left+"px;top:"+top+"px;' class='ui-state-active'><span style='float:left' class='ui-icon ui-icon-info'></span><span style='float:left'>"+content+"</span></div>")
		.appendTo($area).show();
		setTimeout(function(){
			$("#"+tipId).fadeOut(500,function(){
				$(this).remove();
			});
		},3000);
	};
	$.clone=function(srcObj){
		var ret=new Object();
        for(var p in srcObj)
        {
           ret[p]=srcObj[p];
        }
        return ret;
	};
	/*$.addHint=function(target,hint){
		if (hint!=""){
			target.attr({"title":hint});
			target.tipTip();
		}
    };*/
	$.addHint=function(target,hint,options){  // options是TipTip里支持的参数。是其中defaults的扩展。参见jquery.tipTip.minified.js
		if (hint!=""&&target.length>0){
			target.attr({"title":hint});
			target.tipTip(options);
		}
    };
	
	//判断是否为整型
	$.isInteger=function(str){
		return str.indexOf(".")<0;
	}
	$.isNumber=function(s) 
    {   
        var patrn=/^\s*[+-]?[0-9]+\s*$/;
        if (!patrn.test(s)) return false  
        return true;
    }
	//将数字转换成三位一撇的格式
	$.formatNumber=function(s){
     /*   if(/[^0-9\.]/.test(s)) return 0;*/
        s=s.replace(/^(\d*)$/,"$1.");
        s=(s+"00").replace(/(\d*\.\d\d)\d*/,"$1");
        s=s.replace(".",",");
        var re=/(\d)(\d{3},)/;
        while(re.test(s))
                s=s.replace(re,"$1,$2");
        s=s.replace(/,(\d\d)$/,".$1");
        return s.replace(/^\./,"0.");
    }
	//将数字转换成三位一撇的格式
	$.formatNumberToShow=function(num){
		var fnum=Math.round(num*100)/100;
		var sNum=""+fnum;
		
		var sMinus="";
		if (sNum.charAt(0)=='-'){
			sMinus="-";
			sNum=sNum.substring(1,num.length);
		}
		if ($.isInteger(sNum))
			sNum+='.00';
		
		sNum=sMinus+$.formatNumber(sNum);
		return sNum ;
	};
	
	$.padLeft=function(str,lenght,padChar){ 
			if(str.length >= lenght) 
				return str; 
			else 
				return $.padLeft(padChar+str,lenght,padChar); 
	};
	$.padRight=function(str,lenght,padChar){ 
			if(str.length >= lenght) 
				return str; 
			else 
				return $.padRight(str+padChar,lenght,padChar); 
	};
	
	$.f_clientHeight=function() {
		return $.f_filterResults (
			window.innerHeight ? window.innerHeight : 0,
			document.documentElement ? document.documentElement.clientHeight : 0,
			document.body ? document.body.clientHeight : 0
		);
	};
	$.f_filterResults=function(n_win, n_docel, n_body) {
		if (n_win)
			return n_win;
		else if (n_docel) 
			return n_docel;
	    else 
	    	return n_body;
	};
	//将div弹出并且最大化的通用函数
	//$contentDiv是需要弹出的div,一般都是我们的bodywin
	//$pageHost是关闭弹出后，dialogDivID需要回到的地方
	//resizeFunc是各个构件的resizeWin()函数
	$.dialogContent=function(funcno,$contentDiv,$pageHost,resizeFunc,closeFunc,dialogTitle){
		var srcWidth=$contentDiv.width();
		var srcHeight=$contentDiv.height();
		var position=$contentDiv.css("position");
		$contentDiv.css("position","static");
		var $dlgDiv=$("<div></div>").append($contentDiv);
		
		var winWidth=$("#main").width()-6,winHeight=$.getBrowserHeight()-8;
		$dlgDiv.dialog({
			title:dialogTitle==undefined?"":dialogTitle,
			bgiframe: true,
			modal: true,
			resizable: false,
			zIndex:10010,
			height:winHeight,
			width:winWidth,
			close:function(event, ui){
				if(typeof(resizeFunc) == "function")
					resizeFunc(funcno,0,0,srcWidth,srcHeight);
				/*if(typeof(closeFunc) == "function")
					closeFunc(funcno);*/
				$contentDiv.appendTo($pageHost);
				$(this).dialog('destroy');
				$(this).remove();
				if(typeof(closeFunc) == "function")
					closeFunc(funcno);
				$contentDiv.css("position",position);
			},
			buttons: {
				"返回": function() {
						$(this).dialog('close');
					}
			}
		});
		$dlgDiv.parent().find(".ui-dialog-content").css({"overflow":"hidden"});
		if(typeof(resizeFunc) == "function")
			resizeFunc(funcno,0,0,winWidth-22,winHeight-100);
	}
	
	$.logout = function(){
		$.msgbox.show("conf","您确认要退出吗？",function(){
			$.ajax({
				type: "POST",
				url: "common_doLogout.action",
				data: {},
				dataType: "text",
				success:function(data,textStatus){
					if(data == "ok"){
						window.location.href="login.html";
					}
				}
			});
		});
	};
	$.GetDateDiff=function(startDate,endDate){ 
	 	var startTime = new Date(Date.parse(startDate.replace(/-/g, "/"))).getTime(); 
	 	var endTime = new Date(Date.parse(endDate.replace(/-/g, "/"))).getTime(); 
	 	var dates = Math.abs((startTime - endTime))/(1000*60*60*24); 
	 	return dates; 
	};
	$.JSONCount = function(jsonObj){
		var cnt=0;
		$.each(jsonObj,function(i){
			cnt+=1;
		})
		return cnt;
	};
	$.changePass = function(){
		$("#tip").empty();
		$("#old").val("");
		$("#new1").val("");
		$("#new2").val("");
		$("#changePass").dialog({
				title:"修改密码",
				autoOpen:true,
				resizable: false,
				bgiframe: true,
				width:500,
				height:410,
				modal: true,
				buttons: {
					"取消":function(){
						$(this).dialog("destroy");
					},
					"确定":function(){
						var userid = $.userContext.bindData("#0-userinfo.userid#");
						var old = $("#old").val();
						var new1 = $("#new1").val();
						var new2 = $("#new2").val();
						if(old=="" || new1=="" || new2=="")
							$("#tip").html("请勿输入空值!");
						else if(new1!=new2)
							$("#tip").html("两次输入密码值不同,请重新输入!");
						else{
							$.ajax({
								type: "POST",
								url: "common_changePass.action",
								data: {userid:userid,old:old,newVal:new1},
								dataType: "text",
								success:function(data,textStatus){
									if(data == "ok"){
										$.msgbox.showMsg("密码修改成功");
									}else
										$.msgbox.showMsg("密码修改失败:原密码输入错误");
									$(this).dialog("destroy");
								},
								error:function(e){
									alert(e.responseText);
								}
								
							});
							$(this).dialog("destroy");
						}
					}
				}
				
			})	
	};
	$.button={
			create:function(options){
				function buttonShow(){
					return options.btn_roles==undefined||options.btn_roles==""
					||(","+$.trim(options.btn_roles)+",").indexOf(","+$.trim($.UC.bindData("#0-USERINFO.USERROLE#"))+",")!=-1;
				}
				var btn;
				if (!buttonShow())
					return undefined;
				var op= $.extend({
					id:"",
					title:"",
					caption:"",
					type:"button",
					width:60,
					height:20,
					top:0,
					icon:"ui-icon-play",
					script:"",
					bgImg:false,
					jscontent:""
				},options);
				if(op.bgImg){
					btn= $("<button title='"+op.title+"' style='width:"+op.width+"px;height:"+op.height+"px;float:left;cursor:pointer;' id='"+op.id+"' type='"+op.type+"' "
							+" class=\"wfbutton\" onclick=\""+op.script+"\">"
							+op.caption
							+"</button>").css({background:"url('"+op.bgImg+"')",border:"none"});
				}else{
					var icoStr="";
					if (op.btn_type=="pic"){
						btnTypeHead="img src='"+$.global.USER_ICO_ROOT+op.user_btn_ico+"'";
						btn=	"<img src='"+$.global.USER_ICO_ROOT+op.user_btn_ico+"'" + op.jscontent 
						        +"' style='float:left;cursor:pointer;margin-top:"+op.top+"px' id='"+op.id+"' type='"+op.type+"' class='ui-corner-all' "
								+" onmousedown=\"$(this).addClass('ui-state-active');\""
								+" onmouseup=\"$(this).removeClass('ui-state-active');\""
								+" onmouseout=\"$(this).removeClass('ui-state-hover').removeClass('ui-state-active');\""
								+" onmouseover=\"$(this).addClass('ui-state-hover');\""
								+" onclick=\""+op.script+"\" width='"+op.width+"px' height='"+op.height+"px'>"
								+"</img>" ;
					}else{
						if (op.user_btn_ico!=null && op.user_btn_ico!="")
							icoStr="<span style='float:left;margin-top:1px;'><img src='"+$.global.USER_ICO_ROOT+op.user_btn_ico+"'></span>";
						else
							icoStr="<span style='float:left;margin-top:1px;' class='ui-icon "+op.icon+"'></span>";
						btn=	"<button " + op.jscontent + " title='"+op.title+"' style='float:left;cursor:pointer;' id='"+op.id+"' type='"+op.type+"' class='wfbutton ui-corner-all ' "
								+" onmousedown=\"$(this).addClass('ui-state-active');var $span=$(this).find('>div>span:nth-child(2)');$span.css('font-size',14);\""
								+" onmouseup=\"$(this).removeClass('ui-state-active');var $span=$(this).find('>div>span:nth-child(2)');$span.css('font-size',12);\""
								+" onmouseout=\"$(this).removeClass('ui-state-hover').removeClass('ui-state-active');var $span=$(this).find('>div>span:nth-child(2)');$span.css('font-size',12);\""
								+" onmouseover=\"$(this).addClass('ui-state-hover');var $span=$(this).find('>div>span:nth-child(2)');$span.css('font-size',12);\""
								+" onclick=\""+op.script+"\">"
								+	"<div style='width:"+op.width+"px;height:"+op.height+"px;cursor:hand'>"
								+ 		icoStr
								//+ 		"<span id='"+op.id+"_caption' style='font-size:12px;text-align:center;margin-top:4px;color:#434343;' >"+op.caption+"</span>"
                                                              //  + 		"<span id='"+op.id+"_caption' style='font-size:12px;text-align:center;margin-top:4px;color:#E17009;' >"+op.caption+"</span>"
								  + 		"<span id='"+op.id+"_caption' class='wfbuttontext'>"+op.caption+"</span>"
								+ 	"</div>"
								+"</button>" ;
					}
				}
				
				return btn;
			},
			
			createIcon:function(options){
				var op= $.extend({
					id:"",
					title:"",
					caption:"",
					icon:"ui-icon-newwin",
					pos:"left",
					script:""
				},options);
				return "<div title='"+op.title+"' class='iconBtn' id='"+op.id+"' "
						+" onmouseout=\"$(this).removeClass('ui-state-hover').removeClass('ui-state-active');\"" 
						+" onmouseover=\"$(this).addClass('ui-state-hover');\""
						+" onmousedown=\"$(this).addClass('ui-state-active');\""
						+" onmouseup=\"$(this).removeClass('ui-state-active');\""
						+" onclick=\""+op.script+"\""
						+" style=\"float:"+op.pos+";\">"
						+"<span class=\"ui-icon " + op.icon + "\" style=\"float:left;\"></span>" 
						+"<span style=\"float:left;margin-top:2px;\">"+op.caption+"</span>"
						+"</div>";
			},
			getWidth:function(s){
				var c = s+"";
				return c.length*20;
			},
			addBtnOperations:function(btnDef,winno,btn){
				var $win=$("#win"+winno);
				if (btnDef.hint!=undefined){
					$.addHint(btn,btnDef.hint);
					btn.click(function(){
						$("#tiptip_holder").fadeOut(100);
					});
				}
				if(btnDef.autojump){
					$win.hide();
					setTimeout(function(){
						btn.click();
					},500);
				}
			},
			clickWinBtn:function(funcno,btnCaption){
				btnCaption=btnCaption.trim();
				if (btnCaption=="")
					return;
				var winno=$.page.idFunc.funcno2winno(funcno);
				var $btns=$("#"+$.page.idFunc.getWinDivID(winno)+" button div span[id='_caption']");
				if ($btns.length==0)
					return;
				for(var i=0;i<$btns.length;i++){
					if ($($btns[i]).text().trim()==btnCaption)
						$($btns[i]).parent().parent().click();
				}
			},
			btnClickFunc:function(btnDef,winno,btn){
				var $win=$("#win"+winno);
				var currPage = $.page.currPage;
				var winFunc = $.page.list[$.page.mainWin[currPage]].funcMap[winno]; // 这里受page.js中openExternal中对 $.page.mainWin[$.page.currPage]赋值的影响。
				
				/*保存操作上下文*/
				$.userContext.setData('0-currWin',winno);
				$.userContext.setData('0-currFunc',winFunc.func);
				$.userContext.setData('0-currBtn',btnDef.caption);
				
				if(winFunc.type == 'F')
					$.form.getDataToContext(winFunc.func);
				
				// 前置检查
				if(btnDef.pre_check)
					if(	!$.page.btn.pre_check(winFunc.func,winFunc.type) )
						return;
				var doBtnClick = function(){
					//临时定义跳转动作函数过程,以方便函数内部复用
					if(typeof(btnDef.beforeclick) =="function"){ 
						if (btnDef.beforeclick()==false )
							return;
					}	
					var executeActs = function( msg ){
						if(typeof(btnDef.afterclick) =="function"){ 
							if (btnDef.afterclick()==false )
								return;
						}	
						
						if(btnDef.acts){
							var toWin = $.page.act.routeActs(btnDef.acts);
							$.page.act.jump(winno,toWin);
						}
						if(btnDef.affects){
							var affects = $.page.act.routeAffects(btnDef.affects);
							$.page.act.affectsWins(winFunc.func,affects);
						}
					}
					
					if(btnDef.wf_enabled){
						var workFlowEnable = function(){
							//对工作流对应的表插入新纪录，要insert current_wf表
							if(btnDef.wf_enabled && btnDef.wf_paramtype=="output" && btnDef.wf_unikey!=""){
									$.ajax({
										type:"POST",
										url:"workflowAction_getSessionId.action",
										success:function(data,textStatus){
											$.userContext.setData(btnDef.wf_unikey.split("#")[1],data);//设置好sessionId后执行存储过程
											//调用存储过程
											if(btnDef.call_proc){
												$win.block({message:"<p class='ui-state-active'>请稍等...</p>",
													overlayCSS:{backgroundColor: '#0F4569', 
								        			opacity:         0.4 
												}});
												var cmd = $.page.btn.generateCmd(btnDef.check_func, btnDef.procs);
												$.page.btn.call_proc( cmd, function( msg ) {
													//根据sessionID去查找key_field
													$.ajax({
														type:"POST",
														url:"workflowAction_getKeyField.action",
														data:{sessionId:$.userContext.bindData(btnDef.wf_unikey),
															  wf_name:btnDef.wf_name},
														dataType:"text",
														success:function(data,textStatus){
																 
														  //将得到的sessionId执行初始化curr表
															  $.ajax({
																	type:"POST",
																	url:"workflowAction_newInsert.action",
																	data:{wf_name:btnDef.wf_name,
																  		  uni_keys:data	
																		},
																	dataType:"text",
																	success:function(data,textStatus){
																			  $win.unblock();
																			  var state = $.page.handleMsg( msg );
																			  if( state || !btnDef.post_check )
																					executeActs( msg );
																		  },
																	error:function(e){
																			  $win.unblock();
																			  var state = $.page.handleMsg( msg );
																			  if( state || !btnDef.post_check )
																					executeActs( msg );
																		  }
																});	  
														},
														error:function(){
															$win.unblock();
															  var state = $.page.handleMsg( msg );
															  if( state || !btnDef.post_check )
																	executeActs( msg );
														}
													});
													
												});
												
											}else{
												executeActs( "" );
											}
									  	}
									});
							}else if(btnDef.wf_enabled && btnDef.wf_paramtype=="input" ){ //更新工作流表
								var updateWF = function(btnDef,callBack){
									var unikeys = "";
									var comment = "";
									var currStatus = "";
									unikeys = $.UC.parser(btnDef.wf_unikey);
									comment =  $.UC.parser(btnDef.wf_comment);
									$.ajax({
										type:"POST",
										url:"workflowAction_getCurrentStatus.action",
										data:{
											wf_unikeys:unikeys,
											wf_name:btnDef.wf_name
										},
									    dataType:"text",
									    success:function(data,textStatus){
											currStatus = data;
											$.ajax({
												type:"POST",
												url:"workflowAction_getCondition.action",
												data:{wf_name:btnDef.wf_name,
													  wf_unikeys:unikeys,
													  wf_trans:btnDef.wf_trans,
													  wf_comment:comment,
													  currStatus:currStatus
													  },
											    dataType:"text",
											    success:function(data,textStatus){
														 
														  if(data=="角色无此权限")
															  alert(data);
														  else{
															  var result = data.split(";");
															  var conds = result[0].split(",");
															  var endStatus = result[1].split(",");
															  var role_id = result[2];
															  for(var i = 0;i<conds.length;i++){
																  if(conds[i]!="" && condTester.ifCondition2($.userContext.parser1(conds[i]))){
																	  $.ajax({
																			type:"POST",
																			url:"workflowAction_update.action",
																			data:{wf_name:btnDef.wf_name,
																				  wf_unikeys:unikeys,
																				  wf_trans:btnDef.wf_trans,
																				  wf_comment:comment,
																				  currStatus:currStatus,
																				  condtion:conds[i],
																				  end_status:endStatus[i],
																				  role_id:role_id
																				  },
																		    dataType:"text",
																		    success:function(data,textStatus){
																			  callBack(); 
																			  if(data=="success"){
																				if(btnDef.sign_enabled){
																					  if($("#SignatureAPI").length<=0){
																						  var str = '';
																						  str += '<object id="SignatureAPI" width="0" height="0" classid="clsid:79F9A6F8-7DBE-4098-A040-E6E0C3CF2001" codebase=""iSignatureAPI.ocx#version=7,0,0,0"></object>';
																						  $("body").append(str);
																					  }
																					$.ajax({
																						type:"POST",
																						url:"workflowAction_signDef.action",
																						data:{wf_name:btnDef.wf_name,
																						      wf_trans:btnDef.wf_trans,
																						      wf_unikeys:unikeys,
																						      currStatus:currStatus
																							  },
																					    dataType:"text",
																					    success:function(data,textStatus){
																							  var sDef = eval('('+data+')');
																							  var documentID = btnDef.wf_name + "_" + $.UC.parser(btnDef.wf_unikey);
																							  var signature = document.getElementById("SignatureControl");
																							  var formid = "form" + winFunc.func;
																							  signature.DocumentID = documentID;
																							  signature.DivId = formid;
																							  signature.EnableMove = false;	// 不允许移动
																							  var fList = "";
																							  var cnames = $("#form"+winFunc.func+"_extDiv").attr("cNames"); 
																							  if(cnames){
																								  var hisNames = cnames.split(";");
																								  for(var i=0;i<hisNames.length;i++){
																									  if(hisNames[i]!=""){
																										  fList += (hisNames[i]+"="+hisNames[i]+";");
																									  }
																								  }
																							  }
																							  var formFields = $.F.list[winFunc.func].formFields;
																							  
																							for( var i = 0; i < formFields.length; i++ ){
																								var f = formFields[i];
																								if(f.id.split("-")[1]!="wf_comment"){
																									var fname = "formCurrent"+"_"+f.id;//读出需盖章保护的字段更改name
																									fList += (fname+"="+fname+";");
																								}
																							}
																							fList = fList.substr(0, fList.length-1);
																					    	signature.Position(sDef.ox, sDef.oy);			// 签章位置
																					    	signature.FieldsList=fList;
																					    	if(sDef.type=="0"){
																					    		signature.RunSignature();
																					    	}else{
																					    		signature.RunHandWrite();
																					    	}
																						}
																					});
																				  }
																				}else{
																					alert(data);
																				}
																			  },
																			error:function(e){
																				  callBack();
																				  }
																		});
																  }
															  }
														  }
													  }
											});
										
										},
										error:function(){
											callBack();
										}
									});
								};
								
								//调用存储过程
								if(btnDef.call_proc){
									$win.block({message:"<p class='ui-state-active'>请稍等...</p>",
										overlayCSS:{backgroundColor: '#0F4569', 
					        			opacity:         0.4 
									}});
									var cmd = $.page.btn.generateCmd(btnDef.check_func, btnDef.procs);
									$.page.btn.call_proc( cmd, function( msg ) {
										if(msg.substr(0,7)=="success" || msg.substr(0,4)=="pass"){
											updateWF(btnDef,function(){
												$win.unblock();
												var state = $.page.handleMsg( msg );
												if( state || !btnDef.post_check )
													executeActs( msg );
												});//sp执行成功后才执行工作流的根系
										}else{
											$win.unblock();
											var state = $.page.handleMsg( msg );
											if( state || !btnDef.post_check )
												executeActs( msg );
											
										}
									});
								}else{
									updateWF(btnDef,function(){
										executeActs( "" );
									});
									
								}
									
							}else if(btnDef.wf_enabled && btnDef.wf_paramtype=="output" && btnDef.wf_unikey==""){//base表已存记录初始化插入工作流表
								$.ajax({
									type:"POST",
									url:"workflowAction_initInsert.action",
									data:{wf_name:btnDef.wf_name
										},
									dataType:"text",
									success:function(data,textStatus){
											  alert(data);
										  },
									error:function(e){
										  }
								});
							}
						}

						workFlowEnable();
					
					}else{
						//调用存储过程
						if(btnDef.call_proc){
							$win.block({message:"<p class='ui-state-active'>请稍等...</p>",
								overlayCSS:{backgroundColor: '#0F4569', 
			        			opacity:         0.4 
							}});
												
							var cmd = $.page.btn.generateCmd(btnDef.check_func, btnDef.procs);
							cmd = cmd.replaceAll("喆", "喆 ");
		                    $.page.btn.call_proc( cmd, function( msg ) {
								$win.unblock();
								var continueBtnProc = function() { // BUG 408 增加回调，允许对check存储过程的结果进行判断提示。继续=执行存储过程，取消=不做事情
									$win.block({message:"<p class='ui-state-active'>请稍等...</p>",
										overlayCSS:{backgroundColor: '#0F4569', 
											opacity:         0.4 
										}});
									var cmd = $.page.btn.generateCmd("@", btnDef.procs);
									cmd = cmd.replaceAll("喆", "喆 ");
									$.page.btn.call_proc( cmd, function( msg ) {
										$win.unblock();
										var state = $.page.handleMsg( msg);
										if( state || !btnDef.post_check )
											executeActs( msg );
									});
								}
//								var pauseContinueProc = function() { // BUG 408 增加回调，继续=pass，取消=不做事情。但这种情况很少。目前不提供。
//									executeActs( "" );
//								}
//								var msgCallback = undefined;
//								if (msg.substr(0, 5) == "judge") {
//									msgCallback = continueBtnProc;
//								}
//								else if (msg.substr(0, 5) == "pause") {  // pause 一般可用于在“执行存储过程”的返回中。但这种情况很少。所以目前不提供。
//									msgCallback = pauseContinueProc;
//								}
									
								var state = $.page.handleMsg( msg, continueBtnProc);
								if( state || !btnDef.post_check )
									executeActs( msg );
							});
						}else{
							executeActs( "" );
						}
					}
				}
				
				if(btnDef.clickquery){
					var queryHintInfo = btnDef.clickqueryhint.split('$');  // BUG 413
					var queryHint = queryHintInfo.length?queryHintInfo[0]:"";
					var btnContinueCaption = "继续";
					var btnCancelCaption = "取消";
					if (queryHintInfo.length > 1) {
						var btnCaptions = queryHintInfo[1].split(';');
						btnContinueCaption = btnCaptions[0];
						btnCancelCaption = btnCaptions[1];
					};
					var btns = {};
					btns[btnCancelCaption] = function() {  // 先写的属性会作为排在后面的button。所以先写cancel再写continue，实际上是继续在左，取消在右。
						$(this).dialog('destroy');
					};
					btns[btnContinueCaption] = function() {
						doBtnClick();
						$(this).dialog('destroy');
					};
					$("<div><span style='color:green'>"+$.userContext.parser(queryHint,true)+"</span></div>").dialog({
						title:"提示框",
						bgiframe: true,
						modal: true,
						resizable: false,
						zIndex:10001,
						height:200,
						width:300,
						buttons: btns  // BUG 413
					})
				}else{
					doBtnClick();
				}
				
			}
	};
	// TODO: 兼容以前代码。以后或许可以不用传入top，而直接从$.page.topSpace里取。 
	// TODO: 另外，48也可以放到某个变量里（比如$.page.bottomSpace）
	$.getBodyHeight=function(topSpace){ 
		                                
		var top = topSpace?topSpace:0;
		var bh=$.f_clientHeight();
		//return bh - top - 48;
		return bh - top; //msx 2013-6-21 0:00 建议：不要减去48-----直接return bh - top ;
		                  // 页面底部的高度
		// TODO: 检测 IE8的兼容性
	};
	
	$.f_clientHeight=function() {
		return $.f_filterResults (
			window.innerHeight ? window.innerHeight : 0,
			document.documentElement ? document.documentElement.clientHeight : 0,
			document.body ? document.body.clientHeight : 0
		);
	};
	$.f_clientWidth=function () {
		return $.f_filterResults (
			window.innerWidth ? window.innerWidth : 0,
			document.documentElement ? document.documentElement.clientWidth : 0,
			document.body ? document.body.clientWidth : 0
		);
	};
	$.f_filterResults=function(n_win, n_docel, n_body) {
		if (n_win)
			return n_win;
		else if (n_docel) 
			return n_docel;
	    else 
	    	return n_body;
	};
	$.getElementHeight=function(id,nullHeight){
		var $obj=$("#"+id);
		if ($obj.size()==0||$obj.css('display')=='none')
			return nullHeight;
        else 
        	return $obj.outerHeight(true);
	};
	
	// 没有getBodyWidth方法。
	$.getBrowserWidth=function(leftSpace){
		var left = leftSpace?leftSpace:0;
		var bh= $.f_clientWidth();
		return bh - left -8;
		//return bh-_shiftX-8;
	};
	
	// 这个基本上不用。现有的代码主要都用getBodyHeight。
	// 为了保持以前兼容，现在还是处理为和getBodyHeight一样 2013-6-8 wyj
	$.getBrowserHeight=function(topSpace){  // 和getBodyHeight一样。本来在exploreCond.js中。现在统一到common。js by wyj 2013-6-6
		var top = topSpace?topSpace:0;
		var bh=$.f_clientHeight();
		return bh - top- 20;
		//return bh - _shiftY - 20;
		/*
		if ($.browser.msie)
			return bh;
		else
			return bh-20;
		*/
	};
	$.null2Blank=function(str){
		if (str==undefined||str=='')
			return '窗口';
		else
			return str;
	};
	$.getCSSNum=function($element,cssName){
		var cssv = $element.css(cssName);
		if (cssv==undefined)
			return 0;
		var cssvl = cssv.split("px");
		return parseFloat(cssvl[0]);
		//return parseFloat($element.css(cssName).split("px")[0]);
	}
	$.extend($.fn,{ 
		mask: function(options){ 
			var op = $.extend({ 
				id:"mask",
				opacity:0.2, 
				z: 1000000, 
				bgcolor: 'gray',
				waitting:false
			}, options);
			$("<div id='"+op.id+"_mask'> </div>")
			.appendTo(this)
			.css({
				"float":"left",
				zIndex:op.z,
				width: this.width(), 
				height: this.height(), 
				backgroundColor: op.bgcolor, 
				opacity: op.opacity
			}).fadeIn('slow', function(){ 
				$(this).fadeTo('slow', op.opacity); 
			});
			
			return this;
		}
	}) 
})(jQuery);