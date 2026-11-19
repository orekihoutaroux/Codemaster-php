// ===== RUNTIME GAME STATE =====
var selectedChar=null,animFrame=0,characterAnimId=null,monsterAnimId=null;
var currentQuestion=null,questionNum=0,currentDifficulty='easy',answered=false;
var playerUsername='';
var playerRole='Student';
var playerYearLevel='';
var playerBlock='';
var score=0,level=1,streak=0,wrongStreak=0;
var bestStreak=0,totalCorrect=0,totalAnswered=0;
var hp=100,maxHp=100,floor_num=1;
var gold=0,potions=2;
var monstersDefeated=0,bossesDefeated=0;
var currentMonster=null,monsterHp=0,monsterMaxHp=0,monsterAttack=0,monsterDefense=0,encounterCount=0,isBossFight=false;
var specialCharge=0,specialShield=0,bossAttackCount=0;
var timerInterval=null,timeLeft=30,TIMER_MAX=30;
var buffDef=0,buffGold=0,buffCrit=0,buffTime=0;
var answeredIds=[];
var adminLogoClicks=0,adminLogoTimer=null,adminQuestionsCache=[],adminCurrentQuestionId=null;
var adminUsersCache=[],adminCurrentUsername=null,adminActiveTab='questions';
var adminResetFocusReturn=null;
var adminAuthenticated=false;
// Admin login is checked by the server against the "admins" collection. The
// session token lives only for this browser tab (sessionStorage).
var adminToken='';
var adminUsername='';
try{
    adminToken=sessionStorage.getItem('codemaster_admin_token')||'';
    adminUsername=sessionStorage.getItem('codemaster_admin_user')||'';
    adminAuthenticated=!!adminToken;
}catch(e){}
var largeTextMode=(localStorage.getItem('largeTextMode')==='1');
var audioCtx=null;
var audioMasterGain=null;
var musicGain=null;
var musicTimer=null;
var musicMode='';
var musicStep=0;
var audioUnlocked=false;
var enteringDungeon=false;
var reloadProgressResetPromise=Promise.resolve();
var achievementDefinitions=[];
// Initialized by loadPlayerProgression()/applyProgressionPayload() after startup;
// null here avoids a load-order dependency on core/persistence.js.
var playerProgression=null;
var progressionEventQueue=Promise.resolve();
var sfxVolume=parseFloat(localStorage.getItem('sfxVolume')||'1');
if(isNaN(sfxVolume))sfxVolume=1;
// Music has its own slider. Players who only ever had one volume slider keep
// the level they chose for it.
var musicVolume=parseFloat(localStorage.getItem('musicVolume')||String(sfxVolume));
if(isNaN(musicVolume))musicVolume=1;
var MUSIC_BASE_GAIN=0.16;
var questionEdits={};
// True once the question bank has been loaded from MongoDB. While it is false
// the game is running on the offline copy in data/questions-fallback.js and nothing
// the admin saves can reach the database.
var questionsFromDatabase=false;
var questionStorageWarned=false;

