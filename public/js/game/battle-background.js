// ===== BATTLE: PIXEL-ART BACKGROUND FOR EACH FLOOR =====
// Draws the place where the hero and the monster fight, on one small canvas
// at the same pixel size as the sprites (3 screen pixels per art pixel on
// desktop, 2 on phones, 4 on very large screens), so it all looks like one
// picture. Each floor has its own place:
//   1 sunlit-valley   snowy mountains, a castle, a lake, clouds, birds, a stone path
//   2 crystal-cavern  stalactites, glowing crystals, an underground pool, drips
//   3 cyber-defense   a data skyline, server racks with blinking lights, a moving grid
//   4 code-matrix     falling code, terminal towers, a glowing platform
//   5 inferno-core    a volcano with lava streams, a lava lake, smoke and embers
// The still parts are painted once per floor and size; the moving parts are
// drawn about 20 times a second, only while the battle is on screen.
// The floor band at the bottom is as tall as --ground on #battle-scene, so the
// fighters (placed by css/game/battle-stage.css) stand on it.
// Called from applyBattleBackground() and showScreen() (core/navigation.js).
(function(){
'use strict';
var scene=null,canvas=null,ctx=null,W=0,H=0,P=3,GY=0,theme='sunlit-valley',L=null,S=null,animId=null,lastDraw=0,prevNow=0,builtKey='';
var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- helpers ----------
var seed=1;
function rand(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646;}
function rnd(a,b){return a+Math.random()*(b-a);}
var BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function dither(x,y,t){return t*16>BAYER[(y&3)*4+(x&3)]+0.5;}
function hex(c){var n=parseInt(c.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];}
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t|0,a[1]+(b[1]-a[1])*t|0,a[2]+(b[2]-a[2])*t|0];}
function rgb(c){return 'rgb('+c[0]+','+c[1]+','+c[2]+')';}
function layer(){var c=document.createElement('canvas');c.width=W;c.height=H;return c;}
function circle(g,cx,cy,r){cx=Math.round(cx);cy=Math.round(cy);for(var y=-r;y<=r;y++){var w=Math.round(Math.sqrt(r*r-y*y));g.fillRect(cx-w,cy+y,w*2+1,1);}}

// A vertical colour ramp from y0 to y1 with dithered steps (pixel-art style).
function gradientLayer(colors,y0,y1){
    var c=layer(),g=c.getContext('2d'),img=g.createImageData(W,H),d=img.data,cols=colors.map(hex),n=cols.length-1;
    for(var y=Math.max(0,y0);y<Math.min(H,y1);y++){
        var v=(y-y0)/Math.max(1,y1-y0-1)*n,i=Math.min(n-1,Math.floor(v)),t=v-i;
        var band=Math.floor(t*4)/4,next=Math.min(1,band+0.25),f=(t-band)*4;
        for(var x=0;x<W;x++){
            var col=mix(cols[i],cols[i+1],dither(x,y,f)?next:band),o=(y*W+x)*4;
            d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255;
        }
    }
    g.putImageData(img,0,0);
    return c;
}
// Mountain and rock outlines from a few layered sine waves.
function ridge(base,amp,freqs,phase){
    var ys=[];
    for(var x=0;x<W;x++){
        var y=base;
        for(var i=0;i<freqs.length;i++)y-=Math.sin((x+phase*(i+1)*37)/freqs[i][0])*amp*freqs[i][1];
        ys.push(Math.round(y));
    }
    return ys;
}
function fillRidge(g,ys,color,rim,bottom){
    g.fillStyle=color;
    for(var x=0;x<W;x++)g.fillRect(x,ys[x],1,(bottom||H)-ys[x]);
    if(!rim)return;
    g.fillStyle=rim;
    for(x=1;x<W;x++)if(ys[x]<ys[x-1]||ys[x]===ys[x-1]&&x%3===0)g.fillRect(x,ys[x],1,1);
}
function pine(g,x,base,h,color,rim,trunk){
    g.fillStyle=color;
    for(var i=0;i<h;i++){var hw=Math.floor(i/2.3);g.fillRect(x-hw,base-h+i,hw*2+1,1);}
    g.fillStyle=rim;
    for(i=2;i<h;i+=3)g.fillRect(x+Math.floor(i/2.3),base-h+i,1,1);
    g.fillStyle=trunk;g.fillRect(x,base-1,1,2);
}
// Stone floor in rows that get taller toward the viewer, darker at the front.
function paintFloor(g,o){
    var h=H-GY;
    g.fillStyle=o.base;g.fillRect(0,GY,W,h);
    var y=GY+2,row=0,rh=1;
    while(y<H){
        var tw=5+row*3,off=Math.round((row%2)*tw/2+row*3);
        for(var x=-off;x<W;x+=tw){
            if(o.light&&rand()<0.45){g.fillStyle=o.light;g.fillRect(x+1,y,tw-1,rh);}
            g.fillStyle=o.dark;g.fillRect(x,y,1,rh);
        }
        y+=rh;g.fillStyle=o.dark;g.fillRect(0,y,W,1);y+=1;
        row++;rh=Math.min(rh+1,6);
    }
    g.fillStyle=o.shade||o.dark;
    var from=GY+Math.floor(h*0.45);
    for(var yy=from;yy<H;yy++){var f=(yy-from)/Math.max(1,H-from)*0.55;for(var xx=0;xx<W;xx++)if(dither(xx,yy,f))g.fillRect(xx,yy,1,1);}
    g.fillStyle=o.edge;g.fillRect(0,GY,W,1);
    if(o.edge2){g.fillStyle=o.edge2;g.fillRect(0,GY+1,W,1);}
}

