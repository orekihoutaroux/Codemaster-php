// ===== DATABASE API REQUESTS =====
// Loads questions and sends battle, shop, player, and admin changes to Express.
// The question bank is stored in MongoDB and served by GET /api/questions.
// The offline copy is only a last resort so a network blip cannot end a run.
function loadQuestionsFromServer(){
    return fetch('/api/questions')
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'&&Array.isArray(data.questions)&&data.questions.length){
            QUESTIONS=data.questions;
            questionsFromDatabase=true;
            document.body.setAttribute('data-question-storage','mongodb');
            document.body.setAttribute('data-question-count',String(QUESTIONS.length));
        }else{
            useOfflineQuestionBank('The question database is empty.');
        }
        return QUESTIONS;
    })
    .catch(function(err){
        console.error('Failed to load questions from MongoDB:',err);
        useOfflineQuestionBank('Could not reach the question database.');
        return QUESTIONS;
    });
}

function useOfflineQuestionBank(reason){
    QUESTIONS=QUESTIONS_FALLBACK;
    questionsFromDatabase=false;
    document.body.setAttribute('data-question-storage','offline');
    document.body.setAttribute('data-question-count',String(QUESTIONS.length));
    console.warn(reason+' Using the offline question set; question edits cannot be saved.');
    if(!questionStorageWarned){
        questionStorageWarned=true;
        setTimeout(function(){showToast(reason+' Playing offline.','error');},400);
    }
}

function getProgressionMetrics(){
    return {
        totalCorrect:totalCorrect,
        monstersDefeated:monstersDefeated,
        bossesDefeated:bossesDefeated,
        bestStreak:bestStreak,
        floor:floor_num,
        level:level,
        score:score
    };
}

function loadPlayerProgression(){
    if(!playerUsername){
        playerProgression=getDefaultProgression();
        updatePlayerTitleUI();
        return Promise.resolve({status:'skipped'});
    }
    return fetch('/api/players/'+encodeURIComponent(playerUsername)+'/progression')
    .then(function(res){return res.json().then(function(data){if(!res.ok)throw new Error(data.message||'Could not load achievements');return data;});})
    .then(function(data){
        applyProgressionPayload(data,false);
        return data;
    })
    .catch(function(err){
        console.error('loadPlayerProgression failed:',err);
        updatePlayerTitleUI();
        renderAccountAchievements('Achievements are temporarily unavailable.');
        return {status:'error'};
    });
}

function apiProgressionEvent(event,metrics,showUnlocks){
    if(!playerUsername)return Promise.resolve({status:'skipped'});
    progressionEventQueue=progressionEventQueue
    .catch(function(){return null;})
    .then(function(){
        return fetch('/api/players/'+encodeURIComponent(playerUsername)+'/progression/event',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({event:event,metrics:metrics||getProgressionMetrics()})
        });
    })
    .then(function(res){return res.json().then(function(data){if(!res.ok)throw new Error(data.message||'Could not update achievements');return data;});})
    .then(function(data){
        applyProgressionPayload(data,showUnlocks!==false);
        return data;
    })
    .catch(function(err){
        console.error('apiProgressionEvent failed:',err);
        return {status:'error'};
    });
    return progressionEventQueue;
}

function getQuestionsWithEdits(){
    // The server already merges the base question bank with admin edits
    // (see /api/questions in server/server.js), so this is just the cache.
    return QUESTIONS;
}

function shuffle(arr){
    for(var i=arr.length-1;i>0;i--){
        var j=Math.floor(Math.random()*(i+1));
        var t=arr[i];arr[i]=arr[j];arr[j]=t;
    }
    return arr;
}

function shuffleQuestion(q){
    var correctText=q.choices[q.answer];
    var choices=shuffle(q.choices.slice());
    var answer=choices.indexOf(correctText);
    return {id:q.id,cat:q.cat,diff:q.diff,type:q.type,q:q.q,choices:choices,answer:answer,explain:q.explain};
}

function apiGetQuestion(isBoss){
    var difficulty=isBoss?'hard':(['easy','easy','easy','medium','medium'][Math.floor(Math.random()*5)]);
    var questions=getQuestionsWithEdits();
    var available=questions.filter(function(q){return q.diff===difficulty && answeredIds.indexOf(q.id)===-1;});
    if(available.length===0){
        answeredIds=answeredIds.filter(function(id){
            var found=questions.find(function(q){return q.id===id;});
            return !(found && found.diff===difficulty);
        });
        available=questions.filter(function(q){return q.diff===difficulty;});
    }
    if(available.length===0){
        return Promise.resolve({status:'error',message:'No '+difficulty+' questions are available.'});
    }
    var q=available[Math.floor(Math.random()*available.length)];
    var result=shuffleQuestion(q);
    saveState();
    return Promise.resolve({status:'ok',question:result,buffs:{def:buffDef,gold:buffGold,crit:buffCrit,time:buffTime}});
}

