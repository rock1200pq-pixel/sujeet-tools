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
function pdfToJpg(){
alert("PDF to JPG feature coming soon");
}

function pngToJpg(){

let file=document.getElementById("pngFile").files[0];

let img=new Image();
img.src=URL.createObjectURL(file);

img.onload=function(){

let canvas=document.createElement("canvas");
canvas.width=img.width;
canvas.height=img.height;

let ctx=canvas.getContext("2d");
ctx.drawImage(img,0,0);

let link=document.createElement("a");
link.download="converted.jpg";
link.href=canvas.toDataURL("image/jpeg");

link.click();

}

}

function resizeImage(){

let file=document.getElementById("resizeImage").files[0];

let width=document.getElementById("resizeWidth").value;
let height=document.getElementById("resizeHeight").value;

let img=new Image();
img.src=URL.createObjectURL(file);

img.onload=function(){

let canvas=document.createElement("canvas");
canvas.width=width;
canvas.height=height;

let ctx=canvas.getContext("2d");
ctx.drawImage(img,0,0,width,height);

let link=document.createElement("a");
link.download="resized.png";
link.href=canvas.toDataURL();

link.click();

}

}

function generatePassword(){

let chars="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$";

let password="";

for(let i=0;i<12;i++){
password+=chars[Math.floor(Math.random()*chars.length)];
}

document.getElementById("passwordResult").innerText=password;

}

function countText(){

let text=document.getElementById("textInput").value;

let words=text.trim().split(/\s+/).length;
let chars=text.length;

document.getElementById("textResult").innerText="Words: "+words+" | Characters: "+chars;

}

function randomNumber(){

let num=Math.floor(Math.random()*1000);

document.getElementById("randomResult").innerText=num;

}
