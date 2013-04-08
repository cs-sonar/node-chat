
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', {
	title: 'Express'
  });
};

exports.login = function(req, res){
        var result = {
		title: 'ChatRoom',
		username: req.body.username
	};
        res.render('chat', result);
};

exports.chat = function(req, res){
  res.render('chat', {
	title: 'Chat Sample'
  });
};

