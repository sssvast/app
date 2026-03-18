const header = document.querySelector('header');
const teluguBtn = document.getElementById('teluguBtn');
const englishBtn = document.getElementById('englishBtn');
const menuToggle = document.getElementById('menuToggle');
const menuToggleLabel = document.getElementById('menuToggleLabel');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const navLinks = document.querySelectorAll('header nav a.nav-link');
const sections = document.querySelectorAll('main section[id]');
const lightbox = document.getElementById('lightbox');
const backgroundMusic = document.getElementById('backgroundMusic');
const sevaDateBlockedHint = document.getElementById('sevaDateBlockedHint');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const sevaList = document.getElementById('sevaList');
const sevaBookingForm = document.getElementById('sevaBookingForm');
const devoteeNameInput = document.getElementById('devoteeName');
const devoteeGotramInput = document.getElementById('devoteeGotram');
const devoteePhoneInput = document.getElementById('devoteePhone');
const sevaTypeInput = document.getElementById('sevaType');
const sevaDateInput = document.getElementById('sevaDate');
const sevaSlotsInput = document.getElementById('sevaSlots');
const sevaSelected = document.getElementById('sevaSelected');
const sevaSelectionHint = document.getElementById('sevaSelectionHint');
const sevaAvailability = document.getElementById('sevaAvailability');
const sevaTotal = document.getElementById('sevaTotal');
const sevaBookingMessage = document.getElementById('sevaBookingMessage');
const bookSevaBtn = document.getElementById('bookSevaBtn');
const honeypotInput = document.getElementById('bookingHoneypot');
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
let musicResumeHandlersBound = false;
const defaultBookingRules = {
  regularAdvanceDays: 1,
  regularWindowDays: 15,
  tuesdayWindowDays: 28,
  nextAvailableDateCutoffHour: 17,
  tuesdaySevaId: 'tuesday-annadanam'
};
let bookingRules = { ...defaultBookingRules };
const defaultBookingMessages = {
  telugu: {
    selectionHint: {
      default: 'దశ 2: మీకు కావలసిన సేవా కార్డు పై ట్యాప్ చేసి ఎంచుకోండి. మళ్ళీ ట్యాప్ చేస్తే ఎంపిక తీసివేయబడుతుంది.',
      selected: 'దశ 2 పూర్తైంది: {sevaName} ఎంచుకున్నారు. మరో కార్డు ట్యాప్ చేస్తే ఎంపిక మారుతుంది.'
    },
    selectedSeva: {
      none: 'ఎంచుకున్న సేవ: లేదు',
      selected: 'ఎంచుకున్న సేవ: {sevaName} ({sevaTiming})'
    },
    availability: {
      selectDateAndSeva: '',
      tuesdayOnly: 'మంగళవారం అన్నదానం కోసం మంగళవారం తేదీలే ఎంచుకోవాలి.',
      loading: 'ప్రత్యక్ష అందుబాటు స్లాట్లు చూస్తున్నాం...',
      zeroSlots: 'ఎంచుకున్న తేదీకి అందుబాటులో ఉన్న స్లాట్లు: 0 / {dailySlots}',
      availableSlots: 'ఎంచుకున్న తేదీకి అందుబాటులో ఉన్న స్లాట్లు: {availableSlots} / {dailySlots}'
    },
    total: {
      zero: 'రుసుము: ₹ 0/-',
      amount: 'రుసుము: ₹ {totalAmount}/-'
    },
    errors: {
      invalidDetails: 'దయచేసి సరైన వివరాలు నమోదు చేయండి. గోత్రం ఇవ్వాలి, వాట్సాప్ నంబర్ 10 అంకెలుగా ఉండాలి మరియు సేవా కార్డు ఎంచుకోవాలి.',
      tuesdayOnly: 'మంగళవారం అన్నదానం కోసం మంగళవారం తేదీలే ఎంచుకోవాలి.',
      bookingWindowTuesday: 'మంగళవారం అన్నదానం కోసం రాబోయే {tuesdayWindowDays} రోజులలోని మంగళవారం తేదీల్లో మాత్రమే బుకింగ్ చేయవచ్చు. అన్ని సేవలకు కనీసం {regularAdvanceDays} రోజు గ్యాప్ అవసరం.',
      bookingWindowRegular: 'అన్ని సేవలకు కనీసం {regularAdvanceDays} రోజు ముందుగా మాత్రమే బుకింగ్ చేయవచ్చు. రాబోయే {regularWindowDays} రోజుల తేదీల్లో మాత్రమే బుకింగ్ చేయవచ్చు.',
      onlySlotsLeft: 'ఈ తేదీకి {availableSlots} స్లాట్(లు) మాత్రమే మిగిలి ఉన్నాయి.',
      blockedDate: 'ఎంచుకున్న తేదీ ఈ సేవకు అందుబాటులో లేదు. దయచేసి మరొక తేదీ ఎంచుకోండి.',
      tooFast: 'దయచేసి వివరాలు సమీక్షించి తిరిగి సమర్పించండి.',
      rateLimited: 'చాలా ప్రయత్నాలు చేశారు. దయచేసి కొంత సమయం తర్వాత ప్రయత్నించండి.',
      bookingUnavailable: 'ప్రస్తుతం ప్రత్యక్ష అందుబాటును నిర్ధారించలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.'
    },
    success: {
      bookingReceived: '{sevaName} కోసం మీ సేవా అభ్యర్థన విజయవంతంగా స్వీకరించబడింది. ఆలయ ప్రతినిధి మీకు తుది నిర్ధారణను {nextRequestDate} సాయంత్రం 6:00 లోపు పంపిస్తారు. మీ భక్తికి ధన్యవాదాలు.',
      bookingReceivedWithRef: '{sevaName} కోసం మీ సేవా అభ్యర్థన విజయవంతంగా స్వీకరించబడింది. బుకింగ్ నంబర్: {bookingRef}. ఆలయ ప్రతినిధి మీకు తుది నిర్ధారణను {nextRequestDate} సాయంత్రం 6:00 లోపు పంపిస్తారు. మీ భక్తికి ధన్యవాదాలు.'
    }
  },
  english: {
    selectionHint: {
      default: 'Step 2: Tap a seva card to select it. Tap again to clear your selection.',
      selected: 'Step 2 complete: {sevaName} selected. Tap another card to change your selection.'
    },
    selectedSeva: {
      none: 'Selected seva: None',
      selected: 'Selected seva: {sevaName} ({sevaTiming})'
    },
    availability: {
      selectDateAndSeva: '',
      tuesdayOnly: 'For Tuesday Annadanam, only Tuesdays can be selected.',
      loading: 'Checking live availability...',
      zeroSlots: 'Available slots for selected date: 0 / {dailySlots}',
      availableSlots: 'Available slots for selected date: {availableSlots} / {dailySlots}'
    },
    total: {
      zero: 'Amount: ₹ 0/-',
      amount: 'Amount: ₹ {totalAmount}/-'
    },
    errors: {
      invalidDetails: 'Please enter valid details. Gotram is required, WhatsApp number must contain 10 digits, and a seva card must be selected.',
      tuesdayOnly: 'For Tuesday Annadanam, only Tuesdays can be selected.',
      bookingWindowTuesday: 'Tuesday Annadanam can be booked only for Tuesdays within the upcoming {tuesdayWindowDays} days. A minimum {regularAdvanceDays}-day gap is required for all sevas.',
      bookingWindowRegular: 'For all sevas, booking starts only from {regularAdvanceDays} day(s) ahead. Booking remains limited to the upcoming {regularWindowDays} days.',
      onlySlotsLeft: 'Only {availableSlots} slot(s) are available for this date.',
      blockedDate: 'The selected date is not available for this seva. Please choose another date.',
      tooFast: 'Please review your details and try again.',
      rateLimited: 'Too many attempts. Please wait a few minutes before trying again.',
      bookingUnavailable: 'We could not verify live availability right now. Please try again.'
    },
    success: {
      bookingReceived: 'Your seva request for {sevaName} has been received successfully. A temple representative will share the final confirmation with you before 6:00 PM on {nextRequestDate}. Thank you for your devotion.',
      bookingReceivedWithRef: 'Your seva request for {sevaName} has been received. Booking Reference: {bookingRef}. A temple representative will share the final confirmation with you before 6:00 PM on {nextRequestDate}. Thank you for your devotion.'
    }
  }
};
let bookingMessages = JSON.parse(JSON.stringify(defaultBookingMessages));
const bookingStorageKey = 'svsTempleSevaBookings';
const musicPreferenceKey = 'svsTempleMusicMuted';
const bookingRateLimitKey = 'svsTempleBookingAttemptsByPhone';
const BOOKING_RATE_LIMIT_MAX = 5;
const BOOKING_RATE_WINDOW_MS = 10 * 60 * 1000;
const BOOKING_MIN_TIME_MS = 5000;
const BOOKING_AVAILABILITY_CACHE_TTL_MS = 30 * 1000;
const pageLoadTime = Date.now();
const bookingAvailabilityCache = new Map();
let bookingAvailabilityRequestId = 0;
const templeBookingEmail = 'svanjaneya.temple@gmail.com';
const smtpConfig = window.TEMPLE_SMTP_CONFIG || {};
const smtpSecureToken = typeof smtpConfig.secureToken === 'string' ? smtpConfig.secureToken.trim() : '';
const smtpFromEmail = smtpConfig.fromEmail || templeBookingEmail;
const smtpToEmail = smtpConfig.toEmail || templeBookingEmail;
const smtpScriptUrl = 'https://smtpjs.com/v3/smtp.js';
const sevaCatalogUrl = 'assets/data/sevas.json';
const galleryUrl = 'assets/data/gallery.json';
const contentUrl = 'assets/data/content.json';

function logJsonLoadFallback(dataPath, error) {
  const reason = error && typeof error.message === 'string' ? error.message : String(error);

  if (window.location.protocol === 'file:') {
    console.warn(
      `[Temple] Failed to load ${dataPath} (${reason}). The app is running via file:// and browser JSON fetch may be blocked. Run from a local server: python -m http.server 8080 or npx serve .`
    );
    return;
  }

  console.warn(`[Temple] Failed to load ${dataPath} (${reason}). Using fallback data.`);
}

