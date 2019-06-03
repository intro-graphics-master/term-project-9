import {tiny, defs} from './assignment-4-resources.js';
import { Shape_From_File } from './obj-file-demo.js';


// import { Obj_File_Demo } from './obj-file-demo.js';
                                                                // Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Shader, Material, Texture,
         Scene, Canvas_Widget, Code_Widget, Text_Widget } = tiny;
const { Cube, Subdivision_Sphere, Transforms_Sandbox_Base } = defs;

    // Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and assignment-4-resources.js.
    // This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.
// (Can define Main_Scene's class here)
const blue = Color.of( 0,0,.5,1 ), yellow = Color.of( .5,.5,0,1 ), white = Color.of(1.0,1.0,1.0,1.0), red = Color.of(1.0, 0.0, 0.0,1), faceColor = Color.of(0.96, 0.87, 0.56,1), brown = Color.of(0.62, 0.31, 0.0, 1);

var path = [];
var counter = 0;
var coins = [];
var boxes = [];
var ground_boxes = [];
var sky_boxes = [];
var frame = 0;
var bullet_material;
var delta;
var mario_pos;

//TODO: implement score calculation
 var coinScore = 0;
//reviving structure
var revivePoints = [];
//TODO: edit back to 0
var currentRPIndex = 2;
//store riving points
//TODO: EDIT POINTS
//0:
revivePoints.push(Vec.of(-17, 20, 0));
//1:
revivePoints.push(Vec.of(-1, 20, 0));
//2:
revivePoints.push(Vec.of(95, 20, 0)); //just after horizontally moving plank
//3:
const level2StartingPointIndex = 3;
revivePoints.push(Vec.of(103, 20, 0));//starting point of level2
//4:
revivePoints.push(Vec.of(113, 20, 0));//after "box tower"
//5:
revivePoints.push(Vec.of(132, 20, 0));//flag

class physics_component
{
   constructor(mass, shape, position = Vec.of(0,0,0), rotation = Vec.of(0,0,0), time_dilation=1000)
   {
    this.accleration =  Vec.of( 0,0,0 );
    this.velocity = Vec.of(0,0,0);
    this.position = position;

    this.transforms = Mat4.identity();
    this.transform_position= Mat4.identity();

    this.rotation = rotation;
	this.scale = Vec.of(1,1,1);
    this.mass = mass;
    this.g = -9.8/time_dilation;

    this.surface_friction_constant = 0.5;
    this.time_dilation = time_dilation;

    this.gravity_enabled = false;
    this.physics_enabled = false;
    this.collision_enabled = false;
    this.visible = true;
    this.controllable = false;

    this.jumpStart = false;

    this.ground = -100000;
    this.ground_angle = 0;
    this.shape = shape;

    if(shape == "cube")
      this.object_type  = new Cube();

    else if (shape == "sphere")
      this.object_type = new Subdivision_Sphere( 4 );

	else if (shape == "coin")
	{
		this.object_type = new Shape_From_File( "assets/dogecoin.obj" );
      	this.rotation = Vec.of(0,Math.PI/2.0,0);
      	// this.physics_enabled = true;
	}

	else if (shape == "plank")
	{
		this.object_type = new Shape_From_File( "assets/plank.obj" );
	}



   }



    apply_impulse(impulse)
    {
      for( var i = 0; i < 3; i ++)
        impulse[i] = impulse[i]/this.time_dilation;

      this.velocity  = this.velocity.plus(Vec.of(impulse[0]/this.mass, impulse[1]/this.mass,impulse[2]/this.mass));

    }

    update_acceration_override(accleration)
    {
      this.accleration = accleration;
    }

    update_velocity_override(velocity)
    {
      this.velocity = velocity;

    }
    update_position_override(position)
    {
      this.position = position;
    }

    update_position_add(position)
    {
      this.position = this.position.plus(position);
    }
    update_rotation_override(rotation)
    {
      this.rotation = rotation;
    }
    update_scale_override(scale)
    {
      this.scale = scale;
    }
    update_visibiliy(visibility)
	{
		if(visibility == true)
			this.visible = true;
		else if (visibility == false)
			this.visible = false;
		else
			console.log("Code Error: Invalid visibility value: visibility should either be true or false.\n")
	}

    compute_next()
    {


       if (this.gravity_enabled && this.position[1] > this.ground ){
        this.accleration = this.accleration.plus(Vec.of(0,this.g,0));
       }

       this.velocity = this.velocity.plus(this.accleration);
       var TempVelocity = this.velocity.times(1);

       // TODO: compute drag
	   var TempPosition  = 	this.position.plus(TempVelocity);


	   if(TempPosition[1] >= this.ground){
       	this.position = this.position.plus(TempVelocity);
	   }


       this.accleration = Vec.of(0,0,0);
    }


    update_transform(){
       this.transforms = Mat4.identity();
       this.transforms = this.transforms.times(Mat4.translation(this.position));
       this.transform_position = this.transforms;
       this.transforms = this.transforms.times(Mat4.rotation(this.rotation[0], [1,0,0]));
       this.transforms = this.transforms.times(Mat4.rotation(this.rotation[1], [0,1,0]));
       this.transforms = this.transforms.times(Mat4.rotation(this.rotation[2], [0,0,1]));
       this.transforms = this.transforms.times(Mat4.scale(this.scale));
    }

    draw(context, program_state, material)
    {
		if(this.visible)
		{
		      this.update_transform();
		      this.object_type.draw(context, program_state, this.transforms, material);
		      this.compute_next();
		}

    }

}


class pushable_box extends physics_component
{
	constructor()
	{
		super();
		this.object_type = new Cube();

      	this.gravity_enabled = true;
      	this.on_the_ground = true;
      	//this.rotation=Vec.of(0,0,Math.PI/4);

	}

	move_right()
    {

// 	   if(this.position[1] == this.ground+1)
//        		this.on_the_ground = true;
//        else
//        	  this.on_the_ground = false;

        var tempPosition = this.position.plus(Vec.of(0.1,0.1*Math.tan(this.ground_angle),0));
        var tempGround = -10000;
        var tempRotation = 0;
        var oldTempGround= -1000;

	   		//this.position[0] = this.ground;
	   		var i;
	   		for (i = 0; i < path.length; i++)
	   		{
	   			if(i == 0)
	   			{
	   				tempGround  = -100000;
	   			}
	   			if (tempPosition[0]-1 >= path[i].left_x  && tempPosition[0] < path[i].right_x )
	   			{

	   				if( path[i].left_height < path[i].right_height )
	   				{
	   					tempGround  =  Math.max(path[i].left_height +   ( tempPosition[0] - path[i].left_x ), tempGround  );
						if(oldTempGround != tempGround)
							tempRotation = Math.PI/4;
						oldTempGround = tempGround;
	   				}

	   				else if (path[i].left_height == path[i].right_height)
	   				{
	   					tempGround  = Math.max(path[i].left_height, tempGround );
	   					tempRotation = 0;
	   					oldTempGround = tempGround;
	   				}

	   				else{
	   					tempGround  =  Math.max(path[i].left_height -  ( tempPosition[0] - path[i].left_x ), tempGround );
						if(oldTempGround != tempGround)
							tempRotation = -Math.PI/4;
						oldTempGround = tempGround;
	   				}

	   			}

	   		}

	   		//this.position[1] = this.ground;


		for(i = 0;  i< ground_boxes.length; i++)
		{
			if(ground_boxes[i].position[0] == this.position[0] && ground_boxes[i].position[1] == this.position[1] && ground_boxes[i].position[2] == this.position[2])
				continue;
			if(tempPosition[0] >= ground_boxes[i].position[0]-1 &&  tempPosition[0] <= ground_boxes[i].position[0]+1 )
			{
				tempGround = Math.max(ground_boxes[i].position[1]+2, tempGround);

			}
		}

	   	if(tempGround - (tempPosition[1]+1) <= 0.6  ){

        	this.update_position_add(Vec.of(0.1,0.1*Math.tan(this.ground_angle),0));
        	this.rotation[2] = tempRotation;
	   	}

    }

