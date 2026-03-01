const STORAGE_KEY = 'tb_tutoring_bookings_v1';
const CAPACITY = 5;
const timeSlots = [];
for (let h = 15; h < 19; h++) {
  timeSlots.push(`${String(h).padStart(2, '0')}:00`);
  timeSlots.push(`${String(h).padStart(2, '0')}:30`);
}

const bookingForm = document.getElementById('bookingForm');
const dateField = document.getElementById('dateField');
const durationField = document.getElementById('durationField');
const timeField = document.getElementById('timeField');
const statusField = document.getElementById('formStatus');
const subject2 = document.getElementById('subject2');
const slotsContainer = document.getElementById('timeSlots');
const legend = document.getElementById('slotLegend');

const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let selectedSlot = '';

const today = new Date().toISOString().split('T')[0];
dateField.min = today;
dateField.value = today;

const toLabel = (time) => {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};

const getBookingsFor = (date, time) => bookings.filter((b) => b.date === date && b.time === time).length;

const slotRequired = () => Number(durationField.value) / 30;

function renderSlots() {
  const date = dateField.value;
  const need = slotRequired();
  slotsContainer.innerHTML = '';

  legend.textContent = `Selected date: ${date}. ${need === 2 ? '1 hour session needs this slot + next slot.' : '30 minute session.'}`;

  timeSlots.forEach((time, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot';

    const availableNow = CAPACITY - getBookingsFor(date, time);
    let unavailable = availableNow <= 0;

    if (need === 2) {
      const next = timeSlots[index + 1];
      if (!next) unavailable = true;
      else {
        const availableNext = CAPACITY - getBookingsFor(date, next);
        unavailable = unavailable || availableNext <= 0;
      }
    }

    btn.innerHTML = `<strong>${toLabel(time)}</strong><br/><small>${unavailable ? 'Unavailable' : `${availableNow} spots`}</small>`;

    if (unavailable) {
      btn.classList.add('full');
      btn.disabled = true;
    } else {
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

function validateSubjects() {
  const d = Number(durationField.value);
  if (d === 30 && subject2.value) {
    return 'For 30-minute sessions, choose only one subject.';
  }
  if (d === 60 && subject2.value && subject2.value === document.getElementById('subject1').value) {
    return 'For a split 1-hour session, choose two different subjects or leave secondary as None.';
  }
  return '';
}

function validateDailyLimit(studentName, date, duration) {
  const total = bookings
    .filter((b) => b.studentName.toLowerCase() === studentName.toLowerCase() && b.date === date)
    .reduce((sum, b) => sum + Number(b.duration), 0);
  return total + duration <= 60;
}

function blockSlotsNeeded(date, time, duration) {
  const idx = timeSlots.indexOf(time);
  if (idx < 0) return false;
  const needed = duration / 30;
  for (let i = 0; i < needed; i++) {
    const t = timeSlots[idx + i];
    if (!t || getBookingsFor(date, t) >= CAPACITY) return false;
  }
  return true;
}

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(bookingForm);
  const data = Object.fromEntries(formData.entries());
  data.duration = Number(data.duration);

  const subjectError = validateSubjects();
  if (subjectError) {
    statusField.textContent = subjectError;
    return;
  }

  if (!selectedSlot) {
    statusField.textContent = 'Please choose an available time slot.';
    return;
  }

  if (!validateDailyLimit(data.studentName, data.date, data.duration)) {
    statusField.textContent = 'Booking denied: a student can only be booked for 1 hour per day.';
    return;
  }

  if (!blockSlotsNeeded(data.date, selectedSlot, data.duration)) {
    statusField.textContent = 'That slot is no longer available. Please choose another time.';
    renderSlots();
    return;
  }

  data.time = selectedSlot;
  data.createdAt = new Date().toISOString();

  const firstEntry = { ...data, duration: 30, time: selectedSlot };
  bookings.push(firstEntry);
  if (data.duration === 60) {
    const nextSlot = timeSlots[timeSlots.indexOf(selectedSlot) + 1];
    bookings.push({
      ...data,
      duration: 30,
      time: nextSlot,
      continuation: true,
      subject1: data.subject2 || data.subject1,
      subject2: ''
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  statusField.textContent = 'Booking submitted! Please send payment via Cash App to confirm.';
  bookingForm.reset();
  dateField.value = today;
  selectedSlot = '';
  timeField.value = '';
  renderSlots();
});

[dateField, durationField].forEach((el) => el.addEventListener('change', () => {
  selectedSlot = '';
  timeField.value = '';
  renderSlots();
}));

renderSlots();
