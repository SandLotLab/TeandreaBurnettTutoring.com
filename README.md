# TeAndrea Burnett Tutoring Website

Lightweight static tutoring website focused on local SEO and parent-friendly scheduling rules.

## Local preview

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deployment

A GitHub Actions workflow is included at `.github/workflows/deploy.yml` to deploy the static site to GitHub Pages when pushing to `main`.

### Important production recommendation

The booking form currently stores schedule data in browser localStorage as a starter implementation. For real multi-family usage, connect this form to a secure backend calendar/database (for shared availability, audit logs, and privacy-compliant handling of student information).
