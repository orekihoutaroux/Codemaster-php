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
