// ===== SCREEN NAVIGATION, FLOOR THEMES, AND DISPLAY PREFERENCES =====
function getBattleThemeForFloor(floor){
    var safeFloor=Math.max(1,Math.min(5,Number(floor)||1));
    return {
        1:'sunlit-valley',
        2:'crystal-cavern',
        3:'cyber-defense',
        4:'code-matrix',
        5:'inferno-core'
    }[safeFloor];
}

function applyBattleBackground(){
    var theme=getBattleThemeForFloor(floor_num);
    var themeNames={
        'sunlit-valley':'Sunlit valley',
        'crystal-cavern':'Crystal cavern',
        'cyber-defense':'Cybersecurity network',
        'code-matrix':'Living code matrix',
        'inferno-core':'Inferno core'
    };
    var scene=document.getElementById('battle-scene');
    var gameScreen=document.getElementById('game-screen');
    if(scene){
        scene.setAttribute('data-floor-theme',theme);
        scene.setAttribute('data-floor',String(floor_num));
        scene.setAttribute('aria-label',themeNames[theme]+' battlefield, Floor '+floor_num);
    }
    if(gameScreen)gameScreen.setAttribute('data-floor-theme',theme);
    // the pixel-art place behind the fight (game/battle-background.js)
    if(typeof startBattleBackground==='function')startBattleBackground(theme);
}

function syncUiFromState(){
    var scoreEl=document.getElementById('score');if(scoreEl)scoreEl.textContent=score;
    var goldEl=document.getElementById('gold-count');if(goldEl)goldEl.textContent=gold;
    var floorTitle=document.getElementById('floor-title');if(floorTitle)floorTitle.textContent='FLOOR '+floor_num;
    applyBattleBackground();
    var streakEl=document.getElementById('streak');if(streakEl)streakEl.textContent=streak;
    var bestEl=document.getElementById('best-streak');if(bestEl)bestEl.textContent=bestStreak;
    var accEl=document.getElementById('accuracy');if(accEl)accEl.textContent=totalAnswered>0?Math.round(totalCorrect/totalAnswered*100)+'%':'0%';
    var monstersEl=document.getElementById('monsters-slain');if(monstersEl)monstersEl.textContent=monstersDefeated;
    var bossesEl=document.getElementById('bosses-beaten');if(bossesEl)bossesEl.textContent=bossesDefeated;
    updatePotionDisplay();
    var playerLvl=document.getElementById('player-level');if(playerLvl)playerLvl.textContent='LVL '+(playerUsername?level:1);
    updatePlayerHP();
    refreshShopGold();
    updateBuffIndicators();
    var accountOverlay=document.getElementById('account-info-overlay');
    if(accountOverlay&&accountOverlay.style.display!=='none')updateAccountInfo();
}

function setAccountInfoText(id,value){
    var element=document.getElementById(id);
    if(element)element.textContent=String(value);
}

function applyProgressionPayload(payload,showUnlocks){
    var defaults=getDefaultProgression();
    var incoming=payload&&payload.progression&&typeof payload.progression==='object'?payload.progression:{};
    playerProgression={
        activeTitle:incoming.activeTitle||defaults.activeTitle,
        unlockedAchievementIds:Array.isArray(incoming.unlockedAchievementIds)?incoming.unlockedAchievementIds.slice():[],
        unlockedAt:incoming.unlockedAt&&typeof incoming.unlockedAt==='object'?incoming.unlockedAt:{},
        stats:Object.assign({},defaults.stats,incoming.stats||{}),
        updatedAt:incoming.updatedAt||null
    };
    if(payload&&Array.isArray(payload.definitions))achievementDefinitions=payload.definitions.slice();
    updatePlayerTitleUI();
    renderAccountAchievements();
    if(showUnlocks&&payload&&Array.isArray(payload.newlyUnlocked)){
        payload.newlyUnlocked.forEach(function(achievement,index){
            setTimeout(function(){showAchievementUnlocked(achievement);},index*900);
        });
    }
}

