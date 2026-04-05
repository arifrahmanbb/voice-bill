document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const appNav = document.getElementById('appNav');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const navOverlay = document.getElementById('navOverlay');

  function openMenu() {
    if(appNav) appNav.classList.add('open');
    if(navOverlay) navOverlay.classList.add('open');
  }

  function closeMenu() {
    if(appNav) appNav.classList.remove('open');
    if(navOverlay) navOverlay.classList.remove('open');
  }

  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
  if (navOverlay) navOverlay.addEventListener('click', closeMenu);

  // Quick settings persistence: Voice Language
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    const savedLang = localStorage.getItem('voiceBillLanguage') || 'bn-BD';
    languageSelect.value = savedLang;

    function applyGuideLang(lang) {
       const guideBn = document.getElementById('guideBn');
       const guideEn = document.getElementById('guideEn');
       if(guideBn && guideEn) {
          if (lang === 'bn-BD') {
             guideBn.style.display = 'block';
             guideEn.style.display = 'none';
          } else {
             guideBn.style.display = 'none';
             guideEn.style.display = 'block';
          }
       }
    }
    
    applyGuideLang(savedLang);

    languageSelect.addEventListener('change', (e) => {
      const newLang = e.target.value;
      localStorage.setItem('voiceBillLanguage', newLang);
      applyGuideLang(newLang);
      
      // Update app.js parsing locale if global exists
      if (typeof recognitionLanguage !== 'undefined') {
         recognitionLanguage = newLang;
      }
    });
  }
});
