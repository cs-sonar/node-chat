
/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose');

var store = new express.session.MemoryStore();
var cookieUtil = require('cookie');
var connect = require('connect');

var app = express();

app.configure(function(){
  app.set('secretKey', 'your secret here');
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(app.get('secretKey')));
  app.use(express.session({
    store : store
    , cookie : { httpOnly : false }
  }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


/**
 * routing
 */
app.get('/users', user.list);
app.get('/', routes.index);
//app.get('/images', routes.images);
app.post('/chat',routes.chat);
app.get('/chat', function(req, res){
	res.redirect('/');
});


/**
 * mongodbサーバーへ接続
 */
var Schema = mongoose.Schema;
var UserSchema = new Schema({
  username: String,
  message: String,
  date: String,
  image: String
});
mongoose.model('User', UserSchema);
mongoose.connect('mongodb://localhost/chat_app');
var User = mongoose.model('User');

/**
 * socket.io
 */
var server = http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
var socket = require('socket.io').listen(server);
socket.set("log level",1);
socket.on('connection', function(client) {
	// 変数設定
	var uid = client.store.id;
	var roomClients = client.manager.roomClients;

	// クライアントが接続したときの処理
	client.on('login', function(cookie){
		// クッキーをオブジェクトにパース
		cookie = cookieUtil.parse(cookie);
		// 署名されたセッションIDをデコード
		sid = connect.utils.parseSignedCookie(cookie['connect.sid'], app.get('secretKey'));
		// 初回接続でDBに保存されているメッセージを取得
		User.find(function(err, docs){
			client.emit('msgopen', docs);
			//console.log(docs);
		});
		store.get(sid, function(err, session){
			if(session && "username" in session){
				username = session.username // httpセッションからユーザ名を取得
				client.emit('username', username);
				roomClients[uid]['username'] = username;
				var msg = username + ' さんがログインしました';
				var nowdate = getDateAndTime();
				var username = 'system';
				Obj = {
					message	:	msg,
					date	:	nowdate,
					username:	username
				}
				client.emit('system', Obj);
				client.broadcast.emit('system', Obj);
				client.emit('loginusers',roomClients );
				client.broadcast.emit('loginusers', roomClients);
				//DBに登録
				var user = new User();
				user.username  = Obj.username;
				user.message  = Obj.message;
				user.date = Obj.date;
				user.save(function(err) {
					if (err) { console.log(err); }
				});
			}
		});
	});
	// クライアントがメッセージを送信した時の処理
	client.on('message', function(event){
		var nowdate = getDateAndTime();
		Obj = {
			message	:	event.message,
			date	:	nowdate,
			username:	event.username
		}
		client.emit('message', Obj);
		client.broadcast.emit('message', Obj);
		//DBに登録
		var user = new User();
		user.username  = Obj.username;
		user.message  = Obj.message;
		user.date = Obj.date;
		user.save(function(err) {
			if (err) { console.log(err); }
		});
	});


	// クライアントが画像を送信した時の処理
	client.on('upload', function(data){
		b64 = base64encode(data.file);
		var nowdate = getDateAndTime();
		Obj = {
			date	:	nowdate,
			username:	data.username,
			image	:	b64
		}
		client.emit('image', Obj);
		client.broadcast.emit('image', Obj);
		//DBに登録
		var user = new User();
		user.username  = Obj.username;
		user.date = Obj.date;
		user.image = Obj.image;
		user.save(function(err) {
			if (err) { console.log(err); }
		});
	});

	// クライアントがログオール削除を実行した時
	client.on('msg alldel', function(){
		client.emit('db drop');
		client.broadcast.emit('db drop');
		User.find().remove();
	});
	// クライアントが切断したときの処理
	client.on('disconnect', function(){
		var nowdate = getDateAndTime();
		var msg = roomClients[uid]['username'] + ' さんがログアウトしました';
		Obj = {
			message	:	msg,
			date	:	nowdate,
			username:	roomClients[uid]['username']
		}
		client.broadcast.emit('system', Obj );
		//DBに登録
		var user = new User();
		user.username  = Obj.username;
		user.message  = Obj.message;
		user.date = Obj.date;
		user.save(function(err) {
			if (err) { console.log(err); }
		});
		//ログインユーザーを更新
		delete client.manager.roomClients[uid];
		client.broadcast.emit('loginusers', roomClients);
	});
});


/**
 * function
 */

// UnixTimeを取得
function getUnixTime() {
   return parseInt((new Date)/1000);
}

// 現在の日時を YYYY/MM/DD hh:mm:dd 形式で返す関数
function getDateAndTime() {
  dd = new Date();
  year = (dd.getYear() < 2000 ? dd.getYear()+1900 : dd.getYear() );
  month = (dd.getMonth() < 9 ? "0" + (dd.getMonth()+1) : dd.getMonth()+1 );
  day = (dd.getDate() < 10 ? "0" + dd.getDate() : dd.getDate() );
  hour = (dd.getHours() < 10 ? "0" + dd.getHours() : dd.getHours() );
  minute = (dd.getMinutes() < 10 ? "0" + dd.getMinutes() : dd.getMinutes() );
  second = (dd.getSeconds() < 10 ? "0" + dd.getSeconds() : dd.getSeconds() );
  return year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + second;
}

/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0
 * LastModified: Dec 25 1999
 * This library is free.  You can redistribute it and/or modify it.
 */

/*
 * Interfaces:
 * b64 = base64encode(data);
 * data = base64decode(b64);
 */


var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64DecodeChars = new Array(
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if(i == len)
        {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if(i == len)
        {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
            out += base64EncodeChars.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
        out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}

function base64decode(str) {
    var c1, c2, c3, c4;
    var i, len, out;

    len = str.length;
    i = 0;
    out = "";
    while(i < len) {
	/* c1 */
	do {
	    c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
	} while(i < len && c1 == -1);
	if(c1 == -1)
	    break;

	/* c2 */
	do {
	    c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
	} while(i < len && c2 == -1);
	if(c2 == -1)
	    break;

	out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

	/* c3 */
	do {
	    c3 = str.charCodeAt(i++) & 0xff;
	    if(c3 == 61)
		return out;
	    c3 = base64DecodeChars[c3];
	} while(i < len && c3 == -1);
	if(c3 == -1)
	    break;

	out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

	/* c4 */
	do {
	    c4 = str.charCodeAt(i++) & 0xff;
	    if(c4 == 61)
		return out;
	    c4 = base64DecodeChars[c4];
	} while(i < len && c4 == -1);
	if(c4 == -1)
	    break;
	out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
}

