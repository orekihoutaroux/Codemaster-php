// ===== 16. ADMIN QUESTION AND USER MANAGEMENT =====
function openAdminDashboard(){
    var overlay=document.getElementById('admin-overlay');
    if(!overlay)return;
    if(!adminToken){openAdminLogin();return;}
    // Confirm the saved session is still valid; adminFetch sends the admin
    // back to the login if it has expired or the account was removed.
    adminFetch('/api/admin/admins').then(function(res){
        if(res.ok)return res.json().then(function(data){if(data&&data.you)adminUsername=data.you;});
    }).catch(function(){});
    overlay.style.display='flex';
    switchAdminTab('questions');
}

var ADMIN_TABS={
    questions:{title:'QUESTION EDITOR',subtitle:'Changes are stored in the database and immediately affect the quiz question pool.',reload:function(){reloadAdminQuestions();}},
    users:{title:'MANAGE USERS',subtitle:'Saved players and leaderboard entries in one list. Edit a save, or create a profile from a leaderboard entry.',reload:function(){reloadAdminUsers();}},
    admins:{title:'MANAGE ADMINS',subtitle:'Accounts that can open this dashboard. Passwords are stored hashed in MongoDB.',reload:function(){reloadAdminAdmins();}}
};

function switchAdminTab(tab){
    if(!ADMIN_TABS[tab])tab='questions';
    adminActiveTab=tab;
    Object.keys(ADMIN_TABS).forEach(function(name){
        var on=name===tab;
        var tabBtn=document.getElementById('admin-tab-'+name);
        var panel=document.getElementById('admin-'+name+'-panel');
        var actions=document.getElementById('admin-'+name+'-actions');
        if(tabBtn)tabBtn.classList.toggle('active',on);
        if(panel)panel.style.display=on?'grid':'none';
        if(actions)actions.style.display=on?'flex':'none';
    });
    var title=document.getElementById('admin-panel-title');
    var subtitle=document.getElementById('admin-panel-subtitle');
    if(title)title.textContent=ADMIN_TABS[tab].title;
    if(subtitle){subtitle.textContent=ADMIN_TABS[tab].subtitle;subtitle.classList.remove('admin-subtitle-warning');}
    ADMIN_TABS[tab].reload();
}

// Says where the questions on screen came from, so a database that is not
// reachable can never look like a working editor.
function showAdminQuestionStorage(storage,count){
    var subtitle=document.getElementById('admin-panel-subtitle');
    if(!subtitle||adminActiveTab!=='questions')return;
    if(storage==='mongodb'){
        subtitle.textContent=count+' question'+(count===1?'':'s')+' stored in MongoDB (database collection "questions"). Every change you save here is written to it and used by the quiz immediately.';
        subtitle.classList.remove('admin-subtitle-warning');
    }else{
        subtitle.textContent='Could not reach the question database. These are the offline questions built into the page - changes cannot be saved. Start the server and reload.';
        subtitle.classList.add('admin-subtitle-warning');
    }
}

function formatAdminDate(value){
    var date=value?new Date(value):null;
    if(!date||isNaN(date.getTime()))return 'unknown';
    return date.toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}

function getNextQuestionId(){
    var maxId=0;
    QUESTIONS.forEach(function(q){if(q.id>maxId)maxId=q.id;});
    return maxId+1;
}

function closeAdminDashboard(){
    var overlay=document.getElementById('admin-overlay');
    if(overlay)overlay.style.display='none';
}

