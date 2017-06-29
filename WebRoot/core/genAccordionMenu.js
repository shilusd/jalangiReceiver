jQuery(function(){
    //菜单json定义为；以后真正要传入的其实是第二层的title2开始
	/*{
		菜单名:{title:title1,
				ico:img1,
				subItems:[
					{
						title:title2,
						ico:img2,
						subItems:[
							{
								title:title3,
								ico:img3,
								click:function
							},
							{...}...
						]
					},
					{...}
					...
				  ]	
				}
		
	  }*/
	var allMenusJson={};
	
	$.getDataByNowTree=function(ulid){//先转成json
		allMenusJson={};
		var $ahref,ar;
		var level1btn;
		var firstTitle="",title,img,clickfunc2,clickfunc3;
		var menu1Item,menu2Item,menu3Item;
		var $li1s=$("."+ulid+">li");
		
		var $li2s,$li3s;//第二/三层的菜单
		var $level1a;
		for(var i=0;i<$li1s.size()-1;i++){
			$level1a=$($li1s[i]).find(">a");
			img=$level1a.attr("ico");
			title=$level1a.find(">span")[0].innerHTML;
			if (i==0)
				firstTitle=title;
			
			menu1Item={title:title,ico:img,subItems:[]};
			$li2s=$($li1s[i]).find(">div >ul >li");
			for(var j=0;j<$li2s.size();j++){
			    $ahref=$($li2s[j]).find(">a");
				title=$($li2s[j]).find(">a >span")[0].innerHTML;
				clickfunc2="";
				
		    	//ar=$ahref[0].outerHTML.split("onclick=\""); //FireFox不支持outerHTML属性
		    	ar=$li2s[j].innerHTML.split("onclick=\"");
		    	if (ar.length>1){
		    	    ar=ar[1].split("\">");
		    	    clickfunc2=ar[0];
		    	}
				img=$ahref.attr("ico");
				$li3s=$($li2s[j]).find(">div >ul li");
				clickfunc2=$li3s.size()==0?clickfunc2:"";
				menu2Item={title:title,ico:img,subItems:[],click:clickfunc2};
			    for(var k=0;k<$li3s.size();k++){
					$ahref=$($li3s[k]).find(">a");
					title=$($li3s[k]).find(">a >span")[0].innerHTML;
					clickfunc3="";
					//ar=$ahref[0].outerHTML.split("onclick=\""); //FireFox不支持outerHTML属性
					ar=$li3s[k].innerHTML.split("onclick=\"");
					if (ar.length>1){
						ar=ar[1].split("\">");
						clickfunc3=ar[0];
					}
					img=$ahref.attr("ico");
					menu2Item.subItems[menu2Item.subItems.length]={title:title,ico:img,click:clickfunc3};
				}
				menu1Item.subItems[menu1Item.subItems.length]=menu2Item;
			}
			allMenusJson[menu1Item.title]=menu1Item;
		}
	}
	$.genAccordionMenuByAllMenus=function(title,target){
		var treeJSON=allMenusJson[title];
		if (treeJSON!=undefined){
			var arTreeJSON=treeJSON.subItems;
			if (arTreeJSON!=undefined&&arTreeJSON.length>0) {
				$.genAccordionMenu(arTreeJSON,target, title);
			}
			else {
				$("#"+target).empty();
			}
		}
	}
	$.genAccordionMenu=function(arTreeJSON,target, title){  // BUG 322: title 为新加，为了让下层菜单知道自己从哪个顶层菜单而来。但因为涉及到菜单自动定位和展开等问题，暂时没做完。/// TODO: 还没做完。
		var $target=$("#"+target);
		$target.empty().css("overflow", "auto");
		var $ul=$("<ul class='accordion'></ul>");
		$target.append($ul);
		var strTree="",treeJSON,subTreeJSON;
		/*
			<li>
				<a>My Files<span>495</span></a>
				<ul class="sub-menu">
					<li><a href="#"><em>01</em>Dropbox<span>42</span></a></li>
					<li><a href="#"><em>02</em>Skydrive<span>87</span></a></li>
					...
				</ul>
			</li>
		*/
		for(var i=0;i<arTreeJSON.length;i++){
			treeJSON=arTreeJSON[i];
			strTree+="<li style='cursor:pointer' level1menu='" + title+ "' ico='"+treeJSON.ico+"' onclick=\""+treeJSON.click+"\">"
					+"<a>"+treeJSON.title+"</a>";
			if (treeJSON.subItems.length>0){
				strTree+="<ul class='sub-menu'>";
				for(var j=0;j<treeJSON.subItems.length;j++){
					subTreeJSON=treeJSON.subItems[j];
					strTree+="<li style='cursor:pointer' pmenu='" + treeJSON.title+ "' ico='"+subTreeJSON.ico+"' onclick=\""+subTreeJSON.click+"\">"
							+"<a><em>"+j+"</em>"+subTreeJSON.title+"</a>"
							+"</li>"
				}
				strTree+="</ul>";
			}
			strTree+="</li>";
		}
		$ul.append($(strTree));
		
		//生成菜单
		var accordion_head = $target.find('.accordion > li > a'),
			accordion_body = $target.find('.accordion li > .sub-menu');
		$(accordion_head[0]).addClass('active').next().slideDown('normal');
		accordion_head.click(function(event) {
			event.preventDefault();
			if ($(this).attr('class') != 'active'){
				accordion_body.slideUp('normal');
				$(this).next().stop(true,true).slideToggle('normal');
				accordion_head.removeClass('active');
				$(this).addClass('active');
			}
			else {
				accordion_body.slideUp('normal');
				$(this).removeClass('active');
			}
		});
	}
	$.genAccordionMenu2=function(){
		// Store variables
			
			var accordion_head = $('.accordion > li > a'),
				accordion_body = $('.accordion li > .sub-menu');

			// Open the first tab on load

			accordion_head.first().addClass('active').next().slideDown('normal');

			// Click function
			
			accordion_head.click(function(event) {

				// Disable header links
				
				event.preventDefault();

				// Show and hide the tabs on click

				if ($(this).attr('class') != 'active'){
					accordion_body.slideUp('normal');
					$(this).next().stop(true,true).slideToggle('normal');
					accordion_head.removeClass('active');
					$(this).addClass('active');
				}

			});
	}
});