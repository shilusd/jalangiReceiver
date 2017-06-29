;(function($){
	$.exploreCond= $.ECOND = {
		//在page.js中为了winGroup的排版用到
		borderSpacing:function($target){
			if ($.browser.msie){
			    if ($target.css("border-style")=="solid")//ie8,jQuery.css无法读到boder-spacing!只能这样玩赖了
			    	return 1;
			    else
			    	return 0;
			}else
				return 0;
		},
		dialogTitleHeight:function(){
			if ($.browser.msie)
			    return 23;
			else if ($.browser.mozilla)
				return 26;
			else if ($.browser.safari)
				return 24;
			else 
				return 26;
		},
		dialogFooter:function(){
			if ($.browser.msie)
			    return 13;
			else if ($.browser.mozilla)
				return 14;
			else if ($.browser.safari)
				return 9;
			else 
				return 12;
		},
    	innerText:function(){
			if ($.browser.mozilla)
				return "textContent";
			else
				return "innerText";
		}
		
	}
	//本来这里有 $.getBrowserHeight 的定义，现在挪到common.js，和getBrowserWidth放在一起。
	encPicList=[];
	picture="";
})(jQuery);
