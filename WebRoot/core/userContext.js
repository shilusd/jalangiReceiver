;(function($){
	$.UC = $.userContext={
			userData: {},	//用户上下文数据
			dataType:{"MULTICOUNT":"NUMBER","TODAY":"DATE"},//上下文类型对照表
			setData:function(key,val){
				this.userData[key.toUpperCase()] = val+"";
			},
			
			setFuncRef:function(SrcFunc,DesFunc){
				var tmpSrcFunc=this.getFuncRef(SrcFunc);
				if (DesFunc!=tmpSrcFunc)
				    this.userData[("0-RefFunc"+DesFunc).toUpperCase()] = SrcFunc;
			},
			getFuncRef:function(DesFunc){
				return this.bindData("#0-RefFunc"+DesFunc+"#");
			},
			bindData:function(value){  /// 取变量的值
				if(typeof(value)!="string"){
					return;
				}
				if((value==null) ||value == "")
					return "";
				
				var initial = value.charAt(0);
				var len =  value.length;
				var index = len - 1;
				
				if(initial != "#"){
					return value;//非上下文 无需绑定
				}
				value = value.substring(1, index);
				
				//从用户上下文中绑定
				var val = this.userData[value.toUpperCase()];
				if(val){
					return val;
				}else{//未绑定到值
					//$.msgbox.show("err"," 程序员请注意：<br>未绑定到上下文  '" +value+"' <br>请检查字段名一致性!")
					return "";
				}
			},
			
			parser:function(str,highlight){
				str = this.parser2(str);
			
				return $.userContext.parser1(str,highlight);
			},
			
			parser1:function(str,highlight){
				if(!str)
					return "";
				
				var strBuf = str.split('#');
				var rltstr = "";
				for(var i=1; i<strBuf.length;i=i+2){
					//1.看看是否有统配的符号"*"
					var strHead=strBuf[i].charAt(0).toUpperCase();
					if (strHead=="C"||strHead=="P"){
					    strBuf[i]=this.parseWildcardStr(strBuf[i]);
					}else{
						strBuf[i] = this.bindData("#"+strBuf[i]+"#");
					}
					if(highlight){
						strBuf[i] ="<a style='color:blue'>"+ strBuf[i]+"</a>"
					}
				}
				for(var i=0; i<strBuf.length; i++){
					rltstr += strBuf[i];
				}
				
				return rltstr;
			},
			
			parser2:function(str){
				
				if(typeof str != "string")
					return false;
				
				var strBuf = str.split('!');
				var rltstr = "";
				for(var i=1; i<strBuf.length;i=i+2){
					var val = this.userData[strBuf[i]];
					// strBuf[i] = val?(val.replace(new RegExp('([\'])', 'g'),'\'\'')):"1=1";  // bug 269 但是这句话会影响普通的用法，因此先改回原来的
					strBuf[i] = val?val:"1=1";
				}
				
				for(var i=0; i<strBuf.length; i++){
					rltstr += strBuf[i];
				}
				
				return rltstr;
			},
			
			parser3:function(str){
				if(!str)
					return "";
				
				var strBuf = str.split('#');
				var rltstr = "";
				for(var i=1; i<strBuf.length;i=i+2){
					var val = this.userData[strBuf[i].toUpperCase()];
					if(val){
						strBuf[i] = val;
					}else{//未绑定到值
						strBuf[i] = '#'+strBuf[i]+'#';
					}
				}
				for(var i=0; i<strBuf.length; i++){
					rltstr += strBuf[i];
				}
				
				return rltstr;
			},
			
			getDataType:function(fieldName){
				if(typeof(fieldName)!="string"){
					return;
				}
				var type = this.dataType[fieldName.toUpperCase()];
				//$.msgbox.show("err","未获得"+fieldName+"字段类型");
				return type?type:"CHAR";
			},
			
			appendDataType:function(typeMap){
				$.each(typeMap,function(i){
					$.userContext.dataType[i.toUpperCase()] = typeMap[i]; 
				})
			}, 
			
			getData:function(param){
				var pre = param.match(/\d*-/)+"";
				var start = pre.length+1;
				var end = param.length-1;
				var name = param.substring(start,end);
				var type = this.getDataType(name);
				var value = this.bindData(param.toUpperCase())+"";
				return '{name:"'+name+'",value:"'
						+value.replace(new RegExp('(["\"])', 'g'),"\\\"")
							  .replace(/\n/g,"\\n")
						+'",type:"'+type+'"}';
				
			},
			
			getDataForMultiVars :function(param){
				var pre = param.match(/\d*-/)+"";
				var start = pre.length+1;
				var end = param.length-1;
				var name = param.substring(start,end);
				var names = name.split("_");
				var o_name = '';//原变量的名称
				for(var i=0;i<names.length-1;i++){
					o_name +=(names[i]+"_");
				}
				o_name = o_name.substring(0,o_name.length-1);
				var type = this.getDataType(o_name);
				var value = this.bindData(param.toUpperCase());
				return '{name:"'+name+'",value:"'
						+value.replace(new RegExp('(["\"])', 'g'),"\\\"")
							  .replace(/\n/g,"\\n")
						+'",type:"'+type+'"}';
			},
			getData2:function(param){
				var pre = param.match(/\d*-/)+"";
				var start = pre.length+1;
				var end = param.length-1;
				var name = param.substring(start,end);
				var type = this.getDataType(name);
				var value = this.bindData(param.toUpperCase());
				return '{name:"'+param+'",value:"'
						+value.replace(new RegExp('(["\"])', 'g'),"\\\"")
							  .replace(/\n/g,"\\n")
						+'",type:"'+type+'"}';
			},
			//("C"表示从当前窗口开始通配，"P"表示从前一个影响窗口开始通配)
			parseWildcardStr:function(varParse){//根据引用关系来生成通配funcno
				if ((varParse == "")||(varParse == null)) return ""; 
				var repFuncbyWildcard=function(funcno){
				    return funcno+varParse.substring(1,varParse.length);
				};
				var sWildcard=varParse.charAt(0).toUpperCase();
				var nowFuncno=this.bindData('#0-currFunc#');
				var findNodes={};
				var funcNoStr=repFuncbyWildcard(nowFuncno);
				var val = this.userData[funcNoStr.toUpperCase()];
				if(val&&sWildcard=="C"){
					return val;
				}else{
					findNodes[nowFuncno]=nowFuncno;
					var funcRef=this.getFuncRef(nowFuncno);
					while (funcRef!=null&&funcRef!=""){
						var preFuncNo=findNodes[funcRef];
						if (preFuncNo!=null&&preFuncNo!="")//说明形成了影响的环，跳出
							return "";
						funcNoStr=repFuncbyWildcard(funcRef);
					    val = this.userData[funcNoStr.toUpperCase()];
						if(val){
							return val;
						}else{
							findNodes[funcRef]=funcRef;
							funcRef=this.getFuncRef(funcRef);
						}
					}
					return "";
				}
			}
	}
})(jQuery);