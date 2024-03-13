/*screen_adaptor 
@author      : Luca Muscarnera
@description : adapts the size of objects in "Latex-Like" document in order be readable indipendently by the size of the devise 
*/


function magic()
{
H = window.screen.height;
W = window.screen.width;

//// alcuni metodi matematici utili
function min(a,b) { return (a<b?a:b) }
function max(a,b) {return  (a<b?b:a) }
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};



///// TITOLI
	
	// carico i titoli
	var titoli = document.getElementsByClassName("title")
	// trovo il titolo con il maggiore numero di caratteri
	lunghezza_massima = titoli[0].innerText.length;
	for(var i = 1; i < titoli.length;i++)
	{
		lunghezza_massima = max(lunghezza_massima,titoli[i].innerText.length)
	}	
	for(var i = 0; i < titoli.length;i++)
	{
		// il titolo dovrebbe essere sempre un decimo dell'altezza dello schermo
		titoli[i].style.fontSize = min(40, 5 *W/lunghezza_massima) + 'pt';
	}


///// ASCII-ART

var ascii_arts = document.getElementsByClassName("ascii-art")
for(var i = 0; i < titoli.length;i++)
{
	// il titolo dovrebbe essere sempre un decimo dell'altezza dello schermo
	ascii_arts[i].style.fontSize = min(7, W*W/500) + "px";
}

}

window.onresize = magic;
window.onload   = magic;