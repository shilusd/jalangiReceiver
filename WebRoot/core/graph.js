;
(function($){
    $.FG = $.graph =  {
        options:{
            graphParamURL:$.global.functionDefinitionUrl+"?type=FG", 
            toolBarWidth: 145
        },
		 
        list:{},
        validators:{},
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
                    url:  $.FG.options.graphParamURL,
                    data: {
                        funcNo:funcNo
                    },
                    dataType: "json",
                    success: function( data,textStatus ){
                        var graphDef = data[0];
                        $.appendScript(funcNo,graphDef.script);
                        
                        graphDef.complete = op.complete;
                        graphDef.allComplete = op.allComplete;
						
                        graphDef.funcInMemStr = op.funcInMemStr;
                        						
                        $.graph.list[funcNo] = graphDef;
                        
                        $.graph.createNew( graphDef,op.target );
						
                    },
                    error:function(e){
                        var r = $("<a href='javascript:void(0)'><span class='ui-icon ui-icon-refresh' style='float:left'></span>窗口错误,点击刷新</a>")
                        .click(function(){
                            $.FG.runInstance(funcNo,options);
                        });
                        $( "#"+options.target ).empty().append(r);
						
                    }
                });
            }else{
                var graphDef = $.graph.list[funcNo];
                graphDef.funcInMemStr = op.funcInMemStr;
                
                $.FG.createNew( graphDef,  op.target);
            }
			
            return $.FG;
        },
        clear: function(funcno){
        	// TODO: Clear the graph
        },
        idFuncs: {
        	getGraphID: function(funcno) {  // 图容器
        		return "fg" + funcno;
        	},
        	getGraphDivID: function(funcno) {
        		return "div_fg" + funcno;
        	},
        	getGraphBgDivID: function(funcno) {
        		return "div_fg_bg" + funcno;
        	},
        	getGraphToolDivID: function(funcno) {
        		return "div_fgt" + funcno;
        	},
        	getGraphLayerDivID: function(funcno) {
        		return "div_fg_layer" + funcno;
        	},
        	getGraphThumbDivID: function(funcno) {
        		return "div_fg_thumb" + funcno;
        	},
        	getGuideContainerID: function(funcno) {
        		return "div_fg_guideContainer" + funcno;
        	},
        	getGuidePanelID: function(funcno) {
        		return "guidePanel" + funcno;
        	}
        },
        createNew: function( graphDef, target ){
        	
        	$.graph.cellTempCaption = {};      	
        	
            var funcno = graphDef.funcno;
            var gt_divid = $.FG.idFuncs.getGraphToolDivID(funcno);
            var g_divid = $.FG.idFuncs.getGraphDivID(funcno);
            var gbg_divid = $.FG.idFuncs.getGraphBgDivID(funcno);
			var gthumb_divid = $.FG.idFuncs.getGraphThumbDivID(funcno);
            
            // 分割工具区和绘图区
            var tbWidth = $.FG.options.toolBarWidth + "px";
            var canvasWidth = ($("#" + target).width()-$.FG.options.toolBarWidth-3) + "px";
            $("#" + target).empty()
            .append($("<table style='height:0px;border-spacing:0px;'><tr><td id='cell_" + gt_divid + "' style='width:" + tbWidth +"'></td><td id='cell_" + g_divid + "' style='width:" + canvasWidth + ";'></td></tr></table>"));
            
            //绘图区
            var canvasDiv = $("<div id='" + g_divid + "' style='position: absolute; overflow: auto; padding: 2px; width: " + (canvasWidth-2) + "; height: 100%;'></div>");
            $("#cell_" + g_divid).append(canvasDiv);
			
			//SVG BG区
			// 如果有背景，则再加上背景图（暂时只支持一个背景图：所有层都相同）——否则就要在不同层定义不同的背景图
            // 另外尚未考虑宽高问题
			var graphDiv = $("<div id='" + gbg_divid + "' style='position: absolute; min-width: 100%; min-height: 99%; margin-left: -2px; '></div>");
            // background: url(img/fd.jpg) 0px 0px;
			var $g_div = $("#" + g_divid);
			$g_div.append(graphDiv);
			
			//缩略图容器
			var thumbContainerDiv = $("<div id='thumbContainer' style='position: absolute; right: 0; top: 0;'></div>");
			$g_div.append(thumbContainerDiv);
			
			//缩略图区			
			var thumbDiv = document.createElement('div');
			thumbDiv.id = gthumb_divid;
			//thumbDiv.style.padding = '5px';
			var thumbWindow = new mxWindow('缩略图', thumbDiv, 730, 0, 250, 200, true, true, $(thumbContainerDiv)[0]);
			//thumbWindow.setClosable(true); //是否可以被关闭
			thumbWindow.setMaximizable(false);
			thumbWindow.setScrollable(true);
			thumbWindow.setResizable(true);
			thumbWindow.setVisible(true); //控制是否显示			
			//防止拉出界
			thumbWindow.addListener(mxEvent.MOVE, function(e)
			{
				thumbWindow.setLocation(Math.max(0, thumbWindow.getX()), Math.max(0, thumbWindow.getY()));
			});
            
            // 每次都创建。好像第二次进来就绑不到目标画布上。
            //if (! graphDef.mxModel) {
            	graphDef.mxModel = new mxGraphModel();
            //}
			//if (graphDef.mxModel && ! graphDef.mxGraph) {
				graphDef.mxGraph = new mxGraph($("#" + gbg_divid)[0], graphDef.mxModel);
				
				graphDef.thumbGraph = new mxGraph($("#" + gthumb_divid)[0], graphDef.mxModel);
			//}
			
			graphDef.thumbGraph.getLabel = function(cell){ 
				var v_value = cell.value;
				var label = v_value.getAttribute("label");
				//return label;
				return null;
			};
			
			graphDef.thumbGraph.setEnabled(false);
			graphDef.thumbGraph.setCellsSelectable(false);
			graphDef.thumbGraph.centerZoom = false; 
			graphDef.thumbGraph.keepSelectionVisibleOnZoom = true;
				
			graphDef.mxGraph.convertValueToString = function(cell) { 
        		if (mxUtils.isNode(cell.value)) { 
        			return cell.getAttribute('label', '') 
        		} 
        	}; 
			var keyHandler = new mxKeyHandler(graphDef.mxGraph);
			var rubberband = new mxRubberband(graphDef.mxGraph);
			//delete key
			keyHandler.bindKey(46, function (evt) {
				if (graphDef.mxGraph.isEnabled()) {
					graphDef.mxGraph.removeCells();
				}
			});

        	var cellLabelChanged = graphDef.mxGraph.cellLabelChanged; 
        	graphDef.mxGraph.cellLabelChanged = function(cell, newValue, autoSize) { 
        		if (mxUtils.isNode(cell.value)) { 
        			// Clones the value for correct undo/redo 
        			var elt = cell.value.cloneNode(true); 
        			elt.setAttribute('label', newValue); 
        			newValue = elt; 
        		} 
        		cellLabelChanged.apply(this, arguments); 
        	}; 
        	
  
            
            var afterBindSQLData = function (oneData) {
            	if (typeof(oneData) == "undefined")
            		return;
            	var graphDtl = oneData[graphDef.gdtl_fld];
            	if (graphDtl.length > 0) {
            		// 绘制图形
                	$.userContext.userData[graphDef.funcno + '-GDTL'] = graphDtl;
            	}
            	else if (graphDef.graphDetail.length > 0) {// 没有特定的图，但是要绘制初始图
                	$.userContext.userData[graphDef.funcno + '-GDTL'] = graphDef.graphDetail;
            	}
            	else {  // 清除图形
                	$.userContext.userData[graphDef.funcno + '-GDTL'] = "";
            	}                  	
            	$.userContext.userData[graphDef.funcno + '-GID'] = oneData[graphDef.gid_fld];
            	$.userContext.userData[graphDef.funcno + '-GNAME'] = oneData[graphDef.gname_fld];
            	
            	// 刷新图
            	$.graph.drawGraphFromUC(graphDef.funcno, graphDef.mxGraph);
				//刷新缩略图
				graphDef.thumbGraph.fit();
            }
            
            if(graphDef.bindSql != ""){
                $.getDataBySQL($.userContext.parser( graphDef.bindSql ),afterBindSQLData);  
            }
            else {
            	//  这个应该是定义错误。一个图必须要绑定一个form，其bindSql就是那个form的sql。
            	// TODO: 怎么处理？
            }
            
            
            if (graphDef.editable) {  // 可编辑，要显示边栏
            	var leftTool = $("<div id='" + gt_divid + "' style='background-color: aliceblue; position: absolute; overflow-x: hidden; overflow-y: auto; padding: 2px; left: 0px; width: 140px; height: 100%;'></div>");
            	$("#cell_" + gt_divid).append(leftTool);
            	
				var toolbar = new mxToolbar($("#"+gt_divid)[0]);
				toolbar.enabled = false;
				
				$.graph.initCellTempIdx(graphDef.elementKinds);
            	$.FG.initToolbar(graphDef.mxGraph, graphDef.thumbGraph, toolbar, graphDef.elementKinds, funcno);
            	
            }
            
            if(typeof(graphDef.complete) == "function")
            	graphDef.complete();
            graphDef.allComplete();
        },
		
        initCellTempIdx: function(elementKinds) {
        	$.each(elementKinds, function(i, n) {
				$.graph.cellTempCaption[n.gek_id] = 0;
			});
        },
        getCellNextTempIdx: function(gek_id) {
        	$.graph.cellTempCaption[gek_id] = $.graph.cellTempCaption[gek_id] +1;
        	return $.graph.cellTempCaption[gek_id];
        },
        
        initToolbar: function(graph, thumbGraph, toolbar, elementKinds, funcno){

			var currentLineKindDef = null;

			//菜单栏
        	var addToolbarItem = function (graph, toolbar, prototype, image) {

				var funct = function(graph, evt, cell, x, y)// 当image被扔到画布上时，触发本方法。 // cell是当前鼠标所指的元素（如果有的话）
				{
					graph.stopEditing(false);

					var vertex = graph.getModel().cloneCell(prototype);
					vertex.geometry.x = x;
					vertex.geometry.y = y;
					
					graph.addCell(vertex);  
					var v_value = vertex.value;
					if (mxUtils.isNode(v_value)) { // TODO: id不适合做临时编号。临时编号要另外写代码。每次刷新以后清空。addCell就可以放到后面，省略refresh()
						v_value.setAttribute("label", v_value.getAttribute("gek_name")+$.graph.getCellNextTempIdx(v_value.getAttribute("gek_id")));
	        		} 
					graph.refresh();		
					graph.setSelectionCell(vertex);	
					$.graph.setUCGraphDetail(funcno, graph);			
					thumbGraph.fit();
				};
				
				var gek = prototype.value; //prototype的value中包含了元素种类的名称，用来作为 实例名称 的种子
				// Creates the image which is used as the drag icon (preview) 这里仅仅是创建一张图（带有title）
				var img = toolbar.addMode(gek.getAttribute("gek_name"), image, function(evt, cell)
				{
					var pt = this.graph.getPointForEvent(evt);
					funct(graph, evt, cell, pt.x, pt.y);
				});
				
				// Disables dragging if element is disabled. This is a workaround
				// for wrong event order in IE. Following is a dummy listener that
				// is invoked as the last listener in IE.
				mxEvent.addListener(img, 'mousedown', function(evt)
				{
					// do nothing
				});
				
				// This listener is always called first before any other listener
				// in all browsers.
				mxEvent.addListener(img, 'mousedown', function(evt)
				{
					if (img.enabled == false)
					{
						mxEvent.consume(evt);
					}
				});
				
				mxUtils.makeDraggable(img, graph, funct);
				return img;
			}
			
			var addVertex = function(elementKindDef, icon, w, h, style)
			{
				var vertex = new mxCell(null, new mxGeometry(0, 0, w, h), style);
				vertex.setVertex(true);
				var doc = mxUtils.createXmlDocument();
				var gek = doc.createElement("GEK");
				gek.setAttribute("gek_id", elementKindDef.gek_id);
				gek.setAttribute("gek_name", elementKindDef.gek_name);
				gek.setAttribute("funcno", elementKindDef.gek_funcno);
				gek.setAttribute("winno", elementKindDef.gek_winno);
				vertex.value = gek;
			
				addToolbarItem(graph, toolbar, vertex, icon);
				
				graph.getSelectionModel().addListener(mxEvent.CHANGE, function() // 当选中的元素变化时触发此事件。
				{
					// 将当前选中的元素的id刷新到UC中
					var selectedCell = graph.getSelectionCell();
					if (selectedCell) {
						$.userContext.userData[funcno + '-GEID'] = selectedCell.id;	
					} 
					else {
						$.userContext.userData[funcno + '-GEID'] = '';
					}					
				});
			};
				
			graph.addListener(mxEvent.CELL_RESIZED, function(mxgraph, obj){
				$.graph.setUCGraphDetail(funcno, graph);
			});
						
			graph.addListener(mxEvent.CELLS_MOVED, function(mxgraph, obj){				
				thumbGraph.fit();
			});
			
			graph.addListener(mxEvent.DOUBLE_CLICK, function (mxgraph, obj){
				// 双击图元要弹出 相应的form
				if ( mxgraph.isSelectionEmpty() || mxgraph.getSelectionCell() == null) 
					return;
				var selectedCell = mxgraph.getSelectionCell();
				// 如果双击点的位置上不是当前选中的元素:  如果双击位置上有元素，则选中该元素，重设selectedCell;否则不做事情退出。
				var pt = mxUtils.convertPoint(this.container, obj.properties.event.x, obj.properties.event.y);
				var dblclickedCell = mxgraph.getCellAt(pt.x, pt.y);
				if (dblclickedCell == null) 
					return;
				if (selectedCell != dblclickedCell) {
					selectedCell = dblclickedCell;
					mxgraph.setSelectionCell(selectedCell);
				}
				var v_value = selectedCell.value;
				if (mxUtils.isNode(v_value)) {
					var winno = v_value.getAttribute("winno");
					if (winno && winno != "0") {
						$.page.act.jump($.page.idFunc.funcno2winno(funcno), winno);
					}
					else {  // 不需要跳转窗口，也不要变成可编辑title
						//mxEvent.consume(obj);  // 这句有问题
					}
				}
				
				
			});
			
			// 显示当前图类型的图元元素
			$.each(elementKinds, function(i,n){
				if (n.gek_asso == "N") {
					var graphStyle = "shape=" + n.gek_shape + ";"
					if (n.gek_shape == "image") {
						graphStyle += "image=" + n.gek_icon + ";"
					}
					graphStyle += n.gek_style;
					addVertex(n, n.gek_icon, Number(n.gek_icon_width), Number(n.gek_icon_height), graphStyle);
					// + "verticalLabelPosition=bottom;"
				}
				
			});
        	
			toolbar.addLine();
			
			var buttonDown = 0;
			var lastSelectedImg = null;
			var addArrowEdge = function(elementKindDef, icon)
			{
				
				var funct = function(graph, evt){
					if(lastSelectedImg == null){
						buttonDown = 1;
						lastSelectedImg = img;
					}else if(lastSelectedImg == img){
						buttonDown = 0;
						lastSelectedImg = null;
					}else{
						lastSelectedImg.style.background = '';
						buttonDown = 1;
						lastSelectedImg = img;
					}
					
					graph.setConnectable(buttonDown);
					if(buttonDown == 0){
						img.style.background = '';
					}else{
						img.style.background = 'url(img/mxGraphImages/images/icon-pressed.png)';
					}
				};			

				var img = toolbar.addMode(null, icon, function(evt)
				{
					funct(graph, evt);						
				});			
				
				
				mxEvent.addListener(img, 'mousedown', function(evt)
				{
					currentLineKindDef = elementKindDef;
					funct(graph, evt);	
				});		
			};
			
			//指定当前连接的样式
			graph.connectionHandler.createEdgeState = function(me)
			{
				var edge = graph.createEdge(null, null, null, null, null, currentLineKindDef.gek_style);
				//shape为定义的图形 connector为自带默认图形 可填自定义图形的名称
				//arrow可以是: classic, block, open, oval, diamond, none
				//dashed断断续续的
				//startFill和endFill指arrow为空心或实心
				//edgeStyle=elbowEdgeStyle;elbow=horizontal; 或者edgeStyle=orthogonalEdgeStyle; 为弯折的曲线
				//	edgeStyle=entityRelation; 或者edgeStyle=segment; 或者edgeStyle=loop 直线 更多style请见API文档的mxConstants下搜EDGESTYLE
				//rouded: joins between edges segments are smoothed to a rounded finish
				//var edge = graph.createEdge(null, null, null, null, null, 'shape=connector;startArrow=none;endArrow=classic;dashed=1;startFill=0;endFill=0;edgeStyle=segment;rounded=1;strokeColor=#66FF33');
				var doc = mxUtils.createXmlDocument();
				var gek = doc.createElement("GEK");
				gek.setAttribute("gek_id", currentLineKindDef.gek_id);
				gek.setAttribute("gek_name", currentLineKindDef.gek_name);
				gek.setAttribute("funcno", currentLineKindDef.gek_funcno);
				gek.setAttribute("winno", currentLineKindDef.gek_winno);
				gek.setAttribute("label", currentLineKindDef.gek_name + $.graph.getCellNextTempIdx(currentLineKindDef.gek_id));
				edge.value = gek;
				
				return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge));
			};
			
			$.each(elementKinds, function(i,n){
				if (n.gek_asso == "Y") {
					addArrowEdge(n, n.gek_icon);
				}
				
			});

            //重写连接方法, 设定连接限制constraints
            var connectionHandlerConnect = mxConnectionHandler.prototype.connect;
            mxConnectionHandler.prototype.connect = function(source, target, evt, dropTarget) {
				var connectionAllowed = false;
				var line = graph.getSelectionCell(); //可获得例如line.value.nodeName.toLowerCase() == ('connector1')
				var alertMessege ='';

				var validateConstraint = function(source, target, elementKindDef){
					var isAllow = elementKindDef.gek_asso_isallow;
					var constraintString = elementKindDef.gek_asso_constraint;
					var constraint = constraintString.split(';');
					var sourceId = source.getAttribute('gek_id');
					var targetId = target.getAttribute('gek_id');

					if(isAllow == 'deny'){
						for(var i = 0; i < constraint.length; i++){
							var curConstraint = constraint[i].split(',');
							if(sourceId == curConstraint[0] && targetId == curConstraint[1]){
								return false;
							}
						}
						return true;
					}else{
						for(var i = 0; i < constraint.length; i++){
							var curConstraint = constraint[i].split(',');
							if(sourceId == curConstraint[0] && targetId == curConstraint[1]){
								return true;
							}
						}
						return false;
					}
				}

				if (currentLineKindDef == null) 
					return;
				if (source == null || target == null){
					alertMessege = "请选定连接终点";
				}
				else if (validateConstraint(source, target, currentLineKindDef)){	
					connectionAllowed = true;
				}else{
					alertMessege = "不允许的连接";
				}

				if (connectionAllowed == true) {
					connectionHandlerConnect.apply(this, arguments);
					$.graph.setUCGraphDetail(funcno, graph);
				} else {
					mxUtils.alert(alertMessege);
				}
            };

           
        	
			
			// connecgeiwotor 和link是什么区别？
