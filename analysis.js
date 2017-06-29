(function(){
  var functions = new Array();
  var gids = new Array();
  var current = 0;
  var current_name = "root";
  var hash = new Object();
  //var map = new Array();
  J$.analysis = {

    endExpression : function (iid) {
        //console.log(J$.iidToLocation(J$.getGlobalIID(iid)));
    },

    functionEnter : function (iid, f, dis, args) {
        //var caller = f.caller.arguments[0];
       // console.log(caller.caller);
       // var caller_name = caller==null?"null":caller.name;


        var name = f.name;
        if (name=="") {
            name = "annoymous";
        }
        //console.log("Call a function: "+name);
        //console.log("current: "+current);
        var ref = new Object();
        ref.src = current;
              
        ref.dis = J$.getGlobalIID(iid);
        //console.log("ref:("+ref.src+" ,"+ref.dis+")");
        //map.push(ref);


        var src = ref.src==0?0:J$.iidToLocation(ref.src);
        var dis = J$.iidToLocation(ref.dis);
        //console.log(src);
        //console.log(dis);
       // if (src!=0&&src.substring(0,src.indexOf(":"))!=dis.substring(0,dis.indexOf(":"))) {
        //  console.log("Reference on '"+current_name+"' at "+src+" to '"+name+"' at "+dis+".");
        //}
        var str = current_name+src+name+dis;
        if (hash[str]==undefined) {
            hash[str] = 1;
             var httpRequest = new XMLHttpRequest();  
            if (httpRequest.overrideMimeType) {  
                httpRequest.overrideMimeType("text/xml");  
            }  
            httpRequest.open("GET", "http://127.0.0.1:8080/Jalangi/getData?srcFname="+current_name+"&srcPosition="+src+"&dstFname="+
                name+"&dstPosition="+dis, true);
            httpRequest.send();     
        }



       

        gids.push(J$.getGlobalIID(iid));
        functions.push(name);

        current = J$.getGlobalIID(iid);
        current_name = name;
    },

    functionExit : function (iid, returnVal, wrappedExceptionVal) {
        //console.log("Function Exit.");
        gids.pop();
        functions.pop();
        if (gids.length==0) {
            current = 0;
            current_name = "root";
        } else {
            current = gids[gids.length-1];
            current_name = functions[functions.length-1];
        }
    },

     endExecution : function () {

        /*
            while (map.length>0) {
                var ref = map.pop();
                var src = ref.src==0?0:J$.iidToLocation(ref.src);
                var dis = J$.iidToLocation(ref.dis);
                console.log("Reference on "+src+" to "+dis+".");
            }*/
        }
};

}());