function updatePlayerTitleUI(){
    var title=(playerProgression&&playerProgression.activeTitle)||'PHP Novice';
    setAccountInfoText('player-title',title.toUpperCase());
    setAccountInfoText('account-info-player-title',title.toUpperCase());
}

function renderAccountAchievements(message){
    var container=document.getElementById('account-achievement-list');
    var count=document.getElementById('account-achievement-count');
    if(!container)return;
    container.innerHTML='';
    var unlockedIds=playerProgression&&Array.isArray(playerProgression.unlockedAchievementIds)?playerProgression.unlockedAchievementIds:[];
    if(count)count.textContent=unlockedIds.length+' / '+achievementDefinitions.length+' UNLOCKED';
    if(message||!achievementDefinitions.length){
        var empty=document.createElement('div');
        empty.className='account-achievement-empty';
        empty.textContent=message||'Loading achievements from MongoDB...';
        container.appendChild(empty);
        return;
    }
    var stats=playerProgression&&playerProgression.stats?playerProgression.stats:{};
    achievementDefinitions.forEach(function(achievement){
        var unlocked=unlockedIds.indexOf(achievement.id)!==-1;
        var current=Math.max(0,Number(stats[achievement.metric])||0);
        var target=Math.max(1,Number(achievement.target)||1);
        var progress=Math.min(100,Math.round(current/target*100));
        var card=document.createElement('div');
        card.className='account-achievement-card '+(unlocked?'unlocked':'locked');

        var icon=document.createElement('div');icon.className='account-achievement-icon';icon.textContent=achievement.icon||'?';
        var name=document.createElement('div');name.className='account-achievement-name';name.textContent=achievement.name||'Achievement';
        var description=document.createElement('div');description.className='account-achievement-desc';description.textContent=achievement.description||'';
        var reward=document.createElement('div');reward.className='account-achievement-reward';
        reward.textContent=unlocked?'TITLE UNLOCKED: '+achievement.title:'PROGRESS: '+Math.min(current,target)+' / '+target;
        var progressTrack=document.createElement('div');progressTrack.className='account-achievement-progress';
        var progressFill=document.createElement('div');progressFill.className='account-achievement-progress-fill';progressFill.style.width=progress+'%';
        progressTrack.appendChild(progressFill);
        card.appendChild(icon);card.appendChild(name);card.appendChild(description);card.appendChild(reward);card.appendChild(progressTrack);
        container.appendChild(card);
    });
}

function showAchievementUnlocked(achievement){
    if(!achievement)return;
    document.querySelectorAll('.achievement-unlock-popup').forEach(function(element){element.remove();});
    var popup=document.createElement('div');
    popup.className='achievement-unlock-popup';
    var label=document.createElement('div');label.className='achievement-unlock-label';label.textContent='ACHIEVEMENT UNLOCKED';
    var name=document.createElement('div');name.className='achievement-unlock-name';name.textContent=achievement.name||'New Achievement';
    var title=document.createElement('div');title.className='achievement-unlock-title';title.textContent='NEW TITLE: '+(achievement.title||'PHP Novice');
    popup.appendChild(label);popup.appendChild(name);popup.appendChild(title);document.body.appendChild(popup);
    setTimeout(function(){popup.remove();},4300);
}

