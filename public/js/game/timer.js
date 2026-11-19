// ===== QUESTION TIMER =====
var timerTotal=TIMER_MAX,timerPaused=false;

function startTimer(){
    stopTimer();
    var extraTime=(buffTime>0)?10:0;
    timeLeft=TIMER_MAX+extraTime;
    timerTotal=timeLeft;
    var fill=document.getElementById('timer-fill'),text=document.getElementById('timer-text');
    if(!fill||!text)return;
    fill.style.width='100%';fill.className='timer-bar-fill';
    text.textContent=timeLeft+'s';text.className='timer-text';
    runTimerTicks();
}

// One tick per second, counting down from the current timeLeft.
function runTimerTicks(){
    var fill=document.getElementById('timer-fill'),text=document.getElementById('timer-text');
    if(!fill||!text)return;
    var totalTime=timerTotal;
    timerInterval=setInterval(function(){
        timeLeft--;
        var pct=(timeLeft/totalTime)*100;
        fill.style.width=pct+'%';
        text.textContent=timeLeft+'s';
        fill.className='timer-bar-fill';
        text.className='timer-text';
        if(timeLeft<=10){fill.classList.add('danger');text.classList.add('danger');}
        else if(timeLeft<=15){fill.classList.add('warning');}
        if(timeLeft<=0){stopTimer();timerExpired();}
    },1000);
}

function stopTimer(){timerPaused=false;if(timerInterval){clearInterval(timerInterval);timerInterval=null;}}

// Settings pauses the question so the player does not lose time (or HP) while
// changing volume or text size. Resume carries on from the same second.
function pauseTimer(){
    if(!timerInterval)return;
    clearInterval(timerInterval);timerInterval=null;
    timerPaused=true;
}

function resumeTimer(){
    if(!timerPaused)return;
    timerPaused=false;
    var game=document.getElementById('game-screen');
    if(answered||!currentQuestion||!game||!game.classList.contains('active'))return;
    if(timeLeft<=0){timerExpired();return;}
    runTimerTicks();
}

function timerExpired(){
    if(answered)return;
    var wrongIdx=(currentQuestion.answer===0)?1:0;
    selectAnswer(wrongIdx);
    updateSpeech('TOO SLOW!');
}

