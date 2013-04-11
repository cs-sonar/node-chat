$(function(){
    var username = '';
    var socket = new io.connect("/");

    socket.on("connect", function(){
        uid = socket.socket.transport.sessid;
        $("#transportName").text("connection ID " + socket.socket.transport.sessid); // 接続ID
        $("#transportID").text("connect via " + socket.socket.transport.name); // 接続時に接続方式表示
        socket.emit("login", document.cookie);
    });

    socket.on("username", function(sessionUsername){
        username = sessionUsername; // POSTしたユーザ名をhttpセッション+socket.io経由で取得
        $("#username").text("connect username " + username);
    });

    socket.on("loginusers", function(login){
        $("#loginusers li").remove();
	for (var i in login){
		if (i === uid) {
		$("<li class=\"blue\">").text(login[i].username).prependTo($("#loginusers"));
		}else{
		$("<li>").text(login[i].username).prependTo($("#loginusers"));
		}
	}
    });

    socket.on("message", function(message){
        $("<div class=\"text-message\" style=\"display: none;\"><tr>").html("<td width=\"250px\"><p class=\"text-success\">" + message.username + " says : </p></td><td width=\"800px\"><p>" + message.message + "</p></td>").prependTo($("#messageArea table tbody"));// 受信メッセージをレンダリング
        $(".text-message").animate({height: 'show', opacity: 'show'}, 'normal');
    });

    socket.on("system", function(message){
        $("<div class=\"text-message\" style=\"display: none;\"><tr>").html("<td width=\"250px\"><p class=\"text-info\">system says : </p></td><td width=\"800px\"><p>" + message + "</p></td>").prependTo($("#messageArea table tbody"));// 受信メッセージをレンダリング
        $(".text-message").animate({height: 'show', opacity: 'show'}, 'normal');
    });

    $("#submitButton").click(function(){
        socket.emit("message", {message: $("#msg").val(),username: username}); // 入力メッセージをサーバへ
    });
});
