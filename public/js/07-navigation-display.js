// ===== 07. SCREEN NAVIGATION, FLOOR THEMES, AND DISPLAY PREFERENCES =====
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
}

function syncUiFromState(){
    var scoreEl=document.getElementById('score');if(scoreEl)scoreEl.textContent=score;
    var goldEl=document.getElementById('gold-count');if(goldEl)goldEl.textContent=gold;
    var floorEl=document.getElementById('floor-num');if(floorEl)floorEl.textContent=floor_num;
    var floorTitle=document.getElementById('floor-title');if(floorTitle)floorTitle.textContent='FLOOR '+floor_num;
    applyBattleBackground();
    var streakEl=document.getElementById('streak');if(streakEl)streakEl.textContent=streak;
    var bestEl=document.getElementById('best-streak');if(bestEl)bestEl.textContent=bestStreak;
    var accEl=document.getElementById('accuracy');if(accEl)accEl.textContent=totalAnswered>0?Math.round(totalCorrect/totalAnswered*100)+'%':'0%';
    var monstersEl=document.getElementById('monsters-slain');if(monstersEl)monstersEl.textContent=monstersDefeated;
    var bossesEl=document.getElementById('bosses-beaten');if(bossesEl)bossesEl.textContent=bossesDefeated;
    var potionBtn=document.getElementById('potion-btn');if(potionBtn)potionBtn.textContent='POTION('+potions+')';
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
        var avatarCtx=avatar.getContext('2d');
        avatarCtx.clearRect(0,0,avatar.width,avatar.height);
        avatarCtx.imageSmoothingEnabled=false;
        if(selectedChar)selectedChar.sprite.call(selectedChar,avatarCtx,20,22,5,0);
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

function showAccountCreateScreen(){
    var screen=document.getElementById('add-user-screen');
    if(!screen)return;
    screen.classList.remove('login-mode');
    document.getElementById('add-user-title').textContent='ADD USER';
    document.getElementById('add-user-subtitle').textContent='Create an account to pick a hero, or log in to resume your dungeon.';
    document.getElementById('username-input').setAttribute('autocomplete','off');
    document.getElementById('password-input').setAttribute('autocomplete','new-password');
    document.getElementById('password-input').placeholder='At least 6 characters';
    var status=document.getElementById('add-user-status');if(status)status.textContent='';
    updateAddUserState();
}

function backFromAccountEntry(){
    var screen=document.getElementById('add-user-screen');
    if(screen&&screen.classList.contains('login-mode'))showAccountCreateScreen();
    else showScreen('title-screen');
}

function showScreen(id){
    document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
    document.getElementById(id).classList.add('active');
    if(id!=='game-screen'){
        closeAccountInfo();
        // Leaving the battle: stop the question timer and sprite loops so a
        // hidden question can no longer time out and damage the player.
        stopTimer();
        currentQuestion=null;
        if(characterAnimId){cancelAnimationFrame(characterAnimId);characterAnimId=null;}
        if(monsterAnimId){cancelAnimationFrame(monsterAnimId);monsterAnimId=null;}
    }
    if(id==='select-screen')renderCharacterSelect();
    if(id==='add-user-screen')showAccountCreateScreen();
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
        if(status)status.textContent='Enter a username, a password with at least 6 characters, and your role details.';
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
            if(status)status.textContent='Username is already taken. Please log in or choose another username.';
            showToast('Username is already taken','error');
            if(input){
                input.focus();
                input.select();
            }
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

function isAddUserValid(){
    var name=(document.getElementById('username-input')?document.getElementById('username-input').value:'').trim();
    var password=document.getElementById('password-input')?document.getElementById('password-input').value:'';
    var role=(document.getElementById('role-select')?document.getElementById('role-select').value:'').trim();
    if(!name || password.length<6 || !role)return false;
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

    var valid=isAddUserValid();
    if(nextBtn)nextBtn.disabled=!valid;
    if(loginBtn)loginBtn.disabled=!(nameEl&&nameEl.value.trim()&&passwordEl&&passwordEl.value.length>=6);
    if(status && valid)status.textContent='';
}

function showLearnTab(tab){
    document.querySelectorAll('.learn-card').forEach(function(c){c.classList.remove('active');});
    document.querySelectorAll('.learn-tab').forEach(function(t){t.classList.remove('active');});
    document.getElementById('learn-'+tab).classList.add('active');
    var tabs=document.querySelectorAll('.learn-tab');
    tabs.forEach(function(t){if(t.textContent.toLowerCase()===tab||t.textContent.toLowerCase().replace(' ','')===tab)t.classList.add('active');});
}

function applyLargeTextMode(){
    document.body.classList.toggle('large-text',largeTextMode);
}

function toggleLargeText(){
    largeTextMode=!largeTextMode;
    localStorage.setItem('largeTextMode',largeTextMode?'1':'0');
    applyLargeTextMode();
    showToast(largeTextMode?'Large text enabled':'Large text disabled','info');
}

function setSfxVolume(v){
    var num=Math.max(0,Math.min(1,parseFloat(v)||0));
    sfxVolume=num;
    localStorage.setItem('sfxVolume',String(num));
    if(audioMasterGain)audioMasterGain.gain.value=getPerceivedGain(sfxVolume);
    updateSfxVolumeUI();
}

function getPerceivedGain(value){
    return Math.pow(Math.max(0,Math.min(1,value)),1.6);
}

function updateSfxVolumeUI(){
    var slider=document.getElementById('sfx-volume-slider');
    var val=document.getElementById('sfx-volume-value');
    var settingsSlider=document.getElementById('settings-volume-slider');
    var settingsVal=document.getElementById('settings-volume-value');
    var pct=Math.round(sfxVolume*100);
    if(slider)slider.value=String(pct);
    if(val)val.textContent=pct+'%';
    if(settingsSlider)settingsSlider.value=String(pct);
    if(settingsVal)settingsVal.textContent=pct+'%';
}

function applyFontSizeChoice(choice){
    var size=(choice||'medium');
    if(size==='large')document.documentElement.style.fontSize='18px';
    else if(size==='small')document.documentElement.style.fontSize='13px';
    else document.documentElement.style.fontSize='16px';
}

function applyStoredFontSize(){
    var storedChoice=localStorage.getItem('rootFontSize');
    if(storedChoice){
        applyFontSizeChoice(storedChoice);
        return;
    }
    var storedScale=localStorage.getItem('rootFontScale');
    if(storedScale){
        var scale=parseInt(storedScale,10);
        var derived=scale>=110?'large':(scale<=90?'small':'medium');
        localStorage.setItem('rootFontSize',derived);
        applyFontSizeChoice(derived);
        return;
    }
    applyFontSizeChoice('large');
}

