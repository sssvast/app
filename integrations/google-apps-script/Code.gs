const BOOKING_SPREADSHEET_ID = '12jHX0Lb1CZZQDLhH1NYHqsMSpbwIIQxG6ZfJ_wCXyXM';
const BOOKING_SPREADSHEET_ID_KEY = 'BOOKING_SPREADSHEET_ID';
const DAILY_PHONE_LIMIT_KEY = 'DAILY_PHONE_LIMIT';
const DEFAULT_DAILY_PHONE_LIMIT = 3;
const WHATSAPP_CLOUD_TOKEN_KEY = 'WHATSAPP_CLOUD_TOKEN';
const WHATSAPP_PHONE_NUMBER_ID_KEY = 'WHATSAPP_PHONE_NUMBER_ID';
const WHATSAPP_WEBHOOK_VERIFY_TOKEN_KEY = 'WHATSAPP_WEBHOOK_VERIFY_TOKEN';
const ADMIN_ALLOWED_EMAIL = 'svanjaneya.temple@gmail.com';
const ADMIN_ALLOWED_EMAIL_KEY = 'ADMIN_ALLOWED_EMAIL';

const BOOKING_STATUS_SUBMITTED = 'Submitted';
const BOOKING_STATUS_REVIEWED = 'Reviewed';
const BOOKING_STATUS_CONFIRMED = 'Confirmed';
const BOOKING_STATUS_CANCELLED = 'Cancelled';

// Column positions in date sheets (1-indexed, for use with the Sheets API).
const BOOKING_COL_SEVA_DATE = 3;
const BOOKING_COL_SEVA_NAME = 5;
const BOOKING_COL_SEVA_TIMING = 6;
const BOOKING_COL_DEVOTEE_NAME = 7;
const BOOKING_COL_PHONE = 9;
const BOOKING_COL_SLOT = 10;
const BOOKING_COL_BOOKING_REF = 12;
const BOOKING_COL_STATUS = 13;

const CONFIRMED_CANCELLATION_MIN_HOURS = 14;

const BOOKING_HEADERS = [
  'Created At',
  'Booking Request Timestamp',
  'Seva Date',
  'Seva Id',
  'Seva Name (Telugu)',
  'Seva Timing (Telugu)',
  'Devotee Name',
  'Gotram',
  'Phone',
  'Slot',
  'Total Amount',
  'Booking Reference',
  'Status'
];

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};

    if (isWhatsappWebhookVerificationRequest_(params)) {
      return verifyWhatsappWebhookChallenge_(params);
    }

    if (String(params.action || '').trim().toLowerCase() === 'availability') {
      const request = normalizeAvailabilityRequest_(params);
      const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId_());
      const availability = getBookingAvailability_(spreadsheet, request.selectedDate, request.sevaId, request.dailySlots);

      return jsonResponse_({
        ok: true,
        service: 'temple-booking-webhook',
        availability
      });
    }

    return jsonResponse_({
      ok: true,
      service: 'temple-booking-webhook'
    });
  } catch (error) {
    return bookingErrorResponse_(error);
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);

    if (isWhatsappWebhookPayload_(payload)) {
      handleWhatsappWebhookPayload_(payload);
      return textResponse_('EVENT_RECEIVED');
    }

    // Admin: fetch all bookings (verified via Google ID token).
    if (payload && payload.action === 'admin-bookings') {
      const idToken = String(payload.id_token || '').trim();
      const tokenData = verifyAdminToken_(idToken);
      const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId_());
      const bookings = getAdminBookings_(spreadsheet);
      return jsonResponse_({ ok: true, email: tokenData.email, bookings: bookings });
    }

    // Admin: Submitted -> Reviewed transition + WhatsApp notify with QR image.
    if (payload && payload.action === 'admin-transition-reviewed') {
      const idToken = String(payload.id_token || '').trim();
      const tokenData = verifyAdminToken_(idToken);
      const request = normalizeAdminReviewedTransitionRequest_(payload);
      const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId_());
      const transition = transitionBookingToReviewed_(spreadsheet, request);
      return jsonResponse_({ ok: true, email: tokenData.email, transition: transition });
    }

    // Admin: transition booking status with WhatsApp notify.
    if (payload && payload.action === 'admin-transition-status') {
      const idToken = String(payload.id_token || '').trim();
      const tokenData = verifyAdminToken_(idToken);
      const request = normalizeAdminStatusTransitionRequest_(payload);
      const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId_());
      const transition = transitionBookingToStatus_(spreadsheet, request);
      return jsonResponse_({ ok: true, email: tokenData.email, transition: transition });
    }

    const bookingPayload = payload && payload.booking ? payload.booking : payload;
    const booking = normalizeBooking_(bookingPayload);
    const controls = normalizeControls_(payload);

    // Server-side rate limit: max N booking requests per phone number per day.
    checkPhoneRateLimit_(booking.devoteePhone, booking.selectedDate);

    let availabilityBefore = null;
    let availabilityAfter = null;
    let sheetUpdate = { updated: false, reason: 'sheet-update-disabled' };

    if (controls.enableSheetUpdate) {
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);

      try {
        const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId_());
        availabilityBefore = getBookingAvailability_(spreadsheet, booking.selectedDate, booking.sevaId, booking.dailySlots);
        ensureRequestedSlotsAvailable_(availabilityBefore, booking.requestedSlots);
        sheetUpdate = appendBookingToSheet_(booking, spreadsheet);
        availabilityAfter = getBookingAvailability_(spreadsheet, booking.selectedDate, booking.sevaId, booking.dailySlots);
      } finally {
        lock.releaseLock();
      }
    }

    const whatsapp = controls.enableWhatsappMessage
      ? sendWhatsappNotification_(booking)
      : { sent: false, reason: 'whatsapp-disabled' };

    return jsonResponse_({
      ok: true,
      controls,
      availabilityBefore,
      availabilityAfter,
      sheetUpdate,
      whatsapp
    });
  } catch (error) {
    return bookingErrorResponse_(error);
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || typeof e.postData.contents !== 'string') {
    throw new Error('Request body is required.');
  }

  const rawBody = e.postData.contents.trim();
  if (!rawBody) {
    throw new Error('Request body is empty.');
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw new Error('Request body must be valid JSON.');
  }
}

function isWhatsappWebhookVerificationRequest_(params) {
  const mode = String(params && params['hub.mode'] || '').trim().toLowerCase();
  return mode === 'subscribe';
}

function verifyWhatsappWebhookChallenge_(params) {
  const mode = String(params && params['hub.mode'] || '').trim();
  const verifyToken = String(params && params['hub.verify_token'] || '').trim();
  const challenge = String(params && params['hub.challenge'] || '').trim();
  const expectedToken = getOptionalScriptProperty_(WHATSAPP_WEBHOOK_VERIFY_TOKEN_KEY);

  if (mode === 'subscribe' && expectedToken && verifyToken === expectedToken) {
    return textResponse_(challenge || '');
  }

  return textResponse_('Webhook verification failed. Set matching script property: ' + WHATSAPP_WEBHOOK_VERIFY_TOKEN_KEY);
}

function isWhatsappWebhookPayload_(payload) {
  return !!(
    payload &&
    payload.object === 'whatsapp_business_account' &&
    Array.isArray(payload.entry)
  );
}

