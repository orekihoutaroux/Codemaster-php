// ===== KEYBOARD, PAGE LIFECYCLE, AND ACCOUNT INPUT EVENTS =====
var GAME_BLOCKING_OVERLAY_IDS=['shop-overlay','settings-overlay','admin-login-overlay','admin-overlay','admin-reset-confirm-overlay','account-info-overlay'];

function isOverlayOpen(id){
    var el=document.getElementById(id);
    return !!el&&el.style.display!=='none';
}

// Battle shortcuts (A-D / 1-4 / Enter / Space) must only fire while the player
// is actually looking at the battle: not while typing in a form, not on another
// screen, and not underneath an open overlay or the death screen.
function areBattleShortcutsBlocked(e){
    var target=e.target;
    if(target&&(/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName||'')||target.isContentEditable))return true;
    if(e.ctrlKey||e.metaKey||e.altKey)return true;
    var game=document.getElementById('game-screen');
    if(!game||!game.classList.contains('active'))return true;
    if(document.querySelector('.death-overlay'))return true;
    return GAME_BLOCKING_OVERLAY_IDS.some(isOverlayOpen);
}

document.addEventListener('keydown',function(e){
    var accountInfo=document.getElementById('account-info-overlay');
    if(accountInfo&&accountInfo.style.display!=='none'&&e.key==='Escape'){
        e.preventDefault();
        closeAccountInfo();
        var accountTrigger=document.getElementById('account-info-trigger');
        if(accountTrigger)accountTrigger.focus();
        return;
    }
    var resetConfirm=document.getElementById('admin-reset-confirm-overlay');
    if(resetConfirm&&resetConfirm.style.display!=='none'){
        if(e.key==='Escape'){e.preventDefault();cancelResetAdminQuestions();}
        return;
    }
    if(e.key==='Escape'){
        if(isOverlayOpen('admin-login-overlay')){e.preventDefault();closeAdminLogin();return;}
        if(isOverlayOpen('shop-overlay')){e.preventDefault();closeShop();return;}
        if(isOverlayOpen('settings-overlay')){e.preventDefault();cancelSettings();return;}
    }
    if(areBattleShortcutsBlocked(e))return;
    if(answered&&(e.key==='Enter'||e.key===' ')){
        var nextBtn=document.getElementById('next-btn');
        if(!nextBtn||!nextBtn.classList.contains('show'))return;
        e.preventDefault();nextAction();return;
    }
    if(!answered&&currentQuestion){var map={'a':0,'b':1,'c':2,'d':3,'1':0,'2':1,'3':2,'4':3};var idx=map[String(e.key||'').toLowerCase()];if(idx!==undefined&&idx<currentQuestion.choices.length)selectAnswer(idx);}
});

document.addEventListener('visibilitychange',function(){
    if(document.hidden){stopBackgroundMusic();return;}
    var active=document.querySelector('.screen.active');
    syncBackgroundMusic(active?active.id:'title-screen');
});

window.addEventListener('pagehide',function(){
    if(playerUsername)saveState();
});

document.addEventListener('input',function(e){
    if(e.target && e.target.id==='admin-user-score'){
        var levelField=document.getElementById('admin-user-level');
        if(levelField)levelField.value=getLevelFromScore(parseInt(e.target.value,10)||0);
    }
    if(e.target && (e.target.id==='username-input' || e.target.id==='password-input' || e.target.id==='role-select' || e.target.id==='year-level-select' || e.target.id==='block-select')){
        updateAddUserState();
        updateEnterButtonState();
    }
});