function updateAccountInfo(){
    var displayName=playerUsername||'PLAYER';
    var profileParts=[playerRole||'Student'];
    if((playerRole||'').toLowerCase()==='student'){
        if(playerYearLevel)profileParts.push('Year '+playerYearLevel);
        if(playerBlock)profileParts.push('Block '+playerBlock);
    }

    setAccountInfoText('account-info-name',displayName);
    setAccountInfoText('account-info-meta',profileParts.join('  |  '));
    setAccountInfoText('account-info-hero',selectedChar?selectedChar.name:'No hero selected');
    setAccountInfoText('account-info-level',level);
    setAccountInfoText('account-info-floor',floor_num);
    setAccountInfoText('account-info-hp',hp+'/'+maxHp);
    setAccountInfoText('account-info-score',score);
    setAccountInfoText('account-info-gold',gold);
    setAccountInfoText('account-info-potions',potions);
    setAccountInfoText('account-info-monsters',monstersDefeated);
    setAccountInfoText('account-info-bosses',bossesDefeated);
    setAccountInfoText('account-info-ability',selectedChar&&selectedChar.abilityName?
        selectedChar.abilityName+' — '+selectedChar.abilityDesc:
        'Choose a hero to see its special ability.');
    updatePlayerTitleUI();
    renderAccountAchievements();

    var avatar=document.getElementById('account-info-avatar');
    if(avatar){
        if(selectedChar)SPR.drawTo(avatar,'hero',selectedChar.id,{crop:'bust'});
        else avatar.getContext('2d').clearRect(0,0,avatar.width,avatar.height);
    }
}

function openAccountInfo(){
    if(!playerUsername){showToast('Start or log in to a player account first.','error');return;}
    updateAccountInfo();
    var overlay=document.getElementById('account-info-overlay');
    var trigger=document.getElementById('account-info-trigger');
    if(overlay)overlay.style.display='block';
    if(trigger)trigger.setAttribute('aria-expanded','true');
}

function closeAccountInfo(){
    var overlay=document.getElementById('account-info-overlay');
    var trigger=document.getElementById('account-info-trigger');
    if(overlay)overlay.style.display='none';
    if(trigger)trigger.setAttribute('aria-expanded','false');
}

function toggleAccountInfo(){
    var overlay=document.getElementById('account-info-overlay');
    if(overlay&&overlay.style.display!=='none')closeAccountInfo();
    else openAccountInfo();
}

function showLoginScreen(){
    var screen=document.getElementById('add-user-screen');
    if(!screen)return;
    screen.classList.add('login-mode');
    document.getElementById('add-user-title').textContent='PLAYER LOGIN';
    document.getElementById('add-user-subtitle').textContent='Log in to continue your saved dungeon progress.';
    document.getElementById('username-input').setAttribute('autocomplete','username');
    document.getElementById('password-input').setAttribute('autocomplete','current-password');
    document.getElementById('password-input').placeholder='Enter your password';
    var status=document.getElementById('add-user-status');if(status)status.textContent='';
    updateAddUserState();
    document.getElementById('username-input').focus();
}

// REGISTER: create a new account, then pick a hero.
function showAccountCreateScreen(){
    var screen=document.getElementById('add-user-screen');
    if(!screen)return;
    screen.classList.remove('login-mode');
    document.getElementById('add-user-title').textContent='REGISTER';
    document.getElementById('add-user-subtitle').textContent='Create your account, then pick a hero to enter the dungeon.';
    document.getElementById('username-input').setAttribute('autocomplete','off');
    document.getElementById('password-input').setAttribute('autocomplete','new-password');
    document.getElementById('password-input').placeholder='At least 6 characters';
    var status=document.getElementById('add-user-status');if(status)status.textContent='';
    updateAddUserState();
}

// The "Don't have an account? REGISTER" link under the login form.
function showRegisterScreen(){
    var nameEl=document.getElementById('username-input');
    var passwordEl=document.getElementById('password-input');
    // A returning player's own name is taken (by them), so do not carry it over.
    if(nameEl&&returningPlayerName&&nameEl.value.trim()===returningPlayerName)nameEl.value='';
    if(passwordEl)passwordEl.value='';
    clearPasswordConfirm();
    showAccountCreateScreen();
    if(nameEl)nameEl.focus();
}

