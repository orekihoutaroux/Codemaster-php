/*
===============================================================================
CODEMASTER PHP - APP.JS MAP
===============================================================================
01  Drawing helpers and character data
02  Monsters, dungeon encounters, and bosses
03  Question data and offline fallback
04  Runtime game state
05  Player persistence and state synchronization
06  Question, battle, shop, and admin API requests
07  Screen navigation, account panel, themes, and display preferences
08  Music and sound effects
09  Question timer
10  Title animation and character selection
11  Account access and game entry
12  Battle, questionnaire, and progression
13  Shop controls
14  Admin access
15  Settings
16  Admin question and user management
17  Visual feedback, reset, and utility functions
18  Keyboard, lifecycle, and input events
19  Leaderboard
20  Application startup
===============================================================================
*/

// ===== 01. DRAWING HELPERS AND CHARACTER DATA =====
function drawPixelRect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}

const STORAGE_KEY='codemaster_php_state';
const EDITS_KEY='codemaster_php_question_edits';
const PLAYER_STATE_CACHE_PREFIX='codemaster_php_player_state_';
const ACTIVE_PLAYER_SESSION_KEY='codemaster_php_active_player';

const CHARACTERS=[
{id:'scholar',name:'THE SCHOLAR',desc:'High INT, +5s timer per question',statLine:'HP+0 | ATK:Normal | DEF:Low',bonusHp:0,bonusAtk:0,defensePct:0,ability:'addTime',abilityName:'+5s TIMER',abilityDesc:'35 second timer instead of 30',
palette:{skin:'#ffcc99',skinShade:'#dda866',hair:'#553322',hairHi:'#774433',shirt:'#3355aa',shirtDk:'#224488',pants:'#444466',pantsDk:'#333355',shoes:'#332211',shoesDk:'#221100',glasses:'#aaddff',glassesDk:'#88bbdd',book:'#cc8844',bookDk:'#aa6622',bookPage:'#ffe8cc'},
sprite:function(ctx,x,y,s,frame){
var p=this.palette,f=frame%2,hs=Math.floor(s/2);
drawPixelRect(ctx,x+1*s,y+0*s,6*s,2*s,p.hair);drawPixelRect(ctx,x+0*s,y+1*s,s,3*s,p.hair);drawPixelRect(ctx,x+7*s,y+1*s,s,3*s,p.hair);
drawPixelRect(ctx,x+2*s,y+0*s,s,s,p.hairHi);drawPixelRect(ctx,x+5*s,y+0*s,s,s,p.hairHi);
drawPixelRect(ctx,x+2*s,y+1*s,4*s,3*s,p.skin);drawPixelRect(ctx,x+1*s,y+2*s,s,s,p.skin);drawPixelRect(ctx,x+6*s,y+2*s,s,s,p.skin);
drawPixelRect(ctx,x+2*s,y+3*s,4*s,s,p.skinShade);
drawPixelRect(ctx,x+2*s,y+2*s,2*s,s,p.glasses);drawPixelRect(ctx,x+4*s+hs,y+2*s,hs,s,'#666');drawPixelRect(ctx,x+5*s,y+2*s,2*s,s,p.glasses);
drawPixelRect(ctx,x+2*s,y+2*s+hs,2*s,hs,p.glassesDk);drawPixelRect(ctx,x+5*s,y+2*s+hs,2*s,hs,p.glassesDk);
drawPixelRect(ctx,x+3*s,y+2*s,s,s,'#112244');drawPixelRect(ctx,x+5*s+hs,y+2*s,hs,s,'#112244');
drawPixelRect(ctx,x+2*s,y+1*s+hs,2*s,hs,p.hair);drawPixelRect(ctx,x+5*s,y+1*s+hs,2*s,hs,p.hair);
drawPixelRect(ctx,x+4*s,y+3*s,s,hs,p.skinShade);
drawPixelRect(ctx,x+3*s,y+3*s+hs,2*s,hs,f?'#cc6655':'#bb5544');
drawPixelRect(ctx,x+2*s,y+4*s,4*s,3*s,p.shirt);drawPixelRect(ctx,x+2*s,y+4*s,s,3*s,p.shirtDk);drawPixelRect(ctx,x+5*s,y+4*s,s,3*s,p.shirtDk);
drawPixelRect(ctx,x+3*s,y+4*s,2*s,s,'#ffffff');drawPixelRect(ctx,x+3*s+hs,y+4*s,hs,hs,'#dddddd');
drawPixelRect(ctx,x+1*s,y+4*s,s,3*s,p.skin);drawPixelRect(ctx,x+6*s,y+4*s,s,3*s,p.skin);
drawPixelRect(ctx,x+1*s,y+5*s,s,s,p.skinShade);drawPixelRect(ctx,x+6*s,y+5*s,s,s,p.skinShade);
drawPixelRect(ctx,x+1*s,y+6*s+hs,s,hs,p.skinShade);drawPixelRect(ctx,x+6*s,y+6*s+hs,s,hs,p.skinShade);
drawPixelRect(ctx,x-1*s,y+5*s,2*s,2*s,p.book);drawPixelRect(ctx,x-1*s,y+5*s,s,2*s,p.bookDk);drawPixelRect(ctx,x+0*s,y+5*s+hs,s,s,p.bookPage);
drawPixelRect(ctx,x+2*s,y+7*s,2*s,2*s,p.pants);drawPixelRect(ctx,x+4*s,y+7*s,2*s,2*s,p.pants);
drawPixelRect(ctx,x+2*s,y+7*s,s,2*s,p.pantsDk);drawPixelRect(ctx,x+5*s,y+7*s,s,s,p.pantsDk);
drawPixelRect(ctx,x+2*s,y+7*s,4*s,hs,'#554422');drawPixelRect(ctx,x+3*s+hs,y+7*s,s,hs,'#ccaa44');
drawPixelRect(ctx,x+1*s,y+9*s,3*s,s,p.shoes);drawPixelRect(ctx,x+4*s,y+9*s,3*s,s,p.shoes);
drawPixelRect(ctx,x+1*s,y+9*s,s,hs,p.shoesDk);drawPixelRect(ctx,x+4*s,y+9*s,s,hs,p.shoesDk);
}},
{id:'wizard',name:'THE WIZARD',desc:'Magic caster, +20% attack damage',statLine:'HP-10 | ATK:High | DEF:Low',bonusHp:-10,bonusAtk:1,defensePct:0,damageMultiplier:1.2,ability:'dmgBoost',abilityName:'DMG +20%',abilityDesc:'All attacks deal 20% more damage',
palette:{skin:'#ffe0bd',skinShade:'#ddbb8a',robe:'#6633aa',robeDk:'#4a2288',robeLt:'#8855cc',hat:'#7744bb',hatDk:'#5533aa',hatStar:'#ffdd44',beard:'#eeeeee',beardDk:'#cccccc',staff:'#886633',staffDk:'#664422',staffGem:'#ffdd44',staffGlow:'#ffff88'},
sprite:function(ctx,x,y,s,frame){
var p=this.palette,f=frame%2,hs=Math.floor(s/2);
drawPixelRect(ctx,x+3*s+hs,y-3*s,s,s,p.hat);drawPixelRect(ctx,x+3*s,y-2*s,2*s,s,p.hat);drawPixelRect(ctx,x+2*s,y-1*s,4*s,s,p.hat);drawPixelRect(ctx,x+1*s,y+0*s,6*s,s,p.hat);
drawPixelRect(ctx,x+2*s,y-1*s,s,s,p.hatDk);drawPixelRect(ctx,x+5*s,y+0*s,s,s,p.hatDk);
drawPixelRect(ctx,x+3*s,y-1*s,2*s,s,p.hatStar);drawPixelRect(ctx,x+3*s+hs,y-2*s,s,hs,p.hatStar);
drawPixelRect(ctx,x+2*s,y+1*s,4*s,3*s,p.skin);drawPixelRect(ctx,x+2*s,y+3*s,4*s,s,p.skinShade);
drawPixelRect(ctx,x+3*s,y+2*s,s,s,'#6633aa');drawPixelRect(ctx,x+5*s,y+2*s,s,s,'#6633aa');
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#000');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#000');
drawPixelRect(ctx,x+3*s,y+1*s+hs,s,hs,'#665544');drawPixelRect(ctx,x+5*s,y+1*s+hs,s,hs,'#665544');
drawPixelRect(ctx,x+2*s,y+4*s,4*s,s,p.beard);drawPixelRect(ctx,x+3*s,y+5*s,2*s,s,p.beard);drawPixelRect(ctx,x+3*s+hs,y+6*s,s,hs,p.beard);
drawPixelRect(ctx,x+2*s,y+4*s,s,s,p.beardDk);drawPixelRect(ctx,x+5*s,y+4*s+hs,s,hs,p.beardDk);
drawPixelRect(ctx,x+1*s,y+5*s,6*s,4*s,p.robe);drawPixelRect(ctx,x+1*s,y+5*s,s,4*s,p.robeDk);drawPixelRect(ctx,x+6*s,y+5*s,s,4*s,p.robeDk);
drawPixelRect(ctx,x+3*s,y+5*s,2*s,2*s,p.robeLt);
drawPixelRect(ctx,x+1*s,y+8*s+hs,6*s,hs,p.hatStar);
drawPixelRect(ctx,x+7*s,y+1*s,s,8*s,p.staff);drawPixelRect(ctx,x+7*s,y+3*s,s,2*s,p.staffDk);drawPixelRect(ctx,x+7*s,y+0*s,s,s,p.staffGem);
if(f){drawPixelRect(ctx,x+6*s,y+0*s,s,s,p.staffGlow);drawPixelRect(ctx,x+7*s,y-1*s,s,s,p.staffGlow);} 
drawPixelRect(ctx,x+0*s,y+5*s,s,3*s,p.skin);drawPixelRect(ctx,x+0*s,y+7*s,s,s,p.skinShade);
drawPixelRect(ctx,x+1*s,y+9*s,3*s,s,'#332244');drawPixelRect(ctx,x+4*s,y+9*s,3*s,s,'#332244');
}},
{id:'knight',name:'THE KNIGHT',desc:'Tanky, takes 50% less damage',statLine:'HP+20 | ATK:Normal | DEF:High',bonusHp:20,bonusAtk:0,defensePct:50,ability:'defense',abilityName:'SHIELD 50%',abilityDesc:'Takes 50% less damage from monsters',
palette:{armor:'#aaaacc',armorDk:'#8888aa',armorLt:'#ccccee',helm:'#9999bb',helmDk:'#777799',skin:'#e8b87e',skinShade:'#cc9966',plume:'#cc3333',plumeDk:'#991111',shield:'#8888bb',shieldDk:'#666699',shieldCross:'#cc3333',sword:'#ccccdd',swordDk:'#aaaabb',swordHilt:'#ffdd44',pants:'#888899',pantsDk:'#666677',boots:'#555566',bootsDk:'#333344'},
sprite:function(ctx,x,y,s,frame){
var p=this.palette,f=frame%2,hs=Math.floor(s/2);
drawPixelRect(ctx,x+5*s,y-2*s,s,s,p.plume);drawPixelRect(ctx,x+6*s,y-3*s,s,2*s,p.plume);drawPixelRect(ctx,x+6*s,y-3*s,s,s,p.plumeDk);
drawPixelRect(ctx,x+2*s,y+0*s,4*s,s,p.helm);drawPixelRect(ctx,x+1*s,y+1*s,6*s,2*s,p.helm);
drawPixelRect(ctx,x+2*s,y+0*s,s,s,p.helmDk);drawPixelRect(ctx,x+4*s,y+1*s,s,s,p.armorLt);
drawPixelRect(ctx,x+2*s,y+2*s,4*s,s,'#111');
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#4444ff');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#4444ff');
drawPixelRect(ctx,x+2*s,y+3*s,4*s,s,p.skin);drawPixelRect(ctx,x+2*s,y+3*s+hs,4*s,hs,p.skinShade);
drawPixelRect(ctx,x+1*s,y+4*s,6*s,3*s,p.armor);drawPixelRect(ctx,x+1*s,y+4*s,s,3*s,p.armorDk);drawPixelRect(ctx,x+6*s,y+4*s,s,3*s,p.armorDk);
drawPixelRect(ctx,x+3*s,y+4*s,2*s,s,p.armorLt);
drawPixelRect(ctx,x+3*s,y+5*s,2*s,s,p.plume);drawPixelRect(ctx,x+3*s+hs,y+4*s+hs,s,2*s,p.plume);
drawPixelRect(ctx,x-1*s,y+4*s,2*s,3*s,p.shield);drawPixelRect(ctx,x-1*s,y+4*s,s,3*s,p.shieldDk);drawPixelRect(ctx,x-1*s+hs,y+5*s,s,s,p.shieldCross);
drawPixelRect(ctx,x+7*s,y+1*s+f*hs,s,5*s,p.sword);drawPixelRect(ctx,x+7*s,y+3*s+f*hs,s,s,p.swordDk);
drawPixelRect(ctx,x+7*s,y+0*s+f*hs,s,s,p.swordHilt);drawPixelRect(ctx,x+6*s+hs,y+1*s+f*hs,hs,s,p.swordHilt);
drawPixelRect(ctx,x+0*s,y+4*s,s,2*s,p.armor);drawPixelRect(ctx,x+7*s,y+4*s,s,2*s,p.armor);
drawPixelRect(ctx,x+2*s,y+7*s,2*s,2*s,p.pants);drawPixelRect(ctx,x+4*s,y+7*s,2*s,2*s,p.pants);
drawPixelRect(ctx,x+2*s,y+7*s,s,s,p.pantsDk);drawPixelRect(ctx,x+4*s,y+8*s,s,s,p.pantsDk);
drawPixelRect(ctx,x+1*s,y+9*s,3*s,s,p.boots);drawPixelRect(ctx,x+4*s,y+9*s,3*s,s,p.boots);
drawPixelRect(ctx,x+1*s,y+9*s,s,hs,p.bootsDk);drawPixelRect(ctx,x+4*s,y+9*s,s,hs,p.bootsDk);
}},
{id:'rogue',name:'THE HACKER',desc:'Fast striker, 30% critical hit',statLine:'HP-5 | ATK:High | DEF:Normal',bonusHp:-5,bonusAtk:1,defensePct:10,ability:'critHit',abilityName:'CRIT 30%',abilityDesc:'30% chance to deal double damage',
palette:{skin:'#c68642',skinShade:'#a06830',hood:'#222233',hoodDk:'#111122',shirt:'#333344',shirtDk:'#222233',mask:'#111122',eyes:'#00ccff',eyesDk:'#0088cc',belt:'#554422',buckle:'#ccaa44',pants:'#1a1a2a',pantsDk:'#111118',shoes:'#111122',shoesDk:'#000008',blade:'#ccccdd',bladeDk:'#aaaabb',bladeGlow:'#88ddff'},
sprite:function(ctx,x,y,s,frame){
var p=this.palette,f=frame%2,hs=Math.floor(s/2);
drawPixelRect(ctx,x+1*s,y+0*s,6*s,2*s,p.hood);drawPixelRect(ctx,x+0*s,y+1*s,s,2*s,p.hood);drawPixelRect(ctx,x+7*s,y+1*s,s,2*s,p.hood);
drawPixelRect(ctx,x+0*s,y+0*s,s,s,p.hoodDk);drawPixelRect(ctx,x+7*s,y+0*s,s,s,p.hoodDk);drawPixelRect(ctx,x+1*s,y+0*s,s,s,p.hoodDk);drawPixelRect(ctx,x+6*s,y+0*s,s,s,p.hoodDk);
drawPixelRect(ctx,x+2*s,y+1*s,4*s,3*s,p.skin);drawPixelRect(ctx,x+2*s,y+3*s,4*s,s,p.skinShade);
drawPixelRect(ctx,x+2*s,y+2*s,4*s,s,p.mask);
drawPixelRect(ctx,x+3*s,y+2*s,s,s,p.eyes);drawPixelRect(ctx,x+5*s,y+2*s,s,s,p.eyes);
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#fff');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#fff');
if(f){ctx.globalAlpha=0.3;drawPixelRect(ctx,x+2*s,y+2*s,s,hs,p.eyes);drawPixelRect(ctx,x+6*s,y+2*s,s,hs,p.eyes);ctx.globalAlpha=1;}
drawPixelRect(ctx,x+1*s,y+4*s,6*s,3*s,p.shirt);drawPixelRect(ctx,x+1*s,y+4*s,s,3*s,p.shirtDk);drawPixelRect(ctx,x+6*s,y+4*s,s,3*s,p.shirtDk);
drawPixelRect(ctx,x+4*s,y+4*s,hs,2*s,'#444');
drawPixelRect(ctx,x+1*s,y+6*s,6*s,s,p.belt);drawPixelRect(ctx,x+3*s+hs,y+6*s,s,s,p.buckle);
drawPixelRect(ctx,x+0*s,y+4*s,s,2*s,p.skin);drawPixelRect(ctx,x+7*s,y+4*s,s,2*s,p.skin);
drawPixelRect(ctx,x-1*s,y+3*s+f*hs,s,3*s,p.blade);drawPixelRect(ctx,x+8*s,y+3*s-f*hs,s,3*s,p.blade);
drawPixelRect(ctx,x-1*s,y+3*s+f*hs,s,s,p.bladeDk);
if(f)drawPixelRect(ctx,x-1*s,y+2*s+hs,s,hs,p.bladeGlow);
drawPixelRect(ctx,x+2*s,y+7*s,2*s,2*s,p.pants);drawPixelRect(ctx,x+4*s,y+7*s,2*s,2*s,p.pants);
drawPixelRect(ctx,x+2*s,y+7*s,s,s,p.pantsDk);drawPixelRect(ctx,x+5*s,y+8*s,s,s,p.pantsDk);
drawPixelRect(ctx,x+2*s,y+9*s,2*s,s,p.shoes);drawPixelRect(ctx,x+4*s,y+9*s,2*s,s,p.shoes);drawPixelRect(ctx,x+2*s,y+9*s,s,hs,p.shoesDk);
}},
{id:'healer',name:'THE MENTOR',desc:'Heals 15 HP on correct answers',statLine:'HP+10 | ATK:Low | DEF:Normal',bonusHp:10,bonusAtk:-1,defensePct:10,ability:'heal',abilityName:'HEAL +15',abilityDesc:'Recover 15 HP on each correct answer',
palette:{skin:'#fde2c8',skinShade:'#ddb89a',hair:'#ffcc44',hairDk:'#ddaa22',hairHi:'#ffee88',robe:'#ffffff',robeDk:'#dddddd',sash:'#44dd88',sashDk:'#22aa66',staff:'#aa8855',staffDk:'#886633',staffGem:'#44ff88',shoes:'#ccbbaa'},
sprite:function(ctx,x,y,s,frame){
var p=this.palette,f=frame%2,hs=Math.floor(s/2);
drawPixelRect(ctx,x+1*s,y+0*s,6*s,2*s,p.hair);drawPixelRect(ctx,x+0*s,y+1*s,s,4*s,p.hair);drawPixelRect(ctx,x+7*s,y+1*s,s,4*s,p.hair);
drawPixelRect(ctx,x+2*s,y+0*s,2*s,s,p.hairHi);drawPixelRect(ctx,x+0*s,y+2*s,s,s,p.hairDk);drawPixelRect(ctx,x+7*s,y+2*s,s,s,p.hairDk);
drawPixelRect(ctx,x+2*s,y+1*s,4*s,3*s,p.skin);drawPixelRect(ctx,x+2*s,y+3*s,4*s,s,p.skinShade);
drawPixelRect(ctx,x+3*s,y+2*s,s,s,'#44aa44');drawPixelRect(ctx,x+5*s,y+2*s,s,s,'#44aa44');
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#000');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#000');
drawPixelRect(ctx,x+3*s,y+3*s,2*s,hs,'#ee8877');drawPixelRect(ctx,x+4*s,y+3*s,s,hs,'#ff7777');
drawPixelRect(ctx,x+1*s,y+4*s,6*s,5*s,p.robe);drawPixelRect(ctx,x+1*s,y+4*s,s,5*s,p.robeDk);drawPixelRect(ctx,x+6*s,y+4*s,s,5*s,p.robeDk);
drawPixelRect(ctx,x+3*s,y+5*s,2*s,s,p.sash);drawPixelRect(ctx,x+3*s+hs,y+4*s+hs,s,2*s,p.sash);
drawPixelRect(ctx,x+2*s,y+4*s,s,4*s,p.sash);drawPixelRect(ctx,x+2*s,y+5*s,s,2*s,p.sashDk);
if(f){ctx.globalAlpha=0.25;drawPixelRect(ctx,x+1*s,y+3*s,6*s,2*s,'#44ff88');drawPixelRect(ctx,x+3*s,y+2*s,2*s,5*s,'#44ff88');ctx.globalAlpha=1;}
drawPixelRect(ctx,x+0*s,y+5*s,s,3*s,p.skin);drawPixelRect(ctx,x+7*s,y+5*s,s,3*s,p.skin);drawPixelRect(ctx,x+0*s,y+7*s,s,s,p.skinShade);
drawPixelRect(ctx,x+8*s,y+1*s,s,8*s,p.staff);drawPixelRect(ctx,x+8*s,y+4*s,s,2*s,p.staffDk);drawPixelRect(ctx,x+8*s,y+0*s,s,s,p.staffGem);
if(f)drawPixelRect(ctx,x+7*s+hs,y+0*s,hs,hs,'#aaffcc');
drawPixelRect(ctx,x+2*s,y+9*s,2*s,s,p.shoes);drawPixelRect(ctx,x+5*s,y+9*s,2*s,s,p.shoes);
}},
{id:'pirate',name:'THE DEBUGGER',desc:'+50% gold & heals on correct',statLine:'HP+5 | ATK:Normal | DEF:Normal',bonusHp:5,bonusAtk:0,defensePct:10,ability:'goldBoost',abilityName:'GOLD +50%',abilityDesc:'+50% gold & +5 HP on correct answers',
palette:{skin:'#dba97e',skinShade:'#bb8855',hair:'#111111',hat:'#222222',hatDk:'#111111',hatSkull:'#ffffff',shirt:'#cc2222',shirtDk:'#992222',shirtLt:'#dd4444',belt:'#443322',buckle:'#ffdd44',pants:'#333355',pantsDk:'#222244',boots:'#443322',bootsDk:'#332211',hook:'#cccccc',hookDk:'#aaaaaa',sword:'#ccccdd'},
sprite:function(ctx,x,y,s,frame){
var p=this.palette,f=frame%2,hs=Math.floor(s/2);
drawPixelRect(ctx,x+1*s,y+0*s,6*s,s,p.hat);drawPixelRect(ctx,x+0*s,y+1*s,8*s,s,p.hat);
drawPixelRect(ctx,x+0*s,y+1*s,s,s,p.hatDk);drawPixelRect(ctx,x+7*s,y+1*s,s,s,p.hatDk);
drawPixelRect(ctx,x+3*s,y+0*s,2*s,s,p.hatSkull);drawPixelRect(ctx,x+3*s+hs,y+0*s+hs,s,hs,'#aa0000');
drawPixelRect(ctx,x+2*s,y+2*s,4*s,3*s,p.skin);drawPixelRect(ctx,x+2*s,y+4*s,4*s,s,p.skinShade);
drawPixelRect(ctx,x+2*s,y+3*s,2*s,s,'#111');drawPixelRect(ctx,x+1*s,y+2*s+hs,s,s,'#222');
drawPixelRect(ctx,x+3*s,y+3*s,s,s,'#ff4400');drawPixelRect(ctx,x+3*s,y+3*s,hs,hs,'#ff8800');
drawPixelRect(ctx,x+5*s,y+3*s,s,s,'#222');drawPixelRect(ctx,x+5*s,y+3*s,hs,hs,'#000');
drawPixelRect(ctx,x+2*s,y+5*s,4*s,s,p.hair);drawPixelRect(ctx,x+3*s,y+5*s+hs,2*s,hs,p.hair);
drawPixelRect(ctx,x+3*s,y+4*s+hs,2*s,hs,f?'#cc8866':'#aa7755');
drawPixelRect(ctx,x+1*s,y+5*s,6*s,3*s,p.shirt);drawPixelRect(ctx,x+1*s,y+5*s,s,3*s,p.shirtDk);drawPixelRect(ctx,x+3*s,y+5*s,2*s,2*s,p.shirtLt);drawPixelRect(ctx,x+3*s+hs,y+6*s,s,s,p.shirtDk);
drawPixelRect(ctx,x+1*s,y+7*s+hs,6*s,hs,p.belt);drawPixelRect(ctx,x+3*s+hs,y+7*s+hs,s,hs,p.buckle);
drawPixelRect(ctx,x+0*s,y+5*s,s,3*s,p.hook);drawPixelRect(ctx,x-1*s,y+7*s,s,s,p.hookDk);drawPixelRect(ctx,x-1*s,y+7*s+hs,hs,hs,'#ffffff');
drawPixelRect(ctx,x+7*s,y+5*s,s,2*s,p.skin);drawPixelRect(ctx,x+7*s,y+2*s+f*hs,s,4*s,p.sword);drawPixelRect(ctx,x+7*s,y+1*s+f*hs,s,s,p.buckle);
drawPixelRect(ctx,x+2*s,y+8*s,2*s,s,p.pants);drawPixelRect(ctx,x+4*s,y+8*s,2*s,s,p.pants);drawPixelRect(ctx,x+2*s,y+8*s,s,s,p.pantsDk);
drawPixelRect(ctx,x+1*s,y+9*s,3*s,s,p.boots);drawPixelRect(ctx,x+4*s,y+9*s,3*s,s,p.boots);
drawPixelRect(ctx,x+1*s,y+9*s,s,hs,p.bootsDk);drawPixelRect(ctx,x+4*s,y+9*s,s,hs,p.bootsDk);
}}
];

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

