
// The instanceReady event is fired, when an instance of CKEditor has finished
// its initialization.
CKEDITOR.on( 'instanceReady', function( ev ) {
	var ckeditor_inst = ev.editor;
	if (ckeditor_inst.config.readOnly)
	  $("#cke_" + ckeditor_inst.name +" >span>span>table>tbody>tr>td>a").click();  //  ckeditor_inst.name应该是原来被替换掉的textarea的id
	                                                                               // 而ckeditor是一个span，id是cke_加上ckeditor_inst.name
	//alert('done ck.');
	$("#cke_bottom_" + ckeditor_inst.name).parent().css("display", "none");
});

;(function($){
	$.fn.extend({
		richEditor:function(op){
			var $div = this;
			$div.empty();
			var id = $div.attr("id");
			var funcno = $div.attr("funcno");
			var readonly = $div.attr("ckReadonly");

			if (CKEDITOR.instances[id+"TA"]){
				CKEDITOR.remove(CKEDITOR.instances[id+"TA"]);
			}

			$div.html("<textarea id='"+id+"TA' name='"+id+"TA'  funcno='"+funcno+"' style='width:"+op.width+"px;height:"+op.height+"px;'></textarea>");
			//var $textArea = $("#"+id+"TA");
			var editor = CKEDITOR.replace(id+"TA", {
				readOnly: readonly=="true"?true:false,
				toolbarCanCollapse: true,
				toolbarStarupExpanded: true});   // toolbarStartupExpanded false 不能收起toolbar

			$.form.initFormData(funcno);
			//$.form.getDataToContext(funcno);  // by wyj 由于initFormData中用ajax获取数据，因此，马上getDataToContext很可能是没用的。
			// getDataToContext应该放在initFormData中完成form数据填写的回调函数afterBindSQLData中。
			
		},
		getContent:function(){
			var id = this.attr("id");
			var editor = id+"TA";
			var obj =  CKEDITOR.instances[editor];
                        
                        if (obj){
                            return obj.getData();
                        } else {
                            return "";
                        }
			
		},
		setContent:function(val){
                        if (val){
                            var id = this.attr("id");
                            var editor = id+"TA";
                            var obj =   CKEDITOR.instances[editor];
                            obj.setData(val);
                        }
		}
	});
})(jQuery)