// The "Already have an account? LOG IN" link under the register form.
function showLoginFromRegister(){
    var passwordEl=document.getElementById('password-input');
    if(passwordEl)passwordEl.value='';
    clearPasswordConfirm();
    if(returningPlayerName)showReturningPlayerLogin();
    else showLoginScreen();
}

// ENTER DUNGEON always opens the login form first. A player who already
// entered the dungeon in this tab (after EXIT TO TITLE, a restart or a death)
// finds their name filled in.
var returningPlayerName='';

function showReturningPlayerLogin(){
    showLoginScreen();
    var nameEl=document.getElementById('username-input');
    var passwordEl=document.getElementById('password-input');
    var status=document.getElementById('add-user-status');
    if(nameEl)nameEl.value=returningPlayerName;
    if(passwordEl){passwordEl.value='';passwordEl.focus();}
    document.getElementById('add-user-subtitle').textContent='Welcome back, '+returningPlayerName+'. Enter your password to continue your dungeon.';
    if(status)status.textContent='';
    updateAddUserState();
}

// BACK: from REGISTER it returns to the login form; from the login form it
// returns to the home page.
function backFromAccountEntry(){
    var screen=document.getElementById('add-user-screen');
    if(screen&&!screen.classList.contains('login-mode'))showLoginFromRegister();
    else showScreen('title-screen');
}

function showScreen(id){
    document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
    document.getElementById(id).classList.add('active');
    if(typeof hideAllPasswords==='function')hideAllPasswords();
    if(id!=='game-screen'){
        closeAccountInfo();
        // Leaving the battle: stop the question timer and sprite loops so a
        // hidden question can no longer time out and damage the player.
        stopTimer();
        currentQuestion=null;
        if(characterAnimId){cancelAnimationFrame(characterAnimId);characterAnimId=null;}
        if(monsterAnimId){cancelAnimationFrame(monsterAnimId);monsterAnimId=null;}
    }
    if(id==='game-screen'&&typeof startBattleBackground==='function')startBattleBackground();
    if(id==='select-screen'){
        // start at the top (title and first heroes), not where the player
        // scrolled to last time, e.g. the ENTER DUNGEON button on a phone
        document.getElementById('select-screen').scrollTop=0;
        renderCharacterSelect();
    }
    if(id==='add-user-screen'||id==='title-screen'){
        if(typeof heroReselectMode!=='undefined'&&heroReselectMode&&typeof setHeroReselectMode==='function')setHeroReselectMode(false);
    }
    if(id==='add-user-screen'){
        if(returningPlayerName)showReturningPlayerLogin();
        else{
            var nameEl=document.getElementById('username-input'),passwordEl=document.getElementById('password-input');
            if(passwordEl)passwordEl.value='';
            clearPasswordConfirm();
            if(nameEl&&!nameEl.value)nameEl.value='';
            showLoginScreen();
        }
    }
    syncBackgroundMusic(id);
}

function focusHeroSelect(){
    goToHeroSelection();
}

function goToHeroSelection(){
    var status=document.getElementById('add-user-status');
    var nextBtn=document.getElementById('add-user-next-btn');
    var input=document.getElementById('username-input');
    if(!isAddUserValid()){
        if(status)status.textContent=passwordsDiffer()?'The two passwords do not match. Type the same password in both boxes.':'Enter a username, a password with at least 6 characters (twice), and your role details.';
        showToast('Complete Add User first','error');
        updateAddUserState();
        return;
    }
    var username=(input?input.value:'').trim().slice(0,24);
    if(status)status.textContent='Checking username...';
    if(nextBtn){
        nextBtn.disabled=true;
        nextBtn.textContent='CHECKING...';
    }

    apiCheckUsernameAvailability(username)
    .then(function(available){
        var currentUsername=(input?input.value:'').trim().slice(0,24);
        if(currentUsername!==username)return;
        if(!available){
            // The name belongs to an existing account. Offer the login form
            // right away (the typed password is kept) instead of a dead end.
            showLoginScreen();
            if(status)status.textContent='Username is already taken. If it is your account, press LOG IN. Otherwise go BACK and choose another username.';
            showToast('Username is already taken','error');
            var passwordEl=document.getElementById('password-input');
            if(passwordEl)passwordEl.focus();
            return;
        }
        if(status)status.textContent='';
        showScreen('select-screen');
    })
    .catch(function(error){
        console.error('Username availability check failed:',error);
        if(status)status.textContent=(error&&error.message)||'Could not check the username. Please try again.';
        showToast('Could not check username','error');
    })
    .finally(function(){
        if(nextBtn){
            nextBtn.textContent='NEXT: PICK HERO';
            nextBtn.disabled=!isAddUserValid();
        }
    });
}

