// ============================================================
//  SUJEET TOOLS — script.js (All Tools Working)
// ============================================================

// ── File label update karo jab file choose ho ──
function updateLabel(input, labelId) {
  const label = document.getElementById(labelId);
  if (!label) return;
  if (input.files.length === 1) {
    label.innerText = input.files[0].name;
  } else if (input.files.length > 1) {
    label.innerText = input.files.length + ' files selected';
  } else {
    label.innerText = 'Choose file...';
  }
}

function setResult(id, msg, isError) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = msg;
  el.style.color = isError ? '#ff6b6b' : '#4ade80';
}

// ── File ko ArrayBuffer mein convert karo ──
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}

// ── File ko DataURL mein convert karo ──
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

// ── Blob download karo ──
function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}


// ════════════════════════════════════════════
// 1. MERGE PDF
// ════════════════════════════════════════════
async function mergePDF() {
  const files = document.getElementById('mergeFiles').files;
  if (files.length < 2) {
    setResult('mergeResult', '⚠️ Kam se kam 2 PDF files select karo!', true);
    return;
  }
  setResult('mergeResult', '⏳ Merging...');
  try {
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const bytes = await readFileAsArrayBuffer(files[i]);
      const pdf = await PDFLib.PDFDocument.load(bytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
    }
    const pdfBytes = await mergedPdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'merged.pdf');
    setResult('mergeResult', '✅ merged.pdf download ho gaya!');
  } catch (err) {
    setResult('mergeResult', '❌ Error: ' + err.message, true);
  }
}


// ════════════════════════════════════════════
// 2. SPLIT PDF
// ════════════════════════════════════════════
async function splitPDF() {
  const file = document.getElementById('splitFile').files[0];
  const from = parseInt(document.getElementById('splitFrom').value);
  const to = parseInt(document.getElementById('splitTo').value);

  if (!file) { setResult('splitResult', '⚠️ PDF file select karo!', true); return; }
  if (!from || !to || from < 1 || to < from) {
    setResult('splitResult', '⚠️ Valid page range enter karo (From <= To)', true); return;
  }
  setResult('splitResult', '⏳ Splitting...');
  try {
    const bytes = await readFileAsArrayBuffer(file);
    const srcPdf = await PDFLib.PDFDocument.load(bytes);
    const totalPages = srcPdf.getPageCount();
    const actualTo = Math.min(to, totalPages);

    const newPdf = await PDFLib.PDFDocument.create();
    // Page indices 0-based hain, isliye -1
    const indices = Array.from({ length: actualTo - from + 1 }, (_, i) => from - 1 + i);
    const pages = await newPdf.copyPages(srcPdf, indices);
    pages.forEach(p => newPdf.addPage(p));

    const pdfBytes = await newPdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), `split_page${from}-${actualTo}.pdf`);
    setResult('splitResult', `✅ Pages ${from}–${actualTo} download ho gayi!`);
  } catch (err) {
    setResult('splitResult', '❌ Error: ' + err.message, true);
  }
}


// ════════════════════════════════════════════
// 3. IMAGE COMPRESS
// ════════════════════════════════════════════
function compressImage() {
  const file = document.getElementById('compressFile').files[0];
  const quality = parseInt(document.getElementById('quality').value) / 100;

  if (!file) { setResult('compressResult', '⚠️ Image file select karo!', true); return; }
  setResult('compressResult', '⏳ Compressing...');

  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      const origKB = (file.size / 1024).toFixed(1);
      const newKB = (blob.size / 1024).toFixed(1);
      const saved = (((file.size - blob.size) / file.size) * 100).toFixed(0);
      downloadBlob(blob, 'compressed.' + (file.name.split('.').pop() || 'jpg'));
      setResult('compressResult', `✅ ${origKB}KB → ${newKB}KB (${saved}% saved)`);
      URL.revokeObjectURL(img.src);
    }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
  };
  img.onerror = () => setResult('compressResult', '❌ Image load nahi hui', true);
}


