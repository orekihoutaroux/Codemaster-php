// ===== MONSTERS, DUNGEON ENCOUNTERS, AND BOSSES =====
// The artwork lives in sprites/monster-sprites.js; this file holds names, stats,
// the floor map and the combat balance.
const MONSTERS=[
{id:'bug_sprite',name:'Bug Sprite',desc:'A tiny syntax error crawling in code',hp:2,dmg:8,gold:3,floor:1},
{id:'null_ghost',name:'Null Ghost',desc:'Undefined and haunting your scope',hp:2,dmg:10,gold:4,floor:1},
{id:'var_slime',name:'Variable Slime',desc:'An oozy uninitialized variable',hp:3,dmg:8,gold:3,floor:1},
{id:'scope_bat',name:'Scope Bat',desc:'Flies outside its variable scope',hp:3,dmg:10,gold:5,floor:2},
{id:'loop_worm',name:'Infinite Loop Worm',desc:'while(true) { crawl(); }',hp:5,dmg:20,gold:6,floor:2},
{id:'array_golem',name:'Array Golem',desc:'Stacked with dangerous data blocks',hp:6,dmg:22,gold:8,floor:3},
{id:'sql_inject',name:'SQL Injector',desc:'Drops tables with malicious queries',hp:5,dmg:24,gold:9,floor:3},
{id:'syntax_skeleton',name:'Syntax Skeleton',desc:'Missing semicolons gave it life',hp:5,dmg:20,gold:7,floor:2},
{id:'regex_spider',name:'Regex Spider',desc:'Weaves complex pattern webs',hp:7,dmg:30,gold:10,floor:4},
{id:'exception_wraith',name:'Exception Wraith',desc:'Throws fatal errors from the shadows',hp:8,dmg:35,gold:12,floor:4},
{id:'type_mimic',name:'Type Mimic',desc:'Disguises as the wrong data type',hp:7,dmg:28,gold:9,floor:3},
{id:'callback_phantom',name:'Callback Phantom',desc:'Calls you back when you least expect it',hp:8,dmg:32,gold:11,floor:4},
{id:'closure_trap',name:'Closure Trap',desc:'Captures variables in its dark scope',hp:9,dmg:36,gold:12,floor:5},
{id:'cache_cinder',name:'Cache Cinder',desc:'Stale data smoldering inside the inferno cache',hp:10,dmg:40,gold:14,floor:5},
{id:'daemon_imp',name:'Daemon Imp',desc:'A rogue background process fueled by eternal fire',hp:11,dmg:42,gold:15,floor:5}
];

// Fixed dungeon encounter map: floor -> array of 3 monster IDs
const DUNGEON_MAP = {
    1: ['bug_sprite', 'null_ghost', 'var_slime'],
    2: ['scope_bat', 'loop_worm', 'syntax_skeleton'],
    3: ['array_golem', 'sql_inject', 'type_mimic'],
    4: ['regex_spider', 'exception_wraith', 'callback_phantom'],
    5: ['closure_trap', 'cache_cinder', 'daemon_imp']
};

const BOSSES=[
{id:'stack_overflow',name:'STACK OVERFLOW',desc:'The recursive nightmare! Each wrong answer makes it grow!',hp:8,dmg:20,gold:25,floor:1},
{id:'deadlock_dragon',name:'DEADLOCK DRAGON',desc:'Two threads locked in eternal combat! Dangerous!',hp:10,dmg:30,gold:30,floor:2},
{id:'memory_leak',name:'MEMORY LEAK',desc:'The formless beast that devours all resources!',hp:14,dmg:40,gold:40,floor:3},
{id:'recursion_hydra',name:'RECURSION HYDRA',desc:'Every function call grows another head!',hp:17,dmg:46,gold:50,floor:4},
{id:'fatal_error_titan',name:'FATAL ERROR TITAN',desc:'The final inferno crash given monstrous form!',hp:22,dmg:55,gold:65,floor:5}
];