// Tiny 3x5 font for code glyphs.
var FONT={
    '0':['###','#.#','#.#','#.#','###'],'1':['.#.','##.','.#.','.#.','###'],
    '$':['.##','##.','.#.','.##','##.'],'{':['.##','.#.','#..','.#.','.##'],'}':['##.','.#.','..#','.#.','##.'],
    ';':['...','.#.','...','.#.','#..'],'<':['..#','.#.','#..','.#.','..#'],'>':['#..','.#.','..#','.#.','#..'],
    '?':['##.','..#','.#.','...','.#.'],'(':['.#.','#..','#..','#..','.#.'],')':['.#.','..#','..#','..#','.#.'],
    '=':['...','###','...','###','...'],'p':['...','##.','#.#','##.','#..'],'h':['#..','#..','##.','#.#','#.#'],
    '[':['##.','#..','#..','#..','##.'],']':['.##','..#','..#','..#','.##'],'/':['..#','..#','.#.','#..','#..']
};
var GLYPHS=Object.keys(FONT);
function glyph(ch,x,y){var rows=FONT[ch];if(!rows)return;for(var r=0;r<5;r++)for(var c=0;c<3;c++)if(rows[r].charAt(c)==='#')ctx.fillRect(x+c,y+r,1,1);}
function text(s,x,y){for(var i=0;i<s.length;i++)glyph(s.charAt(i),x+i*4,y);}

// Clouds and smoke: round puffs with a flat bottom.
function makeCloud(i,count,yMin,yMax,scale){
    var puffs=[],n=3+Math.floor(Math.random()*3),x=0;
    for(var k=0;k<n;k++){
        var r=Math.max(1,Math.round(rnd(2,4.5)*scale*(k===0||k===n-1?0.7:1)));
        puffs.push({dx:x+r,dy:-Math.round(r*0.5)-(k%2),r:r});
        x+=Math.round(r*1.4);
    }
    var w=x+2;
    return {x0:(i/count)*(W+w*2)+rnd(-15,15),y:Math.round(rnd(yMin,yMax)),v:rnd(1,2.6),w:w,puffs:puffs};
}
function drawClouds(list,t,body,shade,alpha){
    ctx.globalAlpha=alpha;
    for(var i=0;i<list.length;i++){
        var c=list[i],span=W+c.w*2,x=Math.round(((c.x0+c.v*t)%span+span)%span-c.w);
        for(var pass=0;pass<2;pass++){
            ctx.fillStyle=pass?body:shade;
            for(var k=0;k<c.puffs.length;k++){
                var p=c.puffs[k],cx=x+p.dx,cy=c.y+p.dy+(pass?0:1),bottom=c.y+(pass?0:1);
                for(var y=-p.r;y<=p.r;y++){if(cy+y>bottom)break;var w=Math.round(Math.sqrt(p.r*p.r-y*y));ctx.fillRect(cx-w,cy+y,w*2+1,1);}
            }
        }
    }
    ctx.globalAlpha=1;
}
var BIRD=[['#...#','.#.#.','..#..'],['.....','#####','..#..']];
function sprite(rows,x,y){for(var r=0;r<rows.length;r++)for(var c=0;c<rows[r].length;c++)if(rows[r].charAt(c)==='#')ctx.fillRect(x+c,y+r,1,1);}

// Rising or drifting single pixels (pollen, spores, embers, sparks).
function makeMotes(n,yMin,yMax,colors){
    var list=[];
    for(var i=0;i<n;i++)list.push({x:rnd(0,W),y:rnd(yMin,yMax),v:rnd(1.5,5),ph:rnd(0,6.3),sp:rnd(1,2.5),c:colors[i%colors.length],yMin:yMin,yMax:yMax});
    return list;
}
function drawMotes(list,t,dt,rise,alpha){
    for(var i=0;i<list.length;i++){
        var m=list[i];
        m.y-=m.v*dt*rise;
        if(m.y<m.yMin){m.y=m.yMax;m.x=rnd(0,W);}
        var a=(0.5+0.5*Math.sin(t*m.sp+m.ph))*alpha;
        if(a<0.08)continue;
        ctx.globalAlpha=a;ctx.fillStyle=m.c;
        ctx.fillRect(Math.round(m.x+Math.sin(t*0.7+m.ph)*2),Math.round(m.y),1,1);
    }
    ctx.globalAlpha=1;
}

