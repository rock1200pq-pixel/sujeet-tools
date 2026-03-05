const { PDFDocument } = PDFLib;

/* MERGE PDF */

async function mergePDFs(){

const files=document.getElementById("mergeFiles").files;

if(files.length<2){
alert("Select at least 2 PDFs");
return;
}

const mergedPdf=await PDFDocument.create();

for(let file of files){

const bytes=await file.arrayBuffer();

const pdf=await PDFDocument.load(bytes);

const copiedPages=await mergedPdf.copyPages(pdf,pdf.getPageIndices());

copiedPages.forEach((page)=>mergedPdf.addPage(page));

}

const pdfBytes=await mergedPdf.save();

downloadFile(pdfBytes,"merged.pdf","application/pdf");

}


/* IMAGE TO PDF */

async function convertImageToPDF(){

const files=document.getElementById("imageFiles").files;

if(files.length===0){
alert("Select image");
return;
}

const pdfDoc=await PDFDocument.create();

for(let file of files){

const imgBytes=await file.arrayBuffer();

let image;

if(file.type.includes("png")){
image=await pdfDoc.embedPng(imgBytes);
}else{
image=await pdfDoc.embedJpg(imgBytes);
}

const page=pdfDoc.addPage([image.width,image.height]);

page.drawImage(image,{
x:0,
y:0,
width:image.width,
height:image.height
});

}

const pdfBytes=await pdfDoc.save();

downloadFile(pdfBytes,"converted.pdf","application/pdf");

}


/* PDF TEXT */

async function convertPDFToWord(){

const file=document.getElementById("pdfToWordFile").files[0];

const arrayBuffer=await file.arrayBuffer();

const pdf=await pdfjsLib.getDocument(arrayBuffer).promise;

let text="";

for(let i=1;i<=pdf.numPages;i++){

const page=await pdf.getPage(i);

const content=await page.getTextContent();

text+=content.items.map(item=>item.str).join(" ");

}

downloadFile(text,"extracted.txt","text/plain");

}


/* JPG → PNG */

function jpgToPng(){

let input=document.getElementById("jpgInput").files[0];

let img=new Image();

img.src=URL.createObjectURL(input);

img.onload=function(){

let canvas=document.createElement("canvas");

canvas.width=img.width;
canvas.height=img.height;

let ctx=canvas.getContext("2d");

ctx.drawImage(img,0,0);

canvas.toBlob(function(blob){

downloadFile(blob,"image.png","image/png");

});

};

}


/* QR CODE */

function generateQR(){

let text=document.getElementById("qrText").value;

document.getElementById("qr").innerHTML=
`<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${text}">`;

}


/* PASSWORD */

function generatePassword(){

let pass=Math.random().toString(36).slice(-10);

document.getElementById("password").innerText=pass;

}


/* TEXT COUNT */

function countText(){

let text=document.getElementById("textInput").value;

document.getElementById("textResult").innerText=
"Words: "+text.split(" ").length+" | Characters: "+text.length;

}


/* DOWNLOAD */

function downloadFile(data,filename,type){

const blob=new Blob([data],{type:type});

const url=URL.createObjectURL(blob);

const a=document.createElement("a");

a.href=url;

a.download=filename;

a.click();

URL.revokeObjectURL(url);

}
