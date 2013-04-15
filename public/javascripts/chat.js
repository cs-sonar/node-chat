$(function(){
    var username = '';
    var socket = new io.connect("/");

    socket.on("connect", function(){
        uid = socket.socket.transport.sessid;
        $("#transportName").text("connection ID " + socket.socket.transport.sessid); // 接続ID
        $("#transportID").text("connect via " + socket.socket.transport.name); // 接続方式
        socket.emit("login", document.cookie);
    });

    socket.on("username", function(sessionUsername){
	// POSTしたユーザ名をhttpセッション+socket.io経由で取得
        username = sessionUsername;
        $("#username").text("connect username " + username);
    });

    // ログイン中のユーザーを描写
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
    // メッセージ受信
    socket.on("message", function(message){
        $('div#messageArea dl')
	.prepend(
		$('<dt>' + message.username  + ' says : </dt><dd>' + message.message + '</dd>')
		.fadeIn('slow')
	);
    });

    // システムメッセージ受信
    socket.on("system", function(message){
        $('div#messageArea dl')
	.prepend(
		$('<dt>system says : </dt><dd>' + message + '</dd>')
		.fadeIn('slow')
	);
    });

    // 入力メッセージをサーバへ
    $("#submitButton").click(function(){
        socket.emit("message", {message: $("#msg").val(),username: username});
     });

    //DBにあるメッセージを削除した場合は表示を削除
    socket.on('db drop', function(){
        $('#messageArea dl').empty();
    });

    // ログ削除ボタン
    $("#logDelButton").click(function(){
        socket.emit("msg alldel",'DB data all delete.');
     });

    // 初回接続でDBにあるデータを取得
    socket.on('msgopen', function(msg){
        if(msg.length == 0){ // 取得内容が空っぽだったら
		return;
        } else {
            $('#messageArea dl').empty();
            $.each(msg, function(key, value){
                $('div#messageArea dl')
		.prepend(
			$('<dt>' + value.username + ' says :</dt><dd>' + value.message + '</dd>')
		);
            });   
        }
     });
});
