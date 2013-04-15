
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', {
	title: 'Express'
  });
};

exports.chat = function(req, res){
	var result = {
		title: 'ChatRoom',
	};
	req.session.username = req.body.username; // httpセッションにユーザ名を格納
	res.render('chat', result);
};