// REGISTER asks for the password twice; the second box must match the first.
function getPasswordConfirm(){
    var el=document.getElementById('password-confirm-input');
    return el?el.value:'';
}
function passwordsDiffer(){
    var password=document.getElementById('password-input')?document.getElementById('password-input').value:'';
    var confirmValue=getPasswordConfirm();
    return confirmValue.length>0&&confirmValue!==password;
}
function clearPasswordConfirm(){
    var el=document.getElementById('password-confirm-input');
    if(el)el.value='';
    updatePasswordMatchHint();
}
function updatePasswordMatchHint(){
    var el=document.getElementById('password-confirm-input');
    var hint=document.getElementById('password-match-hint');
    var password=document.getElementById('password-input')?document.getElementById('password-input').value:'';
    var confirmValue=getPasswordConfirm();
    var state='';
    if(confirmValue.length>0)state=(confirmValue===password)?'match':'mismatch';
    if(hint){
        hint.className='password-match-hint'+(state?' '+state:'');
        hint.textContent=state==='match'?'\u2713 Passwords match':state==='mismatch'?'\u2717 Passwords do not match':'';
    }
    if(el){
        el.classList.toggle('match',state==='match');
        el.classList.toggle('mismatch',state==='mismatch');
        if(state==='mismatch')el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');
    }
}

function isAddUserValid(){
    var name=(document.getElementById('username-input')?document.getElementById('username-input').value:'').trim();
    var password=document.getElementById('password-input')?document.getElementById('password-input').value:'';
    var role=(document.getElementById('role-select')?document.getElementById('role-select').value:'').trim();
    if(!name || password.length<6 || !role)return false;
    if(getPasswordConfirm()!==password)return false; // Confirm Password must match
    if(role==='Student'){
        var year=(document.getElementById('year-level-select')?document.getElementById('year-level-select').value:'').trim();
        var block=(document.getElementById('block-select')?document.getElementById('block-select').value:'').trim();
        return !!year && !!block;
    }
    return true;
}

function updateAddUserState(){
    var nextBtn=document.getElementById('add-user-next-btn');
    var loginBtn=document.getElementById('add-user-login-btn');
    var status=document.getElementById('add-user-status');
    var roleEl=document.getElementById('role-select');
    var extra=document.getElementById('student-extra');
    var yearEl=document.getElementById('year-level-select');
    var blockEl=document.getElementById('block-select');
    var nameEl=document.getElementById('username-input');
    var passwordEl=document.getElementById('password-input');
    var role=roleEl?roleEl.value:'';
    var accountScreen=document.getElementById('add-user-screen');
    var loginMode=!!(accountScreen&&accountScreen.classList.contains('login-mode'));

    if(extra)extra.style.display=(!loginMode&&role==='Student')?'grid':'none';
    if(role!=='Student'&&!loginMode){
        if(yearEl)yearEl.value='';
        if(blockEl)blockEl.value='';
    }

    updatePasswordMatchHint();
    var valid=isAddUserValid();
    if(nextBtn)nextBtn.disabled=!valid;
    if(loginBtn)loginBtn.disabled=!(nameEl&&nameEl.value.trim()&&passwordEl&&passwordEl.value.length>=6);
    if(status && valid)status.textContent='';
}

