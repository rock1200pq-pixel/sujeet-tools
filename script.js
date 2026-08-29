// ============================================================
//  ROCK TOOLS — script.js
//  Bugs Checked ✅ | OCR via OCR.space direct file upload ✅
// ============================================================
// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBuSJkLM-KpzaoN-aELze0pqe-SXdGEIcw",
  authDomain: "rock-tools.firebaseapp.com",
  projectId: "rock-tools",
  storageBucket: "rock-tools.firebasestorage.app",
  messagingSenderId: "564908792043",
  appId: "1:564908792043:web:79e8d29b7d68744d6b46ae",
  measurementId: "G-S8DXXER973"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
// ── Utility: File label update ──
function updateLabel(input, labelId) {
  var label = document.getElementById(labelId);
  if (!label) return;
  if (input.files.length === 1) {
    label.innerText = input.files[0].name;
  } else if (input.files.length > 1) {
    label.innerText = input.files.length + ' files selected';
  } else {
    label.innerText = 'Choose file...';
  }
}

// ── Utility: Result message ──
function setResult(id, msg, isError) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerText = msg;
  el.style.color = isError ? '#ff6b6b' : '#4ade80';
}

// ── Utility: File to ArrayBuffer ──
function readFileAsArrayBuffer(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) { resolve(e.target.result); };
    reader.onerror = function() { reject(new Error('File read failed')); };
    reader.readAsArrayBuffer(file);
  });
}

// ── Utility: File to DataURL ──
function readFileAsDataURL(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) { resolve(e.target.result); };
    reader.onerror = function() { reject(new Error('File read failed')); };
    reader.readAsDataURL(file);
  });
}

// ── Utility: Download blob ──
function downloadBlob(blob, filename) {
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function() { URL.revokeObjectURL(link.href); }, 5000);
}

// ── Utility: OCR.space API — direct file upload ──
// Note: Direct file upload (not base64) is more reliable with free key
async function runOCR(file, resultId) {
  if (file.size > 1024 * 1024) {
    throw new Error('Image 1MB se badi hai! Chhoti image use karo.');
  }

  setResult(resultId, '⏳ OCR server se text extract ho raha hai... please wait');

  // Direct file upload — DO NOT set Content-Type header manually
  var formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('apikey', 'helloworld');
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');

  var response;
  try {
    response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
      // No headers — browser automatically sets multipart/form-data with boundary
    });
  } catch (e) {
    throw new Error('Internet connection check karo. Server se connect nahi hua.');
  }

  if (!response.ok) {
    throw new Error('Server error: ' + response.status + '. Thodi der baad try karo.');
  }

  var result;
  try {
    result = await response.json();
  } catch (e) {
    throw new Error('Server ka response samajh nahi aaya. Dobara try karo.');
  }

  // Check for API-level errors
  if (result.IsErroredOnProcessing === true) {
    var errMsg = 'OCR failed';
    if (result.ErrorMessage && result.ErrorMessage.length > 0) {
      errMsg = result.ErrorMessage[0];
    }
    throw new Error(errMsg);
  }

  // Check for valid results
  if (!result.ParsedResults || result.ParsedResults.length === 0) {
    return '';
  }

  return result.ParsedResults[0].ParsedText || '';
}


// ════════════════════════════════════════════
// 1. MERGE PDF
// ════════════════════════════════════════════
async function mergePDF() {
  var files = document.getElementById('mergeFiles').files;
  if (files.length < 2) {
    setResult('mergeResult', '⚠️ Kam se kam 2 PDF files select karo!', true);
    return;
  }
  setResult('mergeResult', '⏳ Merging...');
  try {
    var mergedPdf = await PDFLib.PDFDocument.create();
    for (var i = 0; i < files.length; i++) {
      var bytes = await readFileAsArrayBuffer(files[i]);
      var pdf = await PDFLib.PDFDocument.load(bytes);
      var pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(function(p) { mergedPdf.addPage(p); });
    }
    var pdfBytes = await mergedPdf.save();
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
  var file = document.getElementById('splitFile').files[0];
  var from = parseInt(document.getElementById('splitFrom').value);
  var to = parseInt(document.getElementById('splitTo').value);
  if (!file) { setResult('splitResult', '⚠️ PDF file select karo!', true); return; }
  if (!from || !to || from < 1 || to < from) {
    setResult('splitResult', '⚠️ Valid page range do (From <= To)', true);
    return;
  }
  setResult('splitResult', '⏳ Splitting...');
  try {
    var bytes = await readFileAsArrayBuffer(file);
    var srcPdf = await PDFLib.PDFDocument.load(bytes);
    var actualTo = Math.min(to, srcPdf.getPageCount());
    var indices = Array.from({ length: actualTo - from + 1 }, function(_, i) { return from - 1 + i; });
    var newPdf = await PDFLib.PDFDocument.create();
    var pages = await newPdf.copyPages(srcPdf, indices);
    pages.forEach(function(p) { newPdf.addPage(p); });
    var pdfBytes = await newPdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'split_page' + from + '-' + actualTo + '.pdf');
    setResult('splitResult', '✅ Pages ' + from + '–' + actualTo + ' download ho gayi!');
  } catch (err) {
    setResult('splitResult', '❌ Error: ' + err.message, true);
  }
}


