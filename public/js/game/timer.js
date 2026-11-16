// ===== QUESTION TIMER =====
function startTimer(){
    stopTimer();
    var extraTime=(buffTime>0)?10:0;
    timeLeft=TIMER_MAX+extraTime;
    var totalTime=timeLeft;
    var fill=document.getElementById('timer-fill'),text=document.getElementById('timer-text');
    if(!fill||!text)return;
    fill.style.width='100%';fill.className='timer-bar-fill';
    text.textContent=timeLeft+'s';text.className='timer-text';
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

function stopTimer(){if(timerInterval){clearInterval(timerInterval);timerInterval=null;}}

function timerExpired(){
    if(answered)return;
    var wrongIdx=(currentQuestion.answer===0)?1:0;
    selectAnswer(wrongIdx);
    updateSpeech('TOO SLOW!');
}

