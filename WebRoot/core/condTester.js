/**
 * 条件测试器，专门处理字符串形式的布尔运算
 * @author zyz
 * */
var condTester = {
		
		/*测试条件字符串*/
		test:function(condition){
			var f = "[function(){if("+condition+"){return true;}else{return false;}}]";
			try{
				var fn = eval(f)[0];
				alert(fn());
			}catch(e){
				alert("条件式:" + condition + " 中有错误")
			}
		},
		/*执行and or 条件字符串，并反回布尔运算值*/
		ifCondition2:function(condition){
			if(condition == "1=1"){
				return true;
			}
			var cond = this.escape(condition);
			var f = "[function(){if("+cond+"){return true;}else{return false;}}]";
			try{
				var fn = eval(f)[0];
				return fn();
			}catch(e){
				alert("条件式:" + condition + " 中有错误")
				return false;
			}
		},
		/*执行&& || 条件字符串，并反回布尔运算值*/
		ifCondition:function(condition){
			var f = "[function(){if("+condition+"){return true;}else{return false;}}]";
			try{
				var fn = eval(f)[0];
				return fn();
			}catch(e){
				alert("条件式:" + condition + " 中有错误")
				return false;
			}
		},
		/*将 and or 形式的布尔运算 转义成  && || 格式的通用布尔运算*/
		escape:function(condition){
			var cond = (condition + "").replace(/\s=\s/g, "==");
			cond = (cond + "").replace(/\sor\s/g, "||");
			cond = (cond + "").replace(/\sand\s/g, "&&");
			//cond = (cond + "").replace(/<>/g, "!=");
			return cond;
		}
};
var caculator = {
		caculate:function(exp,currency){
			if(exp=="")
				return "";
			var f = "[function(){return " + exp + "}]";
			try{
				var fn = eval(f)[0];
				if(currency){
					var val = fn()+"";
					if(val.match(/\./))
						val = val+"00";
					else{
						val = val+".00";
					}
					
					return (val.match(/\d+\.\d{2}/)+"")=="null"?val.substr(0,val.length-3):val.match(/\d+\.\d{2}/)+"";
				}else{
					return fn();
				}
			}catch(e){
				return '';
				//return false;
			}
		}
}