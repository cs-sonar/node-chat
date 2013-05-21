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
                    value.username = value.username.htmlEscape();
                    value.message  = value.message.htmlEscape();
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
        message.username = message.username.htmlEscape();
        message.message  = message.message.htmlEscape();
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

    // エンターキーが押された場合,入力メッセージをサーバーへ
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

    // 画像アップロード領域を非表示
    $('.accordion_head').click(function() {
        $(this).next().slideToggle();
    }).next().hide();

    // 画像D&Dアップロード
    $('#drop_zone').on({
        'dragover': function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.originalEvent.dataTransfer.dropEffect = 'copy';
        },
        'drop': function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var files = evt.originalEvent.dataTransfer.files;
            for (var i = 0, f; f = files[i]; i += 1) {
                if (!f.type.match('image.*')) {
                    continue;
                }else{
                    var reader = new FileReader();
                    var data = {};
                    reader.readAsDataURL(f);
                    reader.onload = function(event) {
                        data.file = event.target.result;
                        data.name = "uploadFile";
                        data.username = username;
                        socket.emit('upload',data);
                    };
                }
            }
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

    // html escape
    String.prototype.htmlEscape = function(){
        var obj = document.createElement('pre');
        if (typeof obj.textContent != 'undefined') {
            obj.textContent = this;
        } else {
            obj.innerText = this;
        }
        return obj.innerHTML;
    }

});
