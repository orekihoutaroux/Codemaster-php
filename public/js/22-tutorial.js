// ===== 22. HOW TO PLAY =====
// Shown after ENTER DUNGEON, before the first battle. Every number below is
// taken from the game rules in 06-api-requests.js and 12-battle-progression.js;
// keep them in step if those rules change.
var tutorialIndex=0;
var tutorialOnFinish=null;   // what happens when the player finishes or skips
var tutorialFinishLabel='START BATTLE';

function tutorialPrefKey(){
    return 'codemaster_tutorial_hidden:'+String(playerUsername||'guest').toLowerCase();
}

function isTutorialHidden(){
    try{return localStorage.getItem(tutorialPrefKey())==='1';}catch(e){return false;}
}

function setTutorialHidden(hidden){
    try{
        if(hidden)localStorage.setItem(tutorialPrefKey(),'1');
        else localStorage.removeItem(tutorialPrefKey());
    }catch(e){}
}

function tutorialHeroStep(){
    var hero=selectedChar;
    var special=hero&&typeof CHARACTER_SPECIALS!=='undefined'?CHARACTER_SPECIALS[hero.id]:null;
    var heroName=hero?hero.name:'YOUR HERO';
    return {
        title:'YOUR HERO',
        visual:'<div class="tut-hero"><canvas id="tutorial-hero-canvas" width="96" height="96" aria-hidden="true"></canvas>'+
            '<div><div class="tut-hero-name">'+escapeHtml(heroName)+'</div>'+
            (hero?'<div class="tut-hero-passive">'+escapeHtml(hero.desc)+'</div><div class="tut-hero-stats">'+escapeHtml(hero.statLine||'')+'</div>':'')+
            '</div></div>'+
            '<div class="tut-charge" aria-hidden="true"><span></span><span></span><span></span><span></span><b>READY</b></div>',
        points:[
            '<b>Passive:</b> your hero\'s bonus works on every question, automatically.',
            special?'<b>Special skill &ndash; '+escapeHtml(special.name)+':</b> '+escapeHtml(special.desc):'<b>Special skill:</b> each hero has one powerful move.',
            'Every correct answer charges the skill <b>+25%</b>. After <b>4 correct answers</b> it\'s ready &ndash; press the skill button under your hero before you answer.'
        ]
    };
}

function getTutorialSteps(){
    return [
        {
            title:'CLEAR THE DUNGEON',
            visual:'<div class="tut-path" aria-hidden="true"><span class="tut-node">1</span><i></i><span class="tut-node">2</span><i></i><span class="tut-node">3</span><i></i><span class="tut-node boss">BOSS</span><i class="arrow"></i><span class="tut-node next">NEXT FLOOR</span></div>',
            points:[
                'Each floor has <b>3 monsters</b>, then a <b>boss</b>.',
                'Beat the boss to descend to the next floor. There are <b>5 bosses</b> to defeat.',
                'You fight by answering PHP questions &ndash; the better you know PHP, the harder you hit.'
            ]
        },
        {
            title:'ANSWER TO ATTACK',
            visual:'<div class="tut-timer" aria-hidden="true"><div class="tut-timer-fill"></div><span>30s</span></div>'+
                '<div class="tut-choices" aria-hidden="true"><div class="tut-choice good"><b>A</b>Correct &rarr; you strike</div><div class="tut-choice bad"><b>B</b>Wrong &rarr; you get hit</div></div>',
            points:[
                'You have <b>30 seconds</b> per question'+(selectedChar&&selectedChar.ability==='addTime'?' (<b>35</b> as the Scholar)':'')+'. Running out of time counts as a wrong answer.',
                '<b>Correct:</b> you attack the monster. Its DEF blocks part of your damage.',
                '<b>Wrong:</b> the monster attacks you and your streak resets. Each wrong answer in a row hits <b>2 harder</b> than the last.',
                'Tap an answer, or press <kbd>A</kbd>&ndash;<kbd>D</kbd> / <kbd>1</kbd>&ndash;<kbd>4</kbd>. Press <kbd>Enter</kbd> for the next encounter.'
            ]
        },
        {
            title:'POINTS, GOLD & LEVELS',
            visual:'<table class="tut-table"><thead><tr><th>Question</th><th>Points</th><th>Streak bonus</th><th>Gold</th></tr></thead><tbody>'+
                '<tr><td><span class="tut-diff easy">EASY</span></td><td>10</td><td>+5 &times; streak</td><td>3g</td></tr>'+
                '<tr><td><span class="tut-diff medium">MEDIUM</span></td><td>25</td><td>+2 &times; streak</td><td>8g</td></tr>'+
                '<tr><td><span class="tut-diff hard">HARD</span></td><td>50</td><td>+2 &times; streak</td><td>15g</td></tr>'+
                '</tbody></table>',
            points:[
                'Monsters ask <b>easy or medium</b> questions; bosses ask <b>hard</b> ones.',
                'Keep a <b>streak</b> of correct answers for bonus points (medium/hard bonus counts up to a 10 streak).',
                'Defeated monsters also drop gold. Your points are your EXP: <b>level 2 at 100</b>, and each level needs 20 more than the last. Every level adds <b>+10 max HP</b>.'
            ]
        },
        tutorialHeroStep(),
        {
            title:'BOSS FIGHTS',
            visual:'<div class="tut-boss" aria-hidden="true"><span class="tut-skull">&#9760;</span><div><b>BOSS SPECIAL ATTACK</b><small>Every 3rd wrong answer</small></div></div>',
            points:[
                'Bosses are tougher and only ask <b>hard</b> questions.',
                'Each boss has a special attack that lands on <b>every 3rd wrong answer</b> (the final boss: every 2nd). It hits harder and may heal the boss, drain your skill charge, or steal gold.',
                'Win and you get <b>full HP, +25 gold and +1 potion</b>, then descend to the next floor.'
            ]
        },
        {
            title:'STAY ALIVE',
            visual:'<div class="tut-items" aria-hidden="true"><div><span class="tut-icon heal">&#9829;</span>POTION<small>+30 HP</small></div><div><span class="tut-icon shop">&#9733;</span>SHOP<small>Spend gold</small></div><div><span class="tut-icon dead">&#10006;</span>0 HP<small>Run over</small></div></div>',
            points:[
                'Press <b>POTION</b> to heal 30 HP. You start with 2 and earn one per boss.',
                'Open the <b>SHOP</b> to buy healing and buffs (defence, double gold, crits, extra time) that last <b>3 questions</b>.',
                'If your HP hits <b>0</b> the run ends: your score goes on the <b>leaderboard</b> and you start again from floor 1.',
                'Stuck on a topic? <b>STUDY MATERIALS</b> on the home screen covers everything the questions ask.'
            ]
        }
    ];
}