function handleWhatsappWebhookPayload_(payload) {
  const spreadsheet = SpreadsheetApp.openById(getSpreadsheetId_());
  const sheet = getOrCreateWhatsappEventLogSheet_(spreadsheet);
  const events = extractWhatsappStatusEvents_(payload);

  if (!events.length) {
    return;
  }

  const now = new Date();
  const rows = events.map(function (event) {
    return [
      now,
      event.field,
      event.status,
      event.messageId,
      event.recipient,
      event.waId,
      event.conversationId,
      event.conversationOrigin,
      event.pricingCategory,
      event.errorCode,
      event.errorTitle,
      event.errorDetails,
      event.raw
    ];
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function extractWhatsappStatusEvents_(payload) {
  const events = [];
  const entries = Array.isArray(payload && payload.entry) ? payload.entry : [];

  entries.forEach(function (entry) {
    const changes = Array.isArray(entry && entry.changes) ? entry.changes : [];
    changes.forEach(function (change) {
      const field = String(change && change.field || '').trim();
      const value = change && change.value ? change.value : {};
      const statuses = Array.isArray(value.statuses) ? value.statuses : [];

      statuses.forEach(function (statusObj) {
        const conversation = statusObj && statusObj.conversation ? statusObj.conversation : {};
        const pricing = statusObj && statusObj.pricing ? statusObj.pricing : {};
        const errors = Array.isArray(statusObj && statusObj.errors) ? statusObj.errors : [];
        const firstError = errors.length ? errors[0] : {};
        const details = firstError && firstError.error_data && firstError.error_data.details
          ? String(firstError.error_data.details).trim()
          : '';

        events.push({
          field: field || 'messages',
          status: String(statusObj && statusObj.status || '').trim(),
          messageId: String(statusObj && statusObj.id || '').trim(),
          recipient: String(statusObj && statusObj.recipient_id || '').trim(),
          waId: String(value && value.contacts && value.contacts[0] && value.contacts[0].wa_id || '').trim(),
          conversationId: String(conversation && conversation.id || '').trim(),
          conversationOrigin: String(conversation && conversation.origin && conversation.origin.type || '').trim(),
          pricingCategory: String(pricing && pricing.category || '').trim(),
          errorCode: Number.isFinite(Number(firstError && firstError.code)) ? String(firstError.code).trim() : '',
          errorTitle: String(firstError && firstError.title || '').trim(),
          errorDetails: details,
          raw: JSON.stringify(statusObj).slice(0, 1000)
        });
      });
    });
  });

  return events;
}

function getOrCreateWhatsappEventLogSheet_(spreadsheet) {
  const sheetName = 'WhatsAppEvents';
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const headers = [
    'Logged At',
    'Field',
    'Status',
    'Message ID',
    'Recipient',
    'WA ID',
    'Conversation ID',
    'Conversation Origin',
    'Pricing Category',
    'Error Code',
    'Error Title',
    'Error Details',
    'Raw Event'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function normalizeAdminReviewedTransitionRequest_(payload) {
  const selectedDate = String(payload && payload.selectedDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    throw createBookingError_('INVALID_ADMIN_REQUEST', 'selectedDate must be in YYYY-MM-DD format.');
  }

  const bookingRef = String(payload && payload.bookingRef || '').trim();
  if (!bookingRef) {
    throw createBookingError_('INVALID_ADMIN_REQUEST', 'bookingRef is required.');
  }

  const languageRaw = String(payload && payload.language || 'en').trim().toLowerCase();
  const language = languageRaw === 'te' ? 'te' : 'en';

  const phone = String(payload && payload.phone || '').trim();
  const customMessage = String(payload && payload.customMessage || '').trim();
  const qrImage = decodeDataUrlImage_(payload && payload.qrImageDataUrl, payload && payload.qrFileName);

  return {
    selectedDate,
    bookingRef,
    language,
    phone,
    customMessage,
    qrImage
  };
}

function normalizeAdminStatusTransitionRequest_(payload) {
  const selectedDate = String(payload && payload.selectedDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    throw createBookingError_('INVALID_ADMIN_REQUEST', 'selectedDate must be in YYYY-MM-DD format.');
  }

  const bookingRef = String(payload && payload.bookingRef || '').trim();
  if (!bookingRef) {
    throw createBookingError_('INVALID_ADMIN_REQUEST', 'bookingRef is required.');
  }

  const targetStatus = normalizeAdminTargetStatus_(payload && payload.targetStatus);
  if (!targetStatus) {
    throw createBookingError_('INVALID_ADMIN_REQUEST', 'targetStatus must be Confirmed or Cancelled.');
  }

  const languageRaw = String(payload && payload.language || 'en').trim().toLowerCase();
  const language = languageRaw === 'te' ? 'te' : 'en';

  const phone = String(payload && payload.phone || '').trim();
  const customMessage = String(payload && payload.customMessage || '').trim();
  const paymentReceived = normalizeBoolean_(payload && payload.paymentReceived);

  return {
    selectedDate,
    bookingRef,
    targetStatus,
    language,
    phone,
    customMessage,
    paymentReceived
  };
}

function normalizeAdminTargetStatus_(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'confirmed') {
    return BOOKING_STATUS_CONFIRMED;
  }

  if (normalized === 'cancelled' || normalized === 'canceled') {
    return BOOKING_STATUS_CANCELLED;
  }

  return '';
}

function normalizeBookingStatus_(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'submitted') {
    return BOOKING_STATUS_SUBMITTED;
  }

  if (normalized === 'reviewed') {
    return BOOKING_STATUS_REVIEWED;
  }

  if (normalized === 'confirmed') {
    return BOOKING_STATUS_CONFIRMED;
  }

  if (normalized === 'cancelled' || normalized === 'canceled') {
    return BOOKING_STATUS_CANCELLED;
  }

  return String(status || '').trim();
}

function normalizeBoolean_(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }

    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }
  }

  return false;
}

function transitionBookingToReviewed_(spreadsheet, request) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const sheet = spreadsheet.getSheetByName(request.selectedDate);
    if (!sheet || sheet.getLastRow() < 2) {
      throw createBookingError_('BOOKING_NOT_FOUND', 'Booking could not be found for the selected date.');
    }

    const rowIndex = findBookingRowByRef_(sheet, request.bookingRef);
    if (rowIndex < 2) {
      throw createBookingError_('BOOKING_NOT_FOUND', 'Booking reference not found: ' + request.bookingRef);
    }

    const row = sheet.getRange(rowIndex, 1, 1, BOOKING_HEADERS.length).getValues()[0];
    const rawCurrentStatus = String(row[BOOKING_COL_STATUS - 1] || BOOKING_STATUS_SUBMITTED).trim() || BOOKING_STATUS_SUBMITTED;
    const currentStatus = normalizeBookingStatus_(rawCurrentStatus) || BOOKING_STATUS_SUBMITTED;
    if (currentStatus !== BOOKING_STATUS_SUBMITTED) {
      throw createBookingError_(
        'INVALID_TRANSITION',
        'Only Submitted bookings can be moved to Reviewed.',
        { currentStatus: currentStatus }
      );
    }

    const bookingSevaDate = normalizeSevaDateValue_(row[BOOKING_COL_SEVA_DATE - 1], request.selectedDate);

    const bookingData = {
      sevaDate: bookingSevaDate,
      sevaName: String(row[BOOKING_COL_SEVA_NAME - 1] || '').trim(),
      devoteeName: String(row[BOOKING_COL_DEVOTEE_NAME - 1] || '').trim(),
      bookingRef: String(row[BOOKING_COL_BOOKING_REF - 1] || request.bookingRef).trim()
    };

    const toPhone = toWhatsappRecipient_(request.phone || String(row[BOOKING_COL_PHONE - 1] || ''));
    if (!toPhone) {
      throw createBookingError_('INVALID_PHONE', 'Devotee phone number is required to send WhatsApp message.');
    }

    const whatsapp = sendReviewedTransitionWhatsapp_({
      phone: toPhone,
      booking: bookingData,
      language: request.language,
      customMessage: request.customMessage,
      qrImage: request.qrImage
    });

    if (!whatsapp.sent) {
      const whatsappReason = String(whatsapp.reason || 'unknown');
      const whatsappBody = summarizeWhatsappError_(whatsapp.body);
      throw createBookingError_(
        'WHATSAPP_SEND_FAILED',
        'Failed to send WhatsApp review message.',
        {
          whatsappReason: whatsappBody
            ? (whatsappReason + ' | ' + whatsappBody)
            : whatsappReason
        }
      );
    }

    sheet.getRange(rowIndex, BOOKING_COL_STATUS).setValue(BOOKING_STATUS_REVIEWED);

    return {
      updated: true,
      selectedDate: request.selectedDate,
      bookingRef: bookingData.bookingRef,
      status: BOOKING_STATUS_REVIEWED,
      whatsapp: whatsapp
    };
  } finally {
    lock.releaseLock();
  }
}