// ===== 02. MONSTERS, DUNGEON ENCOUNTERS, AND BOSSES =====
const MONSTERS=[
{id:'bug_sprite',name:'Bug Sprite',desc:'A tiny syntax error crawling in code',hp:2,dmg:8,gold:3,floor:1,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);
drawPixelRect(ctx,x+2*s,y+2*s,4*s,3*s,'#44cc44');drawPixelRect(ctx,x+1*s,y+3*s,s,s,'#44cc44');drawPixelRect(ctx,x+6*s,y+3*s,s,s,'#44cc44');
drawPixelRect(ctx,x+3*s,y+2*s,s,s,'#ff0000');drawPixelRect(ctx,x+5*s,y+2*s,s,s,'#ff0000');
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#fff');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#fff');
drawPixelRect(ctx,x+2*s,y+5*s,s,2*s,'#338833');drawPixelRect(ctx,x+5*s,y+5*s,s,2*s,'#338833');drawPixelRect(ctx,x+3*s,y+5*s,2*s,s,'#338833');
drawPixelRect(ctx,x+1*s,y+1*s+f%2*hs,s,s,'#44cc44');drawPixelRect(ctx,x+6*s,y+1*s+f%2*hs,s,s,'#44cc44');
drawPixelRect(ctx,x+4*s,y+4*s,s,hs,'#226622');
}},
{id:'null_ghost',name:'Null Ghost',desc:'Undefined and haunting your scope',hp:2,dmg:10,gold:4,floor:1,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);ctx.globalAlpha=0.7;
drawPixelRect(ctx,x+2*s,y+1*s,4*s,5*s,'#aaaadd');drawPixelRect(ctx,x+1*s,y+2*s,s,3*s,'#aaaadd');drawPixelRect(ctx,x+6*s,y+2*s,s,3*s,'#aaaadd');
drawPixelRect(ctx,x+2*s,y+6*s,s,s,'#8888bb');drawPixelRect(ctx,x+4*s,y+6*s,s,s,'#8888bb');drawPixelRect(ctx,x+3*s,y+6*s+hs,s,hs,'#8888bb');drawPixelRect(ctx,x+5*s,y+6*s+hs,s,hs,'#8888bb');
ctx.globalAlpha=1;
drawPixelRect(ctx,x+3*s,y+3*s,s,s,'#111');drawPixelRect(ctx,x+5*s,y+3*s,s,s,'#111');
drawPixelRect(ctx,x+3*s,y+3*s,hs,hs,f%2?'#ff3333':'#111');drawPixelRect(ctx,x+5*s,y+3*s,hs,hs,f%2?'#ff3333':'#111');
drawPixelRect(ctx,x+3*s+hs,y+4*s+hs,s,hs,'#333');
}},
{id:'var_slime',name:'Variable Slime',desc:'An oozy uninitialized variable',hp:3,dmg:8,gold:3,floor:1,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);
drawPixelRect(ctx,x+2*s,y+3*s,4*s,3*s,'#33cc88');drawPixelRect(ctx,x+1*s,y+4*s,s,2*s,'#33cc88');drawPixelRect(ctx,x+6*s,y+4*s,s,2*s,'#33cc88');
drawPixelRect(ctx,x+3*s,y+2*s,2*s,s,'#33cc88');drawPixelRect(ctx,x+1*s,y+6*s,6*s,s,'#229966');
drawPixelRect(ctx,x+3*s,y+4*s,s,s,'#fff');drawPixelRect(ctx,x+5*s,y+4*s,s,s,'#fff');
drawPixelRect(ctx,x+3*s,y+4*s,hs,hs,'#111');drawPixelRect(ctx,x+5*s,y+4*s,hs,hs,'#111');
drawPixelRect(ctx,x+3*s+hs,y+5*s,s,hs,f%2?'#22aa66':'#229966');
ctx.fillStyle='#ffcc00';ctx.font=Math.floor(s*1.5)+'px monospace';ctx.fillText('$',x+2*s,y+2*s);
}},
{id:'scope_bat',name:'Scope Bat',desc:'Flies outside its variable scope',hp:3,dmg:10,gold:5,floor:2,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);var yOff=f%2?0:hs;
drawPixelRect(ctx,x+3*s,y+2*s,2*s,3*s,'#6644aa');drawPixelRect(ctx,x+3*s,y+4*s,2*s,s,'#553399');
drawPixelRect(ctx,x+3*s,y+2*s+hs,s,hs,'#ff0000');drawPixelRect(ctx,x+4*s+hs,y+2*s+hs,hs,hs,'#ff0000');
drawPixelRect(ctx,x+3*s,y+2*s+hs,hs,hs,'#fff');drawPixelRect(ctx,x+4*s+hs,y+2*s+hs,Math.floor(hs/2),hs,'#fff');
drawPixelRect(ctx,x+0*s,y+2*s-yOff,3*s,2*s,'#553399');drawPixelRect(ctx,x+5*s,y+2*s+yOff,3*s,2*s,'#553399');
drawPixelRect(ctx,x+0*s,y+2*s-yOff,s,s,'#442288');drawPixelRect(ctx,x+7*s,y+2*s+yOff,s,s,'#442288');
drawPixelRect(ctx,x+3*s+hs,y+4*s,s,hs,'#442288');
}},
{id:'loop_worm',name:'Infinite Loop Worm',desc:'while(true) { crawl(); }',hp:5,dmg:20,gold:6,floor:2,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);var c=['#cc8833','#bb7722','#cc8833','#bb7722'];
for(var i=0;i<4;i++)drawPixelRect(ctx,x+(1+i)*s,y+4*s+((i+f)%2)*hs,s,s+hs,c[i]);
drawPixelRect(ctx,x+5*s,y+3*s,2*s,2*s,'#cc8833');
drawPixelRect(ctx,x+6*s,y+3*s+hs,s,hs,'#ff3333');drawPixelRect(ctx,x+6*s,y+4*s,s,hs,'#ff3333');
drawPixelRect(ctx,x,y+4*s,s,s,'#cc8833');drawPixelRect(ctx,x,y+5*s,hs,s,'#bb7722');
drawPixelRect(ctx,x+5*s+hs,y+3*s,hs,hs,'#fff');
}},
{id:'array_golem',name:'Array Golem',desc:'Stacked with dangerous data blocks',hp:6,dmg:22,gold:8,floor:3,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);var cols=['#5555cc','#4444bb','#6666dd','#5555cc'];
drawPixelRect(ctx,x+2*s,y+1*s,4*s,2*s,'#5555cc');drawPixelRect(ctx,x+1*s,y+3*s,6*s,4*s,'#4444bb');
for(var i=0;i<4;i++)drawPixelRect(ctx,x+(1+i)*s+(i%2)*hs,y+3*s+i*s,s+hs,s,cols[i]);
drawPixelRect(ctx,x+3*s,y+1*s+hs,s,s,'#ff4444');drawPixelRect(ctx,x+5*s,y+1*s+hs,s,s,'#ff4444');
drawPixelRect(ctx,x+3*s,y+1*s+hs,hs,hs,'#fff');drawPixelRect(ctx,x+5*s,y+1*s+hs,hs,hs,'#fff');
drawPixelRect(ctx,x+0*s,y+3*s+f%2*s,s,3*s,'#4444bb');drawPixelRect(ctx,x+7*s,y+3*s+(1-f%2)*s,s,3*s,'#4444bb');
drawPixelRect(ctx,x+1*s,y+7*s,2*s,s,'#333399');drawPixelRect(ctx,x+5*s,y+7*s,2*s,s,'#333399');
}},
{id:'sql_inject',name:'SQL Injector',desc:'Drops tables with malicious queries',hp:5,dmg:24,gold:9,floor:3,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);
drawPixelRect(ctx,x+1*s,y+1*s,6*s,5*s,'#224422');drawPixelRect(ctx,x+2*s,y+0*s,4*s,s,'#335533');
drawPixelRect(ctx,x+3*s,y+2*s,s,s,'#00ff00');drawPixelRect(ctx,x+5*s,y+2*s,s,s,'#00ff00');
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#000');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#000');
drawPixelRect(ctx,x+3*s,y+4*s,2*s,s,'#113311');
drawPixelRect(ctx,x+0*s,y+2*s,s,3*s,'#446644');drawPixelRect(ctx,x+7*s,y+2*s,s,3*s,'#446644');
if(f%2){drawPixelRect(ctx,x+0*s,y+1*s,s,s,'#66ff66');drawPixelRect(ctx,x+7*s,y+1*s,s,s,'#66ff66');}
drawPixelRect(ctx,x+1*s,y+6*s,2*s,s,'#113311');drawPixelRect(ctx,x+5*s,y+6*s,2*s,s,'#113311');
}},
{id:'syntax_skeleton',name:'Syntax Skeleton',desc:'Missing semicolons gave it life',hp:5,dmg:20,gold:7,floor:2,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);
drawPixelRect(ctx,x+2*s,y+1*s,4*s,2*s,'#ddd');drawPixelRect(ctx,x+3*s,y+0*s,2*s,s,'#ddd');
drawPixelRect(ctx,x+3*s,y+1*s+hs,s,hs,'#222');drawPixelRect(ctx,x+5*s,y+1*s+hs,s,hs,'#222');
drawPixelRect(ctx,x+3*s,y+1*s+hs,hs,Math.floor(hs/2),'#ff4444');drawPixelRect(ctx,x+5*s,y+1*s+hs,hs,Math.floor(hs/2),'#ff4444');
drawPixelRect(ctx,x+3*s+hs,y+2*s+hs,s,hs,'#aaa');
drawPixelRect(ctx,x+3*s,y+3*s,2*s,s,'#ccc');drawPixelRect(ctx,x+2*s,y+4*s,4*s,2*s,'#bbb');
drawPixelRect(ctx,x+3*s,y+4*s,2*s,hs,'#999');
drawPixelRect(ctx,x+1*s,y+3*s+f%2*hs,s,2*s,'#ccc');drawPixelRect(ctx,x+6*s,y+3*s+(1-f%2)*hs,s,2*s,'#ccc');
drawPixelRect(ctx,x+2*s,y+6*s,s,2*s,'#bbb');drawPixelRect(ctx,x+5*s,y+6*s,s,2*s,'#bbb');
}},
{id:'regex_spider',name:'Regex Spider',desc:'Weaves complex pattern webs',hp:7,dmg:30,gold:10,floor:4,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);
drawPixelRect(ctx,x+2*s,y+2*s,4*s,3*s,'#664488');drawPixelRect(ctx,x+3*s,y+1*s,2*s,s,'#664488');
drawPixelRect(ctx,x+3*s,y+2*s,s,s,'#ff0000');drawPixelRect(ctx,x+5*s,y+2*s,s,s,'#ff0000');
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#fff');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#fff');
for(var i=0;i<4;i++){var yOff=f%2?hs:0;
drawPixelRect(ctx,x+i*s,y+5*s+yOff,s,2*s,'#553377');drawPixelRect(ctx,x+(4+i)*s,y+5*s-yOff,s,2*s,'#553377');}
drawPixelRect(ctx,x+3*s+hs,y+4*s,s,hs,'#aa88cc');
}},
{id:'exception_wraith',name:'Exception Wraith',desc:'Throws fatal errors from the shadows',hp:8,dmg:35,gold:12,floor:4,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);ctx.globalAlpha=0.6;
drawPixelRect(ctx,x+2*s,y+1*s,4*s,6*s,'#cc3333');drawPixelRect(ctx,x+1*s,y+2*s,s,4*s,'#cc3333');drawPixelRect(ctx,x+6*s,y+2*s,s,4*s,'#cc3333');
ctx.globalAlpha=1;
drawPixelRect(ctx,x+3*s,y+2*s,s,2*s,'#000');drawPixelRect(ctx,x+5*s,y+2*s,s,2*s,'#000');
drawPixelRect(ctx,x+3*s,y+2*s,hs,s,'#fff');drawPixelRect(ctx,x+5*s,y+2*s,hs,s,'#fff');
drawPixelRect(ctx,x+3*s,y+5*s,2*s,s,'#880000');
if(f%2){drawPixelRect(ctx,x+1*s,y+0*s,s,s,'#ff6666');drawPixelRect(ctx,x+6*s,y+0*s,s,s,'#ff6666');}
}},
{id:'type_mimic',name:'Type Mimic',desc:'Disguises as the wrong data type',hp:7,dmg:28,gold:9,floor:3,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);
drawPixelRect(ctx,x+1*s,y+2*s,6*s,4*s,f%2?'#cc8844':'#bb7733');
drawPixelRect(ctx,x+1*s,y+2*s,6*s,s,'#aa6622');drawPixelRect(ctx,x+1*s,y+5*s,6*s,s,'#aa6622');
drawPixelRect(ctx,x+2*s,y+3*s,s,s,'#fff');drawPixelRect(ctx,x+5*s,y+3*s,s,s,'#fff');
drawPixelRect(ctx,x+2*s,y+3*s,hs,hs,'#ff0000');drawPixelRect(ctx,x+5*s+hs,y+3*s,hs,hs,'#ff0000');
drawPixelRect(ctx,x+3*s,y+4*s+hs,2*s,hs,'#880000');
drawPixelRect(ctx,x+0*s,y+3*s,s,s,'#cc8844');drawPixelRect(ctx,x+7*s,y+3*s,s,s,'#cc8844');
drawPixelRect(ctx,x+1*s,y+6*s,2*s,s,'#996633');drawPixelRect(ctx,x+5*s,y+6*s,2*s,s,'#996633');
}},
{id:'callback_phantom',name:'Callback Phantom',desc:'Calls you back when you least expect it',hp:8,dmg:32,gold:11,floor:4,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);ctx.globalAlpha=0.5+f%2*0.2;
drawPixelRect(ctx,x+2*s,y+1*s,4*s,5*s,'#5577cc');drawPixelRect(ctx,x+1*s,y+2*s,s,3*s,'#5577cc');drawPixelRect(ctx,x+6*s,y+2*s,s,3*s,'#5577cc');
ctx.globalAlpha=1;
drawPixelRect(ctx,x+3*s,y+2*s,s,s,'#00ffff');drawPixelRect(ctx,x+5*s,y+2*s,s,s,'#00ffff');
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#fff');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#fff');
drawPixelRect(ctx,x+3*s,y+4*s,2*s,s,'#334488');
drawPixelRect(ctx,x+2*s,y+6*s,s,s+hs,'#4466aa');drawPixelRect(ctx,x+5*s,y+6*s,s,s+hs,'#4466aa');
if(f%2){drawPixelRect(ctx,x+0*s,y+1*s,s,s,'#88aaff');drawPixelRect(ctx,x+7*s,y+1*s,s,s,'#88aaff');}
}},
{id:'closure_trap',name:'Closure Trap',desc:'Captures variables in its dark scope',hp:9,dmg:36,gold:12,floor:5,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);
drawPixelRect(ctx,x+1*s,y+2*s,6*s,5*s,'#774411');drawPixelRect(ctx,x+2*s,y+1*s,4*s,s,'#885522');
drawPixelRect(ctx,x+2*s,y+3*s,4*s,3*s,'#222');
drawPixelRect(ctx,x+3*s,y+3*s+hs,s,s,f%2?'#ffdd00':'#ffaa00');drawPixelRect(ctx,x+5*s,y+3*s+hs,s,s,f%2?'#ffdd00':'#ffaa00');
drawPixelRect(ctx,x+3*s,y+3*s+hs,hs,hs,'#fff');drawPixelRect(ctx,x+5*s,y+3*s+hs,hs,hs,'#fff');
drawPixelRect(ctx,x+3*s+hs,y+5*s,s,hs,'#553300');
drawPixelRect(ctx,x+0*s,y+3*s,s,2*s+f%2*hs,'#885522');drawPixelRect(ctx,x+7*s,y+3*s,s,2*s+(1-f%2)*hs,'#885522');
drawPixelRect(ctx,x+2*s,y+7*s,s,s,'#663311');drawPixelRect(ctx,x+5*s,y+7*s,s,s,'#663311');
}},
{id:'cache_cinder',name:'Cache Cinder',desc:'Stale data smoldering inside the inferno cache',hp:10,dmg:40,gold:14,floor:5,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);var flicker=f%2?hs:0;
drawPixelRect(ctx,x+2*s,y+2*s,4*s,5*s,'#b83a16');drawPixelRect(ctx,x+1*s,y+4*s,s,3*s,'#8f2412');drawPixelRect(ctx,x+6*s,y+4*s,s,3*s,'#8f2412');
drawPixelRect(ctx,x+2*s,y+1*s-flicker,2*s,2*s,'#ff7a18');drawPixelRect(ctx,x+4*s,y+0*s+flicker,2*s,3*s,'#ffb000');drawPixelRect(ctx,x+5*s,y+1*s-flicker,s,2*s,'#ff3b16');
drawPixelRect(ctx,x+3*s,y+3*s,s,s,'#fff36a');drawPixelRect(ctx,x+5*s,y+3*s,s,s,'#fff36a');drawPixelRect(ctx,x+3*s,y+3*s,hs,hs,'#3a0800');drawPixelRect(ctx,x+5*s,y+3*s,hs,hs,'#3a0800');
drawPixelRect(ctx,x+3*s,y+5*s,2*s,s,'#5a1208');drawPixelRect(ctx,x+2*s,y+7*s,s,s,'#ff5a16');drawPixelRect(ctx,x+5*s,y+7*s,s,s,'#ff5a16');
}},
{id:'daemon_imp',name:'Daemon Imp',desc:'A rogue background process fueled by eternal fire',hp:11,dmg:42,gold:15,floor:5,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);var hop=f%2?hs:0;
drawPixelRect(ctx,x+2*s,y+2*s-hop,4*s,3*s,'#d92e2e');drawPixelRect(ctx,x+1*s,y+0*s-hop,2*s,2*s,'#ff6b20');drawPixelRect(ctx,x+5*s,y+0*s-hop,2*s,2*s,'#ff6b20');
drawPixelRect(ctx,x+2*s,y+5*s-hop,4*s,2*s,'#a81828');drawPixelRect(ctx,x+0*s,y+4*s-hop,2*s,s,'#d92e2e');drawPixelRect(ctx,x+6*s,y+4*s-hop,2*s,s,'#d92e2e');
drawPixelRect(ctx,x+3*s,y+3*s-hop,s,s,'#ffff66');drawPixelRect(ctx,x+5*s,y+3*s-hop,s,s,'#ffff66');drawPixelRect(ctx,x+3*s,y+3*s-hop,hs,hs,'#280000');drawPixelRect(ctx,x+5*s,y+3*s-hop,hs,hs,'#280000');
drawPixelRect(ctx,x+3*s,y+4*s+hs-hop,2*s,hs,'#65000c');drawPixelRect(ctx,x+2*s,y+7*s-hop,s,s,'#73101d');drawPixelRect(ctx,x+5*s,y+7*s-hop,s,s,'#73101d');
}}
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
{id:'stack_overflow',name:'STACK OVERFLOW',desc:'The recursive nightmare! Each wrong answer makes it grow!',hp:8,dmg:20,gold:25,floor:1,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);var cols=['#ff4444','#ee3333','#dd2222','#cc1111','#ff5555','#ee4444'];
for(var i=0;i<6;i++)drawPixelRect(ctx,x+s+i*hs,y+(6-i)*hs,s*(6-i)/3+s,s,cols[i]);
drawPixelRect(ctx,x+2*s,y+1*s,4*s,3*s,'#dd2222');drawPixelRect(ctx,x+1*s,y+2*s,6*s,4*s,'#cc1111');
drawPixelRect(ctx,x+3*s,y+2*s,s,s,'#ffff00');drawPixelRect(ctx,x+5*s,y+2*s,s,s,'#ffff00');
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#000');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#000');
drawPixelRect(ctx,x+3*s,y+4*s,2*s,s,'#880000');drawPixelRect(ctx,x+3*s+hs,y+4*s,s,s,'#aa0000');
drawPixelRect(ctx,x+0*s,y+3*s,s,3*s,'#dd2222');drawPixelRect(ctx,x+7*s,y+3*s,s,3*s,'#dd2222');
if(f%2){drawPixelRect(ctx,x-1*s,y+2*s,s,s,'#ff6666');drawPixelRect(ctx,x+8*s,y+2*s,s,s,'#ff6666');}
drawPixelRect(ctx,x+1*s,y+6*s,2*s,2*s,'#bb1111');drawPixelRect(ctx,x+5*s,y+6*s,2*s,2*s,'#bb1111');
}},
{id:'deadlock_dragon',name:'DEADLOCK DRAGON',desc:'Two threads locked in eternal combat! Dangerous!',hp:10,dmg:30,gold:30,floor:2,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);
drawPixelRect(ctx,x+2*s,y+0*s,4*s,3*s,'#8833cc');drawPixelRect(ctx,x+1*s,y+1*s,s,s,'#8833cc');drawPixelRect(ctx,x+6*s,y+0*s,s,2*s,'#8833cc');
drawPixelRect(ctx,x+0*s,y+0*s,s,s,'#aa55ee');drawPixelRect(ctx,x+7*s,y+0*s,s,s,'#aa55ee');
drawPixelRect(ctx,x+3*s,y+1*s,s,s,'#ff0');drawPixelRect(ctx,x+5*s,y+1*s,s,s,'#ff0');
drawPixelRect(ctx,x+3*s,y+1*s,hs,hs,'#fff');drawPixelRect(ctx,x+5*s,y+1*s,hs,hs,'#fff');
drawPixelRect(ctx,x+3*s,y+2*s+hs,2*s,hs,'#661199');
drawPixelRect(ctx,x+1*s,y+3*s,6*s,4*s,'#7722bb');
drawPixelRect(ctx,x+0*s,y+4*s,s,3*s,'#8833cc');drawPixelRect(ctx,x+7*s,y+4*s,s,3*s,'#8833cc');
if(f%2){drawPixelRect(ctx,x-1*s,y+3*s,s,2*s,'#9944dd');drawPixelRect(ctx,x+8*s,y+3*s,s,2*s,'#9944dd');}
drawPixelRect(ctx,x+1*s,y+7*s,2*s,s,'#661199');drawPixelRect(ctx,x+5*s,y+7*s,2*s,s,'#661199');
drawPixelRect(ctx,x+1*s,y+8*s,s,s,'#5500aa');drawPixelRect(ctx,x+6*s,y+8*s,s,s,'#5500aa');
drawPixelRect(ctx,x+2*s,y+5*s,4*s,s,'#aa55ee');
}},
{id:'memory_leak',name:'MEMORY LEAK',desc:'The formless beast that devours all resources!',hp:14,dmg:40,gold:40,floor:3,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);ctx.globalAlpha=0.5+Math.sin(f*0.3)*0.2;
drawPixelRect(ctx,x+1*s,y+1*s,6*s,6*s,'#33aacc');drawPixelRect(ctx,x+0*s,y+2*s,s,4*s,'#33aacc');drawPixelRect(ctx,x+7*s,y+2*s,s,4*s,'#33aacc');
drawPixelRect(ctx,x+2*s,y+0*s,4*s,s,'#33aacc');drawPixelRect(ctx,x+2*s,y+7*s,4*s,s,'#33aacc');
ctx.globalAlpha=1;
drawPixelRect(ctx,x+2*s,y+2*s,2*s,2*s,'#000');drawPixelRect(ctx,x+5*s,y+2*s,2*s,2*s,'#000');
drawPixelRect(ctx,x+2*s,y+2*s,s,s,'#ff0000');drawPixelRect(ctx,x+5*s+hs,y+2*s,s,s,'#ff0000');
drawPixelRect(ctx,x+3*s,y+5*s,2*s,s,'#004466');drawPixelRect(ctx,x+3*s,y+5*s,hs,hs,'#000');
if(f%3===0){drawPixelRect(ctx,x-1*s,y+3*s,s,s,'#44bbdd');drawPixelRect(ctx,x+8*s,y+4*s,s,s,'#44bbdd');}
}},
{id:'recursion_hydra',name:'RECURSION HYDRA',desc:'Every function call grows another head!',hp:17,dmg:46,gold:50,floor:4,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);var pulse=f%2?hs:0;
drawPixelRect(ctx,x+2*s,y+4*s,4*s,4*s,'#156d67');drawPixelRect(ctx,x+1*s,y+5*s,s,3*s,'#0b4d52');drawPixelRect(ctx,x+6*s,y+5*s,s,3*s,'#0b4d52');
drawPixelRect(ctx,x+0*s,y+1*s+pulse,2*s,3*s,'#20a88f');drawPixelRect(ctx,x+3*s,y+0*s,2*s,4*s,'#26c6a2');drawPixelRect(ctx,x+6*s,y+1*s+(hs-pulse),2*s,3*s,'#20a88f');
drawPixelRect(ctx,x+0*s,y+1*s+pulse,s,s,'#ff3864');drawPixelRect(ctx,x+4*s,y+1*s,s,s,'#ff3864');drawPixelRect(ctx,x+7*s,y+1*s+(hs-pulse),s,s,'#ff3864');
drawPixelRect(ctx,x+0*s,y+1*s+pulse,hs,hs,'#fff');drawPixelRect(ctx,x+4*s,y+1*s,hs,hs,'#fff');drawPixelRect(ctx,x+7*s,y+1*s+(hs-pulse),hs,hs,'#fff');
drawPixelRect(ctx,x+2*s,y+8*s,s,s,'#073a45');drawPixelRect(ctx,x+5*s,y+8*s,s,s,'#073a45');
}},
{id:'fatal_error_titan',name:'FATAL ERROR TITAN',desc:'The final inferno crash given monstrous form!',hp:22,dmg:55,gold:65,floor:5,
draw:function(ctx,x,y,s,f){var hs=Math.floor(s/2);var glow=f%2?'#ffcf33':'#ff7a18';
drawPixelRect(ctx,x+2*s,y+1*s,4*s,3*s,'#651520');drawPixelRect(ctx,x+1*s,y+4*s,6*s,4*s,'#821b20');drawPixelRect(ctx,x+0*s,y+4*s,s,3*s,'#4a1018');drawPixelRect(ctx,x+7*s,y+4*s,s,3*s,'#4a1018');
drawPixelRect(ctx,x+1*s,y+0*s,s,2*s,glow);drawPixelRect(ctx,x+6*s,y+0*s,s,2*s,glow);drawPixelRect(ctx,x+3*s,y+2*s,s,s,'#fff36a');drawPixelRect(ctx,x+5*s,y+2*s,s,s,'#fff36a');
drawPixelRect(ctx,x+3*s,y+2*s,hs,hs,'#300000');drawPixelRect(ctx,x+5*s,y+2*s,hs,hs,'#300000');drawPixelRect(ctx,x+3*s,y+4*s,2*s,s,'#39000a');
drawPixelRect(ctx,x+2*s,y+5*s,s,2*s,glow);drawPixelRect(ctx,x+5*s,y+5*s,s,2*s,glow);drawPixelRect(ctx,x+1*s,y+8*s,2*s,s,'#3a0a12');drawPixelRect(ctx,x+5*s,y+8*s,2*s,s,'#3a0a12');
if(f%2){drawPixelRect(ctx,x-1*s,y+2*s,s,s,'#ff3b16');drawPixelRect(ctx,x+8*s,y+3*s,s,s,'#ffb000');}
}}
];