let smtpLibraryPromise = null;
const fallbackSevaCatalog = [
  {
    id: 'rahu-kethu-pooja',
    telugu: 'శ్రీ రాహు & కేతు పూజ',
    english: 'Sri Rahu & Kethu Pooja',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 750,
    dailySlots: 20,
    blockedDates: []
  },
  {
    id: 'varadhanjaneya-abhishekam',
    telugu: 'శ్రీ వరధాంజనేయ స్వామి అభిషేకం',
    english: 'Sri Varadhanjaneya Swamy Abhishekam',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 500,
    dailySlots: 20,
    blockedDates: []
  },
  {
    id: 'ramalingeswara-abhishekam',
    telugu: 'శ్రీ రామలింగేశ్వర స్వామి అభిషేకం',
    english: 'Sri Ramalingeswara Swamy Abhishekam',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 500,
    dailySlots: 20,
    blockedDates: []
  },
  {
    id: 'rajarajeshwari-abhishekam',
    telugu: 'శ్రీ రాజరాజేశ్వరి మాత అభిషేకం',
    english: 'Sri Rajarajeshwari Matha Abhishekam',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 500,
    dailySlots: 20,
    blockedDates: []
  },
  {
    id: 'tuesday-annadanam',
    telugu: 'మంగళవారం అన్నదానం',
    english: 'Tuesday Annadanam',
    timingTelugu: 'ఉదయం 8:00',
    timingEnglish: '8:00 AM',
    price: 6500,
    dailySlots: 1,
    blockedDates: []
  }
];
let sevaCatalog = [...fallbackSevaCatalog];
const defaultGalleryCatalog = [
  { src: 'assets/images/t1.jpg', teluguAlt: 'శ్రీ వరధాంజనేయ స్వామి వారు', englishAlt: 'Sri Varadhanjeneya Swamy' },
  { src: 'assets/images/t2.jpg', teluguAlt: 'శ్రీ రాజరాజేశ్వరి అమ్మ వారు', englishAlt: 'Sri Rajarajeshwari Amman' },
  { src: 'assets/images/t3.jpg', teluguAlt: 'శ్రీ రామలింగేశ్వర స్వామి వారు', englishAlt: 'Sri Ramalingeswara Swamy' },
  { src: 'assets/images/t4.jpg', teluguAlt: 'గుడి ముఖద్వారం', englishAlt: 'Temple Arch' }
];
let galleryCatalog = [...defaultGalleryCatalog];
const defaultContent = {
  page: {
    titleTelugu: 'శ్రీ శ్రీ శ్రీ వరధాంజనేయ స్వామి వారి దేవాలయం',
    titleEnglish: 'Sri Sri Sri Varadhan Janeya Swamy Temple'
  },
  nav: {
    telugu: { about: 'ఆలయం గురించి', timings: 'సమయాలు', pooja: 'పూజలు', 'seva-booking': 'సేవా బుకింగ్', gallery: 'గ్యాలరీ', location: 'లోకేషన్' },
    english: { about: 'About', timings: 'Timings', pooja: 'Services', 'seva-booking': 'Seva Booking', gallery: 'Gallery', location: 'Location' }
  },
  hero: {
    kickerTelugu: 'శ్రీ ఆంజనేయ స్వామి ఆశీస్సులతో',
    kickerEnglish: 'With the blessings of Sri Anjaneya Swamy',
    titleTelugu: 'జై శ్రీ రామ్',
    titleEnglish: 'Jai Sri Ram'
  },
  banner: {
    labelTelugu: 'రాబోయే కార్యక్రమాలు',
    labelEnglish: 'Upcoming Events',
    items: [
      { telugu: 'ప్రతి శనివారం సాయంత్రం 6:00 కు హనుమాన్ చాలీసా పారాయణం', english: 'Every Saturday at 6:00 PM, Hanuman Chalisa recital' },
      { telugu: 'ప్రతి మంగళవారం భక్తులకు అన్నదానం మధ్యాహ్నం 12:30 కు', english: 'Annadanam for devotees every Tuesday at 12:30 PM' },
      { telugu: 'ఉగాది పండుగ - 2026 మార్చి 19', english: 'Ugadi Festival - March 19, 2026', showUntil: '2026-03-19' }
    ]
  },
  sections: {
    about: {
      paragraphs: [
        { telugu: 'శ్రీ శ్రీ శ్రీ వరధాంజనేయ స్వామి వారి దేవాలయం హైదరాబాద్, ఎల్. బి. నగర్ లోని పవిత్రమైన ఆంజనేయ స్వామి ఆలయం. ఈ ఆలయానికి భక్తులు దూర ప్రాంతాల నుండి దర్శనం కోసం వస్తారు.', english: 'Sri Sri Sri Varadhan Janeya Swamy Temple is a sacred Hanuman temple located in Hyderabad. Devotees come from distant places to seek blessings and darshan.' }
      ]
    },
    pooja: { items: [ { telugu: 'అర్చన', english: 'Archana' }, { telugu: 'అభిషేకం', english: 'Abhishekam' }, { telugu: 'హనుమాన్ చాలీసా పారాయణం', english: 'Hanuman Chalisa Recitation' }, { telugu: 'ప్రత్యేక పూజలు', english: 'Special Poojas' } ] },
    timings: {
      slots: [
        { labelTelugu: 'ఉదయం', labelEnglish: 'Morning', timeTelugu: 'ఉదయం 6:00 – 11:30', timeEnglish: '6:00 AM – 11:30 AM', icon: 'morning' },
        { labelTelugu: 'సాయంత్రం', labelEnglish: 'Evening', timeTelugu: 'సాయంత్రం 6:00 – 8:00', timeEnglish: '6:00 PM – 8:00 PM', icon: 'evening' }
      ]
    },
    location: {
      mapIntroTelugu: 'Google Maps లో ఆలయ లోకేషన్:',
      mapIntroEnglish: 'Temple location on Google Maps:',
      mapLinkTelugu: 'Google Maps లో తెరవండి',
      mapLinkEnglish: 'Open in Google Maps',
      mapLinkUrl: 'https://maps.app.goo.gl/aPE5P6qyGQTjuyRh7',
      mapCoordinates: '17.347357,78.545501',
      mapZoom: 17
    }
  },
  audio: {
    musicSrc: 'assets/audio/temple-background.mp3',
    autoplay: true,
    loop: true,
    volume: 0.2
  },
  integrations: {
    bookingWebhookUrl: '',
    bookingWebhookTimeoutMs: 12000,
    enableSheetUpdate: true,
    enableWhatsappMessage: true
  },
  footer: {
    telugu: '© 2026 శ్రీ శ్రీ శ్రీ వరధాంజనేయ స్వామి వారి దేవాలయం | దానాపురం, ఎల్. బి. నగర్, హైదరాబాదు-74, తెలంగాణ | ఫోన్: 040-12345678 | ఇమెయిల్: svanjaneya.temple@gmail.com',
    english: '© 2026 Sri Sri Sri Varadhan Janeya Swamy Temple | Danapuram, L. B. Nagar, Hyderabad-74, Telangana | Phone: 040-12345678 | Email: svanjaneya.temple@gmail.com',
    phone: '040-12345678',
    email: 'svanjaneya.temple@gmail.com'
  }
};
let siteContent = JSON.parse(JSON.stringify(defaultContent));
let pageTitles = {
  telugu: 'శ్రీ శ్రీ శ్రీ వరధాంజనేయ స్వామి వారి దేవాలయం',
  english: 'Sri Sri Sri Varadhan Janeya Swamy Temple'
};
let navLabels = {
  telugu: {
    about: 'ఆలయం గురించి',
    timings: 'సమయాలు',
    pooja: 'పూజలు',
    'seva-booking': 'సేవా బుకింగ్',
    gallery: 'గ్యాలరీ',
    location: 'లోకేషన్'
  },
  english: {
    about: 'About',
    timings: 'Timings',
    pooja: 'Services',
    'seva-booking': 'Seva Booking',
    gallery: 'Gallery',
    location: 'Location'
  }
};

function getSevaOptionCards() {
  return document.querySelectorAll('.seva-option');
}

function getSevaCardTextValues(seva) {
  return {
    title: currentLang === 'telugu' ? seva.telugu : seva.english,
    price: currentLang === 'telugu' ? `రుసుము: ₹ ${seva.price}/-` : `Price: ₹ ${seva.price}/-`,
    slots: currentLang === 'telugu' ? `రోజుకు స్లాట్లు: ${seva.dailySlots}` : `Slots per day: ${seva.dailySlots}`,
    timing: currentLang === 'telugu' ? `సమయం: ${seva.timingTelugu}` : `Timing: ${seva.timingEnglish}`
  };
}

function renderSevaCards() {
  if (!sevaList) {
    return;
  }

  const selectedSevaId = sevaTypeInput ? sevaTypeInput.value : '';
  const cardsFragment = document.createDocumentFragment();

  sevaCatalog.forEach(seva => {
    const card = document.createElement('li');
    const isSelected = selectedSevaId === seva.id;
    const textValues = getSevaCardTextValues(seva);

    card.className = 'seva-card seva-option';
    card.dataset.sevaId = seva.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.classList.toggle('is-selected', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));

    const title = document.createElement('h4');
    title.dataset.telugu = seva.telugu;
    title.dataset.english = seva.english;
    title.textContent = textValues.title;

    const price = document.createElement('p');
    price.dataset.telugu = `రుసుము: ₹ ${seva.price}/-`;
    price.dataset.english = `Price: ₹ ${seva.price}/-`;
    price.textContent = textValues.price;

    const slots = document.createElement('p');
    slots.dataset.telugu = `రోజుకు స్లాట్లు: ${seva.dailySlots}`;
    slots.dataset.english = `Slots per day: ${seva.dailySlots}`;
    slots.textContent = textValues.slots;

    const timing = document.createElement('p');
    timing.dataset.telugu = `సమయం: ${seva.timingTelugu}`;
    timing.dataset.english = `Timing: ${seva.timingEnglish}`;
    timing.textContent = textValues.timing;

    card.append(title, price, slots, timing);
    cardsFragment.appendChild(card);
  });

  sevaList.replaceChildren(cardsFragment);
}

function normalizeSevaCatalogItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const id = typeof item.id === 'string' ? item.id.trim() : '';
  const telugu = typeof item.telugu === 'string' ? item.telugu.trim() : '';
  const english = typeof item.english === 'string' ? item.english.trim() : '';
  const timingTelugu = typeof item.timingTelugu === 'string' ? item.timingTelugu.trim() : '';
  const timingEnglish = typeof item.timingEnglish === 'string' ? item.timingEnglish.trim() : '';
  const price = Number(item.price);
  const dailySlots = Number(item.dailySlots);

  if (!id || !telugu || !english || !timingTelugu || !timingEnglish) {
    return null;
  }

  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(dailySlots) || dailySlots < 1) {
    return null;
  }

  const blockedDates = Array.isArray(item.blockedDates)
    ? item.blockedDates.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    : [];

  return {
    id,
    telugu,
    english,
    timingTelugu,
    timingEnglish,
    price: Math.round(price),
    dailySlots: Math.max(1, Math.trunc(dailySlots)),
    blockedDates
  };
}

