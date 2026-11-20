// ===== HOME PAGE =====
// Brings the title screen to life:
//   - a short battle loops in front of the dungeon door (every hero gets a turn,
//     against a different monster each time), drawn with the sprite engine
//   - live numbers (questions, monsters, heroes, lessons)
//   - the top three players from the leaderboard
//   - a "welcome back" line for a player who exited to the title
(function(){
'use strict';

var showcase={hero:0,enemy:0,start:0,animId:null,order:[]};
var CYCLE=5200; // ms per hero-versus-monster round

function shuffle(list){
    var a=list.slice();
    for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}
    return a;
}
function enemies(){return MONSTERS.concat(BOSSES);}

// What each fighter is doing at time u (ms) into the round.
//   0     both appear
//   1100  hero attacks, monster flinches at 1100+hit
//   2600  hero attacks again, monster is defeated
//   3500  hero cheers
//   4700  both fade out, next round starts at 5200
function roundPoses(u,heroId){
    var ranged={scholar:1,wizard:1,healer:1,pirate:1}[heroId];
    var dur=ranged?900:880,k=ranged?0.22:0.32,hit=dur*k;
    var hero=null,enemy=null;
    if(u<450)hero={name:'spawn',p:u/450};
    else if(u>=1100&&u<1100+dur)hero={name:'attack',p:(u-1100)/dur,k:k};
    else if(u>=2600&&u<2600+dur)hero={name:'attack',p:(u-2600)/dur,k:k};
    else if(u>=3500&&u<4600)hero={name:'win',p:(u-3500)/1100};
    else if(u>=4700)hero={name:'spawn',p:1-Math.min(1,(u-4700)/500)}; // fades out the same way it came in
    if(u<450)enemy={name:'spawn',p:u/450};
    else if(u>=1100+hit&&u<1100+hit+420)enemy={name:'hurt',p:(u-1100-hit)/420};
    else if(u>=2600+hit)enemy={name:'die',p:Math.min(1,(u-2600-hit)/900)};
    return {hero:hero,enemy:enemy};
}

function setNames(){
    var hero=CHARACTERS[showcase.hero%CHARACTERS.length];
    var enemy=showcase.order[showcase.enemy%showcase.order.length];
    var hn=document.getElementById('home-hero-name'),en=document.getElementById('home-enemy-name');
    if(hn)hn.textContent=hero.name;
    if(en){en.textContent=enemy.name;en.classList.toggle('is-boss',BOSSES.indexOf(enemy)>=0);}
}

function frame(now){
    var screen=document.getElementById('title-screen');
    if(!screen||!screen.classList.contains('active')){showcase.animId=null;return;}
    showcase.animId=requestAnimationFrame(frame);
    if(document.hidden)return;
    if(now-(showcase.last||0)<33)return;
    showcase.last=now;
    if(!showcase.start)showcase.start=now;
    var u=now-showcase.start;
    if(u>=CYCLE){
        showcase.start=now;u=0;
        showcase.hero++;showcase.enemy++;
        setNames();
    }
    var hero=CHARACTERS[showcase.hero%CHARACTERS.length];
    var enemy=showcase.order[showcase.enemy%showcase.order.length];
    var p=roundPoses(u,hero.id),t=now/1000;
    SPR.drawTo(document.getElementById('home-hero-canvas'),'hero',hero.id,{t:t,pose:p.hero});
    SPR.drawTo(document.getElementById('home-enemy-canvas'),'enemy',enemy.id,{t:t,pose:p.enemy});
    // Sword and dagger fighters run across to the monster and back.
    var heroBox=document.querySelector('.home-fighter-hero'),enemyBox=document.querySelector('.home-fighter-enemy');
    if(heroBox&&enemyBox){
        var dash=0;
        if((hero.id==='knight'||hero.id==='rogue')&&p.hero&&p.hero.name==='attack'){
            var gap=enemyBox.getBoundingClientRect().left-heroBox.getBoundingClientRect().left-heroBox.offsetWidth*0.55;
            var q=p.hero.p,k=p.hero.k,out=Math.min(1,q/k),back=q>k+0.2?Math.min(1,(q-k-0.2)/0.3):0;
            dash=Math.max(0,gap)*(out*out)*(1-back);
        }
        heroBox.style.transform='translateX('+Math.round(dash)+'px)';
    }
    var stage=document.querySelector('.home-stage');
    if(stage){
        // the hero leans in when striking; the scene shakes on a defeat
        var shake=(u>2600+300&&u<2600+520)?((Math.floor(u/40)%2)?2:-2):0;
        stage.style.setProperty('--home-shake',shake+'px');
    }
}

window.startHomeShowcase=function(){
    if(typeof SPR==='undefined'||!document.getElementById('home-hero-canvas'))return;
    if(!showcase.order.length){
        // Floor 1 monsters first so a new player sees the easy ones early,
        // then the rest in a random order with the bosses mixed in.
        var list=enemies();
        showcase.order=list.filter(function(m){return m.floor===1;}).concat(shuffle(list.filter(function(m){return m.floor!==1;})));
        showcase.hero=Math.floor(Math.random()*CHARACTERS.length);
    }
    setNames();
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){
        // Still pictures for players who turn animation off.
        SPR.drawTo(document.getElementById('home-hero-canvas'),'hero',CHARACTERS[showcase.hero%CHARACTERS.length].id,{t:0});
        SPR.drawTo(document.getElementById('home-enemy-canvas'),'enemy',showcase.order[showcase.enemy%showcase.order.length].id,{t:0});
        return;
    }
    if(!showcase.animId){showcase.start=0;showcase.animId=requestAnimationFrame(frame);}
};