// ---------- 1. sunlit valley ----------
var valley={
    paint:function(){
        var sky=gradientLayer(['#2a64c4','#4b8fe0','#86c2ef','#c4e6f4','#e8f6ea'],0,GY);
        var back=layer(),g=back.getContext('2d');
        var far=ridge(GY*0.6,GY*0.2,[[41,1],[17,0.35]],1);
        fillRidge(g,far,'#8aa9d2','#bcd3ec',GY);
        var top=Math.min.apply(null,far);
        g.fillStyle='#ffffff';
        for(var x=0;x<W;x++)if(far[x]<top+GY*0.07)g.fillRect(x,far[x],1,2);
        // a small castle on the far hills
        var cx=Math.round(W*0.6),cb=far[cx]+3;
        g.fillStyle='#6f8db6';
        g.fillRect(cx-7,cb-6,14,6);for(var i=0;i<14;i+=2)g.fillRect(cx-7+i,cb-7,1,1);
        g.fillRect(cx-9,cb-10,3,10);g.fillRect(cx+6,cb-10,3,10);g.fillRect(cx-2,cb-13,4,13);
        g.fillStyle='#9a4a64';g.fillRect(cx-10,cb-11,5,1);g.fillRect(cx+5,cb-11,5,1);g.fillRect(cx-3,cb-14,6,1);g.fillRect(cx-1,cb-15,2,1);
        g.fillStyle='#a9c0de';g.fillRect(cx+8,cb-10,1,10);g.fillRect(cx+1,cb-13,1,13);
        g.fillStyle='#e94560';g.fillRect(cx,cb-18,1,3);g.fillRect(cx+1,cb-18,2,1);
        var mid=ridge(GY*0.82,GY*0.08,[[29,1],[11,0.4]],2);
        fillRidge(g,mid,'#4f8f6a','#78b384',GY);
        // the lake and the meadow in front of it
        var ly=GY-Math.max(3,Math.round(GY*0.09));
        g.fillStyle='#3a8bd0';g.fillRect(0,ly,W,GY-ly);
        g.fillStyle='#8fd0f2';g.fillRect(0,ly,W,1);
        g.fillStyle='#4f9a45';g.fillRect(0,GY-1,W,1);
        // pine trees at both sides
        seed=11;
        for(x=1;x<W*0.11;x+=3+Math.floor(rand()*4))pine(g,x,GY,Math.round(GY*(0.2+rand()*0.2)),'#2f6b3c','#4f9150','#5a3a22');
        for(x=Math.round(W*0.89);x<W-1;x+=3+Math.floor(rand()*4))pine(g,x,GY,Math.round(GY*(0.2+rand()*0.2)),'#2f6b3c','#4f9150','#5a3a22');
        var floor=layer(),f=floor.getContext('2d');
        paintFloor(f,{base:'#a8703f',light:'#bb8350',dark:'#7d4f2a',edge:'#5aa04a',edge2:'#3d7c35'});
        // grass and little flowers over the edge of the path
        for(x=0;x<W;x+=1+Math.floor(rand()*3)){
            var th=Math.floor(rand()*3);f.fillStyle=rand()>0.5?'#5aa04a':'#3d7c35';
            if(th)f.fillRect(x,GY-th,1,th);
            if(rand()<0.06){f.fillStyle=['#ff6b8b','#ffd43b','#ffffff'][Math.floor(rand()*3)];f.fillRect(x,GY-th-1,1,1);}
        }
        return {sky:sky,back:back,floor:floor,lakeY:ly};
    },
    init:function(){
        var s={clouds:[],birds:[],shimmer:[],motes:makeMotes(Math.max(6,Math.round(W/30)),GY*0.45,H-2,['#fff3a0','#ffffff'])};
        var n=Math.max(3,Math.round(W/90));
        for(var i=0;i<n;i++)s.clouds.push(makeCloud(i,n,3,GY*0.42,Math.max(1,GY/60)));
        for(i=0;i<Math.round(W/14);i++)s.shimmer.push({x0:rnd(0,W),y:Math.round(rnd(L.lakeY+1,GY-1)),len:Math.round(rnd(2,6)),v:rnd(2,5)});
        return s;
    },
    frame:function(t,dt){
        ctx.drawImage(L.sky,0,0);
        // the sun with slowly turning rays
        var sx=Math.round(W*0.83),sy=Math.round(GY*0.24),r=Math.max(3,Math.round(GY*0.09));
        ctx.fillStyle='#fff1a8';
        for(var ring=3;ring>=1;ring--){ctx.globalAlpha=0.09;circle(ctx,sx,sy,r+ring*Math.max(2,Math.round(r*0.55)));}
        ctx.globalAlpha=0.55;
        for(var k=0;k<12;k++){
            var ang=t*0.12+k*Math.PI/6,len=Math.round(r*(k%2?0.45:0.8));
            for(var d=r+2;d<r+2+len;d++)ctx.fillRect(Math.round(sx+Math.cos(ang)*d),Math.round(sy+Math.sin(ang)*d),1,1);
        }
        ctx.globalAlpha=1;ctx.fillStyle='#ffd23f';circle(ctx,sx,sy,r);
        ctx.fillStyle='#fff8d6';circle(ctx,sx-1,sy-1,Math.max(1,r-2));
        drawClouds(S.clouds,t,'#ffffff','#cfe2f4',0.95);
        ctx.drawImage(L.back,0,0);
        // light glinting on the lake
        ctx.fillStyle='#e2f6ff';
        for(var i=0;i<S.shimmer.length;i++){
            var sh=S.shimmer[i],x=Math.round(((sh.x0+sh.v*t)%(W+10)+W+10)%(W+10)-5);
            ctx.globalAlpha=0.35+0.35*Math.sin(t*2+i);ctx.fillRect(x,sh.y,sh.len,1);
        }
        ctx.globalAlpha=1;
        // a small flock of birds now and then
        if(!S.birds.length&&Math.random()<0.01){
            var dir=Math.random()>0.5?1:-1,y0=rnd(3,GY*0.35),v=rnd(10,16),n=3+Math.floor(Math.random()*3);
            for(var b=0;b<n;b++){var side=b===0?0:(b%2?1:-1)*Math.ceil(b/2);S.birds.push({x:(dir>0?-8:W+8)-dir*Math.abs(side)*6,y:y0+Math.abs(side)*3,dir:dir,v:v,ph:b*0.7});}
        }
        ctx.fillStyle='#1e2a48';
        for(b=S.birds.length-1;b>=0;b--){
            var bd=S.birds[b];bd.x+=bd.dir*bd.v*dt;
            if(bd.x<-30||bd.x>W+30){S.birds.splice(b,1);continue;}
            sprite(BIRD[Math.floor(t*5+bd.ph)%2],Math.round(bd.x)-2,Math.round(bd.y+Math.sin(t*1.2+bd.ph)*1.5));
        }
        ctx.drawImage(L.floor,0,0);
        drawMotes(S.motes,t,dt,0.3,0.8);
    }
};

