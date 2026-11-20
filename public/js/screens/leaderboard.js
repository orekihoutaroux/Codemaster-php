// ===== LEADERBOARD =====
function showLeaderboard(){
    showScreen('leaderboard-screen');
    renderLeaderboard();
}

// "1" -> "1st Year", "2" -> "2nd Year" ... ; anything else is shown as it is.
function formatYearLevel(value){
    var text=String(value==null?'':value).trim();
    if(!text||text==='-')return '-';
    if(!/^\d+$/.test(text))return text;
    var n=parseInt(text,10),last=n%10,lastTwo=n%100;
    var suffix=(lastTwo>=11&&lastTwo<=13)?'th':last===1?'st':last===2?'nd':last===3?'rd':'th';
    return n+suffix+' Year';
}

function renderLeaderboard(){
    var container=document.getElementById('leaderboard-list');
    if(!container)return;
    container.innerHTML='<div class="admin-empty">Loading leaderboard...</div>';
    fetch('/api/leaderboard')
    .then(function(res){return res.json();})
    .then(function(data){
        var rows=(data&&data.status==='ok'&&Array.isArray(data.leaderboard))?data.leaderboard:[];
        container.innerHTML='';
        if(!rows.length){container.innerHTML='<div class="admin-empty">No scores yet - be the first!</div>';return;}
        rows.forEach(function(player){
            var row=document.createElement('div');
            row.className='leaderboard-row';
            if(player.rank<=3)row.classList.add('rank-'+player.rank);
            var medal=player.rank===1?'🥇':player.rank===2?'🥈':player.rank===3?'🥉':player.rank;
            var year=formatYearLevel(player.yearLevel),block=String(player.block||'-');
            // phones hide the YEAR and BLOCK columns and show them under the name
            var classLine=(year!=='-'||block!=='-')?'<span class="lb-class">'+escapeHtml(year==='-'?'Year -':year)+' &middot; Block '+escapeHtml(block)+'</span>':'';
            row.innerHTML='<div class="col rank">'+medal+'</div>'+
                          '<div class="col name"><span class="lb-name">'+escapeHtml(player.name)+'</span>'+classLine+'</div>'+
                          '<div class="col character">'+escapeHtml(player.character||'-')+'</div>'+
                          '<div class="col role">'+escapeHtml(player.role||'-')+'</div>'+
                          '<div class="col year">'+escapeHtml(year)+'</div>'+
                          '<div class="col block">'+escapeHtml(block)+'</div>'+
                          '<div class="col score">'+(Number(player.score)||0)+'</div>'+
                          '<div class="col floor">'+(Number(player.floor)||1)+'</div>';
            container.appendChild(row);
        });
    })
    .catch(function(err){
        console.error('renderLeaderboard failed:',err);
        container.innerHTML='<div class="admin-empty">Failed to load leaderboard.</div>';
    });
}

