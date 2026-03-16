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
const sevaOptionCards = document.querySelectorAll('.seva-option');
const sevaBookingForm = document.getElementById('sevaBookingForm');
const devoteeNameInput = document.getElementById('devoteeName');
const devoteeGotramInput = document.getElementById('devoteeGotram');
const devoteePhoneInput = document.getElementById('devoteePhone');
const sevaTypeInput = document.getElementById('sevaType');
const sevaDateInput = document.getElementById('sevaDate');
const sevaSlotsInput = document.getElementById('sevaSlots');
const sevaSelected = document.getElementById('sevaSelected');
const sevaAvailability = document.getElementById('sevaAvailability');
const sevaTotal = document.getElementById('sevaTotal');
const sevaBookingMessage = document.getElementById('sevaBookingMessage');
const bookSevaBtn = document.getElementById('bookSevaBtn');
const pageLoader = document.getElementById('pageLoader');
const pageLoaderStatus = document.getElementById('pageLoaderStatus');
const pageLoaderCountdown = document.getElementById('pageLoaderCountdown');
let currentLang = 'telugu';
let lastFocusedGalleryButton = null;
let isProgrammaticNavActive = false;
let navScrollStopTimer = 0;
let navFallbackTimer = 0;
let navigationScrollTimer = 0;
let pageLoaderCountdownValue = 3;
let pageLoaderTimer = 0;
let pageLoaderCountdownDone = false;
let pageLoaderIsReady = document.readyState === 'complete';
let pageLoaderHideTimer = 0;
const bookingRules = {
  regularAdvanceDays: 1,
  regularWindowDays: 15,
  tuesdayWindowDays: 28,
  nextAvailableDateCutoffHour: 17,
  sameDayServiceCutoffHour: 8
};
const bookingStorageKey = 'svsTempleSevaBookings';
const templeBookingEmail = 'svanjaneya.temple@gmail.com';
const smtpConfig = window.TEMPLE_SMTP_CONFIG || {};
const smtpSecureToken = typeof smtpConfig.secureToken === 'string' ? smtpConfig.secureToken.trim() : '';
const smtpFromEmail = smtpConfig.fromEmail || templeBookingEmail;
const smtpToEmail = smtpConfig.toEmail || templeBookingEmail;
const smtpScriptUrl = 'https://smtpjs.com/v3/smtp.js';
let smtpLibraryPromise = null;
const sevaCatalog = [
  {
    id: 'rahu-kethu-pooja',
    telugu: 'శ్రీ రాహు & కేతు పూజ',
    english: 'Sri Rahu & Kethu Pooja',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 750,
    dailySlots: 20
  },
  {
    id: 'varadhanjaneya-abhishekam',
    telugu: 'శ్రీ వరధాంజనేయ స్వామి అభిషేకం',
    english: 'Sri Varadhanjaneya Swamy Abhishekam',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 500,
    dailySlots: 20
  },
  {
    id: 'ramalingeswara-abhishekam',
    telugu: 'శ్రీ రామలింగేశ్వర స్వామి అభిషేకం',
    english: 'Sri Ramalingeswara Swamy Abhishekam',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 500,
    dailySlots: 20
  },
  {
    id: 'rajarajeshwari-abhishekam',
    telugu: 'శ్రీ రాజరాజేశ్వరి మాత అభిషేకం',
    english: 'Sri Rajarajeshwari Matha Abhishekam',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 500,
    dailySlots: 20
  },
  {
    id: 'tuesday-annadanam',
    telugu: 'మంగళవారం అన్నదానం',
    english: 'Tuesday Annadanam',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 6500,
    dailySlots: 1
  }
];
const pageTitles = {
  telugu: 'శ్రీ శ్రీ శ్రీ వరధాంజనేయ స్వామి వారి దేవాలయం',
  english: 'Sri Sri Sri Varadhan Janeya Swamy Temple'
};
const navLabels = {
  telugu: {
    about: 'ఆలయం గురించి',
    pooja: 'పూజలు',
    'seva-booking': 'సేవా బుకింగ్',
    festivals: 'పండుగలు',
    gallery: 'గ్యాలరీ',
    location: 'లోకేషన్'
  },
  english: {
    about: 'About',
    pooja: 'Services',
    'seva-booking': 'Seva Booking',
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

function updatePageLoaderText() {
  if (!pageLoaderStatus || !pageLoaderCountdown) {
    return;
  }

  pageLoaderCountdown.textContent = String(pageLoaderCountdownDone ? 0 : pageLoaderCountdownValue);
  pageLoaderStatus.textContent = currentLang === 'telugu'
    ? (pageLoaderCountdownDone ? 'దాదాపు సిద్ధమైంది...' : `పేజీ సిద్ధమవుతోంది... ${pageLoaderCountdownValue}`)
    : (pageLoaderCountdownDone ? 'Almost ready...' : `Preparing the page... ${pageLoaderCountdownValue}`);
}

function maybeHidePageLoader() {
  if (!pageLoader || !pageLoaderIsReady || !pageLoaderCountdownDone) {
    return;
  }

  clearTimeout(pageLoaderHideTimer);
  pageLoader.classList.add('is-hidden');
  document.body.classList.remove('is-loading');
  pageLoaderHideTimer = window.setTimeout(() => {
    pageLoader.setAttribute('hidden', '');
  }, 380);
}

function markPageLoaderReady() {
  pageLoaderIsReady = true;
  maybeHidePageLoader();
}

function startPageLoaderCountdown() {
  if (!pageLoader) {
    document.body.classList.remove('is-loading');
    return;
  }

  updatePageLoaderText();

  pageLoaderTimer = window.setInterval(() => {
    if (pageLoaderCountdownValue > 1) {
      pageLoaderCountdownValue -= 1;
      updatePageLoaderText();
      return;
    }

    pageLoaderCountdownValue = 0;
    pageLoaderCountdownDone = true;
    clearInterval(pageLoaderTimer);
    pageLoaderTimer = 0;
    updatePageLoaderText();
    maybeHidePageLoader();
  }, 400);
}

function beginProgrammaticNavigation(sectionId) {
  isProgrammaticNavActive = true;
  clearTimeout(navScrollStopTimer);
  clearTimeout(navFallbackTimer);
  setActiveLink(sectionId);
  navFallbackTimer = window.setTimeout(endProgrammaticNavigation, 1400);
}

function endProgrammaticNavigation() {
  if (!isProgrammaticNavActive) {
    return;
  }

  isProgrammaticNavActive = false;
  clearTimeout(navScrollStopTimer);
  clearTimeout(navFallbackTimer);
  navScrollStopTimer = 0;
  navFallbackTimer = 0;
  syncActiveLinkToViewport();
}

function getHeaderOffset() {
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  return headerHeight + 16;
}

function getClosestSectionId() {
  if (!sections.length) {
    return '';
  }

  const referenceTop = getHeaderOffset();
  let closestSectionId = sections[0].id;
  let closestDistance = Number.POSITIVE_INFINITY;

  sections.forEach(section => {
    const distance = Math.abs(section.getBoundingClientRect().top - referenceTop);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestSectionId = section.id;
    }
  });

  return closestSectionId;
}

function syncActiveLinkToViewport() {
  const closestSectionId = getClosestSectionId();

  if (closestSectionId) {
    setActiveLink(closestSectionId);
  }
}

function shouldReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  const targetTop = window.scrollY + section.getBoundingClientRect().top - getHeaderOffset();
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: shouldReduceMotion() ? 'auto' : 'smooth'
  });
}

