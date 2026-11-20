// ===== HOME: ANIMATED BACKGROUND (DAY AND NIGHT) =====
// A pixel-art valley behind the home page that goes through a full day:
//   sunrise -> day -> sunset -> night -> sunrise ...
// One full day takes CYCLE_SECONDS and starts at the player's real time of
// day (open the game at 8 pm and it is evening).
//
// What changes with the time of day:
//   sky colours, mountains, castle and ground (4 painted versions that fade
//   into each other), the sun and moon moving across the sky, clouds, birds by
//   day and bats by night, stars, shooting stars and the aurora at night,
//   lit castle windows, fireflies, fog colour.
// Always there: floating bits of PHP code, embers from the dungeon, flags.
//
// The scene is drawn on one small canvas and scaled up with sharp pixels.
// The static layers are painted once per resize; clouds, aurora and fog are
// repainted about 8 times a second; the rest moves every frame (~30 fps,
// only while the home page is shown).
//
// The same scene is the background of the login/register, choose-hero,
// How to Play and Study Materials screens too, a little dimmer there
// (SCENE_SCREENS below; the dimming is in css/screens/home-refresh.css).
// The canvas is moved to <body> so it stays put while those screens change.
//
// For testing: setHomeTimeOfDay(0.5) pins noon (0 = midnight, 0.25 = sunrise,
// 0.75 = sunset); setHomeTimeOfDay(null) lets the day run again.
(function(){
'use strict';
var CYCLE_SECONDS=120;
var canvas,ctx,W=0,H=0,P=4,sets=null,castle=null,stars=[],glyphs=[],embers=[],fireflies=[],clouds=[],flyers=[],shooting=null,animId=null,last=0;
var mouse={x:0,y:0,tx:0,ty:0};
var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- time of day ----------
// Screens that show this scene: 'home' = full brightness, 'dim' = dimmer.
var SCENE_SCREENS={'title-screen':'home','add-user-screen':'dim','select-screen':'dim','tutorial-screen':'dim','learn-screen':'dim'};
var sceneMode='';
function activeSceneMode(){
    for(var id in SCENE_SCREENS){var el=document.getElementById(id);if(el&&el.classList.contains('active'))return SCENE_SCREENS[id];}
    return '';
}
// body[data-scene-bg] shows the canvas (home or dim); no attribute hides it.
function setSceneMode(mode){
    if(mode===sceneMode)return;
    sceneMode=mode;
    if(mode)document.body.setAttribute('data-scene-bg',mode);else document.body.removeAttribute('data-scene-bg');
}

var clockStart=performance.now();
var startPhase=(function(){var d=new Date();return (d.getHours()+d.getMinutes()/60)/24;})();
var pinnedPhase=null;
function currentPhase(now){
    if(pinnedPhase!==null)return pinnedPhase;
    var p=startPhase+(now-clockStart)/1000/CYCLE_SECONDS;
    return p-Math.floor(p);
}

// Seeded random so the mountains and castle look the same every visit.
var seed=7;
function rand(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
function rnd(a,b){return a+Math.random()*(b-a);}
function hash(n){var x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);}

// 4x4 ordered dither: lets two colours blend in a pixel-art way.
var BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function dither(x,y,t){return t*16>BAYER[(y&3)*4+(x&3)]+0.5;}

function hex(c){var n=parseInt(c.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];}
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t|0,a[1]+(b[1]-a[1])*t|0,a[2]+(b[2]-a[2])*t|0];}
function rgb(c){return 'rgb('+c[0]+','+c[1]+','+c[2]+')';}

