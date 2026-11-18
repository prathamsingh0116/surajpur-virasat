# Surajpur Virasat Explorer — Node.js + MongoDB

This project converts the supplied single-file tourist website into a modular Express, EJS and MongoDB application, following the Sairam Herbals-style separation of routes, controllers, models, middleware, views and public assets.

## Stack
- Node.js 20+
- Express.js
- MongoDB + Mongoose
- EJS templates
- express-session + connect-mongo
- connect-flash
- bcryptjs for admin password hashing
- Tailwind CDN, custom CSS, Lucide icons, QRCode.js
- Browser Web Speech API (automatic Hindi/English voice selection, sentence-sized narration chunks and pause/resume; available voices depend on the visitor’s device/browser)
- Server-side QR generation (`qrcode`) with vector SVG and print-ready 1200–2400 DPI PNG metadata

## 1. Prerequisites
Install:
- Node.js (20 LTS or newer)
- MongoDB Community Server locally OR create a MongoDB Atlas database
- VS Code (recommended)

## 2. Configure environment
1. Rename `.env.example` to `.env`.
2. Set `MONGO_URI` to your local or Atlas connection string.
3. Change `SESSION_SECRET`.
4. Optionally set `APP_BASE_URL` to your public website URL after deployment; leave it blank for local development.
5. On the Windows network used during local Atlas development, set `USE_PUBLIC_DNS=true` only if Node.js SRV DNS lookups fail. Do not set this in Render.

Example local MongoDB:
```
MONGO_URI=mongodb://127.0.0.1:27017/tamor_pingla
```

Example Atlas format:
```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/tamor_pingla
```
Do not commit `.env` or share your database password.

## 3. Install and initialise the database
Open terminal in the project folder:

```
npm install
npm run seed
npm run enrich-content
npm run dev
```

- `npm run seed` is for a fresh database. It inserts starter content only into empty collections. It does not create a default administrator unless both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are explicitly provided.
- `npm run enrich-content` adds/updates the curated location histories, source references, railway notes and 20 gallery entries. It is safe to re-run for these known image URLs and checkpoint slugs, but run it before making your own edits to those same records.
- For an existing database, keep the same `MONGO_URI` and do not drop collections or reseed. Use the first-admin script below if the Atlas `Admin` collection is empty.

Open:
- Tourist website: http://localhost:3000
- Admin login: http://localhost:3000/admin/login

Use the secure one-time `npm run admin:create` command below to create the first administrator in the Atlas database. The script refuses to create a duplicate account and does not modify existing content.

## 4. Production
```
npm start
```
For Render:
- Create a **Web Service** from your Git repository.
- Build command: `npm install`
- Start command: `npm start`
- Add `MONGO_URI` and `SESSION_SECRET` as environment variables. Set `APP_BASE_URL` to your final public URL (for example `https://your-service.onrender.com`) so printed QR codes keep using the correct domain. The admin is created separately with `npm run admin:create` from a trusted local terminal connected to Atlas.
- Set `NODE_ENV=production`.
- Use a persistent MongoDB Atlas database and add only the outbound IP ranges shown in the Render service's Connect → Outbound panel to Atlas Network Access. Do not use `0.0.0.0/0` for production.
- Do not upload your `.env` file or commit database credentials to Git.
- The service uses the `PORT` provided by Render automatically.

## 5. Folder structure
```
tamor-pingla-node/
├── app.js
├── config/db.js
├── controllers/
├── middleware/
├── models/
├── routes/
├── scripts/seed.js
├── utils/seedData.js
├── views/
│   ├── layouts/boilerplate.ejs
│   ├── partials/
│   ├── home/
│   ├── admin/
│   └── auth/
├── public/
│   ├── css/style.css
│   └── js/app.js
├── .env.example
└── package.json
```

