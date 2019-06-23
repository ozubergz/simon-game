class SoundEffects {
  
  constructor(context) {
    this.context = context;
  }
  
  init() {
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();
    
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.type = 'sine';
  }

  play(value, time = this.context.currentTime) {
    this.init();
    this.oscillator.frequency.value = value;
    this.gainNode.gain.setValueAtTime(0.3, time);
    
    this.oscillator.start(time);
  }

  stop(time = this.context.currentTime) {
    this.gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
    this.oscillator.stop(time + 1);
  }
  
}

$(document).ready(() => {
  
  const game = {
    count: 0,
    sequence: 0,
    timer: 0,
    started: 0,
    on: false,
    possibleMoves: ["green", "red", "yellow", "blue"],
    mousdown: false,
    strictMode: false,
    currMoves: [],
    computerMoves:[],
    playerMoves: []
  }
  
  let context = new (window.AudioContext || window.webkitAudioContext)();
  let sound = new SoundEffects(context);
  
  $('#on-off').click(() => {
    game.on = $('#on-off').is(':checked');
    if(game.on) {
      turOnGame();
    } else {
      turnOffGame();
    }
  });
  
  $('#strict-btn').click((e) => {
    if(game.on) {
      if(!game.strictMode) {
        enableStrictMode()
      } else {
        disableStrictMode();
      }
    }
  });
  
  function enableStrictMode() {
    $('.strict-light').addClass('strict-on');
    game.strictMode = true;
  }
  
  function disableStrictMode() {
    $('.strict-light').removeClass('strict-on');
    game.strictMode = false;
  }
  
  function turOnGame() {
    $('#off').hide();
    $('#display-message').text('ON');
    enableStart();
  }

  function turnOffGame() {
    game.started = 0;
    $('#display-message').text('');
    $('#off').show();
    setTimeout(() => $('#off').hide(), 1200);
    disableStrictMode();
    disableStart();
    resetGame();
    disableClick();
  }
  
  function updateCount() {
    $('#display-message').text(game.count);
  }
  
  function clearPlayer() {
    game.playerMoves = [];
  }
  
  function disableStart() {
    $('#start-btn').off('click', startGame);
  }
  
  function enableStart() {
    $('#start-btn').on('click', startGame);
  }
  
  function disableClick() {
    $('.pad').removeClass('hover');
    $('.pad').off('mousedown', mouseDownEvent);
    $('.pad').off('mouseup', mouseUpEvent);
    $('.pad').off('mouseout', mouseOut);
  }
  
  function enableClick() {
    $('.pad').addClass('hover');
    $('.pad').on('mousedown', mouseDownEvent);
    $('.pad').on('mouseup', mouseUpEvent);
    $('.pad').on('mouseout', mouseOut);
  }
    
  function mouseDownEvent(e) {
    game.mousedown = true;
    e.preventDefault();
    let color = e.target.id;
    clearInterval(game.timer);
    timer(game.count);
    pressPad(color);
  }
  
  function mouseUpEvent(e) {
    if(game.mousedown) {
      game.mousedown = false;
      let color = e.target.id;
      $(`#${color}`).css('filter', 'brightness(65%)');
      sound.stop();
      playerTurn(color);
    }
  }
  
  function mouseOut(e) {
    let color = e.target.id;
    $(`#${color}`).css('filter', 'brightness(65%)');
    sound.stop();
  }
  
  function pressPad(color) {
    const freq = { green: 261.63, red: 329.63,
                  yellow: 349.23, blue: 372.00 };
    if(freq.hasOwnProperty(color) && game.on) {
      $(`#${color}`).css('filter', 'brightness(100%)');
      sound.play(freq[color]);
    }
  }
  
  function generateRandomSeq() {
    if(game.computerMoves.length === 20) {
      return game.computerMoves;
    } else {
      let moves = game.possibleMoves;
      let randomIndex = Math.floor(Math.random() * moves.length);
      game.computerMoves.push(moves[randomIndex]);
      return generateRandomSeq();
    }
  }
  
  function startGame() {
    if(game.on) {
      game.started++;
      if(game.started === 1) {
        game.count = 1;
        generateRandomSeq();
        game.currMoves = [game.computerMoves[0]];
        updateCount();
        computerTurn(game.count, game.currMoves);
      } else if(game.started > 1) {
        restartGame();
      }
    }
  }
  
  function restartGame() {
    resetGame();
    $('#display-message').text('RESTART');
    setTimeout(() => {
      game.count = 1;
      generateRandomSeq();
      game.currMoves = [game.computerMoves[0]];
      updateCount();
      computerTurn(game.count, game.currMoves);
    }, 2000);
  }
  
  function playerTurn(color) {
    game.playerMoves.push(color);
    if(checkMatch(color)) {
      if(game.count > 20) {
        gameOver(color);
      } else {
        clearPlayer();
        computerTurn(game.count, game.currMoves);
      }
    }
  }
  
  function error(str) {
    disableClick();
    clearInterval(game.timer);
    $('.pad').css('filter', 'brightness(65%)');
    $('#display-message').text(str);
    let errSound = new SoundEffects(context);
    errSound.play(130);
    setTimeout(() => {
      errSound.stop();
      $('#display-message').text(game.count);
    }, 1200);
  }
  
  function timer(count) {
    clearInterval(game.timer);
    
    let sec = 1;
    let limit = 6;
    
    if(count >= 6) limit = 5;
    if(count >= 13) limit = 4;
    if(count >= 18) limit = 3;
    
    game.timer = setInterval(() => {
      console.log(sec)
      if(sec === limit) { 
        clearInterval(game.timer);
        clearPlayer();
        sound.stop();
        error('??');
        incorrectMove();
      }
      sec++;
    }, 1000);
  }
  
  function computerTurn(count, colors) { 
    disableClick();
    clearInterval(game.timer);
    clearInterval(game.sequence);
      
    let clicked = 0;
    let intervalTime = 1200;


    if(count >= 6) intervalTime = 950;
    if(count >= 13) intervalTime = 750;
    if(count >= 18) intervalTime = 500;

     game.sequence = setInterval(() => {
       let color = colors[clicked];
       pressPad(color);
       let time = setTimeout(() => {
         sound.stop();
         $(`#${color}`).css('filter', 'brightness(65%)');
       }, intervalTime / 2);
       clicked++;
       if(clicked === count) {
         clearInterval(game.sequence);
         timer(count);
         setTimeout(() => enableClick(), intervalTime + 10);
       }
     }, intervalTime);
   }
  
  function incorrectMove() {
    if(game.strictMode) restartGame();
    setTimeout(() => {
      computerTurn(game.count, game.currMoves);
    }, 1200);
  }
  
  function checkMatch(color) {
    let indexLength = game.playerMoves.length;
    game.currMoves = game.computerMoves.slice(0, game.count);
    if(game.playerMoves[indexLength - 1] === game.currMoves[indexLength -1]) {
      if(indexLength === game.currMoves.length) {
        game.count = game.currMoves.length + 1;
        game.currMoves = game.computerMoves.slice(0, game.count);
        updateCount();
        return true;
      }
    } else {
      clearPlayer();
      disableClick();
      error('WRONG!');
      incorrectMove();
    }
  }
  
  
  function gameOver(color) {
    $('#display-message').text('WIN!');
    $('#display-message').addClass('blink');
    game.started = 0;
    disableClick();
    resetGame();
    let interval = setInterval(() => {
      pressPad(color);
      setTimeout(() => {
         sound.stop();
         $(`#${color}`).css('filter', 'brightness(65%)');
       }, 500 / 2);
    }, 500);
    setTimeout(() => {
      $('#display-message').removeClass('blink');
      clearInterval(interval);
    }, 2000);
  }
  
  function resetGame() {
    game.currMoves = [];
    game.computerMoves =[];
    game.count = 0;
    clearInterval(game.sequence);
    clearInterval(game.timer);
    clearPlayer();
  }
  
});