function updateLocationHash(sectionId) {
  if (!sectionId || window.location.hash === `#${sectionId}`) {
    return;
  }

  try {
    window.history.replaceState(null, '', `#${sectionId}`);
  } catch (error) {
    // Ignore history API restrictions for local file contexts.
  }
}

function navigateToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    closeMenu();
    return;
  }

  if (sectionId !== 'seva-booking' && getSelectedSeva()) {
    resetSevaBookingState();
  }

  const shouldDelayScroll = window.innerWidth <= 600 && header.classList.contains('nav-open');

  beginProgrammaticNavigation(sectionId);
  updateLocationHash(sectionId);
  closeMenu();
  clearTimeout(navigationScrollTimer);

  navigationScrollTimer = window.setTimeout(() => {
    scrollToSection(sectionId);

    if (shouldReduceMotion()) {
      window.requestAnimationFrame(endProgrammaticNavigation);
    }
  }, shouldDelayScroll ? 280 : 0);
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

function formatCurrency(value) {
  return currentLang === 'telugu' ? `రూ. ${value}/-` : `Rs. ${value}/-`;
}

function getStoredBookings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(bookingStorageKey));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function setStoredBookings(bookings) {
  localStorage.setItem(bookingStorageKey, JSON.stringify(bookings));
}