// Central combat curve. Normal monsters gain a little more power within each
// floor, while bosses make a larger but predictable jump. Keeping these values
// together makes future balance changes easier and prevents hidden stat spikes.
const MONSTER_FLOOR_BALANCE={
    1:{hp:100,attack:8,defense:0,bossHp:200,bossAttack:20,bossDefense:2},
    2:{hp:130,attack:14,defense:1,bossHp:260,bossAttack:28,bossDefense:4},
    3:{hp:160,attack:20,defense:2,bossHp:325,bossAttack:36,bossDefense:6},
    4:{hp:190,attack:26,defense:3,bossHp:395,bossAttack:44,bossDefense:8},
    5:{hp:220,attack:32,defense:4,bossHp:470,bossAttack:52,bossDefense:10}
};

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
    var safeFloor=Math.max(1,Math.min(5,parseInt(floor,10)||1));
    var balance=MONSTER_FLOOR_BALANCE[safeFloor];
    if(isBoss){
        return {hp:balance.bossHp,attack:balance.bossAttack,defense:balance.bossDefense};
    }
    var encounterIndex=Math.max(0,Math.min(2,(parseInt(encounter,10)||1)-1));
    return {
        hp:balance.hp+(encounterIndex*10),
        attack:balance.attack+encounterIndex,
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
    return Math.max(1,100+heroBonus+((safeLevel-1)*10));
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

// ===== 03. QUESTION DATA AND OFFLINE FALLBACK =====
// Questions now come from the MongoDB-backed API (/api/questions).
// loadQuestionsFromServer() fills this array on startup.
var QUESTIONS=[];
// Original hardcoded bank kept only as an offline fallback if the server is unreachable.
var QUESTIONS_FALLBACK=[
    {"id":1,"cat":"basics","diff":"easy","type":"multiple","q":"What does PHP stand for?","choices":["PHP: Hypertext Preprocessor","Personal Home Page","Pre Hypertext Processor","Programming Hypertext Preprocessor"],"answer":0,"explain":"PHP is a recursive acronym for 'PHP: Hypertext Preprocessor'."},
    {"id":2,"cat":"basics","diff":"easy","type":"multiple","q":"Which symbol starts all PHP variables?","choices":["$","#","@","&"],"answer":0,"explain":"All PHP variables begin with the dollar sign ($) symbol."},
    {"id":3,"cat":"basics","diff":"easy","type":"multiple","q":"Which tag pair correctly encloses PHP code?","choices":["&lt;?php ... ?&gt;","&lt;php&gt; ... &lt;/php&gt;","&lt;script php&gt; ... &lt;/script&gt;","{% php %} ... {% endphp %}"],"answer":0,"explain":"PHP code is enclosed between &lt;?php and ?&gt; tags."},
    {"id":4,"cat":"basics","diff":"easy","type":"multiple","q":"How do you output text in PHP?","choices":["echo \"Hello\";","print(\"Hello\")","console.log(\"Hello\")","System.out.println(\"Hello\")"],"answer":0,"explain":"echo is the most common way to output text in PHP. print() also works!"},
    {"id":5,"cat":"basics","diff":"easy","type":"multiple","q":"Which is a valid way to create a comment in PHP?","choices":["// This is a comment","<!-- comment -->","** comment **","% comment"],"answer":0,"explain":"PHP supports // for single-line comments, /* */ for multi-line, and # for single-line."},
    {"id":6,"cat":"basics","diff":"easy","type":"multiple","q":"What is the correct way to end a PHP statement?","choices":["Semicolon (;)","Period (.)","Colon (:)","Comma (,)",],"answer":0,"explain":"Every PHP statement must end with a semicolon (;)."},
    {"id":7,"cat":"basics","diff":"easy","type":"code","q":"What is the output of this code?\n\n&lt;?php\n$x = 5;\n$y = 3;\necho $x + $y;\n?&gt;","choices":["8","53","xy","Error"],"answer":0,"explain":"PHP adds the two integer values: 5 + 3 = 8."},
    {"id":8,"cat":"basics","diff":"easy","type":"multiple","q":"Which function returns the length of a string?","choices":["strlen()","length()","size()","count()"],"answer":0,"explain":"strlen() returns the number of characters in a string."},
    {"id":9,"cat":"basics","diff":"easy","type":"multiple","q":"Which data type does PHP NOT have?","choices":["char","string","integer","boolean"],"answer":0,"explain":"PHP doesn't have a separate char type. Single characters are just strings of length 1."},
    {"id":10,"cat":"basics","diff":"easy","type":"code","q":"What does this output?\n\n&lt;?php\necho gettype(42);\n?&gt;","choices":["integer","number","int","42"],"answer":0,"explain":"gettype() returns the type name as a string. For 42 it returns 'integer'."},
    {"id":11,"cat":"basics","diff":"easy","type":"multiple","q":"Which operator is used for string concatenation in PHP?","choices":[".","+","&",".."],"answer":0,"explain":"The dot (.) operator concatenates strings in PHP."},
    {"id":12,"cat":"basics","diff":"easy","type":"code","q":"What does this output?\n\n&lt;?php\n$name = \"World\";\necho \"Hello \" . $name;\n?&gt;","choices":["Hello World","Hello $name","HelloWorld","Error"],"answer":0,"explain":"The dot operator concatenates 'Hello ' and the value of $name."},
    {"id":13,"cat":"basics","diff":"easy","type":"multiple","q":"Which superglobal is used to collect form data sent via POST?","choices":["$_POST","$_GET","$_REQUEST","$_FORM"],"answer":0,"explain":"$_POST is a superglobal array that collects data sent via HTTP POST method."},
    {"id":14,"cat":"basics","diff":"easy","type":"multiple","q":"What does PHP run on?","choices":["Server","Client browser","Both equally","Neither"],"answer":0,"explain":"PHP is a server-side scripting language. It runs on the web server."},
    {"id":15,"cat":"basics","diff":"easy","type":"code","q":"What does this code output?\n\n&lt;?php\n$arr = [1, 2, 3];\necho count($arr);\n?&gt;","choices":["3","[1,2,3]","Array","1"],"answer":0,"explain":"count() returns the number of elements in an array. This array has 3 elements."},
    {"id":16,"cat":"arrays","diff":"medium","type":"code","q":"What is the output?\n\n&lt;?php\n$a = [1, 2, 3, 4, 5];\necho array_sum($a);\n?&gt;","choices":["15","12345","5","Error"],"answer":0,"explain":"array_sum() adds up all values in the array: 1+2+3+4+5 = 15."},
    {"id":17,"cat":"strings","diff":"medium","type":"code","q":"What does this output?\n\n&lt;?php\necho str_replace(\"World\", \"PHP\", \"Hello World\");\n?&gt;","choices":["Hello PHP","Hello World","PHP","Hello"],"answer":0,"explain":"str_replace() replaces 'World' with 'PHP' in the string."},
    {"id":18,"cat":"arrays","diff":"medium","type":"code","q":"What is the output?\n\n&lt;?php\n$fruits = [\"apple\", \"banana\", \"cherry\"];\necho $fruits[1];\n?&gt;","choices":["banana","apple","cherry","1"],"answer":0,"explain":"PHP arrays are 0-indexed. Index 1 is 'banana'."},
    {"id":19,"cat":"control","diff":"medium","type":"code","q":"What does this output?\n\n&lt;?php\nfor ($i = 0; $i &lt; 3; $i++) {\n  echo $i;\n}\n?&gt;","choices":["012","123","0123","321"],"answer":0,"explain":"The loop starts at 0, runs while $i < 3, outputting 0, 1, 2."},
    {"id":20,"cat":"functions","diff":"medium","type":"code","q":"What is the output?\n\n&lt;?php\nfunction add($a, $b) {\n  return $a + $b;\n}\necho add(3, 7);\n?&gt;","choices":["10","37","add(3,7)","Error"],"answer":0,"explain":"The function returns 3 + 7 = 10, which is then echoed."},
    {"id":21,"cat":"oop","diff":"hard","type":"code","q":"What is the output?\n\n&lt;?php\nclass A {\n  public static function who() { echo __CLASS__; }\n  public static function test() { static::who(); }\n}\nclass B extends A {\n  public static function who() { echo __CLASS__; }\n}\nB::test();\n?&gt;","choices":["B","A","AB","Error"],"answer":0,"explain":"static:: uses late static binding, so B::test() resolves who() on class B."},
    {"id":22,"cat":"arrays","diff":"hard","type":"code","q":"What is the output?\n\n&lt;?php\n$values = array_filter([1, 2, 3, 4], fn($n) =&gt; $n % 2 === 0);\n$doubled = array_map(fn($n) =&gt; $n * 2, $values);\necho json_encode($doubled);\n?&gt;","choices":["{\"1\":4,\"3\":8}","[4,8]","{\"0\":4,\"1\":8}","[2,4,6,8]"],"answer":0,"explain":"array_filter preserves keys. With one input array, array_map also preserves them, so json_encode outputs an object for the non-sequential keys."},
    {"id":23,"cat":"modern php","diff":"hard","type":"code","q":"What is the output?\n\n&lt;?php\n$value = '1';\necho match ($value) {\n  1 =&gt; 'integer',\n  '1' =&gt; 'string',\n  default =&gt; 'other'\n};\n?&gt;","choices":["string","integer","other","Error"],"answer":0,"explain":"PHP match expressions use strict comparison, so the string '1' matches only the string arm."},
    {"id":24,"cat":"traits","diff":"hard","type":"code","q":"What is the output?\n\n&lt;?php\ntrait A { public function talk() { return 'A'; } }\ntrait B { public function talk() { return 'B'; } }\nclass Speaker {\n  use A, B {\n    A::talk insteadof B;\n    B::talk as bTalk;\n  }\n}\n$s = new Speaker();\necho $s-&gt;talk() . $s-&gt;bTalk();\n?&gt;","choices":["AB","AA","BB","Fatal error"],"answer":0,"explain":"insteadof selects A::talk as talk(), while the alias bTalk still exposes B::talk."},
    {"id":25,"cat":"references","diff":"hard","type":"code","q":"What is the output?\n\n&lt;?php\n$items = [1, 2, 3];\nforeach ($items as &amp;$item) {}\nforeach ($items as $item) {}\necho implode(',', $items);\n?&gt;","choices":["1,2,2","1,2,3","1,1,1","Fatal error"],"answer":0,"explain":"The reference from the first loop remains attached to the final element. The second loop repeatedly writes through it, leaving the last value as 2."}
];

// ===== 04. RUNTIME GAME STATE =====
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
var ADMIN_LOGIN_USER='admin';
var ADMIN_LOGIN_PASS='admin123';
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
var playerProgression=getDefaultProgression();
var progressionEventQueue=Promise.resolve();
var sfxVolume=parseFloat(localStorage.getItem('sfxVolume')||'1');
if(isNaN(sfxVolume))sfxVolume=1;
var questionEdits={};

// ===== 05. PLAYER PERSISTENCE AND STATE SYNCHRONIZATION =====
function getDefaultState(){
    return {
        score:0,level:1,streak:0,wrongStreak:0,bestStreak:0,totalCorrect:0,totalAnswered:0,
        answeredIds:[],hp:100,maxHp:100,floor:1,gold:0,potions:2,
        monstersDefeated:0,bossesDefeated:0,buffDef:0,buffGold:0,buffCrit:0,buffTime:0,
        specialCharge:0,specialShield:0
    };
}

function getDefaultProgression(){
    return {
        activeTitle:'PHP Novice',
        unlockedAchievementIds:[],
        unlockedAt:{},
        stats:{correctAnswers:0,hardAnswers:0,monstersDefeated:0,bossesDefeated:0,bestStreak:0,highestFloor:1,highestLevel:1,highestScore:0}
    };
}

function getCachedPlayerState(username){
    if(!username)return null;
    try{
        var cached=JSON.parse(localStorage.getItem(PLAYER_STATE_CACHE_PREFIX+username)||'null');
        return cached&&cached.state&&typeof cached.state==='object'?cached:null;
    }catch(err){return null;}
}

function setCachedPlayerState(username,state,savedAt,confirmedAt){
    if(!username)return;
    try{
        localStorage.setItem(PLAYER_STATE_CACHE_PREFIX+username,JSON.stringify({
            state:state,
            savedAt:savedAt||Date.now(),
            confirmedAt:confirmedAt||0
        }));
    }catch(err){console.warn('Could not cache player state:',err);}
}

function archiveAndResetActivePlayerProgress(){
    var username=localStorage.getItem(ACTIVE_PLAYER_SESSION_KEY)||'';
    document.body.setAttribute('data-progress-reset-target',username||'none');
    if(!username){document.body.setAttribute('data-progress-reset-status','skipped');return Promise.resolve({status:'skipped'});}

    localStorage.removeItem(ACTIVE_PLAYER_SESSION_KEY);
    document.body.setAttribute('data-progress-reset-status','pending');
    var cached=getCachedPlayerState(username);
    var snapshot=cached&&cached.state?cached.state:null;
    var snapshotSavedAt=cached&&cached.savedAt?cached.savedAt:0;
    var fresh=getDefaultState();
    var resetAt=Date.now();
    setCachedPlayerState(username,fresh,resetAt,0);

    return fetch('/api/players/'+encodeURIComponent(username)+'/progress/archive-reset',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({state:snapshot,savedAt:snapshotSavedAt}),
        keepalive:true
    })
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'){
            var confirmedAt=Date.parse(data.updatedAt||'')||resetAt;
            setCachedPlayerState(username,data.state||fresh,confirmedAt,confirmedAt);
        }
        document.body.setAttribute('data-progress-reset-status',data&&data.status?data.status:'unknown');
        return data;
    })
    .catch(function(err){
        console.error('Reload progress archive/reset failed:',err);
        if(cached){
            setCachedPlayerState(username,cached.state,cached.savedAt,cached.confirmedAt);
        }else{
            localStorage.removeItem(PLAYER_STATE_CACHE_PREFIX+username);
        }
        document.body.setAttribute('data-progress-reset-status','error');
        return {status:'error'};
    });
}

function persistPlayerState(username,state,savedAt){
    return fetch('/api/players/'+encodeURIComponent(username),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({state:state,savedAt:savedAt}),
        keepalive:true
    })
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'){
            var current=getCachedPlayerState(username);
            if(current&&current.savedAt===savedAt){
                setCachedPlayerState(username,current.state,current.savedAt,current.savedAt);
            }
        }
        return data;
    });
}

function mergeStoredState(defaults,stored){
    var s=stored||{};
    defaults.score=Number(s.score)||0;
    defaults.level=getLevelFromScore(defaults.score);
    defaults.streak=Number(s.streak)||0;
    defaults.wrongStreak=Number(s.wrongStreak)||0;
    defaults.bestStreak=Number(s.bestStreak)||0;
    defaults.totalCorrect=Number(s.totalCorrect)||0;
    defaults.totalAnswered=Number(s.totalAnswered)||0;
    defaults.answeredIds=Array.isArray(s.answeredIds)?s.answeredIds.slice():[];
    var storedMaxHp=Math.max(1,Number(s.maxHp)||getCharacterMaxHp(defaults.level));
    var storedHp=Number(s.hp);
    if(!Number.isFinite(storedHp))storedHp=storedMaxHp;
    var missingHp=Math.max(0,storedMaxHp-Math.max(0,Math.min(storedMaxHp,storedHp)));
    defaults.maxHp=getCharacterMaxHp(defaults.level);
    defaults.hp=Math.max(0,defaults.maxHp-missingHp);
    defaults.floor=Math.max(1,Number(s.floor)||1);
    defaults.gold=Number(s.gold)||0;
    defaults.potions=Number(s.potions)||2;
    defaults.monstersDefeated=Number(s.monstersDefeated)||0;
    defaults.bossesDefeated=Number(s.bossesDefeated)||0;
    defaults.buffDef=Number(s.buffDef)||0;
    defaults.buffGold=Number(s.buffGold)||0;
    defaults.buffCrit=Number(s.buffCrit)||0;
    defaults.buffTime=Number(s.buffTime)||0;
    defaults.specialCharge=Math.max(0,Math.min(100,Number(s.specialCharge)||0));
    defaults.specialShield=Math.max(0,Math.min(1,Number(s.specialShield)||0));
    return defaults;
}

function loadState(username){
    // Fetches this player's save from MongoDB (via the API). Falls back to
    // fresh defaults if the player has no save yet, or the server is unreachable.
    var d=getDefaultState();
    if(!username){
        applyStateObject(d);
        return Promise.resolve(d);
    }
    var cached=null;
    return reloadProgressResetPromise
    .then(function(){
        cached=getCachedPlayerState(username);
        return fetch('/api/players/'+encodeURIComponent(username));
    })
    .then(function(res){return res.json();})
    .then(function(data){
        var stored=null;
        var serverState=data&&data.status==='ok'&&data.state&&typeof data.state==='object'?data.state:null;
        var serverTime=serverState?(Date.parse(data.updatedAt||'')||0):0;
        if(cached&&cached.savedAt>cached.confirmedAt&&(!serverState||cached.savedAt>serverTime)){
            // A reload may interrupt the final network response. Prefer the
            // newest local state once, then synchronize it back to MongoDB.
            stored=cached.state;
            persistPlayerState(username,cached.state,cached.savedAt)
                .catch(function(err){console.error('Cached state sync failed:',err);});
        }else if(serverState){
            stored=serverState;
            if(!serverTime)serverTime=Date.now();
            setCachedPlayerState(username,stored,serverTime,serverTime);
        }else if(cached){
            stored=cached.state;
        }
        if(stored)mergeStoredState(d,stored);
        applyStateObject(d);
        return d;
    })
    .catch(function(err){
        console.error('loadState failed, using local cache or defaults:',err);
        if(cached)mergeStoredState(d,cached.state);
        applyStateObject(d);
        return d;
    });
}

function applyStateObject(d){
    score=d.score;level=d.level;streak=d.streak;wrongStreak=d.wrongStreak;bestStreak=d.bestStreak;totalCorrect=d.totalCorrect;totalAnswered=d.totalAnswered;
    answeredIds=d.answeredIds;hp=d.hp;maxHp=d.maxHp;floor_num=d.floor;gold=d.gold;potions=d.potions;
    monstersDefeated=d.monstersDefeated;bossesDefeated=d.bossesDefeated;buffDef=d.buffDef;buffGold=d.buffGold;buffCrit=d.buffCrit;buffTime=d.buffTime;
    specialCharge=d.specialCharge;specialShield=d.specialShield;
}

function saveState(){
    var data={
        score:score,level:level,streak:streak,wrongStreak:wrongStreak,bestStreak:bestStreak,totalCorrect:totalCorrect,totalAnswered:totalAnswered,
        answeredIds:answeredIds.slice(),hp:hp,maxHp:maxHp,floor:floor_num,gold:gold,potions:potions,
        monstersDefeated:monstersDefeated,bossesDefeated:bossesDefeated,buffDef:buffDef,buffGold:buffGold,buffCrit:buffCrit,buffTime:buffTime,
        specialCharge:specialCharge,specialShield:specialShield
    };
    // Cache immediately so a refresh cannot lose the latest score/level, then
    // use a keepalive request so MongoDB persistence survives page unload.
    if(playerUsername){
        var savedAt=Date.now();
        var previous=getCachedPlayerState(playerUsername);
        setCachedPlayerState(playerUsername,data,savedAt,previous?previous.confirmedAt:0);
        persistPlayerState(playerUsername,data,savedAt)
            .catch(function(err){console.error('saveState failed:',err);});
    }
}

