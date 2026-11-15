// ===== 11. ACCOUNT ACCESS AND GAME ENTRY =====
function apiCheckUsernameAvailability(username){
    return fetch('/api/players/'+encodeURIComponent(username))
    .then(function(res){
        return res.json().then(function(data){
            if(!res.ok)throw new Error((data&&data.message)||'Could not check the username. Please try again.');
            if(data&&data.status==='not_found')return true;
            if(data&&data.status==='ok')return false;
            throw new Error('Could not check the username. Please try again.');
        });
    });
}

function apiStartPlayer(username,password){
    return fetch('/api/players/'+encodeURIComponent(username)+'/start',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            password:password,
            role:playerRole,
            yearLevel:playerYearLevel,
            block:playerBlock,
            character:selectedChar?selectedChar.name:''
        })
    })
    .then(function(res){
        return res.json().then(function(data){
            if(!res.ok || !data || data.status!=='ok'){
                throw new Error((data&&data.message)||'Could not create player');
            }
            return data;
        });
    });
}

function apiLoginPlayer(username,password){
    return fetch('/api/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username:username,password:password})
    })
    .then(function(res){
        return res.json().then(function(data){
            if(!res.ok || !data || data.status!=='ok'){
                throw new Error((data&&data.message)||'Could not log in');
            }
            return data;
        });
    });
}

function launchDungeon(message){
    localStorage.setItem(ACTIVE_PLAYER_SESSION_KEY,playerUsername);
    document.body.setAttribute('data-active-player',playerUsername);
    if(hp<=0){
        hp=maxHp;
        streak=0;
        wrongStreak=0;
        saveState();
    }
    showScreen('game-screen');
    document.getElementById('player-name').textContent=playerUsername+' | '+playerRole;
    updatePlayerTitleUI();
    SPR.drawTo(document.getElementById('header-avatar'),'hero',selectedChar.id,{crop:'bust'});
    if(selectedChar.ability==='addTime')TIMER_MAX=35;else TIMER_MAX=30;
    var progEl=document.getElementById('lex-progress-fill');if(progEl)progEl.style.width='5%';
    document.getElementById('player-level').textContent='LVL '+level;
    updatePlayerHP();
    startCharacterAnimation();encounterCount=0;spawnMonster();loadQuestion();
    if(message)showToast(message,'success');
}

function loginUser(){
    var nameField=document.getElementById('username-input');
    var passwordField=document.getElementById('password-input');
    var loginBtn=document.getElementById('add-user-login-btn');
    var status=document.getElementById('add-user-status');
    var username=(nameField?nameField.value:'').trim();
    var password=passwordField?passwordField.value:'';
    if(!username || password.length<6){
        if(status)status.textContent='Enter your username and password to log in.';
        return;
    }
    if(loginBtn){loginBtn.disabled=true;loginBtn.textContent='LOGGING IN...';}

    apiLoginPlayer(username,password)
    .then(function(data){
        var profile=(data.player&&data.player.profile)||{};
        playerUsername=data.player.username;
        playerRole=profile.role||'Student';
        playerYearLevel=profile.yearLevel||'';
        playerBlock=profile.block||'';
        selectedChar=CHARACTERS.find(function(char){return char.name===profile.character;})||null;

        var roleField=document.getElementById('role-select');
        var yearField=document.getElementById('year-level-select');
        var blockField=document.getElementById('block-select');
        if(roleField)roleField.value=playerRole;
        if(yearField)yearField.value=playerYearLevel;
        if(blockField)blockField.value=playerBlock;

        // Login only verifies the account. Every player continues through hero
        // selection before the dungeon, with their saved hero preselected.
        if(status)status.textContent='Account verified. Choose a hero to continue.';
        showScreen('select-screen');
        showToast('Login successful. Choose your hero.','success');
    })
    .catch(function(err){
        console.error('loginUser failed:',err);
        if(status)status.textContent=err.message||'Invalid username or password.';
        showToast('Login failed','error');
    })
    .finally(function(){
        if(loginBtn)loginBtn.textContent='LOG IN';
        updateAddUserState();
    });
}

function startGame(){
    var nameField=document.getElementById('username-input');
    var roleField=document.getElementById('role-select');
    var yearField=document.getElementById('year-level-select');
    var blockField=document.getElementById('block-select');
    var passwordField=document.getElementById('password-input');
    playerUsername=(nameField?nameField.value:'').trim().slice(0,24);
    playerRole=roleField?roleField.value:'Student';
    playerYearLevel=yearField?yearField.value.trim():'';
    playerBlock=blockField?blockField.value.trim():'';
    var password=passwordField?passwordField.value:'';
    if(!selectedChar||!playerUsername||password.length<6)return;
    playFloorStartSfx();
    var enterBtn=document.getElementById('confirm-btn');
    if(enterBtn){enterBtn.disabled=true;enterBtn.textContent='SAVING ACCOUNT...';}

    // The database record is created only after a hero has been selected. The
    // dungeon opens after MongoDB confirms the profile is ready.
    apiStartPlayer(playerUsername,password)
    .then(function(){return loadState(playerUsername);})
    .then(function(){applySelectedCharacterStats();saveState();})
    .then(function(){return loadPlayerProgression();})
    .then(function(){return apiProgressionEvent('progress_sync',getProgressionMetrics(),false);})
    .then(function(){
        if(passwordField)passwordField.value='';
        enterDungeonWithTutorial('Account saved to MongoDB');
    })
    .catch(function(err){
        console.error('startGame failed:',err);
        showToast(err.message||'Could not create account. Try again.','error');
    })
    .finally(function(){
        if(enterBtn){enterBtn.textContent='ENTER DUNGEON';updateEnterButtonState();}
    });
}

