;
(function($){
    $.D3 = {
        options:{
            d3ParamURL:$.global.functionDefinitionUrl+"?type=D3"
        },
		 
        list:{},
        runInstance: function( funcNo,options ){
            var op = $.extend({
                complete:function(){},
                allComplete:function(){},
                target:"main",
                funcInMemStr:""
            },options);
            if(this.list[ funcNo ] == null){
                $.ajax({
                    type: "POST",
                    url:  $.D3.options.d3ParamURL,
                    data: {
                        funcNo:funcNo
                    },
                    dataType: "json",
                    success: function( data,textStatus ){
                        var d3Def = data[0];
                        $.appendScript(funcNo,d3Def.script);
                    
                        d3Def.complete = op.complete;
                        d3Def.allComplete = op.allComplete;
						
                        $.D3.list[funcNo] = d3Def;
                        
                        $.D3.createNew( d3Def,op.target );
						
                    },
                    error:function(e){
                        var r = $("<a href='javascript:void(0)'><span class='ui-icon ui-icon-refresh' style='float:left'></span>窗口错误,点击刷新</a>")
                        .click(function(){
                            $.D3.runInstance(funcNo,options);
                        });
                        $( "#"+options.target ).empty().append(r);
						
                    }
                });
            }else{
                var d3Def = $.D3.list[funcNo];
                
                $.D3.createNew( d3Def,  op.target);
            }
			
            return $.D3;
        },
        idFuncs: {
        	getID: function(funcno) {  
        		return "d3" + funcno;
        	},
        	getDivID: function(funcno) { //地图的容器
        		return "div_d3" + funcno;
        	}
        },
        createNew: function( d3Def, target ){
        	
            var funcno = d3Def.funcno;
            var divid = $.D3.idFuncs.getDivID(funcno);
            
            var $3DDiv = $("<div id='" + divid + "' style='width:100%; height: 100%;'></div>");

            $("#" + target).empty()
            .append($3DDiv); 
            
            // TODO: 建筑3D模型要替换成获取到的当前建筑的数据。
            init3d(d3Def, $3DDiv.width(), $3DDiv.height(), 
            		"threeD/model_draw.json", "threeD/model_icon.json", 
            		"threeD/model_pick.json", "threeD/model_metadata.json");
            $3DDiv.append(d3Def.threed.renderer.domElement);
            			     
            if(typeof(d3Def.complete) == "function")
            	d3Def.complete();
            d3Def.allComplete();
        },
		
		resizeWin:function(funcno,left,top,width,height){
			var d3Def = $.D3.list[funcNo];
			if (d3Def.threed) {
				d3Def.threed.camera.aspect = width / height;
				d3Def.threed.camera.updateProjectionMatrix();

				d3Def.threed.renderer.setSize(width, height);
			}
		    if (typeof(d3Def.animate)=="function")
		    	d3Def.animate();
		},
		
		refresh: function(funcno) {
		}
		
    };
	
})(jQuery);