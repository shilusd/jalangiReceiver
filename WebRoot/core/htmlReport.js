;(function($){
    $.H = $.htmlReport = {
    	op:{
    		dataUrl:"HtmlReport_getData.action",
    		drillUrl:"HtmlReport_getDrillData.action",
    		hrParamURL:$.global.functionDefinitionUrl+"?type=H",
    		genReportXlsURL:"HtmlReport_genExcel.action",
    		indent:40
    	},
    	CONST:{
    		IDX_REF_REP_NAME:   3,
    		IDX_LEAF_NODE:		4,
    		IDX_LVL_NODE:		5,
    		IDX_IS_BASE:		6,
    		IDX_REF_REAL_VAL:	7,
    		IDX_REF_REP_ID:   	8,
    		
    		DIALOG_W:			1000,
    		DIALOG_H:			600
    	},
    	list:{},
    	drillLastRow:null,
    	runInstance:function(funcNo,options){
    		var op = $.extend({
    			realVals:"",
    			deptCode:"",
    			refresh:false,
    			complete:function(){},
    			allComplete:function(){},
    			noCond:true
				},options);
    		if( !$.htmlReport.list[funcNo] )
				$.ajax({
					url:$.htmlReport.op.hrParamURL,
					type:"POST",
					dataType:"json",
					data:{funcNo:funcNo+"$"+op.realVals+"$"+op.deptCode},
					success:function( data ){
						var hrDef = data[0];
						hrDef.showStyle=op.showStyle;
						hrDef.deptCode=op.deptCode;
						hrDef.target=options.target;
						hrDef.allComplete = op.allComplete;
						hrDef.noCond=op.noCond;
						hrDef.viewname=op.viewname;
						$.htmlReport.list[ funcNo ] = hrDef ;
						
						if (op.refresh||op.noCond)
							$.htmlReport.createNew( hrDef, options.target );
						else{
							if ((hrDef.refreshRIDCond!=""&& $.UC.parser(hrDef.refreshRIDCond)!="")  ||
								(hrDef.refreshDeptCond!=""&& $.UC.parser(hrDef.refreshDeptCond)!=""))
								$.H.refresh(funcNo,"");
							else
								$.htmlReport.createNew( hrDef, options.target );
						}
					},
					error:function(e,textStatus){
						$.msgbox.show( "err", e.responseText +":"+textStatus);
					}
				})
				else{
					var hrDef=$.htmlReport.list[ funcNo ];
					hrDef.showStyle=op.showStyle;
					hrDef.target=options.target;
					hrDef.noCond=op.noCond;
					hrDef.allComplete = op.allComplete;
					hrDef.viewname=op.viewname;
					if (op.noCond)
						$.H.createNew( hrDef, options.target );
					else
						$.H.refresh(funcNo,"");
				}
		},
		
		
		/*-----------------------------钻取相关的函数Begin---------------------------------------*/
		/*-----------------------------钻取中财务公式相关的钻取Begin---------------------------------------*/
		getSubjProj:function(formular){
			var idx=0;
			for(var i=0;i<4;i++){
				if ($.isNumber(formular.charAt(i))){
					idx=i;
					break;
				}
			}
			return formular.substring(idx,formular.length);
		},
		genCWMonthCond:function(fHead){
			var pre1C=fHead.charAt(0);
			var pre2C=fHead.substring(0,2);
			var mCond="0=1";
			if (pre1C=='A')
				mCond=" a.smonth=0";
			else if(pre1C=='B')
				mCond=" a.smonth=#M#";
			else if(pre1C=='C')
				mCond=" (a.smonth>0 and a.smonth<#M#)";
			else if(pre1C=='D')
				mCond=" a.smonth<=#M#";
			else if(pre1C=='H')
				mCond=" trunc((a.smonth+2)/3,0)=trunc((#M#+2)/3,0)";
			else if(pre2C=='FB')
				mCond=" a.smonth=#M#-1";
			else if(pre2C=='FC')
				mCond=" (a.smonth>0 and a.smonth<=#M#-1)";
			else if(pre2C=='FD')
				mCond=" a.smonth<=#M#-1";
			else if(pre2C=='GD')
				mCond=" trunc((a.smonth+2)/3,0)=trunc((#M#+2)/3,0)-1";
			else if(pre2C=='GH')
				mCond=" trunc((a.smonth+2)/3,0)=trunc((#M#+2)/3,0)-1";
			return mCond
		},
		genCWYearCond:function(fHead){
			var pre2C=fHead.substring(0,2);
			var yCond="#Y#";
			if (pre2C=='LA'||pre2C=='LC'||pre2C=='LD')
				yCond="#Y1#";
			return yCond;
		},
		commonRepSql:function(sql,formular,hrDef){
			var dsql=sql;
			//1.替换月份
			dsql=dsql.replace(/#MONTH#/g,$.H.genCWMonthCond(formular));
			dsql=dsql.replace(/#M#/g,hrDef.paramMap.month);
			//2.替换年份
			dsql=dsql.replace(/#YEAR#/g,$.H.genCWYearCond(formular));
			dsql=dsql.replace(/#Y#/g,hrDef.paramMap.year);
			dsql=dsql.replace(/#Y1#/g,(hrDef.paramMap.year-1));
			//3.替换财务用户
			dsql=dsql.replace(/#DBUSER#/g,hrDef.paramMap.dataUser);
			//4.替换科目
			dsql=dsql.replace(/#SUBJ#/g,$.H.getSubjProj(formular));
			return dsql;
		},
		dealSubjSql:function(formular,hrDef){
			var dsql=" select a.code,b.pathname,a.smonth,a.j_amount,a.d_amount "
				  +" from #DBUSER#.amt#YEAR# a,#DBUSER#.subj#YEAR# b"
				  +" where (b.code='#SUBJ#' or b.code like '#SUBJ#.%')"
				  +" and a.code=b.code and b.leaf='T'"
				  +" and #MONTH# ";
			
			dsql=$.H.commonRepSql(dsql,formular,hrDef);
			return dsql;
		},
		dealProjFP:function(formular,sql,hrDef){
			var field="",projcond="";
			//1.field的处理
			var c1=formular.charAt(0),c2=formular.charAt(1),jdDields="A.JAMT#M#";
			switch(c2){
				case "J":{
					jdDields="A.JAMT#M#";
				}break;
				case "D":{
					jdDields="A.DAMT#M#";
				}break;
				case "Y":{
					jdDields="A.JAMT#M#,A.DAMT#M#"
				}break;
				case "Z":{
					jdDields="A.JAMT#M#,A.DAMT#M#"
				}break;
			}
			switch (c1){
				case "A":{
					field="A.LASTYEAR";
				}break;
				case "B":{
					field=jdDields;
				}break;
				case "C":{
					for(var i=1;i<=hrDef.paramMap.month;i++){
						field+=jdDields.replace(/#M#/g,i);
						if (i!=hrDef.paramMap.month)
							field+=","
					}
				}break;
				case "D":{
					for(var i=1;i<=hrDef.paramMap.month;i++){
						field+=jdDields.replace(/#M#/g,i);
						if (i!=hrDef.paramMap.month)
							field+=","
					}
					field="A.LASTYEAR,"+field
				}break;
			}
			
			field=field.replace(/#M#/g,hrDef.paramMap.month);
			sql=sql.replace(/#FIELDS#/g,field);
			//2.cond的处理
			//1)如果   DY138;GB853的形式就是     c.code='XXX', 不包括通配符时；
			//2)如果   DY138;GB853%的形式就是     c.code like 'XXX%'
			//3)如果  DY138;%的形式，返回就直接是 "",不需要项目条件,返回1=1 
			//4)如果  DY138;&:A1234,B4567的话，就是  c.attr1='1234' and c.attr2='4567'的形式,
			var prjCond=formular.split(";")[1].trim();
			var pCond="";
			if (prjCond.charAt(0)=="&"){//4)
				var attrs=prjCond.split(":")[1].split(",");
				for(var i=0;i<attrs.length;i++){
					pCond+="attr"+(attrs[i].charCodeAt(0)-64)+"='"+attrs[i].substring(1,attrs[i].length)+"'";
					if (i!=attrs.length-1)
						pCond+=" and ";
				}
			}else if (prjCond.charAt(0)=="%")//3
				pCond="1=1";
			else if (prjCond.indexOf("%")!=-1)//2
				pCond="c.code like'"+prjCond+"'";
			else//1
				pCond="c.code='"+prjCond+"'";
			
			sql=sql.replace(/#PROJCOND#/g,pCond);
			
			return sql;
		},
		dealProjSql:function(formular,hrDef){
			var dsql=" select a.subj,b.pathname,a.prjcode,c.name,#FIELDS#"
				  +" from #DBUSER#.prjamount#YEAR# a,#DBUSER#.subj#YEAR# b,#DBUSER#.proj#YEAR# c"
				  +" where (b.code='#SUBJ#' or b.code like '#SUBJ#.%')"
				  +" and a.subj=b.code and b.leaf='T'"
				  +" and c.code=a.prjcode and #PROJCOND#";
				  +" and #MONTH# ";
			dsql=$.H.commonRepSql(dsql,formular.split(";")[0],hrDef);
			//处理#FIELDS#和#PROJCOND#
			return $.H.dealProjFP(formular,dsql,hrDef);
		},
		genDrillField:function(sql,subFieldMap,drillsDef){
			return {
				drillMode:"EXT",
				subFieldMap:subFieldMap,
				sql:sql,
				drillsDef:drillsDef
			}
		},
    	showCWFormular:function($tr,hrDef){
			//先吧年月等变量放入
			$.UC.setData("0-Y",hrDef.paramMap.year);
			$.UC.setData("0-M",hrDef.paramMap.year);
			$.UC.setData("0-S",hrDef.paramMap.unitCode);
			$.UC.setData("0-DB",hrDef.paramMap.dataUser);
			
    		var subj=$tr.find("td:eq(2)").attr("value");
    		var postdata,drillField,subFieldMap;
    		if (subj.indexOf(";")!=-1){//项目余额
    			sql=$.H.dealProjSql(subj,hrDef);
    			postdata={
        				sql:sql,
        				drillOrder:" a.subj"
        			};
    			subFieldMap=["SUBJ,科目,80,NO",
    			             "PATHNAME,科目名称,360,NO",
    			             "PRJCODE,项目号,40,NO",
    			             "NAME,项目名称,100,NO",
    			             "LASTYEAR,年初,80,NO,F",
    			             "JAMT1,1月借方数,80,NO,F",
    			             "DAMT1,1月贷方数,80,NO,F",
    			             "JAMT2,2月借方数,80,NO,F",
    			             "DAMT2,2月贷方数,80,NO,F",
    			             "JAMT3,3月借方数,80,NO,F",
    			             "DAMT3,3月贷方数,80,NO,F",
    			             "JAMT4,4月借方数,80,NO,F",
    			             "DAMT4,4月贷方数,80,NO,F",
    			             "JAMT5,5月借方数,80,NO,F",
    			             "DAMT5,5月贷方数,80,NO,F",
    			             "JAMT6,6月借方数,80,NO,F",
    			             "DAMT6,6月贷方数,80,NO,F",
    			             "JAMT7,7月借方数,80,NO,F",
    			             "DAMT7,7月贷方数,80,NO,F",
    			             "JAMT8,8月借方数,80,NO,F",
    			             "DAMT8,8月贷方数,80,NO,F",
    			             "JAMT9,9月借方数,80,NO,F",
    			             "DAMT9,9月贷方数,80,NO,F",
    			             "JAMT10,10月借方数,80,NO,F",
    			             "DAMT10,10月贷方数,80,NO,F",
    			             "JAMT11,11月借方数,80,NO,F",
    			             "DAMT11,11月贷方数,80,NO,F",
    			             "JAMT12,12月借方数,80,NO,F",
    			             "DAMT12,12月贷方数,80,NO,F"
    			             ];
    			
    			drillField=$.H.genDrillField(sql,subFieldMap,hrDef.projDrillsDef);
    			$.DG.dialogGrid(drillField,postdata,1,"项目钻取分析","");
    		}else{ 
    			var sql=$.H.dealSubjSql(subj,hrDef);
    			postdata={
        				sql:sql,
        				drillOrder:" a.code,a.smonth"
        			};
    			subFieldMap=["CODE,科目,80,NO",
    			             "PATHNAME,科目名称,360,NO",
    			             "SMONTH,月份,40,NO,I",
    			             "J_AMOUNT,借方数,100,NO,F",
    			             "D_AMOUNT,贷方数,100,NO,F"];
        			drillField=$.H.genDrillField(sql,subFieldMap,hrDef.subjDrillsDef);
        			$.DG.dialogGrid(drillField,postdata,1,"项目钻取分析","");
    		}
    	},
    	/*-----------------------------钻取中财务公式相关的钻取End---------------------------------------*/
		clickTr:function( $tr ){
    		if(this.drillLastRow)
    			this.drillLastRow.removeClass("ui-state-active");
    		$tr.addClass("ui-state-active");
    		this.drillLastRow = $tr;
    	},
    	tranTR:function(rowData){
    		var result="<tr value='"+rowData.rowvalue+"'>";
    		result+="<td class='fcell'><span class='ui-icon ui-icon-plus' style='float:left'></span>"+rowData.rowname+"</td>"
    		var arData=rowData.rowdata.split("$$$");
    		for(var i=0;i<arData.length;i++){
    			result+="<td class='cell' value='"+arData[i]+"'>"+arData[i]+"</td>";
    		}
    		result+="</tr>";
    		return result;
    	},
    	wrapRowData:function(rowData,hrDef){
    		var $tr = $($.H.tranTR(rowData));
    		//ref_cell_ID,ref_cell_name,Cell_value,BASE_FORMULA,IS_LEAF,drillLevel,IS_BASE
    		//把is_leaf放在attr里面，同时删除这个td
    		var $tdIsLeaf=$($tr.find("td")[$.H.CONST.IDX_LEAF_NODE]);
    		var $tdLvl=$($tr.find("td")[$.H.CONST.IDX_LVL_NODE]);
    		var $tdIsBase=$($tr.find("td")[$.H.CONST.IDX_IS_BASE]);
    		var $tdRefRealVal=$($tr.find("td")[$.H.CONST.IDX_REF_REAL_VAL]);
    		var $tdRefRepID=$($tr.find("td")[$.H.CONST.IDX_REF_REP_ID]);
    		
    		$tr.attr("IS_LEAF",$tdIsLeaf.text().trim()).attr("DRILL_LVL",$tdLvl.text().trim())
    		   .attr("IS_BASE",$tdIsBase.text().trim()).attr("REF_REAL_VAL",$tdRefRealVal.text().trim())
    		   .attr("REF_REP_ID",$tdRefRepID.text().trim());
    		$tdLvl.remove();
    		$tdIsLeaf.remove();
    		$tdIsBase.remove();
    		$tdRefRealVal.remove();
    		
    		//ref表的钻取显示
    		var $tdRefRepName=$($tr.find("td")[$.H.CONST.IDX_REF_REP_NAME]);
    		if ($tdRefRealVal.text().trim()=="*")
    			$tdRefRepName.attr($.ECOND.innerText(),"");
    		else{		
	    		if ($tdRefRepID.text().trim()!=""){
	    			$refRepName=$($tr.find("td")[$.H.CONST.IDX_REF_REP_NAME]);
	    			///$$$///if ($("#"+$.H.idFuncs.getRepDivID(hrDef.funcno)).length!=1){//只有当报表不存在的时候
		    			$refRepName.css({"color":"blue","cursor":"pointer"})
		    					.click(function(){
		    						var repID=$(this).parent().attr("REF_REP_ID");
		    						var repRealVals=$(this).parent().attr("REF_REAL_VAL");
		    						
		    						var winWidth=$("#main").width()-70,winHeight=$.getBrowserHeight()-100;
		    						var $dlgDiv=$("<div id='refDlg_"+hrDef.funcno+"' style='width:"+winWidth+"px;height:"+winHeight+"px;overflow:hidden'></div>").appendTo($("body"));
		    						$.H.runInstance(repID,{
										target:"refDlg_"+hrDef.funcno,
										realVals:repRealVals,
										noCond:true,
										allComplete:function(){
		    								$dlgDiv.dialog({
												title:"报表钻取:"+$tdRefRepName.text(),
												bgiframe: true,
												modal: true,
												resizable: false,
												zIndex:1001,
												width:winWidth+10,
												height:winHeight+82,
												buttons: {
													"返回": function() {
														$(this).dialog('close');
														$(this).dialog("destroy");
														$(this).remove();
													}
												}
										    });
									    }
		    						});
		    						
		    					});
	    			///$$$///}
	    		}
    		}
    		$tdRefRepID.remove();
    		isCWFormula=function(val){
    			if (val=="Y")
    				return true;
    			else
    				return false;
    		}
    		//财务的钻取
    		if (hrDef.ext_drill=="Y"&&$tr.attr("IS_LEAF")=="Y" && isCWFormula($tr.attr("IS_BASE"))){
    			$($tr.find("td:eq(1)"))
    				.click(function(){
    					$.H.showCWFormular($tr,hrDef);
    				})
    				.css({"color":"blue","cursor":"pointer"});
    		}
    		
    			
			return $tr;
    	},
    	
    	collapse:function($node){
			var id = $node.attr("id");
			
			var boot = $node.parent();
			boot.find(">tr:[parent^="+id+"]").hide();
			$node.find(">td:first>span").removeClass("ui-icon-minus").addClass("ui-icon-plus");
		},
		
		expand:function ($node){
			var id = $node.attr("id");
			var boot = $node.parent();
			boot.find(">tr:[parent="+id+"]").show();
			$node.find(">td:first>span").removeClass("ui-icon-plus").addClass("ui-icon-minus");
		
		},
    	toggleNode:function (hrDef,htmlCellID,$node){
			var $span = $node.find(">td:first>span");
			if($span.hasClass("ui-icon-minus"))
				return $.H.collapse($node);
			
			if( $span.hasClass("binded") )
				$.H.expand($node);
			else{
				var $screen = $.browser.msie && (parseFloat($.browser.version)>7)?
									$node.find(">td:first") : $node.parent().parent().parent().parent();
				$screen.block({message:"<p class='ui-state-active'>钻取数据...</p>",
						 overlayCSS:{backgroundColor: '#0F4569', opacity:0.6 }	
				});
				
				$.ajax({
					url:$.htmlReport.op.drillUrl,
					type:"POST",
					dataType:"json",
					data:{repid:hrDef.funcno,realvals:hrDef.realvals,
						  cellid:$node.attr("value"),
						  drilllvl:parseInt($node.attr("drill_lvl"))+1,
						  refRealVals:$node.attr("ref_real_val"),
						  rootCellID:htmlCellID
						  },
					success:function( data ){
						$.H.loadInitData(hrDef,htmlCellID,data,$node,false);
						$screen.unblock();
						$span.addClass("binded").removeClass("ui-icon-plus").addClass("ui-icon-minus");
					},
					error:function(e,textStatus){
						$screen.unblock();
						$.msgbox.show( "err", e.responseText +":"+textStatus);
						
					}
				});
				
				
			}
		},
		
		loadInitData:function(hrDef,htmlCellID,rows,$hostRow,isRoot){
			//1.加载数据
			var len = rows.length;
			var sum;
			var $insNode=$hostRow;
			var tid=$hostRow.attr("id");
			var left = parseInt( $hostRow.find(">td:first").css("padding-left").match(/\d+/) ) + $.H.op.indent;
			var parentID;
			var $firstRow;
			if (isRoot)
				sum = new Array()
				
			for( var i=0; i<len; i++){
				if(!rows[i]) break;//for ie bug
				
				parentID="none";
				if (!isRoot)
					parentID=tid;
				$tr = $.H.wrapRowData(rows[i],hrDef)
				       .attr("id",tid+"_"+i)
					   .attr("parent",parentID)
					   .click(function(){
								$.H.clickTr( $(this) );
							})
				if (i==0)
					$firstRow=$tr;
				
				$tr.insertAfter($insNode);
				$insNode=$tr;
				if (isRoot){
					for(var j=1;j<$tr.find('td').size();j++){
						if (sum[j]==undefined)
							sum[j]=0;
						val=$($tr.find('td')[j]).attr('value').replace(/,/g,"");
						if (val==""||val=="null")
							continue;
							
						if ($.isInteger(val))
							sum[j]+=parseInt(val)
						else
							sum[j]+=parseFloat(val);
					}
				}
					
				var $ftd = $tr.find(">td:first");
				if (!isRoot)
					$ftd.css( "padding-left",left+"px" );
				
				if($tr.attr("IS_LEAF")=="Y")
					$ftd.css("cursor","default")
					.find(">span").removeClass("ui-icon-plus").addClass("ui-icon-bullet");
				else
					$ftd.click(function(){
						$.H.toggleNode(hrDef,htmlCellID,$(this).parent());
					})
			}
			if (isRoot){
				//2.插入汇总列
				if ($firstRow!=undefined){
					trSum="<tr value='000' id='_sum' parent='none'>"
					     +"<td class='fcell'>" 
					     +"<span class='ui-icon ui-icon-calculator' style='float:left'></span>"
					     +"总计</td>";
					
					for(var j=1;j<sum.length;j++){
						if ($.isNumber(String(sum[j]).split(".")[0]))
							trSum+="<td class='cell' value='"+sum[j]+"'>"+$.formatNumberToShow(sum[j])+"</td>";
						else
							trSum+="<td class='cell' value=''></td>";
					}
					trSum+="</tr>";
					
					$(trSum).insertBefore($firstRow);
				}
				sum=null;
			}
		},
		transCellID:function(cellid){
			//a-A8==>A8
			var arCell=cellid.split("-");
			return arCell[1];
		},
		dialogCellRef:function(cellid,hrDef){
			var htmlCellID=$.H.transCellID(cellid);
			var dlgid="dialogCRef_"+hrDef.funcno;
			if ($("#"+dlgid).length!=0)
				$("#"+dlgid).remove();
			
			$screen=$("<div style='width:"+$.H.CONST.DIALOG_W+"px;height:"+($.H.CONST.DIALOG_H-100)+"px;overflow:auto'></div>").attr("id",dlgid)
				     .appendTo( $("body") );
			if(!$.browser.mozilla)
				$screen.addClass("ui-state-active");
			var $table = $("<table cellspacing='0'>"
						 + "	<thead class='drillTableHead'></thead>"  
						 + "</table>")
							.appendTo( $screen );
			var $tbody = $("<tbody class='drillTable'></tbody>").appendTo($table);
			var $tr=$("<tr id='th'"+hrDef.funcno+">"
    				+" <td style='width:320px;text-align:right;'><span class='ui-icon ui-icon-calculator' style='float:right'></span><span style='float:right'>&nbsp;&nbsp;统计项</span></td>"
    				+" <td style='padding-right:5px;width:160px;text-align:center;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;统计值</td>" 
    				+" <td style='padding-right:5px;width:160px;text-align:center;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;基本项公式</td>"
    				+" <td style='padding-right:5px;width:160px;text-align:center;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;引用报表</td>"
    				+"</tr>");
    		$tr.appendTo($tbody);
    		
			$screen.block({message:"<p class='ui-state-active'>正在获取数据,请稍等...</p>",
				 overlayCSS:{backgroundColor: '#0F4569', opacity:0.6 }	
			});
			$.ajax({
				url:$.htmlReport.op.drillUrl,
				type:"POST",
				dataType:"json",
				data:{	repid:hrDef.funcno,
						realvals:hrDef.realvals,
						cellid:htmlCellID,
						drilllvl:2,
						refRealVals:"",
						rootCellID:htmlCellID},
				success:function( data ){
					$.H.loadInitData(hrDef,htmlCellID,data,$tr,true);
					$screen.dialog({
						title:"数据钻取分析",
						bgiframe: true,
						modal: true,
						resizable: false,
						zIndex:1000,
						height:$.H.CONST.DIALOG_H,
						width:$.H.CONST.DIALOG_W,
						close:function(event, ui){
							$(this).remove();
						},
						buttons: {
							"返回": function() {
								$(this).dialog('close');
							}
						}
				    });
					$screen.unblock();
				},
				error:function(e,textStatus){
					$screen.unblock();
					$.msgbox.show( "err", e.responseText +":"+textStatus);
					
				}
			});
			
			
		},
		/*-----------------------------钻取相关的函数End---------------------------------------*/
		
		
		resizeWin:function(funcno,left,top,width,height){
			var repDivID=$.H.idFuncs.getRepDivID(funcno);
			$("#"+repDivID).parent().width(width).height(height);
			$("#"+repDivID).width(width-4).height(height-38);
		},
		dialogCloseFunc:function(funcno){
			var hrDef=$.H.list[funcno];
			if (hrDef==undefined){
				$.each($.H.list,function(i){
					if ($.H.list[i].winFuncno==funcno || $.H.list[i].funcno==funcno){
						hrDef=$.H.list[i];
						return false;
					}
				});
			}
			hrDef.inDialog=false
			$("#max"+funcno).css("visibility","visible");
		},
		refresh:function(funcno, filter){
			var hrDef=$.H.list[funcno];
			if (hrDef==undefined){
				$.each($.H.list,function(i){
					if ($.H.list[i].winFuncno==funcno || $.H.list[i].funcno==funcno){
						hrDef=$.H.list[i];
						return false;
					}
				});
			}
			
			
			var target=hrDef.target;
			if (hrDef.refreshRIDCond!=""){
				var refreshFuncno=$.UC.parser( hrDef.refreshRIDCond );
				delete $.H.list[funcno];
				delete $.H.list[refreshFuncno];
				$.H.runInstance(refreshFuncno,{target:target,refresh:true});
			}else if (hrDef.refreshDeptCond!=""){
				var deptCode=$.UC.parser( hrDef.refreshDeptCond )
				delete $.H.list[funcno];
				$.H.runInstance(funcno,{target:target,deptCode:deptCode,refresh:true});
			}else{
				$.H.createNew(hrDef,target);
			}
		},
		showHisReports:function(hrDef){
			//body
			var grid_id="repHis_"+hrDef.funcno,pagerID="repHis_pager_"+hrDef.funcno;
			var dlgW=502,dlgH=602;
			$screen=$("<div style='width:"+dlgW+"px;height:"+dlgH+"px;overflow:auto' id='"+grid_id+"_body'>"
					 +"	 <table  id='"+grid_id+"'></table>" 
					 +"  <div id='"+pagerID+"'></div>"
   				 	 +"</div>")
				     .appendTo($("body"));
			if(!$.browser.mozilla)
				$screen.addClass("ui-state-active");
			
			
			//grid设置
			var gridDef = {};
			gridDef.url = "commonQuery_doQuery.action?funcno=0";
			gridDef.rowNum = 20;
			gridDef.height = dlgH-156;
			gridDef.width = dlgW-28;
			gridDef.sortname = "create_date";
			gridDef.sortorder = "desc";
			gridDef.rownumbers = true;
			gridDef.viewrecords = true;
			gridDef.pginput = true;
			gridDef.multiselect = false;
			gridDef.datatype = "json";
			gridDef.mtype = "POST";
			gridDef.colNames = [ "报表名","单位名称", "发布时间","发布编号" ];
			gridDef.colModel = [ {
				name : "INSTANCE_NAME",
				index : "INSTANCE_NAME",
				width : 200,
				resizable : true,
				align : "left"
			}, {
				name : "UNITNAME",
				index : "UNITNAME",
				width : 200,
				resizable : true,
				align : "left"
			}, {
				name : "PUBDATE",
				index : "PUBDATE",
				width : 100,
				resizable : true,
				align : "left"
			}, {
				name : "REAL_VALUES",
				index : "REAL_VALUES",
				width : 10,
				resizable : false,
				align : "left"
			} ];
			gridDef.pager = $("#"+pagerID);
			var deptCond="";
			if (hrDef.deptCode!="")
				deptCond=" and unitcode='"+hrDef.deptCode+"'"
			gridDef.beforeRequest = function() {
				$("#" + grid_id)
						.jqGrid("appendPostData",
								{
									prjfields : "instance_name,unitName,trim(reportyear)||'-'||trim(reportmonth)||'-'||trim(reportday) as pubDate,real_values",
									tablenames : "report_instance_sum",
									joinconditions : "uni_report_id='"+hrDef.funcno+"'"+deptCond
								});
			}
			gridDef.gridComplete = function() {
				$("#" + grid_id).hideCol("REAL_VALUES");
			}
			var hisLastRow;
			gridDef.onSelectRow = function(rowid){
				hisLastRow = rowid;
			};
			$("#" + grid_id).jqGrid(gridDef);
			
			$screen.dialog({
				title:"报表发布历史查看",
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
					},
					"选定":function(){
						var funcno=hrDef.funcno;
						var target=hrDef.target;
						var realVals=$("#"+grid_id).jqGrid('getRowData',hisLastRow).REAL_VALUES;
						delete $.H.list[hrDef.funcno];
						$.H.runInstance(funcno,{target:target,realVals:realVals});
						$(this).dialog('close');
					}
					
				}
		    });
			
		},
		createNew:function( hrDef, target ){
			$("#"+target).empty();
			var roleid=$.UC.bindData("#0-USERINFO.USERROLE#")
			$.E.getRoleTplDrillOps(roleid,hrDef.funcno,$.H.callbackCreateNew,hrDef,target);
		},
		callbackCreateNew:function(hrDef,target){
			hrDef.int_drill=$.UC.bindData("#0-USERINFO.INT_DRILL#");
			hrDef.ext_drill=$.UC.bindData("#0-USERINFO.EXT_DRILL#");
			hrDef.exp_xls=$.UC.bindData("#0-USERINFO.EXP_XLS#");
			/*if (((hrDef.refreshRIDCond!=""&& $.UC.parser(hrDef.refreshRIDCond)=="")  ||
				(hrDef.refreshDeptCond!=""&& $.UC.parser(hrDef.refreshDeptCond)==""))&&!hrDef.noCond)
				return false;*////$$$///
			if (hrDef.showStyle==undefined){
				if (hrDef.defaultChart)
					hrDef.showStyle="ssChart";
				else
					hrDef.showStyle="ssReport";
			}
			maxBtnVisible=function(){
				if (hrDef.inDialog)
					return "hidden";
				else
					return "visible";
			}
			hrDef.target=target;
			var tWidth=$("#"+target).width()-4;
			var tHeight=$("#"+target).height()-27;
				
			if (hrDef.showStyle=="ssReport"){//report的形式
				$screen=$("#"+target);
				$screen.block({message:"<p class='ui-state-active'>正在获取报表数据...</p>",
					 overlayCSS:{backgroundColor: '#0F4569', opacity:0.6 }	
				});
				$.ajax({
					url:$.htmlReport.op.dataUrl,
					type:"POST",
					dataType:"html",
					data:{funcno:hrDef.funcno,realvals:hrDef.realvals},
					success:function( data ){
						var repDivID=$.H.idFuncs.getRepDivID(hrDef.funcno);
						var liExpXls="";
						if (hrDef.exp_xls=="Y")
							liExpXls="<li class='htmlMI ui-state-default ui-corner-all' id='expRepExcel"+hrDef.funcno+"'><span class='ui-icon ui-icon-calculator' style='float:left'></li>";
						//1.插入数据表格的html返回
						var $rep=$( "<div class='ui-state-default' style='height:18px'>"
							   +"<ul>"	
							   +"<li class='htmlMI ui-state-default ui-corner-all' id='showChart"+hrDef.funcno+"'><span class='ui-icon ui-icon-transferthick-e-w' style='float:left'></span></li>"
							   +liExpXls
							   +"<li class='htmlMI ui-state-default ui-corner-all' id='xlsHis"+hrDef.funcno+"'><span class='ui-icon ui-icon-search' style='float:left'></li>"
							   +"<li class='htmlMI ui-state-default ui-corner-all maxWin' style='visibility:"+maxBtnVisible()+"' id='max"+hrDef.funcno+"'><span class='ui-icon ui-icon-newwin' style='float:left'></li>"
							   +"</ul>"
							   +"<div style='padding-top:3px;text-align: center'>"+hrDef.reportName+"</div>"
							   +"</div>"
							   +"<div id='"+repDivID+"' style='overflow:auto;width:"+tWidth+"px;height:"+tHeight+"px'></div>")
							  
						$("#"+target).append($rep);
						$(".htmlMI").css({"float":"left","list-style-type":"none"})
									.hover(
											function() { $(this).addClass('ui-state-hover'); },
											function() { $(this).removeClass('ui-state-hover'); }
										);
						$(".maxWin").css({"float":"right"})
						$("#"+repDivID).append(data);
						
						if (hrDef.exp_xls=="Y")
							$.addHint($("#expRepExcel"+hrDef.funcno),"导出Excel");
						$.addHint($("#xlsHis"+hrDef.funcno),"历史报表查看");
						$.addHint($("#showChart"+hrDef.funcno),"切换图表显示");
						$.addHint($(".maxWin"),"最大化窗口");
						
						
						//2.对数据进行替换
						/*var oneValue,cellid,pos;
						for(var i=0;i<hrDef.cellValues.length;i++){
							oneValue=hrDef.cellValues[i];
							cellid="a-"+oneValue.cellid;
							$("#"+repDivID).find("#"+cellid).attr($.ECOND.innerText(),oneValue.cellvalue);
						}
						*/
						var drills=$("#"+target).find(".drill");
						drills.css({"color":"blue","cursor":"pointer"})
	                          .click(function(){
	                        	  $.H.dialogCellRef($(this).attr("id"),hrDef)
	                          });
						$("#expRepExcel"+hrDef.funcno).click(function(){
							var fillData="";
							$.each(drills,function(i){
								fillData+=$(drills[i]).attr("id")+'$-$'+drills[i].text+'$$';
							});
							var values=$("#"+target).find(".values");
							$.each(values,function(i){
								fillData+=$(values[i]).attr("id")+'$-$'+values[i].text+'$$';
							});
							window.open($.htmlReport.op.genReportXlsURL+"?funcno="+hrDef.funcno+"&realvals="+hrDef.realvals)
						});
						$("#xlsHis"+hrDef.funcno).click(function(){
							$.H.showHisReports(hrDef);
						});
						$("#showChart"+hrDef.funcno).click(function(){
							$("#"+target).empty();
							hrDef.showStyle="ssChart";
							$.H.createNew(hrDef,target);
						});
						
						var maxW=$("#main").width()-40,maxH=$.getBrowserHeight()-28;
						$("#max"+hrDef.funcno).click(
							function(){
								hrDef.inDialog=true;
								$.dialogContent(hrDef.funcno,$("#"+target),$("#"+target).parent(),$.H.resizeWin,$.H.dialogCloseFunc);
								$(this).css("visibility","hidden");
							});
						$screen.unblock();
					},
					error:function(e,textStatus){
						$screen.unblock();
						$.msgbox.show( "err", e.responseText +":"+textStatus);
					}
				});
			}else{//以图的形式展示
				var chartTarget=$.H.idFuncs.getRepDivID(hrDef.funcno);
				
				$rep=$( "<div class='ui-state-default' style='height:18px'>"
						   +"<ul>"	
						   +"<li class='htmlMI ui-state-default ui-corner-all' id='showHtml"+hrDef.funcno+"'><span class='ui-icon ui-icon-transferthick-e-w' style='float:left'></span></li>"
						   +"<li class='htmlMI ui-state-default ui-corner-all' id='xlsHis"+hrDef.funcno+"'><span class='ui-icon ui-icon-search' style='float:left'></li>"
						   +"<li class='htmlMI ui-state-default ui-corner-all maxWin' style='visibility:"+maxBtnVisible()+"' id='max"+hrDef.funcno+"'><span class='ui-icon ui-icon-newwin' style='float:left'></li>"
						   +"</ul>"
						   +"<div style='padding-top:3px;text-align: center'>"+hrDef.reportName+"</div>"
						   +"</div>"
						   +"<div id='"+chartTarget+"' style='overflow:auto;width:"+tWidth+"px;height:"+tHeight+"px'></div>");
						  
				$("#"+target).append($rep);
				$(".htmlMI").css({"float":"left","list-style-type":"none"})
							.hover(
									function() { $(this).addClass('ui-state-hover'); },
									function() { $(this).removeClass('ui-state-hover'); }
								);
				$(".maxWin").css({"float":"right"})
				
				$.addHint($("#xlsHis"+hrDef.funcno),"历史图表查看");
				$.addHint($("#showHtml"+hrDef.funcno),"切换报表显示");
				$.addHint($(".maxWin"),"最大化窗口");
				$("#xlsHis"+hrDef.funcno).click(function(){
					$.H.showHisReports(hrDef);
				});
				//1.替换chartXml中的变量
				var oneValue;
				var chartXml=hrDef.chartXml;
				for(var i=0;i<hrDef.cellValues.length;i++){
					oneValue=hrDef.cellValues[i];
					chartXml=chartXml.replace("("+oneValue.xlscellid+")",oneValue.cellvalue);
				}
				
				//2.显示chart
				if (hrDef.chartType=="S"){
					ChartAdapter.createSChart(chartTarget,hrDef.chartName ,chartXml);
				}else if (hrDef.chartType=="M"){
					ChartAdapter.createMChart(chartTarget,hrDef.chartName ,chartXml);
				}else if (hrDef.chartType=="W"){
					ChartAdapter.createWChart(chartTarget,hrDef.chartName ,chartXml);
				}
				$("#showHtml"+hrDef.funcno).click(function(){
					$("#"+target).empty();
					hrDef.showStyle="ssReport";
					$.H.createNew(hrDef,target);
				});
				
				var maxW=$("#main").width()-40,maxH=$.getBrowserHeight()-28;
				$("#max"+hrDef.funcno).click(function(){
					hrDef.inDialog=true;
					$.dialogContent(hrDef.funcno,$("#"+target),$("#"+target).parent(),$.H.resizeWin,$.H.dialogCloseFunc);
					$(this).css("visibility","hidden");
				});
			}//end of else
			hrDef.allComplete();
			if(typeof(hrDef.complete) == "function")
				hrDef.complete();
		},//end of createNew
		idFuncs:{
			getRepDivID:function(funcno){
				return "rep_body_"+funcno;
			}
		}
    }
})(jQuery)