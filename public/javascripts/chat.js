$(function(){
    var socket = new io.connect("/");
    socket.on("connect", function(){
        $("#transportName").text("connection ID " + socket.socket.transport.sessid);// 接続ID
        $("#transportID").text("connect via " + socket.socket.transport.name);// 接続時に接続方式表示
    });

    socket.on("message", function(message){
        $("<div class=\"text-message\" style=\"display: none;\"><tr>").html("<td width=\"250px\"><p class=\"text-success\">" + socket.socket.transport.sessid + " says : </p></td><td width=\"800px\"><p>" + message + "</p></td>").prependTo($("#messageArea table tbody"));// 受信メッセージをレンダリング
        $(".text-message").animate({height: 'show', opacity: 'show'}, 'normal');
    });

    socket.on("system", function(message){
        $("<div class=\"text-message\" style=\"display: none;\"><tr>").html("<td width=\"250px\"><p class=\"text-info\">system says : </p></td><td width=\"800px\"><p>" + message + "</p></td>").prependTo($("#messageArea table tbody"));// 受信メッセージをレンダリング
        $(".text-message").animate({height: 'show', opacity: 'show'}, 'normal');
    });

    $("#submitButton").click(function(){
        socket.emit("message", {message: $("#msg").val()});// 入力メッセージをサーバへ
    });
});