// ---------- palettes ----------
// Four looks for the valley. Numbers are amounts from 0 to 1.
var PALETTES={
    night:{
        sky:['#05051a','#0f0d33','#23164a','#3c1d4f','#1a0f2c'],
        far:['#16153d','#2c2a66'],mid:['#0f0e2c','#24224f'],near:['#08071a','#17153a','#050412'],snow:['#d2dcff',0.35],
        castle:{wall:'#0b0a1c',edge:'#1d1a40',roof:'#14112f',hill:'#0a0919',gate:'#050510',tower:'#0d0c22',pole:'#2a2440'},
        ground:{base:'#07060f',path:'#120f22',pathAmt:0.35,grass:['#0e1a1a','#0b1214'],flowers:['#0e1a1a','#0b1214','#101a20']},
        fog:['#5a5d9e','#6b3d7a','#3d4a8a'],fogA:1,
        cloud:['#2c2b5a','#1b1a40'],cloudA:0.5,
        light:0,stars:1,aurora:1,lamps:1,birds:0,bats:1,fireflies:1,embers:1,glyphDay:0,veil:1
    },
    dawn:{
        sky:['#262a66','#4f4a8e','#b46a96','#f59a7a','#ffd29a'],
        far:['#6a5488','#ffb08a'],mid:['#463463','#e08a86'],near:['#2a1f45','#7a5070','#1d1636'],snow:['#ffd6d0',0.55],
        castle:{wall:'#241c3c',edge:'#f0a07a',roof:'#3a2650',hill:'#1e1834',gate:'#0c0a18',tower:'#2a2244',pole:'#4a3a5a'},
        ground:{base:'#1a1428',path:'#3a2840',pathAmt:0.4,grass:['#2e3a40','#243038'],flowers:['#6a3a5a','#7a6040','#5a4a6a']},
        fog:['#f0b0c8','#d898b8','#b8a8e0'],fogA:0.8,
        cloud:['#ffd0c4','#c97fa6'],cloudA:0.9,
        light:0.55,stars:0.3,aurora:0.15,lamps:0.5,birds:0.5,bats:0.2,fireflies:0.2,embers:0.6,glyphDay:0.4,veil:0.8
    },
    day:{
        sky:['#2f6fd0','#4f95e6','#7fbdf2','#b6e0f8','#dff3f7'],
        far:['#8fb0d6','#c3d8ee'],mid:['#4d7d86','#7fb3ad'],near:['#2e5a3a','#4c8a4a','#1f4a2c'],snow:['#ffffff',0.9],
        castle:{wall:'#6f6c8a',edge:'#c9c6e0',roof:'#9a3d52',hill:'#4a7a3e',gate:'#2a2235',tower:'#67647f',pole:'#4a4560'},
        ground:{base:'#3d6b34',path:'#9a8a5c',pathAmt:0.55,grass:['#62a64a','#4f8f3d'],flowers:['#ff6b8b','#ffd43b','#ffffff']},
        fog:['#ffffff','#eaf6ff','#ffffff'],fogA:0.55,
        cloud:['#ffffff','#cfe2f4'],cloudA:0.95,
        light:1,stars:0,aurora:0,lamps:0,birds:1,bats:0,fireflies:0,embers:0.35,glyphDay:1,veil:0.55
    },
    dusk:{
        sky:['#1a1a4a','#3e2a6a','#9a3f6e','#ec7448','#ffb45a'],
        far:['#583468','#ffa060'],mid:['#3a2150','#e0704f'],near:['#1f1233','#6a3048','#160c26'],snow:['#ffc4a0',0.55],
        castle:{wall:'#1a1228',edge:'#ff9a5a',roof:'#2a1838',hill:'#170f24',gate:'#08060f',tower:'#1f1630',pole:'#3a2a40'},
        ground:{base:'#140c1c',path:'#33202c',pathAmt:0.4,grass:['#2c2030','#221a28'],flowers:['#5a2a3a','#6a4030','#4a2a4a']},
        fog:['#ff9878','#c86a90','#8a5aa8'],fogA:0.8,
        cloud:['#ffb07a','#a8506e'],cloudA:0.9,
        light:0.5,stars:0.35,aurora:0.2,lamps:0.8,birds:0.4,bats:0.4,fireflies:0.5,embers:0.8,glyphDay:0.3,veil:0.85
    }
};
var LOOKS=['night','dawn','day','dusk'];
// Where each look is reached during the day (0 = midnight, 0.5 = noon).
var TIMELINE=[[0,'night'],[0.19,'night'],[0.26,'dawn'],[0.33,'day'],[0.67,'day'],[0.74,'dusk'],[0.81,'night'],[1,'night']];
// The sun is up from SUN_UP to SUN_DOWN; the moon the same, half a day later.
var SUN_UP=0.15,SUN_DOWN=0.85;

function sceneAt(p){
    for(var i=0;i<TIMELINE.length-1;i++){
        var a=TIMELINE[i],b=TIMELINE[i+1];
        if(p<=b[0]){
            var t=(p-a[0])/(b[0]-a[0]);t=t*t*(3-2*t);
            return {a:a[1],b:b[1],t:a[1]===b[1]?0:t};
        }
    }
    return {a:'night',b:'night',t:0};
}
function amount(s,name){return PALETTES[s.a][name]*(1-s.t)+PALETTES[s.b][name]*s.t;}
function blend(s,ca,cb){return mix(hex(ca),hex(cb),s.t);}

// Tiny 3x5 font for the floating code.
var FONT={
    '$':['.##','##.','.#.','.##','##.'],'{':['.##','.#.','#..','.#.','.##'],'}':['##.','.#.','..#','.#.','##.'],
    ';':['...','.#.','...','.#.','#..'],'<':['..#','.#.','#..','.#.','..#'],'>':['#..','.#.','..#','.#.','#..'],
    '?':['##.','..#','.#.','...','.#.'],'(':['.#.','#..','#..','#..','.#.'],')':['.#.','..#','..#','..#','.#.'],
    '=':['...','###','...','###','...'],'p':['...','##.','#.#','##.','#..'],'h':['#..','#..','##.','#.#','#.#'],
    '[':['##.','#..','#..','#..','##.'],']':['.##','..#','..#','..#','.##'],'/':['..#','..#','.#.','#..','#..']
};
var SNIPPETS=['$','{}',';','<?php','()','=>','[]','?>','$x','//'];
function textWidth(s){return s.length*4-1;}
function drawText(s,x,y,color,alpha){
    ctx.globalAlpha=alpha;ctx.fillStyle=color;
    for(var i=0;i<s.length;i++){
        var rows=FONT[s.charAt(i)];if(!rows)continue;
        for(var r=0;r<5;r++)for(var c=0;c<3;c++)if(rows[r].charAt(c)==='#')ctx.fillRect(x+i*4+c,y+r,1,1);
    }
    ctx.globalAlpha=1;
}
function circle(cx,cy,r){for(var y=-r;y<=r;y++){var w=Math.round(Math.sqrt(r*r-y*y));ctx.fillRect(cx-w,cy+y,w*2+1,1);}}

// ---------- static layers (painted once per look) ----------
function makeLayer(w){var c=document.createElement('canvas');c.width=w||W;c.height=H;return c;}

