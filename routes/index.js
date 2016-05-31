var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var HttpError = require('../error').HttpError;
var config = require('config');
var async = require('async');
var path = require('path');

router.get('/', function (req, res, next) {
  res.render('../public/index.html');
});

var options = {
  host: config.get('mysql_options.host'),
  port: config.get('mysql_options.port'),
  user: config.get('mysql_options.user'),
  password: config.get('mysql_options.password'),
  database: config.get('mysql_options.database')
};
var db = mysql.createConnection(options);

function sendAllRooms(cb) {
  db.query('select room_id, room_name from rooms where is_deleted = \'0\' and private = \'0\'', function (err, data) {
    if (err) cb(err);
    cb(null, data);
  });
}

function sendUsers(roomId, cb) {
  var result = {};
  db.query('select user_id from users2rooms where is_deleted = \'0\' and users2rooms.room_id=' + roomId, function (err, data) {
    if (err) cb(err);
    var userIds = data.map(function (x) {
      return x.user_id;
    });
    db.query('select user_id, name from users', function (err, users) {
      if (err) cb(err);
      result.usersIn = [];
      for (var i = 0; i < users.length; i++) {
        for (var j = 0; j < userIds.length; j++) {
          if (users[i].user_id == userIds[j]) {
            result.usersIn.push(users[i]);
          }
        }
      }
      cb(null, JSON.stringify(result));
    })
  })
}

function addNewUser(user_uuid, user_name, room_id, cb) {
  async.waterfall([
    function (cb) {
      if (user_uuid === '' || user_name === '' || room_id === '') {
        cb('Empty user data');
      } else {
        db.query('select user_id, name, is_deleted from users where uuid= \'' + user_uuid + '\'', function (err, fUser) {
          if (err) cb(err);
          cb(null, fUser);
        })
      }
    },
    function (fUser, cb) {
      db.query(
        'INSERT INTO users (name, uuid) ' +
        'VALUES (\'' + user_name + '\', \'' + user_uuid + '\') ' +
        'ON DUPLICATE KEY UPDATE name= \'' + user_name + '\', is_deleted = \'0\'',
        function (err, data) {
          if (err) cb(err);
          if (data.insertId === 0) {
            cb(null, fUser[0].user_id);
          } else {
            cb(null, data.insertId);
          }
        });
    },
    function (id, cb) {
      db.query(
        'INSERT INTO users2rooms (user_id, room_id) ' +
        'VALUES (\'' + id + '\', \'' + room_id + '\')' +
        'ON DUPLICATE KEY UPDATE is_deleted = \'0\'',
        function (err) {
          if (err) cb(err);
          db.query(
            'INSERT IGNORE INTO unread (user_id, room_id) ' +
            'VALUES (\'' + id + '\', \'' + room_id + '\')',
            function (err) {
              if (err) cb(err);
              cb();
            });
        });
    }
  ], function (err) {
    if (err) cb(err);
    cb();
  });
}

router.get('/room', function (req, res, next) {
  sendAllRooms(function (err, data) {
    if (err) next(err);
    res.status('200').send(data);
  });
});

router.post('/room', function (req, res, next) {
  db.query('insert into rooms (room_name) values (\'' + req.body.room_name + '\') ON DUPLICATE KEY UPDATE is_deleted = \'0\'', function (err) {
    if (err) next(err);
    sendAllRooms(function (err, data) {
      if (err) next(err);
      res.status('200').send(data);
    });
  })
});

router.delete('/room/:id', function (req, res, next) {
  if (req.params.id === '1') {
    res.status('403').send('Refuse to delete default room');
    return;
  }
  db.query('update rooms set is_deleted = \'1\' where room_id = \'' + req.params.id + '\'', function (err) {
    if (err) next(err);
    sendAllRooms(function (err, data) {
      if (err) next(err);
      res.status('200').send(data);
    });
  })
});

router.get('/room/:id', function (req, res, next) {
  sendUsers(req.params.id, function (err, data) {
    if (err) next(err);
    res.status('200').send(data);
  });
});

router.put('/room', function (req, res, next) {
  addNewUser(req.body.user_id, req.body.user_name, req.body.room_id, function (err) {
    if (err) next(err);
    sendUsers(req.body.room_id, function (err, data) {
      if (err) next(err);
      res.status('200').send(data);
    });
  });
});

router.delete('/room/user/:id', function (req, res, next) {
  db.query('update users2rooms set is_deleted = \'1\' where room_id = \'' + req.body.room_id + '\' and user_id = \'' + req.params.id + '\'', function (err) {
    if (err) next(err);
    sendUsers(req.body.room_id, function (err, data) {
      if (err) {
        next(err);
      }
      res.status('200').send(data);
    });
  })
});

router.all('*', function (req, res, next) {
  next(new HttpError(404));
});

module.exports = router;
