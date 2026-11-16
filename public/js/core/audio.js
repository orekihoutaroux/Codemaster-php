// ===== MUSIC AND SOUND EFFECTS =====
function ensureAudioContext(){
    try{
        if(!audioCtx){
            var AC=window.AudioContext||window.webkitAudioContext;
            if(!AC)return null;
            audioCtx=new AC();
            audioMasterGain=audioCtx.createGain();
            audioMasterGain.gain.value=getPerceivedGain(sfxVolume);
            audioMasterGain.connect(audioCtx.destination);
            musicGain=audioCtx.createGain();
            musicGain.gain.value=0.16;
            musicGain.connect(audioMasterGain);
        }
        if(!musicGain&&audioMasterGain){
            musicGain=audioCtx.createGain();
            musicGain.gain.value=0.16;
            musicGain.connect(audioMasterGain);
        }
        if(audioCtx.state==='suspended')audioCtx.resume();
        return audioCtx;
    }catch(e){
        return null;
    }
}

function unlockAudio(){
    if(audioUnlocked)return;
    var ctx=ensureAudioContext();
    if(!ctx||!audioMasterGain)return;
    try{
        var osc=ctx.createOscillator();
        var gain=ctx.createGain();
        osc.type='sine';
        osc.frequency.setValueAtTime(220,ctx.currentTime);
        gain.gain.setValueAtTime(0.0001,ctx.currentTime);
        osc.connect(gain);
        gain.connect(audioMasterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime+0.01);
        audioUnlocked=true;
        var active=document.querySelector('.screen.active');
        syncBackgroundMusic(active?active.id:'title-screen');
    }catch(e){
        audioUnlocked=false;
    }
}

function playSynthTone(freq,startOffset,duration,wave,volume,slideTo,pan){
    var ctx=ensureAudioContext();
    if(!ctx||!audioMasterGain)return;
    var now=ctx.currentTime+startOffset;
    var osc=ctx.createOscillator();
    var gain=ctx.createGain();
    osc.type=wave||'square';
    osc.frequency.setValueAtTime(freq,now);
    if(slideTo){osc.frequency.exponentialRampToValueAtTime(Math.max(30,slideTo),now+duration);} 
    gain.gain.setValueAtTime(0,now);
    gain.gain.linearRampToValueAtTime((volume||0.12)*1.6,now+0.01);
    gain.gain.linearRampToValueAtTime(0,now+duration);
    osc.connect(gain);
    if(typeof pan==='number'&&ctx.createStereoPanner){
        var panner=ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1,Math.min(1,pan)),now);
        gain.connect(panner);
        panner.connect(audioMasterGain);
    }else{
        gain.connect(audioMasterGain);
    }
    osc.start(now);
    osc.stop(now+duration+0.03);
}

function playFilteredNoise(config,pan){
    var ctx=ensureAudioContext();
    if(!ctx||!audioMasterGain)return;
    var options=config||{};
    var start=ctx.currentTime+(Number(options.o)||0);
    var duration=Math.max(.02,Number(options.d)||.1);
    var sampleCount=Math.max(1,Math.floor(ctx.sampleRate*duration));
    var buffer=ctx.createBuffer(1,sampleCount,ctx.sampleRate);
    var samples=buffer.getChannelData(0);
    var texture=options.texture||'smooth';
    for(var i=0;i<sampleCount;i++){
        var progress=i/sampleCount;
        var envelope=Math.pow(1-progress,options.decay||2.2);
        var random=Math.random()*2-1;
        if(texture==='crackle')random*=Math.random()>.82?1:.12;
        else if(texture==='pulse')random*=Math.sin(progress*Math.PI*(options.pulses||12))>0?1:.18;
        samples[i]=random*envelope;
    }
    var source=ctx.createBufferSource();
    var filter=ctx.createBiquadFilter();
    var gain=ctx.createGain();
    source.buffer=buffer;
    filter.type=options.type||'bandpass';
    filter.frequency.setValueAtTime(Math.max(40,Number(options.f)||900),start);
    if(options.s)filter.frequency.exponentialRampToValueAtTime(Math.max(40,Number(options.s)),start+duration);
    filter.Q.setValueAtTime(Math.max(.1,Number(options.q)||1.2),start);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.linearRampToValueAtTime(Math.max(.001,Number(options.v)||.05),start+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    source.connect(filter);
    filter.connect(gain);
    if(typeof pan==='number'&&ctx.createStereoPanner){
        var panner=ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1,Math.min(1,pan)),start);
        gain.connect(panner);
        panner.connect(audioMasterGain);
    }else{
        gain.connect(audioMasterGain);
    }
    source.start(start);
    source.stop(start+duration+.02);
}