function normalizeSevaCatalogPayload(payload) {
  const list = Array.isArray(payload)
    ? payload
    : (payload && Array.isArray(payload.sevas) ? payload.sevas : []);

  const normalized = list
    .map(normalizeSevaCatalogItem)
    .filter(Boolean);

  const unique = [];
  const seenIds = new Set();

  normalized.forEach(seva => {
    if (seenIds.has(seva.id)) {
      return;
    }

    seenIds.add(seva.id);
    unique.push(seva);
  });

  return unique;
}

async function loadSevaCatalog() {
  let loadedCatalog = [...fallbackSevaCatalog];
  let loadedRules = { ...defaultBookingRules };
  let loadedMessages = JSON.parse(JSON.stringify(defaultBookingMessages));

  try {
    const response = await fetch(sevaCatalogUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load seva catalog: ${response.status}`);
    }

    const payload = await response.json();

    const normalizedRules = normalizeBookingRulesPayload(payload);
    if (normalizedRules) {
      loadedRules = normalizedRules;
    }

    const normalizedMessages = normalizeBookingMessagesPayload(payload);
    if (normalizedMessages) {
      loadedMessages = normalizedMessages;
    }

    const normalizedCatalog = normalizeSevaCatalogPayload(payload);
    if (normalizedCatalog.length > 0) {
      loadedCatalog = normalizedCatalog;
    }
  } catch (error) {
    logJsonLoadFallback(sevaCatalogUrl, error);
  }

  bookingRules = loadedRules;
  bookingMessages = loadedMessages;
  sevaCatalog = loadedCatalog;

  if (sevaTypeInput && sevaTypeInput.value && !sevaCatalog.some(seva => seva.id === sevaTypeInput.value)) {
    sevaTypeInput.value = '';
  }

  renderSevaCards();
  updateDateConstraintsForSelectedSeva();
  updateFormLockState();
  updateSevaSelectedLabel();
  updateSevaSelectionHint();
  updateSevaBookingSummary();

  console.info('[Temple] Booking rules in use:', bookingRules);
}

function normalizeBookingRulesPayload(payload) {
  const source = payload && typeof payload === 'object' && payload.bookingRules && typeof payload.bookingRules === 'object'
    ? payload.bookingRules
    : payload;

  if (!source || typeof source !== 'object') {
    return null;
  }

  const normalized = { ...defaultBookingRules };
  const regularAdvanceDays = Number(source.regularAdvanceDays);
  const regularWindowDays = Number(source.regularWindowDays);
  const tuesdayWindowDays = Number(source.tuesdayWindowDays);
  const nextAvailableDateCutoffHour = Number(source.nextAvailableDateCutoffHour);

  if (Number.isFinite(regularAdvanceDays) && regularAdvanceDays >= 1) {
    normalized.regularAdvanceDays = Math.max(1, Math.trunc(regularAdvanceDays));
  }

  if (Number.isFinite(regularWindowDays) && regularWindowDays >= normalized.regularAdvanceDays) {
    normalized.regularWindowDays = Math.max(normalized.regularAdvanceDays, Math.trunc(regularWindowDays));
  }

  if (Number.isFinite(tuesdayWindowDays) && tuesdayWindowDays >= 7) {
    normalized.tuesdayWindowDays = Math.max(7, Math.trunc(tuesdayWindowDays));
  }

  if (Number.isFinite(nextAvailableDateCutoffHour) && nextAvailableDateCutoffHour >= 0 && nextAvailableDateCutoffHour <= 23) {
    normalized.nextAvailableDateCutoffHour = Math.trunc(nextAvailableDateCutoffHour);
  }

  if (typeof source.tuesdaySevaId === 'string' && source.tuesdaySevaId.trim()) {
    normalized.tuesdaySevaId = source.tuesdaySevaId.trim();
  }

  normalized.regularWindowDays = Math.max(normalized.regularAdvanceDays, normalized.regularWindowDays);
  normalized.tuesdayWindowDays = Math.max(7, normalized.tuesdayWindowDays);

  return normalized;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMergeContent(base, override) {
    if (!isPlainObject(base)) {
      return override !== undefined ? override : base;
    }

    const result = {};
    Object.keys(base).forEach(key => {
      const overrideVal = isPlainObject(override) && override[key] !== undefined ? override[key] : undefined;
      if (isPlainObject(base[key])) {
        result[key] = deepMergeContent(base[key], overrideVal);
      } else if (Array.isArray(base[key])) {
        result[key] = Array.isArray(overrideVal) && overrideVal.length > 0 ? overrideVal : base[key];
      } else {
        result[key] = overrideVal !== undefined ? overrideVal : base[key];
      }
    });
    return result;
  }

  function normalizeContentPayload(payload) {
    if (!isPlainObject(payload)) {
      return null;
    }

    return deepMergeContent(defaultContent, payload);
  }

  function renderHero() {
    const kickerEl = document.getElementById('heroKicker');
    const titleEl = document.getElementById('heroTitle');
    const hero = siteContent.hero;

    if (kickerEl) {
      kickerEl.dataset.telugu = hero.kickerTelugu;
      kickerEl.dataset.english = hero.kickerEnglish;
      kickerEl.textContent = currentLang === 'telugu' ? hero.kickerTelugu : hero.kickerEnglish;
    }

    if (titleEl) {
      titleEl.dataset.telugu = hero.titleTelugu;
      titleEl.dataset.english = hero.titleEnglish;
      titleEl.textContent = currentLang === 'telugu' ? hero.titleTelugu : hero.titleEnglish;
    }
  }

  function renderBanner() {
    const track1 = document.getElementById('eventBannerTrack1');
    const track2 = document.getElementById('eventBannerTrack2');
    if (!track1 || !track2) {
      return;
    }

    const banner = siteContent.banner;
    const todayValue = getTodayDateValue();

    const visibleBannerItems = (banner.items || []).filter(item => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const showUntil = typeof item.showUntil === 'string' ? item.showUntil.trim() : '';
      if (!showUntil) {
        return true;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(showUntil)) {
        return true;
      }

      return todayValue <= showUntil;
    });

    function buildTrackFragment() {
      const frag = document.createDocumentFragment();
      const labelEl = document.createElement('span');
      labelEl.className = 'event-banner-label';
      labelEl.dataset.telugu = banner.labelTelugu;
      labelEl.dataset.english = banner.labelEnglish;
      labelEl.textContent = currentLang === 'telugu' ? banner.labelTelugu : banner.labelEnglish;
      frag.appendChild(labelEl);

      visibleBannerItems.forEach(item => {
        const span = document.createElement('span');
        span.className = 'event-banner-item';
        span.dataset.telugu = item.telugu;
        span.dataset.english = item.english;
        span.textContent = currentLang === 'telugu' ? item.telugu : item.english;
        frag.appendChild(span);
      });
      return frag;
    }

    track1.replaceChildren(buildTrackFragment());
    track2.replaceChildren(buildTrackFragment());
  }

  function renderAboutSection() {
    const container = document.getElementById('aboutContent');
    if (!container) {
      return;
    }

    const frag = document.createDocumentFragment();
    (siteContent.sections.about.paragraphs || []).forEach(para => {
      const p = document.createElement('p');
      p.className = 'content-p';
      p.dataset.telugu = para.telugu;
      p.dataset.english = para.english;
      p.textContent = currentLang === 'telugu' ? para.telugu : para.english;
      frag.appendChild(p);
    });
    container.replaceChildren(frag);
  }

  function renderPoojaList() {
    const list = document.getElementById('poojaList');
    if (!list) {
      return;
    }

    const frag = document.createDocumentFragment();
    (siteContent.sections.pooja.items || []).forEach(item => {
      const li = document.createElement('li');
      li.dataset.telugu = item.telugu;
      li.dataset.english = item.english;
      li.textContent = currentLang === 'telugu' ? item.telugu : item.english;
      frag.appendChild(li);
    });
    list.replaceChildren(frag);
  }

  function renderFestivalsList() {
    const list = document.getElementById('festivalsList');
    if (!list) {
      return;
    }

    const festivals = siteContent.sections && siteContent.sections.festivals;
    const festivalItems = festivals && Array.isArray(festivals.items) ? festivals.items : [];

    const frag = document.createDocumentFragment();
    festivalItems.forEach(item => {
      const li = document.createElement('li');
      li.dataset.telugu = item.telugu;
      li.dataset.english = item.english;
      li.textContent = currentLang === 'telugu' ? item.telugu : item.english;
      frag.appendChild(li);
    });
    list.replaceChildren(frag);
  }

  function renderTimingsSection() {
    const container = document.getElementById('timingsContent');
    if (!container) {
      return;
    }

    const timings = siteContent.sections && siteContent.sections.timings;
    const slots = timings && Array.isArray(timings.slots) ? timings.slots : [];

    const grid = document.createElement('div');
    grid.className = 'timings-grid';

    slots.forEach(slot => {
      const card = document.createElement('div');
      card.className = 'timing-card timing-card--' + (slot.icon || 'morning');

      const iconEl = document.createElement('div');
      iconEl.className = 'timing-icon timing-icon--' + (slot.icon || 'morning');
      iconEl.setAttribute('aria-hidden', 'true');

      const labelEl = document.createElement('div');
      labelEl.className = 'timing-label';
      labelEl.dataset.telugu = slot.labelTelugu;
      labelEl.dataset.english = slot.labelEnglish;
      labelEl.textContent = currentLang === 'telugu' ? slot.labelTelugu : slot.labelEnglish;

      const timeEl = document.createElement('div');
      timeEl.className = 'timing-time';
      timeEl.dataset.telugu = slot.timeTelugu;
      timeEl.dataset.english = slot.timeEnglish;
      timeEl.textContent = currentLang === 'telugu' ? slot.timeTelugu : slot.timeEnglish;

      card.appendChild(iconEl);
      card.appendChild(labelEl);
      card.appendChild(timeEl);
      grid.appendChild(card);
    });

    container.replaceChildren(grid);
  }

  function renderLocationSection() {
    const introEl = document.getElementById('locationMapIntro');
    const linkEl = document.getElementById('locationMapLink');
    const mapEl = document.getElementById('locationMap');
    const loc = siteContent.sections.location;

    if (introEl) {
      introEl.dataset.telugu = loc.mapIntroTelugu;
      introEl.dataset.english = loc.mapIntroEnglish;
      introEl.textContent = currentLang === 'telugu' ? loc.mapIntroTelugu : loc.mapIntroEnglish;
    }

    if (linkEl) {
      linkEl.href = loc.mapLinkUrl;
      linkEl.dataset.telugu = loc.mapLinkTelugu;
      linkEl.dataset.english = loc.mapLinkEnglish;
      linkEl.textContent = currentLang === 'telugu' ? loc.mapLinkTelugu : loc.mapLinkEnglish;
    }

    if (mapEl) {
      const newSrc = `https://www.google.com/maps?q=${encodeURIComponent(loc.mapCoordinates)}&z=${loc.mapZoom}&output=embed`;
      if (mapEl.src !== newSrc) {
        mapEl.src = newSrc;
      }
    }
  }

  function renderFooter() {
    const footerEl = document.getElementById('siteFooterText');
    const footerContactsEl = document.getElementById('siteFooterContacts');
    if (!footerEl) {
      return;
    }

    const footer = isPlainObject(siteContent.footer) ? siteContent.footer : {};
    const footerTelugu = typeof footer.telugu === 'string' ? footer.telugu : '';
    const footerEnglish = typeof footer.english === 'string' ? footer.english : '';

    const stripContactPart = text => text
      .replace(/\|\s*ఫోన్\s*:\s*[^|]+/gi, '')
      .replace(/\|\s*ఇమెయిల్\s*:\s*[^|]+/gi, '')
      .replace(/\|\s*Phone\s*:\s*[^|]+/gi, '')
      .replace(/\|\s*Email\s*:\s*[^|]+/gi, '')
      .trim();

    const normalizePhoneHref = rawPhone => {
      const compact = rawPhone.replace(/[^0-9+]/g, '');
      const normalized = compact.startsWith('+') ? compact : compact.replace(/\+/g, '');
      return `tel:${normalized || rawPhone}`;
    };

    const appendContactLink = (container, href, iconType, text, label) => {
      const link = document.createElement('a');
      link.className = 'footer-contact-link';
      link.href = href;
      link.setAttribute('aria-label', label);

      const iconSpan = document.createElement('span');
      iconSpan.className = `footer-contact-icon footer-contact-icon--${iconType}`;
      iconSpan.setAttribute('aria-hidden', 'true');

      const textSpan = document.createElement('span');
      textSpan.textContent = text;

      link.append(iconSpan, textSpan);
      container.appendChild(link);
    };

    footerEl.dataset.telugu = footerTelugu;
    footerEl.dataset.english = footerEnglish;
    const footerText = currentLang === 'telugu' ? footerTelugu : footerEnglish;
    footerEl.textContent = stripContactPart(footerText) || footerText;

    if (!footerContactsEl) {
      return;
    }

    const phone = typeof footer.phone === 'string' ? footer.phone.trim() : '';
    const email = typeof footer.email === 'string' ? footer.email.trim() : '';

    footerContactsEl.replaceChildren();

    if (!phone && !email) {
      footerContactsEl.setAttribute('hidden', '');
      return;
    }

    footerContactsEl.removeAttribute('hidden');

    if (phone) {
      appendContactLink(
        footerContactsEl,
        normalizePhoneHref(phone),
        'phone',
        phone,
        currentLang === 'telugu' ? `ఫోన్ ${phone}` : `Phone ${phone}`
      );
    }

    if (email) {
      appendContactLink(
        footerContactsEl,
        `mailto:${email}`,
        'email',
        email,
        currentLang === 'telugu' ? `ఇమెయిల్ ${email}` : `Email ${email}`
      );
    }
  }

  function getStoredMusicMutedPreference() {
    try {
      return localStorage.getItem(musicPreferenceKey) === 'true';
    } catch (error) {
      return false;
    }
  }

  function setStoredMusicMutedPreference(isMuted) {
    try {
      localStorage.setItem(musicPreferenceKey, String(Boolean(isMuted)));
    } catch (error) {
      // Ignore localStorage restrictions.
    }
  }

  function updateMusicToggleButtonLabel() {
    if (!musicToggleBtn || !backgroundMusic) {
      return;
    }

    const isTelugu = currentLang === 'telugu';
    const hasSource = Boolean(backgroundMusic.getAttribute('src'));

    if (!hasSource) {
      musicToggleBtn.disabled = true;
      musicToggleBtn.setAttribute('aria-pressed', 'false');
      const unavailableLabel = isTelugu
        ? (musicToggleBtn.dataset.teluguUnavailable || 'సంగీతం లేదు')
        : (musicToggleBtn.dataset.englishUnavailable || 'Music unavailable');
      musicToggleBtn.setAttribute('aria-label', unavailableLabel);
      musicToggleBtn.title = unavailableLabel;
      return;
    }

    musicToggleBtn.disabled = false;
    const isMuted = backgroundMusic.muted;
    musicToggleBtn.setAttribute('aria-pressed', String(isMuted));
    const actionLabel = isMuted
      ? (isTelugu ? (musicToggleBtn.dataset.teluguMuted || 'సంగీతం ఆన్') : (musicToggleBtn.dataset.englishMuted || 'Unmute Music'))
      : (isTelugu ? (musicToggleBtn.dataset.teluguUnmuted || 'సంగీతం ఆఫ్') : (musicToggleBtn.dataset.englishUnmuted || 'Mute Music'));
    musicToggleBtn.setAttribute('aria-label', actionLabel);
    musicToggleBtn.title = actionLabel;
  }

  function registerMusicResumeHandlers() {
    if (musicResumeHandlersBound) {
      return;
    }

    musicResumeHandlersBound = true;

    const resumeMusic = () => {
      musicResumeHandlersBound = false;
      document.removeEventListener('click', resumeMusic);
      document.removeEventListener('keydown', resumeMusic);
      document.removeEventListener('touchstart', resumeMusic);
      // If the gesture that triggered this was the mute button itself, audio is
      // already muted by the time this document-level handler fires. Don't waste
      // the interaction — re-arm for the next user gesture instead.
      if (backgroundMusic && backgroundMusic.muted) {
        registerMusicResumeHandlers();
        return;
      }
      void tryPlayBackgroundMusic();
    };

    document.addEventListener('click', resumeMusic);
    document.addEventListener('keydown', resumeMusic);
    document.addEventListener('touchstart', resumeMusic);
  }

  async function tryPlayBackgroundMusic() {
    if (!backgroundMusic || backgroundMusic.muted || !backgroundMusic.getAttribute('src')) {
      return;
    }

    try {
      await backgroundMusic.play();
    } catch (error) {
      // Most browsers require a user gesture before unmuted autoplay.
      registerMusicResumeHandlers();
    }
  }

  function applyBackgroundMusicConfig() {
    if (!backgroundMusic || !musicToggleBtn) {
      return;
    }

    const audioConfig = isPlainObject(siteContent.audio) ? siteContent.audio : {};
    const musicSrc = typeof audioConfig.musicSrc === 'string' ? audioConfig.musicSrc.trim() : '';
    const autoplayEnabled = audioConfig.autoplay !== false;
    const shouldLoop = audioConfig.loop !== false;
    const rawVolume = Number(audioConfig.volume);
    const volume = Number.isFinite(rawVolume) ? Math.min(Math.max(rawVolume, 0), 1) : 0.2;

    if (musicSrc) {
      if (backgroundMusic.getAttribute('src') !== musicSrc) {
        backgroundMusic.setAttribute('src', musicSrc);
        backgroundMusic.load();
      }
    } else {
      backgroundMusic.removeAttribute('src');
      backgroundMusic.load();
    }

    backgroundMusic.loop = shouldLoop;
    backgroundMusic.volume = volume;
    backgroundMusic.muted = getStoredMusicMutedPreference();

    if (backgroundMusic.muted || !musicSrc) {
      backgroundMusic.pause();
    }

    updateMusicToggleButtonLabel();

    if (autoplayEnabled && !backgroundMusic.muted) {
      void tryPlayBackgroundMusic();
    }
  }

  async function loadContent() {
    let loaded = JSON.parse(JSON.stringify(defaultContent));

    try {
      const response = await fetch(contentUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Unable to load content: ${response.status}`);
      }

      const payload = await response.json();
      const normalized = normalizeContentPayload(payload);
      if (normalized) {
        loaded = normalized;
      }
    } catch (error) {
      logJsonLoadFallback(contentUrl, error);
    }

    siteContent = loaded;
    pageTitles.telugu = siteContent.page.titleTelugu;
    pageTitles.english = siteContent.page.titleEnglish;
    navLabels.telugu = siteContent.nav.telugu;
    navLabels.english = siteContent.nav.english;
    applyBackgroundMusicConfig();

    renderHero();
    renderBanner();
    renderAboutSection();
    renderTimingsSection();
    renderPoojaList();
    renderFestivalsList();
    renderLocationSection();
    renderFooter();

    document.querySelectorAll('[data-telugu]').forEach(el => {
      el.textContent = currentLang === 'telugu' ? el.dataset.telugu : el.dataset.english;
    });
    document.title = pageTitles[currentLang];
    navLinks.forEach(link => {
      const section = link.dataset.section;
      if (section && navLabels[currentLang] && navLabels[currentLang][section]) {
        link.textContent = navLabels[currentLang][section];
      }
    });
  }

  function normalizeGalleryPayload(payload) {
    const list = Array.isArray(payload)
      ? payload
      : (payload && Array.isArray(payload.images) ? payload.images : []);

    return list.filter(item =>
      item && typeof item.src === 'string' && item.src.trim() &&
      typeof item.teluguAlt === 'string' && typeof item.englishAlt === 'string'
    ).map(item => ({
      src: item.src.trim(),
      teluguAlt: item.teluguAlt.trim(),
      englishAlt: item.englishAlt.trim()
    }));
  }

  function renderGallery() {
    const container = document.getElementById('galleryContainer');
    if (!container) {
      return;
    }

    const frag = document.createDocumentFragment();
    galleryCatalog.forEach(image => {
      const button = document.createElement('button');
      button.className = 'gallery-item';
      button.type = 'button';
      button.setAttribute('role', 'listitem');

      const img = document.createElement('img');
      img.src = image.src;
      img.alt = currentLang === 'telugu' ? image.teluguAlt : image.englishAlt;
      img.dataset.teluguAlt = image.teluguAlt;
      img.dataset.englishAlt = image.englishAlt;
      img.loading = 'lazy';
      img.decoding = 'async';

      button.appendChild(img);
      frag.appendChild(button);
    });
    container.replaceChildren(frag);
  }

  async function loadGallery() {
    let loaded = [...defaultGalleryCatalog];

    try {
      const response = await fetch(galleryUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Unable to load gallery: ${response.status}`);
      }

      const payload = await response.json();
      const normalized = normalizeGalleryPayload(payload);
      if (normalized.length > 0) {
        loaded = normalized;
      }
    } catch (error) {
      logJsonLoadFallback(galleryUrl, error);
    }

    galleryCatalog = loaded;
    renderGallery();
  }

  function showBlockedDateHint() {
    if (!sevaDateBlockedHint) {
      return;
    }

    sevaDateBlockedHint.textContent = currentLang === 'telugu'
      ? (sevaDateBlockedHint.dataset.telugu || 'సేవ నిర్వహించబడదు')
      : (sevaDateBlockedHint.dataset.english || 'Seva not performed');
    sevaDateBlockedHint.removeAttribute('hidden');
  }

  function hideBlockedDateHint() {
    if (sevaDateBlockedHint) {
      sevaDateBlockedHint.setAttribute('hidden', '');
    }
  }