    move_left()
    {

// 	   if(this.position[1] == this.ground)
//        		this.on_the_ground = true;
//        else
//        	  this.on_the_ground = false;

   		var tempPosition = this.position.plus(Vec.of(-0.1,-0.1*Math.tan(this.ground_angle),0));
        var tempGround = -10000;
        var oldTempGround= -1000;
        var tempRotation = 0;

	   		//this.position[0] = this.ground;
		var i;
		for (i = 0; i < path.length; i++)
		{
			if(i == 0)
				tempGround  = -100000;

			if (tempPosition[0] >= path[i].left_x  && tempPosition[0] < path[i].right_x )
			{


				if( path[i].left_height < path[i].right_height ){
					tempGround  =  Math.max(path[i].left_height +   ( tempPosition[0] - path[i].left_x ), tempGround  );
					if(oldTempGround != tempGround)
					tempRotation = Math.PI/4;
					oldTempGround = tempGround;

				}


				else if (path[i].left_height == path[i].right_height)
				{
					tempGround  = Math.max(path[i].left_height, tempGround );

					oldTempGround = tempGround;
				}
				else{
					tempGround  =  Math.max(path[i].left_height -  ( tempPosition[0] - path[i].left_x ) , tempGround );
					if(oldTempGround != tempGround)
						tempRotation = -Math.PI/4;
					oldTempGround = tempGround;
				}
			}
		}

	   		//this.position[1] = this.ground;

	   	if(tempGround - (tempPosition[1]+1) <= 0.6  ){
        	this.update_position_add(Vec.of(-0.1,-0.1*Math.tan(this.ground_angle),0));
        	this.rotation[2] = tempRotation;
//         	if (tempRotation == -Math.PI/4)
//         	this.update_position_add(Vec.of(-1,2,0));

	   	}


    }


    compute_next()
    {


		var offset = Vec.of(0,0,0);
		var tempGround = -10000;
		var i;
		for (i = 0; i < path.length; i++)
		{
			if(i == 0)
				this.ground = -100000;

			if (this.position[0] >= path[i].left_x  && this.position[0] <= path[i].right_x )
			{

				if( path[i].left_height < path[i].right_height )
				{
					this.ground =  Math.max(path[i].left_height +   ( this.position[0] - path[i].left_x ) , this.ground );
					this.ground_angle = path[i].angle;
					if(tempGround != this.ground)
						offset = Vec.of(0,0,0);
					tempGround = this.ground;

				}
				else if (path[i].left_height == path[i].right_height)
				{
					this.ground = Math.max(path[i].left_height - 1, this.ground);
					this.ground_angle = path[i].angle;
// 					if(tempGround != this.ground)
// 						offset = Vec.of(0,0,0);
					tempGround = this.ground;

				}
				else{
					this.ground =  Math.max(path[i].left_height -  ( this.position[0] - path[i].left_x ) , this.ground);
					this.ground_angle = path[i].angle;
// 					if(tempGround != this.ground)
// 						offset = Vec.of(0,0.2,0);
					tempGround = this.ground;

				}

			}

		}


// 	   if(this.ground +1 <= this.position[1])
// 	   		this.on_the_ground = true;



       if (this.position[1]+1 > this.ground){
        this.accleration = this.accleration.plus(Vec.of(0,this.g,0));

       }





       this.velocity = this.velocity.plus(this.accleration);
       var TempVelocity = this.velocity.times(delta/17.0);

       // TODO: compute drag
	   var TempPosition  = 	this.position.plus(TempVelocity);


	   if(TempPosition[1]+1  > this.ground ){
       	this.position = this.position.plus(TempVelocity);


	   }

       this.accleration = Vec.of(0,0,0);


       if (this.position[1] < this.ground+0.1 )
       {

        this.velocity = Vec.of(0,0,0);
        this.position[1] = this.ground;
       }
       else if ( Math.abs(this.position[1] - this.ground) <= 1.3 && Math.abs(this.position[1] - this.ground) > 1 )
       {
        	 this.velocity = Vec.of(0,0,0);
        	 this.position[1] = this.ground;

       }

       this.position = this.position.plus(offset);




    }
}

class mario extends physics_component
{

	constructor()
	{
		super();
		this.object_type = new Shape_From_File( "assets/mario/mario.obj" );
		this.obj_redhead = new Shape_From_File( "assets/mario/red.obj" );
		this.obj_face = new Shape_From_File( "assets/mario/face.obj" );
		this.obj_chest = new Shape_From_File( "assets/mario/chest.obj" );
		this.obj_body = new Shape_From_File( "assets/mario/bluebody.obj" );
		this.obj_hands = new Shape_From_File( "assets/mario/whitehands.obj" );
		this.obj_feet = new Shape_From_File( "assets/mario/brownfeet.obj" );


      	this.rotation = Vec.of(0,Math.PI/2.0,0);
      	this.position = Vec.of(-17,-3,0);
      	this.controllable = true;
      	this.physics_enabled = true;
      	this.gravity_enabled = true;

      	this.jump_count = 0;

      	this.bullets =[];
      	this.bullets_transform= [];
      	this.bullet_speed = [];
      	//new Subdivision_Sphere( 6 );

      	this.bullet_material = bullet_material;

	}

	shoot()
	{
		var bullet_transforms;

		while(this.bullets_transform.length > 5)
		{
			this.bullets_transform.shift();
			this.bullets.shift();
			this.bullet_speed.shift();
		}

		this.update_transform();

		if( Math.abs(this.rotation[1] - Math.PI/2) <= 0.001 )
		{
			bullet_transforms = this.transform_position.times(Mat4.translation([1,0,0]));
			this.bullet_speed.push(1);
		}
		else
		{
			bullet_transforms = this.transform_position.times(Mat4.translation([-1,0,0]));
			this.bullet_speed.push(-1);
		}

		this.bullets_transform.push(bullet_transforms);

		this.bullets.push(new Subdivision_Sphere( 6 ));




	}


	move_right()
    {

        this.rotation = Vec.of(0,Math.PI/2.0,0);
        var tempPosition = this.position.plus(Vec.of(0.1,0.1*Math.tan(this.ground_angle),0));
        var tempGround = -10000;

	   		//this.position[0] = this.ground;
	   		var i;
	   		for (i = 0; i < path.length; i++)
	   		{
	   			if(i == 0)
	   			{
	   				tempGround  = -100000;
	   			}
	   			if (tempPosition[0] >= path[i].left_x  && tempPosition[0] <= path[i].right_x )
	   			{

	   				if( path[i].left_height < path[i].right_height )
	   					tempGround  =  Math.max(path[i].left_height +   ( tempPosition[0] - path[i].left_x ), tempGround  );

	   				else if (path[i].left_height == path[i].right_height)
	   					tempGround  = Math.max(path[i].left_height, tempGround );

	   				else{
	   					tempGround  =  Math.max(path[i].left_height -  ( tempPosition[0] - path[i].left_x ) + Math.sqrt(2), tempGround );
	   				}

	   			}

	   		}

	   		//this.position[1] = this.ground;

		for(i = 0;  i< ground_boxes.length; i++)
		{
			if(tempPosition[0] >= ground_boxes[i].position[0]-1 &&  tempPosition[0] <= ground_boxes[i].position[0]+1 )
			{
				tempGround = Math.max(ground_boxes[i].position[1]+2, tempGround);

			}
		}



	   	if(tempGround - tempPosition[1] <= 0.55  )
        this.update_position_add(Vec.of(0.1,0.1*Math.tan(this.ground_angle),0));

    }