function getBookingKey(sevaId, dateValue) {
  return `${dateValue}:${sevaId}`;
}

function getBookedSlots(sevaId, dateValue) {
  if (!sevaId || !dateValue) {
    return 0;
  }

  const bookings = getStoredBookings();
  const booked = Number(bookings[getBookingKey(sevaId, dateValue)] || 0);
  return Number.isFinite(booked) ? booked : 0;
}

function getSelectedSeva() {
  if (!sevaTypeInput || !sevaTypeInput.value) {
    return null;
  }

  return sevaCatalog.find(seva => seva.id === sevaTypeInput.value) || null;
}

function updateFormLockState() {
  const hasSelectedSeva = Boolean(getSelectedSeva());

  if (devoteeNameInput) {
    devoteeNameInput.disabled = !hasSelectedSeva;
  }

  if (devoteeGotramInput) {
    devoteeGotramInput.disabled = !hasSelectedSeva;
  }

  if (devoteePhoneInput) {
    devoteePhoneInput.disabled = !hasSelectedSeva;
  }

  if (sevaDateInput) {
    sevaDateInput.disabled = !hasSelectedSeva;
  }

  if (!hasSelectedSeva) {
    if (sevaSlotsInput) {
      sevaSlotsInput.disabled = true;
    }

    if (bookSevaBtn) {
      bookSevaBtn.disabled = true;
    }
  }
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateValue() {
  return formatDateInputValue(new Date());
}

function isTuesdayDate(dateValue) {
  if (!dateValue) {
    return false;
  }

  const selectedDate = new Date(`${dateValue}T00:00:00`);
  return selectedDate.getDay() === 2;
}

function isAfterSameDayServiceCutoff(dateValue) {
  if (!dateValue || dateValue !== getTodayDateValue()) {
    return false;
  }

  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), bookingRules.sameDayServiceCutoffHour, 0, 0, 0);
  return now >= cutoff;
}

function isAfterNextAvailableDateCutoff() {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), bookingRules.nextAvailableDateCutoffHour, 0, 0, 0);
  return now >= cutoff;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getRegularBookingWindow() {
  const today = new Date();
  const minLeadDays = bookingRules.regularAdvanceDays + (isAfterNextAvailableDateCutoff() ? 1 : 0);
  const minDate = addDays(today, minLeadDays);
  const maxDate = addDays(today, bookingRules.regularWindowDays);

  return {
    minValue: formatDateInputValue(minDate),
    maxValue: formatDateInputValue(maxDate)
  };
}

function getTuesdayBookingWindow() {
  const today = new Date();
  const todayValue = getTodayDateValue();
  const maxDate = addDays(today, bookingRules.tuesdayWindowDays);
  let minDate = new Date(today);

  if (!(minDate.getDay() === 2 && !isAfterSameDayServiceCutoff(todayValue))) {
    const daysUntilTuesday = (2 - minDate.getDay() + 7) % 7;
    minDate = addDays(minDate, daysUntilTuesday === 0 ? 7 : daysUntilTuesday);
  }

  if (isAfterNextAvailableDateCutoff()) {
    minDate = addDays(minDate, 7);
  }

  return {
    minValue: formatDateInputValue(minDate),
    maxValue: formatDateInputValue(maxDate)
  };
}