// ---------- 2. crystal cavern ----------
function prism(g,x,base,h,w,light,dark){
    for(var i=0;i<h;i++){
        var y=base-1-i,hw=i>h-w?Math.max(0,h-1-i):w;
        g.fillStyle=light;g.fillRect(x-hw,y,hw+1,1);
        g.fillStyle=dark;g.fillRect(x+1,y,hw,1);
    }
}
var CRYSTAL_COLORS=[['#9ffff5','#2aa6b8','#5ef2e8'],['#d8c2ff','#6a48c8','#a77bff'],['#ffb8e8','#b04a96','#ff7ad0']];
var cavern={
    paint:function(){
        var sky=gradientLayer(['#05051a','#0b0c2a','#11143a','#18204a'],0,GY);
        var back=layer(),g=back.getContext('2d');
        seed=21;
        var far=ridge(GY*0.5,GY*0.22,[[37,1],[13,0.5]],4);
        fillRidge(g,far,'#11133a','#262c66',GY);
        g.fillStyle='#232c6a';
        for(var v=0;v<Math.round(W/40);v++){var vx=Math.floor(rand()*W),vy=far[vx]+3;for(var s=0;s<6;s++)g.fillRect(vx+s,vy+s,1,1);}
        var mid=ridge(GY*0.8,GY*0.1,[[23,1],[9,0.5]],5);
        fillRidge(g,mid,'#0b0c26','#1f2452',GY);
        var py=GY-Math.max(3,Math.round(GY*0.08));
        g.fillStyle='#0d2f4a';g.fillRect(0,py,W,GY-py);g.fillStyle='#27a9bd';g.fillRect(0,py,W,1);
        // stalactites from the ceiling
        g.fillStyle='#05050f';g.fillRect(0,0,W,2);
        var tips=[];
        for(var x=0;x<W;x+=2+Math.floor(rand()*5)){
            var len=2+Math.floor(rand()*GY*0.28),w=1+Math.floor(rand()*3);
            for(var i=0;i<len;i++){var hw=Math.round(w*(1-i/len));g.fillStyle='#0a0a1d';g.fillRect(x-hw,i,hw*2+1,1);g.fillStyle='#1d2148';g.fillRect(x+hw,i,1,1);}
            if(len>GY*0.14)tips.push({x:x,y:len});
        }
        // crystal clusters on the rocks
        var crystals=[],spots=[0.03,0.1,0.2,0.36,0.5,0.64,0.8,0.9,0.97];
        for(i=0;i<spots.length;i++){
            var cx=Math.round(W*spots[i]),base=(i%2?mid:far)[Math.min(W-1,cx)]+2,col=CRYSTAL_COLORS[i%3],big=i===0||i===spots.length-1;
            var hgt=Math.round(GY*(big?0.24:0.12+rand()*0.08));
            prism(g,cx,base,hgt,Math.max(1,Math.round(hgt/5)),col[0],col[1]);
            prism(g,cx-3,base,Math.round(hgt*0.6),1,col[0],col[1]);
            prism(g,cx+3,base,Math.round(hgt*0.45),1,col[0],col[1]);
            crystals.push({x:cx,y:base-hgt/2,r:Math.round(hgt*0.9),c:col[2],ph:rand()*6.3});
        }
        var floor=layer(),f=floor.getContext('2d');
        paintFloor(f,{base:'#1d2134',light:'#252a40',dark:'#121526',edge:'#4a5a9a',edge2:'#2a3260'});
        f.fillStyle='#1f8f94';
        for(i=0;i<Math.round(W/35);i++){var fx=Math.floor(rand()*W),fy=GY+3+Math.floor(rand()*(H-GY-4));for(s=0;s<5;s++){f.fillRect(fx,fy,1,1);fx+=rand()>0.5?1:-1;fy+=rand()>0.6?1:0;}}
        // small crystals on the edge of the floor
        prism(f,Math.round(W*0.02),GY+2,Math.round(GY*0.16),2,CRYSTAL_COLORS[0][0],CRYSTAL_COLORS[0][1]);
        prism(f,Math.round(W*0.985),GY+2,Math.round(GY*0.2),2,CRYSTAL_COLORS[1][0],CRYSTAL_COLORS[1][1]);
        return {sky:sky,back:back,floor:floor,poolY:py,tips:tips,crystals:crystals};
    },
    init:function(){return {drips:[],spores:makeMotes(Math.max(8,Math.round(W/22)),4,H-2,['#5ef2e8','#a77bff','#ff7ad0'])};},
    frame:function(t,dt){
        ctx.drawImage(L.sky,0,0);
        ctx.drawImage(L.back,0,0);
        for(var i=0;i<L.crystals.length;i++){
            var c=L.crystals[i];ctx.fillStyle=c.c;
            ctx.globalAlpha=0.07+0.06*Math.sin(t*1.6+c.ph);circle(ctx,c.x,c.y,c.r);
            ctx.globalAlpha=0.05+0.04*Math.sin(t*1.6+c.ph);circle(ctx,c.x,c.y,Math.round(c.r*1.5));
        }
        ctx.globalAlpha=1;
        // ripples on the pool
        ctx.fillStyle='#7ff6f0';
        for(i=0;i<Math.round(W/20);i++){var x=Math.round((i*37+t*3)%W),y=L.poolY+1+(i%Math.max(1,GY-L.poolY-1));ctx.globalAlpha=0.25+0.25*Math.sin(t*2+i);ctx.fillRect(x,y,3,1);}
        ctx.globalAlpha=1;
        // water drips from the stalactites
        if(L.tips.length&&S.drips.length<4&&Math.random()<0.05){var tip=L.tips[Math.floor(Math.random()*L.tips.length)];S.drips.push({x:tip.x,y:tip.y,v:0,splash:0});}
        ctx.fillStyle='#8fe8ff';
        for(i=S.drips.length-1;i>=0;i--){
            var d=S.drips[i];
            if(d.splash>0){d.splash-=dt;ctx.globalAlpha=Math.max(0,d.splash*3);ctx.fillRect(d.x-1,L.poolY-1,1,1);ctx.fillRect(d.x+1,L.poolY-1,1,1);if(d.splash<=0)S.drips.splice(i,1);continue;}
            d.v+=60*dt;d.y+=d.v*dt;
            if(d.y>=L.poolY){d.splash=0.3;continue;}
            ctx.globalAlpha=0.9;ctx.fillRect(d.x,Math.round(d.y),1,2);
        }
        ctx.globalAlpha=1;
        ctx.drawImage(L.floor,0,0);
        drawMotes(S.spores,t,dt,1,0.85);
    }
};