// ════════════════════════════════════════════
// 3. IMAGE COMPRESS
// ════════════════════════════════════════════
function compressImage() {
  var file = document.getElementById('compressFile').files[0];
  var quality = parseInt(document.getElementById('quality').value) / 100;
  if (!file) { setResult('compressResult', '⚠️ Image file select karo!', true); return; }
  if (file.type === 'image/png') {
    setResult('compressResult', '⚠️ PNG lossless hai — JPG file use karo!', true);
    return;
  }
  setResult('compressResult', '⏳ Compressing...');
  var img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    canvas.toBlob(function(blob) {
      var origKB = (file.size / 1024).toFixed(1);
      var newKB = (blob.size / 1024).toFixed(1);
      var saved = (((file.size - blob.size) / file.size) * 100).toFixed(0);
      downloadBlob(blob, 'compressed.jpg');
      setResult('compressResult', '✅ ' + origKB + 'KB → ' + newKB + 'KB (' + saved + '% saved)');
      URL.revokeObjectURL(img.src);
    }, 'image/jpeg', quality);
  };
  img.onerror = function() { setResult('compressResult', '❌ Image load nahi hui', true); };
}


// ════════════════════════════════════════════
// 4. IMAGE TO PDF
// ════════════════════════════════════════════
async function imageToPDF() {
  var files = document.getElementById('imgpdfFiles').files;
  if (files.length === 0) { setResult('imgpdfResult', '⚠️ Kam se kam 1 image select karo!', true); return; }
  setResult('imgpdfResult', '⏳ Converting...');
  try {
    var pdf = await PDFLib.PDFDocument.create();
    for (var i = 0; i < files.length; i++) {
      var dataUrl = await readFileAsDataURL(files[i]);
      var convCanvas = document.createElement('canvas');
      var convImg = new Image();
      convImg.src = dataUrl;
      await new Promise(function(r) { convImg.onload = r; });
      convCanvas.width = convImg.width;
      convCanvas.height = convImg.height;
      convCanvas.getContext('2d').drawImage(convImg, 0, 0);
      var jpgBase64 = convCanvas.toDataURL('image/jpeg', 0.95).split(',')[1];
      var img = await pdf.embedJpg(Uint8Array.from(atob(jpgBase64), function(c) { return c.charCodeAt(0); }));
      var page = pdf.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    var pdfBytes = await pdf.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'images.pdf');
    setResult('imgpdfResult', '✅ ' + files.length + ' image(s) → images.pdf downloaded!');
  } catch (err) {
    setResult('imgpdfResult', '❌ Error: ' + err.message, true);
  }
}


// ════════════════════════════════════════════
// 5. JPG TO PNG
// ════════════════════════════════════════════
function jpgToPNG() {
  var file = document.getElementById('jpgFile').files[0];
  if (!file) { setResult('jpgResult', '⚠️ JPG file select karo!', true); return; }
  setResult('jpgResult', '⏳ Converting...');
  var img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    canvas.toBlob(function(blob) {
      downloadBlob(blob, file.name.replace(/\.(jpg|jpeg)$/i, '.png'));
      setResult('jpgResult', '✅ PNG file downloaded!');
      URL.revokeObjectURL(img.src);
    }, 'image/png');
  };
  img.onerror = function() { setResult('jpgResult', '❌ Image load nahi hui', true); };
}