function getBookingWindowForSeva(selectedSeva) {
  if (selectedSeva && selectedSeva.id === 'tuesday-annadanam') {
    return getTuesdayBookingWindow();
  }

  return getRegularBookingWindow();
}

function isDateOutsideWindow(dateValue, bookingWindow) {
  if (!dateValue || !bookingWindow) {
    return true;
  }

  return dateValue < bookingWindow.minValue || dateValue > bookingWindow.maxValue;
}

function getBookingWindowRestrictionMessage(selectedSeva) {
  if (currentLang === 'telugu') {
    return selectedSeva && selectedSeva.id === 'tuesday-annadanam'
      ? 'మంగళవారం అన్నదానం కోసం రాబోయే 4 వారాల మంగళవారం తేదీల్లో మాత్రమే బుకింగ్ చేయవచ్చు. సాయంత్రం 5:00 తర్వాత తదుపరి అందుబాటు మంగళవారం తేదీ అందుబాటులో ఉండదు.'
      : `మొదటి 5 సేవల కోసం కనీసం ${bookingRules.regularAdvanceDays} రోజుల ముందుగా మాత్రమే బుకింగ్ చేయవచ్చు. సాయంత్రం 5:00 తర్వాత తదుపరి అందుబాటు తేదీ అందుబాటులో ఉండదు. రాబోయే ${bookingRules.regularWindowDays} రోజుల తేదీల్లో మాత్రమే బుకింగ్ చేయవచ్చు.`;
  }

  return selectedSeva && selectedSeva.id === 'tuesday-annadanam'
    ? 'Tuesday Annadanam can be booked only for Tuesdays within the upcoming 4 weeks. After 5:00 PM, the next available Tuesday is skipped.'
    : `For the first 5 sevas, booking starts only from ${bookingRules.regularAdvanceDays} days ahead. After 5:00 PM, the next available date is skipped. Booking remains limited to the upcoming ${bookingRules.regularWindowDays} days.`;
}

function updateDateConstraintsForSelectedSeva() {
  if (!sevaDateInput) {
    return;
  }

  const selectedSeva = getSelectedSeva();
  const bookingWindow = getBookingWindowForSeva(selectedSeva);

  if (selectedSeva && selectedSeva.id === 'tuesday-annadanam') {
    sevaDateInput.min = bookingWindow.minValue;
    sevaDateInput.max = bookingWindow.maxValue;
    sevaDateInput.step = '7';

    if (!sevaDateInput.value || !isTuesdayDate(sevaDateInput.value) || isDateOutsideWindow(sevaDateInput.value, bookingWindow)) {
      sevaDateInput.value = bookingWindow.minValue;
    }
    return;
  }

  sevaDateInput.min = bookingWindow.minValue;
  sevaDateInput.max = bookingWindow.maxValue;
  sevaDateInput.step = '1';

  if (!sevaDateInput.value || isDateOutsideWindow(sevaDateInput.value, bookingWindow)) {
    sevaDateInput.value = bookingWindow.minValue;
  }
}

function updateSevaSelectedLabel() {
  if (!sevaSelected) {
    return;
  }

  const selectedSeva = getSelectedSeva();
  if (!selectedSeva) {
    sevaSelected.textContent = currentLang === 'telugu' ? 'ఎంచుకున్న సేవ: లేదు' : 'Selected seva: None';
    sevaSelected.setAttribute('hidden', '');
    sevaSelected.style.display = 'none';
    return;
  }

  const sevaName = currentLang === 'telugu' ? selectedSeva.telugu : selectedSeva.english;
  const sevaTiming = currentLang === 'telugu' ? selectedSeva.timingTelugu : selectedSeva.timingEnglish;
  sevaSelected.textContent = currentLang === 'telugu'
    ? `ఎంచుకున్న సేవ: ${sevaName} (${sevaTiming})`
    : `Selected seva: ${sevaName} (${sevaTiming})`;
  sevaSelected.removeAttribute('hidden');
  sevaSelected.style.display = 'block';
}

