// ===== LESSON FORMAT =====
// Lessons are written in a small, safe text format (stored in MongoDB and
// edited in the admin dashboard). This file turns that text into the HTML of
// a STUDY MATERIALS lesson. It is used by the study page and by the admin
// preview, so both always look the same.
//
//   ## Heading                 a section heading
//   Plain lines                a paragraph (blank line = new paragraph)
//   - item                     a bulleted list
//   ```php ... ```             a code example
//   ```output ... ```          what the example prints (put it right after the code)
//   > TIP: text                a green tip box
//   > MISTAKE: text            a red "common mistake" box
//   > NOTE: text               a plain note box
//   `code`  **bold**           inside any line
//
// Everything is HTML-escaped first, so a lesson can never inject markup.
var LessonFormat=(function(){
'use strict';
function esc(text){
    return String(text==null?'':text).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
}
// `code` and **bold** inside a line of text.
function inline(text){
    var parts=String(text).split('`'),out='';
    for(var i=0;i<parts.length;i++){
        if(i%2===1&&i<parts.length-1)out+='<code>'+esc(parts[i])+'</code>';
        else{
            var chunk=esc(i%2===1?'`'+parts[i]:parts[i]);
            out+=chunk.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');
        }
    }
    return out;
}
// Code blocks start with "<?php" so they are valid PHP; the page hides that
// first line, the way PHP files are usually shown in books.
function codeBlock(code){
    var shown=code.replace(/^<\?php[ \t]*\n/,'');
    return '<pre class="learn-code">'+esc(shown)+'</pre>';
}
var BOXES={TIP:['tip-box','TIP:'],MISTAKE:['warn-box','COMMON MISTAKE:'],NOTE:['note-box','NOTE:']};

function renderBody(text){
    var lines=String(text||'').replace(/\r\n/g,'\n').split('\n'),html=[],para=[],list=[],i=0;
    function flushPara(){if(para.length){html.push('<p>'+inline(para.join(' '))+'</p>');para=[];}}
    function flushList(){if(list.length){html.push('<ul>'+list.map(function(item){return '<li>'+inline(item)+'</li>';}).join('')+'</ul>');list=[];}}
    function flush(){flushPara();flushList();}
    while(i<lines.length){
        var line=lines[i],trimmed=line.trim();
        var fence=/^```\s*([a-zA-Z]*)\s*$/.exec(trimmed);
        if(fence){
            flush();
            var lang=fence[1].toLowerCase(),body=[];i++;
            while(i<lines.length&&lines[i].trim()!=='```'){body.push(lines[i]);i++;}
            i++; // closing fence (a missing one simply ends at the last line)
            var code=body.join('\n');
            if(lang==='output')html.push('<div class="learn-output"><span>OUTPUT</span><pre>'+esc(code)+'</pre></div>');
            else html.push(codeBlock(code));
            continue;
        }
        if(trimmed===''){flush();i++;continue;}
        var heading=/^#{2,3}\s+(.*)$/.exec(trimmed);
        if(heading){flush();html.push('<h4>'+inline(heading[1])+'</h4>');i++;continue;}
        var box=/^>\s*(TIP|MISTAKE|NOTE)\s*:\s*(.*)$/i.exec(trimmed);
        if(box){
            flush();
            var kind=BOXES[box[1].toUpperCase()],textParts=[box[2]];i++;
            while(i<lines.length&&/^>\s*/.test(lines[i].trim())&&!/^>\s*(TIP|MISTAKE|NOTE)\s*:/i.test(lines[i].trim())){textParts.push(lines[i].trim().replace(/^>\s*/,''));i++;}
            html.push('<div class="'+kind[0]+'"><b>'+kind[1]+'</b> '+inline(textParts.join(' '))+'</div>');
            continue;
        }
        var item=/^[-*]\s+(.*)$/.exec(trimmed);
        if(item){flushPara();list.push(item[1]);i++;continue;}
        flushList();para.push(trimmed);i++;
    }
    flush();
    return html.join('\n');
}

// The whole lesson card. nav = {prev:{id,tab}, next:{id,tab}} (either may be missing).
function renderLesson(lesson,index,total,nav){
    nav=nav||{};
    var id=esc(lesson.id);
    // The admin preview passes nav.preview so its card never shares an id with the real one.
    var out=nav.preview?'<section class="learn-card active learn-preview-card">':'<section class="learn-card" id="learn-'+id+'" data-topic="'+id+'">';
    out+='<div class="learn-lesson-num">LESSON '+(index+1)+' OF '+total+'</div>';
    out+='<h3>'+esc(lesson.title)+'</h3>';
    if(lesson.intro)out+='<p class="learn-intro">'+inline(lesson.intro)+'</p>';
    out+=renderBody(lesson.body);
    var remember=(lesson.remember||[]).filter(function(x){return String(x).trim();});
    if(remember.length)out+='<div class="learn-remember"><h4>REMEMBER</h4><ul>'+remember.map(function(x){return '<li>'+inline(x)+'</li>';}).join('')+'</ul></div>';
    var prev=nav.prev?'<button type="button" class="learn-nav-btn" onclick="showLearnTab(\''+esc(nav.prev.id)+'\')">&larr; '+esc(nav.prev.tab)+'</button>':'<span></span>';
    var next=nav.next?'<button type="button" class="learn-nav-btn next" onclick="showLearnTab(\''+esc(nav.next.id)+'\')">'+esc(nav.next.tab)+' &rarr;</button>':(nav.finish?'<button type="button" class="learn-nav-btn next" onclick="showScreen(\'title-screen\')">FINISH &rarr;</button>':'');
    if(nav.prev||nav.next||nav.finish)out+='<div class="learn-nav">'+prev+next+'</div>';
    return out+'</section>';
}
return {renderBody:renderBody,renderLesson:renderLesson,escape:esc,inline:inline};
})();