function paintSky(colors){
    var c=makeLayer(),g=c.getContext('2d'),img=g.createImageData(W,H),d=img.data;
    var pos=[0,0.38,0.62,0.8,1],stops=colors.map(function(col,i){return [pos[i],hex(col)];});
    for(var y=0;y<H;y++){
        var v=y/H,i=0;while(i<stops.length-2&&v>stops[i+1][0])i++;
        var a=stops[i],b=stops[i+1],t=(v-a[0])/(b[0]-a[0]);
        var band=Math.floor(t*6)/6,next=Math.min(1,band+1/6),f=(t-band)*6; // 6 bands per stop, dithered edges
        for(var x=0;x<W;x++){
            var col=mix(a[1],b[1],dither(x,y,f)?next:band),o=(y*W+x)*4;
            d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255;
        }
    }
    g.putImageData(img,0,0);
    return c;
}

// A ridge line made from a few layered sine waves.
function ridge(base,amp,freqs,phase){
    var ys=[];
    for(var x=0;x<W+40;x++){
        var y=base;
        for(var i=0;i<freqs.length;i++)y-=Math.sin((x+phase*(i+1)*37)/freqs[i][0])*amp*freqs[i][1];
        ys.push(Math.round(y));
    }
    return ys;
}
function paintMountains(base,amp,colors,snow,freqs,phase,withTrees){
    var c=makeLayer(W+40),g=c.getContext('2d');
    var ys=ridge(base,amp,freqs,phase);
    g.fillStyle=colors[0];
    for(var x=0;x<ys.length;x++)g.fillRect(x,ys[x],1,H-ys[x]);
    // lit rim on the slopes that face the light (to the right)
    g.fillStyle=colors[1];
    for(x=1;x<ys.length;x++)if(ys[x]<ys[x-1]||ys[x]===ys[x-1]&&x%3===0)g.fillRect(x,ys[x],1,1);
    // snow caps on the highest peaks
    var sc=hex(snow[0]);g.fillStyle='rgba('+sc[0]+','+sc[1]+','+sc[2]+','+snow[1]+')';
    var top=Math.min.apply(null,ys);
    for(x=1;x<ys.length-1;x++)if(ys[x]<top+amp*0.22){g.fillRect(x,ys[x],1,2);}
    // pine trees along the nearest ridge
    if(withTrees){
        var u=Math.max(1,Math.round(Math.min(W,H)/170));
        for(x=3;x<ys.length-3;x+=3+Math.floor(hash(x)*10)){
            var th=Math.round((5+hash(x+7)*7)*u),tx=x,ty=ys[x]+1;
            g.fillStyle=colors[2];
            for(var i=0;i<th;i++){var hw=Math.floor(i/2.4);g.fillRect(tx-hw,ty-th+i,hw*2+1,1);}
            g.fillRect(tx,ty,1,u+1);
            g.fillStyle=colors[1];
            for(i=2;i<th;i+=3)g.fillRect(tx+Math.floor(i/2.4),ty-th+i,1,1);
        }
    }
    return c;
}

// The castle stands on a hill on the left; a watchtower on the right.
function paintCastle(pal){
    var c=makeLayer(),g=c.getContext('2d');
    var portrait=H>W;
    var gy=Math.round(H*(portrait?0.83:0.8)),cx=Math.round(W*(portrait?0.18:0.14)),u=Math.max(1,Math.round(Math.min(W,H)/(portrait?120:150)));
    var windows=[],flags=[];
    function block(x,y,w,h){g.fillStyle=pal.wall;g.fillRect(x,y,w,h);g.fillStyle=pal.edge;g.fillRect(x,y,w,1);g.fillRect(x+w-1,y,1,h);}
    function crenels(x,y,w){g.fillStyle=pal.wall;for(var i=0;i<w;i+=3*u)g.fillRect(x+i,y-2*u,2*u,2*u);}
    function tower(x,w,h,roof){
        block(x,gy-h,w,h);
        if(roof){
            g.fillStyle=pal.roof;
            for(var i=0;i<w/2+u;i++)g.fillRect(x-u+i,gy-h-i,w+2*u-2*i,1);
            g.fillStyle=pal.edge;
            for(i=0;i<w/2+u;i++)g.fillRect(x+w+u-i-1,gy-h-i,1,1);
            flags.push({x:x+Math.floor(w/2),y:gy-h-Math.floor(w/2)-u*2});
        }else crenels(x,gy-h,w);
        for(var k=0;k<Math.floor(h/(9*u))-1;k++)windows.push({x:x+Math.floor(w/2)-u,y:gy-h+6*u+k*9*u,w:2*u,h:3*u,ph:rand()*6.3,warm:rand()>0.25});
    }
    // the hill it stands on
    g.fillStyle=pal.hill;
    for(var x=0;x<W;x++){var d=(x-cx)/(30*u),y=gy+Math.round(d*d*6*u)-u;if(y<H)g.fillRect(x,y,1,H-y);}
    var wallW=34*u;
    block(cx-wallW/2,gy-12*u,wallW,12*u);crenels(cx-wallW/2,gy-12*u,wallW);
    tower(cx-wallW/2-5*u,10*u,22*u,true);
    tower(cx+wallW/2-5*u,10*u,22*u,true);
    tower(cx-6*u,12*u,36*u,true);   // keep
    g.fillStyle=pal.gate;g.fillRect(cx-2*u,gy-6*u,4*u,6*u);
    for(var i=0;i<3;i++)windows.push({x:Math.round(cx-wallW/2+wallW*(0.18+i*0.3)),y:gy-8*u,w:2*u,h:2*u,ph:rand()*6.3,warm:rand()>0.3});
    // a lone watchtower far away on the other side
    var tx=Math.round(W*(portrait?0.86:0.88)),th=20*u,tw=6*u,ty=Math.round(H*(portrait?0.8:0.74));
    g.fillStyle=pal.tower;g.fillRect(tx,ty-th,tw,th);
    g.fillStyle=pal.edge;g.fillRect(tx+tw-1,ty-th,1,th);
    g.fillStyle=pal.roof;for(var j=0;j<tw/2+u;j++)g.fillRect(tx-u+j,ty-th-j,tw+2*u-2*j,1);
    windows.push({x:tx+Math.floor(tw/2)-u,y:ty-th+5*u,w:2*u,h:3*u,ph:1.3,warm:true});
    return {canvas:c,windows:windows,flags:flags,unit:u,ground:gy};
}

