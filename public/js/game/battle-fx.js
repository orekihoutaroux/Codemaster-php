// ===== BATTLE: PIXEL-ART ATTACK EFFECTS =====
// The heroes' attacks and special skills, drawn on #battle-fx-canvas at the
// same pixel size as the sprites (--px on #battle-scene), so they look like
// part of the pixel art. Every effect finds the hero and the monster where
// they really are on screen (also while a hero runs in), so shots leave the
// hero's hand and land on the monster at any screen size.
//
//   BattleFX.heroAttack(heroId, impactMs, releaseMs)  normal attack
//   BattleFX.heroSkill(heroId, impactMs)              special skill
//   BattleFX.clear()                                  stop everything
// Called from playCharacterAttackAnimation() and playCharacterSkillAnimation()
// in js/game/battle.js, which still handle damage, sounds and the hero pose.
(function(){
'use strict';
var scene=null,canvas=null,ctx=null,W=0,H=0,P=3,GY=0,effects=[],parts=[],animId=null,lastNow=0;
var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- canvas ----------
function setup(){
    scene=document.getElementById('battle-scene');
    canvas=document.getElementById('battle-fx-canvas');
    if(!scene||!canvas)return false;
    var cs=getComputedStyle(scene),r=uiRect(scene); // layout pixels (js/core/ui-fit.js)
    if(!r.width||!r.height)return false;
    P=Math.max(1,parseInt(cs.getPropertyValue('--px'),10)||3);
    var w=Math.ceil(r.width/P),h=Math.ceil(r.height/P);
    if(w!==W||h!==H||canvas.width!==w){
        W=w;H=h;canvas.width=W;canvas.height=H;
        canvas.style.width=(W*P)+'px';canvas.style.height=(H*P)+'px';
    }
    var ground=parseFloat(cs.getPropertyValue('--ground'))||62,feet=parseFloat(cs.getPropertyValue('--feet'))||14;
    GY=H-Math.round((ground-feet)/P);
    ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    return true;
}
// A point on a fighter, in effect pixels. col,row are art pixels on its 64x64 sprite.
function at(side,col,row){
    var el=document.getElementById(side==='hero'?'game-character':'monster-canvas');
    if(!el||!scene)return {x:0,y:0};
    var s=uiRect(scene),r=uiRect(el);
    return {x:(r.left-s.left+r.width*col/64)/P,y:(r.top-s.top+r.height*row/64)/P};
}
var HAND=[44,34],BODY=[28,38],MONSTER=[33,40];
function heroHand(){return at('hero',HAND[0],HAND[1]);}
function heroBody(){return at('hero',BODY[0],BODY[1]);}
function monsterBody(){return at('enemy',MONSTER[0],MONSTER[1]);}

// ---------- drawing ----------
function alpha(a){ctx.globalAlpha=a<0?0:a>1?1:a;}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function px(x,y,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),1,1);}
function disc(cx,cy,r,c){
    if(r<=0)return;ctx.fillStyle=c;var R=Math.ceil(r);
    for(var y=-R;y<=R;y++){var w=Math.round(Math.sqrt(Math.max(0,r*r-y*y)));ctx.fillRect(Math.round(cx)-w,Math.round(cy)+y,w*2+1,1);}
}
// ring (sy < 1 squashes it into an ellipse lying on the floor); from/to limit the arc
function ring(cx,cy,r,th,c,sy,from,to){
    if(r<=0)return;ctx.fillStyle=c;sy=sy||1;from=from||0;to=to===undefined?Math.PI*2:to;
    var n=Math.max(16,Math.round(r*7*(to-from)/(Math.PI*2)));
    for(var i=0;i<=n;i++){
        var a=from+(to-from)*i/n,ca=Math.cos(a),sa=Math.sin(a);
        for(var t=0;t<th;t++)ctx.fillRect(Math.round(cx+ca*(r-t)),Math.round(cy+sa*(r-t)*sy),1,1);
    }
}
function line(x0,y0,x1,y1,c,w){
    ctx.fillStyle=c;w=w||1;
    var dx=x1-x0,dy=y1-y0,n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy)))),o=Math.floor(w/2);
    for(var i=0;i<=n;i++)ctx.fillRect(Math.round(x0+dx*i/n)-o,Math.round(y0+dy*i/n)-o,w,w);
}
function sparkle(x,y,s,c){rect(x-s,y,s*2+1,1,c);rect(x,y-s,1,s*2+1,c);}
var FONT={
    '0':['###','#.#','#.#','#.#','###'],'1':['.#.','##.','.#.','.#.','###'],'<':['..#','.#.','#..','.#.','..#'],
    '>':['#..','.#.','..#','.#.','#..'],'/':['..#','..#','.#.','#..','#..'],'{':['.##','.#.','#..','.#.','.##'],
    '}':['##.','.#.','..#','.#.','##.'],';':['...','.#.','...','.#.','#..'],'$':['.##','##.','.#.','.##','##.'],
    'D':['##.','#.#','#.#','#.#','##.'],'A':['.#.','#.#','###','#.#','#.#'],'Y':['#.#','#.#','.#.','.#.','.#.'],
    '-':['...','...','###','...','...'],'+':['...','.#.','###','.#.','...']
};
function glyph(ch,x,y,c){var rows=FONT[ch];if(!rows)return;ctx.fillStyle=c;for(var r=0;r<5;r++)for(var k=0;k<3;k++)if(rows[r].charAt(k)==='#')ctx.fillRect(Math.round(x)+k,Math.round(y)+r,1,1);}
function text(s,x,y,c){for(var i=0;i<s.length;i++)glyph(s.charAt(i),x+i*4,y,c);}

