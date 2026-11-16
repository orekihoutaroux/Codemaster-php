// ===== ADMIN DASHBOARD: STUDY MATERIALS =====
// Lists the lessons, edits one at a time with a live preview, adds new ones,
// deletes them, and can restore the built-in lessons. Saved lessons go to
// MongoDB (/api/admin/lessons) and the Study Materials page is reloaded.
var adminLessonsCache=[];
var adminCurrentLessonId=null;   // null while writing a brand-new lesson
var adminLessonDirty=false;

var LESSON_SNIPPETS={
    heading:'\n\n## New section\n',
    code:'\n\n```php\n<?php\necho "Hello";\n```\n',
    output:'\n```output\nHello\n```\n',
    list:'\n\n- First point\n- Second point\n',
    tip:'\n\n> TIP: A helpful hint for the reader.\n',
    mistake:'\n\n> MISTAKE: Something beginners often get wrong.\n'
};

function lessonField(name){return document.getElementById('admin-lesson-'+name);}

function setLessonStatus(text,kind){
    var status=lessonField('status');
    if(!status)return;
    status.textContent=text;
    status.classList.toggle('admin-status-error',kind==='error');
}

function reloadAdminLessons(){
    var list=document.getElementById('admin-lesson-list');
    if(list)list.innerHTML='<div class="admin-empty">Loading lessons...</div>';
    return fetch('/api/lessons',{cache:'no-store'})
    .then(function(res){if(!res.ok)throw new Error('HTTP '+res.status);return res.json();})
    .then(function(data){
        adminLessonsCache=Array.isArray(data.lessons)?data.lessons:[];
        var subtitle=document.getElementById('admin-panel-subtitle');
        if(subtitle&&adminActiveTab==='lessons')subtitle.textContent=adminLessonsCache.length+' lesson'+(adminLessonsCache.length===1?'':'s')+' stored in MongoDB (collection "lessons"). Saved changes appear in Study Materials for every player right away.';
        if(adminCurrentLessonId!==null&&!adminLessonsCache.some(function(l){return l.id===adminCurrentLessonId;}))adminCurrentLessonId=adminLessonsCache.length?adminLessonsCache[0].id:null;
        if(adminCurrentLessonId===null&&adminLessonsCache.length&&!adminLessonDirty)adminCurrentLessonId=adminLessonsCache[0].id;
        renderAdminLessonList();
        if(adminCurrentLessonId!==null)selectAdminLesson(adminCurrentLessonId,true);
        else createNewLesson(true);
    })
    .catch(function(){
        if(list)list.innerHTML='<div class="admin-empty">Failed to load lessons.</div>';
        showToast('Failed to load lessons','error');
    });
}

function renderAdminLessonList(){
    var list=document.getElementById('admin-lesson-list');
    if(!list)return;
    list.innerHTML='';
    adminLessonsCache.forEach(function(lesson,i){
        var item=document.createElement('div');
        item.className='admin-list-item'+(lesson.id===adminCurrentLessonId?' active':'');
        var tag=lesson.source==='admin'?' | CUSTOM':(lesson.edited?' | EDITED':'');
        item.innerHTML='<div class="admin-question-id">'+(i+1)+'. '+escapeHtml(lesson.tab)+tag+'</div><div class="admin-question-snippet">'+escapeHtml(lesson.title)+'</div>';
        item.onclick=function(){selectAdminLesson(lesson.id);};
        list.appendChild(item);
    });
    if(adminCurrentLessonId===null){
        var draft=document.createElement('div');
        draft.className='admin-list-item active admin-lesson-draft';
        draft.innerHTML='<div class="admin-question-id">NEW | NOT SAVED YET</div><div class="admin-question-snippet">'+escapeHtml((lessonField('title')||{}).value||'New lesson')+'</div>';
        list.appendChild(draft);
    }
}

function confirmDiscardLessonChanges(){
    return !adminLessonDirty||confirm('You have unsaved changes to this lesson. Discard them?');
}

