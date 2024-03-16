/*
prettylist.js:
gestisce classi css di tipo lista creando l'animazione quando si clicca
*/

window.onload = function()
{
	var prettylists = document.getElementsByClassName("list");
	for(var i = 0;i < prettylists.length;i++)
	{
		// per ogni lista
		var prettylist = prettylists[i];
		for(var j = 0; j < prettylist.children.length;j++)
		{
			// per ogni item
			var item = prettylist.children[j]
			item.onmouseover = function()
			{
				this.style.backgroundColor = 'black';
				this.style.color = 'white';
			}
			item.onmouseout = function()
			{
				this.style.backgroundColor = 'white';
				this.style.color = 'black';
			}
		}
	}
}