// ════════════════════════════════════════════
// 6. QR GENERATOR
// ════════════════════════════════════════════
function generateQR() {
  var text = document.getElementById('qrtext').value.trim();
  if (!text) { alert('Pehle kuch text ya URL type karo!'); return; }
  var qrDiv = document.getElementById('qr');
  var imgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(text);
  qrDiv.innerHTML = '<img src="' + imgUrl + '" alt="QR Code" crossorigin="anonymous" style="margin-top:10px;border-radius:8px">';
  document.getElementById('qrDownloadBtn').style.display = 'block';
}

function downloadQR() {
  var img = document.querySelector('#qr img');
  if (!img) return;
  var canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  var tempImg = new Image();
  tempImg.crossOrigin = 'anonymous';
  tempImg.onload = function() {
    canvas.getContext('2d').drawImage(tempImg, 0, 0, 200, 200);
    var a = document.createElement('a');
    a.download = 'qrcode.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };
  tempImg.onerror = function() { window.open(img.src, '_blank'); };
  tempImg.src = img.src;
}

// ════════════════════════════════════════════
// 8. PDF TO JPG
// ════════════════════════════════════════════
async function pdfToJpg() {
  var file = document.getElementById('pdfToJpgFile').files[0];
  var pageNum = parseInt(document.getElementById('pdfPageNum').value) || 1;
  if (!file) { setResult('pdfJpgResult', '⚠️ PDF file select karo!', true); return; }
  setResult('pdfJpgResult', '⏳ Converting page ' + pageNum + '...');
  try {
    var arrayBuffer = await readFileAsArrayBuffer(file);
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    if (pageNum > pdf.numPages) {
      setResult('pdfJpgResult', '⚠️ Sirf ' + pdf.numPages + ' pages hain!', true);
      return;
    }
    var page = await pdf.getPage(pageNum);
    var viewport = page.getViewport({ scale: 2.0 });
    var canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
    canvas.toBlob(function(blob) {
      downloadBlob(blob, 'page_' + pageNum + '.jpg');
      setResult('pdfJpgResult', '✅ page_' + pageNum + '.jpg downloaded!');
    }, 'image/jpeg', 0.95);
  } catch (err) {
    setResult('pdfJpgResult', '❌ Error: ' + err.message, true);
  }
}


// ════════════════════════════════════════════
// 9. PNG TO JPG
// ════════════════════════════════════════════
function pngToJpg() {
  var file = document.getElementById('pngFile').files[0];
  if (!file) { setResult('pngResult', '⚠️ PNG file select karo!', true); return; }
  setResult('pngResult', '⏳ Converting...');
  var img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(function(blob) {
      downloadBlob(blob, file.name.replace(/\.png$/i, '.jpg'));
      setResult('pngResult', '✅ JPG file downloaded!');
      URL.revokeObjectURL(img.src);
    }, 'image/jpeg', 0.95);
  };
  img.onerror = function() { setResult('pngResult', '❌ Image load nahi hui', true); };
}


// ════════════════════════════════════════════
// 10. RESIZE IMAGE
// ════════════════════════════════════════════
function resizeImageFn() {
  var file = document.getElementById('resizeInput').files[0];
  var width = parseInt(document.getElementById('resizeWidth').value);
  var height = parseInt(document.getElementById('resizeHeight').value);
  if (!file) { setResult('resizeResult', '⚠️ Image file select karo!', true); return; }
  if (!width || !height || width <= 0 || height <= 0) {
    setResult('resizeResult', '⚠️ Valid width aur height do (0 se zyada)!', true);
    return;
  }
  setResult('resizeResult', '⏳ Resizing...');
  var img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    canvas.toBlob(function(blob) {
      downloadBlob(blob, 'resized_' + width + 'x' + height + '.png');
      setResult('resizeResult', '✅ ' + width + '×' + height + 'px image downloaded!');
      URL.revokeObjectURL(img.src);
    }, 'image/png');
  };
  img.onerror = function() { setResult('resizeResult', '❌ Image load nahi hui', true); };
}


