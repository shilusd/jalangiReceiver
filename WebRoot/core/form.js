;
(function($){
    $.F = $.form =  {
        options:{
            formParamURL:$.global.functionDefinitionUrl+"?type=F", 
            dataBindingURL:"common_getBindingData.action",
            inputDataURL:"common_bindInputData.action",
            autoCompleteURL:"autoComplete.action",
            DATA_SPLIT_STR:"$|",
            callJavaURL:"win1001_callJavaAction.action",
            hyperQueryBase: 100000
        },
		 
        list:{},
        validators:{},
        varsNum:{},
        runInstance: function( funcNo,options ){
            var op = $.extend({
                complete:function(){},
                allComplete:function(){},
                target:"main",
                funcInMemStr:""
            },options);
            if(this.list[ funcNo ] == null || typeof(op.zIndex) != "undefined"){
                $.ajax({
                    type: "POST",
                    url:  $.form.options.formParamURL,
                    data: {
                        funcNo:funcNo
                    },
                    dataType: "json",
                    success: function( data,textStatus ){
                        var formDef = data[0];
                        $.appendScript(funcNo,formDef.script);
                        
                        formDef.complete = op.complete;
                        formDef.allComplete = op.allComplete;
						
                        formDef.funcInMemStr = op.funcInMemStr;
						
                        if (op.zIndex) {
                        	formDef.funcno = funcNo = op.zIndex; // 在hyperQuery情况下，funcno 改为zIndex 
                        	formDef.hqParams = op.paramstr;   //  hqParams用于保存要传入的参数，在initFormData时替换sql中的变量。
                        }
                        else {
                        	formDef.hqParams = undefined;
                        }


                        $.form.list[funcNo] = formDef;
                        $.userContext.appendDataType(formDef.typeMap);

                        // 通过initcond传来的参数，只能一次性有效。 initcond在hyperQuery情况下将被忽略。
                        if (!op.zIndex && op.initcond){
                        	formDef.hqParams = op.initcond;
                        }

                        $.form.createNew( formDef,op.target );
						
					
                        //$("#form" + funcNo).show("drop",{},500);
                    },
                    error:function(e){
                        var r = $("<a href='javascript:void(0)'><span class='ui-icon ui-icon-refresh' style='float:left'></span>窗口错误,点击刷新</a>")
                        .click(function(){
                            $.F.runInstance(funcNo,options);
                        });
                        $( "#"+options.target ).empty().append(r);
						
                    }
                });
            }else{
                var formDef = $.form.list[funcNo];
                formDef.funcInMemStr = op.funcInMemStr;
                
                // 以下两个参数只能一次性有效。
                if (op.zIndex) {
                	formDef.funcno = funcNo = op.zIndex; // 在hyperQuery情况下，funcno 改为zIndex 
                	formDef.hqParams = op.paramstr;   //  hqParams用于保存要传入的参数，在initFormData时替换sql中的变量。
                }
                else {
                	if (op.initcond){
                		formDef.hqParams = op.initcond;
                	}
                	else
                		formDef.hqParams = undefined;
                }
                
                $.form.createNew( formDef,  op.target);
                //$("#form" + funcNo).show("drop",{},500);
            }
			
            return $.form;
        },
        clear: function(funcno){
        	$("#b_form"+funcno+" input").val('');
        	$("#b_form"+funcno+" select").val('');
        	$("#b_form"+funcno+" textarea").val('');
        },
        setOid : function(obj){
            if(obj.attr("setOid"))
                return;
            else{
                var inputField = obj.find("table tbody tr td").children();
                $.each(inputField,function(i,n){
                    var id = $(this).attr("id");
                    if(typeof(id)!="undefined"){
                        $(this).attr("oid",id);
                    }
                    var name = $(this).attr("name");
                    if(typeof(name)!="undefined"){
                        $(this).attr("oname",id);
                    }
                });
                obj.attr("oid",obj.attr("id"));
                obj.attr("setOid",true);
            }
        },
        drawMultiVars :function(formDef){
            $.F.varsNum[formDef.funcno] = 1;
            var btnOptions={
                icon:"ui-icon-minus", 
                pos:"left"
            }
            var delButton = $.button.createIcon(btnOptions);
				
            btnOptions={
                icon:"ui-icon-plus", 
                pos:"left"
            }
            var addButton = $.button.createIcon(btnOptions);
				
            $("#b_form"+formDef.funcno).parent().next().append(addButton);
            $("#b_form"+formDef.funcno).parent().next().next().append(delButton);
				
            $("#form"+formDef.funcno+" div table tbody tr td div").filter(".iconBtn").click(function(){
                if($(this).children("span").hasClass("ui-icon-plus")){  //"+"
						
                    $.form.setOid($("#b_form"+formDef.funcno));
                    var $table = $(this).parent().parent().parent().parent();
                    var funcno = $table.attr('funcno');
                    if ($.F.varsNum[funcno] >= $.F.list[funcno].maxVarNum) {
                        alert('已达到最大行数!');
                        return;
                    }
                    var $bodyTd = $(this).parent().prev().clone(true);
                    var $addTd = $(this).parent().clone(true);
                    var $delTd = $(this).parent().next().clone(true);
                    var $tr = $("<tr></tr>").append($bodyTd).append($addTd).append($delTd);
                    $table.append($tr);
                    var $div = $bodyTd.find("div");
                    $.each($div,function(i,n){
                        if($(this).attr("id")){
                            $(this).attr("id",$(this).attr("oid")+"_" + $.F.varsNum[funcno]);
                            $(this).css("margin",formDef.maxVarMargin+'px');
                            var oid = $(this).attr("oid");
                            $("#"+oid).css("margin",formDef.maxVarMargin+'px');
                        }
								
                    });
						
                    var input = $bodyTd.find("div table tbody tr td").children();
                    $.each(input,function(i,n){
                        if($(this).hasClass("dateInput")){
								
                            var id = $(this).attr("oid");
								
                            id = id + "_" + $.F.varsNum[funcno];
                            $(this).attr("id", id).removeClass("hasDatepicker").datepicker({
                                changeYear:true,
                                changeMonth:true,
                                duration:"fast",
                                dateFormat: "yy-mm-dd",
                                beforeShow:function(i, e){
                                    $(this).attr("oldDate", $(this).val());
                                },
                                onClose:function(e){
                                    if (e.indexOf(' ') > -1){
                                            e = e.substring(0, e.indexOf(' '));
                                            $(this).val(e);
                                    }
                                    $.form.getDataToContext(funcno);
                                    $.page.triggerBy(funcno);
                                } 
                            }).css("z-index",10005);
                        }
							
                        else{
                            var id = $(n).attr("oid");
                            if(typeof(id)!="undefined"){
                                id = id + "_" + $.F.varsNum[funcno];
                                $(n).attr("id",id);
                            }
                            var name = $(n).attr("oname");
                            if(typeof(name)!="undefined"){
                                name = name + "_" + $.F.varsNum[funcno];
                                $(n).attr("name",name);
                            }
                        }
                        $(this).keyup(function(){
                            $.form.getDataToContext( funcno );
                        });
                    });
						
                    $.F.varsNum[funcno] = $.F.varsNum[funcno]+1;
                //$.form.getDataToContext( funcno );
                }else{													//"-"
						
                    var $table = $(this).parent().parent().parent().parent();
                    var $tbody = $(this).parent().parent().parent();
                    var funcno = $table.attr('funcno');
                    var $tr = $(this).parent().parent();
                    var div = $tr.find("td div")[0];
                    if(typeof($(div).attr("oid"))=="undefined" || $(div).attr("oid") && ($(div).attr("oid")==$(div).attr("id"))){
                        alert("请勿删除首行变量!");
                        return;
                    }
                    var $trSib = $tr.nextAll();
                    var ids =  $(div).attr("id").split("_");
                    var index = ids[ids.length-1];
                    var dindex = index;
                    $tr.remove();
                    $.each($trSib,function(){
                        $.each($trSib.find("td div table tbody tr td").children(),function(){
                            if($(this).hasClass("dateInput")){
                                var id = $(this).attr("oid");
                                id = id + "_" + index;
                                $(this).attr("id", id).removeClass("hasDatepicker").datepicker({
                                    changeYear:true,
                                    changeMonth:true,
                                    duration:"fast",
                                    dateFormat: "yy-mm-dd",
                                    beforeShow: function(i,e){  
                                        $(this).attr("oldDate", $(this).val());
                                        var z = jQuery(i).closest(".ui-dialog").css("z-index") + 10;   
                                        e.dpDiv.css('z-index', z)
                                    },
                                    onClose:function(e){
                                        if (e.indexOf(' ') > -1){
                                            e = e.substring(0, e.indexOf(' '));
                                            $(this).val(e);
                                        }
                                        $.form.getDataToContext(funcno);
                                        $.page.triggerBy(funcno);
                                    }
                                }).css("z-index",10005);
                            }else{
                                var id = $(this).attr("oid");
                                if(typeof(id)!="undefined"){
                                    id = id + "_" + index;
                                    $(this).attr("id",id);
                                }
                                var name = $(this).attr("oname");
                                if(typeof(name)!="undefined"){
                                    name = name + "_" + index;
                                    $(this).attr("name",name);
                                }
                            }
                        });
                        index = parseInt(index) +1;
                    });
                    $.each($trSib.find("td div"),function(){
                        if($(this).attr("id")){
                            $(this).attr("id",$(this).attr("oid")+"_" + dindex);
                            dindex = parseInt(dindex) +1;
                        }
                    });
                    $.F.varsNum[funcno] = $.F.varsNum[funcno]-1;
                    $.form.getDataToContext( funcno );
                }
						
            });
        },
        createNew: function( formDef, target ){
			
            var formid = "form" + formDef.funcno;

            var formHtml = $.form.drawNew(formDef);
            $( "#"+target ).empty()
            .append( $(formHtml) );
            
            $("#" + formid).find(" table tr td table tr").height(28);  // 覆盖默认行高
            $("#" + formid).find(" table tr td table").css("width", "100%");
            // 临时：默认平分各列。
            var $data_table = $("#"+ formid + " table tr td table");
            for (var i = 1; i <= formDef.colcount; i ++) {
            	var $tds = $data_table.find("[colspan="+i + "]");
            	var widthstr = $tds.attr("width") + " ";
            	if (widthstr.match(/.% /)) {
            		break;  // 如果原来就是百分比，则不用做了。兼容新的WF3
            	}
            	var perc = Math.floor(10000 / formDef.colcount * i,2) / 100;
            	$tds.attr("width", perc + "%");
            }
            
            if(formDef.multiVars){
                $.F.drawMultiVars(formDef);
            }
			
            var formFields = formDef.formFields;
			
            var hasRichedit = $.form.checkIfRichedit(formDef.funcno,formFields);

            $.form.moveTextToTitle(formDef.funcno, formFields );
            
            $.form.replaceFieldMarks( formDef.funcno, formFields );
            
            // 画完以后重新整理宽度
            //$.form.resizeFormInputs(formid);
            
            // 画完以后，检查每个单元格内容，设置caption类
            $.form.setFormTdCaption(formid);

            var rules =  $.form.getValidateRules(formid, formFields);
            $.form.validators[formDef.funcno] 
            = $( "#" + formid ).validate({
                rules: rules
            });
            if(!hasRichedit){//若有richedit，则将初始化工作放到editor加载好后执行
                $.form.initFormData(formDef.funcno);
                //$.form.getDataToContext(formDef.funcno);  // 放到initFormData里面去了
                
            }
        },
		

        drawNew:function( formDef ){
            var formTable = "";
            var body = formDef.formhtml;
            var formid = "form" + formDef.funcno;
            if(body == ""){	
                body = "<table cellspacing='0' width=100%>";
                var fields = formDef.formFields;
                for( var i = 0; i < fields.length; i++ ){
                    body+="<tr><td style='width:200px'>"+fields[i].label+"：</td><td style='width:250px'>#"+fields[i].fieldname+"#</td></tr>";
                }
                body +="</table>";
            }
            body = '<div id="b_'+formid+'" class="form-body">' + body + '</div>';
			                // b_form1234
            var formHtml = "<form id='" + formid + "' class='form1'>"
//            + "<div style='overflow:auto;min-width:350px;width:"+formDef.width+"px;height:"+formDef.height+"px' class='form1'>"
            + "<div style='min-width:"+formDef.width+"px;'  class='form1'>"
            
//为什么要把主form的内容塞在很多td里？——因为如果要第三方定义form，就不知道funcno了。所以funcno必须套在 具体的body定义外面。（但只需要一行一列就行了）
//            + "<table funcno='"+formDef.funcno+"' style='cellSpacing=0 cellPadding=0'><tr><td>"+ body + "</td><td></td><td></td></tr></table></div><div id='form"+formDef.funcno+"_extDiv'></div></form>";
            + "<table funcno='"+formDef.funcno+"' style='width:100%;border:none;'><tr><td>"+ body + "</td></tr></table></div><div id='"+formid+"_extDiv'></div></form>";
			
            return formHtml;
        },
        
        /* 本段仿照replaceFieldMarks: by wyj */
        moveTextToTitle: function(funcno, formFields){  // 为了避免替换控件时，受到过长 变量拉伸td的影响，先将td中的变量名转移到title中。在后面replace的时候通过title属性来查找。
/*        	var $td = obj.find("td");
            $.each($td,function(i,n){
            	var it = $td.innerText;
            	if (typeof(it) != "undefined") {
            		if (it.charAt(0) == '#') {
            			$td.attr("title",$td.innerText);
            			$td.innerText = "";
            		}		
            	}
            });  
*/ 	
        	var formid = "form" + funcno;
            
            //逐一替换标记字段
            for( var i = 0; i < formFields.length; i++ ){
                //获得字段定义细节
                var f = formFields[i];
                //获得替换位置的jquey对象
                var $markedField = $.form.findMark(formid, f.fieldname);	
                // 添加一个title属性，存变量名
                $markedField.attr("title1",  "#"+f.fieldname+"#"); //不能用title，因为title是hint默认用的（浏览器默认会显示为hint）。所以放在title1中。
                //清空内部标记
                $markedField.empty();
            };

        },
        /*
		 * 查看是否包含有richedit类型的输入类型
		 * @param {Object} funcno
		 * @param {Object} formFields
		 */
        checkIfRichedit :function(funcno,formFields){
            for( var i = 0; i < formFields.length; i++ ){
                var f = formFields[i];
                if(f.inputtype=="richedit")
                    return true;
            }
            return false;
        },
        getRicheditid :function(funcno,formFields){
            for( var i = 0; i < formFields.length; i++ ){
                var f = formFields[i];
                if(f.inputtype=="richedit")
                    return f.id;
            }
        },
        /* 按照表单内的标号替换相关内容
		 * 标号的形式为 #number#,含有标号的地方将被替换成相应的 input
		 * @param funcno:待替换的表单功能号
		 * @param formFields：将替换成的各个字段的描述，格式为json数组
		 */ 
        replaceFieldMarks: function(funcno,formFields){
            var formid = "form" + funcno;
            var funcMap = $.form.list[funcno].funcMap;
            //逐一替换标记字段
            for( var i = 0; i < formFields.length; i++ ){
                //获得字段定义细节
                var f = formFields[i];
                //该input的id号，生成格式为：‘表单号_字段名’
                var fid = formid + "_" + f.id;
                //获得替换位置的jquey对象（由于之前已经把变量换到自定义的title属性中，因此从title属性查找jQuery对象:by wyj）
                var $markedField = $.form.findMarkByAttrTitle(formid, f.fieldname);	
                //清空内部标记
                //$markedField.empty();
                //绑定input类型
                $.form.bindingInput(f.inputtype,f.jscontent, f.binding_data, fid, f.align,f.funcinmem,$markedField,funcno,f.readonly,f);
                $.addHint($("#"+fid),f.hint);
                $.form.bindingTrigger(funcno, fid, f.inputtype, f.trig, funcMap, $.form.list[funcno].bindMap);
            };
            
        },
        
        // td的宽度会由于表格内容的宽度的变化而变化，因此，在画完所有内容后，对所有input、select、textarea根据实际的td宽度重新设置宽度
        resizeFormInputs: function(formid) {
//        	setTimeout(function(){
                var $inputs = $("#"+ formid + " td>input, #"+ formid + " td>textarea,#"+ formid + " td>select");
                var i=0;
                var j=0;
                var widthShrinkAdjust = 0;
                while (i < $inputs.length) {
                	$input = $($inputs[i]);
                	// IE实在太难调整，干脆不调了 // BUG 338（from张晓竹）    // 为table增加table-layout:fixed后，IE也可以很好对齐了！！！！
                	//if ( $input.css("width").match(/[%]/) || $input.parent().css("width").match(/[%]/))
                	            	// 对百分比的不处理（IE8中，width()会把百分比的宽度返回成0） // Bug 273
                	if ($input.css("width").match(/[%]/) || $input.parent().css("width").match(/[%]/) || $input.width() == 0 || $input.parent().width() == 0)
    				{
    					i ++;
    					continue;
    				}

                	var oldParentWidth = $input.parent().width();
                	var oldInputWidth = $input.width();
                	if (typeof($input.attr("hasbutton"))!="undefined") {
                		//if ((! isIE()) || ($input.width() > $input.parent().width() -40-widthShrinkAdjust))  // bug 305的附带修改
                			$input.width( $input.parent().width() -40 -widthShrinkAdjust);
                	}
                	else {
                		//if ((! isIE()) || ($input.width() > $input.parent().width() -10-widthShrinkAdjust))   // bug 305 增加此行，确保在IE10/11中，input的parent不会被撑宽。
                			$input.width( $input.parent().width() -10 -widthShrinkAdjust);
                	}
                		
                	// 在table上增加了样式table-layout:fixed，这样可以避免table被撑开。这样就很好得保护了各列宽度。
                	if (oldParentWidth < $input.parent().width() ) {  // 界面变化了，重来。 //WARNING:理论上，总能终止，除非某浏览器真的很不规则。。。
                		i=0;
                		j++;   // 坏的 计数+1
                		widthShrinkAdjust+=10;
                		$input.width( $input.width() - 10);
                		//$input.width(oldInputWidth -10);
                		$input.parent().width(oldParentWidth); // BUG 427 原来是把$input设回原来的宽度，这导致反复拉伸的问题。现在是尽量减少已经变化的界面。
                												// 事实证明，即使layout 是 fixed，table也会被撑宽。:(
                	}
                	else {
                		i++;
                	}
                	
                	if (j>100) {  // 坏的 计数太多就不干了。万一出现意外，至少先退出来
                		//alert("Client Scripting Error in 'resizeFormInputs'. ");
                		break;
                	}
                }
//        	}, 200);
            
        },
        
        // 根据td的内容，设置是否需要显示为淡淡的底色
        setFormTdCaption: function(formid) {
        	var $tds = $("#"+ formid + " table td table td"); 
        	// 规则：如果td的innerHTML不为空，且没有title1属性，则该td是caption，适用caption样式(带有底色，粗体）
        	$.each($tds, function(i) {
        		var $td = $tds[i];
        		var innerText = $td.innerHTML.replaceAll("&nbsp;", "");
        		if ((typeof($($td).attr("title1")) =="undefined") && ($.trim(innerText) != "") ) {
        			$($td).addClass("iscap");
        		}
        	});
        },
		
        findMark: function(formid,position){
            //return $("#" + formid + " table td:contains(#" + postion + "#):first"); //注意：这一行是原来的form，下面是为了驾驶舱做的修改
            return $("#" + formid + " table td table td:contains(#" + position + "#):first" );
        },
        findMarkByAttrTitle: function(formid, position) {
        	return $("#" + formid + " table td table td[title1=\"#" + position + "#\"]");
        },
        
        bindRadioOptions: function(data, $target){
        	var id = $target.attr("id");
        	var funcno = $target.attr("funcno");
        	var kvs = data.split(";");
        	for(var i=0;i<kvs.length;i++){ 
        		var kv=kvs[i].split(":");
        		$target.append("<li style='float:left;padding-left:8px;padding-right:8px'><input type='radio' name='"+id+"' value='"+kv[0]+"'/><span>"+kv[1]+"</span></li>");
        	}
        	$target.find(">li>input").click(function(){
        		if ($.form.getDataToContext(funcno))
        			$.page.triggerBy(funcno);
        	});
        },
        // BUG 423 CheckGroup的绑定值
        bindCheckOptions: function(data, $target) {
        	var id = $target.attr("id");
        	var funcno = $target.attr("funcno");
            var kvs = data.split(";");
            for(var i=0;i<kvs.length;i++){ 
                var kv=kvs[i].split(":");
                $target.append("<li style='float:left;padding-left:8px;padding-right:8px'><input type='checkbox' name='"+id+"' value='"+kv[0]+"'/><span>"+kv[1]+"</span></li>");
            }
            $target.find(">li>input").click(function(){
                if ($.form.getDataToContext(funcno))
                	$.page.triggerBy(funcno);
            });        	
        },
		
        /* 绑定输入类型
		 *@param inputtype: 要绑定的输入类型
		 *@param bindData: 要绑定在输入控件中的数据
		 *@param id: 赋给该输入控件的 id 号
		 *@param align: 编辑位置
		 *@param funcinmem: 弹出框的数据是否由字段的数据初始化 
		 *@param $target:输入控件要绑定到的目标
		 **/
        bindingInput:function ( inputtype,jscontent, bindData, id , align,funcinmem, $target, funcno,readonly,fielddef){
            if( typeof($.form.input[inputtype]) == 'function')
                return $.form.input[inputtype](id,jscontent, bindData,funcinmem, $target, align,funcno,readonly, fielddef); 
            else 
                return "<a style='color:red'> error type:"+inputtype+"</a>";
        },
        updateContext: function(funcno) { // BUG 335 新增此方法，可以给WF设计工具在自定义js中直接调用。以避免IE8 自定义js的onchange和内置change方法的冲突。
    		if ($.form.getDataToContext(funcno)) {  // bug 286 lhh hgcca getDataToContext现在有返回值了。返回false表示context无任何变化。
    			$.page.triggerBy(funcno);
    		}
        },		
		
        /*输入类型*/
        input:{
            //文本框
            text:function(id,jscontent,bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                var $input = $("<input "+jscontent+" id='"+id+"'  name='"+id+"' type='text' style='text-align:"+align+";width:95%;height:20px;'/>");
            	//var $input = $("<input "+jscontent+" id='"+id+"'  name='"+id+"' hasNoButton type='text' style='text-align:"+align+";width:" + ($target.width()-6) + "px;height:20px;'/>");
                																																	//原来是19px			
                $input.ready(function(){
                    ///$$$///$.form.getDataToContext(funcno);
                    $.page.triggerBy(funcno);
                });
				
                $input.blur(function(){
                    if ($.form.getDataToContext(funcno))
                      $.page.triggerBy(funcno);
                });
				
                $input.focus(function(){
                    $input.select();
                    if ($.form.getDataToContext(funcno))
                    $.page.triggerBy(funcno);
                });
				
                $input.keyup(function(){
                    if ($.form.getDataToContext(funcno))
                    $.page.triggerBy(funcno);
                });
                
                $target.append($input);
            },
            //小图片
            img :function(id,jscontent,bindData,funcinmem,$target,align,funcno,readonly,fielddef){
//                var $imgUploader = $("<input id='"+id+"' name='"+id+"' type='file'/>")
//                $target.append($imgUploader);
//                $imgUploader.uploader({
//                    fileDesc : '支持格式:jpg/gif/jpeg/png/bmp.',
//                    fileExt	 : '*.jpg;*.gif;*.jpeg;*.png;*.bmp',
//                    multi:true
//                });
//                
                $target.append("<div id="+id+"></div>");
                $("#"+id).uploadFile({
                	funcno: funcno,
                	multi: false,				
                	fileDesc  	   : '请选择jpg、bmp、png、gif文件',
                	fileExt 	   : '*.jpg;*.bmp;*.png;*.gif',
                	maxFileCount : 1
                });
            },
            //日期 
            date:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                var $dateInput = $("<input func='"+funcno+"' "+jscontent+" id='"+id+"' name='"+id+
                		"' type='text' dateInput='true'  style='width:97%;height:20px;background-color:#EEEEEE;' class='dateInput' readonly='readonly'/>");
                $dateInput.attr("title", "点击选择日期");
                $target.append($dateInput);
                $dateInput.datepicker({
                    changeYear:true,
                    changeMonth:true,
                    duration:"fast",
                    dateFormat:"yy-mm-dd",
					
                    beforeShow: function(i,e){
                        $(this).attr("oldDate", $(this).val());
                        var z = jQuery(i).closest(".ui-dialog").css("z-index") + 4; 
                        if (z){
                            $('#ui-datepicker-div').css('z-index',z); 
                        }
                    },
                    onClose:function(e){
                        //$("#"+id).val($dateInput.datepicker("getDate").format("yyyy-MM-dd"));
                        //alert($("#"+id).val());
                        //$("#"+id).val($("#"+id).val());
						if (e.indexOf(' ') > -1){
							e = e.substring(0, e.indexOf(' '));
							$(this).val(e);
						}
                        $.form.getDataToContext(funcno);
                        $.page.triggerBy(funcno);
                        $(this).change();
                    }
                }).css("z-index",10005);
                $dateInput.keyup(function(){  // bug 170
                	$.form.getDataToContext(funcno);
                	if ($dateInput.val() != "") {  // 如果日期的值是空串，那么显然是不正确的。因此不需要再做 “影响”。但为了便于发现问题，仍然确保context和界面一致。
                		$.page.triggerBy(funcno);
                	}
                });
				
            },
			
            //编辑框
            textarea:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
            	$textarea = $("<textarea "+jscontent+" id='"+id+"' name='"+id+"' rows='"+(fielddef.height==""?0:fielddef.height)+"' cols='"+(fielddef.width==""?0:fielddef.width)+"' style='width:95%;height:100%'></textarea>");
            	//fielddef.height和width似乎是没有用的：：BUG 404 顺带
            	//$textarea = $("<textarea "+jscontent+" id='"+id+"' name='"+id+"' rows='"+fielddef.height+"' cols='"+fielddef.width+"' style='width:95%;height:100%'/>");
            	$textarea.click(function(){  /// BUG 404 在IE8下，会莫名无法编辑。加入这个事件处理后，就可以编辑了。
            		if ($textarea.val() == "")
            			$textarea.select();
            	});
            	$textarea.keyup(function(){
            		if ($.form.getDataToContext(funcno))
            		$.page.triggerBy(funcno);
            	});
            	$target.append($textarea);
            },
            //勾选框
            checkbox:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                var $checkbox = $("<input "+jscontent+" id='"+id+"' name='"+id+"' value='F' type='checkbox'/>");
                $target.append($checkbox)
            },
            //密码框
            password:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                $target.append("<input "+jscontent+" id='"+id+"' name='"+id+"' type='password' style='width:95%;height:20px;'/>");
            },
            //图片捕获
            capturer:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                $target.append("<div id="+id+"></div>");
                $("#"+id).capturer({});
            },
            //图片捕获flex版
            camera:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                $target.append("<div id="+id+"></div>");
                $("#"+id).camera();
            },
            //上传文件至文件系统
            uploadfile:function(id,jscontent,bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                $target.append("<div id="+id+">...</div>");
                setTimeout(function () {  // BUG 419 解决 IE11 下 在弹出框中有很大概率无法显示“上传文件”的问题。
                	$("#"+id).uploadFile({funcno: funcno});
                	
                	if (readonly) {  // BUG 419的后续修改 （董鑫发现）
                		$("#"+id+"Uploader").remove(); //去掉上传flash
                		$("#"+id).parent().find("ul>li>img").remove();// 去掉删除按钮
                		$("#"+id).parent().attr("uploadfilero", "true");
                	}
                	else
                		$("#"+id).parent().removeAttr("uploadfilero");
            		$("#"+id).setFileNames($("#"+id).attr("vals"));                		
                }, 300);
            },
            //大文档
            bigdoc:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                $("<div class='form-body' id="+id+"></div>")
                .appendTo($target)
                .ftpFileUploader({}); 
            },
          //checkgroup
            checkgroup:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                var $checkgroup = $("<ul " + jscontent + " style='list-style-type: none;' id="+id+" funcno='" + funcno + "' checkgroup=true></ul>").appendTo($target);
                
                if(bindData.substring(0,1) != "@")  // BUG 423 非@的现在处理，@的在后面(initFormData中的setInputData里)再处理
                	$.F.bindCheckOptions(bindData, $checkgroup);
            },
            //radio
            radio:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                var $radiobox = $("<ul " + jscontent + " style='list-style-type: none;' id="+id+" funcno='" + funcno + "' radio=true></ul>").appendTo($target);
                
                if(bindData.substring(0,1) != "@")  // BUG 323 非@的现在处理，@的在后面(initFormData中的setInputData里)再处理
                	$.F.bindRadioOptions(bindData, $radiobox);
                //    $.C.getKeyValsFromDB($.userContext.parser(bindData.substring(1)),bindOptions); 
                    
            },
            //下拉框 
            select:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                //如果绑定的数据是以‘@’开头表示是一条 SQL 语句，需要请求服务器查询得到键值对。
                var $select = $("<select " + jscontent + " id='"+id+"' name='"+id+"' style='float:"+align+";width:97%;height:20px;'></select>");
                $target.append($select);
				
                if(bindData.substring(0,1) != "@"){
                    $select.append($.F.getOptions(bindData));
                }
                if(typeof($select.attr("sdata"))!="undefined"){
                    $select.val($select.attr("sdata"));
                }else
                    $select.val("-1");
				
                if (fielddef.trig == "") {  // 如果trig != "" 则bindingtrigger中会赋change()
//                	var selectDOM = document.getElementById(id);
//                	selectDOM.onchange = function() {
//                		alert("aaaa");
//                		if ($.form.getDataToContext(funcno)) {  // bug 286 lhh hgcca getDataToContext现在有返回值了。返回false表示context无任何变化。
//                			$.page.triggerBy(funcno);
//                		}
//                	};
                	
//                	$("#" + id).bind("change", function() {
                	// 如果是IE8，并且 jscontent中有onchange=，则不额外绑定change事件，但要求jscontent中必须有$.form.updateContext()这句话
                	if (!(/*$.browser.msie && $.browser.version < 9 && */jscontent.match(/.*onchange=.*/i))) {
                	$select.change(function(){
////                		var thatFun=arguments.callee;
////                		var that=this;
////                		$(this).unbind("change",thatFun);
////                		 
//
//                		alert("aaaa");
                		$(this).attr("sdata", this.value);  // BUG 422 在后面取数据的时候，如果value为空则总是先从sdata取，导致在选择《请选择》时无法正确设定value为空。
                		$.form.updateContext(funcno);
//                		
////                		setTimeout(function(){$(that).bind("change",thatFun)},1000);
                	});
                	}
                }
                
            },

			
            list:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
            	var $input = $("<input "+jscontent+" id='"+id+"'  name='"+id+"' type='text' hasbutton style='text-align:"+align+";width:"+($target.width()-30)+"px;height:20px;'/>");
                var $sbtn  = $($.button.create({
                    title:"",
                    caption:"",
                    type:"button",
                    width:18,
                    height:18,
                    icon:"ui-icon-search",
                    bgImg:false
                })).css("float","right");
                $target.append($input).append($sbtn);
                var fno = bindData.split("@")[0];
                var dstr = bindData.split("@")[1];
                $sbtn.click(function(){
                    $.form.openFunc(funcno,id,'Q',funcinmem,fno,dstr);
                });
                $input.blur(function(){
                    $.form.getDataToContext(funcno);
                    $.page.triggerBy(funcno);
                });
            },
			
            func:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                var styleColor="";
                if (funcinmem)
                    styleColor="color:white;";
                var $input = $("<input "+jscontent+" id='"+id+"' name='"+id+"' hasbutton type='text' style='text-align:"
                		+align+";width:"+($target.width()-30)+"px;height:20px;"
                		+styleColor+"'/>");
                   // 去掉disabled属性 。因其影响validate取元素（jquery.validate.min.js:elements方法，其中过滤了disabled的控件）。bug 249
        		if (readonly) {
        			$input.attr("readonly",readonly)                		
        			.css("color","rgb(48,48,48)")
            		.css("background-color", "rgb(240,240,240)");  // BUG 430
        		}
                var funcbind = bindData.split("@");  //Q@2723@#2723-p1.school_project_code#/#2723-p1.id#    
                var $sbtn  = $($.button.create({
                    title:"",
                    caption:"",
                    type:"button",
                    width:18,
                    height:18,
                    icon:$.global.iconSet[funcbind[0]],
                    bgImg:false
                })).css("float","right");
				
                $target.append($input).append($sbtn);
				
                $sbtn.click(function(){
                    $.form.openFunc(funcno,id,funcbind[0],funcinmem,funcbind[1],funcbind[2]);
                })
                $input.change(function(){
                    if ($.form.getDataToContext(funcno))
                    	$.page.triggerBy(funcno);
                });
            },
			
            richedit :function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                $target.append("<div id="+id+"></div>");
                $("#"+id).attr("ckReadonly",readonly).attr("funcno",funcno).richEditor({
                    "width":$target.width()-6,
                    "height":$target.height()
                });
            },
            windialog :function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
                var $input = $("<input "+jscontent+" id='"+id+"'  name='"+id+"' hasbutton type='text' style='text-align:"
                    +align+";width:"+($target.width()-30)+"px;height:20px;'/>");
                var funcbind = bindData.split("@");
                var $sbtn  = $($.button.create({
                    title:"",
                    caption:"",
                    type:"button",
                    width:18,
                    height:18,
                    icon:$.global.iconSet[funcbind[0]],
                    bgImg:false
                })).css("float","right");
				
                $target.append($input).append($sbtn);
				
                $sbtn.click(function(){
                    $.page.act.jump($.page.idFunc.funcno2winno(funcno),funcbind[1]);
                })
                $input.change(function(){
                    $.form.getDataToContext(funcno);
                    $.page.triggerBy(funcno);
                });
			
            },
			textselect:function(id,jscontent, bindData,funcinmem,$target,align,funcno,readonly,fielddef){
				var $input = $("<input "+jscontent+" id='"+id+"'  name='"+id+"' type='text' style='text-align:"+align+";width:95%;height:20px;'/>");
            		
                $input.ready(function(){
                    ///$$$///$.form.getDataToContext(funcno);
                    $.page.triggerBy(funcno);
                });
				
                $input.blur(function(){
                    $.form.getDataToContext(funcno);
                    $.page.triggerBy(funcno);
                });
				
                $input.focus(function(){
                    $input.select();
                    $.form.getDataToContext(funcno);
                    $.page.triggerBy(funcno);
                });
				
                $input.keyup(function(){
                    $.form.getDataToContext(funcno);
                    $.page.triggerBy(funcno);
                });
				
                $target.append($input);
				
                $input.autocomplete($.form.options.autoCompleteURL+"?funcno="+funcno+"&fieldname="+fielddef.fieldname+"&id="+funcno+"-"+fielddef.fieldname, {
					width:fielddef.acWidth,
					matchContains: true,
					matchCase: true, // 匹配大小写。如果不匹配，则会全部转为小写。
					max:100,
					mustMatch:fielddef.acMustMatch,
					parse: function(data) {
						if (data.trim()=="")
							return;
						var arRows=data.split("$|$");
						var rows = [];  
						for(var i=0; i<arRows.length; i++){  
							var arKV=arRows[i].split("|$|");
							rows[rows.length] = {   
								data:arKV[1],   
								value:arKV[0],   
								result:arKV[0]
							};
							arKV=undefined;
						}  
						return rows;  
					},  
					formatItem: function(row, i, max) {
						return i + "/" + max + ": " + row;
					}
				}).result(function(event, data, formatted) {
					//$input.blur();	
					$.form.getDataToContext(funcno);
                    $.page.triggerBy(funcno);
				});
			}
        },
		
        bindingTrigger:function(funcno, id, type, trigStr, funcMap,bindMap){
            if( trigStr == "" )
                return;
            var formid = "form"+funcno;
            var $input = $( "#" +  id );
            var trigList = trigStr.split(',');
            var trigCompute = function(){
                if($.F.list[funcno].multiVars){
                    var id = $(this).attr("id");
                    var index;
                    if(typeof($(this).attr("oid"))=="undefined" || $(this).attr("oid") && ($(this).attr("oid")==$(this).attr("id"))){ //说明是原字段
                        index = 0;
                        $.form.getDataToContext( funcno );
                        for( var i=0; i<trigList.length; i++){
                            var fname = trigList[i];
                            var fid = formid + "_" + fname.replace('.','-')
                            var func = funcMap[ trigList[i] ];
                            var funcName = func.split(":")[0];
                            var funcData = func.split(":")[1].split(";");
                            var result = funcName+":";
                            for(var j=0;j<funcData.length;j++){
                                var fno = funcData[j].split("#")[1].match(/\d*/);
                                if(fno==funcno)			//表示是该多变量窗口本身的变量
                                    result += ("#"+funcData[j].split("#")[1]+"_"+index+"#;");
                                else
                                    result += funcData[j]+";";
                            }
                            $.form.bindInputData($("#"+fid) , result.substring(0,result.length-1),bindMap[fname],true,true );
                        }
                    }else{//说明是clone字段
                        var ids = id.split("_");
                        index = ids[ids.length-1];
                        $.form.getDataToContext( funcno );
                        for( var i=0; i<trigList.length; i++){
                            var fname = trigList[i] + '_' + index;
                            var fid = formid + "_" + fname.replace('.','-')
                            var func = funcMap[ trigList[i] ];
                            var funcName = func.split(":")[0];
                            var funcData = func.split(":")[1].split(";");
                            var result = funcName+":";
                            for(var j=0;j<funcData.length;j++){
                                var fno = funcData[j].split("#")[1].match(/\d*/);
                                if(fno==funcno)			//表示是该多变量窗口本身的变量
                                    result += ("#"+funcData[j].split("#")[1]+"_"+index+"#;");
                                else
                                    result += funcData[j]+";";
                            }
                            $.form.bindInputData($("#"+fid) , result.substring(0,result.length-1),bindMap[fname],true,true );
                        }
                    }
					
                }else{
                    $.form.getDataToContext( funcno );
                    for( var i=0; i<trigList.length; i++){
                        var fname = trigList[i];
                        var fid = formid + "_" + fname.replace('.','-')
                        var func = funcMap[ fname ];
                        $.form.bindInputData($("#"+fid) , func,bindMap[fname],false,false );
                        //$.form.bindInputData($("#"+fid) , func,bindMap[fname],true,false );
                    }
                }
            }
            if( type.match(/textselect/)){
				$input.blur(trigCompute);
			}else if( type.match(/select|checkbox/)){
                $input.change(trigCompute);
            }else if (type.match(/text/)){  // TODO: 如果form中input修改后，需要刷其他input，那么应该从这里开始跟踪。 【input刷form】
                $input.keyup(trigCompute);
            }else if (type.match(/date/)){
                $input.change(trigCompute);
            }else{
                $input.blur(trigCompute);
            }
        },
	
        getValidateRules: function(formid,formFields){
            var rules = {};
            var c = formFields.length;
            for(var i = 0;i<c; i++){
				
                if(formFields[i].hidden)
                    break;
                rules[formid + "_" + formFields[i].id] =
                $.form.getValidateMode(formFields[i].nullable,  //允许为空
                    formFields[i].maxlen, 			//最大长度
                    formFields[i].minlen, 			//最小长度
                    formFields[i].maxval, 			//最大值
                    formFields[i].minval, 			//最小值
                    formFields[i].format				//格式
                    )
            }
            return rules;
        },
		
        getValidateMode: function(nullable,maxlen,minlen,maxval,minval,format){
            var validateMode = {}; 
            if( (nullable == false) ){
                validateMode.required = true ;
            }
			
            if( format && (format!="")  )
                if(format.charAt(0) == "@")
                    validateMode["remote"] = "common_validateData.action?funcName="+format.substring(1);
                else  
                    validateMode[format] = true;
			
            if( maxlen && (maxlen != "") )
                validateMode["maxlength"] = parseFloat(maxlen);
            else if( maxval && (maxval!="") )
                validateMode["max"] = parseFloat(maxval);
			
            if( minlen && (minlen!="") )
                validateMode["minlength"] = parseInt(minlen);
            else if( (minval!=null) && (minval!="") )
                validateMode["min"] = parseInt(minval);
			
            return validateMode;
        },
        genMultiVars:function(funcno,fields,len,formid){
            var data = {};
            for(var i=0;i<len;i++){
                var f = fields[i];
                var varname = funcno+"-"+f.fieldname;
                var val = $.form.getInputData(formid+"_"+f.id, f.inputtype ,f.binding_data);
                data[(varname+"_"+0).toUpperCase()] = val;
                for(var j=1;j<$.F.varsNum[funcno];j++){
                    var field_id = formid+"_"+f.id+"_"+j;
                    var t_val = $.form.getInputData(field_id, f.inputtype ,f.binding_data);
                    var t_varname = varname+"_"+j;
                    data[t_varname.toUpperCase()] = t_val;
                    val = ( val  + $.global.DATA_SPLIT_STR +t_val);
                }
				
                data[varname.toUpperCase()] = val;
            }
            return data;
        },
        getFormData:function( funcno ){
            var formDef = $.form.list[funcno];
            var fields = formDef.formFields;
            var formid = "form" + formDef.funcno;
            var len = fields.length;
            var data = {};
            if(formDef.multiVars){
                data = $.F.genMultiVars(funcno,fields,len,formid);
            }else{
                for(var i=0;i<len;i++){
                    var f = fields[i];
                    var val = "";
                    // TODO: 对内容进行检查，避免脚本注入等问题。
                    val = $.form.getInputData(formid+"_"+f.id, f.inputtype ,f.binding_data);
                    var varname = funcno+"-"+f.fieldname;
                    data[varname.toUpperCase()] = val;
                }
            }
            return data;
        },
		
        getInputData:function( id, type,bindData){
        	if(type == "img" || type == "file"){
                return $("#"+id).getFileNames();
				
            }else if(type == "capturer"){
                return $("#"+id).getCaputuredImgs();
				
            }else if(type == "camera"){
                return $("#"+id).getCapturedImgs();
            }else if(type == "uploadfile"){
                return $("#"+id).getFileNames();
            }else if(type == "bigdoc"){
                return $("#"+id).getUploadedFile();
				
            }else if(type == "checkbox"){
            	var k = bindData.split(":");
                return $("#"+id).attr("checked")?k[0]:k[1];
            }else if (type=="checkgroup"){
            	 var $checkgroup=$("#"+id).find("li>input:checked");
                 var rlt="";
                 for (var i=0;i< $checkgroup.length;i++)
                 	rlt+=$($checkgroup[i]).val()+",";
                 if (rlt.length>0)
                 	rlt=rlt.substring(0, rlt.length-1);
                 return rlt;
            }else if( type == "radio"){
                return $("#"+id).find(">li>input:checked").val();
               
            }else if ( type== "richedit"){
                return $("#"+id).getContent();
            }
            else{                                                    // 下面这个==null的判断是lhh hgcca中，用款情况查询时，数据刷不出来问题增加的。
            	                                                     // 该界面存在多次刷日期的情况，日期为空时就查不到数据。但是此时sdata是有数据的。
            	                                                     // 我同样假定最终平台会按照sdata的要求取到数据。
            	if ( type == "select" && ($("#" + id).val() == "" || $("#" + id).val() == null) && $("#" + id).attr("sdata") != "") {
            		return $("#" + id).attr("sdata")  // 如果select列表的数据还没到，则先返回sdata /// by wyj  Bug127
            	}
            	else {	
            		var input_val = $("#"+id).val(); // 要避免注入攻击
            		return input_val;
            	}
            }
        },
		
        setInputData:function( id, type, val, bindData){
            val = val.replace(/<br\/>/g,"\n");
            if(type == "file")
                $("#"+id).readFiles(val);
            else if (type == "img")
            	$("#"+id).setImgFiles(val);
				
            else if(type == "capturer")
                $("#"+id).setCaputuredImgs(val);
			
            else if(type == "camera")
                $("#"+id).setCapturedImgs(val);
			
            else if(type == "uploadfile") {
                $("#"+id).attr("vals", val);  // Bug 419 后续修改
                $("#"+id).setFileNames(val);
            }	
            else if(type == "checkbox"){
            	if(val == bindData.split(":")[0]){
                    $("#"+id).attr("checked",true);
                }else{
                    $("#"+id).attr("checked",false); 
                }
            }else if(type == "bigdoc")
                $("#"+id).setUploadedFile( val );
			
            else if(type == "radio"){
                //置空所有radio
            	$("#"+id).attr("rdata", val);
            	$("#"+id+">li>input").removeAttr("checked");
            	$("#"+id+">li>input[value="+val+"]").attr("checked",true);
            }	
            else if(type == "checkgroup"){
                //置空所有check
            	if (val.trim()=="")
            		return;
            	$("#"+id).attr("cdata", val); // bug 423
            	var arVals=val.split(",");
            	var $input=$("#"+id+">li>input");
            	$input.removeAttr("checked");
                for(var i=0;i<arVals.length;i++){
                	$("#"+id+">li>input[value="+arVals[i]+"]").attr("checked","checked");
                }
            }	
            else if(type == "richedit"){
                $("#"+id).setContent(val);
            }
            else if(type == "select"){
                $("#"+id).attr("sdata",val);
            }
            else
                $("#"+id).val( val );
        },
		
        setUCDatabyMem:function(formDef){
            if (formDef.funcInMemStr=="")
                return;
			
            var formMemVal=formDef.funcInMemStr.split($.F.options.DATA_SPLIT_STR);	
            var flds = formDef.formFields;
            for(var i=0;i<flds.length;i++){
                var f = flds[i];
                if (formMemVal[i]!=null)
                    $.UC.setData(formDef.funcno + "-" + f.fieldname,formMemVal[i]);
                else
                    $.UC.setData(formDef.funcno + "-" + f.fieldname,"");
            }
        },
        initFormData:function(funcno,wf_name,signunikey){ 
            var formDef = $.form.list[funcno];
            var flds = formDef.formFields;
            var afterBindSQLData = function(oneData){
            	if (typeof(oneData) == "undefined") {
            		
            		for(var i=0;i<flds.length;i++){
            			var f = flds[i];
            			$.form.setInputData("form"+funcno+"_"+f.id,f.inputtype,"",f.binding_data);
            		}
            		//alert("系统数据错误：没有找到数据。");
            	} 
                //如果是弹出form的话，先初始化传入的数据
                $.form.setUCDatabyMem(formDef);
                //第一步绑定变量数据 (自动加载上次变量值）
                if (formDef.binducval){
                    for(var i=0;i<flds.length;i++){
                        var f = flds[i];
                        if(f.initdata != "" ) {//typeof($.UC.userData[funcno+"-"+f.fieldname.toUpperCase()])=='undefined'
                            var val = $.userContext.parser(f.initdata);
							
                            if( val || (val==0) ){
                                if((val.length==1)&&(escape(val).match("%A0")))
                                    val = "";//空字符
                                $.form.setInputData("form"+funcno+"_"+f.id,f.inputtype,val,f.binding_data);
                            }
                        }else{
                            $.form.setInputData("form"+funcno+"_"+f.id,f.inputtype,
                                $.userContext.bindData("#" + funcno + "-" + f.fieldname + "#"),f.binding_data);
                        }	
                    };
                };
				
                //第二步 绑定sql数据
                if (typeof(oneData) != "undefined") {
                	for(var i=0;i<flds.length;i++){
                		var f = flds[i];
                		var fname = f.fieldname.split(".")[1].toUpperCase();
                		var val = oneData[fname];
                		if( typeof(val)!="undefined" ){
                			$.form.setInputData("form"+funcno+"_"+f.id,f.inputtype,val,f.binding_data);
                		}
                	}
                }
				
                $.form.setReadOnlyFields(funcno);
				
                // 上面第一次填写form上的数据。（原始数据）
                
                // 下面这句必须要有，否则在bindInputData是无法获取到最新更新的界面上的数据
                $.form.getDataToContext(funcno);  
                //第三步计算各字段值
                $.form.initUndefinedContext(funcno);
                var funcMap = $.form.list[funcno].funcMap;
                for(var i=0;i<flds.length;i++){
                    var f = flds[i];
                    $.form.bindInputData($("#form"+funcno+"_"+f.id),funcMap[f.fieldname],f.binding_data,false,false);
					
                };

                // 完成数据加载后要更新Context。第二次更新context。
                $.form.getDataToContext(funcno);

				// 下面这句是否可以不用了。所有undefined的应该在前面已经更新过了。
                //commened out by wyj
                //$.form.initUndefinedContext(funcno);
                
                if(typeof(formDef.complete) == "function")
                    formDef.complete(funcno);
                formDef.dataComp("form"+funcno);
                if(wf_name)
                    $.form.checkSign(funcno,wf_name,signunikey);

                $.form.resizeFormInputs("form"+funcno); 

                formDef.allComplete();
               
            }
            //initFormData开始
            var sql = formDef.bindSql;
            
            // 如果有超级查询的参数，则需要将sql中的参数按照名称进行替换(将相同核心的变量，替换为传来的变量。比如原来是  1234-p1.id，现在想传入 C-p1.id，则要进行替换)
            if (formDef.hqParams && formDef.hqParams != "") {  
        		var sql_seg = sql.split("#");

        		var paramList = formDef.hqParams.split(";");
            	for (var i = 0; i < paramList.length; i++) {
            		var param = paramList[i];
            		var param_core = param.replaceAll('#', '').split("-")[1];
            		for (var j = 1; j < sql_seg.length; j+=2) {  // 找sql语句中的变量
            			if (sql_seg[j].match(param_core))
            				sql_seg[j] = param.replaceAll('#', '');
            		}
            	}
            	sql = sql_seg.join("#");
            }
            
            if(sql && (sql != "")){
                $.getDataBySQL($.userContext.parser( sql ),afterBindSQLData);  // TODO: 用SQL直接获取数据。应改写。wyj
            }else{ 
                afterBindSQLData({});
            }
            
            
        },
        checkSign :function(funcno,wf_name,signunikey){
            if($.UC.parser(signunikey)){
                var sql = "select op_comment from sys_workflow_history t where wf_name = '"+wf_name+"' and uni_key = '"+signunikey+"'";
                $.C.getDatasFromDB($.UC.parser(sql),function(datas){
                    //将查出的历史批注构造成input填入form的html 
                    if(!datas)
                        return;
                    var commentDiv = "";
                    var names = "";
                    for(var i=0;i<datas.length;i++){
                        var id = "current_comment_"+i;
                        commentDiv += "<input type='hidden' id='"+id+"' name='"+id+"' value='"+datas[i].OP_COMMENT+"'/>";
                        names +=id+";";
                    }
                    id = "current_comment_"+i;//将本次批注记下来
                    names +=id;
                    $("#form"+funcno+"_extDiv").empty().append($(commentDiv));//将历史记录加载到extDiv中，以供盖章
                    $("#form"+funcno+"_extDiv").attr("cNames",names);
                    var formFields = $.F.list[funcno].formFields;
                    var formid = "form" + funcno;
                    for( var i = 0; i < formFields.length; i++ ){
                        var f = formFields[i];
                        var fid = formid + "_" + f.id;
                        if(f.id.split("-")[1]!="wf_comment"){
                            var fname = "formCurrent"+"_"+f.id;//将原本的form需盖章保护的字段更改name
                            $("#"+fid).attr("name",fname);
                        }else{
                            $("#"+fid).attr("name",id);
                        }
						
                    };
                    //显示签章
                    if($("#SignatureAPI").length<=0){
                        var str = '';
                        str += '<object id="SignatureAPI" width="0" height="0" classid="clsid:79F9A6F8-7DBE-4098-A040-E6E0C3CF2001" codebase=""iSignatureAPI.ocx#version=7,0,0,0"></object>';
                        $("body").append(str);
                    }
                    var documentID = wf_name + "_" + $.UC.parser(signunikey);
                    //$("#"+formid).attr("id","form_"+documentID);
                    var signature = document.getElementById("SignatureControl");
                    signature.ShowSignature(documentID);	
                });
            }
        },
        initUndefinedContext:function(funcno){
            var formData = $.form.getFormData(funcno);
            var formDef = $.form.list[funcno];
            var oriVal;
            if (formDef.funcInMemStr==""){
                $.each(formData,function(i){
                    oriVal=$.userContext.userData[i];
                    if (oriVal==undefined || oriVal==null)
                        $.userContext.userData[i]=formData[i];
                });
            }
        },
        getDataToContext:function( funcno ){
            var formData = $.form.getFormData(funcno);
            var formDef = $.form.list[funcno];
            var modified = false;
            if (formDef.funcInMemStr==""){
                $.each(formData,function(i){
                	if ($.userContext.userData[i] != formData[i]) {
                		$.userContext.userData[i]=formData[i];
                		modified = true;  // lhh hgcca 项目用况查询bug时，增加此项，以减少无用的刷新。
                		// 目前，大部分getDataToContext后，都有triggerby，但是很多情况下，context并未更改过。导致大量无用的triggerby。
                		// 增加此项作为返回值后，理论上，如果getDataToContext返回false，则不需要后续调用triggerby。 暂未列入bugzilla
                	}
                });
            }
            return modified;
        },
		
        setReadOnlyFields:function(funcno){
            var formDef = $.form.list[funcno];
            var flds = formDef.formFields;
            $.each(flds,function(i){
                var f = flds[i];
                if(f.readonly){
                    $.form.setInputReadOnly("form"+funcno+"_"+f.id,f.inputtype);
                    if (flds[i].hqFuncno > 0) { // 是超链接
                    	var $input = $("#form"+funcno+"_"+f.id);
                    	$input.css({
    						'text-decoration':'underline',
    						'color':'#0287CA',
    						'cursor':'pointer'
    					})
    					.click(function(){
                        	// 打开对话框 hyperquery
                        	var hyperparams = flds[i].hqParams.split("@"); // F@2804@#C-p2.id#
                        	// 目前只支持F
                        	$.F.openHyperQuery(funcno,hyperparams[0],flds[i].funcinmem,hyperparams[1],hyperparams[2]);

    					});
                    }
                }
            });
        },
        
        /**
         * 
         * @param srcFuncNo 源funcno （暂时未用）
         * @param funcType 目标窗体类型（目前只支持F）
         * @param funcinmem 沿用老的含义（但目前暂时无用，应该是为json版本预留的）
         * @param fno  目标窗口funcno。实际创建的时候会根据zIndex分配一个临时funcno
         * @param paramstr 目标窗口可能需要的参数。
         */
        openHyperQuery:function(srcFuncNo,funcType,funcinmem,fno, paramstr){
//            var funcinmemStr="";
//            if (funcinmem){
//                funcinmemStr=$("#"+id).val();
//                if (funcinmemStr=="")
//                    funcinmemStr=$.F.options.DATA_SPLIT_STR;
//            }
            var zIndex = $.page.hyperQueries.pushZindex();  // 找最新的一个超级查询层。该层号，既是zIndex，又是funcno
 
            var $funcDialog = $("#funcDialog"+ zIndex);  
            
            if($funcDialog.length>0){
            	$funcDialog.dialog("destory");
            	$funcDialog.remove();
            }
            $funcDialog = $("<div id='funcDialog"+zIndex+"'" 
            		+ " funcType='" + funcType + "' "
            		+ (funcType=='F'?"style='width:600px;height:400px'":"")
            		+ (funcType=='Q'?"style='width:auto;height:auto'":"")
            		+ " ></div>")
            		.appendTo($("body"));
                    
            //$.userContext.setData('0-currFunc',fno);
            $[funcType].runInstance(fno,{
            	target:"funcDialog"+zIndex,
            	zIndex: zIndex,
            	paramstr: paramstr,
            	allComplete:function(){
            		var funcDef=$[funcType].list[zIndex];
            		var dlgWidth=600,dlgHeight=400;
            		if (funcDef!=undefined){
            			dlgWidth=funcDef.width==undefined?600:funcDef.width;
            			dlgHeight=funcDef.height==undefined?400:funcDef.height;
            		}
            		$funcDialog.dialog({
            			title:"超级查询",
            			bgiframe: true,
            			modal: true,
            			resizable: false,
            			height:dlgHeight+170,
                        width:dlgWidth+30,
            			buttons: {
            				"关闭": function() {
            					$(this).dialog('close');
            					$(this).dialog("destroy");
            					hyperFuncno = $.page.hyperQueries.popZindex();
            					if (hyperFuncno > $.page.hyperQueries.initZindex)
            						$.F.list[hyperFuncno] = undefined;// 这句可能不需要。因为hq总要新建list entry，并且浏览器资源应该会自动回收吧？

            					//$.userContext.setData('0-currFunc',srcFuncNo);
            				}
            			}
            		});
            	}
//          	funcInMemStr:funcinmemStr
            });

        },

		
        setInputReadOnly:function(id,type){
            if(type == "img" || type == "file"){
                var $p = $("#"+id).parent(); // 是上一层的td
                $p.find(">object").remove(); // 相当于$("#"+id+"Uploader").remove(); 去掉了上传的flash
                $p.find(">ul>li>a").remove(); // img由于是异步加载，因此这个a可能还没建立
                $p.attr("imgreadonly", "true"); // 所以先把$p对象加一个只读标记
				
            }else if(type == "capturer")
                $("#"+id+">button").remove();
			
            else if(type == "camera")
                $("#"+id+">button").remove();
			
            else if(type == "uploadfile"){
                $("#"+id+"Uploader").remove(); //去掉上传flash
                $("#"+id).parent().find("ul>li>img").remove();// 去掉删除按钮
                $("#"+id).parent().attr("uploadfilero", "true");
            }
            else if(type == "bigdoc"){
                $("#"+id).find(">input").remove();
                var $span = $("#"+id).find(">span");
                var link = $span.attr("link");
                var name = $span.text();
                if(name && (name != "")){
                    $span.html("<a href='"+link+"' style='color:#336699'><span class='ui-icon ui-icon-tag' style='float:left'></span>"+name+"</a>");
                }
            }else if(type == "select"){
                $("#"+id).attr("disabled",true);
				
            }else if(type == "radio" || type=="checkgroup"){
                $("#"+id+">li>input").attr("disabled",true);
                $("#"+id+">li").css("color","gray");
            }            
            else 
                $("#"+id).attr("readonly",true).css("color","rgb(48,48,48)").css("background-color", "rgb(240,240,240)");
			
        },
		
        refresh:function(funcno, filter){
            $.form.setReadOnlyFields(funcno);
            $.form.initFormData(funcno);
        },
		
        resizeWin:function(funcno,left,top,width,height){
        //实际上是不能支持的，因为不好重新布局啊
        	var formid = "form" + funcno;
        	$.F.resizeFormInputs(formid);
        },
		
        refresh1:function(funcno, filter, winno, wf_name, signcode, signunikey){
            //var winid = "body_win"+winno;
            var formDef = $.form.list[funcno];
            //$.form.createNew( formDef,  winid );
            $.form.setReadOnlyFields(funcno);
            $.form.initFormData(funcno,wf_name,signunikey);
        },
		
        check:function(funcno){
            return $.form.validators[funcno].form();
        },
        
        trigFunc: function($input, func, multiVars) {  // 触发 “触发函数”func
        	if (func == "") 
        		return;
            var isImmediate = false; // 是否是立即更新了$input的值。对于ajax调用的情况，不是立即更新，因此不需要在本方法最后刷新其他界面。
            var immediateRefresh = function() {  
                if ($input.size()>0) {
                    if ($input[0].type.match(/select|checkbox|checkgroup|radio/))//再去驱动它影响的field
                        $input.change();
                    else if ($input[0].type.match(/text/))
                        $input.keyup();
                    else
                        $input.blur();
                }    
            };
            if(func.charAt(0) == '@'){
                $input.val(caculator.caculate($.userContext.parser(func.substring(1)),true));
                isImmediate = true;
                //return;
            }else if(func.charAt(0) == '%'){	//#调用js函数
                var data = eval('('+func.substr(1)+')');
                $input.val(data);
                isImmediate = true;
            }else if(func.charAt(0) == '#' ){    //# 调用java代码
                var obj = eval('('+func.substr(1)+')') ;
                var inputParams = obj.inputParams;
                isImmediate = false;
                $.ajax({
                    type:"POST",
                    url:$.form.options.callJavaURL,
                    data:{
                        inValues:obj.inValues,
                        inTypes:obj.inTypes,
                        className:obj.className,
                        methodName:obj.methodName
                    },
                    dataType:"text",
                    success:function(data){
                        $input.val(data);
                        immediateRefresh();
                    }
                });
				
            }else {
                var funcName = func.split(":")[0];
                var paramsStr = func.split(":")[1];
                var params = $.form.parseParamsToData( paramsStr ,multiVars );
                var funcStr = '{name:"'+funcName+'",params:'+params+'}';
                isImmediate = false;
                $.ajax({
                    type:"POST",
                    data:{
                        funcStr:funcStr
                    },
                    datatype:"text",
                    url:$.form.options.inputDataURL,
                    success:function( data ){
                        if(data == 'error'){
                            $input.val( "" );
                        }else if(data!="UNDEFINED"){
                        	if ($input.size() > 0 && !($input[0].type.match(/select/) && data == ""))  // 解决 Bug 156
                            $input.val( data );
                        }
                        
                        immediateRefresh();  // bug 170
                    },
                    error:function( e ){
                        $input.val( "" );
                    }
                });
            }
            if (isImmediate) {
            	immediateRefresh();
            }
//            if (isImmediate && $input.size()>0) {
//                if ($input[0].type.match(/select|checkbox|checkgroup|radio/))//再去驱动它影响的field
//                    $input.change();
//                else if ($input[0].type.match(/text/))
//                    $input.keyup();
//                else
//                    $input.blur();
//            }        	
        },
        
        bindInputData:function($input, func,bindingData,clearSelectUC,multiVars){
        	// 【input刷form】
        	// 原来的代码只对select, radio和checkgroup刷。但实际上text有时候也要刷。比如输入工号要跳出姓名。这时候必须在WF3中，允许给text bindInputData。
        	if ((func != "")||(  $input.size()>0&& typeof($input[0].type)!="undefined" && 
                (($input[0].type.match(/select/i)||
                		$input[0].tagName.match(/ul/i)&&$($input[0]).attr("radio")||  // BUG 323
                		$input[0].tagName.match(/ul/i)&&$($input[0]).attr("checkgroup"))
                		//$input[0].type.match(/checkgroup/i))// BUG 423
                	&&bindingData!=""))){
                //1.如果是下拉框绑定的话，重新加载数据
                var dflag = true;
                if ($input.size()>0&& $input[0].type.match(/select/i)&&bindingData!=""){
                    if (bindingData.charAt(0)=='@'){
                        $.form.appendSelectItembySql($input,bindingData.substring(1),clearSelectUC, func, multiVars);
                        dflag = false;  
                    }else{
                        $.form.initSelectorVal($input,clearSelectUC);
                        $input.change();
                    }
                    
                }
                //2.如果是radio，bindingData非@开头时在生成的时候已经做好了，现在只需要做@开头的情况。// BUG 323
                else if ($input.size()>0&& $input[0].tagName.match(/ul/i)&&$($input[0]).attr("radio")){
                	if (bindingData.charAt(0) == '@') {
                		var $radiobox = $($input[0]);
                		$.ajax({
                			type:"POST",
                			url:$.form.options.dataBindingURL,
                			data:{
                				sql:$.userContext.parser(bindingData.substr(1))
                			},
                			dataType:"text",
                			success:function(data,textStatus){
                				$radiobox.attr("innerHTML","");
                				if (data!=null && data!=""){  
                					$.F.bindRadioOptions(data, $radiobox);
                					// 设默认值
                					var val = $radiobox.attr("rdata");
                					var funcno = $radiobox.attr("funcno");
                					$radiobox.find(">li>input").removeAttr("checked");
                					$radiobox.find(">li>input[value="+val+"]").attr("checked",true);
                					$.F.getDataToContext(funcno);
                					$.page.triggerBy(funcno);
                				}
                			}	
                		});

                	}
                }
                //3.如果是check，bindingData非@开头时在生成的时候已经做好了，现在只需要做@开头的情况。// BUG 423
                else if ($input.size()>0&& $input[0].tagName.match(/ul/i)&&$($input[0]).attr("checkgroup")){
                	if (bindingData.charAt(0) == '@') {
                		var $checkgroup = $($input[0]);
                		$.ajax({
                			type:"POST",
                			url:$.form.options.dataBindingURL,
                			data:{
                				sql:$.userContext.parser(bindingData.substr(1))
                			},
                			dataType:"text",
                			success:function(data,textStatus){
                				$checkgroup.attr("innerHTML","");
                				if (data!=null && data!=""){  
                					$.F.bindCheckOptions(data, $checkgroup);
                					// 设默认值
                					var funcno = $checkgroup.attr("funcno");
            	            		var $checks = $checkgroup.find(">li>input");
                	            	$checks.removeAttr("checked");
                	            	var val = $checkgroup.attr("cdata");
                	            	if (val) {
                	            		var arVals = val.split(",");

                	            		$.each($checks, function(i) {
                	            			if (arVals.indexOf($checks[i].value) >= 0) {
                	            				$($checks[i]).attr("checked", true);
                	            			} 
                	            		});
                	            	}	
                	                $.F.getDataToContext(funcno);
                					$.page.triggerBy(funcno);
                				}
                			}	
                		});

                	}
                }                
                //  dflag 是一个古老的开关.... 
                if (dflag){  // 如果下俩框重新加载了数据，则完成加载数据后再trigFunc（在appendSelectItembySql中的ajax success中调用） 解决bug 140  by wyj
                	$.F.trigFunc($input, func, multiVars);
                }
            }
            //}

            $input.trigger("keyup");  // ???? 不同种类的控件 似乎应该出发不同的事件
        },
        getOptions : function(bindData){
            var options="";
            var kvs=bindData.split(";");
            for(var i=0;i<kvs.length;i++){
                var kv=kvs[i].split(":");
                options+="<option value=\""+kv[0]+"\">"+kv[1]+"</option>";
            }
            return options;
        },
        getOptionsDOM : function(bindData){  // bug 302 在IE8中用jquery的方法会有问题。
            var optionsDOM = {};
            var kvs=bindData.split(";");
            for(var i=0;i<kvs.length;i++){
                var kv=kvs[i].split(":");
                optionsDOM[i] = document.createElement("option");
                optionsDOM[i].text = kv[1];
                optionsDOM[i].value = kv[0];
            }
            return optionsDOM;
        },
        getUCnameByID:function(id){
            /*form222_cd-collegeid-->222-CD.COLLEGEID*/
            var ucname=id.substring(4);//222_cd-collegeid
            ucname=ucname.replace("-",".");//222_cd.collegeid
            ucname=ucname.replace("_","-");//222-cd.collegeid
            ucname=ucname.toUpperCase();//222-CD.COLLEGEID
            return ucname;
        },
        
        /*根据binding_Data的sql将数据绑定到selector上*/
        appendSelectItembySql:function(selector,sql,clearUC, func, multiVars){
            //1.先清空一下
            selector.attr("innerHTML","");
            selector.append("<option value=''>"+$.global.SEL_DEF_ITEM+"</option>");
            if (clearUC)
                $.userContext.setData($.form.getUCnameByID(selector[0].name),"")
            $.ajax({
                type:"POST",
                url:$.form.options.dataBindingURL,
                data:{
                    sql:$.userContext.parser(sql)
                },
                dataType:"text",
                success:function(data,textStatus){
                	// TODO: Bug 238 待测试
                    //每次进行ajax提交后，就清空，否则还会出现多次记录  // bug 238 把这句和下一句移到if前面来。但应该不是这个问题（因为之前已经设过了）
                    selector.attr("innerHTML","");
                    selector.append("<option value=''>"+$.global.SEL_DEF_ITEM+"</option>");
                    if (data!=null && data!=""){  // 当没数据的时候可能就不能添加SEL_DEF_ITEM 请选择 了  bug 238
                    	var optionsDOM = $.F.getOptionsDOM(data);  // bug 302 
                    	if (optionsDOM) {
                    		$.each(optionsDOM, function(i,n) {
                    			selector.get(0).options.add(n);
                    		})
                    	}
//                        selector.append($.F.getOptions(data));  // bug 302 改为调用getOptionsDOM方法，解决IE8和jquery的兼容问题（下拉框的options不刷新，导致联动效果出不来）
                        var sdata_ori = selector.attr("value");
                        $.F.initSelectorVal(selector,clearUC);
                        if (sdata_ori != selector.attr("value")) {  // bug 281 增加此句，如果有变化才调用change()否则不调用change()。循环刷新 无限刷新
                        	selector.change();
                        }
///////////解决 bug 140//////////////
                        $.F.trigFunc(selector, func, multiVars);                     
//////////////////////////////////                        
                    }
                }	
            });
        },
		
        // 
        // 联动是通过triglist来进行的。
        initSelectorVal:function(selector,clearUC){
            if(selector.attr("sdata")!=undefined&&!clearUC){
                selector.val(selector.attr("sdata"));
                selector.attr("value",selector.attr("sdata"));
                if (selector.attr("value") == "") {  // 说明没有值，则设置为 <请选择>空  // Bug 252
                	selector.val("-1");
                    selector.attr("value","");
                	$.userContext.setData($.form.getUCnameByID(selector[0].name), "-1");
                }
                else {
                	$.userContext.setData($.form.getUCnameByID(selector[0].name),selector.attr("sdata"));
                }
            }else{
                selector.val("-1");
                selector.attr("value","");
                $.userContext.setData($.form.getUCnameByID(selector[0].name),"-1")
            }
        },
		
        /*
		 * 将调用参数字符串转解析成命令字符串
		 * 参数字符串：#param1#;#param2#;#param3#...
		 * 转换后 [{name:n1,type:t1,value:val1},{...},...]
		 * * */
        parseParamsToData:function(paramsStr,multiVars){ 
            var params = (paramsStr+"").split(";");
			
            var len = params.length;
			
            var dataList="[";
			
            if(multiVars){
                for(var i=0;i<len;i++)
                    dataList += $.userContext.getDataForMultiVars(params[i])+(i<len-1?",":"");
            }else{
                for(var i=0;i<len;i++)
                    dataList += $.userContext.getData(params[i])+(i<len-1?",":"");
            }
			
			
            dataList += "]";
            return dataList;
        },
        openFunc:function(srcFuncNo,id,funcType,funcinmem,fno,dstr){
            var funcinmemStr="";
            if (funcinmem){
                funcinmemStr=$("#"+id).val();
                if (funcinmemStr=="")
                    funcinmemStr=$.F.options.DATA_SPLIT_STR;
            }
            var $funcDialog = $("#funcDialog"+fno);
            
            if($funcDialog.length>0){
            	$funcDialog.dialog("destory");

            }
            if($funcDialog.length>0&&!funcinmem){         
            	
            	$funcDialog.attr("targetInputID", id);
            	$funcDialog.dialog("open");
                $[funcType].refresh(fno,"");

            }else{	
            	var dialogWidth = Math.max(800, $.getBrowserWidth() / 2);
            	var dialogHeight = Math.max(250, $.getBodyHeight() / 2);
                if ($funcDialog.length==0) {
                    $funcDialog = $("<div id='funcDialog"+fno+"'" 
                        + " funcType='" + funcType + "' "
                        + (funcType=='T'?"style='width:" + dialogWidth + "px;height:" + dialogHeight + "px'":"")
                        + (funcType=='TW'?"style='width:" + (dialogWidth + Number(100)) + "px;height:" + dialogHeight + "px'":"")
                        + (funcType=='TC'?"style='width:" + dialogWidth + "px;height:" + dialogHeight + "px'":"")
                        + (funcType=='AT'?"style='width:" + dialogWidth + "px;height:" + dialogHeight + "px'":"")
                        + (funcType=='Q'?"style='width:" + dialogWidth + "px;height:" + dialogHeight + "px'":"")
                        + (funcType=='Z'?"style='width:" + dialogWidth + "px;height:" + dialogHeight + "px'":"")
                        + " dstr='"+dstr+"'></div>")
                    .appendTo($("body"));
                    $funcDialog.attr("targetInputID", id);
                    
                }
                $.userContext.setData('0-currFunc',fno);
                $[funcType].runInstance(fno,{
                    target:"funcDialog"+fno,
                    allComplete:function(){
                        $funcDialog.dialog({
                            title:"功能输入对话框",
                            bgiframe: true,
                            draggable: true,
                            modal: true,
                            resizable: false,
                            zIndex:10004,
                            height: dialogHeight+30, //funcType=='TW'?$funcDialog.find(">div").height()+170:$funcDialog.height()+170,
                            width: dialogWidth+30, //funcType=='TW'?$funcDialog.find(">div").width()+30:$funcDialog.width()+30,
                            buttons: {
                                "取消": function() {
                                    $(this).dialog('close');
                                    if (funcinmem)
                                        $(this).dialog("destroy");
												
                                    $.userContext.setData('0-currFunc',srcFuncNo);
                                },
                                "确定":function(){
                                    var dstr = $funcDialog.attr("dstr");
                                    var type = $funcDialog.attr("funcType");
                                    var targetInputID = $funcDialog.attr("targetInputID");
                                    if (funcinmem){ 
                                        $("#"+targetInputID).val($[type].genFuncDatainMem(fno));
                                    }else{
                                        if($[type].check(fno) ){
                                            $("#"+targetInputID).val( $.userContext.parser( dstr ) )
                                        }else{
                                            $("#"+targetInputID).val("");
                                        }
                                    }

                                    $.form.doEqualVar(srcFuncNo,fno);
                                    
                                    $("#"+targetInputID).focus();
                                    $("#"+targetInputID).blur();
                                    $("#"+targetInputID).change();
                                    $(this).dialog('close');
                                    if (funcinmem){
                                    	$(this).dialog("destroy");
                                    }
                                    $.userContext.setData('0-currFunc',srcFuncNo);
                                }
                            }
                        });
                        if (typeof($[funcType].resizeWin) == 'function') {
                        	$[funcType].resizeWin(fno, 0, 0,$funcDialog.width() - 8, $funcDialog.height() -8);//BUG 387  微调 5->8
                        }
                    },
                    funcInMemStr:funcinmemStr
                });
				
				
            }
        },
        genFuncDatainMem:function(funcno){
            var rltStr="";
            var formDef = $.form.list[funcno];
            var flds = formDef.formFields;
            for(var i=0;i<flds.length;i++){
                var f = flds[i];
                rltStr+=$("#form"+funcno+"_"+f.id).val()+$.F.options.DATA_SPLIT_STR;	
            }
            return rltStr;
        },
        doEqualVar:function(funcno,Dialogfno){//负责将Eqval的内容设置好
            var formDef = $.form.list[funcno];
            var formFields = formDef.formFields;
            //逐一替换标记字段
            for( var i = 0; i < formFields.length; i++ ){
                //获得字段定义细节
                var f = formFields[i];
                if (f.eqvar!=""){
                    if (f.eqvar.indexOf("#"+Dialogfno+"-")>-1){//如果是被影响的话
                        var val=$.userContext.bindData(f.eqvar);
                        $.UC.setData(formDef.funcno + "-" + f.fieldname,val) ;
                        $.form.setInputData("form"+funcno+"_"+f.id,f.inputtype,val,f.binding_data);
                    }
                }
            };
        }
    };
	
})(jQuery);