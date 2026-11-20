// ===== HOME PAGE =====
// Brings the title screen to life:
//   - a short battle loops in front of the dungeon door (every hero gets a turn,
//     against a different monster each time), drawn with the sprite engine
//     the hero strikes, the monster strikes back, the hero finishes it (K.O.),
//     with hit bursts, slashes, bolts and damage numbers
//   - live numbers (questions, monsters, heroes, lessons)
//   - the top three players from the leaderboard
//   - a "welcome back" line for a player who exited to the title
(function(){
'use strict';

var showcase={hero:0,enemy:0,start:0,animId:null,order:[],fired:{},shakeUntil:0,shakeAmp:0};
var CYCLE=6400; // ms per hero-versus-monster round

function shuffle(list){
    var a=list.slice();
    for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}
    return a;
}
function enemies(){return MONSTERS.concat(BOSSES);}

// ---- the round ----
// What each fighter is doing at time u (ms) into the round:
//   0     both appear
//   1000  the hero attacks, the monster flinches
//   2400  the monster strikes back, the hero flinches
//   3800  the hero attacks again and the monster is defeated (K.O.)
//   4800  the hero cheers
//   5900  both fade out; the next round starts at 6400
var T={hero1:1000,monster:2400,hero2:3800,win:4800,fade:5900};
// Heroes that fight from a distance send a bolt in their colour; the knight
// and the hacker run across and slash.
var RANGED_HEROES={scholar:'#ffd43b',wizard:'#b47bff',healer:'#7dffb0',pirate:'#ff9a3c'};
function heroTiming(heroId){return RANGED_HEROES[heroId]?{dur:900,k:0.45}:{dur:880,k:0.32};}
// Monster timings come from the battle (game/battle.js); monsters listed in
// ENEMY_DASH_FACTORS attack from a distance, the rest run in.
function monsterTiming(id){
    var ms=(typeof ENEMY_ATTACK_TIMINGS!=='undefined'&&ENEMY_ATTACK_TIMINGS[id])||330;
    return {dur:1000,k:ms/1000};
}
function monsterIsRanged(id){return typeof ENEMY_DASH_FACTORS!=='undefined'&&!!ENEMY_DASH_FACTORS[id];}

function roundPoses(u,heroId,enemyId){
    var h=heroTiming(heroId),m=monsterTiming(enemyId),hHit=h.dur*h.k,mHit=m.dur*m.k;
    var hero=null,enemy=null;
    if(u<450)hero={name:'spawn',p:u/450};
    else if(u>=T.hero1&&u<T.hero1+h.dur)hero={name:'attack',p:(u-T.hero1)/h.dur,k:h.k};
    else if(u>=T.monster+mHit&&u<T.monster+mHit+420)hero={name:'hurt',p:(u-T.monster-mHit)/420};
    else if(u>=T.hero2&&u<T.hero2+h.dur)hero={name:'attack',p:(u-T.hero2)/h.dur,k:h.k};
    else if(u>=T.win&&u<T.fade-100)hero={name:'win',p:(u-T.win)/(T.fade-100-T.win)};
    else if(u>=T.fade)hero={name:'spawn',p:1-Math.min(1,(u-T.fade)/500)}; // fades out the same way it came in
    if(u<450)enemy={name:'spawn',p:u/450};
    else if(u>=T.hero1+hHit&&u<T.hero1+hHit+420)enemy={name:'hurt',p:(u-T.hero1-hHit)/420};
    else if(u>=T.monster&&u<T.monster+m.dur)enemy={name:'attack',p:(u-T.monster)/m.dur,k:m.k};
    else if(u>=T.hero2+hHit)enemy={name:'die',p:Math.min(1,(u-T.hero2-hHit)/900)};
    return {hero:hero,enemy:enemy,h:h,m:m,hHit:hHit,mHit:mHit};
}

function setNames(){
    var hero=CHARACTERS[showcase.hero%CHARACTERS.length];
    var enemy=showcase.order[showcase.enemy%showcase.order.length];
    var hn=document.getElementById('home-hero-name'),en=document.getElementById('home-enemy-name');
    if(hn)hn.textContent=hero.name;
    if(en){en.textContent=enemy.name;en.classList.toggle('is-boss',BOSSES.indexOf(enemy)>=0);}
}

// ---- attack effects ----
// Bursts, slashes, bolts and damage numbers are small elements added to
// .home-stage (in front of the door and the fighters; css/screens/home-stage.css)
// and removed when their animation ends.
function px(n){return Math.round(n)+'px';}
function rects(list,color){return list.map(function(r){return '<rect x="'+r[0]+'" y="'+r[1]+'" width="'+r[2]+'" height="'+r[3]+'" fill="'+color+'"/>';}).join('');}
var BURST_RAYS=[[7,0,2,3],[7,13,2,3],[0,7,3,2],[13,7,3,2],[2,2,2,2],[12,2,2,2],[2,12,2,2],[12,12,2,2],[4,1,1,1],[11,14,1,1],[1,11,1,1],[14,4,1,1]];
function burstSvg(color){
    return '<svg viewBox="0 0 16 16" shape-rendering="crispEdges">'+rects(BURST_RAYS,color)+rects([[5,5,6,6]],color)+rects([[6,6,4,4]],'#ffffff')+'</svg>';
}
function slashSvg(color){
    var band=[];for(var i=0;i<13;i++)band.push([i+1,13-i,3,1]);
    var edge=[];for(i=0;i<11;i++)edge.push([i+2,12-i,1,1]);
    return '<svg viewBox="0 0 16 16" shape-rendering="crispEdges">'+rects(band,color)+rects(edge,'#ffffff')+'</svg>';
}
function addFx(stage,cls,html,x,y,size,life){
    var el=document.createElement('div');
    el.className='home-fx '+cls;el.innerHTML=html||'';
    el.style.left=px(x);el.style.top=px(y);
    if(size){el.style.width=px(size);el.style.height=px(size);}
    stage.appendChild(el);
    setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},life);
    return el;
}
// Middle of a fighter's body, in px inside the stage. col = art column of the body.
function bodyPoint(stage,canvas,col){
    var s=uiRect(stage),r=uiRect(canvas); // layout pixels (js/core/ui-fit.js)
    return {x:r.left-s.left+r.width*col/64,y:r.top-s.top+r.height*40/64,unit:r.width/64};
}
function hitFx(stage,target,attacker,opts){
    var u=target.unit;
    addFx(stage,'home-fx-burst'+(opts.big?' big':''),burstSvg(opts.color),target.x,target.y,(opts.big?26:18)*u,520);
    if(opts.slash)addFx(stage,'home-fx-slash',slashSvg(opts.slash),target.x,target.y,20*u,340);
    var n=addFx(stage,'home-fx-dmg'+(opts.onHero?' on-hero':''),'',target.x+(opts.onHero?-4:4)*u,target.y-14*u,0,950);
    n.textContent=opts.text;
    if(opts.ko){var ko=addFx(stage,'home-fx-dmg ko','',target.x,target.y-26*u,0,1200);ko.textContent='K.O.!';}
    showcase.shakeUntil=performance.now()+(opts.big?260:170);showcase.shakeAmp=opts.big?4:2;
}
function boltFx(stage,from,to,color,ms,fromEnemy){
    var el=addFx(stage,'home-fx-bolt'+(fromEnemy?' from-enemy':''),'',from.x,from.y,Math.max(8,4*from.unit),ms+40);
    el.style.setProperty('--fx-color',color);
    var dx=to.x-from.x,dy=to.y-from.y;
    if(el.animate)el.animate([{transform:'translate(-50%,-50%)'},{transform:'translate(calc(-50% + '+px(dx)+'), calc(-50% + '+px(dy)+'))'}],{duration:ms,easing:'ease-in',fill:'forwards'});
}
// Runs fn once per round when the round reaches time t (skipped if the page
// was in the background and the moment is long gone).
function at(u,t,name,fn){
    if(showcase.fired[name]||u<t)return;
    showcase.fired[name]=true;
    if(u-t<250)fn();
}
function randomDamage(lo,hi){return lo+Math.floor(Math.random()*(hi-lo+1));}

