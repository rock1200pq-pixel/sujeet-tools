/* PDF MERGE */

async function mergePDF(){

const files=document.getElementById("mergeFiles").files;

if(files.length<2){
alert("Select at least 2 PDFs");
return;
}

const mergedPdf=await PDFLib.PDFDocument.create();

for(let file of files){

const bytes=await file.arrayBuffer();

const pdf=await PDFLib.PDFDocument.load(bytes);

const copiedPages=await mergedPdf.copyPages(pdf,pdf.getPageIndices());

copiedPages.forEach((page)=>mergedPdf.addPage(page));

}

const pdfBytes=await mergedPdf.save();

downloadFile(pdfBytes,"merged.pdf","application/pdf");

}



/* PDF SPLIT */

async function splitPDF(){

const file=document.getElementById("splitFile").files[0];

const bytes=await file.arrayBuffer();

const pdf=await PDFLib.PDFDocument.load(bytes);

const pageCount=pdf.getPageCount();

for(let i=0;i<pageCount;i++){

const newPdf=await PDFLib.PDFDocument.create();

const [page]=await newPdf.copyPages(pdf,[i]);

newPdf.addPage(page);

const pdfBytes=await newPdf.save();

downloadFile(pdfBytes,"page_"+(i+1)+".pdf","application/pdf");

}

}



/* IMAGE COMPRESS */

function compressImage(){

const file=document.getElementById("compressImg").files[0];

const img=new Image();

img.src=URL.createObjectURL(file);

img.onload=function(){

const canvas=document.createElement("canvas");

canvas.width=img.width/2;

canvas.height=img.height/2;

const ctx=canvas.getContext("2d");

ctx.drawImage(img,0,0,canvas.width,canvas.height);

canvas.toBlob(function(blob){

downloadFile(blob,"compressed.jpg","image/jpeg");

},'image/jpeg',0.6);

};

}



/* IMAGE TO PDF */

async function imageToPDF(){

const files=document.getElementById("imgPDF").files;

const pdfDoc=await PDFLib.PDFDocument.create();

for(let file of files){

const imgBytes=await file.arrayBuffer();

let image;

if(file.type.includes("png")){
image=await pdfDoc.embedPng(imgBytes);
}else{
image=await pdfDoc.embedJpg(imgBytes);
}

const page=pdfDoc.addPage([image.width,image.height]);

page.drawImage(image,{x:0,y:0,width:image.width,height:image.height});

}

const pdfBytes=await pdfDoc.save();

downloadFile(pdfBytes,"images.pdf","application/pdf");

}



/* JPG → PNG */

function jpgToPng(){

const file=document.getElementById("jpgFile").files[0];

const img=new Image();

img.src=URL.createObjectURL(file);

img.onload=function(){

const canvas=document.createElement("canvas");

canvas.width=img.width;

canvas.height=img.height;

const ctx=canvas.getContext("2d");

ctx.drawImage(img,0,0);

canvas.toBlob(function(blob){

downloadFile(blob,"image.png","image/png");

});

};

}



/* QR GENERATOR */

function qrGenerator(){

const text=document.getElementById("qrText").value;

document.getElementById("qrResult").innerHTML=

`<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${text}">`;

}



/* IMAGE TEXT EXTRACT */

async function extractText(){

const file=document.getElementById("ocrImage").files[0];

const result=await Tesseract.recognize(file,'eng');

const text=result.data.text;

const csv="Text\n"+text.replace(/\n/g,"\n");

downloadFile(csv,"text.csv","text/csv");

}



/* DOWNLOAD HELPER */

function downloadFile(data,filename,type){

const blob=new Blob([data],{type:type});

const url=URL.createObjectURL(blob);

const a=document.createElement("a");

a.href=url;

a.download=filename;

a.click();

URL.revokeObjectURL(url);

  }