function reloadAdminQuestions(){
    var list=document.getElementById('admin-question-list');
    if(list)list.innerHTML='<div class="admin-empty">Loading questions...</div>';
    apiAdminListQuestions()
    .then(function(data){
        adminQuestionsCache=Array.isArray(data.questions)?data.questions:[];
        showAdminQuestionStorage(data.storage,adminQuestionsCache.length);
        if(!adminQuestionsCache.length){
            if(list)list.innerHTML='<div class="admin-empty">No questions found.</div>';
            return;
        }
        if(!adminCurrentQuestionId || !adminQuestionsCache.some(function(q){return String(q.id)===String(adminCurrentQuestionId);})){adminCurrentQuestionId=adminQuestionsCache[0].id;}
        renderAdminQuestionList();
        selectAdminQuestion(adminCurrentQuestionId,false);
    }).catch(function(){
        if(list)list.innerHTML='<div class="admin-empty">Failed to load questions.</div>';
        showToast('Failed to load question list','error');
    });
}

function renderAdminQuestionList(){
    var list=document.getElementById('admin-question-list');
    if(!list)return;
    list.innerHTML='';
    adminQuestionsCache.forEach(function(question){
        var item=document.createElement('div');
        item.className='admin-list-item'+(String(question.id)===String(adminCurrentQuestionId)?' active':'');
        var storageLabel=question.isCustom===true||question.source==='admin'?' | CUSTOM':(question.edited?' | EDITED':'');
        item.innerHTML='<div class="admin-question-id">#'+escapeHtml(question.id)+' | '+escapeHtml(question.diff)+' | '+escapeHtml(question.cat)+storageLabel+'</div><div class="admin-question-snippet">'+escapeHtml(shortAdminText(decodeEntities(question.q)))+'</div>';
        item.onclick=function(){selectAdminQuestion(question.id);};
        list.appendChild(item);
    });
}

function selectAdminQuestion(id,updateList){
    if(updateList===undefined)updateList=true;
    adminCurrentQuestionId=id;
    if(updateList)renderAdminQuestionList();
    var question=adminQuestionsCache.find(function(q){return String(q.id)===String(id);});
    if(!question)return;
    document.getElementById('admin-question-id').value=question.id;
    document.getElementById('admin-cat').value=question.cat||'';
    document.getElementById('admin-diff').value=question.diff||'easy';
    document.getElementById('admin-type').value=question.type||'multiple';
    document.getElementById('admin-q').value=question.q||'';
    document.getElementById('admin-choice-0').value=(question.choices&&question.choices[0])||'';
    document.getElementById('admin-choice-1').value=(question.choices&&question.choices[1])||'';
    document.getElementById('admin-choice-2').value=(question.choices&&question.choices[2])||'';
    document.getElementById('admin-choice-3').value=(question.choices&&question.choices[3])||'';
    document.getElementById('admin-answer').value=String(question.answer!==undefined?question.answer:0);
    document.getElementById('admin-explain').value=question.explain||'';
    var isCustom=question.isCustom===true||question.source==='admin';
    document.getElementById('admin-status').textContent=isCustom?
        'Editing custom question #'+question.id+'. Saved in MongoDB.':
        'Editing starter question #'+question.id+'. Changes are saved in MongoDB.';
}

function createNewQuestion(){
    var id=getNextQuestionId();
    adminCurrentQuestionId=id;
    var list=document.getElementById('admin-question-list');
    if(list){
        renderAdminQuestionList();
    }
    document.getElementById('admin-question-id').value=id;
    document.getElementById('admin-cat').value='basics';
    document.getElementById('admin-diff').value='easy';
    document.getElementById('admin-type').value='multiple';
    document.getElementById('admin-q').value='';
    document.getElementById('admin-choice-0').value='';
    document.getElementById('admin-choice-1').value='';
    document.getElementById('admin-choice-2').value='';
    document.getElementById('admin-choice-3').value='';
    document.getElementById('admin-answer').value='0';
    document.getElementById('admin-explain').value='';
    document.getElementById('admin-status').textContent='New question #'+id+'. Saving stores it in MongoDB.';
}

