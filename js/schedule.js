const STORAGE_KEY = 'tb_tutoring_bookings_v3';
const CAPACITY = 5;
const SESSION_PRICE = 25;

// Google Apps Script Web App
const API_URL =
  'https://script.google.com/macros/s/AKfycbwjIo4WFw8txibTsngeazAqBNswy9C0ItMHBQvcb2uJm489WXAqQezfqiKoiL16Ox37/exec';
const API_TOKEN = 'teandreaburnetttutoring';

const bookingForm = document.getElementById('bookingForm');
const dateField = document.getElementById('dateField');
const timeField = document.getElementById('timeField');
const statusField = document.getElementById('formStatus');
const slotsContainer = document.getElementById('timeSlots');
const legend = document.getElementById('slotLegend');

const pendingCard = document.getElementById('pendingPaymentCard');
const pendingDetails = document.getElementById('pendingDetails');
const paidBtn = document.getElementById('markPaidBtn');

const timeSlots = ['15:00', '16:00', '17:00', '18:00'];

// Keep local storage behavior for UI/UX, but treat server as truth for availability
const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let selectedSlot = '';
let pendingBooking = null;

// latest availability from server: { "15:00": n, ... } where n = confirmed bookings
let serverCounts = null;

const today = new Date().toISOString().split('T')[0];
dateField.min = today;
dateField.value = today;

const toLabel = (time) => {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

const getBookingsForLocal = (date, time) =>
  bookings.filter((b) => b.date === date && b.time === time && b.paymentStatus === 'confirmed').length;

const getBookingsForServer = (time) => {
  if (!serverCounts) return 0;
  return Number(serverCounts[time] ?? 0);
};

// If server is available, use it. Otherwise fallback to local (keeps the site functioning even if API is down)
const getBookingsFor = (date, time) => (serverCounts ? getBookingsForServer(time) : getBookingsForLocal(date, time));

function validateDailyLimit(studentName, date) {
  // Prefer server truth when available: block if the student already exists in local confirmed (UX),
  // and rely on server-side enforcement in Apps Script (hard guarantee).
  const total = bookings.filter(
    (b) =>
      b.studentName.toLowerCase() === studentName.toLowerCase() &&
      b.date === date &&
      b.paymentStatus === 'confirmed'
  ).length;
  return total < 1;
}

async function fetchAvailability(date) {
  const url = `${API_URL}?action=availability&date=${encodeURIComponent(date)}&token=${encodeURIComponent(API_TOKEN)}`;
  const res = await fetch(url, { method: 'GET' });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'availability_failed');
  serverCounts = data.counts || {};
}

function renderSlots() {
  const date = dateField.value;
  slotsContainer.innerHTML = '';
  legend.textContent = `Each 1-hour slot has room for up to ${CAPACITY} students.`;

  timeSlots.forEach((time) => {
    const available = CAPACITY - getBookingsFor(date, time);
    const unavailable = available <= 0;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `slot ${unavailable ? 'full' : ''}`;
    btn.disabled = unavailable;
    btn.innerHTML = `<strong>${toLabel(time)}</strong><br/><small>${
      unavailable ? 'Unavailable' : `${available} spots open`
    }</small>`;

    if (!unavailable) {
      btn.addEventListener('click', () => {
        selectedSlot = time;
        timeField.value = time;
        document.querySelectorAll('.slot').forEach((s) => s.classList.remove('active'));
        btn.classList.add('active');
      });
    }

    if (selectedSlot === time) btn.classList.add('active');
    slotsContainer.appendChild(btn);
  });
}

function openCashApp(booking) {
  const note = encodeURIComponent(`Tutoring ${booking.date} ${booking.time} ${booking.studentName}`);
  const cashUrl = `https://cash.app/$tcburnett/${SESSION_PRICE}?note=${note}`;
  window.open(cashUrl, '_blank', 'noopener,noreferrer');
}

async function refreshAvailabilityAndRender() {
  statusField.textContent = 'Loading availability…';
  try {
    await fetchAvailability(dateField.value);
    statusField.textContent = '';
  } catch {
    // keep local mode if server fails
    serverCounts = null;
    statusField.textContent = '';
  }
  renderSlots();
}

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(bookingForm);
  const data = Object.fromEntries(formData.entries());

  if (!selectedSlot) {
    statusField.textContent = 'Please choose an available 1-hour time slot.';
    return;
  }

  if (!validateDailyLimit(data.studentName, data.date)) {
    statusField.textContent = 'A student can only book one 1-hour session per day.';
    return;
  }

  // refresh before checking availability (prevents stale UI)
  await refreshAvailabilityAndRender();

  const available = CAPACITY - getBookingsFor(data.date, selectedSlot);
  if (available <= 0) {
    statusField.textContent = 'That slot is no longer available. Please pick another.';
    renderSlots();
    return;
  }

  pendingBooking = {
    ...data,
    duration: 60,
    price: SESSION_PRICE,
    time: selectedSlot,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString()
  };

  openCashApp(pendingBooking);

  pendingCard.hidden = false;
  pendingDetails.textContent = `${data.studentName} · ${data.date} at ${toLabel(selectedSlot)} · $${SESSION_PRICE}`;
  statusField.textContent =
    'Cash App opened in a new tab. After payment, click "I sent payment" to confirm your booking.';
});

paidBtn?.addEventListener('click', async () => {
  if (!pendingBooking) return;

  statusField.textContent = 'Confirming booking…';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: API_TOKEN, ...pendingBooking })
    });

    const data = await res.json();

    if (!data.ok) {
      if (data.error === 'slot_full') statusField.textContent = 'That slot just filled up. Pick another time.';
      else if (data.error === 'student_already_booked')
        statusField.textContent = 'A student can only book one 1-hour session per day.';
      else statusField.textContent = 'Booking failed. Please try again.';

      await refreshAvailabilityAndRender();
      return;
    }

    // Keep your existing local UX (confirmed bookings cached in this browser)
    bookings.push({ ...pendingBooking, paymentStatus: 'confirmed', confirmedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));

    statusField.textContent = 'Booking confirmed. Thank you! You will receive follow-up by email.';
    bookingForm.reset();
    dateField.value = today;
    selectedSlot = '';
    timeField.value = '';
    pendingCard.hidden = true;
    pendingBooking = null;

    await refreshAvailabilityAndRender();
  } catch {
    statusField.textContent = 'Booking failed. Please try again.';
  }
});

[dateField].forEach((el) =>
  el.addEventListener('change', async () => {
    selectedSlot = '';
    timeField.value = '';
    await refreshAvailabilityAndRender();
  })
);

// initial load
refreshAvailabilityAndRender();