// ════════════════════════════════════════════
// 4. IMAGE TO PDF
// ════════════════════════════════════════════
async function imageToPDF() {
  const files = document.getElementById('imgpdfFiles').files;
  if (files.length === 0) { setResult('imgpdfResult', '⚠️ Kam se kam 1 image select karo!', true); return; }
  setResult('imgpdfResult', '⏳ Converting...');
  try {
    const pdf = await PDFLib.PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const dataUrl = await readFileAsDataURL(files[i]);
      const convCanvas = document.createElement('canvas');
const convImg = new Image();
convImg.src = dataUrl;
await new Promise(r => { convImg.onload = r; });
convCanvas.width = convImg.width;
convCanvas.height = convImg.height;
convCanvas.getContext('2d').drawImage(convImg, 0, 0);
const jpgDataUrl = convCanvas.toDataURL('image/jpeg', 0.95);
const base64 = jpgDataUrl.split(',')[1];
const img = await pdf.embedJpg(
  Uint8Array.from(atob(base64), c => c.charCodeAt(0))
);
```

---

**Visual guide:**
```
Line 158: const dataUrl = await readFileAsDataURL(files[i]);  ← YEH REHNE DO
Line 159-166: ❌ YEH SAARI LINES DELETE KARO
Line 167 onwards: const page = pdf.addPage(...)  ← YEH BHI REHNE DO
      const page = pdf.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    const pdfBytes = await pdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'images.pdf');
    setResult('imgpdfResult', `✅ ${files.length} image(s) → images.pdf downloaded!`);
  } catch (err) {
    setResult('imgpdfResult', '❌ Error: ' + err.message, true);
  }
}


// ════════════════════════════════════════════
// 5. JPG TO PNG
// ════════════════════════════════════════════
function jpgToPNG() {
  const file = document.getElementById('jpgFile').files[0];
  if (!file) { setResult('jpgResult', '⚠️ JPG file select karo!', true); return; }
  setResult('jpgResult', '⏳ Converting...');
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      downloadBlob(blob, file.name.replace(/\.(jpg|jpeg)$/i, '.png'));
      setResult('jpgResult', '✅ PNG file downloaded!');
      URL.revokeObjectURL(img.src);
    }, 'image/png');
  };
  img.onerror = () => setResult('jpgResult', '❌ Image load nahi hui', true);
}


// ════════════════════════════════════════════
// 6. QR GENERATOR
// ════════════════════════════════════════════
function generateQR() {
  const text = document.getElementById('qrtext').value.trim();
  if (!text) { alert('Pehle kuch text ya URL type karo!'); return; }

  const qrDiv = document.getElementById('qr');
  const imgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(text);
  qrDiv.innerHTML = '<img src="' + imgUrl + '" alt="QR Code" style="margin-top:10px;border-radius:8px">';
  document.getElementById('qrDownloadBtn').style.display = 'block';
}

function downloadQR() {
  const img = document.querySelector("#qr img");
  if (!img) return;
  const canvas = document.createElement("canvas");
  canvas.width = 200; canvas.height = 200;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const a = document.createElement("a");
  a.download = "qrcode.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
}


// ════════════════════════════════════════════
// 7. IMAGE TEXT → EXCEL (OCR)
// ════════════════════════════════════════════
async function extractText() {
  const file = document.getElementById('ocr').files[0];
  if (!file) { setResult('ocrResult', '⚠️ Image file select karo!', true); return; }
  setResult('ocrResult', '⏳ Text extract ho raha hai... (30-60 sec)');
  let worker;
  try {
    worker = await Tesseract.createWorker('eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@4/tesseract-core.wasm.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    });
    const { data: { text } } = await worker.recognize(file);
    if (!text.trim()) { setResult('ocrResult', '⚠️ Koi text nahi mila', true); return; }
    const rows = text.split('\n').filter(r => r.trim());
    const csv = rows.map(row => '"' + row.trim().replace(/"/g, '""') + '"').join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'extracted_text.csv');
    setResult('ocrResult', '✅ extracted_text.csv downloaded!');
  } catch (err) {
    setResult('ocrResult', '❌ Error: ' + err.message, true);
  } finally {
    if (worker) await worker.terminate();
  }
}


// ════════════════════════════════════════════
// 8. PDF TO JPG
// ════════════════════════════════════════════
async function pdfToJpg() {
  const file = document.getElementById('pdfToJpgFile').files[0];
  const pageNum = parseInt(document.getElementById('pdfPageNum').value) || 1;

  if (!file) { setResult('pdfJpgResult', '⚠️ PDF file select karo!', true); return; }
  setResult('pdfJpgResult', '⏳ Converting page ' + pageNum + '...');

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pageNum > pdf.numPages) {
      setResult('pdfJpgResult', `⚠️ Sirf ${pdf.numPages} pages hain!`, true); return;
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // High quality
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    canvas.toBlob((blob) => {
      downloadBlob(blob, `page_${pageNum}.jpg`);
      setResult('pdfJpgResult', `✅ page_${pageNum}.jpg downloaded!`);
    }, 'image/jpeg', 0.95);
  } catch (err) {
    setResult('pdfJpgResult', '❌ Error: ' + err.message, true);
  }
}


// ════════════════════════════════════════════
// 9. PNG TO JPG
// ════════════════════════════════════════════
function pngToJpg() {
  const file = document.getElementById('pngFile').files[0];
  if (!file) { setResult('pngResult', '⚠️ PNG file select karo!', true); return; }
  setResult('pngResult', '⏳ Converting...');

  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; // Transparency → white background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      downloadBlob(blob, file.name.replace(/\.png$/i, '.jpg'));
      setResult('pngResult', '✅ JPG file downloaded!');
      URL.revokeObjectURL(img.src);
    }, 'image/jpeg', 0.95);
  };
  img.onerror = () => setResult('pngResult', '❌ Image load nahi hui', true);
}


