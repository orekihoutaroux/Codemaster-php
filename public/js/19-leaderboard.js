// ===== 19. LEADERBOARD =====
function showLeaderboard(){
    showScreen('leaderboard-screen');
    renderLeaderboard();
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
            row.innerHTML='<div class="col rank">'+medal+'</div>'+
                          '<div class="col name">'+escapeHtml(player.name)+'</div>'+
                          '<div class="col character">'+escapeHtml(player.character||'-')+'</div>'+
                          '<div class="col role">'+escapeHtml(player.role||'-')+'</div>'+
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

