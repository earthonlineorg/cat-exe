/* EARTH.ONLINE theme boot.
   This tiny blocking script runs before styles so a persisted theme never
   flashes the opposite palette during first paint. */
(function initSiteTheme(document,window){
  var theme='dark';
  try{
    var stored=localStorage.getItem('eo_site_theme_v1');
    if(stored!=='light'&&stored!=='dark'){
      var legacy=localStorage.getItem('eo_home_theme_v1');
      if(legacy==='light'||legacy==='dark'){
        stored=legacy;
        localStorage.setItem('eo_site_theme_v1',legacy);
      }
    }
    if(stored==='light'||stored==='dark') theme=stored;
  }catch(error){}
  window.__EO_SITE_THEME__=theme;
  document.documentElement.setAttribute('data-theme',theme);
  document.documentElement.style.colorScheme=theme;
})(document,window);
