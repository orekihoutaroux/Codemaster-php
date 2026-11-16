// ===== HERO SPRITES =====
// All six heroes share one body rig (heroRig). Each hero only supplies its
// colours, hair or hat, outfit, weapon and the joint angles for its attack.
// Heroes face right, toward the monster. The ground line is y = 57.
(function(){
'use strict';
var CX=28,GY=57,ARM=6.5;

function heroRig(g,A,o){
    var st=o.style;
    var idle=A.ph===0&&A.win<=0;
    var by=A.sin(2.4)<-0.2?1:0;
    var hop=A.win>0?Math.round(Math.abs(Math.sin(A.winT*Math.PI*3))*4):0;
    var armA=A.mix(st.arm[0],st.arm[1],st.arm[2])+(idle?A.sin(2.4,1)*0.06:0);
    var wpnA=A.mix(st.wpn[0],st.wpn[1],st.wpn[2])+(idle?A.sin(2.4,1)*0.04:0);
    var offA=A.mix(st.off[0],st.off[1],st.off[2])+(idle?A.sin(2.4)*0.06:0);
    var lean=A.mix(0,st.lean[0],st.lean[1])-A.hurt*0.3;
    var step=A.mix(0,st.step[0],st.step[1]);
    var shift=Math.round(A.mix(0,st.shift[0],st.shift[1])-A.hurt*2);
    if(st.recoil&&A.fire)armA+=st.recoil*A.fire;
    if(A.win>0){armA+=(2.85-armA)*A.win;offA+=(-2.5-offA)*A.win;wpnA+=(0.15-wpnA)*A.win;}
    var fall=A.die>0?-Math.min(1,A.die/0.3)*1.25:0;
    var R={cx:CX,gy:GY,by:by,hx:CX+1,hy:30,armA:armA,wpnA:wpnA,offA:offA,skin:o.skin};

    g.fx(0.3,function(){g.e(CX+shift+1,GY+1,10-hop*0.5,2,'#000000');});
    if(o.aura&&(A.charge>0||A.skill))g.glow(CX+shift,42,13+A.charge*5,o.aura,(A.skill?0.5:0.28)*Math.max(A.charge,A.skill?0.5:0));

    g.move(shift,-hop,function(){g.pivot(CX,GY,fall,function(){
        // legs or robe (they stay planted while the upper body leans)
        if(o.robe){
            g.p([CX-5,46,CX+5,46,CX+7+step*0.6,GY-1,CX-7-Math.max(0,step)*0.3,GY-1],o.robe);
            g.flat(function(){g.r(CX-7-Math.max(0,step)*0.3,GY-3,14+step*0.6+Math.max(0,step)*0.3,1,o.robeTrim||g.tone(o.robe,-0.25));});
            g.e(CX-3,GY-0.5,2.6,1.6,o.boots);g.e(CX+4+step*0.6,GY-0.5,2.6,1.6,o.boots);
        }else{
            var fl=CX-3-Math.max(0,step)*0.5,fr=CX+3+step;
            g.c(CX-2.5,47,fl,GY-3,2.2,o.legs);g.c(CX+2.5,47,fr,GY-3,2.2,o.legs);
            g.e(fl+0.5,GY-1.2,3,2,o.boots);g.e(fr+0.8,GY-1.2,3,2,o.boots);
        }
        g.pivot(CX,48,lean,function(){g.move(0,by,function(){
            if(o.cape)o.cape(g,A,R);
            if(o.hairBack)o.hairBack(g,A,R);
            var sxO=CX-5.5,sxM=CX+5.5,sy=39.5;
            var ohx=sxO+Math.sin(offA)*ARM,ohy=sy+Math.cos(offA)*ARM;
            var mhx=sxM+Math.sin(armA)*ARM,mhy=sy+Math.cos(armA)*ARM;
            function offArm(){
                g.c(sxO,sy,ohx,ohy,2,o.sleeve);
                if(o.off)o.off(g,A,ohx,ohy,R);
                if(!o.noOffHand)g.e(ohx,ohy,1.9,1.9,o.glove||o.skin);
            }
            if(!o.offFront)offArm();
            o.torso(g,A,R);
            if(o.offFront)offArm();
            // head
            g.e(R.hx,R.hy,7,6.5,o.skin);
            if(o.hair)o.hair(g,A,R);
            if(!o.noFace)face(g,A,R,o);
            if(o.hat)o.hat(g,A,R);
            // weapon arm, drawn last so it sits in front
            g.c(sxM,sy,mhx,mhy,2,o.sleeve);
            if(o.weapon){g.save();g.tr(mhx,mhy);g.rot(wpnA);o.weapon(g,A,R);g.restore();}
            g.e(mhx,mhy,1.9,1.9,o.glove||o.skin);
            R.handX=mhx;R.handY=mhy;
            if(o.fx)o.fx(g,A,R);
        });});
    });});
}

function face(g,A,R,o){
    var x=R.hx,y=R.hy,eye=o.eye||'#2a1f33';
    g.flat(function(){
        if(A.hurt>0.2||A.die>0){
            g.r(x,y+1,2,1,eye);g.r(x+4,y+1,2,1,eye);g.r(x+2,y+4,2,2,'#7a2f36');
        }else if(A.blink){
            g.r(x,y+1,2,1,eye);g.r(x+4,y+1,2,1,eye);g.r(x+2,y+4,2,1,o.mouth||'#b3574d');
        }else{
            g.r(x,y-0.5,2,3,eye);g.r(x+4,y-0.5,2,3,eye);
            g.px(x,y-0.5,'#ffffff');g.px(x+4,y-0.5,'#ffffff');
            if(A.ph===2||A.ph===3||A.win>0.3)g.r(x+2,y+3.5,2,2,'#7a2f36');
            else g.r(x+2,y+4,2,1,o.mouth||'#b3574d');
        }
        if(o.blush)g.r(x-2,y+2.5,2,1,o.blush);
    });
}

// A curved trail that follows a swung blade.
function slashArc(g,x,y,r0,r1,a0,a1,color,strength){
    if(strength<=0.05)return;
    g.fx(Math.min(1,strength)*0.9,function(){
        g.ring(x,y,r0,r1,a0,a1,color,1);
        g.ring(x,y,r1-1.5,r1,a0+(a1-a0)*0.45,a1,'#ffffff',1);
    });
}
function sparkles(g,A,x,y,spread,color,count,rise){
    for(var i=0;i<count;i++){
        var u=((A.t*0.9+i/count)%1),ang=i*2.4+1;
        var px=x+Math.cos(ang)*spread*(0.4+0.6*((i*37%10)/10)),py=y+Math.sin(ang)*spread*0.5-u*(rise||8);
        g.spark(Math.round(px),Math.round(py),u<0.5?1:0,color,1-u);
    }
}

// ---------- THE SCHOLAR ----------
SPR.define('hero','scholar',function(g,A){heroRig(g,A,{
    skin:'#ffcc99',sleeve:'#f2f2f7',legs:'#444466',boots:'#3a2616',aura:'#54efff',eye:'#1d2c4f',
    style:{arm:[0.35,2.3,1.5],wpn:[0.5,-0.3,1.45],off:[-0.2,-0.5,-0.35],lean:[-0.08,0.12],step:[-1,2],shift:[-1,1]},
    torso:function(g,A,R){
        g.e(R.cx,43,5.6,6,'#f2f2f7');
        g.soft(function(){g.p([R.cx-5.5,39,R.cx-1,39,R.cx-0.5,49,R.cx-5.5,48],'#3355aa');g.p([R.cx+5.5,39,R.cx+2,39,R.cx+1.5,49,R.cx+5.5,48],'#3355aa');});
        g.flat(function(){g.r(R.cx,38.5,2,2,'#c33d4a');g.r(R.cx+0.5,40.5,1,5,'#c33d4a');g.r(R.cx-5,47.5,11,1.5,'#59431f');g.r(R.cx,47.5,2,1.5,'#e7b93c');});
    },
    hair:function(g,A,R){
        g.group(function(){g.e(R.hx-1,R.hy-3.6,7.2,4.2,'#5b3a26');g.e(R.hx-6,R.hy,2.2,4,'#5b3a26');g.c(R.hx+2,R.hy-6.5,R.hx+4,R.hy-8.5,1.3,'#5b3a26');});
        g.flat(function(){g.r(R.hx-4,R.hy-6,3,1,'#7d5338');});
    },
    hat:function(g,A,R){
        // glasses: pale lenses in a dark frame, with a glint now and then
        g.flat(function(){
            var f='#2f3a55',lens=A.sin(1.3)>0.86?'#ffffff':'#cfeeff';
            g.r(R.hx-1,R.hy-1.5,4,5,f);g.r(R.hx+3.5,R.hy-1.5,4,5,f);g.r(R.hx+3,R.hy,1,1,f);g.r(R.hx-6,R.hy,5,1,f);
            g.r(R.hx-0.5,R.hy-1,3,4,lens);g.r(R.hx+4,R.hy-1,3,4,lens);
            if(A.hurt>0.2||A.blink){g.r(R.hx,R.hy+1,2,1,f);g.r(R.hx+4.5,R.hy+1,2,1,f);}
            else{g.r(R.hx+1,R.hy,1.5,2,'#1d2c4f');g.r(R.hx+5.5,R.hy,1.5,2,'#1d2c4f');}
        });
    },
    off:function(g,A,x,y){
        // open spell book resting on the forearm
        g.pivot(x,y,-0.25,function(){
            g.r(x-6,y-4,11,6,'#8a4f22');
            g.soft(function(){g.r(x-5,y-5,4.5,5.5,'#fff3d6');g.r(x,y-5,4.5,5.5,'#ffe9bd');});
            g.flat(function(){g.r(x-4,y-3.5,3,0.8,'#b08d57');g.r(x-4,y-2,2,0.8,'#b08d57');g.r(x+1,y-3.5,3,0.8,'#b08d57');g.r(x+1,y-2,2,0.8,'#b08d57');});
        });
        if(A.charge>0||A.fire>0)g.glow(x-1,y-5,5+A.charge*3,'#54efff',0.55);
    },
    weapon:function(g,A){
        g.c(0,2.5,0,-9,1,'#4a3526');
        g.flat(function(){g.r(-1,-3,2,1,'#e7b93c');});
        g.e(0,-10.5,1.6,1.6,'#9af7ff');
        if(A.charge>0||A.fire>0)g.glow(0,-10.5,3+A.charge*4+A.fire*3,'#54efff',0.75);
    },
    fx:function(g,A,R){
        if(A.fire>0){
            var d=Math.round((1-A.fire)*7);
            g.fx(A.fire,function(){g.glyph('<',R.cx+13+d,31,'#aefaff');g.glyph('/',R.cx+17+d,31,'#ffe36e');g.glyph('>',R.cx+21+d,31,'#aefaff');});
        }
        if(A.skill)sparkles(g,A,R.cx,44,13,'#aefaff',6,12);
    }
});});

// ---------- THE WIZARD ----------
SPR.define('hero','wizard',function(g,A){heroRig(g,A,{
    skin:'#ffe0bd',sleeve:'#6633aa',robe:'#6633aa',robeTrim:'#ffdd44',boots:'#33214d',aura:'#a768ff',eye:'#3b1f66',
    style:{arm:[0.55,2.0,1.35],wpn:[0.1,-0.3,0.95],off:[-0.25,0.9,-0.7],lean:[-0.1,0.14],step:[-1,2],shift:[-1,1]},
    torso:function(g,A,R){
        g.e(R.cx,43,5.8,6.2,'#6633aa');
        g.flat(function(){g.r(R.cx-0.5,38,2,10,'#8855cc');g.r(R.cx-5,46.5,11,1.5,'#ffdd44');g.r(R.cx,46.5,2,1.5,'#fff3a8');});
    },
    hair:function(g,A,R){
        // long white beard and bushy brows
        g.group(function(){g.e(R.hx+1,R.hy+5,5.5,3.2,'#f1f1f4');g.p([R.hx-3,R.hy+5,R.hx+6,R.hy+5,R.hx+2+A.sin(2.4)*0.6,R.hy+13],'#f1f1f4');g.e(R.hx-5.5,R.hy+1,2,3.5,'#f1f1f4');});
        g.flat(function(){g.r(R.hx-1,R.hy-2,3,1,'#f1f1f4');g.r(R.hx+4,R.hy-2,3,1,'#f1f1f4');g.r(R.hx+1,R.hy+8,2,1,'#c9c9d4');g.r(R.hx+2,R.hy+10,1,1,'#c9c9d4');});
    },
    mouth:'#f1f1f4',
    hat:function(g,A,R){
        var sway=A.sin(2.4)*0.8;
        g.group(function(){
            g.p([R.hx-6,R.hy-4,R.hx+7,R.hy-4,R.hx+3,R.hy-11,R.hx-3+sway,R.hy-17,R.hx-6+sway,R.hy-15,R.hx-2,R.hy-10],'#7744bb');
            g.e(R.hx+0.5,R.hy-4,10,2.2,'#7744bb');
        });
        g.flat(function(){g.r(R.hx-5,R.hy-6.5,11,1.5,'#ffdd44');g.r(R.hx,R.hy-10,1,3,'#ffdd44');g.r(R.hx-1,R.hy-9,3,1,'#ffdd44');});
    },
    off:function(g,A,x,y){if(A.charge>0.1){g.glow(x,y,2+A.charge*3,'#d9b3ff',0.8);g.spark(Math.round(x),Math.round(y),1,'#ffffff',A.charge);}},
    weapon:function(g,A){
        g.c(0,10,0,-13,1.2,'#8a5a2b');
        g.group(function(){g.c(-2.5,-13,-3,-17,1,'#c9972b');g.c(2.5,-13,3,-17,1,'#c9972b');g.r(-2.5,-14,5,1.5,'#c9972b');});
        g.e(0,-17,2.6,2.6,'#ffdd44');
        g.flat(function(){g.px(-1,-18.5,'#ffffff');});
        var power=A.charge+A.fire;
        g.glow(0,-17,4+power*5+A.sin(4)*0.6,power>0.1?'#c79bff':'#ffe98a',0.45+Math.min(0.45,power*0.5));
        if(A.fire>0.3)g.spark(0,-17,3,'#ffffff',A.fire);
    },
    fx:function(g,A,R){if(A.skill||A.charge>0.4)sparkles(g,A,R.cx,44,14,'#d9b3ff',7,13);}
});});

// ---------- THE KNIGHT ----------
SPR.define('hero','knight',function(g,A){heroRig(g,A,{
    skin:'#e8b87e',sleeve:'#9da3c4',legs:'#7d829f',boots:'#4d5068',glove:'#c9cde6',aura:'#ffd15a',noFace:true,offFront:true,
    style:{arm:[0.4,3.35,1.2],wpn:[0.2,-1.0,1.95],off:[-0.15,-0.5,0.3],lean:[-0.16,0.26],step:[-1,4],shift:[-1,2]},
    cape:function(g,A,R){
        var s=A.sin(2.4)*1.2+A.mix(0,2,-4);
        g.p([R.cx-5,38,R.cx+3,38,R.cx-1,48,R.cx-8+s,54,R.cx-11+s,51,R.cx-8,43],'#b3262f');
    },
    torso:function(g,A,R){
        g.e(R.cx,43,6,6.2,'#aab0cf');
        g.soft(function(){g.e(R.cx-5.5,39,3,2.4,'#c9cde6');g.e(R.cx+5.5,39,3,2.4,'#c9cde6');});
        g.flat(function(){g.r(R.cx-0.5,40,2,6,'#c62d36');g.r(R.cx-2.5,42,6,2,'#c62d36');g.r(R.cx-5,47.5,11,1.5,'#5a5d78');g.r(R.cx,47.5,2,1.5,'#e7b93c');});
    },
    hair:function(g,A,R){
        // full helm with a visor slit and a red plume
        g.group(function(){g.e(R.hx,R.hy-0.5,7.4,7,'#aab0cf');g.r(R.hx-5,R.hy+3,11,3.5,'#aab0cf');});
        var s=A.sin(2.4)*1;
        g.p([R.hx-1,R.hy-7,R.hx+2,R.hy-8,R.hx-2+s,R.hy-13,R.hx-7+s,R.hy-12,R.hx-9+s,R.hy-7,R.hx-5,R.hy-8],'#d1343f');
        g.flat(function(){
            g.r(R.hx-2,R.hy-0.5,9,2.5,'#1a1626');
            g.r(R.hx+1,R.hy,2,1.5,A.hurt>0.2?'#ff5d6c':'#7fd6ff');g.r(R.hx+5,R.hy,1.5,1.5,A.hurt>0.2?'#ff5d6c':'#7fd6ff');
            g.r(R.hx-6,R.hy-3,13,1,'#d9dcf0');g.r(R.hx+2.5,R.hy-7,1,4,'#d9dcf0');
            g.r(R.hx+1,R.hy+3.5,1,2,'#6f7391');g.r(R.hx+3,R.hy+3.5,1,2,'#6f7391');g.r(R.hx+5,R.hy+3.5,1,2,'#6f7391');
        });
    },
    off:function(g,A,x,y){
        // kite shield
        g.p([x-6,y-7,x+4,y-7,x+5,y,x-1,y+8,x-7,y],'#5f77c9');
        g.soft(function(){g.p([x-4.5,y-5.5,x+2.5,y-5.5,x+3.3,y-0.5,x-1,y+5.5,x-5.3,y-0.5],'#dfe4f7');});
        g.flat(function(){g.r(x-1.8,y-5,1.8,9,'#c62d36');g.r(x-4.5,y-2.5,7.5,1.8,'#c62d36');});
    },
    noOffHand:true,
    weapon:function(g,A){
        g.p([-1.6,-3,1.6,-3,1.6,-15,0,-18,-1.6,-15],'#e4eaf6');
        g.flat(function(){g.r(-0.4,-14,0.9,11,'#aeb8d0');});
        g.r(-3.6,-3.8,7.2,1.8,'#e7b93c');
        g.c(0,-1,0,2,1,'#7a4a22');g.e(0,3,1.5,1.5,'#e7b93c');
        if(A.skill&&A.charge>0)g.glow(0,-10,4+A.charge*4,'#ffd15a',0.6);
    },
    fx:function(g,A,R){
        slashArc(g,R.cx+6,40,13,24,-2.5,0.75,'#ffe9a0',A.swish);
        if(A.skill)sparkles(g,A,R.cx,44,13,'#ffe9a0',6,11);
    }
});});

// ---------- THE HACKER ----------
SPR.define('hero','rogue',function(g,A){heroRig(g,A,{
    skin:'#c68642',sleeve:'#2a2a3d',legs:'#1c1c2b',boots:'#11111c',glove:'#11111c',aura:'#39ffc0',noFace:true,
    style:{arm:[0.45,-0.9,1.55],wpn:[1.2,0.7,1.6],off:[-0.35,0.9,-1.0],lean:[-0.14,0.3],step:[-2,5],shift:[-1,3]},
    torso:function(g,A,R){
        g.e(R.cx,43,5.6,6,'#2a2a3d');
        g.flat(function(){
            g.r(R.cx+0.5,38,1,10,'#4a4a66');g.r(R.cx-5,47.5,11,1.5,'#59431f');g.r(R.cx-1,47.5,2,1.5,'#39ffc0');
            g.glyph('<',R.cx-4,41,'#39ffc0');g.glyph('>',R.cx+2,41,'#39ffc0');
        });
    },
    hair:function(g,A,R){
        // hood, shadowed face and a glowing visor
        g.group(function(){g.e(R.hx-0.5,R.hy-0.5,7.6,7.2,'#2a2a3d');g.p([R.hx-7,R.hy-2,R.hx-9,R.hy+5,R.hx-4,R.hy+6],'#2a2a3d');});
        g.soft(function(){g.e(R.hx+2,R.hy+1,5,4.6,'#17131f');});
        var glow=A.hurt>0.2?'#ff5d6c':(A.blink?'#1c8f74':'#39ffc0');
        g.flat(function(){g.r(R.hx-1,R.hy,7,2,glow);g.r(R.hx+0,R.hy,1,1,'#d8fff3');g.r(R.hx+4,R.hy,1,1,'#d8fff3');g.r(R.hx+1,R.hy+4,3,1,'#3d3348');});
        g.glow(R.hx+2.5,R.hy+1,5,'#39ffc0',0.25);
    },
    off:function(g,A,x,y,R){g.pivot(x,y,-0.9+A.mix(0,0.6,-1.5),function(){dagger(g,x,y);});},
    weapon:function(g,A){dagger(g,0,0);},
    fx:function(g,A,R){
        if(A.swish>0.05){
            g.fx(A.swish,function(){
                g.c(R.cx+10,34,R.cx+26,46,1.2,'#39ffc0',0.2);g.c(R.cx+11,47,R.cx+27,35,1.2,'#d8fff3',0.2);
            });
        }
        if(A.skill)sparkles(g,A,R.cx,44,13,'#39ffc0',6,11);
    }
});});
function dagger(g,x,y){
    var G2=g;
    G2.p([x-1.4,y-2.5,x+1.4,y-2.5,x,y-10],'#c9fff0');
    G2.r(x-2.4,y-3,4.8,1.4,'#39ffc0');
    G2.c(x,y-1,x,y+1.5,0.9,'#11111c');
}

// ---------- THE MENTOR ----------
SPR.define('hero','healer',function(g,A){heroRig(g,A,{
    skin:'#fde2c8',sleeve:'#ffffff',robe:'#fbfbff',robeTrim:'#44dd88',boots:'#b9a48c',aura:'#68ffb4',eye:'#2f7a4a',blush:'#f6a9a0',
    style:{arm:[0.5,2.5,2.0],wpn:[0.05,-0.1,0.45],off:[-0.25,-1.6,-1.0],lean:[-0.06,0.08],step:[0,1],shift:[0,1]},
    hairBack:function(g,A,R){
        var s=A.sin(2.4)*0.8;
        g.p([R.hx-7,R.hy-3,R.hx+4,R.hy-4,R.hx+3,R.hy+6,R.hx-4+s,R.hy+15,R.hx-10+s,R.hy+13,R.hx-9,R.hy+4],'#f6c544');
    },
    torso:function(g,A,R){
        g.e(R.cx,43,5.6,6.2,'#fbfbff');
        g.flat(function(){g.r(R.cx-5,46.5,11,1.6,'#44dd88');g.r(R.cx+0,39.5,2,6,'#44dd88');g.r(R.cx-2,41.5,6,2,'#44dd88');});
    },
    hair:function(g,A,R){
        g.group(function(){g.e(R.hx-1,R.hy-3.4,7.4,4.6,'#f6c544');g.e(R.hx-6.2,R.hy+1,2.2,4.5,'#f6c544');g.e(R.hx+6.5,R.hy-0.5,1.6,2.6,'#f6c544');});
        g.flat(function(){g.r(R.hx-4,R.hy-6,4,1,'#ffe88a');g.r(R.hx-5,R.hy-2,12,1,'#44dd88');g.r(R.hx+2,R.hy-3,2,2,'#c8ffe0');});
    },
    off:function(g,A,x,y){if(A.charge>0.1||A.fire>0){g.glow(x,y-1,3+A.charge*3,'#a6ffd5',0.7);}},
    weapon:function(g,A){
        g.c(0,10,0,-12,1.1,'#b08a55');
        g.ring(0,-16,2.6,4.2,-0.6,3.75,'#f6d76a');
        g.e(0,-16,1.8,1.8,'#58f0a0');
        var power=A.charge+A.fire;
        g.glow(0,-16,4.5+power*6+A.sin(3.5)*0.5,'#7dffc0',0.42+Math.min(0.5,power*0.5));
        if(A.fire>0.2)g.spark(0,-16,3,'#ffffff',A.fire);
    },
    fx:function(g,A,R){
        sparkles(g,A,R.cx,46,11,'#a6ffd5',A.skill?9:(A.charge>0.3?5:2),12);
        if(A.skill&&A.fire>0){g.fx(A.fire*0.8,function(){g.r(R.cx-1,24,3,12,'#d9ffeb');g.r(R.cx-5,28,11,3,'#d9ffeb');});}
    }
});});

// ---------- THE DEBUGGER ----------
SPR.define('hero','pirate',function(g,A){heroRig(g,A,{
    skin:'#dba97e',sleeve:'#c22a2a',legs:'#33355a',boots:'#4a3320',aura:'#ffad32',eye:'#2a1a10',noOffHand:true,
    style:{arm:[0.3,1.0,1.5],wpn:[2.84,2.14,1.64],off:[-0.3,-0.7,-0.5],lean:[-0.05,0.1],step:[0,2],shift:[0,-1],recoil:0.5},
    cape:function(g,A,R){
        var s=A.sin(2.4)*0.8;
        g.p([R.cx-6,40,R.cx-2,40,R.cx-3,50,R.cx-8+s,54,R.cx-9,47],'#8f1d22');
    },
    torso:function(g,A,R){
        g.e(R.cx,43,5.8,6.1,'#c22a2a');
        g.soft(function(){g.p([R.cx-1.5,38,R.cx+3.5,38,R.cx+2.5,47,R.cx-0.5,47],'#f3ead8');});
        g.flat(function(){
            g.r(R.cx-5,47,11,1.8,'#4a3320');g.r(R.cx,47,2.2,1.8,'#ffdd44');
            g.px(R.cx-3,41,'#ffdd44');g.px(R.cx-3,44,'#ffdd44');g.r(R.cx+4,39,1,8,'#8f1d22');
        });
    },
    hair:function(g,A,R){
        // beard, moustache and an eye patch
        g.soft(function(){g.e(R.hx+1.5,R.hy+5.2,5,2.3,'#3a2a22');g.e(R.hx-5.8,R.hy+2,1.4,3.4,'#3a2a22');});
        g.flat(function(){g.r(R.hx+0.5,R.hy+3.5,4,1,'#3a2a22');});
    },
    mouth:'#8c4a3c',
    hat:function(g,A,R){
        // eye patch over the near eye, then a tricorn with a skull badge
        g.flat(function(){g.r(R.hx-6,R.hy-1.5,13,1,'#1a1414');g.r(R.hx-1,R.hy-1.5,4,4,'#1a1414');});
        g.group(function(){
            g.p([R.hx-10,R.hy-5,R.hx+10,R.hy-5,R.hx+7,R.hy-9,R.hx+3,R.hy-13,R.hx-3,R.hy-13,R.hx-7,R.hy-9],'#2f2937');
            g.e(R.hx,R.hy-5.2,10.5,1.6,'#2f2937');
        });
        g.flat(function(){
            g.r(R.hx-8,R.hy-7,17,1,'#e7b93c');
            g.r(R.hx,R.hy-11.5,3,2,'#f3f3f3');g.r(R.hx+0.5,R.hy-9.5,2,1,'#f3f3f3');g.px(R.hx,R.hy-11,'#2f2937');g.px(R.hx+2,R.hy-11,'#2f2937');
        });
    },
    off:function(g,A,x,y){
        // hook hand
        g.r(x-1.5,y-1.5,3,2.5,'#6b5a4a');
        g.ring(x-0.5,y+3,1.6,2.9,-1.3,2.6,'#d5d8e0');
    },
    weapon:function(g,A){
        // flintlock pistol: barrel points away from the hand
        g.c(0,0.5,-2.2,2.6,1.4,'#7a4a22');
        g.r(-1.4,-9,2.8,9,'#51515f');
        g.r(-1.9,-10.2,3.8,1.8,'#e7b93c');
        g.flat(function(){g.r(0.8,-4,1.4,2,'#e7b93c');});
        if(A.fire>0.15){
            g.glow(0,-13,3+A.fire*5,'#ffcf5a',0.9);
            g.fx(A.fire,function(){g.p([-3,-11,3,-11,5,-15,1.5,-14,0,-19,-1.5,-14,-5,-15],'#fff2a8');});
        }
        if(A.ph===3||A.ph===4){
            var u=A.ph===3?A.q*0.5:0.5+A.q*0.5;
            g.fx((1-u)*0.6,function(){g.e(-1+u*2,-13-u*6,2+u*2.5,2+u*2,'#d8d0c4');g.e(2,-16-u*8,1.5+u*2,1.5+u*2,'#bdb3a6');});
        }
    },
    fx:function(g,A,R){
        if(A.skill){for(var i=0;i<5;i++){var u=((A.t*1.1+i/5)%1);g.fx(1-u,function(){g.e(Math.round(R.cx-10+i*5),Math.round(52-u*16),1.6,1.6,'#ffe672');});}}
    }
});});
})();