// ---------- timeline ----------
// add(delay, duration, draw): draw(elapsedMs, 0..1) runs every frame while it lasts.
function add(delay,dur,draw){effects.push({t0:performance.now()+delay,dur:Math.max(1,dur),draw:draw});wake();}
function once(delay,fn){effects.push({t0:performance.now()+delay,dur:1,once:fn});wake();}
function wake(){if(!animId){lastNow=0;animId=requestAnimationFrame(loop);}}
function loop(now){
    if(!setup()){effects=[];parts=[];animId=null;return;}
    var dt=Math.min(0.05,lastNow?(now-lastNow)/1000:0.016);lastNow=now;
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<effects.length;i++){
        var f=effects[i],e=now-f.t0;
        if(e<0)continue;
        if(f.once){f.once();f.done=true;continue;}
        if(e>f.dur){f.done=true;continue;}
        alpha(1);f.draw(e,e/f.dur);
    }
    effects=effects.filter(function(f){return !f.done;});
    drawParts(dt);
    alpha(1);
    if(effects.length||parts.length)animId=requestAnimationFrame(loop);
    else{animId=null;ctx.clearRect(0,0,W,H);}
}

// ---------- particles ----------
// shape: 'px' square, 'plus' healing cross, 'coin', or a font character.
function spray(pt,o){
    for(var i=0;i<o.n;i++){
        var a=(o.angle===undefined?Math.random()*Math.PI*2:o.angle+(Math.random()-0.5)*(o.spread||1)),v=(o.speed||30)*(0.5+Math.random());
        var life=(o.life||0.6)*(0.6+Math.random()*0.6);
        parts.push({x:pt.x+(Math.random()-0.5)*(o.jitter||0),y:pt.y+(Math.random()-0.5)*(o.jitter||0),vx:Math.cos(a)*v+(o.vx||0),vy:Math.sin(a)*v+(o.vy||0),
            g:o.gravity||0,life:life,max:life,c:o.colors[i%o.colors.length],s:o.size||1,shape:o.shape||'px',ch:o.chars?o.chars[i%o.chars.length]:null,drag:o.drag||0});
    }
    wake();
}
function drawParts(dt){
    for(var i=0;i<parts.length;i++){
        var p=parts[i];
        p.life-=dt;if(p.life<=0)continue;
        p.vy+=p.g*dt;if(p.drag){p.vx*=1-p.drag*dt;p.vy*=1-p.drag*dt;}
        p.x+=p.vx*dt;p.y+=p.vy*dt;
        if(p.g&&p.y>H-2){p.y=H-2;p.vy*=-0.35;p.vx*=0.7;}
        alpha(Math.min(1,p.life/p.max*1.6));
        if(p.shape==='plus'){rect(p.x-1,p.y,3,1,p.c);rect(p.x,p.y-1,1,3,p.c);}
        else if(p.shape==='coin'){rect(p.x,p.y,2,2,p.c);px(p.x,p.y,'#fff7c2');}
        else if(p.ch)glyph(p.ch,p.x,p.y,p.c);
        else rect(p.x,p.y,p.s,p.s,p.c);
    }
    parts=parts.filter(function(p){return p.life>0;});
}

