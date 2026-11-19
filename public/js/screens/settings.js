// ===== SETTINGS =====
var settingsSnapshot=null;

// Opening the panel remembers the current values so CANCEL can put them back.
// Every control applies immediately so players can hear and see the change.
function openSettings(){
    var overlay=document.getElementById('settings-overlay');
    if(!overlay)return;
    settingsSnapshot={sfx:sfxVolume,music:musicVolume,textSize:getStoredTextSize()};
    updateVolumeUI();
    markTextSizeChoice(settingsSnapshot.textSize);
    overlay.style.display='flex';
}

function cancelSettings(){
    if(settingsSnapshot){
        setSfxVolume(settingsSnapshot.sfx);
        setMusicVolume(settingsSnapshot.music);
        onSettingsTextSizeChange(settingsSnapshot.textSize);
    }
    closeSettings();
}

function closeSettings(){
    settingsSnapshot=null;
    var overlay=document.getElementById('settings-overlay');
    if(overlay)overlay.style.display='none';
}

function onSettingsSfxChange(val){
    setSfxVolume(Math.max(0,Math.min(100,parseInt(val,10)||0))/100);
    if(sfxVolume>0)playVolumePreviewSfx();
}

function onSettingsMusicChange(val){
    setMusicVolume(Math.max(0,Math.min(100,parseInt(val,10)||0))/100);
    // Music starts on the first click of the page; make sure it is playing so
    // the change can be heard.
    if(musicVolume>0&&document.body.getAttribute('data-music-playing')!=='true'&&typeof syncBackgroundMusic==='function'){
        var active=document.querySelector('.screen.active');
        syncBackgroundMusic(active?active.id:'title-screen');
    }
}

function markTextSizeChoice(size){
    document.querySelectorAll('.settings-size-btn').forEach(function(btn){
        var on=btn.getAttribute('data-size')===size;
        btn.classList.toggle('active',on);
        btn.setAttribute('aria-checked',on?'true':'false');
    });
}

function onSettingsTextSizeChange(choice){
    var size=applyTextSize(choice);
    localStorage.setItem('textSize',size);
    markTextSizeChoice(size);
}

function restartGame(){
    // Restarting ends the current run, so it counts for the leaderboard just
    // like a death does.
    submitLeaderboardScore(score,floor_num);
    apiReset()
    .then(function(){
        localStorage.removeItem(ACTIVE_PLAYER_SESSION_KEY);
        closeSettings();
        syncUiFromState();
        showToast('Game restarted','info');
        showScreen('title-screen');
    }).catch(function(){showToast('Could not restart','error');});
}

function exitGame(){
    // Save first, then sign out of the run. Progress stays in MongoDB; the
    // player logs back in from ENTER DUNGEON (their name is remembered).
    if(playerUsername&&typeof saveState==='function')saveState();
    localStorage.removeItem(ACTIVE_PLAYER_SESSION_KEY);
    document.body.removeAttribute('data-active-player');
    closeSettings();
    showScreen('title-screen');
    showToast('Progress saved. Exited to title','info');
}

function saveSettings(){
    // Everything is already applied and stored; saving just keeps it.
    settingsSnapshot=null;
    showToast('Settings saved','success');
    closeSettings();
}