function playCombatSfxRecipe(recipe,isEmpowered,pan){
    if(!recipe)return;
    var tones=(recipe.tones||[]).slice();
    var noises=(recipe.noises||[]).slice();
    if(isEmpowered){
        tones=tones.concat(recipe.specialTones||[]);
        noises=noises.concat(recipe.specialNoises||[]);
    }
    for(var i=0;i<tones.length;i++){
        var tone=tones[i];
        playSynthTone(tone.f,tone.o,tone.d,tone.w,tone.v,tone.s,typeof tone.pan==='number'?tone.pan:pan);
    }
    for(var j=0;j<noises.length;j++)playFilteredNoise(noises[j],typeof noises[j].pan==='number'?noises[j].pan:pan);
}

var BUTTON_SFX_PROFILES={
    navigate:[
        {r:1,o:0,d:0.055,w:'square',v:0.045,s:1.16},
        {r:1.32,o:0.055,d:0.075,w:'triangle',v:0.05,s:1.55}
    ],
    back:[
        {r:1.34,o:0,d:0.065,w:'triangle',v:0.05,s:1.08},
        {r:0.94,o:0.055,d:0.08,w:'sine',v:0.045,s:0.72}
    ],
    select:[
        {r:1,o:0,d:0.045,w:'square',v:0.045,s:1.12},
        {r:1.5,o:0.045,d:0.055,w:'square',v:0.038,s:1.32}
    ],
    confirm:[
        {r:1,o:0,d:0.06,w:'triangle',v:0.05,s:1.08},
        {r:1.28,o:0.055,d:0.07,w:'triangle',v:0.052,s:1.42},
        {r:1.7,o:0.115,d:0.1,w:'sine',v:0.048,s:1.95}
    ],
    open:[
        {r:0.82,o:0,d:0.07,w:'sawtooth',v:0.045,s:1.18},
        {r:1.32,o:0.06,d:0.09,w:'triangle',v:0.046,s:1.62}
    ],
    close:[
        {r:1.45,o:0,d:0.065,w:'triangle',v:0.045,s:1.02},
        {r:0.88,o:0.055,d:0.075,w:'square',v:0.038,s:0.7}
    ],
    attack:[
        {r:1.8,o:0,d:0.08,w:'sawtooth',v:0.055,s:0.72},
        {r:0.7,o:0.055,d:0.09,w:'square',v:0.045,s:0.5}
    ],
    shop:[
        {r:1.5,o:0,d:0.055,w:'square',v:0.05,s:1.65},
        {r:2,o:0.055,d:0.08,w:'sine',v:0.048,s:2.15}
    ],
    save:[
        {r:1,o:0,d:0.055,w:'square',v:0.045,s:1.05},
        {r:1.5,o:0.05,d:0.065,w:'triangle',v:0.05,s:1.58},
        {r:2,o:0.105,d:0.11,w:'sine',v:0.048,s:2.08}
    ],
    reload:[
        {r:1,o:0,d:0.06,w:'triangle',v:0.043,s:1.48},
        {r:1.5,o:0.055,d:0.06,w:'triangle',v:0.043,s:0.96},
        {r:1.02,o:0.11,d:0.07,w:'square',v:0.04,s:1.25}
    ],
    reset:[
        {r:1.42,o:0,d:0.075,w:'square',v:0.05,s:1.02},
        {r:0.98,o:0.065,d:0.085,w:'sawtooth',v:0.045,s:0.66}
    ],
    warning:[
        {r:0.72,o:0,d:0.09,w:'square',v:0.055,s:0.62},
        {r:0.72,o:0.105,d:0.09,w:'square',v:0.05,s:0.54}
    ],
    delete:[
        {r:1.08,o:0,d:0.08,w:'sawtooth',v:0.055,s:0.62},
        {r:0.58,o:0.07,d:0.13,w:'square',v:0.052,s:0.38}
    ],
    admin:[
        {r:0.8,o:0,d:0.055,w:'square',v:0.045,s:1.1},
        {r:1.35,o:0.05,d:0.065,w:'square',v:0.045,s:1.7},
        {r:2.05,o:0.105,d:0.1,w:'triangle',v:0.045,s:2.3}
    ],
    generic:[
        {r:1,o:0,d:0.065,w:'square',v:0.045,s:1.18}
    ]
};

