node-chat
=========

node.jsで作ったチャット



mongoDB
--------
mongoDBのインストールが行われていない場合はインストールが必要

linux(64bit)の場合

    wget http://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.4.1.tgz
    tar zxvf mongodb-linux-x86_64-2.4.1.tgz

起動
とりあえず動かすだけなら --nojournal --smallfiles　をつけないと3GBほどのファイルが作られちゃいます

    mkdir -p /path/to/db
    cd mongodb-linux-x86_64-2.4.1
    ./bin/mongod --dbpath /path/to/db/ --nojournal --smallfiles


Install
--------
    npm install

node_chatの起動
--------
    node app.js

