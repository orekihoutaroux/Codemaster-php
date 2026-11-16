// ===== HOME: DUNGEON DOOR AND STARS =====
// The animated door, torches and banners on the home page, and the star field.
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