// ---------- 3. cyber defense ----------
var LED_COLORS=['#38ffd8','#38ffd8','#5ac8ff','#ffb347','#ff4d6a'];
var cyber={
    paint:function(){
        var sky=gradientLayer(['#020a12','#041a26','#072c38','#0a3c46'],0,GY);
        var sg=sky.getContext('2d');sg.fillStyle='#2de0d0';sg.globalAlpha=0.07;
        for(var x=0;x<W;x+=8)sg.fillRect(x,0,1,GY);for(var y=0;y<GY;y+=6)sg.fillRect(0,y,W,1);
        sg.globalAlpha=1;
        var back=layer(),g=back.getContext('2d'),leds=[];
        seed=31;
        // far data skyline with lit windows
        x=0;
        while(x<W){
            var w=4+Math.floor(rand()*8),h=Math.round(GY*(0.2+rand()*0.42));
            g.fillStyle='#061a26';g.fillRect(x,GY-h,w,h);
            g.fillStyle='#0f4553';
            for(var wy=GY-h+2;wy<GY-2;wy+=3)for(var wx=x+1;wx<x+w-1;wx+=2)if(rand()<0.35)g.fillRect(wx,wy,1,1);
            if(rand()<0.3){g.fillStyle='#0b2a36';g.fillRect(x+Math.floor(w/2),GY-h-4,1,4);leds.push({x:x+Math.floor(w/2),y:GY-h-5,c:'#ff4d6a',ph:rand()*6.3,sp:2,on:0.2});}
            x+=w+(rand()<0.3?1:0);
        }
        // network lines in the sky
        var lines=[Math.round(GY*0.18),Math.round(GY*0.3)];
        g.fillStyle='#0f5560';lines.forEach(function(ly){g.fillRect(0,ly,W,1);});
        // server racks in front of the skyline
        x=1+Math.floor(rand()*4);
        while(x<W){
            var rw=7+Math.floor(rand()*5),rh=Math.round(GY*(0.28+rand()*0.18)),top=GY-rh;
            g.fillStyle='#0a2633';g.fillRect(x,top,rw,rh);
            g.fillStyle='#16596a';g.fillRect(x,top,rw,1);g.fillRect(x,top,1,rh);
            for(var sy=top+2;sy<GY-1;sy+=3){
                g.fillStyle='#061a24';g.fillRect(x+2,sy,rw-4,2);
                leds.push({x:x+rw-3,y:sy,c:LED_COLORS[Math.floor(rand()*LED_COLORS.length)],ph:rand()*6.3,sp:1+rand()*5,on:rand()*0.6-0.3});
                if(rand()<0.5)leds.push({x:x+rw-5,y:sy,c:LED_COLORS[Math.floor(rand()*2)],ph:rand()*6.3,sp:1+rand()*5,on:rand()*0.6-0.3});
            }
            x+=rw+2+Math.floor(rand()*6);
        }
        g.fillStyle='#2de0d0';g.globalAlpha=0.6;g.fillRect(0,GY-1,W,1);g.globalAlpha=1;
        var floor=layer(),f=floor.getContext('2d');
        f.fillStyle='#03131b';f.fillRect(0,GY,W,H-GY);
        f.fillStyle='#010a0f';
        for(y=GY+Math.floor((H-GY)*0.4);y<H;y++){var fr=(y-GY)/(H-GY)*0.5;for(x=0;x<W;x++)if(dither(x,y,fr))f.fillRect(x,y,1,1);}
        f.fillStyle='#2de0d0';f.fillRect(0,GY,W,1);f.fillStyle='#13707a';f.fillRect(0,GY+1,W,1);
        return {sky:sky,back:back,floor:floor,leds:leds,lines:lines};
    },
    init:function(){
        var s={packets:[],bits:[]};
        for(var i=0;i<6;i++)s.packets.push({line:i%2,x:rnd(0,W),v:rnd(18,40)*(i%2?-1:1)});
        for(i=0;i<Math.max(5,Math.round(W/45));i++)s.bits.push({x:rnd(0,W),y:rnd(0,GY),v:rnd(2,5),ch:Math.random()>0.5?'1':'0'});
        return s;
    },
    frame:function(t,dt){
        ctx.drawImage(L.sky,0,0);
        // binary digits drifting up
        ctx.fillStyle='#2de0d0';
        for(var i=0;i<S.bits.length;i++){var b=S.bits[i];b.y-=b.v*dt;if(b.y<-6){b.y=GY;b.x=rnd(0,W);b.ch=Math.random()>0.5?'1':'0';}ctx.globalAlpha=0.18;glyph(b.ch,Math.round(b.x),Math.round(b.y));}
        ctx.globalAlpha=1;
        ctx.drawImage(L.back,0,0);
        // blinking server lights
        for(i=0;i<L.leds.length;i++){var l=L.leds[i];if(Math.sin(t*l.sp+l.ph)<l.on)continue;ctx.fillStyle=l.c;ctx.fillRect(l.x,l.y,1,1);}
        // data packets running along the network lines
        for(i=0;i<S.packets.length;i++){
            var p=S.packets[i];p.x+=p.v*dt;if(p.x>W+6)p.x=-6;if(p.x<-6)p.x=W+6;
            var py=L.lines[p.line],dir=p.v>0?-1:1;
            ctx.fillStyle='#bafff5';ctx.fillRect(Math.round(p.x),py,2,1);
            ctx.fillStyle='#2de0d0';ctx.globalAlpha=0.6;ctx.fillRect(Math.round(p.x)+dir*3,py,3,1);ctx.globalAlpha=1;
        }
        // scanning beam sweeping down
        var by=Math.round((t*10)%(GY+16))-8;
        if(by>=0&&by<GY){ctx.fillStyle='#5effef';ctx.globalAlpha=0.25;ctx.fillRect(0,by,W,1);ctx.globalAlpha=0.1;ctx.fillRect(0,by-1,W,1);ctx.globalAlpha=1;}
        ctx.drawImage(L.floor,0,0);
        // the glowing grid floor, moving toward the viewer
        var fh=H-GY,vp=W/2,sp=12;
        ctx.fillStyle='#1fb5a8';ctx.globalAlpha=0.4;
        for(var n=-Math.ceil(W/sp);n<=Math.ceil(W/sp);n++){
            for(var y=GY+2;y<H;y++){var s=(y-GY)/fh;ctx.fillRect(Math.round(vp+n*sp*(0.4+1.2*s)),y,1,1);}
        }
        for(var k=0;k<5;k++){var z=((k+t*0.7)%5)/5;var yy=GY+2+Math.round((fh-2)*z*z);ctx.globalAlpha=0.2+0.45*z;ctx.fillRect(0,yy,W,1);}
        ctx.globalAlpha=1;
    }
};