function getButtonSfxHash(action){
    var text=String(action||'button');
    var hash=2166136261;
    for(var i=0;i<text.length;i++){
        hash^=text.charCodeAt(i);
        hash=Math.imul(hash,16777619);
    }
    return hash>>>0;
}

function playButtonFunctionSfx(action,profileName){
    if(!action)return false;
    if(!audioUnlocked)unlockAudio();
    var profile=BUTTON_SFX_PROFILES[profileName]||BUTTON_SFX_PROFILES.generic;
    var hash=getButtonSfxHash(action);
    var base=190+(hash%230);
    var variation=0.91+((hash>>>8)%19)/100;
    for(var i=0;i<profile.length;i++){
        var note=profile[i];
        var freq=base*note.r*variation;
        playSynthTone(freq,note.o,note.d,note.w,note.v,base*note.s*variation);
    }
    document.body.setAttribute('data-last-sfx','button-'+action);
    document.body.setAttribute('data-last-sfx-profile',profileName||'generic');
    return true;
}

function buttonSfxSlug(text){
    return String(text||'button').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'button';
}

function getButtonSfxInfo(control){
    if(!control||control.id==='enter-dungeon-btn'||control.id==='confirm-btn')return null;

    if(control.classList.contains('choice-btn')){
        return null;
    }
    if(control.classList.contains('char-card')){
        var hero=control.querySelector('.char-name');
        return {action:'hero-'+buttonSfxSlug(hero?hero.textContent:'character'),profile:'select'};
    }
    if(control.classList.contains('learn-tab')){
        return {action:'learn-'+buttonSfxSlug(control.textContent),profile:'select'};
    }
    if(control.classList.contains('admin-list-item')){
        var parent=control.parentElement;
        return {action:(parent&&parent.id==='admin-user-list')?'select-admin-user':'select-admin-question',profile:'select'};
    }
    if(control.classList.contains('level-up-overlay'))return {action:'dismiss-level-up',profile:'close'};
    if(control.classList.contains('boss-defeat-overlay'))return {action:'dismiss-boss-defeat',profile:'close'};
    if(control.classList.contains('death-overlay'))return {action:'restart-after-death',profile:'reset'};

    var inline=control.getAttribute('onclick')||'';
    var match=inline.match(/^\s*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/);
    var fn=match?match[1]:'';
    var args=match?match[2]:'';
    var firstString='';
    var argMatch=args.match(/['\"]([^'\"]+)['\"]/);
    if(argMatch)firstString=argMatch[1];

    if(fn==='showScreen'){
        return {action:'screen-'+buttonSfxSlug(firstString),profile:firstString==='title-screen'?'back':'navigate'};
    }
    if(fn==='showLearnTab')return {action:'learn-'+buttonSfxSlug(firstString),profile:'select'};
    if(fn==='switchAdminTab')return {action:'admin-tab-'+buttonSfxSlug(firstString),profile:'select'};
    if(fn==='buyShopItem')return {action:'shop-'+buttonSfxSlug(firstString),profile:'shop'};

    var profiles={
        showLeaderboard:'navigate',loginUser:'admin',goToHeroSelection:'navigate',startGame:'confirm',
        openShop:'open',closeShop:'close',nextAction:'attack',usePotion:'confirm',buyPotion:'shop',
        openSettings:'open',closeSettings:'close',saveSettings:'save',restartGame:'reset',exitGame:'warning',
        openAdminLogin:'admin',closeAdminLogin:'close',submitAdminLogin:'admin',openAdminDashboard:'admin',
        closeAdminDashboard:'close',createNewQuestion:'confirm',reloadAdminQuestions:'reload',
        resetAdminQuestions:'warning',cancelResetAdminQuestions:'close',confirmResetAdminQuestions:'reset',reloadAdminUsers:'reload',saveAdminQuestion:'save',
        resetAdminUserProgress:'warning',deleteAdminUser:'delete',saveAdminUser:'save'
    };
    if(fn)return {action:buttonSfxSlug(fn+(firstString?'-'+firstString:'')),profile:profiles[fn]||'generic'};

    if(control.tagName==='BUTTON'&&String(control.type).toLowerCase()==='submit'){
        return {action:'submit-'+buttonSfxSlug(control.textContent),profile:'admin'};
    }
    return {action:'button-'+buttonSfxSlug(control.id||control.textContent),profile:'generic'};
}

function handleButtonFunctionSfx(event){
    if(!event.target||!event.target.closest)return;
    var control=event.target.closest('button,.learn-tab,.shop-item,.char-card,.choice-btn,.admin-list-item,.level-up-overlay,.boss-defeat-overlay,.death-overlay');
    if(!control||control.disabled||control.classList.contains('disabled'))return;
    var info=getButtonSfxInfo(control);
    if(info)playButtonFunctionSfx(info.action,info.profile);
}

function playAdminSecretClickSfx(clickCount,isUnlock){
    if(!audioUnlocked)unlockAudio();
    if(isUnlock){
        playSynthTone(220,0,0.07,'square',0.05,275);
        playSynthTone(330,0.065,0.08,'triangle',0.055,440);
        playSynthTone(495,0.13,0.09,'square',0.052,660);
        playSynthTone(770,0.205,0.15,'sine',0.06,990);
        document.body.setAttribute('data-last-sfx','admin-secret-unlocked');
    }else{
        var base=180+((Math.max(1,clickCount)-1)*82);
        playSynthTone(base,0,0.055,'square',0.047,base*1.12);
        playSynthTone(base*1.45,0.045,0.065,'triangle',0.04,base*1.58);
        document.body.setAttribute('data-last-sfx','admin-secret-click-'+clickCount);
    }
    document.body.setAttribute('data-last-sfx-profile','admin-secret');
}

function playDeathSfx(){
    if(!audioUnlocked)unlockAudio();
    var notes=[
        {f:494,o:0,d:0.14,w:'square',v:0.065,s:415},
        {f:392,o:0.13,d:0.15,w:'square',v:0.064,s:330},
        {f:294,o:0.27,d:0.17,w:'triangle',v:0.066,s:247},
        {f:196,o:0.42,d:0.22,w:'sawtooth',v:0.06,s:130},
        {f:98,o:0.61,d:0.42,w:'sine',v:0.075,s:52}
    ];
    for(var i=0;i<notes.length;i++){
        var note=notes[i];
        playSynthTone(note.f,note.o,note.d,note.w,note.v,note.s);
    }
    playSynthTone(73,0.67,0.35,'triangle',0.05,45);
    document.body.setAttribute('data-last-sfx','player-death');
    document.body.setAttribute('data-last-sfx-profile','death');
}

function playFloorStartSfx(){
    if(!audioUnlocked)unlockAudio();
    var notes=[
        {f:196,o:0,d:0.08,w:'square',v:0.052,s:220},
        {f:262,o:0.075,d:0.09,w:'triangle',v:0.055,s:294},
        {f:330,o:0.15,d:0.1,w:'square',v:0.058,s:392},
        {f:440,o:0.23,d:0.12,w:'triangle',v:0.06,s:523},
        {f:659,o:0.33,d:0.2,w:'sine',v:0.07,s:784}
    ];
    for(var i=0;i<notes.length;i++){
        var note=notes[i];
        playSynthTone(note.f,note.o,note.d,note.w,note.v,note.s);
    }
    playSynthTone(98,0,0.16,'sine',0.055,73);
    playSynthTone(131,0.18,0.18,'sine',0.05,98);
    document.body.setAttribute('data-last-sfx','floor-start');
    document.body.setAttribute('data-last-sfx-profile','start');
}

function playDungeonDoorSfx(){
    if(!audioUnlocked)unlockAudio();
    var ctx=ensureAudioContext();
    if(!ctx||!audioMasterGain)return false;
    var knockTimes=[0,0.19,0.42];
    for(var k=0;k<knockTimes.length;k++){
        var start=ctx.currentTime+knockTimes[k];
        var duration=0.075;
        var sampleCount=Math.max(1,Math.floor(ctx.sampleRate*duration));
        var buffer=ctx.createBuffer(1,sampleCount,ctx.sampleRate);
        var samples=buffer.getChannelData(0);
        for(var i=0;i<sampleCount;i++){
            var decay=Math.pow(1-(i/sampleCount),3.2);
            samples[i]=(Math.random()*2-1)*decay;
        }
        var noise=ctx.createBufferSource();
        var filter=ctx.createBiquadFilter();
        var gain=ctx.createGain();
        noise.buffer=buffer;
        filter.type='bandpass';
        filter.frequency.setValueAtTime(430-(k*28),start);
        filter.Q.setValueAtTime(2.8,start);
        gain.gain.setValueAtTime(0.0001,start);
        gain.gain.linearRampToValueAtTime(0.34,start+0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001,start+duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioMasterGain);
        noise.start(start);
        noise.stop(start+duration+0.015);

        var thump=ctx.createOscillator();
        var thumpGain=ctx.createGain();
        thump.type='sine';
        thump.frequency.setValueAtTime(112-(k*5),start);
        thump.frequency.exponentialRampToValueAtTime(62,start+0.09);
        thumpGain.gain.setValueAtTime(0.0001,start);
        thumpGain.gain.linearRampToValueAtTime(0.2,start+0.004);
        thumpGain.gain.exponentialRampToValueAtTime(0.0001,start+0.1);
        thump.connect(thumpGain);
        thumpGain.connect(audioMasterGain);
        thump.start(start);
        thump.stop(start+0.11);
    }
    document.body.setAttribute('data-last-sfx','dungeon-door-knock');
    return true;
}

function enterDungeon(){
    if(enteringDungeon)return;
    enteringDungeon=true;
    playDungeonDoorSfx();
    var button=document.getElementById('enter-dungeon-btn');
    var door=document.getElementById('title-canvas');
    if(button){button.disabled=true;button.textContent='KNOCK... KNOCK...';button.classList.add('entering');}
    if(door)door.classList.add('door-knocking');
    setTimeout(function(){
        if(button){button.disabled=false;button.textContent='ENTER DUNGEON';button.classList.remove('entering');}
        if(door)door.classList.remove('door-knocking');
        showScreen('add-user-screen');
        enteringDungeon=false;
    },690);
}

// Every hero has an acoustic identity. Normal attacks use the base layers;
// active skills add the special layers without replacing the volume control.
const CHARACTER_ATTACK_SFX={
    scholar:{
        tones:[{f:1120,o:0,d:.035,w:'square',v:.035,s:870},{f:1320,o:.04,d:.035,w:'square',v:.032,s:1010},{f:420,o:.075,d:.14,w:'triangle',v:.055,s:720}],
        noises:[{o:0,d:.11,v:.035,type:'bandpass',f:1700,s:900,q:2.6,decay:3}],
        specialTones:[{f:880,o:.12,d:.22,w:'sine',v:.05,s:330},{f:523,o:.18,d:.2,w:'triangle',v:.052,s:1046}],
        specialNoises:[{o:.08,d:.3,v:.032,type:'bandpass',f:2400,s:420,q:3.4,texture:'pulse',pulses:9}]
    },
    wizard:{
        tones:[{f:145,o:0,d:.2,w:'sine',v:.062,s:390},{f:430,o:.035,d:.19,w:'triangle',v:.052,s:910},{f:870,o:.12,d:.16,w:'sine',v:.038,s:1380}],
        noises:[{o:0,d:.24,v:.033,type:'bandpass',f:1150,s:2800,q:4,texture:'pulse',pulses:7}],
        specialTones:[{f:110,o:0,d:.38,w:'sine',v:.058,s:70},{f:554,o:.12,d:.28,w:'triangle',v:.05,s:1108},{f:659,o:.14,d:.3,w:'sine',v:.045,s:1318}],
        specialNoises:[{o:.1,d:.38,v:.046,type:'highpass',f:650,s:5200,q:1.8}]
    },
    knight:{
        tones:[{f:96,o:0,d:.15,w:'square',v:.07,s:52},{f:2350,o:.025,d:.14,w:'triangle',v:.04,s:720},{f:1280,o:.045,d:.18,w:'sine',v:.04,s:480}],
        noises:[{o:0,d:.16,v:.065,type:'bandpass',f:720,s:190,q:1.1,decay:3.4}],
        specialTones:[{f:72,o:.08,d:.32,w:'sine',v:.07,s:42},{f:3100,o:.12,d:.34,w:'triangle',v:.052,s:510}],
        specialNoises:[{o:.06,d:.35,v:.075,type:'lowpass',f:1450,s:90,q:.7,texture:'pulse',pulses:5}]
    },
    rogue:{
        tones:[{f:760,o:0,d:.035,w:'square',v:.038,s:1540},{f:1180,o:.04,d:.03,w:'sawtooth',v:.035,s:540},{f:920,o:.075,d:.035,w:'square',v:.036,s:1760},{f:1760,o:.12,d:.07,w:'triangle',v:.03,s:680}],
        noises:[{o:0,d:.14,v:.038,type:'highpass',f:2100,s:6200,q:2.4,texture:'pulse',pulses:18}],
        specialTones:[{f:1800,o:.03,d:.16,w:'sawtooth',v:.045,s:180},{f:2400,o:.13,d:.12,w:'square',v:.038,s:320}],
        specialNoises:[{o:.02,d:.3,v:.045,type:'bandpass',f:3600,s:700,q:5,texture:'pulse',pulses:24}]
    },
    healer:{
        tones:[{f:392,o:0,d:.15,w:'sine',v:.048,s:523},{f:523,o:.07,d:.17,w:'sine',v:.05,s:659},{f:659,o:.15,d:.2,w:'triangle',v:.047,s:988}],
        noises:[{o:.02,d:.26,v:.025,type:'highpass',f:2200,s:5100,q:.9,decay:1.3}],
        specialTones:[{f:262,o:0,d:.36,w:'sine',v:.052,s:523},{f:523,o:.14,d:.34,w:'sine',v:.055,s:1046},{f:784,o:.24,d:.3,w:'triangle',v:.045,s:1175}],
        specialNoises:[{o:.1,d:.42,v:.032,type:'bandpass',f:900,s:4200,q:2.2,texture:'pulse',pulses:6}]
    },
    pirate:{
        tones:[{f:88,o:0,d:.24,w:'sine',v:.078,s:42},{f:145,o:.025,d:.16,w:'square',v:.052,s:62},{f:760,o:.16,d:.18,w:'triangle',v:.03,s:1180}],
        noises:[{o:0,d:.28,v:.09,type:'lowpass',f:1600,s:130,q:.8,decay:3.8}],
        specialTones:[{f:62,o:.08,d:.45,w:'sine',v:.078,s:34},{f:980,o:.24,d:.26,w:'triangle',v:.04,s:1760}],
        specialNoises:[{o:.04,d:.48,v:.1,type:'lowpass',f:2400,s:80,q:.7,texture:'crackle',decay:3.2}]
    },
    default:{tones:[{f:280,o:0,d:.12,w:'square',v:.055,s:420}],noises:[{o:0,d:.1,v:.035,type:'bandpass',f:900,s:350,q:1.4}]}
};

// Each normal monster and boss uses a separate procedural recipe inspired by
// its design: slime bubbles, ghost suction, bone clacks, web snaps, and so on.
const MONSTER_ATTACK_SFX={
    bug_sprite:{tones:[{f:720,o:0,d:.045,w:'square',v:.04,s:290},{f:510,o:.055,d:.05,w:'square',v:.038,s:170},{f:260,o:.11,d:.07,w:'sawtooth',v:.035,s:110}],noises:[{o:0,d:.13,v:.03,type:'highpass',f:2600,s:900,q:2.6,texture:'pulse',pulses:15}]},
    null_ghost:{tones:[{f:520,o:0,d:.28,w:'sine',v:.052,s:74},{f:285,o:.06,d:.32,w:'triangle',v:.038,s:48}],noises:[{o:0,d:.34,v:.038,type:'bandpass',f:1600,s:180,q:4.2}]},
    var_slime:{tones:[{f:160,o:0,d:.13,w:'sine',v:.055,s:82},{f:230,o:.09,d:.11,w:'sine',v:.044,s:108},{f:125,o:.16,d:.14,w:'triangle',v:.042,s:66}],noises:[{o:0,d:.25,v:.055,type:'lowpass',f:780,s:120,q:1.8,texture:'pulse',pulses:7}]},
    scope_bat:{tones:[{f:1650,o:0,d:.07,w:'sawtooth',v:.032,s:720},{f:1180,o:.07,d:.065,w:'square',v:.03,s:1840},{f:1920,o:.14,d:.06,w:'triangle',v:.027,s:860}],noises:[{o:0,d:.2,v:.034,type:'highpass',f:3300,s:1100,q:3.2,texture:'pulse',pulses:13}]},
    loop_worm:{tones:[{f:190,o:0,d:.06,w:'square',v:.04,s:235},{f:235,o:.065,d:.06,w:'square',v:.04,s:170},{f:190,o:.13,d:.06,w:'square',v:.04,s:235},{f:235,o:.195,d:.08,w:'square',v:.04,s:130}],noises:[{o:0,d:.27,v:.03,type:'bandpass',f:620,s:260,q:2,texture:'pulse',pulses:8}]},
    array_golem:{tones:[{f:82,o:0,d:.2,w:'square',v:.07,s:46},{f:118,o:.05,d:.15,w:'sawtooth',v:.052,s:62},{f:1480,o:.08,d:.12,w:'triangle',v:.026,s:410}],noises:[{o:0,d:.24,v:.075,type:'lowpass',f:780,s:85,q:.8,decay:3.5}]},
    sql_inject:{tones:[{f:380,o:0,d:.055,w:'square',v:.034,s:920},{f:1240,o:.06,d:.06,w:'sawtooth',v:.035,s:260},{f:510,o:.13,d:.08,w:'square',v:.033,s:1640}],noises:[{o:.02,d:.2,v:.035,type:'bandpass',f:2200,s:4200,q:5,texture:'pulse',pulses:21}]},
    syntax_skeleton:{tones:[{f:1850,o:0,d:.045,w:'triangle',v:.032,s:680},{f:1420,o:.055,d:.045,w:'square',v:.03,s:420},{f:2100,o:.11,d:.04,w:'triangle',v:.026,s:760}],noises:[{o:0,d:.17,v:.05,type:'bandpass',f:1250,s:470,q:2.8,texture:'crackle',decay:4}]},
    regex_spider:{tones:[{f:920,o:0,d:.09,w:'sawtooth',v:.036,s:1480},{f:1880,o:.08,d:.065,w:'triangle',v:.03,s:650}],noises:[{o:0,d:.2,v:.043,type:'bandpass',f:3100,s:740,q:5.5,texture:'pulse',pulses:10}]},
    exception_wraith:{tones:[{f:1180,o:0,d:.26,w:'sawtooth',v:.047,s:150},{f:760,o:.055,d:.3,w:'triangle',v:.035,s:92}],noises:[{o:0,d:.34,v:.052,type:'bandpass',f:2800,s:260,q:4.8}]},
    type_mimic:{tones:[{f:240,o:0,d:.06,w:'square',v:.042,s:820},{f:820,o:.065,d:.065,w:'triangle',v:.04,s:170},{f:170,o:.135,d:.08,w:'sawtooth',v:.04,s:1120}],noises:[{o:.02,d:.19,v:.03,type:'bandpass',f:980,s:2600,q:3,texture:'pulse',pulses:9}]},
    callback_phantom:{tones:[{f:640,o:0,d:.09,w:'sine',v:.043,s:390},{f:640,o:.11,d:.09,w:'sine',v:.032,s:390},{f:640,o:.22,d:.1,w:'sine',v:.022,s:320}],noises:[{o:0,d:.34,v:.028,type:'bandpass',f:1850,s:420,q:4,texture:'pulse',pulses:6}]},
    closure_trap:{tones:[{f:330,o:0,d:.18,w:'sawtooth',v:.045,s:760},{f:760,o:.03,d:.16,w:'square',v:.038,s:280},{f:210,o:.14,d:.12,w:'triangle',v:.04,s:95}],noises:[{o:.02,d:.25,v:.046,type:'bandpass',f:820,s:210,q:3.6,texture:'pulse',pulses:5}]},
    cache_cinder:{tones:[{f:190,o:0,d:.2,w:'sawtooth',v:.046,s:88},{f:740,o:.08,d:.12,w:'triangle',v:.03,s:360}],noises:[{o:0,d:.31,v:.07,type:'highpass',f:1200,s:4800,q:1.1,texture:'crackle',decay:1.5}]},
    daemon_imp:{tones:[{f:125,o:0,d:.24,w:'sawtooth',v:.058,s:68},{f:360,o:.045,d:.2,w:'square',v:.043,s:145},{f:820,o:.17,d:.1,w:'triangle',v:.028,s:390}],noises:[{o:0,d:.3,v:.063,type:'bandpass',f:1250,s:330,q:1.4,texture:'crackle'}]},
    stack_overflow:{tones:[{f:92,o:0,d:.1,w:'square',v:.062,s:116},{f:116,o:.09,d:.1,w:'square',v:.06,s:145},{f:145,o:.18,d:.16,w:'sawtooth',v:.06,s:62}],noises:[{o:0,d:.34,v:.075,type:'lowpass',f:620,s:65,q:.8,texture:'pulse',pulses:6}],specialTones:[{f:72,o:.08,d:.45,w:'sawtooth',v:.072,s:38},{f:220,o:.2,d:.3,w:'square',v:.05,s:55}],specialNoises:[{o:.06,d:.5,v:.09,type:'lowpass',f:1100,s:45,q:.7,texture:'pulse',pulses:10}]},
    deadlock_dragon:{tones:[{f:78,o:0,d:.34,w:'sawtooth',v:.065,s:48},{f:86,o:0,d:.32,w:'square',v:.048,s:52},{f:1450,o:.22,d:.15,w:'triangle',v:.03,s:410}],noises:[{o:0,d:.4,v:.065,type:'bandpass',f:520,s:115,q:1.4}],specialTones:[{f:64,o:.05,d:.5,w:'sawtooth',v:.075,s:34},{f:2200,o:.24,d:.28,w:'triangle',v:.045,s:330}],specialNoises:[{o:.08,d:.52,v:.088,type:'bandpass',f:880,s:74,q:2.3,texture:'pulse',pulses:4}]},
    memory_leak:{tones:[{f:420,o:0,d:.38,w:'sine',v:.058,s:55},{f:210,o:.04,d:.4,w:'triangle',v:.043,s:42}],noises:[{o:0,d:.44,v:.06,type:'bandpass',f:1450,s:95,q:4.6}],specialTones:[{f:620,o:0,d:.55,w:'sine',v:.065,s:38},{f:95,o:.22,d:.38,w:'triangle',v:.05,s:46}],specialNoises:[{o:0,d:.58,v:.083,type:'bandpass',f:2400,s:55,q:5.5}]},
    recursion_hydra:{tones:[{f:112,o:0,d:.18,w:'sawtooth',v:.058,s:62},{f:138,o:.11,d:.18,w:'sawtooth',v:.055,s:74},{f:94,o:.22,d:.22,w:'square',v:.06,s:48}],noises:[{o:0,d:.43,v:.07,type:'bandpass',f:760,s:120,q:1.2,texture:'pulse',pulses:6}],specialTones:[{f:82,o:0,d:.42,w:'sawtooth',v:.072,s:36},{f:126,o:.1,d:.42,w:'square',v:.065,s:42},{f:176,o:.2,d:.38,w:'sawtooth',v:.058,s:52}],specialNoises:[{o:.03,d:.55,v:.09,type:'lowpass',f:980,s:58,q:.8,texture:'pulse',pulses:9}]},
    fatal_error_titan:{tones:[{f:58,o:0,d:.42,w:'square',v:.08,s:31},{f:92,o:.04,d:.36,w:'sawtooth',v:.068,s:38},{f:880,o:.19,d:.16,w:'square',v:.038,s:440}],noises:[{o:0,d:.48,v:.1,type:'lowpass',f:1250,s:42,q:.7,decay:4}],specialTones:[{f:46,o:0,d:.65,w:'sine',v:.09,s:25},{f:880,o:.12,d:.12,w:'square',v:.05,s:440},{f:880,o:.31,d:.12,w:'square',v:.05,s:330}],specialNoises:[{o:.05,d:.68,v:.115,type:'lowpass',f:1900,s:36,q:.7,texture:'crackle',decay:3.6}]},
    default:{tones:[{f:180,o:0,d:.13,w:'square',v:.052,s:92}],noises:[{o:0,d:.16,v:.045,type:'bandpass',f:700,s:160,q:1.4}]}
};

function playCharacterAttackSfx(charId,isSpecial){
    if(!audioUnlocked)unlockAudio();
    var id=CHARACTER_ATTACK_SFX[charId]?charId:'default';
    playCombatSfxRecipe(CHARACTER_ATTACK_SFX[id],!!isSpecial,-.38);
    document.body.setAttribute('data-last-sfx',(isSpecial?'hero-skill-':'hero-attack-')+id);
    document.body.setAttribute('data-last-sfx-profile','hero-'+id);
}

function playMonsterAttackSfx(monsterId,isBoss,isSpecial){
    if(!audioUnlocked)unlockAudio();
    var id=MONSTER_ATTACK_SFX[monsterId]?monsterId:'default';
    playCombatSfxRecipe(MONSTER_ATTACK_SFX[id],!!isSpecial,.38);
    if(isBoss&&!isSpecial)playSynthTone(54,0,.26,'sine',.035,34,.32);
    document.body.setAttribute('data-last-sfx',(isSpecial?'boss-skill-':(isBoss?'boss-attack-':'enemy-attack-'))+id);
    document.body.setAttribute('data-last-sfx-profile',(isBoss?'boss-':'enemy-')+id);
}

