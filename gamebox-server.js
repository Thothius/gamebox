
// Initializing app to be the function handler
var app = require('express')();

// Initializing http server(app)
var http = require('http').Server(app);

// import socket.io
var io = require('socket.io')(http);

// For unique id generation
var uuid = require('node-uuid');



// We define a route handler / that gets called when we start the app
app.get('/', function(req, res){
	// The HTTP request gets sent back our chat app page
	res.sendFile(__dirname + '/gamebox.html');
});

// We make the http server listen on port 3000.
http.listen(3030, function(){
	// Prints out what port we are listening on.
	console.log('Listening on port 3030');
});

// ROOMS AND USERS

var userlist = [""];
var roomslist = ["Lobby", "Rock Paper Scissors", "Test"];
var clientNumber;
var rps_count = 0;

io.on('connection', function(socket){


// usernames which are currently connected to the chat
// rooms which are currently available in chat

		//************* NEW USER ********************
		socket.on('new user', function(username){

			for(var i=0; i<userlist.length; i++) {
				var check = username.toUpperCase();
				if(check == "" || check == " " || userlist[i] == check){
				//console.log("User " + username + " has empty name.");
				socket.emit('username error');
				return;
			}
		}

		userlist.push(username);
		console.log("Got user " + username);
		socket.username = username;
		socket.room = "Lobby";
		console.log("Adding " + socket.username + " to user list");
		socket.join(socket.room);
		var usercount = io.sockets.sockets;

		console.log("Global user count is " + Object.keys(usercount).length);	
		updateUserlist();
		updateRoomlist();
		io.sockets.in(socket.room).emit('message to client', "GameBox Server", "User " + socket.username+" connected to " + socket.room);
		io.sockets.in(socket.room).emit('message to client', " ", Object.keys(usercount).length +" users currently online in " + socket.room);

	});


		//************* JOIN ROOM ********************
		socket.on('join room', function (room) {

			console.log(socket.username + " left " + socket.room);
			socket.leave(socket.room);
			var oldroom = socket.room;
			// If old room was RPS room
			if(socket.room == "Rock Paper Scissors"){
			var room = io.sockets.adapter.rooms["Rock Paper Scissors"];
			rps_count -=1;
			io.emit('rps room update',  rps_count, socket.username);
			}

			console.log(socket.username + " joined " + room);
			socket.room = room;
			socket.join(room);

			updateRoomlist();
			updateUserlist();
			io.sockets.in(oldroom,room).emit('message to client', "GameBox Server", "User "+socket.username+" left " + oldroom + " and joined " + room);

			// If room to join is RPS room
			if(room == "Rock Paper Scissors"){
			var room = io.sockets.adapter.rooms["Rock Paper Scissors"];
			rps_count +=1;
			io.emit('rps room update',  rps_count, socket.username);
			}


		});

		socket.on('create room', function (room) {

			for(var i=0; i<roomslist.length; i++) {

				if(room == "" || room == " "){
					io.sockets.in(socket.room).emit('message to client', "GameBox Server", socket.username + " just messed up with room creation. Room name can't be empty." );
					return;
				}
				if(roomslist[i] == room) {
					io.sockets.in(socket.room).emit('message to client', "GameBox Server",  socket.username+" just messed up with room creation. Room already exists." );
					return;
				}
			}

			console.log(socket.username + " created room " + room);
			io.sockets.in(socket.room).emit('message to client', socket.username, " created a new room called " + room);
			io.sockets.in(socket.room).emit('message to client', socket.username, " left from " + socket.room);
			socket.leave(socket.room);
			console.log(socket.username + " joined " + room);
			socket.room = room;
			socket.join(room);
			roomslist.push(room);
			updateRoomlist();
			updateUserlist();
			io.sockets.in(room).emit('message to client', "GameBox Server", socket.username+" connected to " + room);
		});


		//************* MESSAGES ********************
		socket.on('message to server', function (message) {
			io.sockets.in(socket.room).emit('message to client', socket.username, message);

		});


		//************* USER LIST UPDATE ********************
		function updateUserlist() {
			userlist = userlist.filter(function(v){return v!==''});
			io.emit('user list update', userlist);
			console.log("User List: " + userlist);
		}

		//************* ROOM LIST UPDATE ********************
		function updateRoomlist() {
			console.log("Room List: " + roomslist);
			roomslist = roomslist.filter(function(v){return v!==''});

		
			io.emit('room list update', roomslist);
		}


		//************* SOCKET DISCONNECT ********************
		socket.on('disconnect', function(){
			console.log(socket.username + " disconnected.");
			io.sockets.in(socket.room).emit('message to client', "GameBox Server", socket.username + " disconnected from " + socket.room);
			delete userlist[socket.username];

		

			for(var i=0; i<userlist.length; i++) {
				//console.log("Looking for username to delete.");
				if(userlist[i] == socket.username) {
					console.log("Deleting user " + socket.username);
					delete userlist[i];
				}
			}

			if(socket.room == "Rock Paper Scissors"){
			rps_count -= 1;
			console.log("Disconnect from RPS room. ["+rps_count+" users in room]");
			io.emit('rps room update',  rps_count, socket.username);
			}


			updateUserlist();
		}); 


		//************* SOCKET MANUAL DISCONNECT ********************
		socket.on('manual disconnect', function(username){
			console.log("Manual disconnect by " + socket.username);
			io.sockets.in(socket.room).emit('message to client', "GameBox Server", socket.username +" disconnected from " + socket.room);
			delete userlist[socket.username];


			for(var i=0; i<userlist.length; i++) {
				//console.log("Looking for username to delete.");
				if(userlist[i] == socket.username) {
					console.log("Deleting user " + socket.username);

					//delete userlist[userlist[i]];
					delete userlist[i];
				}
			}


			if(socket.room == "Rock Paper Scissors"){
			rps_count -= 1;
			console.log("Disconnect from RPS room. ["+rps_count+" users in room]");
			io.emit('rps room update',  rps_count, socket.username);
			}

			updateUserlist();  
		});



		




		
// **** END TAG FOR io.on('connection', function(socket){
});



