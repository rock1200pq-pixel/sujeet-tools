function mergePDF(){

alert("PDF Merge function connected");

}

function splitPDF(){

alert("PDF Split function connected");

}

function compressImage(){

alert("Image Compress function connected");

}

function imageToPDF(){

alert("Image to PDF connected");

}

function jpgToPNG(){

alert("JPG to PNG connected");

}

function generateQR(){

let text=document.getElementById("qrtext").value;

document.getElementById("qr").innerHTML=

"<img src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="+text+"'>";

}

function extractText(){

alert("OCR Tool connected");

}
function rollDice(){

let dice=document.getElementById("dice");
let result=document.getElementById("dice-result");

dice.innerHTML="🎲";

dice.style.transform="rotate(720deg)";
dice.style.transition="0.5s";

let number=Math.floor(Math.random()*6)+1;

setTimeout(()=>{
result.innerText="You rolled: "+number;
},500);

}
