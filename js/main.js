const header = document.querySelector('header');
  const teluguBtn = document.getElementById('teluguBtn');
  const englishBtn = document.getElementById('englishBtn');
  const menuToggle = document.getElementById('menuToggle');
  const menuToggleLabel = document.getElementById('menuToggleLabel');
  const navLinks = document.querySelectorAll('header nav a.nav-link');
  const sections = document.querySelectorAll('main section[id]');
  const allTextElements = document.querySelectorAll('[data-telugu]');
  const galleryImages = document.querySelectorAll('.gallery img');
  const galleryButtons = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  let currentLang = 'telugu';
  let lastFocusedGalleryButton = null;
  const pageTitles = {
    telugu: 'శ్రీ శ్రీ శ్రీ వరధాంజనేయ స్వామి వారి దేవాలయం',
    english: 'Sri Sri Sri Varadhan Janeya Swamy Temple'
  };
  const navLabels = {
    telugu: {
      about: 'ఆలయం గురించి',
      pooja: 'పూజలు',
      festivals: 'పండుగలు',
      gallery: 'గ్యాలరీ',
      location: 'లోకేషన్'
    },
    english: {
      about: 'About',
      pooja: 'Services',
      festivals: 'Festivals',
      gallery: 'Gallery',
      location: 'Location'
    }
  };

  function updateMenuState(isOpen) {
    header.classList.toggle('nav-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  }

  function closeMenu() {
    updateMenuState(false);
  }

  function getImageCaption(image) {
    return currentLang === 'telugu' ? image.dataset.teluguAlt : image.dataset.englishAlt;
  }

  function openLightbox(image, triggerButton) {
    lastFocusedGalleryButton = triggerButton;
    lightboxImage.src = image.src;
    lightboxImage.dataset.teluguAlt = image.dataset.teluguAlt;
    lightboxImage.dataset.englishAlt = image.dataset.englishAlt;
    lightboxImage.alt = getImageCaption(image);
    lightboxCaption.textContent = getImageCaption(image);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
    lightboxImage.alt = '';
    delete lightboxImage.dataset.teluguAlt;
    delete lightboxImage.dataset.englishAlt;
    lightboxCaption.textContent = '';
    document.body.style.overflow = '';

    if (lastFocusedGalleryButton) {
      lastFocusedGalleryButton.focus();
    }
  }

  function setActiveLink(sectionId) {
    navLinks.forEach(link => {
      const isActive = link.dataset.section === sectionId;
      link.classList.toggle('active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function switchLanguage(lang) {
    currentLang = lang;

    allTextElements.forEach(el => {
      el.textContent = lang === 'telugu' ? el.dataset.telugu : el.dataset.english;
    });

    galleryImages.forEach(image => {
      image.alt = lang === 'telugu' ? image.dataset.teluguAlt : image.dataset.englishAlt;
    });

    navLinks.forEach(link => {
      const section = link.dataset.section;
      if (section && navLabels[lang][section]) {
        link.textContent = navLabels[lang][section];
      }
    });

    document.documentElement.lang = lang === 'telugu' ? 'te' : 'en';
    document.title = pageTitles[lang];

    if (lang === 'telugu') {
      teluguBtn.classList.add('active');
      teluguBtn.setAttribute('aria-pressed', 'true');
      englishBtn.classList.remove('active');
      englishBtn.setAttribute('aria-pressed', 'false');
    } else {
      englishBtn.classList.add('active');
      englishBtn.setAttribute('aria-pressed', 'true');
      teluguBtn.classList.remove('active');
      teluguBtn.setAttribute('aria-pressed', 'false');
    }

    if (lightbox.classList.contains('is-open')) {
      lightboxImage.alt = getImageCaption(lightboxImage);
      lightboxCaption.textContent = getImageCaption(lightboxImage);
    }
  }

  const observer = new IntersectionObserver(entries => {
    const visibleSection = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visibleSection) {
      setActiveLink(visibleSection.target.id);
    }
  }, {
    rootMargin: '-35% 0px -45% 0px',
    threshold: [0.2, 0.45, 0.7]
  });

  sections.forEach(section => observer.observe(section));
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      setActiveLink(link.dataset.section);
      closeMenu();
    });
  });

  galleryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const image = button.querySelector('img');
      openLightbox(image, button);
    });
  });

  menuToggle.addEventListener('click', () => {
    updateMenuState(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  teluguBtn.addEventListener('click', () => switchLanguage('telugu'));
  englishBtn.addEventListener('click', () => switchLanguage('english'));
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();

      if (lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 600) {
      closeMenu();
    }
  });
  switchLanguage('telugu');
  updateMenuState(false);
  setActiveLink('about');