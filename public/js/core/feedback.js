// ===== SHOP ACTIONS, VISUAL FEEDBACK, RESET, AND UTILITIES =====
function shortAdminText(text){
    var value=String(text||'').replace(/\s+/g,' ').trim();
    return value.length>90?value.slice(0,87)+'...':value;
}

function escapeHtml(text){
    return String(text).replace(/[&<>"]|'/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
}

// Decodes HTML entities (&lt; &amp; ...) to plain text without executing markup.
var entityDecoder=null;
function decodeEntities(text){
    var value=String(text==null?'':text);
    if(value.indexOf('&')===-1)return value;
    if(!entityDecoder)entityDecoder=document.createElement('textarea');
    entityDecoder.innerHTML=value.replace(/</g,'&lt;');
    return entityDecoder.value;
}

function buyShopItem(action,cost){
    var api=action==='buy_potion'?apiBuyPotion:function(){return apiBuyBuff(action);};
    api()
    .then(function(data){
        if(data.status==='ok'){
            gold=data.gold;document.getElementById('gold-count').textContent=gold;
            if(data.potions!==undefined){potions=data.potions;var potionBtn=document.getElementById('potion-btn');if(potionBtn)potionBtn.textContent='POTION('+potions+')';}
            if(data.hp!==undefined){hp=data.hp;maxHp=data.max_hp;updatePlayerHP();showFloatingPoints('+'+data.healed+' HP');}
            if(data.buff_def!==undefined)buffDef=data.buff_def;
            if(data.buff_gold!==undefined)buffGold=data.buff_gold;
            if(data.buff_crit!==undefined)buffCrit=data.buff_crit;
            if(data.buff_time!==undefined)buffTime=data.buff_time;
            refreshShopGold();updateShopBuffs();updateBuffIndicators();
            var names={'buy_potion':'HP Potion','buy_def_potion':'DEF Potion','buy_gold_potion':'Gold Potion','buy_crit_potion':'Crit Potion','buy_time_potion':'Time Potion'};
            var purchaseMessage=action==='buy_potion'?'HP Potion healed +'+data.healed+' HP! -'+cost+'g':'Bought '+(names[action]||'item')+'! -'+cost+'g';
            showToast(purchaseMessage,'success');
        } else if(data.status==='full_hp'){
            showToast('HP is already full!','info');
        } else { showToast('Not enough gold! Need '+cost+'g','error'); }
    });
}

function refreshShopGold(){
    var el=document.getElementById('shop-gold-display');if(el)el.textContent=gold;
}
function updateShopBuffs(){
    var el=document.getElementById('shop-buffs');if(!el)return;
    var parts=[];
    if(buffDef>0)parts.push('DEF: '+buffDef+' turns');
    if(buffGold>0)parts.push('GOLD: '+buffGold+' turns');
    if(buffCrit>0)parts.push('CRIT: '+buffCrit+' turns');
    if(buffTime>0)parts.push('TIME: '+buffTime+' turns');
    el.textContent=parts.length>0?'Active Buffs: '+parts.join(' | '):'No active buffs';
}
function updateBuffIndicators(){
    var container=document.querySelector('.buff-indicators');
    if(!container){
        // shown in the top-left corner of the battle scene (css/game/battle-stage.css)
        container=document.createElement('div');container.className='buff-indicators';
        var battleScene=document.getElementById('battle-scene');
        if(battleScene)battleScene.appendChild(container);
    }
    container.innerHTML='';
    if(buffDef>0){var t=document.createElement('span');t.className='buff-tag def';t.textContent='DEF('+buffDef+')';container.appendChild(t);}
    if(buffGold>0){var t=document.createElement('span');t.className='buff-tag gold-buff';t.textContent='GOLD('+buffGold+')';container.appendChild(t);}
    if(buffCrit>0){var t=document.createElement('span');t.className='buff-tag crit';t.textContent='CRIT('+buffCrit+')';container.appendChild(t);}
    if(buffTime>0){var t=document.createElement('span');t.className='buff-tag time';t.textContent='TIME('+buffTime+')';container.appendChild(t);}
}

function showFloatingPoints(text){var el=document.createElement('div');el.className='float-points';el.textContent=text;el.style.left='50%';el.style.top='30%';document.body.appendChild(el);setTimeout(function(){el.remove();},1400);} 
function showFloatingDmg(text){var el=document.createElement('div');el.className='float-dmg';el.textContent=text;el.style.left='45%';el.style.top='25%';document.body.appendChild(el);setTimeout(function(){el.remove();},1400);} 
// Pops up in front of the hero (falls back to the left of the screen when the hero is not shown).
function showAbilityActivate(text){
    var el=document.createElement('div');el.className='ability-activate';el.textContent=text;
    document.body.appendChild(el);
    var hero=document.getElementById('game-character'),r=hero&&hero.offsetParent!==null?hero.getBoundingClientRect():null;
    if(r&&r.width){
        var cx=r.left+r.width*28/64;
        el.style.left=Math.max(6,Math.min(window.innerWidth-el.offsetWidth-6,cx-el.offsetWidth/2))+'px';
        el.style.top=Math.max(6,r.bottom-r.height*0.32)+'px'; // starts at the legs and floats up (clear of the speech bubble)
    }else{el.style.left='20%';el.style.top='40%';}
    setTimeout(function(){el.remove();},1200);
} 
function showToast(msg,type){document.querySelectorAll('.toast').forEach(function(t){t.remove();});var el=document.createElement('div');el.className='toast '+type;el.textContent=msg;document.body.appendChild(el);setTimeout(function(){el.remove();},2000);} 
function showLevelUp(lvl){var o=document.createElement('div');o.className='level-up-overlay';o.innerHTML='<div class="text">LEVEL UP!</div><div class="sub">Level '+lvl+' | +10 Max HP | +'+ATTACK_PER_LEVEL+' ATK</div>';document.body.appendChild(o);o.onclick=function(){o.remove();};setTimeout(function(){o.remove();},2500);} 
function showBossDefeat(){var o=document.createElement('div');o.className='boss-defeat-overlay';o.innerHTML='<div class="text">BOSS DEFEATED!</div><div class="sub">Floor '+floor_num+' unlocked!</div><div class="sub2">+25g | +1 Potion | HP Restored!</div>';document.body.appendChild(o);o.onclick=function(){o.remove();};setTimeout(function(){o.remove();},3000);} 
var deathResetPromise=null;

function showDeath(){
    playDeathSfx();
    // The run ended: capture its score for the leaderboard before the reset
    // wipes the active state, then clear it locally and in MongoDB.
    var finalScore=score;
    var finalFloor=floor_num;
    submitLeaderboardScore(finalScore,finalFloor);
    deathResetPromise=apiReset();
    var o=document.createElement('div');
    o.className='death-overlay';
    o.innerHTML='<div class="text">YOU DIED</div>'+ 
        '<div class="sub">Score: '+finalScore+' | Floor: '+finalFloor+'</div>'+ 
        '<div class="sub2">Your run is over. Progress has been reset - a new run starts at floor 1.</div>'+ 
        '<div class="death-actions">'+
            '<button type="button" class="death-btn restart" onclick="restartAfterDeath()">START NEW RUN</button>'+ 
            '<button type="button" class="death-btn leaderboard" onclick="showLeaderboardFromDeath()">LEADERBOARDS</button>'+ 
            '<button type="button" class="death-btn home" onclick="returnToTitleFromDeath()">BACK TO HOME</button>'+ 
        '</div>';
    document.body.appendChild(o);
}

function closeDeathScreen(){
    var overlay=document.querySelector('.death-overlay');
    if(overlay)overlay.remove();
}

function whenDeathResetDone(){
    var pending=deathResetPromise||Promise.resolve();
    deathResetPromise=null;
    return pending;
}

function resetRuntimeEncounter(){
    questionNum=0;
    currentQuestion=null;
    answered=false;
    currentDifficulty='easy';
    encounterCount=0;
    isBossFight=false;
    bossAttackCount=0;
    currentMonster=null;
    monsterHp=0;
    monsterMaxHp=0;
    monsterAttack=0;
    monsterDefense=0;
    // The defeat pose is held on purpose so a fallen hero stays down behind
    // the death screen. A new run must clear it, or the hero stays invisible.
    if(typeof combatRunId==='number')combatRunId++;
    if(typeof SPR!=='undefined'){SPR.clearPose('hero');SPR.clearPose('enemy');}
    if(typeof clearCharacterCombatAnimation==='function')clearCharacterCombatAnimation();
}

function restartAfterDeath(){
    closeDeathScreen();
    whenDeathResetDone().then(function(){
        resetRuntimeEncounter();
        syncUiFromState();
        var progEl=document.getElementById('lex-progress-fill');if(progEl)progEl.style.width='5%';
        updateSpeech('A new run begins at floor 1!');
        saveState();
        spawnMonster();
        loadQuestion();
    });
}

function showLeaderboardFromDeath(){
    closeDeathScreen();
    showLeaderboard();
}

function returnToTitleFromDeath(){
    closeDeathScreen();
    whenDeathResetDone().then(function(){
        resetRuntimeEncounter();
        syncUiFromState();
        showScreen('title-screen');
    });
}

function submitLeaderboardScore(finalScore,finalFloor){
    var recordedScore=Number(finalScore);
    if(!Number.isFinite(recordedScore))recordedScore=score;
    var recordedFloor=Number(finalFloor);
    if(!Number.isFinite(recordedFloor))recordedFloor=floor_num;
    if(!playerUsername||recordedScore<=0)return;
    fetch('/api/leaderboard',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            name:playerUsername,
            character:selectedChar?selectedChar.name:'',
            score:recordedScore,
            floor:recordedFloor,
            role:playerRole,
            yearLevel:playerYearLevel||'-',
            block:playerBlock||'-'
        })
    }).catch(function(err){console.error('submitLeaderboardScore failed:',err);});
}
function hideSpeechBubble(){
    var bubble=document.getElementById('speech-bubble');
    if(bubble)bubble.classList.add('combat-hidden');
}

function updateSpeech(text){
    var bubble=document.getElementById('speech-bubble');
    if(!bubble)return;
    bubble.textContent=text;
    bubble.classList.remove('combat-hidden');
}

function resetGame(){
    apiReset()
    .then(function(){
        questionNum=0;encounterCount=0;isBossFight=false;currentMonster=null;monsterHp=0;monsterMaxHp=0;monsterAttack=0;monsterDefense=0;bossAttackCount=0;
        syncUiFromState();
        document.getElementById('floor-title').textContent='FLOOR '+floor_num;
        var progEl=document.getElementById('lex-progress-fill');if(progEl)progEl.style.width='5%';
        updatePlayerHP();updateBuffIndicators();updateSpeech('New dungeon run!');spawnMonster();loadQuestion();
    });
}