function resetState(){
    var d=getDefaultState();
    applyStateObject(d);
    applySelectedCharacterStats();
    saveState();
}

// ===== 06. DATABASE API REQUESTS =====
// Loads questions and sends battle, shop, player, and admin changes to Express.
function loadQuestionsFromServer(){
    return fetch('/api/questions')
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'&&Array.isArray(data.questions)&&data.questions.length){
            QUESTIONS=data.questions;
        }else{
            console.warn('No questions returned by server, using offline fallback bank.');
            QUESTIONS=QUESTIONS_FALLBACK;
        }
        return QUESTIONS;
    })
    .catch(function(err){
        console.error('Failed to load questions from server, using offline fallback bank:',err);
        QUESTIONS=QUESTIONS_FALLBACK;
        return QUESTIONS;
    });
}

function getProgressionMetrics(){
    return {
        totalCorrect:totalCorrect,
        monstersDefeated:monstersDefeated,
        bossesDefeated:bossesDefeated,
        bestStreak:bestStreak,
        floor:floor_num,
        level:level,
        score:score
    };
}

function loadPlayerProgression(){
    if(!playerUsername){
        playerProgression=getDefaultProgression();
        updatePlayerTitleUI();
        return Promise.resolve({status:'skipped'});
    }
    return fetch('/api/players/'+encodeURIComponent(playerUsername)+'/progression')
    .then(function(res){return res.json().then(function(data){if(!res.ok)throw new Error(data.message||'Could not load achievements');return data;});})
    .then(function(data){
        applyProgressionPayload(data,false);
        return data;
    })
    .catch(function(err){
        console.error('loadPlayerProgression failed:',err);
        updatePlayerTitleUI();
        renderAccountAchievements('Achievements are temporarily unavailable.');
        return {status:'error'};
    });
}

function apiProgressionEvent(event,metrics,showUnlocks){
    if(!playerUsername)return Promise.resolve({status:'skipped'});
    progressionEventQueue=progressionEventQueue
    .catch(function(){return null;})
    .then(function(){
        return fetch('/api/players/'+encodeURIComponent(playerUsername)+'/progression/event',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({event:event,metrics:metrics||getProgressionMetrics()})
        });
    })
    .then(function(res){return res.json().then(function(data){if(!res.ok)throw new Error(data.message||'Could not update achievements');return data;});})
    .then(function(data){
        applyProgressionPayload(data,showUnlocks!==false);
        return data;
    })
    .catch(function(err){
        console.error('apiProgressionEvent failed:',err);
        return {status:'error'};
    });
    return progressionEventQueue;
}

function getQuestionsWithEdits(){
    // The server already merges the base question bank with admin edits
    // (see /api/questions in server/server.js), so this is just the cache.
    return QUESTIONS;
}

function shuffle(arr){
    for(var i=arr.length-1;i>0;i--){
        var j=Math.floor(Math.random()*(i+1));
        var t=arr[i];arr[i]=arr[j];arr[j]=t;
    }
    return arr;
}

function shuffleQuestion(q){
    var correctText=q.choices[q.answer];
    var choices=shuffle(q.choices.slice());
    var answer=choices.indexOf(correctText);
    return {id:q.id,cat:q.cat,diff:q.diff,type:q.type,q:q.q,choices:choices,answer:answer,explain:q.explain};
}

function apiGetQuestion(isBoss){
    var difficulty=isBoss?'hard':(['easy','easy','easy','medium','medium'][Math.floor(Math.random()*5)]);
    var questions=getQuestionsWithEdits();
    var available=questions.filter(function(q){return q.diff===difficulty && answeredIds.indexOf(q.id)===-1;});
    if(available.length===0){
        answeredIds=answeredIds.filter(function(id){
            var found=questions.find(function(q){return q.id===id;});
            return !(found && found.diff===difficulty);
        });
        available=questions.filter(function(q){return q.diff===difficulty;});
    }
    if(available.length===0){
        return Promise.resolve({status:'error',message:'No '+difficulty+' questions are available.'});
    }
    var q=available[Math.floor(Math.random()*available.length)];
    var result=shuffleQuestion(q);
    saveState();
    return Promise.resolve({status:'ok',question:result,buffs:{def:buffDef,gold:buffGold,crit:buffCrit,time:buffTime}});
}

function apiAnswer(payload){
    var qid=parseInt(payload.qid,10)||0;
    var selected=parseInt(payload.selected,10)||0;
    var correctIdx=parseInt(payload.correct,10)||0;
    var isCorrect=(selected===correctIdx);
    totalAnswered++;
    answeredIds.push(qid);
    var parsedMonsterDmg=parseInt(payload.monster_dmg,10);
    var monsterDmg=isNaN(parsedMonsterDmg)?10:Math.max(0,parsedMonsterDmg);
    if(buffDef>0)buffDef--;
    if(buffGold>0)buffGold--;
    if(buffCrit>0)buffCrit--;
    if(buffTime>0)buffTime--;

    if(isCorrect){
        totalCorrect++;
        streak++;
        wrongStreak=0;
        if(streak>bestStreak)bestStreak=streak;
        var diff=payload.diff||'easy';
        var base=diff==='hard'?50:(diff==='medium'?25:10);
        var streakBonus=(diff==='easy')?(5*streak):(Math.min(streak,10)*2);
        var points=base+streakBonus;
        score+=points;
        var goldEarned=diff==='hard'?15:(diff==='medium'?8:3);
        var goldMult=parseFloat(payload.gold_mult||1);
        goldEarned=Math.floor(goldEarned*goldMult);
        gold+=goldEarned;
        var abilityHeal=parseInt(payload.ability_heal,10)||0;
        if(abilityHeal>0){hp=Math.min(maxHp,hp+abilityHeal);}
        var newLevel=getLevelFromScore(score);
        var leveledUp=newLevel>level;
        if(leveledUp){maxHp=getCharacterMaxHp(newLevel);}
        level=newLevel;
        saveState();
        return Promise.resolve({status:'correct',points:points,gold:goldEarned,streak:streak,score:score,level:level,levelUp:leveledUp,total_correct:totalCorrect,total_answered:totalAnswered,best_streak:bestStreak,hp:hp,max_hp:maxHp,total_gold:gold,potions:potions});
    }

    streak=0;
    wrongStreak++;
    var extraDmg=(wrongStreak>1)?((wrongStreak-1)*2):0;
    var totalDmg=monsterDmg+extraDmg;
    hp=Math.max(0,hp-totalDmg);
    saveState();
    return Promise.resolve({status:'wrong',damage:totalDmg,streak:0,score:score,level:level,total_correct:totalCorrect,total_answered:totalAnswered,best_streak:bestStreak,hp:hp,max_hp:maxHp,total_gold:gold,potions:potions,dead:hp<=0});
}

function apiUsePotion(){
    if(potions>0){
        potions--;hp=Math.min(maxHp,hp+30);
        saveState();
        return Promise.resolve({status:'ok',hp:hp,max_hp:maxHp,potions:potions});
    }
    return Promise.resolve({status:'no_potions'});
}

function apiMonsterDefeated(){
    monstersDefeated++;gold+=5;saveState();
    var result={status:'ok',monsters_defeated:monstersDefeated,gold:gold};
    return apiProgressionEvent('monster_defeated',getProgressionMetrics(),true).then(function(){return result;});
}

function apiBossDefeated(){
    bossesDefeated++;floor_num++;gold+=25;potions+=1;hp=maxHp;saveState();
    var result={status:'ok',bosses_defeated:bossesDefeated,floor:floor_num,gold:gold,potions:potions,hp:hp,max_hp:maxHp};
    return apiProgressionEvent('boss_defeated',getProgressionMetrics(),true).then(function(){return result;});
}

function apiBuyPotion(){
    if(hp>=maxHp)return Promise.resolve({status:'full_hp',hp:hp,max_hp:maxHp,gold:gold});
    if(gold>=15){
        gold-=15;
        var healed=Math.min(30,maxHp-hp);
        hp+=healed;
        saveState();
        return Promise.resolve({status:'ok',gold:gold,hp:hp,max_hp:maxHp,healed:healed});
    }
    return Promise.resolve({status:'no_gold'});
}

function apiBuyBuff(action){
    if(action==='buy_def_potion'){
        if(gold>=20){gold-=20;buffDef+=3;saveState();return Promise.resolve({status:'ok',gold:gold,buff_def:buffDef});}
        return Promise.resolve({status:'no_gold'});
    }
    if(action==='buy_gold_potion'){
        if(gold>=25){gold-=25;buffGold+=3;saveState();return Promise.resolve({status:'ok',gold:gold,buff_gold:buffGold});}
        return Promise.resolve({status:'no_gold'});
    }
    if(action==='buy_crit_potion'){
        if(gold>=30){gold-=30;buffCrit+=3;saveState();return Promise.resolve({status:'ok',gold:gold,buff_crit:buffCrit});}
        return Promise.resolve({status:'no_gold'});
    }
    if(action==='buy_time_potion'){
        if(gold>=20){gold-=20;buffTime+=3;saveState();return Promise.resolve({status:'ok',gold:gold,buff_time:buffTime});}
        return Promise.resolve({status:'no_gold'});
    }
    return Promise.resolve({status:'no_gold'});
}

function apiReset(){
    if(playerUsername){
        return fetch('/api/players/'+encodeURIComponent(playerUsername)+'/reset',{method:'POST'})
        .then(function(res){return res.json();})
        .then(function(){
            resetState(); // also syncs local vars + fires a redundant-but-harmless save
            return {status:'reset'};
        })
        .catch(function(err){
            console.error('apiReset server call failed, resetting locally only:',err);
            resetState();
            return {status:'reset'};
        });
    }
    resetState();
    return Promise.resolve({status:'reset'});
}

function apiAdminListQuestions(){
    return fetch('/api/questions')
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'&&Array.isArray(data.questions)){QUESTIONS=data.questions;}
        return {status:'ok',questions:QUESTIONS};
    })
    .catch(function(err){
        console.error('apiAdminListQuestions failed:',err);
        return {status:'ok',questions:QUESTIONS};
    });
}

function apiAdminSaveQuestion(body){
    var id=parseInt(body.id,10)||0;
    var choices=[
        String(body.choice_0||'').trim(),
        String(body.choice_1||'').trim(),
        String(body.choice_2||'').trim(),
        String(body.choice_3||'').trim()
    ];
    var answer=parseInt(body.answer,10)||0;
    if(id<=0||choices.indexOf('')!==-1||answer<0||answer>3){
        return Promise.resolve({status:'error',message:'Invalid question data'});
    }
    return fetch('/api/admin/questions',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
    })
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'&&data.question){
            var idx=QUESTIONS.findIndex(function(q){return q.id===data.question.id;});
            if(idx>=0){QUESTIONS[idx]=data.question;}else{QUESTIONS.push(data.question);}
        }
        return data;
    })
    .catch(function(err){
        console.error('apiAdminSaveQuestion failed:',err);
        return {status:'error',message:'Network error saving question'};
    });
}

function apiAdminResetQuestions(){
    return fetch('/api/admin/questions/reset',{method:'POST'})
    .then(function(res){return res.json();})
    .then(function(data){
        return loadQuestionsFromServer().then(function(){return data;});
    })
    .catch(function(err){
        console.error('apiAdminResetQuestions failed:',err);
        return {status:'error'};
    });
}

function apiAdminListUsers(){
    return fetch('/api/admin/users')
    .then(function(res){return res.json();})
    .catch(function(err){
        console.error('apiAdminListUsers failed:',err);
        return {status:'error',players:[]};
    });
}

function apiAdminSaveUser(username,state){
    return fetch('/api/players/'+encodeURIComponent(username),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({state:state})
    })
    .then(function(res){return res.json();})
    .catch(function(err){
        console.error('apiAdminSaveUser failed:',err);
        return {status:'error'};
    });
}

function apiAdminDeleteUser(username){
    return fetch('/api/players/'+encodeURIComponent(username),{method:'DELETE'})
    .then(function(res){return res.json();})
    .catch(function(err){
        console.error('apiAdminDeleteUser failed:',err);
        return {status:'error'};
    });
}

// ===== 07. SCREEN NAVIGATION, FLOOR THEMES, AND DISPLAY PREFERENCES =====
function getBattleThemeForFloor(floor){
    var safeFloor=Math.max(1,Math.min(5,Number(floor)||1));
    return {
        1:'sunlit-valley',
        2:'crystal-cavern',
        3:'cyber-defense',
        4:'code-matrix',
        5:'inferno-core'
    }[safeFloor];
}

function applyBattleBackground(){
    var theme=getBattleThemeForFloor(floor_num);
    var themeNames={
        'sunlit-valley':'Sunlit valley',
        'crystal-cavern':'Crystal cavern',
        'cyber-defense':'Cybersecurity network',
        'code-matrix':'Living code matrix',
        'inferno-core':'Inferno core'
    };
    var scene=document.getElementById('battle-scene');
    var gameScreen=document.getElementById('game-screen');
    if(scene){
        scene.setAttribute('data-floor-theme',theme);
        scene.setAttribute('data-floor',String(floor_num));
        scene.setAttribute('aria-label',themeNames[theme]+' battlefield, Floor '+floor_num);
    }
    if(gameScreen)gameScreen.setAttribute('data-floor-theme',theme);
}

function syncUiFromState(){
    var scoreEl=document.getElementById('score');if(scoreEl)scoreEl.textContent=score;
    var goldEl=document.getElementById('gold-count');if(goldEl)goldEl.textContent=gold;
    var floorEl=document.getElementById('floor-num');if(floorEl)floorEl.textContent=floor_num;
    var floorTitle=document.getElementById('floor-title');if(floorTitle)floorTitle.textContent='FLOOR '+floor_num;
    applyBattleBackground();
    var streakEl=document.getElementById('streak');if(streakEl)streakEl.textContent=streak;
    var bestEl=document.getElementById('best-streak');if(bestEl)bestEl.textContent=bestStreak;
    var accEl=document.getElementById('accuracy');if(accEl)accEl.textContent=totalAnswered>0?Math.round(totalCorrect/totalAnswered*100)+'%':'0%';
    var monstersEl=document.getElementById('monsters-slain');if(monstersEl)monstersEl.textContent=monstersDefeated;
    var bossesEl=document.getElementById('bosses-beaten');if(bossesEl)bossesEl.textContent=bossesDefeated;
    var potionBtn=document.getElementById('potion-btn');if(potionBtn)potionBtn.textContent='POTION('+potions+')';
    var playerLvl=document.getElementById('player-level');if(playerLvl)playerLvl.textContent='LVL '+(playerUsername?level:1);
    updatePlayerHP();
    refreshShopGold();
    updateBuffIndicators();
    var accountOverlay=document.getElementById('account-info-overlay');
    if(accountOverlay&&accountOverlay.style.display!=='none')updateAccountInfo();
}

function setAccountInfoText(id,value){
    var element=document.getElementById(id);
    if(element)element.textContent=String(value);
}

function applyProgressionPayload(payload,showUnlocks){
    var defaults=getDefaultProgression();
    var incoming=payload&&payload.progression&&typeof payload.progression==='object'?payload.progression:{};
    playerProgression={
        activeTitle:incoming.activeTitle||defaults.activeTitle,
        unlockedAchievementIds:Array.isArray(incoming.unlockedAchievementIds)?incoming.unlockedAchievementIds.slice():[],
        unlockedAt:incoming.unlockedAt&&typeof incoming.unlockedAt==='object'?incoming.unlockedAt:{},
        stats:Object.assign({},defaults.stats,incoming.stats||{}),
        updatedAt:incoming.updatedAt||null
    };
    if(payload&&Array.isArray(payload.definitions))achievementDefinitions=payload.definitions.slice();
    updatePlayerTitleUI();
    renderAccountAchievements();
    if(showUnlocks&&payload&&Array.isArray(payload.newlyUnlocked)){
        payload.newlyUnlocked.forEach(function(achievement,index){
            setTimeout(function(){showAchievementUnlocked(achievement);},index*900);
        });
    }
}

function updatePlayerTitleUI(){
    var title=(playerProgression&&playerProgression.activeTitle)||'PHP Novice';
    setAccountInfoText('player-title',title.toUpperCase());
    setAccountInfoText('account-info-player-title',title.toUpperCase());
}

function renderAccountAchievements(message){
    var container=document.getElementById('account-achievement-list');
    var count=document.getElementById('account-achievement-count');
    if(!container)return;
    container.innerHTML='';
    var unlockedIds=playerProgression&&Array.isArray(playerProgression.unlockedAchievementIds)?playerProgression.unlockedAchievementIds:[];
    if(count)count.textContent=unlockedIds.length+' / '+achievementDefinitions.length+' UNLOCKED';
    if(message||!achievementDefinitions.length){
        var empty=document.createElement('div');
        empty.className='account-achievement-empty';
        empty.textContent=message||'Loading achievements from MongoDB...';
        container.appendChild(empty);
        return;
    }
    var stats=playerProgression&&playerProgression.stats?playerProgression.stats:{};
    achievementDefinitions.forEach(function(achievement){
        var unlocked=unlockedIds.indexOf(achievement.id)!==-1;
        var current=Math.max(0,Number(stats[achievement.metric])||0);
        var target=Math.max(1,Number(achievement.target)||1);
        var progress=Math.min(100,Math.round(current/target*100));
        var card=document.createElement('div');
        card.className='account-achievement-card '+(unlocked?'unlocked':'locked');

        var icon=document.createElement('div');icon.className='account-achievement-icon';icon.textContent=achievement.icon||'?';
        var name=document.createElement('div');name.className='account-achievement-name';name.textContent=achievement.name||'Achievement';
        var description=document.createElement('div');description.className='account-achievement-desc';description.textContent=achievement.description||'';
        var reward=document.createElement('div');reward.className='account-achievement-reward';
        reward.textContent=unlocked?'TITLE UNLOCKED: '+achievement.title:'PROGRESS: '+Math.min(current,target)+' / '+target;
        var progressTrack=document.createElement('div');progressTrack.className='account-achievement-progress';
        var progressFill=document.createElement('div');progressFill.className='account-achievement-progress-fill';progressFill.style.width=progress+'%';
        progressTrack.appendChild(progressFill);
        card.appendChild(icon);card.appendChild(name);card.appendChild(description);card.appendChild(reward);card.appendChild(progressTrack);
        container.appendChild(card);
    });
}

function showAchievementUnlocked(achievement){
    if(!achievement)return;
    document.querySelectorAll('.achievement-unlock-popup').forEach(function(element){element.remove();});
    var popup=document.createElement('div');
    popup.className='achievement-unlock-popup';
    var label=document.createElement('div');label.className='achievement-unlock-label';label.textContent='ACHIEVEMENT UNLOCKED';
    var name=document.createElement('div');name.className='achievement-unlock-name';name.textContent=achievement.name||'New Achievement';
    var title=document.createElement('div');title.className='achievement-unlock-title';title.textContent='NEW TITLE: '+(achievement.title||'PHP Novice');
    popup.appendChild(label);popup.appendChild(name);popup.appendChild(title);document.body.appendChild(popup);
    setTimeout(function(){popup.remove();},4300);
}

function updateAccountInfo(){
    var displayName=playerUsername||'PLAYER';
    var profileParts=[playerRole||'Student'];
    if((playerRole||'').toLowerCase()==='student'){
        if(playerYearLevel)profileParts.push('Year '+playerYearLevel);
        if(playerBlock)profileParts.push('Block '+playerBlock);
    }

    setAccountInfoText('account-info-name',displayName);
    setAccountInfoText('account-info-meta',profileParts.join('  |  '));
    setAccountInfoText('account-info-hero',selectedChar?selectedChar.name:'No hero selected');
    setAccountInfoText('account-info-level',level);
    setAccountInfoText('account-info-floor',floor_num);
    setAccountInfoText('account-info-hp',hp+'/'+maxHp);
    setAccountInfoText('account-info-score',score);
    setAccountInfoText('account-info-gold',gold);
    setAccountInfoText('account-info-potions',potions);
    setAccountInfoText('account-info-monsters',monstersDefeated);
    setAccountInfoText('account-info-bosses',bossesDefeated);
    setAccountInfoText('account-info-ability',selectedChar&&selectedChar.abilityName?
        selectedChar.abilityName+' — '+selectedChar.abilityDesc:
        'Choose a hero to see its special ability.');
    updatePlayerTitleUI();
    renderAccountAchievements();

    var avatar=document.getElementById('account-info-avatar');
    if(avatar){
        var avatarCtx=avatar.getContext('2d');
        avatarCtx.clearRect(0,0,avatar.width,avatar.height);
        avatarCtx.imageSmoothingEnabled=false;
        if(selectedChar)selectedChar.sprite.call(selectedChar,avatarCtx,16,10,6,0);
    }
}

function openAccountInfo(){
    if(!playerUsername){showToast('Start or log in to a player account first.','error');return;}
    updateAccountInfo();
    var overlay=document.getElementById('account-info-overlay');
    var trigger=document.getElementById('account-info-trigger');
    if(overlay)overlay.style.display='block';
    if(trigger)trigger.setAttribute('aria-expanded','true');
}

function closeAccountInfo(){
    var overlay=document.getElementById('account-info-overlay');
    var trigger=document.getElementById('account-info-trigger');
    if(overlay)overlay.style.display='none';
    if(trigger)trigger.setAttribute('aria-expanded','false');
}

function toggleAccountInfo(){
    var overlay=document.getElementById('account-info-overlay');
    if(overlay&&overlay.style.display!=='none')closeAccountInfo();
    else openAccountInfo();
}

function showLoginScreen(){
    var screen=document.getElementById('add-user-screen');
    if(!screen)return;
    screen.classList.add('login-mode');
    document.getElementById('add-user-title').textContent='PLAYER LOGIN';
    document.getElementById('add-user-subtitle').textContent='Log in to continue your saved dungeon progress.';
    document.getElementById('username-input').setAttribute('autocomplete','username');
    document.getElementById('password-input').setAttribute('autocomplete','current-password');
    document.getElementById('password-input').placeholder='Enter your password';
    var status=document.getElementById('add-user-status');if(status)status.textContent='';
    updateAddUserState();
    document.getElementById('username-input').focus();
}

function showAccountCreateScreen(){
    var screen=document.getElementById('add-user-screen');
    if(!screen)return;
    screen.classList.remove('login-mode');
    document.getElementById('add-user-title').textContent='ADD USER';
    document.getElementById('add-user-subtitle').textContent='Create an account to pick a hero, or log in to resume your dungeon.';
    document.getElementById('username-input').setAttribute('autocomplete','off');
    document.getElementById('password-input').setAttribute('autocomplete','new-password');
    document.getElementById('password-input').placeholder='At least 6 characters';
    var status=document.getElementById('add-user-status');if(status)status.textContent='';
    updateAddUserState();
}

function backFromAccountEntry(){
    var screen=document.getElementById('add-user-screen');
    if(screen&&screen.classList.contains('login-mode'))showAccountCreateScreen();
    else showScreen('title-screen');
}

function showScreen(id){
    document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
    document.getElementById(id).classList.add('active');
    if(id!=='game-screen')closeAccountInfo();
    if(id==='select-screen')renderCharacterSelect();
    if(id==='add-user-screen')showAccountCreateScreen();
    syncBackgroundMusic(id);
}

function focusHeroSelect(){
    goToHeroSelection();
}

function goToHeroSelection(){
    var status=document.getElementById('add-user-status');
    var nextBtn=document.getElementById('add-user-next-btn');
    var input=document.getElementById('username-input');
    if(!isAddUserValid()){
        if(status)status.textContent='Enter a username, a password with at least 6 characters, and your role details.';
        showToast('Complete Add User first','error');
        updateAddUserState();
        return;
    }
    var username=(input?input.value:'').trim().slice(0,24);
    if(status)status.textContent='Checking username...';
    if(nextBtn){
        nextBtn.disabled=true;
        nextBtn.textContent='CHECKING...';
    }

    apiCheckUsernameAvailability(username)
    .then(function(available){
        var currentUsername=(input?input.value:'').trim().slice(0,24);
        if(currentUsername!==username)return;
        if(!available){
            if(status)status.textContent='Username is already taken. Please log in or choose another username.';
            showToast('Username is already taken','error');
            if(input){
                input.focus();
                input.select();
            }
            return;
        }
        if(status)status.textContent='';
        showScreen('select-screen');
    })
    .catch(function(error){
        console.error('Username availability check failed:',error);
        if(status)status.textContent=(error&&error.message)||'Could not check the username. Please try again.';
        showToast('Could not check username','error');
    })
    .finally(function(){
        if(nextBtn){
            nextBtn.textContent='NEXT: PICK HERO';
            nextBtn.disabled=!isAddUserValid();
        }
    });
}