    move_left()
    {

      	this.rotation = Vec.of(0,-Math.PI/2.0,0);
   		var tempPosition = this.position.plus(Vec.of(-0.1,-0.1*Math.tan(this.ground_angle),0));
        var tempGround = -10000;

	   		//this.position[0] = this.ground;
		var i;
		for (i = 0; i < path.length; i++)
		{
			if(i == 0)
				tempGround  = -100000;

			if (tempPosition[0] >= path[i].left_x  && tempPosition[0] < path[i].right_x )
			{

				if( path[i].left_height < path[i].right_height )
					tempGround  =  Math.max(path[i].left_height +   ( tempPosition[0] - path[i].left_x ), tempGround  );


				else if (path[i].left_height == path[i].right_height)
					tempGround  = Math.max(path[i].left_height, tempGround );
				else
					tempGround  =  Math.max(path[i].left_height -  ( tempPosition[0] - path[i].left_x ) + Math.sqrt(2), tempGround );
			}
		}


		for(i = 0;  i< ground_boxes.length; i++)
		{
			if(tempPosition[0] >= ground_boxes[i].position[0]-1 &&  tempPosition[0] <= ground_boxes[i].position[0]+1 )
			{
				tempGround = Math.max(ground_boxes[i].position[1]+2, tempGround);
			}
		}

	   		//this.position[1] = this.ground;

	   	if(tempGround - tempPosition[1] <= 0.6  )
        	this.update_position_add(Vec.of(-0.1,-0.1*Math.tan(this.ground_angle),0));
//         else if(tempPosition[1] - tempGround < 2.5)
//         	this.update_position_override(Vec.of(-0.1,this.g,0))



    }


    jump()
    {

        if (this.jump_count < 2)
          this.jump_count += 1;

        else
            return;


        this.jumpStart = true;
        this.accleration = Vec.of(0,0,0);
        this.update_velocity_override(Vec.of(0,0.2,0));
    }

    push()
    {
		var i = 0;
		for(i = 0;  i< ground_boxes.length; i++)
		{
			if(this.position[0] >= ground_boxes[i].position[0]-1.5 &&  this.position[0] <= ground_boxes[i].position[0]+1.5 )
			{

				if( Math.abs(this.rotation[1] - Math.PI/2.0) <= 0.01 )
				{
					if(this.position[0] < ground_boxes[i].position[0]-1)
					{
						ground_boxes[i].move_right();
						this.move_right();
					}

				}

				else if(Math.abs(this.rotation[1] + Math.PI/2.0) <= 0.01 )
				{
					if(this.position[0] > ground_boxes[i].position[0]+1)
					{
						ground_boxes[i].move_left();
						this.move_left();
					}

				}
			}
		}
    }




    compute_next()
    {

		var i;
		for (i = 0; i < path.length; i++)
		{
			if(i == 0)
				this.ground = -100000;

			if (this.position[0] >= path[i].left_x  && this.position[0] < path[i].right_x)
			{

				if( path[i].left_height < path[i].right_height )
				{
					this.ground =  Math.max(path[i].left_height +   ( this.position[0] - path[i].left_x ), this.ground );
					this.ground_angle = path[i].angle;
				}
				else if (path[i].left_height == path[i].right_height)
				{
					this.ground = Math.max(path[i].left_height, this.ground);
					this.ground_angle = path[i].angle;


				}
				else{
					this.ground =  Math.max(path[i].left_height -  ( this.position[0] - path[i].left_x ) + Math.sqrt(2), this.ground);
					this.ground_angle = path[i].angle;

				}

			}

		}


		for(i = 0;  i< ground_boxes.length; i++)
		{
			if(this.position[0] >= ground_boxes[i].position[0]-1 &&  this.position[0] <= ground_boxes[i].position[0]+1 )
			{
				if(ground_boxes[i].on_the_ground)
				this.ground  = Math.max(ground_boxes[i].position[1]+3, this.ground );
			}
		}


	   for(i = 0; i< sky_boxes.length; i++)
       {
       	  if(this.position[0] >= sky_boxes[i].position[0] - 1 &&  this.position[0] <= sky_boxes[i].position[0] + 1 && this.position[1] > sky_boxes[i].position[1]+2.5)
       	  {
       	  	this.ground =  Math.max(sky_boxes[i].position[1]+3, this.ground);

       	  }

       }



       if (this.position[1] > this.ground ){
        this.accleration = this.accleration.plus(Vec.of(0,this.g,0));
       }

       this.velocity = this.velocity.plus(this.accleration);
       var TempVelocity = this.velocity.times(delta/17.0);

       // TODO: compute drag
	   var TempPosition  = 	this.position.plus(TempVelocity);


	   if(TempPosition[1] >= this.ground){
       	this.position = this.position.plus(TempVelocity);

	   }
	   else
	   	this.jumpStart = false;


       this.accleration = Vec.of(0,0,0);






       if (this.position[1] < this.ground )
       {
        this.jumpStart = false;
        this.velocity = Vec.of(0,0,0);
        this.jump_count = 0;
        this.position[1] = this.ground;
       }
       else if ( Math.abs(this.position[1] - this.ground) <= 0.4  && Math.abs(this.position[1] - this.ground) > 0  && this.jumpStart == false)
       //else if ( Math.abs(this.position[1] - this.ground) > 0   && this.jumpStart == false)
       {
        	 this.velocity = Vec.of(0,0,0);
        	 this.jump_count = 0;
        	 this.position[1] = this.ground;
       }


       //check for height
       for(i = 0; i< sky_boxes.length; i++)
       {
       	 if(this.position[0] >= sky_boxes[i].position[0] - 1 &&  this.position[0] <= sky_boxes[i].position[0] + 1 && this.position[1] < sky_boxes[i].position[1])
       	 if(this.position[1] > sky_boxes[i].position[1]-2)
       	 {
       	 	this.position[1] = sky_boxes[i].position[1]-2;

       	 }
       }

    }

    draw(context, program_state, material)
    {

			  var i = 0;
		      this.update_transform();
		      //original
		      //this.object_type.draw(context, program_state, this.transforms.times(Mat4.translation([0,0,-2])), material.override(yellow));

			  //colored mario; draw obj parts separately
		      this.obj_face.draw(context, program_state,
		      			this.transforms.times(Mat4.translation([0,0.7,0.3])).times(Mat4.scale([1/1.7,1/1.7,1/1.7])), material.override(faceColor));
		      this.obj_redhead.draw(context, program_state,
		      			this.transforms.times(Mat4.translation([0,0.4,-0.1])).times(Mat4.scale([1/1.1,1/1.1,1/1.1])),
		      			material.override(red));
		      this.obj_chest.draw(context, program_state,
		      			this.transforms.times(Mat4.translation([0,-0.4,0]).times(Mat4.scale([1/1.8,1/1.8,1/1.8]))), material.override(blue));
		      this.obj_body.draw(context, program_state,
		      			this.transforms.times(Mat4.translation([0,-0.85,-0.09]).times(Mat4.scale([1/1.6,1/1.6,1/1.6]))), material.override(blue));
		      this.obj_hands.draw(context, program_state,
		      			this.transforms.times(Mat4.translation([0,-0.65,-0.32]).times(Mat4.scale([1/1.1,1/1.1,1/1.1]))), material.override(white));
		      this.obj_feet.draw(context, program_state, this.transforms.times(Mat4.translation([0,-1.9,0]).times(Mat4.scale([1/1.5,1/1.5,1/1.5]))), material.override(brown));

		      for (i = 0 ; i < this.bullets.length; i++)
		      {

		      	this.bullets[i].draw(context, program_state, this.bullets_transform[i].times(Mat4.translation([2,0,0])), bullet_material);
		      	this.bullets_transform[i] = this.bullets_transform[i].times(Mat4.translation([0.2*this.bullet_speed[i],0,0]));

		      }
		      this.compute_next();



    }
}


class AI extends mario
{
	constructor()
	{
		super();
		this.tempPosition = this.position;
		this.lastMove = "";
		this.wait_frame = 0;

	}

	randomMove()
	{
		if(mario_pos == undefined)
			return;
		var num = Math.random();
		var num2 = Math.random();
		if(num < 0.9) // move closer
		{
			if(this.position[0] > mario_pos[0])
			{
				if(num2 > 0.3)
					this.move_left();
				else
					this.jump();
			}
			else
			{
				if(num2 > 0.3)
					this.move_right();
				else
					this.jump();
			}
		}
		else //move far away
		{
			if(this.position[0] > mario_pos[0])
			{
				if(num2 > 0.3)
					this.move_right();
				else
					this.jump();
			}
			else
			{
				if(num2 > 0.3)
					this.move_left();
				else
					this.jump();
			}
		}

	}

	placeAI()
	{

	}