function showLearnTab(tab){
    var card=document.getElementById('learn-'+tab);
    if(!card)return;
    document.querySelectorAll('.learn-card').forEach(function(c){c.classList.remove('active');});
    document.querySelectorAll('.learn-tab').forEach(function(t){
        var on=t.getAttribute('data-topic')===tab;
        t.classList.toggle('active',on);
        t.setAttribute('aria-selected',on?'true':'false');
        if(on&&t.scrollIntoView)t.scrollIntoView({block:'nearest',inline:'center'});
    });
    card.classList.add('active');
    var screen=document.getElementById('learn-screen');
    if(screen)screen.scrollTop=0;
    card.scrollTop=0; // on computers the lesson card scrolls on its own (css/base/screen-fit.css)
}

function applyLargeTextMode(){
    // Replaced by the Text size setting; see applyStoredFontSize().
    document.body.classList.remove('large-text');
}


// ----- volume -----
// Sliders show 0-100%; the gain follows a curve because ears hear loudness
// that way (50% on the slider sounds about half as loud).
function getPerceivedGain(value){
    return Math.pow(Math.max(0,Math.min(1,value)),1.6);
}

function setSfxVolume(v){
    var num=Math.max(0,Math.min(1,parseFloat(v)||0));
    sfxVolume=num;
    localStorage.setItem('sfxVolume',String(num));
    if(audioMasterGain&&audioCtx)audioMasterGain.gain.setTargetAtTime(getPerceivedGain(num),audioCtx.currentTime,0.015);
    updateVolumeUI();
}

function setMusicVolume(v){
    var num=Math.max(0,Math.min(1,parseFloat(v)||0));
    musicVolume=num;
    localStorage.setItem('musicVolume',String(num));
    if(musicGain&&audioCtx)musicGain.gain.setTargetAtTime(MUSIC_BASE_GAIN*getPerceivedGain(num),audioCtx.currentTime,0.05);
    updateVolumeUI();
}

function updateVolumeUI(){
    [['sfx',sfxVolume],['music',musicVolume]].forEach(function(pair){
        var pct=Math.round(pair[1]*100);
        var slider=document.getElementById('settings-'+pair[0]+'-slider');
        var label=document.getElementById('settings-'+pair[0]+'-value');
        if(slider&&String(slider.value)!==String(pct))slider.value=String(pct);
        if(slider)slider.style.setProperty('--fill',pct+'%');
        if(label)label.textContent=pct===0?'Off':pct+'%';
    });
}
var updateSfxVolumeUI=updateVolumeUI; // older name, kept for any old callers

// ----- text size -----
// Every font size in the CSS is written as calc(Npx * var(--text-scale,1)),
// so changing this one number resizes all the text in the game.
var TEXT_SIZES={small:0.9,normal:1,large:1.15,xlarge:1.3};

function normaliseTextSize(choice){
    return Object.prototype.hasOwnProperty.call(TEXT_SIZES,choice)?choice:'normal';
}

function applyTextSize(choice){
    var size=normaliseTextSize(choice);
    document.documentElement.style.setProperty('--text-scale',String(TEXT_SIZES[size]));
    document.documentElement.setAttribute('data-text-size',size);
    return size;
}

function getStoredTextSize(){
    return normaliseTextSize(localStorage.getItem('textSize'));
}

function applyStoredFontSize(){
    // The old "Font Size" setting (rootFontSize / rootFontScale) only changed
    // a value the page never used, so it is dropped. The old hidden
    // "large text" switch becomes the new Large size.
    if(!localStorage.getItem('textSize')&&localStorage.getItem('largeTextMode')==='1')localStorage.setItem('textSize','large');
    localStorage.removeItem('rootFontSize');
    localStorage.removeItem('rootFontScale');
    localStorage.removeItem('largeTextMode');
    applyTextSize(getStoredTextSize());
}