function playRoundEffects(u,p,hero,enemy){
    var stage=document.querySelector('.home-stage');
    var hc=document.getElementById('home-hero-canvas'),ec=document.getElementById('home-enemy-canvas');
    if(!stage||!hc||!ec)return;
    var heroColor=RANGED_HEROES[hero.id]||'#ffd43b',melee=!RANGED_HEROES[hero.id];
    var enemyRanged=monsterIsRanged(enemy.id);
    [['hero1',T.hero1,false],['hero2',T.hero2,true]].forEach(function(a){
        var name=a[0],start=a[1],last=a[2];
        if(!melee)at(u,start+p.h.dur*0.18,name+'-bolt',function(){
            boltFx(stage,bodyPoint(stage,hc,42),bodyPoint(stage,ec,33),heroColor,Math.max(120,p.hHit-p.h.dur*0.18),false);
        });
        at(u,start+p.hHit,name+'-hit',function(){
            hitFx(stage,bodyPoint(stage,ec,33),null,{color:last?'#ff8a3c':heroColor,big:last,ko:last,slash:melee?'#ffe9a8':null,text:'-'+randomDamage(last?30:18,last?42:28)});
        });
    });
    if(enemyRanged)at(u,T.monster+100,'monster-bolt',function(){
        boltFx(stage,bodyPoint(stage,ec,24),bodyPoint(stage,hc,28),'#ff4d6a',Math.max(120,p.mHit-100),true);
    });
    at(u,T.monster+p.mHit,'monster-hit',function(){
        hitFx(stage,bodyPoint(stage,hc,28),null,{color:'#ff4d6a',onHero:true,text:'-'+randomDamage(8,16)});
    });
}

