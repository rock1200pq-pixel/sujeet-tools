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
function rollDice(){

let dice=document.getElementById("dice");
let result=document.getElementById("dice-result");

let number=Math.floor(Math.random()*6)+1;

let rotations={
1:"rotateX(0deg) rotateY(0deg)",
2:"rotateX(-90deg)",
3:"rotateY(90deg)",
4:"rotateY(-90deg)",
5:"rotateX(90deg)",
6:"rotateY(180deg)"
};

dice.style.transform=rotations[number];

result.innerText="You rolled: "+number;

}