// ---------- shared pieces ----------
function flash(delay,dur,color,strength){add(delay,dur,function(e,k){alpha((1-k)*(strength||0.3));rect(0,0,W,H,color);});}
function shake(delay,ms,big){
    once(delay,function(){
        if(!scene)return;
        scene.classList.remove('fx-shake','fx-shake-big');void scene.offsetWidth;
        scene.classList.add(big?'fx-shake-big':'fx-shake');
        setTimeout(function(){scene.classList.remove('fx-shake','fx-shake-big');},ms||260);
    });
}
// Star burst with sparks where a hit lands.
function burst(delay,getPt,c1,c2,size){
    size=size||1;var pt=null;
    add(delay,340,function(e,k){
        if(!pt)pt=getPt();
        var r=(4+11*k)*size;
        alpha(1-k);
        for(var i=0;i<8;i++){
            var a=i*Math.PI/4+0.39,r0=r*(i%2?0.5:0.35);
            line(pt.x+Math.cos(a)*r0,pt.y+Math.sin(a)*r0,pt.x+Math.cos(a)*r,pt.y+Math.sin(a)*r,i%2?c2:c1,size>1.3?2:1);
        }
        ring(pt.x,pt.y,r*0.75,1,c1);
        if(k<0.4){alpha(1);disc(pt.x,pt.y,(1-k/0.4)*4*size+1,'#ffffff');}
    });
    once(delay,function(){var q=getPt();spray(q,{n:Math.round(12*size),colors:[c1,c2,'#ffffff'],speed:45*size,life:0.5,gravity:60});});
}
// Something that flies from one point to another. o.head draws it; o.trail draws one trail point.
function shot(o){
    var hist=[],a=null,b=null;
    add(o.launch,Math.max(60,o.arrive-o.launch),function(e,k){
        if(!a){a=o.from();b=o.to();}
        b=o.to(); // keep aiming at the target if it moves
        var q=o.ease?o.ease(k):k;
        var x=a.x+(b.x-a.x)*q,y=a.y+(b.y-a.y)*q-Math.sin(q*Math.PI)*(o.arc||0)+(o.wave?Math.sin(e/40)*o.wave:0);
        hist.push([x,y]);if(hist.length>(o.trailLen||9))hist.shift();
        for(var i=0;i<hist.length-1;i++){alpha((i+1)/hist.length*0.8);o.trail(hist[i][0],hist[i][1],i/hist.length);}
        alpha(1);o.head(x,y,e,k);
        if(o.emit&&Math.random()<0.5)o.emit(x,y);
    });
}
function easeIn(k){return k*k;}
function easeOut(k){return 1-(1-k)*(1-k);}

