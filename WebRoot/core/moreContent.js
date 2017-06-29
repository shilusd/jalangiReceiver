$(document)
		.ready(
				function() {
					var DATE_TIME_WIDTH = 80;
					var grid_id = "tableMore";
					var loadMoreContent = function(funcfilter, target) {
						var ar = funcfilter.split("|", 2);
						var funcno = ar[0], filter = ar[1];
						if (funcno==""||filter=="")
							return;
						var gridDef = {};
						alert(funcno);
						gridDef.url = "commonQuery_doQuery.action?funcno=" + funcno;
						gridDef.rowNum = 50;
						gridDef.height = target.height();
						gridDef.width = target.width() - 4;
						gridDef.sortname = "CONT_ID";
						gridDef.sortorder = "desc";
						gridDef.rownumbers = true;
						gridDef.viewrecords = true;
						gridDef.pginput = true;
						gridDef.multiselect = false;
						gridDef.datatype = "json";
						gridDef.mtype = "POST";
						gridDef.colNames = [ "文档标题", "发布时间", "文档标识", "文档链接" ];
						gridDef.colModel = [ {
							name : "CONTENT_TITLE",
							index : "CONTENT_TITLE",
							width : target.width() - DATE_TIME_WIDTH,
							resizable : false,
							align : "left"
						}, {
							name : "CONTENT_DATE",
							index : "CONTENT_DATE",
							width : DATE_TIME_WIDTH,
							resizable : false,
							align : "left"
						}, {
							name : "CONT_ID",
							index : "CONT_ID",
							width : 10,
							resizable : false,
							align : "left"
						}, {
							name : "CONTENT_LINK",
							index : "CONTENT_LINK",
							width : 10,
							resizable : false,
							align : "left"
						} ];
						gridDef.pager = $("#divPager");
						gridDef.onSelectRow = function() {
							var href = $("#" + grid_id).find("td:eq(4)")[0].innerText;
							href=href.replace(/(^\s*)|(\s*$)/g, "");
							if (href != "")
								window.open(href);
						}
						gridDef.beforeRequest = function() {
							$("#" + grid_id)
									.jqGrid(
											"appendPostData",
											{
												prjfields : "CONTENT_TITLE,CONTENT_DATE,CONT_ID,CONTENT_LINK",
												tablenames : "CONTENTS",
												joinconditions : "FUNCNO="
														+ funcno + " and ("
														+ filter + ")"
											});
						}
						gridDef.onSortCol = function() {
							$("#" + grid_id).jqGrid("removePostDataItem",
									"ordStr");
						}
						gridDef.gridComplete = function() {
							$("#" + grid_id).hideCol("CONT_ID");
							$("#" + grid_id).hideCol("CONTENT_LINK");
						}
						$("#" + grid_id).jqGrid(gridDef);
					};

					
					var PAGER_HEIGHT = 26;
					var height = Math.max(
							document.documentElement.clientHeight,
							document.body.scrollHeight)
							- $("#divTop").height() - 30;//头上的标签页等的高度
					$("#divMore").css( {
						height : height + "px"
					});
					$("#divGrid").css( {
						height : height - PAGER_HEIGHT + "px"
					});
					$("#divPager").css( {
						height : PAGER_HEIGHT + "px"
					});
					loadMoreContent(window.dialogArguments, $("#divGrid"));

				});