	draw(context, program_state, material)
	{

		if(this.visible)
		{
			this.update_transform();
			this.object_type.draw(context, program_state, this.transforms, material.override(yellow));
			this.compute_next();
		}
		else
		{
			this.wait_frame = 30;
		}

		if(this.wait_frame > 0)
			this.wait_frame--;
		else
		{


			if(!this.visible)
			{
				this.position = mario_pos;
				this.position[0] = mario_pos[0]+2;
				this.position[1] = mario_pos[1] + 4;
			}


			this.visible = true;
		}
	}

}



const Main_Scene = //Obj_File_Demo;
class Movement_Controls extends Scene
{
  constructor()
    {
      super();


	  //shapes list
      this.shapes = { 'box' : new Cube(),
	  				'scene_box': new physics_component(1000 ,"cube"),
					'scene_box_45': new physics_component(1000, "cube",Vec.of(0,0,0), Vec.of(0,0,Math.PI/4)),
					'scene_box_135': new physics_component(1000, "cube",Vec.of(0,0,0), Vec.of(0,0,3*Math.PI/4)),
                   // 'ball_4' : new Subdivision_Sphere( 4 ),
                     // 'star' : new Planar_Star(),
                    // "sphere" : new physics_component(10, "sphere"),
                    "mario":  new mario(10, "mario"),
					"coin1": new physics_component(10, "coin"),
					"coin2": new physics_component(10, "coin"),
					"coin3": new physics_component(10, "coin"),
					"coin4": new physics_component(10, "coin"),
                    "fixedBox1" : new physics_component(10, "cube"),
                    "fixedBox2" : new physics_component(10, "cube"),
                    "fixedBox3" : new physics_component(10, "cube"),
					"interactive_box1":new pushable_box(10, "cube"),
					"interactive_box2":new pushable_box(10, "cube"),
					"interactive_box3":new pushable_box(10, "cube"),
					"interactive_box4":new pushable_box(10, "cube"),
					"interactive_box5":new pushable_box(10, "cube"),
					"plank":new physics_component(100, "cube"),
					"AI": new AI(10, "mario"),
					//flag
					"flag": new Shape_From_File ( "assets/flag.obj" ),
					"flagrest": new Shape_From_File ("assets/flagrest.obj")
                      };

      const phong_shader      = new defs.Phong_Shader  (2);
                                                              // Adding textures to the previous shader:
      const texture_shader    = new defs.Textured_Phong(2);
                                                              // Same thing, but with a trick to make the textures
                                                              // seemingly interact with the lights:
      const texture_shader_2  = new defs.Fake_Bump_Map (2);
                                                              // A Simple Gouraud Shader that you will implement:
      const gouraud_shader    = new Gouraud_Shader     (2);
                                                              // Extra credit shaders:
      const black_hole_shader = new Black_Hole_Shader();
      const sun_shader        = new Sun_Shader();

	  const green = Color.of(0.13,0.5,0.41,1);
	  //material list
      this.materials = { plastic: new Material( phong_shader,
                                    { ambient: 1, diffusivity: 1, specularity: 0, color: green } ),
                   grass_ground: new Material( texture_shader_2,
                                    { texture: new Texture( "assets/bricks.png" ),
                                      ambient: 1, diffusivity: 1, specularity: 0 } ),
                   wooden_box: new Material( texture_shader_2,
                                    { texture: new Texture( "assets/woodenBox.png" ),
                                      ambient: 1, diffusivity: 1, specularity: 0 } ),
					wood: new Material( texture_shader_2,
                                      { texture: new Texture( "assets/wood.png" ),
                                        ambient: 1, diffusivity: 1, specularity: 0 } ),
                           metal: new Material( phong_shader,
                                    { ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( 1,.5,1,1 ) } ),
                     // gold: new Material( new defs.Fake_Bump_Map( 1 ), { color: Color.of( .5,.5,.5,1 ),
			           // ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture( "assets/gold.png" ) }),
                     gold: new Material( texture_shader_2, {
			           ambient: 1, diffusivity: 1, specularity: 1, texture: new Texture( "assets/goldcoin.png" ) }),

                      black_hole: new Material( black_hole_shader ),
                             sun: new Material( sun_shader, { ambient: 1, color: Color.of( 1,0.5,0,1 ) } ),
						cap: new Material( phong_shader,
							  { ambient: 1, diffusivity: 1, specularity: 0, color: Color.of(1.0, 0.0, 0.0,1) } ),
						sokoban_wall: new Material( texture_shader_2,
										{ambient: 1, diffusivity: 1, specularity: 1, texture: new Texture( "assets/sokoban/Wall_Gray.png" ) }),
                       };
       bullet_material = this.materials.cap;

      // *** Shaders ***
		sky_boxes.push( this.shapes.fixedBox1);
		sky_boxes.push( this.shapes.fixedBox2);
		sky_boxes.push( this.shapes.fixedBox3);
      // NOTE: The 2 in each shader argument refers to the max
      // number of lights, which must be known at compile time.

      // A simple Phong_Blinn shader without textures:


                                  // Some setup code that tracks whether the "lights are on" (the stars), and also
                                  // stores 30 random location matrices for drawing stars behind the solar system:
      this.lights_on = false;

      this.move_left = false;
      this.move_right = false;
      this.shoot = false;
      this.shot_count = 0;
      this.jump = 0;

      this.apply_impulse = 0;
      this.star_matrices = [];
      for( let i=0; i<30; i++ )
        this.star_matrices.push( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 0,1,0 ) )
                         .times( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 1,0,0 ) ) )
                         .times( Mat4.translation([ 0,0,-150 ]) ) );

    }
  make_control_panel()
    {
		// make_control_panel(): Sets up a panel of interactive HTML elements, including
		// buttons with key bindings for affecting this scene, and live info readouts.

      this.key_triggered_button("shoot fireball", ["q"],  () => {this.shoot = true;},'#'+Math.random().toString(9).slice(-6) , () => {this.shoot = false; this.shot_count = 0;}  );
      this.new_line();
      this.key_triggered_button("move_left", ["a"],  () => {this.move_left = true; } , '#'+Math.random().toString(9).slice(-6) , () => {this.move_left = false;}  );
      this.key_triggered_button("move_right", ["d"],  () => {this.move_right = true; } , '#'+Math.random().toString(9).slice(-6) , () => {this.move_right = false;}  );
      this.new_line();
      this.key_triggered_button("jump", [" "],  () => {this.jump += 1; } , '#'+Math.random().toString(9).slice(-6) );
      this.new_line();
	  this.key_triggered_button("push", ["f"],  () => {this.push = true; } , '#'+Math.random().toString(9).slice(-6),  );

    }




  display( context, program_state )
    {                                                // display():  Called once per frame of animation.  For each shape that you want to
                                                     // appear onscreen, place a .draw() call for it inside.  Each time, pass in a
                                                     // different matrix value to control where the shape appears.

                           // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:

      if( !context.scratchpad.controls )
        {                       // Add a movement controls panel to the page:
          this.children.push( context.scratchpad.controls = new defs.Movement_Controls() );

                                // Add a helper scene / child scene that allows viewing each moving body up close.
          this.children.push( this.camera_teleporter = new Camera_Teleporter() );

                    // Define the global camera and projection matrices, which are stored in program_state.  The camera
                    // matrix follows the usual format for transforms, but with opposite values (cameras exist as
                    // inverted matrices).  The projection matrix follows an unusual format and determines how depth is
                    // treated when projecting 3D points onto a plane.  The Mat4 functions perspective() and
                    // orthographic() automatically generate valid matrices for one.  The input arguments of
                    // perspective() are field of view, aspect ratio, and distances to the near plane and far plane.
//  			var startLookatMat4 = Mat4.orthographic().look_at( Vec.of( 0,0,20 ), Vec.of( 12,5,0 ), Vec.of( 0,1,0 ));
//          	program_state.set_camera( startLookatMat4 );
          program_state.set_camera( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this.initial_camera_location = program_state.camera_inverse;
          program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
        }

                                                                      // Find how much time has passed in seconds; we can use
                                                                      // time as an input when calculating new transforms:
      const t = program_state.animation_time / 1000;
      delta = program_state.animation_delta_time;


                                                  // Have to reset this for each frame:
      this.camera_teleporter.cameras = [];
      path = [];
  	  counter = 0;

      //this.camera_teleporter.cameras.push( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
	  // this.camera_teleporter.cameras.push( startLookatMat4 );

                                             // Variables that are in scope for you to use:
                                             // this.shapes: Your shapes, defined above.
                                             // this.materials: Your materials, defined above.
                                             // this.lights:  Assign an array of Light objects to this to light up your scene.
                                             // this.lights_on:  A boolean variable that changes when the user presses a button.
                                             // this.camera_teleporter: A child scene that helps you see your planets up close.
                                             //                         For this to work, you must push their inverted matrices
                                             //                         into the "this.camera_teleporter.cameras" array.
                                             // t:  Your program's time in seconds.
                                             // program_state:  Information the shader needs for drawing.  Pass to draw().
                                             // context:  Wraps the WebGL rendering context shown onscreen.  Pass to draw().


      /**********************************
      Start coding down here!!!!
      **********************************/


                                    // Variable model_transform will be a local matrix value that helps us position shapes.
                                    // It starts over as the identity every single frame - coordinate axes at the origin.
      let model_transform = Mat4.identity();


                                                // *** Lights: *** Values of vector or point lights.  They'll be consulted by
                                                // the shader when coloring shapes.  See Light's class definition for inputs.

      program_state.lights = [ new Light( Vec.of( 0,0,0,1 ), Color.of( 1,1,1,1 ), 100000 ) ];
      const modifier = this.lights_on ? { ambient: 0.3 } : { ambient: 0.0 };

      // ***** BEGIN TEST SCENE *****
      const angle = Math.sin( t );

      //const light_position = Mat4.rotation( angle, [ 1,0,0 ] ).times( Vec.of( 0,-1,1,0 ) );

      program_state.lights = [ new Light( Vec.of(0,0,0,1), Color.of( 1,1,1,1 ), 1000000 ) ];

      model_transform = Mat4.identity();


      //program_state.set_camera( Mat4.inverse(this.shapes.mario.transform_position.times(Mat4.rotation(0 ,[1,0,0])).times(Mat4.translation([ 0,0, 20]))  ) );
// 	 const unscaled = model_transform.copy();
// 	 var model_transform_square = model_transform.times(Mat4.translation(Vec.of(-15, -6, 0)));
function draw_flat_ground (context, program_state, length, currentPos, shape, material)
{


     counter++;


	var left_height = currentPos[1]+3;
	var right_height = currentPos[1]+3;
	var left_x = currentPos[0]-1;
	var right_x;
	var angle;
    for (var i = 0; i <= length; ++i) {
	  shape.update_position_override(currentPos);
	  shape.draw(context, program_state, material);
	  currentPos = currentPos.plus(Vec.of(2,0,0));
    }
	  currentPos = currentPos.minus(Vec.of(2,0,0));
	  right_x = currentPos[0]+Math.sqrt(2);
	if(counter == 1)
    {

    	var temp = currentPos;
    	temp = currentPos.plus(Vec.of(2,0,0));
    	shape.update_position_override(temp);
	  	shape.draw(context, program_state, material);
	  	right_x = temp[0]+1;

    }



	angle = 0;

	path.push({"left_height" : left_height, "right_height" : right_height, "left_x": left_x, "right_x": right_x, "angle": angle});
	return currentPos;
}

function draw_upwards_slope (context, program_state, length, currentPos, shapes, materials)
{
	var left_height = currentPos[1];

	var left_x = currentPos[0]-Math.sqrt(2);
	currentPos = currentPos.plus(Vec.of(1+2/Math.sqrt(2),1,0));
    for (var i = 0; i < length; ++i) {
	  shapes.scene_box_45.update_position_override(currentPos);

	  shapes.scene_box_45.draw(context, program_state, materials.grass_ground);
	  currentPos = currentPos.plus(Vec.of(2/Math.sqrt(2),2/Math.sqrt(2),0));
    }

	currentPos = currentPos.minus(Vec.of(2/Math.sqrt(2),2/Math.sqrt(2),0));
	var right_height = currentPos[1]+Math.sqrt(2);
	var right_x = currentPos[0];
	currentPos = currentPos.plus(Vec.of(1,2/Math.sqrt(2)-1,0));


	var angle = Math.PI/4;



	path.push({"left_height" : left_height, "right_height" : right_height, "left_x": left_x, "right_x": right_x, "angle": angle});
	return currentPos;
}
function draw_downwards_slope(context, program_state, length, currentPos, shapes, materials)
{
	var left_height = currentPos[1]+Math.sqrt(2);
	var left_x = currentPos[0]+Math.sqrt(2);

	currentPos = currentPos.plus(Vec.of(1,1-2/Math.sqrt(2),0));
    for (var i = 0; i < length; ++i) {
	  shapes.scene_box_135.update_position_override(currentPos);
	  shapes.scene_box_135.draw(context, program_state, materials.grass_ground);
	  currentPos = currentPos.plus(Vec.of(2/Math.sqrt(2),-2/Math.sqrt(2),0));
    }

	currentPos = currentPos.minus(Vec.of(2/Math.sqrt(2),-2/Math.sqrt(2),0));
	var right_height = currentPos[1];
	var right_x = currentPos[0];
	currentPos = currentPos.plus(Vec.of(1,2/Math.sqrt(2)-1,0));


	var angle = -Math.PI/4;
	path.push({"left_height" : left_height, "right_height" : right_height, "left_x": left_x, "right_x": right_x, "angle": angle});

	return currentPos;
}
//draw a vertical wall of "height" start from the next cube position
function draw_vertical_wall(context, program_state, height, currentPos, shape, material)
{
	if(height < 0)
		currentPos = currentPos.plus(Vec.of(cubeSize,height*cubeSize,0));
	else
		currentPos = currentPos.plus(Vec.of(cubeSize,0,0));
    for (var i = 0; i < Math.abs(height); ++i) {
		currentPos = draw_flat_ground(context, program_state, 0, currentPos, shape, material);
		currentPos = currentPos.plus(Vec.of(0,cubeSize,0));
	}
	currentPos = currentPos.minus(Vec.of(0,cubeSize,0));
	return currentPos;
}
//TODO: coin drawing function
//function draw_coin(context, program_state, position, rotationangle, thecoin)
//TODO: interactive box placing function
//function draw_interactive_box(context, program_state, position, thebox)
function draw_plank (context, program_state, length, currentPos, shapes, materials, upAndDown)
{
     counter++;
	 var scaleSizeX, scaleSizeY;
	if(upAndDown)
	{
		scaleSizeX = 4, scaleSizeY = 1/3;
		currentPos = currentPos.plus(Vec.of(scaleSizeX+2,0,0));
	}
	else {
		scaleSizeX = 2, scaleSizeY = 1/3;
		currentPos = currentPos.plus(Vec.of(scaleSizeX+4,0,0));
	}
	var left_height = currentPos[1]+3-(1-scaleSizeY);
	var right_height = currentPos[1]+3-(1-scaleSizeY);
	var left_x = currentPos[0]-scaleSizeX;
	var right_x;
	var angle;
    for (var i = 0; i <= length; ++i) {
	  shapes.plank.update_position_override(currentPos);
	  shapes.plank.update_scale_override(Vec.of(scaleSizeX,scaleSizeY,1));
	  shapes.plank.draw(context, program_state, materials.wood);
	  currentPos = currentPos.plus(Vec.of(2,0,0));
    }
	  currentPos = currentPos.minus(Vec.of(2,0,0));
	  right_x = currentPos[0]+scaleSizeX;
	if(counter == 1)
    {
    	var temp = currentPos;
    	temp = currentPos.plus(Vec.of(2,0,0));
    	shapes.plank.update_position_override(temp);
	  	shapes.plank.draw(context, program_state, materials.wood);
	  	right_x = temp[0]+1;

    }

	angle = 0;

	path.push({"left_height" : left_height, "right_height" : right_height, "left_x": left_x, "right_x": right_x, "angle": angle});
	return currentPos;
}

function check_for_coin_collection(shapes)
{
	var marioPos = shapes.mario.position;
	var i = 0;
	for(; i < coins.length; ++i)
	{
		var coinPos = coins[i];
		var effectiveDistance = 2;
		if(Math.abs(coinPos.position[0] - marioPos[0]) <= effectiveDistance && Math.abs(coinPos.position[1] - marioPos[1]) <= effectiveDistance)
		{
			switch (i) {
				case 0:
					if(shapes.coin1.visible == true)
						coinScore++;
					shapes.coin1.update_visibiliy(false);
					break;
				case 1:
					if(shapes.coin2.visible == true)
						coinScore++;
					shapes.coin2.update_visibiliy(false);
					break;
				case 2:
					if(shapes.coin3.visible == true)
						coinScore++;
					shapes.coin3.update_visibiliy(false);
					break;
				case 3:
					if(shapes.coin4.visible == true)
						coinScore++;
					shapes.coin4.update_visibiliy(false);
					break;
				default:
			}

		}
	}
}

	  //-----START DRAWING----//
	const cubeSize = 2;
	var length = 3;
	var currentPosition = Vec.of(-17, -6, 0); //starting position of ground

	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes.scene_box, this.materials.grass_ground);
	currentPosition = draw_upwards_slope(context, program_state, length, currentPosition, this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes.scene_box, this.materials.grass_ground);
	//first interactive box

	var temp1 = currentPosition.plus(Vec.of(0,2.1,0));


	currentPosition = draw_downwards_slope(context, program_state, length, currentPosition, this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes.scene_box, this.materials.grass_ground);
	//first coin
	if (frame == 0)
	{
		this.shapes.coin1.update_position_override(currentPosition.plus(Vec.of(-cubeSize,2.5*cubeSize,0)));
    	coins.push({'position': this.shapes.coin1.position});
	}
  	this.shapes.coin1.update_rotation_override(Vec.of(0,angle,0));
    this.shapes.coin1.draw(context, program_state, this.materials.gold);
	//Need to push the 1st box to keep going
	var tempHeight = 3; //(currently can directly jump to continue) make it 4 when the wooden box works
	currentPosition = draw_vertical_wall(context, program_state, tempHeight, currentPosition, this.shapes.scene_box, this.materials.grass_ground);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes.scene_box, this.materials.grass_ground);
	//three wooden box in the air
	this.shapes.fixedBox1.update_position_override(currentPosition.plus(Vec.of(-2*cubeSize,3*cubeSize,0)));
    this.shapes.fixedBox1.draw(context, program_state, this.materials.wooden_box);
	//draw second coin above the boxes in the air
	if (frame == 0)
	{
		this.shapes.coin2.update_position_override(currentPosition.plus(Vec.of(-2*cubeSize,4.5*cubeSize,0)));
    	coins.push({'position': this.shapes.coin2.position});
	}
  	this.shapes.coin2.update_rotation_override(Vec.of(0,angle,0));
    this.shapes.coin2.draw(context, program_state, this.materials.gold);
	//keep drawing the other two boxes
	this.shapes.fixedBox2.update_position_override(currentPosition.plus(Vec.of(-cubeSize,3*cubeSize,0)));
    this.shapes.fixedBox2.draw(context, program_state, this.materials.wooden_box);
	this.shapes.fixedBox3.update_position_override(currentPosition.plus(Vec.of(0,3*cubeSize,0)));
    this.shapes.fixedBox3.draw(context, program_state, this.materials.wooden_box);
	//draw third coin above the boxes in the air
	if (frame == 0)
	{
		this.shapes.coin3.update_position_override(currentPosition.plus(Vec.of(0,4.5*cubeSize,0)));
    	coins.push({'position': this.shapes.coin3.position});
	}
  	this.shapes.coin3.update_rotation_override(Vec.of(0,angle,0));
    this.shapes.coin3.draw(context, program_state, this.materials.gold);
	//ground
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes.scene_box, this.materials.grass_ground);
	//Need to push the 2nd interactive box to continue

	var temp2 = currentPosition.plus(Vec.of(0,2.1,0));

	//4th coin
	if (frame == 0)
	{
		this.shapes.coin4.update_position_override(currentPosition.plus(Vec.of(0,2.5*cubeSize,0)));
    	coins.push({'position': this.shapes.coin4.position});
	}
  	this.shapes.coin4.update_rotation_override(Vec.of(0,angle,0));
    this.shapes.coin4.draw(context, program_state, this.materials.gold);
	//----\\\
	currentPosition = draw_downwards_slope(context, program_state, length, currentPosition, this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes.scene_box, this.materials.grass_ground);

	//pit
	let depth = 2, width = 3;
	currentPosition = draw_vertical_wall(context, program_state, -(depth-1), currentPosition.minus(Vec.of(cubeSize,0,0)), this.shapes.scene_box, this.materials.grass_ground);
	currentPosition = draw_flat_ground(context, program_state, width, currentPosition.plus(Vec.of(0,-(depth-1)*cubeSize,0)), this.shapes.scene_box, this.materials.grass_ground);
	currentPosition = draw_vertical_wall(context, program_state, depth+1, currentPosition, this.shapes.scene_box, this.materials.grass_ground);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition.plus(Vec.of(0,cubeSize,0)), this.shapes.scene_box, this.materials.grass_ground);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes.scene_box, this.materials.grass_ground);
	//up and down plank
	//TODO: edit back to t/2
	var plank1Position = -4*Math.sin(t) - 1;
	currentPosition = draw_plank(context, program_state, 2, currentPosition.minus(Vec.of(0,plank1Position*cubeSize,0)), this.shapes, this.materials, true);
	currentPosition = currentPosition.plus(Vec.of(0,plank1Position*cubeSize,0))
	// this.shapes.plank.update_position_override(currentPosition.plus(Vec.of(cubeSize,0,0)));
  	// this.shapes.plank.draw(context, program_state, this.materials.wood);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition.plus(Vec.of(length*cubeSize, 5*cubeSize,0)), this.shapes.scene_box, this.materials.grass_ground);
	//left and right plank
	//TODO: edit back to t/2
	var plank2Position = -2*Math.sin(t) - 1;
	currentPosition = draw_plank(context, program_state, 0, currentPosition.minus(Vec.of(plank2Position*cubeSize,0,0)), this.shapes, this.materials, false);
	currentPosition = currentPosition.plus(Vec.of(plank2Position*cubeSize,0,0))

	//------------LEVEL2: Sokoban--------------
	let length1 = 11, length2 = 4, length3 = length1 - length2;
	var tempPos;
	//main way
	tempPos = currentPosition.plus(Vec.of(5*cubeSize,0,0));
	currentPosition = draw_flat_ground(context, program_state, length1, currentPosition.plus(Vec.of(5*cubeSize,0,0)), this.shapes.scene_box, this.materials.grass_ground);

	//interactive box 3
	//TODO: push to array??
	if(this.shapes.AI.visible && currentRPIndex < level2StartingPointIndex)
		tempPos = draw_vertical_wall(context, program_state, 4, tempPos.plus(Vec.of((length3)*cubeSize,cubeSize,0)), this.shapes.scene_box, this.materials.wooden_box);

	//down1
	tempPos = currentPosition.plus(Vec.of(-length3*cubeSize,0,cubeSize));
	currentPosition = draw_flat_ground(context, program_state, length2, currentPosition.plus(Vec.of(-length3*cubeSize,0,cubeSize)), this.shapes.scene_box, this.materials.grass_ground);
