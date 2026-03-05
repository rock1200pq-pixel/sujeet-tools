function generatePassword(){
let pass=Math.random().toString(36).slice(-10);
document.getElementById("password").innerText=pass;
}

function countText(){
let text=document.getElementById("textInput").value;
document.getElementById("textResult").innerText=
"Words: "+text.split(" ").length+" | Characters: "+text.length;
}

function generateUUID(){
document.getElementById("uuid").innerText=crypto.randomUUID();
}

function encodeBase(){
let val=document.getElementById("baseInput").value;
document.getElementById("baseOutput").innerText=btoa(val);
}

function decodeBase(){
let val=document.getElementById("decodeInput").value;
document.getElementById("decodeOutput").innerText=atob(val);
}

function randomNumber(){
document.getElementById("random").innerText=Math.floor(Math.random()*1000);
}

function getTimestamp(){
document.getElementById("timestamp").innerText=Date.now();
}

function upperCase(){
let v=document.getElementById("caseInput").value;
document.getElementById("caseOutput").innerText=v.toUpperCase();
}

function lowerCase(){
let v=document.getElementById("caseInput").value;
document.getElementById("caseOutput").innerText=v.toLowerCase();
}

function reverseText(){
let v=document.getElementById("reverseInput").value;
document.getElementById("reverseOutput").innerText=v.split("").reverse().join("");
}

function colorGenerator(){
let color="#"+Math.floor(Math.random()*16777215).toString(16);
document.getElementById("color").innerText=color;
document.body.style.background=color;
}

function generateQR(){
let text=document.getElementById("qrText").value;
document.getElementById("qr").innerHTML=
`<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${text}">`;
}

function formatJSON(){
let j=document.getElementById("jsonInput").value;
document.getElementById("jsonOutput").innerText=
JSON.stringify(JSON.parse(j),null,2);
}

function randomQuote(){
let q=["Stay hungry stay foolish","Rock your code","Dream big","Never quit"];
document.getElementById("quote").innerText=q[Math.floor(Math.random()*q.length)];
}

function currentDate(){
document.getElementById("date").innerText=new Date().toLocaleString();
}

function randomEmoji(){
let e=["😀","🚀","🔥","💎","🎯"];
document.getElementById("emoji").innerText=e[Math.floor(Math.random()*e.length)];
}

async function showIP(){
let r=await fetch("https://api.ipify.org?format=json");
let d=await r.json();
document.getElementById("ip").innerText=d.ip;
}

function rollDice(){
document.getElementById("dice").innerText=Math.floor(Math.random()*6)+1;
}

function toBinary(){
let n=document.getElementById("binaryInput").value;
document.getElementById("binaryOutput").innerText=parseInt(n).toString(2);
}

function charCount(){
let t=document.getElementById("charInput").value;
document.getElementById("charOutput").innerText=t.length;
}

function checkPalindrome(){
let t=document.getElementById("palInput").value;
let r=t.split("").reverse().join("");
document.getElementById("palOutput").innerText=
(t==r)?"Palindrome":"Not Palindrome";
}