//			addArrowEdge('img/mxGraphImages/images/custom-classic-end.png','connector',mxConstants.NONE,mxConstants.ARROW_CLASSIC,0,1,1);
//			addArrowEdge('img/mxGraphImages/images/custom-block-end.png','connector',mxConstants.NONE,mxConstants.ARROW_BLOCK,0,1,1);
//			addArrowEdge('img/mxGraphImages/images/custom-open-end.png','connector',mxConstants.NONE,mxConstants.ARROW_OPEN,0,1,1);
//			addArrowEdge('img/mxGraphImages/images/custom-diamond-end.png','connector',mxConstants.NONE,mxConstants.ARROW_DIAMOND,0,1,1);
//			addArrowEdge('img/mxGraphImages/images/custom-oval-end_nofill_dashed.png','connector',mxConstants.NONE,mxConstants.ARROW_OVAL,1,0,0);
//			addArrowEdge('img/mxGraphImages/images/custom-doubledashedline.png','link',mxConstants.NONE,mxConstants.NONE,1,1,1);
			toolbar.addLine();
			
			
			//TODO: 导航栏容器
			var g_divid = $.FG.idFuncs.getGraphDivID(funcno);
			var guideContainerId = $.FG.idFuncs.getGuideContainerID(funcno);
			var guideContainerDiv = $("<div id='" + guideContainerId + "' style='position: absolute; right: 0px; top: 0px;'></div>");
			$("#"+g_divid).append(guideContainerDiv);
			//layer guide 层次导航
			var guidePanel = document.createElement('div');
			guidePanel.id = $.FG.idFuncs.getGuidePanelID(funcno);
			guidePanel.style.width = '190px';
			guidePanel.style.margin = '5px';			
			//用于保存name,cell对
			var map = new HashMap();
			//创建顶层图链接
			map.put($.userContext.userData[funcno + '-GNAME'], graph.getModel().getCell(1));
			var guide = document.createElement('a');
			guide.innerText = $.userContext.userData[funcno + '-GNAME'];
			guide.href = 'javascript:void(0)';
			guide.onclick = function() {
				var cell = graph.getModel().getCell(1);
				graph.enterGroup(cell);
				thumbGraph.enterGroup(cell);
				};
			var ul0 = document.createElement('ul');
			guidePanel.appendChild(guide);
			guidePanel.appendChild(ul0);					
			$(ul0).css("margin-top", "0");	
			
			var addDrillDown = function(icon)
			{
				var funct = function(graph, evt){
					//获取当前层名(即父节点的label)
					var guideName = '';
					var c = graph.getSelectionCells();
					if(c.length == 0){
						return;
					}else{
						c = graph.getSelectionCell();
						//阻止层次展开
						c.setCollapsed(true);
						guideName = c.value.getAttribute("label");
					}
					
					c = graph.getSelectionCell();	

					if(map.containsKey(guideName)){
						graph.enterGroup(c);
						thumbGraph.enterGroup(c);
						return;
					}else if(guideName != ''){

						map.put(guideName, c);	
						
						if(c.getParent().value == undefined){
							var parentName = null;
						}else{
							var parentName = c.getParent().value.getAttribute("label");
						}						
						var curNode = $(ul0);
						//顶层图中
						if(parentName == null){
							var li = document.createElement('li');

							var guide = document.createElement('a');
							guide.innerText = guideName;
							guide.href = 'javascript:void(0)';
							guide.onclick = function() {
								var cell = map.get(guideName);
								graph.enterGroup(cell);
								thumbGraph.enterGroup(cell);
							};
										
							li.appendChild(guide);								
							
							$(curNode).append($(li));
						}else{ //非顶层图
							var links = $(curNode).find('a');
							for(var i = 0; i < links.length; i++){
								if($(links[i]).text() == parentName){
									curNode = $(links[i]);
									break;
								}
							}
							var ul = document.createElement('ul');
							var li = document.createElement('li');

							var guide = document.createElement('a');
							guide.innerText = guideName;
							guide.href = 'javascript:void(0)';
							guide.onclick = function() {
								var cell = map.get(guideName);
								graph.enterGroup(cell);
								thumbGraph.enterGroup(cell);
							};
							
							ul.appendChild(li);					
							li.appendChild(guide);								
							
							$(curNode).after($(ul));								
						}
					}			
					graph.enterGroup(c);
					thumbGraph.enterGroup(c);
					
					$(guidePanel).find('ul').css("margin-left", "15px");
				};
			
				var img = toolbar.addMode(null, icon, function(evt)
				{
					funct(graph, evt);						
				});				
				
				
				mxEvent.addListener(img, 'mousedown', function(evt)
				{
					funct(graph, evt);		
					//mxEvent.consume(evt);
				});					
			};
			addDrillDown('img/mxGraphImages/images/custom-enter.png');
			
			
			var addExitDrill = function(icon)
			{
				var funct = function(graph, evt){					
					graph.exitGroup();
					thumbGraph.exitGroup();
				};
				
				var img = toolbar.addMode(null, icon, function(evt)
				{
					funct(graph, evt);												
				});		
				
				mxEvent.addListener(img, 'mousedown', function(evt)
				{
					funct(graph, evt);				
					mxEvent.consume(evt);
				});						
			};
			addExitDrill('img/mxGraphImages/images/custom-exit.png');		
				
			// 层次导航的窗口
			var guideWindow = new mxWindow('层次导航', guidePanel, 5, 0, 200, 250, true, true, $(guideContainerDiv)[0]);
			guideWindow.setMaximizable(false);
			guideWindow.setScrollable(true);
			guideWindow.setResizable(true);
			guideWindow.setVisible(false); // TODO: 暂时隐藏了层次导航栏 
			//防止拉出界
			guideWindow.addListener(mxEvent.MOVE, function(e)
			{
				guideWindow.setLocation(Math.max(0, guideWindow.getX()), Math.max(0, guideWindow.getY()));
			});
			
			
			//阻止层次展开,点击+号进到下一层
			graph.addListener(mxEvent.CELLS_FOLDED, function (mxgraph, obj){
				var c = graph.getSelectionCell();
				if(!c.isCollapsed()){
					c.setCollapsed(true);
				}
				graph.enterGroup(c);
				thumbGraph.enterGroup(c);
			});

			
			//自定义HashMap
			function HashMap()  {  
				/** Map 大小 **/  
				var size = 0;  
				/** 对象 **/  
				var entry = new Object();  
				
				/** 存 **/  
				this.put = function (key , value)  
				{  
				if(!this.containsKey(key))  
				{  
					size ++ ;  
				}  
				entry[key] = value;  
				}  
				
				/** 取 **/  
				this.get = function (key)  
				{  
				return this.containsKey(key) ? entry[key] : null;  
				}  
				
				/** 删除 **/  
				this.remove = function ( key )  
				{  
				if( this.containsKey(key) && ( delete entry[key] ) )  
				{  
					size --;  
				}  
				}  
				
				/** 是否包含 Key **/  
				this.containsKey = function ( key )  
				{  
				return (key in entry);  
				}  
				
				/** 是否包含 Value **/  
				this.containsValue = function ( value )  
				{  
				for(var prop in entry)  
				{  
					if(entry[prop] == value)  
					{  
						return true;  
					}  
				}  
				return false;  
				}  
				
				/** 所有 Value **/  
				this.values = function ()  
				{  
				var values = new Array();  
				for(var prop in entry)  
				{  
					values.push(entry[prop]);  
				}  
				return values;  
				}  
				
				/** 所有 Key **/  
				this.keys = function ()  
				{  
				var keys = new Array();  
				for(var prop in entry)  
				{  
					keys.push(prop);  
				}  
				return keys;  
				}  
				
				/** Map Size **/  
				this.size = function ()  
				{  
				return size;  
				}  
				
				/* 清空 */  
				this.clear = function ()  
				{  
				size = 0;  
				entry = new Object();  
				}  
			}	
        },

        // 图形更新到UC
        setUCGraphDetail: function(funcno, graph) {
        	$.userContext.userData[funcno + '-GDTL'] = $.graph.getGraphXML(graph);
        },
        // UC画到图形
        drawGraphFromUC: function(funcno, target) {
        	var graphXMLString = $.userContext.userData[funcno + '-GDTL'];
        	$.graph.drawGraph(target, graphXMLString);
        },
        
        // 图形转换为XML字符串
		getGraphXML: function(graph) {
			var encoder = new mxCodec();
			var node = encoder.encode(graph.getModel());
			var sXML = mxUtils.getXml(node);
			return sXML;
		},

        // XML读取输出图
        // 参数target应为当前graph, graph_dtl为xml串
        drawGraph : function(target, graph_dtl){
            var model = target.getModel();
            model.beginUpdate();
            try {
	            var xmlDocument = mxUtils.parseXml(graph_dtl);
	            var decoder = new mxCodec(xmlDocument);
	            var node = xmlDocument.documentElement;
						
				decoder.decode(node, model);
			} finally {
                model.endUpdate();
            }
		},
		
		resizeWin:function(funcno,left,top,width,height){
			var gt_divid = $.FG.idFuncs.getGraphToolDivID(funcno);
			var g_divid = $.FG.idFuncs.getGraphDivID(funcno);
			$("#cell_" + gt_divid).width($.FG.options.toolBarWidth);
			$("#cell_" + g_divid).width(width - $.FG.options.toolBarWidth -6);
			
			$("#" + gt_divid).height(height).width($.FG.options.toolBarWidth);
			$("#" + g_divid).height(height).width(width - $.FG.options.toolBarWidth -6);

			//$("#" + g_divid).css("background", "url('http://st.map.qq.com/api?size=" + $("#" + g_divid).width()
			//		+ "*" + $("#" + g_divid).height() + "&center=116.30613,39.98219&zoom=14')");
			

		},
		
		refresh: function(funcno) {
			// 将选中元素的gek_funcno中变量都拿到该元素的value里去
			var graphDef = $.graph.list[funcno];
			var graph = graphDef.mxGraph;
			if (graph) {
				var selectedCell = graph.getSelectionCell();
				if (selectedCell) {
					var v_value = selectedCell.value;
					if (mxUtils.isNode(v_value)) { 
						var gek_id = v_value.getAttribute("gek_id");
						$.each(graphDef.elementKinds, function(i,n){
							if (n.gek_id == gek_id) {
								// 重刷sql数据（必须用数据库中的数据来更新图上的label，因为平台不提供“取消”按钮，不能用form的UC变量来更新，否则“返回”就会更新label了）
								var refreshNodeWithData = function(oneData) {
									// n.gek_caption_str中的内容（允许空格分隔）
									if (oneData) {
										var labelStr = $.userContext.parser(n.gek_caption_str);
										var gekCaps = n.gek_caption_str.split(/\s/);
										$.each(gekCaps, function(i, capStr) {
											if (typeof(oneData[capStr]) != "undefined")
												labelStr = labelStr.replace(capStr, oneData[capStr]);
										}); 
										if ($.trim(labelStr) != "") {
											v_value.setAttribute("label", labelStr);
											graph.refresh();
										}
									}
								}
								$.getDataBySQL($.userContext.parser( n.gek_bindSql ),refreshNodeWithData);
								
							}
						})
					} 
				}
				// 将图刷新到UC变量中
				$.graph.setUCGraphDetail(graphDef.funcno, graph);
			} 
		},
		
		updateNode: function(isToUC) {
			// isToUC 为true表示用当前节点的value中的内容更新UC；为false表示用UC中的内容（如果更新当前节点（更新过以后，UC就清空）
		}


		
    };
	
})(jQuery);