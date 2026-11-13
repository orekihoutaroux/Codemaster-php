// ===== 05. PLAYER PERSISTENCE AND STATE SYNCHRONIZATION =====
function getDefaultState(){
    return {
        score:0,level:1,streak:0,wrongStreak:0,bestStreak:0,totalCorrect:0,totalAnswered:0,
        answeredIds:[],hp:100,maxHp:100,floor:1,gold:0,potions:2,
        monstersDefeated:0,bossesDefeated:0,buffDef:0,buffGold:0,buffCrit:0,buffTime:0,
        specialCharge:0,specialShield:0
    };
}

function getDefaultProgression(){
    return {
        activeTitle:'PHP Novice',
        unlockedAchievementIds:[],
        unlockedAt:{},
        stats:{correctAnswers:0,hardAnswers:0,monstersDefeated:0,bossesDefeated:0,bestStreak:0,highestFloor:1,highestLevel:1,highestScore:0}
    };
}

function getCachedPlayerState(username){
    if(!username)return null;
    try{
        var cached=JSON.parse(localStorage.getItem(PLAYER_STATE_CACHE_PREFIX+username)||'null');
        return cached&&cached.state&&typeof cached.state==='object'?cached:null;
    }catch(err){return null;}
}

function setCachedPlayerState(username,state,savedAt,confirmedAt){
    if(!username)return;
    try{
        localStorage.setItem(PLAYER_STATE_CACHE_PREFIX+username,JSON.stringify({
            state:state,
            savedAt:savedAt||Date.now(),
            confirmedAt:confirmedAt||0
        }));
    }catch(err){console.warn('Could not cache player state:',err);}
}

function archiveAndResetActivePlayerProgress(){
    var username=localStorage.getItem(ACTIVE_PLAYER_SESSION_KEY)||'';
    document.body.setAttribute('data-progress-reset-target',username||'none');
    if(!username){document.body.setAttribute('data-progress-reset-status','skipped');return Promise.resolve({status:'skipped'});}

    localStorage.removeItem(ACTIVE_PLAYER_SESSION_KEY);
    document.body.setAttribute('data-progress-reset-status','pending');
    var cached=getCachedPlayerState(username);
    var snapshot=cached&&cached.state?cached.state:null;
    var snapshotSavedAt=cached&&cached.savedAt?cached.savedAt:0;
    var fresh=getDefaultState();
    var resetAt=Date.now();
    setCachedPlayerState(username,fresh,resetAt,0);

    return fetch('/api/players/'+encodeURIComponent(username)+'/progress/archive-reset',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({state:snapshot,savedAt:snapshotSavedAt}),
        keepalive:true
    })
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'){
            var confirmedAt=Date.parse(data.updatedAt||'')||resetAt;
            setCachedPlayerState(username,data.state||fresh,confirmedAt,confirmedAt);
        }
        document.body.setAttribute('data-progress-reset-status',data&&data.status?data.status:'unknown');
        return data;
    })
    .catch(function(err){
        console.error('Reload progress archive/reset failed:',err);
        if(cached){
            setCachedPlayerState(username,cached.state,cached.savedAt,cached.confirmedAt);
        }else{
            localStorage.removeItem(PLAYER_STATE_CACHE_PREFIX+username);
        }
        document.body.setAttribute('data-progress-reset-status','error');
        return {status:'error'};
    });
}

function persistPlayerState(username,state,savedAt){
    return fetch('/api/players/'+encodeURIComponent(username),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({state:state,savedAt:savedAt}),
        keepalive:true
    })
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'){
            var current=getCachedPlayerState(username);
            if(current&&current.savedAt===savedAt){
                setCachedPlayerState(username,current.state,current.savedAt,current.savedAt);
            }
        }
        return data;
    });
}

