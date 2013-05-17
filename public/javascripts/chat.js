$(function(){
    var username = '';
    var socket = new io.connect("/");

    socket.on("connect", function(){
        uid = socket.socket.transport.sessid;
        $("#transportName").text("connection ID " + socket.socket.transport.sessid); // 接続ID
        $("#transportID").text("connect via " + socket.socket.transport.name); // 接続方式
        socket.emit("login", document.cookie);
    });

    // POSTしたユーザ名をhttpセッション+socket.io経由で取得
    socket.on("username", function(sessionUsername){
        username = sessionUsername;
        $("#username").text("connect username " + username);
    });

    // 初回接続でDBにあるデータを取得
    socket.on('msgopen', function(msg){
        if(msg.length == 0){ // 取得内容が空っぽだったら
		return;
        } else {
            $('#messageLogArea dl').empty();
            $.each(msg, function(key, value){
		if(value.image){
                $('div#messageLogArea dl')
		.prepend(
			$('<dt class="gray">' + value.username + ' says :</dt><dd class="gray"><img src="' + value.image + '" width="150px" height="75px">(' + value.date + ')</dd>')
		);
		}else{
                $('div#messageLogArea dl')
		.prepend(
			$('<dt class="gray">' + value.username + ' says :</dt><dd class="gray">' + value.message + '(' + value.date + ')</dd>')
		);
		}
            });
        }
     });

    // ログイン中のユーザーを描写
    socket.on("loginusers", function(login){
        $("#loginusers li").remove();
	for (var i in login){
		if (i === uid) {
			$("<li class=\"blue\">")
			.html('<i class="icon-user"></i>' + login[i].username)
			.prependTo($("#loginusers"));
		}else{
			$("<li>")
			.html( '<i class="icon-user"></i>' + login[i].username)
			.prependTo($("#loginusers"));
		}
	}
    });
    // メッセージ受信
    socket.on("message", function(message){
        $('div#messageArea dl')
	.prepend(
		$('<dt class="blue">' + message.username  + ' says : </dt><dd>' + message.message + '　<sapn class="gray">(' + message.date + ')</span></dd>')
		.fadeIn('slow')
	);
    });

    // 画像受信
    socket.on("image", function(message){
        $('div#messageArea dl')
	.prepend(
		$('<dt class="blue">' + message.username + ' says :</dt><dd><img src="' + message.image + '" width="150px" height="75px">　<sapn class="gray">(' + message.date + ')</span></dd>')
		.fadeIn('slow')
	);
    });


    // システムメッセージ受信
    socket.on("system", function(message){
        $('div#messageArea dl')
	.prepend(
		$('<dt class="red">' + message.username + ' says : </dt><dd><i class="icon-bullhorn"></i>　' + message.message + '　<sapn class="gray">(' + message.date + ')</span></dd>')
		.fadeIn('slow')
	);
    });

    // 入力メッセージをサーバへ
    $("#submitButton").click(function(){
	if($("#msg").val() == ""){
		alert("ぬるぽ");
	}else{
        	socket.emit("message", {message: $("#msg").val(),username: username});
		$("#msg").val("");
	}
     });

    // エンターキーが押された場合も入力メッセージをサーバーへ
    $("body").keypress( function( event ) {
	if( event.which === 13 ){
		if($("#msg").val() == ""){
			return;
		}else{
       		 	socket.emit("message", {message: $("#msg").val(),username: username});
			$("#msg").val("");
		}
	}
    });


    // 画像アップロード
    $("#fileInput").change(function(event){ //アップロードボタンに変更があれば
        var file = event.target.files[0];
        var fileReader = new FileReader();
        var send_file = file;
        var data = {};
        fileReader.readAsDataURL(send_file);
        fileReader.onload = function(event) {
            data.file = event.target.result;
            data.name = "uploadFile";
            data.username = username;
            socket.emit('upload',data);
        }
    });

    //DBにあるメッセージを削除した場合は表示を削除
    socket.on('db drop', function(){
        $('#messageLogArea dl').empty();
    });

    // ログ削除ボタン
    $("#logDelButton").click(function(){
        socket.emit("msg alldel",'DB data all delete.');
     });
});
