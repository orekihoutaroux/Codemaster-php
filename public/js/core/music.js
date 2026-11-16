// ===== BACKGROUND MUSIC =====
// Procedural music: one theme for the menus and one per dungeon floor.
function playMusicNote(freq,duration,wave,volume){
    var ctx=ensureAudioContext();
    if(!ctx||!musicGain||!freq)return;
    var now=ctx.currentTime;
    var osc=ctx.createOscillator();
    var gain=ctx.createGain();
    osc.type=wave||'triangle';
    osc.frequency.setValueAtTime(freq,now);
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.linearRampToValueAtTime(volume||0.12,now+0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+duration);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(now);
    osc.stop(now+duration+0.03);
}

// Each floor uses its own procedural soundtrack to match the scene theme.
const FLOOR_MUSIC_THEMES={
    1:{name:'valley-adventure',melody:[261.63,329.63,392.00,440.00,392.00,329.63,293.66,349.23,392.00,523.25,440.00,392.00,329.63,293.66,261.63,329.63],bass:[130.81,146.83,164.81,146.83],wave:'triangle',bassWave:'sine',duration:0.30,volume:0.09,bassVolume:0.10,bassEvery:4,stepMs:290},
    2:{name:'crystal-echoes',melody:[293.66,440.00,349.23,523.25,440.00,587.33,466.16,349.23,261.63,392.00,329.63,493.88,392.00,523.25,440.00,329.63],bass:[110.00,130.81,98.00,116.54],wave:'sine',bassWave:'triangle',duration:0.58,volume:0.075,bassVolume:0.085,bassEvery:4,stepMs:340,accent:[880.00,698.46,783.99,587.33],accentEvery:8},
    3:{name:'cyber-pulse',melody:[329.63,659.25,493.88,739.99,392.00,783.99,493.88,659.25,349.23,698.46,523.25,783.99,440.00,880.00,587.33,739.99],bass:[82.41,98.00,110.00,92.50],wave:'square',bassWave:'sawtooth',duration:0.11,volume:0.065,bassVolume:0.075,bassEvery:2,stepMs:155,accent:[1318.51,987.77],accentEvery:8},
    4:{name:'matrix-sequence',melody:[164.81,196.00,246.94,293.66,329.63,293.66,246.94,196.00,174.61,220.00,261.63,329.63,349.23,329.63,261.63,220.00],bass:[82.41,73.42,87.31,98.00],wave:'square',bassWave:'triangle',duration:0.14,volume:0.07,bassVolume:0.08,bassEvery:4,stepMs:180,accent:[659.25,783.99,698.46,987.77],accentEvery:8},
    5:{name:'inferno-march',melody:[146.83,174.61,155.56,220.00,146.83,233.08,174.61,155.56,130.81,164.81,146.83,220.00,116.54,174.61,155.56,130.81],bass:[73.42,65.41,58.27,69.30],wave:'sawtooth',bassWave:'square',duration:0.20,volume:0.075,bassVolume:0.095,bassEvery:2,stepMs:225,accent:[293.66,311.13,349.23],accentEvery:8}
};

function getFloorMusicTheme(){
    var safeFloor=Math.max(1,Math.min(5,Number(floor_num)||1));
    return FLOOR_MUSIC_THEMES[safeFloor];
}

function playBackgroundMusicStep(){
    if(!audioUnlocked||!musicMode)return;
    var frontMelody=[261.63,329.63,392.00,493.88,293.66,392.00,329.63,246.94,220.00,261.63,329.63,392.00,293.66,349.23,440.00,392.00];
    var frontBass=[130.81,123.47,110.00,146.83];
    if(musicMode.indexOf('floor-')===0){
        var theme=getFloorMusicTheme();
        playMusicNote(theme.melody[musicStep%theme.melody.length],theme.duration,theme.wave,theme.volume);
        if(musicStep%theme.bassEvery===0)playMusicNote(theme.bass[Math.floor(musicStep/theme.bassEvery)%theme.bass.length],theme.duration*1.8,theme.bassWave,theme.bassVolume);
        if(theme.accent&&musicStep%theme.accentEvery===0)playMusicNote(theme.accent[Math.floor(musicStep/theme.accentEvery)%theme.accent.length],theme.duration*1.3,'sine',theme.volume*0.45);
    }else{
        playMusicNote(frontMelody[musicStep%frontMelody.length],0.36,'triangle',0.10);
        if(musicStep%4===0)playMusicNote(frontBass[Math.floor(musicStep/4)%frontBass.length],0.70,'sine',0.12);
    }
    musicStep++;
}

function stopBackgroundMusic(){
    if(musicTimer){clearInterval(musicTimer);musicTimer=null;}
    musicMode='';
    musicStep=0;
    document.body.setAttribute('data-music-playing','false');
}

function startBackgroundMusic(mode){
    if(!audioUnlocked)return;
    if(musicMode===mode&&musicTimer)return;
    stopBackgroundMusic();
    musicMode=mode;
    playBackgroundMusicStep();
    var theme=mode.indexOf('floor-')===0?getFloorMusicTheme():null;
    musicTimer=setInterval(playBackgroundMusicStep,theme?theme.stepMs:420);
    document.body.setAttribute('data-music-playing','true');
}

function syncBackgroundMusic(screenId){
    var safeFloor=Math.max(1,Math.min(5,Number(floor_num)||1));
    var mode=screenId==='game-screen'?'floor-'+safeFloor:'front';
    document.body.setAttribute('data-music-mode',mode);
    document.body.setAttribute('data-music-theme',mode==='front'?'dungeon-gate':getFloorMusicTheme().name);
    if(audioUnlocked)startBackgroundMusic(mode);
    else document.body.setAttribute('data-music-playing','false');
}