## 6. MongoDB collections
- `sanctuaries`: hero, bilingual descriptions, geography, Ramkola centre, distances and map settings
- `wildlifes`: wildlife records
- `floras`: vegetation records
- `galleries`: photo gallery entries
- `checkpoints`: QR checkpoint names and descriptions
- `emergencycontacts`: emergency phone numbers and verification status
- `admins`: hashed admin credentials
- `sessions`: server-side sessions

## 7. Admin content management
Sign in at `/admin/login`. The dashboard lets an admin manage:
- Sanctuary profile
- Wildlife
- Flora
- Gallery
- QR checkpoints
- Emergency contacts

Each record can be activated/deactivated, sorted and marked as verified where applicable.

## 8. QR checkpoint URLs
After deployment, the QR generator creates URLs using the configured public website host:
- `/location/gate?lang=en`
- `/location/ramkola?lang=hi`
- `/location/moran?lang=en`
- `/location/watchtower?lang=hi`

Print downloads:
- **SVG:** vector artwork, resolution-independent; preferred for professional printing.
- **PNG:** 1600 DPI metadata by default, 50 mm print size, high error correction (H), and a four-module quiet zone.
- The PNG route accepts DPI from 1200 to 2400 and a print size from 30 to 80 mm. Use the PNG · 1600 DPI or SVG links beside a location in Admin → Checkpoints to download its QR.

Set `APP_BASE_URL` to the final public domain and generate QR stickers only after deployment. A QR created from localhost will only work on your own machine/network. Keep checkpoint slugs unchanged after printing stickers.

## 9. Research, photo and visitor-safety notes
The location content was expanded using the Surajpur District Government, Divisional Commissioner Surguja, Government of India CAMPA material, PIB and Chhattisgarh Janman. Wikipedia is included only as a secondary reference for geographic context where official sources are less detailed. The archived 2020 Tamor Hill report is explicitly treated as an unverified heritage lead, not as archaeological proof.

The main sources currently describe: (a) Tamor Pingla at Ramkola village, named for Tamor Hills and the Pingla River, approximately 90 km from the Surajpur district headquarters, with Surajpur listed as the nearest railway station; (b) the Pingla Elephant Rescue and Rehabilitation Centre project initiated in 2017–18, with historical CAMPA investment figures; and (c) Guru Ghasidas–Tamor Pingla Tiger Reserve notification in November 2024. The centre's present operating status and visitor access must be confirmed with the Forest Department.

**Rail distance caveat:** A third-party Census-based village reference estimates about 42 km straight-line from Ramkola village to Surajpur Road station. This is not road distance and is not a measured route to every QR checkpoint. Location pages display this only as a clearly labelled village-level straight-line reference (~42 km*). The road distance to each individual QR checkpoint is not published/verified in the sources reviewed; use the separate station-route link to calculate a live route in Google Maps. The current-location Directions buttons use the visitor's browser location and Google Maps to calculate a route. Browser geolocation needs visitor permission and a secure context (localhost or HTTPS). Coordinates are not sent to this Node server.

**Gallery photo caveat:** Exactly 20 reference photographs are configured in the starter gallery. Six are Unsplash sample images and fourteen are Wikimedia Commons species/forest reference photos with photographer, licence and source attribution displayed below each image. They are **not confirmed photographs taken at Tamor Pingla** and must not be presented as actual sanctuary sightings. Replace them with authorised local photographs before a public tourism launch. The stock hero images are also illustrative.

The emergency number 112 is the general Indian emergency number; other phone numbers came from the supplied original HTML and remain unverified. Do not rely on those non-emergency contacts until the Forest Department confirms them. Check entry permission, fees, hours, guides, access restrictions, and all current wildlife information with the Forest Department before public launch.


## Location-wise QR visitor experience