function transitionBookingToStatus_(spreadsheet, request) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const sheet = spreadsheet.getSheetByName(request.selectedDate);
    if (!sheet || sheet.getLastRow() < 2) {
      throw createBookingError_('BOOKING_NOT_FOUND', 'Booking could not be found for the selected date.');
    }

    const rowIndex = findBookingRowByRef_(sheet, request.bookingRef);
    if (rowIndex < 2) {
      throw createBookingError_('BOOKING_NOT_FOUND', 'Booking reference not found: ' + request.bookingRef);
    }

    const row = sheet.getRange(rowIndex, 1, 1, BOOKING_HEADERS.length).getValues()[0];
    const rawCurrentStatus = String(row[BOOKING_COL_STATUS - 1] || BOOKING_STATUS_SUBMITTED).trim() || BOOKING_STATUS_SUBMITTED;
    const currentStatus = normalizeBookingStatus_(rawCurrentStatus) || BOOKING_STATUS_SUBMITTED;
    const sevaDate = normalizeSevaDateValue_(row[BOOKING_COL_SEVA_DATE - 1], request.selectedDate);
    const sevaTiming = normalizeSevaTimingValue_(row[BOOKING_COL_SEVA_TIMING - 1]);

    validateAdminStatusTransition_(
      currentStatus,
      request.targetStatus,
      request.paymentReceived,
      { sevaDate: sevaDate, sevaTiming: sevaTiming }
    );

    const bookingData = {
      sevaDate: sevaDate,
      sevaName: String(row[BOOKING_COL_SEVA_NAME - 1] || '').trim(),
      devoteeName: String(row[BOOKING_COL_DEVOTEE_NAME - 1] || '').trim(),
      bookingRef: String(row[BOOKING_COL_BOOKING_REF - 1] || request.bookingRef).trim(),
      totalAmount: Number(row[10]) || 0
    };

    const toPhone = toWhatsappRecipient_(request.phone || String(row[BOOKING_COL_PHONE - 1] || ''));
    if (!toPhone) {
      throw createBookingError_('INVALID_PHONE', 'Devotee phone number is required to send WhatsApp message.');
    }

    const whatsapp = sendAdminStatusTransitionWhatsapp_({
      phone: toPhone,
      booking: bookingData,
      targetStatus: request.targetStatus,
      currentStatus: currentStatus,
      language: request.language,
      customMessage: request.customMessage
    });

    if (!whatsapp.sent) {
      const whatsappReason = String(whatsapp.reason || 'unknown');
      const whatsappBody = summarizeWhatsappError_(whatsapp.body);
      throw createBookingError_(
        'WHATSAPP_SEND_FAILED',
        'Failed to send WhatsApp status message.',
        {
          whatsappReason: whatsappBody
            ? (whatsappReason + ' | ' + whatsappBody)
            : whatsappReason,
          targetStatus: request.targetStatus,
          currentStatus: currentStatus
        }
      );
    }

    sheet.getRange(rowIndex, BOOKING_COL_STATUS).setValue(request.targetStatus);

    return {
      updated: true,
      selectedDate: request.selectedDate,
      bookingRef: bookingData.bookingRef,
      fromStatus: currentStatus,
      status: request.targetStatus,
      whatsapp: whatsapp
    };
  } finally {
    lock.releaseLock();
  }
}

function validateAdminStatusTransition_(currentStatus, targetStatus, paymentReceived, bookingMeta) {
  currentStatus = normalizeBookingStatus_(currentStatus);
  targetStatus = normalizeBookingStatus_(targetStatus);

  if (targetStatus === BOOKING_STATUS_CONFIRMED) {
    if (currentStatus !== BOOKING_STATUS_REVIEWED) {
      throw createBookingError_(
        'INVALID_TRANSITION',
        'Only Reviewed bookings can be moved to Confirmed.',
        { currentStatus: currentStatus, targetStatus: targetStatus }
      );
    }

    if (!paymentReceived) {
      throw createBookingError_(
        'PAYMENT_CONFIRMATION_REQUIRED',
        'Please confirm that payment has been received before marking Confirmed.',
        { currentStatus: currentStatus, targetStatus: targetStatus }
      );
    }

    return;
  }

  if (targetStatus === BOOKING_STATUS_CANCELLED) {
    if (currentStatus === BOOKING_STATUS_CONFIRMED) {
      ensureConfirmedCancellationWithinWindow_(bookingMeta);
      return;
    }

    if (currentStatus !== BOOKING_STATUS_SUBMITTED && currentStatus !== BOOKING_STATUS_REVIEWED) {
      throw createBookingError_(
        'INVALID_TRANSITION',
        'Only Submitted, Reviewed, or eligible Confirmed bookings can be moved to Cancelled.',
        { currentStatus: currentStatus, targetStatus: targetStatus }
      );
    }

    return;
  }

  throw createBookingError_('INVALID_ADMIN_REQUEST', 'Unsupported target status: ' + targetStatus);
}

function ensureConfirmedCancellationWithinWindow_(bookingMeta) {
  const sevaDate = normalizeSevaDateValue_(
    bookingMeta && bookingMeta.sevaDate,
    bookingMeta && bookingMeta.selectedDate
  );
  const sevaTiming = normalizeSevaTimingValue_(bookingMeta && bookingMeta.sevaTiming);
  const sevaDateTime = parseSevaDateTime_(sevaDate, sevaTiming);

  if (!sevaDateTime) {
    throw createBookingError_(
      'SEVA_DATETIME_REQUIRED',
      'Confirmed booking cancellation requires valid seva date and time.',
      {
        currentStatus: BOOKING_STATUS_CONFIRMED,
        targetStatus: BOOKING_STATUS_CANCELLED
      }
    );
  }

  const cutoffMillis = sevaDateTime.getTime() - (CONFIRMED_CANCELLATION_MIN_HOURS * 60 * 60 * 1000);
  if (Date.now() > cutoffMillis) {
    throw createBookingError_(
      'CONFIRMED_CANCELLATION_WINDOW_EXPIRED',
      'Confirmed booking can be cancelled only up to ' + CONFIRMED_CANCELLATION_MIN_HOURS + ' hours before seva date and time.',
      {
        currentStatus: BOOKING_STATUS_CONFIRMED,
        targetStatus: BOOKING_STATUS_CANCELLED
      }
    );
  }
}

function formatDateForScriptTimeZone_(date, pattern) {
  const timeZone = Session.getScriptTimeZone() || 'Asia/Kolkata';
  return Utilities.formatDate(date, timeZone, pattern);
}

function coerceSevaDateValue_(value) {
  if (!value) {
    return '';
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateForScriptTimeZone_(value, 'yyyy-MM-dd');
  }

  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return formatDateForScriptTimeZone_(parsed, 'yyyy-MM-dd');
}