//	tempPos = draw_flat_ground(context, program_state, 0, tempPos.plus(Vec.of(0,cubeSize,0)), this.shapes.scene_box, this.materials.sokoban_wall);
	//interactive box 4
	//TODO: push to array??
	// tempPos = draw_flat_ground(context, program_state, 0, tempPos.plus(Vec.of(3*cubeSize,cubeSize,0)), this.shapes.interactive_box4, this.materials.wooden_box);

	//down2
	tempPos = currentPosition.plus(Vec.of(-length2*cubeSize,0,cubeSize));
	currentPosition = draw_flat_ground(context, program_state, length2, currentPosition.plus(Vec.of(-length2*cubeSize,0,cubeSize)), this.shapes.scene_box, this.materials.grass_ground);
//	tempPos = draw_flat_ground(context, program_state, length2, tempPos.plus(Vec.of(0,cubeSize,0)), this.shapes.scene_box, this.materials.sokoban_wall);

	//up1
	tempPos = currentPosition.plus(Vec.of(-length2*cubeSize,0,-3*cubeSize));
	currentPosition = draw_flat_ground(context, program_state, length2, currentPosition.plus(Vec.of(-length2*cubeSize,0,-3*cubeSize)), this.shapes.scene_box, this.materials.grass_ground);
//	tempPos = draw_flat_ground(context, program_state, 0, tempPos.plus(Vec.of(0,cubeSize,0)), this.shapes.scene_box, this.materials.sokoban_wall);
	//interactive box 5
	//TODO: push to array??
	// tempPos = draw_flat_ground(context, program_state, 0, tempPos.plus(Vec.of(3*cubeSize,cubeSize,0)), this.shapes.interactive_box5, this.materials.wooden_box);

	//up2
	tempPos = currentPosition.plus(Vec.of(-length2*cubeSize,0,-cubeSize));
	currentPosition = draw_flat_ground(context, program_state, length2, currentPosition.plus(Vec.of(-length2*cubeSize,0,-cubeSize)), this.shapes.scene_box, this.materials.grass_ground);
