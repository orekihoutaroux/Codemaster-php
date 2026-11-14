// ===== 14. ADMIN ACCESS =====
function handleAdminLogoClick(){
    adminLogoClicks++;
    if(adminLogoTimer)clearTimeout(adminLogoTimer);
    adminLogoTimer=setTimeout(function(){adminLogoClicks=0;},1400);
    playAdminSecretClickSfx(adminLogoClicks,adminLogoClicks>=5);
    if(adminLogoClicks>=5){
        adminLogoClicks=0;
        if(adminAuthenticated){openAdminDashboard();}
        else{openAdminLogin();}
    }
}

function openAdminLogin(){
    var overlay=document.getElementById('admin-login-overlay');
    var user=document.getElementById('admin-login-user');
    var pass=document.getElementById('admin-login-pass');
    var status=document.getElementById('admin-login-status');
    if(!overlay)return;
    if(status)status.textContent='';
    if(user)user.value='';
    if(pass)pass.value='';
    overlay.style.display='flex';
    if(user)user.focus();
}

function closeAdminLogin(){
    var overlay=document.getElementById('admin-login-overlay');
    if(overlay)overlay.style.display='none';
}

function submitAdminLogin(evt){
    if(evt)evt.preventDefault();
    var userEl=document.getElementById('admin-login-user');
    var passEl=document.getElementById('admin-login-pass');
    var status=document.getElementById('admin-login-status');
    var user=(userEl?userEl.value:'').trim();
    var pass=passEl?passEl.value:'';
    if(!user||!pass){
        if(status)status.textContent='Enter your admin username and password.';
        return false;
    }
    if(status)status.textContent='Checking...';
    fetch('/api/admin/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username:user,password:pass})
    })
    .then(function(res){return res.json();})
    .then(function(data){
        if(data&&data.status==='ok'&&data.token){
            setAdminSession(data.token,data.username);
            if(status)status.textContent='';
            if(passEl)passEl.value='';
            closeAdminLogin();
            openAdminDashboard();
            showToast('Logged in as '+data.username,'success');
        }else{
            if(status)status.textContent=(data&&data.message)||'Invalid admin username or password.';
            showToast('Admin login failed','error');
        }
    })
    .catch(function(){
        if(status)status.textContent='Could not reach the server.';
        showToast('Admin login failed','error');
    });
    return false;
}

function setAdminSession(token,username){
    adminToken=token||'';
    adminUsername=username||'';
    adminAuthenticated=!!adminToken;
    try{
        if(adminToken){
            sessionStorage.setItem('codemaster_admin_token',adminToken);
            sessionStorage.setItem('codemaster_admin_user',adminUsername);
        }else{
            sessionStorage.removeItem('codemaster_admin_token');
            sessionStorage.removeItem('codemaster_admin_user');
        }
    }catch(e){}
}

function logoutAdmin(){
    var token=adminToken;
    setAdminSession('','');
    closeAdminDashboard();
    if(token){
        fetch('/api/admin/logout',{method:'POST',headers:{'Authorization':'Bearer '+token}}).catch(function(){});
    }
    showToast('Logged out of admin','info');
}

// Sends an admin request with the session token. If the server says the
// session is gone (expired, or this admin was removed), the dashboard closes
// and the login opens again.
function adminFetch(url,options){
    options=options||{};
    var headers=options.headers||{};
    if(adminToken)headers['Authorization']='Bearer '+adminToken;
    options.headers=headers;
    return fetch(url,options).then(function(res){
        if(res.status===401){
            setAdminSession('','');
            closeAdminDashboard();
            showToast('Admin session expired. Please log in again.','error');
            openAdminLogin();
        }
        return res;
    });
}

