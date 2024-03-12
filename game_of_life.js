  function game_of_life(c)
  {
  const canvas = document.getElementById('c');
  const gpu = new window.GPU.GPU({
    canvas: canvas,
    mode: 'gpu'
  });
  const dim = 512;
  
  const computation = gpu.createKernel(
	function (x) {
		let v = x[ this.thread.y ][this.thread.x ];
		let c = 0;
		for ( let i = - 1;i <= 1;i++)
			{
			for ( let j = - 1; j <= 1;j++)
				{
					if( ( this.thread.y +i > 0 ) && ( this.thread.x + j > 0 ))
						if( ( this.thread.y + i < (512-1) ) && ( this.thread.x + j < (512-1) ))
							if( !(i == 0 && j == 0))
								c += x[ this.thread.y + i ][this.thread.x + j]
				}
			}
		
		if(c < 2)
			return 0;
		else 
			if ( c >= 2 && c <= 3)
			{
				if(c == 3)
				{
					return 1;
				}
				return x[ this.thread.y ][this.thread.x ]
			}
			else
				return 0;
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
      this.color(
        1-x[this.thread.y][this.thread.x],
        1-x[this.thread.y][this.thread.x],
        1-x[this.thread.y][this.thread.x],
        1
      );
    },
    {
      useLegacyEncoder: true,
      output: [dim, dim],
      graphical: true
    }
  );

  
	function random_init(rows, columns) {
	  const randomArray = [];

	  for (let i = 0; i < rows; i++) {
		const row = [];
		for (let j = 0; j < columns; j++) {
		  // Generate a random number (either 0 or 1)
		  const randomNumber = (Math.random() < 0.1)*1.;
		  row.push(randomNumber);
		}
		randomArray.push(row);
	  }
	  return randomArray;
	}

  let data = random_init(dim,dim);
  interval = 10
  const doDraw = () => {
	data = computation(data);
    graphics(data);
	setTimeout(() => {
	   window.requestAnimationFrame(doDraw)
	}, interval);
  };

  window.requestAnimationFrame(doDraw);
  }