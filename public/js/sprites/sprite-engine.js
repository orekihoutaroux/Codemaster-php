// ===== SPRITE ENGINE =====
// Heroes and monsters are not stored as images. Each one is drawn every frame
// from simple shapes (ellipses, capsules, polygons) into a 64x64 pixel buffer,
// then outlined, shaded and copied to a canvas. Because the shapes are placed
// by code, a sprite can breathe, blink, swing a weapon, flinch and dissolve
// without needing a separate picture for every frame.
//
//   SPR.define(kind, id, drawFn)      register a sprite ('hero' or 'enemy')
//   SPR.drawTo(canvas, kind, id, o)   draw one frame onto a canvas
//   SPR.pose(side, name, opts)        start a battle pose ('hero' | 'enemy')
//   SPR.frame(side)                   pose state for the current frame
var SPR=(function(){
'use strict';
var W=64,H=64,N=W*H;
var rgb=new Uint8ClampedArray(N*4),mask=new Uint8Array(N);
var OUTLINE='#17111f';
var colorCache={};

function hex(c){
    var v=colorCache[c];if(v)return v;
    var s=c.charAt(0)==='#'?c.slice(1):c;
    if(s.length===3)s=s.charAt(0)+s.charAt(0)+s.charAt(1)+s.charAt(1)+s.charAt(2)+s.charAt(2);
    var n=parseInt(s,16);
    v=colorCache[c]=[(n>>16)&255,(n>>8)&255,n&255];
    return v;
}
// tone(c, +f) lightens toward a warm white, tone(c, -f) darkens toward a cool shadow.
function tone(c,f){
    var key=c+'|'+f,v=colorCache[key];if(v)return v;
    var b=hex(c);
    if(f>=0)v=[b[0]+(255-b[0])*f,b[1]+(250-b[1])*f,b[2]+(225-b[2])*f];
    else{var k=1+f;v=[b[0]*k*0.94,b[1]*k*0.94,b[2]*k+(1-k)*26];}
    v=colorCache[key]=[Math.round(v[0]),Math.round(v[1]),Math.round(v[2])];
    return v;
}

// ----- drawing state -----
var m=[1,0,0,1,0,0],stack=[];
var S={stroke:true,shade:1,alpha:1,fx:false,solid:false,bodyAlpha:1,light:0.24,dark:0.3};
function isBody(k){return k===1||k===3||k===4;}
var pass=0; // 0 = outline and fill together, 1 = outlines only, 2 = fills only

function put(i,c,a,kind){
    var o=i*4;
    if(a>=0.995){rgb[o]=c[0];rgb[o+1]=c[1];rgb[o+2]=c[2];rgb[o+3]=255;}
    else{
        var da=rgb[o+3]/255;
        if(da<=0){rgb[o]=c[0];rgb[o+1]=c[1];rgb[o+2]=c[2];rgb[o+3]=a*255;}
        else{
            var oa=a+da*(1-a);
            rgb[o]=(c[0]*a+rgb[o]*da*(1-a))/oa;rgb[o+1]=(c[1]*a+rgb[o+1]*da*(1-a))/oa;rgb[o+2]=(c[2]*a+rgb[o+2]*da*(1-a))/oa;rgb[o+3]=oa*255;
        }
    }
    if(kind===2){if(mask[i]===0)mask[i]=2;}else mask[i]=kind;
}

// Every shape is a test(x, y, grow) in its own local coordinates. fill() walks
// the pixels the shape can touch, maps each one back into local space and asks
// the test. "grow" makes the shape one pixel fatter, which is how outlines are made.
function fill(x0,y0,x1,y1,test,color,alphaFn){
    var a=m[0],b=m[1],c=m[2],d=m[3],e=m[4],f=m[5];
    var det=a*d-b*c;if(!det)return;
    var ia=d/det,ib=-b/det,ic=-c/det,id=a/det;
    var doStroke=S.stroke&&!S.fx&&pass!==2,grow=doStroke?1:0,pad=grow+1;
    x0-=pad;y0-=pad;x1+=pad;y1+=pad;
    var xs=[a*x0+c*y0+e,a*x1+c*y0+e,a*x0+c*y1+e,a*x1+c*y1+e];
    var ys=[b*x0+d*y0+f,b*x1+d*y0+f,b*x0+d*y1+f,b*x1+d*y1+f];
    var px0=Math.max(0,Math.floor(Math.min(xs[0],xs[1],xs[2],xs[3])));
    var px1=Math.min(W-1,Math.ceil(Math.max(xs[0],xs[1],xs[2],xs[3])));
    var py0=Math.max(0,Math.floor(Math.min(ys[0],ys[1],ys[2],ys[3])));
    var py1=Math.min(H-1,Math.ceil(Math.max(ys[0],ys[1],ys[2],ys[3])));
    if(px1<px0||py1<py0)return;
    var base=hex(color),lite=null,dark=null,shade=S.fx?0:S.shade;
    if(shade){lite=tone(color,S.light);dark=tone(color,-S.dark);}
    // one screen pixel toward the bottom-right, expressed in local space
    var sx=(ia+ic)*shade,sy=(ib+id)*shade;
    var strokeC=hex(OUTLINE),kind=S.fx?2:(S.solid?4:1),alpha=S.alpha;
    for(var py=py0;py<=py1;py++){
        for(var px=px0;px<=px1;px++){
            var dx=px+0.5-e,dy=py+0.5-f;
            var lx=ia*dx+ic*dy,ly=ib*dx+id*dy;
            var i=py*W+px;
            if(pass===1){if(test(lx,ly,grow))put(i,strokeC,1,3);continue;}
            if(test(lx,ly,0)){
                var col=base;
                if(shade){
                    if(!test(lx+sx,ly+sy,0))col=dark;
                    else if(!test(lx-sx,ly-sy,0))col=lite;
                }
                put(i,col,alphaFn?alpha*alphaFn(lx,ly):alpha,kind);
            }else if(doStroke&&test(lx,ly,grow))put(i,strokeC,1,3);
        }
    }
}

var G={
    W:W,H:H,
    save:function(){stack.push(m.slice());},
    restore:function(){m=stack.pop()||[1,0,0,1,0,0];},
    tr:function(x,y){m[4]+=m[0]*x+m[2]*y;m[5]+=m[1]*x+m[3]*y;},
    rot:function(r){var c=Math.cos(r),s=Math.sin(r),a=m[0],b=m[1],cc=m[2],d=m[3];m[0]=a*c+cc*s;m[1]=b*c+d*s;m[2]=cc*c-a*s;m[3]=d*c-b*s;},
    sc:function(x,y){m[0]*=x;m[1]*=x;m[2]*=y;m[3]*=y;},
    // Run fn rotated by r radians around the point (x, y).
    pivot:function(x,y,r,fn){G.save();G.tr(x,y);G.rot(r);G.tr(-x,-y);fn();G.restore();},
    // Run fn stretched around the point (x, y). Used for squash-and-stretch.
    squash:function(x,y,sx,sy,fn){G.save();G.tr(x,y);G.sc(sx,sy);G.tr(-x,-y);fn();G.restore();},
    // Run fn moved by (x, y).
    move:function(x,y,fn){G.save();G.tr(x,y);fn();G.restore();},
    // Draw several shapes as one solid piece: all outlines first, then all fills,
    // so no outline is drawn where the shapes touch each other.
    group:function(fn){
        if(S.fx||!S.stroke||pass!==0){fn();return;}
        pass=1;fn();pass=2;fn();pass=0;
    },
    // Details (eyes, buckles, markings) drawn with no outline and no shading.
    flat:function(fn){var s=S.stroke,h=S.shade;S.stroke=false;S.shade=0;fn();S.stroke=s;S.shade=h;},
    // Shaded, but with no outline of its own.
    soft:function(fn){var s=S.stroke;S.stroke=false;fn();S.stroke=s;},
    // Glows, sparks and trails: no outline, no shading, usually see-through.
    fx:function(alpha,fn){var o={stroke:S.stroke,shade:S.shade,alpha:S.alpha,fx:S.fx};S.fx=true;S.stroke=false;S.shade=0;S.alpha=alpha;fn();S.stroke=o.stroke;S.shade=o.shade;S.alpha=o.alpha;S.fx=o.fx;},
    // Make the whole body see-through (ghosts, slime). Outlines stay a little stronger.
    translucent:function(alpha){S.bodyAlpha=alpha;},
    // Parts that must stay fully visible on a see-through body (eyes, teeth).
    solid:function(fn){var o=S.solid;S.solid=true;fn();S.solid=o;},
    e:function(cx,cy,rx,ry,color){
        fill(cx-rx,cy-ry,cx+rx,cy+ry,function(x,y,g){var dx=(x-cx)/(rx+g),dy=(y-cy)/(ry+g);return dx*dx+dy*dy<=1;},color);
    },
    r:function(x,y,w,h,color){
        fill(x,y,x+w,y+h,function(px,py,g){return px>=x-g&&px<x+w+g&&py>=y-g&&py<y+h+g;},color);
    },
    // A thick line with round ends. r2 lets it taper (tails, horns, limbs).
    c:function(x1,y1,x2,y2,r,color,r2){
        if(r2===undefined)r2=r;
        var dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy||1e-6,rm=Math.max(r,r2);
        fill(Math.min(x1,x2)-rm,Math.min(y1,y2)-rm,Math.max(x1,x2)+rm,Math.max(y1,y2)+rm,function(x,y,g){
            var t=((x-x1)*dx+(y-y1)*dy)/l2;t=t<0?0:t>1?1:t;
            var qx=x1+dx*t-x,qy=y1+dy*t-y,rr=r+(r2-r)*t+g;
            return qx*qx+qy*qy<=rr*rr;
        },color);
    },
    // A filled polygon from a flat list: [x0, y0, x1, y1, ...]
    p:function(pts,color){
        var n=pts.length/2,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,i;
        for(i=0;i<n;i++){x0=Math.min(x0,pts[i*2]);x1=Math.max(x1,pts[i*2]);y0=Math.min(y0,pts[i*2+1]);y1=Math.max(y1,pts[i*2+1]);}
        fill(x0,y0,x1,y1,function(x,y,g){
            var inside=false,j=n-1,near=false;
            for(var k=0;k<n;j=k++){
                var ax=pts[k*2],ay=pts[k*2+1],bx=pts[j*2],by=pts[j*2+1];
                if(((ay>y)!==(by>y))&&(x<(bx-ax)*(y-ay)/(by-ay)+ax))inside=!inside;
                if(g>0&&!near){
                    var ex=bx-ax,ey=by-ay,l2=ex*ex+ey*ey||1e-6,t=((x-ax)*ex+(y-ay)*ey)/l2;t=t<0?0:t>1?1:t;
                    var qx=ax+ex*t-x,qy=ay+ey*t-y;if(qx*qx+qy*qy<=g*g)near=true;
                }
            }
            return inside||near;
        },color);
    },
    // Part of a ring between two angles (radians, 0 = right, clockwise).
    ring:function(cx,cy,r0,r1,a0,a1,color,fade){
        var span=a1-a0;
        fill(cx-r1,cy-r1,cx+r1,cy+r1,function(x,y,g){
            var dx=x-cx,dy=y-cy,d=Math.sqrt(dx*dx+dy*dy);
            if(d<r0-g||d>r1+g)return false;
            if(span>=6.283)return true;
            var a=Math.atan2(dy,dx)-a0;a-=Math.floor(a/6.2832)*6.2832;
            return a<=span;
        },color,fade?function(x,y){
            var a=Math.atan2(y-cy,x-cx)-a0;a-=Math.floor(a/6.2832)*6.2832;
            var u=Math.max(0,Math.min(1,a/span));
            return fade>0?u:1-u;
        }:null);
    },
    px:function(x,y,color){G.r(x,y,1,1,color);},
    // Soft round light. Alpha steps down in bands so it still reads as pixel art.
    glow:function(cx,cy,r,color,alpha){
        G.fx(alpha===undefined?0.5:alpha,function(){
            fill(cx-r,cy-r,cx+r,cy+r,function(x,y){var dx=x-cx,dy=y-cy;return dx*dx+dy*dy<=r*r;},color,function(x,y){
                var dx=x-cx,dy=y-cy,u=1-Math.sqrt(dx*dx+dy*dy)/r;
                return Math.ceil(u*4)/4;
            });
        });
    },
    // Four-point twinkle.
    spark:function(x,y,size,color,alpha){
        G.fx(alpha===undefined?1:alpha,function(){
            G.r(x-size,y,size*2+1,1,color);G.r(x,y-size,1,size*2+1,color);
            if(size>1)G.r(x-1,y-1,3,3,color);
        });
    },
    // Tiny 3x5 symbols so monsters can wear a bit of code.
    glyph:function(ch,x,y,color){
        var rows=GLYPHS[ch];if(!rows)return;
        for(var r=0;r<5;r++)for(var c=0;c<3;c++)if(rows[r].charAt(c)==='#')G.r(x+c,y+r,1,1,color);
    },
    tone:function(c,f){var t=tone(c,f);return '#'+((1<<24)+(t[0]<<16)+(t[1]<<8)+t[2]).toString(16).slice(1);}
};
var GLYPHS={
    '$':['.##','##.','.#.','.##','##.'],';':['...','.#.','...','.#.','#..'],'{':['.##','.#.','#..','.#.','.##'],
    '}':['##.','.#.','..#','.#.','##.'],'[':['##.','#..','#..','#..','##.'],']':['.##','..#','..#','..#','.##'],
    '!':['.#.','.#.','.#.','...','.#.'],'?':['##.','..#','.#.','...','.#.'],'0':['###','#.#','#.#','#.#','###'],
    '1':['.#.','##.','.#.','.#.','###'],'2':['##.','..#','.#.','#..','###'],'X':['#.#','#.#','.#.','#.#','#.#'],
    '*':['...','#.#','.#.','#.#','...'],'(':['.#.','#..','#..','#..','.#.'],')':['.#.','..#','..#','..#','.#.'],
    '<':['..#','.#.','#..','.#.','..#'],'>':['#..','.#.','..#','.#.','#..'],'/':['..#','..#','.#.','#..','#..'],
    '=':['...','###','...','###','...'],'+':['...','.#.','###','.#.','...'],'-':['...','...','###','...','...']
};

// ----- whole-sprite effects, applied after the shapes are drawn -----
function noise(x,y,seed){var n=Math.sin(x*12.9898+y*78.233+seed*37.719)*43758.5453;return n-Math.floor(n);}

function isFill(k){return k===1||k===4;}
function fade(a){
    if(a>=1)return;var edge=Math.min(1,a+0.22);
    for(var i=0;i<N;i++){if(mask[i]===1)rgb[i*4+3]*=a;else if(mask[i]===3)rgb[i*4+3]*=edge;}
}
function finishOutline(){
    var c=hex(OUTLINE),i,x,y,add=[];
    for(y=0;y<H;y++)for(x=0;x<W;x++){
        i=y*W+x;if(isBody(mask[i]))continue;
        if((x>0&&isFill(mask[i-1]))||(x<W-1&&isFill(mask[i+1]))||(y>0&&isFill(mask[i-W]))||(y<H-1&&isFill(mask[i+W])))add.push(i);
    }
    for(i=0;i<add.length;i++){var o=add[i]*4;rgb[o]=c[0];rgb[o+1]=c[1];rgb[o+2]=c[2];rgb[o+3]=255;mask[add[i]]=3;}
}
function flash(amount,color){
    if(amount<=0)return;var c=hex(color||'#ffffff');
    for(var i=0;i<N;i++){if(!isBody(mask[i]))continue;var o=i*4;
        rgb[o]+=(c[0]-rgb[o])*amount;rgb[o+1]+=(c[1]-rgb[o+1])*amount;rgb[o+2]+=(c[2]-rgb[o+2])*amount;}
}
// Break the sprite into pixels that drift upward and vanish. p runs 0..1.
function dissolve(p,seed){
    if(p<=0)return;
    var src=new Uint8ClampedArray(rgb),srcMask=new Uint8Array(mask),x,y,i,o;
    for(i=0;i<N;i++){if(isBody(srcMask[i])){rgb[i*4+3]=0;mask[i]=0;}}
    for(y=0;y<H;y++)for(x=0;x<W;x++){
        i=y*W+x;if(!isBody(srcMask[i]))continue;
        var n=noise(x,y,seed),start=n*0.55+(y/H)*0.25,local=(p-start)/0.3;
        o=i*4;
        if(local<=0){rgb[o]=src[o];rgb[o+1]=src[o+1];rgb[o+2]=src[o+2];rgb[o+3]=src[o+3];mask[i]=srcMask[i];continue;}
        if(local>=1)continue;
        var ny=Math.round(y-local*local*10-n*2),nx=Math.round(x+(n-0.5)*6*local);
        if(ny<0||nx<0||nx>=W)continue;
        var t=(ny*W+nx)*4,k=1-local;
        rgb[t]=src[o]+(255-src[o])*0.6;rgb[t+1]=src[o+1]+(255-src[o+1])*0.6;rgb[t+2]=src[o+2]+(255-src[o+2])*0.6;rgb[t+3]=Math.max(rgb[t+3],255*k);
    }
}

// ----- animation timing -----
function easeOut(u){return 1-(1-u)*(1-u);}
function easeIn(u){return u*u;}
function easeInOut(u){return u<0.5?2*u*u:1-2*(1-u)*(1-u);}
function clamp01(u){return u<0?0:u>1?1:u;}

// Splits an attack into wind-up, strike, hold and recover. k is the moment of
// impact as a fraction of the whole pose, so the swing lands with the hit effect.
function attackPhases(A,p,k){
    var w=k*0.62,hold=Math.min(0.96,k+0.2);
    if(p<w){A.ph=1;A.q=easeOut(p/w);}
    else if(p<k){A.ph=2;A.q=easeIn((p-w)/(k-w));}
    else if(p<hold){A.ph=3;A.q=(p-k)/(hold-k);}
    else{A.ph=4;A.q=easeInOut((p-hold)/(1-hold));}
    A.charge=A.ph===1?A.q:(A.ph===2?1-A.q:0);
    A.swish=A.ph===2?A.q:(A.ph===3?1-A.q:0);
    A.fire=A.ph===3?1-A.q:(A.ph===2&&A.q>0.6?1:0);
}

function makeAnim(t,pose){
    var A={t:t,name:'idle',p:0,ph:0,q:0,charge:0,swish:0,fire:0,hurt:0,die:0,spawn:1,win:0,skill:false,boss:false};
    // mix(rest, wound, struck): the value of a joint for the current moment.
    A.mix=function(r,w,s){
        if(A.ph===0)return r;if(A.ph===1)return r+(w-r)*A.q;if(A.ph===2)return w+(s-w)*A.q;
        if(A.ph===3)return s;return s+(r-s)*A.q;
    };
    A.sin=function(speed,phase){return Math.sin(t*speed+(phase||0));};
    A.bob=function(speed,amount,phase){return Math.round(Math.sin(t*speed+(phase||0))*amount);};
    A.blink=(t%3.4)>3.26||((t+1.3)%5.1)>5.0;
    if(pose&&pose.name&&pose.name!=='idle'){
        A.name=pose.name;A.p=clamp01(pose.p);
        if(pose.name==='attack'||pose.name==='skill'){A.skill=pose.name==='skill';attackPhases(A,A.p,pose.k||0.3);}
        else if(pose.name==='hurt'){A.hurt=1-easeOut(A.p);}
        else if(pose.name==='die'){A.die=A.p;A.hurt=A.p<0.25?1:0;}
        else if(pose.name==='spawn'){A.spawn=easeOut(A.p);}
        else if(pose.name==='win'){A.win=Math.sin(A.p*Math.PI);A.winT=A.p;}
    }
    return A;
}

var defs={hero:{},enemy:{}};
function define(kind,id,draw){defs[kind][id]=draw;}
function has(kind,id){return !!defs[kind][id];}

function render(kind,id,t,pose){
    rgb.fill(0);mask.fill(0);m=[1,0,0,1,0,0];stack.length=0;pass=0;
    S.stroke=true;S.shade=1;S.alpha=1;S.fx=false;S.solid=false;S.bodyAlpha=1;S.light=0.24;S.dark=0.3;
    var draw=defs[kind][id];if(!draw)return null;
    var A=makeAnim(t,pose);
    if(A.die>=1)return A;
    var front=draw(G,A);
    finishOutline();
    fade(S.bodyAlpha);
    if(A.hurt>0.45)flash(A.name==='die'?0.85:0.6,A.name==='die'||kind==='enemy'?'#ffffff':'#ff7d88');
    if(A.spawn<1){flash(1-A.spawn,'#ffffff');dissolve(1-A.spawn,3);}
    if(A.die>0.22)dissolve((A.die-0.22)/0.78,7);
    if(typeof front==='function'){m=[1,0,0,1,0,0];stack.length=0;front();}
    return A;
}

// ----- copying the buffer to a canvas -----
var off=null,offCtx=null,img=null;
function blit(ctx,sx,sy,sw,sh,dx,dy,dw,dh){
    if(!off){off=document.createElement('canvas');off.width=W;off.height=H;offCtx=off.getContext('2d');img=offCtx.createImageData(W,H);}
    img.data.set(rgb);offCtx.putImageData(img,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(off,sx,sy,sw,sh,dx,dy,dw,dh);
}
// Named views of the 64x64 buffer: the whole thing, the figure, or head and shoulders.
var CROPS={
    all:{hero:[0,0,64,64],enemy:[0,0,64,64]},
    full:{hero:[4,13,48,48],enemy:[8,12,48,48]},
    bust:{hero:[16,19,24,24],enemy:[20,20,24,24]}
};
function drawTo(canvas,kind,id,o){
    o=o||{};if(!canvas||!canvas.getContext)return;
    var c=(CROPS[o.crop||'all']||CROPS.all)[kind];
    if(canvas.width!==c[2]||canvas.height!==c[3]){canvas.width=c[2];canvas.height=c[3];}
    var ctx=canvas.getContext('2d');ctx.clearRect(0,0,c[2],c[3]);
    if(!render(kind,id,o.t||0,o.pose||null))return;
    blit(ctx,c[0],c[1],c[2],c[3],0,0,c[2],c[3]);
}
// Draws into an existing canvas at any place and size (used by older call sites).
function drawAt(ctx,kind,id,x,y,size,o){
    o=o||{};var c=(CROPS[o.crop||'full']||CROPS.full)[kind];
    if(!render(kind,id,o.t||0,o.pose||null))return;
    blit(ctx,c[0],c[1],c[2],c[3],x,y,size,size);
}

// ----- battle poses -----
var poses={hero:null,enemy:null},queued={hero:null,enemy:null};
function now(){return (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();}
// opts: dur (ms), k (moment of impact, 0..1), hold (stay on the last frame),
// delay (ms; the current pose keeps playing until the new one starts).
function pose(side,name,opts){
    opts=opts||{};
    var p={name:name,start:now()+(opts.delay||0),dur:opts.dur||600,k:opts.k||0.3,hold:!!opts.hold};
    if(opts.delay){queued[side]=p;return;}
    poses[side]=p;queued[side]=null;
}
function clearPose(side){poses[side]=null;queued[side]=null;}
function frame(side){
    var q=queued[side];
    if(q&&now()>=q.start){poses[side]=q;queued[side]=null;}
    var p=poses[side];if(!p)return null;
    var u=(now()-p.start)/p.dur;
    if(u>=1){
        if(p.hold)return {name:p.name,p:1,k:p.k};
        poses[side]=null;return null;
    }
    return {name:p.name,p:Math.max(0,u),k:p.k};
}
function poseName(side){var p=poses[side];return p?p.name:'idle';}

return {W:W,H:H,define:define,has:has,render:render,drawTo:drawTo,drawAt:drawAt,pose:pose,clearPose:clearPose,frame:frame,poseName:poseName,
    buffer:function(){return rgb;},now:now,G:G,OUTLINE:OUTLINE};
})();
