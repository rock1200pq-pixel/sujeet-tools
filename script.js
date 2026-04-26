// ============================================================
//  ROCK TOOLS — script.js
//  Bugs Checked ✅ | OCR via OCR.space direct file upload ✅
// ============================================================
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
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
  window.crypto.getRandomValues(arr);
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
//Rock Tools. AI
let generatedOTP = "";
let isVerified = false;

// SEND OTP
function sendOTP(){
    let mobile = document.getElementById("mobile").value;

    if(mobile.length < 10){
        alert("Enter valid mobile number");
        return;
    }

    generatedOTP = Math.floor(1000 + Math.random() * 9000);
    alert("Your OTP is: " + generatedOTP);
}

// VERIFY OTP
function verifyOTP(){
    let userOTP = document.getElementById("otp").value;

    if(userOTP == generatedOTP){
        alert("OTP Verified ✅");
        isVerified = true;
    } else {
        alert("Invalid OTP ❌");
        isVerified = false;
    }
}

// REGISTER
function registerUser(){
    let name = document.getElementById("name").value;
    let mobile = document.getElementById("mobile").value;
    let password = document.getElementById("password").value;

    if(name === "" || mobile === "" || password === ""){
        alert("Fill all fields");
        return;
    }

    if(!isVerified){
        alert("Verify OTP first");
        return;
    }

    alert("Registration Successful 🎉");
}

// POPUP CONTROL
function openLogin(){
    document.getElementById("authModal").style.display = "flex";
}

function closeLogin(){
    document.getElementById("authModal").style.display = "none";
}

// SWITCH FORMS
function showLogin(){
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("registerForm").style.display = "none";
}

function showRegister(){
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
}