function paintGround(pal){
    var c=makeLayer(),g=c.getContext('2d'),gy=Math.round(H*(H>W?0.88:0.86));
    g.fillStyle=pal.base;g.fillRect(0,gy,W,H-gy);
    // a path toward the dungeon in the middle
    g.fillStyle=pal.path;
    for(var y=gy;y<H;y++){
        var t=(y-gy)/(H-gy),half=Math.round(4+t*W*0.16);
        for(var x=Math.round(W/2-half);x<W/2+half;x++)if(dither(x,y,pal.pathAmt*(1-t*0.5)))g.fillRect(x,y,1,1);
    }
    // grass tufts along the horizon
    for(x=0;x<W;x+=2){
        var h=Math.floor(rand()*3);
        g.fillStyle=rand()>0.5?pal.grass[0]:pal.grass[1];
        if(h)g.fillRect(x,gy-h,1,h);
    }
    // little flowers in the grass (bright by day, dark at night)
    var n=Math.round(W/5);
    for(var i=0;i<n;i++){
        var fx=Math.floor(rand()*W),fy=gy+1+Math.floor(rand()*(H-gy)*0.7),k=Math.floor(rand()*3);
        if(Math.abs(fx-W/2)<8+(fy-gy)/(H-gy)*W*0.16)continue; // not on the path
        g.fillStyle=pal.flowers[k];g.fillRect(fx,fy,1,1);
        g.fillStyle=pal.grass[1];g.fillRect(fx,fy+1,1,1);
    }
    return c;
}

function paintLook(name){
    var pal=PALETTES[name];
    seed=7; // same shapes for every look
    var cs=paintCastle(pal.castle);
    if(!castle)castle=cs;
    return {
        sky:paintSky(pal.sky),
        far:paintMountains(H*0.6,H*0.12,pal.far,pal.snow,[[47,1],[19,0.35]],1,false),
        mid:paintMountains(H*0.68,H*0.09,pal.mid,pal.snow,[[33,1],[13,0.4]],2,false),
        castle:cs.canvas,
        near:paintMountains(H*0.85,H*0.045,pal.near,['#ffffff',0],[[21,1],[9,0.5]],3,true),
        ground:paintGround(pal.ground)
    };
}

function buildScene(){
    castle=null;sets={};
    LOOKS.forEach(function(name){sets[name]=paintLook(name);});
    stars=[];
    var n=Math.round(W*H/260);
    for(var i=0;i<n;i++)stars.push({x:Math.random()*W,y:Math.random()*H*0.62,s:Math.random()<0.12?2:1,ph:Math.random()*6.3,sp:rnd(0.6,2.2),c:['#ffffff','#c8d4ff','#ffe9a8','#a9b8ff'][i%4]});
    glyphs=[];
    for(i=0;i<Math.max(8,Math.round(W/34));i++)glyphs.push(newGlyph(true));
    embers=[];
    for(i=0;i<Math.max(10,Math.round(W/22));i++)embers.push(newEmber(true));
    fireflies=[];
    for(i=0;i<Math.max(8,Math.round(W/18));i++)fireflies.push({x:rnd(0,W),y:rnd(H*0.8,H*0.97),ph:rnd(0,6.3),sp:rnd(1.2,2.6),dr:rnd(0,6.3)});
    clouds=[];
    var cn=Math.max(4,Math.round(W/55));
    for(i=0;i<cn;i++)clouds.push(newCloud(i,cn));
    flyers=[];
}
function newGlyph(anywhere){
    var s=SNIPPETS[Math.floor(Math.random()*SNIPPETS.length)],k=Math.floor(Math.random()*4);
    return {s:s,x:rnd(0,W-textWidth(s)),y:anywhere?rnd(H*0.15,H):H+rnd(0,40),v:rnd(2.5,6),drift:rnd(0,6.3),
        night:hex(['#5ef2c3','#f5c842','#ff6b8b','#9fb4ff'][k]),day:hex(['#1d6e5a','#8a6410','#a33050','#2f4a9a'][k]),life:rnd(0.35,0.7)};
}
function newEmber(anywhere){
    return {x:rnd(W*0.2,W*0.8),y:anywhere?rnd(H*0.4,H):H+rnd(0,10),v:rnd(6,14),ph:rnd(0,6.3),c:Math.random()>0.5?'#ffb12b':'#ff6a2a'};
}
// A cloud is a row of round puffs with a flat bottom.
function newCloud(i,count){
    var u=Math.max(1,Math.round(Math.min(W,H)/150)),puffs=[],n=3+Math.floor(Math.random()*3),x=0;
    for(var k=0;k<n;k++){
        var r=Math.round(rnd(3,6)*u*(k===0||k===n-1?0.75:1));
        puffs.push({dx:x+r,dy:-Math.round(r*0.55)-(k%2?u:0),r:r});
        x+=Math.round(r*1.35);
    }
    var w=x+Math.round(4*u);
    return {x0:(i/count)*(W+w*2)+rnd(-20,20),y:Math.round(rnd(H*0.08,H*(H>W?0.32:0.42))),v:rnd(1.5,4),w:w,puffs:puffs,base:Math.round(u*1.5)};
}

