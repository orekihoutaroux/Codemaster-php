// ===== 21. PASSWORD VISIBILITY =====
// Adds an eye button to every password field so the player can check what
// they typed. Runs once at startup over the whole page; call
// enhancePasswordFields(root) again for password fields added later.
var PASSWORD_EYE_SVG='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
var PASSWORD_EYE_OFF_SVG='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9.9 5.2A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/></svg>';

function setPasswordVisible(input,visible){
    var btn=input&&input._visibilityToggle;
    if(!btn)return;
    input.type=visible?'text':'password';
    btn.innerHTML=visible?PASSWORD_EYE_OFF_SVG:PASSWORD_EYE_SVG;
    btn.setAttribute('aria-pressed',visible?'true':'false');
    btn.setAttribute('aria-label',visible?'Hide password':'Show password');
    btn.title=visible?'Hide password':'Show password';
}

function enhancePasswordFields(root){
    (root||document).querySelectorAll('input[type="password"]').forEach(function(input){
        if(input._visibilityToggle)return;
        var wrap=document.createElement('span');
        wrap.className='password-field';
        input.parentNode.insertBefore(wrap,input);
        wrap.appendChild(input);
        var btn=document.createElement('button');
        btn.type='button';
        btn.className='password-toggle';
        btn.setAttribute('aria-controls',input.id||'');
        // Keep the caret where it was: do not steal focus on mouse/touch.
        btn.addEventListener('mousedown',function(e){e.preventDefault();});
        btn.addEventListener('click',function(e){
            e.preventDefault();
            e.stopPropagation();
            var pos=input.selectionStart;
            setPasswordVisible(input,input.type==='password');
            if(document.activeElement===input&&pos!=null){try{input.setSelectionRange(pos,pos);}catch(err){}}
        });
        wrap.appendChild(btn);
        input._visibilityToggle=btn;
        setPasswordVisible(input,false);
    });
}

// Hide every revealed password again, e.g. when a form is reset or the
// player leaves the screen, so a password is never left showing.
function hideAllPasswords(){
    document.querySelectorAll('.password-field input').forEach(function(input){
        if(input._visibilityToggle)setPasswordVisible(input,false);
    });
}

enhancePasswordFields(document);