function mergeMessageTree(baseNode, overrideNode) {
  if (typeof baseNode === 'string') {
    return typeof overrideNode === 'string' ? overrideNode : baseNode;
  }

  const merged = {};
  Object.keys(baseNode).forEach(key => {
    const baseValue = baseNode[key];
    const overrideValue = isPlainObject(overrideNode) ? overrideNode[key] : undefined;
    merged[key] = mergeMessageTree(baseValue, overrideValue);
  });
  return merged;
}

function normalizeBookingMessagesPayload(payload) {
  const source = payload && typeof payload === 'object' && isPlainObject(payload.bookingMessages)
    ? payload.bookingMessages
    : payload;

  if (!isPlainObject(source)) {
    return null;
  }

  return {
    telugu: mergeMessageTree(defaultBookingMessages.telugu, source.telugu),
    english: mergeMessageTree(defaultBookingMessages.english, source.english)
  };
}

function getMessageByPath(tree, messageKey) {
  return messageKey.split('.').reduce((current, keyPart) => {
    if (!current || typeof current !== 'object' || !(keyPart in current)) {
      return undefined;
    }

    return current[keyPart];
  }, tree);
}

function formatMessageTemplate(template, replacements) {
  if (typeof template !== 'string') {
    return '';
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, token) => {
    if (Object.prototype.hasOwnProperty.call(replacements, token)) {
      return String(replacements[token]);
    }

    return match;
  });
}

