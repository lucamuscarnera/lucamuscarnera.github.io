  function thorus_rain(c)
  {
  const canvas = document.getElementById(c);
  const gpu = init_GPU({
    canvas: canvas,
    mode: 'gpu'
  });
  const dim = 512;
  
  const zero = gpu.createKernel(
	function()
	{
		return 0
	},
	{
	  useLegacyEncoder: true,
      output: [dim, dim],
      graphical: false,
	  immutable: false
	}
  ).setPipeline(true);
  
   const dirac_delta = gpu.createKernel(
	function(x_pos,y_pos)
	{
		let dx = this.thread.x*1. - x_pos;
		let dy = this.thread.y*1. - y_pos;
		
		if(  dx*dx + dy*dy  < 4.)
				return 1;
		return 0;
	},
	{
	  useLegacyEncoder: true,
      output: [dim, dim],
      graphical: false,
	  immutable: true
	}
  ).setPipeline(true);
  

 const sum = gpu.createKernel(
	function (A,B) {
		let x = this.thread.x;
		let y = this.thread.y;
		return A[y][x] + B[y][x]
	}
    ,
    {
      useLegacyEncoder: true,
      output: [dim, dim],
      graphical: false,
	  immutable: true
    }
  ).setPipeline(true);

  const computation = gpu.createKernel(
	function (data_prev,data,dim) {
		let alfa = 0.9999
		
		let x = this.thread.x;
		let y = this.thread.y;
		let h  = 0.01;
		let dt = 0.005;
		
		
		let x_dx = x + 1
		let x_sx = x - 1
		let y_up = y + 1
		let y_dn = y - 1
		
		if( x_dx >= dim )
			x_dx = 0
		if( x_sx < 0 )
			x_sx = dim - 1
			
		if( y_up >= dim )
			y_up = 0
		if( y_dn < 0 )
			y_dn = dim - 1		
			
		let dx          = (data[y][x_dx] - data[y][x_sx])/(2*h) 
		let dxx         = (data[y][x_dx] - 2*data[y][x] + data[y][x_sx])/h**2
		let dyy         = (data[y_up][x] - 2*data[y][x] + data[y_dn][x])/h**2
		let laplaciano  = dxx + dyy
		
		let u_xt            = data[y][x]
		let u_xt_1          = data_prev[y][x]
		
		return  alfa * ( (dt**2) * (laplaciano) + 2 * u_xt - u_xt_1);
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
          x[this.thread.y][this.thread.x],
          x[this.thread.y][this.thread.x],
          x[this.thread.y][this.thread.x],
        1
      );
    },
    {
      useLegacyEncoder: true,
      output: [dim, dim],
      graphical: true,
	  immutable: false
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
	
	function zero_init(rows, columns) {
	  const randomArray = [];

	  for (let i = 0; i < rows; i++) {
		const row = [];
		for (let j = 0; j < columns; j++) {
		  // Generate a random number (either 0 or 1)
		  const randomNumber = 0;
		  row.push(randomNumber);
		}
		randomArray.push(row);
	  }
	  return randomArray;
	}

  let data_k_1 = zero();
  let x_pos = Math.floor(Math.random()  * dim)
  let y_pos = Math.floor(Math.random()  * dim)
  let data_k   = dirac_delta(x_pos,y_pos);
  let data_k_next = zero();
  
  interval = 10.
  
  

  const doDraw = () => {	
	let new_data_k = computation(data_k_1,data_k,dim);  // costruisco il nuovo t
	data_k_1.delete();                                  // distruggo il t - 1
	data_k_1 = data_k.clone()                           // copio il vecchio t in t - 1
	data_k.delete();                                    // distruggo il vecchio t
	data_k   = new_data_k;                              // copio il nuovo t nel vecchio t
	
	let data_k_next;
	if( Math.random() > 0.90)
	{
		let x_pos = Math.floor(Math.random()  * dim)
		let y_pos = Math.floor(Math.random()  * dim)
		let dd    = dirac_delta(x_pos,y_pos);
		data_k_next   = sum(data_k, dd);  // costruisco il nuovo nuovo t
		dd.delete();
		data_k.delete();
	} else
	{
		data_k_next   = data_k;
	}
	
	//data_k.delete();	 // distruggo il vecchio nuovo t
    graphics(data_k_next); // plot
	data_k = data_k_next;
	//data_k_next.delete();
	//data_k_next.delete();
	
	//data_tmp.delete();

	setTimeout(() => {
	   window.requestAnimationFrame(doDraw)
	}, interval);
  };

  window.requestAnimationFrame(doDraw);
  }