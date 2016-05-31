(function () {
  var adminRoom = document.querySelector(".adminRoomList");
  var admRmLst = document.querySelector(".admRooms");
  var admUsrLst = document.querySelector(".admUsers");
  //var chatServerHostName = 'http://192.168.1.1:3000';
  var chatServerHostName = 'localhost';

  function doRequest(method, url, data, callback) {
    'use strict';
    var x = new XMLHttpRequest();
    x.open(method, url);
    x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    if (data) {
      x.send(data);
    } else {
      x.send();
    }
    x.addEventListener('readystatechange', function listReq() {
      if (x.readyState === x.DONE) {
        callback(x);
      }
    });
  }

  function doRequestJSON(method, url, data, callback) {
    'use strict';
    var x = new XMLHttpRequest();
    x.open(method, url);
    x.setRequestHeader('Content-Type', 'application/json');
    if (data) {
      x.send(data);
    } else {
      x.send();
    }
    x.addEventListener('readystatechange', function listReq() {
      if (x.readyState === x.DONE) {
        callback(x);
      }
    });
  }

  function createUserList(data) {
    var usersIn = data.usersIn;
    admUsrLst.innerHTML = '';
    for (var i = 0; i < usersIn.length; i++) {
      var a = document.createElement('a');
      var x = document.createElement('a');
      a.textContent = usersIn[i].name;
      x.textContent = 'X';
      a.setAttribute('href', '#');
      a.setAttribute('id', usersIn[i].user_id);
      x.setAttribute('href', '#');
      x.setAttribute('id', usersIn[i].user_id);
      a.setAttribute('class', 'list-group-item admUser');
      x.setAttribute('class', 'delete');
      admUsrLst.appendChild(a);
      a.appendChild(x);
    }

    var p = document.createElement('a');
    var s = document.createElement('span');
    s.textContent = '+';
    s.classList.add('symbol_toggle');
    p.setAttribute('href', '#');
    p.setAttribute('class', 'list-group-item of_addUser');
    admUsrLst.appendChild(p);


    var form = document.createElement('form');
    var button = document.createElement('button');
    button.textContent = 'Add User';
    form.classList.add('form-group', 'form-inline', 'form-add-user', 'hide');
    button.classList.add('btn', 'btn-primary');

    $(form).attr('name', 'addUser');
    $(form).append('<input type="text" name="user_name" class="sqsEnabled yui-ac-input" id="user_name" value="" >');
    $(form).append('<input type="hidden" name="user_id" class="sqsEnabled yui-ac-input" id="user_id" value="" >');
    $(form).append('<button type="button" name="btn_user_name" id="btn_user_name" title="Select User" class="button firstChild" value="Select User" ' +
      'onclick=\'open_popup("Users", 600, 400, "", true, false, {"call_back_function":"set_return","form_name":"addUser","field_to_name_array":{"id":"user_id","user_name":"user_name"}}, "single", true);\'>' +
      '<img src="themes/default/images/id-ff-select.png"></button>');
    form.appendChild(button);
    p.appendChild(form);
    p.appendChild(s);


    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!$('#user_id').val())
        return;
      console.log('User ' + $('#user_id').val() + ' Room ' + admUsrLst.id);
      var name = JSON.stringify({
        'user_id': $('#user_id').val(),
        'user_name': $('#user_name').val(),
        'room_id': admUsrLst.id
      });
      doRequestJSON('PUT', chatServerHostName + '/room', name, function (r) {
        if (r.status === 200) {
          createUserList(JSON.parse(r.responseText));
        } else {
          console.log('error');
        }
      });
    });
  }

  function createRoomList(data) {
    admRmLst.innerHTML = '';
    for (var i = 0; i < data.length; i++) {
      var a = document.createElement('a');
      var x = document.createElement('a');
      a.textContent = data[i].room_name;
      x.textContent = 'X';
      a.setAttribute('href', '#');
      a.setAttribute('id', data[i].room_id);
      x.setAttribute('href', '#');
      x.setAttribute('id', data[i].room_id);
      a.setAttribute('class', 'list-group-item admRoom');
      x.setAttribute('class', 'delete');
      admRmLst.appendChild(a);
      a.appendChild(x);
    }
    var p = document.createElement('a');
    var s = document.createElement('span');
    s.textContent = '+';
    s.classList.add('symbol_toggle');
    p.setAttribute('href', '#');
    p.setAttribute('class', 'list-group-item of_addRoom');
    admRmLst.appendChild(p);
    var form = document.createElement('form');
    var input = document.createElement('input');
    var button = document.createElement('button');
    input.setAttribute('placeholder', 'New room name...');
    button.textContent = 'Add Room';
    form.classList.add('form-group', 'form-inline', 'form-add-room', 'hide');
    input.classList.add('form-control');
    button.classList.add('btn', 'btn-primary');
    form.appendChild(input);
    form.appendChild(button);
    p.appendChild(form);
    p.appendChild(s);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!input.value)
        return;
      console.log(input.value);
      var name = JSON.stringify({'room_name': input.value});
      doRequestJSON('POST', chatServerHostName + '/room', name, function (r) {
        if (r.status === 200) {
          createRoomList(JSON.parse(r.responseText));
        } else {
          console.log('error');
        }
      });
    });
  }

  function createAdminBlock() {
    adminRoom.style.display = 'block';
    createListeners();
    doRequest('GET', chatServerHostName + '/room', null, function (r) {
      if (r.status === 200) {
        createRoomList(JSON.parse(r.responseText));
      } else {
        console.log('error');
      }
    });
  }

  function createListeners() {

    admRmLst.addEventListener('click', function (e) {
      e.stopPropagation();
      console.log('roomsclick');
      if (e.target.className === 'list-group-item admRoom') {
        doRequest('GET', chatServerHostName + '/room/' + e.target.id, null, function (r) {
          if (r.status === 200) {
            createUserList(JSON.parse(r.responseText));
            admUsrLst.setAttribute('id', e.target.id);
          } else {
            console.log('error');
          }
        });
      }
      if (e.target.className === 'delete') {
        //var room =
        doRequest('DELETE', chatServerHostName + '/room/' + e.target.id, null, function (r) {
          if (r.status === 200) {
            createRoomList(JSON.parse(r.responseText));
          } else {
            console.log('error');
          }
        });
      }

      if (e.target.className === 'list-group-item of_addRoom' || e.target.className === 'symbol_toggle') {
        var span = admRmLst.querySelector('.symbol_toggle');
        var form = admRmLst.querySelector('.form-add-room');
        if (form.classList.contains('hide')) {
          span.textContent = '^';
          form.classList.remove('hide');
        } else {
          span.textContent = '+';
          form.classList.add('hide');
        }
      }
    });

    admUsrLst.addEventListener('click', function (e) {
      e.stopPropagation();
      console.log('usersclick');
      if (e.target.className === 'delete') {
        console.log(' Room ' + admUsrLst.id);
        doRequestJSON('DELETE', chatServerHostName + '/room/user/' + e.target.id, JSON.stringify({'room_id': admUsrLst.id}), function (r) {
          if (r.status === 200) {
            createUserList(JSON.parse(r.responseText));
          } else {
            console.log('error');
          }
        });
      }

      if (e.target.className === 'list-group-item of_addUser' || e.target.className === 'symbol_toggle') {
        var span = admUsrLst.querySelector('.symbol_toggle');
        var form = admUsrLst.querySelector('.form-add-user');
        if (form.classList.contains('hide')) {
          span.textContent = '^';
          form.classList.remove('hide');
        } else {
          span.textContent = '+';
          form.classList.add('hide');
        }
      }
    });

  }

  createAdminBlock();
})();