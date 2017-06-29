 $(function(){

		function reloadCheckcode(){
			$("#checkcodeImg").attr("src","loginAction_getCheckCodeImg.action?s="+new Date())
		};
		
		$("#loginbtn1").click(function(){
				$("#loginbtn1").hide("drop",{},800,function(){
					$("#loginWindow").show("drop",{},800);
					$("#loginbtn2").show("drop",{},800);
				});
				
		});
		
		$("#btnview img")
		.css({border:"solid 1px gray"})
		.hover(function(){
					$(this).css({border:"solid 1px #ADFC49"});
		},function(){
					$(this).css({border:"solid 1px gray"});
		});
		
		$("#checkcodeImg").click(function(){
					reloadCheckcode();
		});
		
		$("#loginbtn2").click(function(){
			var uid = $("#uid").val();
			var pwd = $("#pwd").val();
			var chkcode = $("#chkcode").val();
			
			if( (uid != "请输入用户名") && (uid != "") && (pwd != "") && (chkcode != "请输入验证码") && (chkcode != "") ){
				
				$("#loginbtn2").hide();
				$("#loading").show();
				
				$.ajax({
						type:"POST",
						url:"loginAction_doLogin.action",
						data:{uid:uid,pwd:pwd,chkcode:chkcode},
						dataType:"text",
						success:function(data,textStatus){
							if(data=="ok"){
								$("#loading").hide();
								$("#loginbtn2").show();
								$("#msg").css({fontSize:"12px",color:"#ADFC49"}).html("登录成功!");
								$("#loginbtn2").hide("puff",{},1500,function(){
									if($.browser.msie){//ie
										window.location.href="waitting.html";
								    	//window.open("waitting.html","天翼信息管理系统","menubarbar=no,toolbar=no,width=900,height=600,resizable=yes");
								  	}else if($.browser.mozilla){//firefox
								  	   window.location.href="waitting.html";
									   //window.open("waitting.html","天翼信息管理系统","menubarbar=no,toolbar=no,width=900,height=600,resizable=yes");
								    }else if($.browser.opera){
								    	alert("opera")
								    }else if($.browser.safari){//chrome
								    	window.location.href="waitting.html";
								    } 
								});
								
							}else{
								
								if(data == "checkerror"){
									$("#msg").html("验证码不正确")
								}else{
									reloadCheckcode();
									$("#msg").html("用户名或密码不正确")
									
								}
								$("#loading").hide();
								$("#loginbtn2").show();
							}
						}
				});
			}
		});
		
		$("#uid").addClass("embed").val("请输入用户名")
		.focus(function(){
					if($("#uid").val() == "请输入用户名"){
				 		$("#uid").val("").removeClass("embed").addClass("normal");
				 	}
		}) .blur(function(){
				 	if($("#uid").val() == ""){
				 		$("#uid").removeClass("normal").addClass("embed").val("请输入用户名")
				 	}
		});
		
		$("#chkcode").addClass("embed").val("请输入验证码")
		.focus(function(){
				 	if($("#chkcode").val() == "请输入验证码"){
				 		$("#chkcode").val("").removeClass("embed").addClass("normal");
				 	}
		}).blur(function(){
				 	if($("#chkcode").val() == ""){
				 		$("#chkcode").removeClass("normal").addClass("embed").val("请输入验证码")
				 	}
		});
		
		$("#pwd1").addClass("embed").val("请输入密码")
		.focus(function(){
				 	$("#pwd1").hide();
				 	$("#pwd").show().focus();
		})
		$("#pwd").blur(function(){
				  	if($("#pwd").val()==""){
					  	$("#pwd1").show();
					 	$("#pwd").hide();
				 	}
		});
		$(document).keypress(function(e){
			if(e.which == 13){
				$("#loginbtn2").click();
			}
		});
	})