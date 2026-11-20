// ===== BATTLE, QUESTIONNAIRE, AND PROGRESSION =====
// Both battle sprites are redrawn about 30 times a second. SPR.frame() says
// which pose (attack, hurt, defeat ...) each one is in right now.
var SPRITE_FRAME_MS=33;
function spriteCanvasVisible(canvas){return !!canvas&&!document.hidden&&canvas.offsetParent!==null;}

// Height of each hero from the feet (art row 60) to the top of the head, in
// art pixels. css/game/battle-stage.css uses it (--hero-head) to place the
// speech bubble beside the face and the potion counter above the head.
var heroHeadCache={};
function updateHeroHeadAnchor(){
    if(!selectedChar)return;
    var top=heroHeadCache[selectedChar.id];
    if(top===undefined){
        top=16;
        var c=document.createElement('canvas');c.width=64;c.height=64;
        SPR.drawTo(c,'hero',selectedChar.id,{});
        var d=c.getContext('2d').getImageData(0,0,64,64).data;
        search:for(var y=0;y<64;y++)for(var x=0;x<64;x++)if(d[(y*64+x)*4+3]>20){top=y;break search;}
        heroHeadCache[selectedChar.id]=top;
    }
    var scene=document.getElementById('battle-scene');
    if(scene)scene.style.setProperty('--hero-head',String(60-top));
}

function startCharacterAnimation(){
    if(characterAnimId)cancelAnimationFrame(characterAnimId);
    SPR.clearPose('hero');
    updateHeroHeadAnchor();
    var last=0;
    function animate(now){
        var canvas=document.getElementById('game-character');if(!canvas)return;
        characterAnimId=requestAnimationFrame(animate);
        if(!selectedChar||!spriteCanvasVisible(canvas))return;
        if(now-last<SPRITE_FRAME_MS)return;last=now;animFrame++;
        SPR.drawTo(canvas,'hero',selectedChar.id,{t:now/1000,pose:SPR.frame('hero')});
    }
    characterAnimId=requestAnimationFrame(animate);
}

function startMonsterAnimation(){
    if(monsterAnimId)cancelAnimationFrame(monsterAnimId);
    var canvas=document.getElementById('monster-canvas');
    if(canvas&&canvas.parentNode)canvas.parentNode.classList.toggle('is-boss',!!isBossFight);
    // every new enemy materialises out of pixels
    SPR.pose('enemy','spawn',{dur:isBossFight?800:480});
    var last=0;
    function animate(now){
        var canvas=document.getElementById('monster-canvas');if(!canvas)return;
        monsterAnimId=requestAnimationFrame(animate);
        if(!currentMonster||!spriteCanvasVisible(canvas))return;
        if(now-last<SPRITE_FRAME_MS)return;last=now;
        SPR.drawTo(canvas,'enemy',currentMonster.id,{t:now/1000,pose:SPR.frame('enemy')});
    }
    monsterAnimId=requestAnimationFrame(animate);
}

// Enemies that fight from range only step part of the way toward the hero.
const ENEMY_DASH_FACTORS={null_ghost:0.45,regex_spider:0.5,exception_wraith:0.45,cache_cinder:0.5,deadlock_dragon:0.6,memory_leak:0.7};

// Measure the gap between the two fighters and hand it to the CSS lunge
// keyframes (see game/sprites.css) so a melee attack reaches its target.
function measureCombatDash(){
    var scene=document.getElementById('battle-scene');
    var heroEl=document.getElementById('game-character'),monsterEl=document.getElementById('monster-canvas');
    if(!scene||!heroEl||!monsterEl)return;
    var h=heroEl.getBoundingClientRect(),m=monsterEl.getBoundingClientRect();
    if(!h.width||!m.width)return;
    var unit=h.width/64;
    var gap=(m.left+m.width*34/64)-(h.left+h.width*28/64);
    var heroDash=Math.max(40,gap-(isBossFight?46:40)*unit);
    var factor=currentMonster?(ENEMY_DASH_FACTORS[currentMonster.id]||1):1;
    var enemyDash=Math.max(40,(gap-(isBossFight?42:36)*unit)*factor);
    scene.style.setProperty('--hdash',Math.round(heroDash)+'px');
    scene.style.setProperty('--edash',(-Math.round(enemyDash))+'px');
}

// The moment an attack connects: the target flinches, or falls if it has no HP left.
// Increases every time a run is reset, so an attack that was still in the air
// when the player died cannot land on (and knock down) the hero of the next run.
var combatRunId=0;

function poseTargetHit(side,runId){
    if(runId!==undefined&&runId!==combatRunId)return;
    if(side==='enemy'){
        if(monsterHp<=0){
            SPR.pose('enemy','die',{dur:isBossFight?1300:800,hold:true});
            SPR.pose('hero','win',{dur:1100,delay:520});
        }else SPR.pose('enemy','hurt',{dur:420});
    }else{
        if(hp<=0)SPR.pose('hero','die',{dur:900,hold:true});
        else SPR.pose('hero','hurt',{dur:420});
    }
}

function spawnMonster(){
    encounterCount++;
    if(encounterCount>3){spawnBoss();return;}
    isBossFight=false;bossAttackCount=0;
    var mapFloor=Math.min(floor_num,Object.keys(DUNGEON_MAP).length);
    var monsterIds=DUNGEON_MAP[mapFloor]||DUNGEON_MAP[1];
    var monsterId=monsterIds[encounterCount-1]||monsterIds[0];
    currentMonster=MONSTERS.find(function(m){return m.id===monsterId;})||MONSTERS[0];
    var battleStats=getMonsterBattleStats(floor_num,encounterCount,false);
    monsterHp=battleStats.hp;monsterMaxHp=monsterHp;
    monsterAttack=battleStats.attack;monsterDefense=battleStats.defense;
    updateMonsterUI();startMonsterAnimation();
    document.getElementById('encounter-label').textContent='ENCOUNTER '+encounterCount+'/3';
    document.getElementById('battle-banner').textContent='BATTLE! Answer correctly to attack!';
    document.getElementById('battle-banner').style.borderColor='var(--accent)';
    var progEl=document.getElementById('lex-progress-fill');
    if(progEl)progEl.style.width=Math.round(((encounterCount-1)/3)*100)+'%';
    updateDiffDisplay();
}