// ---------- sun and moon ----------
// Both travel the same arc from the left horizon to the right one; the sun
// by day and the moon by night. They move a little slower near the horizon
// (so sunrise and sunset last) and faster past the logo at the top.
function arcPos(a,ox,oy){
    var portrait=H>W,e=a-0.1*Math.sin(2*Math.PI*a)/(2*Math.PI);
    var top=H*(portrait?0.05:0.07),horizon=H*0.7;
    // fade in just after rising and out just before setting
    return {x:Math.round(W*(0.06+0.88*e)+ox*0.2),y:Math.round(horizon-Math.sin(e*Math.PI)*(horizon-top)+oy*0.2),h:Math.sin(e*Math.PI),fade:Math.max(0,Math.min(1,a/0.06,(1-a)/0.06))};
}
function bodyRadius(){return Math.max(6,Math.round(Math.min(W,H)*(H>W?0.085:0.065)));}
var bodies=[];

function drawSun(p,t,ox,oy){
    var a=(p-SUN_UP)/(SUN_DOWN-SUN_UP);if(a<=0||a>=1)return;
    var pos=arcPos(a,ox,oy),r=bodyRadius(),warm=Math.max(0,1-pos.h/0.55);
    var x=pos.x,y=pos.y;
    bodies.push({x:x,y:y,r:r*2});
    var glow=mix(hex('#fff1a8'),hex('#ff8a4a'),warm),disc=mix(hex('#ffd23f'),hex('#ff7a3d'),warm),core=mix(hex('#fff8d6'),hex('#ffc27a'),warm);
    // soft glow, wider when the sun is low
    ctx.fillStyle=rgb(glow);
    for(var ring=4;ring>=1;ring--){ctx.globalAlpha=(0.05+0.04*warm)*pos.fade;circle(x,y,r+ring*Math.round(r*(0.5+0.45*warm)));}
    // slowly turning rays
    ctx.globalAlpha=0.55*(1-warm*0.7)*pos.fade;
    for(var k=0;k<12;k++){
        var ang=t*0.12+k*Math.PI/6,len=Math.round(r*(k%2?0.35:0.65));
        for(var d=r+2;d<r+2+len;d++)ctx.fillRect(Math.round(x+Math.cos(ang)*d),Math.round(y+Math.sin(ang)*d),1,1);
    }
    ctx.globalAlpha=pos.fade;
    ctx.fillStyle=rgb(disc);circle(x,y,r);
    ctx.fillStyle=rgb(core);circle(x-Math.round(r*0.12),y-Math.round(r*0.12),Math.round(r*0.7));
    ctx.fillStyle='rgba(255,255,255,0.8)';ctx.fillRect(x-Math.round(r*0.45),y-Math.round(r*0.45),Math.max(1,Math.round(r*0.18)),Math.max(1,Math.round(r*0.18)));
    ctx.globalAlpha=1;
}

function drawMoon(p,t,ox,oy){
    var q=p+0.5;q-=Math.floor(q);
    var a=(q-SUN_UP)/(SUN_DOWN-SUN_UP);if(a<=0||a>=1)return;
    var pos=arcPos(a,ox,oy),r=bodyRadius(),mx=pos.x,my=pos.y;
    bodies.push({x:mx,y:my,r:r*2});
    for(var ring=3;ring>=1;ring--){
        ctx.globalAlpha=(0.05+0.02*Math.sin(t*0.8))*pos.fade;ctx.fillStyle='#c9c4ff';
        circle(mx,my,r+ring*Math.round(r*0.45));
    }
    ctx.globalAlpha=pos.fade;ctx.fillStyle='#f4eedb';circle(mx,my,r);
    ctx.fillStyle='#d9d1b8';circle(mx+Math.round(r*0.3),my-Math.round(r*0.2),Math.max(1,Math.round(r*0.22)));
    circle(mx-Math.round(r*0.35),my+Math.round(r*0.25),Math.max(1,Math.round(r*0.16)));
    circle(mx+Math.round(r*0.1),my+Math.round(r*0.45),Math.max(1,Math.round(r*0.1)));
    // shaded edge
    ctx.fillStyle='rgba(120,110,170,0.35)';
    for(var y=-r;y<=r;y++){var w=Math.round(Math.sqrt(r*r-y*y));ctx.fillRect(mx-w,my+y,Math.max(1,Math.round(w*0.35)),1);}
    ctx.globalAlpha=1;
}

// ---------- moving parts ----------
function drawAurora(t,strength){
    // Curtains of light: each column fades in, peaks and fades out (4 steps).
    var bands=[{y:0.1,a:0.3,c:'#3ff2b5',sp:0.22,len:70,h:0.16},{y:0.16,a:0.2,c:'#8a7bff',sp:0.15,len:110,h:0.12},{y:0.07,a:0.13,c:'#ff5d9e',sp:0.3,len:55,h:0.09}];
    var steps=[0.25,0.6,1,0.45];
    for(var b=0;b<bands.length;b++){
        var band=bands[b];ctx.fillStyle=band.c;
        for(var x=0;x<W;x++){
            var wave=Math.sin(x/band.len+t*band.sp)*H*0.04+Math.sin(x/(band.len*0.41)-t*band.sp*1.6)*H*0.012;
            var top=Math.round(H*band.y+wave);
            var h=Math.max(4,Math.round(H*band.h*(0.7+0.3*Math.sin(x/19+t*0.5+b))));
            var fade=Math.pow(Math.sin(Math.min(1,x/W)*Math.PI),1.5)*(0.65+0.35*Math.sin(t*0.6+x/31+b*2))*strength;
            if(fade<0.05)continue;
            var seg=Math.ceil(h/steps.length);
            for(var k=0;k<steps.length;k++){
                ctx.globalAlpha=band.a*fade*steps[k];
                ctx.fillRect(x,top+k*seg,1,seg);
            }
        }
    }
    ctx.globalAlpha=1;
}

