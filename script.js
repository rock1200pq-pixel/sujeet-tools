// ============================================================
//  SUJEET TOOLS — script.js (Fixed Version)
//  Bugs Fixed:
//  1. resizeImage naam clash → resizeImageFn() rename kiya
//  2. extractText() function add kiya (missing tha)
//  3. pngToJpg() mein file validation add kiya
//  4. resizeImageFn() mein file + dimension validation add kiya
//  5. generateQR() mein empty input check add kiya
//  6. Coming Soon functions clearly mark kiye
// ============================================================


// ── COMING SOON functions (disabled buttons hain, yeh call nahi honge) ──

function mergePDF() {
  // Coming soon — pdf-lib.js se implement karna hoga
  alert("Merge PDF — Coming Soon! 🚧");
}

function splitPDF() {
  alert("Split PDF — Coming Soon! 🚧");
}

function compressImage() {
  alert("Image Compress — Coming Soon! 🚧");
}

function imageToPDF() {
  alert("Image to PDF — Coming Soon! 🚧");
}

function jpgToPNG() {
  alert("JPG to PNG — Coming Soon! 🚧");
}

function pdfToJpg() {
  alert("PDF to JPG — Coming Soon! 🚧");
}


// ── QR GENERATOR ──

function generateQR() {
  let text = document.getElementById("qrtext").value.trim();

  // FIX: empty input check
  if (!text) {
    alert("Pehle kuch text ya URL type karo!");
    return;
  }

  document.getElementById("qr").innerHTML =
    "<img src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
    encodeURIComponent(text) +
    "' alt='QR Code'>";
}


// ── PNG TO JPG ──

function pngToJpg() {
  let file = document.getElementById("pngFile").files[0];

  // FIX: file validation
  if (!file) {
    alert("Pehle ek PNG file select karo!");
    return;
  }

  let img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function () {
    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    // White background fill karo (PNG transparency ke liye)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    let link = document.createElement("a");
    link.download = "converted.jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
    URL.revokeObjectURL(img.src);
  };
  img.onerror = function () {
    alert("Image load nahi hui. Valid PNG file select karo.");
  };
}


// ── RESIZE IMAGE ──
// FIX: Function rename kiya resizeImage() → resizeImageFn()
// Kyunki input ka id="resizeInput" tha aur function naam same tha

function resizeImageFn() {
  // FIX: Updated id "resizeInput" se read karo
  let file = document.getElementById("resizeInput").files[0];
  let width = parseInt(document.getElementById("resizeWidth").value);
  let height = parseInt(document.getElementById("resizeHeight").value);

  // FIX: Validation — file aur dimensions check
  if (!file) {
    alert("Pehle ek image file select karo!");
    return;
  }
  if (!width || !height || width <= 0 || height <= 0) {
    alert("Valid width aur height enter karo (0 se zyada)!");
    return;
  }

  let img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function () {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    let link = document.createElement("a");
    link.download = "resized.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    URL.revokeObjectURL(img.src);
  };
  img.onerror = function () {
    alert("Image load nahi hui. Valid image file select karo.");
  };
}


// ── PASSWORD GENERATOR ──

function generatePassword() {
  let chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$!%^&*";
  let password = "";
  for (let i = 0; i < 14; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  document.getElementById("passwordResult").innerText = "🔑 " + password;
}


// ── IMAGE TEXT → EXCEL (OCR) ──
// FIX: extractText() function add kiya — pehle define hi nahi tha!
// Tesseract.js se text extract karta hai

async function extractText() {
  let file = document.getElementById("ocr").files[0];

  if (!file) {
    alert("Pehle ek image file select karo!");
    return;
  }

  let resultEl = document.getElementById("ocrResult");
  resultEl.innerText = "⏳ Processing... please wait";

  try {
    const { data: { text } } = await Tesseract.recognize(file, "eng");

    if (!text.trim()) {
      resultEl.innerText = "⚠️ Koi text nahi mila image mein.";
      return;
    }

    // Text ko CSV mein convert karo
    let rows = text.split("\n").filter((r) => r.trim() !== "");
    let csv = rows
      .map((row) => row.trim().split(/\s{2,}/).join(","))
      .join("\n");

    let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "extracted_text.csv";
    link.click();

    resultEl.innerText = "✅ CSV downloaded!";
  } catch (err) {
    resultEl.innerText = "❌ Error: " + err.message;
  }
}


// ── IMAGE TABLE → EXCEL (OCR) ──

async function tableToExcel() {
  let file = document.getElementById("tableImage").files[0];

  if (!file) {
    alert("Pehle ek image file upload karo!");
    return;
  }

  let resultEl = document.getElementById("tableResult");
  resultEl.innerText = "⏳ Processing table...";

  try {
    const { data: { text } } = await Tesseract.recognize(file, "eng");

    let rows = text.split("\n").filter((r) => r.trim() !== "");
    let csv = "";
    rows.forEach((row) => {
      let cols = row.trim().split(/\s{2,}/);
      csv += cols.join(",") + "\n";
    });

    let blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "table.csv";
    link.click();

    resultEl.innerText = "✅ Excel (CSV) downloaded!";
  } catch (err) {
    resultEl.innerText = "❌ Error: " + err.message;
  }
}