// How far a melee attacker runs: out to the target by the moment of the hit,
// a short hold, then back.
function dashAmount(q,k,gap){
    var out=Math.min(1,q/k),back=q>k+0.2?Math.min(1,(q-k-0.2)/0.3):0;
    return Math.max(0,gap)*(out*out)*(1-back);
}

function frame(now){
    var screen=document.getElementById('title-screen');
    if(!screen||!screen.classList.contains('active')){showcase.animId=null;return;}
    showcase.animId=requestAnimationFrame(frame);
    if(document.hidden)return;
    if(now-(showcase.last||0)<33)return;
    showcase.last=now;
    if(!showcase.start){showcase.start=now;showcase.fired={};}
    var u=now-showcase.start;
    if(u>=CYCLE){
        showcase.start=now;u=0;showcase.fired={};
        showcase.hero++;showcase.enemy++;
        setNames();
    }
    var hero=CHARACTERS[showcase.hero%CHARACTERS.length];
    var enemy=showcase.order[showcase.enemy%showcase.order.length];
    var p=roundPoses(u,hero.id,enemy.id),t=now/1000;
    SPR.drawTo(document.getElementById('home-hero-canvas'),'hero',hero.id,{t:t,pose:p.hero});
    SPR.drawTo(document.getElementById('home-enemy-canvas'),'enemy',enemy.id,{t:t,pose:p.enemy});
    var heroBox=document.querySelector('.home-fighter-hero'),enemyBox=document.querySelector('.home-fighter-enemy');
    var stage=document.querySelector('.home-stage');
    if(heroBox&&enemyBox){
        var gap=uiRect(enemyBox).left-uiRect(heroBox).left-heroBox.offsetWidth*0.55;
        // the knight and the hacker run across to the monster and back
        var heroDash=(!RANGED_HEROES[hero.id]&&p.hero&&p.hero.name==='attack')?dashAmount(p.hero.p,p.hero.k,gap):0;
        heroBox.style.transform='translateX('+Math.round(heroDash)+'px)';
        // melee monsters run at the hero; ranged ones only lean in and shoot
        var enemyDash=0;
        if(p.enemy&&p.enemy.name==='attack')enemyDash=dashAmount(p.enemy.p,p.enemy.k,monsterIsRanged(enemy.id)?gap*0.12:gap);
        enemyBox.style.transform='translateX('+(-Math.round(enemyDash))+'px)';
        // whoever is attacking is drawn in front
        if(stage)stage.classList.toggle('enemy-attacking',!!(p.enemy&&p.enemy.name==='attack'));
    }
    playRoundEffects(u,p,hero,enemy);
    if(stage){
        // the scene shakes a little on every hit, more on the K.O.
        var shake=now<(showcase.shakeUntil||0)?((Math.floor(now/40)%2)?showcase.shakeAmp:-showcase.shakeAmp):0;
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
    if(!showcase.animId){showcase.start=0;showcase.fired={};showcase.animId=requestAnimationFrame(frame);}
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