function setSelectedSeva(sevaId) {
  if (!sevaTypeInput) {
    return;
  }

  const previousSevaId = sevaTypeInput.value;
  const hasSelectionChanged = Boolean(sevaId) && previousSevaId !== sevaId;

  sevaTypeInput.value = sevaId || '';

  if (hasSelectionChanged && sevaDateInput) {
    sevaDateInput.value = '';
  }

  sevaOptionCards.forEach(card => {
    const isSelected = card.dataset.sevaId === sevaId;
    card.classList.toggle('is-selected', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));
  });

  updateFormLockState();
  updateDateConstraintsForSelectedSeva();
  updateSevaSelectedLabel();
  clearBookingMessage();
  updateSevaBookingSummary();
}

function resetSevaBookingState() {
  if (sevaBookingForm) {
    sevaBookingForm.reset();
  }

  setSelectedSeva('');
}

function setMinimumBookingDate() {
  if (!sevaDateInput) {
    return;
  }

  const bookingWindow = getRegularBookingWindow();
  sevaDateInput.min = bookingWindow.minValue;
  sevaDateInput.max = bookingWindow.maxValue;
  sevaDateInput.step = '1';

  if (!sevaDateInput.value || isDateOutsideWindow(sevaDateInput.value, bookingWindow)) {
    sevaDateInput.value = bookingWindow.minValue;
  }
}

function clearBookingMessage() {
  if (!sevaBookingMessage) {
    return;
  }

  sevaBookingMessage.textContent = '';
  sevaBookingMessage.className = 'seva-booking-message';
}

function showBookingMessage(type, message) {
  if (!sevaBookingMessage) {
    return;
  }

  sevaBookingMessage.className = `seva-booking-message ${type}`;
  sevaBookingMessage.textContent = message;
}