function normalizeSevaDateValue_(value, fallbackValue) {
  const normalizedPrimary = coerceSevaDateValue_(value);
  if (normalizedPrimary) {
    return normalizedPrimary;
  }

  return coerceSevaDateValue_(fallbackValue);
}

function normalizeSevaTimingValue_(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateForScriptTimeZone_(value, 'HH:mm');
  }

  return String(value || '').trim();
}

function parseSevaDateTime_(sevaDate, sevaTiming) {
  const dateText = normalizeSevaDateValue_(sevaDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return null;
  }

  const timeParts = parseSevaTimeParts_(sevaTiming);
  if (!timeParts) {
    return null;
  }

  const dateParts = dateText.split('-').map(function (part) { return Number(part); });
  if (dateParts.length !== 3 || dateParts.some(function (part) { return !Number.isFinite(part); })) {
    return null;
  }

  return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts.hour, timeParts.minute, 0, 0);
}

function parseSevaTimeParts_(timingText) {
  const raw = String(timingText || '').trim();
  if (!raw) {
    return null;
  }

  const timeMatch = /(\d{1,2})\s*[:.]\s*(\d{2})/.exec(raw);
  if (!timeMatch) {
    return null;
  }

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const lowerRaw = raw.toLowerCase();
  const hasAmEnglish = /\bam\b|morning/.test(lowerRaw);
  const hasPmEnglish = /\bpm\b|afternoon|evening|night/.test(lowerRaw);
  const hasAmTelugu = /ఉదయం|ప్రభాతం|తెల్లవారు/.test(raw);
  const hasPmTelugu = /మధ్యాహ్నం|సాయంత్రం|రాత్రి/.test(raw);

  const isAm = hasAmEnglish || hasAmTelugu;
  const isPm = hasPmEnglish || hasPmTelugu;

  if (isPm && hour < 12) {
    hour += 12;
  } else if (isAm && hour === 12) {
    hour = 0;
  }

  return {
    hour: hour,
    minute: minute
  };
}

function findBookingRowByRef_(sheet, bookingRef) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return -1;
  }

  const values = sheet.getRange(2, BOOKING_COL_BOOKING_REF, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    const ref = String(values[i][0] || '').trim();
    if (ref === bookingRef) {
      return i + 2;
    }
  }

  return -1;
}