// ---------- 4. code matrix ----------
var matrix={
    paint:function(){
        var sky=gradientLayer(['#010402','#020d06','#041a0c','#062614'],0,GY);
        var back=layer(),g=back.getContext('2d'),towers=[];
        seed=41;
        var spots=[0.05,0.16,0.3,0.42,0.58,0.7,0.84,0.95];
        for(var i=0;i<spots.length;i++){
            var w=8+Math.floor(rand()*9),h=Math.round(GY*(0.3+rand()*0.4)),x=Math.round(W*spots[i]-w/2),top=GY-h;
            g.fillStyle='#021208';g.fillRect(x,top,w,h);
            g.fillStyle='#1f7a3f';g.fillRect(x,top,w,1);g.fillRect(x,top,1,h);g.fillRect(x+w-1,top,1,h);
            for(var y=top+3;y<GY-2;y+=2){var len=2+Math.floor(rand()*(w-5));g.fillStyle=rand()<0.15?'#3ee778':'#1a5c30';g.fillRect(x+2+Math.floor(rand()*2),y,Math.min(len,w-4),1);}
            towers.push({x:x,top:top,w:w});
        }
        g.fillStyle='#35d76d';g.globalAlpha=0.5;g.fillRect(0,GY-1,W,1);g.globalAlpha=1;
        var floor=layer(),f=floor.getContext('2d');
        paintFloor(f,{base:'#03140a',light:'#052010',dark:'#010904',edge:'#35d76d',edge2:'#1c7a3c'});
        return {sky:sky,back:back,floor:floor,towers:towers};
    },
    init:function(){
        var cols=[];
        for(var x=1;x<W;x+=4){
            if(Math.random()>0.6)continue;
            var len=3+Math.floor(Math.random()*5),g=[];
            for(var k=0;k<len;k++)g.push(GLYPHS[Math.floor(Math.random()*GLYPHS.length)]);
            cols.push({x:x,y:rnd(-GY,GY),v:rnd(10,24),g:g});
        }
        return {cols:cols};
    },
    frame:function(t,dt){
        ctx.drawImage(L.sky,0,0);
        // falling code
        for(var i=0;i<S.cols.length;i++){
            var c=S.cols[i];c.y+=c.v*dt;
            if(c.y-c.g.length*6>GY){c.y=-rnd(0,GY*0.6);c.v=rnd(10,24);}
            if(Math.random()<0.02)c.g[Math.floor(Math.random()*c.g.length)]=GLYPHS[Math.floor(Math.random()*GLYPHS.length)];
            for(var k=0;k<c.g.length;k++){
                var gy=Math.round(c.y-k*6);if(gy<-5||gy>GY-5)continue;
                ctx.fillStyle=k===0?'#d8ffe0':'#3ee778';ctx.globalAlpha=k===0?0.85:Math.max(0.12,0.55-k*0.08);
                glyph(c.g[k],c.x,gy);
            }
        }
        ctx.globalAlpha=1;
        ctx.drawImage(L.back,0,0);
        // a prompt with a blinking cursor on one tower
        var tw=L.towers[3]||L.towers[0];
        if(tw&&tw.w>=10){ctx.fillStyle='#7dffaa';ctx.globalAlpha=0.8;if(Math.floor(t*2)%2===0)ctx.fillRect(tw.x+tw.w-4,tw.top+3,2,4);ctx.globalAlpha=1;}
        ctx.drawImage(L.floor,0,0);
        // light pulses along the platform edge
        var px=Math.round((t*40)%(W+40))-20;
        ctx.fillStyle='#b8ffcc';ctx.globalAlpha=0.8;ctx.fillRect(px,GY,6,1);ctx.fillRect(W-px-6,GY,6,1);ctx.globalAlpha=1;
    }
};

