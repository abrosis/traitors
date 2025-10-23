// client.js (inside public folder)

const socket = io('http://localhost:8080');
let playerId = null;
let playerPhoto = null;
let playerAlive = true;
let gamePosition = null;
let players = null;

let qrcode = null;

const params = new URLSearchParams(window.location.search);
if (params.has('code')) {
  qrcode = params.get('code');
}

$(document).ready(function() { 
  if(qrcode){
    socket.emit('scarQR', qrcode);
  }

});

socket.on('claimed', (claimed) => {
 if(claimed){
  $('#unclaimed').hide();
  $('#claimed').fadeIn();
 }else{
  $('#claimed').hide();
  $('#unclaimed').fadeIn();
 }
});

function claimQR(playernumber) {
  socket.emit('claimQR', qrcode, playernumber);
}