function mergeStoredState(defaults,stored){
    var s=stored||{};
    defaults.score=Number(s.score)||0;
    defaults.level=getLevelFromScore(defaults.score);
    defaults.streak=Number(s.streak)||0;
    defaults.wrongStreak=Number(s.wrongStreak)||0;
    defaults.bestStreak=Number(s.bestStreak)||0;
    defaults.totalCorrect=Number(s.totalCorrect)||0;
    defaults.totalAnswered=Number(s.totalAnswered)||0;
    defaults.answeredIds=Array.isArray(s.answeredIds)?s.answeredIds.slice():[];
    var storedMaxHp=Math.max(1,Number(s.maxHp)||getCharacterMaxHp(defaults.level));
    var storedHp=Number(s.hp);
    if(!Number.isFinite(storedHp))storedHp=storedMaxHp;
    var missingHp=Math.max(0,storedMaxHp-Math.max(0,Math.min(storedMaxHp,storedHp)));
    defaults.maxHp=getCharacterMaxHp(defaults.level);
    defaults.hp=Math.max(0,defaults.maxHp-missingHp);
    defaults.floor=Math.max(1,Number(s.floor)||1);
    defaults.gold=Number(s.gold)||0;
    // 0 is a valid potion count; only fall back when the value is missing.
    var storedPotions=Number(s.potions);
    defaults.potions=Number.isFinite(storedPotions)?Math.max(0,storedPotions):2;
    defaults.monstersDefeated=Number(s.monstersDefeated)||0;
    defaults.bossesDefeated=Number(s.bossesDefeated)||0;
    defaults.buffDef=Number(s.buffDef)||0;
    defaults.buffGold=Number(s.buffGold)||0;
    defaults.buffCrit=Number(s.buffCrit)||0;
    defaults.buffTime=Number(s.buffTime)||0;
    defaults.specialCharge=Math.max(0,Math.min(100,Number(s.specialCharge)||0));
    defaults.specialShield=Math.max(0,Math.min(1,Number(s.specialShield)||0));
    return defaults;
}

function loadState(username){
    // Fetches this player's save from MongoDB (via the API). Falls back to
    // fresh defaults if the player has no save yet, or the server is unreachable.
    var d=getDefaultState();
    if(!username){
        applyStateObject(d);
        return Promise.resolve(d);
    }
    var cached=null;
    return reloadProgressResetPromise
    .then(function(){
        cached=getCachedPlayerState(username);
        return fetch('/api/players/'+encodeURIComponent(username));
    })
    .then(function(res){return res.json();})
    .then(function(data){
        var stored=null;
        var serverState=data&&data.status==='ok'&&data.state&&typeof data.state==='object'?data.state:null;
        var serverTime=serverState?(Date.parse(data.updatedAt||'')||0):0;
        if(cached&&cached.savedAt>cached.confirmedAt&&(!serverState||cached.savedAt>serverTime)){
            // A reload may interrupt the final network response. Prefer the
            // newest local state once, then synchronize it back to MongoDB.
            stored=cached.state;
            persistPlayerState(username,cached.state,cached.savedAt)
                .catch(function(err){console.error('Cached state sync failed:',err);});
        }else if(serverState){
            stored=serverState;
            if(!serverTime)serverTime=Date.now();
            setCachedPlayerState(username,stored,serverTime,serverTime);
        }else if(cached){
            stored=cached.state;
        }
        if(stored)mergeStoredState(d,stored);
        applyStateObject(d);
        return d;
    })
    .catch(function(err){
        console.error('loadState failed, using local cache or defaults:',err);
        if(cached)mergeStoredState(d,cached.state);
        applyStateObject(d);
        return d;
    });
}

function applyStateObject(d){
    score=d.score;level=d.level;streak=d.streak;wrongStreak=d.wrongStreak;bestStreak=d.bestStreak;totalCorrect=d.totalCorrect;totalAnswered=d.totalAnswered;
    answeredIds=d.answeredIds;hp=d.hp;maxHp=d.maxHp;floor_num=d.floor;gold=d.gold;potions=d.potions;
    monstersDefeated=d.monstersDefeated;bossesDefeated=d.bossesDefeated;buffDef=d.buffDef;buffGold=d.buffGold;buffCrit=d.buffCrit;buffTime=d.buffTime;
    specialCharge=d.specialCharge;specialShield=d.specialShield;
}

function saveState(){
    var data={
        score:score,level:level,streak:streak,wrongStreak:wrongStreak,bestStreak:bestStreak,totalCorrect:totalCorrect,totalAnswered:totalAnswered,
        answeredIds:answeredIds.slice(),hp:hp,maxHp:maxHp,floor:floor_num,gold:gold,potions:potions,
        monstersDefeated:monstersDefeated,bossesDefeated:bossesDefeated,buffDef:buffDef,buffGold:buffGold,buffCrit:buffCrit,buffTime:buffTime,
        specialCharge:specialCharge,specialShield:specialShield
    };
    // Cache immediately so a refresh cannot lose the latest score/level, then
    // use a keepalive request so MongoDB persistence survives page unload.
    if(playerUsername){
        var savedAt=Date.now();
        var previous=getCachedPlayerState(playerUsername);
        setCachedPlayerState(playerUsername,data,savedAt,previous?previous.confirmedAt:0);
        persistPlayerState(playerUsername,data,savedAt)
            .catch(function(err){console.error('saveState failed:',err);});
    }
}

function resetState(){
    var d=getDefaultState();
    applyStateObject(d);
    applySelectedCharacterStats();
    saveState();
}