function decodeDataUrlImage_(dataUrl, fileName) {
  const raw = String(dataUrl || '').trim();
  if (!raw) {
    throw createBookingError_('INVALID_QR_IMAGE', 'QR image is required.');
  }

  const match = /^data:([a-zA-Z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if (!match) {
    throw createBookingError_('INVALID_QR_IMAGE', 'QR image must be a valid base64 data URL.');
  }

  const mimeType = String(match[1] || '').toLowerCase();
  if (mimeType.indexOf('image/') !== 0) {
    throw createBookingError_('INVALID_QR_IMAGE', 'QR upload must be an image file.');
  }

  const bytes = Utilities.base64Decode(match[2]);
  if (!bytes || !bytes.length) {
    throw createBookingError_('INVALID_QR_IMAGE', 'QR image data is empty.');
  }

  if (bytes.length > 4 * 1024 * 1024) {
    throw createBookingError_('INVALID_QR_IMAGE', 'QR image must be 4MB or smaller.');
  }

  const safeName = sanitizeUploadFileName_(fileName, mimeType);
  return Utilities.newBlob(bytes, mimeType, safeName);
}

function sanitizeUploadFileName_(name, mimeType) {
  const fallbackBase = 'qr-code';
  const cleaned = String(name || '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 80);

  const baseName = cleaned || fallbackBase;
  if (/\.[a-zA-Z0-9]{2,5}$/.test(baseName)) {
    return baseName;
  }

  const extMap = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif'
  };
  const ext = extMap[mimeType] || '.png';
  return baseName + ext;
}

function normalizeWhatsappPhone_(value) {
  return String(value || '').replace(/\D/g, '');
}

function toWhatsappRecipient_(value) {
  const digits = normalizeWhatsappPhone_(value);
  if (!digits) {
    return '';
  }

  if (digits.length > 2 && digits.indexOf('00') === 0) {
    return digits.slice(2);
  }

  // Common local format in India: auto-prefix country code when only 10 digits are provided.
  if (digits.length === 10) {
    return '91' + digits;
  }

  if (digits.length === 11 && digits.charAt(0) === '0') {
    return '91' + digits.slice(1);
  }

  return digits;
}

function summarizeWhatsappError_(bodyText) {
  const raw = String(bodyText || '').trim();
  if (!raw) {
    return '';
  }

  try {
    const parsed = JSON.parse(raw);
    const message = parsed && parsed.error && parsed.error.message
      ? String(parsed.error.message).trim()
      : '';
    const details = parsed && parsed.error && parsed.error.error_data && parsed.error.error_data.details
      ? String(parsed.error.error_data.details).trim()
      : '';
    const combined = [message, details]
      .filter(function (part) { return !!part; })
      .join(' | ');

    if (combined) {
      return combined.slice(0, 400);
    }
  } catch (parseError) {
    // Ignore parse issues and fall back to raw response text.
  }

  return raw.slice(0, 400);
}

function parseWhatsappSendResponse_(bodyText) {
  const raw = String(bodyText || '').trim();
  const summary = {
    raw: raw.slice(0, 500),
    messageId: '',
    messageStatus: '',
    waId: '',
    errorMessage: '',
    errorCode: '',
    errorDetails: ''
  };

  if (!raw) {
    return summary;
  }

  try {
    const parsed = JSON.parse(raw);
    const firstMessage = parsed && parsed.messages && parsed.messages[0] ? parsed.messages[0] : null;
    const firstContact = parsed && parsed.contacts && parsed.contacts[0] ? parsed.contacts[0] : null;
    const errorObj = parsed && parsed.error ? parsed.error : null;

    if (firstMessage && firstMessage.id) {
      summary.messageId = String(firstMessage.id).trim();
    }

    if (firstMessage && firstMessage.message_status) {
      summary.messageStatus = String(firstMessage.message_status).trim();
    }

    if (firstContact && firstContact.wa_id) {
      summary.waId = String(firstContact.wa_id).trim();
    }

    if (errorObj && errorObj.message) {
      summary.errorMessage = String(errorObj.message).trim();
    }

    if (errorObj && Number.isFinite(Number(errorObj.code))) {
      summary.errorCode = String(errorObj.code).trim();
    }

    if (errorObj && errorObj.error_data && errorObj.error_data.details) {
      summary.errorDetails = String(errorObj.error_data.details).trim();
    }
  } catch (parseError) {
    // Keep raw text only when response is not JSON.
  }

  return summary;
}

function sendReviewedTransitionWhatsapp_(options) {
  const token = getWhatsappCloudToken_();
  const phoneNumberId = getWhatsappPhoneNumberId_();
  const toNumber = toWhatsappRecipient_(options && options.phone);

  if (!token || !phoneNumberId) {
    const missing = [];
    if (!token) {
      missing.push('token');
    }
    if (!phoneNumberId) {
      missing.push('phone-number-id');
    }

    return {
      sent: false,
      reason: 'whatsapp-not-configured:' + missing.join(',')
    };
  }

  if (!toNumber) {
    return {
      sent: false,
      reason: 'whatsapp-invalid-to-number'
    };
  }

  const mediaUpload = uploadWhatsappImageMedia_(phoneNumberId, token, options.qrImage);
  if (!mediaUpload.ok) {
    return {
      sent: false,
      reason: mediaUpload.reason || 'whatsapp-media-upload-failed',
      status: mediaUpload.status,
      body: mediaUpload.body
    };
  }

  // Build detailed message with visual separators for better readability
  const detailedMessage = buildReviewedTransitionMessage_(
    options.booking,
    options.language,
    options.customMessage
  );

  const endpoint = 'https://graph.facebook.com/v22.0/' + encodeURIComponent(phoneNumberId) + '/messages';
  const payload = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'image',
    image: {
      id: mediaUpload.mediaId,
      caption: detailedMessage
    }
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const responseBody = response.getContentText();
  const sendMeta = parseWhatsappSendResponse_(responseBody);

  if (status >= 200 && status < 300 && sendMeta.errorMessage) {
    return {
      sent: false,
      reason: 'whatsapp-http-' + status,
      body: sendMeta.raw,
      mediaId: mediaUpload.mediaId,
      to: toNumber,
      messageId: sendMeta.messageId,
      messageStatus: sendMeta.messageStatus,
      waId: sendMeta.waId
    };
  }

  if (status >= 200 && status < 300) {
    return {
      sent: true,
      status: status,
      mediaId: mediaUpload.mediaId,
      to: toNumber,
      messageId: sendMeta.messageId,
      messageStatus: sendMeta.messageStatus,
      waId: sendMeta.waId,
      body: sendMeta.raw
    };
  }

  return {
    sent: false,
    reason: 'whatsapp-http-' + status,
    body: sendMeta.raw,
    mediaId: mediaUpload.mediaId,
    to: toNumber,
    messageId: sendMeta.messageId,
    messageStatus: sendMeta.messageStatus,
    waId: sendMeta.waId
  };
}

function sendAdminStatusTransitionWhatsapp_(options) {
  const token = getWhatsappCloudToken_();
  const phoneNumberId = getWhatsappPhoneNumberId_();
  const toNumber = toWhatsappRecipient_(options && options.phone);

  if (!token || !phoneNumberId) {
    const missing = [];
    if (!token) {
      missing.push('token');
    }
    if (!phoneNumberId) {
      missing.push('phone-number-id');
    }

    return {
      sent: false,
      reason: 'whatsapp-not-configured:' + missing.join(',')
    };
  }

  if (!toNumber) {
    return {
      sent: false,
      reason: 'whatsapp-invalid-to-number'
    };
  }

  const endpoint = 'https://graph.facebook.com/v22.0/' + encodeURIComponent(phoneNumberId) + '/messages';
  const payload = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'text',
    text: {
      body: buildAdminStatusTransitionMessage_(
        options.booking,
        options.targetStatus,
        options.language,
        options.customMessage,
        options.currentStatus
      )
    }
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const responseBody = response.getContentText();
  const sendMeta = parseWhatsappSendResponse_(responseBody);

  if (status >= 200 && status < 300 && sendMeta.errorMessage) {
    return {
      sent: false,
      reason: 'whatsapp-http-' + status,
      body: sendMeta.raw,
      to: toNumber,
      messageId: sendMeta.messageId,
      messageStatus: sendMeta.messageStatus,
      waId: sendMeta.waId
    };
  }

  if (status >= 200 && status < 300) {
    return {
      sent: true,
      status: status,
      to: toNumber,
      messageId: sendMeta.messageId,
      messageStatus: sendMeta.messageStatus,
      waId: sendMeta.waId,
      body: sendMeta.raw
    };
  }

  return {
    sent: false,
    reason: 'whatsapp-http-' + status,
    body: sendMeta.raw,
    to: toNumber,
    messageId: sendMeta.messageId,
    messageStatus: sendMeta.messageStatus,
    waId: sendMeta.waId
  };
}

function uploadWhatsappImageMedia_(phoneNumberId, token, imageBlob) {
  if (!imageBlob) {
    return {
      ok: false,
      reason: 'missing-qr-image'
    };
  }

  // Log token diagnostic info (safe to log, shows length and format clues)
  const tokenDiagnostic = {
    length: String(token || '').length,
    startsWithBearer: /^Bearer\s/i.test(token),
    first20: token ? token.substring(0, 20) : 'EMPTY',
    last20: token ? token.substring(Math.max(0, token.length - 20)) : 'EMPTY'
  };
  const phoneIdDiagnostic = {
    phoneNumberId: phoneNumberId,
    length: String(phoneNumberId || '').length
  };
  console.log('[Temple WhatsApp Upload] Token diagnostic:', JSON.stringify(tokenDiagnostic));
  console.log('[Temple WhatsApp Upload] Phone ID diagnostic:', JSON.stringify(phoneIdDiagnostic));

  const endpoint = 'https://graph.facebook.com/v22.0/' + encodeURIComponent(phoneNumberId) + '/media';
  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: {
      messaging_product: 'whatsapp',
      file: imageBlob
    },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    const errorBody = response.getContentText().slice(0, 500);
    console.log('[Temple WhatsApp Upload] HTTP ' + status + ' error:', errorBody);
    return {
      ok: false,
      reason: 'whatsapp-media-upload-http-' + status,
      status: status,
      body: errorBody
    };
  }

  let body;
  try {
    body = JSON.parse(response.getContentText());
  } catch (parseError) {
    return {
      ok: false,
      reason: 'whatsapp-media-upload-parse-failed',
      status: status,
      body: response.getContentText().slice(0, 500)
    };
  }

  if (!body || !body.id) {
    return {
      ok: false,
      reason: 'whatsapp-media-id-missing',
      status: status,
      body: response.getContentText().slice(0, 500)
    };
  }

  return {
    ok: true,
    status: status,
    mediaId: String(body.id)
  };
}

function buildReviewedTransitionMessage_(booking, language, customMessage) {
  const ref = booking && booking.bookingRef ? booking.bookingRef : '-';
  const sevaDate = booking && booking.sevaDate ? booking.sevaDate : '-';
  const seva = booking && booking.sevaName ? booking.sevaName : '-';
  const devotee = booking && booking.devoteeName ? booking.devoteeName : '-';
  const extra = String(customMessage || '').trim();

  if (extra) {
    return extra.length > 1000 ? extra.slice(0, 1000) : extra;
  }

  const lines = language === 'te'
    ? [
      'నమస్తే ' + devotee + ',',
      '',
      'మీ సేవ బుకింగ్ అభ్యర్థన పరిశీలించబడింది.',
      'బుకింగ్ రిఫరెన్స్: ' + ref,
      'సేవ తేదీ: ' + sevaDate,
      'సేవ: ' + seva,
      '',
      'జత చేసిన QR కోడ్ ద్వారా సేవ రుసుము చెల్లించి రసీదు పంపించండి.',
      '',
      '*శ్రీ వరధాంజనేయ స్వామి ఆశీస్సులతో.*'
    ]
    : [
      'Namaste ' + devotee + ',',
      '',
      'Your seva booking request has been reviewed.',
      'Booking Reference: ' + ref,
      'Seva Date: ' + sevaDate,
      'Seva: ' + seva,
      '',
      'Please complete payment using the attached QR code and share payment receipt.',
      '',
      '*With blessings of Sri Varadhanjaneya Swamy.*'
    ];

  const caption = lines.join('\n');
  return caption.length > 1000 ? caption.slice(0, 1000) : caption;
}

function formatAmountInr_(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return '';
  }

  return '₹ ' + amount.toLocaleString('en-IN');
}