function apiAnswer(payload){
    var qid=parseInt(payload.qid,10)||0;
    var selected=parseInt(payload.selected,10)||0;
    var correctIdx=parseInt(payload.correct,10)||0;
    var isCorrect=(selected===correctIdx);
    totalAnswered++;
    answeredIds.push(qid);
    var parsedMonsterDmg=parseInt(payload.monster_dmg,10);
    var monsterDmg=isNaN(parsedMonsterDmg)?10:Math.max(0,parsedMonsterDmg);
    if(buffDef>0)buffDef--;
    if(buffGold>0)buffGold--;
    if(buffCrit>0)buffCrit--;
    if(buffTime>0)buffTime--;

    if(isCorrect){
        totalCorrect++;
        streak++;
        wrongStreak=0;
        if(streak>bestStreak)bestStreak=streak;
        var diff=payload.diff||'easy';
        var base=diff==='hard'?50:(diff==='medium'?25:10);
        var streakBonus=(diff==='easy')?(5*streak):(Math.min(streak,10)*2);
        var points=base+streakBonus;
        score+=points;
        var goldEarned=diff==='hard'?15:(diff==='medium'?8:3);
        var goldMult=parseFloat(payload.gold_mult||1);
        goldEarned=Math.floor(goldEarned*goldMult);
        gold+=goldEarned;
        var abilityHeal=parseInt(payload.ability_heal,10)||0;
        if(abilityHeal>0){hp=Math.min(maxHp,hp+abilityHeal);}
        var newLevel=getLevelFromScore(score);
        var leveledUp=newLevel>level;
        if(leveledUp){maxHp=getCharacterMaxHp(newLevel);}
        level=newLevel;
        saveState();
        return Promise.resolve({status:'correct',points:points,gold:goldEarned,streak:streak,score:score,level:level,levelUp:leveledUp,total_correct:totalCorrect,total_answered:totalAnswered,best_streak:bestStreak,hp:hp,max_hp:maxHp,total_gold:gold,potions:potions});
    }

    streak=0;
    wrongStreak++;
    var extraDmg=(wrongStreak>1)?((wrongStreak-1)*2):0;
    var totalDmg=monsterDmg+extraDmg;
    hp=Math.max(0,hp-totalDmg);
    saveState();
    return Promise.resolve({status:'wrong',damage:totalDmg,streak:0,score:score,level:level,total_correct:totalCorrect,total_answered:totalAnswered,best_streak:bestStreak,hp:hp,max_hp:maxHp,total_gold:gold,potions:potions,dead:hp<=0});
}

function apiUsePotion(){
    if(hp<=0)return Promise.resolve({status:'dead'});
    if(potions>0&&hp>=maxHp)return Promise.resolve({status:'full_hp'});
    if(potions>0){
        var healedAmount=Math.min(30,maxHp-hp);
        potions--;hp=Math.min(maxHp,hp+30);
        saveState();
        return Promise.resolve({status:'ok',hp:hp,max_hp:maxHp,potions:potions,healed:healedAmount});
    }
    return Promise.resolve({status:'no_potions'});
}

function apiMonsterDefeated(reward){
    var goldReward=Math.max(0,parseInt(reward,10)||5);
    monstersDefeated++;gold+=goldReward;saveState();
    var result={status:'ok',monsters_defeated:monstersDefeated,gold:gold};
    return apiProgressionEvent('monster_defeated',getProgressionMetrics(),true).then(function(){return result;});
}

function apiBossDefeated(){
    bossesDefeated++;floor_num++;gold+=25;potions+=1;hp=maxHp;saveState();
    var result={status:'ok',bosses_defeated:bossesDefeated,floor:floor_num,gold:gold,potions:potions,hp:hp,max_hp:maxHp};
    return apiProgressionEvent('boss_defeated',getProgressionMetrics(),true).then(function(){return result;});
}

function apiBuyPotion(){
    if(hp>=maxHp)return Promise.resolve({status:'full_hp',hp:hp,max_hp:maxHp,gold:gold});
    if(gold>=15){
        gold-=15;
        var healed=Math.min(30,maxHp-hp);
        hp+=healed;
        saveState();
        return Promise.resolve({status:'ok',gold:gold,hp:hp,max_hp:maxHp,healed:healed});
    }
    return Promise.resolve({status:'no_gold'});
}