// ---------- 5. inferno core ----------
var inferno={
    paint:function(){
        var sky=gradientLayer(['#120102','#300406','#5e0c06','#a52608','#e8520c'],0,GY);
        var back=layer(),g=back.getContext('2d');
        seed=51;
        var far=ridge(GY*0.62,GY*0.16,[[31,1],[12,0.4]],6);
        fillRidge(g,far,'#3a0a08','#9a2a0c',GY);
        // the volcano, in the middle between the fighters
        var vx=Math.round(W*0.5),apex=Math.round(GY*0.2),cw=Math.max(3,Math.round(GY*0.07)),bw=Math.round(GY*1.3);
        for(var x=Math.max(0,vx-bw);x<Math.min(W,vx+bw);x++){
            var dist=Math.abs(x-vx),y=apex+Math.round(Math.max(0,dist-cw)/(bw-cw)*(GY-apex));
            g.fillStyle='#220405';g.fillRect(x,y,1,GY-y);
            if(x>vx&&x%2===0){g.fillStyle='#6a1608';g.fillRect(x,y,1,1);}
        }
        g.fillStyle='#ff8a1a';g.fillRect(vx-cw+1,apex,cw*2-1,1);
        // lava streams down the slopes
        var streams=[];
        for(var s=0;s<3;s++){
            var sx=vx+(s-1)*(cw-1),sy=apex+1,pts=[];
            while(sy<GY-2){pts.push([sx,sy]);sy++;if(rand()<0.6)sx+=(s===0?-1:s===2?1:(rand()>0.5?1:-1));}
            streams.push(pts);
        }
        var mid=ridge(GY*0.86,GY*0.06,[[21,1],[8,0.5]],7);
        fillRidge(g,mid,'#170303','#5a1206',GY);
        var ly=GY-Math.max(3,Math.round(GY*0.08));
        var floor=layer(),f=floor.getContext('2d');
        paintFloor(f,{base:'#2a110c',light:'#33150f',dark:'#150605',edge:'#ff6a1a',edge2:'#8c230e'});
        f.fillStyle='#c2400c';
        for(var i=0;i<Math.round(W/30);i++){var fx=Math.floor(rand()*W),fy=GY+3+Math.floor(rand()*(H-GY-4));for(var k=0;k<6;k++){f.fillRect(fx,fy,1,1);fx+=rand()>0.5?1:-1;fy+=rand()>0.6?1:0;}}
        return {sky:sky,back:back,floor:floor,volcano:{x:vx,y:apex,cw:cw},streams:streams,lakeY:ly};
    },
    init:function(){
        var s={smoke:[],sparks:[],embers:makeMotes(Math.max(10,Math.round(W/16)),GY*0.2,H-2,['#ffb12b','#ff6a2a','#ffd23a'])};
        for(var i=0;i<4;i++)s.smoke.push(makeCloud(i,4,2,GY*0.3,Math.max(1,GY/45)));
        return s;
    },
    frame:function(t,dt){
        ctx.drawImage(L.sky,0,0);
        drawClouds(S.smoke,-t*0.8,'#2a0806','#1a0404',0.55);
        ctx.drawImage(L.back,0,0);
        // glowing crater and flowing lava streams
        var v=L.volcano;
        ctx.fillStyle='#ffb02a';ctx.globalAlpha=0.18+0.1*Math.sin(t*3);circle(ctx,v.x,v.y,v.cw+3);ctx.globalAlpha=1;
        for(var s=0;s<L.streams.length;s++){
            var pts=L.streams[s];
            for(var i=0;i<pts.length;i++){var k=Math.sin(t*4-i*0.5+s);ctx.fillStyle=k>0.5?'#ffd23a':k>-0.3?'#ff8a1a':'#d8400c';ctx.fillRect(pts[i][0],pts[i][1],1,1);}
        }
        // eruption sparks
        if(Math.random()<0.15)S.sparks.push({x:v.x+rnd(-v.cw,v.cw),y:v.y,vx:rnd(-8,8),vy:rnd(-26,-14),life:0});
        for(i=S.sparks.length-1;i>=0;i--){
            var p=S.sparks[i];p.life+=dt;p.vy+=30*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
            if(p.life>1.6||p.y>GY){S.sparks.splice(i,1);continue;}
            ctx.fillStyle=p.life<0.5?'#fff2a0':'#ff8a1a';ctx.globalAlpha=1-p.life/1.6;ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1);
        }
        ctx.globalAlpha=1;
        // the lava lake
        for(var y=L.lakeY;y<GY;y++){
            for(var x=0;x<W;x+=2){
                var n=Math.sin(x*0.35+t*1.6+y)+Math.sin(x*0.13-t*0.9);
                ctx.fillStyle=n>0.9?'#ffd23a':n>-0.2?'#ff8a12':'#e2480a';ctx.fillRect(x,y,2,1);
            }
        }
        ctx.fillStyle='#ffe27a';ctx.globalAlpha=0.6;ctx.fillRect(0,L.lakeY,W,1);ctx.globalAlpha=1;
        ctx.drawImage(L.floor,0,0);
        drawMotes(S.embers,t,dt,2.2,0.9);
    }
};