function buildAdminStatusTransitionMessage_(booking, targetStatus, language, customMessage, currentStatus) {
  const extra = String(customMessage || '').trim();
  if (extra) {
    return extra.length > 1800 ? extra.slice(0, 1800) : extra;
  }

  const ref = booking && booking.bookingRef ? booking.bookingRef : '-';
  const sevaDate = booking && booking.sevaDate ? booking.sevaDate : '-';
  const seva = booking && booking.sevaName ? booking.sevaName : '-';
  const devotee = booking && booking.devoteeName ? booking.devoteeName : '-';
  const paymentAmount = formatAmountInr_(booking && booking.totalAmount);
  const includeRefundNote = targetStatus === BOOKING_STATUS_CANCELLED && normalizeBookingStatus_(currentStatus) === BOOKING_STATUS_CONFIRMED;

  let lines;
  if (targetStatus === BOOKING_STATUS_CONFIRMED) {
    lines = language === 'te'
      ? [
        'నమస్తే ' + devotee + ',',
        '',
        'మీ చెల్లింపు స్వీకరించాం.',
        'బుకింగ్ రిఫరెన్స్: ' + ref,
        'సేవ తేదీ: ' + sevaDate,
        'సేవ: ' + seva,
        '',
        '*మీ సేవ బుకింగ్ ధృవీకరించబడింది.*',
        'దయచేసి ఆలయ దర్శనానికి ఈ రిఫరెన్స్‌ను తీసుకురండి.',
        '',
        'జై శ్రీరామ్'
      ]
      : [
        'Namaste ' + devotee + ',',
        '',
        'We have received your payment.',
        'Booking Reference: ' + ref,
        'Seva Date: ' + sevaDate,
        'Seva: ' + seva,
        '',
        '*Your seva booking is now confirmed.*',
        'Please carry this booking reference when you visit the temple.',
        '',
        'Jai Sri Ram'
      ];
  } else {
    lines = language === 'te'
      ? [
        'నమస్తే ' + devotee + ',',
        '',
        'మీ సేవ బుకింగ్ రద్దు చేయబడింది.',
        'బుకింగ్ రిఫరెన్స్: ' + ref,
        'సేవ తేదీ: ' + sevaDate,
        'సేవ: ' + seva,
        '',
        'ఏవైనా సందేహాలు ఉంటే ఆలయాన్ని సంప్రదించండి.',
        '',
        'ధన్యవాదాలు'
      ]
      : [
        'Namaste ' + devotee + ',',
        '',
        'Your seva booking has been cancelled.',
        'Booking Reference: ' + ref,
        'Seva Date: ' + sevaDate,
        'Seva: ' + seva,
        '',
        'For any questions, please contact the temple office.',
        '',
        'Thank you'
      ];

    if (includeRefundNote) {
      lines.splice(7, 0,
        language === 'te'
          ? (paymentAmount
              ? 'చెల్లించిన రుసుము ₹ ' + paymentAmount + ' తదుపరి 5 రోజుల్లో తిరిగి చెల్లించబడుతుంది.'
              : 'చెల్లించిన రుసుము తదుపరి 5 రోజుల్లో తిరిగి చెల్లించబడుతుంది.')
          : (paymentAmount
              ? 'Amount paid ₹ ' + paymentAmount + ' will be refunded in next 5 days.'
              : 'Amount paid will be refunded in next 5 days.'),
        ''
      );
    }
  }

  const message = lines.join('\n');
  return message.length > 1800 ? message.slice(0, 1800) : message;
}

function normalizeAvailabilityRequest_(params) {
  const selectedDate = String(params.selectedDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    throw createBookingError_('INVALID_AVAILABILITY_REQUEST', 'selectedDate must be in YYYY-MM-DD format.');
  }

  const sevaId = String(params.sevaId || '').trim();
  if (!sevaId) {
    throw createBookingError_('INVALID_AVAILABILITY_REQUEST', 'sevaId is required.');
  }

  const dailySlots = Number(params.dailySlots);
  if (!Number.isFinite(dailySlots) || dailySlots < 1) {
    throw createBookingError_('INVALID_AVAILABILITY_REQUEST', 'dailySlots must be a positive number.');
  }

  return {
    selectedDate,
    sevaId,
    dailySlots: Math.trunc(dailySlots)
  };
}

function normalizeBooking_(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Booking payload is missing.');
  }

  const selectedDate = String(raw.selectedDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    throw new Error('selectedDate must be in YYYY-MM-DD format.');
  }

  const requestedSlots = Number(raw.requestedSlots);
  if (!Number.isFinite(requestedSlots) || requestedSlots < 1) {
    throw new Error('requestedSlots must be a positive number.');
  }

  const rawSlotNumber = raw.slotNumber === undefined || raw.slotNumber === null || raw.slotNumber === ''
    ? raw.requestedSlots
    : raw.slotNumber;
  const slotNumber = Number(rawSlotNumber);
  if (!Number.isFinite(slotNumber) || slotNumber < 1) {
    throw new Error('slotNumber must be a positive number.');
  }

  if (Math.trunc(slotNumber) !== Math.trunc(requestedSlots)) {
    throw new Error('slotNumber must match requestedSlots.');
  }

  const dailySlots = Number(raw.dailySlots);
  if (!Number.isFinite(dailySlots) || dailySlots < 1) {
    throw new Error('dailySlots must be a positive number.');
  }

  const totalAmount = Number(raw.totalAmount);
  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    throw new Error('totalAmount must be zero or greater.');
  }

  return {
    bookingTimestamp: String(raw.bookingTimestamp || new Date().toISOString()),
    selectedDate,
    sevaId: String(raw.sevaId || '').trim(),
    sevaNameEnglish: String(raw.sevaNameEnglish || '').trim(),
    sevaNameTelugu: String(raw.sevaNameTelugu || '').trim(),
    sevaTimingEnglish: String(raw.sevaTimingEnglish || '').trim(),
    sevaTimingTelugu: String(raw.sevaTimingTelugu || '').trim(),
    devoteeName: String(raw.devoteeName || '').trim(),
    devoteeGotram: String(raw.devoteeGotram || '').trim(),
    devoteePhone: String(raw.devoteePhone || '').trim(),
    dailySlots: Math.trunc(dailySlots),
    requestedSlots: Math.trunc(requestedSlots),
    slotNumber: Math.trunc(slotNumber),
    totalAmount: Number(totalAmount.toFixed(2))
  };
}

function normalizeControls_(payload) {
  const controlsSource = payload && typeof payload.controls === 'object' && payload.controls
    ? payload.controls
    : payload;

  const toBoolean = (value, defaultValue) => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
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

    return defaultValue;
  };

  return {
    enableSheetUpdate: toBoolean(controlsSource && controlsSource.enableSheetUpdate, true),
    enableWhatsappMessage: toBoolean(controlsSource && controlsSource.enableWhatsappMessage, true)
  };
}

function appendBookingToSheet_(booking, spreadsheet) {
  const activeSpreadsheet = spreadsheet || SpreadsheetApp.openById(getSpreadsheetId_());
  const sheet = getOrCreateDateSheet_(activeSpreadsheet, booking.selectedDate);
  const bookingRef = generateBookingRef_();

  sheet.appendRow([
    new Date(),
    booking.bookingTimestamp,
    booking.selectedDate,
    booking.sevaId,
    booking.sevaNameTelugu,
    booking.sevaTimingTelugu,
    booking.devoteeName,
    booking.devoteeGotram,
    booking.devoteePhone,
    booking.slotNumber,
    booking.totalAmount,
    bookingRef,
    BOOKING_STATUS_SUBMITTED
  ]);

  return {
    updated: true,
    sheetName: booking.selectedDate,
    bookingRef
  };
}

function getBookingAvailability_(spreadsheet, selectedDate, sevaId, dailySlots) {
  const bookedSlots = getBookedSlotsFromSheet_(spreadsheet, selectedDate, sevaId);

  return {
    selectedDate,
    sevaId,
    dailySlots,
    bookedSlots,
    availableSlots: Math.max(dailySlots - bookedSlots, 0)
  };
}