function isAddUserValid(){
    var name=(document.getElementById('username-input')?document.getElementById('username-input').value:'').trim();
    var password=document.getElementById('password-input')?document.getElementById('password-input').value:'';
    var role=(document.getElementById('role-select')?document.getElementById('role-select').value:'').trim();
    if(!name || password.length<6 || !role)return false;
    if(role==='Student'){
        var year=(document.getElementById('year-level-select')?document.getElementById('year-level-select').value:'').trim();
        var block=(document.getElementById('block-select')?document.getElementById('block-select').value:'').trim();
        return !!year && !!block;
    }
    return true;
}

function updateAddUserState(){
    var nextBtn=document.getElementById('add-user-next-btn');
    var loginBtn=document.getElementById('add-user-login-btn');
    var status=document.getElementById('add-user-status');
    var roleEl=document.getElementById('role-select');
    var extra=document.getElementById('student-extra');
    var yearEl=document.getElementById('year-level-select');
    var blockEl=document.getElementById('block-select');
    var nameEl=document.getElementById('username-input');
    var passwordEl=document.getElementById('password-input');
    var role=roleEl?roleEl.value:'';
    var accountScreen=document.getElementById('add-user-screen');
    var loginMode=!!(accountScreen&&accountScreen.classList.contains('login-mode'));

    if(extra)extra.style.display=(!loginMode&&role==='Student')?'grid':'none';
    if(role!=='Student'&&!loginMode){
        if(yearEl)yearEl.value='';
        if(blockEl)blockEl.value='';
    }

    var valid=isAddUserValid();
    if(nextBtn)nextBtn.disabled=!valid;
    if(loginBtn)loginBtn.disabled=!(nameEl&&nameEl.value.trim()&&passwordEl&&passwordEl.value.length>=6);
    if(status && valid)status.textContent='';
}

function showLearnTab(tab){
    document.querySelectorAll('.learn-card').forEach(function(c){c.classList.remove('active');});
    document.querySelectorAll('.learn-tab').forEach(function(t){t.classList.remove('active');});
    document.getElementById('learn-'+tab).classList.add('active');
    var tabs=document.querySelectorAll('.learn-tab');
    tabs.forEach(function(t){if(t.textContent.toLowerCase()===tab||t.textContent.toLowerCase().replace(' ','')===tab)t.classList.add('active');});
}

function applyLargeTextMode(){
    document.body.classList.toggle('large-text',largeTextMode);
}

function toggleLargeText(){
    largeTextMode=!largeTextMode;
    localStorage.setItem('largeTextMode',largeTextMode?'1':'0');
    applyLargeTextMode();
    showToast(largeTextMode?'Large text enabled':'Large text disabled','info');
}

function setSfxVolume(v){
    var num=Math.max(0,Math.min(1,parseFloat(v)||0));
    sfxVolume=num;
    localStorage.setItem('sfxVolume',String(num));
    if(audioMasterGain)audioMasterGain.gain.value=getPerceivedGain(sfxVolume);
    updateSfxVolumeUI();
}

function getPerceivedGain(value){
    return Math.pow(Math.max(0,Math.min(1,value)),1.6);
}

function updateSfxVolumeUI(){
    var slider=document.getElementById('sfx-volume-slider');
    var val=document.getElementById('sfx-volume-value');
    var settingsSlider=document.getElementById('settings-volume-slider');
    var settingsVal=document.getElementById('settings-volume-value');
    var pct=Math.round(sfxVolume*100);
    if(slider)slider.value=String(pct);
    if(val)val.textContent=pct+'%';
    if(settingsSlider)settingsSlider.value=String(pct);
    if(settingsVal)settingsVal.textContent=pct+'%';
}

function applyFontSizeChoice(choice){
    var size=(choice||'medium');
    if(size==='large')document.documentElement.style.fontSize='18px';
    else if(size==='small')document.documentElement.style.fontSize='13px';
    else document.documentElement.style.fontSize='16px';
}

function applyStoredFontSize(){
    var storedChoice=localStorage.getItem('rootFontSize');
    if(storedChoice){
        applyFontSizeChoice(storedChoice);
        return;
    }
    var storedScale=localStorage.getItem('rootFontScale');
    if(storedScale){
        var scale=parseInt(storedScale,10);
        var derived=scale>=110?'large':(scale<=90?'small':'medium');
        localStorage.setItem('rootFontSize',derived);
        applyFontSizeChoice(derived);
        return;
    }
    applyFontSizeChoice('large');
}

// ===== 08. MUSIC AND SOUND EFFECTS =====
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

// ===== 09. QUESTION TIMER =====
function startTimer(){
    stopTimer();
    var extraTime=(buffTime>0)?10:0;
    timeLeft=TIMER_MAX+extraTime;
    var totalTime=timeLeft;
    var fill=document.getElementById('timer-fill'),text=document.getElementById('timer-text');
    if(!fill||!text)return;
    fill.style.width='100%';fill.className='timer-bar-fill';
    text.textContent=timeLeft+'s';text.className='timer-text';
    timerInterval=setInterval(function(){
        timeLeft--;
        var pct=(timeLeft/totalTime)*100;
        fill.style.width=pct+'%';
        text.textContent=timeLeft+'s';
        fill.className='timer-bar-fill';
        text.className='timer-text';
        if(timeLeft<=10){fill.classList.add('danger');text.classList.add('danger');}
        else if(timeLeft<=15){fill.classList.add('warning');}
        if(timeLeft<=0){stopTimer();timerExpired();}
    },1000);
}

function stopTimer(){if(timerInterval){clearInterval(timerInterval);timerInterval=null;}}

function timerExpired(){
    if(answered)return;
    var wrongIdx=(currentQuestion.answer===0)?1:0;
    selectAnswer(wrongIdx);
    updateSpeech('TOO SLOW!');
}

// ===== 10. TITLE ANIMATION AND CHARACTER SELECTION =====
function createStars(){
    var c=document.getElementById('stars');
    for(var i=0;i<60;i++){var star=document.createElement('div');star.classList.add('star');
    star.style.width=(Math.random()>0.5?2:1)+'px';star.style.height=star.style.width;
    star.style.left=Math.random()*100+'%';star.style.top=Math.random()*100+'%';
    star.style.animationDelay=Math.random()*3+'s';c.appendChild(star);} 
}

function drawTitleAnim(){
    var canvas=document.getElementById('title-canvas'),ctx=canvas.getContext('2d'),p=5,t=Date.now();
    var px=function(x,y,w,h,color){drawPixelRect(ctx,x*p,y*p,w*p,h*p,color);};
    var flicker=Math.floor(t/140)%3;
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Warm pixel glows behind the two freestanding torches.
    ctx.globalAlpha=0.08;
    px(1,12,15,14,'#ff5a1f');px(56,12,15,14,'#ff5a1f');
    ctx.globalAlpha=1;

    // Dark opening and tall arched double door.
    px(27,3,18,2,'#0a0a12');
    px(24,5,24,4,'#08080f');
    px(22,9,28,22,'#06060c');
    px(30,5,12,2,'#28160f');
    px(27,7,18,4,'#321a10');
    px(26,11,20,19,'#3a1c10');
    px(27,11,8,19,'#442315');px(37,11,8,19,'#2d140c');
    px(35,7,2,23,'#1c0d08');
    px(30,6,1,3,'#57301e');px(41,7,1,3,'#24100a');
    px(29,12,1,17,'#5b2e19');px(42,12,1,17,'#1d0b07');

    // Rounded stone arch and side pillars.
    px(28,2,7,3,'#55596b');px(35,2,9,3,'#484c5e');
    px(25,4,5,4,'#4a4e61');px(43,4,5,4,'#5b5f70');
    px(23,7,4,5,'#3e4254');px(47,7,4,5,'#4d5163');
    px(21,11,5,5,'#515568');px(46,11,5,5,'#3d4153');
    px(21,16,5,5,'#414557');px(46,16,5,5,'#565a6c');
    px(21,21,5,5,'#565a6c');px(46,21,5,5,'#404456');
    px(21,26,5,5,'#424658');px(46,26,5,5,'#55596b');
    px(26,5,2,4,'#686c7d');px(44,5,2,4,'#343746');
    px(24,9,2,20,'#65697a');px(46,9,2,20,'#303440');
    px(29,3,5,1,'#747889');px(36,3,6,1,'#626678');
    px(22,12,3,1,'#65697a');px(47,17,3,1,'#6b6f80');
    px(22,22,3,1,'#676b7c');px(47,27,3,1,'#696d7e');

    // Stone threshold and stepped rubble at the base.
    px(23,29,26,3,'#4c5061');
    px(19,31,34,2,'#3d4151');
    px(15,33,42,2,'#292c39');
    px(24,29,8,1,'#696d7c');px(40,30,7,1,'#5e6272');
    px(16,31,5,2,'#4a4e5e');px(51,31,5,2,'#454958');
    px(11,32,5,2,'#343745');px(56,32,5,2,'#343745');

    // Skull plate and gold door handle.
    px(31,11,10,7,'#9da0a6');
    px(32,10,8,1,'#b9bbc0');
    px(30,12,1,4,'#70737b');px(41,12,1,4,'#70737b');
    px(32,13,2,2,'#20222a');px(38,13,2,2,'#20222a');
    px(34,17,4,2,'#83868e');
    px(35,16,2,1,'#3a3c44');
    px(42,19,3,3,'#ffbf27');px(43,19,2,2,'#ffd84c');

    // Hanging PHP banners, gold rods, and pointed tails.
    px(11,5,11,1,'#b27819');px(50,5,11,1,'#b27819');
    px(10,5,2,2,'#efb52b');px(21,5,2,2,'#efb52b');
    px(49,5,2,2,'#efb52b');px(60,5,2,2,'#efb52b');
    px(13,6,7,12,'#6b1429');px(52,6,7,12,'#6b1429');
    px(14,18,5,2,'#6b1429');px(53,18,5,2,'#6b1429');
    px(15,20,3,2,'#6b1429');px(54,20,3,2,'#6b1429');
    px(13,6,1,12,'#d69222');px(19,6,1,12,'#d69222');
    px(52,6,1,12,'#d69222');px(58,6,1,12,'#d69222');
    px(15,21,1,1,'#d69222');px(17,21,1,1,'#d69222');
    px(54,21,1,1,'#d69222');px(56,21,1,1,'#d69222');
    ctx.font='7px "Press Start 2P", monospace';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ffd66b';
    ctx.fillText('PHP',16.5*p,10.5*p);ctx.fillText('PHP',55.5*p,10.5*p);
    ctx.font='9px monospace';ctx.fillStyle='#e8425d';
    ctx.fillText('<>',16.5*p,15.2*p);ctx.fillText('<>',55.5*p,15.2*p);

    // Tall torch stands and discrete animated flames.
    px(6,22,3,9,'#3a2118');px(63,22,3,9,'#3a2118');
    px(7,22,1,8,'#70402a');px(64,22,1,8,'#70402a');
    px(4,21,7,2,'#20151a');px(61,21,7,2,'#20151a');
    px(5,22,5,1,'#8a4a29');px(62,22,5,1,'#8a4a29');
    px(4,31,7,2,'#1d151c');px(61,31,7,2,'#1d151c');
    px(5,30,5,1,'#70402a');px(62,30,5,1,'#70402a');
    px(4,17+(flicker===1?1:0),7,4,'#e9411e');
    px(5,14+(flicker===2?1:0),5,5,'#ff7b1f');
    px(6,12+(flicker===0?1:0),3,5,'#ffd43b');
    px(61,17+(flicker===2?1:0),7,4,'#e9411e');
    px(62,14+(flicker===0?1:0),5,5,'#ff7b1f');
    px(63,12+(flicker===1?1:0),3,5,'#ffd43b');
    if(flicker===0){px(3,15,1,1,'#ff8b25');px(69,14,1,1,'#ff8b25');}
    if(flicker===2){px(2,18,1,1,'#ff5a1f');px(68,17,1,1,'#ff5a1f');}

    // Grass tufts and loose stones finish the doorway silhouette.
    px(13,30,1,3,'#21751f');px(14,29,1,4,'#2f9b29');px(15,31,1,2,'#185a18');
    px(57,30,1,3,'#21751f');px(58,29,1,4,'#2f9b29');px(59,31,1,2,'#185a18');
    px(2,33,10,1,'#171824');px(60,33,10,1,'#171824');
    requestAnimationFrame(drawTitleAnim);
}

function renderCharacterSelect(){
    var grid=document.getElementById('characters-grid');grid.innerHTML='';
    updateEnterButtonState();
    CHARACTERS.forEach(function(char){
        var card=document.createElement('div');card.classList.add('char-card');
        if(selectedChar&&selectedChar.id===char.id)card.classList.add('selected');
        var canvas=document.createElement('canvas');canvas.width=120;canvas.height=120;canvas.classList.add('char-canvas');
        var ctx=canvas.getContext('2d');char.sprite.call(char,ctx,14,8,10,0);card.appendChild(canvas);
        var n=document.createElement('div');n.classList.add('char-name');n.textContent=char.name;card.appendChild(n);
        var d=document.createElement('div');d.classList.add('char-desc');d.textContent=char.desc;card.appendChild(d);
        var st=document.createElement('div');st.classList.add('char-stats');st.textContent=char.statLine;card.appendChild(st);
        var special=CHARACTER_SPECIALS[char.id];
        if(special){var sp=document.createElement('div');sp.classList.add('char-special-preview');sp.innerHTML='<strong>SPECIAL: '+special.name+'</strong>'+special.desc;card.appendChild(sp);}
        card.onclick=function(){selectedChar=char;document.querySelectorAll('.char-card').forEach(function(c){c.classList.remove('selected');});card.classList.add('selected');updateEnterButtonState();};
        grid.appendChild(card);
    });
}

function updateEnterButtonState(){
    var btn=document.getElementById('confirm-btn');
    var name=(document.getElementById('username-input')?document.getElementById('username-input').value:'').trim();
    var password=document.getElementById('password-input')?document.getElementById('password-input').value:'';
    if(btn)btn.disabled=!selectedChar||!name||password.length<6;
}

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

// ===== 11. ACCOUNT ACCESS AND GAME ENTRY =====
function apiCheckUsernameAvailability(username){
    return fetch('/api/players/'+encodeURIComponent(username))
    .then(function(res){
        return res.json().then(function(data){
            if(!res.ok)throw new Error((data&&data.message)||'Could not check the username. Please try again.');
            if(data&&data.status==='not_found')return true;
            if(data&&data.status==='ok')return false;
            throw new Error('Could not check the username. Please try again.');
        });
    });
}

function apiStartPlayer(username,password){
    return fetch('/api/players/'+encodeURIComponent(username)+'/start',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            password:password,
            role:playerRole,
            yearLevel:playerYearLevel,
            block:playerBlock,
            character:selectedChar?selectedChar.name:''
        })
    })
    .then(function(res){
        return res.json().then(function(data){
            if(!res.ok || !data || data.status!=='ok'){
                throw new Error((data&&data.message)||'Could not create player');
            }
            return data;
        });
    });
}

function apiLoginPlayer(username,password){
    return fetch('/api/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username:username,password:password})
    })
    .then(function(res){
        return res.json().then(function(data){
            if(!res.ok || !data || data.status!=='ok'){
                throw new Error((data&&data.message)||'Could not log in');
            }
            return data;
        });
    });
}

function launchDungeon(message){
    localStorage.setItem(ACTIVE_PLAYER_SESSION_KEY,playerUsername);
    document.body.setAttribute('data-active-player',playerUsername);
    if(hp<=0){
        hp=maxHp;
        streak=0;
        wrongStreak=0;
        saveState();
    }
    showScreen('game-screen');
    document.getElementById('player-name').textContent=playerUsername+' | '+playerRole;
    updatePlayerTitleUI();
    var hCtx=document.getElementById('header-avatar').getContext('2d');hCtx.clearRect(0,0,48,48);
    selectedChar.sprite.call(selectedChar,hCtx,4,2,5,0);
    if(selectedChar.ability==='addTime')TIMER_MAX=35;else TIMER_MAX=30;
    var progEl=document.getElementById('lex-progress-fill');if(progEl)progEl.style.width='5%';
    document.getElementById('player-level').textContent='LVL '+level;
    updatePlayerHP();
    startCharacterAnimation();encounterCount=0;spawnMonster();loadQuestion();
    if(message)showToast(message,'success');
}

function loginUser(){
    var nameField=document.getElementById('username-input');
    var passwordField=document.getElementById('password-input');
    var loginBtn=document.getElementById('add-user-login-btn');
    var status=document.getElementById('add-user-status');
    var username=(nameField?nameField.value:'').trim();
    var password=passwordField?passwordField.value:'';
    if(!username || password.length<6){
        if(status)status.textContent='Enter your username and password to log in.';
        return;
    }
    if(loginBtn){loginBtn.disabled=true;loginBtn.textContent='LOGGING IN...';}

    apiLoginPlayer(username,password)
    .then(function(data){
        var profile=(data.player&&data.player.profile)||{};
        playerUsername=data.player.username;
        playerRole=profile.role||'Student';
        playerYearLevel=profile.yearLevel||'';
        playerBlock=profile.block||'';
        selectedChar=CHARACTERS.find(function(char){return char.name===profile.character;})||null;

        var roleField=document.getElementById('role-select');
        var yearField=document.getElementById('year-level-select');
        var blockField=document.getElementById('block-select');
        if(roleField)roleField.value=playerRole;
        if(yearField)yearField.value=playerYearLevel;
        if(blockField)blockField.value=playerBlock;

        // Login only verifies the account. Every player continues through hero
        // selection before the dungeon, with their saved hero preselected.
        if(status)status.textContent='Account verified. Choose a hero to continue.';
        showScreen('select-screen');
        showToast('Login successful. Choose your hero.','success');
    })
    .catch(function(err){
        console.error('loginUser failed:',err);
        if(status)status.textContent=err.message||'Invalid username or password.';
        showToast('Login failed','error');
    })
    .finally(function(){
        if(loginBtn)loginBtn.textContent='LOG IN';
        updateAddUserState();
    });
}

function startGame(){
    var nameField=document.getElementById('username-input');
    var roleField=document.getElementById('role-select');
    var yearField=document.getElementById('year-level-select');
    var blockField=document.getElementById('block-select');
    var passwordField=document.getElementById('password-input');
    playerUsername=(nameField?nameField.value:'').trim().slice(0,24);
    playerRole=roleField?roleField.value:'Student';
    playerYearLevel=yearField?yearField.value.trim():'';
    playerBlock=blockField?blockField.value.trim():'';
    var password=passwordField?passwordField.value:'';
    if(!selectedChar||!playerUsername||password.length<6)return;
    playFloorStartSfx();
    var enterBtn=document.getElementById('confirm-btn');
    if(enterBtn){enterBtn.disabled=true;enterBtn.textContent='SAVING ACCOUNT...';}

    // The database record is created only after a hero has been selected. The
    // dungeon opens after MongoDB confirms the profile is ready.
    apiStartPlayer(playerUsername,password)
    .then(function(){return loadState(playerUsername);})
    .then(function(){applySelectedCharacterStats();saveState();})
    .then(function(){return loadPlayerProgression();})
    .then(function(){return apiProgressionEvent('progress_sync',getProgressionMetrics(),false);})
    .then(function(){
        if(passwordField)passwordField.value='';
        launchDungeon('Account saved to MongoDB');
    })
    .catch(function(err){
        console.error('startGame failed:',err);
        showToast(err.message||'Could not create account. Try again.','error');
    })
    .finally(function(){
        if(enterBtn){enterBtn.textContent='ENTER FLOOR 1';updateEnterButtonState();}
    });
}

// ===== 12. BATTLE, QUESTIONNAIRE, AND PROGRESSION =====
function startCharacterAnimation(){
    if(characterAnimId)cancelAnimationFrame(characterAnimId);
    function animate(){animFrame++;var canvas=document.getElementById('game-character');if(!canvas)return;
    var ctx=canvas.getContext('2d');ctx.clearRect(0,0,96,96);
    selectedChar.sprite.call(selectedChar,ctx,6,3,8,Math.floor(animFrame/30));
    characterAnimId=requestAnimationFrame(animate);}animate();
}

function startMonsterAnimation(){
    if(monsterAnimId)cancelAnimationFrame(monsterAnimId);var mFrame=0;
    function animate(){mFrame++;var canvas=document.getElementById('monster-canvas');if(!canvas)return;
    var ctx=canvas.getContext('2d');ctx.clearRect(0,0,160,160);
    if(currentMonster)currentMonster.draw(ctx,20,10,14,Math.floor(mFrame/20));
    monsterAnimId=requestAnimationFrame(animate);}animate();
}

function spawnMonster(){
    encounterCount++;
    if(encounterCount>3){spawnBoss();return;}
    isBossFight=false;bossAttackCount=0;
    var mapFloor=Math.min(floor_num,Object.keys(DUNGEON_MAP).length);
    var monsterIds=DUNGEON_MAP[mapFloor]||DUNGEON_MAP[1];
    var monsterId=monsterIds[encounterCount-1]||monsterIds[0];
    currentMonster=MONSTERS.find(function(m){return m.id===monsterId;})||MONSTERS[0];
    var battleStats=getMonsterBattleStats(floor_num,encounterCount,false);
    monsterHp=battleStats.hp;monsterMaxHp=monsterHp;
    monsterAttack=battleStats.attack;monsterDefense=battleStats.defense;
    updateMonsterUI();startMonsterAnimation();
    document.getElementById('encounter-label').textContent='ENCOUNTER '+encounterCount+'/3';
    document.getElementById('battle-banner').textContent='BATTLE! Answer correctly to attack!';
    document.getElementById('battle-banner').style.borderColor='var(--accent)';
    var progEl=document.getElementById('lex-progress-fill');
    if(progEl)progEl.style.width=Math.round(((encounterCount-1)/3)*100)+'%';
    updateDiffDisplay();
}

function spawnBoss(){
    isBossFight=true;bossAttackCount=0;var bossIdx=Math.min(floor_num-1,BOSSES.length-1);
    currentMonster=BOSSES[bossIdx];
    var battleStats=getMonsterBattleStats(floor_num,1,true);
    monsterHp=battleStats.hp;monsterMaxHp=monsterHp;
    monsterAttack=battleStats.attack;monsterDefense=battleStats.defense;
    updateMonsterUI();startMonsterAnimation();
    document.getElementById('encounter-label').textContent='\u2620 BOSS FIGHT \u2620';
    document.getElementById('battle-banner').textContent='\u2620 BOSS: '+currentMonster.name+' \u2620';
    document.getElementById('battle-banner').style.borderColor='var(--gold)';
    var progEl2=document.getElementById('lex-progress-fill');
    if(progEl2)progEl2.style.width='90%';
    updateDiffDisplay();
}