function saveAdminQuestion(){
    var body={
        id:document.getElementById('admin-question-id').value||'0',
        cat:document.getElementById('admin-cat').value,
        diff:document.getElementById('admin-diff').value,
        type:document.getElementById('admin-type').value,
        q:document.getElementById('admin-q').value,
        choice_0:document.getElementById('admin-choice-0').value,
        choice_1:document.getElementById('admin-choice-1').value,
        choice_2:document.getElementById('admin-choice-2').value,
        choice_3:document.getElementById('admin-choice-3').value,
        answer:document.getElementById('admin-answer').value,
        explain:document.getElementById('admin-explain').value
    };
    apiAdminSaveQuestion(body)
    .then(function(data){
        if(data.status==='ok'){
            var savedMessages={created:'Question added to MongoDB',updated_custom:'Custom question updated in MongoDB',updated_builtin:'Starter question updated in MongoDB'};
            showToast(savedMessages[data.persistence]||'Question saved in MongoDB','success');
            reloadAdminQuestions();
        } else {
            showToast(data.message||'Could not save question','error');
        }
    }).catch(function(){showToast('Could not save question','error');});
}

function resetAdminQuestions(){
    var overlay=document.getElementById('admin-reset-confirm-overlay');
    if(!overlay)return;
    adminResetFocusReturn=document.activeElement;
    overlay.style.display='flex';
    overlay.setAttribute('aria-busy','false');
    var confirmBtn=document.getElementById('admin-reset-confirm-btn');
    var cancelBtn=document.getElementById('admin-reset-cancel-btn');
    if(confirmBtn){confirmBtn.disabled=false;confirmBtn.textContent='CONFIRM RESET';}
    if(cancelBtn)cancelBtn.disabled=false;
    setTimeout(function(){if(cancelBtn)cancelBtn.focus();},0);
}

function cancelResetAdminQuestions(){
    var overlay=document.getElementById('admin-reset-confirm-overlay');
    if(overlay)overlay.style.display='none';
    if(adminResetFocusReturn&&typeof adminResetFocusReturn.focus==='function')adminResetFocusReturn.focus();
    adminResetFocusReturn=null;
}

function confirmResetAdminQuestions(){
    var overlay=document.getElementById('admin-reset-confirm-overlay');
    var confirmBtn=document.getElementById('admin-reset-confirm-btn');
    var cancelBtn=document.getElementById('admin-reset-cancel-btn');
    if(confirmBtn){confirmBtn.disabled=true;confirmBtn.textContent='RESETTING...';}
    if(cancelBtn)cancelBtn.disabled=true;
    if(overlay)overlay.setAttribute('aria-busy','true');
    apiAdminResetQuestions()
    .then(function(data){
        if(data.status==='ok'){
            adminCurrentQuestionId=null;
            cancelResetAdminQuestions();
            showToast('Starter questions restored in MongoDB. Added questions were kept.','info');
            reloadAdminQuestions();
        } else {
            showToast('Could not reset edits','error');
            if(confirmBtn){confirmBtn.disabled=false;confirmBtn.textContent='CONFIRM RESET';}
            if(cancelBtn)cancelBtn.disabled=false;
            if(overlay)overlay.setAttribute('aria-busy','false');
        }
    }).catch(function(){
        showToast('Could not reset edits','error');
        if(confirmBtn){confirmBtn.disabled=false;confirmBtn.textContent='CONFIRM RESET';}
        if(cancelBtn)cancelBtn.disabled=false;
        if(overlay)overlay.setAttribute('aria-busy','false');
    });
}

function reloadAdminUsers(){
    var list=document.getElementById('admin-user-list');
    if(list)list.innerHTML='<div class="admin-empty">Loading users...</div>';
    apiAdminListUsers()
    .then(function(data){
        adminUsersCache=Array.isArray(data.players)?data.players:[];
        if(!adminUsersCache.length){
            if(list)list.innerHTML='<div class="admin-empty">No saved players yet.</div>';
            clearAdminUserForm();
            return;
        }
        if(!adminCurrentUsername || !adminUsersCache.some(function(p){return p.username===adminCurrentUsername;})){adminCurrentUsername=adminUsersCache[0].username;}
        renderAdminUserList();
        selectAdminUser(adminCurrentUsername,false);
    }).catch(function(){
        if(list)list.innerHTML='<div class="admin-empty">Failed to load users.</div>';
        showToast('Failed to load user list','error');
    });
}