function fillLessonForm(lesson,isNew){
    lessonField('title').value=lesson.title||'';
    lessonField('tab').value=lesson.tab||'';
    lessonField('order').value=lesson.order||'';
    lessonField('intro').value=lesson.intro||'';
    lessonField('body').value=lesson.body||'';
    lessonField('remember').value=(lesson.remember||[]).join('\n');
    lessonField('heading').textContent=isNew?'NEW LESSON':'EDIT LESSON';
    lessonField('delete').disabled=!!isNew;
    adminLessonDirty=false;
    updateLessonPreview();
}

function selectAdminLesson(id,force){
    if(!force&&id!==adminCurrentLessonId&&!confirmDiscardLessonChanges())return;
    var lesson=adminLessonsCache.find(function(l){return l.id===id;});
    if(!lesson)return;
    adminCurrentLessonId=id;
    renderAdminLessonList();
    fillLessonForm(lesson,false);
    var origin=lesson.source==='admin'?'Added by an admin.':(lesson.edited?'Built-in lesson (edited).':'Built-in lesson.');
    setLessonStatus(origin+' Editing "'+lesson.title+'".');
}

function createNewLesson(skipConfirm){
    if(!skipConfirm&&!confirmDiscardLessonChanges())return;
    adminCurrentLessonId=null;
    var nextOrder=adminLessonsCache.reduce(function(max,l){return Math.max(max,l.order||0);},0)+1;
    fillLessonForm({order:nextOrder,body:'## First section\n\nWrite the explanation here.\n\n```php\n<?php\necho "Hello, PHP!";\n```\n```output\nHello, PHP!\n```\n\n> TIP: Keep each section short, with one example.',remember:[]},true);
    renderAdminLessonList();
    setLessonStatus('Writing a new lesson. Fill in a title and the content, then press SAVE LESSON.');
    var title=lessonField('title');if(title)title.focus();
}

function readLessonForm(){
    return {
        title:lessonField('title').value.trim(),
        tab:lessonField('tab').value.trim(),
        order:lessonField('order').value,
        intro:lessonField('intro').value.trim(),
        body:lessonField('body').value,
        remember:lessonField('remember').value.split('\n').map(function(x){return x.trim();}).filter(Boolean)
    };
}

function updateLessonPreview(){
    var box=document.getElementById('admin-lesson-preview');
    if(!box)return;
    var lesson=readLessonForm();
    if(!lesson.title&&!lesson.body.trim()){box.innerHTML='<div class="admin-empty">The preview appears here.</div>';return;}
    box.innerHTML=LessonFormat.renderLesson({id:'preview',title:lesson.title||'(no title yet)',intro:lesson.intro,body:lesson.body,remember:lesson.remember},Math.max(0,(parseInt(lesson.order,10)||1)-1),Math.max(adminLessonsCache.length+(adminCurrentLessonId===null?1:0),1),{preview:true});
}

function insertLessonSnippet(kind){
    var area=lessonField('body'),text=LESSON_SNIPPETS[kind];
    if(!area||!text)return;
    var start=area.selectionStart,end=area.selectionEnd,value=area.value;
    if(start===0&&end===0&&value&&document.activeElement!==area){start=end=value.length;}
    area.value=value.slice(0,start)+text+value.slice(end);
    area.focus();
    area.selectionStart=area.selectionEnd=start+text.length;
    adminLessonDirty=true;
    updateLessonPreview();
}