function getBookedSlotsFromSheet_(spreadsheet, selectedDate, sevaId) {
  const sheet = spreadsheet.getSheetByName(selectedDate);
  if (!sheet || sheet.getLastRow() < 2) {
    return 0;
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, BOOKING_HEADERS.length).getValues();

  return rows.reduce((total, row) => {
    const rowSevaId = String(row[3] || '').trim();
    const rowSlots = parseInt(row[BOOKING_COL_SLOT - 1], 10);

    if (rowSevaId !== sevaId || !Number.isFinite(rowSlots) || rowSlots < 1) {
      return total;
    }

    return total + rowSlots;
  }, 0);
}

function ensureRequestedSlotsAvailable_(availability, requestedSlots) {
  if (requestedSlots <= availability.availableSlots) {
    return;
  }

  throw createBookingError_(
    'INSUFFICIENT_SLOTS',
    'Only ' + availability.availableSlots + ' slot(s) are available for this date.',
    {
      availableSlots: availability.availableSlots,
      dailySlots: availability.dailySlots
    }
  );
}

function getOrCreateDateSheet_(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(BOOKING_HEADERS);
  } else {
    const existingHeaders = sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).getValues()[0];
    const shouldRewriteHeaders = BOOKING_HEADERS.some((expected, index) => String(existingHeaders[index] || '').trim() !== expected);
    if (shouldRewriteHeaders) {
      sheet.getRange(1, 1, 1, BOOKING_HEADERS.length).setValues([BOOKING_HEADERS]);
    }
  }

  if (sheet.getFrozenRows() < 1) {
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function sendWhatsappNotification_(booking) {
  const token = getWhatsappCloudToken_();
  const phoneNumberId = getWhatsappPhoneNumberId_();

  if (!token || !phoneNumberId) {
    const missing = [];
    if (!token) {
      missing.push('token');
    }
    if (!phoneNumberId) {
      missing.push('phone-number-id');
    }

    return {
      sent: false,
      reason: 'whatsapp-not-configured:' + missing.join(',')
    };
  }

  const toNumber = toWhatsappRecipient_(booking && booking.devoteePhone);
  if (!toNumber) {
    return {
      sent: false,
      reason: 'whatsapp-missing-devotee-phone'
    };
  }

  const endpoint = 'https://graph.facebook.com/v22.0/' + encodeURIComponent(phoneNumberId) + '/messages';
  const payload = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'text',
    text: {
      body: buildWhatsappMessage_(booking)
    }
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const responseBody = response.getContentText();
  const sendMeta = parseWhatsappSendResponse_(responseBody);

  if (status >= 200 && status < 300) {
    return {
      sent: true,
      status: status,
      messageId: sendMeta.messageId,
      messageStatus: sendMeta.messageStatus,
      waId: sendMeta.waId,
      body: sendMeta.raw
    };
  }

  return {
    sent: false,
    reason: 'whatsapp-http-' + status,
    body: sendMeta.raw
  };
}

function buildWhatsappMessage_(booking) {
  return [
    'New Seva Booking',
    '',
    'Date: ' + booking.selectedDate,
    'Seva: ' + booking.sevaNameEnglish + ' (' + booking.sevaNameTelugu + ')',
    'Timing: ' + booking.sevaTimingEnglish,
    'Slot: ' + booking.slotNumber,
    'Total: ₹ ' + booking.totalAmount + '/-',
    '',
    'Devotee: ' + booking.devoteeName,
    'Gotram: ' + booking.devoteeGotram,
    'Phone: ' + booking.devoteePhone
  ].join('\n');
}

function checkPhoneRateLimit_(phone, date) {
  if (!phone) {
    return;
  }

  const maxStr = getOptionalScriptProperty_(DAILY_PHONE_LIMIT_KEY);
  const parsed = parseInt(maxStr, 10);
  const maxPerDay = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_PHONE_LIMIT;

  const key = 'rl_' + phone.replace(/[^0-9a-zA-Z]/g, '') + '_' + date.replace(/-/g, '');
  const countStr = PropertiesService.getScriptProperties().getProperty(key);
  const count = parseInt(countStr || '0', 10);

  if (count >= maxPerDay) {
    throw createBookingError_(
      'PHONE_RATE_LIMIT',
      'Too many booking requests for this phone on this day. Please contact the temple directly.'
    );
  }

  PropertiesService.getScriptProperties().setProperty(key, String(count + 1));
}

function createBookingError_(code, message, details) {
  const error = new Error(message);
  error.code = code;

  if (details && typeof details === 'object') {
    Object.keys(details).forEach(key => {
      error[key] = details[key];
    });
  }

  return error;
}

function bookingErrorResponse_(error) {
  const payload = {
    ok: false,
    error: error && error.message ? error.message : String(error)
  };

  if (error && error.code) {
    payload.errorCode = error.code;
  }

  if (error && Number.isFinite(Number(error.availableSlots))) {
    payload.availableSlots = Number(error.availableSlots);
  }

  if (error && Number.isFinite(Number(error.dailySlots))) {
    payload.dailySlots = Number(error.dailySlots);
  }

  if (error && error.currentStatus) {
    payload.currentStatus = String(error.currentStatus);
  }

  if (error && error.targetStatus) {
    payload.targetStatus = String(error.targetStatus);
  }

  if (error && error.cutoffAt) {
    payload.cutoffAt = String(error.cutoffAt);
  }

  if (error && error.whatsappReason) {
    payload.whatsappReason = String(error.whatsappReason);
  }

  return jsonResponse_(payload);
}

function getSpreadsheetId_() {
  const inlineId = typeof BOOKING_SPREADSHEET_ID === 'string' ? BOOKING_SPREADSHEET_ID.trim() : '';
  if (inlineId) {
    return inlineId;
  }

  return getRequiredScriptProperty_(BOOKING_SPREADSHEET_ID_KEY);
}

function getAdminAllowedEmail_() {
  const configuredEmail = getOptionalScriptProperty_(ADMIN_ALLOWED_EMAIL_KEY);
  const inlineEmail = typeof ADMIN_ALLOWED_EMAIL === 'string' ? ADMIN_ALLOWED_EMAIL.trim() : '';
  const allowedEmail = String(configuredEmail || inlineEmail).trim().toLowerCase();

  if (!allowedEmail) {
    throw createBookingError_(
      'ADMIN_CONFIG_MISSING',
      'Admin email is not configured. Set script property: ' + ADMIN_ALLOWED_EMAIL_KEY
    );
  }

  return allowedEmail;
}

function resolveConfiguredValue_(keyOrValue, expectedKeyName) {
  const raw = String(keyOrValue || '').trim();
  if (!raw) {
    return '';
  }

  // First treat the constant as a script property key.
  const fromProperty = getOptionalScriptProperty_(raw);
  if (fromProperty) {
    return fromProperty;
  }

  // Fallback for inline values if key constants were populated directly.
  return raw !== String(expectedKeyName || '').trim() ? raw : '';
}

function normalizeConfiguredString_(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
}

function normalizeWhatsappToken_(value) {
  return normalizeConfiguredString_(value)
    .replace(/^Bearer\s+/i, '')
    .replace(/\s+/g, '');
}

function getWhatsappCloudToken_() {
  const resolved = resolveConfiguredValue_(WHATSAPP_CLOUD_TOKEN_KEY, 'WHATSAPP_CLOUD_TOKEN');
  const normalized = normalizeWhatsappToken_(resolved);
  if (!normalized) {
    console.log('[Temple Config] WHATSAPP_CLOUD_TOKEN not configured (empty after normalization)');
  } else {
    console.log('[Temple Config] WHATSAPP_CLOUD_TOKEN resolved (length=' + normalized.length + ', startsWithBearer=' + /^Bearer/i.test(normalized) + ')');
  }
  return normalized;
}

function getWhatsappPhoneNumberId_() {
  const resolved = resolveConfiguredValue_(WHATSAPP_PHONE_NUMBER_ID_KEY, 'WHATSAPP_PHONE_NUMBER_ID');
  const normalized = normalizeConfiguredString_(resolved);
  if (!normalized) {
    console.log('[Temple Config] WHATSAPP_PHONE_NUMBER_ID not configured (empty after normalization)');
  } else {
    console.log('[Temple Config] WHATSAPP_PHONE_NUMBER_ID resolved (value=' + normalized + ')');
  }
  return normalized;
}

function getRequiredScriptProperty_(name) {
  const value = getOptionalScriptProperty_(name);
  if (!value) {
    throw new Error('Missing script property: ' + name);
  }

  return value;
}

function getOptionalScriptProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  return value ? String(value).trim() : '';
}

