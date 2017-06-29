;
(function($){
    $.GI = $.gis =  {
        options:{
            gisParamURL:$.global.functionDefinitionUrl+"?type=GI", 
            gisGetPTS: "map_getPTS.action",
            gisGetAreaInfo: "map_getArea.action",  // 获得区域的基本信息，包括区域名称，边界点数组。
            gisGetBuildingInfo: "map_getBuilding.action",  // 获取指定区域中的所有建筑
            gisFlatButton: "<button style='position: absolute; top:30px; left: 20px; z-index: 20;'>返回地图</button>"
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
                    url:  $.GI.options.gisParamURL,
                    data: {
                        funcNo:funcNo
                    },
                    dataType: "json",
                    success: function( data,textStatus ){
                        var gisDef = data[0];
                        $.appendScript(funcNo,gisDef.script);
            
                        gisDef.tempPoints = new Array(); // 当前的临时点。设定建筑用。
                        gisDef.buildings = new Array(); // 建筑物信息。
                        
                        gisDef.complete = op.complete;
                        gisDef.allComplete = op.allComplete;
						
                        $.GI.list[funcNo] = gisDef;
                        
                        $.gis.createNew( gisDef,op.target );
						
                    },
                    error:function(e){
                        var r = $("<a href='javascript:void(0)'><span class='ui-icon ui-icon-refresh' style='float:left'></span>窗口错误,点击刷新</a>")
                        .click(function(){
                            $.GI.runInstance(funcNo,options);
                        });
                        $( "#"+options.target ).empty().append(r);
						
                    }
                });
            }else{
                var gisDef = $.gis.list[funcNo];
                
                gisDef.tempPoints = new Array(); // 当前的临时点。设定建筑用。
                gisDef.buildings = new Array(); // 建筑物信息。
                
                $.GI.createNew( gisDef,  op.target);
            }
			
            return $.GI;
        },
        idFuncs: {
        	getMapID: function(funcno) {  
        		return "map" + funcno;
        	},
        	getMapDivID: function(funcno) { //地图的容器
        		return "div_map" + funcno;
        	},
        	getMapPanoDivID: function(funcno) {
        		return "div_mappano" + funcno;
        	},
        	getGraphBgDivID: function(funcno) {
        		return "div_map_bg" + funcno;
        	}
        },
        drawMap: function (gisDef, container) {
        	if (typeof(gisDef.area)==="undefined") 
        		return;
            var point = new qq.maps.LatLng(gisDef.area.center.Lat, gisDef.area.center.Lng);
            var zoom = 17;
        	map = new qq.maps.Map(document.getElementById(container), {
        		center : point,
        		zoom : zoom,
        		disableDoubleClickZoom: true,
        		mapTypeId: qq.maps.MapTypeId.HYBRID
        	});
        	qq.maps.event.addListener(map, 'dblclick', function(event) {
        		alert('doubleclick');
        	});
        	
        	gisDef.map = map;
        	
            $.GI.drawArea(gisDef, gisDef.area);
        },
        ///////////////////////// 测试数据 ////////////////////////////////////
        testCase: {
        	area: {
        		id: "FDBB",
        		name: "复旦本部",
        		center: {Lat: 31.29854, Lng: 121.50408 },  // 区域的中心宜定义为((MAX(LAT)+MIN(LAT))/2, (MAX(LNG)+MIN(LNG))/2)
        		points: [
        		         {Lat: 31.29863, Lng: 121.49755},
        		         {Lat: 31.29599, Lng: 121.49894}, 
        		         {Lat: 31.29557, Lng: 121.50014},
        		         {Lat: 31.29879, Lng: 121.51049}, 
        		         {Lat: 31.29999, Lng: 121.51006},
        		         {Lat: 31.30018, Lng: 121.51061}, 
        		         {Lat: 31.30070, Lng: 121.51033}, 
        		         {Lat: 31.29993, Lng: 121.50782}, 
        		         {Lat: 31.30151, Lng: 121.50675} 
        		         ]
        	},
        	building1: {
        		id: "SW2",
        		name: "生物二楼",
        		gaze: {Lat: 31.29923, Lng: 121.50379},
        		points: [
        		         {Lat: 31.29936, Lng: 121.50378},
        		         {Lat: 31.29919, Lng: 121.50384},
        		         {Lat: 31.29928, Lng: 121.50428}, 
        		         {Lat: 31.29948, Lng: 121.50421} 
        		         ]
        	},
        	building2: {
        		id: "JSZX",
        		name: "计算中心", 
        		gaze: {Lat: 31.29966, Lng: 121.50354},
        		points: [
        		         {Lat: 31.29989, Lng: 121.50347},
        		         {Lat: 31.29962, Lng: 121.50357},
        		         {Lat: 31.29975, Lng: 121.50406}, 
        		         {Lat: 31.30004, Lng: 121.50400} 
        		         ]
        	}
        },
        ///////////////////////////////////////////////////////////////////////
        
        drawPolygon: function(map, points, bordercolor, borderwidth, fillcolor) {
        	var polygon = new soso.maps.Polygon({
		        path:points,
		        strokeColor: bordercolor,
		        strokeWeight: borderwidth,
		        strokeOpacity: 1,
		        fillColor: fillcolor?fillcolor:(new qq.maps.Color(255,255,255,0.01)),
		        map: map
		    });
        	polygon.setMap(map);
        	polygon.setVisible(true);
        	return polygon;
        },
        
        drawArea: function(gisDef, area) {
        	var path = new Array();
        	$.each(area.points, function(i, n) {
        		path.push(new soso.maps.LatLng(n.Lat, n.Lng));
        	});
        	var fillcolor = new qq.maps.Color(255,255,255,0.01);
        	var poly = $.GI.drawPolygon(gisDef.map, path, '#FF0000', 2, fillcolor);
    		$.userContext.userData[gisDef.funcno + '-AREAID'] = area.id;	
    		qq.maps.event.addListener(poly, 'rightclick', function(event) {
        		$.userContext.userData[gisDef.funcno + '-CURR_BID'] = '';	
        		
        		// 实景图
        		$.GI.drawPanorama(gisDef, event.latLng );
        		
        	});
        	area.poly = poly;
        },

        drawBuilding: function (gisDef, building) {
        	var path = new Array();
        	$.each(building.points, function(i, n) {
        		path.push(new soso.maps.LatLng(n.Lat, n.Lng));
        	});
        	var poly = $.GI.drawPolygon(gisDef.map, path, '#0000FF', 1, new qq.maps.Color(225,225,225,0.4));
        	        	
        	qq.maps.event.addListener(poly, 'click', function(event) {
        		// TODO: 调用3D建筑展示。跳转到对应的3D窗口。
        		$.userContext.userData[gisDef.funcno + '-CURR_BID'] = building.id;	
        		
        		$.page.act.jump(10007, 10026);
        	});
        	qq.maps.event.addListener(poly, 'rightclick', function(event) {
        		// 实景图
        		$.GI.drawPanorama(gisDef, new soso.maps.LatLng(building.gaze.Lat, building.gaze.Lng) );
        		
        		$.userContext.userData[gisDef.funcno + '-CURR_BID'] = building.id;	
        	});

        	building.polygon = poly;
        },
        
        // 在全景图画布pano上标注building，初始点为fromPoint
        showBuildingOnPano: function(pano, building, fromPoint) {
        	var endn = new soso.maps.LatLng(building.gaze.Lat, building.gaze.Lng);
        	var pathn = [ fromPoint, endn ];
        	var dist = Math.round(qq.maps.geometry.spherical
        			.computeDistanceBetween(fromPoint, endn) * 10) / 10;
        	if (building.panoLabel) {
        		building.panoLabel.setPanorama(pano);
        		building.panoLabel.setContent(building.name + ' 距离' + dist +'米');
        		building.panoLabel.dist = dist;
        	}
        	else {	
            	var label;
        		label = new qq.maps.PanoramaLabel({
        			panorama : pano,
        			position : endn,
        			content : building.name + ' 距离' + dist +'米',
        			altitude: 3,
        			bid: building.id,
        			dist: dist
        		});
            	
        		building.panoLabel = label;
        	}
        	qq.maps.event.clearListeners(building.panoLabel, 'click');
        	qq.maps.event.addListener(building.panoLabel, 'click', function(evt) {
        		$.userContext.userData[pano.funcno + '-CURR_BID'] = this.bid;	
    			var lat = evt.target.position.lat;
    			var lng = evt.target.position.lng;
    			if (this.dist < 10) {
    				// 足够近了，直接进3D
    				$.page.act.jump(10007, 10026);
					
    				return;
    			}
    			var point = new qq.maps.LatLng(lat, lng);	
    			var pano_service = new qq.maps.PanoramaService();
    			pano_service.getPano(point, 500, function(result) {
        			
        			pano.setPano(result.svid);
        			var x1 = result.latlng.lng;
        			var y1 = result.latlng.lat;
        			var x2 = lng;
        			var y2 = lat;
        			var alpha = Math.acos((y2 - y1)
        					/ Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
        			if (x2 - x1 < 0) {
        				alpha = Math.PI * 2 - alpha;
        			}
        			pano.setPov({
        				heading : alpha / Math.PI * 180,
        				pitch : 0
        			});
    			});
    		});
        },
        // 显示指定点point的全景图
        drawPanorama: function(gisDef, point){
        	var panoid = $.GI.idFuncs.getMapPanoDivID(gisDef.funcno);
        	var showvista = function(pano, panoLatLng) {  // 在全景图画布上显示指定点的全景图
        		var pano_service = new qq.maps.PanoramaService();
        		pano_service.getPano(panoLatLng, 500, function(result) {
        			pano.setPano(result.svid);
        			var x1 = result.latlng.lng;
        			var y1 = result.latlng.lat;
        			var x2 = panoLatLng.lng;
        			var y2 = panoLatLng.lat;
        			var alpha = Math.acos((y2 - y1)
        					/ Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
        			if (x2 - x1 < 0) {
        				alpha = Math.PI * 2 - alpha;
        			}
        			pano.setPov({
        				heading : alpha / Math.PI * 180,
        				pitch : 0
        			});
        			$("#"+panoid).append($($.GI.options.gisFlatButton).click(function(){
                    	$("#" + panoid).hide();
                    })
                    );
        		});
        		//当街景地图中位置变化时，更新位置信息
//      		qq.maps.event.addListener(pano, 'position_changed', function() {
//      		var pov = pano.getPosition();
//      		panoLatLng = new qq.maps.LatLng(pov.lat, pov.lng);
//      		updatelength(pano, panoLatLng);

//      		});
        	}
        	// 创建街景
        	var pano;
        	//if (!gisDef.pano) {
            	$("#"+panoid).empty().show();
            	gisDef.pano = pano = new qq.maps.Panorama(document.getElementById(panoid));
        		pano.funcno = gisDef.funcno;
        		qq.maps.event.addListener(pano, 'position_changed', function() {
        			var pov = pano.getPosition();
        			var panoLatLng = new qq.maps.LatLng(pov.lat, pov.lng);
        			$.each(gisDef.buildings, function(i, n){
        				$.GI.showBuildingOnPano(pano, n, panoLatLng);
        			});
        		});
//        		gisDef.pano = pano;
//        	}
//        	else {
//        		$("#"+panoid).show();
//        		pano = gisDef.pano;
//        	}
        	showvista(pano, point);

        	// 显示当前所有的building的label
        	$.each(gisDef.buildings, function(i, n){
    			$.GI.showBuildingOnPano(gisDef.pano, n, point);
    		});
        	
        	
        },

        createNew: function( gisDef, target ){
        	
            var funcno = gisDef.funcno;
            var map_divid = $.GI.idFuncs.getMapDivID(funcno);
            var mappano_divid = $.GI.idFuncs.getMapPanoDivID(funcno);
            
            var $mapDiv = $("<div id='" + map_divid + "' style='width:100%; height: 100%;'><div style='width:100%;height:100%;display:none;z-index=5;' id='" + mappano_divid + "'></div></div>");
        	// 地图div
            //
            $("#" + target).empty()
            .append($mapDiv);  
            $("#"+mappano_divid).append($($.GI.options.gisFlatButton).click(function(){
            	$("#" + mappano_divid).hide();
            })
            );
            //$("#" + mappano_divid + " button");
            
            // TODO: 在这里ajax 调用$.GI.options.gisGetAreaInfo获得指定area的边界点数组，中心点
            gisDef.area = $.gis.testCase.area;

            $.GI.drawMap(gisDef, map_divid);		
            
            // TODO: 在这里ajax 调用$.GI.options.gisGetBuildingInfo获得area中所有building的信息
            // 然后画出所有的buildings
//            $.each(data, function(i, building) {
//              $.GI.drawBuilding(gisDef, building);  // 画出building，自动保存多边形对象在building.polygon
//            	gisDef.buildings.push(building);	// 将带有多边形对象的building放在gisDef中
//            });
            
    		$.GI.drawBuilding(gisDef, $.gis.testCase.building1); // building1会自动获得绘制出的polygon属性。
    		gisDef.buildings.push($.gis.testCase.building1);
    		$.GI.drawBuilding(gisDef, $.gis.testCase.building2);
    		gisDef.buildings.push($.gis.testCase.building2);
			     
            if(typeof(gisDef.complete) == "function")
            	gisDef.complete();
            gisDef.allComplete();
        },
		
		resizeWin:function(funcno,left,top,width,height){
			
		},
		
		refresh: function(funcno) {
		}
		
    };
	
})(jQuery);