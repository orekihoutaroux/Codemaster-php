// ===== DRAWING HELPERS AND CHARACTER DATA =====
// The hero artwork itself lives in sprites/hero-sprites.js; this file holds the
// stats, the colour palettes and the special-skill table.
function drawPixelRect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}

const STORAGE_KEY='codemaster_php_state';
const EDITS_KEY='codemaster_php_question_edits';
const PLAYER_STATE_CACHE_PREFIX='codemaster_php_player_state_';
const ACTIVE_PLAYER_SESSION_KEY='codemaster_php_active_player';

const CHARACTERS=[
{id:'scholar',name:'THE SCHOLAR',desc:'Sharp mind: +10s on every question',statLine:'HP+15 | ATK:Normal | DEF 15%',bonusHp:15,bonusAtk:0,defensePct:15,timerBonus:10,ability:'addTime',abilityName:'+10s TIMER',abilityDesc:'40 second timer instead of 30',
palette:{skin:'#ffcc99',skinShade:'#dda866',hair:'#553322',hairHi:'#774433',shirt:'#3355aa',shirtDk:'#224488',pants:'#444466',pantsDk:'#333355',shoes:'#332211',shoesDk:'#221100',glasses:'#aaddff',glassesDk:'#88bbdd',book:'#cc8844',bookDk:'#aa6622',bookPage:'#ffe8cc'},
},
{id:'wizard',name:'THE WIZARD',desc:'Magic caster, +45% attack damage',statLine:'HP+5 | ATK:High | DEF 0%',bonusHp:5,bonusAtk:1,defensePct:0,damageMultiplier:1.45,ability:'dmgBoost',abilityName:'DMG +45%',abilityDesc:'All attacks deal 45% more damage',
palette:{skin:'#ffe0bd',skinShade:'#ddbb8a',robe:'#6633aa',robeDk:'#4a2288',robeLt:'#8855cc',hat:'#7744bb',hatDk:'#5533aa',hatStar:'#ffdd44',beard:'#eeeeee',beardDk:'#cccccc',staff:'#886633',staffDk:'#664422',staffGem:'#ffdd44',staffGlow:'#ffff88'},
},
{id:'knight',name:'THE KNIGHT',desc:'Tanky, takes 20% less damage',statLine:'HP+10 | ATK:Low | DEF 20%',bonusHp:10,bonusAtk:-1,defensePct:20,ability:'defense',abilityName:'SHIELD 20%',abilityDesc:'Takes 20% less damage from monsters',
palette:{armor:'#aaaacc',armorDk:'#8888aa',armorLt:'#ccccee',helm:'#9999bb',helmDk:'#777799',skin:'#e8b87e',skinShade:'#cc9966',plume:'#cc3333',plumeDk:'#991111',shield:'#8888bb',shieldDk:'#666699',shieldCross:'#cc3333',sword:'#ccccdd',swordDk:'#aaaabb',swordHilt:'#ffdd44',pants:'#888899',pantsDk:'#666677',boots:'#555566',bootsDk:'#333344'},
},
{id:'rogue',name:'THE HACKER',desc:'Fast striker, 35% critical hit',statLine:'HP+0 | ATK:High | DEF 10%',bonusHp:0,bonusAtk:1,defensePct:10,critChance:0.35,ability:'critHit',abilityName:'CRIT 35%',abilityDesc:'35% chance to deal double damage',
palette:{skin:'#c68642',skinShade:'#a06830',hood:'#222233',hoodDk:'#111122',shirt:'#333344',shirtDk:'#222233',mask:'#111122',eyes:'#00ccff',eyesDk:'#0088cc',belt:'#554422',buckle:'#ccaa44',pants:'#1a1a2a',pantsDk:'#111118',shoes:'#111122',shoesDk:'#000008',blade:'#ccccdd',bladeDk:'#aaaabb',bladeGlow:'#88ddff'},
},
{id:'healer',name:'THE MENTOR',desc:'Heals 5 HP on correct answers',statLine:'HP+5 | ATK:Low | DEF 10%',bonusHp:5,bonusAtk:-1,defensePct:10,healOnCorrect:5,ability:'heal',abilityName:'HEAL +5',abilityDesc:'Recover 5 HP on each correct answer',
palette:{skin:'#fde2c8',skinShade:'#ddb89a',hair:'#ffcc44',hairDk:'#ddaa22',hairHi:'#ffee88',robe:'#ffffff',robeDk:'#dddddd',sash:'#44dd88',sashDk:'#22aa66',staff:'#aa8855',staffDk:'#886633',staffGem:'#44ff88',shoes:'#ccbbaa'},
},
{id:'pirate',name:'THE DEBUGGER',desc:'+50% gold & heals 3 on correct',statLine:'HP+5 | ATK:Normal | DEF 5%',bonusHp:5,bonusAtk:0,defensePct:5,goldMultiplier:1.5,healOnCorrect:3,ability:'goldBoost',abilityName:'GOLD +50%',abilityDesc:'+50% gold & +3 HP on correct answers',
palette:{skin:'#dba97e',skinShade:'#bb8855',hair:'#111111',hat:'#222222',hatDk:'#111111',hatSkull:'#ffffff',shirt:'#cc2222',shirtDk:'#992222',shirtLt:'#dd4444',belt:'#443322',buckle:'#ffdd44',pants:'#333355',pantsDk:'#222244',boots:'#443322',bootsDk:'#332211',hook:'#cccccc',hookDk:'#aaaaaa',sword:'#ccccdd'},
}
];