function spawnBoss(){
    isBossFight=true;bossAttackCount=0;var bossIdx=Math.min(floor_num-1,BOSSES.length-1);
    currentMonster=BOSSES[bossIdx];
    var battleStats=getMonsterBattleStats(floor_num,1,true);
    monsterHp=battleStats.hp;monsterMaxHp=monsterHp;
    monsterAttack=battleStats.attack;monsterDefense=battleStats.defense;
    updateMonsterUI();startMonsterAnimation();
    document.getElementById('encounter-label').textContent='\u2620 BOSS FIGHT \u2620';
    document.getElementById('battle-banner').textContent='\u2620 BOSS: '+currentMonster.name+' \u2620';
    document.getElementById('battle-banner').style.borderColor='var(--gold)';
    var progEl2=document.getElementById('lex-progress-fill');
    if(progEl2)progEl2.style.width='90%';
    updateDiffDisplay();
}

function updateMonsterUI(){
    document.getElementById('monster-name').textContent=(isBossFight?'\u2620 ':'')+currentMonster.name;
    document.getElementById('monster-desc').textContent=currentMonster.desc;
    var pct=Math.max(0,monsterHp/monsterMaxHp*100);
    document.getElementById('monster-hp-fill').style.width=pct+'%';
    document.getElementById('monster-hp-text').textContent=monsterHp+'/'+monsterMaxHp;
    var statType=document.getElementById('monster-stat-type');if(statType)statType.textContent=isBossFight?'BOSS':'NORMAL';
    var statHp=document.getElementById('monster-stat-hp');if(statHp)statHp.textContent=monsterHp+' / '+monsterMaxHp;
    var statAtk=document.getElementById('monster-stat-atk');if(statAtk)statAtk.textContent=monsterAttack;
    var statDef=document.getElementById('monster-stat-def');if(statDef)statDef.textContent=monsterDefense;
    var statNote=document.getElementById('monster-stat-note');if(statNote)statNote.textContent=monsterDefense>0?'DEF blocks '+monsterDefense+' damage from every hit.':'No armor: attacks deal full damage.';
    var bossSpecial=getCurrentBossSpecial();
    var bossPanel=document.getElementById('boss-special-panel');
    if(bossPanel){
        bossPanel.style.display=bossSpecial?'block':'none';
        if(bossSpecial){
            var bossName=document.getElementById('boss-special-name');if(bossName)bossName.textContent=bossSpecial.name;
            var bossDesc=document.getElementById('boss-special-desc');if(bossDesc)bossDesc.textContent=bossSpecial.desc;
            var attacksUntil=bossSpecial.every-(bossAttackCount%bossSpecial.every);
            var bossReady=document.getElementById('boss-special-ready');if(bossReady)bossReady.textContent='READY IN '+attacksUntil+' ATTACK'+(attacksUntil===1?'':'S');
        }
    }
    document.getElementById('floor-title').textContent='FLOOR '+floor_num;
    applyBattleBackground();
}

function updateCharacterStatsUI(){
    var levelStat=document.getElementById('character-stat-level');if(levelStat)levelStat.textContent=level;
    var hpStat=document.getElementById('character-stat-hp');if(hpStat)hpStat.textContent=hp+' / '+maxHp;
    var displayedAttack=getCharacterBaseAttack('easy');
    displayedAttack=Math.floor(displayedAttack*getCharacterAttackMultiplier());
    var atkStat=document.getElementById('character-stat-atk');if(atkStat)atkStat.textContent=displayedAttack;
    var defStat=document.getElementById('character-stat-def');if(defStat)defStat.textContent=getCharacterDefensePercent()+'%';
    var levelProgress=getLevelProgressFromScore(score);
    var levelText=document.getElementById('level-progress-text');if(levelText)levelText.textContent=levelProgress.currentExp+' / '+levelProgress.requiredExp;
    var levelFill=document.getElementById('level-progress-fill');if(levelFill)levelFill.style.width=((levelProgress.currentExp/levelProgress.requiredExp)*100)+'%';

    var special=getCharacterSpecial();
    var specialName=document.getElementById('character-special-name');if(specialName)specialName.textContent=special?special.name:'SELECT A HERO';
    var specialDesc=document.getElementById('character-special-desc');if(specialDesc)specialDesc.textContent=special?special.desc:'Answer correctly to charge your hero skill.';
    var chargeFill=document.getElementById('character-special-charge-fill');if(chargeFill)chargeFill.style.width=specialCharge+'%';
    var skillBtn=document.getElementById('character-special-btn');
    if(skillBtn){
        var ready=!!special&&specialCharge>=100&&!answered&&!!currentQuestion&&monsterHp>0;
        skillBtn.disabled=!ready;
        skillBtn.className='lex-special-skill-btn'+(specialCharge>=100?' ready':'');
        skillBtn.textContent=specialCharge>=100?(ready?'USE '+special.name:'SKILL READY'):'CHARGE '+specialCharge+'%';
    }
}

function updatePlayerHP(){
    var pct=Math.max(0,hp/maxHp*100);var fill=document.getElementById('hp-fill');
    if(!fill)return;
    fill.style.width=pct+'%';fill.className='hp-fill'+(pct<=25?' low':'');
    document.getElementById('hp-text').textContent=hp+'/'+maxHp;
    var h1=document.getElementById('heart1'),h2=document.getElementById('heart2'),h3=document.getElementById('heart3');
    if(h1&&h2&&h3){
        h1.className='lex-heart'+(pct>0?'':' empty');
        h2.className='lex-heart'+(pct>33?'':' empty');
        h3.className='lex-heart'+(pct>66?'':' empty');
    }
    updateCharacterStatsUI();
}

function updateDiffDisplay(){
    var el=document.getElementById('auto-diff-display');
    if(isBossFight){el.textContent='HARD';el.className='diff-btn hard active';}
    else{el.textContent='EASY / NORMAL';el.className='diff-btn easy active';}
    updateBuffIndicators();
}

function loadQuestion(){
    answered=false;currentQuestion=null;questionNum++;
    updateCharacterStatsUI();
    document.getElementById('q-content').style.display='none';
    document.getElementById('loading').style.display='block';
    document.getElementById('next-btn').classList.remove('show');
    document.getElementById('explanation').classList.remove('show');
    apiGetQuestion(isBossFight?true:false)
    .then(function(data){
        if(data.status==='ok'){
            currentQuestion=data.question;
            currentDifficulty=data.question.diff;
            if(data.buffs){buffDef=data.buffs.def;buffGold=data.buffs.gold;buffCrit=data.buffs.crit;buffTime=data.buffs.time;}
            renderQuestion(data.question);updateSpeech(getQuestionSpeech());updateBuffIndicators();
        }else{
            document.getElementById('loading').textContent=data.message||'Question unavailable';
        }
    }).catch(function(){document.getElementById('loading').textContent='Error!';});
}

