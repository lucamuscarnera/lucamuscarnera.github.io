function navier_stokes(c)
{
  /* INIZIALIZZO L'AMBIENTE */
  const canvas = document.getElementById(c);
  const gpu = new window.GPU.GPU({
    canvas: canvas,
    mode: 'gpu'
  });
  const dim_x = 1024;
  const dim_y = 256;
  
  /* ALCUNI KERNEL UTILI*/
  // zero kernel
  const zero = gpu.createKernel(
	function()
	{
		return 0
	},
	{
	  useLegacyEncoder: true,
	  output: [dim_x, dim_y],
	  graphical: false,
	  immutable: false
	}
  ).setPipeline(true);
  
  const const_init = gpu.createKernel(
	function(k)
	{
		return k
	},
	{
	  useLegacyEncoder: true,
	  output: [dim_x, dim_y],
	  graphical: false,
	  immutable: true
	}
  ).setPipeline(true);
    
  
  // somma di matrici
  const sum = gpu.createKernel(
	function (A,B) {
		let x = this.thread.x;
		let y = this.thread.y;
		return A[y][x] + B[y][x]
	}
    ,
    {
      useLegacyEncoder: true,
      output: [dim_x, dim_y],
      graphical: false,
	  immutable: true
    }
  ).setPipeline(true);

// immutable assignment : supponiamo di avere uno statemente
// nella forma
// 
//       A = f(A,...)
//
// É possibile unicamente se il kernel é IMMUTABILE, ma dobbiamo gestire la
// memoria

function apply_overwrite(f,data)
{
	let new_data = f(data);  		   // costruisco un nuovo frame
	data.delete()                      // cancello quello vecchio 
	return new_data;
}



  // costruisco la funzione che forza le condizioni al bordo
  // per u_x
  const ux_boundary = gpu.createKernel(
	function (u_xt,p_t,h,dim_x,dim_y) {
		let x = this.thread.x;
		let y = this.thread.y;
		
		let norma = Math.abs(x - dim_x/10)**2 + Math.abs(y - dim_y/2)**2
		if( norma < 100 )
		{
			return 0;
		}
		else
		{
			if(x < 10)
			{
				//if( Math.abs(y - dim/2) < dim/16)
				return 20.;
				//return 0;
			}
			else
			{
				if((y == 0) || (y == (dim_y - 1)))
				{
					return 0;
				}
				else 
				{
					if( x == (dim_x - 1) )
					{
						return  u_xt[y][x - 1] + h *  ( p_t[y][x] - 1.0)
					}
				}
			}
			return u_xt[y][x];
		}
	}
    ,
    {
      useLegacyEncoder: true,
      output: [dim_x, dim_y],
      graphical: false,
	  immutable: true
    }
  ).setPipeline(true);


  // per u_y
  const uy_boundary = gpu.createKernel(
	function (u_yt,dim_x,dim_y) {
		let x = this.thread.x;
		let y = this.thread.y;
		
		let norma =  Math.abs(x - dim_x/10)**2 + Math.abs(y - dim_y/2)**2
		if( norma < 100 )
		{
			return 0;
		}
		else
		{
			if(x < 10)
			{
				return 0;
			}
			else
			{
				if((y == 0) || (y == (dim_y - 1)) || (x == (dim_x - 1) ))
				{
					return 0;
				}
			}
			return u_yt[y][x];
		}
	}
    ,
    {
      useLegacyEncoder: true,
      output: [dim_x, dim_y],
      graphical: false,
	  immutable: true
    }
  ).setPipeline(true);
  // costruisco i kernel che prendono in ingresso le soluzioni all'istante t - 1
  // e restituiscono la soluzione all'istante t
  // U_x
  const computation_u_xt = gpu.createKernel(
	function (u_xt_1,u_yt_1,p_t_1,dim_x,dim_y,rho,nu,h,dt) {
		let x = this.thread.x;
		let y = this.thread.y;
		if(x > 0 && x < (dim_x - 1))
		{
			if( y > 0 && y < (dim_y - 1))
			{
				let dudx_xt_1 = (u_xt_1[y][x + 1] - u_xt_1[y][x - 1])/(2 * h)
				let dudy_xt_1 = (u_xt_1[y + 1][x] - u_xt_1[y - 1][x])/(2 * h)
				let dpdx      = (p_t_1[y][x + 1] - p_t_1[y][x - 1])/(2 * h)
				
				let dudxx_xt_1 = (u_xt_1[y][x + 1] - 2 * u_xt_1[y][x] + u_xt_1[y][x - 1])/(h*h)
				let dudyy_xt_1 = (u_xt_1[y + 1][x] - 2 * u_xt_1[y][x] + u_xt_1[y - 1][x])/(h*h)
				let dudxx_yt_1 = (u_yt_1[y][x + 1] - 2 * u_yt_1[y][x] + u_yt_1[y][x - 1])/(h*h)
				let dudyy_yt_1 = (u_yt_1[y + 1][x] - 2 * u_yt_1[y][x] + u_yt_1[y - 1][x])/(h*h)
				
				let laplaciano = dudxx_xt_1 + dudyy_xt_1;
				
				return u_xt_1[y][x] - dt * ( u_xt_1[y][x] * dudx_xt_1 + u_yt_1[y][x] * dudy_xt_1) - dt * 1/rho * dpdx + dt * nu * laplaciano ;
			}
		}
		return u_xt_1[y][x]; // se la sbrigano le boundary  conditions
	}
    ,
    {
      useLegacyEncoder: true,
      output: [dim_x, dim_y],
      graphical: false,
	  immutable: true
    }
  ).setPipeline(true);

  // U_y
  const computation_u_yt = gpu.createKernel(
	function (u_xt_1,u_yt_1,p_t_1,dim_x,dim_y,rho,nu,h,dt) {
		let x = this.thread.x;
		let y = this.thread.y;
		if(x > 0 && x < (dim_x - 1))
		{
			if( y > 0 && y < (dim_y - 1))
			{
				let dudx_yt_1 = (u_yt_1[y][x + 1] - u_yt_1[y][x - 1])/(2 * h)
				let dudy_yt_1 = (u_yt_1[y + 1][x] - u_yt_1[y - 1][x])/(2 * h)
				let dpdy      = (p_t_1[y + 1][x] - p_t_1[y - 1][x])/(2 * h)

				let dudxx_xt_1 = (u_xt_1[y][x + 1] - 2 * u_xt_1[y][x] + u_xt_1[y][x - 1])/(h*h)
				let dudyy_xt_1 = (u_xt_1[y + 1][x] - 2 * u_xt_1[y][x] + u_xt_1[y - 1][x])/(h*h)
				let dudxx_yt_1 = (u_yt_1[y][x + 1] - 2 * u_yt_1[y][x] + u_yt_1[y][x - 1])/(h*h)
				let dudyy_yt_1 = (u_yt_1[y + 1][x] - 2 * u_yt_1[y][x] + u_yt_1[y - 1][x])/(h*h)
				
				let laplaciano = dudxx_yt_1 + dudyy_yt_1;
				
				return u_yt_1[y][x]  - dt * ( u_xt_1[y][x] * dudx_yt_1 + u_yt_1[y][x] * dudy_yt_1) - dt* 1./rho * dpdy + dt* nu * laplaciano ;
			}
		}
		return u_xt_1[y][x]; // se la sbrigano le boundary  conditions
	}
    ,
    {
      useLegacyEncoder: true,
      output: [dim_x, dim_y],
      graphical: false,
	  immutable: true
    }
  ).setPipeline(true); 
 
  // p_y
  const computation_p_t = gpu.createKernel(
	function (u_xt_1,u_yt_1,p_t_1,dim_x,dim_y, rho,nu,h,dt) {
		let x = this.thread.x;
		let y = this.thread.y;
		if(x > 0 && x < (dim_x - 1))
		{
			if( y > 0 && y < (dim_y - 1))
			{
				let dudx_xt_1 = (u_xt_1[y][x + 1] - u_xt_1[y][x - 1])/(2 * h)
				let dudy_yt_1 = (u_yt_1[y + 1][x] - u_yt_1[y - 1][x])/(2 * h)
				let Du = dudx_xt_1  + dudy_yt_1
				return p_t_1[y][x] - dt * (300**2) * Du
			}
		}
		return p_t_1[y][x];
	}
    ,
    {
      useLegacyEncoder: true,
      output: [dim_x, dim_y],
      graphical: false,
	  immutable: true
    }
  ).setPipeline(true); 
 
  const graphics = gpu.createKernel(
    function(u_xt,u_yt,p_t) {
	  
	  let x = this.thread.x;
	  let y = this.thread.y
	  
	
	  let u_x = u_xt[y][x];
	  let u_y = u_yt[y][x];
	  let p   = p_t[y][x]
	  
	  if(u_y > 0.)
		  this.color(
			 u_y,
			 u_y,
			 u_y
		  );
	  else
		if( u_y < 0. )
			this.color(
			 -u_y,
			 -u_y,
			 -u_y
		  );
		else
		{
		  this.color(
			 0.,
			 0.,
			 0.
		  );
		}
    },
    {
      useLegacyEncoder: true,
      output: [dim_x, dim_y],
      graphical: true,
	  immutable: false
    }
  );
  
  
  const ray_graphics = gpu.createKernel(
    function(p_ref,delta,u_xt,u_yt,p_t) {
	  
	  let x = this.thread.x;
	  let y = this.thread.y
	  
	
	  let u_x = u_xt[y][x];
	  let u_y = u_yt[y][x];
	  let p   = p_t[y][x]
	  
	  if(Math.abs( Math.abs(u_y*5) - Math.floor(Math.abs(u_y*5)) ) < delta)
		{
			this.color(
				Math.abs( Math.abs(u_y) - Math.floor(Math.abs(u_y)) ) ,
				Math.abs( Math.abs(u_y) - Math.floor(Math.abs(u_y)) ) ,
				Math.abs( Math.abs(u_y) - Math.floor(Math.abs(u_y)) ) ,
			)
		}
		else
		{
			this.color(
				0.,
				0.,
				0.,
			)
		}
    },
    {
      useLegacyEncoder: true,
      output: [dim_x, dim_y],
      graphical: true,
	  immutable: false
    }
  );

 

  let u_x = const_init(1.);
  let u_y = const_init(0.01);
  let p   = const_init(0.);  
  
  interval = 0.
  
  param = 0.
  const doDraw = () => {	
  
	
  	let rho = 30.;
	let nu  =  10.;
	let dt = 1.0e-2;
	let h  = 1.0;
		
	let new_u_x = ux_boundary(u_x,p,h,dim_x,dim_y);
	u_x.delete();
	u_x = new_u_x;
	
	let new_u_y = uy_boundary(u_y,dim_x,dim_y);
	u_y.delete();
	u_y = new_u_y;

	graphics(u_x,u_y,p)
	
	
	new_u_x = computation_u_xt(u_x,u_y,p,dim_x,dim_y,rho,nu,h,dt);
	u_x.delete();
	u_x = new_u_x;
	// stabilizzazione
	new_u_x = computation_u_xt(u_x,u_y,p,dim_x,dim_y,rho,nu,h,dt);
	u_x.delete();
	u_x = new_u_x;
	// stabilizzazione

	
	new_u_y = computation_u_yt(u_x,u_y,p,dim_x,dim_y,rho,nu,h,dt);

	u_y.delete();
	u_y = new_u_y;
	

	// stabilizzazione

	
	new_p   = computation_p_t(u_x,u_y,p,dim_x,dim_y,rho,nu,h,dt);
	p.delete();
	p   = new_p;
	
	/*new_u_x = ux_boundary(u_x,p,h,dim_x,dim_y);
	u_x.delete();
	u_x = new_u_x;
	
	new_u_y = uy_boundary(u_y,dim_x,dim_y);
	u_y.delete();
	u_y = new_u_y;*/


//	ray_graphics(1.0,.5,u_x,u_y,p)

	setTimeout(() => {
	  return  window.requestAnimationFrame(doDraw)
	}, interval);
  };

  window.requestAnimationFrame(doDraw);
}