function drawStars(t,ox,oy,strength){
    if(strength>0.02){
        for(var i=0;i<stars.length;i++){
            var s=stars[i],tw=0.45+0.55*Math.sin(t*s.sp+s.ph);
            if(tw<0.15)continue;
            ctx.globalAlpha=tw*strength;ctx.fillStyle=s.c;
            var x=Math.round(s.x+ox*0.1),y=Math.round(s.y+oy*0.1);
            ctx.fillRect(x,y,s.s,s.s);
            if(s.s>1&&tw>0.92){ctx.globalAlpha=0.5*strength;ctx.fillRect(x-1,y,4,1);ctx.fillRect(x,y-1,1,4);}
        }
        ctx.globalAlpha=1;
    }
    // a shooting star every few seconds, only when it is properly dark
    if(!shooting&&strength>0.7&&Math.random()<0.006)shooting={x:rnd(W*0.1,W*0.7),y:rnd(0,H*0.25),vx:rnd(90,140),vy:rnd(30,55),life:0};
    if(shooting){
        shooting.life+=1/30;
        var hx=shooting.x+shooting.vx*shooting.life,hy=shooting.y+shooting.vy*shooting.life;
        for(var k=0;k<14;k++){
            ctx.globalAlpha=Math.max(0,(1-k/14)*(1-shooting.life/0.9));ctx.fillStyle=k<2?'#ffffff':'#bcd0ff';
            ctx.fillRect(Math.round(hx-shooting.vx*k/160),Math.round(hy-shooting.vy*k/160),1,1);
        }
        ctx.globalAlpha=1;
        if(shooting.life>0.9)shooting=null;
    }
}

function drawClouds(t,s){
    var alpha=amount(s,'cloudA');
    var body=rgb(blend(s,PALETTES[s.a].cloud[0],PALETTES[s.b].cloud[0]));
    var shade=rgb(blend(s,PALETTES[s.a].cloud[1],PALETTES[s.b].cloud[1]));
    ctx.globalAlpha=alpha;
    for(var i=0;i<clouds.length;i++){
        var c=clouds[i],span=W+c.w*2,x=Math.round(((c.x0+c.v*t)%span+span)%span-c.w),y=c.y;
        // shadow underneath, then the bright body, with a flat bottom edge
        ctx.fillStyle=shade;
        for(var k=0;k<c.puffs.length;k++)puff(x+c.puffs[k].dx,y+c.puffs[k].dy+c.base,c.puffs[k].r,y+c.base);
        ctx.fillStyle=body;
        for(k=0;k<c.puffs.length;k++)puff(x+c.puffs[k].dx,y+c.puffs[k].dy,c.puffs[k].r,y);
    }
    ctx.globalAlpha=1;
}
function puff(cx,cy,r,bottom){
    for(var y=-r;y<=r;y++){
        if(cy+y>bottom)break;
        var w=Math.round(Math.sqrt(r*r-y*y));ctx.fillRect(cx-w,cy+y,w*2+1,1);
    }
}

// Birds fly across by day in small V flocks; bats flutter about at night.
var BIRD=[['#...#','.#.#.','..#..'],['.....','#####','..#..']];
var BAT=[['#.....#','##.#.##','.#####.','...#...'],['...#...','.#####.','##...##','#.....#']];
function sprite(rows,x,y){
    for(var r=0;r<rows.length;r++)for(var c=0;c<rows[r].length;c++)if(rows[r].charAt(c)==='#')ctx.fillRect(x+c,y+r,1,1);
}
function updateFlyers(dt,t,s){
    var birds=amount(s,'birds'),bats=amount(s,'bats');
    if(flyers.length<3&&Math.random()<0.004){
        var dir=Math.random()>0.5?1:-1,startX=dir>0?-12:W+12;
        if(bats>birds){
            flyers.push({kind:'bat',x:startX,y0:rnd(H*0.18,H*0.5),dir:dir,v:rnd(16,26),ph:rnd(0,6.3),amp:rnd(4,10)});
        }else if(birds>0.2){
            var y0=rnd(H*0.12,H*0.38),n=3+Math.floor(Math.random()*3),v=rnd(12,18);
            for(var i=0;i<n;i++){
                var side=i===0?0:(i%2?1:-1)*Math.ceil(i/2);
                flyers.push({kind:'bird',x:startX-dir*Math.abs(side)*7,y0:y0+Math.abs(side)*4+side*0,dir:dir,v:v,ph:i*0.7,amp:1.5});
            }
        }
    }
    for(var k=flyers.length-1;k>=0;k--){
        var f=flyers[k];
        f.x+=f.dir*f.v*dt;
        var y=Math.round(f.y0+Math.sin(t*(f.kind==='bat'?3:1.2)+f.ph)*f.amp);
        if(f.x<-20||f.x>W+20){flyers.splice(k,1);continue;}
        var a=f.kind==='bat'?bats:birds;
        if(a<0.03)continue;
        ctx.globalAlpha=Math.min(1,a*1.2);
        if(f.kind==='bat'){ctx.fillStyle='#0a0814';sprite(BAT[Math.floor(t*9+f.ph)%2],Math.round(f.x)-3,y);}
        else{ctx.fillStyle='#1e2238';sprite(BIRD[Math.floor(t*5+f.ph)%2],Math.round(f.x)-2,y);}
    }
    ctx.globalAlpha=1;
}

