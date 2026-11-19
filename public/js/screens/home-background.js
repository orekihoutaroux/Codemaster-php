// ===== HOME: ANIMATED BACKGROUND =====
// A pixel-art night scene behind the home page, drawn on one canvas at low
// resolution and scaled up with sharp pixels:
//   sky with dithered colour bands, an aurora, twinkling stars and shooting
//   stars, a moon, three layers of mountains, a castle with flickering
//   windows and waving flags, drifting fog, rising embers and floating bits
//   of PHP code. The layers move slightly with the mouse (parallax).
// Static layers are painted once per resize; only the moving parts are drawn
// each frame (about 30 times a second, and only while the home page is shown).
(function(){
'use strict';
var canvas,ctx,W=0,H=0,P=4,layers=null,stars=[],glyphs=[],embers=[],shooting=null,animId=null,last=0;
var mouse={x:0,y:0,tx:0,ty:0};
var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Seeded random so the mountains and castle look the same every visit.
var seed=7;
function rand(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
function rnd(a,b){return a+Math.random()*(b-a);}

// 4x4 ordered dither: lets two colours blend in a pixel-art way.
var BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function dither(x,y,t){return t*16>BAYER[(y&3)*4+(x&3)]+0.5;}

function hex(c){var n=parseInt(c.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];}
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t|0,a[1]+(b[1]-a[1])*t|0,a[2]+(b[2]-a[2])*t|0];}

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

// ---------- static layers ----------
function makeLayer(){var c=document.createElement('canvas');c.width=W;c.height=H;return c;}

function paintSky(){
    var c=makeLayer(),g=c.getContext('2d'),img=g.createImageData(W,H),d=img.data;
    var stops=[[0,hex('#05051a')],[0.38,hex('#0f0d33')],[0.62,hex('#23164a')],[0.8,hex('#3c1d4f')],[1,hex('#1a0f2c')]];
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
function paintMountains(base,amp,color,rim,freqs,phase){
    var c=document.createElement('canvas');c.width=W+40;c.height=H;var g=c.getContext('2d');
    var ys=ridge(base,amp,freqs,phase);
    g.fillStyle=color;
    for(var x=0;x<ys.length;x++)g.fillRect(x,ys[x],1,H-ys[x]);
    // moonlit rim on the slopes that face the moon (to the right)
    g.fillStyle=rim;
    for(x=1;x<ys.length;x++)if(ys[x]<ys[x-1]||ys[x]===ys[x-1]&&x%3===0)g.fillRect(x,ys[x],1,1);
    // snow caps on the highest peaks
    g.fillStyle='rgba(210,220,255,0.35)';
    var top=Math.min.apply(null,ys);
    for(x=1;x<ys.length-1;x++)if(ys[x]<top+amp*0.22){g.fillRect(x,ys[x],1,2);}
    return c;
}

// The castle stands in the middle, behind the dungeon door of the home page.
function paintCastle(){
    var c=makeLayer(),g=c.getContext('2d');
    var portrait=H>W;
    var gy=Math.round(H*(portrait?0.83:0.8)),cx=Math.round(W*(portrait?0.18:0.14)),u=Math.max(1,Math.round(Math.min(W,H)/(portrait?120:150)));
    var wall='#0b0a1c',edge='#1d1a40',windows=[],flags=[];
    function block(x,y,w,h){g.fillStyle=wall;g.fillRect(x,y,w,h);g.fillStyle=edge;g.fillRect(x,y,w,1);g.fillRect(x+w-1,y,1,h);}
    function crenels(x,y,w){g.fillStyle=wall;for(var i=0;i<w;i+=3*u)g.fillRect(x+i,y-2*u,2*u,2*u);}
    function tower(x,w,h,roof){
        block(x,gy-h,w,h);
        if(roof){
            g.fillStyle='#14112f';
            for(var i=0;i<w/2+u;i++)g.fillRect(x-u+i,gy-h-i,w+2*u-2*i,1);
            flags.push({x:x+Math.floor(w/2),y:gy-h-Math.floor(w/2)-u*2});
        }else crenels(x,gy-h,w);
        for(var k=0;k<Math.floor(h/(9*u))-1;k++)windows.push({x:x+Math.floor(w/2)-u,y:gy-h+6*u+k*9*u,w:2*u,h:3*u,ph:rand()*6.3,warm:rand()>0.25});
    }
    // the hill it stands on
    g.fillStyle='#0a0919';
    for(var x=0;x<W;x++){var d=(x-cx)/(30*u),y=gy+Math.round(d*d*6*u)-u;if(y<H)g.fillRect(x,y,1,H-y);}
    var wallW=34*u;
    block(cx-wallW/2,gy-12*u,wallW,12*u);crenels(cx-wallW/2,gy-12*u,wallW);
    tower(cx-wallW/2-5*u,10*u,22*u,true);
    tower(cx+wallW/2-5*u,10*u,22*u,true);
    tower(cx-6*u,12*u,36*u,true);   // keep
    g.fillStyle='#050510';g.fillRect(cx-2*u,gy-6*u,4*u,6*u); // gate
    for(var i=0;i<3;i++)windows.push({x:Math.round(cx-wallW/2+wallW*(0.18+i*0.3)),y:gy-8*u,w:2*u,h:2*u,ph:rand()*6.3,warm:rand()>0.3});
    // a lone watchtower far away on the other side
    var tx=Math.round(W*(portrait?0.86:0.88)),th=20*u,tw=6*u,ty=Math.round(H*(portrait?0.8:0.74));
    g.fillStyle='#0d0c22';g.fillRect(tx,ty-th,tw,th);
    g.fillStyle='#14112f';for(var j=0;j<tw/2+u;j++)g.fillRect(tx-u+j,ty-th-j,tw+2*u-2*j,1);
    windows.push({x:tx+Math.floor(tw/2)-u,y:ty-th+5*u,w:2*u,h:3*u,ph:1.3,warm:true});
    return {canvas:c,windows:windows,flags:flags,unit:u,ground:gy};
}

function paintGround(){
    var c=makeLayer(),g=c.getContext('2d'),gy=Math.round(H*(H>W?0.88:0.86));
    g.fillStyle='#07060f';g.fillRect(0,gy,W,H-gy);
    // a faint path of light toward the castle gate
    g.fillStyle='#120f22';
    for(var y=gy;y<H;y++){
        var t=(y-gy)/(H-gy),half=Math.round(4+t*W*0.16);
        for(var x=Math.round(W/2-half);x<W/2+half;x++)if(dither(x,y,0.35*(1-t*0.5)))g.fillRect(x,y,1,1);
    }
    // grass tufts and stones along the horizon
    for(x=0;x<W;x+=2){
        var h=Math.floor(rand()*3);
        g.fillStyle=rand()>0.5?'#0e1a1a':'#0b1214';
        if(h)g.fillRect(x,gy-h,1,h);
    }
    return c;
}

function buildScene(){
    seed=7;
    layers={
        sky:paintSky(),
        far:paintMountains(H*0.6,H*0.12,'#16153d','#2c2a66',[[47,1],[19,0.35]],1),
        mid:paintMountains(H*0.68,H*0.09,'#0f0e2c','#24224f',[[33,1],[13,0.4]],2),
        castle:paintCastle(),
        near:paintMountains(H*0.85,H*0.045,'#08071a','#17153a',[[21,1],[9,0.5]],3),
        ground:paintGround()
    };
    stars=[];
    var n=Math.round(W*H/260);
    for(var i=0;i<n;i++)stars.push({x:Math.random()*W,y:Math.random()*H*0.62,s:Math.random()<0.12?2:1,ph:Math.random()*6.3,sp:rnd(0.6,2.2),c:['#ffffff','#c8d4ff','#ffe9a8','#a9b8ff'][i%4]});
    glyphs=[];
    for(i=0;i<Math.max(8,Math.round(W/34));i++)glyphs.push(newGlyph(true));
    embers=[];
    for(i=0;i<Math.max(10,Math.round(W/22));i++)embers.push(newEmber(true));
}
function newGlyph(anywhere){
    var s=SNIPPETS[Math.floor(Math.random()*SNIPPETS.length)];
    return {s:s,x:rnd(0,W-textWidth(s)),y:anywhere?rnd(H*0.15,H):H+rnd(0,40),v:rnd(2.5,6),drift:rnd(0,6.3),c:['#5ef2c3','#f5c842','#ff6b8b','#9fb4ff'][Math.floor(Math.random()*4)],life:rnd(0.35,0.7)};
}
function newEmber(anywhere){
    return {x:rnd(W*0.2,W*0.8),y:anywhere?rnd(H*0.4,H):H+rnd(0,10),v:rnd(6,14),ph:rnd(0,6.3),c:Math.random()>0.5?'#ffb12b':'#ff6a2a'};
}

// ---------- moving parts ----------
function drawAurora(t){
    // Curtains of light: each column fades in, peaks and fades out (4 steps).
    var bands=[{y:0.1,a:0.3,c:'#3ff2b5',sp:0.22,len:70,h:0.16},{y:0.16,a:0.2,c:'#8a7bff',sp:0.15,len:110,h:0.12},{y:0.07,a:0.13,c:'#ff5d9e',sp:0.3,len:55,h:0.09}];
    var steps=[0.25,0.6,1,0.45];
    for(var b=0;b<bands.length;b++){
        var band=bands[b];ctx.fillStyle=band.c;
        for(var x=0;x<W;x++){
            var wave=Math.sin(x/band.len+t*band.sp)*H*0.04+Math.sin(x/(band.len*0.41)-t*band.sp*1.6)*H*0.012;
            var top=Math.round(H*band.y+wave);
            var h=Math.max(4,Math.round(H*band.h*(0.7+0.3*Math.sin(x/19+t*0.5+b))));
            var fade=Math.pow(Math.sin(Math.min(1,x/W)*Math.PI),1.5)*(0.65+0.35*Math.sin(t*0.6+x/31+b*2));
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

function drawMoon(t,ox,oy){
    var portrait=H>W;
    var mx=Math.round(W*(portrait?0.82:0.8)+ox*0.2),my=Math.round(H*(portrait?0.07:0.2)+oy*0.2),r=Math.max(6,Math.round(Math.min(W,H)*(portrait?0.09:0.07)));
    for(var ring=3;ring>=1;ring--){
        ctx.globalAlpha=0.05+0.02*Math.sin(t*0.8);ctx.fillStyle='#c9c4ff';
        circle(mx,my,r+ring*Math.round(r*0.45));
    }
    ctx.globalAlpha=1;ctx.fillStyle='#f4eedb';circle(mx,my,r);
    ctx.fillStyle='#d9d1b8';circle(mx+Math.round(r*0.3),my-Math.round(r*0.2),Math.max(1,Math.round(r*0.22)));
    circle(mx-Math.round(r*0.35),my+Math.round(r*0.25),Math.max(1,Math.round(r*0.16)));
    circle(mx+Math.round(r*0.1),my+Math.round(r*0.45),Math.max(1,Math.round(r*0.1)));
    // shaded edge
    ctx.fillStyle='rgba(120,110,170,0.35)';
    for(var y=-r;y<=r;y++){var w=Math.round(Math.sqrt(r*r-y*y));ctx.fillRect(mx-w,my+y,Math.max(1,Math.round(w*0.35)),1);}
}
function circle(cx,cy,r){for(var y=-r;y<=r;y++){var w=Math.round(Math.sqrt(r*r-y*y));ctx.fillRect(cx-w,cy+y,w*2+1,1);}}

function drawStars(t,ox,oy){
    for(var i=0;i<stars.length;i++){
        var s=stars[i],tw=0.45+0.55*Math.sin(t*s.sp+s.ph);
        if(tw<0.15)continue;
        ctx.globalAlpha=tw;ctx.fillStyle=s.c;
        var x=Math.round(s.x+ox*0.1),y=Math.round(s.y+oy*0.1);
        ctx.fillRect(x,y,s.s,s.s);
        if(s.s>1&&tw>0.92){ctx.globalAlpha=0.5;ctx.fillRect(x-1,y,4,1);ctx.fillRect(x,y-1,1,4);}
    }
    ctx.globalAlpha=1;
    // a shooting star every few seconds
    if(!shooting&&Math.random()<0.006)shooting={x:rnd(W*0.1,W*0.7),y:rnd(0,H*0.25),vx:rnd(90,140),vy:rnd(30,55),life:0};
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

function drawCastleLife(t,ox){
    var cs=layers.castle,u=cs.unit;
    for(var i=0;i<cs.windows.length;i++){
        var w=cs.windows[i],f=0.65+0.35*Math.sin(t*3+w.ph)+(Math.sin(t*11+w.ph*3)>0.96?-0.4:0);
        ctx.globalAlpha=Math.max(0.2,f);
        ctx.fillStyle=w.warm?'#ffb347':'#7fd6ff';
        ctx.fillRect(w.x+ox,w.y,w.w,w.h);
        ctx.globalAlpha=0.12*f;ctx.fillRect(w.x+ox-u,w.y-u,w.w+2*u,w.h+2*u);
    }
    ctx.globalAlpha=1;
    for(i=0;i<cs.flags.length;i++){
        var fl=cs.flags[i],wave=Math.floor(t*4+i)%2;
        ctx.fillStyle='#2a2440';ctx.fillRect(fl.x+ox,fl.y-6*u,u,6*u);
        ctx.fillStyle=i===cs.flags.length-1?'#e94560':'#f5c842';
        ctx.fillRect(fl.x+ox+u,fl.y-6*u,4*u,2*u);
        ctx.fillRect(fl.x+ox+u+4*u,fl.y-6*u+wave*u,2*u,2*u-wave*u||u);
    }
}

function drawGlyphs(dt,t){
    for(var i=0;i<glyphs.length;i++){
        var g=glyphs[i];
        g.y-=g.v*dt;
        var x=Math.round(g.x+Math.sin(t*0.6+g.drift)*4),y=Math.round(g.y);
        var fade=Math.min(1,(H-g.y)/(H*0.25))*Math.min(1,(g.y-H*0.08)/(H*0.2));
        var nearMoon=Math.abs(x-W*0.8)<W*0.12&&y<H*0.35;
        if(fade>0&&!nearMoon)drawText(g.s,x,y,g.c,g.life*fade);
        if(g.y<H*0.05)glyphs[i]=newGlyph(false);
    }
}

function drawEmbers(dt,t){
    for(var i=0;i<embers.length;i++){
        var e=embers[i];
        e.y-=e.v*dt;e.x+=Math.sin(t*2+e.ph)*0.3;
        var a=Math.min(1,(H-e.y)/(H*0.15))*Math.max(0,(e.y-H*0.35)/(H*0.4));
        if(a>0){ctx.globalAlpha=a;ctx.fillStyle=e.c;ctx.fillRect(Math.round(e.x),Math.round(e.y),1,1);}
        if(e.y<H*0.35)embers[i]=newEmber(false);
    }
    ctx.globalAlpha=1;
}

function drawFog(t){
    var rows=[{y:0.7,a:0.12,sp:6,c:'#5a5d9e'},{y:0.84,a:0.12,sp:-4,c:'#6b3d7a'},{y:0.94,a:0.1,sp:3,c:'#3d4a8a'}];
    for(var r=0;r<rows.length;r++){
        var row=rows[r];ctx.fillStyle=row.c;
        for(var x=0;x<W;x+=2){
            var v=Math.sin((x+t*row.sp)/37)+Math.sin((x-t*row.sp*0.6)/17)*0.5;
            var h=Math.max(0,Math.round((v+0.6)*H*0.025));
            ctx.globalAlpha=row.a;
            var y=Math.round(H*row.y-h/2);
            for(var k=0;k<h;k+=1)if(dither(x,y+k,0.55))ctx.fillRect(x,y+k,2,1);
        }
    }
    ctx.globalAlpha=1;
}

// Aurora and fog change slowly, so they are repainted into their own small
// canvases about 8 times a second and simply copied on the other frames.
var slow={aurora:null,fog:null,at:-1};
function paintSlowLayers(t){
    var main=ctx;
    if(!slow.aurora||slow.aurora.width!==W||slow.aurora.height!==H){slow.aurora=makeLayer();slow.fog=makeLayer();}
    var a=slow.aurora.getContext('2d'),f=slow.fog.getContext('2d');
    a.clearRect(0,0,W,H);f.clearRect(0,0,W,H);
    ctx=a;drawAurora(t);
    ctx=f;drawFog(t);
    ctx=main;
}

function render(now){
    var t=now/1000,dt=Math.min(0.1,(now-(last||now))/1000);last=now;
    mouse.x+=(mouse.tx-mouse.x)*0.06;mouse.y+=(mouse.ty-mouse.y)*0.06;
    var ox=mouse.x,oy=mouse.y;
    if(slow.at<0||now-slow.at>120||now<slow.at){paintSlowLayers(t);slow.at=now;}
    ctx.drawImage(layers.sky,0,0);
    ctx.drawImage(slow.aurora,0,0);
    drawStars(t,ox,oy);
    drawMoon(t,ox,oy);
    ctx.drawImage(layers.far,Math.round(-20+ox*0.25),Math.round(oy*0.1));
    ctx.drawImage(layers.mid,Math.round(-20+ox*0.45),Math.round(oy*0.15));
    ctx.drawImage(layers.castle.canvas,Math.round(ox*0.6),0);
    drawCastleLife(t,Math.round(ox*0.6));
    ctx.drawImage(layers.near,Math.round(-20+ox*0.8),Math.round(oy*0.2));
    ctx.drawImage(layers.ground,0,0);
    ctx.drawImage(slow.fog,0,0);
    drawGlyphs(dt,t);
    drawEmbers(dt,t);
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
    slow.at=-1;
    render(performance.now());
}

function loop(now){
    var screen=document.getElementById('title-screen');
    if(!screen||!screen.classList.contains('active')){animId=null;return;}
    animId=requestAnimationFrame(loop);
    if(document.hidden||now-(loop.prev||0)<33)return;
    loop.prev=now;
    render(now);
}

window.startHomeBackground=function(){
    canvas=document.getElementById('home-bg-canvas');
    if(!canvas)return;
    if(!layers||canvas.width!==Math.ceil(window.innerWidth/P))resize();
    if(reduceMotion){render(0);return;}
    if(!animId){last=0;animId=requestAnimationFrame(loop);}
};

window.addEventListener('resize',function(){
    clearTimeout(resize.timer);
    resize.timer=setTimeout(function(){if(canvas&&document.getElementById('title-screen').classList.contains('active'))resize();},150);
});
window.addEventListener('pointermove',function(e){
    if(e.pointerType==='touch')return;
    mouse.tx=(e.clientX/window.innerWidth-0.5)*-12;
    mouse.ty=(e.clientY/window.innerHeight-0.5)*-6;
});
})();
