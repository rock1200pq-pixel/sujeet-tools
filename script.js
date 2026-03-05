function passwordGen(){

let pass=Math.random().toString(36).slice(-10);

alert("Generated Password: "+pass);

}

function textCounter(){

let text=prompt("Enter text");

alert("Characters: "+text.length);

}

function qrGenerator(){

let text=prompt("Enter text for QR");

window.open(
"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="+text
);

}

function mergePDF(){

alert("PDF Merge Tool Coming Soon");

}

function imageToPDF(){

alert("Image to PDF Tool Coming Soon");

}