- Every saved checkpoint has a permanent public page at `/location/:slug`. Deactivated checkpoints are removed from the Explore dropdown but their already-printed QR links continue to open.
- QR files are downloaded from Admin → Checkpoints, and each printed code points to the matching location page.
- The public location dropdown lets visitors move to any other active checkpoint or back to the main sanctuary without scanning another QR.
- Each location page displays its own name, history, a source-grounded story, visitor safety tips, optional hero image/map and only the gallery photos assigned to that checkpoint.
- Railway information identifies Surajpur Road (SJPR), shows the ~42 km figure only as a Ramkola-village straight-line reference, and does not misrepresent it as the road distance to every QR checkpoint. The separate Google Maps route link starts at the station and calculates the route to the selected place.
- The Directions action asks the visitor's browser for permission to use their current location and opens a Google Maps route to the selected QR location. A separate link can open a route beginning at Surajpur Road station.
- The main sanctuary and every location page show only four prominent visitor actions: Listen Audio Tour, Directions, SOS and Share. The audio button toggles pause/resume; narration automatically selects a suitable Hindi or English voice available on the visitor’s device.
- In Admin → Checkpoints, add/edit a location and maintain its English/Hindi overview, history, story, safety tips, destination, railway information, source references, hero image and map links.
- In Admin → Gallery, select the location that each photo belongs to. Add photographer credit, licence and source URL. Tick “This photograph was actually taken at Tamor Pingla” only for an authentic local photo; do not tick it for illustrative reference images. Choose “Main sanctuary gallery” for general sanctuary photos.
- Do not permanently delete QR checkpoints or change their slugs after printing. Deactivate a checkpoint to hide it from Explore while keeping old QR stickers usable.
- Existing gallery records without a `checkpointSlug` continue to appear in the main sanctuary gallery. No database reset or reseed is required.

**Important:** Existing checkpoint records are preserved. Open Admin → Checkpoints → Edit for each location to add the detailed information, safety tips and map URLs. Add or edit gallery photos and assign each to the correct location. The QR URL must use the same permanent slug; avoid changing a slug after printing QR stickers.


## Simplified visitor interface

- The visitor header contains the brand, language switch and theme toggle. The location selector stays in a compact strip so visitors can move between places without scanning again.
- The main hero keeps only four prominent actions: Listen Audio Tour, Directions, SOS and Share. Audio narration uses the browser's best available matching voice and can be paused/resumed using the same button.
- Sanctuary information is organised into expandable sections to keep the first screen uncluttered.
- QR printing is kept in the protected Admin → Checkpoints list rather than the public visitor homepage.


## Surajpur Virasat district content update

The public brand is **Surajpur Virasat — Heritage · Nature · Stories**. The curated location list includes Tamor Pingla, Ramkola Elephant Rescue project, Moran, Tamor Hill, Kudargarh, Rakasganda, Sita Lekhni/Lakshman Paon, Baank Kund, Baijnath Paat, Sarasor, Khopa Devta, Lakshman Paen, Tropic of Cancer (Bhaisamunda), Shivpur Turra, Rashtrapati Bhavan (Pandonagar), Mahamaya Temple (Devipur), Kumeli Waterfall, Kenapara, Pahargaon, Rameshwar Nagar, Gadhautiya Devi Dham, Mata Rajmohini Devi Memorial, Hanuman Temple and Dugdugi Stone.

After copying your existing .env, run npm install, then npm run enrich-content, then npm run dev. The enrichment command upserts QR places and gallery records by (image URL + checkpoint slug), so the same reference image can be associated with different place galleries without collisions. Do not run the initial seed command against an existing production database.

### Photo provenance
The Surajpur district landing page and each QR destination are seeded with 20 gallery records. Official District Surajpur website photographs are included for Kudargarh, Shivpur Shiva Temple and Mahamaya Temple where published. Other entries are illustrative reference images and are explicitly labelled as not verified photos of the exact destination. Government-site images may have reuse restrictions; obtain written permission or replace them with your own authorised photographs before public launch.

### Historical accuracy
Descriptions distinguish official district/divisional facts from local religious traditions and approximate attributions. Distances shown by the divisional authority are from Surajpur district headquarters, not railway distances. The station link opens a live Google Maps route; no unverified railway kilometre figure is displayed.