// enemy.draw(ctx, x, y, s, frame) is kept for older call sites.
MONSTERS.concat(BOSSES).forEach(function(enemy){
    enemy.draw=function(ctx,x,y,s,frame){
        SPR.drawAt(ctx,'enemy',enemy.id,x-1.43*s,y-0.71*s,11.43*s,{crop:'all',t:(frame||0)*0.33});
    };
});

// ===== GAME BALANCE =====
// Central combat curve. Normal monsters gain a little more power within each
// floor, while bosses make a larger but predictable jump. Keeping these values
// together makes future balance changes easier and prevents hidden stat spikes.
// Tuned with a run simulator (thousands of runs per hero): every hero clears
// the 5 floors about equally often, and how far you get depends on how many
// answers you know (about 25% clear at 60% correct, 75% at 70%, 97% at 80%).
const MONSTER_FLOOR_BALANCE={
    1:{hp:105,attack:8,defense:0,bossHp:210,bossAttack:20,bossDefense:2},
    2:{hp:135,attack:14,defense:1,bossHp:275,bossAttack:28,bossDefense:4},
    3:{hp:170,attack:20,defense:2,bossHp:340,bossAttack:36,bossDefense:6},
    4:{hp:200,attack:26,defense:3,bossHp:415,bossAttack:44,bossDefense:8},
    5:{hp:230,attack:32,defense:4,bossHp:495,bossAttack:52,bossDefense:10}
};
// Past floor 5 the floor-5 monsters return, +25% HP and attack per extra floor,
// so an endless run gets harder instead of easier as the hero keeps levelling.
const ENDLESS_GROWTH_PER_FLOOR=0.25;
// Your hits and specials roll +-10% (no two hits exactly alike, and no tiny
// stat change decides whether a boss needs one more hit).
const DAMAGE_ROLL=0.1;
// Points (= EXP) for defeating a monster: x the floor (floor 5 at most).
const KILL_POINTS=60,BOSS_KILL_POINTS=180;
// The shop's HP potion costs 15g, +10g for each one bought on the same floor
// (15, 25, 35...). Back to 15g on the next floor.
const HP_POTION_PRICE=15,HP_POTION_PRICE_STEP=10;

function rollDamage(value){
    return Math.max(1,Math.round(value*(1-DAMAGE_ROLL+2*DAMAGE_ROLL*Math.random())));
}
function getKillPoints(isBoss,floor){
    return (isBoss?BOSS_KILL_POINTS:KILL_POINTS)*Math.max(1,Math.min(5,parseInt(floor,10)||1));
}
function getHpPotionPrice(){
    return HP_POTION_PRICE+HP_POTION_PRICE_STEP*Math.max(0,Number(potionsBought)||0);
}
// A hero special's damage before the enemy's DEF: power x your medium-question attack.
function getSpecialDamage(special){
    if(!special)return 0;
    return Math.max(5,Math.round((Number(special.power)||1)*getCharacterBaseAttack('medium')*getCharacterAttackMultiplier()));
}

// Boss specials activate after a predictable number of successful boss attacks.
// Their countdown is shown in the right curtain so the player can prepare.
const BOSS_SPECIALS={
    stack_overflow:{name:'RECURSIVE GROWTH',desc:'Bonus damage and restores 20 boss HP.',every:3,bonusDamage:8,heal:20},
    deadlock_dragon:{name:'THREAD LOCK',desc:'Bonus damage and drains 25% hero skill charge.',every:3,bonusDamage:10,chargeDrain:25},
    memory_leak:{name:'MEMORY DRAIN',desc:'Bonus damage and steals up to 8 gold.',every:3,bonusDamage:12,goldDrain:8},
    recursion_hydra:{name:'RECURSIVE BITE',desc:'A heavy strike that restores 25 boss HP.',every:3,bonusDamage:16,heal:25},
    fatal_error_titan:{name:'FATAL CRASH',desc:'Massive damage and drains 50% hero skill charge.',every:2,bonusDamage:20,chargeDrain:50}
};

