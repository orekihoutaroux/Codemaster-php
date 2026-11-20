// ===== SETTINGS =====
var settingsSnapshot=null;

// Opening the panel remembers the current values so CANCEL can put them back.
// Every control applies immediately so players can hear and see the change.
function openSettings(){
    var overlay=document.getElementById('settings-overlay');
    if(!overlay)return;
    settingsSnapshot={sfx:sfxVolume,music:musicVolume,textSize:getStoredTextSize()};
    // Settings only changes volume and text size: hold the question timer so
    // the run is exactly as it was when the panel closes.
    if(typeof pauseTimer==='function')pauseTimer();
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
    if(typeof resumeTimer==='function')resumeTimer();
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
    if(!confirm('Restart the game? Your current run ends and you go back to floor 1. You stay signed in and pick a hero for the new run.'))return;
    // Restarting ends the current run, so it counts for the leaderboard just
    // like a death does.
    submitLeaderboardScore(score,floor_num);
    apiReset()
    .then(function(){
        closeSettings();
        if(typeof resetRuntimeEncounter==='function')resetRuntimeEncounter();
        syncUiFromState();
        showScreen('select-screen');
        setHeroReselectMode(true);
        showToast('Run reset. Pick a hero to start again.','info');
    }).catch(function(){showToast('Could not restart','error');});
}

function exitGame(){
    // Exiting ends the run without keeping it: the saved run is reset on the
    // server, so the next login starts again from floor 1 with a hero pick.
    if(playerUsername&&!confirm('Exit to title? This run will not be saved. Next time you log in you start again from floor 1.'))return;
    closeSettings();
    if(typeof resetRuntimeEncounter==='function')resetRuntimeEncounter();
    localStorage.removeItem(ACTIVE_PLAYER_SESSION_KEY);
    document.body.removeAttribute('data-active-player');
    showScreen('title-screen');
    var done=function(){showToast('Run not saved. Exited to title','info');};
    apiReset().then(done,done);
}

function saveSettings(){
    // Only volume and text size are saved here (in this browser). The run
    // itself is not touched: the question picks up where it was paused.
    settingsSnapshot=null;
    showToast('Volume and text size saved','success');
    closeSettings();
    if(typeof resumeTimer==='function')resumeTimer();
}

