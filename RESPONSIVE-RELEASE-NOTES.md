# Responsive Release Notes — Surajpur Virasat v1.1.0

## Included
- Safe-area-aware viewport and fixed header for iPhone notch / Dynamic Island.
- Safe-area-aware mobile bottom navigation for home-indicator devices.
- Compact-width header and location selector for 320–390 CSS px screens.
- Responsive hero, 2-column visitor actions, cards, gallery, map iframe and dialogs.
- Tablet and landscape-phone layout rules.
- Branded loading screen with a 2.2-second maximum fallback.
- Smooth native scrolling, light IntersectionObserver reveal animations, and reduced-motion support.
- Modal background scroll lock for touch devices.
- Horizontally scrollable admin navigation and data tables rather than page-wide overflow.

## Manual QA suggestions
Use browser responsive mode at 320x700, 360x780, 390x844, 430x932, 768x1024, 820x1180 and 1024x768. Check: no page-level horizontal scrollbar; four hero actions remain visible; location selector remains usable; mobile bottom navigation doesn't overlap content; dialogs scroll internally; the map scales to the content width; reduced-motion mode removes reveal and smooth-scroll animations.

Real-device validation is still recommended on iOS Safari and Android Chrome, including one low-memory phone and iPad split-screen mode.