function apiBuyBuff(action){
    if(action==='buy_def_potion'){
        if(gold>=20){gold-=20;buffDef+=3;saveState();return Promise.resolve({status:'ok',gold:gold,buff_def:buffDef});}
        return Promise.resolve({status:'no_gold'});
    }
    if(action==='buy_gold_potion'){
        if(gold>=25){gold-=25;buffGold+=3;saveState();return Promise.resolve({status:'ok',gold:gold,buff_gold:buffGold});}
        return Promise.resolve({status:'no_gold'});
    }
    if(action==='buy_crit_potion'){
        if(gold>=30){gold-=30;buffCrit+=3;saveState();return Promise.resolve({status:'ok',gold:gold,buff_crit:buffCrit});}
        return Promise.resolve({status:'no_gold'});
    }
    if(action==='buy_time_potion'){
        if(gold>=20){gold-=20;buffTime+=3;saveState();return Promise.resolve({status:'ok',gold:gold,buff_time:buffTime});}
        return Promise.resolve({status:'no_gold'});
    }
    return Promise.resolve({status:'no_gold'});
}

function apiReset(){
    if(playerUsername){
        return fetch('/api/players/'+encodeURIComponent(playerUsername)+'/reset',{method:'POST'})
        .then(function(res){return res.json();})
        .then(function(){
            resetState(); // also syncs local vars + fires a redundant-but-harmless save
            return {status:'reset'};
        })
        .catch(function(err){
            console.error('apiReset server call failed, resetting locally only:',err);
            resetState();
            return {status:'reset'};
        });
    }
    resetState();
    return Promise.resolve({status:'reset'});
}

function apiAdminListQuestions(){
    return loadQuestionsFromServer().then(function(){
        return {status:'ok',questions:QUESTIONS,storage:questionsFromDatabase?'mongodb':'offline'};
    });
}

function apiAdminSaveQuestion(body){
    var id=parseInt(body.id,10)||0;
    var choices=[
        String(body.choice_0||'').trim(),
        String(body.choice_1||'').trim(),
        String(body.choice_2||'').trim(),
        String(body.choice_3||'').trim()
    ];
    var answer=parseInt(body.answer,10)||0;
    if(id<=0||choices.indexOf('')!==-1||answer<0||answer>3){
        return Promise.resolve({status:'error',message:'Invalid question data'});
    }
    return adminFetch('/api/admin/questions',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
    })
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'&&data.question){
            var idx=QUESTIONS.findIndex(function(q){return q.id===data.question.id;});
            if(idx>=0){QUESTIONS[idx]=data.question;}else{QUESTIONS.push(data.question);}
        }
        return data;
    })
    .catch(function(err){
        console.error('apiAdminSaveQuestion failed:',err);
        return {status:'error',message:'Network error saving question'};
    });
}

function apiAdminResetQuestions(){
    return adminFetch('/api/admin/questions/reset',{method:'POST'})
    .then(function(res){return res.json();})
    .then(function(data){
        return loadQuestionsFromServer().then(function(){return data;});
    })
    .catch(function(err){
        console.error('apiAdminResetQuestions failed:',err);
        return {status:'error'};
    });
}

function apiAdminListUsers(){
    return adminFetch('/api/admin/users')
    .then(function(res){return res.json();})
    .catch(function(err){
        console.error('apiAdminListUsers failed:',err);
        return {status:'error',players:[]};
    });
}

function apiAdminSaveUser(username,state){
    return adminFetch('/api/players/'+encodeURIComponent(username),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({state:state})
    })
    .then(function(res){return res.json();})
    .catch(function(err){
        console.error('apiAdminSaveUser failed:',err);
        return {status:'error'};
    });
}

function apiAdminListCategories(){
    return adminFetch('/api/admin/categories')
    .then(function(res){return res.json();})
    .catch(function(){return {status:'error',categories:[]};});
}

function apiAdminAddCategory(name){
    return adminFetch('/api/admin/categories',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:name})
    })
    .then(function(res){return res.json();})
    .catch(function(){return {status:'error',message:'Network error adding category'};});
}

function apiAdminDeleteCategory(name){
    return adminFetch('/api/admin/categories/'+encodeURIComponent(name),{method:'DELETE'})
    .then(function(res){return res.json();})
    .catch(function(){return {status:'error',message:'Network error deleting category'};});
}

function apiAdminListAdmins(){
    return adminFetch('/api/admin/admins')
    .then(function(res){return res.json();})
    .catch(function(){return {status:'error',admins:[]};});
}

function apiAdminAddAdmin(username,password){
    return adminFetch('/api/admin/admins',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username:username,password:password})
    })
    .then(function(res){return res.json();})
    .catch(function(){return {status:'error',message:'Network error adding admin'};});
}

function apiAdminRemoveAdmin(username){
    return adminFetch('/api/admin/admins/'+encodeURIComponent(username),{method:'DELETE'})
    .then(function(res){return res.json();})
    .catch(function(){return {status:'error',message:'Network error removing admin'};});
}

function apiAdminDeleteUser(username){
    return adminFetch('/api/players/'+encodeURIComponent(username),{method:'DELETE'})
    .then(function(res){return res.json();})
    .catch(function(err){
        console.error('apiAdminDeleteUser failed:',err);
        return {status:'error'};
    });
}

