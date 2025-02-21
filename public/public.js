// client.js (inside public folder)

const socket = io('http://localhost:8080');
let playerId = null;
let playerPhoto = null;
let playerAlive = true;
let gamePosition = null;
let players = null;

let displayMode = false;

const params = new URLSearchParams(window.location.search);
if (params.has('display')) {
  document.body.classList.add('display-mode');
  displayMode = true;
  alert('DISPLAY MODE ON!');
}

$(document).ready(function() { 
  
  if(!displayMode){
    checkIfSessionExists();
  }else{
    changeGame('playerName', 0);
  }
});


  
function checkIfSessionExists() {
  console.log('Checking if session exists...');
  // check if session exists and update from server
  if (localStorage.getItem('playerId')) {
    playerId = localStorage.getItem('playerId');
    playerPhoto = localStorage.getItem('playerPhoto');
    playerAlive = localStorage.getItem('playerAlive');
    socket.emit('checkPlayer', playerId);
    return true;
  }
  // if no session exists, go to player name screen
  changeGame('playerName', 0);
}

//Server function to move unverified player to player name screen, or let them rejoin game
socket.on('playerCheck', (verification) => {
  console.log('Player check received: ' + verification.playerId + ' - ' + verification.playerExists);
  if(playerId == verification.playerId) {
    if(verification.playerExists == false){
      console.log('Player does not exist');
      playerId = null;
      playerAlive = true;
      playerPhoto = null;
      localStorage.removeItem('playerId');
      localStorage.removeItem('playerPhoto');
      localStorage.removeItem('playerAlive');
      changeGame('playerName', 0);
    }else{
      socket.emit('getGameforPlayer', playerId);
    }
  }
});

/* Update a single players position in the game */
socket.on('gameUpdateforPlayer', (newGamePosition) => {
  if(playerId == newGamePosition.playerId) {
    console.log('Game update received: ' + newGamePosition.game + ' - ' + newGamePosition.screen);
    if(!gamePosition || newGamePosition.game !== gamePosition.game || newGamePosition.screen !== gamePosition.screen) {
      gamePosition = newGamePosition;
      changeGame(gamePosition.game, gamePosition.screen);
    }
  }
});

  
/* Change Game */
function changeGame(game, screen) {
  $('game').removeClass('active');
  $('#' + game).addClass('active');

  console.log(gamePosition);
  
  let enterFunction = $('game:visible').attr('data-enter');
  let enterAudio = $('game:visible').attr('data-audio') ?? null;

  if(enterFunction) {
    window[enterFunction]();
  }

  if(enterAudio)  {
    playAudio(enterAudio);
  }

  changeScreen(screen);
}

/* Change Screen */
function changeScreen(screen) {
  $('game:visible screen').removeClass('active');
  $('game:visible screen[data-id="' + screen + '"]').addClass('active');

  let enterFunction = $('game:visible screen.active').attr('data-enter');

  if(enterFunction) {
    window[enterFunction]();
  }
}



/* Get Game */
function getGame() {
  console.log('Getting game position...');
  socket.emit('getGame');
}


function nextPage() {
  $('game:visible screen.active page').hide().next().show();
}

/* Game Changer */
socket.on('gameStart', (newGamePosition) => {
  gamePosition = newGamePosition;
  console.log('Game start received: ' + gamePosition.game + ' - ' + gamePosition.screen);
  changeGame(gamePosition.game, gamePosition.screen);
});

/* Game Update */
socket.on('gameUpdate', (gamePosition) => {
  console.log('Game update received: ' + gamePosition.game + ' - ' + gamePosition.screen);
  if(gamePosition.game !== currentGame) {
    changeGame(gamePosition.game, gamePosition.screen);
  }
});
/* Game Update */
socket.on('changeScreen', (screen) => {
  console.log('Game screen received: ' + screen);
  if(gamePosition.screen !== screen) {
    gamePosition.screen = screen;
    changeScreen(screen)
  }
});


/* Firepit continue */
socket.on('firepitContinue', () => {
  $('#' + gamePosition.game + ' video').addClass('continue');
  setTimeout(() => {
    $('#' + gamePosition.game + ' video').removeClass('continue');
  }, 3000);

  if (displayMode) {
    let firewooshAudio = new Audio('audio/firewoosh.mp3');
    firewooshAudio.volume = 0.75;
    firewooshAudio.play();
  }
});


/* Firepit end */
socket.on('firepitEnd', () => {
  $('#' + gamePosition.game + ' video').addClass('end');
  setTimeout(() => {
    $('#' + gamePosition.game + ' video').removeClass('end');
  }, 3000);

  
  if (displayMode) {
    let firewooshAudio = new Audio('audio/firewoosh.mp3');
    firewooshAudio.volume = 0.75;
    firewooshAudio.play();
  }
});








/* GAME FUNCTIONS
***************/