function renderAdminUserList(){
    var list=document.getElementById('admin-user-list');
    if(!list)return;
    list.innerHTML='';
    adminUsersCache.forEach(function(player){
        var s=player.state||{};
        var source=player.leaderboardOnly?'LEADERBOARD':'SAVED PLAYER';
        var rank=player.leaderboard&&player.leaderboard.rank?' | Rank #'+player.leaderboard.rank:'';
        var item=document.createElement('div');
        item.className='admin-list-item'+(player.username===adminCurrentUsername?' active':'');
        item.innerHTML='<div class="admin-user-row"><span class="admin-user-name">'+escapeHtml(player.username)+'</span><span class="admin-user-score">'+(s.score||0)+' pts</span></div>'+ 
                        '<div class="admin-user-meta">'+source+rank+' | Floor '+(s.floor||1)+' | Lvl '+(s.level||1)+'</div>'+
                        '<div class="admin-user-meta">Updated '+escapeHtml(formatAdminDate(player.updatedAt))+'</div>';
        item.onclick=function(){selectAdminUser(player.username);};
        list.appendChild(item);
    });
}

function selectAdminUser(username,updateList){
    if(updateList===undefined)updateList=true;
    adminCurrentUsername=username;
    if(updateList)renderAdminUserList();
    var player=adminUsersCache.find(function(p){return p.username===username;});
    if(!player)return;
    var s=player.state||{};
    document.getElementById('admin-user-username').value=player.username;
    document.getElementById('admin-user-updated').value=formatAdminDate(player.updatedAt);
    document.getElementById('admin-user-score').value=s.score||0;
    document.getElementById('admin-user-level').value=getLevelFromScore(s.score||0);
    document.getElementById('admin-user-floor').value=s.floor||1;
    document.getElementById('admin-user-gold').value=s.gold||0;
    document.getElementById('admin-user-hp').value=s.hp||0;
    document.getElementById('admin-user-maxhp').value=s.maxHp||100;
    document.getElementById('admin-user-potions').value=s.potions||0;
    document.getElementById('admin-user-monsters').value=s.monstersDefeated||0;
    document.getElementById('admin-user-bosses').value=s.bossesDefeated||0;
    var resetBtn=document.getElementById('admin-user-reset');
    var deleteBtn=document.getElementById('admin-user-delete');
    var saveBtn=document.getElementById('admin-user-save');
    if(resetBtn)resetBtn.disabled=!!player.leaderboardOnly;
    if(deleteBtn)deleteBtn.disabled=!!player.leaderboardOnly;
    if(saveBtn){saveBtn.disabled=false;saveBtn.textContent=player.leaderboardOnly?'CREATE PLAYER':'SAVE CHANGES';}
    document.getElementById('admin-user-status').textContent=player.leaderboardOnly?
        'Leaderboard entry. Save to create a manageable player profile.':
        'Editing '+player.username+'.';
}

function clearAdminUserForm(){
    ['admin-user-username','admin-user-updated','admin-user-score','admin-user-level','admin-user-floor',
     'admin-user-gold','admin-user-hp','admin-user-maxhp','admin-user-potions','admin-user-monsters','admin-user-bosses'
    ].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
    document.getElementById('admin-user-status').textContent='Select a user to manage them.';
    ['admin-user-reset','admin-user-delete','admin-user-save'].forEach(function(id){
        var button=document.getElementById(id);if(button)button.disabled=true;
    });
}

