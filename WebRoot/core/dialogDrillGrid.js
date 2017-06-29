;(function($){
    $.DG = $.dialogDrillGrid = {
    	op:{
    		dataUrl:"statistic_doDrillDialogStatistic.action",
    		dlgW:1200,
    		dlgH:680,
    		rowNum:40
    	},
    	CONST:{
    		IDX_FIELD_NAME	:0,
    		IDX_FIELD_DESP	:1,
    		IDX_FIELD_WIDTH	:2,
    		IDX_FIELD_ORD	:3,
    		IDX_FIELD_FORMAT:4,
    		SPLITER			:"$|$"
    	},
    	dialogGrid:function(drillField,postdata,drillLevel,title,secTexts){
    		var dGridDef={};
    		var dlgW=$.DG.op.dlgW-drillLevel*25;;
    		var dlgH=$.DG.op.dlgH-drillLevel*25;
    		var gridID=$.DG.idFuncs.getTableID(drillLevel);
    		var pagerID=$.DG.idFuncs.getPagerID(drillLevel);
    		
    		dGridDef.drillField	=drillField;
    		dGridDef.postdata	=postdata;
    		dGridDef.drillLevel	=drillLevel;
    		dGridDef.dlgW=dlgW;
    		dGridDef.dlgH=dlgH;
    		dGridDef.dlgTitle=title;
    		dGridDef.secTexts=secTexts;
    		
    		$screen=$("<div style='width:"+dlgW+"px;height:"+dlgH+"px;overflow:auto' id='"+$.DG.idFuncs.getDialogDivID(drillLevel)+"'>"
    				 +"	 <table  id='"+gridID+"' ></table>" 
    				 +"  <div id='"+pagerID+"'></div>"
    				 +"</div>")
				     .appendTo($("body"));
			if(!$.browser.mozilla)
				$screen.addClass("ui-state-active");
			
			$.DG.genGrid(gridID,pagerID,dGridDef);
			
			$screen.dialog({
				title:dGridDef.dlgTitle,
				bgiframe: true,
				modal: true,
				resizable: false,
				zIndex:1000,
				width:dlgW,
				height:dlgH,
				close:function(event, ui){
					$(this).remove();
				},
				buttons: {
					"返回": function() {
						$(this).dialog('close');
					}
				}
		    });
    	},
    	/***************************grid产生数据的代码**************************/
    	parseC_Param:function(str,drillLevel){
    		if (drillLevel==-1|| str.indexOf("#")==-1)
    			return str;
    		if (str.indexOf("#C-")!=-1)
    			str=str.replace(/#C-/g,"#"+drillLevel+"-");
    		else{
    			//var reg=new RegExp("#"+(drillLevel+1)+"_","g");
    			var reg=new RegExp("#"+(drillLevel+1)+"-","g");
    			str=str.replace(reg,"#"+drillLevel+"-");
    		}
    		str=$.userContext.parser(str,false,true);
    		return $.DG.parseC_Param(str,drillLevel-1);
    	},
    	
    	
    	/*sqlVar:{  "X_DEPART.DEPARTB=医学院":”#DBUSER#=cw_cqu2,#CWYEAR#=2012”,
    		   	 	"X_DEPART.DEPARTB=枫林校区":”#DBUSER#=cw_cqu1,#CWYEAR#=2011”,
    				"*": ”#DBUSER#=cw_cqu,#CWYEAR#=2011”}
    	*/    	
    	parseSqlVar:function(sql,dGridDef){
    		var dsql=sql,arVars,arKeyVal,matchedRepVals=undefined;
    		var arConds,matchCond,stdCond;
    		if (dGridDef.drillField.sqlVar!=undefined){
    			//1.先找到匹配的替换条件
    			$.each(dGridDef.drillField.sqlVar,function(cond){
    				//cond:"X_DEPART.DEPARTB=医学院;XXX=YYY"的形式
    				if (cond=="*")
    					return true;//continue
    				arConds=cond.split(";");//arConds是["X_DEPART.DEPARTB=医学院","XXX=YYY"]的数组
					matchCond=true;
					for(var idx=0;idx<arConds.length;idx++){
						arOneCond=arConds[idx].split('=');//arOneCond是["X_DEPART.DEPARTB","医学院"]的数组
						if (arOneCond.length!=2)
							continue;
						stdCond=arOneCond[0].trim().toUpperCase()+"="+arOneCond[1].trim();//stdCond是经过处理之后的"X_DEPART.DEPARTB=医学院"--去掉空格，并且upperCase
						//2.判断每个cond是否都在secTexts可以匹配上
    					if (dGridDef.secTexts.indexOf($.DG.CONST.SPLITER+stdCond+$.DG.CONST.SPLITER)==-1){
    						matchCond=false;
    						break;
    					}
					}
					if (matchCond){
						matchedRepVals=dGridDef.drillField.sqlVar[cond];//matchedRepVals是”#DBUSER#=cw_cqu2,#CWYEAR#=2012”的String
						return false;//跳出each
					}
    			});
    			if (matchedRepVals==undefined)
    				matchedRepVals=dGridDef.drillField.sqlVar["*"];
    			if (matchedRepVals!=undefined&&matchedRepVals!=""){	
	    			arVars=matchedRepVals.split(",");
					for(var i=0;i<arVars.length;i++){
						arKeyVal=arVars[i].split("=");
						var reg=new RegExp(arKeyVal[0]);
						dsql=dsql.replace(reg,arKeyVal[1]);
					}
    			}
    		}
    		return dsql;
    	},
    	genMatchExtSql:function(dGridDef){
    		var arConds;//array of 条件split(';')
    		var arOneCond;
    		var stdCond="";
    		var matchCond;
			//condsql和sql之间的关系:
    		//	(1)有sql，没有condsql:按照sql进行钻取
    		//	(2)有condsql,无sql:如果当前的选择条件在condsql没有匹配到的话，不进行钻取；否则，按照condsql中匹配到的进行钻取
    		//	(3)有sql,有condsql.: 如果当前的选择条件在condsql没有匹配到的话，按照sql；否则，按照condsql中匹配到的进行钻取
			var sql=dGridDef.drillField.sql;
			if (dGridDef.drillField.condsql!=undefined){
				$.each(dGridDef.drillField.condsql,function(i){
					//1.将json中的cond标准化一下,SEC1=XXX,防止当中写了空格什么的
					arConds=i.split(";");
					matchCond=true;
					for(var idx=0;idx<arConds.length;idx++){
						arOneCond=arConds[idx].split('=');
						if (arOneCond.length!=2)
							continue;
						stdCond=arOneCond[0].trim().toUpperCase()+"="+arOneCond[1].trim();
						//2.判断每个cond是否都在secTexts可以匹配上
    					if (dGridDef.secTexts.indexOf($.DG.CONST.SPLITER+stdCond+$.DG.CONST.SPLITER)==-1){
    						matchCond=false;
    						break;
    					}
					}
					if (matchCond){
						sql=dGridDef.drillField.condsql[i];
						return false;//跳出each
					}
				});
			}
			sql = sql.replace(/__x/g,"#");
			sql = sql.replace(/__q/g, "\"");
			sql =$.DG.parseC_Param(sql,dGridDef.drillLevel-1);
			sql = $.userContext.parser(sql,false,true);
			sql = $.DG.parseSqlVar(sql,dGridDef);
			return sql;
    	},
    	genPostData:function(dGridDef){
    		var result=dGridDef.postdata;
    		
    		result.sql="";
    		//生成EXT的sql
    		if (dGridDef.drillField.drillMode=="EXT"){
    			result.sql=$.DG.genMatchExtSql(dGridDef);
    		}
    		
			var arField;
			var strFields="",strOrder="",filterCond="",grpStrFields="",groupFields="";
			for(var i=0;i<dGridDef.drillField.subFieldMap.length;i++){
				if (dGridDef.drillField.subFieldMap[i]!=undefined && dGridDef.drillField.subFieldMap[i]!=null&&dGridDef.drillField.subFieldMap[i]!=""){
					arField=dGridDef.drillField.subFieldMap[i].split(",");
					strFields+=arField[$.DG.CONST.IDX_FIELD_NAME]+',';
					if (arField[$.DG.CONST.IDX_FIELD_ORD]!="NO")
						strOrder+=arField[$.DG.CONST.IDX_FIELD_NAME]+" "+arField[$.DG.CONST.IDX_FIELD_ORD]+",";
					if(dGridDef.drillField.filterZero=="Y"&&arField[$.DG.CONST.IDX_FIELD_FORMAT]=="F")//如果filterZero的话，就在所有类型为F的字段上拼上Fields<>0的条件
						filterCond+=" OR "+arField[$.DG.CONST.IDX_FIELD_NAME]+"<>0";
					if(arField[$.DG.CONST.IDX_FIELD_FORMAT]=="F"||arField[$.DG.CONST.IDX_FIELD_FORMAT]=="I")
						grpStrFields+='SUM('+arField[$.DG.CONST.IDX_FIELD_NAME]+'),';
					else{
						grpStrFields+=arField[$.DG.CONST.IDX_FIELD_NAME]+',';
						groupFields+=arField[$.DG.CONST.IDX_FIELD_NAME]+',';
					}
				}
    		}
			if (filterCond!=""){
				filterCond="("+filterCond.substring(4,filterCond.length)+")";//截掉AND
				if (result.joinCond!="")//这个if在正常情况下应该不可能为true的
					filterCond=" AND "+filterCond;
			}
			if (result.joinCond!=undefined)
				result.joinCond=result.joinCond.trim();
			result.joinCond+=filterCond;
			strFields=strFields.substring(0,strFields.length-1);
			grpStrFields=grpStrFields.substring(0,grpStrFields.length-1);
			groupFields=groupFields.substring(0,groupFields.length-1);
			strOrder=strOrder.substring(0,strOrder.length-1);
    		result.drillFields=strFields;
    		result.drillOrder=strOrder;
    		if (dGridDef.drillField.hint=="Y")
    			result.hint="Y"
    		else
    			result.hint="N";
    		
    		//加上group，采取偷懒的办法
    		if (dGridDef.drillField.drillMode=="INT"){//INT的话，看看groupField
    			if (dGridDef.drillField.groupField=="Y"){//意味着strFields,joinCond等都要发生变化
    				result.grpFields=grpStrFields;
    				result.grpCond=groupFields;
    				
    			}
    		}
    		
    		
    		return result;
    	},
    	genGrid:function(grid_id,pager_id,dGridDef){
		    var colNames=[],colModel=[],arField;
		    var sqlFields;
		    if (dGridDef.drillField.drillMode=='EXT'){
		    	sqlFields=$.DG.genMatchExtSql(dGridDef).toUpperCase().trim();
		    	sqlFields=sqlFields.substring(6,sqlFields.length);//去掉select
		    	sqlFields=sqlFields.split(" FROM ")[0];//截掉From之后的
		    }
		    for(var i=0;i<dGridDef.drillField.subFieldMap.length;i++){
		    	if (dGridDef.drillField.subFieldMap[i]!=undefined && dGridDef.drillField.subFieldMap[i]!=null&&dGridDef.drillField.subFieldMap[i]!=""){
			    	arField=dGridDef.drillField.subFieldMap[i].split(",");
			    	//如果是ext的模板类型的话，subFieldMap会是一个全集，那么就看看到底哪些field出现在sql中了，出现了的才加入colNames和colModel中
			    	if (dGridDef.drillField.drillMode=='EXT'){
			    		if (sqlFields.indexOf(arField[$.DG.CONST.IDX_FIELD_NAME])==-1)
			    			continue;
			    	}
			    		
			    	colModel.push({
	    				name:arField[$.DG.CONST.IDX_FIELD_NAME],
	    				index:arField[$.DG.CONST.IDX_FIELD_NAME],
	    				align:"left",
	    				resizable:true,
	    				sortable:true,
	    				width:arField[$.DG.CONST.IDX_FIELD_WIDTH],
	    				format:arField[$.DG.CONST.IDX_FIELD_FORMAT]
	    			});
			    	colNames.push(arField[$.DG.CONST.IDX_FIELD_DESP]);
		    	}
    		}
		    
		    //设置jqGrid属性开始了
		    var gridDef={}; 
			gridDef.url = $.DG.op.dataUrl;
			gridDef.pager = $("#"+$.DG.idFuncs.getPagerID(dGridDef.drillLevel));
			gridDef.rowNum =$.DG.op.rowNum;
			gridDef.width = dGridDef.dlgW-20;
			gridDef.height = dGridDef.dlgH-150;
			gridDef.rownumbers = true;
			gridDef.viewrecords = true;
			gridDef.pginput = true;
			gridDef.multiselect = false;
			gridDef.datatype = "json";
			gridDef.mtype = "POST";
			gridDef.colNames = colNames;
			gridDef.colModel= colModel;
			
			gridDef.onSelectRow = function(rowid){
				$.DG.getDataToContext(dGridDef.drillLevel,rowid);
			};
			gridDef.beforeRequest = function(){
				$("#"+grid_id).jqGrid("appendPostData",$.DG.genPostData(dGridDef));
			};
			gridDef.onSortCol = function(){
				$("#"+grid_id).jqGrid("removePostDataItem","ordStr");
			};
			
			gridDef.gridComplete =function(){
				var $tr=$("#"+grid_id+" tr");
				//1.做数字格式
				var $col
				for(var i=0;i<colModel.length;i++){
						if (colModel[i].format!=undefined){
						if (colModel[i].format.toUpperCase()=="F"){
							$col=$tr.find("td:eq("+(i+1)+")").css("text-align","right");
							$.each($col,function(iCell){
								$(this).attr($.ECOND.innerText(),$.formatNumber($(this).text()));
							});
						}else if (colModel[i].format.toUpperCase()=="I"){
							$tr.find("td:eq("+(i+1)+")").css("text-align","right");
						}
					}
				}
				//2.看看谁有drillsDef，继续做挖
				var $tds;
				var intDrill=$.UC.bindData("#0-USERINFO.INT_DRILL#"),extDrill=$.UC.bindData("#0-USERINFO.EXT_DRILL#");
				if (dGridDef.drillField.drillsDef!=undefined){
					$.each(dGridDef.drillField.drillsDef,function(fieldname){
						for(var i=0;i<colNames.length;i++){
							if (colNames[i]==fieldname){//在进一步的钻取中
								var drillField=dGridDef.drillField.drillsDef[fieldname];
								if ((drillField.drillMode=="INT"&&intDrill=="Y")||
									(drillField.drillMode=="EXT"&&extDrill=="Y")){
									$tr.find("td:eq("+(i+1)+")")//i+1是因为有行号列
		    								.css({'color':'blue','cursor':'pointer'})
		    								.click(function(){
		    									gridDef.onSelectRow($(this).parent().attr("id"));
		    									$.DG.dialogGrid(dGridDef.drillField.drillsDef[fieldname],dGridDef.postdata,dGridDef.drillLevel+1,
		    												dGridDef.dlgTitle+"---"+fieldname,dGridDef.secTexts);
		    						});
									break;
								}
							}
							
						}
					});
				}
			};
			//调用jqGrid生成
	     	$("#"+grid_id).jqGrid(gridDef);
		},
		getDataToContext:function(drillLevel,rowid){
			var rowdata = $("#"+$.DG.idFuncs.getTableID(drillLevel)).jqGrid('getRowData',rowid);
			$.each(rowdata,function(i){
				var val = rowdata[i];
				if(val.match(/<INPUT\s.*\/?>/)){
					val = $(val).val();
				}
				if(escape(val)=='%A0')
					val ='';
				$.userContext.userData[(drillLevel + "-" + i).toUpperCase()] = val;
			});
		},
		/***************************grid产生数据的代码*****END*********************/
    	idFuncs:{
    		getDialogDivID:function(drillLevel){
    			return "ddgrid_"+drillLevel;
    		},
    		getTableID:function(drillLevel){
    			return "ddgrid_table_"+drillLevel;
    		},
    		getPagerID:function(drillLevel){
    			return "ddg_pager_"+drillLevel;
    		}
    	}
    }
})(jQuery)