function getQuestionSpeech(){
    if(isBossFight){
        var pool=['Boss-level!','Maximum danger!','Think hard!','Critical hit time!','This is it!','Stay focused!'];
        return pool[Math.floor(Math.random()*pool.length)];
    }
    var pool=['Watch out!','Here it comes!','Stay sharp!','Focus!','Easy target!','Be careful!','Think fast!'];
    return pool[Math.floor(Math.random()*pool.length)];
}

function renderQuestion(q){
    document.getElementById('loading').style.display='none';document.getElementById('q-content').style.display='block';
    document.getElementById('q-cat').textContent=q.cat.toUpperCase();
    var diffEl=document.getElementById('q-diff');diffEl.textContent=q.diff.toUpperCase();diffEl.className='q-difficulty '+q.diff;
    document.getElementById('q-number').textContent='Attack #'+questionNum;
    // Question text is stored with HTML entities (&lt;?php). Decode it once and
    // re-escape on output so raw "<" typed in the admin editor can never break
    // or inject markup.
    var qText=decodeEntities(q.q),qTextEl=document.getElementById('q-text');
    var parts=q.type==='code'?qText.split('\n\n'):[qText];
    if(parts.length>1){qTextEl.innerHTML=escapeHtml(parts[0])+'<div class="code-block">'+formatCode(parts.slice(1).join('\n\n'))+'</div>';}
    else{qTextEl.textContent=qText;}
    var choicesEl=document.getElementById('choices');choicesEl.innerHTML='';var letters=['A','B','C','D'];
    q.choices.forEach(function(choice,i){var btn=document.createElement('div');btn.className='choice-btn';
        btn.innerHTML='<span class="choice-letter">'+letters[i]+'</span><span class="choice-text">'+escapeHtml(decodeEntities(choice))+'</span>';
        btn.onclick=function(){selectAnswer(i);};choicesEl.appendChild(btn);});
    document.getElementById('exp-text').textContent=decodeEntities(q.explain);
    var questionArea=document.getElementById('question-card');if(questionArea)questionArea.scrollTop=0;
    startTimer();
    updateCharacterStatsUI();
}

// Single-pass PHP highlighter. Takes plain (already decoded) code and returns
// escaped HTML. One regex walks the text so a later rule can never re-match
// the markup produced by an earlier one.
function formatCode(code){
    var token=/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(<\?php|\?>)|(\$[a-zA-Z_][a-zA-Z0-9_]*)|\b(echo|print|return|function|class|trait|use|insteadof|new|if|else|elseif|for|foreach|while|do|switch|case|break|default|public|private|protected|static|extends|implements|try|catch|throw|match|fn|list|as|array)\b|(=>)/g;
    var classes=['','comment','string','tag','var','kw','kw'];
    var out='',last=0,m;
    while((m=token.exec(code))!==null){
        out+=escapeHtml(code.slice(last,m.index));
        var kind='';
        for(var i=1;i<classes.length;i++){if(m[i]!==undefined){kind=classes[i];break;}}
        out+='<span class="code-'+kind+'">'+escapeHtml(m[0])+'</span>';
        last=m.index+m[0].length;
    }
    return out+escapeHtml(code.slice(last));
}

function triggerAttackFx(effectId){
    var fx=document.getElementById(effectId);
    if(!fx)return;
    fx.classList.remove('show');
    void fx.offsetWidth;
    fx.classList.add('show');
}

function playAttackSequence(attackerEl,targetEl,attackerClass,targetClass,effectId){
    if(!attackerEl||!targetEl)return;
    clearCharacterCombatAnimation();
    attackerEl.classList.remove('hero-attacking','hero-hit-anim','monster-attacking','monster-hit-anim');
    targetEl.classList.remove('hero-attacking','hero-hit-anim','monster-attacking','monster-hit-anim');
    void attackerEl.offsetWidth;
    attackerEl.classList.add(attackerClass);
    setTimeout(function(){
        targetEl.classList.add(targetClass);
        triggerAttackFx(effectId);
    },200);
}

// Milliseconds until the hit lands. For the ranged heroes this is when their
// projectile reaches the monster, so the flinch happens on contact.
const CHARACTER_ATTACK_TIMINGS={scholar:600,wizard:590,knight:280,rogue:230,healer:660,pirate:500};
const CHARACTER_SKILL_TIMINGS={scholar:620,wizard:560,knight:450,rogue:360,healer:650,pirate:520};
// How long each hero's attack pose lasts. Fighters who run in (knight, hacker)
// land their swing on the impact; casters and the gunner release early (k) so
// the shot is already in the air when the effect flies across the scene.
const CHARACTER_ATTACK_POSES={
    scholar:{dur:900,k:0.2},wizard:{dur:900,k:0.24},knight:{dur:900},
    rogue:{dur:800},healer:{dur:960,k:0.22},pirate:{dur:820,k:0.16}
};

