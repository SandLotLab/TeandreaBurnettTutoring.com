const STORAGE_KEY = 'tb_tutoring_bookings_v2';
const CAPACITY = 5;
const SESSION_PRICE = 25;

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
const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let selectedSlot = '';
let pendingBooking = null;

const today = new Date().toISOString().split('T')[0];
dateField.min = today;
dateField.value = today;

const toLabel = (time) => {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

const getBookingsFor = (date, time) =>
  bookings.filter((b) => b.date === date && b.time === time && b.paymentStatus === 'confirmed').length;

function validateDailyLimit(studentName, date) {
  const total = bookings.filter(
    (b) =>
      b.studentName.toLowerCase() === studentName.toLowerCase() &&
      b.date === date &&
      b.paymentStatus === 'confirmed'
  ).length;
  return total < 1;
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
    btn.innerHTML = `<strong>${toLabel(time)}</strong><br/><small>${unavailable ? 'Unavailable' : `${available} spots open`}</small>`;

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

bookingForm.addEventListener('submit', (e) => {
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
  statusField.textContent = 'Cash App opened in a new tab. After payment, click "I sent payment" to confirm your booking.';
});

paidBtn?.addEventListener('click', () => {
  if (!pendingBooking) return;

  bookings.push({ ...pendingBooking, paymentStatus: 'confirmed', confirmedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));

  statusField.textContent = 'Booking confirmed. Thank you! You will receive follow-up by email.';
  bookingForm.reset();
  dateField.value = today;
  selectedSlot = '';
  timeField.value = '';
  pendingCard.hidden = true;
  pendingBooking = null;
  renderSlots();
});

[dateField].forEach((el) =>
  el.addEventListener('change', () => {
    selectedSlot = '';
    timeField.value = '';
    renderSlots();
  })
);

renderSlots();
