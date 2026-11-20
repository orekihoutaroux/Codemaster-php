/* ===== FIT THE UI TO THE SCREEN =====
   On computers and landscape tablets every screen is laid out at a 1280x720
   (16:9) base and zoomed to fill the window, like a game:
     1920x1080 monitor  -> 1.5x      1366x768 laptop -> about 1.07x
     2560x1440 monitor  -> 2x        a window made shorter by the browser's
                                     tab and address bars zooms a little less
   so the same layout fills every 16:9 screen and nothing is cut off. Windows
   that are wider (ultrawide, browser bars) or taller (16:10, 4:3) use the
   zoom of the side that fits and get a bit more room on the other side.
   Phones and portrait tablets keep their own layout (css/base/mobile.css).

   This file is loaded in <head>, before anything is drawn. It sets on <html>:
     style zoom        the scale
     --app-w, --app-h  the window size in layout pixels. Stylesheets use these
                       instead of 100vw / 100vh, because zoom would scale
                       viewport units a second time.
     .ui-fit           while the zoomed layout is on
     .vh-820, .vh-700  when the layout height is at most 820 / 700 px (the
                       few rules that used to be max-height media queries)
   and gives scripts:
     uiRect(el)        an element's box in layout pixels (what CSS left/top/
                       width use), even while zoomed
     uiViewW(), uiViewH()  the window size in layout pixels */
(function(){
    var BASE_W=1280,BASE_H=720,MIN_ZOOM=0.7,MAX_ZOOM=3;
    var root=document.documentElement;
    var zoom=1;

    function apply(){
        var w=window.innerWidth,h=window.innerHeight;
        if(!w||!h)return;
        var fit=w>=1024&&w>h;
        var z=1;
        if(fit){
            z=Math.min(w/BASE_W,h/BASE_H);
            z=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,z));
            z=Math.round(z*1000)/1000;
        }
        zoom=z;
        root.classList.toggle('ui-fit',fit);
        root.style.zoom=z===1?'':String(z);
        var lw=w/z,lh=h/z;
        if(fit){
            root.style.setProperty('--app-w',lw.toFixed(2)+'px');
            root.style.setProperty('--app-h',lh.toFixed(2)+'px');
        }else{
            root.style.removeProperty('--app-w');
            root.style.removeProperty('--app-h');
        }
        root.classList.toggle('vh-820',lh<=820);
        root.classList.toggle('vh-700',lh<=700);
    }

    // How much bigger getBoundingClientRect() is than layout pixels. Measured
    // instead of assumed, because browsers differ in how zoom affects it.
    function rectScale(){
        if(zoom===1)return 1;
        var w=root.offsetWidth;
        return w?(root.getBoundingClientRect().width/w)||1:1;
    }
    window.uiRect=function(el){
        var r=el.getBoundingClientRect(),k=rectScale();
        if(k===1)return r;
        return {left:r.left/k,top:r.top/k,right:r.right/k,bottom:r.bottom/k,width:r.width/k,height:r.height/k,x:r.left/k,y:r.top/k};
    };
    window.uiViewW=function(){return window.innerWidth/zoom;};
    window.uiViewH=function(){return window.innerHeight/zoom;};
    window.uiZoom=function(){return zoom;};

    apply();
    // Registered before any other script, so the zoom is updated before the
    // canvases and the battle measure themselves again on resize.
    window.addEventListener('resize',apply);
    window.addEventListener('orientationchange',apply);
})();