window.updateHomeCounts=function(){
    function set(id,value){var el=document.getElementById(id);if(el)el.textContent=String(value);}
    if(Array.isArray(QUESTIONS)&&QUESTIONS.length)set('home-count-questions',QUESTIONS.length);
    set('home-count-monsters',MONSTERS.length+BOSSES.length);
    set('home-count-heroes',CHARACTERS.length);
    var lessons=document.querySelectorAll('#learn-screen .learn-card').length;
    if(lessons)set('home-count-lessons',lessons);
};

window.renderHomeTopCoders=function(){
    var box=document.getElementById('home-top-coders'),list=document.getElementById('home-top-list');
    if(!box||!list)return;
    fetch('/api/leaderboard').then(function(res){return res.json();}).then(function(data){
        var rows=(data&&data.status==='ok'&&Array.isArray(data.leaderboard))?data.leaderboard.slice(0,3):[];
        if(!rows.length){box.hidden=true;return;}
        var medals=['1ST','2ND','3RD'];
        list.innerHTML=rows.map(function(row,i){
            return '<span class="home-top-row rank-'+(i+1)+'"><i>'+medals[i]+'</i>'+escapeHtml(row.name)+'<em>'+(Number(row.score)||0)+'</em></span>';
        }).join('');
        box.hidden=false;
    }).catch(function(){box.hidden=true;});
};

window.updateHomeWelcome=function(){
    var el=document.getElementById('home-welcome');if(!el)return;
    var name=typeof returningPlayerName==='string'?returningPlayerName:'';
    el.hidden=!name;
    el.textContent=name?'Welcome back, '+name+'. Your run is saved.':'';
};

function refreshHome(){
    if(typeof startHomeBackground==='function')startHomeBackground();
    updateHomeCounts();updateHomeWelcome();renderHomeTopCoders();startHomeShowcase();
}
window.refreshHome=refreshHome;

// Refresh whenever the player comes back to the title screen.
var baseShowScreen=window.showScreen;
window.showScreen=function(id){
    var result=baseShowScreen.apply(this,arguments);
    if(id==='title-screen')refreshHome();
    // login, hero select, How to Play and Study Materials share the home scene
    else if(typeof startHomeBackground==='function')startHomeBackground();
    return result;
};

// Numbers can change once the question bank arrives from the server.
var baseLoad=window.loadQuestionsFromServer;
if(typeof baseLoad==='function'&&!baseLoad.homeWrapped){
    window.loadQuestionsFromServer=function(){
        var out=baseLoad.apply(this,arguments);
        if(out&&typeof out.then==='function')out.then(updateHomeCounts,updateHomeCounts);
        return out;
    };
    window.loadQuestionsFromServer.homeWrapped=true;
}
var waited=0,poll=setInterval(function(){
    waited++;
    if((Array.isArray(QUESTIONS)&&QUESTIONS.length)||waited>40){clearInterval(poll);updateHomeCounts();}
},250);

refreshHome();
})();
