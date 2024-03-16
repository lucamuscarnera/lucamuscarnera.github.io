/*
prettylist.js:
gestisce classi css di tipo lista creando l'animazione quando si clicca
*/

	//while(MathJax == undefined);
	//alert(MathJax)
	var prettylists = document.getElementsByClassName("list");
	for(var i = 0;i < prettylists.length;i++)
	{
		// per ogni lista
		var prettylist = prettylists[i];
		for(var j = 0; j < prettylist.children.length;j++)
		{
			// per ogni item
			var item = prettylist.children[j]
			item.setAttribute('preview',prettylist.getAttribute('data'))

			item.onmouseover = function()
			{
				this.style.backgroundColor = 'black';
				this.style.color = 'white';
			}
			item.onmousedown = async function()
			{
				var preview_id = this.getAttribute('preview')
				var preview = document.getElementById(preview_id);

				preview.getElementsByClassName('preview_link')[0].innerHTML = "<a href='"+ this.getAttribute('link') + "'>"+this.innerText+"</a>";
				var descrizione = preview.getElementsByClassName('preview_description')[0]
				descrizione.innerText = "\n " +  this.getAttribute('data');
				
				// codice brutto
				const mathDiv = descrizione;
				await MathJax.startup.promise 			// make sure initial typesetting has taken place
				MathJax.typesetClear([mathDiv]) 		// clear MathJax awareness of this element
				await MathJax.typesetPromise([mathDiv]) // typeset anew
				
				var lista      = this.parentElement;
				for(var k = 0 ; k < lista.children.length;k++)
				{
					var fratello = lista.children[k]
					fratello.style.fontWeight = 'normal'
				}
					this.style.fontWeight = 'bold'
				
			}
			item.onmouseout = function()
			{
				this.style.backgroundColor = 'white';
				this.style.color = 'black';
			}
		}
	}
	