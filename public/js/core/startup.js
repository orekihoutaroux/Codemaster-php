// ===== APPLICATION STARTUP =====
// Connect global controls, load saved/server data, and draw the title screen.
document.querySelectorAll('.game-title,.lex-logo').forEach(function(el){
    el.addEventListener('click',handleAdminLogoClick);
    el.addEventListener('keydown',function(event){
        if(event.key==='Enter'||event.key===' '){event.preventDefault();el.click();}
    });
    el.title='Click 5 times for admin';
});

reloadProgressResetPromise=archiveAndResetActivePlayerProgress();
syncBackgroundMusic('title-screen');
loadQuestionsFromServer();
resetState();
syncUiFromState();
applyLargeTextMode();
updateSfxVolumeUI();
applyStoredFontSize();
document.addEventListener('click',handleButtonFunctionSfx,true);
document.addEventListener('pointerdown',unlockAudio,{once:true});
document.addEventListener('keydown',unlockAudio,{once:true});
createStars();drawTitleAnim();