function saveAdminUser(){
    if(!adminCurrentUsername)return;
    var player=adminUsersCache.find(function(p){return p.username===adminCurrentUsername;});
    if(!player)return;
    // Start from the player's full saved state (preserves fields not shown in
    // this form, like answeredIds and buffs) and overlay the edited fields.
    var state=Object.assign({},player.state);
    state.score=Math.max(0,parseInt(document.getElementById('admin-user-score').value,10)||0);
    // Level is always derived from score (the game recalculates it on load).
    state.level=getLevelFromScore(state.score);
    state.floor=Math.max(1,parseInt(document.getElementById('admin-user-floor').value,10)||1);
    state.gold=Math.max(0,parseInt(document.getElementById('admin-user-gold').value,10)||0);
    state.maxHp=Math.max(1,parseInt(document.getElementById('admin-user-maxhp').value,10)||100);
    state.hp=Math.max(0,Math.min(state.maxHp,parseInt(document.getElementById('admin-user-hp').value,10)||0));
    state.potions=Math.max(0,parseInt(document.getElementById('admin-user-potions').value,10)||0);
    state.monstersDefeated=parseInt(document.getElementById('admin-user-monsters').value,10)||0;
    state.bossesDefeated=parseInt(document.getElementById('admin-user-bosses').value,10)||0;
    apiAdminSaveUser(adminCurrentUsername,state)
    .then(function(data){
        if(data.status==='ok'){
            showToast('User updated','success');
            reloadAdminUsers();
        } else {
            showToast(data.message||'Could not save user','error');
        }
    }).catch(function(){showToast('Could not save user','error');});
}

function resetAdminUserProgress(){
    if(!adminCurrentUsername)return;
    if(!confirm('Reset '+adminCurrentUsername+'\'s progress back to defaults?'))return;
    adminFetch('/api/players/'+encodeURIComponent(adminCurrentUsername)+'/reset',{method:'POST'})
    .then(function(res){return res.json();})
    .then(function(data){
        if(data.status==='ok'){
            showToast('Progress reset','info');
            reloadAdminUsers();
        } else {
            showToast('Could not reset progress','error');
        }
    }).catch(function(){showToast('Could not reset progress','error');});
}

function deleteAdminUser(){
    if(!adminCurrentUsername)return;
    if(!confirm('Delete '+adminCurrentUsername+'\'s save permanently? This cannot be undone.'))return;
    apiAdminDeleteUser(adminCurrentUsername)
    .then(function(data){
        if(data.status==='ok'){
            showToast('User deleted','info');
            adminCurrentUsername=null;
            reloadAdminUsers();
        } else {
            showToast(data.message||'Could not delete user','error');
        }
    }).catch(function(){showToast('Could not delete user','error');});
}


// ===== MANAGE ADMINS =====
var adminAdminsCache=[];
var adminSelectedAdmin='';

function reloadAdminAdmins(){
    var list=document.getElementById('admin-admin-list');
    if(list)list.innerHTML='<div class="admin-empty">Loading admins...</div>';
    apiAdminListAdmins().then(function(data){
        adminAdminsCache=(data&&Array.isArray(data.admins))?data.admins:[];
        if(data&&data.you)adminUsername=data.you;
        if(adminSelectedAdmin&&!adminAdminsCache.some(function(a){return a.username===adminSelectedAdmin;}))adminSelectedAdmin='';
        renderAdminAdminList();
        updateAdminRemoveButton();
    });
}

function renderAdminAdminList(){
    var list=document.getElementById('admin-admin-list');
    if(!list)return;
    if(!adminAdminsCache.length){list.innerHTML='<div class="admin-empty">No admins found.</div>';return;}
    list.innerHTML=adminAdminsCache.map(function(admin){
        var isYou=admin.username===adminUsername;
        var meta=(isYou?'YOU | ':'')+'Added '+formatAdminDate(admin.createdAt)+(admin.createdBy?' by '+admin.createdBy:'');
        var last=admin.lastLoginAt?'Last login '+formatAdminDate(admin.lastLoginAt):'Never logged in';
        return '<button type="button" class="admin-list-item'+(admin.username===adminSelectedAdmin?' active':'')+'" data-username="'+escapeHtml(admin.username)+'">'+
            '<div class="admin-question-id">'+escapeHtml(meta)+'</div>'+
            '<div class="admin-question-snippet">'+escapeHtml(admin.username)+'</div>'+
            '<div class="admin-question-id">'+escapeHtml(last)+'</div></button>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.admin-list-item'),function(btn){
        btn.onclick=function(){selectAdminAdmin(btn.getAttribute('data-username'));};
    });
}