//	tempPos = draw_flat_ground(context, program_state, 2, tempPos.plus(Vec.of(0,cubeSize,0)), this.shapes.scene_box, this.materials.sokoban_wall);
//	tempPos = draw_flat_ground(context, program_state, 0, tempPos.plus(Vec.of(2*cubeSize,0,0)), this.shapes.scene_box, this.materials.sokoban_wall);

	//continue main way
	currentPosition = draw_flat_ground(context, program_state, length1, currentPosition.plus(Vec.of(0,0,2*cubeSize)), this.shapes.scene_box, this.materials.grass_ground);

	//flag
	if(currentRPIndex == revivePoints.length - 1)
		this.shapes.flag.draw(context, program_state, model_transform.times(Mat4.translation(currentPosition.plus(Vec.of(1.2,2*cubeSize,0)))), this.materials.plastic.override(red));
	else
		this.shapes.flag.draw(context, program_state, model_transform.times(Mat4.translation(currentPosition.plus(Vec.of(1.2,cubeSize,0)))), this.materials.plastic.override(red));

 	this.shapes.flagrest.draw(context, program_state, model_transform.times(Mat4.translation(currentPosition.plus(Vec.of(0,cubeSize,0))).times(Mat4.scale(Vec.of(2,2,2)))), this.materials.plastic.override(white));

	if(frame == 0 )
	{
		this.shapes.interactive_box1.update_position_override(temp1);
    	ground_boxes.push(this.shapes.interactive_box1);
	}

    this.shapes.interactive_box1.draw(context, program_state, this.materials.wooden_box);


     if (frame == 0)
	{
		this.shapes.interactive_box2.update_position_override(temp2);
		ground_boxes.push(this.shapes.interactive_box2);
//     	boxes.push(currentPosition.plus(Vec.of(0,2,0)));
	}
    this.shapes.interactive_box2.draw(context, program_state, this.materials.wooden_box);

	   if(this.apply_impulse > 0)
      {
        this.shapes.mario.apply_impulse(Vec.of(100.0,0.0,0.0));
        this.apply_impulse -= 1;
      }


      if(this.move_right){

          this.shapes.mario.move_right();
      }

      if (this.move_left)
      {
           this.shapes.mario.move_left();
      }

      if (this.jump)
      {
      	this.shapes.mario.jump();
      	this.jump -= 1;
      }

      if(this.push )
      {
      	this.push = false;
      	this.shapes.mario.push();
      }

      //checkout bullet collision

      if(this.shoot)
      {
      	if( this.shot_count == 0)
      	this.shapes.mario.shoot(context, program_state, this.materials.sun);

      	this.shot_count = 1;
      }


      for(i = 0; i < this.shapes.mario.bullets_transform.length; i++)
      {
      	 var x = this.shapes.mario.bullets_transform[i][3][0];
      	 var y = this.shapes.mario.bullets_transform[i][3][1];
      	 var z = this.shapes.mario.bullets_transform[i][3][2];

      	 var mx = this.shapes.AI.position[0];
      	 var my = this.shapes.AI.position[1];
      	 var mz = this.shapes.AI.position[2];

      	 if( Math.abs(x - mx) <= 0.1 )
      	 {
      	 	this.shapes.AI.visible = false;
      	 }
      }


      var pos = this.shapes.mario.position;
      var factor = 1;
	  check_for_coin_collection(this.shapes);

	//update current Revive Point
	for (var i = currentRPIndex; i < revivePoints.length; i++)
	{
		let currentPoint = revivePoints[i];
		if(pos[0] > currentPoint[0])
			currentRPIndex = i;
	}
