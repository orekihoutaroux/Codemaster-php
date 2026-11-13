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
    if(user===ADMIN_LOGIN_USER && pass===ADMIN_LOGIN_PASS){
        adminAuthenticated=true;
        if(status)status.textContent='';
        closeAdminLogin();
        openAdminDashboard();
        showToast('Admin login successful','success');
    } else {
        if(status)status.textContent='Invalid admin username or password.';
        showToast('Admin login failed','error');
    }
    return false;
}