function updateSevaBookingSummary() {
  if (!sevaTypeInput || !sevaDateInput || !sevaSlotsInput || !sevaAvailability || !sevaTotal || !bookSevaBtn) {
    return;
  }

  const selectedSeva = getSelectedSeva();
  const selectedDate = sevaDateInput.value;

  if (!selectedSeva || !selectedDate) {
    sevaAvailability.textContent = currentLang === 'telugu'
      ? 'సేవా కార్డు మరియు తేదీ ఎంచుకుంటే అందుబాటు స్లాట్లు కనిపిస్తాయి.'
      : 'Choose a seva card and date to view available slots.';
    sevaTotal.textContent = currentLang === 'telugu' ? 'మొత్తం: రూ. 0/-' : 'Total: Rs. 0/-';
    sevaSlotsInput.value = '1';
    sevaSlotsInput.disabled = true;
    bookSevaBtn.disabled = true;
    return;
  }

  const bookingWindow = getBookingWindowForSeva(selectedSeva);

  if (isAfterSameDayServiceCutoff(selectedDate)) {
    sevaAvailability.textContent = currentLang === 'telugu'
      ? 'ఈ రోజు ఉదయం 8:00 తర్వాత సేవా బుకింగ్ అందుబాటులో ఉండదు.'
      : 'Same-day seva booking is not available after 8:00 AM.';
    sevaTotal.textContent = currentLang === 'telugu' ? 'మొత్తం: రూ. 0/-' : 'Total: Rs. 0/-';
    sevaSlotsInput.value = '1';
    sevaSlotsInput.disabled = true;
    bookSevaBtn.disabled = true;
    return;
  }

  if (selectedSeva.id === 'tuesday-annadanam' && !isTuesdayDate(selectedDate)) {
    sevaAvailability.textContent = currentLang === 'telugu'
      ? 'మంగళవారం అన్నదానం కోసం మంగళవారం తేదీలే ఎంచుకోవాలి.'
      : 'For Tuesday Annadanam, only Tuesdays can be selected.';
    sevaTotal.textContent = currentLang === 'telugu' ? 'మొత్తం: రూ. 0/-' : 'Total: Rs. 0/-';
    sevaSlotsInput.value = '1';
    sevaSlotsInput.disabled = true;
    bookSevaBtn.disabled = true;
    return;
  }

  if (isDateOutsideWindow(selectedDate, bookingWindow)) {
    sevaAvailability.textContent = getBookingWindowRestrictionMessage(selectedSeva);
    sevaTotal.textContent = currentLang === 'telugu' ? 'మొత్తం: రూ. 0/-' : 'Total: Rs. 0/-';
    sevaSlotsInput.value = '1';
    sevaSlotsInput.disabled = true;
    bookSevaBtn.disabled = true;
    return;
  }

  const bookedSlots = getBookedSlots(selectedSeva.id, selectedDate);
  const availableSlots = Math.max(selectedSeva.dailySlots - bookedSlots, 0);
  sevaSlotsInput.max = String(Math.max(availableSlots, 1));

  if (availableSlots <= 0) {
    sevaAvailability.textContent = currentLang === 'telugu'
      ? `ఎంచుకున్న తేదీకి అందుబాటులో ఉన్న స్లాట్లు: 0 / ${selectedSeva.dailySlots}`
      : `Available slots for selected date: 0 / ${selectedSeva.dailySlots}`;
    sevaTotal.textContent = currentLang === 'telugu' ? 'మొత్తం: రూ. 0/-' : 'Total: Rs. 0/-';
    sevaSlotsInput.value = '0';
    sevaSlotsInput.disabled = true;
    bookSevaBtn.disabled = true;
    return;
  }

  sevaSlotsInput.disabled = false;
  bookSevaBtn.disabled = false;

  const requestedSlots = Math.max(1, Number.parseInt(sevaSlotsInput.value, 10) || 1);
  sevaSlotsInput.value = String(Math.min(requestedSlots, availableSlots));

  const effectiveSlots = Number.parseInt(sevaSlotsInput.value, 10) || 1;
  const totalAmount = effectiveSlots * selectedSeva.price;

  sevaAvailability.textContent = currentLang === 'telugu'
    ? `ఎంచుకున్న తేదీకి అందుబాటులో ఉన్న స్లాట్లు: ${availableSlots} / ${selectedSeva.dailySlots}`
    : `Available slots for selected date: ${availableSlots} / ${selectedSeva.dailySlots}`;
  sevaTotal.textContent = currentLang === 'telugu'
    ? `మొత్తం: రూ. ${totalAmount}/-`
    : `Total: Rs. ${totalAmount}/-`;
}

function formatBookingDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString(currentLang === 'telugu' ? 'te-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function buildBookingEmailLines(details) {
  return [
    'A new seva booking has been made.',
    '',
    `Devotee Name: ${details.devoteeName}`,
    `Gotram: ${details.devoteeGotram}`,
    `Phone: ${details.devoteePhone}`,
    `Seva (English): ${details.sevaNameEnglish}`,
    `Seva (Telugu): ${details.sevaNameTelugu}`,
    `Timing: ${details.sevaTimingEnglish}`,
    `Date: ${details.selectedDate}`,
    `Slots: ${details.requestedSlots}`,
    `Total: Rs. ${details.totalAmount}/-`
  ];
}

function getBookingSuccessMessage(selectedSeva) {
  const sevaName = currentLang === 'telugu' ? selectedSeva.telugu : selectedSeva.english;
  const requestDate = formatBookingDate(getTodayDateValue());
  const nextRequestDate = formatBookingDate(formatDateInputValue(addDays(new Date(), 1)));

  return currentLang === 'telugu'
    ? `${sevaName} కోసం మీ సేవా అభ్యర్థన విజయవంతంగా స్వీకరించబడింది. ఆలయ ప్రతినిధి మీకు తుది నిర్ధారణను ${requestDate} లేదా ${nextRequestDate} సాయంత్రం 6:00 లోపు పంపిస్తారు. మీ భక్తికి ధన్యవాదాలు.`
    : `Your seva request for ${sevaName} has been received successfully. A temple representative will share the final confirmation with you by 6:00 PM on ${requestDate} or ${nextRequestDate}. Thank you for your devotion.`;
}