//TODO: change name
function MarioRevive(character)
{
	character.jumpStart = false;
  	character.update_position_override(revivePoints[currentRPIndex]);
}

	//death detection for Mario's Position
	if(pos[1] < -30)
		MarioRevive(this.shapes.mario);
	//detection: death casuing by AI
	var posAI = this.shapes.AI.position;
	if(this.shapes.AI.visible && Math.abs(posAI[0] - pos[0]) < 1 && Math.abs(posAI[1] - pos[1]) < 1)
		MarioRevive(this.shapes.mario);

	this.shapes.AI.randomMove();
	this.shapes.AI.draw(context, program_state, this.materials.plastic);
      // this.shapes.mario.draw(context, program_state, this.materials.plastic.override( yellow ));
      //draw mario
      this.shapes.mario.draw(context, program_state, this.materials.plastic);

      this.camera_teleporter.cameras.push( Mat4.inverse(this.shapes.mario.transform_position.times(Mat4.rotation(0 ,[1,0,0])).times(Mat4.translation([ 0,0, 20])) ));
      this.camera_teleporter.cameras.push( Mat4.inverse(this.shapes.mario.transform_position.times(Mat4.rotation(-Math.PI/2 ,[1,0,0])).times(Mat4.translation([ 0,0, 20])) ));

      // ***** END TEST SCENE *****

	frame=1;
	mario_pos = this.shapes.mario.position;

    }
}

const Additional_Scenes = [];

export { Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs }


const Camera_Teleporter = defs.Camera_Teleporter =
class Camera_Teleporter extends Scene
{                               // **Camera_Teleporter** is a helper Scene meant to be added as a child to
                                // your own Scene.  It adds a panel of buttons.  Any matrices externally
                                // added to its "this.cameras" can be selected with these buttons. Upon
                                // selection, the program_state's camera matrix slowly (smoothly)
                                // linearly interpolates itself until it matches the selected matrix.
  constructor()
    { super();
      this.cameras = [];
      this.selection = 0;
      this.previous= null;
    }
  make_control_panel()
    {                                // make_control_panel(): Sets up a panel of interactive HTML elements, including
                                     // buttons with key bindings for affecting this scene, and live info readouts.

      this.key_triggered_button(  "Enable",       [ "e" ], () => this.enabled = true  );
      this.key_triggered_button( "Disable", [ "Shift", "E" ], () => this.enabled = false );
      this.new_line();
      this.key_triggered_button( "Previous location", [ "g" ], this.decrease );
      this.key_triggered_button(              "Next", [ "h" ], this.increase );
      this.new_line();
      this.live_string( box => { box.textContent = "Selected camera location: " + this.selection } );
    }
  increase() { this.selection = Math.min( this.selection + 1, Math.max( this.cameras.length-1, 0 ) ); }
  decrease() { this.selection = Math.max( this.selection - 1, 0 ); }   // Don't allow selection of negative indices.
  display( context, program_state )
  {
    const desired_camera = this.cameras[ this.selection ];
    if( !desired_camera || !this.enabled )
      return;
    const dt = program_state.animation_delta_time;
    program_state.set_camera( desired_camera.map( (x,i) => Vec.from( program_state.camera_inverse[i] ).mix( x, .01*dt ) ) );

  }
}


