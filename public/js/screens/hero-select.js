// ===== HERO SELECT =====
// Builds the six hero cards and animates them; the picked hero shows its attack.
function renderCharacterSelect(){
    var grid=document.getElementById('characters-grid');grid.innerHTML='';
    updateEnterButtonState();
    CHARACTERS.forEach(function(char){
        var card=document.createElement('div');card.classList.add('char-card');
        if(selectedChar&&selectedChar.id===char.id)card.classList.add('selected');
        var canvas=document.createElement('canvas');canvas.classList.add('char-canvas');canvas.setAttribute('data-hero',char.id);
        SPR.drawTo(canvas,'hero',char.id,{crop:'full'});card.appendChild(canvas);
        var n=document.createElement('div');n.classList.add('char-name');n.textContent=char.name;card.appendChild(n);
        var d=document.createElement('div');d.classList.add('char-desc');d.textContent=char.desc;card.appendChild(d);
        var st=document.createElement('div');st.classList.add('char-stats');st.textContent=char.statLine;card.appendChild(st);
        var special=CHARACTER_SPECIALS[char.id];
        if(special){var sp=document.createElement('div');sp.classList.add('char-special-preview');sp.innerHTML='<strong>SPECIAL: '+special.name+'</strong>'+special.desc;card.appendChild(sp);}
        card.setAttribute('role','button');card.tabIndex=0;card.setAttribute('aria-pressed',selectedChar&&selectedChar.id===char.id?'true':'false');
        card.onclick=function(){selectedChar=char;document.querySelectorAll('.char-card').forEach(function(c){c.classList.remove('selected');c.setAttribute('aria-pressed','false');});card.classList.add('selected');card.setAttribute('aria-pressed','true');updateEnterButtonState();selectPreviewPose={id:char.id,start:SPR.now()};};
        card.onkeydown=function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();card.onclick();}};
        grid.appendChild(card);
    });
    startCharacterSelectAnimation();
}

// The hero cards are alive: each hero idles, and the one you pick shows its attack.
var selectPreviewPose=null,selectPreviewAnimId=null;
function startCharacterSelectAnimation(){
    if(selectPreviewAnimId)cancelAnimationFrame(selectPreviewAnimId);
    var last=0;
    function animate(now){
        var grid=document.getElementById('characters-grid');
        if(!grid||grid.offsetParent===null){selectPreviewAnimId=null;return;}
        selectPreviewAnimId=requestAnimationFrame(animate);
        if(document.hidden||now-last<50)return;last=now;
        grid.querySelectorAll('canvas[data-hero]').forEach(function(canvas,index){
            var id=canvas.getAttribute('data-hero'),pose=null;
            if(selectPreviewPose&&selectPreviewPose.id===id){
                var u=(SPR.now()-selectPreviewPose.start)/900;
                if(u<1)pose={name:'attack',p:u,k:0.32};
            }
            SPR.drawTo(canvas,'hero',id,{crop:'full',t:now/1000+index*0.37,pose:pose});
        });
    }
    selectPreviewAnimId=requestAnimationFrame(animate);
}

function updateEnterButtonState(){
    var btn=document.getElementById('confirm-btn');
    var name=(document.getElementById('username-input')?document.getElementById('username-input').value:'').trim();
    var password=document.getElementById('password-input')?document.getElementById('password-input').value:'';
    if(btn)btn.disabled=!selectedChar||!name||password.length<6;
}
