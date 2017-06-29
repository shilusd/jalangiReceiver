;
(function($){
    $.DF = $.driveform =  {
        options:{
            formParamURL:$.global.functionDefinitionUrl+"?type=DF", 
            dataBindingURL:"common_getBindingDataDF.action"
        },
        
        list:{}, // 本类窗口实例的列表
        //validators:{},
        runInstance: function( funcNo,options ){
            var op = $.extend({
                complete:function(){},
                target:"main"
            },options);
            if(this.list[ funcNo ] == null){
                $.ajax({
                    type: "POST",
                    url:  $.DF.options.formParamURL,
                    data: {
                        funcNo:funcNo
                    },
                    dataType: "json",
                    success: function( data,textStatus ){
                        var driveFormDef = data[0];
                        $.appendScript(funcNo,driveFormDef.script);
						
                        driveFormDef.complete = op.complete;
                        
                        $.DF.list[funcNo] = driveFormDef;
                        
                        $.DF.createNew( driveFormDef,op.target );
						
                        //$("#driveform" + funcNo).show("drop",{},500);
                    },
                    error:function(e){
                        var r = $("<a href='javascript:void(0)'><span class='ui-icon ui-icon-refresh' style='float:left'></span>窗口错误,点击刷新</a>")
                        .click(function(){
                            $.DF.runInstance(funcNo,options);
                        });
                        $( "#"+options.target ).empty().append(r);
						
                    }
                });
            }else{
                var driveFormDef = $.DF.list[funcNo];
                $.DF.createNew( driveFormDef,  op.target );
                //$("#driveform" + funcNo).show("drop",{},500);
            }
			
            return $.driveform;
        },
        clear: function(funcno){
        },
        addLineHint: function(formDef) {
        	var funcno = formDef.funcno;
        	var rows = formDef.rowsdef;
        	for (var i = 0; i < rows.length; i++) {  // 每行给一个hint（如果有的话）
        		var targetRow = $("#flr" + funcno + "_" + i);
        		$.addHint(targetRow, rows[i].hint, {defaultPosition : "right"});
        	}
        },
        createNew: function( formDef, target ){
        	var contextvarlist = [];
        	if (formDef.bindVars != "")
        		contextvarlist = formDef.bindVars.split(",");// 后台变量要用的context变量列表
        	for (var i = 0; i < contextvarlist.length; i ++) {
        		if (typeof($.UC.userData[contextvarlist[i].replaceAll("#", "").toUpperCase()]) != "undefined" ) {  // 在UC中找到了变量  
        			                                                           // ^Bug 162修复。
        			contextvarlist[i] += ":" + $.UC.parser(contextvarlist[i]);
        		}
        		else {
        			contextvarlist[i] += ":null"; // 没有找到，那就放一个null——正常情况应该不会这样
        		}
        	}
        	var splitHtml = formDef.realhtml.split("#");  // 找到 html中用到的变量（包括后台变量和context变量）
        	var sqlvarlist = new Array();
        	for (var i = 1; i < splitHtml.length ; i += 2) {
        		if (typeof($.UC.userData[splitHtml[i].toUpperCase()]) == "undefined" ) {  // 非UC中的变量，要发到后台算值
        			                                 // ^Bug 162修复。
        			sqlvarlist.push(splitHtml[i]);	
        		}
        		
        	}
        	// 下面将sqlvarlist 发到后台计算值（要发送funcno, sqlvarlist, 以及contextvarlist及其值）
      	

        	// 将funcno，contextvarlist及其值，
            
        	var formid = "driveform" + formDef.funcno;

        	var formHtml = $.DF.drawNew(formDef, sqlvarlist);
            $( "#"+target ).empty()
            .append( $(formHtml) );
            
            
            //$.DF.addLineHint(formDef);
            
//            for (var i = 0; i < varlist.length; i++) {
//            	$.DF.fetchVariable(varlist[i]);
//            }
            

	
            $.DF.fetchVariableNew(formDef.funcno, contextvarlist, sqlvarlist, formDef.rowsdef);
            
            if(typeof(formDef.complete) == "function")
                formDef.complete();
            formDef.dataComp(formid);
            
        },
		

        drawNew:function( formDef, sqlvarlist){  // varlist是要到后台处理的变量，在显示时要留一个<span>以便ajax替换成真实的值。
            var body = formDef.realhtml;
            var funcno = formDef.funcno;
            var formHtml = "<form id='driveform" + funcno +"'>";
            formHtml += "<div style='overflow:auto;width:100%;height:100%' class='form1'>";
            formHtml += formDef.realhtml;
            // 替换后台变量
            for (var i = 0; i < sqlvarlist.length; i ++) {
            	// "bev" for back-end-variable
            	var bevSpan = "<span class='dfvar' id='" + sqlvarlist[i].toUpperCase() + "'>...</span>";
            	formHtml = formHtml.replaceAll("#" + sqlvarlist[i] + "#", bevSpan);
            }
            formHtml += "</div>";
            formHtml += "</form>";
            
            // 剩下就是 context变量
            formHtml = $.DF.replaceVariable(formHtml);
            
           
/*
            var formHtml = "<form id='driveform" + funcno +"'>";
            //formHtml += "<div style='overflow:auto;min-width:350px;width:"+formDef.width+"px;height:"+formDef.height+"px' class='form1'>";
            // Form的宽度实际上受到Win宽度的制约，所以不如不设置宽度。
            formHtml += "<div style='overflow:auto;width:100%;height:100%' class='form1'>";
            if (formDef.allowsearch) { // 允许搜索
            	formHtml += "<img id='dfSearchSwitch" + funcno + "' style='cursor:pointer' src='img/left_edtable.png'></img>";
            	formHtml += "<div id='dfSearchPanel" + funcno + "'>";
            	formHtml += "<span>检索关键字</span><br />";
            	formHtml += "<input id='searchText" + funcno + "' style='width:85%'/>";
            	formHtml += "<button id='searchButton" + funcno + "' type='button' sytle='float:right;width:60px;height:20px' onclick>搜索</button>";
            	formHtml += "</div><br />"; 	
            }
            
            formHtml += "<div id='dfFuncListDiv" + funcno + "' style='width:100%;height:100%;'>";
            if (body == "") {
            	body = "<table id='funclist" + funcno + "' cellspacing=0 style='width:100%;' class='dftable'>";
            	body += "<tbody>";
            	var rows = formDef.rowsdef;
            	for (var i = 0; i < rows.length; i++) {
            		var towin = rows[i].towinno;
            		body += "<tr style='cursor:pointer;height:"+ formDef.rowheight + "px' id='flr" + funcno + "_" + i + "' onclick='$.page.openExternal(" + towin + ")'>";
            		
            		// 第一列 图标
            		var iconFile = "";
            		body += "<td style='width:10%;' class='dftable'>";
            		if (rows[i].icontype != "none") {
            			switch (rows[i].icontype) {
            			case "err": iconFile = "img/no.gif"; break;
            			case "succ": iconFile = "img/ok.gif";break;
            			case "warn": iconFile = "img/warn.gif";break;
            			case "info": iconFile = "img/info.gif";break;
            			case "green": iconFile = "img/LED_G.gif";break;
            			case "yellow": iconFile = "img/LED_Y.gif";break;
            			case "red": iconFile = "img/LED_R.gif";break;
            			}
            			body += "<img src='" + iconFile + "' alt='" + rows[i].icontype + "'></img>";
            		}
            		body += "</td>";
            		// 第二列 caption
            		body += "<td style='width:20%;' class='dftable'>";
            		body += $.DF.replaceVariable(rows[i].caption, varlist);
            		body += "</td>";
            		// 第三列 content
            		body += "<td style='width:70%;' class='dftable'>";
            		body += $.DF.replaceVariable(rows[i].content, varlist);
            		body += "</td>";
            		
            		body += "</tr>";
            		
            	}
            	body += "</tbody>";
            	body += "</table>";
            	
            }
            formHtml += body;
            formHtml += "</div>";
            formHtml += "</div>";
*/            
            return formHtml;
        },
        
        
        replaceVariable: function(str, varlist) {
        	var sl = str.split('#');
        	for (var i=0; i<sl.length; i++) {
        		if (sl[i][0] == '@') {  // 对于#@xxx#的变量，从后台变量表中获取.这里先替换为特殊的页面标签
        			if (valist)
        				varlist.push(sl[i].substring(1));
        			sl[i] = "<span id='" + sl[i].substring(1).split("!")[0] + "'>...</span>";
        		}
        		else {  // 否则，直接在UC中取值
        			var val = $.UC.parser("#" + sl[i] + "#");
        			if (val != "") {  // 在UC中找到了变量
        				sl[i] = val;
        			}
        		}
        	}
        	
        	return sl.join("");
        },
        
        fetchVariableNew: function(funcno, contextvarlist, bevlist, rows) {
        	var contextvarString = contextvarlist.join(",");
        	var bevString = bevlist.join(",");
        	 
        	$.ajax({
                type:"POST",
                url:$.DF.options.dataBindingURL, // 
                data:{
                	funcno: funcno,
                	bevstr: bevString,
                	cvstr: contextvarString
                    },
                dataType:"text",
                success:function(data,textStatus){
                	var hideCondStr = "";
                	for(var i = 0; i < rows.length; i++) {
                		hideCondStr += rows[i].hidecond.toUpperCase() ;
                		if (i < rows.length-1)
                			hideCondStr += "??";
                	}
                	
                	
                    var nvPairList = data.split(",");  // 变量-值对
                    for (var i = 0; i < nvPairList.length; i ++) {
                    	if (nvPairList[i] != "") {
                    		var varname = nvPairList[i].split(":")[0];
                    		if (varname != "") {
                    			var varvalue = nvPairList[i].split(":")[1];
                    			$(".dfvar#"+varname).text(varvalue);
                    			hideCondStr = hideCondStr.replaceAll("#"+varname+"#", varvalue);
                    		}
                    	}
                    }
                    var replacedHideConds = hideCondStr.split("??"); 
                    var evalHideCond = function(str) {
                    	try {
                    		if (eval(str) || eval(str) == "true") {
                    			return true;
                    		}
                    		else {
                    			return false;
                    		}
                    	}
                    	catch(e) {
                    		return false;
                    	}

                    };
                 // 每一行的 @1@ 替换为 <span id="item536_1" class="dfitem" >   536 是当前的funcno  1是当前ord
                    for(var i = 0; i < replacedHideConds.length; i++) {
                		var $dfitem = $("span.dfitem#item" + funcno + "_" + (i+1));
                		var	rhc = replacedHideConds[i];  // bug 288
                		rhc = rhc.replace(/(!=)/g, "~=" );
						rhc = $.UC.parser(rhc);
						rhc = rhc.replace(/(~=)/g, "!=" );
                		if (evalHideCond(rhc)) {
                			$dfitem.css("display", "none");
                		};
                	}
                }
            });
        	return;
        },

        refresh:function(funcno, filter){

        },
        
        fetchVariable: function(varstr) {
        	var varname = varstr.split("!")[0]; // varstr格式： varname 或者 varname!P1,P2,P3... Pn表示UC中可以访问的参数名(不含两端的#)
        	var valuedvarstr = ""; // 将varstr中的变量增加值表示。格式:  varname!P1:v1,P2:v2,P3:v3...
        	if (varstr.indexOf("!")>-1) { // 有参数。要把参数列表附带上UC中的值
        		var params= varstr.split("!")[1];  //P1,P2,P3...
        		var paramList = params.split(","); //P1 P2 P3
        		for (var i=0; i<paramList.length; i++) {  // 对每一个Pn，找到值val，得到 P1:v1  P2:v2  P3:v3 ...
        			var param = paramList[i];
        			var val = $.UC.parser("#" + param + "#");
        			if (val == "") { 
        				val = "undefined";
        			}
        			paramList[i] = param + ":" + val;
        		}
        		valuedvarstr = varname + "!" + paramList.join(",");  // varname!P1:v1,P2:v2,P3:v3...     OK
        	}
        	else {  // 没有参数，直接用varname发送到后台
        		valuedvarstr = varname;
        	}
        	$.ajax({
                type:"POST",
                url:$.DF.options.dataBindingURL, // 
                data:{
                    varstr:valuedvarstr
                    },
                dataType:"text",
                success:function(data,textStatus){
                    var vn = data.split(":")[0];
                    if (varname == vn) {
                    	$("span#"+varname).text(data.split(":")[1]);
                    }	
                }
            });
        },
        
        warpto: function(towinno, towin_cond) {
        	if (typeof(towin_cond) == "undefined" || towin_cond == null) 
        		towin_cond = '';
        	$.page.openExternal(towinno, null, null, towin_cond);
        }

    };
	
})(jQuery);