const Planar_Star = defs.Planar_Star =
class Planar_Star extends Shape
{                                 // **Planar_Star** defines a 2D five-pointed star shape.  The star's inner
                                  // radius is 4, and its outer radius is 7.  This means the complete star
                                  // fits inside a 14 by 14 sqaure, and is centered at the origin.
  constructor()
    { super( "position", "normal", "texture_coord" );

      this.arrays.position.push( Vec.of( 0,0,0 ) );
      for( let i = 0; i < 11; i++ )
        {
          const spin = Mat4.rotation( i * 2*Math.PI/10, Vec.of( 0,0,-1 ) );

          const radius = i%2 ? 4 : 7;
          const new_point = spin.times( Vec.of( 0,radius,0,1 ) ).to3();

          this.arrays.position.push( new_point );
          if( i > 0 )
            this.indices.push( 0, i, i+1 )
        }

      this.arrays.normal        = this.arrays.position.map( p => Vec.of( 0,0,-1 ) );

      // this.arrays.texture_coord = this.arrays.position.map( p =>
    }
}

const Gouraud_Shader = defs.Gouraud_Shader =
class Gouraud_Shader extends defs.Phong_Shader
{
  shared_glsl_code()           // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    {
                          // change the two "varying" vec3s declared in it to just one vec4, called color.
                          // REMEMBER:
                          // **Varying variables** are passed on from the finished vertex shader to the fragment
                          // shader.  A different value of a "varying" is produced for every single vertex
                          // in your array.  Three vertices make each triangle, producing three distinct answers
                          // of what the varying's value should be.  Each triangle produces fragments (pixels),
                          // and the per-fragment shader then runs.  Each fragment that looks up a varying
                          // variable will pull its value from the weighted average of the varying's value
                          // from the three vertices of its triangle, weighted according to how close the
                          // fragment is to each extreme corner point (vertex).

      return `

      ` ;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    {
      return this.shared_glsl_code() + `
        void main()
          {

          } ` ;
    }
  fragment_glsl_code()         // ********* FRAGMENT SHADER *********
    {                          // A fragment is a pixel that's overlapped by the current triangle.
                               // Fragments affect the final image or get discarded due to depth.

      return this.shared_glsl_code() + `
        void main()
          {

          } ` ;
    }
}


const Black_Hole_Shader = defs.Black_Hole_Shader =
class Black_Hole_Shader extends Shader         // Simple "procedural" texture shader, with texture coordinates but without an input image.
{ update_GPU( context, gpu_addresses, program_state, model_transform, material )
      {
                  // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
                  // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
                  // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
                  // program (which we call the "Program_State").  Send both a material and a program state to the shaders
                  // within this function, one data field at a time, to fully initialize the shader for a draw.


        // context.uniformMatrix4fv( gpu_addresses.projection_camera_model_transform,
      }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    {
                  // TODO (#EC 1c):  For both shaders, declare a varying vec2 to pass a texture coordinate between
                  // your shaders.  Also make sure both shaders have an animation_time input (a uniform).
      return `precision mediump float;

      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    {
                          // TODO (#EC 1d,e):  Create the final "gl_Position" value of each vertex based on a displacement
                          // function.  Also pass your texture coordinate to the next shader.  As inputs,
                          // you have the current vertex's stored position and texture coord, animation time,
                          // and the final product of the projection, camera, and model matrices.
      return this.shared_glsl_code() + `

        void main()
        {

        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    {
                          // TODO (#EC 1f):  Using the input UV texture coordinates and animation time,
                          // calculate a color that makes moving waves as V increases.  Store
                          // the result in gl_FragColor.
      return this.shared_glsl_code() + `
        void main()
        {

        }`;
    }
}


const Sun_Shader = defs.Sun_Shader =
class Sun_Shader extends Shader
{ update_GPU( context, gpu_addresses, program_state, model_transform, material )
    {
                      // TODO (#EC 2): Pass the same information to the shader as for EC part 1.  Additionally
                      // pass material.color to the shader.

        const [ P, C, M ] = [ program_state.projection_transform, program_state.camera_inverse, model_transform ],
                      PCM = P.times( C ).times( M );
        context.uniformMatrix4fv( gpu_addresses.projection_camera_model_transform, false, Mat.flatten_2D_to_1D( PCM.transposed() ) );
        context.uniform1f ( gpu_addresses.animation_time, program_state.animation_time / 1000 );
        context.uniform4fv ( gpu_addresses.sun_color,  material.color);


    }
                                // TODO (#EC 2):  Complete the shaders, displacing the input sphere's vertices as
                                // a fireball effect and coloring fragments according to displacement.

  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
        uniform float animation_time;
        uniform vec4 sun_color;
        varying float disp;
        varying float noise;


      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `
//         uniform mat4 modelMatrix;
//         uniform mat4 modelViewMatrix;
//         uniform mat4 projectionMatrix;
//         uniform mat4 viewMatrix;
//         uniform mat3 normalMatrix;
        uniform mat4 projection_camera_model_transform;
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;
        attribute vec2 uv2;


        const float fireSpeed = 0.5;
        const float pulseHeight = 0.5;
        const float displacementHeight= 0.5;
        const float turbulenceDetail =0.5;
        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        vec4 mod289(vec4 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        vec4 permute(vec4 x) {
          return mod289(((x*34.0)+1.0)*x);
        }
        vec4 taylorInvSqrt(vec4 r) {
          return 1.79284291400159 - 0.85373472095314 * r;
        }
        vec3 fade(vec3 t) {
          return t*t*t*(t*(t*6.0-15.0)+10.0);
        }
        // Klassisk Perlin noise
        float cnoise(vec3 P) {
          vec3 Pi0 = floor(P); // indexing
          vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
          Pi0 = mod289(Pi0);
          Pi1 = mod289(Pi1);
          vec3 Pf0 = fract(P); // Fractional part for interpolation
          vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = Pi0.zzzz;
          vec4 iz1 = Pi1.zzzz;
          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);
          vec4 gx0 = ixy0 * (1.0 / 7.0);
          vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
          gx0 = fract(gx0);
          vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
          vec4 sz0 = step(gz0, vec4(0.0));
          gx0 -= sz0 * (step(0.0, gx0) - 0.5);
          gy0 -= sz0 * (step(0.0, gy0) - 0.5);
          vec4 gx1 = ixy1 * (1.0 / 7.0);
          vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
          gx1 = fract(gx1);
          vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
          vec4 sz1 = step(gz1, vec4(0.0));
          gx1 -= sz1 * (step(0.0, gx1) - 0.5);
          gy1 -= sz1 * (step(0.0, gy1) - 0.5);
          vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
          vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
          vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
          vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
          vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
          vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
          vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
          vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
          vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
          g000 *= norm0.x;
          g010 *= norm0.y;
          g100 *= norm0.z;
          g110 *= norm0.w;
          vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
          g001 *= norm1.x;
          g011 *= norm1.y;
          g101 *= norm1.z;
          g111 *= norm1.w;
          float n000 = dot(g000, Pf0);
          float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
          float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
          float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
          float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
          float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
          float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
          float n111 = dot(g111, Pf1);
          vec3 fade_xyz = fade(Pf0);
          vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
          vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
          float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
          return 2.2 * n_xyz;
        }
        // Ashima code
        float turbulence( vec3 p ) {
            float t = -0.5;
            for (float f = 1.0 ; f <= 10.0 ; f++ ){
                float power = pow( 2.0, f );
                t += abs( cnoise( vec3( power * p ) ) / power );
            }
            return t;
        }
        void main() {
            float a = animation_time;
            noise = -0.8 * turbulence( turbulenceDetail * normal + ( a * 1.0 ) );
             float b = pulseHeight * cnoise(
                 0.05 * position + vec3( 1.0 * a )
              );
             float displacement = ( 0.0 - displacementHeight ) * noise + b;
             vec3 newPosition = position + normal * displacement;
             gl_Position = projection_camera_model_transform * vec4( newPosition, 2.0 );
              disp = displacement * 15.0;
        }
     `;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return this.shared_glsl_code() + `
        void main()
        {
            vec3 color = vec3((1.-disp), (0.1-disp*0.2)+0.1, (0.1-disp*0.1)+0.1*abs(sin(disp)));
            gl_FragColor = vec4( color.rgb, 1.0 );
            gl_FragColor *= sun_color;
            //gl_FragColor = vec4(1.0,0.0,0.0,1.0);
        } ` ;
    }
}