// ════════════════════════════════════════════
// 11. PASSWORD GENERATOR
// ════════════════════════════════════════════
function generatePassword() {
  var len = parseInt(document.getElementById('passLength').value);
  var useUpper = document.getElementById('useUpper').checked;
  var useLower = document.getElementById('useLower').checked;
  var useNum = document.getElementById('useNum').checked;
  var useSym = document.getElementById('useSym').checked;
  var chars = '';
  if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (useNum) chars += '0123456789';
  if (useSym) chars += '@#$!%^&*()-_=+';
  if (!chars) { setResult('passwordResult', '⚠️ Kam se kam ek option select karo!', true); return; }
  var arr = new Uint32Array(len);
  if (window.crypto && window.crypto.getRandomValues) {
  window.crypto.getRandomValues(arr);
}
  var password = '';
  for (var i = 0; i < len; i++) {
    password += chars[arr[i] % chars.length];
  }
  var el = document.getElementById('passwordResult');
  el.innerText = '🔑 ' + password;
  el.style.color = '#4ade80';
}

function copyPassword() {
  var el = document.getElementById('passwordResult');
  var text = el.innerText.replace('🔑 ', '').replace('✅ Copied: ', '');
  if (!text) return;
  navigator.clipboard.writeText(text).then(function() {
    setResult('passwordResult', '✅ Copied: ' + text);
    setTimeout(function() {
      el.innerText = '🔑 ' + text;
      el.style.color = '#4ade80';
    }, 1500);
  });
}

/* =========================================================
   ROCK TOOLS — INVOICE & RECEIPT GENERATOR
   Two Popup System
   1. Invoice Form
   2. Invoice Preview
   ========================================================= */

