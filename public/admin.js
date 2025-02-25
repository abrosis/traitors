// client.js (inside public folder)

const socket = io('http://localhost:8080');
const form = document.getElementById('message-form');
const messageBox = document.getElementById('message-box');
const messages = document.getElementById('messages');
let buzzerPlayer = null

socket.on('updatePlayers', (players) => {
  $('.players').empty();
  console.log(players);
   Object.keys(players).forEach((id) => {
     $('.players').append(`<li><div class='player'><span><img src='${players[id].photo}' style='width:30px;height:40px'/></span><span>${id}</span><span>${players[id].name}</span> <span>Votes: ${players[id].votes}</span><div><button onclick='toggleAlive("${id}")'>${players[id].alive ? 'Alive' : 'Dead'}</button> <button onclick='removePlayer("${id}")'>Remove</button></div></div></li>`);
   });
 });

 socket.on('updateMoney', (total) => {
  $('fieldset legend').html('Prize total: £' + total);
 });

$(document).ready(() => {
  $('details').on('toggle', function() {
    if (this.open) {
      $('details').not(this).removeAttr('open');
      this.scrollIntoView({ behavior: 'smooth' });
    }
  });

  $('details button').on('click', function() {
    $('details button').removeClass('active');
    $(this).addClass('active');
    $(this).closest('details').addClass('active');
    $('details').not($(this).closest('details')).removeClass('active');
  });
});

document.querySelectorAll('[data-command]').forEach((button) => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    console.log(e.target.attributes['data-command'].value);
    socket.emit('startGame', e.target.attributes['data-command'].value);
  });
});

function clearPlayers() {
  console.log('Clearing players...');
  socket.emit('clearPlayers');
}

function getPlayers() {
  console.log('Getting players...');
  socket.emit('getPlayers');
}

function addMoney() {
  console.log('adding money...');
  socket.emit('addMoney');
}

function removeMoney() {
  console.log('removing money...');
  socket.emit('removeMoney');
}

function removePlayer(playerId) {
  console.log('Removing player ' + playerId);
  socket.emit('removePlayer', playerId);
}
function nextScreen() {
  console.log('Next Screen');
  socket.emit('nextScreen');
}
function prevPage() {
  console.log('Prev Page');
  socket.emit('prevPage');
}
function toggleAlive(playerId) {
  console.log('Switching team for ' + playerId);
  socket.emit('toggleAlive', playerId);
}