const CHARACTER_ATTACK_NAMES={
    scholar:'SYNTAX BOLT',wizard:'ARCANE MISSILE',knight:'VANGUARD SLASH',
    rogue:'NEON DAGGERS',healer:'RADIANT SPARK',pirate:'BLACKPOWDER SHOT'
};
const CHARACTER_COMBAT_PROFILES={
    scholar:{color:'#54efff',accent:'#ffe36e',glyph:'</>'},
    wizard:{color:'#a768ff',accent:'#f2d4ff',glyph:'*'},
    knight:{color:'#ffd15a',accent:'#fff2af',glyph:'+'},
    rogue:{color:'#39ffc0',accent:'#d8fff3',glyph:'//'},
    healer:{color:'#68ffb4',accent:'#e0fff0',glyph:'+'},
    pirate:{color:'#ffad32',accent:'#fff0a8',glyph:'o'}
};
const ENEMY_ATTACK_NAMES={
    bug_sprite:'SYNTAX STING',null_ghost:'NULL PULSE',var_slime:'VARIABLE SPLASH',
    scope_bat:'SCOPE DIVE',loop_worm:'INFINITE COIL',array_golem:'INDEXED SLAM',
    sql_inject:'INJECTION QUERY',syntax_skeleton:'SEMICOLON CLEAVE',regex_spider:'PATTERN WEB',
    exception_wraith:'THROW EXCEPTION',type_mimic:'TYPE SHIFT',callback_phantom:'PHANTOM CALLBACK',
    closure_trap:'CAPTURED STRIKE',cache_cinder:'CACHE BURST',daemon_imp:'DAEMON BLAZE',
    stack_overflow:'STACK CRUSH',deadlock_dragon:'THREAD BREATH',memory_leak:'HEAP SIPHON',
    recursion_hydra:'RECURSIVE FANGS',fatal_error_titan:'KERNEL SMASH'
};
const ENEMY_COMBAT_PROFILES={
    bug_sprite:{color:'#66f04f',accent:'#d9ff95',glyph:'!'},null_ghost:{color:'#a98cff',accent:'#f0e8ff',glyph:'0'},
    var_slime:{color:'#3ee4a0',accent:'#c8ffe9',glyph:'$'},scope_bat:{color:'#8f55ff',accent:'#e0ccff',glyph:'{}'},
    loop_worm:{color:'#ff9f32',accent:'#fff0a3',glyph:'oo'},array_golem:{color:'#628dff',accent:'#d4e0ff',glyph:'[]'},
    sql_inject:{color:'#43ff91',accent:'#ddffe8',glyph:'--'},syntax_skeleton:{color:'#f1dfb4',accent:'#ffffff',glyph:';'},
    regex_spider:{color:'#cfb9ff',accent:'#ffffff',glyph:'^$'},exception_wraith:{color:'#ff4777',accent:'#ffd9e4',glyph:'!'},
    type_mimic:{color:'#ffad52',accent:'#ffe8bd',glyph:'?'},callback_phantom:{color:'#55c9ff',accent:'#ddf7ff',glyph:'()'},
    closure_trap:{color:'#c969ff',accent:'#f1d7ff',glyph:'{}'},cache_cinder:{color:'#ff6d22',accent:'#fff07c',glyph:'#'},
    daemon_imp:{color:'#ff392b',accent:'#ffcf74',glyph:'&'},stack_overflow:{color:'#ff4668',accent:'#ffd3dc',glyph:'++'},
    deadlock_dragon:{color:'#806cff',accent:'#e0dbff',glyph:'||'},memory_leak:{color:'#b655ff',accent:'#ead0ff',glyph:'%'},
    recursion_hydra:{color:'#32ef79',accent:'#d7ffe3',glyph:'fn'},fatal_error_titan:{color:'#ff321d',accent:'#fff078',glyph:'X'}
};
var combatPresentationToken=0;

function getCharacterAnimationId(charId){
    return CHARACTER_SPECIALS[charId]?charId:'scholar';
}

function getCharacterCombatFxLayer(){
    return document.getElementById('character-combat-fx-layer');
}

function getCharacterCombatProfile(charId){
    return CHARACTER_COMBAT_PROFILES[charId]||CHARACTER_COMBAT_PROFILES.scholar;
}

function getEnemyCombatProfile(monsterId){
    return ENEMY_COMBAT_PROFILES[monsterId]||ENEMY_COMBAT_PROFILES.bug_sprite;
}

function addCombatParticles(parent,side,profile,count){
    if(!parent)return;
    for(var i=0;i<count;i++){
        var particle=document.createElement('i');
        particle.className='combat-particle';
        particle.style.setProperty('--particle-color',i%3===0?profile.accent:profile.color);
        particle.style.setProperty('--particle-x',(side==='hero'?12:88)+(Math.random()*10-5)+'%');
        particle.style.setProperty('--particle-y',(29+Math.random()*43)+'%');
        particle.style.setProperty('--particle-dx',((side==='hero'?1:-1)*(70+Math.random()*190))+'px');
        particle.style.setProperty('--particle-dy',(-70+Math.random()*140)+'px');
        particle.style.setProperty('--particle-delay',(Math.random()*.18)+'s');
        particle.style.setProperty('--particle-size',(3+Math.floor(Math.random()*6))+'px');
        parent.appendChild(particle);
    }
}

function clearCombatPresentation(){
    combatPresentationToken++;
    var scene=document.getElementById('battle-scene');
    if(scene)scene.classList.remove('combat-hero-active','combat-enemy-active','combat-skill-active','combat-boss-active');
    var layer=getCharacterCombatFxLayer();
    if(layer)layer.querySelectorAll('.combat-atmosphere,.combat-announcement,.combat-impact-burst').forEach(function(effect){effect.remove();});
}

function beginCombatPresentation(side,tier,title,subtitle,profile,duration){
    var layer=getCharacterCombatFxLayer();
    var scene=document.getElementById('battle-scene');
    if(!layer||!scene)return;
    clearCombatPresentation();
    var token=++combatPresentationToken;
    scene.style.setProperty('--combat-color',profile.color);
    scene.style.setProperty('--combat-accent',profile.accent);
    scene.classList.add(side==='hero'?'combat-hero-active':'combat-enemy-active');
    if(tier==='skill')scene.classList.add('combat-skill-active');
    if(tier==='boss')scene.classList.add('combat-boss-active');

    var atmosphere=document.createElement('div');
    atmosphere.className='combat-atmosphere combat-atmosphere-'+side+' combat-atmosphere-'+tier;
    atmosphere.style.setProperty('--combat-color',profile.color);
    atmosphere.style.setProperty('--combat-accent',profile.accent);
    for(var i=0;i<9;i++){
        var line=document.createElement('i');
        line.className='combat-speed-line';
        line.style.setProperty('--line-y',(12+i*9)+'%');
        line.style.setProperty('--line-delay',(i*.025)+'s');
        line.style.setProperty('--line-length',(70+(i%4)*35)+'px');
        atmosphere.appendChild(line);
    }
    addCombatParticles(atmosphere,side,profile,tier==='attack'?10:18);
    layer.appendChild(atmosphere);

    var announcement=document.createElement('div');
    announcement.className='combat-announcement combat-announcement-'+side+' combat-announcement-'+tier;
    announcement.style.setProperty('--combat-color',profile.color);
    announcement.style.setProperty('--combat-accent',profile.accent);
    var glyph=document.createElement('span');glyph.className='combat-announcement-glyph';glyph.textContent=profile.glyph;
    var copy=document.createElement('span');copy.className='combat-announcement-copy';
    var eyebrow=document.createElement('small');eyebrow.textContent=subtitle;
    var heading=document.createElement('strong');heading.textContent=title;
    copy.appendChild(eyebrow);copy.appendChild(heading);announcement.appendChild(glyph);announcement.appendChild(copy);
    layer.appendChild(announcement);

    setTimeout(function(){
        if(token!==combatPresentationToken)return;
        scene.classList.remove('combat-hero-active','combat-enemy-active','combat-skill-active','combat-boss-active');
        atmosphere.remove();announcement.remove();
    },duration||1100);
}