function playerName() {
 
 if(playerId && playerPhoto) {
  $('#playerPortrait').html('<img src="' + playerPhoto + '" />');
  nextPage();
 }else{
  
  /* Submit Player Name */ 
  $('.addPlayer').click(function() {
    let playerName = $('.playerName').val();
    let fileInput = document.getElementById('photoUpload');
    let file = fileInput.files[0];
    let reader = new FileReader();
    let base64String = null;


    reader.onloadend = function() {
      const img = new Image();
      img.src = reader.result;

      img.onload = function() {
        const canvas = document.createElement('canvas');
        const maxWidth = 800; // Set the maximum width
        const scaleSize = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        base64String = 'data:image/jpeg;base64,' + canvas.toDataURL('image/jpeg', 0.7).replace('data:', '').replace(/^.+,/, ''); // Adjust quality as needed

        if(!base64String) {
          alert('Please add a photo');
          return false;
        }
  
        if(playerName === '') {
          alert('Please enter your name');
          return false;
        }
  
        playerId = Math.random().toString(36).substr(2, 5);
        localStorage.setItem('playerId', playerId);
        localStorage.setItem('playerPhoto', base64String);
        $('#playerPortrait').html('<img src="' + base64String + '" />');
        nextPage();
        socket.emit('addPlayer', {'name': playerName, 'photo': base64String, 'alive': true, 'id': playerId});
      };

    };

    if(!file) {
      alert('Please add a photo');
      return false;
    }
    reader.readAsDataURL(file);
  });

 }
}


function generatePlayerboard() {
  $('.playerboard').empty();
  $.each(gamePosition.players, function(index, player) {
    $('.playerboard').append('<div class="playerCard animate__animated animate__fadeIn" style="animation-delay:'+index+'s;"><div class="playerPortraitBig player'+ (player.alive ? 'Alive' : 'Dead') +' "><img src="'+ player.photo+'" /></div><div class="playerNameplate">' + player.name + '</div></div>');
  });
}

function createScreen(index) {
  if($('#' + gamePosition.game + ' screen[data-id="'+index+'"]').length == 0) { 
    $('#' + gamePosition.game).append('<screen data-id="' + index + '"><page data-id="0"></page></screen>');
  }
}



function startTimer() {
  let countdown = 120; // 2 minutes in seconds

  const intervalId = setInterval(() => {
    countdown--;
  
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
  
    $('.timer').text(`0${minutes} : ${seconds < 10 ? '0' : ''}${seconds}`);
  
    if (countdown === 0) {
      clearInterval(intervalId);
    }
  }, 1000);
}

let bgAudioPlayer = null;
function playAudio(bgAudio) {
  if(!displayMode) { return; }
  if(bgAudioPlayer) { bgAudioPlayer.pause(); }
  bgAudioPlayer = new Audio('audio/' + bgAudio + '.mp3');
  bgAudioPlayer.play();
  if(bgAudio == 'bg'){
    bgAudioPlayer.loop = true;
    bgAudioPlayer.volume = 0.5;
  }
}

function startPit() {
  let videoElement = $('#' + gamePosition.game + ' video').get(0);
  if (videoElement) {
    videoElement.play();
  }

  if (gamePosition.players && gamePosition.players[playerId] && gamePosition.players[playerId].alive) {
    $('.bag').show();
    $('#' + gamePosition.game + ' h1').hide();
  }else{
    $('.bag').hide();
    $('#' + gamePosition.game + ' h1').show();
  }

  $('.bag-continue').click(function() {
    changeHueColor("Living room", "#FF0000", 3000);
    socket.emit('gameContinue', playerId);
  });

  $('.bag-end').click(function() {
    changeHueColor("Living room", "#00b300", 3000);
    socket.emit('gameEnd', playerId);
  });

}

function startVote(){
  $('.chalkboardbuttons').show();
  $('#drawingCanvas').removeClass('disabled');
  clearCanvas();
  $('.voteforplayer').empty();

  if(!gamePosition.players) {
    socket.emit('getGameforPlayer', playerId);
    return;
  }

  var i =1;
  $.each(gamePosition.players, function(index, player) {
    if(player.alive){
      $('.voteforplayer').append('<li data-vote="'+index+'" class="btn animate__animated animate__fadeIn" style="animation-delay:'+i+'s;">' + player.name + '</li>');
      i++;
    }
  });

  $('.voteforplayer').on('click', '[data-vote]', function() {
    let playerId = $(this).data('vote');
    if (confirm('Are you sure you want to vote for this player?')) {
      socket.emit('voteForPlayer', playerId);
      nextPage();
    }
  });

  $('.submitChalkboard').click(function(){
    $('.chalkboardbuttons').fadeOut();
    $('#drawingCanvas').addClass('disabled');
  });
}

function startMurderVideo() {
  if (displayMode) {
    let videoElement = $('#' + gamePosition.game + ' video').get(0);
    if (videoElement) {
      let playCount = 0;
      videoElement.addEventListener('ended', function() {
        playCount++;
        if (playCount < 5) {
          videoElement.play();
        }
      });
      $(videoElement).fadeIn(10000, function() {
        videoElement.play();
      });
    }
  }
}