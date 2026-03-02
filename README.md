# TeAndrea Burnett Tutoring Website

Teacher-owned static website for local tutoring in Troy, Alabama.

## Local preview

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## File structure

- `index.html`, `schedule.html`, `about.html`, `contact.html`, `terms.html`, `privacy.html`, `refund-policy.html`
- `css/styles.css`
- `js/components.js`, `js/main.js`, `js/schedule.js`

## Deployment

GitHub Pages workflow is in `.github/workflows/deploy.yml`.

## Scheduler and payment note

Current booking/payment confirmation is a lightweight front-end flow only. For production-grade scheduling and true payment verification, connect:
1. booking form → backend database/calendar,
2. Cash App or payment provider webhook → confirmation status,
3. admin dashboard for schedule management.