function saveAdminLesson(){
    var lesson=readLessonForm();
    if(!lesson.title){setLessonStatus('Please give the lesson a title.','error');lessonField('title').focus();return;}
    if(!lesson.body.trim()){setLessonStatus('The lesson content is empty.','error');lessonField('body').focus();return;}
    var isNew=adminCurrentLessonId===null;
    var url=isNew?'/api/admin/lessons':'/api/admin/lessons/'+encodeURIComponent(adminCurrentLessonId);
    var button=lessonField('save');
    if(button){button.disabled=true;button.textContent='SAVING...';}
    adminFetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(lesson)})
    .then(function(res){return res.json().then(function(data){return {ok:res.ok,data:data};});})
    .then(function(result){
        if(!result.ok||!result.data||result.data.status!=='ok'){
            setLessonStatus((result.data&&result.data.message)||'Could not save the lesson.','error');
            return;
        }
        adminCurrentLessonId=result.data.lesson.id;
        adminLessonDirty=false;
        showToast(isNew?'Lesson added':'Lesson saved','success');
        return reloadAdminLessons().then(function(){
            setLessonStatus((isNew?'Added':'Saved')+' "'+result.data.lesson.title+'". Players see it in Study Materials now.');
            if(typeof loadStudyLessons==='function')loadStudyLessons();
        });
    })
    .catch(function(){setLessonStatus('Could not reach the server. Your text is still here; try SAVE LESSON again.','error');})
    .finally(function(){if(button){button.disabled=false;button.textContent='SAVE LESSON';}});
}

function deleteAdminLesson(){
    if(adminCurrentLessonId===null)return;
    var lesson=adminLessonsCache.find(function(l){return l.id===adminCurrentLessonId;});
    if(!lesson)return;
    var note=lesson.source==='admin'?' This cannot be undone.':' (Built-in lessons can be brought back with RESTORE BUILT-IN LESSONS.)';
    if(!confirm('Delete the lesson "'+lesson.title+'"?'+note))return;
    adminFetch('/api/admin/lessons/'+encodeURIComponent(lesson.id),{method:'DELETE'})
    .then(function(res){return res.json().then(function(data){return {ok:res.ok,data:data};});})
    .then(function(result){
        if(!result.ok){setLessonStatus((result.data&&result.data.message)||'Could not delete the lesson.','error');return;}
        showToast('Lesson deleted','success');
        adminLessonDirty=false;
        var index=adminLessonsCache.findIndex(function(l){return l.id===lesson.id;});
        var neighbour=adminLessonsCache[index+1]||adminLessonsCache[index-1];
        adminCurrentLessonId=neighbour?neighbour.id:null;
        reloadAdminLessons().then(function(){if(typeof loadStudyLessons==='function')loadStudyLessons();});
    })
    .catch(function(){setLessonStatus('Could not reach the server.','error');});
}

function restoreBuiltInLessons(){
    if(!confirm('Put every built-in lesson back to its original text? Edits to built-in lessons are lost and deleted built-in lessons come back. Lessons added by admins are kept.'))return;
    adminFetch('/api/admin/lessons/reset',{method:'POST'})
    .then(function(res){return res.json().then(function(data){return {ok:res.ok,data:data};});})
    .then(function(result){
        if(!result.ok){setLessonStatus((result.data&&result.data.message)||'Could not restore the lessons.','error');return;}
        showToast('Built-in lessons restored','success');
        adminLessonDirty=false;
        reloadAdminLessons().then(function(){if(typeof loadStudyLessons==='function')loadStudyLessons();});
    })
    .catch(function(){setLessonStatus('Could not reach the server.','error');});
}

// Live preview while typing, and a warning before leaving unsaved work.
document.addEventListener('input',function(event){
    var target=event.target;
    if(!target||!target.id||target.id.indexOf('admin-lesson-')!==0)return;
    adminLessonDirty=true;
    updateLessonPreview();
    if(target.id==='admin-lesson-title'&&adminCurrentLessonId===null){
        var draft=document.querySelector('.admin-lesson-draft .admin-question-snippet');
        if(draft)draft.textContent=target.value||'New lesson';
    }
});
(function(){
    var baseSwitch=window.switchAdminTab;
    window.switchAdminTab=function(tab){
        if(adminActiveTab==='lessons'&&tab!=='lessons'&&!confirmDiscardLessonChanges())return;
        if(tab!=='lessons')adminLessonDirty=false;
        return baseSwitch.apply(this,arguments);
    };
    var baseClose=window.closeAdminDashboard;
    window.closeAdminDashboard=function(){
        if(adminActiveTab==='lessons'&&!confirmDiscardLessonChanges())return;
        adminLessonDirty=false;
        return baseClose.apply(this,arguments);
    };
})();