function loadSmtpLibrary() {
  if (window.Email && typeof window.Email.send === 'function') {
    return Promise.resolve(window.Email);
  }

  if (smtpLibraryPromise) {
    return smtpLibraryPromise;
  }

  smtpLibraryPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${smtpScriptUrl}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.Email && typeof window.Email.send === 'function') {
          resolve(window.Email);
        } else {
          reject(new Error('SMTP library loaded without Email.send'));
        }
      }, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load SMTP library')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = smtpScriptUrl;
    script.async = true;
    script.onload = () => {
      if (window.Email && typeof window.Email.send === 'function') {
        resolve(window.Email);
      } else {
        reject(new Error('SMTP library loaded without Email.send'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load SMTP library'));
    document.head.appendChild(script);
  }).catch(error => {
    smtpLibraryPromise = null;
    throw error;
  });

  return smtpLibraryPromise;
}

async function sendBookingEmail(details) {
  if (!smtpSecureToken) {
    return { sent: false, reason: 'smtp-not-configured' };
  }

  const subject = `New Seva Booking - ${details.sevaNameEnglish}`;
  const bodyLines = buildBookingEmailLines(details);

  try {
    const emailClient = await loadSmtpLibrary();
    const response = await emailClient.send({
      SecureToken: smtpSecureToken,
      To: smtpToEmail,
      From: smtpFromEmail,
      Subject: subject,
      Body: bodyLines.join('<br/>')
    });

    return {
      sent: typeof response === 'string' && response.toLowerCase() === 'ok',
      response
    };
  } catch (error) {
    return { sent: false, reason: 'smtp-send-failed' };
  }
}

async function handleSevaBookingSubmit(event) {
  event.preventDefault();

  if (!devoteeNameInput || !devoteeGotramInput || !devoteePhoneInput || !sevaTypeInput || !sevaDateInput || !sevaSlotsInput) {
    return;
  }

  clearBookingMessage();

  const devoteeName = devoteeNameInput.value.trim();
  const devoteeGotram = devoteeGotramInput.value.trim();
  const devoteePhone = devoteePhoneInput.value.trim();
  const selectedSeva = getSelectedSeva();
  const selectedDate = sevaDateInput.value;
  const requestedSlots = Number.parseInt(sevaSlotsInput.value, 10);
  const phonePattern = /^[0-9]{10}$/;
  const bookingWindow = getBookingWindowForSeva(selectedSeva);

  if (!devoteeName || !devoteeGotram || !phonePattern.test(devoteePhone) || !selectedSeva || !selectedDate || !Number.isInteger(requestedSlots) || requestedSlots < 1) {
    showBookingMessage('error', currentLang === 'telugu'
      ? 'దయచేసి సరైన వివరాలు నమోదు చేయండి. గోత్రం ఇవ్వాలి, ఫోన్ నంబర్ 10 అంకెలుగా ఉండాలి మరియు సేవా కార్డు ఎంచుకోవాలి.'
      : 'Please enter valid details. Gotram is required, phone number must contain 10 digits, and a seva card must be selected.');
    return;
  }

  if (selectedSeva.id === 'tuesday-annadanam' && !isTuesdayDate(selectedDate)) {
    showBookingMessage('error', currentLang === 'telugu'
      ? 'మంగళవారం అన్నదానం కోసం మంగళవారం తేదీలే ఎంచుకోవాలి.'
      : 'For Tuesday Annadanam, only Tuesdays can be selected.');
    return;
  }

  if (isAfterSameDayServiceCutoff(selectedDate)) {
    showBookingMessage('error', currentLang === 'telugu'
      ? 'ఈ రోజు ఉదయం 8:00 తర్వాత సేవా బుకింగ్ చేయలేరు.'
      : 'You cannot book seva for today after 8:00 AM.');
    return;
  }

  if (isDateOutsideWindow(selectedDate, bookingWindow)) {
    showBookingMessage('error', getBookingWindowRestrictionMessage(selectedSeva));
    return;
  }

  const bookedSlots = getBookedSlots(selectedSeva.id, selectedDate);
  const availableSlots = Math.max(selectedSeva.dailySlots - bookedSlots, 0);

  if (requestedSlots > availableSlots) {
    showBookingMessage('error', currentLang === 'telugu'
      ? `ఈ తేదీకి ${availableSlots} స్లాట్(లు) మాత్రమే మిగిలి ఉన్నాయి.`
      : `Only ${availableSlots} slot(s) are available for this date.`);
    updateSevaBookingSummary();
    return;
  }

  const bookings = getStoredBookings();
  const bookingKey = getBookingKey(selectedSeva.id, selectedDate);
  bookings[bookingKey] = bookedSlots + requestedSlots;
  setStoredBookings(bookings);

  const totalAmount = requestedSlots * selectedSeva.price;
  showBookingMessage('success', getBookingSuccessMessage(selectedSeva));

  const bookingDetails = {
    devoteeName,
    devoteeGotram,
    devoteePhone,
    sevaNameEnglish: selectedSeva.english,
    sevaNameTelugu: selectedSeva.telugu,
    sevaTimingEnglish: selectedSeva.timingEnglish,
    selectedDate,
    requestedSlots,
    totalAmount
  };

  await sendBookingEmail(bookingDetails);

  devoteeNameInput.value = '';
  devoteeGotramInput.value = '';
  devoteePhoneInput.value = '';
  sevaSlotsInput.value = '1';
  updateSevaBookingSummary();
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

  updateFormLockState();
  updateSevaSelectedLabel();
  updateSevaBookingSummary();
  clearBookingMessage();
  updatePageLoaderText();

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
  if (isProgrammaticNavActive) {
    return;
  }

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
  link.addEventListener('click', event => {
    event.preventDefault();
    navigateToSection(link.dataset.section || '');
  });
});