function triggerCombatImpact(targetSide,damageValue,profile,isCritical){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return;
    var impact=document.createElement('div');
    impact.className='combat-impact-burst combat-impact-'+targetSide+(isCritical?' combat-impact-critical':'');
    impact.style.setProperty('--combat-color',profile.color);
    impact.style.setProperty('--combat-accent',profile.accent);
    var ring=document.createElement('i');ring.className='combat-impact-ring';impact.appendChild(ring);
    for(var i=0;i<12;i++){
        var shard=document.createElement('i');shard.className='combat-impact-shard';
        shard.style.setProperty('--shard-angle',(i*30)+'deg');
        shard.style.setProperty('--shard-distance',(34+(i%4)*13)+'px');
        impact.appendChild(shard);
    }
    var damage=document.createElement('strong');
    damage.className='combat-damage-number';
    var safeDamage=Math.max(0,Number(damageValue)||0);
    damage.textContent=safeDamage?(isCritical?'CRIT -'+safeDamage:'-'+safeDamage):'HIT!';
    impact.appendChild(damage);layer.appendChild(impact);
    setTimeout(function(){impact.remove();},850);
}

function clearCharacterCombatAnimation(){
    var heroEl=document.getElementById('game-character');
    if(heroEl){
        Array.from(heroEl.classList).forEach(function(className){
            if(className.indexOf('hero-normal-')===0||className.indexOf('hero-skill-')===0)heroEl.classList.remove(className);
        });
    }
    var layer=getCharacterCombatFxLayer();
    if(layer)layer.querySelectorAll('.character-attack-visual,.character-skill-fx').forEach(function(effect){effect.remove();});
}

function createCharacterAttackVisual(charId){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return null;
    var visual=document.createElement('div');
    visual.className='character-attack-visual attack-'+charId;
    var templates={
        scholar:'<i class="code-page"></i><i class="code-page trail"></i>',
        wizard:'<i class="magic-orb"></i><i class="magic-spark one"></i><i class="magic-spark two"></i>',
        knight:'<i class="sword-arc"></i><i class="shield-edge"></i>',
        rogue:'<i class="hack-slash one"></i><i class="hack-slash two"></i><i class="hack-slash three"></i>',
        healer:'<i class="light-cross"></i><i class="light-drop one"></i><i class="light-drop two"></i>',
        pirate:'<i class="cannonball"></i><i class="powder-smoke one"></i><i class="powder-smoke two"></i>'
    };
    visual.innerHTML=templates[charId]||templates.scholar;
    layer.appendChild(visual);
    return visual;
}

function createCharacterSkillVisual(charId){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return null;
    var effect=document.createElement('div');
    effect.className='character-skill-fx skill-'+charId;
    var templates={
        scholar:'<i class="time-ring outer"></i><i class="time-ring inner"></i><i class="time-clock"><b></b><em></em></i><i class="rewind-mark one">&lt;</i><i class="rewind-mark two">&lt;</i>',
        wizard:'<i class="rune-ring outer"></i><i class="rune-ring inner"></i><i class="arcane-core"></i><i class="arcane-ray one"></i><i class="arcane-ray two"></i><i class="arcane-ray three"></i>',
        knight:'<i class="aegis-shield"></i><i class="slam-column"></i><i class="slam-wave one"></i><i class="slam-wave two"></i>',
        rogue:'<i class="glitch-line one"></i><i class="glitch-line two"></i><i class="glitch-line three"></i><i class="zero-slash one"></i><i class="zero-slash two"></i><i class="zero-slash three"></i>',
        healer:'<i class="restore-ring one"></i><i class="restore-ring two"></i><i class="restore-cross main"></i><i class="restore-cross left"></i><i class="restore-cross right"></i><i class="restore-spark one"></i><i class="restore-spark two"></i>',
        pirate:'<i class="bounty-cannon"></i><i class="bounty-ball"></i><i class="bounty-blast"></i><i class="bounty-coin one"></i><i class="bounty-coin two"></i><i class="bounty-coin three"></i><i class="bounty-coin four"></i>'
    };
    effect.innerHTML=templates[charId]||templates.scholar;
    layer.appendChild(effect);
    return effect;
}

function playCharacterAttackAnimation(charId,damageValue,isCritical){
    var id=getCharacterAnimationId(charId);
    var heroEl=document.getElementById('game-character');
    var monsterEl=document.getElementById('monster-canvas');
    if(!heroEl||!monsterEl)return;
    hideSpeechBubble();
    clearEnemyCombatAnimation();
    clearCharacterCombatAnimation();
    heroEl.classList.remove('hero-hit-anim');
    monsterEl.classList.remove('monster-hit-anim');
    measureCombatDash();
    void heroEl.offsetWidth;
    heroEl.classList.add('hero-normal-'+id);
    var profile=getCharacterCombatProfile(id);
    beginCombatPresentation('hero','attack',CHARACTER_ATTACK_NAMES[id]||'HERO ATTACK','NORMAL ATTACK',profile,980);
    var visual=createCharacterAttackVisual(id);
    var impactDelay=CHARACTER_ATTACK_TIMINGS[id]||330;
    var swing=CHARACTER_ATTACK_POSES[id]||CHARACTER_ATTACK_POSES.knight;
    SPR.pose('hero','attack',{dur:swing.dur,k:swing.k||impactDelay/swing.dur});
    var runId=combatRunId;
    setTimeout(function(){
        poseTargetHit('enemy',runId);
        monsterEl.classList.remove('monster-hit-anim');
        void monsterEl.offsetWidth;
        monsterEl.classList.add('monster-hit-anim');
        triggerAttackFx('hero-attack-fx');
        triggerCombatImpact('enemy',damageValue,profile,!!isCritical);
    },impactDelay);
    setTimeout(function(){
        heroEl.classList.remove('hero-normal-'+id);
        monsterEl.classList.remove('monster-hit-anim');
        if(visual)visual.remove();
    },900);
}

