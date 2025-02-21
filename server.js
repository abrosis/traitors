// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};
let gamePosition = {    
  game: 'playerName',
  players: {},
  screen: 0,
  json: {},
};


app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New client connected');

  
  // Check if player exists, if not, send empty so they can create a new player
  socket.on('checkPlayer', (playerId) => {
    let playerExists = false;
    if(players[playerId]){
      playerExists = true;
      io.emit('playerCheck', {playerExists: true, playerId: playerId, playerAlive: players[playerId].alive, playerPhoto: players[playerId].photo});
    }else{
      io.emit('playerCheck', {playerExists: false, playerId: playerId});
    }
  });

  // Once we know player exists, send the game data
  socket.on('getGameforPlayer', (playerId) => {
    console.log('Updating user game position');
    io.emit('gameUpdateforPlayer', {'playerId': playerId, ...gamePosition} );
  });

  // Add the player the user sends
  socket.on('addPlayer', (player) => {
    players[player.id] = {name: player.name, photo: player.photo, alive: true, votes: 0};
    gamePosition.players = players;
    io.emit('updatePlayers', players);
    io.emit('gameUpdateforPlayer', {'playerId': player.id, ...gamePosition} );
  });

  
  // Vote for a player
  socket.on('voteForPlayer', (playerid) => {
    players[playerid].votes++; 
    io.emit('updatePlayers', players);
  });

  // Fire Pit Functions
  
  socket.on('gameContinue', (game) => {
    io.emit('firepitContinue');
  });

  socket.on('gameEnd', (game) => {
    io.emit('firepitEnd');
  });


  
  socket.on('startGame', (game) => {
    startGame(game);
  });

  socket.on('getGame', () => {
    console.log('Updating user game position');
    io.emit('gameUpdate', gamePosition);
  });



  
  socket.on('removePlayer', (playerId) => {
    console.log('Removing Player ' + playerId );
    delete players[playerId];
    io.emit('updatePlayers', players);
  });
  
  
  socket.on('toggleAlive', (playerId) => {
    console.log('Toggling alive for Player ' + playerId );
    players[playerId].alive = !players[playerId].alive;
    io.emit('updatePlayers', players);
  });


  socket.on('getPlayers', () => {
    console.log('Getting Players');
    io.emit('updatePlayers', players);
  });

  socket.on('clearPlayers', () => {
    players= {};
    io.emit('updatePlayers', {});
  });


  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('nextScreen', () => {
    nextScreen();
  });
});


function startGame(game){
  console.log('Starting game ' + game);
    gamePosition.game = game;
    gamePosition.players = players;
    gamePosition.screen = 0;
    gamePosition.json = {};
    
    if(game == 'vote'){
      Object.keys(players).forEach((id) => {
        players[id].votes = 0;
      });
      gamePosition.players = players;
    }

    if (game == 'firepit' || game == 'bedtime' || game == 'murder') {
      let maxVotes = -1;
      let playerToEliminate = null;

      Object.keys(players).forEach((id) => {
        if (players[id].votes > maxVotes) {
          maxVotes = players[id].votes;
          playerToEliminate = id;
        }
      });

      if (playerToEliminate) {
        players[playerToEliminate].alive = false;
      }
      
      Object.keys(players).forEach((id) => {
        players[id].votes = 0;
      });
    }

    io.emit('gameStart', gamePosition);
}

function nextScreen(){
  console.log('nextScreen');
  gamePosition.screen = gamePosition.screen+1;
  console.log(gamePosition.screen);
  io.emit('changeScreen', gamePosition.screen);

}

function calculatePlayerboard(){
  let playerboard = [];
  Object.keys(players).forEach((id) => {
    playerboard.push({id: id, name: players[id].name, photo: players[id].photo, alive: players[id].alive});
  });
  return playerboard;
}

server.listen(8080, () => console.log('Server listening on port 8080'));