// ---------- normal attacks ----------
var ATTACKS={
    // SYNTAX BOLT: a glowing page of code
    scholar:function(impact,release){
        shot({from:heroHand,to:monsterBody,launch:release,arrive:impact,arc:7,trailLen:10,
            head:function(x,y,e){alpha(0.45);disc(x,y,5,'#54efff');alpha(1);rect(x-3,y-2,7,5,'#fff6c8');rect(x-3,y-2,7,1,'#ffe36e');rect(x-2,y,4,1,'#7a5512');rect(x-2,y+2,3,1,'#7a5512');},
            trail:function(x,y,f){px(x,y,f>0.5?'#9ff8ff':'#2aa6b8');},
            emit:function(x,y){spray({x:x,y:y},{n:1,colors:['#54efff'],chars:['<','>','/',';','{','}'],speed:8,life:0.45,gravity:20});}});
        burst(impact,monsterBody,'#54efff','#ffe36e',1);
    },
    // ARCANE MISSILE: a violet orb with sparks circling it
    wizard:function(impact,release){
        shot({from:heroHand,to:monsterBody,launch:release,arrive:impact,wave:2,trailLen:12,ease:easeIn,
            head:function(x,y,e){alpha(0.4);disc(x,y,6,'#863aff');alpha(1);disc(x,y,3,'#c08bff');disc(x,y,1.5,'#ffffff');
                for(var i=0;i<2;i++){var a=e/55+i*Math.PI;sparkle(x+Math.cos(a)*6,y+Math.sin(a)*4,1,'#f2d4ff');}},
            trail:function(x,y,f){rect(x,y,f>0.6?2:1,f>0.6?2:1,f>0.5?'#c08bff':'#5a20b0');}});
        burst(impact,monsterBody,'#a768ff','#f2d4ff',1.1);
    },
    // RADIANT SPARK: a cross of light
    healer:function(impact,release){
        shot({from:heroHand,to:monsterBody,launch:release,arrive:impact,arc:9,trailLen:10,
            head:function(x,y){alpha(0.4);disc(x,y,5,'#68ffb4');alpha(1);rect(x-1,y-3,3,7,'#e0fff0');rect(x-3,y-1,7,3,'#e0fff0');px(x,y,'#68ffb4');},
            trail:function(x,y,f){if(f>0.3)sparkle(x,y,f>0.7?1:0,'#a6ffd5');},
            emit:function(x,y){spray({x:x,y:y},{n:1,colors:['#68ffb4','#ffffff'],speed:10,life:0.4});}});
        burst(impact,monsterBody,'#68ffb4','#e0fff0',1);
    },
    // BLACKPOWDER SHOT: muzzle flash, smoke, and an iron ball
    pirate:function(impact,release){
        add(release,140,function(e,k){var h=heroHand();alpha(1-k);disc(h.x+2,h.y,5*(1-k)+2,'#ffd25a');disc(h.x+2,h.y,2,'#ffffff');});
        once(release,function(){spray(heroHand(),{n:8,colors:['#b9ab98','#8a7c70'],speed:12,life:0.7,size:2,angle:0,spread:1.6,drag:2,vy:-6});});
        shot({from:heroHand,to:monsterBody,launch:release,arrive:impact,arc:5,trailLen:8,
            head:function(x,y){disc(x,y,2.5,'#15131c');px(x-1,y-1,'#8a8090');},
            trail:function(x,y,f){alpha(f*0.6);disc(x,y,1+f,'#a89c8c');}});
        burst(impact,monsterBody,'#ffad32','#fff0a8',1.15);
        once(impact,function(){spray(monsterBody(),{n:6,colors:['#6a6060','#9a8f86'],speed:14,life:0.8,size:2,drag:2,vy:-10});});
    },
    // VANGUARD SLASH: a sword crescent as the knight arrives
    knight:function(impact){
        var pt=null;
        add(impact-60,260,function(e,k){
            if(!pt)pt=monsterBody();
            var sweep=Math.min(1,k*2.2),from=Math.PI*0.62,to=from+Math.PI*0.95*sweep;
            alpha(k<0.55?1:1-(k-0.55)/0.45);
            ring(pt.x+3,pt.y,15,4,'#ffd15a',1,from,to);ring(pt.x+3,pt.y,14,2,'#fff2af',1,from,to);ring(pt.x+3,pt.y,13,1,'#ffffff',1,from,to);
        });
        burst(impact,monsterBody,'#ffd15a','#fff2af',1.1);
    },
    // NEON DAGGERS: three quick neon cuts
    rogue:function(impact){
        var cuts=[[-0.7,0],[0.7,55],[0.05,110]];
        cuts.forEach(function(c){
            var pt=null;
            add(impact-30+c[1],230,function(e,k){
                if(!pt)pt=monsterBody();
                var len=16*Math.min(1,k*3),dx=Math.cos(c[0]),dy=Math.sin(c[0]);
                alpha(k<0.5?1:1-(k-0.5)*2);
                line(pt.x-dx*len,pt.y-dy*len,pt.x+dx*len,pt.y+dy*len,'#39ffc0',3);
                line(pt.x-dx*len,pt.y-dy*len,pt.x+dx*len,pt.y+dy*len,'#e8fff8',1);
            });
        });
        once(impact,function(){spray(monsterBody(),{n:10,colors:['#39ffc0','#d8fff3'],chars:['0','1'],speed:30,life:0.5});});
        burst(impact+110,monsterBody,'#39ffc0','#d8fff3',0.9);
    }
};

