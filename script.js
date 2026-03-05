const { PDFDocument } = PDFLib;

async function mergePDFs(){

const files = document.getElementById("mergeFiles").files;

if(files.length < 2){
alert("Select at least 2 PDFs");
return;
}

const mergedPdf = await PDFDocument.create();

for (let file of files){

const bytes = await file.arrayBuffer();

const pdf = await PDFDocument.load(bytes);

const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

copiedPages.forEach((page) => mergedPdf.addPage(page));

}

const pdfBytes = await mergedPdf.save();

downloadFile(pdfBytes,"merged.pdf","application/pdf");

}



async function convertImageToPDF(){

const files = document.getElementById("imageFiles").files;

if(files.length === 0){
alert("Select image");
return;
}

const pdfDoc = await PDFDocument.create();

for(let file of files){

const imgBytes = await file.arrayBuffer();

let image;

if(file.type.includes("png")){
image = await pdfDoc.embedPng(imgBytes);
}else{
image = await pdfDoc.embedJpg(imgBytes);
}

const page = pdfDoc.addPage([image.width,image.height]);

page.drawImage(image,{
x:0,
y:0,
width:image.width,
height:image.height
});

}

const pdfBytes = await pdfDoc.save();

downloadFile(pdfBytes,"converted.pdf","application/pdf");

}



async function convertPDFToWord(){

const file = document.getElementById("pdfToWordFile").files[0];

if(!file){
alert("Select PDF");
return;
}

const arrayBuffer = await file.arrayBuffer();

const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

let text = "";

for(let i=1;i<=pdf.numPages;i++){

const page = await pdf.getPage(i);

const content = await page.getTextContent();

text += content.items.map(item=>item.str).join(" ") + "\n\n";

}

downloadFile(text,"extracted.txt","text/plain");

}



function downloadFile(data,filename,type){

const blob = new Blob([data],{type:type});

const url = URL.createObjectURL(blob);

const a = document.createElement("a");

a.href = url;

a.download = filename;

a.click();

URL.revokeObjectURL(url);

}
