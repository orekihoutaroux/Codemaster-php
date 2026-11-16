// ===== STUDY MATERIALS =====
// Loads the lessons from the server and draws the tabs and lesson cards.
// Admins change lessons in the dashboard; loadStudyLessons() is called again
// after every save so the page is always up to date.
var studyLessons=[];
var studyCurrentLesson='';

function renderStudyLessons(lessons){
    var tabs=document.getElementById('learn-tabs');
    var content=document.getElementById('learn-content');
    if(!tabs||!content)return;
    studyLessons=lessons.slice();
    if(!studyLessons.length){
        tabs.innerHTML='';
        content.innerHTML='<div class="learn-loading">No lessons yet.</div>';
        return;
    }
    var esc=LessonFormat.escape,total=studyLessons.length;
    tabs.innerHTML=studyLessons.map(function(lesson,i){
        return '<button type="button" class="learn-tab" role="tab" data-topic="'+esc(lesson.id)+'" onclick="showLearnTab(\''+esc(lesson.id)+'\')"><span class="learn-tab-num">'+(i+1)+'</span>'+esc(lesson.tab)+'</button>';
    }).join('\n');
    content.innerHTML=studyLessons.map(function(lesson,i){
        var prev=studyLessons[i-1],next=studyLessons[i+1];
        return LessonFormat.renderLesson(lesson,i,total,{
            prev:prev?{id:prev.id,tab:prev.tab}:null,
            next:next?{id:next.id,tab:next.tab}:null,
            finish:!next
        });
    }).join('\n');
    var keep=studyLessons.some(function(l){return l.id===studyCurrentLesson;})?studyCurrentLesson:studyLessons[0].id;
    showLearnTab(keep);
    if(typeof updateHomeCounts==='function')updateHomeCounts();
}

function loadStudyLessons(){
    return fetch('/api/lessons',{cache:'no-store'})
    .then(function(res){if(!res.ok)throw new Error('HTTP '+res.status);return res.json();})
    .then(function(data){
        renderStudyLessons(data&&Array.isArray(data.lessons)?data.lessons:[]);
        return studyLessons;
    })
    .catch(function(err){
        console.error('loadStudyLessons failed:',err);
        var content=document.getElementById('learn-content');
        if(content&&!studyLessons.length)content.innerHTML='<div class="learn-loading">Could not load the lessons. Check your connection and open Study Materials again.</div>';
        return studyLessons;
    });
}

// Remember the open lesson so a reload after an admin edit stays on it.
(function(){
    var base=window.showLearnTab;
    window.showLearnTab=function(id){studyCurrentLesson=id;return base.apply(this,arguments);};
    var baseShow=window.showScreen;
    window.showScreen=function(id){
        var result=baseShow.apply(this,arguments);
        if(id==='learn-screen'&&!studyLessons.length)loadStudyLessons();
        return result;
    };
})();

loadStudyLessons();
