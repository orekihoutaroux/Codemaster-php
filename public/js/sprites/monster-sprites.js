// ===== MONSTER AND BOSS SPRITES =====
// Monsters face left, toward the hero. The ground line is y = 58 and the body
// is centred near x = 34. Each one is drawn from shapes (see sprites/sprite-engine.js)
// and reads the animation state A: A.mix(rest, wound, struck) for attack joints,
// A.charge / A.swish / A.fire for effects, A.hurt for flinching.
(function(){
'use strict';
var CX=34,GY=58;

// Shared set-up: ground shadow, a small lunge toward the hero, and a flinch.
function stage(g,A,o,draw){
    var lunge=o.lunge||[2,-4];
    var lx=Math.round(A.mix(0,lunge[0],lunge[1])+A.hurt*3);
    var lift=o.float?1:0;
    g.fx(o.float?0.2:0.3,function(){g.e(CX+lx,GY+1,((o.shadow||10)-lift*2)*(o.scale||1),2,'#000000');});
    var k=o.scale||1;
    g.move(lx,0,function(){g.pivot(CX,GY,A.hurt*0.16,function(){
        if(k===1)draw();else g.squash(CX,GY,k,k,draw);
    });});
}
function eye(g,x,y,w,h,color,pupil,A){
    g.solid(function(){g.flat(function(){
        if(A&&(A.hurt>0.2||A.blink)){g.r(x,y+Math.floor(h/2),w,1,pupil||'#1a1420');return;}
        g.r(x,y,w,h,color);
        if(pupil)g.r(x,y+(h>2?1:0),Math.max(1,w-1),Math.max(1,h-1),pupil);
        g.px(x+(pupil?w-1:0),y,'#ffffff');
    });});
}
function teeth(g,x,y,n,step,down,color){
    g.solid(function(){g.flat(function(){
        for(var i=0;i<n;i++){g.r(x+i*step,y,1.6,1,color||'#fff8e6');g.r(x+i*step+0.3,y+(down?1:-1),1,1,color||'#fff8e6');}
    });});
}
function bigGlyph(g,ch,x,y,color,scale){
    g.save();g.tr(x,y);g.sc(scale||2,scale||2);g.flat(function(){g.glyph(ch,0,0,color);});g.restore();
}
function embers(g,A,x,y,spread,color,count,rise){
    for(var i=0;i<count;i++){
        var u=((A.t*0.8+i/count)%1),ox=Math.sin(i*2.7+1)*spread;
        g.fx(1-u,function(){g.r(Math.round(x+ox+Math.sin(A.t*3+i)*1.5),Math.round(y-u*(rise||12)),1,1,color);});
    }
}

// ============================ FLOOR 1 ============================
SPR.define('enemy','bug_sprite',function(g,A){stage(g,A,{shadow:11,scale:1.3},function(){
    var rear=A.mix(0,0.28,-0.18),scut=A.ph===0?Math.floor(A.t*7)%2:1;
    g.pivot(CX+8,GY-2,rear,function(){
        for(var i=0;i<3;i++){
            var x=CX-7+i*6,k=(i+scut)%2?1.5:-1.5;
            g.c(x,51,x-2+k,GY-1,0.9,'#256b2a');g.c(x+2,51,x+4-k,GY-1,0.9,'#1d5522');
        }
        // glassy wings buzz during the attack
        if(A.ph===2||A.ph===3||A.ph===1){var w=A.sin(60)>0?1:0;g.fx(0.45,function(){g.e(CX+4,38-w*2,8,3+w,'#d9fff0');g.e(CX+7,40+w,7,2.5,'#bff5df');});}
        g.e(CX+2,46,10.5,7.2,'#46c84a');
        g.flat(function(){
            g.r(CX+1,39.5,1,13,'#2c8a33');g.r(CX-4,42,2,2,'#2c8a33');g.r(CX+6,43,2,2,'#2c8a33');g.r(CX-3,48,2,2,'#2c8a33');g.r(CX+7,48,2,2,'#2c8a33');
            g.r(CX-3,40.5,3,1,'#9df29a');
        });
        g.e(CX-9,48,5.4,4.8,'#35a03c');
        g.c(CX-11,44,CX-15,38+A.bob(7,1),0.7,'#256b2a');g.c(CX-8,44,CX-10,37+A.bob(7,1,1.5),0.7,'#256b2a');
        g.flat(function(){g.px(CX-16,37+A.bob(7,1),'#d9ff95');g.px(CX-11,36+A.bob(7,1,1.5),'#d9ff95');});
        eye(g,CX-13,45,3,3,'#ff3b3b','#7a0c14',A);eye(g,CX-8,45,2,3,'#ff3b3b','#7a0c14',A);
        var open=A.mix(0,1.5,3);
        g.c(CX-12,51,CX-16,52-open,0.8,'#f1ead0');g.c(CX-12,52,CX-16,53+open*0.6,0.8,'#f1ead0');
    });
    if(A.fire>0)g.spark(CX-18,51,2,'#d9ff95',A.fire);
});});

SPR.define('enemy','null_ghost',function(g,A){stage(g,A,{shadow:9,float:true,lunge:[3,-5],scale:1.25},function(){
    var oy=A.bob(2.2,2)-2,rise=A.mix(0,-2,1),mouth=A.mix(1.2,1.6,4.6),arm=A.mix(0,-5,-2);
    g.translucent(0.8);
    g.move(0,oy+rise,function(){
        g.group(function(){
            g.e(CX,39,10.5,10.5,'#b9b4ea');g.r(CX-10.5,39,21,12,'#b9b4ea');
            for(var i=0;i<4;i++)g.e(CX-7.8+i*5.2+A.sin(4,i)*0.8,51+A.sin(4,i*1.3)*1.2,2.7,3.4,'#b9b4ea');
            g.e(CX-11,44+arm,3.4,2.4,'#b9b4ea');g.e(CX+11,45+arm*0.6,3.2,2.3,'#b9b4ea');
        });
        g.flat(function(){g.r(CX+2,31,4,1,'#e6e3ff');g.r(CX+5,32,2,1,'#e6e3ff');g.glyph('0',CX+4,45,'#8f88cf');});
        g.solid(function(){g.flat(function(){
            var glow=A.charge>0.2||A.fire>0||A.ph===2;
            g.e(CX-6,38,2.4,3.2,'#1b1530');g.e(CX+0.5,38,2.4,3.2,'#1b1530');
            if(A.hurt>0.2){g.r(CX-8,38,4,1,'#b9b4ea');g.r(CX-1.5,38,4,1,'#b9b4ea');}
            else{g.r(CX-7,37,1.5,2,glow?'#ff4466':'#ffffff');g.r(CX-0.5,37,1.5,2,glow?'#ff4466':'#ffffff');}
            g.e(CX-3,45,2.2,mouth,'#1b1530');
        });});
    });
    if(A.charge>0.2||A.fire>0)g.glow(CX-3,42+oy,9+A.fire*6,'#a98cff',0.35+A.fire*0.3);
});});

SPR.define('enemy','var_slime',function(g,A){
    var sy=A.ph===0?1+A.sin(3.2)*0.06:A.mix(1,0.72,1.28);
    stage(g,A,{shadow:13,lunge:[1,-5],scale:1.3},function(){
        g.squash(CX,GY,1/Math.sqrt(sy)*1.02,sy,function(){
            g.group(function(){g.e(CX,50,13,8,'#34cf8c');g.e(CX-1,44,8,6,'#34cf8c');g.e(CX+11,55,3,2.4,'#34cf8c');g.e(CX-12,55.5,2.4,2,'#34cf8c');});
            g.soft(function(){g.e(CX+2,51,7,4.4,'#27a871');});
            bigGlyph(g,'$',CX+0,46.5,'#ffd24a',2);
            g.flat(function(){g.r(CX-6,40.5,3,1,'#d6ffe9');g.r(CX-8,42,1,2,'#d6ffe9');g.r(CX+7,45,1,1,'#a8f5cf');});
            eye(g,CX-9,45,3,4,'#ffffff','#14261c',A);eye(g,CX-3,45,3,4,'#ffffff','#14261c',A);
            g.solid(function(){g.flat(function(){
                var open=A.mix(1,1,3);g.r(CX-8,51,6,open,'#0f3d2a');
                if(open>1.5){g.r(CX-7,51,1,1,'#ffffff');g.r(CX-4,51,1,1,'#ffffff');}
            });});
        });
        var d=(A.t*5)%7;g.e(CX+13,49+d,1.2,1.7,'#34cf8c');
        if(A.fire>0){for(var i=0;i<4;i++)g.fx(A.fire,function(){g.e(CX-14-i*2-(1-A.fire)*5,48-i*3+(1-A.fire)*8,1.5,1.5,'#7df5c0');});}
    });
});

// ============================ FLOOR 2 ============================
SPR.define('enemy','scope_bat',function(g,A){stage(g,A,{shadow:8,float:true,lunge:[4,-6],scale:1.3},function(){
    var oy=A.bob(4,2)-9+A.mix(0,-3,5),flap=A.ph===0?A.sin(13):A.mix(0,1,-0.8),dive=A.mix(0,0.25,-0.5);
    g.pivot(CX,42+oy,dive,function(){g.move(0,oy,function(){
        function wing(dir){
            var tipY=36-flap*7,ex=CX+dir*17;
            g.p([CX+dir*3,40,ex,tipY,ex+dir*1,tipY+5,CX+dir*13,tipY+9+flap*2,CX+dir*10,45+flap,CX+dir*7,48,CX+dir*3,46],'#553399');
            g.flat(function(){g.c(CX+dir*4,41,ex-dir*1,tipY+1,0.5,'#7a55c4');g.c(CX+dir*4,42,CX+dir*12,tipY+8+flap*2,0.5,'#7a55c4');});
        }
        wing(1);wing(-1);
        g.group(function(){g.e(CX,43,5.6,6.6,'#6f48b8');g.p([CX-5,39,CX-6,31,CX-1,37],'#6f48b8');g.p([CX+5,39,CX+6,31,CX+1,37],'#6f48b8');});
        g.flat(function(){g.r(CX-5,34,1,3,'#e39ad0');g.r(CX+4,34,1,3,'#e39ad0');g.r(CX-2,46,4,3,'#8d68d0');});
        eye(g,CX-4,41,3,2,'#ff3344','#fff0a8',A);eye(g,CX+1,41,3,2,'#ff3344','#fff0a8',A);
        g.solid(function(){g.flat(function(){
            var open=A.mix(1,1,3);g.r(CX-3,45,5,open,'#2a1244');g.r(CX-3,45,1,2,'#ffffff');g.r(CX+1,45,1,2,'#ffffff');
        });});
        g.c(CX-2,49,CX-3,52,0.7,'#3f2577');g.c(CX+2,49,CX+3,52,0.7,'#3f2577');
    });});
    if(A.swish>0.1)g.fx(A.swish*0.7,function(){g.c(CX+8,26,CX-12,44,1.4,'#c9a8ff',0.2);g.c(CX+14,30,CX-6,48,1,'#ffffff',0.2);});
});});

SPR.define('enemy','loop_worm',function(g,A){stage(g,A,{shadow:14,lunge:[3,-5],scale:1.1},function(){
    var reach=A.mix(0,-3,6),i,segs=[];
    for(i=0;i<8;i++){
        var x=CX-11+i*3.4+(i<3?-reach*(3-i)/3:0);
        var y=52-Math.abs(Math.sin(A.t*3.2+i*0.75))*4-(i===0?A.mix(2,7,1):0)-(i===1?A.mix(1,3,0):0);
        segs.push([x,y,i]);
    }
    // the tail curls into a ring that keeps turning: an endless loop
    for(i=0;i<9;i++){var a=i*0.698-A.t*2.2;segs.push([CX+17+Math.cos(a)*5.4,46.5+Math.sin(a)*5.4,8+i]);}
    for(i=segs.length-1;i>=0;i--){
        var s=segs[i],r=i===0?5.4:(i<8?4.4-s[2]*0.22:2.3);
        g.e(s[0],s[1],r,r,s[2]%2?'#b86f1f':'#d98f36');
        if(i>0&&i<8)g.flat(function(){g.r(s[0]-1,s[1]+r-1.5,2,1,'#f3c98a');});
    }
    var h=segs[0];
    eye(g,h[0]-4,h[1]-2,2,3,'#ffffff','#3a1206',A);eye(g,h[0]-0.5,h[1]-2.5,2,3,'#ffffff','#3a1206',A);
    var open=A.mix(0.5,2,3.5);
    g.c(h[0]-4,h[1]+2,h[0]-8,h[1]+1-open*0.4,0.8,'#fff0cf');g.c(h[0]-3.5,h[1]+3.5,h[0]-7.5,h[1]+4+open*0.5,0.8,'#fff0cf');
    g.flat(function(){g.r(h[0]+1,h[1]-5,2,1,'#f3c98a');});
    if(A.swish>0.1)g.fx(A.swish*0.8,function(){g.ring(CX-6,48,10,13,2.2,4.6,'#ffd27a',-1);});
});});

SPR.define('enemy','syntax_skeleton',function(g,A){stage(g,A,{shadow:9,lunge:[2,-5],scale:1.2},function(){
    var by=A.sin(2.6)<-0.2?1:0,lean=A.mix(0,0.14,-0.24),armA=A.mix(-0.5,-3.1,-1.15),wA=A.mix(-0.35,0.9,-1.9),step=A.mix(0,1,-3);
    var bone='#ece9db',dk='#b9b4a2';
    g.c(CX-2.5,49,CX-3+step,GY-2,1.1,bone);g.c(CX+2.5,49,CX+4,GY-2,1.1,bone);
    g.e(CX-4+step,GY-1,2.6,1.4,bone);g.e(CX+5,GY-1,2.6,1.4,bone);
    g.pivot(CX,49,lean,function(){g.move(0,by,function(){
        g.c(CX+5,39,CX+8,45+A.sin(2.6)*0.6,1,bone);g.e(CX+8,46,1.4,1.4,bone);
        g.c(CX,38,CX,49,1.1,bone);
        g.group(function(){g.e(CX,42.5,5,4.4,bone);g.r(CX-3.5,47.5,7,2.2,bone);});
        g.flat(function(){g.r(CX-4,40.5,8,1,'#3b3644');g.r(CX-4,42.5,8,1,'#3b3644');g.r(CX-3,44.5,6,1,'#3b3644');g.r(CX-0.5,39,1,8,dk);});
        g.group(function(){g.e(CX-1,32,6.4,6,bone);g.r(CX-5,35,7,4,bone);});
        g.solid(function(){g.flat(function(){
            g.r(CX-5.5,31,3,3,'#1d1826');g.r(CX-1,31,3,3,'#1d1826');
            var hot=A.ph===2||A.ph===3||A.charge>0.3;
            g.r(CX-5,32,1.5,1.5,A.hurt>0.2?'#ffffff':(hot?'#ffd24a':'#ff3b4e'));g.r(CX-0.5,32,1.5,1.5,A.hurt>0.2?'#ffffff':(hot?'#ffd24a':'#ff3b4e'));
            g.r(CX-3,35,1,1.5,'#1d1826');g.r(CX-5,37,7,1,'#3b3644');
            for(var i=0;i<4;i++)g.r(CX-4.5+i*1.8,36.5,0.8,2,'#1d1826');
            g.r(CX+2,28,2,1,'#ffffff');
        });});
        // weapon arm: a bone staff topped with a giant semicolon
        var sx=CX-5,sy=39.5,hx=sx+Math.sin(armA)*7,hy=sy+Math.cos(armA)*7;
        g.c(sx,sy,hx,hy,1,bone);
        g.save();g.tr(hx,hy);g.rot(wA);
        g.c(0,6,0,-9,0.9,'#8b7a5c');
        g.e(0,-17,2.2,2.2,'#f4e7a8');
        g.p([-2.2,-13,2.2,-13,2.4,-10,-1.5,-6.5,-0.5,-10],'#f4e7a8');
        g.restore();
        g.e(hx,hy,1.5,1.5,bone);
    });});
    if(A.swish>0.05)g.fx(A.swish*0.85,function(){g.ring(CX-5,40,12,21,2.0,4.9,'#fff6c9',-1);});
});});

// ============================ FLOOR 3 ============================
SPR.define('enemy','array_golem',function(g,A){stage(g,A,{shadow:14,lunge:[2,-4],scale:1.2},function(){
    var j=function(i){return A.ph===0?A.bob(2,1,i*1.7):0;};
    var stone='#5a66cf',dk='#3d47a3',lite='#8792ee';
    var fx=A.mix(CX-17,CX-12,CX-22),fy=A.mix(45,28,50)+j(3);
    g.r(CX-10,GY-4,7,4,dk);g.r(CX+3,GY-4,7,4,dk);
    g.r(CX+11,42+j(1),6,7,dk);
    g.r(CX-11+j(0),46,22,9,stone);
    g.r(CX-9+j(1),37,18,9,stone);
    g.r(CX-7+j(2),28,13,9,lite);
    g.flat(function(){
        g.glyph('[',CX-6+j(0),48,'#c9d2ff');g.glyph('0',CX-1+j(0),48,'#ffe36e');g.glyph(']',CX+4+j(0),48,'#c9d2ff');
        g.glyph('[',CX-5+j(1),39,'#c9d2ff');g.glyph('1',CX+0+j(1),39,'#ffe36e');g.glyph(']',CX+4+j(1),39,'#c9d2ff');
        g.r(CX+7+j(0),47,2,1,dk);g.r(CX+6+j(1),44,1,1,dk);g.r(CX-8+j(1),38,2,1,lite);
    });
    var hot=A.charge>0.2||A.ph===2||A.ph===3;
    eye(g,CX-6+j(2),31,3,2,hot?'#ffd24a':'#7df6ff',null,A);eye(g,CX-1+j(2),31,3,2,hot?'#ffd24a':'#7df6ff',null,A);
    g.solid(function(){g.flat(function(){g.r(CX-5+j(2),34.5,6,1,'#1f2460');});});
    // near arm and block fist
    g.c(CX-9,40,fx+3,fy+3,1.8,dk);
    g.r(fx-3,fy-1,8,8,lite);
    g.flat(function(){g.r(fx-2,fy+2,6,1,dk);g.r(fx-2,fy+4,6,1,dk);});
    if(A.ph===3)g.fx((1-A.q)*0.8,function(){g.ring(CX-20,GY-1,3+A.q*7,5+A.q*8,3.2,6.2,'#d4e0ff',0);});
    if(hot)g.glow(CX-2+j(2),32,6,'#7df6ff',0.3);
});});

SPR.define('enemy','sql_inject',function(g,A){stage(g,A,{shadow:13,lunge:[4,-6],scale:1.25},function(){
    var sway=A.ph===0?A.sin(2.2)*1.5:0,hx=CX-4+sway+A.mix(0,5,-9),hy=34+A.mix(0,-3,7),open=A.mix(0,1,3.4);
    var body='#1f6b36',belly='#c8e3a0',dk='#144a25';
    // tail ends in an injection needle
    g.c(CX+10,54,CX+17,47+A.sin(3)*1,1.6,body,1);
    g.flat(function(){g.c(CX+17,47+A.sin(3),CX+19,42+A.sin(3),0.5,'#e8f0f5');});
    g.e(CX+17,48+A.sin(3),1.6,1.6,'#9fe0ff');
    g.group(function(){g.e(CX+2,54,12,3.8,body);g.e(CX+1,50.5,9,3.4,body);});
    g.flat(function(){g.r(CX-7,53.5,16,1,dk);g.r(CX-4,50,10,1,dk);});
    g.c(CX+1,50,hx+3,hy+6,3.6,body,3);
    g.flat(function(){g.c(CX-0.5,49,hx+1.5,hy+7,1.3,belly);});
    // hood with a "--" comment mark
    g.e(hx+3,hy+2,8,7,body);
    g.soft(function(){g.e(hx+2,hy+3,5,5,belly);});
    g.flat(function(){g.r(hx+2,hy+3,3,1,'#c98a1e');g.r(hx+2,hy+5,3,1,'#c98a1e');});
    g.group(function(){g.e(hx-3,hy+1,5,4,body);g.e(hx-6.5,hy+2,2.6,2.4,body);});
    eye(g,hx-5,hy-1,3,2,'#b4ff3d','#12240c',A);
    g.solid(function(){g.flat(function(){
        if(open>0.6){g.r(hx-8.5,hy+3,6,open,'#5a0d1c');g.r(hx-8,hy+3,1,Math.min(2,open),'#ffffff');g.r(hx-5,hy+3,1,Math.min(2,open),'#ffffff');}
        var flick=A.ph===0&&A.sin(5)>0.4;
        if(flick||open>2){g.r(hx-12,hy+4,4,1,'#ff5d7c');g.px(hx-13,hy+3,'#ff5d7c');g.px(hx-13,hy+5,'#ff5d7c');}
    });});
    if(A.fire>0)g.fx(A.fire,function(){g.glyph('-',hx-17,hy+2,'#43ff91');g.glyph('-',hx-21+Math.round((1-A.fire)*-4),hy+2,'#43ff91');});
});});

SPR.define('enemy','type_mimic',function(g,A){stage(g,A,{shadow:13,lunge:[2,-5],scale:1.3},function(){
    var chatter=A.ph===0&&A.sin(7)>0.75?0.1:0.02,open=A.ph===0?chatter:A.mix(0.02,0.95,0.42);
    var hop=A.ph===0?0:Math.round(A.mix(0,-1,-3)),wood='#b8752e',dk='#8a541c',metal='#e7b93c';
    g.move(0,hop,function(){
        g.c(CX-8,GY-2,CX-10,GY,1.4,dk);g.c(CX+8,GY-2,CX+10,GY,1.4,dk);
        // inside of the mouth
        g.r(CX-11,45,22,3,'#3d0d18');
        var tl=A.mix(0,2,13);
        if(tl>1){g.c(CX-2,47,CX-8-tl,50+Math.sin(A.t*20)*1.5,2.2,'#ff6b8e',1.4);}
        g.r(CX-12,47,24,10,wood);
        g.flat(function(){
            g.r(CX-12,51,24,1.5,dk);g.r(CX-9,47,2,10,metal);g.r(CX+7,47,2,10,metal);
            g.r(CX-2,49,4,4,metal);g.r(CX-1,50.5,2,1.5,'#3d2a10');
        });
        teeth(g,CX-10,46,7,3.2,false);
        g.pivot(CX+12,46,open,function(){
            g.group(function(){g.r(CX-12,38,24,8,wood);g.e(CX,38.5,12,4,wood);});
            g.flat(function(){g.r(CX-9,35.5,2,10.5,metal);g.r(CX+7,35.5,2,10.5,metal);g.r(CX-12,44.5,24,1.5,dk);});
            eye(g,CX-6,39,4,3,'#fff4a8','#b01d2a',A);eye(g,CX+1,39,4,3,'#fff4a8','#b01d2a',A);
            g.solid(function(){g.flat(function(){g.r(CX-7,38,5,1,'#5c3510');g.r(CX+1,38,5,1,'#5c3510');});});
            teeth(g,CX-10,46,7,3.2,true);
        });
    });
    if(A.fire>0)g.spark(CX-20,48,2,'#ffe8bd',A.fire);
});});

// ============================ FLOOR 4 ============================
SPR.define('enemy','regex_spider',function(g,A){stage(g,A,{shadow:16,lunge:[3,-5],scale:1.1},function(){
    var by=A.ph===0?A.bob(3,1):Math.round(A.mix(0,-2,1)),body='#5e3f8f',dk='#402a66',walk=A.ph===0?A.sin(3):0;
    function leg(dir,i,raise){
        var bx=CX+dir*(2+i*1.6)-3,kx=CX+dir*(9+i*3.2)-3,ky=38+i*1.2+by-raise*5;
        var fxp=CX+dir*(13+i*3.8)-3+((i%2)?walk:-walk)*0.8,fy=GY-1-raise*13;
        if(raise>0)fxp-=raise*4;
        g.c(bx,46+by,kx,ky,1,dk);g.c(kx,ky,fxp,fy,0.9,body,0.5);
    }
    var up=A.mix(0,1,0.25);
    for(var i=3;i>=0;i--){leg(1,i,0);leg(-1,i,i<2?up*(i===0?1:0.6):0);}
    g.move(0,by,function(){
        g.e(CX+5,43,8.5,7.6,body);
        g.flat(function(){g.glyph('*',CX+2,39,'#ffd24a');g.glyph('*',CX+6,43,'#ffd24a');g.r(CX+10,41,1,1,'#8f6fc6');g.r(CX+1,46,1,1,'#8f6fc6');});
        g.e(CX-6,46,6,5.4,'#70509f');
        g.solid(function(){g.flat(function(){
            var c=A.hurt>0.2?'#ffffff':'#ff2f45';
            g.r(CX-10,44,2,2,c);g.r(CX-7,43,2,2,c);g.r(CX-10,47,1,1,c);g.r(CX-7,46.5,1,1,c);g.r(CX-4,44,1,1,c);
            g.px(CX-10,44,'#ffd0d6');g.px(CX-7,43,'#ffd0d6');
        });});
        var bite=A.mix(0,1,2.5);
        g.c(CX-10,50,CX-12,52+bite,0.9,'#f1e9ff');g.c(CX-6,50.5,CX-7,53+bite,0.9,'#f1e9ff');
    });
    // web shot
    if(A.fire>0||A.ph===3){var u=A.ph===3?A.q:0;g.fx(1-u,function(){
        g.c(CX-12,48,CX-20-u*6,44-u*2,0.5,'#ffffff');g.c(CX-12,48,CX-21-u*6,50,0.5,'#ffffff');g.c(CX-12,48,CX-19-u*6,55,0.5,'#ffffff');
        g.ring(CX-12,48,6+u*5,7+u*5,2.2,4.1,'#e9e2ff',0);
    });}
});});

SPR.define('enemy','exception_wraith',function(g,A){stage(g,A,{shadow:9,float:true,lunge:[4,-6],scale:1.15},function(){
    var oy=A.bob(2,2)-3,red='#b3242f',dk='#7a141f',reach=A.mix(0,4,-7),sw=A.sin(3);
    g.translucent(0.9);
    g.move(0,oy,function(){
        // ragged cloak
        g.p([CX-8,38,CX+8,38,CX+11,50,CX+8+sw,57,CX+5,52,CX+2+sw,58,CX-1,53,CX-4+sw,58,CX-7,52,CX-10+sw,56,CX-11,48],red);
        g.e(CX-1,35,9,9,red);
        g.soft(function(){g.e(CX-2.5,36,6,6.4,'#1c0d16');});
        g.flat(function(){g.r(CX+3,28,3,1,'#e0606a');g.r(CX+5,44,1,6,dk);g.r(CX-3,45,1,7,dk);g.r(CX+1,47,1,5,dk);});
        g.solid(function(){g.flat(function(){
            var c=A.hurt>0.2?'#ff9aa6':(A.charge>0.3||A.ph>=2?'#ffe36e':'#ffffff');
            g.r(CX-7,34,3,1.5,c);g.r(CX-2,34,3,1.5,c);g.px(CX-7,33,c);g.px(CX+0,33,c);
        });});
        // bony hands, one holding a warning sign
        var hx=CX-13+reach,hy=44-A.mix(0,6,0);
        g.c(CX-7,42,hx+2,hy,1.1,dk);g.c(CX+7,42,CX+12,47+sw,1.1,dk);
        g.solid(function(){g.flat(function(){g.r(CX+12,47+sw,3,1,'#f1e6d0');g.r(CX+12,49+sw,2,1,'#f1e6d0');});});
        var tx=hx-3-(A.ph===3?A.q*8:(A.ph===4?8:0)),ty=hy-3;
        if(A.ph!==4){
            g.solid(function(){
                g.p([tx,ty-6,tx+5.5,ty+4,tx-5.5,ty+4],'#ffd23d');
                g.flat(function(){g.r(tx-0.5,ty-3,1.2,4,'#3a1a00');g.r(tx-0.5,ty+2,1.2,1.2,'#3a1a00');});
            });
            if(A.charge>0.2||A.fire>0)g.glow(tx,ty,7+A.fire*4,'#ff4777',0.45);
        }
        g.solid(function(){g.flat(function(){g.r(hx,hy-1,3,1,'#f1e6d0');g.r(hx,hy+1,3,1,'#f1e6d0');});});
    });
});});

SPR.define('enemy','callback_phantom',function(g,A){stage(g,A,{shadow:9,float:true,lunge:[5,-7],scale:1.3},function(){
    var oy=A.bob(2.6,2)-3,blue='#5a86e0',lite='#9cc0ff',st=A.mix(0,-1,3);
    g.translucent(0.62+A.sin(9)*0.1+(A.ph===2?0.2:0));
    // echo of itself that trails behind when it strikes
    if(A.ph===2||A.ph===3){g.fx(0.28,function(){g.e(CX+7+st*2,40+oy,8,9,lite);});g.fx(0.16,function(){g.e(CX+14+st*3,40+oy,7,8,lite);});}
    g.move(0,oy,function(){
        // body, with a tail that loops back like a callback arrow
        g.ring(CX+9,47,4.5,7.5,-1.2,3.6,blue);
        g.p([CX+13,39,CX+17,42,CX+12,45],blue);
        g.group(function(){g.e(CX-1,39,9,9.5,blue);g.p([CX-9,42,CX+8,42,CX+5,52,CX-2,49],blue);});
        g.flat(function(){g.r(CX+1,31,4,1,'#d3e4ff');g.glyph('(',CX-1,45,lite);g.glyph(')',CX+3,45,lite);});
        g.e(CX-11-st,43,3.2,2.3,blue);g.e(CX+8,46,2.8,2.1,blue);
        eye(g,CX-7,37,3,3,'#3dfcff','#0c3a66',A);eye(g,CX-2,37,3,3,'#3dfcff','#0c3a66',A);
        g.solid(function(){g.flat(function(){var m=A.mix(1,1,3);g.r(CX-5,42.5,4,m,'#1a2a5c');});});
    });
    if(A.fire>0)g.fx(A.fire,function(){g.ring(CX-14,42+oy,3+(1-A.fire)*6,4.5+(1-A.fire)*6,0,6.3,'#ddf7ff',0);});
});});

// ============================ FLOOR 5 ============================
SPR.define('enemy','closure_trap',function(g,A){stage(g,A,{shadow:13,lunge:[2,-5],scale:1.2},function(){
    var open=A.ph===0?0.55+A.sin(2.2)*0.08:A.mix(0.55,1.05,0),hop=A.ph===0?0:Math.round(A.mix(0,-1,-2));
    var wood='#7b4a1d',dk='#55310f',steel='#c9ccd6';
    g.move(0,hop,function(){
        g.c(CX-8,GY-2,CX-11,GY,1.5,dk);g.c(CX+8,GY-2,CX+11,GY,1.5,dk);
        // the thing that lives in the crate
        var peek=A.ph===0?A.bob(2.2,1):Math.round(A.mix(0,2,-2));
        g.e(CX,41+peek,8.5,7,'#1c1226');
        var hot=A.charge>0.3||A.ph>=2;
        eye(g,CX-6,38+peek,3,3,hot?'#ff8a2b':'#ffd400','#3a1500',A);eye(g,CX-0.5,38+peek,3,3,hot?'#ff8a2b':'#ffd400','#3a1500',A);
        g.solid(function(){g.flat(function(){g.r(CX-5,43+peek,7,1,'#d972ff');});});
        g.r(CX-12,45,24,12,wood);
        g.flat(function(){
            g.r(CX-12,49,24,1,dk);g.r(CX-12,53,24,1,dk);g.r(CX-10,45,1,12,dk);g.r(CX+9,45,1,12,dk);
            g.glyph('{',CX-5,48,'#ffd24a');g.glyph('}',CX+3,48,'#ffd24a');
        });
        // two curved steel jaws, shaped like braces, that snap shut over the top
        function jaw(dir){
            g.pivot(CX+dir*12,46,dir*open,function(){
                g.p([CX+dir*13,46,CX+dir*14,37,CX+dir*9,30,CX+dir*1,28,CX+dir*0.5,32,CX+dir*6,34,CX+dir*9,39,CX+dir*9,46],steel);
                g.solid(function(){g.flat(function(){
                    g.r(CX+dir*8.5-0.8,41,1.6,1.6,'#f4f6fb');g.r(CX+dir*7.5-0.8,36.5,1.6,1.6,'#f4f6fb');g.r(CX+dir*4.5-0.8,33.5,1.6,1.6,'#f4f6fb');g.r(CX+dir*1.5-0.8,32.5,1.6,1.6,'#f4f6fb');
                    g.r(CX+dir*11.5-1,43,2,2,'#8f93a3');
                });});
            });
        }
        jaw(-1);jaw(1);
    });
    if(A.ph===3)g.fx(1-A.q,function(){g.spark(CX,30,3,'#ffffff',1);g.ring(CX,36,4+A.q*8,5.5+A.q*8,3.3,6.1,'#f1d7ff',0);});
});});

SPR.define('enemy','cache_cinder',function(g,A){stage(g,A,{shadow:11,lunge:[2,-5],scale:1.35},function(){
    var surge=A.mix(0,-1,6),t=A.t;
    g.glow(CX,46,15+surge,'#ff6d22',0.32);
    function flame(x,base,h,w,color,ph){
        var s=Math.sin(t*9+ph)*1.6,s2=Math.sin(t*13+ph*2)*1;
        g.p([x-w,base,x-w*0.7+s2,base-h*0.45,x+s,base-h,x+w*0.6+s2,base-h*0.5,x+w,base],color);
    }
    g.soft(function(){
        flame(CX-5,48,13+surge,4,'#ff4a12',0);flame(CX+1,47,18+surge*1.4,5,'#ff4a12',1.7);flame(CX+6,48,12+surge,4,'#ff4a12',3.1);
    });
    g.flat(function(){
        flame(CX-4,48,8+surge*0.7,2.4,'#ffb000',0.6);flame(CX+1,47,12+surge,3,'#ffb000',2.2);flame(CX+6,48,7+surge*0.6,2.2,'#ffb000',3.6);
        flame(CX+1,47,6+surge*0.6,1.5,'#fff36a',2.9);
    });
    // charred body with glowing cracks
    g.group(function(){g.e(CX,51,10,6.6,'#3b2622');g.e(CX-8,54,3.4,3,'#3b2622');g.e(CX+8,54.5,3.4,2.8,'#3b2622');});
    g.flat(function(){
        var c=A.sin(5)>0?'#ff7a18':'#ffb000';
        g.r(CX+3,48,1,3,c);g.r(CX+4,50,3,1,c);g.r(CX+6,51,1,3,c);g.r(CX-7,52,2,1,c);g.r(CX-2,55,4,1,c);g.r(CX+1,54,1,2,c);
    });
    eye(g,CX-7,49,3,3,'#fff36a','#ff4a12',A);eye(g,CX-2,49,3,3,'#fff36a','#ff4a12',A);
    g.solid(function(){g.flat(function(){var m=A.mix(1,1,3);g.r(CX-6,53.5,5,m,'#ff8a1e');if(m>1.5)g.r(CX-5,54,3,m-1,'#fff36a');});});
    embers(g,A,CX,40,8,'#ffd27a',5,16);
    if(A.fire>0){for(var i=0;i<3;i++)g.fx(A.fire,function(){g.e(CX-13-i*4-(1-A.fire)*6,50-i*2,2.2-i*0.4,2.2-i*0.4,i?'#ff7a18':'#fff36a');});}
});});

SPR.define('enemy','daemon_imp',function(g,A){stage(g,A,{shadow:9,lunge:[3,-6],scale:1.15},function(){
    var hop=A.ph===0?-Math.round(Math.abs(A.sin(5))*3):Math.round(A.mix(0,-2,0)),flap=A.sin(10)*3,thrust=A.mix(0,4,-8);
    var red='#d9342c',dk='#9c1b24',lite='#ff6a4d';
    g.move(0,hop,function(){
        // wings and tail behind
        g.p([CX+3,40,CX+14,32-flap,CX+15,38-flap*0.5,CX+12,39,CX+13,44,CX+5,45],dk);
        g.c(CX+4,50,CX+12,53,1.3,red,0.8);g.c(CX+12,53,CX+15,47+A.sin(4),0.8,red);
        g.p([CX+15,47+A.sin(4),CX+13,43+A.sin(4),CX+18,44+A.sin(4)],'#ffb347');
        g.c(CX-2,51,CX-3,GY-2,1.6,dk);g.c(CX+3,51,CX+4,GY-2,1.6,dk);
        g.e(CX-4,GY-1,2.6,1.5,'#3a1116');g.e(CX+5,GY-1,2.6,1.5,'#3a1116');
        g.e(CX+1,46,5.6,6.4,red);
        g.soft(function(){g.e(CX,47.5,3.2,3.8,lite);});
        // head, horns and ears
        g.c(CX-6,30,CX-8,24,1.6,'#ffcf74',0.5);g.c(CX+3,30,CX+6,24,1.6,'#ffcf74',0.5);
        g.p([CX+5,34,CX+11,31,CX+6,38],red);
        g.e(CX-2,35,7.2,6.4,red);
        eye(g,CX-7,33,3,3,'#fff36a','#2a0508',A);eye(g,CX-2,33,3,3,'#fff36a','#2a0508',A);
        g.solid(function(){g.flat(function(){
            g.r(CX-8,32,4,1,'#5c0c14');g.r(CX-2,32,4,1,'#5c0c14');
            g.r(CX-7,38,7,2,'#3a060c');g.r(CX-6,38,1,1,'#ffffff');g.r(CX-4,38,1,1,'#ffffff');g.r(CX-2,38,1,1,'#ffffff');
        });});
        // pitchfork
        var px=CX-9+thrust,py=45;
        g.c(CX+4,42,CX+8,46,1.3,dk);
        g.c(px+12,py-4,px-6,py+2,0.8,'#5a3a22');
        g.group(function(){g.c(px-6,py+2,px-11,py+3.5,0.8,'#d5d8e0');g.c(px-7,py-1,px-11,py+0.5,0.8,'#d5d8e0');g.c(px-5,py+5,px-10,py+6.5,0.8,'#d5d8e0');g.c(px-7,py-1,px-5,py+5,0.8,'#d5d8e0');});
        g.c(CX-4,42,px+2,py,1.3,red);g.e(px+2,py,1.6,1.6,red);
        if(A.fire>0)g.glow(px-11,py+3,4+A.fire*5,'#ffcf74',0.8);
    });
    embers(g,A,CX,50,9,'#ffb347',3,14);
});});

// ============================== BOSSES ==============================
SPR.define('enemy','stack_overflow',function(g,A){stage(g,A,{shadow:17,lunge:[2,-3]},function(){
    var n=5,BH=7.8,cols=['#b81d2c','#cc2a36','#dd3a40','#ee4c4a','#ff6258'],tilt=A.mix(0,1.6,-3.4);
    var sway=function(i){return (A.ph===0?Math.sin(A.t*2.2+i*0.7)*i*0.6:0)+tilt*i;};
    // floating block fists
    var fy=A.mix(40,22,46)+A.bob(2,1),fxp=A.mix(CX-19,CX-13,CX-24);
    g.r(CX+15+sway(2),38+A.bob(2,1,2),7,7,cols[1]);
    for(var i=0;i<n;i++){
        var w=24-i*1.6,x=CX-w/2+sway(i),y=GY-(i+1)*BH;
        g.r(x,y,w,BH,cols[i]);
        if(i<n-1)g.flat(function(){
            g.glyph('(',Math.round(x+w/2-4),Math.round(y+2),'#ffd3dc');g.glyph(')',Math.round(x+w/2+1),Math.round(y+2),'#ffd3dc');
            g.r(x+1.5,y+1,3,1,g.tone(cols[i],0.35));g.r(x+w-4,y+6,2,1,g.tone(cols[i],-0.3));
        });
    }
    var tx=CX+sway(n-1),ty=GY-n*BH;
    var hot=A.charge>0.2||A.ph>=2;
    eye(g,tx-8,ty+2,4,3,hot?'#ffffff':'#fff36a','#3a0008',A);eye(g,tx-1,ty+2,4,3,hot?'#ffffff':'#fff36a','#3a0008',A);
    g.solid(function(){g.flat(function(){
        g.r(tx-9,ty+1,5,1,'#5c0612');g.r(tx-1,ty+1,5,1,'#5c0612');
        var m=A.mix(1,1,3);g.r(tx-7,ty+6-m*0.5,9,m,'#3a0008');if(m>1.5){g.r(tx-6,ty+5,1,1,'#fff');g.r(tx-3,ty+5,1,1,'#fff');g.r(tx,ty+5,1,1,'#fff');}
    });});
    // a new frame keeps trying to push onto the top
    var pop=(A.t*0.7)%1;
    g.fx(0.75*(1-pop),function(){g.r(tx-7,ty-5-pop*7,14,4,'#ff8f86');});
    g.r(fxp-4,fy-1,9,9,cols[3]);
    g.flat(function(){g.r(fxp-3,fy+2,7,1,'#8f1220');g.r(fxp-3,fy+5,7,1,'#8f1220');});
    if(A.ph===3)g.fx((1-A.q)*0.85,function(){g.ring(CX-22,GY-1,3+A.q*8,5.5+A.q*9,3.2,6.2,'#ffd3dc',0);});
    if(A.skill&&A.charge>0)g.glow(CX,36,18+A.charge*6,'#ff4668',0.3);
});});

SPR.define('enemy','deadlock_dragon',function(g,A){stage(g,A,{shadow:18,lunge:[3,-4]},function(){
    var pur='#7b33c9',dk='#54208f',belly='#d7b8ff',flap=A.sin(3)*3,by=A.bob(2,1);
    // wings and tail
    function wing(x,spread){g.p([x,38,x+spread,18-flap,x+spread+3,27-flap,x+spread-2,30,x+spread+1,38-flap*0.5,x+spread-5,40,x+3,46],dk);}
    wing(CX+4,14);wing(CX-2,9);
    g.c(CX+12,50,CX+22,53,3,pur,1.4);g.c(CX+22,53,CX+27,46+A.sin(2.5)*1.5,1.4,pur,0.8);
    g.p([CX+27,46+A.sin(2.5)*1.5,CX+24,42+A.sin(2.5)*1.5,CX+30,42+A.sin(2.5)*1.5],'#e0c8ff');
    // legs and body
    g.c(CX-5,52,CX-7,GY-2,2.6,dk);g.c(CX+9,52,CX+10,GY-2,2.6,dk);
    g.e(CX-8,GY-1,3.6,1.8,dk);g.e(CX+10,GY-1,3.6,1.8,dk);
    g.e(CX+3,46+by,13,9.5,pur);
    g.soft(function(){g.e(CX,48+by,8,6.4,belly);});
    g.flat(function(){g.r(CX-6,45+by,12,1,'#b693ea');g.r(CX-7,48+by,14,1,'#b693ea');g.r(CX-6,51+by,12,1,'#b693ea');});
    // two heads that are chained to each other
    function head(nx,ny,hx,hy,phase){
        var st=A.ph===0?Math.sin(A.t*2+phase)*1.5:0,ax=A.mix(0,5,-8)*(phase?0.8:1),ay=A.mix(0,-4,5)*(phase?0.6:1);
        hx+=st+ax;hy+=ay;
        g.c(nx,ny+by,hx+3,hy+3,3.2,pur,2.6);
        g.flat(function(){g.c(nx-1.5,ny+1+by,hx+1.5,hy+4.5,0.8,belly);});
        g.c(hx+2,hy-3,hx+6,hy-8,1.3,'#f1e3ff',0.4);g.c(hx-1,hy-3,hx+1,hy-8,1.2,'#f1e3ff',0.4);
        g.group(function(){g.e(hx,hy,5.6,4.6,pur);g.e(hx-5.5,hy+1.4,3.8,3,pur);});
        eye(g,hx-3,hy-2,3,2,'#ffe600','#3a1a00',A);
        var open=A.mix(0,1,3.6);
        g.solid(function(){g.flat(function(){
            g.px(hx-8,hy,'#2a0f4d');
            if(open>0.5){g.r(hx-9,hy+2.5,7,open,'#4a0f2e');g.r(hx-8,hy+2.5,1,1,'#fff');g.r(hx-5,hy+2.5,1,1,'#fff');}
            else g.r(hx-9,hy+3,6,1,'#2a0f4d');
        });});
        if(A.fire>0){g.fx(A.fire*0.9,function(){g.p([hx-9,hy+3,hx-22,hy-1+phase,hx-24,hy+5,hx-22,hy+10-phase],'#b58cff');g.p([hx-9,hy+4,hx-18,hy+2,hx-19,hy+7],'#f0e8ff');});}
        return [hx,hy];
    }
    var h2=head(CX+4,40,CX-3,22,1.6),h1=head(CX-4,43,CX-13,33,0);
    g.solid(function(){g.flat(function(){
        // chain and padlock between the necks
        var mx=(h1[0]+h2[0])/2+4,my=(h1[1]+h2[1])/2+5;
        for(var i=0;i<4;i++){var u=i/3;g.r(Math.round(h1[0]+4+(h2[0]-h1[0]+2)*u),Math.round(h1[1]+5+(h2[1]-h1[1]+3)*u+Math.sin(u*3.14)*2),1.6,1.6,'#c9ccd6');}
        g.r(mx-2,my,5,4,'#e7b93c');g.r(mx-1,my-2,3,2,'#8f93a3');g.px(mx,my+1,'#3a2a00');
    });});
    if(A.skill&&A.charge>0)g.glow(CX-4,34,16+A.charge*6,'#806cff',0.3);
});});

SPR.define('enemy','memory_leak',function(g,A){
    var sy=A.ph===0?1+A.sin(2)*0.04:A.mix(1,0.86,1.12);
    stage(g,A,{shadow:20,lunge:[2,-4]},function(){
        var c='#8a4fe0',dk='#5c2fa8',lite='#c59bff',t=A.t,reach=A.mix(0,-4,10);
        g.translucent(0.9);
        // puddle and drips: it never stops leaking
        g.e(CX,GY-1,21,2.6,dk);
        for(var i=0;i<4;i++){var d=((t*0.9+i*0.27)%1);g.e(CX-15+i*10,46+d*10,1.4,1.8+d,c);}
        g.squash(CX,GY,1/Math.sqrt(sy),sy,function(){
            g.group(function(){
                g.e(CX,43,18,14,c);g.e(CX-11,34+Math.sin(t*2)*1,6,6,c);g.e(CX+9,32+Math.sin(t*2.4+1)*1,7,6.4,c);g.e(CX+15,46,6,8,c);
                g.c(CX-12,46,CX-21-reach,43-A.mix(0,8,-2),4.4,c,2.2);
            });
            g.soft(function(){g.e(CX+3,46,10,8,dk);});
            // bubbles of lost memory rising inside
            for(var b=0;b<5;b++){var u=((t*0.5+b*0.21)%1);g.fx(0.5*(1-u),function(){g.ring(CX-8+b*5,52-u*20,1.2,2.2,0,6.3,lite,0);});}
            g.flat(function(){g.r(CX-12,30,4,1,'#ead0ff');g.r(CX-14,32,1,3,'#ead0ff');g.glyph('0',CX+10,45,lite);g.glyph('X',CX+14,40,lite);});
            // one huge eye, two small ones
            g.solid(function(){
                g.e(CX-6,38,5.4,5,'#fff7ff');
                g.flat(function(){
                    if(A.hurt>0.2||A.blink)g.r(CX-11,37.5,10,1.5,'#2a0f4d');
                    else{g.e(CX-7.5+A.mix(0,1,-1),38.5,2.6,3,'#ff3b6b');g.r(CX-8.5+A.mix(0,1,-1),37.5,2,3,'#2a0010');g.px(CX-6,36,'#ffffff');}
                });
            });
            eye(g,CX+5,33,3,3,'#fff7ff','#ff3b6b',A);eye(g,CX+11,37,2,2,'#fff7ff','#ff3b6b',A);
            // wide dripping mouth
            var open=A.mix(2,2,7);
            g.solid(function(){g.flat(function(){
                g.e(CX-3,49,8,open*0.9,'#22063f');
                if(open>3)g.e(CX-2,50,4,2,'#c2336d');
            });});
            teeth(g,CX-9,48-open*0.5,5,3,true);
        });
        if(A.fire>0)g.fx(A.fire*0.8,function(){g.ring(CX-24,42,2+(1-A.fire)*6,4+(1-A.fire)*6,0,6.3,'#ead0ff',0);});
        if(A.skill&&A.charge>0)g.glow(CX,42,20+A.charge*6,'#b655ff',0.3);
    });
});

SPR.define('enemy','recursion_hydra',function(g,A){stage(g,A,{shadow:19,lunge:[2,-3]},function(){
    var teal='#1f9c86',dk='#12665f',belly='#bff5d9',t=A.t;
    // tail and body
    g.c(CX+12,52,CX+23,54,3.2,teal,1.6);g.c(CX+23,54,CX+28,48+Math.sin(t*2.4)*1.5,1.6,teal,0.7);
    g.c(CX-6,53,CX-8,GY-2,2.8,dk);g.c(CX+10,53,CX+11,GY-2,2.8,dk);
    g.e(CX-9,GY-1,3.8,1.8,dk);g.e(CX+11,GY-1,3.8,1.8,dk);
    g.e(CX+4,49,13.5,7.6,teal);
    g.soft(function(){g.e(CX+1,51,8.5,4.6,belly);});
    g.flat(function(){for(var s=0;s<4;s++)g.r(CX+3+s*4,42+((s%2)?1:0),2,1,'#35c9a8');});
    // three necks, each one a chain of joints ending in a head
    var necks=[{bx:CX+8,by:44,hx:CX+4,hy:17,ph:2.2,d:0.16},{bx:CX+2,by:44,hx:CX-9,hy:23,ph:1.1,d:0.08},{bx:CX-4,by:46,hx:CX-17,hy:35,ph:0,d:0}];
    necks.forEach(function(nk,idx){
        var sw=A.ph===0?Math.sin(t*2+nk.ph)*2:0;
        // heads strike one after another
        var local=A.ph===0?0:Math.max(0,Math.min(1,(A.p-nk.d)/0.6)),bite=A.ph===0?0:Math.sin(local*Math.PI);
        var hx=nk.hx+sw-bite*9+(A.ph===1?A.q*3:0),hy=nk.hy+Math.cos(t*2+nk.ph)*1+bite*6;
        var mx=(nk.bx+hx)/2+5,my=(nk.by+hy)/2-2;
        for(var i=0;i<=6;i++){
            var u=i/6,x=(1-u)*(1-u)*nk.bx+2*(1-u)*u*mx+u*u*hx,y=(1-u)*(1-u)*nk.by+2*(1-u)*u*my+u*u*hy;
            g.e(x+2,y+2,3.4-u*0.7,3.4-u*0.7,i%2?teal:'#27b59a');
        }
        g.p([hx+2,hy-3,hx+7,hy-7,hx+5,hy-1],'#ff8a5c');
        g.group(function(){g.e(hx,hy,5.2,4.2,teal);g.e(hx-5,hy+1.6,3.6,2.8,teal);});
        eye(g,hx-3,hy-2,3,2,'#ff3864','#fff0a8',A);
        var open=A.ph===0?0:bite*3.6;
        g.solid(function(){g.flat(function(){
            g.px(hx-7,hy,'#0b3d3a');
            if(open>0.8){g.r(hx-8.5,hy+2.5,7,open,'#5a0d2a');g.r(hx-8,hy+2.5,1,1.4,'#fff');g.r(hx-5,hy+2.5,1,1.4,'#fff');}
            else g.r(hx-8.5,hy+3,6,1,'#0b3d3a');
        });});
        if(bite>0.75)g.fx((bite-0.75)*4*0.8,function(){g.ring(hx-9,hy+3,3,5,2.0,4.3,'#d7ffe3',0);});
    });
    if(A.skill&&A.charge>0)g.glow(CX-4,34,18+A.charge*6,'#32ef79',0.28);
});});

SPR.define('enemy','fatal_error_titan',function(g,A){stage(g,A,{shadow:20,lunge:[2,-4]},function(){
    var iron='#6b1a24',dk='#451018',plate='#8f2630',t=A.t,pulse=0.5+0.5*Math.sin(t*4),lava=pulse>0.5?'#ffcf33':'#ff7a18';
    var by=A.sin(2)<-0.2?1:0,lean=A.mix(0,0.1,-0.16);
    var armA=A.mix(0.25,2.9,0.95),fxp=CX-12-Math.sin(armA)*12,fyp=31+Math.cos(armA)*12;
    g.glow(CX,38,22+pulse*2+A.charge*5,'#ff321d',0.2+A.charge*0.2);
    // legs
    g.c(CX-6,48,CX-8,GY-3,4,dk);g.c(CX+7,48,CX+9,GY-3,4,dk);
    g.r(CX-13,GY-4,10,4,iron);g.r(CX+4,GY-4,10,4,iron);
    g.pivot(CX,50,lean,function(){g.move(0,by,function(){
        // far arm
        g.c(CX+13,30,CX+17,42+A.sin(2)*1,3.6,dk);g.e(CX+17,45+A.sin(2)*1,4.4,4.4,iron);
        // torso with molten cracks and an X on the chest
        g.group(function(){g.e(CX,37,13.5,12,iron);g.r(CX-9,42,18,8,iron);});
        g.soft(function(){g.e(CX-1,35,8,7,plate);});
        g.flat(function(){
            g.r(CX-10,44,5,1,lava);g.r(CX-6,45,1,3,lava);g.r(CX+5,43,4,1,lava);g.r(CX+8,44,1,3,lava);g.r(CX-2,47,5,1,lava);
        });
        bigGlyph(g,'X',CX-4,30,lava,2);
        // shoulder plates with spikes
        g.group(function(){g.e(CX-13,27,6,5,plate);g.p([CX-17,24,CX-19,17,CX-13,23],plate);});
        g.group(function(){g.e(CX+12,27,6,5,plate);g.p([CX+15,24,CX+19,17,CX+11,23],plate);});
        // head with horns and burning eyes
        g.c(CX-6,19,CX-10,11,2,'#ffcf74',0.4);g.c(CX+4,19,CX+8,11,2,'#ffcf74',0.4);
        g.group(function(){g.e(CX-1,21,6.4,5.6,dk);g.r(CX-6,22,10,5,dk);});
        g.solid(function(){g.flat(function(){
            var c=A.hurt>0.2?'#ffffff':lava;
            g.r(CX-6,20,3.4,2,c);g.r(CX-1,20,3.4,2,c);g.px(CX-6,20,'#fff9d6');g.px(CX-1,20,'#fff9d6');
            var m=A.mix(1,1,3);g.r(CX-5,24.5,7,m,'#ff7a18');for(var i=0;i<3;i++)g.r(CX-4.5+i*2.4,24.5,1,1,'#2a0508');
        });});
        // near arm and giant fist
        g.c(CX-12,29,fxp,fyp,4,iron);
        g.e(fxp,fyp,6,6,plate);
        g.flat(function(){g.r(fxp-4,fyp-1,8,1,dk);g.r(fxp-4,fyp+2,8,1,dk);g.r(fxp-3,fyp-4,2,1,lava);});
        if(A.charge>0.2)g.glow(fxp,fyp,7+A.charge*5,'#ffcf33',0.5);
    });});
    if(A.ph===3)g.fx((1-A.q)*0.9,function(){
        g.ring(CX-22,GY-1,3+A.q*9,6+A.q*10,3.2,6.2,'#fff078',0);
        g.p([CX-22,GY-2,CX-25,GY-10-A.q*4,CX-21,GY-5,CX-18,GY-12-A.q*4,CX-17,GY-2],'#ff7a18');
    });
    embers(g,A,CX,30,14,'#ffcf74',6,18);
});});
})();