function playCharacterSkillAnimation(charId,damageValue,skillName){
    var id=getCharacterAnimationId(charId);
    var heroEl=document.getElementById('game-character');
    var monsterEl=document.getElementById('monster-canvas');
    if(!heroEl||!monsterEl)return;
    hideSpeechBubble();
    clearEnemyCombatAnimation();
    clearCharacterCombatAnimation();
    heroEl.classList.remove('hero-hit-anim');
    monsterEl.classList.remove('monster-hit-anim');
    measureCombatDash();
    void heroEl.offsetWidth;
    heroEl.classList.add('hero-skill-'+id);
    var profile=getCharacterCombatProfile(id);
    var special=CHARACTER_SPECIALS[id]||null;
    beginCombatPresentation('hero','skill',skillName||(special?special.name:'HERO SKILL'),'ACTIVE SKILL',profile,1480);
    var effect=createCharacterSkillVisual(id);
    var impactDelay=CHARACTER_SKILL_TIMINGS[id]||520;
    SPR.pose('hero','skill',{dur:1400,k:impactDelay/1400});
    var runId=combatRunId;
    setTimeout(function(){
        poseTargetHit('enemy',runId);
        monsterEl.classList.remove('monster-hit-anim');
        void monsterEl.offsetWidth;
        monsterEl.classList.add('monster-hit-anim');
        triggerAttackFx('hero-attack-fx');
        triggerCombatImpact('enemy',damageValue,profile,true);
    },impactDelay);
    setTimeout(function(){
        heroEl.classList.remove('hero-skill-'+id);
        monsterEl.classList.remove('monster-hit-anim');
        if(effect)effect.remove();
    },1450);
}

const ENEMY_ATTACK_TIMINGS={
    bug_sprite:260,null_ghost:390,var_slime:320,scope_bat:260,loop_worm:350,
    array_golem:300,sql_inject:390,syntax_skeleton:280,regex_spider:410,
    exception_wraith:390,type_mimic:270,callback_phantom:330,closure_trap:420,
    cache_cinder:370,daemon_imp:290,stack_overflow:330,deadlock_dragon:290,
    memory_leak:400,recursion_hydra:320,fatal_error_titan:310
};
const BOSS_SKILL_TIMINGS={stack_overflow:620,deadlock_dragon:610,memory_leak:650,recursion_hydra:560,fatal_error_titan:680};

function getEnemyAnimationId(monsterId){
    return ENEMY_ATTACK_TIMINGS[monsterId]?monsterId:'bug_sprite';
}

function clearEnemyCombatAnimation(){
    var monsterEl=document.getElementById('monster-canvas');
    if(monsterEl){
        Array.from(monsterEl.classList).forEach(function(className){
            if(className.indexOf('enemy-normal-')===0||className.indexOf('enemy-skill-')===0)monsterEl.classList.remove(className);
        });
    }
    var layer=getCharacterCombatFxLayer();
    if(layer)layer.querySelectorAll('.enemy-attack-visual,.boss-skill-fx').forEach(function(effect){effect.remove();});
}

function createEnemyAttackVisual(monsterId){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return null;
    var visual=document.createElement('div');
    visual.className='enemy-attack-visual enemy-'+monsterId;
    visual.innerHTML='<i class="enemy-fx-part one"></i><i class="enemy-fx-part two"></i><b class="enemy-fx-part three"></b>';
    layer.appendChild(visual);
    return visual;
}

function createBossSkillVisual(bossId){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return null;
    var effect=document.createElement('div');
    effect.className='boss-skill-fx boss-skill-'+bossId;
    var templates={
        stack_overflow:'<i class="stack-block one">()</i><i class="stack-block two">()</i><i class="stack-block three">()</i><i class="stack-block four">()</i><i class="recursive-ring one"></i><i class="recursive-ring two"></i>',
        deadlock_dragon:'<i class="thread-chain left"></i><i class="thread-chain right"></i><i class="thread-lock"><b></b></i><i class="lock-flash"></i>',
        memory_leak:'<i class="memory-orb one"></i><i class="memory-orb two"></i><i class="memory-orb three"></i><i class="memory-orb four"></i><i class="leak-vortex"></i>',
        recursion_hydra:'<i class="hydra-jaw one"><b></b></i><i class="hydra-jaw two"><b></b></i><i class="hydra-jaw three"><b></b></i><i class="hydra-trail one"></i><i class="hydra-trail two"></i>',
        fatal_error_titan:'<i class="fatal-panel one">FATAL</i><i class="fatal-panel two">ERROR</i><i class="fatal-panel three">CRASH</i><i class="crash-beam"></i><i class="crash-wave one"></i><i class="crash-wave two"></i>'
    };
    effect.innerHTML=templates[bossId]||templates.stack_overflow;
    layer.appendChild(effect);
    return effect;
}

function playEnemyAttackAnimation(monsterId,damageValue){
    var id=getEnemyAnimationId(monsterId);
    var monsterEl=document.getElementById('monster-canvas');
    var heroEl=document.getElementById('game-character');
    if(!monsterEl||!heroEl)return;
    clearCharacterCombatAnimation();
    clearEnemyCombatAnimation();
    heroEl.classList.remove('hero-hit-anim');
    measureCombatDash();
    void monsterEl.offsetWidth;
    monsterEl.classList.add('enemy-normal-'+id);
    var profile=getEnemyCombatProfile(id);
    beginCombatPresentation('enemy','attack',ENEMY_ATTACK_NAMES[id]||'MONSTER ATTACK','ENEMY ATTACK',profile,1040);
    // Melee monsters run in themselves; only ranged ones send a projectile across.
    var visual=ENEMY_DASH_FACTORS[id]?createEnemyAttackVisual(id):null;
    var impactDelay=ENEMY_ATTACK_TIMINGS[id]||330;
    SPR.pose('enemy','attack',{dur:1000,k:impactDelay/1000});
    var runId=combatRunId;
    setTimeout(function(){
        poseTargetHit('hero',runId);
        heroEl.classList.remove('hero-hit-anim');
        void heroEl.offsetWidth;
        heroEl.classList.add('hero-hit-anim');
        triggerAttackFx('monster-attack-fx');
        triggerCombatImpact('hero',damageValue,profile,false);
    },impactDelay);
    setTimeout(function(){
        monsterEl.classList.remove('enemy-normal-'+id);
        heroEl.classList.remove('hero-hit-anim');
        if(visual)visual.remove();
    },1000);
}

function playBossSkillAnimation(bossId,damageValue,skillName){
    var id=BOSS_SKILL_TIMINGS[bossId]?bossId:'stack_overflow';
    var monsterEl=document.getElementById('monster-canvas');
    var heroEl=document.getElementById('game-character');
    if(!monsterEl||!heroEl)return;
    clearCharacterCombatAnimation();
    clearEnemyCombatAnimation();
    heroEl.classList.remove('hero-hit-anim');
    measureCombatDash();
    void monsterEl.offsetWidth;
    monsterEl.classList.add('enemy-skill-'+id);
    var profile=getEnemyCombatProfile(id);
    var special=BOSS_SPECIALS[id]||null;
    beginCombatPresentation('enemy','boss',skillName||(special?special.name:'BOSS SKILL'),'BOSS SPECIAL',profile,1640);
    var effect=createBossSkillVisual(id);
    var impactDelay=BOSS_SKILL_TIMINGS[id]||620;
    SPR.pose('enemy','skill',{dur:1600,k:impactDelay/1600});
    var runId=combatRunId;
    setTimeout(function(){
        poseTargetHit('hero',runId);
        heroEl.classList.remove('hero-hit-anim');
        void heroEl.offsetWidth;
        heroEl.classList.add('hero-hit-anim');
        triggerAttackFx('monster-attack-fx');
        triggerCombatImpact('hero',damageValue,profile,true);
    },impactDelay);
    setTimeout(function(){
        monsterEl.classList.remove('enemy-skill-'+id);
        heroEl.classList.remove('hero-hit-anim');
        if(effect)effect.remove();
    },1600);
}

