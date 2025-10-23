// server.js
const express = require('express');
const socketIo = require('socket.io');
const fs = require('fs');
const cors = require('cors');
// const isLive = false;

// if(isLive) {
//   const http = require('http');
//   const app = express();
//   const server = http.createServer(app);
//   const io = socketIo(server, {
//       cors: {
//           origin: "https://abrosis.com",
//           methods: ["GET", "POST"]
//       }
//   });
  
//   app.use(cors({ origin: "https://abrosis.com" }));
// }else{
  
  const http = require('http');
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);

  app.use(express.static('public'));
// }



let players = {};
let gamePosition = {    
  game: 'playerName',
  players: {},
  prizeTotal: 0,
  screen: 0,
  json: {},
};

let qrcodes = {
  '1000': '',
  '2000': '',
  '3000': '',
  '4000': '',
  '5000': '',
  '6000': '',
  '7000': '',
  '8000': '',
  '9000': '',
  '10000': '',
}



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

  
  // Vote for a player
  socket.on('scarQR', (code) => {
    if(qrcodes[code]==''){
      io.emit('claimed', false);
    }else{
      io.emit('claimed', true);
    }
  });
  
  // Vote for a player
  socket.on('claimQR', (code, playerNumber) => {
    if(qrcodes[code]==''){
      qrcodes[code] = playerNumber;
      io.emit('claimed', true);
    }else{
      io.emit('claimed', false);
    }
  });

  // Vote for a player
  socket.on('getResurrectionResults', () => {


    let totalCodes = 0;
    let codeCounts = {"Player 1": 0, "Player 2": 0, "Player 3": 0};

    Object.values(qrcodes).forEach(code => {
      if (code) {
        totalCodes++;
        codeCounts[code]++;
      }
    });

    let codePercentages = {};
    Object.keys(codeCounts).forEach(code => {
      codePercentages[code] = (codeCounts[code] / totalCodes) * 100;
    });

    io.emit('resurrectionResults', codePercentages);
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
  
  socket.on('addMoney', () => {
    gamePosition.prizeTotal += 1000;
    io.emit('updateMoney', gamePosition.prizeTotal);
  });
  
  socket.on('removeMoney', () => {
    gamePosition.prizeTotal -= 1000;
    io.emit('updateMoney', gamePosition.prizeTotal);
  });

  socket.on('getGame', () => {
    console.log('Updating user game position');
    io.emit('gameUpdate', gamePosition);
  });

  socket.on('nextBetraylQuestion', () => {
    io.emit('nextBetraylQuestion');
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
  socket.on('prevPage', () => {
    prevPage();
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
      let maxVotes = 0;
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
      
      io.emit('updatePlayers', players);
    }

    io.emit('gameStart', gamePosition);
}

function nextScreen(){
  console.log('nextScreen');
  gamePosition.screen = gamePosition.screen+1;
  console.log(gamePosition.screen);
  io.emit('changeScreen', gamePosition.screen);

}
function prevPage(){
  console.log('prevPage');
  io.emit('prevPageForPlayer');
}

function calculatePlayerboard(){
  let playerboard = [];
  Object.keys(players).forEach((id) => {
    playerboard.push({id: id, name: players[id].name, photo: players[id].photo, alive: players[id].alive});
  });
  return playerboard;
}

server.listen(8080, '0.0.0.0', () => console.log('Server listening on port 8080'));