function percolation(c)
  {
  const canvas = document.getElementById(c);
  const gpu = init_GPU({
    canvas: canvas,
    mode: 'gpu'
  });
  const dim = 1024;
  
  const computation = gpu.createKernel(
	function (x) {
		let c = x[ this.thread.y ][this.thread.x]; // numero di vicini
		
		for ( let i = - 1;i <= 1;i++)
		{
			if(this.thread.y + i > 0 )
				if( this.thread.y + i < (1024-1))
					if(!(i == 0))
						if(c <= x[ this.thread.y + i ][this.thread.x])
							if(x[ this.thread.y + i ][this.thread.x] >= 0) // flag "buco"
								c = x[ this.thread.y + i ][this.thread.x]
		}

		
		for ( let j = - 1;j <= 1;j++)
		{
				if(this.thread.x + j > 0 )
					if( this.thread.x + j < (1024-1))
						if(!(j == 0))
							if(c <= x[ this.thread.y][this.thread.x + j])
								if(x[ this.thread.y][this.thread.x + j] >= 0) // flag "buco"
									c = x[this.thread.y][this.thread.x + j]
		}
		
		if(x[this.thread.y][this.thread.x] > 0) // se era uno pieno
			return c;
		else
			return -1;
	}
    ,
    {
      useLegacyEncoder: true,
      output: [dim, dim],
      graphical: false,
	  immutable: true
    }
  ).setPipeline(true);
  
  
  
  const graphics = gpu.createKernel(
    function(x) {
	  if(x[this.thread.y][this.thread.x] > 0)
		this.color(
			1 - x[this.thread.y][this.thread.x] / (1024*1024),
			1 - x[this.thread.y][this.thread.x]/ (1024*1024),
			1 - x[this.thread.y][this.thread.x]/ (1024*1024),1
		);
	  else
		this.color(0,0,0,1);
    },
    {
      useLegacyEncoder: true,
      output: [dim, dim],
      graphical: true
    }
  );


 const random = gpu.createKernel(
    function() {
	  let x = Math.random()
	  if(x < 0.6) // probabilitá di accensione
		  return this.thread.y * 1024 + this.thread.x;
	  return -1
    },
    {
      useLegacyEncoder: true,
      output: [dim, dim],
      graphical: false,
	  immutable : true
    }
  ).setPipeline(true);
  

  let data = random();

  interval = 0
  const doDraw = () => {
	for(let i = 0 ; i < 5;i ++)				// plotto la percolazione ogni 5 iterazioni per speed up
	{
		let new_data = computation(data);  // costruisco un nuovo frame
		data.delete()                      // cancello quello vecchio 
		data = new_data;                   // metto quello nuovo dentro quello vecchio
	}
    graphics(data);
	
	
	setTimeout(() => {
	   window.requestAnimationFrame(doDraw)
	}, interval);
  };

  window.requestAnimationFrame(doDraw);
  }