// ════════════════════════════════════════════
// 10. RESIZE IMAGE
// ════════════════════════════════════════════
function resizeImageFn() {
  const file = document.getElementById('resizeInput').files[0];
  const width = parseInt(document.getElementById('resizeWidth').value);
  const height = parseInt(document.getElementById('resizeHeight').value);

  if (!file) { setResult('resizeResult', '⚠️ Image file select karo!', true); return; }
  if (!width || !height || width <= 0 || height <= 0) {
    setResult('resizeResult', '⚠️ Valid width aur height do (0 se zyada)!', true); return;
  }
  setResult('resizeResult', '⏳ Resizing...');

  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    canvas.toBlob((blob) => {
      downloadBlob(blob, 'resized_' + width + 'x' + height + '.png');
      setResult('resizeResult', `✅ ${width}×${height}px image downloaded!`);
      URL.revokeObjectURL(img.src);
    }, 'image/png');
  };
  img.onerror = () => setResult('resizeResult', '❌ Image load nahi hui', true);
}


// ════════════════════════════════════════════
// 11. PASSWORD GENERATOR
// ════════════════════════════════════════════
function generatePassword() {
  const len = parseInt(document.getElementById('passLength').value);
  const useUpper = document.getElementById('useUpper').checked;
  const useLower = document.getElementById('useLower').checked;
  const useNum = document.getElementById('useNum').checked;
  const useSym = document.getElementById('useSym').checked;

  let chars = '';
  if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (useNum) chars += '0123456789';
  if (useSym) chars += '@#$!%^&*()-_=+';

  if (!chars) { setResult('passwordResult', '⚠️ Kam se kam ek option select karo!', true); return; }

  let password = '';
  const arr = new Uint32Array(len);
  window.crypto.getRandomValues(arr); // Secure random
  for (let i = 0; i < len; i++) {
    password += chars[arr[i] % chars.length];
  }
  const el = document.getElementById('passwordResult');
  el.innerText = '🔑 ' + password;
  el.style.color = '#4ade80';
}

function copyPassword() {
  const text = document.getElementById('passwordResult').innerText.replace('🔑 ', '');
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    setResult('passwordResult', '✅ Copied: ' + text);
    setTimeout(() => {
      document.getElementById('passwordResult').innerText = '🔑 ' + text;
    }, 1500);
  });
}


// ════════════════════════════════════════════
// 12. IMAGE TABLE → CSV (OCR)
// ════════════════════════════════════════════
async function tableToExcel() {
  const file = document.getElementById('tableImage').files[0];
  if (!file) { setResult('tableResult', '⚠️ Image file select karo!', true); return; }
  setResult('tableResult', '⏳ Table extract ho raha hai... (30-60 sec)');
  let worker;
  try {
    worker = await Tesseract.createWorker('eng', 1, {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@4/tesseract-core.wasm.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    });
    const { data: { text } } = await worker.recognize(file);
    if (!text.trim()) { setResult('tableResult', '⚠️ Koi text nahi mila image mein', true); return; }
    const rows = text.split('\n').filter(r => r.trim());
    const csv = rows.map(row => {
      const cols = row.trim().split(/\s{2,}/);
      return cols.map(c => '"' + c.replace(/"/g, '""') + '"').join(',');
    }).join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'table.csv');
    setResult('tableResult', '✅ table.csv downloaded!');
  } catch (err) {
    setResult('tableResult', '❌ Error: ' + err.message, true);
  } finally {
    if (worker) await worker.terminate();
  }
}