function updateMonsterUI(){
    document.getElementById('monster-name').textContent=(isBossFight?'\u2620 ':'')+currentMonster.name;
    document.getElementById('monster-desc').textContent=currentMonster.desc;
    var pct=Math.max(0,monsterHp/monsterMaxHp*100);
    document.getElementById('monster-hp-fill').style.width=pct+'%';
    document.getElementById('monster-hp-text').textContent=monsterHp+'/'+monsterMaxHp;
    var statType=document.getElementById('monster-stat-type');if(statType)statType.textContent=isBossFight?'BOSS':'NORMAL';
    var statHp=document.getElementById('monster-stat-hp');if(statHp)statHp.textContent=monsterHp+' / '+monsterMaxHp;
    var statAtk=document.getElementById('monster-stat-atk');if(statAtk)statAtk.textContent=monsterAttack;
    var statDef=document.getElementById('monster-stat-def');if(statDef)statDef.textContent=monsterDefense;
    var statNote=document.getElementById('monster-stat-note');if(statNote)statNote.textContent=monsterDefense>0?'DEF blocks '+monsterDefense+' damage from every hit.':'No armor: attacks deal full damage.';
    var bossSpecial=getCurrentBossSpecial();
    var bossPanel=document.getElementById('boss-special-panel');
    if(bossPanel){
        bossPanel.style.display=bossSpecial?'block':'none';
        if(bossSpecial){
            var bossName=document.getElementById('boss-special-name');if(bossName)bossName.textContent=bossSpecial.name;
            var bossDesc=document.getElementById('boss-special-desc');if(bossDesc)bossDesc.textContent=bossSpecial.desc;
            var attacksUntil=bossSpecial.every-(bossAttackCount%bossSpecial.every);
            var bossReady=document.getElementById('boss-special-ready');if(bossReady)bossReady.textContent='READY IN '+attacksUntil+' ATTACK'+(attacksUntil===1?'':'S');
        }
    }
    document.getElementById('floor-title').textContent='FLOOR '+floor_num;
    applyBattleBackground();
}

function updateCharacterStatsUI(){
    var levelStat=document.getElementById('character-stat-level');if(levelStat)levelStat.textContent=level;
    var hpStat=document.getElementById('character-stat-hp');if(hpStat)hpStat.textContent=hp+' / '+maxHp;
    var displayedAttack=getCharacterBaseAttack('easy');
    displayedAttack=Math.floor(displayedAttack*getCharacterAttackMultiplier());
    var atkStat=document.getElementById('character-stat-atk');if(atkStat)atkStat.textContent=displayedAttack;
    var defStat=document.getElementById('character-stat-def');if(defStat)defStat.textContent=getCharacterDefensePercent()+'%';
    var levelProgress=getLevelProgressFromScore(score);
    var levelText=document.getElementById('level-progress-text');if(levelText)levelText.textContent=levelProgress.currentExp+' / '+levelProgress.requiredExp;
    var levelFill=document.getElementById('level-progress-fill');if(levelFill)levelFill.style.width=((levelProgress.currentExp/levelProgress.requiredExp)*100)+'%';

    var special=getCharacterSpecial();
    var specialName=document.getElementById('character-special-name');if(specialName)specialName.textContent=special?special.name:'SELECT A HERO';
    var specialDesc=document.getElementById('character-special-desc');if(specialDesc)specialDesc.textContent=special?special.desc:'Answer correctly to charge your hero skill.';
    var chargeFill=document.getElementById('character-special-charge-fill');if(chargeFill)chargeFill.style.width=specialCharge+'%';
    var skillBtn=document.getElementById('character-special-btn');
    if(skillBtn){
        var ready=!!special&&specialCharge>=100&&!answered&&!!currentQuestion&&monsterHp>0;
        skillBtn.disabled=!ready;
        skillBtn.className='lex-special-skill-btn'+(specialCharge>=100?' ready':'');
        skillBtn.textContent=specialCharge>=100?(ready?'USE '+special.name:'SKILL READY'):'CHARGE '+specialCharge+'%';
    }
}

function updatePlayerHP(){
    var pct=Math.max(0,hp/maxHp*100);var fill=document.getElementById('hp-fill');
    if(!fill)return;
    fill.style.width=pct+'%';fill.className='hp-fill'+(pct<=25?' low':'');
    document.getElementById('hp-text').textContent=hp+'/'+maxHp;
    var h1=document.getElementById('heart1'),h2=document.getElementById('heart2'),h3=document.getElementById('heart3');
    if(h1&&h2&&h3){
        h1.className='lex-heart'+(pct>0?'':' empty');
        h2.className='lex-heart'+(pct>33?'':' empty');
        h3.className='lex-heart'+(pct>66?'':' empty');
    }
    updateCharacterStatsUI();
}

function updateDiffDisplay(){
    var el=document.getElementById('auto-diff-display');
    if(isBossFight){el.textContent='HARD';el.className='diff-btn hard active';}
    else{el.textContent='EASY / NORMAL';el.className='diff-btn easy active';}
    updateBuffIndicators();
}

function loadQuestion(){
    answered=false;currentQuestion=null;questionNum++;
    updateCharacterStatsUI();
    document.getElementById('q-content').style.display='none';
    document.getElementById('loading').style.display='block';
    document.getElementById('next-btn').classList.remove('show');
    document.getElementById('explanation').classList.remove('show');
    apiGetQuestion(isBossFight?true:false)
    .then(function(data){
        if(data.status==='ok'){
            currentQuestion=data.question;
            currentDifficulty=data.question.diff;
            if(data.buffs){buffDef=data.buffs.def;buffGold=data.buffs.gold;buffCrit=data.buffs.crit;buffTime=data.buffs.time;}
            renderQuestion(data.question);updateSpeech(getQuestionSpeech());updateBuffIndicators();
        }else{
            document.getElementById('loading').textContent=data.message||'Question unavailable';
        }
    }).catch(function(){document.getElementById('loading').textContent='Error!';});
}

function getQuestionSpeech(){
    if(isBossFight){
        var pool=['Boss-level!','Maximum danger!','Think hard!','Critical hit time!','This is it!','Stay focused!'];
        return pool[Math.floor(Math.random()*pool.length)];
    }
    var pool=['Watch out!','Here it comes!','Stay sharp!','Focus!','Easy target!','Be careful!','Think fast!'];
    return pool[Math.floor(Math.random()*pool.length)];
}

function renderQuestion(q){
    document.getElementById('loading').style.display='none';document.getElementById('q-content').style.display='block';
    document.getElementById('q-cat').textContent=q.cat.toUpperCase();
    var diffEl=document.getElementById('q-diff');diffEl.textContent=q.diff.toUpperCase();diffEl.className='q-difficulty '+q.diff;
    document.getElementById('q-number').textContent='Attack #'+questionNum;
    var qText=q.q,qTextEl=document.getElementById('q-text');
    if(q.type==='code'){var parts=qText.split('\n\n');
        if(parts.length>1){qTextEl.innerHTML=parts[0]+'<div class="code-block">'+formatCode(parts.slice(1).join('\n\n'))+'</div>';}
        else{qTextEl.innerHTML=qText;}}else{qTextEl.innerHTML=qText;}
    var choicesEl=document.getElementById('choices');choicesEl.innerHTML='';var letters=['A','B','C','D'];
    q.choices.forEach(function(choice,i){var btn=document.createElement('div');btn.className='choice-btn';
        btn.innerHTML='<span class="choice-letter">'+letters[i]+'</span><span>'+choice+'</span>';
        btn.onclick=function(){selectAnswer(i);};choicesEl.appendChild(btn);});
    document.getElementById('exp-text').textContent=q.explain;
    startTimer();
    updateCharacterStatsUI();
}

function formatCode(code){
    return code.replace(/(&lt;\?php|&lt;html|&lt;\/|&gt;|\?&gt;)/g,'<span style="color:#ff6b6b">$1</span>')
    .replace(/\b(echo|return|function|class|new|if|else|elseif|for|foreach|while|do|switch|case|break|default|public|private|protected|static|extends|implements|try|catch|throw|match|fn|list|as|array)\b/g,'<span style="color:#ff79c6">$1</span>')
    .replace(/\$[a-zA-Z_][a-zA-Z0-9_]*/g,'<span style="color:#88ccff">$&</span>')
    .replace(/"([^"]*)"/g,'<span style="color:#e6db74">"$1"</span>')
    .replace(/'([^']*)'/g,"<span style='color:#e6db74'>'$1'</span>")
    .replace(/(=&gt;)/g,'<span style="color:#ff79c6">$1</span>');
}

function triggerAttackFx(effectId){
    var fx=document.getElementById(effectId);
    if(!fx)return;
    fx.classList.remove('show');
    void fx.offsetWidth;
    fx.classList.add('show');
}

function playAttackSequence(attackerEl,targetEl,attackerClass,targetClass,effectId){
    if(!attackerEl||!targetEl)return;
    clearCharacterCombatAnimation();
    attackerEl.classList.remove('hero-attacking','hero-hit-anim','monster-attacking','monster-hit-anim');
    targetEl.classList.remove('hero-attacking','hero-hit-anim','monster-attacking','monster-hit-anim');
    void attackerEl.offsetWidth;
    attackerEl.classList.add(attackerClass);
    setTimeout(function(){
        targetEl.classList.add(targetClass);
        triggerAttackFx(effectId);
    },200);
}

const CHARACTER_ATTACK_TIMINGS={scholar:330,wizard:390,knight:280,rogue:230,healer:390,pirate:350};
const CHARACTER_SKILL_TIMINGS={scholar:620,wizard:560,knight:450,rogue:360,healer:650,pirate:520};

const CHARACTER_ATTACK_NAMES={
    scholar:'SYNTAX BOLT',wizard:'ARCANE MISSILE',knight:'VANGUARD SLASH',
    rogue:'NEON DAGGERS',healer:'RADIANT SPARK',pirate:'BLACKPOWDER SHOT'
};
const CHARACTER_COMBAT_PROFILES={
    scholar:{color:'#54efff',accent:'#ffe36e',glyph:'</>'},
    wizard:{color:'#a768ff',accent:'#f2d4ff',glyph:'*'},
    knight:{color:'#ffd15a',accent:'#fff2af',glyph:'+'},
    rogue:{color:'#39ffc0',accent:'#d8fff3',glyph:'//'},
    healer:{color:'#68ffb4',accent:'#e0fff0',glyph:'+'},
    pirate:{color:'#ffad32',accent:'#fff0a8',glyph:'o'}
};
const ENEMY_ATTACK_NAMES={
    bug_sprite:'SYNTAX STING',null_ghost:'NULL PULSE',var_slime:'VARIABLE SPLASH',
    scope_bat:'SCOPE DIVE',loop_worm:'INFINITE COIL',array_golem:'INDEXED SLAM',
    sql_inject:'INJECTION QUERY',syntax_skeleton:'SEMICOLON CLEAVE',regex_spider:'PATTERN WEB',
    exception_wraith:'THROW EXCEPTION',type_mimic:'TYPE SHIFT',callback_phantom:'PHANTOM CALLBACK',
    closure_trap:'CAPTURED STRIKE',cache_cinder:'CACHE BURST',daemon_imp:'DAEMON BLAZE',
    stack_overflow:'STACK CRUSH',deadlock_dragon:'THREAD BREATH',memory_leak:'HEAP SIPHON',
    recursion_hydra:'RECURSIVE FANGS',fatal_error_titan:'KERNEL SMASH'
};
const ENEMY_COMBAT_PROFILES={
    bug_sprite:{color:'#66f04f',accent:'#d9ff95',glyph:'!'},null_ghost:{color:'#a98cff',accent:'#f0e8ff',glyph:'0'},
    var_slime:{color:'#3ee4a0',accent:'#c8ffe9',glyph:'$'},scope_bat:{color:'#8f55ff',accent:'#e0ccff',glyph:'{}'},
    loop_worm:{color:'#ff9f32',accent:'#fff0a3',glyph:'oo'},array_golem:{color:'#628dff',accent:'#d4e0ff',glyph:'[]'},
    sql_inject:{color:'#43ff91',accent:'#ddffe8',glyph:'--'},syntax_skeleton:{color:'#f1dfb4',accent:'#ffffff',glyph:';'},
    regex_spider:{color:'#cfb9ff',accent:'#ffffff',glyph:'^$'},exception_wraith:{color:'#ff4777',accent:'#ffd9e4',glyph:'!'},
    type_mimic:{color:'#ffad52',accent:'#ffe8bd',glyph:'?'},callback_phantom:{color:'#55c9ff',accent:'#ddf7ff',glyph:'()'},
    closure_trap:{color:'#c969ff',accent:'#f1d7ff',glyph:'{}'},cache_cinder:{color:'#ff6d22',accent:'#fff07c',glyph:'#'},
    daemon_imp:{color:'#ff392b',accent:'#ffcf74',glyph:'&'},stack_overflow:{color:'#ff4668',accent:'#ffd3dc',glyph:'++'},
    deadlock_dragon:{color:'#806cff',accent:'#e0dbff',glyph:'||'},memory_leak:{color:'#b655ff',accent:'#ead0ff',glyph:'%'},
    recursion_hydra:{color:'#32ef79',accent:'#d7ffe3',glyph:'fn'},fatal_error_titan:{color:'#ff321d',accent:'#fff078',glyph:'X'}
};
var combatPresentationToken=0;

function getCharacterAnimationId(charId){
    return CHARACTER_SPECIALS[charId]?charId:'scholar';
}

function getCharacterCombatFxLayer(){
    return document.getElementById('character-combat-fx-layer');
}

function getCharacterCombatProfile(charId){
    return CHARACTER_COMBAT_PROFILES[charId]||CHARACTER_COMBAT_PROFILES.scholar;
}

function getEnemyCombatProfile(monsterId){
    return ENEMY_COMBAT_PROFILES[monsterId]||ENEMY_COMBAT_PROFILES.bug_sprite;
}

function addCombatParticles(parent,side,profile,count){
    if(!parent)return;
    for(var i=0;i<count;i++){
        var particle=document.createElement('i');
        particle.className='combat-particle';
        particle.style.setProperty('--particle-color',i%3===0?profile.accent:profile.color);
        particle.style.setProperty('--particle-x',(side==='hero'?12:88)+(Math.random()*10-5)+'%');
        particle.style.setProperty('--particle-y',(29+Math.random()*43)+'%');
        particle.style.setProperty('--particle-dx',((side==='hero'?1:-1)*(70+Math.random()*190))+'px');
        particle.style.setProperty('--particle-dy',(-70+Math.random()*140)+'px');
        particle.style.setProperty('--particle-delay',(Math.random()*.18)+'s');
        particle.style.setProperty('--particle-size',(3+Math.floor(Math.random()*6))+'px');
        parent.appendChild(particle);
    }
}

function clearCombatPresentation(){
    combatPresentationToken++;
    var scene=document.getElementById('battle-scene');
    if(scene)scene.classList.remove('combat-hero-active','combat-enemy-active','combat-skill-active','combat-boss-active');
    var layer=getCharacterCombatFxLayer();
    if(layer)layer.querySelectorAll('.combat-atmosphere,.combat-announcement,.combat-impact-burst').forEach(function(effect){effect.remove();});
}

function beginCombatPresentation(side,tier,title,subtitle,profile,duration){
    var layer=getCharacterCombatFxLayer();
    var scene=document.getElementById('battle-scene');
    if(!layer||!scene)return;
    clearCombatPresentation();
    var token=++combatPresentationToken;
    scene.style.setProperty('--combat-color',profile.color);
    scene.style.setProperty('--combat-accent',profile.accent);
    scene.classList.add(side==='hero'?'combat-hero-active':'combat-enemy-active');
    if(tier==='skill')scene.classList.add('combat-skill-active');
    if(tier==='boss')scene.classList.add('combat-boss-active');

    var atmosphere=document.createElement('div');
    atmosphere.className='combat-atmosphere combat-atmosphere-'+side+' combat-atmosphere-'+tier;
    atmosphere.style.setProperty('--combat-color',profile.color);
    atmosphere.style.setProperty('--combat-accent',profile.accent);
    for(var i=0;i<9;i++){
        var line=document.createElement('i');
        line.className='combat-speed-line';
        line.style.setProperty('--line-y',(12+i*9)+'%');
        line.style.setProperty('--line-delay',(i*.025)+'s');
        line.style.setProperty('--line-length',(70+(i%4)*35)+'px');
        atmosphere.appendChild(line);
    }
    addCombatParticles(atmosphere,side,profile,tier==='attack'?10:18);
    layer.appendChild(atmosphere);

    var announcement=document.createElement('div');
    announcement.className='combat-announcement combat-announcement-'+side+' combat-announcement-'+tier;
    announcement.style.setProperty('--combat-color',profile.color);
    announcement.style.setProperty('--combat-accent',profile.accent);
    var glyph=document.createElement('span');glyph.className='combat-announcement-glyph';glyph.textContent=profile.glyph;
    var copy=document.createElement('span');copy.className='combat-announcement-copy';
    var eyebrow=document.createElement('small');eyebrow.textContent=subtitle;
    var heading=document.createElement('strong');heading.textContent=title;
    copy.appendChild(eyebrow);copy.appendChild(heading);announcement.appendChild(glyph);announcement.appendChild(copy);
    layer.appendChild(announcement);

    setTimeout(function(){
        if(token!==combatPresentationToken)return;
        scene.classList.remove('combat-hero-active','combat-enemy-active','combat-skill-active','combat-boss-active');
        atmosphere.remove();announcement.remove();
    },duration||1100);
}

function triggerCombatImpact(targetSide,damageValue,profile,isCritical){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return;
    var impact=document.createElement('div');
    impact.className='combat-impact-burst combat-impact-'+targetSide+(isCritical?' combat-impact-critical':'');
    impact.style.setProperty('--combat-color',profile.color);
    impact.style.setProperty('--combat-accent',profile.accent);
    var ring=document.createElement('i');ring.className='combat-impact-ring';impact.appendChild(ring);
    for(var i=0;i<12;i++){
        var shard=document.createElement('i');shard.className='combat-impact-shard';
        shard.style.setProperty('--shard-angle',(i*30)+'deg');
        shard.style.setProperty('--shard-distance',(34+(i%4)*13)+'px');
        impact.appendChild(shard);
    }
    var damage=document.createElement('strong');
    damage.className='combat-damage-number';
    var safeDamage=Math.max(0,Number(damageValue)||0);
    damage.textContent=safeDamage?(isCritical?'CRIT -'+safeDamage:'-'+safeDamage):'HIT!';
    impact.appendChild(damage);layer.appendChild(impact);
    setTimeout(function(){impact.remove();},850);
}

function clearCharacterCombatAnimation(){
    var heroEl=document.getElementById('game-character');
    if(heroEl){
        Array.from(heroEl.classList).forEach(function(className){
            if(className.indexOf('hero-normal-')===0||className.indexOf('hero-skill-')===0)heroEl.classList.remove(className);
        });
    }
    var layer=getCharacterCombatFxLayer();
    if(layer)layer.querySelectorAll('.character-attack-visual,.character-skill-fx').forEach(function(effect){effect.remove();});
}

function createCharacterAttackVisual(charId){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return null;
    var visual=document.createElement('div');
    visual.className='character-attack-visual attack-'+charId;
    var templates={
        scholar:'<i class="code-page"></i><i class="code-page trail"></i>',
        wizard:'<i class="magic-orb"></i><i class="magic-spark one"></i><i class="magic-spark two"></i>',
        knight:'<i class="sword-arc"></i><i class="shield-edge"></i>',
        rogue:'<i class="hack-slash one"></i><i class="hack-slash two"></i><i class="hack-slash three"></i>',
        healer:'<i class="light-cross"></i><i class="light-drop one"></i><i class="light-drop two"></i>',
        pirate:'<i class="cannonball"></i><i class="powder-smoke one"></i><i class="powder-smoke two"></i>'
    };
    visual.innerHTML=templates[charId]||templates.scholar;
    layer.appendChild(visual);
    return visual;
}

function createCharacterSkillVisual(charId){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return null;
    var effect=document.createElement('div');
    effect.className='character-skill-fx skill-'+charId;
    var templates={
        scholar:'<i class="time-ring outer"></i><i class="time-ring inner"></i><i class="time-clock"><b></b><em></em></i><i class="rewind-mark one">&lt;</i><i class="rewind-mark two">&lt;</i>',
        wizard:'<i class="rune-ring outer"></i><i class="rune-ring inner"></i><i class="arcane-core"></i><i class="arcane-ray one"></i><i class="arcane-ray two"></i><i class="arcane-ray three"></i>',
        knight:'<i class="aegis-shield"></i><i class="slam-column"></i><i class="slam-wave one"></i><i class="slam-wave two"></i>',
        rogue:'<i class="glitch-line one"></i><i class="glitch-line two"></i><i class="glitch-line three"></i><i class="zero-slash one"></i><i class="zero-slash two"></i><i class="zero-slash three"></i>',
        healer:'<i class="restore-ring one"></i><i class="restore-ring two"></i><i class="restore-cross main"></i><i class="restore-cross left"></i><i class="restore-cross right"></i><i class="restore-spark one"></i><i class="restore-spark two"></i>',
        pirate:'<i class="bounty-cannon"></i><i class="bounty-ball"></i><i class="bounty-blast"></i><i class="bounty-coin one"></i><i class="bounty-coin two"></i><i class="bounty-coin three"></i><i class="bounty-coin four"></i>'
    };
    effect.innerHTML=templates[charId]||templates.scholar;
    layer.appendChild(effect);
    return effect;
}

function playCharacterAttackAnimation(charId,damageValue,isCritical){
    var id=getCharacterAnimationId(charId);
    var heroEl=document.getElementById('game-character');
    var monsterEl=document.getElementById('monster-canvas');
    if(!heroEl||!monsterEl)return;
    hideSpeechBubble();
    clearEnemyCombatAnimation();
    clearCharacterCombatAnimation();
    heroEl.classList.remove('hero-hit-anim');
    monsterEl.classList.remove('monster-hit-anim');
    void heroEl.offsetWidth;
    heroEl.classList.add('hero-normal-'+id);
    var profile=getCharacterCombatProfile(id);
    beginCombatPresentation('hero','attack',CHARACTER_ATTACK_NAMES[id]||'HERO ATTACK','NORMAL ATTACK',profile,980);
    var visual=createCharacterAttackVisual(id);
    var impactDelay=CHARACTER_ATTACK_TIMINGS[id]||330;
    setTimeout(function(){
        monsterEl.classList.remove('monster-hit-anim');
        void monsterEl.offsetWidth;
        monsterEl.classList.add('monster-hit-anim');
        triggerAttackFx('hero-attack-fx');
        triggerCombatImpact('enemy',damageValue,profile,!!isCritical);
    },impactDelay);
    setTimeout(function(){
        heroEl.classList.remove('hero-normal-'+id);
        monsterEl.classList.remove('monster-hit-anim');
        if(visual)visual.remove();
    },900);
}

function playCharacterSkillAnimation(charId,damageValue,skillName){
    var id=getCharacterAnimationId(charId);
    var heroEl=document.getElementById('game-character');
    var monsterEl=document.getElementById('monster-canvas');
    if(!heroEl||!monsterEl)return;
    hideSpeechBubble();
    clearEnemyCombatAnimation();
    clearCharacterCombatAnimation();
    heroEl.classList.remove('hero-hit-anim');
    monsterEl.classList.remove('monster-hit-anim');
    void heroEl.offsetWidth;
    heroEl.classList.add('hero-skill-'+id);
    var profile=getCharacterCombatProfile(id);
    var special=CHARACTER_SPECIALS[id]||null;
    beginCombatPresentation('hero','skill',skillName||(special?special.name:'HERO SKILL'),'ACTIVE SKILL',profile,1480);
    var effect=createCharacterSkillVisual(id);
    var impactDelay=CHARACTER_SKILL_TIMINGS[id]||520;
    setTimeout(function(){
        monsterEl.classList.remove('monster-hit-anim');
        void monsterEl.offsetWidth;
        monsterEl.classList.add('monster-hit-anim');
        triggerAttackFx('hero-attack-fx');
        triggerCombatImpact('enemy',damageValue,profile,true);
    },impactDelay);
    setTimeout(function(){
        heroEl.classList.remove('hero-skill-'+id);
        monsterEl.classList.remove('monster-hit-anim');
        if(effect)effect.remove();
    },1450);
}

const ENEMY_ATTACK_TIMINGS={
    bug_sprite:260,null_ghost:390,var_slime:320,scope_bat:260,loop_worm:350,
    array_golem:300,sql_inject:390,syntax_skeleton:280,regex_spider:410,
    exception_wraith:390,type_mimic:270,callback_phantom:330,closure_trap:420,
    cache_cinder:370,daemon_imp:290,stack_overflow:330,deadlock_dragon:290,
    memory_leak:400,recursion_hydra:320,fatal_error_titan:310
};
const BOSS_SKILL_TIMINGS={stack_overflow:620,deadlock_dragon:610,memory_leak:650,recursion_hydra:560,fatal_error_titan:680};