function drawCastleLife(t,ox,s){
    var cs=castle,u=cs.unit,lamps=amount(s,'lamps');
    var dark=rgb(blend(s,PALETTES[s.a].castle.gate,PALETTES[s.b].castle.gate));
    var pole=rgb(blend(s,PALETTES[s.a].castle.pole,PALETTES[s.b].castle.pole));
    for(var i=0;i<cs.windows.length;i++){
        var w=cs.windows[i];
        ctx.globalAlpha=1;ctx.fillStyle=dark;ctx.fillRect(w.x+ox,w.y,w.w,w.h);
        if(lamps<0.03)continue;
        var f=0.65+0.35*Math.sin(t*3+w.ph)+(Math.sin(t*11+w.ph*3)>0.96?-0.4:0);
        ctx.globalAlpha=Math.max(0.2,f)*lamps;
        ctx.fillStyle=w.warm?'#ffb347':'#7fd6ff';
        ctx.fillRect(w.x+ox,w.y,w.w,w.h);
        ctx.globalAlpha=0.12*f*lamps;ctx.fillRect(w.x+ox-u,w.y-u,w.w+2*u,w.h+2*u);
    }
    ctx.globalAlpha=1;
    for(i=0;i<cs.flags.length;i++){
        var fl=cs.flags[i],wave=Math.floor(t*4+i)%2;
        ctx.fillStyle=pole;ctx.fillRect(fl.x+ox,fl.y-6*u,u,6*u);
        ctx.fillStyle=i===cs.flags.length-1?'#e94560':'#f5c842';
        ctx.fillRect(fl.x+ox+u,fl.y-6*u,4*u,2*u);
        ctx.fillRect(fl.x+ox+u+4*u,fl.y-6*u+wave*u,2*u,2*u-wave*u||u);
    }
}

function drawGlyphs(dt,t,s){
    var day=amount(s,'glyphDay');
    for(var i=0;i<glyphs.length;i++){
        var g=glyphs[i];
        g.y-=g.v*dt;
        var x=Math.round(g.x+Math.sin(t*0.6+g.drift)*4),y=Math.round(g.y);
        var fade=Math.min(1,(H-g.y)/(H*0.25))*Math.min(1,(g.y-H*0.08)/(H*0.2));
        var hidden=false;
        for(var b=0;b<bodies.length;b++)if(Math.abs(x-bodies[b].x)<bodies[b].r&&Math.abs(y-bodies[b].y)<bodies[b].r)hidden=true;
        if(fade>0&&!hidden)drawText(g.s,x,y,rgb(mix(g.night,g.day,day)),g.life*fade*(1-0.25*day));
        if(g.y<H*0.05)glyphs[i]=newGlyph(false);
    }
}

function drawEmbers(dt,t,strength){
    for(var i=0;i<embers.length;i++){
        var e=embers[i];
        e.y-=e.v*dt;e.x+=Math.sin(t*2+e.ph)*0.3;
        var a=Math.min(1,(H-e.y)/(H*0.15))*Math.max(0,(e.y-H*0.35)/(H*0.4))*strength;
        if(a>0){ctx.globalAlpha=a;ctx.fillStyle=e.c;ctx.fillRect(Math.round(e.x),Math.round(e.y),1,1);}
        if(e.y<H*0.35)embers[i]=newEmber(false);
    }
    ctx.globalAlpha=1;
}

function drawFireflies(t,strength){
    if(strength<0.03)return;
    for(var i=0;i<fireflies.length;i++){
        var f=fireflies[i],blink=Math.sin(t*f.sp+f.ph);
        if(blink<0.2)continue;
        var x=Math.round(f.x+Math.sin(t*0.4+f.dr)*6),y=Math.round(f.y+Math.sin(t*0.7+f.dr*2)*3);
        ctx.globalAlpha=blink*blink*strength;ctx.fillStyle='#d8ff6a';ctx.fillRect(x,y,1,1);
        ctx.globalAlpha=blink*0.25*strength;ctx.fillRect(x-1,y,3,1);ctx.fillRect(x,y-1,1,3);
    }
    ctx.globalAlpha=1;
}

function drawFog(t,s){
    var cols=[0,1,2].map(function(i){return rgb(blend(s,PALETTES[s.a].fog[i],PALETTES[s.b].fog[i]));});
    var strength=amount(s,'fogA');
    var rows=[{y:0.7,a:0.12,sp:6},{y:0.84,a:0.12,sp:-4},{y:0.94,a:0.1,sp:3}];
    for(var r=0;r<rows.length;r++){
        var row=rows[r];ctx.fillStyle=cols[r];
        for(var x=0;x<W;x+=2){
            var v=Math.sin((x+t*row.sp)/37)+Math.sin((x-t*row.sp*0.6)/17)*0.5;
            var h=Math.max(0,Math.round((v+0.6)*H*0.025));
            ctx.globalAlpha=row.a*strength;
            var y=Math.round(H*row.y-h/2);
            for(var k=0;k<h;k+=1)if(dither(x,y+k,0.55))ctx.fillRect(x,y+k,2,1);
        }
    }
    ctx.globalAlpha=1;
}

