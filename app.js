
/**
 * Module dependencies.
 */

var express = require('express')
  , os = require('os')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
var login = require('./routes/index');
app.post('/login',login.login);
app.get('/login', function(req, res){
        res.redirect('/');
});
app.get('/chat', routes.chat);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
console.log("Express server listening on port " + app.get('port'));
});

var socket = require('socket.io').listen(server);
socket.set("log level",1);

socket.on('connection', function(client) {
 // クライアントが接続したときの処理
 console.log(client.manager.roomClients);
 client.emit('loginusers',client.manager.roomClients );
 client.broadcast.emit('loginusers', client.manager.roomClients);

 client.on('login', function(event){
   client.emit('system', event.username + ' さんがログインしました');
   client.broadcast.emit('system', event.username + ' さんがログインしました');
 });

  // クライアントがメッセージを送信した時の処理
 client.on('message', function(event){
   console.log(event.username + ' says: ' + event.message);
   client.emit('message', event);
   client.broadcast.emit('message', event);
  });

  // クライアントが切断したときの処理
  client.on('disconnect', function(){
     console.log(client.store.Id + 'が切断しました。');
     client.broadcast.emit('system', client.store.id + ' さんがログアウトしました');
     client.broadcast.emit('loginusers', client.manager.roomClients);
  });
});


