let search=document.getElementById("search");

if(search){

search.addEventListener("keyup",function(){

let value=this.value.toLowerCase();

let cards=document.querySelectorAll(".tool-card");

cards.forEach(card=>{

card.style.display=card.innerText.toLowerCase().includes(value) ? "block":"none";

});

});

}