galleryButtons.forEach(button => {
  button.addEventListener('click', () => {
    const image = button.querySelector('img');
    openLightbox(image, button);
  });
});

document.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const card = target.closest('.seva-option');
  if (!card) {
    return;
  }

  const sevaId = card.getAttribute('data-seva-id') || '';
  setSelectedSeva(sevaId);
});

document.addEventListener('keydown', event => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const card = target.closest('.seva-option');
  if (!card) {
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const sevaId = card.getAttribute('data-seva-id') || '';
    setSelectedSeva(sevaId);
  }
});

if (sevaDateInput) {
  sevaDateInput.addEventListener('change', () => {
    clearBookingMessage();
    updateSevaBookingSummary();
  });
}

if (sevaSlotsInput) {
  sevaSlotsInput.addEventListener('input', () => {
    clearBookingMessage();
    updateSevaBookingSummary();
  });
}

if (sevaBookingForm) {
  sevaBookingForm.addEventListener('submit', handleSevaBookingSubmit);
}

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
window.addEventListener('scroll', () => {
  if (!isProgrammaticNavActive) {
    return;
  }

  clearTimeout(navScrollStopTimer);
  navScrollStopTimer = window.setTimeout(endProgrammaticNavigation, 140);
}, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth > 600) {
    closeMenu();
  }
});

if (sevaTypeInput) {
  sevaTypeInput.value = '';
}
startPageLoaderCountdown();

if (pageLoaderIsReady) {
  markPageLoaderReady();
} else {
  window.addEventListener('load', markPageLoaderReady, { once: true });
}

updateFormLockState();
setMinimumBookingDate();
updateSevaSelectedLabel();
updateSevaBookingSummary();
updateMenuState(false);
syncActiveLinkToViewport();