(function () {

  "use strict";

  var invoiceItems = [];


  /* =========================================================
     HELPER
     ========================================================= */

  function $(id) {
    return document.getElementById(id);
  }


  function safe(value) {
    return value == null ? "" : String(value);
  }


  function money(value) {

    var n = Number(value);

    if (!Number.isFinite(n)) {
      n = 0;
    }

    return "₹" + n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  }


  function todayISO() {

    var d = new Date();

    var year = d.getFullYear();

    var month = String(
      d.getMonth() + 1
    ).padStart(2, "0");

    var day = String(
      d.getDate()
    ).padStart(2, "0");

    return year + "-" + month + "-" + day;

  }


  function addDaysISO(dateString, days) {

    var d = new Date(
      dateString + "T00:00:00"
    );

    if (Number.isNaN(d.getTime())) {
      return "";
    }

    d.setDate(
      d.getDate() + days
    );

    var year = d.getFullYear();

    var month = String(
      d.getMonth() + 1
    ).padStart(2, "0");

    var day = String(
      d.getDate()
    ).padStart(2, "0");

    return year + "-" + month + "-" + day;

  }


  function formatDate(value) {

    if (!value) {
      return "-";
    }

    var parts = value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    return (
      parts[2] +
      "-" +
      parts[1] +
      "-" +
      parts[0]
    );

  }


  function getNumber(id) {

    var element = $(id);

    if (!element) {
      return 0;
    }

    var value = parseFloat(
      element.value
    );

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return 0;
    }

    return value;

  }


  /* =========================================================
     OPEN FORM MODAL
     ========================================================= */

  function openInvoiceForm() {

    var modal = $("rtInvoiceFormModal");

    if (!modal) {
      return;
    }

    modal.classList.add("rt-open");

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow = "hidden";

  }


  /* =========================================================
     CLOSE FORM MODAL
     ========================================================= */

  function closeInvoiceForm() {

    var modal = $("rtInvoiceFormModal");

    if (!modal) {
      return;
    }

    modal.classList.remove("rt-open");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow = "";

  }


  /* =========================================================
     OPEN PREVIEW
     ========================================================= */

  function openInvoicePreview() {

    var modal = $("rtInvoicePreviewModal");

    if (!modal) {
      return;
    }

    modal.classList.add("rt-open");

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow = "hidden";

    updateInvoicePreview();

  }


  /* =========================================================
     CLOSE PREVIEW
     ========================================================= */

  function closeInvoicePreview() {

    var modal = $("rtInvoicePreviewModal");

    if (!modal) {
      return;
    }

    modal.classList.remove("rt-open");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow = "";

  }


  /* =========================================================
     ITEMS EDITOR
     ========================================================= */

  function renderItemEditor() {

    var container = $("rtItemsEditor");

    if (!container) {
      return;
    }

    container.innerHTML = "";


    invoiceItems.forEach(
      function (item, index) {

        var row =
          document.createElement("div");

        row.className =
          "rt-item-editor";


        /* DESCRIPTION */

        var description =
          document.createElement("input");

        description.type = "text";

        description.placeholder =
          "Item / Service";

        description.value =
          safe(item.description);


        /* QTY */

        var qty =
          document.createElement("input");

        qty.type = "number";

        qty.min = "0";

        qty.step = "0.01";

        qty.placeholder = "Qty";

        qty.value = item.qty;


        /* RATE */

        var rate =
          document.createElement("input");

        rate.type = "number";

        rate.min = "0";

        rate.step = "0.01";

        rate.placeholder = "Rate";

        rate.value = item.rate;


        /* REMOVE */

        var remove =
          document.createElement("button");

        remove.type = "button";

        remove.className =
          "rt-remove-item";

        remove.textContent = "×";

        remove.title =
          "Remove item";


        /* DESCRIPTION CHANGE */

        description.addEventListener(
          "input",
          function () {

            invoiceItems[index]
              .description =
              description.value;

          }
        );


        /* QTY CHANGE */

        qty.addEventListener(
          "input",
          function () {

            invoiceItems[index].qty =
              Math.max(
                0,
                parseFloat(qty.value) || 0
              );

          }
        );


        /* RATE CHANGE */

        rate.addEventListener(
          "input",
          function () {

            invoiceItems[index].rate =
              Math.max(
                0,
                parseFloat(rate.value) || 0
              );

          }
        );


        /* REMOVE ITEM */

        remove.addEventListener(
          "click",
          function () {

            if (
              invoiceItems.length === 1
            ) {

              invoiceItems[0] = {
                description: "",
                qty: 1,
                rate: 0
              };

            } else {

              invoiceItems.splice(
                index,
                1
              );

            }

            renderItemEditor();

          }
        );


        row.appendChild(
          description
        );

        row.appendChild(
          qty
        );

        row.appendChild(
          rate
        );

        row.appendChild(
          remove
        );


        container.appendChild(row);

      }
    );

  }


  /* =========================================================
     ADD ITEM
     ========================================================= */

  function addItem() {

    invoiceItems.push({

      description: "",

      qty: 1,

      rate: 0

    });

    renderItemEditor();

  }


  /* =========================================================
     CALCULATE INVOICE
     ========================================================= */

  function calculateInvoice() {

    var subtotal = 0;


    invoiceItems.forEach(
      function (item) {

        var qty =
          Number(item.qty) || 0;

        var rate =
          Number(item.rate) || 0;

        subtotal +=
          qty * rate;

      }
    );


    var discount =
      Math.min(
        getNumber("rtDiscount"),
        subtotal
      );


    var taxable =
      Math.max(
        0,
        subtotal - discount
      );


    var taxType =
      $("rtTaxType")
        ? $("rtTaxType").value
        : "none";


    var gstRate =
      getNumber("rtGstRate");


    var cgst = 0;

    var sgst = 0;

    var igst = 0;


    if (
      taxType === "cgst_sgst"
    ) {

      cgst =
        taxable *
        (gstRate / 2) /
        100;

      sgst =
        taxable *
        (gstRate / 2) /
        100;

    }


    if (
      taxType === "igst"
    ) {

      igst =
        taxable *
        gstRate /
        100;

    }


    var total =
      taxable +
      cgst +
      sgst +
      igst;


    return {

      subtotal: subtotal,

      discount: discount,

      taxable: taxable,

      cgst: cgst,

      sgst: sgst,

      igst: igst,

      total: total

    };

  }


  /* =========================================================
     PREVIEW ITEMS
     ========================================================= */

  function renderPreviewItems() {

    var tbody =
      $("rtPreviewItems");

    if (!tbody) {
      return;
    }

    tbody.innerHTML = "";

    var hasItem = false;


    invoiceItems.forEach(
      function (item) {

        var description =
          safe(
            item.description
          ).trim();


        var qty =
          Number(item.qty) || 0;


        var rate =
          Number(item.rate) || 0;


        var amount =
          qty * rate;


        if (
          !description &&
          qty === 0 &&
          rate === 0
        ) {

          return;

        }


        hasItem = true;


        var tr =
          document.createElement("tr");


        var tdDescription =
          document.createElement("td");


        var tdQty =
          document.createElement("td");


        var tdRate =
          document.createElement("td");


        var tdAmount =
          document.createElement("td");


        tdDescription.textContent =
          description ||
          "Item / Service";


        tdQty.textContent =
          String(qty);


        tdRate.textContent =
          money(rate);


        tdAmount.textContent =
          money(amount);


        tr.appendChild(
          tdDescription
        );

        tr.appendChild(
          tdQty
        );

        tr.appendChild(
          tdRate
        );

        tr.appendChild(
          tdAmount
        );


        tbody.appendChild(tr);

      }
    );


    if (!hasItem) {

      var tr =
        document.createElement("tr");


      var td =
        document.createElement("td");


      td.colSpan = 4;

      td.style.textAlign =
        "center";

      td.style.color =
        "#888";

      td.textContent =
        "No items added";


      tr.appendChild(td);

      tbody.appendChild(tr);

    }

  }


  /* =========================================================
     UPDATE INVOICE PREVIEW
     ========================================================= */

  function updateInvoicePreview() {

    var printArea =
      $("rtInvoicePrintArea");

    if (!printArea) {
      return;
    }


    var calc =
      calculateInvoice();


    /* BUSINESS */

    $("rtPreviewBizName")
      .textContent =
      $("rtBizName").value.trim() ||
      "Your Business";


    $("rtPreviewBizAddress")
      .textContent =
      $("rtBizAddress").value.trim() ||
      "Business Address";


    var businessContact = [];


    if (
      $("rtBizPhone").value.trim()
    ) {

      businessContact.push(
        $("rtBizPhone").value.trim()
      );

    }


    if (
      $("rtBizEmail").value.trim()
    ) {

      businessContact.push(
        $("rtBizEmail").value.trim()
      );

    }


    $("rtPreviewBizContact")
      .textContent =
      businessContact.join(" • ");


    $("rtPreviewBizGstin")
      .textContent =
      $("rtBizGstin").value.trim()
        ? "GSTIN: " +
          $("rtBizGstin").value.trim()
        : "";


    /* INVOICE */

    $("rtPreviewInvoiceNumber")
      .textContent =
      $("rtInvoiceNumber").value.trim() ||
      "INV-001";


    $("rtPreviewInvoiceDate")
      .textContent =
      formatDate(
        $("rtInvoiceDate").value
      );


    $("rtPreviewDueDate")
      .textContent =
      formatDate(
        $("rtDueDate").value
      );


    $("rtPreviewStatus")
      .textContent =
      (
        $("rtPaymentStatus").value ||
        "Unpaid"
      ).toUpperCase();


    /* CUSTOMER */

    $("rtPreviewCustomerName")
      .textContent =
      $("rtCustomerName").value.trim() ||
      "Customer Name";


    $("rtPreviewCustomerAddress")
      .textContent =
      $("rtCustomerAddress").value.trim() ||
      "Customer Address";


    var customerContact = [];


    if (
      $("rtCustomerPhone").value.trim()
    ) {

      customerContact.push(
        $("rtCustomerPhone").value.trim()
      );

    }


    if (
      $("rtCustomerEmail").value.trim()
    ) {

      customerContact.push(
        $("rtCustomerEmail").value.trim()
      );

    }


    $("rtPreviewCustomerContact")
      .textContent =
      customerContact.join(" • ");


    $("rtPreviewCustomerGstin")
      .textContent =
      $("rtCustomerGstin").value.trim()
        ? "GSTIN: " +
          $("rtCustomerGstin").value.trim()
        : "";


    /* ITEMS */

    renderPreviewItems();


    /* TOTALS */

    $("rtPreviewSubtotal")
      .textContent =
      money(calc.subtotal);


    $("rtPreviewDiscount")
      .textContent =
      money(calc.discount);


    $("rtPreviewTaxable")
      .textContent =
      money(calc.taxable);


    $("rtPreviewCgst")
      .textContent =
      money(calc.cgst);


    $("rtPreviewSgst")
      .textContent =
      money(calc.sgst);


    $("rtPreviewIgst")
      .textContent =
      money(calc.igst);


    $("rtPreviewTotal")
      .textContent =
      money(calc.total);


    /* TAX ROWS */

    var taxType =
      $("rtTaxType").value;


    $("rtPreviewCgstRow")
      .style.display =
      taxType === "cgst_sgst"
        ? "flex"
        : "none";


    $("rtPreviewSgstRow")
      .style.display =
      taxType === "cgst_sgst"
        ? "flex"
        : "none";


    $("rtPreviewIgstRow")
      .style.display =
      taxType === "igst"
        ? "flex"
        : "none";


    /* PAYMENT */

    var paymentLines = [];


    if (
      $("rtBankName").value.trim()
    ) {

      paymentLines.push(
        "Bank: " +
        $("rtBankName").value.trim()
      );

    }


    if (
      $("rtAccountNumber").value.trim()
    ) {

      paymentLines.push(
        "A/C: " +
        $("rtAccountNumber").value.trim()
      );

    }


    if (
      $("rtIfsc").value.trim()
    ) {

      paymentLines.push(
        "IFSC: " +
        $("rtIfsc").value.trim()
      );

    }


    if (
      $("rtUpi").value.trim()
    ) {

      paymentLines.push(
        "UPI: " +
        $("rtUpi").value.trim()
      );

    }


    $("rtPreviewPayment")
      .textContent =
      paymentLines.join("\n");


    $("rtPreviewPaymentBox")
      .style.display =
      paymentLines.length
        ? "block"
        : "none";


    /* NOTES */

    $("rtPreviewNotes")
      .textContent =
      $("rtNotes").value.trim() ||
      "Thank you for your business.";

  }


  /* =========================================================
     GENERATE INVOICE
     ========================================================= */

  function generateInvoice() {

    updateInvoicePreview();

    closeInvoiceForm();

    openInvoicePreview();

  }


  /* =========================================================
     EDIT INVOICE
     ========================================================= */

  function editInvoice() {

    closeInvoicePreview();

    openInvoiceForm();

  }


  /* =========================================================
     PRINT / SAVE PDF
     ========================================================= */

  function printInvoice() {

    updateInvoicePreview();


    var oldTitle =
      document.title;


    var invoiceNo =
      $("rtInvoiceNumber")
        .value
        .trim() ||
      "invoice";


    document.title =
      invoiceNo;


    window.print();


    setTimeout(
      function () {

        document.title =
          oldTitle;

      },
      1000
    );

  }


  /* =========================================================
     RESET FORM
     ========================================================= */

  function resetInvoice() {

    var confirmed =
      window.confirm(
        "Invoice data reset karna hai?"
      );


    if (!confirmed) {
      return;
    }


    [
      "rtBizName",
      "rtBizPhone",
      "rtBizEmail",
      "rtBizGstin",
      "rtBizAddress",

      "rtCustomerName",
      "rtCustomerPhone",
      "rtCustomerEmail",
      "rtCustomerGstin",
      "rtCustomerAddress",

      "rtBankName",
      "rtAccountNumber",
      "rtIfsc",
      "rtUpi",

      "rtNotes"

    ].forEach(
      function (id) {

        var el = $(id);

        if (el) {
          el.value = "";
        }

      }
    );


    $("rtInvoiceNumber")
      .value = "INV-001";


    $("rtInvoiceDate")
      .value = todayISO();


    $("rtDueDate")
      .value =
      addDaysISO(
        todayISO(),
        7
      );


    $("rtPaymentStatus")
      .value = "Unpaid";


    $("rtDiscount")
      .value = "0";


    $("rtTaxType")
      .value = "none";


    $("rtGstRate")
      .value = "18";


    invoiceItems = [

      {
        description: "",
        qty: 1,
        rate: 0
      }

    ];


    renderItemEditor();

    updateInvoicePreview();

  }


  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initInvoice() {

    if (!$("rtInvoiceOpenBtn")) {
      return;
    }


    /* DEFAULT DATES */

    if ($("rtInvoiceDate")) {

      $("rtInvoiceDate")
        .value =
        todayISO();

    }


    if ($("rtDueDate")) {

      $("rtDueDate")
        .value =
        addDaysISO(
          todayISO(),
          7
        );

    }


    /* DEFAULT ITEM */

    invoiceItems = [

      {
        description: "",
        qty: 1,
        rate: 0
      }

    ];


    renderItemEditor();


    /* =====================================================
       CREATE INVOICE BUTTON
       ===================================================== */

    $("rtInvoiceOpenBtn")
      .addEventListener(
        "click",
        openInvoiceForm
      );


    /* =====================================================
       FORM CLOSE
       ===================================================== */

    $("rtInvoiceFormCloseBtn")
      .addEventListener(
        "click",
        closeInvoiceForm
      );


    /* =====================================================
       ADD ITEM
       ===================================================== */

    $("rtAddItemBtn")
      .addEventListener(
        "click",
        addItem
      );


    /* =====================================================
       GENERATE
       ===================================================== */

    $("rtGenerateInvoiceBtn")
      .addEventListener(
        "click",
        generateInvoice
      );


    /* =====================================================
       PREVIEW CLOSE
       ===================================================== */

    $("rtInvoicePreviewCloseBtn")
      .addEventListener(
        "click",
        closeInvoicePreview
      );


    /* =====================================================
       EDIT
       ===================================================== */

    $("rtEditInvoiceBtn")
      .addEventListener(
        "click",
        editInvoice
      );


    /* =====================================================
       PRINT
       ===================================================== */

    $("rtPrintInvoiceBtn")
      .addEventListener(
        "click",
        printInvoice
      );


    /* =====================================================
       FORM FIELDS
       ===================================================== */

    var fields = [

      "rtBizName",
      "rtBizPhone",
      "rtBizEmail",
      "rtBizGstin",
      "rtBizAddress",

      "rtInvoiceNumber",
      "rtInvoiceDate",
      "rtDueDate",
      "rtPaymentStatus",

      "rtCustomerName",
      "rtCustomerPhone",
      "rtCustomerEmail",
      "rtCustomerGstin",
      "rtCustomerAddress",

      "rtDiscount",
      "rtTaxType",
      "rtGstRate",

      "rtBankName",
      "rtAccountNumber",
      "rtIfsc",
      "rtUpi",

      "rtNotes"

    ];


    fields.forEach(
      function (id) {

        var el = $(id);

        if (!el) {
          return;
        }

        el.addEventListener(
          "input",
          updateInvoicePreview
        );

        el.addEventListener(
          "change",
          updateInvoicePreview
        );

      }
    );


    /* =====================================================
       CLICK OUTSIDE FORM
       ===================================================== */

    $("rtInvoiceFormModal")
      .addEventListener(
        "click",
        function (event) {

          if (
            event.target ===
            $("rtInvoiceFormModal")
          ) {

            closeInvoiceForm();

          }

        }
      );


    /* =====================================================
       CLICK OUTSIDE PREVIEW
       ===================================================== */

    $("rtInvoicePreviewModal")
      .addEventListener(
        "click",
        function (event) {

          if (
            event.target ===
            $("rtInvoicePreviewModal")
          ) {

            closeInvoicePreview();

          }

        }
      );


    /* =====================================================
       ESC KEY
       ===================================================== */

    document.addEventListener(
      "keydown",
      function (event) {

        if (
          event.key !== "Escape"
        ) {
          return;
        }


        if (
          $("rtInvoiceFormModal")
            .classList
            .contains("rt-open")
        ) {

          closeInvoiceForm();

          return;

        }


        if (
          $("rtInvoicePreviewModal")
            .classList
            .contains("rt-open")
        ) {

          closeInvoicePreview();

        }

      }
    );

  }


  /* =========================================================
     START
     ========================================================= */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initInvoice
    );

  } else {

    initInvoice();

  }


})();
//Rock Tools. AI