function getBookingMessage(messageKey, replacements = {}) {
  const languageKey = currentLang === 'telugu' ? 'telugu' : 'english';
  const template = getMessageByPath(bookingMessages[languageKey], messageKey);
  return formatMessageTemplate(template, replacements);
}

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
  return `₹ ${value}/-`;
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

function setBookedSlots(sevaId, dateValue, bookedSlots) {
  if (!sevaId || !dateValue) {
    return;
  }

  const bookings = getStoredBookings();
  const safeBookedSlots = Math.max(0, Math.trunc(Number(bookedSlots) || 0));
  const bookingKey = getBookingKey(sevaId, dateValue);

  if (safeBookedSlots > 0) {
    bookings[bookingKey] = safeBookedSlots;
  } else {
    delete bookings[bookingKey];
  }

  setStoredBookings(bookings);
}

function getSelectedSeva() {
  if (!sevaTypeInput || !sevaTypeInput.value) {
    return null;
  }

  return sevaCatalog.find(seva => seva.id === sevaTypeInput.value) || null;
}

function shouldAutoScrollToSevaForm() {
  return window.matchMedia('(max-width: 600px)').matches;
}

function scrollToSevaForm() {
  if (!sevaBookingForm || !shouldAutoScrollToSevaForm()) {
    return;
  }

  const top = window.scrollY + sevaBookingForm.getBoundingClientRect().top - getHeaderOffset() - 12;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: shouldReduceMotion() ? 'auto' : 'smooth'
  });
}

function updateSevaSelectionHint() {
  if (!sevaSelectionHint) {
    return;
  }

  const selectedSeva = getSelectedSeva();
  if (!selectedSeva) {
    sevaSelectionHint.textContent = getBookingMessage('selectionHint.default');
    return;
  }

  const sevaName = currentLang === 'telugu' ? selectedSeva.telugu : selectedSeva.english;
  sevaSelectionHint.textContent = getBookingMessage('selectionHint.selected', { sevaName });
}

function sanitizePhoneNumberInput() {
  if (!devoteePhoneInput) {
    return;
  }

  const digitsOnlyValue = devoteePhoneInput.value.replace(/\D/g, '').slice(0, 10);
  if (devoteePhoneInput.value !== digitsOnlyValue) {
    devoteePhoneInput.value = digitsOnlyValue;
  }
}