// Clouds, aurora and fog change slowly, so they are repainted into their own
// small canvases about 8 times a second and simply copied on other frames.
var slow={aurora:null,clouds:null,fog:null,at:-1,hasAurora:false};
function paintSlowLayers(t,s){
    var main=ctx;
    if(!slow.fog||slow.fog.width!==W||slow.fog.height!==H){slow.aurora=makeLayer();slow.clouds=makeLayer();slow.fog=makeLayer();}
    var a=slow.aurora.getContext('2d'),c=slow.clouds.getContext('2d'),f=slow.fog.getContext('2d');
    a.clearRect(0,0,W,H);c.clearRect(0,0,W,H);f.clearRect(0,0,W,H);
    var aur=amount(s,'aurora');slow.hasAurora=aur>0.02;
    if(slow.hasAurora){ctx=a;drawAurora(t,aur);}
    ctx=c;drawClouds(t,s);
    ctx=f;drawFog(t,s);
    ctx=main;
}

// Lighter overlay on the page by day, darker at night, so text stays readable.
var lastVeil=-1;
function updatePageVeil(s){
    var v=amount(s,'veil');
    if(Math.abs(v-lastVeil)<0.02)return;
    lastVeil=v;
    document.body.style.setProperty('--home-veil',v.toFixed(2));
    var screen=document.getElementById('title-screen');
    if(screen){
        screen.setAttribute('data-sky',amount(s,'light')>0.75?'day':amount(s,'light')<0.25?'night':'twilight');
    }
}

function render(now){
    var t=now/1000,dt=Math.min(0.1,(now-(last||now))/1000);last=now;
    var p=currentPhase(now),s=sceneAt(p);
    var A=sets[s.a],B=sets[s.b],tb=s.t;
    function layer(name,x,y){
        ctx.globalAlpha=1;ctx.drawImage(A[name],x,y);
        if(A!==B&&tb>0.004){ctx.globalAlpha=tb;ctx.drawImage(B[name],x,y);ctx.globalAlpha=1;}
    }
    mouse.x+=(mouse.tx-mouse.x)*0.06;mouse.y+=(mouse.ty-mouse.y)*0.06;
    var ox=mouse.x,oy=mouse.y;
    if(slow.at<0||now-slow.at>120||now<slow.at){paintSlowLayers(t,s);slow.at=now;}
    bodies=[];
    layer('sky',0,0);
    if(slow.hasAurora)ctx.drawImage(slow.aurora,0,0);
    drawStars(t,ox,oy,amount(s,'stars'));
    drawMoon(p,t,ox,oy);
    drawSun(p,t,ox,oy);
    ctx.drawImage(slow.clouds,Math.round(ox*0.15),0);
    updateFlyers(dt,t,s);
    layer('far',Math.round(-20+ox*0.25),Math.round(oy*0.1));
    layer('mid',Math.round(-20+ox*0.45),Math.round(oy*0.15));
    layer('castle',Math.round(ox*0.6),0);
    drawCastleLife(t,Math.round(ox*0.6),s);
    layer('near',Math.round(-20+ox*0.8),Math.round(oy*0.2));
    layer('ground',0,0);
    ctx.drawImage(slow.fog,0,0);
    drawGlyphs(dt,t,s);
    drawEmbers(dt,t,amount(s,'embers'));
    drawFireflies(t,amount(s,'fireflies'));
    updatePageVeil(s);
}

function resize(){
    if(!canvas)return;
    var w=window.innerWidth,h=window.innerHeight;
    // Each art pixel is P screen pixels: chunky on big screens, finer on phones.
    P=Math.max(2,Math.round(Math.min(w,h)/190));
    W=Math.ceil(w/P);H=Math.ceil(h/P);
    canvas.width=W;canvas.height=H;
    ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    buildScene();
    slow.at=-1;lastVeil=-1;
    render(performance.now());
}

function loop(now){
    var mode=activeSceneMode();
    setSceneMode(mode);
    if(!mode){animId=null;return;}
    animId=requestAnimationFrame(loop);
    if(document.hidden||now-(loop.prev||0)<33)return;
    loop.prev=now;
    render(now);
}

// Call after any screen change: starts the scene on the screens that use it
// and hides it everywhere else (the battle has its own background).
window.startHomeBackground=function(){
    canvas=document.getElementById('home-bg-canvas');
    if(!canvas)return;
    if(canvas.parentNode!==document.body)document.body.insertBefore(canvas,document.body.firstChild);
    var mode=activeSceneMode();
    setSceneMode(mode);
    if(!mode)return;
    if(!sets||canvas.width!==Math.ceil(window.innerWidth/P))resize();
    if(reduceMotion){slow.at=-1;render(performance.now());return;}
    if(!animId){last=0;animId=requestAnimationFrame(loop);}
};

// Pin the time of day (0..1, 0 = midnight, 0.5 = noon) or pass null to let
// the day run again from where it is now.
window.setHomeTimeOfDay=function(p){
    if(p===null||p===undefined){
        if(pinnedPhase!==null){startPhase=pinnedPhase;clockStart=performance.now();}
        pinnedPhase=null;
    }else{
        pinnedPhase=((Number(p)||0)%1+1)%1;
    }
    flyers=[];slow.at=-1;
    if(canvas&&sets)render(performance.now());
};
window.getHomeTimeOfDay=function(){return currentPhase(performance.now());};

window.addEventListener('resize',function(){
    clearTimeout(resize.timer);
    resize.timer=setTimeout(function(){if(canvas&&activeSceneMode())resize();},150);
});
window.addEventListener('pointermove',function(e){
    if(e.pointerType==='touch')return;
    mouse.tx=(e.clientX/window.innerWidth-0.5)*-12;
    mouse.ty=(e.clientY/window.innerHeight-0.5)*-6;
});
})();
