// ===== DRAWING HELPERS AND CHARACTER DATA =====
// The hero artwork itself lives in sprites/hero-sprites.js; this file holds the
// stats, the colour palettes and the special-skill table.
function drawPixelRect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}

const STORAGE_KEY='codemaster_php_state';
const EDITS_KEY='codemaster_php_question_edits';
const PLAYER_STATE_CACHE_PREFIX='codemaster_php_player_state_';
const ACTIVE_PLAYER_SESSION_KEY='codemaster_php_active_player';

const CHARACTERS=[
{id:'scholar',name:'THE SCHOLAR',desc:'High INT, +5s timer per question',statLine:'HP+0 | ATK:Normal | DEF:Low',bonusHp:0,bonusAtk:0,defensePct:0,ability:'addTime',abilityName:'+5s TIMER',abilityDesc:'35 second timer instead of 30',
palette:{skin:'#ffcc99',skinShade:'#dda866',hair:'#553322',hairHi:'#774433',shirt:'#3355aa',shirtDk:'#224488',pants:'#444466',pantsDk:'#333355',shoes:'#332211',shoesDk:'#221100',glasses:'#aaddff',glassesDk:'#88bbdd',book:'#cc8844',bookDk:'#aa6622',bookPage:'#ffe8cc'},
},
{id:'wizard',name:'THE WIZARD',desc:'Magic caster, +20% attack damage',statLine:'HP-10 | ATK:High | DEF:Low',bonusHp:-10,bonusAtk:1,defensePct:0,damageMultiplier:1.2,ability:'dmgBoost',abilityName:'DMG +20%',abilityDesc:'All attacks deal 20% more damage',
palette:{skin:'#ffe0bd',skinShade:'#ddbb8a',robe:'#6633aa',robeDk:'#4a2288',robeLt:'#8855cc',hat:'#7744bb',hatDk:'#5533aa',hatStar:'#ffdd44',beard:'#eeeeee',beardDk:'#cccccc',staff:'#886633',staffDk:'#664422',staffGem:'#ffdd44',staffGlow:'#ffff88'},
},
{id:'knight',name:'THE KNIGHT',desc:'Tanky, takes 50% less damage',statLine:'HP+20 | ATK:Normal | DEF:High',bonusHp:20,bonusAtk:0,defensePct:50,ability:'defense',abilityName:'SHIELD 50%',abilityDesc:'Takes 50% less damage from monsters',
palette:{armor:'#aaaacc',armorDk:'#8888aa',armorLt:'#ccccee',helm:'#9999bb',helmDk:'#777799',skin:'#e8b87e',skinShade:'#cc9966',plume:'#cc3333',plumeDk:'#991111',shield:'#8888bb',shieldDk:'#666699',shieldCross:'#cc3333',sword:'#ccccdd',swordDk:'#aaaabb',swordHilt:'#ffdd44',pants:'#888899',pantsDk:'#666677',boots:'#555566',bootsDk:'#333344'},
},
{id:'rogue',name:'THE HACKER',desc:'Fast striker, 30% critical hit',statLine:'HP-5 | ATK:High | DEF:Normal',bonusHp:-5,bonusAtk:1,defensePct:10,ability:'critHit',abilityName:'CRIT 30%',abilityDesc:'30% chance to deal double damage',
palette:{skin:'#c68642',skinShade:'#a06830',hood:'#222233',hoodDk:'#111122',shirt:'#333344',shirtDk:'#222233',mask:'#111122',eyes:'#00ccff',eyesDk:'#0088cc',belt:'#554422',buckle:'#ccaa44',pants:'#1a1a2a',pantsDk:'#111118',shoes:'#111122',shoesDk:'#000008',blade:'#ccccdd',bladeDk:'#aaaabb',bladeGlow:'#88ddff'},
},
{id:'healer',name:'THE MENTOR',desc:'Heals 15 HP on correct answers',statLine:'HP+10 | ATK:Low | DEF:Normal',bonusHp:10,bonusAtk:-1,defensePct:10,ability:'heal',abilityName:'HEAL +15',abilityDesc:'Recover 15 HP on each correct answer',
palette:{skin:'#fde2c8',skinShade:'#ddb89a',hair:'#ffcc44',hairDk:'#ddaa22',hairHi:'#ffee88',robe:'#ffffff',robeDk:'#dddddd',sash:'#44dd88',sashDk:'#22aa66',staff:'#aa8855',staffDk:'#886633',staffGem:'#44ff88',shoes:'#ccbbaa'},
},
{id:'pirate',name:'THE DEBUGGER',desc:'+50% gold & heals on correct',statLine:'HP+5 | ATK:Normal | DEF:Normal',bonusHp:5,bonusAtk:0,defensePct:10,ability:'goldBoost',abilityName:'GOLD +50%',abilityDesc:'+50% gold & +5 HP on correct answers',
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
const BASE_EXP_PER_LEVEL=100;
const EXP_GROWTH_PER_LEVEL=20;
const ATTACK_PER_LEVEL=2;
const CHARACTER_SPECIALS={
    scholar:{name:'TIME WARP',desc:'Deal 18 damage that ignores DEF and reset the timer.',damage:18,ignoreDefense:true,resetTimer:true},
    wizard:{name:'ARCANE BURST',desc:'Deal 30 arcane damage that ignores enemy DEF.',damage:30,ignoreDefense:true},
    knight:{name:'AEGIS SLAM',desc:'Deal 20 damage and block the next monster attack.',damage:20,shield:1},
    rogue:{name:'ZERO-DAY STRIKE',desc:'Deal 26 damage that ignores DEF and retain 25% charge.',damage:26,ignoreDefense:true,recharge:25},
    healer:{name:'RESTORE PULSE',desc:'Deal 15 damage and restore 45 HP.',damage:15,heal:45},
    pirate:{name:'BOUNTY BREAK',desc:'Deal 22 damage and immediately gain 12 gold.',damage:22,gold:12}
};

