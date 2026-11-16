// ===== SHOP OVERLAY CONTROLS =====
function openShop(){
    document.getElementById('shop-overlay').style.display='flex';
    refreshShopGold();updateShopBuffs();
}
function closeShop(){document.getElementById('shop-overlay').style.display='none';}

