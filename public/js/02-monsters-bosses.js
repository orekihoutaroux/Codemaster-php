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