function generateBookingRef_() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return 'BK' +
    String(now.getFullYear()).slice(2) +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds()) +
    String(now.getMilliseconds()).padStart(3, '0');
}

// Called automatically by an installable trigger when any cell in the spreadsheet is edited.
function onBookingStatusEdit_(e) {
  try {
    if (!e || !e.range) {
      return;
    }

    const range = e.range;
    const sheet = range.getSheet();
    const row = range.getRow();
    const col = range.getColumn();

    // Only act on the Status column (col 13) in date-named sheets (YYYY-MM-DD).
    if (col !== BOOKING_COL_STATUS || row <= 1) {
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(sheet.getName())) {
      return;
    }

    const newStatus = String(e.value || '').trim();
    if (newStatus !== BOOKING_STATUS_CONFIRMED) {
      return;
    }

    const phone = String(sheet.getRange(row, BOOKING_COL_PHONE).getValue() || '').trim();
    if (!phone) {
      return;
    }

    const devoteeName = String(sheet.getRange(row, BOOKING_COL_DEVOTEE_NAME).getValue() || '').trim();
    const sevaName = String(sheet.getRange(row, BOOKING_COL_SEVA_NAME).getValue() || '').trim();
    const sevaDate = normalizeSevaDateValue_(sheet.getRange(row, BOOKING_COL_SEVA_DATE).getValue(), sheet.getName());
    const bookingRef = String(sheet.getRange(row, BOOKING_COL_BOOKING_REF).getValue() || '').trim();

    sendBookingStatusWhatsapp_(phone, devoteeName, sevaName, sevaDate, bookingRef, newStatus);
  } catch (error) {
    console.error('[Temple] onBookingStatusEdit_ error:', error && error.message ? error.message : String(error));
  }
}

function sendBookingStatusWhatsapp_(phone, devoteeName, sevaName, sevaDate, bookingRef, status) {
  const token = getWhatsappCloudToken_();
  const phoneNumberId = getWhatsappPhoneNumberId_();

  if (!token || !phoneNumberId) {
    return;
  }

  const toNumber = toWhatsappRecipient_(phone);
  if (!toNumber) {
    return;
  }

  const message = buildStatusUpdateMessage_(devoteeName, sevaName, sevaDate, bookingRef, status);
  const endpoint = 'https://graph.facebook.com/v22.0/' + encodeURIComponent(phoneNumberId) + '/messages';
  const payload = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'text',
    text: { body: message }
  };

  UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function buildStatusUpdateMessage_(devoteeName, sevaName, sevaDate, bookingRef, status) {
  const lines = [
    'Seva Booking Status Update',
    '',
    'Booking Reference: ' + (bookingRef || '-'),
    'Seva Date: ' + sevaDate,
    'Seva: ' + sevaName,
    'Devotee: ' + devoteeName,
    '',
    'Status: ' + status
  ];

  if (status === BOOKING_STATUS_CONFIRMED) {
    lines.push('');
    lines.push('Your seva booking is confirmed. Please arrive at the temple on the booked date.');
    lines.push('Jay Sri Ram!');
  }

  return lines.join('\n');
}

// Run this function once from the Apps Script editor to install the
// installable onEdit trigger that fires onBookingStatusEdit_.
function installBookingStatusTrigger() {
  // Remove existing triggers for this handler to avoid duplicates.
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onBookingStatusEdit_') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  const spreadsheetId = getSpreadsheetId_();
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  ScriptApp.newTrigger('onBookingStatusEdit_')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();

  Logger.log('Booking status trigger installed for spreadsheet: ' + spreadsheetId);
}

// Verifies a Google ID token via the tokeninfo API and ensures the
// authenticated user is the permitted admin email.
function verifyAdminToken_(idToken) {
  if (!idToken) {
    throw createBookingError_('ADMIN_UNAUTHORIZED', 'Authentication required.');
  }

  let response;
  try {
    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
    response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  } catch (fetchError) {
    throw createBookingError_('ADMIN_UNAUTHORIZED', 'Could not verify authentication token.');
  }

  if (response.getResponseCode() !== 200) {
    throw createBookingError_('ADMIN_UNAUTHORIZED', 'Invalid or expired authentication token.');
  }

  let tokenData;
  try {
    tokenData = JSON.parse(response.getContentText());
  } catch (parseError) {
    throw createBookingError_('ADMIN_UNAUTHORIZED', 'Could not parse authentication response.');
  }

  const tokenEmail = tokenData && tokenData.email
    ? String(tokenData.email).trim().toLowerCase()
    : '';
  const emailVerified = String(tokenData && tokenData.email_verified || '').toLowerCase() === 'true';

  if (!tokenEmail || !emailVerified) {
    throw createBookingError_('ADMIN_UNAUTHORIZED', 'Authentication token is missing a verified email.');
  }

  if (tokenEmail !== getAdminAllowedEmail_()) {
    throw createBookingError_('ADMIN_FORBIDDEN', 'Access restricted to the temple administrator account.');
  }

  return tokenData;
}

// Reads all bookings from every date-named sheet and returns them
// sorted newest-date first.
function getAdminBookings_(spreadsheet) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const result = [];

  spreadsheet.getSheets().forEach(function (sheet) {
    const name = sheet.getName();
    if (!datePattern.test(name)) {
      return;
    }

    const lastRow = sheet.getLastRow();
    const rows = [];

    if (lastRow >= 2) {
      const data = sheet.getRange(2, 1, lastRow - 1, BOOKING_HEADERS.length).getValues();
      data.forEach(function (row) {
        const createdAt = row[0] instanceof Date ? row[0].toISOString() : String(row[0] || '');
        const bookingRequest = row[1] instanceof Date ? row[1].toISOString() : String(row[1] || '');
        rows.push({
          createdAt: createdAt,
          bookingRequest: bookingRequest,
          sevaDate: normalizeSevaDateValue_(row[2], name),
          sevaId: String(row[3] || ''),
          sevaName: String(row[4] || ''),
          sevaTiming: normalizeSevaTimingValue_(row[5]),
          devoteeName: String(row[6] || ''),
          gotram: String(row[7] || ''),
          phone: String(row[8] || ''),
          slot: Number(row[9]) || 0,
          totalAmount: Number(row[10]) || 0,
          bookingRef: String(row[11] || ''),
          status: String(row[12] || BOOKING_STATUS_SUBMITTED)
        });
      });
    }

    result.push({ date: name, rows: rows });
  });

  result.sort(function (a, b) { return b.date.localeCompare(a.date); });
  return result;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
