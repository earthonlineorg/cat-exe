(function siteTheme(){
  'use strict';

  var storageKey='eo_site_theme_v1';
  var legacyKey='eo_home_theme_v1';
  var transitionTimer=0;
  var liveRegion=null;

  function valid(value){ return value==='light'||value==='dark'; }
  function storedTheme(){
    try{
      var current=localStorage.getItem(storageKey);
      if(valid(current)) return current;
      var legacy=localStorage.getItem(legacyKey);
      if(valid(legacy)){
        localStorage.setItem(storageKey,legacy);
        return legacy;
      }
    }catch(error){}
    return '';
  }
  function currentTheme(){
    var theme=document.documentElement.getAttribute('data-theme');
    return valid(theme)?theme:(storedTheme()||'dark');
  }
  function updateChrome(theme){
    var light=theme==='light';
    var themeMeta=document.querySelector('meta[name="theme-color"]');
    var appleBar=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if(themeMeta) themeMeta.setAttribute('content',light?'#f1eee7':'#08080a');
    if(appleBar) appleBar.setAttribute('content',light?'default':'black-translucent');
  }
  function ensureLiveRegion(){
    if(liveRegion) return liveRegion;
    liveRegion=document.createElement('span');
    liveRegion.className='site-theme-live';
    liveRegion.setAttribute('aria-live','polite');
    liveRegion.setAttribute('aria-atomic','true');
    document.body.appendChild(liveRegion);
    return liveRegion;
  }
  function normalizeLogo(logo){
    if(!logo||logo.closest('footer')) return logo;
    if(logo.tagName==='A'){
      var button=document.createElement('button');
      button.className=logo.className;
      button.innerHTML=logo.innerHTML;
      Array.prototype.slice.call(logo.attributes).forEach(function(attribute){
        if(!/^(href|role|aria-label|aria-haspopup|aria-expanded|title)$/i.test(attribute.name)){
          button.setAttribute(attribute.name,attribute.value);
        }
      });
      logo.replaceWith(button);
      logo=button;
    }
    logo.type='button';
    logo.classList.add('site-theme-toggle');
    logo.setAttribute('data-site-theme-toggle','');
    logo.removeAttribute('aria-haspopup');
    logo.removeAttribute('aria-expanded');
    return logo;
  }
  function controls(){
    Array.prototype.slice.call(document.querySelectorAll('.brand-logo-link')).forEach(normalizeLogo);
    if(!document.querySelector('[data-site-theme-toggle]') &&
       !document.body.classList.contains('ia-claude') &&
       !document.body.classList.contains('launch-demo')){
      var corner=document.createElement('button');
      corner.type='button';
      corner.className='site-theme-corner site-theme-toggle';
      corner.setAttribute('data-site-theme-toggle','');
      corner.innerHTML='<img src="assets/logo-earth.webp" alt="" width="42" height="42">';
      document.body.appendChild(corner);
    }
    return Array.prototype.slice.call(document.querySelectorAll('[data-site-theme-toggle]'));
  }
  function syncControls(theme){
    var light=theme==='light';
    controls().forEach(function(control){
      control.setAttribute('aria-pressed',light?'true':'false');
      control.setAttribute('aria-label',light?'切换到暗色模式':'切换到明亮模式');
      control.setAttribute('title',light?'切换到暗色模式 / DARK':'切换到明亮模式 / LIGHT');
      control.dataset.themeTarget=light?'dark':'light';
    });
  }
  function syncThemeMedia(theme){
    var light=theme==='light';
    Array.prototype.slice.call(document.querySelectorAll('[data-theme-src-light]')).forEach(function(media){
      var next=media.getAttribute(light?'data-theme-src-light':'data-theme-src-dark');
      if(next&&media.getAttribute('src')!==next) media.setAttribute('src',next);
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-theme-srcset-light]')).forEach(function(source){
      var next=source.getAttribute(light?'data-theme-srcset-light':'data-theme-srcset-dark');
      if(next&&source.getAttribute('srcset')!==next) source.setAttribute('srcset',next);
    });
  }
  function announce(theme){
    ensureLiveRegion().textContent=theme==='light'?'已切换到明亮模式':'已切换到暗色模式';
  }
  function apply(theme,options){
    options=options||{};
    if(!valid(theme)) theme='dark';
    if(options.transition && !(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
      document.documentElement.classList.add('eo-theme-transition');
      clearTimeout(transitionTimer);
      transitionTimer=setTimeout(function(){ document.documentElement.classList.remove('eo-theme-transition'); },520);
    }
    document.documentElement.setAttribute('data-theme',theme);
    document.documentElement.style.colorScheme=theme;
    if(document.body) document.body.dataset.siteTheme='';
    window.__EO_SITE_THEME__=theme;
    updateChrome(theme);
    syncThemeMedia(theme);
    syncControls(theme);
    if(options.persist){
      try{ localStorage.setItem(storageKey,theme); }catch(error){}
    }
    if(options.announce) announce(theme);
    document.dispatchEvent(new CustomEvent('eo:site-theme-change',{detail:{theme:theme}}));
  }
  function toggle(control,event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    apply(currentTheme()==='light'?'dark':'light',{persist:true,announce:true,transition:true});
    if(control&&event&&event.detail>0) control.blur();
  }
  function init(){
    apply(currentTheme(),{persist:false,announce:false,transition:false});
    document.addEventListener('click',function(event){
      var control=event.target.closest('[data-site-theme-toggle]');
      if(control) toggle(control,event);
    });
    var observer=new MutationObserver(function(records){
      if(records.some(function(record){ return record.addedNodes.length; })){
        var theme=currentTheme();
        syncThemeMedia(theme);
        syncControls(theme);
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  window.EOSiteTheme={
    get:currentTheme,
    set:function(theme){ apply(theme,{persist:true,announce:true,transition:true}); },
    toggle:function(){ toggle(null,null); }
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