function updateFormLockState() {
  const selectedSeva = getSelectedSeva();
  const selectedDate = sevaDateInput ? sevaDateInput.value : '';
  const hasSelectedSeva = Boolean(selectedSeva);
  const hasSelectedDate = Boolean(selectedDate);
  const hasBlockedDateSelection = Boolean(selectedSeva && selectedDate && isDateBlockedForSeva(selectedSeva, selectedDate));
  const canUnlockDevoteeFields = hasSelectedSeva && hasSelectedDate && !hasBlockedDateSelection;

  if (devoteeNameInput) {
    devoteeNameInput.disabled = !canUnlockDevoteeFields;
  }

  if (devoteeGotramInput) {
    devoteeGotramInput.disabled = !canUnlockDevoteeFields;
  }

  if (devoteePhoneInput) {
    devoteePhoneInput.disabled = !canUnlockDevoteeFields;
  }

  if (sevaDateInput) {
    sevaDateInput.disabled = false;
  }

  if (sevaSlotsInput) {
    sevaSlotsInput.disabled = !canUnlockDevoteeFields;
  }

  if (bookSevaBtn) {
    bookSevaBtn.disabled = !canUnlockDevoteeFields;
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
  const minLeadDays = bookingRules.regularAdvanceDays;
  const minDate = addDays(today, minLeadDays);
  const maxDate = addDays(today, bookingRules.regularWindowDays);

  return {
    minValue: formatDateInputValue(minDate),
    maxValue: formatDateInputValue(maxDate)
  };
}

function getTuesdayBookingWindow() {
  const today = new Date();
  const maxDate = addDays(today, bookingRules.tuesdayWindowDays);
  const minLeadDate = addDays(today, bookingRules.regularAdvanceDays);
  const daysUntilTuesday = (2 - minLeadDate.getDay() + 7) % 7;
  const minDate = addDays(minLeadDate, daysUntilTuesday);

  return {
    minValue: formatDateInputValue(minDate),
    maxValue: formatDateInputValue(maxDate)
  };
}

function isTuesdayRuleSeva(selectedSeva) {
  return Boolean(selectedSeva && selectedSeva.id === bookingRules.tuesdaySevaId);
}

function getBookingWindowForSeva(selectedSeva) {
  if (isTuesdayRuleSeva(selectedSeva)) {
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

function isDateBlockedForSeva(seva, dateValue) {
  if (!seva || !Array.isArray(seva.blockedDates) || !dateValue) {
    return false;
  }

  return seva.blockedDates.includes(dateValue);
}

function findNextValidDateForSeva(seva, startDateValue, maxDateValue, stepDays) {
  let candidate = new Date(`${startDateValue}T00:00:00`);
  const limit = new Date(`${maxDateValue}T00:00:00`);

  while (candidate <= limit) {
    const dateValue = formatDateInputValue(candidate);
    if (!isDateBlockedForSeva(seva, dateValue)) {
      return dateValue;
    }
    candidate = addDays(candidate, stepDays);
  }

  return null;
}

function getBookingWindowRestrictionMessage(selectedSeva) {
  if (isTuesdayRuleSeva(selectedSeva)) {
    return getBookingMessage('errors.bookingWindowTuesday', {
      regularAdvanceDays: bookingRules.regularAdvanceDays,
      tuesdayWindowDays: bookingRules.tuesdayWindowDays
    });
  }

  return getBookingMessage('errors.bookingWindowRegular', {
    regularAdvanceDays: bookingRules.regularAdvanceDays,
    regularWindowDays: bookingRules.regularWindowDays
  });
}

function updateDateConstraintsForSelectedSeva() {
  if (!sevaDateInput) {
    return;
  }

  hideBlockedDateHint();

  const selectedSeva = getSelectedSeva();
  const bookingWindow = getBookingWindowForSeva(selectedSeva);

  if (isTuesdayRuleSeva(selectedSeva)) {
    sevaDateInput.min = bookingWindow.minValue;
    sevaDateInput.max = bookingWindow.maxValue;
    sevaDateInput.step = '7';

    if (!sevaDateInput.value || !isTuesdayDate(sevaDateInput.value) || isDateOutsideWindow(sevaDateInput.value, bookingWindow)) {
      sevaDateInput.value = findNextValidDateForSeva(selectedSeva, bookingWindow.minValue, bookingWindow.maxValue, 7) || bookingWindow.minValue;
    }
    return;
  }

  sevaDateInput.min = bookingWindow.minValue;
  sevaDateInput.max = bookingWindow.maxValue;
  sevaDateInput.step = '1';

  if (!sevaDateInput.value || isDateOutsideWindow(sevaDateInput.value, bookingWindow)) {
    sevaDateInput.value = findNextValidDateForSeva(selectedSeva, bookingWindow.minValue, bookingWindow.maxValue, 1) || bookingWindow.minValue;
  }
}

function updateSevaSelectedLabel() {
  if (!sevaSelected) {
    return;
  }

  const selectedSeva = getSelectedSeva();
  if (!selectedSeva) {
    sevaSelected.textContent = getBookingMessage('selectedSeva.none');
    sevaSelected.setAttribute('hidden', '');
    sevaSelected.style.display = 'none';
    return;
  }

  const sevaName = currentLang === 'telugu' ? selectedSeva.telugu : selectedSeva.english;
  const sevaTiming = currentLang === 'telugu' ? selectedSeva.timingTelugu : selectedSeva.timingEnglish;
  sevaSelected.textContent = getBookingMessage('selectedSeva.selected', {
    sevaName,
    sevaTiming
  });
  sevaSelected.removeAttribute('hidden');
  sevaSelected.style.display = 'block';
}

function setSelectedSeva(sevaId) {
  if (!sevaTypeInput) {
    return '';
  }

  const previousSevaId = sevaTypeInput.value;
  const nextSevaId = previousSevaId === sevaId ? '' : (sevaId || '');
  const isSwitchingBetweenSevas = Boolean(previousSevaId) && Boolean(nextSevaId) && previousSevaId !== nextSevaId;

  if (isSwitchingBetweenSevas && sevaDateInput) {
    // Reset date on card-to-card switch so the new seva picks its next valid date.
    sevaDateInput.value = '';
  }

  sevaTypeInput.value = nextSevaId;

  if (sevaDateInput && nextSevaId && sevaDateInput.value) {
    const nextSeva = sevaCatalog.find(seva => seva.id === nextSevaId);

    // On first selection, drop carried date if that date is blocked for this seva.
    if (nextSeva && isDateBlockedForSeva(nextSeva, sevaDateInput.value)) {
      sevaDateInput.value = '';
    }
  }

  getSevaOptionCards().forEach(card => {
    const isSelected = card.dataset.sevaId === nextSevaId;
    card.classList.toggle('is-selected', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));
  });

  updateDateConstraintsForSelectedSeva();
  updateFormLockState();
  updateSevaSelectedLabel();
  updateSevaSelectionHint();
  clearBookingMessage();
  updateSevaBookingSummary();
  return nextSevaId;
}

function resetSevaBookingState() {
  if (sevaBookingForm) {
    sevaBookingForm.reset();
  }

  setSelectedSeva('');
}

function setMinimumSevaDate() {
  if (!sevaDateInput) {
    return;
  }

  const bookingWindow = getRegularBookingWindow();
  sevaDateInput.min = bookingWindow.minValue;
  sevaDateInput.max = bookingWindow.maxValue;
  sevaDateInput.step = '1';
  sevaDateInput.value = bookingWindow.minValue;
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

function setAvailabilityLoadingState(isLoading) {
  if (!sevaAvailability) {
    return;
  }

  const loading = Boolean(isLoading);
  sevaAvailability.classList.toggle('is-loading', loading);
  sevaAvailability.setAttribute('aria-busy', loading ? 'true' : 'false');
}

function setBookingSubmitState(isSubmitting) {
  if (!bookSevaBtn) {
    return;
  }

  const submitting = Boolean(isSubmitting);
  const defaultLabel = currentLang === 'telugu'
    ? (bookSevaBtn.dataset.telugu || 'సేవా బుక్ చేయండి')
    : (bookSevaBtn.dataset.english || 'Book Seva');
  const submittingLabel = currentLang === 'telugu'
    ? (bookSevaBtn.dataset.teluguSubmitting || 'సమర్పిస్తోంది...')
    : (bookSevaBtn.dataset.englishSubmitting || 'Submitting...');

  bookSevaBtn.classList.toggle('is-submitting', submitting);
  bookSevaBtn.setAttribute('aria-busy', submitting ? 'true' : 'false');
  bookSevaBtn.textContent = submitting ? submittingLabel : defaultLabel;
  if (submitting) {
    bookSevaBtn.disabled = true;
  }
}

async function updateSevaBookingSummary() {
  if (!sevaTypeInput || !sevaDateInput || !sevaSlotsInput || !sevaAvailability || !sevaTotal || !bookSevaBtn) {
    return;
  }

  const selectedSeva = getSelectedSeva();
  const selectedDate = sevaDateInput.value;
  setAvailabilityLoadingState(false);

  if (!selectedSeva || !selectedDate) {
    sevaAvailability.textContent = '';
    sevaTotal.textContent = getBookingMessage('total.zero');
    sevaSlotsInput.value = '1';
    sevaSlotsInput.disabled = true;
    bookSevaBtn.disabled = true;
    return;
  }

  const bookingWindow = getBookingWindowForSeva(selectedSeva);

  if (isTuesdayRuleSeva(selectedSeva) && !isTuesdayDate(selectedDate)) {
    sevaAvailability.textContent = getBookingMessage('availability.tuesdayOnly');
    sevaTotal.textContent = getBookingMessage('total.zero');
    sevaSlotsInput.value = '1';
    sevaSlotsInput.disabled = true;
    bookSevaBtn.disabled = true;
    return;
  }

  if (isDateOutsideWindow(selectedDate, bookingWindow)) {
    sevaAvailability.textContent = getBookingWindowRestrictionMessage(selectedSeva);
    sevaTotal.textContent = getBookingMessage('total.zero');
    sevaSlotsInput.value = '1';
    sevaSlotsInput.disabled = true;
    bookSevaBtn.disabled = true;
    return;
  }

  if (isDateBlockedForSeva(selectedSeva, selectedDate)) {
    showBlockedDateHint();
    sevaAvailability.textContent = currentLang === 'telugu' ? 'సేవ నిర్వహించబడదు' : 'Seva not performed';
    sevaTotal.textContent = getBookingMessage('total.zero');
    sevaSlotsInput.value = '1';
    sevaSlotsInput.disabled = true;
    bookSevaBtn.disabled = true;
    return;
  }

  hideBlockedDateHint();

  const requestId = ++bookingAvailabilityRequestId;
  sevaAvailability.textContent = getBookingMessage('availability.loading');
  setAvailabilityLoadingState(true);
  sevaTotal.textContent = getBookingMessage('total.zero');
  sevaSlotsInput.value = '1';
  sevaSlotsInput.disabled = true;
  bookSevaBtn.disabled = true;
  if (devoteeNameInput) devoteeNameInput.disabled = true;
  if (devoteeGotramInput) devoteeGotramInput.disabled = true;
  if (devoteePhoneInput) devoteePhoneInput.disabled = true;

  const availability = await getBookingAvailability(selectedSeva, selectedDate);
  if (requestId !== bookingAvailabilityRequestId) {
    return;
  }

  if (!sevaTypeInput || sevaTypeInput.value !== selectedSeva.id || !sevaDateInput || sevaDateInput.value !== selectedDate) {
    return;
  }

  setAvailabilityLoadingState(false);
  updateFormLockState();

  const availableSlots = availability.availableSlots;
  sevaSlotsInput.max = String(Math.max(availableSlots, 1));

  if (availableSlots <= 0) {
    sevaAvailability.textContent = getBookingMessage('availability.zeroSlots', {
      dailySlots: availability.dailySlots
    });
    sevaTotal.textContent = getBookingMessage('total.zero');
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

  sevaAvailability.textContent = getBookingMessage('availability.availableSlots', {
    availableSlots,
    dailySlots: availability.dailySlots
  });
  sevaTotal.textContent = getBookingMessage('total.amount', {
    totalAmount
  });
}

function formatSevaDate(dateValue) {
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
    `Seva Date: ${details.selectedDate}`,
    `Slot: ${details.slotNumber}`,
    `Total: ₹ ${details.totalAmount}/-`
  ];
}

function getBookingSuccessMessage(selectedSeva, bookingRef) {
  const sevaName = currentLang === 'telugu' ? selectedSeva.telugu : selectedSeva.english;
  const nextRequestDate = formatSevaDate(formatDateInputValue(addDays(new Date(), 1)));

  if (bookingRef) {
    return getBookingMessage('success.bookingReceivedWithRef', {
      sevaName,
      nextRequestDate,
      bookingRef
    });
  }

  return getBookingMessage('success.bookingReceived', {
    sevaName,
    nextRequestDate
  });
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

function getBookingWebhookConfig() {
  const integrations = isPlainObject(siteContent.integrations) ? siteContent.integrations : {};
  const bookingWebhookUrl = typeof integrations.bookingWebhookUrl === 'string' ? integrations.bookingWebhookUrl.trim() : '';
  const rawTimeout = Number(integrations.bookingWebhookTimeoutMs);
  const bookingWebhookTimeoutMs = Number.isFinite(rawTimeout)
    ? Math.min(Math.max(Math.trunc(rawTimeout), 2000), 60000)
    : 12000;

  const parseBooleanSetting = (value, defaultValue) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }

      if (normalized === 'false') {
        return false;
      }
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    return defaultValue;
  };

  const enableSheetUpdate = parseBooleanSetting(integrations.enableSheetUpdate, true);
  const enableWhatsappMessage = parseBooleanSetting(integrations.enableWhatsappMessage, true);

  return {
    bookingWebhookUrl,
    bookingWebhookTimeoutMs,
    enableSheetUpdate,
    enableWhatsappMessage
  };
}

function isSharedAvailabilityEnabled() {
  const { bookingWebhookUrl, enableSheetUpdate } = getBookingWebhookConfig();
  return Boolean(bookingWebhookUrl && enableSheetUpdate);
}

function getBookingAvailabilityCacheKey(sevaId, dateValue) {
  return `${dateValue}:${sevaId}`;
}

function getCachedBookingAvailability(sevaId, dateValue) {
  const entry = bookingAvailabilityCache.get(getBookingAvailabilityCacheKey(sevaId, dateValue));
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  if (Date.now() - entry.fetchedAt > BOOKING_AVAILABILITY_CACHE_TTL_MS) {
    bookingAvailabilityCache.delete(getBookingAvailabilityCacheKey(sevaId, dateValue));
    return null;
  }

  return entry.availability;
}

function syncBookingAvailability(availability) {
  if (!availability) {
    return;
  }

  bookingAvailabilityCache.set(getBookingAvailabilityCacheKey(availability.sevaId, availability.selectedDate), {
    availability,
    fetchedAt: Date.now()
  });
  setBookedSlots(availability.sevaId, availability.selectedDate, availability.bookedSlots);
}

function clearBookingAvailabilityCache(sevaId, dateValue) {
  bookingAvailabilityCache.delete(getBookingAvailabilityCacheKey(sevaId, dateValue));
}

function buildBookingWebhookPayload(details, controls) {
  return {
    source: 'svs-temple-seva-booking',
    bookingTimestamp: new Date().toISOString(),
    language: currentLang,
    controls: {
      enableSheetUpdate: controls.enableSheetUpdate,
      enableWhatsappMessage: controls.enableWhatsappMessage
    },
    booking: {
      devoteeName: details.devoteeName,
      devoteeGotram: details.devoteeGotram,
      devoteePhone: details.devoteePhone,
      sevaId: details.sevaId,
      sevaNameEnglish: details.sevaNameEnglish,
      sevaNameTelugu: details.sevaNameTelugu,
      sevaTimingEnglish: details.sevaTimingEnglish,
      sevaTimingTelugu: details.sevaTimingTelugu,
      selectedDate: details.selectedDate,
      dailySlots: details.dailySlots,
      slotNumber: details.slotNumber,
      requestedSlots: details.requestedSlots,
      totalAmount: details.totalAmount
    }
  };
}

async function postBookingWebhook(url, requestInit, timeoutMs) {
  const abortController = typeof AbortController === 'function' ? new AbortController() : null;
  let timeoutId = 0;

  try {
    if (abortController) {
      timeoutId = window.setTimeout(() => abortController.abort(), timeoutMs);
    }

    const response = await fetch(url, {
      ...requestInit,
      signal: abortController ? abortController.signal : undefined
    });

    return { ok: true, response };
  } catch (error) {
    return { ok: false, error };
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function requestBookingWebhookJson(url, requestInit, timeoutMs) {
  const request = await postBookingWebhook(url, requestInit, timeoutMs);
  if (!request.ok) {
    return { ok: false, error: request.error };
  }

  let data = null;
  try {
    data = await request.response.json();
  } catch {
    data = null;
  }

  if (!request.response.ok) {
    return {
      ok: false,
      status: request.response.status,
      data
    };
  }

  return {
    ok: true,
    status: request.response.status,
    data
  };
}

function normalizeBookingAvailabilityPayload(payload, selectedSeva, selectedDate) {
  if (!payload || typeof payload !== 'object' || !selectedSeva || !selectedDate) {
    return null;
  }

  const sevaId = typeof payload.sevaId === 'string' && payload.sevaId.trim()
    ? payload.sevaId.trim()
    : selectedSeva.id;
  const dateValue = typeof payload.selectedDate === 'string' && payload.selectedDate.trim()
    ? payload.selectedDate.trim()
    : selectedDate;
  const bookedSlots = Number(payload.bookedSlots);
  const dailySlots = Number(payload.dailySlots);
  const availableSlots = Number(payload.availableSlots);

  if (sevaId !== selectedSeva.id || dateValue !== selectedDate) {
    return null;
  }

  if (!Number.isFinite(bookedSlots) || bookedSlots < 0) {
    return null;
  }

  if (!Number.isFinite(dailySlots) || dailySlots < 1) {
    return null;
  }

  if (!Number.isFinite(availableSlots) || availableSlots < 0) {
    return null;
  }

  return {
    sevaId,
    selectedDate: dateValue,
    bookedSlots: Math.trunc(bookedSlots),
    dailySlots: Math.trunc(dailySlots),
    availableSlots: Math.max(0, Math.trunc(availableSlots))
  };
}

function buildBookingAvailabilityUrl(bookingWebhookUrl, selectedSeva, selectedDate) {
  const availabilityUrl = new URL(bookingWebhookUrl);
  availabilityUrl.searchParams.set('action', 'availability');
  availabilityUrl.searchParams.set('sevaId', selectedSeva.id);
  availabilityUrl.searchParams.set('selectedDate', selectedDate);
  availabilityUrl.searchParams.set('dailySlots', String(selectedSeva.dailySlots));
  return availabilityUrl.toString();
}

async function fetchSharedBookingAvailability(selectedSeva, selectedDate, options = {}) {
  const {
    bookingWebhookUrl,
    bookingWebhookTimeoutMs,
    enableSheetUpdate
  } = getBookingWebhookConfig();

  if (!bookingWebhookUrl || !enableSheetUpdate || !selectedSeva || !selectedDate) {
    return null;
  }

  const forceRefresh = Boolean(options.forceRefresh);
  const cachedAvailability = forceRefresh ? null : getCachedBookingAvailability(selectedSeva.id, selectedDate);
  if (cachedAvailability) {
    return {
      ...cachedAvailability,
      source: 'server'
    };
  }

  let availabilityUrl = '';
  try {
    availabilityUrl = buildBookingAvailabilityUrl(bookingWebhookUrl, selectedSeva, selectedDate);
  } catch {
    return null;
  }

  const response = await requestBookingWebhookJson(availabilityUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    cache: 'no-store'
  }, bookingWebhookTimeoutMs);

  if (!response.ok || !response.data || response.data.ok !== true) {
    console.warn('[Temple] Live booking availability fetch failed.', response);
    return null;
  }

  const availability = normalizeBookingAvailabilityPayload(response.data.availability, selectedSeva, selectedDate);
  if (!availability) {
    console.warn('[Temple] Live booking availability response was invalid.', response.data);
    return null;
  }

  syncBookingAvailability(availability);
  return {
    ...availability,
    source: 'server'
  };
}

function getLocalBookingAvailability(selectedSeva, selectedDate) {
  const bookedSlots = getBookedSlots(selectedSeva.id, selectedDate);

  return {
    sevaId: selectedSeva.id,
    selectedDate,
    bookedSlots,
    dailySlots: selectedSeva.dailySlots,
    availableSlots: Math.max(selectedSeva.dailySlots - bookedSlots, 0),
    source: 'local'
  };
}

async function getBookingAvailability(selectedSeva, selectedDate, options = {}) {
  const sharedAvailability = await fetchSharedBookingAvailability(selectedSeva, selectedDate, options);
  if (sharedAvailability) {
    return sharedAvailability;
  }

  return getLocalBookingAvailability(selectedSeva, selectedDate);
}

function getBookingSubmissionErrorMessage(webhookResult) {
  const payload = webhookResult && webhookResult.data && typeof webhookResult.data === 'object'
    ? webhookResult.data
    : null;

  if (payload && payload.errorCode === 'INSUFFICIENT_SLOTS') {
    const availableSlots = Number(payload.availableSlots);
    if (Number.isFinite(availableSlots)) {
      return getBookingMessage('errors.onlySlotsLeft', {
        availableSlots: Math.max(0, Math.trunc(availableSlots))
      });
    }
  }

  if (payload && payload.errorCode === 'PHONE_RATE_LIMIT') {
    return getBookingMessage('errors.rateLimited');
  }

  if (currentLang === 'english' && payload && typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }

  return getBookingMessage('errors.bookingUnavailable');
}

async function sendBookingWebhook(details) {
  const {
    bookingWebhookUrl,
    bookingWebhookTimeoutMs,
    enableSheetUpdate,
    enableWhatsappMessage
  } = getBookingWebhookConfig();

  if (!bookingWebhookUrl) {
    return { sent: false, reason: 'booking-webhook-not-configured' };
  }

  if (!enableSheetUpdate && !enableWhatsappMessage) {
    return { sent: false, reason: 'booking-webhook-actions-disabled' };
  }

  const payload = JSON.stringify(buildBookingWebhookPayload(details, {
    enableSheetUpdate,
    enableWhatsappMessage
  }));

  const directRequest = await requestBookingWebhookJson(bookingWebhookUrl, {
    method: 'POST',
    headers: {
      // Apps Script web apps do not answer CORS preflight OPTIONS for application/json.
      // Send JSON as text/plain so this remains a simple request and the response stays readable.
      'Content-Type': 'text/plain;charset=UTF-8'
    },
    body: payload,
    keepalive: true
  }, bookingWebhookTimeoutMs);

  if (directRequest.ok && directRequest.data && directRequest.data.ok === true) {
    return {
      sent: true,
      data: directRequest.data
    };
  }

  if (directRequest.ok && directRequest.data && directRequest.data.ok === false) {
    return {
      sent: false,
      reason: 'booking-webhook-rejected',
      data: directRequest.data
    };
  }

  if (enableSheetUpdate) {
    return {
      sent: false,
      reason: 'booking-webhook-send-failed',
      data: directRequest.data || null
    };
  }

  const fallbackRequest = await postBookingWebhook(bookingWebhookUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8'
    },
    body: payload,
    keepalive: true
  }, bookingWebhookTimeoutMs);

  if (fallbackRequest.ok) {
    return { sent: true, reason: 'booking-webhook-no-cors-fallback' };
  }

  return {
    sent: false,
    reason: 'booking-webhook-send-failed',
    data: directRequest.data || null
  };
}

function normalizeBookingRateLimitPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function isBookingRateLimited(phone) {
  try {
    const normalizedPhone = normalizeBookingRateLimitPhone(phone);
    if (!normalizedPhone) {
      return false;
    }

    const now = Date.now();
    const raw = localStorage.getItem(bookingRateLimitKey);
    const attemptsByPhone = raw ? JSON.parse(raw) : {};
    if (!attemptsByPhone || typeof attemptsByPhone !== 'object' || Array.isArray(attemptsByPhone)) {
      return false;
    }

    const timestamps = Array.isArray(attemptsByPhone[normalizedPhone]) ? attemptsByPhone[normalizedPhone] : [];
    const recent = timestamps.filter(t => typeof t === 'number' && now - t < BOOKING_RATE_WINDOW_MS);
    return recent.length >= BOOKING_RATE_LIMIT_MAX;
  } catch {
    return false;
  }
}

function recordBookingAttempt(phone) {
  try {
    const normalizedPhone = normalizeBookingRateLimitPhone(phone);
    if (!normalizedPhone) {
      return;
    }

    const now = Date.now();
    const raw = localStorage.getItem(bookingRateLimitKey);
    const attemptsByPhone = raw ? JSON.parse(raw) : {};
    const safeAttempts = attemptsByPhone && typeof attemptsByPhone === 'object' && !Array.isArray(attemptsByPhone)
      ? attemptsByPhone
      : {};

    Object.keys(safeAttempts).forEach(key => {
      if (!Array.isArray(safeAttempts[key])) {
        delete safeAttempts[key];
        return;
      }

      const recentForKey = safeAttempts[key].filter(t => typeof t === 'number' && now - t < BOOKING_RATE_WINDOW_MS);
      if (recentForKey.length > 0) {
        safeAttempts[key] = recentForKey;
      } else {
        delete safeAttempts[key];
      }
    });

    const recent = Array.isArray(safeAttempts[normalizedPhone]) ? safeAttempts[normalizedPhone] : [];
    recent.push(now);
    safeAttempts[normalizedPhone] = recent;
    localStorage.setItem(bookingRateLimitKey, JSON.stringify(safeAttempts));
  } catch {
    // Ignore localStorage errors.
  }
}

async function handleSevaBookingSubmit(event) {
  event.preventDefault();

  if (!devoteeNameInput || !devoteeGotramInput || !devoteePhoneInput || !sevaTypeInput || !sevaDateInput || !sevaSlotsInput) {
    return;
  }

  clearBookingMessage();

  // Honeypot: silently discard automated submissions without revealing detection.
  if (honeypotInput && honeypotInput.value) {
    devoteeNameInput.value = '';
    devoteeGotramInput.value = '';
    devoteePhoneInput.value = '';
    sevaSlotsInput.value = '1';
    honeypotInput.value = '';
    return;
  }

  // Timing guard: legitimate users take more than a few seconds to fill the form.
  if (Date.now() - pageLoadTime < BOOKING_MIN_TIME_MS) {
    showBookingMessage('error', getBookingMessage('errors.tooFast'));
    return;
  }

  sanitizePhoneNumberInput();

  const devoteeName = devoteeNameInput.value.trim();
  const devoteeGotram = devoteeGotramInput.value.trim();
  const devoteePhone = devoteePhoneInput.value.trim();

  // Client-side rate limit: prevent burst submissions per WhatsApp number in the same browser.
  if (isBookingRateLimited(devoteePhone)) {
    showBookingMessage('error', getBookingMessage('errors.rateLimited'));
    return;
  }

  const selectedSeva = getSelectedSeva();
  const selectedDate = sevaDateInput.value;
  const requestedSlots = Number.parseInt(sevaSlotsInput.value, 10);
  const slotNumber = requestedSlots;
  const phonePattern = /^[0-9]{10}$/;
  const bookingWindow = getBookingWindowForSeva(selectedSeva);

  if (!devoteeName || !devoteeGotram || !phonePattern.test(devoteePhone) || !selectedSeva || !selectedDate || !Number.isInteger(requestedSlots) || requestedSlots < 1) {
    showBookingMessage('error', getBookingMessage('errors.invalidDetails'));
    return;
  }

  if (isTuesdayRuleSeva(selectedSeva) && !isTuesdayDate(selectedDate)) {
    showBookingMessage('error', getBookingMessage('errors.tuesdayOnly'));
    return;
  }

  if (isDateOutsideWindow(selectedDate, bookingWindow)) {
    showBookingMessage('error', getBookingWindowRestrictionMessage(selectedSeva));
    return;
  }

  if (isDateBlockedForSeva(selectedSeva, selectedDate)) {
    showBlockedDateHint();
    return;
  }

  const usesSharedAvailability = isSharedAvailabilityEnabled();
  if (!usesSharedAvailability) {
    const bookedSlots = getBookedSlots(selectedSeva.id, selectedDate);
    const availableSlots = Math.max(selectedSeva.dailySlots - bookedSlots, 0);

    if (requestedSlots > availableSlots) {
      showBookingMessage('error', getBookingMessage('errors.onlySlotsLeft', {
        availableSlots
      }));
      await updateSevaBookingSummary();
      return;
    }
  }

  const totalAmount = requestedSlots * selectedSeva.price;
  const bookingDetails = {
    devoteeName,
    devoteeGotram,
    devoteePhone,
    sevaId: selectedSeva.id,
    sevaNameEnglish: selectedSeva.english,
    sevaNameTelugu: selectedSeva.telugu,
    sevaTimingEnglish: selectedSeva.timingEnglish,
    sevaTimingTelugu: selectedSeva.timingTelugu,
    selectedDate,
    dailySlots: selectedSeva.dailySlots,
    slotNumber,
    requestedSlots,
    totalAmount
  };

  setBookingSubmitState(true);

  let emailResult = { sent: false, reason: 'not-attempted' };
  let webhookResult = { sent: false, reason: 'not-attempted' };

  try {
    if (usesSharedAvailability) {
      webhookResult = await sendBookingWebhook(bookingDetails);

      if (!webhookResult.sent) {
        showBookingMessage('error', getBookingSubmissionErrorMessage(webhookResult));
        clearBookingAvailabilityCache(selectedSeva.id, selectedDate);
        await updateSevaBookingSummary();
        if (honeypotInput) {
          honeypotInput.value = '';
        }
        if (bookSevaBtn) {
          bookSevaBtn.disabled = false;
        }
        return;
      }

      const confirmedAvailability = normalizeBookingAvailabilityPayload(
        webhookResult.data && webhookResult.data.availabilityAfter,
        selectedSeva,
        selectedDate
      );

      if (confirmedAvailability) {
        syncBookingAvailability(confirmedAvailability);
      } else {
        const bookedSlots = getBookedSlots(selectedSeva.id, selectedDate);
        setBookedSlots(selectedSeva.id, selectedDate, bookedSlots + requestedSlots);
        clearBookingAvailabilityCache(selectedSeva.id, selectedDate);
      }

      const bookingRef = webhookResult.data && webhookResult.data.sheetUpdate && typeof webhookResult.data.sheetUpdate.bookingRef === 'string'
        ? webhookResult.data.sheetUpdate.bookingRef
        : '';
      showBookingMessage('success', getBookingSuccessMessage(selectedSeva, bookingRef));
      recordBookingAttempt(devoteePhone);
      emailResult = await sendBookingEmail(bookingDetails);
    } else {
      const bookedSlots = getBookedSlots(selectedSeva.id, selectedDate);
      setBookedSlots(selectedSeva.id, selectedDate, bookedSlots + requestedSlots);
      clearBookingAvailabilityCache(selectedSeva.id, selectedDate);

      showBookingMessage('success', getBookingSuccessMessage(selectedSeva));
      recordBookingAttempt(devoteePhone);

      [emailResult, webhookResult] = await Promise.all([
        sendBookingEmail(bookingDetails),
        sendBookingWebhook(bookingDetails)
      ]);
    }

    if (!emailResult.sent && emailResult.reason !== 'smtp-not-configured' && emailResult.reason !== 'not-attempted') {
      console.warn('[Temple] Booking email send failed.', emailResult);
    }

    if (!usesSharedAvailability && !webhookResult.sent && webhookResult.reason !== 'booking-webhook-not-configured' && webhookResult.reason !== 'booking-webhook-actions-disabled') {
      console.warn('[Temple] Booking webhook send failed.', webhookResult);
    }

    devoteeNameInput.value = '';
    devoteeGotramInput.value = '';
    devoteePhoneInput.value = '';
    sevaSlotsInput.value = '1';
    if (honeypotInput) {
      honeypotInput.value = '';
    }
    if (bookSevaBtn) {
      bookSevaBtn.disabled = false;
    }
    await updateSevaBookingSummary();
  } catch (error) {
    console.error('[Temple] Booking submission failed unexpectedly.', error);
    showBookingMessage('error', getBookingMessage('errors.bookingUnavailable'));
    if (bookSevaBtn) {
      bookSevaBtn.disabled = false;
    }
  } finally {
    setBookingSubmitState(false);
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
  document.querySelectorAll('[data-telugu]').forEach(el => {
    el.textContent = lang === 'telugu' ? el.dataset.telugu : el.dataset.english;
  });
  document.querySelectorAll('.gallery img').forEach(image => {
    image.alt = lang === 'telugu' ? image.dataset.teluguAlt : image.dataset.englishAlt;
  });
  navLinks.forEach(link => {
    const section = link.dataset.section;
    if (section && navLabels[lang] && navLabels[lang][section]) {
      link.textContent = navLabels[lang][section];
    }
  });

  renderSevaCards();
  updateFormLockState();
  setBookingSubmitState(Boolean(bookSevaBtn && bookSevaBtn.classList.contains('is-submitting')));
  updateSevaSelectedLabel();
  updateSevaSelectionHint();
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

  updateMusicToggleButtonLabel();
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
const galleryContainer = document.getElementById('galleryContainer');
if (galleryContainer) {
  galleryContainer.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest('.gallery-item');
    if (!button) {
      return;
    }
    const image = button.querySelector('img');
    if (image) {
      openLightbox(image, button);
    }
  });
}

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
  const selectedSevaId = setSelectedSeva(sevaId);
  if (selectedSevaId) {
    scrollToSevaForm();
  }
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
    const selectedSevaId = setSelectedSeva(sevaId);
    if (selectedSevaId) {
      scrollToSevaForm();
    }
  }
});