// ---------- special skills ----------
var SKILLS={
    // TIME WARP: a giant clock over the monster rewinds, then shatters
    scholar:function(impact){
        var c=null,R=Math.max(12,Math.round(H*0.17));
        flash(0,1300,'#0a3a48',0.25);
        add(0,impact,function(e,k){
            if(!c)c=monsterBody();
            var r=R*easeOut(Math.min(1,k*2.5)),cy=c.y-4;
            alpha(0.35);disc(c.x,cy,r+3,'#54efff');
            alpha(0.95);disc(c.x,cy,r,'#0b2b3c');ring(c.x,cy,r,2,'#ffe36e');
            for(var i=0;i<12;i++){var a=i*Math.PI/6;px(c.x+Math.cos(a)*(r-4),cy+Math.sin(a)*(r-4),i%3?'#9ff8ff':'#ffffff');}
            var spin=-e/45;
            line(c.x,cy,c.x+Math.cos(spin)*(r-5),cy+Math.sin(spin)*(r-5),'#fff6c8',1);
            line(c.x,cy,c.x+Math.cos(spin/12)*(r-8),cy+Math.sin(spin/12)*(r-8),'#ffe36e',2);
            disc(c.x,cy,1.5,'#ffffff');
            // rewind ripples and marks
            for(var w=0;w<3;w++){var q=((e/360)+w/3)%1;alpha((1-q)*0.7);ring(c.x,cy,r+3+q*R*1.2,1,'#54efff');}
            alpha(0.8);text('<<',c.x-r-12-(e/20)%6,cy-2,'#9ff8ff');text('<<',c.x+r+4-(e/20)%6,cy-2,'#9ff8ff');
        });
        once(impact,function(){
            var q=monsterBody();q.y-=4;
            spray(q,{n:22,colors:['#fff6c8','#ffe36e','#54efff'],speed:70,life:0.7,gravity:50,size:2});
            spray(q,{n:12,colors:['#9ff8ff'],chars:['0','1','<','>','{','}'],speed:40,life:0.9,gravity:30});
        });
        flash(impact,180,'#ffffff',0.45);
        burst(impact,monsterBody,'#54efff','#ffe36e',1.6);
        shake(impact,260,true);
    },
    // ARCANE BURST: rune circles, three spiralling orbs and a pillar of light
    wizard:function(impact){
        var m=null,hb=null;
        add(0,impact+700,function(e,k){
            if(!m){m=monsterBody();hb=heroBody();}
            var grow=easeOut(Math.min(1,e/300)),fade=e>impact?1-(e-impact)/700:1,rot=e/220;
            alpha(0.85*fade);
            ring(m.x,GY,18*grow,2,'#a768ff',0.32);ring(m.x,GY,12*grow,1,'#f2d4ff',0.32);
            for(var i=0;i<8;i++){var a=rot+i*Math.PI/4;px(m.x+Math.cos(a)*15*grow,GY+Math.sin(a)*15*grow*0.32,'#ffffff');}
            ring(hb.x,GY,10*grow,1,'#a768ff',0.32);
        });
        for(var i=0;i<3;i++)(function(i){
            var off=i*2*Math.PI/3;
            shot({from:heroHand,to:function(){var q=monsterBody();return {x:q.x,y:q.y-14};},launch:80+i*70,arrive:impact-40,trailLen:12,ease:easeIn,
                head:function(x,y,e){var ox=Math.cos(e/50+off)*5,oy=Math.sin(e/50+off)*5;alpha(0.4);disc(x+ox,y+oy,4,'#863aff');alpha(1);disc(x+ox,y+oy,2,'#f2d4ff');},
                trail:function(x,y,f){px(x,y,f>0.5?'#c08bff':'#5a20b0');}});
        })(i);
        add(impact-20,620,function(e,k){
            var q=monsterBody(),w=Math.round(10*(k<0.2?k/0.2:1-(k-0.2)*0.6));
            alpha(k<0.7?0.9:(1-k)/0.3*0.9);
            rect(q.x-w,0,w*2+1,GY+1,'#863aff');rect(q.x-Math.round(w*0.55),0,Math.round(w*1.1)+1,GY+1,'#c08bff');rect(q.x-1,0,3,GY+1,'#ffffff');
        });
        once(impact,function(){var q=monsterBody();spray({x:q.x,y:GY},{n:26,colors:['#a768ff','#f2d4ff','#ffffff'],speed:60,life:0.9,angle:-Math.PI/2,spread:1.4,gravity:25});});
        flash(impact,220,'#b07bff',0.35);
        burst(impact,monsterBody,'#a768ff','#f2d4ff',1.5);
        shake(impact,280,true);
    },
    // AEGIS SLAM: a golden shield, then a ground shockwave with flying rocks
    knight:function(impact){
        add(0,impact+120,function(e,k){
            var h=at('hero',46,36),s=Math.min(1,e/180);
            alpha(0.45);disc(h.x+2,h.y,9*s,'#ffd15a');alpha(1);
            var w=Math.round(5*s),hh=Math.round(7*s);
            for(var y=-hh;y<=hh;y++){var half=y<hh*0.3?w:Math.max(0,Math.round(w*(hh-y)/(hh*0.7)));rect(h.x+2-half,h.y+y,half*2+1,1,y===-hh?'#fff6c8':'#e0a32a');}
            rect(h.x+2,h.y-hh+1,1,hh*2-1,'#fff6c8');rect(h.x+2-Math.round(w*0.6),h.y-2,Math.round(w*1.2)+1,1,'#fff6c8');
        });
        once(impact,function(){
            var q=monsterBody();
            spray({x:q.x,y:GY},{n:18,colors:['#6b5a48','#8a7560','#b09070'],speed:70,life:0.9,angle:-Math.PI/2,spread:2.2,gravity:180,size:2});
            spray({x:q.x,y:GY},{n:12,colors:['#ffd15a','#fff2af'],speed:55,life:0.5,angle:-Math.PI/2,spread:2.6});
        });
        for(var w=0;w<2;w++)(function(w){
            add(impact+w*110,520,function(e,k){var q=monsterBody();alpha((1-k)*0.95);ring(q.x,GY,6+34*easeOut(k),2,w?'#fff2af':'#ffd15a',0.28);});
        })(w);
        add(impact,320,function(e,k){var q=monsterBody();alpha(1-k);rect(q.x-3,0,7,GY,'#fff2af');});
        flash(impact,200,'#ffe27a',0.4);
        burst(impact,monsterBody,'#ffd15a','#fff2af',1.6);
        shake(impact,320,true);
        // the shield stays up around the knight for a moment (it blocks the next hit)
        add(impact+200,900,function(e,k){var h=heroBody();alpha((1-k)*0.6);ring(h.x,h.y,20+2*Math.sin(e/60),1,'#ffd15a');alpha((1-k)*0.25);disc(h.x,h.y,19,'#ffe27a');});
    },
    // ZERO-DAY STRIKE: lock-on brackets, glitch lines, four neon cuts, a 0-DAY stamp
    rogue:function(impact){
        add(0,impact+120,function(e,k){
            var q=monsterBody(),d=Math.round(26-14*easeOut(Math.min(1,k*1.3))),s=6;
            alpha(Math.floor(e/50)%2?1:0.6);
            [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(c){
                var x=q.x+c[0]*d,y=q.y+c[1]*d;
                rect(c[0]<0?x:x-s+1,y,s,1,'#39ffc0');rect(x,c[1]<0?y:y-s+1,1,s,'#39ffc0');
            });
            alpha(0.25);for(var g=0;g<4;g++){var gy=(Math.floor(e/37)*13+g*29)%H;rect(0,gy,W,1,'#39ffc0');}
        });
        var angles=[-0.75,0.75,-0.1,1.45];
        angles.forEach(function(a,i){
            var pt=null;
            add(impact+i*60,240,function(e,k){
                if(!pt)pt=monsterBody();
                var len=22*Math.min(1,k*3.5),dx=Math.cos(a),dy=Math.sin(a);
                alpha(k<0.5?1:1-(k-0.5)*2);
                line(pt.x-dx*len,pt.y-dy*len,pt.x+dx*len,pt.y+dy*len,'#39ffc0',3);
                line(pt.x-dx*len,pt.y-dy*len,pt.x+dx*len,pt.y+dy*len,'#ffffff',1);
            });
        });
        add(impact+120,700,function(e,k){var q=monsterBody();alpha(Math.floor(e/60)%3?1-k*0.6:0.3);text('0-DAY',q.x-9,q.y-30-k*4,'#39ffc0');});
        once(impact,function(){spray(monsterBody(),{n:20,colors:['#39ffc0','#d8fff3'],chars:['0','1'],speed:45,life:0.8});});
        flash(impact,160,'#39ffc0',0.25);
        burst(impact+180,monsterBody,'#39ffc0','#d8fff3',1.4);
        shake(impact+180,260,true);
    },
    // RESTORE PULSE: light gathers, a beam strikes the monster, healing rings around the mentor
    healer:function(impact){
        add(0,impact,function(e,k){
            var h=heroHand();
            for(var i=0;i<6;i++){var a=i*Math.PI/3+e/150,r=12*(1-k);sparkle(h.x+Math.cos(a)*r,h.y+Math.sin(a)*r,1,i%2?'#68ffb4':'#ffffff');}
            alpha(0.5);disc(h.x,h.y,2+3*k,'#e0fff0');
        });
        add(impact-160,520,function(e,k){
            var q=monsterBody(),w=Math.round(k<0.3?2+k/0.3*5:7*(1-(k-0.3)/0.7));
            alpha(0.85);rect(q.x-w,0,w*2+1,q.y,'#68ffb4');rect(q.x-1,0,3,q.y,'#ffffff');
        });
        flash(impact,180,'#c8ffe4',0.35);
        burst(impact,monsterBody,'#68ffb4','#e0fff0',1.4);
        shake(impact,220,false);
        for(var w=0;w<3;w++)(function(w){
            add(impact+80+w*150,650,function(e,k){var h=heroBody();alpha((1-k)*0.85);ring(h.x,h.y,4+22*easeOut(k),1,'#68ffb4');});
        })(w);
        once(impact+120,function(){var h=heroBody();spray({x:h.x,y:h.y+6},{n:14,colors:['#68ffb4','#e0fff0'],shape:'plus',speed:22,life:1.1,angle:-Math.PI/2,spread:1.8,jitter:22,vy:-12});});
    },
    // BOUNTY BREAK: a cannon, a big explosion, and coins flying back to the debugger
    pirate:function(impact){
        var fire=Math.round(impact*0.38);
        add(0,impact+200,function(e,k){
            var h=heroBody(),x=h.x+18,y=GY-5,rec=e>fire&&e<fire+120?Math.round(-3*(1-(e-fire)/120)):0;
            alpha(Math.min(1,e/120));
            rect(x-6+rec,y-2,12,5,'#2b2220');rect(x+5+rec,y-1,4,3,'#111111');rect(x-6+rec,y-2,12,1,'#5d4a40');
            disc(x-3,y+3,2.5,'#a46b22');disc(x+3,y+3,2.5,'#a46b22');px(x-3,y+3,'#3a2410');px(x+3,y+3,'#3a2410');
        });
        add(fire,160,function(e,k){var h=heroBody();alpha(1-k);disc(h.x+28,GY-4,7*(1-k)+2,'#ffd25a');disc(h.x+28,GY-4,3,'#ffffff');});
        once(fire,function(){var h=heroBody();spray({x:h.x+28,y:GY-4},{n:12,colors:['#b9ab98','#8a7c70','#d8ccbc'],speed:16,life:0.9,size:2,angle:0,spread:1.8,drag:2,vy:-8});});
        shot({from:function(){var h=heroBody();return {x:h.x+28,y:GY-4};},to:monsterBody,launch:fire,arrive:impact,arc:12,trailLen:10,
            head:function(x,y){disc(x,y,4,'#15131c');disc(x-1,y-1,1,'#8a8090');},
            trail:function(x,y,f){alpha(f*0.55);disc(x,y,1+f*2,'#a89c8c');}});
        add(impact,420,function(e,k){var q=monsterBody();alpha(1-k);disc(q.x,q.y,6+16*easeOut(k),'#ef4b14');disc(q.x,q.y,4+11*easeOut(k),'#ffb21d');disc(q.x,q.y,Math.max(0,8*(1-k*1.6)),'#fff5a6');});
        once(impact,function(){
            var q=monsterBody(),h=heroBody(),toward=(h.x-q.x)*1.1;
            spray(q,{n:14,colors:['#ffd34a','#ffe98a'],shape:'coin',speed:30,life:1.2,angle:-Math.PI/2,spread:1.2,gravity:120,vx:toward*0.9,vy:-60});
            spray(q,{n:8,colors:['#6a6060','#9a8f86'],speed:18,life:1,size:2,drag:2,vy:-12});
        });
        flash(impact,180,'#ffcf6a',0.4);
        burst(impact,monsterBody,'#ffad32','#fff0a8',1.6);
        shake(impact,300,true);
    }
};

window.BattleFX={
    heroAttack:function(id,impact,release){
        if(!setup())return;
        if(reduceMotion){burst(impact,monsterBody,'#ffd15a','#ffffff',0.8);return;}
        (ATTACKS[id]||ATTACKS.scholar)(impact,release==null?Math.round(impact*0.35):release);
    },
    heroSkill:function(id,impact){
        if(!setup())return;
        if(reduceMotion){burst(impact,monsterBody,'#ffd15a','#ffffff',1.2);return;}
        (SKILLS[id]||SKILLS.scholar)(impact);
    },
    clear:function(){effects=[];parts=[];if(ctx)ctx.clearRect(0,0,W,H);if(scene)scene.classList.remove('fx-shake','fx-shake-big');}
};
})();