function getEnemyAnimationId(monsterId){
    return ENEMY_ATTACK_TIMINGS[monsterId]?monsterId:'bug_sprite';
}

function clearEnemyCombatAnimation(){
    var monsterEl=document.getElementById('monster-canvas');
    if(monsterEl){
        Array.from(monsterEl.classList).forEach(function(className){
            if(className.indexOf('enemy-normal-')===0||className.indexOf('enemy-skill-')===0)monsterEl.classList.remove(className);
        });
    }
    var layer=getCharacterCombatFxLayer();
    if(layer)layer.querySelectorAll('.enemy-attack-visual,.boss-skill-fx').forEach(function(effect){effect.remove();});
}

function createEnemyAttackVisual(monsterId){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return null;
    var visual=document.createElement('div');
    visual.className='enemy-attack-visual enemy-'+monsterId;
    visual.innerHTML='<i class="enemy-fx-part one"></i><i class="enemy-fx-part two"></i><b class="enemy-fx-part three"></b>';
    layer.appendChild(visual);
    return visual;
}

function createBossSkillVisual(bossId){
    var layer=getCharacterCombatFxLayer();
    if(!layer)return null;
    var effect=document.createElement('div');
    effect.className='boss-skill-fx boss-skill-'+bossId;
    var templates={
        stack_overflow:'<i class="stack-block one">()</i><i class="stack-block two">()</i><i class="stack-block three">()</i><i class="stack-block four">()</i><i class="recursive-ring one"></i><i class="recursive-ring two"></i>',
        deadlock_dragon:'<i class="thread-chain left"></i><i class="thread-chain right"></i><i class="thread-lock"><b></b></i><i class="lock-flash"></i>',
        memory_leak:'<i class="memory-orb one"></i><i class="memory-orb two"></i><i class="memory-orb three"></i><i class="memory-orb four"></i><i class="leak-vortex"></i>',
        recursion_hydra:'<i class="hydra-jaw one"><b></b></i><i class="hydra-jaw two"><b></b></i><i class="hydra-jaw three"><b></b></i><i class="hydra-trail one"></i><i class="hydra-trail two"></i>',
        fatal_error_titan:'<i class="fatal-panel one">FATAL</i><i class="fatal-panel two">ERROR</i><i class="fatal-panel three">CRASH</i><i class="crash-beam"></i><i class="crash-wave one"></i><i class="crash-wave two"></i>'
    };
    effect.innerHTML=templates[bossId]||templates.stack_overflow;
    layer.appendChild(effect);
    return effect;
}

function playEnemyAttackAnimation(monsterId,damageValue){
    var id=getEnemyAnimationId(monsterId);
    var monsterEl=document.getElementById('monster-canvas');
    var heroEl=document.getElementById('game-character');
    if(!monsterEl||!heroEl)return;
    clearCharacterCombatAnimation();
    clearEnemyCombatAnimation();
    heroEl.classList.remove('hero-hit-anim');
    void monsterEl.offsetWidth;
    monsterEl.classList.add('enemy-normal-'+id);
    var profile=getEnemyCombatProfile(id);
    beginCombatPresentation('enemy','attack',ENEMY_ATTACK_NAMES[id]||'MONSTER ATTACK','ENEMY ATTACK',profile,1040);
    var visual=createEnemyAttackVisual(id);
    var impactDelay=ENEMY_ATTACK_TIMINGS[id]||330;
    setTimeout(function(){
        heroEl.classList.remove('hero-hit-anim');
        void heroEl.offsetWidth;
        heroEl.classList.add('hero-hit-anim');
        triggerAttackFx('monster-attack-fx');
        triggerCombatImpact('hero',damageValue,profile,false);
    },impactDelay);
    setTimeout(function(){
        monsterEl.classList.remove('enemy-normal-'+id);
        heroEl.classList.remove('hero-hit-anim');
        if(visual)visual.remove();
    },1000);
}

function playBossSkillAnimation(bossId,damageValue,skillName){
    var id=BOSS_SKILL_TIMINGS[bossId]?bossId:'stack_overflow';
    var monsterEl=document.getElementById('monster-canvas');
    var heroEl=document.getElementById('game-character');
    if(!monsterEl||!heroEl)return;
    clearCharacterCombatAnimation();
    clearEnemyCombatAnimation();
    heroEl.classList.remove('hero-hit-anim');
    void monsterEl.offsetWidth;
    monsterEl.classList.add('enemy-skill-'+id);
    var profile=getEnemyCombatProfile(id);
    var special=BOSS_SPECIALS[id]||null;
    beginCombatPresentation('enemy','boss',skillName||(special?special.name:'BOSS SKILL'),'BOSS SPECIAL',profile,1640);
    var effect=createBossSkillVisual(id);
    var impactDelay=BOSS_SKILL_TIMINGS[id]||620;
    setTimeout(function(){
        heroEl.classList.remove('hero-hit-anim');
        void heroEl.offsetWidth;
        heroEl.classList.add('hero-hit-anim');
        triggerAttackFx('monster-attack-fx');
        triggerCombatImpact('hero',damageValue,profile,true);
    },impactDelay);
    setTimeout(function(){
        monsterEl.classList.remove('enemy-skill-'+id);
        heroEl.classList.remove('hero-hit-anim');
        if(effect)effect.remove();
    },1600);
}

function advanceBossSpecialAttack(){
    var special=getCurrentBossSpecial();
    if(!special)return null;
    bossAttackCount++;
    updateMonsterUI();
    return bossAttackCount%special.every===0?special:null;
}

function applyBossSpecialEffects(special){
    if(!special)return;
    if(special.heal)monsterHp=Math.min(monsterMaxHp,monsterHp+special.heal);
    if(special.chargeDrain)specialCharge=Math.max(0,specialCharge-special.chargeDrain);
    if(special.goldDrain){
        var stolen=Math.min(gold,special.goldDrain);
        gold-=stolen;
    }
    var goldEl=document.getElementById('gold-count');if(goldEl)goldEl.textContent=gold;
    updateMonsterUI();
    updateCharacterStatsUI();
    saveState();
}

function resolveMonsterDefeat(){
    if(isBossFight){
        apiBossDefeated()
        .then(function(bd){
            floor_num=bd.floor;gold=bd.gold;potions=bd.potions;hp=bd.hp;maxHp=bd.max_hp;bossesDefeated=bd.bosses_defeated;
            document.getElementById('floor-num').textContent=floor_num;document.getElementById('gold-count').textContent=gold;
            var potionBtn=document.getElementById('potion-btn');if(potionBtn)potionBtn.textContent='POTION('+potions+')';document.getElementById('bosses-beaten').textContent=bossesDefeated;
            applyBattleBackground();syncBackgroundMusic('game-screen');updatePlayerHP();showBossDefeat();
        });
    }else{
        apiMonsterDefeated()
        .then(function(md){
            monstersDefeated=md.monsters_defeated;gold=md.gold;
            document.getElementById('monsters-slain').textContent=monstersDefeated;document.getElementById('gold-count').textContent=gold;
            updateCharacterStatsUI();
        });
        showToast(currentMonster.name+' DEFEATED! +'+currentMonster.gold+'g','info');
    }
}

function finishQuestionWithSpecialVictory(){
    answered=true;
    stopTimer();
    document.querySelectorAll('.choice-btn').forEach(function(btn){btn.classList.add('disabled');});
    document.getElementById('battle-banner').textContent='SPECIAL SKILL VICTORY!';
    var nextBtn=document.getElementById('next-btn');
    nextBtn.classList.add('show');
    nextBtn.textContent=isBossFight?'\u2193 DESCEND DEEPER':'\u2694 NEXT ENCOUNTER';
    updateCharacterStatsUI();
    resolveMonsterDefeat();
}

function useCharacterSpecial(){
    var special=getCharacterSpecial();
    if(!special||specialCharge<100||answered||!currentQuestion||monsterHp<=0){
        showToast('Special skill is not ready yet.','info');
        return;
    }

    specialCharge=Math.max(0,Math.min(100,Number(special.recharge)||0));
    if(special.resetTimer)startTimer();
    if(special.heal)hp=Math.min(maxHp,hp+special.heal);
    if(special.gold){gold+=special.gold;var goldEl=document.getElementById('gold-count');if(goldEl)goldEl.textContent=gold;}
    if(special.shield)specialShield=Math.max(specialShield,special.shield);

    var blocked=special.ignoreDefense?0:Math.min(monsterDefense,Math.max(0,special.damage-5));
    var specialDamage=Math.max(5,special.damage-blocked);
    monsterHp=Math.max(0,monsterHp-specialDamage);
    playCharacterSkillAnimation(selectedChar?selectedChar.id:'scholar',specialDamage,special.name);
    setTimeout(function(){playCharacterAttackSfx(selectedChar?selectedChar.id:'default',true);},90);
    showAbilityActivate(special.name+'! -'+specialDamage+' HP');
    showToast(special.name+' activated!','success');
    updateMonsterUI();
    updatePlayerHP();
    saveState();

    if(monsterHp<=0)finishQuestionWithSpecialVictory();
}

function selectAnswer(idx){
    if(answered)return;answered=true;
    updateCharacterStatsUI();
    unlockAudio();
    stopTimer();
    var btns=document.querySelectorAll('.choice-btn');
    btns.forEach(function(btn,i){btn.classList.add('disabled');if(i===currentQuestion.answer)btn.classList.add('correct');if(i===idx&&i!==currentQuestion.answer)btn.classList.add('wrong');});
    var answerIsCorrect=idx===currentQuestion.answer;
    var bossSpecial=answerIsCorrect?null:advanceBossSpecialAttack();
    var effectiveDmg=monsterAttack+(bossSpecial?bossSpecial.bonusDamage:0);var abilityHeal=0;var goldMult=1;
    if(selectedChar){
        var characterDefense=getCharacterBaseDefensePercent();
        if(characterDefense>0)effectiveDmg=Math.floor(effectiveDmg*(1-(characterDefense/100)));
        if(selectedChar.ability==='heal')abilityHeal=15;
        if(selectedChar.ability==='goldBoost'){goldMult=1.5;abilityHeal=5;}
    }
    if(buffDef>0)effectiveDmg=Math.floor(effectiveDmg*0.5);
    var shieldWasUsed=!answerIsCorrect&&specialShield>0;
    if(shieldWasUsed){effectiveDmg=0;specialShield--;}
    if(buffGold>0)goldMult*=2;
    var extraCrit=(buffCrit>0)?0.4:0;
    apiAnswer({qid:currentQuestion.id,selected:idx,correct:currentQuestion.answer,diff:currentQuestion.diff,monster_dmg:effectiveDmg,ability_heal:abilityHeal,gold_mult:goldMult})
    .then(function(data){
        score=data.score;streak=data.streak;totalCorrect=data.total_correct;totalAnswered=data.total_answered;
        bestStreak=data.best_streak;hp=data.hp;maxHp=data.max_hp;gold=data.total_gold;potions=data.potions;level=data.level;
        if(data.status==='correct'){
            specialCharge=Math.min(100,specialCharge+25);
            saveState();
            apiProgressionEvent('correct_answer',{
                difficulty:currentQuestion.diff,
                bestStreak:bestStreak,
                floor:floor_num,
                level:data.level,
                score:score
            },true);
        }else if(bossSpecial){
            applyBossSpecialEffects(bossSpecial);
        }
        document.getElementById('score').textContent=score;
        document.getElementById('player-level').textContent='LVL '+data.level;
        document.getElementById('streak').innerHTML=streak>0?'<span class="streak-fire">'+streak+'\uD83D\uDD25</span>':'0';
        document.getElementById('gold-count').textContent=gold;
        document.getElementById('best-streak').textContent=bestStreak;
        document.getElementById('accuracy').textContent=totalAnswered>0?Math.round(totalCorrect/totalAnswered*100)+'%':'0%';
        var potionBtn=document.getElementById('potion-btn');if(potionBtn)potionBtn.textContent='POTION('+potions+')';
        updatePlayerHP();

        if(data.status==='correct'){
            var baseAtk=getCharacterBaseAttack(currentDifficulty);
            var atkPower=baseAtk;var abilityMsg='';
            if(selectedChar){
                if(selectedChar.ability==='dmgBoost'){atkPower=Math.floor(baseAtk*getCharacterAttackMultiplier());abilityMsg='DMG +20%!';}
                if(selectedChar.ability==='critHit'){if(Math.random()<(0.3+extraCrit)){atkPower=baseAtk*2;abilityMsg='\u26A1 CRITICAL HIT! \u26A1';}
                }else if(extraCrit>0&&Math.random()<extraCrit){atkPower=baseAtk*2;abilityMsg='\u26A1 CRIT POTION! \u26A1';}
                if(selectedChar.ability==='addTime')abilityMsg=abilityMsg||'+5s TIMER!';
                if(selectedChar.ability==='heal')abilityMsg=abilityMsg||'HEALED +15!';
                if(selectedChar.ability==='goldBoost')abilityMsg=abilityMsg||'GOLD +50%!';
                if(selectedChar.ability==='defense')abilityMsg=abilityMsg||'SHIELDED!';
            }else if(extraCrit>0&&Math.random()<extraCrit){atkPower=baseAtk*2;abilityMsg='\u26A1 CRIT POTION! \u26A1';}
            updateBuffIndicators();
            var damageBlocked=Math.min(monsterDefense,Math.max(0,atkPower-5));
            atkPower=Math.max(5,atkPower-damageBlocked);
            var criticalImpact=/CRITICAL|CRIT POTION/.test(abilityMsg);
            playCharacterAttackAnimation(selectedChar?selectedChar.id:'scholar',atkPower,criticalImpact);
            setTimeout(function(){playCharacterAttackSfx(selectedChar?selectedChar.id:'default',false);},90);
            monsterHp=Math.max(0,monsterHp-atkPower);updateMonsterUI();
            showFloatingPoints('+'+data.points);if(abilityMsg)showAbilityActivate(abilityMsg);
            showToast('HIT! -'+atkPower+' HP to '+currentMonster.name+(damageBlocked?' (DEF blocked '+damageBlocked+')':''),'success');
            hideSpeechBubble();
            if(data.levelUp)showLevelUp(data.level);
            if(monsterHp<=0)resolveMonsterDefeat();
        }else{
            updateBuffIndicators();
            if(bossSpecial)playBossSkillAnimation(currentMonster?currentMonster.id:'stack_overflow',data.damage,bossSpecial.name);
            else playEnemyAttackAnimation(currentMonster?currentMonster.id:'bug_sprite',data.damage);
            setTimeout(function(){playMonsterAttackSfx(currentMonster?currentMonster.id:'default',isBossFight,!!bossSpecial);},90);
            document.getElementById('game-screen').classList.add('screen-shake');
            setTimeout(function(){document.getElementById('game-screen').classList.remove('screen-shake');},300);
            var dmgMsg=shieldWasUsed?'0 (AEGIS BLOCK)':(selectedChar&&selectedChar.ability==='defense'?data.damage+' (SHIELDED!)':data.damage);
            showFloatingDmg('-'+dmgMsg+' HP');
            if(bossSpecial){
                showToast('BOSS SPECIAL: '+bossSpecial.name+'! -'+data.damage+' HP','error');
                showAbilityActivate('BOSS: '+bossSpecial.name+'!');
                updateSpeech(bossSpecial.name+'!');
            }else{
                showToast('MISS! '+currentMonster.name+' attacks! -'+data.damage+' HP','error');
                updateSpeech(['Ouch!','Argh!','Not good!','Heal up!','Watch out!'][Math.floor(Math.random()*5)]);
            }
            if(shieldWasUsed)showAbilityActivate('AEGIS BLOCKED ALL DAMAGE!');
            if(!shieldWasUsed&&selectedChar&&selectedChar.ability==='defense')showAbilityActivate('SHIELD -50% DMG!');
            if(data.dead){showDeath();return;}
        }
        document.getElementById('explanation').classList.add('show');document.getElementById('next-btn').classList.add('show');
        if(monsterHp<=0&&!isBossFight)document.getElementById('next-btn').textContent='\u2694 NEXT ENCOUNTER';
        else if(monsterHp<=0&&isBossFight)document.getElementById('next-btn').textContent='\u2193 DESCEND DEEPER';
        else document.getElementById('next-btn').textContent='\u2694 NEXT ATTACK';
    });
}

function nextAction(){if(monsterHp<=0){if(isBossFight)encounterCount=0;spawnMonster();}loadQuestion();}

function usePotion(){
    apiUsePotion()
    .then(function(data){
        if(data.status==='ok'){hp=data.hp;maxHp=data.max_hp;potions=data.potions;updatePlayerHP();
        var potionBtn=document.getElementById('potion-btn');if(potionBtn)potionBtn.textContent='POTION('+potions+')';showToast('Healed +30 HP!','success');showFloatingPoints('+30 HP');}
        else showToast('No potions left!','error');
    });
}

function buyPotion(){
    apiBuyPotion()
    .then(function(data){
        if(data.status==='ok'){gold=data.gold;hp=data.hp;maxHp=data.max_hp;document.getElementById('gold-count').textContent=gold;
        updatePlayerHP();showToast('HP Potion healed +'+data.healed+' HP! -15g','success');showFloatingPoints('+'+data.healed+' HP');refreshShopGold();}
        else if(data.status==='full_hp')showToast('HP is already full!','info');
        else showToast('Not enough gold! Need 15g','error');
    });
}

// ===== 13. SHOP OVERLAY CONTROLS =====
function openShop(){
    document.getElementById('shop-overlay').style.display='flex';
    refreshShopGold();updateShopBuffs();
}
function closeShop(){document.getElementById('shop-overlay').style.display='none';}

// ===== 14. ADMIN ACCESS =====
function handleAdminLogoClick(){
    adminLogoClicks++;
    if(adminLogoTimer)clearTimeout(adminLogoTimer);
    adminLogoTimer=setTimeout(function(){adminLogoClicks=0;},1400);
    playAdminSecretClickSfx(adminLogoClicks,adminLogoClicks>=5);
    if(adminLogoClicks>=5){
        adminLogoClicks=0;
        if(adminAuthenticated){openAdminDashboard();}
        else{openAdminLogin();}
    }
}

function openAdminLogin(){
    var overlay=document.getElementById('admin-login-overlay');
    var user=document.getElementById('admin-login-user');
    var pass=document.getElementById('admin-login-pass');
    var status=document.getElementById('admin-login-status');
    if(!overlay)return;
    if(status)status.textContent='';
    if(user)user.value='';
    if(pass)pass.value='';
    overlay.style.display='flex';
    if(user)user.focus();
}

function closeAdminLogin(){
    var overlay=document.getElementById('admin-login-overlay');
    if(overlay)overlay.style.display='none';
}

function submitAdminLogin(evt){
    if(evt)evt.preventDefault();
    var userEl=document.getElementById('admin-login-user');
    var passEl=document.getElementById('admin-login-pass');
    var status=document.getElementById('admin-login-status');
    var user=(userEl?userEl.value:'').trim();
    var pass=passEl?passEl.value:'';
    if(user===ADMIN_LOGIN_USER && pass===ADMIN_LOGIN_PASS){
        adminAuthenticated=true;
        if(status)status.textContent='';
        closeAdminLogin();
        openAdminDashboard();
        showToast('Admin login successful','success');
    } else {
        if(status)status.textContent='Invalid admin username or password.';
        showToast('Admin login failed','error');
    }
    return false;
}

// ===== 15. SETTINGS =====
function openSettings(){
    var overlay=document.getElementById('settings-overlay');
    if(!overlay)return;
    var vol=document.getElementById('settings-volume-slider');
    var volVal=document.getElementById('settings-volume-value');
    var size=document.getElementById('settings-font-size');
    var v=Math.round((localStorage.getItem('sfxVolume')?parseFloat(localStorage.getItem('sfxVolume')):1)*100);
    if(vol)vol.value=String(v);
    if(volVal)volVal.textContent=v+'%';
    var choice=localStorage.getItem('rootFontSize');
    if(!choice){
        var scaleRaw=localStorage.getItem('rootFontScale');
        var scale=scaleRaw?parseInt(scaleRaw,10):NaN;
        choice=(!isNaN(scale) && scale>=110)?'large':((!isNaN(scale) && scale<=90)?'small':'large');
    }
    if(size)size.value=choice||'large';
    overlay.style.display='flex';
}

function closeSettings(){
    var overlay=document.getElementById('settings-overlay');
    if(overlay)overlay.style.display='none';
}

function onSettingsVolumeChange(val){
    var pct=Math.max(0,Math.min(100,parseInt(val||0)));
    var el=document.getElementById('settings-volume-value');
    if(el)el.textContent=pct+'%';
    setSfxVolume(pct/100);
}

function onSettingsFontSizeChange(val){
    var choice=(val==='small' || val==='large')?val:'medium';
    applyFontSizeChoice(choice);
    localStorage.setItem('rootFontSize',choice);
}

function restartGame(){
    apiReset()
    .then(function(){
        localStorage.removeItem(ACTIVE_PLAYER_SESSION_KEY);
        closeSettings();
        syncUiFromState();
        showToast('Game restarted','info');
        showScreen('title-screen');
    }).catch(function(){showToast('Could not restart','error');});
}

function exitGame(){
    localStorage.removeItem(ACTIVE_PLAYER_SESSION_KEY);
    closeSettings();
    showScreen('title-screen');
    showToast('Exited to title','info');
}

function saveSettings(){
    var volEl=document.getElementById('settings-volume-slider');
    var fsEl=document.getElementById('settings-font-size');
    var vol=parseInt(volEl?volEl.value:100,10);
    var fs=(fsEl?fsEl.value:'large');
    setSfxVolume((isNaN(vol)?100:vol)/100);
    onSettingsFontSizeChange(fs);
    showToast('Settings saved','success');
    closeSettings();
}

// ===== 16. ADMIN QUESTION AND USER MANAGEMENT =====
function openAdminDashboard(){
    var overlay=document.getElementById('admin-overlay');
    if(!overlay)return;
    overlay.style.display='flex';
    switchAdminTab('questions');
    showToast('Admin dashboard unlocked','info');
}

function switchAdminTab(tab){
    adminActiveTab=tab;
    var qTab=document.getElementById('admin-tab-questions');
    var uTab=document.getElementById('admin-tab-users');
    var qPanel=document.getElementById('admin-questions-panel');
    var uPanel=document.getElementById('admin-users-panel');
    var qActions=document.getElementById('admin-questions-actions');
    var uActions=document.getElementById('admin-users-actions');
    var title=document.getElementById('admin-panel-title');
    var subtitle=document.getElementById('admin-panel-subtitle');
    if(tab==='users'){
        if(qTab)qTab.classList.remove('active');
        if(uTab)uTab.classList.add('active');
        if(qPanel)qPanel.style.display='none';
        if(uPanel)uPanel.style.display='grid';
        if(qActions)qActions.style.display='none';
        if(uActions)uActions.style.display='flex';
        if(title)title.textContent='MANAGE USERS';
        if(subtitle)subtitle.textContent='Saved players and leaderboard participants in one list. Edit existing saves or create a player profile from a leaderboard entry.';
        reloadAdminUsers();
    }else{
        if(uTab)uTab.classList.remove('active');
        if(qTab)qTab.classList.add('active');
        if(uPanel)uPanel.style.display='none';
        if(qPanel)qPanel.style.display='grid';
        if(uActions)uActions.style.display='none';
        if(qActions)qActions.style.display='flex';
        if(title)title.textContent='QUESTION EDITOR';
        if(subtitle)subtitle.textContent='Click the logo 5 times to open this dashboard. Changes are stored in the database and immediately affect the quiz question pool.';
        reloadAdminQuestions();
    }
}

function getNextQuestionId(){
    var maxId=0;
    QUESTIONS.forEach(function(q){if(q.id>maxId)maxId=q.id;});
    return maxId+1;
}

function closeAdminDashboard(){
    var overlay=document.getElementById('admin-overlay');
    if(overlay)overlay.style.display='none';
}