function advanceBossSpecialAttack(){
    var special=getCurrentBossSpecial();
    if(!special)return null;
    bossAttackCount++;
    updateMonsterUI();
    return bossAttackCount%special.every===0?special:null;
}

function applyBossSpecialEffects(special){
    if(!special)return;
    if(special.heal)monsterHp=Math.min(monsterMaxHp,monsterHp+special.heal);
    if(special.chargeDrain)specialCharge=Math.max(0,specialCharge-special.chargeDrain);
    if(special.goldDrain){
        var stolen=Math.min(gold,special.goldDrain);
        gold-=stolen;
    }
    var goldEl=document.getElementById('gold-count');if(goldEl)goldEl.textContent=gold;
    updateMonsterUI();
    updateCharacterStatsUI();
    saveState();
}

function resolveMonsterDefeat(){
    if(isBossFight){
        apiBossDefeated()
        .then(function(bd){
            floor_num=bd.floor;gold=bd.gold;potions=bd.potions;hp=bd.hp;maxHp=bd.max_hp;bossesDefeated=bd.bosses_defeated;
            document.getElementById('floor-num').textContent=floor_num;document.getElementById('gold-count').textContent=gold;
            updatePotionDisplay();document.getElementById('bosses-beaten').textContent=bossesDefeated;
            applyBattleBackground();syncBackgroundMusic('game-screen');updatePlayerHP();showBossDefeat();
        });
    }else{
        apiMonsterDefeated(currentMonster.gold)
        .then(function(md){
            monstersDefeated=md.monsters_defeated;gold=md.gold;
            document.getElementById('monsters-slain').textContent=monstersDefeated;document.getElementById('gold-count').textContent=gold;
            updateCharacterStatsUI();
        });
        showToast(currentMonster.name+' DEFEATED! +'+currentMonster.gold+'g','info');
    }
}

function finishQuestionWithSpecialVictory(){
    answered=true;
    stopTimer();
    document.querySelectorAll('.choice-btn').forEach(function(btn){btn.classList.add('disabled');});
    document.getElementById('battle-banner').textContent='SPECIAL SKILL VICTORY!';
    var nextBtn=document.getElementById('next-btn');
    nextBtn.classList.add('show');
    nextBtn.textContent=isBossFight?'\u2193 DESCEND DEEPER':'\u2694 NEXT ENCOUNTER';
    updateCharacterStatsUI();
    resolveMonsterDefeat();
}

function useCharacterSpecial(){
    var special=getCharacterSpecial();
    if(!special||specialCharge<100||answered||!currentQuestion||monsterHp<=0){
        showToast('Special skill is not ready yet.','info');
        return;
    }

    specialCharge=Math.max(0,Math.min(100,Number(special.recharge)||0));
    if(special.resetTimer)startTimer();
    if(special.heal)hp=Math.min(maxHp,hp+special.heal);
    if(special.gold){gold+=special.gold;var goldEl=document.getElementById('gold-count');if(goldEl)goldEl.textContent=gold;}
    if(special.shield)specialShield=Math.max(specialShield,special.shield);

    var blocked=special.ignoreDefense?0:Math.min(monsterDefense,Math.max(0,special.damage-5));
    var specialDamage=Math.max(5,special.damage-blocked);
    monsterHp=Math.max(0,monsterHp-specialDamage);
    playCharacterSkillAnimation(selectedChar?selectedChar.id:'scholar',specialDamage,special.name);
    setTimeout(function(){playCharacterAttackSfx(selectedChar?selectedChar.id:'default',true);},90);
    showAbilityActivate(special.name+'! -'+specialDamage+' HP');
    showToast(special.name+' activated!','success');
    updateMonsterUI();
    updatePlayerHP();
    saveState();

    if(monsterHp<=0)finishQuestionWithSpecialVictory();
}