function getMonsterBattleStats(floor,encounter,isBoss){
    var rawFloor=Math.max(1,parseInt(floor,10)||1);
    var safeFloor=Math.min(5,rawFloor);
    var balance=MONSTER_FLOOR_BALANCE[safeFloor];
    var growth=1+ENDLESS_GROWTH_PER_FLOOR*Math.max(0,rawFloor-5);
    if(isBoss){
        return {hp:Math.round(balance.bossHp*growth),attack:Math.round(balance.bossAttack*growth),defense:balance.bossDefense};
    }
    var encounterIndex=Math.max(0,Math.min(2,(parseInt(encounter,10)||1)-1));
    return {
        hp:Math.round((balance.hp+(encounterIndex*10))*growth),
        attack:Math.round((balance.attack+encounterIndex)*growth),
        defense:balance.defense+encounterIndex
    };
}

function getCharacterSpecial(){
    return selectedChar?(CHARACTER_SPECIALS[selectedChar.id]||null):null;
}

function getCurrentBossSpecial(){
    return isBossFight&&currentMonster?(BOSS_SPECIALS[currentMonster.id]||null):null;
}

function getCharacterBaseAttack(difficulty){
    var base=difficulty==='hard'?40:(difficulty==='medium'?25:15);
    var floorBonus=(Math.max(1,Math.min(5,floor_num))-1)*3;
    var heroBonus=selectedChar?(Number(selectedChar.bonusAtk)||0)*3:0;
    var levelBonus=(Math.max(1,Number(level)||1)-1)*ATTACK_PER_LEVEL;
    return Math.max(5,base+floorBonus+heroBonus+levelBonus);
}

function getTotalExpForLevel(targetLevel){
    var completedLevels=Math.max(0,Math.floor(Number(targetLevel)||1)-1);
    return (completedLevels*BASE_EXP_PER_LEVEL)+((completedLevels*(completedLevels-1)/2)*EXP_GROWTH_PER_LEVEL);
}

function getLevelProgressFromScore(value){
    var safeScore=Math.max(0,Number(value)||0);
    var linearTerm=(2*BASE_EXP_PER_LEVEL)-EXP_GROWTH_PER_LEVEL;
    var completedLevels=Math.max(0,Math.floor((-linearTerm+Math.sqrt((linearTerm*linearTerm)+(8*EXP_GROWTH_PER_LEVEL*safeScore)))/(2*EXP_GROWTH_PER_LEVEL)));
    while(getTotalExpForLevel(completedLevels+2)<=safeScore)completedLevels++;
    while(completedLevels>0&&getTotalExpForLevel(completedLevels+1)>safeScore)completedLevels--;
    var currentLevel=completedLevels+1;
    return {
        level:currentLevel,
        currentExp:safeScore-getTotalExpForLevel(currentLevel),
        requiredExp:BASE_EXP_PER_LEVEL+((currentLevel-1)*EXP_GROWTH_PER_LEVEL)
    };
}

function getLevelFromScore(value){
    return getLevelProgressFromScore(value).level;
}

function getCharacterAttackMultiplier(){
    return selectedChar?Math.max(1,Number(selectedChar.damageMultiplier)||1):1;
}

function getCharacterMaxHp(targetLevel){
    var safeLevel=Math.max(1,Number(targetLevel)||1);
    var heroBonus=selectedChar?(Number(selectedChar.bonusHp)||0):0;
    return Math.max(1,100+heroBonus+((safeLevel-1)*HP_PER_LEVEL));
}

function applySelectedCharacterStats(){
    if(!selectedChar)return;
    var previousMax=Math.max(1,Number(maxHp)||100);
    var previousHp=Math.max(0,Math.min(previousMax,Number(hp)||0));
    var missingHp=Math.max(0,previousMax-previousHp);
    maxHp=getCharacterMaxHp(level);
    hp=Math.max(0,Math.min(maxHp,maxHp-missingHp));
}

function getCharacterBaseDefensePercent(){
    return selectedChar?Math.max(0,Math.min(100,Number(selectedChar.defensePct)||0)):0;
}

function getCharacterDefensePercent(){
    if(specialShield>0)return 100;
    var damageMultiplier=1-(getCharacterBaseDefensePercent()/100);
    if(buffDef>0)damageMultiplier*=0.5;
    return Math.round((1-damageMultiplier)*100);
}