// hero.sprite(ctx, x, y, s, frame) is kept for older call sites. It draws the
// new sprite into the same 8x10 "cell" box the old pixel art used.
CHARACTERS.forEach(function(hero){
    hero.sprite=function(ctx,x,y,s,frame){
        SPR.drawAt(ctx,'hero',hero.id,x-2*s,y-s,12*s,{t:(frame||0)*0.5});
    };
});

// Active hero skills are separate from the passive ability on each character.
// Four correct answers fully charge one use.
// Levels: your points are your EXP. Level 2 at 100, then each level needs
// EXP_GROWTH_PER_LEVEL more than the last. Each level: +2 attack, +5 max HP.
// (Balance checked with a run simulator; see docs/CHANGELOG.md, "game balance".)
const BASE_EXP_PER_LEVEL=100;
const EXP_GROWTH_PER_LEVEL=55;
const ATTACK_PER_LEVEL=2;
const HP_PER_LEVEL=5;
// Little pixel icons for the skill button under the hero (10x10, one letter
// per pixel, '.' is empty). The letters are colours from SKILL_ICON_COLORS.
const SKILL_ICON_COLORS={g:'#f5c842',y:'#ffe98f',s:'#88ccff',w:'#ffffff',p:'#b78cff',v:'#7b4dff',
    k:'#6a6a96',r:'#e94560',o:'#c78a00',c:'#4ef0d0',e:'#2fd18a',l:'#cfd6e6'};
const CHARACTER_SKILL_ICONS={
    scholar:['gggggggggg','.g......g.','.gssssssg.','..gssssg..','...gssg...','...g..g...','..g.ss.g..','.g.ssss.g.','.gssssssg.','gggggggggg'], // hourglass
    wizard: ['....p.....','....p.....','...pwp....','.ppwwwpp..','ppwwwwwpp.','.ppwwwpp..','...pwp..w.','....p..wvw','....p...w.','..........'], // sparkle
    knight: ['llllllllll','lggggrgggl','lggggrgggl','lrrrrrrrrl','lggggrgggl','lggggrgggl','.lgggrggl.','.lgggrggl.','..lggrgl..','...llll...'], // shield
    rogue:  ['......cc..','.....cc...','....cc....','...cc.....','..cccccc..','.....cc...','....cc....','...cc.....','..cc......','.cc.......'], // bolt
    healer: ['...wwww...','...weew...','...weew...','wwwweewwww','weeeeeeeew','weeeeeeeew','wwwweewwww','...weew...','...weew...','...wwww...'], // cross
    pirate: ['.......y.r','......y.r.','.....kk...','...kkkkk..','..kwkkkkk.','..kwkkkkk.','..kkkkkkk.','..kkkkkkk.','...kkkkk..','..........']  // bomb
};
// Specials scale with your attack (power x the damage of a correct medium
// answer, including the Wizard's bonus), so they stay strong on every floor.
// Damage rolls +-10% like normal hits (rollDamage() in js/data/monsters.js).
const CHARACTER_SPECIALS={
    scholar:{name:'TIME WARP',desc:'Hit for 2.5x your attack (ignores DEF) and reset the timer.',power:2.5,ignoreDefense:true,resetTimer:true},
    wizard:{name:'ARCANE BURST',desc:'Blast for 2.8x your attack, ignoring enemy DEF.',power:2.8,ignoreDefense:true},
    knight:{name:'AEGIS SLAM',desc:'Hit for 1.8x your attack and block all damage if you miss this question.',power:1.8,shield:1},
    rogue:{name:'ZERO-DAY STRIKE',desc:'Strike for 2x your attack (ignores DEF) and keep 25% charge.',power:2,ignoreDefense:true,recharge:25},
    healer:{name:'RESTORE PULSE',desc:'Hit for 1.2x your attack and restore 10% of your max HP.',power:1.2,healPct:10},
    pirate:{name:'BOUNTY BREAK',desc:'Hit for 1.8x your attack and gain 6 gold per floor.',power:1.8,goldPerFloor:6}
};