function reloadAdminQuestions(){
    var list=document.getElementById('admin-question-list');
    if(list)list.innerHTML='<div class="admin-empty">Loading questions...</div>';
    apiAdminListQuestions()
    .then(function(data){
        adminQuestionsCache=Array.isArray(data.questions)?data.questions:[];
        if(!adminQuestionsCache.length){
            if(list)list.innerHTML='<div class="admin-empty">No questions found.</div>';
            return;
        }
        if(!adminCurrentQuestionId || !adminQuestionsCache.some(function(q){return String(q.id)===String(adminCurrentQuestionId);})){adminCurrentQuestionId=adminQuestionsCache[0].id;}
        renderAdminQuestionList();
        selectAdminQuestion(adminCurrentQuestionId,false);
    }).catch(function(){
        if(list)list.innerHTML='<div class="admin-empty">Failed to load questions.</div>';
        showToast('Failed to load question list','error');
    });
}

function renderAdminQuestionList(){
    var list=document.getElementById('admin-question-list');
    if(!list)return;
    list.innerHTML='';
    adminQuestionsCache.forEach(function(question){
        var item=document.createElement('div');
        item.className='admin-list-item'+(String(question.id)===String(adminCurrentQuestionId)?' active':'');
        var storageLabel=question.isCustom===true||question.source==='admin'?' | CUSTOM • DATABASE':'';
        item.innerHTML='<div class="admin-question-id">#'+question.id+' | '+question.diff+' | '+question.cat+storageLabel+'</div><div class="admin-question-snippet">'+escapeHtml(shortAdminText(question.q))+'</div>';
        item.onclick=function(){selectAdminQuestion(question.id);};
        list.appendChild(item);
    });
}

function selectAdminQuestion(id,updateList){
    if(updateList===undefined)updateList=true;
    adminCurrentQuestionId=id;
    if(updateList)renderAdminQuestionList();
    var question=adminQuestionsCache.find(function(q){return String(q.id)===String(id);});
    if(!question)return;
    document.getElementById('admin-question-id').value=question.id;
    document.getElementById('admin-cat').value=question.cat||'';
    document.getElementById('admin-diff').value=question.diff||'easy';
    document.getElementById('admin-type').value=question.type||'multiple';
    document.getElementById('admin-q').value=question.q||'';
    document.getElementById('admin-choice-0').value=(question.choices&&question.choices[0])||'';
    document.getElementById('admin-choice-1').value=(question.choices&&question.choices[1])||'';
    document.getElementById('admin-choice-2').value=(question.choices&&question.choices[2])||'';
    document.getElementById('admin-choice-3').value=(question.choices&&question.choices[3])||'';
    document.getElementById('admin-answer').value=String(question.answer!==undefined?question.answer:0);
    document.getElementById('admin-explain').value=question.explain||'';
    var isCustom=question.isCustom===true||question.source==='admin';
    document.getElementById('admin-status').textContent=isCustom?'Custom question #'+question.id+' is saved permanently in MongoDB.':'Editing built-in question #'+question.id+'.';
}

function createNewQuestion(){
    var id=getNextQuestionId();
    adminCurrentQuestionId=id;
    var list=document.getElementById('admin-question-list');
    if(list){
        renderAdminQuestionList();
    }
    document.getElementById('admin-question-id').value=id;
    document.getElementById('admin-cat').value='basics';
    document.getElementById('admin-diff').value='easy';
    document.getElementById('admin-type').value='multiple';
    document.getElementById('admin-q').value='';
    document.getElementById('admin-choice-0').value='';
    document.getElementById('admin-choice-1').value='';
    document.getElementById('admin-choice-2').value='';
    document.getElementById('admin-choice-3').value='';
    document.getElementById('admin-answer').value='0';
    document.getElementById('admin-explain').value='';
    document.getElementById('admin-status').textContent='Creating new question #'+id+'. Saving will store it permanently in MongoDB.';
}

function saveAdminQuestion(){
    var body={
        id:document.getElementById('admin-question-id').value||'0',
        cat:document.getElementById('admin-cat').value,
        diff:document.getElementById('admin-diff').value,
        type:document.getElementById('admin-type').value,
        q:document.getElementById('admin-q').value,
        choice_0:document.getElementById('admin-choice-0').value,
        choice_1:document.getElementById('admin-choice-1').value,
        choice_2:document.getElementById('admin-choice-2').value,
        choice_3:document.getElementById('admin-choice-3').value,
        answer:document.getElementById('admin-answer').value,
        explain:document.getElementById('admin-explain').value
    };
    apiAdminSaveQuestion(body)
    .then(function(data){
        if(data.status==='ok'){
            showToast(data.persistence==='permanent'?'Question saved permanently in database':'Built-in question edit saved','success');
            reloadAdminQuestions();
        } else {
            showToast(data.message||'Could not save question','error');
        }
    }).catch(function(){showToast('Could not save question','error');});
}

function resetAdminQuestions(){
    var overlay=document.getElementById('admin-reset-confirm-overlay');
    if(!overlay)return;
    adminResetFocusReturn=document.activeElement;
    overlay.style.display='flex';
    overlay.setAttribute('aria-busy','false');
    var confirmBtn=document.getElementById('admin-reset-confirm-btn');
    var cancelBtn=document.getElementById('admin-reset-cancel-btn');
    if(confirmBtn){confirmBtn.disabled=false;confirmBtn.textContent='CONFIRM RESET';}
    if(cancelBtn)cancelBtn.disabled=false;
    setTimeout(function(){if(cancelBtn)cancelBtn.focus();},0);
}

function cancelResetAdminQuestions(){
    var overlay=document.getElementById('admin-reset-confirm-overlay');
    if(overlay)overlay.style.display='none';
    if(adminResetFocusReturn&&typeof adminResetFocusReturn.focus==='function')adminResetFocusReturn.focus();
    adminResetFocusReturn=null;
}

function confirmResetAdminQuestions(){
    var overlay=document.getElementById('admin-reset-confirm-overlay');
    var confirmBtn=document.getElementById('admin-reset-confirm-btn');
    var cancelBtn=document.getElementById('admin-reset-cancel-btn');
    if(confirmBtn){confirmBtn.disabled=true;confirmBtn.textContent='RESETTING...';}
    if(cancelBtn)cancelBtn.disabled=true;
    if(overlay)overlay.setAttribute('aria-busy','true');
    apiAdminResetQuestions()
    .then(function(data){
        if(data.status==='ok'){
            adminCurrentQuestionId=null;
            cancelResetAdminQuestions();
            showToast('Built-in edits reset. Added questions were kept in the database.','info');
            reloadAdminQuestions();
        } else {
            showToast('Could not reset edits','error');
            if(confirmBtn){confirmBtn.disabled=false;confirmBtn.textContent='CONFIRM RESET';}
            if(cancelBtn)cancelBtn.disabled=false;
            if(overlay)overlay.setAttribute('aria-busy','false');
        }
    }).catch(function(){
        showToast('Could not reset edits','error');
        if(confirmBtn){confirmBtn.disabled=false;confirmBtn.textContent='CONFIRM RESET';}
        if(cancelBtn)cancelBtn.disabled=false;
        if(overlay)overlay.setAttribute('aria-busy','false');
    });
}

function reloadAdminUsers(){
    var list=document.getElementById('admin-user-list');
    if(list)list.innerHTML='<div class="admin-empty">Loading users...</div>';
    apiAdminListUsers()
    .then(function(data){
        adminUsersCache=Array.isArray(data.players)?data.players:[];
        if(!adminUsersCache.length){
            if(list)list.innerHTML='<div class="admin-empty">No saved players yet.</div>';
            clearAdminUserForm();
            return;
        }
        if(!adminCurrentUsername || !adminUsersCache.some(function(p){return p.username===adminCurrentUsername;})){adminCurrentUsername=adminUsersCache[0].username;}
        renderAdminUserList();
        selectAdminUser(adminCurrentUsername,false);
    }).catch(function(){
        if(list)list.innerHTML='<div class="admin-empty">Failed to load users.</div>';
        showToast('Failed to load user list','error');
    });
}

function renderAdminUserList(){
    var list=document.getElementById('admin-user-list');
    if(!list)return;
    list.innerHTML='';
    adminUsersCache.forEach(function(player){
        var s=player.state||{};
        var source=player.leaderboardOnly?'LEADERBOARD':'SAVED PLAYER';
        var rank=player.leaderboard&&player.leaderboard.rank?' | Rank #'+player.leaderboard.rank:'';
        var item=document.createElement('div');
        item.className='admin-list-item'+(player.username===adminCurrentUsername?' active':'');
        item.innerHTML='<div class="admin-user-row"><span class="admin-user-name">'+escapeHtml(player.username)+'</span><span class="admin-user-score">'+(s.score||0)+' pts</span></div>'+ 
                        '<div class="admin-user-meta">'+source+rank+' | Floor '+(s.floor||1)+' | Lvl '+(s.level||1)+'</div>'+
                        '<div class="admin-user-meta">Updated '+escapeHtml(shortAdminText(player.updatedAt||''))+'</div>';
        item.onclick=function(){selectAdminUser(player.username);};
        list.appendChild(item);
    });
}

function selectAdminUser(username,updateList){
    if(updateList===undefined)updateList=true;
    adminCurrentUsername=username;
    if(updateList)renderAdminUserList();
    var player=adminUsersCache.find(function(p){return p.username===username;});
    if(!player)return;
    var s=player.state||{};
    document.getElementById('admin-user-username').value=player.username;
    document.getElementById('admin-user-updated').value=player.updatedAt||'';
    document.getElementById('admin-user-score').value=s.score||0;
    document.getElementById('admin-user-level').value=s.level||1;
    document.getElementById('admin-user-floor').value=s.floor||1;
    document.getElementById('admin-user-gold').value=s.gold||0;
    document.getElementById('admin-user-hp').value=s.hp||0;
    document.getElementById('admin-user-maxhp').value=s.maxHp||100;
    document.getElementById('admin-user-potions').value=s.potions||0;
    document.getElementById('admin-user-monsters').value=s.monstersDefeated||0;
    document.getElementById('admin-user-bosses').value=s.bossesDefeated||0;
    var resetBtn=document.getElementById('admin-user-reset');
    var deleteBtn=document.getElementById('admin-user-delete');
    var saveBtn=document.getElementById('admin-user-save');
    if(resetBtn)resetBtn.disabled=!!player.leaderboardOnly;
    if(deleteBtn)deleteBtn.disabled=!!player.leaderboardOnly;
    if(saveBtn){saveBtn.disabled=false;saveBtn.textContent=player.leaderboardOnly?'CREATE PLAYER':'SAVE CHANGES';}
    document.getElementById('admin-user-status').textContent=player.leaderboardOnly?
        'Leaderboard entry. Save to create a manageable player profile.':
        'Editing '+player.username+'.';
}

function clearAdminUserForm(){
    ['admin-user-username','admin-user-updated','admin-user-score','admin-user-level','admin-user-floor',
     'admin-user-gold','admin-user-hp','admin-user-maxhp','admin-user-potions','admin-user-monsters','admin-user-bosses'
    ].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
    document.getElementById('admin-user-status').textContent='Select a user to manage them.';
    ['admin-user-reset','admin-user-delete','admin-user-save'].forEach(function(id){
        var button=document.getElementById(id);if(button)button.disabled=true;
    });
}

function saveAdminUser(){
    if(!adminCurrentUsername)return;
    var player=adminUsersCache.find(function(p){return p.username===adminCurrentUsername;});
    if(!player)return;
    // Start from the player's full saved state (preserves fields not shown in
    // this form, like answeredIds and buffs) and overlay the edited fields.
    var state=Object.assign({},player.state);
    state.score=parseInt(document.getElementById('admin-user-score').value,10)||0;
    var editedLevel=parseInt(document.getElementById('admin-user-level').value,10);
    state.level=isNaN(editedLevel)?1:Math.max(1,editedLevel);
    state.floor=Math.max(1,parseInt(document.getElementById('admin-user-floor').value,10)||1);
    state.gold=parseInt(document.getElementById('admin-user-gold').value,10)||0;
    state.hp=parseInt(document.getElementById('admin-user-hp').value,10)||0;
    state.maxHp=parseInt(document.getElementById('admin-user-maxhp').value,10)||100;
    state.potions=parseInt(document.getElementById('admin-user-potions').value,10)||0;
    state.monstersDefeated=parseInt(document.getElementById('admin-user-monsters').value,10)||0;
    state.bossesDefeated=parseInt(document.getElementById('admin-user-bosses').value,10)||0;
    apiAdminSaveUser(adminCurrentUsername,state)
    .then(function(data){
        if(data.status==='ok'){
            showToast('User updated','success');
            reloadAdminUsers();
        } else {
            showToast(data.message||'Could not save user','error');
        }
    }).catch(function(){showToast('Could not save user','error');});
}

function resetAdminUserProgress(){
    if(!adminCurrentUsername)return;
    if(!confirm('Reset '+adminCurrentUsername+'\'s progress back to defaults?'))return;
    fetch('/api/players/'+encodeURIComponent(adminCurrentUsername)+'/reset',{method:'POST'})
    .then(function(res){return res.json();})
    .then(function(data){
        if(data.status==='ok'){
            showToast('Progress reset','info');
            reloadAdminUsers();
        } else {
            showToast('Could not reset progress','error');
        }
    }).catch(function(){showToast('Could not reset progress','error');});
}

function deleteAdminUser(){
    if(!adminCurrentUsername)return;
    if(!confirm('Delete '+adminCurrentUsername+'\'s save permanently? This cannot be undone.'))return;
    apiAdminDeleteUser(adminCurrentUsername)
    .then(function(data){
        if(data.status==='ok'){
            showToast('User deleted','info');
            adminCurrentUsername=null;
            reloadAdminUsers();
        } else {
            showToast(data.message||'Could not delete user','error');
        }
    }).catch(function(){showToast('Could not delete user','error');});
}

// ===== 17. SHOP ACTIONS, VISUAL FEEDBACK, RESET, AND UTILITIES =====
function shortAdminText(text){
    var value=String(text||'').replace(/\s+/g,' ').trim();
    return value.length>90?value.slice(0,87)+'...':value;
}

function escapeHtml(text){
    return String(text).replace(/[&<>"]|'/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
}

function buyShopItem(action,cost){
    var api=action==='buy_potion'?apiBuyPotion:function(){return apiBuyBuff(action);};
    api()
    .then(function(data){
        if(data.status==='ok'){
            gold=data.gold;document.getElementById('gold-count').textContent=gold;
            if(data.potions!==undefined){potions=data.potions;var potionBtn=document.getElementById('potion-btn');if(potionBtn)potionBtn.textContent='POTION('+potions+')';}
            if(data.hp!==undefined){hp=data.hp;maxHp=data.max_hp;updatePlayerHP();showFloatingPoints('+'+data.healed+' HP');}
            if(data.buff_def!==undefined)buffDef=data.buff_def;
            if(data.buff_gold!==undefined)buffGold=data.buff_gold;
            if(data.buff_crit!==undefined)buffCrit=data.buff_crit;
            if(data.buff_time!==undefined)buffTime=data.buff_time;
            refreshShopGold();updateShopBuffs();updateBuffIndicators();
            var names={'buy_potion':'HP Potion','buy_def_potion':'DEF Potion','buy_gold_potion':'Gold Potion','buy_crit_potion':'Crit Potion','buy_time_potion':'Time Potion'};
            var purchaseMessage=action==='buy_potion'?'HP Potion healed +'+data.healed+' HP! -'+cost+'g':'Bought '+(names[action]||'item')+'! -'+cost+'g';
            showToast(purchaseMessage,'success');
        } else if(data.status==='full_hp'){
            showToast('HP is already full!','info');
        } else { showToast('Not enough gold! Need '+cost+'g','error'); }
    });
}

function refreshShopGold(){
    var el=document.getElementById('shop-gold-display');if(el)el.textContent=gold;
}
function updateShopBuffs(){
    var el=document.getElementById('shop-buffs');if(!el)return;
    var parts=[];
    if(buffDef>0)parts.push('DEF: '+buffDef+' turns');
    if(buffGold>0)parts.push('GOLD: '+buffGold+' turns');
    if(buffCrit>0)parts.push('CRIT: '+buffCrit+' turns');
    if(buffTime>0)parts.push('TIME: '+buffTime+' turns');
    el.textContent=parts.length>0?'Active Buffs: '+parts.join(' | '):'No active buffs';
}
function updateBuffIndicators(){
    var container=document.querySelector('.buff-indicators');
    if(!container){
        container=document.createElement('div');container.className='buff-indicators';
        var hp_container=document.querySelector('.hp-bar-container');
        if(hp_container)hp_container.parentNode.insertBefore(container,hp_container.nextSibling);
    }
    container.innerHTML='';
    if(buffDef>0){var t=document.createElement('span');t.className='buff-tag def';t.textContent='DEF('+buffDef+')';container.appendChild(t);}
    if(buffGold>0){var t=document.createElement('span');t.className='buff-tag gold-buff';t.textContent='GOLD('+buffGold+')';container.appendChild(t);}
    if(buffCrit>0){var t=document.createElement('span');t.className='buff-tag crit';t.textContent='CRIT('+buffCrit+')';container.appendChild(t);}
    if(buffTime>0){var t=document.createElement('span');t.className='buff-tag time';t.textContent='TIME('+buffTime+')';container.appendChild(t);}
}

function showFloatingPoints(text){var el=document.createElement('div');el.className='float-points';el.textContent=text;el.style.left='50%';el.style.top='30%';document.body.appendChild(el);setTimeout(function(){el.remove();},1400);} 
function showFloatingDmg(text){var el=document.createElement('div');el.className='float-dmg';el.textContent=text;el.style.left='45%';el.style.top='25%';document.body.appendChild(el);setTimeout(function(){el.remove();},1400);} 
function showAbilityActivate(text){var el=document.createElement('div');el.className='ability-activate';el.textContent=text;el.style.left='20%';el.style.top='40%';document.body.appendChild(el);setTimeout(function(){el.remove();},1200);} 
function showToast(msg,type){document.querySelectorAll('.toast').forEach(function(t){t.remove();});var el=document.createElement('div');el.className='toast '+type;el.textContent=msg;document.body.appendChild(el);setTimeout(function(){el.remove();},2000);} 
function showLevelUp(lvl){var o=document.createElement('div');o.className='level-up-overlay';o.innerHTML='<div class="text">LEVEL UP!</div><div class="sub">Level '+lvl+' | +10 Max HP | +'+ATTACK_PER_LEVEL+' ATK</div>';document.body.appendChild(o);o.onclick=function(){o.remove();};setTimeout(function(){o.remove();},2500);} 
function showBossDefeat(){var o=document.createElement('div');o.className='boss-defeat-overlay';o.innerHTML='<div class="text">BOSS DEFEATED!</div><div class="sub">Floor '+floor_num+' unlocked!</div><div class="sub2">+25g | +1 Potion | HP Restored!</div>';document.body.appendChild(o);o.onclick=function(){o.remove();};setTimeout(function(){o.remove();},3000);} 
function showDeath(){
    playDeathSfx();
    submitLeaderboardScore();
    var o=document.createElement('div');
    o.className='death-overlay';
    o.innerHTML='<div class="text">YOU DIED</div>'+ 
        '<div class="sub">Score: '+score+' | Floor: '+floor_num+'</div>'+ 
        '<div class="sub2">Restart this floor and keep your progress.</div>'+ 
        '<div class="death-actions">'+
            '<button type="button" class="death-btn restart" onclick="restartAfterDeath()">RESTART GAME</button>'+ 
            '<button type="button" class="death-btn leaderboard" onclick="showLeaderboardFromDeath()">LEADERBOARDS</button>'+ 
            '<button type="button" class="death-btn home" onclick="returnToTitleFromDeath()">BACK TO HOME</button>'+ 
        '</div>';
    document.body.appendChild(o);
}

function closeDeathScreen(){
    var overlay=document.querySelector('.death-overlay');
    if(overlay)overlay.remove();
}

function restartAfterDeath(){
    closeDeathScreen();

    // Start a fresh attempt on the current floor while keeping saved progression.
    hp=maxHp;
    streak=0;
    wrongStreak=0;
    encounterCount=0;
    isBossFight=false;
    bossAttackCount=0;
    currentMonster=null;
    monsterHp=0;
    monsterMaxHp=0;
    monsterAttack=0;
    monsterDefense=0;
    syncUiFromState();
    updateSpeech('A new attempt begins!');
    saveState();
    spawnMonster();
    loadQuestion();
}

function showLeaderboardFromDeath(){
    closeDeathScreen();
    showLeaderboard();
}

function returnToTitleFromDeath(){
    closeDeathScreen();
    showScreen('title-screen');
}

function submitLeaderboardScore(){
    if(!playerUsername||score<=0)return;
    fetch('/api/leaderboard',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
            name:playerUsername,
            character:selectedChar?selectedChar.name:'',
            score:score,
            floor:floor_num,
            role:playerRole,
            yearLevel:playerYearLevel||'-',
            block:playerBlock||'-'
        })
    }).catch(function(err){console.error('submitLeaderboardScore failed:',err);});
}
function hideSpeechBubble(){
    var bubble=document.getElementById('speech-bubble');
    if(bubble)bubble.classList.add('combat-hidden');
}

function updateSpeech(text){
    var bubble=document.getElementById('speech-bubble');
    if(!bubble)return;
    bubble.textContent=text;
    bubble.classList.remove('combat-hidden');
}

function resetGame(){
    apiReset()
    .then(function(){
        questionNum=0;encounterCount=0;isBossFight=false;currentMonster=null;monsterHp=0;monsterMaxHp=0;monsterAttack=0;monsterDefense=0;bossAttackCount=0;
        syncUiFromState();
        document.getElementById('floor-title').textContent='FLOOR '+floor_num;
        var progEl=document.getElementById('lex-progress-fill');if(progEl)progEl.style.width='5%';
        updatePlayerHP();updateBuffIndicators();updateSpeech('New dungeon run!');spawnMonster();loadQuestion();
    });
}

// ===== 18. KEYBOARD, PAGE LIFECYCLE, AND ACCOUNT INPUT EVENTS =====
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
    if(answered&&(e.key==='Enter'||e.key===' ')){e.preventDefault();nextAction();return;}
    if(!answered&&currentQuestion){var map={'a':0,'b':1,'c':2,'d':3,'1':0,'2':1,'3':2,'4':3};var idx=map[e.key.toLowerCase()];if(idx!==undefined)selectAnswer(idx);} 
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
    if(e.target && (e.target.id==='username-input' || e.target.id==='password-input' || e.target.id==='role-select' || e.target.id==='year-level-select' || e.target.id==='block-select')){
        updateAddUserState();
        updateEnterButtonState();
    }
});

// ===== 19. LEADERBOARD =====
function showLeaderboard(){
    showScreen('leaderboard-screen');
    renderLeaderboard();
}

function renderLeaderboard(){
    var container=document.getElementById('leaderboard-list');
    if(!container)return;
    container.innerHTML='<div class="admin-empty">Loading leaderboard...</div>';
    fetch('/api/leaderboard')
    .then(function(res){return res.json();})
    .then(function(data){
        var rows=(data&&data.status==='ok'&&Array.isArray(data.leaderboard))?data.leaderboard:[];
        container.innerHTML='';
        if(!rows.length){container.innerHTML='<div class="admin-empty">No scores yet - be the first!</div>';return;}
        rows.forEach(function(player){
            var row=document.createElement('div');
            row.className='leaderboard-row';
            if(player.rank<=3)row.classList.add('rank-'+player.rank);
            var medal=player.rank===1?'🥇':player.rank===2?'🥈':player.rank===3?'🥉':player.rank;
            row.innerHTML='<div class="col rank">'+medal+'</div>'+
                          '<div class="col name">'+escapeHtml(player.name)+'</div>'+
                          '<div class="col character">'+escapeHtml(player.character)+'</div>'+
                          '<div class="col role">'+escapeHtml(player.role)+'</div>'+
                          '<div class="col score">'+player.score+'</div>'+
                          '<div class="col floor">Lv '+player.floor+'</div>';
            container.appendChild(row);
        });
    })
    .catch(function(err){
        console.error('renderLeaderboard failed:',err);
        container.innerHTML='<div class="admin-empty">Failed to load leaderboard.</div>';
    });
}

// ===== 20. APPLICATION STARTUP =====
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