// REGISTER
async function registerUser() {
  let name = document.getElementById("name").value.trim();
let mobile = document.getElementById("mobile").value.trim();
let password = document.getElementById("password").value.trim();
  let email = mobile + "@app.com"; // fake email create
  const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
const user = userCredential.user;

  await db.collection("users").doc(user.uid).set({
  name: name,
  mobile: mobile,
  uid: user.uid,
  createdAt: new Date()
});

  alert("Registration Successful 🎉");
closeLogin();
showLogin();
}
// POPUP CONTROL
window.openLogin = function(){
    document.getElementById("authModal").style.display = "flex";
}

window.closeLogin = function(){
    document.getElementById("authModal").style.display = "none";
}
// SWITCH FORMS
window.showLogin = function(){
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("registerForm").style.display = "none";
}

window.showRegister = function(){
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
}

// Login functiifunction
async function loginUser() {
  let mobile = document.getElementById("loginMobile").value.trim();
let password = document.getElementById("loginPassword").value.trim();
if (!mobile || !password) {
  alert("Enter mobile & password");
  return;
}
  if (mobile.length !== 10) {
  alert("Enter valid 10 digit mobile");
  return;
}

  let email = mobile + "@app.com";

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    alert("Login successful 🎉");
    closeLogin();
  } catch (err) {
    alert("Wrong mobile or password");
  }
}
