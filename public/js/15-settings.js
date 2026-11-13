// ===== 15. SETTINGS =====
var settingsSnapshot=null;
function openSettings(){
    var overlay=document.getElementById('settings-overlay');
    if(!overlay)return;
    var vol=document.getElementById('settings-volume-slider');
    var volVal=document.getElementById('settings-volume-value');
    var size=document.getElementById('settings-font-size');
    var v=Math.round((localStorage.getItem('sfxVolume')?parseFloat(localStorage.getItem('sfxVolume')):1)*100);
    if(vol)vol.value=String(v);
    if(volVal)volVal.textContent=v+'%';
    var choice=localStorage.getItem('rootFontSize');
    if(!choice){
        var scaleRaw=localStorage.getItem('rootFontScale');
        var scale=scaleRaw?parseInt(scaleRaw,10):NaN;
        choice=(!isNaN(scale) && scale>=110)?'large':((!isNaN(scale) && scale<=90)?'small':'large');
    }
    if(size)size.value=choice||'large';
    // Remember what was active so CANCEL can undo the live preview.
    settingsSnapshot={volume:sfxVolume,fontSize:choice||'large'};
    overlay.style.display='flex';
}

function cancelSettings(){
    if(settingsSnapshot){
        setSfxVolume(settingsSnapshot.volume);
        onSettingsFontSizeChange(settingsSnapshot.fontSize);
    }
    closeSettings();
}

function closeSettings(){
    settingsSnapshot=null;
    var overlay=document.getElementById('settings-overlay');
    if(overlay)overlay.style.display='none';
}

function onSettingsVolumeChange(val){
    var pct=Math.max(0,Math.min(100,parseInt(val||0)));
    var el=document.getElementById('settings-volume-value');
    if(el)el.textContent=pct+'%';
    setSfxVolume(pct/100);
}

function onSettingsFontSizeChange(val){
    var choice=(val==='small' || val==='large')?val:'medium';
    applyFontSizeChoice(choice);
    localStorage.setItem('rootFontSize',choice);
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
    localStorage.removeItem(ACTIVE_PLAYER_SESSION_KEY);
    closeSettings();
    showScreen('title-screen');
    showToast('Exited to title','info');
}

function saveSettings(){
    var volEl=document.getElementById('settings-volume-slider');
    var fsEl=document.getElementById('settings-font-size');
    var vol=parseInt(volEl?volEl.value:100,10);
    var fs=(fsEl?fsEl.value:'large');
    setSfxVolume((isNaN(vol)?100:vol)/100);
    onSettingsFontSizeChange(fs);
    showToast('Settings saved','success');
    closeSettings();
}