## Production deployment on Render

This repository is structured so its project files (`app.js`, `package.json`, and `render.yaml`) live at the repository root. Do not leave them nested inside an extra `tamor-pingla-node/` directory unless you also configure Render's Root Directory accordingly.

1. Push the contents of this project folder to a GitHub repository. Do not commit `.env`, `node_modules/`, database dumps, or credentials.
2. In MongoDB Atlas, create a production database user and database, then allow the outbound IP addresses shown for your Render web service in Atlas Network Access. For a temporary connectivity test only, Atlas supports `0.0.0.0/0`; this exposes the cluster to connection attempts from any IP and should be replaced with narrower rules as soon as practical.
3. In Render, choose **New → Blueprint** and connect the repository containing `render.yaml`, or choose **New → Web Service** with build command `npm install` and start command `npm start`. The blueprint creates a Free web service named `surajpur-virasat-explorer`.
4. Add these environment variables in Render: `NODE_ENV=production`, `MONGO_URI` (Atlas connection string), and `SESSION_SECRET` (long random value). Add `APP_BASE_URL` after Render assigns the service URL. Do not use the sample local `.env` values in production.
5. Deploy. The service uses Render's `PORT`, binds to `0.0.0.0`, and exposes `/healthz` for health checks.
6. After Render assigns the public `https://....onrender.com` URL, set `APP_BASE_URL` to that exact URL without a trailing slash and redeploy. Generate and print QR codes only after this value is set.
7. Test `/healthz`, `/`, at least two `/location/<slug>` pages, `/admin/login`, and both QR download endpoints.

### Database content and admin account

Use your existing Atlas database and preserve its data. If this is a brand-new empty Atlas database, run `npm run seed` once and then `npm run enrich-content` from a trusted local terminal. Create the administrator separately with `npm run admin:create`. For an existing populated database, do not reseed or enrich content that is already present. Do not run scripts repeatedly without reviewing the data-upsert behavior.

### Free plan note

Render Free web services spin down after 15 minutes without inbound traffic and can take about a minute to wake on the next request. Their filesystem is ephemeral. MongoDB Atlas is the persistent database; do not rely on writing visitor uploads to the Render local filesystem.


## Reference-style visitor interface and first administrator

The public home page and each QR destination now render through `views/home/explorer.ejs`. It follows the supplied reference structure: fixed brand header, language/theme/QR controls, location quick bar, large hero with four primary visitor actions, metric strip, desktop tabs, mobile bottom navigation, gallery lightbox, SOS and QR modals. All location, wildlife, flora, gallery, railway and emergency contact content is still loaded from MongoDB.

### Create the first administrator in the existing Atlas database

Do not run the seed command just to create an administrator. The first account is created with a dedicated one-time CLI script that refuses local MongoDB URIs and refuses to create a duplicate account. Ensure your local `.env` points to the Atlas `tamor_pingla` database first.

In PowerShell from the project folder:

```powershell
$env:BOOTSTRAP_ADMIN_NAME = Read-Host "Admin name"
$env:BOOTSTRAP_ADMIN_EMAIL = Read-Host "Admin email"
$secure = Read-Host "New admin password (12+ characters)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:BOOTSTRAP_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  npm run admin:create
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  Remove-Item Env:BOOTSTRAP_ADMIN_NAME,Env:BOOTSTRAP_ADMIN_EMAIL,Env:BOOTSTRAP_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Variable secure -ErrorAction SilentlyContinue
}
```

The script creates only the first admin if no admin exists. It hashes the password with bcrypt and never prints it. It does not update or delete any location, gallery, wildlife, flora or other content documents. After creation, use `/admin/login`.

On Windows, the app uses Google DNS by default because this development network refused Node.js SRV queries. Set `USE_PUBLIC_DNS=false` in `.env` to use the Windows system resolver instead. Render runs on Linux and uses its default DNS resolver.
