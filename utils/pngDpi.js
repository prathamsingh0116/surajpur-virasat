// Adds the PNG pHYs chunk so print software reads the intended DPI.
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function addPngDpiMetadata(png, dpi) {
  if (!Buffer.isBuffer(png) || png.length < 33 || png.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
    throw new TypeError("A valid PNG buffer is required.");
  }
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  const data = Buffer.alloc(9);
  data.writeUInt32BE(pixelsPerMeter, 0);
  data.writeUInt32BE(pixelsPerMeter, 4);
  data.writeUInt8(1, 8); // Unit is pixels per metre.

  const chunk = Buffer.alloc(4 + 4 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write("pHYs", 4, 4, "ascii");
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 17)), 17);

  // Insert pHYs immediately after the 13-byte IHDR chunk.
  return Buffer.concat([png.subarray(0, 33), chunk, png.subarray(33)]);
}

module.exports = { addPngDpiMetadata };