function selectAdminAdmin(username){
    adminSelectedAdmin=adminSelectedAdmin===username?'':username;
    renderAdminAdminList();
    updateAdminRemoveButton();
}

function updateAdminRemoveButton(){
    var btn=document.getElementById('admin-admin-remove');
    var status=document.getElementById('admin-admin-status');
    if(!btn)return;
    var canRemove=!!adminSelectedAdmin&&adminSelectedAdmin!==adminUsername&&adminAdminsCache.length>1;
    btn.disabled=!canRemove;
    btn.textContent=adminSelectedAdmin?'REMOVE '+adminSelectedAdmin.toUpperCase():'REMOVE SELECTED';
    if(status&&adminSelectedAdmin===adminUsername)status.textContent='That is you. Log in as another admin to remove this account.';
}

function startAddAdmin(){
    adminSelectedAdmin='';
    renderAdminAdminList();
    updateAdminRemoveButton();
    ['admin-new-username','admin-new-password','admin-new-password-confirm'].forEach(function(id){
        var el=document.getElementById(id);if(el)el.value='';
    });
    var status=document.getElementById('admin-admin-status');
    if(status)status.textContent='Choose a username and password for the new admin.';
    var user=document.getElementById('admin-new-username');
    if(user)user.focus();
}

function submitAddAdmin(evt){
    if(evt)evt.preventDefault();
    var userEl=document.getElementById('admin-new-username');
    var passEl=document.getElementById('admin-new-password');
    var confirmEl=document.getElementById('admin-new-password-confirm');
    var status=document.getElementById('admin-admin-status');
    var username=(userEl?userEl.value:'').trim();
    var password=passEl?passEl.value:'';
    var confirmPass=confirmEl?confirmEl.value:'';
    var problem='';
    if(!/^[A-Za-z0-9_.-]{3,24}$/.test(username))problem='Username must be 3-24 letters, numbers, dots, dashes or underscores.';
    else if(password.length<6)problem='Password must be at least 6 characters.';
    else if(password!==confirmPass)problem='The two passwords do not match.';
    if(problem){if(status)status.textContent=problem;showToast(problem,'error');return false;}
    var addBtn=document.getElementById('admin-admin-add');
    if(addBtn)addBtn.disabled=true;
    if(status)status.textContent='Adding '+username+'...';
    apiAdminAddAdmin(username,password).then(function(data){
        if(addBtn)addBtn.disabled=false;
        if(data&&data.status==='ok'){
            if(passEl)passEl.value='';
            if(confirmEl)confirmEl.value='';
            if(userEl)userEl.value='';
            if(status)status.textContent='Admin '+data.admin.username+' added. They can log in now.';
            showToast('Admin '+data.admin.username+' added','success');
            reloadAdminAdmins();
        }else{
            var msg=(data&&data.message)||'Could not add admin';
            if(status)status.textContent=msg;
            showToast(msg,'error');
        }
    });
    return false;
}

function removeSelectedAdmin(){
    var username=adminSelectedAdmin;
    if(!username||username===adminUsername)return;
    if(!confirm('Remove admin "'+username+'"? They will be logged out and can no longer open the dashboard.'))return;
    var status=document.getElementById('admin-admin-status');
    apiAdminRemoveAdmin(username).then(function(data){
        if(data&&data.status==='ok'){
            adminSelectedAdmin='';
            if(status)status.textContent='Admin '+username+' removed.';
            showToast('Admin '+username+' removed','info');
            reloadAdminAdmins();
        }else{
            var msg=(data&&data.message)||'Could not remove admin';
            if(status)status.textContent=msg;
            showToast(msg,'error');
        }
    });
}