var THEMES={'sunlit-valley':valley,'crystal-cavern':cavern,'cyber-defense':cyber,'code-matrix':matrix,'inferno-core':inferno};

// ---------- drawing loop ----------
function measure(){
    if(!scene||!canvas)return false;
    var cs=getComputedStyle(scene),r=scene.getBoundingClientRect();
    if(!r.width||!r.height)return false;
    P=Math.max(1,parseInt(cs.getPropertyValue('--px'),10)||3);
    var ground=parseFloat(cs.getPropertyValue('--ground'))||58;
    W=Math.ceil(r.width/P);H=Math.ceil(r.height/P);GY=H-Math.round(ground/P);
    var key=W+'x'+H+'@'+P+':'+GY+':'+theme;
    if(key===builtKey)return true;
    builtKey=key;
    canvas.width=W;canvas.height=H;
    canvas.style.width=(W*P)+'px';canvas.style.height=(H*P)+'px';
    ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    var th=THEMES[theme];
    seed=7;L=th.paint();S=th.init();
    return true;
}
function render(now){
    var t=now/1000,dt=Math.min(0.1,(now-(prevNow||now))/1000);prevNow=now;
    THEMES[theme].frame(t,dt);
    // bosses make the whole place pulse a little red
    if(typeof isBossFight!=='undefined'&&isBossFight){ctx.fillStyle='#ff1030';ctx.globalAlpha=0.06+0.04*Math.sin(t*2.4);ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
}
function battleVisible(){var gs=document.getElementById('game-screen');return !!gs&&gs.classList.contains('active');}
function loop(now){
    if(!battleVisible()){animId=null;return;}
    animId=requestAnimationFrame(loop);
    if(document.hidden||now-lastDraw<50)return;
    lastDraw=now;
    if(measure())render(now);
}

window.startBattleBackground=function(newTheme){
    scene=document.getElementById('battle-scene');
    canvas=document.getElementById('battle-bg-canvas');
    if(newTheme&&THEMES[newTheme])theme=newTheme;
    if(!scene||!canvas||!battleVisible())return;
    if(!measure())return;
    render(performance.now());
    if(!reduceMotion&&!animId){prevNow=0;animId=requestAnimationFrame(loop);}
};
window.getBattleBackgroundTheme=function(){return theme;};

window.addEventListener('resize',function(){
    clearTimeout(window.startBattleBackground.timer);
    window.startBattleBackground.timer=setTimeout(function(){if(battleVisible())window.startBattleBackground();},120);
});
})();
