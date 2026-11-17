const QRCode = require("qrcode");
const Checkpoint = require("../models/Checkpoint");
const { addPngDpiMetadata } = require("../utils/pngDpi");

function getTargetUrl(req, slug, lang) {
  const base = process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const target = new URL(`/location/${encodeURIComponent(slug)}`, base);
  target.searchParams.set("lang", lang);
  return target.toString();
}

async function getCheckpoint(req, res) {
  const checkpoint = await Checkpoint.findOne({ slug: req.params.slug, active: true }).lean();
  if (!checkpoint) {
    res.status(404).type("text/plain").send("Active QR location not found.");
    return null;
  }
  return checkpoint;
}

exports.svg = async (req, res) => {
  const checkpoint = await getCheckpoint(req, res);
  if (!checkpoint) return;
  const lang = req.query.lang === "hi" ? "hi" : "en";
  const url = getTargetUrl(req, checkpoint.slug, lang);
  let svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 4,
    color: { dark: "#052e16", light: "#ffffff" }
  });
  // Set physical print dimensions; the SVG remains resolution-independent.
  svg = svg.replace(/width="[^"]+"/, 'width="50mm"').replace(/height="[^"]+"/, 'height="50mm"');
  const safeSlug = checkpoint.slug.replace(/[^a-z0-9-]/g, "-");
  res.set({
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Content-Disposition": `attachment; filename="surajpur-virasat-${safeSlug}-qr.svg"`,
    "Cache-Control": "private, max-age=300"
  }).send(svg);
};

exports.png = async (req, res) => {
  const checkpoint = await getCheckpoint(req, res);
  if (!checkpoint) return;
  const lang = req.query.lang === "hi" ? "hi" : "en";
  const url = getTargetUrl(req, checkpoint.slug, lang);
  const requestedDpi = Number.parseInt(req.query.dpi, 10) || 1600;
  const dpi = Math.min(2400, Math.max(1200, requestedDpi));
  const requestedMm = Number.parseInt(req.query.size, 10) || 50;
  const sizeMm = Math.min(80, Math.max(30, requestedMm));
  const width = Math.round((sizeMm / 25.4) * dpi);
  const png = await QRCode.toBuffer(url, {
    type: "png",
    width,
    errorCorrectionLevel: "H",
    margin: 4,
    color: { dark: "#052e16", light: "#ffffff" }
  });
  const printReady = addPngDpiMetadata(png, dpi);
  const safeSlug = checkpoint.slug.replace(/[^a-z0-9-]/g, "-");
  res.set({
    "Content-Type": "image/png",
    "Content-Length": String(printReady.length),
    "Content-Disposition": `attachment; filename="surajpur-virasat-${safeSlug}-qr-${dpi}dpi.png"`,
    "X-QR-DPI": String(dpi),
    "X-QR-PRINT-SIZE-MM": String(sizeMm),
    "Cache-Control": "private, max-age=300"
  }).send(printReady);
};