if (sevaDateInput) {
  sevaDateInput.addEventListener('change', () => {
    const selectedSeva = getSelectedSeva();
    if (sevaDateInput.value && selectedSeva) {
      const bookingWindow = getBookingWindowForSeva(selectedSeva);
      const outsideWindow = isDateOutsideWindow(sevaDateInput.value, bookingWindow);
      const notTuesday = isTuesdayRuleSeva(selectedSeva) && !isTuesdayDate(sevaDateInput.value);
      const isBlocked = isDateBlockedForSeva(selectedSeva, sevaDateInput.value);
      if (outsideWindow || notTuesday) {
        const stepDays = isTuesdayRuleSeva(selectedSeva) ? 7 : 1;
        const startFrom = bookingWindow.minValue;
        sevaDateInput.value = findNextValidDateForSeva(selectedSeva, startFrom, bookingWindow.maxValue, stepDays) || bookingWindow.minValue;
        hideBlockedDateHint();
      } else if (isBlocked) {
        showBlockedDateHint();
      } else {
        hideBlockedDateHint();
      }
    } else {
      hideBlockedDateHint();
    }
    updateFormLockState();
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

if (devoteePhoneInput) {
  devoteePhoneInput.addEventListener('input', sanitizePhoneNumberInput);
}

if (sevaBookingForm) {
  sevaBookingForm.addEventListener('submit', handleSevaBookingSubmit);
}

menuToggle.addEventListener('click', () => {
  updateMenuState(menuToggle.getAttribute('aria-expanded') !== 'true');
});
teluguBtn.addEventListener('click', () => switchLanguage('telugu'));
englishBtn.addEventListener('click', () => switchLanguage('english'));
if (musicToggleBtn && backgroundMusic) {
  musicToggleBtn.addEventListener('click', () => {
    if (!backgroundMusic.getAttribute('src')) {
      updateMusicToggleButtonLabel();
      return;
    }

    const nextMuted = !backgroundMusic.muted;
    backgroundMusic.muted = nextMuted;
    setStoredMusicMutedPreference(nextMuted);
    updateMusicToggleButtonLabel();

    if (nextMuted) {
      backgroundMusic.pause();
    } else {
      try {
        backgroundMusic.currentTime = 0;
      } catch (error) {
        // Ignore seek errors before metadata is ready.
      }
      void tryPlayBackgroundMusic();
    }
  });
}
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
setMinimumSevaDate();
updateSevaSelectedLabel();
updateSevaSelectionHint();
updateSevaBookingSummary();
updateMenuState(false);
syncActiveLinkToViewport();
loadContent();
loadGallery();
loadSevaCatalog();