function selectAnswer(idx){
    if(answered)return;answered=true;
    updateCharacterStatsUI();
    unlockAudio();
    stopTimer();
    var btns=document.querySelectorAll('.choice-btn');
    btns.forEach(function(btn,i){btn.classList.add('disabled');if(i===currentQuestion.answer)btn.classList.add('correct');if(i===idx&&i!==currentQuestion.answer)btn.classList.add('wrong');});
    var answerIsCorrect=idx===currentQuestion.answer;
    var bossSpecial=answerIsCorrect?null:advanceBossSpecialAttack();
    var effectiveDmg=monsterAttack+(bossSpecial?bossSpecial.bonusDamage:0);var abilityHeal=0;var goldMult=1;
    if(selectedChar){
        var characterDefense=getCharacterBaseDefensePercent();
        if(characterDefense>0)effectiveDmg=Math.floor(effectiveDmg*(1-(characterDefense/100)));
        if(selectedChar.ability==='heal')abilityHeal=15;
        if(selectedChar.ability==='goldBoost'){goldMult=1.5;abilityHeal=5;}
    }
    if(buffDef>0)effectiveDmg=Math.floor(effectiveDmg*0.5);
    var shieldWasUsed=!answerIsCorrect&&specialShield>0;
    if(shieldWasUsed){effectiveDmg=0;specialShield--;}
    if(buffGold>0)goldMult*=2;
    var extraCrit=(buffCrit>0)?0.4:0;
    apiAnswer({qid:currentQuestion.id,selected:idx,correct:currentQuestion.answer,diff:currentQuestion.diff,monster_dmg:effectiveDmg,ability_heal:abilityHeal,gold_mult:goldMult})
    .then(function(data){
        score=data.score;streak=data.streak;totalCorrect=data.total_correct;totalAnswered=data.total_answered;
        bestStreak=data.best_streak;hp=data.hp;maxHp=data.max_hp;gold=data.total_gold;potions=data.potions;level=data.level;
        if(data.status==='correct'){
            specialCharge=Math.min(100,specialCharge+25);
            saveState();
            apiProgressionEvent('correct_answer',{
                difficulty:currentQuestion.diff,
                bestStreak:bestStreak,
                floor:floor_num,
                level:data.level,
                score:score
            },true);
        }else if(bossSpecial){
            applyBossSpecialEffects(bossSpecial);
        }
        document.getElementById('score').textContent=score;
        document.getElementById('player-level').textContent='LVL '+data.level;
        document.getElementById('streak').innerHTML=streak>0?'<span class="streak-fire">'+streak+'\uD83D\uDD25</span>':'0';
        document.getElementById('gold-count').textContent=gold;
        document.getElementById('best-streak').textContent=bestStreak;
        document.getElementById('accuracy').textContent=totalAnswered>0?Math.round(totalCorrect/totalAnswered*100)+'%':'0%';
        updatePotionDisplay();
        updatePlayerHP();

        if(data.status==='correct'){
            var baseAtk=getCharacterBaseAttack(currentDifficulty);
            var atkPower=baseAtk;var abilityMsg='';
            if(selectedChar){
                if(selectedChar.ability==='dmgBoost'){atkPower=Math.floor(baseAtk*getCharacterAttackMultiplier());abilityMsg='DMG +20%!';}
                if(selectedChar.ability==='critHit'){if(Math.random()<(0.3+extraCrit)){atkPower=baseAtk*2;abilityMsg='\u26A1 CRITICAL HIT! \u26A1';}
                }else if(extraCrit>0&&Math.random()<extraCrit){atkPower=baseAtk*2;abilityMsg='\u26A1 CRIT POTION! \u26A1';}
                if(selectedChar.ability==='addTime')abilityMsg=abilityMsg||'+5s TIMER!';
                if(selectedChar.ability==='heal')abilityMsg=abilityMsg||'HEALED +15!';
                if(selectedChar.ability==='goldBoost')abilityMsg=abilityMsg||'GOLD +50%!';
                if(selectedChar.ability==='defense')abilityMsg=abilityMsg||'SHIELDED!';
            }else if(extraCrit>0&&Math.random()<extraCrit){atkPower=baseAtk*2;abilityMsg='\u26A1 CRIT POTION! \u26A1';}
            updateBuffIndicators();
            var damageBlocked=Math.min(monsterDefense,Math.max(0,atkPower-5));
            atkPower=Math.max(5,atkPower-damageBlocked);
            var criticalImpact=/CRITICAL|CRIT POTION/.test(abilityMsg);
            playCharacterAttackAnimation(selectedChar?selectedChar.id:'scholar',atkPower,criticalImpact);
            setTimeout(function(){playCharacterAttackSfx(selectedChar?selectedChar.id:'default',false);},90);
            monsterHp=Math.max(0,monsterHp-atkPower);updateMonsterUI();
            showFloatingPoints('+'+data.points);if(abilityMsg)showAbilityActivate(abilityMsg);
            showToast('HIT! -'+atkPower+' HP to '+currentMonster.name+(damageBlocked?' (DEF blocked '+damageBlocked+')':''),'success');
            hideSpeechBubble();
            if(data.levelUp)showLevelUp(data.level);
            if(monsterHp<=0)resolveMonsterDefeat();
        }else{
            updateBuffIndicators();
            if(bossSpecial)playBossSkillAnimation(currentMonster?currentMonster.id:'stack_overflow',data.damage,bossSpecial.name);
            else playEnemyAttackAnimation(currentMonster?currentMonster.id:'bug_sprite',data.damage);
            setTimeout(function(){playMonsterAttackSfx(currentMonster?currentMonster.id:'default',isBossFight,!!bossSpecial);},90);
            document.getElementById('game-screen').classList.add('screen-shake');
            setTimeout(function(){document.getElementById('game-screen').classList.remove('screen-shake');},300);
            var dmgMsg=shieldWasUsed?'0 (AEGIS BLOCK)':(selectedChar&&selectedChar.ability==='defense'?data.damage+' (SHIELDED!)':data.damage);
            showFloatingDmg('-'+dmgMsg+' HP');
            if(bossSpecial){
                showToast('BOSS SPECIAL: '+bossSpecial.name+'! -'+data.damage+' HP','error');
                showAbilityActivate('BOSS: '+bossSpecial.name+'!');
                updateSpeech(bossSpecial.name+'!');
            }else{
                showToast('MISS! '+currentMonster.name+' attacks! -'+data.damage+' HP','error');
                updateSpeech(['Ouch!','Argh!','Not good!','Heal up!','Watch out!'][Math.floor(Math.random()*5)]);
            }
            if(shieldWasUsed)showAbilityActivate('AEGIS BLOCKED ALL DAMAGE!');
            if(!shieldWasUsed&&selectedChar&&selectedChar.ability==='defense')showAbilityActivate('SHIELD -50% DMG!');
            if(data.dead){showDeath();return;}
        }
        var explanationEl=document.getElementById('explanation');
        explanationEl.classList.add('show');document.getElementById('next-btn').classList.add('show');
        // Long code questions can push the explanation below the fold.
        if(explanationEl.scrollIntoView)explanationEl.scrollIntoView({block:'nearest',behavior:'smooth'});
        if(monsterHp<=0&&!isBossFight)document.getElementById('next-btn').textContent='\u2694 NEXT ENCOUNTER';
        else if(monsterHp<=0&&isBossFight)document.getElementById('next-btn').textContent='\u2193 DESCEND DEEPER';
        else document.getElementById('next-btn').textContent='\u2694 NEXT ATTACK';
    });
}

function nextAction(){if(monsterHp<=0){if(isBossFight)encounterCount=0;spawnMonster();}loadQuestion();}

function usePotion(){
    apiUsePotion()
    .then(function(data){
        if(data.status==='ok'){hp=data.hp;maxHp=data.max_hp;potions=data.potions;updatePlayerHP();
        updatePotionDisplay();showToast('Healed +'+data.healed+' HP!','success');showFloatingPoints('+'+data.healed+' HP');}
        else if(data.status==='full_hp')showToast('HP is already full!','info');
        else if(data.status!=='dead')showToast('No potions left! Buy healing in the shop.','error');
    });
}

function buyPotion(){
    apiBuyPotion()
    .then(function(data){
        if(data.status==='ok'){gold=data.gold;hp=data.hp;maxHp=data.max_hp;document.getElementById('gold-count').textContent=gold;
        updatePlayerHP();showToast('HP Potion healed +'+data.healed+' HP! -15g','success');showFloatingPoints('+'+data.healed+' HP');refreshShopGold();}
        else if(data.status==='full_hp')showToast('HP is already full!','info');
        else showToast('Not enough gold! Need 15g','error');
    });
}

