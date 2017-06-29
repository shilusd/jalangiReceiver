$(document).ready(function(){
	//初始化窗口面板
	$("#main").tabs({
		show:function(event,ui){
			var currP = $(ui.panel).attr("pageno") ;
			if(currP)
				$.page.currPage = currP;
		}
	});
	var ucv = eval($("#userContext").val().replace(/\_\@/g,"\""))[0];
	
	var ucv2 = {};
	$.each(ucv,function(i){
		ucv2["0-"+i.toUpperCase()] = ucv[i]+"";
	});
	
	$.userContext.userData = ucv;
	
	$.each(ucv2,function(i){
		$.userContext.userData[i] = ucv2[i];
	});
	
	var d = new Date();
	var y = d.getFullYear();
	var m1 = (d.getMonth()+1+"");
	var m = m1.length>1?m1:"0"+m1;
	var t1 = d.getDate().toString();
	var t =t1.length>1?t1:"0"+t1;
	
	$.userContext.userData["0-CURRNETYEAR"] = y;
	$.userContext.userData["0-CURRNETMONTH"] = m;
	$.userContext.userData["0-CURRNETDAY"] = t;
	$.userContext.userData["0-CURRENTYM"] = y + "" + m;
	$.userContext.userData["0-CURRENTYMD"] = y + "" + m + "" + t;
	$.userContext.userData["0-TODAY"] = y + "-" + m + "-" + t;
	
	var winno = $("#main").attr("winno");
	$.msgbox.ready("hiddenDiv");
	
	_shiftX = 0;
	_shiftY = 0;
	$.page.currPage = 0;
	$.page.openExternal( winno,"");
});

var interval = 1000*5*60;
setInterval(function(){
	$.ajax({
		type: "POST",
		url:  "common_keepSession.action",
		data: {user:$.userContext.bindData("#0-userinfo.username#")},
		dataType: "text",
		success: function( data,textStatus ){
			if(data != "ok"){
				alert("警告：当前服务器连接繁忙，请重新登录");
			}
		},
		error:function(e){
			$.msgbox.show("err","服务器断开连接");
		}
	})
},interval);