function renderTutorialStep(){
    var steps=getTutorialSteps();
    tutorialIndex=Math.max(0,Math.min(steps.length-1,tutorialIndex));
    var step=steps[tutorialIndex];
    var body=document.getElementById('tutorial-body');
    if(body){
        body.innerHTML='<h2 class="tutorial-title" id="tutorial-heading">'+step.title+'</h2>'+
            '<div class="tutorial-visual">'+step.visual+'</div>'+
            '<ul class="tutorial-points">'+step.points.map(function(p){return '<li>'+p+'</li>';}).join('')+'</ul>';
        body.scrollTop=0;
    }
    var heroCanvas=document.getElementById('tutorial-hero-canvas');
    if(heroCanvas&&selectedChar){
        var ctx=heroCanvas.getContext('2d');ctx.imageSmoothingEnabled=false;
        ctx.clearRect(0,0,96,96);selectedChar.sprite.call(selectedChar,ctx,20,23,7,0);
    }
    var count=document.getElementById('tutorial-count');
    if(count)count.textContent='STEP '+(tutorialIndex+1)+' OF '+steps.length;
    var dots=document.getElementById('tutorial-dots');
    if(dots){
        dots.innerHTML=steps.map(function(s,i){
            return '<button type="button" role="tab" class="tutorial-dot'+(i===tutorialIndex?' active':'')+'" aria-selected="'+(i===tutorialIndex)+'" aria-label="Step '+(i+1)+': '+s.title+'" onclick="tutorialGoTo('+i+')"></button>';
        }).join('');
    }
    var back=document.getElementById('tutorial-back');
    if(back)back.disabled=tutorialIndex===0;
    var next=document.getElementById('tutorial-next');
    if(next){
        var last=tutorialIndex===steps.length-1;
        next.textContent=last?tutorialFinishLabel:'NEXT';
        next.classList.toggle('final',last);
    }
}

function tutorialGoTo(index){tutorialIndex=index;renderTutorialStep();}

function tutorialStep(delta){
    var total=getTutorialSteps().length;
    if(delta>0&&tutorialIndex>=total-1){finishTutorial();return;}
    tutorialIndex+=delta;
    renderTutorialStep();
}

// onFinish runs when the player finishes or skips. fromMenu=true when they
// opened it themselves (HOW TO PLAY) rather than on the way into a battle.
function openTutorial(onFinish,fromMenu){
    tutorialOnFinish=onFinish||null;
    tutorialFinishLabel=fromMenu?'GOT IT':'START BATTLE';
    tutorialIndex=0;
    var hide=document.getElementById('tutorial-hide-next');
    if(hide)hide.checked=isTutorialHidden();
    var skip=document.getElementById('tutorial-skip');
    if(skip)skip.textContent=fromMenu?'CLOSE':'SKIP';
    showScreen('tutorial-screen');
    renderTutorialStep();
    var next=document.getElementById('tutorial-next');
    if(next)next.focus();
}

function finishTutorial(){
    var hide=document.getElementById('tutorial-hide-next');
    if(hide)setTutorialHidden(hide.checked);
    var done=tutorialOnFinish;
    tutorialOnFinish=null;
    if(typeof done==='function')done();
}

function skipTutorial(){finishTutorial();}

// Called by startGame() once the account is saved: shows the tutorial first
// unless this player turned it off.
function enterDungeonWithTutorial(message){
    if(isTutorialHidden()){launchDungeon(message);return;}
    openTutorial(function(){launchDungeon(message);},false);
}

// HOW TO PLAY button on the hero screen: read it, then come back.
function openTutorialFromHeroSelect(){
    openTutorial(function(){showScreen('select-screen');},true);
}

document.addEventListener('keydown',function(e){
    var screen=document.getElementById('tutorial-screen');
    if(!screen||!screen.classList.contains('active'))return;
    var tag=(e.target&&e.target.tagName)||'';
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    if(e.key==='ArrowRight'){e.preventDefault();tutorialStep(1);}
    else if(e.key==='ArrowLeft'){e.preventDefault();if(tutorialIndex>0)tutorialStep(-1);}
    else if(e.key==='Escape'){e.preventDefault();skipTutorial();}
});
