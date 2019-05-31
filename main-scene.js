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

var path = [];
var counter = 0;
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

    else if (shape == "mario")
    {
      this.object_type = new Shape_From_File( "assets/mario/mario.obj" );
      this.rotation = Vec.of(0,Math.PI/2.0,0);
      this.position = Vec.of(-17,-3,0);
      this.controllable = true;
      this.physics_enabled = true;
      this.gravity_enabled = true;
    }


     this.jump_count = 0;


   }

    move_right()
    {
      if(this.controllable)
      {
        this.rotation = Vec.of(0,Math.PI/2.0,0);
        var tempPosition = this.position.plus(Vec.of(0.1,0.1*Math.tan(this.ground_angle),0));
        var tempGround = -10000;
        if(this.shape == "mario")
	   	{
	   		//this.position[0] = this.ground;
	   		var i;
	   		for (i = 0; i < path.length; i++)
	   		{
	   			if(i == 0)
	   			{
	   				tempGround  = -100000;
	   			}
	   			if (tempPosition[0] >= path[i].left_x  && tempPosition[0] < path[i].right_x )
	   			{

	   				if( path[i].left_height < path[i].right_height )
	   				{
	   					tempGround  =  Math.max(path[i].left_height +   ( tempPosition[0] - path[i].left_x ), tempGround  );



	   				}
	   				else if (path[i].left_height == path[i].right_height)
	   				{
	   					tempGround  = Math.max(path[i].left_height, tempGround );



	   				}
	   				else{
	   					tempGround  =  Math.max(path[i].left_height -  ( tempPosition[0] - path[i].left_x ) + Math.sqrt(2), tempGround );



	   				}

	   			}

	   		}

	   		//this.position[1] = this.ground;
	   }
	   	if(tempGround - tempPosition[1] <= 0.6  )
        this.update_position_add(Vec.of(0.1,0.1*Math.tan(this.ground_angle),0));
      }
    }

    move_left()
    {
      if(this.controllable)
      {
      	this.rotation = Vec.of(0,-Math.PI/2.0,0);
   		var tempPosition = this.position.plus(Vec.of(-0.1,-0.1*Math.tan(this.ground_angle),0));
        var tempGround = -10000;
        if(this.shape == "mario")
	   	{
	   		//this.position[0] = this.ground;
	   		var i;
	   		for (i = 0; i < path.length; i++)
	   		{
	   			if(i == 0)
	   			{
	   				tempGround  = -100000;
	   			}
	   			if (tempPosition[0] >= path[i].left_x  && tempPosition[0] < path[i].right_x )
	   			{

	   				if( path[i].left_height < path[i].right_height )
	   				{
	   					tempGround  =  Math.max(path[i].left_height +   ( tempPosition[0] - path[i].left_x ), tempGround  );

	   				}
	   				else if (path[i].left_height == path[i].right_height)
	   				{
	   					tempGround  = Math.max(path[i].left_height, tempGround );



	   				}
	   				else{
	   					tempGround  =  Math.max(path[i].left_height -  ( tempPosition[0] - path[i].left_x ) + Math.sqrt(2), tempGround );



	   				}

	   			}

	   		}

	   		//this.position[1] = this.ground;
	   }
	   	if(tempGround - tempPosition[1] <= 0.6  )
        this.update_position_add(Vec.of(-0.1,-0.1*Math.tan(this.ground_angle),0));

      }
    }


    apply_impulse(impulse)
    {
      for( var i = 0; i < 3; i ++)
        impulse[i] = impulse[i]/this.time_dilation;

      this.velocity  = this.velocity.plus(Vec.of(impulse[0]/this.mass, impulse[1]/this.mass,impulse[2]/this.mass));

    }

    check_collision_sphere()
    {
      return true;
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

    compute_next()
    {

 		if(this.shape == "mario")
	   {
	   		//this.position[0] = this.ground;
	   		var i;
	   		for (i = 0; i < path.length; i++)
	   		{
	   			if(i == 0)
	   			{
	   				this.ground = -100000;
	   			}
	   			if (this.position[0] >= path[i].left_x  && this.position[0] < path[i].right_x )
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



	   		//this.position[1] = this.ground;
	   }

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
	   else if (this.shape == "mario")
	   	this.jumpStart = false;


       this.accleration = Vec.of(0,0,0);






       if (this.position[1] < this.ground && this.shape == "mario")
       {
        this.jumpStart = false;
        this.velocity = Vec.of(0,0,0);
        this.jump_count = 0;
        this.position[1] = this.ground;
       }
       else if ( Math.abs(this.position[1] - this.ground) <= 0.3 && Math.abs(this.position[1] - this.ground) > 0 && this.shape == "mario" && this.jumpStart == false)
       {
        	 this.velocity = Vec.of(0,0,0);
        	 this.jump_count = 0;
        	 this.position[1] = this.ground;
       }

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

    update_transform(){
       this.transforms = Mat4.identity();
       this.transforms = this.transforms.times(Mat4.translation(this.position));
       this.transform_position = this.transforms;
       this.transforms = this.transforms.times(Mat4.rotation(this.rotation[0], [1,0,0]));
       this.transforms = this.transforms.times(Mat4.rotation(this.rotation[1], [0,1,0]));
       this.transforms = this.transforms.times(Mat4.rotation(this.rotation[2], [0,0,1]));


    }

    draw(context, program_state, material)
    {
      this.update_transform();
      this.object_type.draw(context, program_state, this.transforms, material);
      this.compute_next();
//       if(this.shape == "mario")
//       	console.log(this.ground);
    }

}


 const Main_Scene = //Obj_File_Demo;
class Solar_System extends Scene
{                                             // **Solar_System**:  Your Assingment's Scene.
  constructor()
    {                  // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
      super();
                                                        // At the beginning of our program, load one of each of these shape
                                                        // definitions onto the GPU.  NOTE:  Only do this ONCE per shape.
                                                        // Don't define blueprints for shapes in display() every frame.

                                                // TODO (#1):  Complete this list with any additional shapes you need.
      this.shapes = { 'box' : new Cube(),
	  				'scene_box': new physics_component(1000 ,"cube"),
					'scene_box_45': new physics_component(1000, "cube",Vec.of(0,0,0), Vec.of(0,0,Math.PI/4)),
					'scene_box_135': new physics_component(1000, "cube",Vec.of(0,0,0), Vec.of(0,0,3*Math.PI/4)),
                   'ball_4' : new Subdivision_Sphere( 4 ),
                     'star' : new Planar_Star(),
                    "interactive_box1" : new physics_component(10, "cube"),
                    "sphere" : new physics_component(10, "sphere"),
                    "mario":  new physics_component(10, "mario")
                      };
      // *** Shaders ***

      // NOTE: The 2 in each shader argument refers to the max
      // number of lights, which must be known at compile time.

      // A simple Phong_Blinn shader without textures:
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

                                              // *** Materials: *** wrap a dictionary of "options" for a shader.

                                              // TODO (#2):  Complete this list with any additional materials you need:
	  const green = Color.of(0.13,0.5,0.41,1);
      this.materials = { plastic: new Material( phong_shader,
                                    { ambient: 1, diffusivity: 1, specularity: 0, color: green } ),
                   grass_ground: new Material( texture_shader_2,
                                    { texture: new Texture( "assets/bricks.png" ),
                                      ambient: 1, diffusivity: 1, specularity: 0 } ),
                   wooden_box: new Material( texture_shader_2,
                                    { texture: new Texture( "assets/woodenBox.png" ),
                                      ambient: 1, diffusivity: 1, specularity: 0 } ),
                           metal: new Material( phong_shader,
                                    { ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( 1,.5,1,1 ) } ),
                     metal_earth: new Material( texture_shader_2,
                                    { texture: new Texture( "assets/earth.gif" ),
                                      ambient: 0, diffusivity: 1, specularity: 1, color: Color.of( .4,.4,.4,1 ) } ),
                      black_hole: new Material( black_hole_shader ),
                             sun: new Material( sun_shader, { ambient: 1, color: Color.of( 0,0,0,1 ) } )
                       };

                                  // Some setup code that tracks whether the "lights are on" (the stars), and also
                                  // stores 30 random location matrices for drawing stars behind the solar system:
      this.lights_on = false;

      this.move_left = false;
      this.move_right = false;
      this.jump = 0;

      this.apply_impulse = 0;
      this.star_matrices = [];
      for( let i=0; i<30; i++ )
        this.star_matrices.push( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 0,1,0 ) )
                         .times( Mat4.rotation( Math.PI/2 * (Math.random()-.5), Vec.of( 1,0,0 ) ) )
                         .times( Mat4.translation([ 0,0,-150 ]) ) );

    }
  make_control_panel()
    {                                 // make_control_panel(): Sets up a panel of interactive HTML elements, including
                                      // buttons with key bindings for affecting this scene, and live info readouts.

                                 // TODO (#5b): Add a button control.  Provide a callback that flips the boolean value of "this.lights_on".
      this.key_triggered_button("apply_impulse", ["1"],  () => {this.apply_impulse += 1;}   );
      this.new_line();
      this.key_triggered_button("move_left", ["a"],  () => {this.move_left = true; } , '#'+Math.random().toString(9).slice(-6) , () => {this.move_left = false;}  );
      this.key_triggered_button("move_right", ["d"],  () => {this.move_right = true; } , '#'+Math.random().toString(9).slice(-6) , () => {this.move_right = false;}  );
      this.new_line();
      this.key_triggered_button("jump", [" "],  () => {this.jump += 1; } , '#'+Math.random().toString(9).slice(-6) );




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

      const blue = Color.of( 0,0,.5,1 ), yellow = Color.of( .5,.5,0,1 ), white = Color.of(1.0,1.0,1.0,1.0);

                                    // Variable model_transform will be a local matrix value that helps us position shapes.
                                    // It starts over as the identity every single frame - coordinate axes at the origin.
      let model_transform = Mat4.identity();

                                                  // TODO (#3b):  Use the time-varying value of sun_size to create a scale matrix
                                                  // for the sun. Also use it to create a color that turns redder as sun_size
                                                  // increases, and bluer as it decreases.
      const smoothly_varying_ratio = .5 + .5 * Math.sin( 2 * Math.PI * t/10 ),
            sun_size = 1 + 2 * smoothly_varying_ratio,
                 sun = undefined,
           sun_color = undefined;

      this.materials.sun.color = sun_color;     // Assign our current sun color to the existing sun material.

                                                // *** Lights: *** Values of vector or point lights.  They'll be consulted by
                                                // the shader when coloring shapes.  See Light's class definition for inputs.

                                                // TODO (#3c):  Replace with a point light located at the origin, with the sun's color
                                                // (created above).  For the third argument pass in the point light's size.  Use
                                                // 10 to the power of sun_size.
      program_state.lights = [ new Light( Vec.of( 0,0,0,1 ), Color.of( 1,1,1,1 ), 100000 ) ];
      const modifier = this.lights_on ? { ambient: 0.3 } : { ambient: 0.0 };

      // ***** BEGIN TEST SCENE *****
                                          // TODO:  Delete (or comment out) the rest of display(), starting here:

      //
      const angle = Math.sin( t );

      //const light_position = Mat4.rotation( angle, [ 1,0,0 ] ).times( Vec.of( 0,-1,1,0 ) );

      program_state.lights = [ new Light( Vec.of(0,0,0,1), Color.of( 1,1,1,1 ), 1000000 ) ];

      model_transform = Mat4.identity();

      // this.shapes.box.draw( context, program_state, model_transform, this.materials.plastic.override( yellow ) );





      //program_state.set_camera( Mat4.inverse(this.shapes.mario.transform_position.times(Mat4.rotation(0 ,[1,0,0])).times(Mat4.translation([ 0,0, 20]))  ) );
	  //-----draw scene----//
// 	 const unscaled = model_transform.copy();
// 	 var model_transform_square = model_transform.times(Mat4.translation(Vec.of(-15, -6, 0)));
function draw_flat_ground (context, program_state, length, currentPos, shapes, materials)
{


     counter++;


	var left_height = currentPos[1]+3;
	var right_height = currentPos[1]+3;
	var left_x = currentPos[0]-1;
	var right_x;
	var angle;
    for (var i = 0; i <= length; ++i) {
	  shapes.scene_box.update_position_override(currentPos);
	  shapes.scene_box.draw(context, program_state, materials.grass_ground);
	  currentPos = currentPos.plus(Vec.of(2,0,0));
    }
	  currentPos = currentPos.minus(Vec.of(2,0,0));
	  right_x = currentPos[0]+1;
	if(counter == 1)
    {

    	var temp = currentPos;
    	temp = currentPos.plus(Vec.of(2,0,0));
    	shapes.scene_box.update_position_override(temp);
	  	shapes.scene_box.draw(context, program_state, materials.grass_ground);
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
function draw_vertical_wall(context, program_state, height, currentPos, shapes, materials)
{
	if(height < 0)
		currentPos = currentPos.plus(Vec.of(cubeSize,height*cubeSize,0));
	else
		currentPos = currentPos.plus(Vec.of(cubeSize,0,0));
    for (var i = 0; i < Math.abs(height); ++i) {
		currentPos = draw_flat_ground(context, program_state, 0, currentPos, shapes, materials);
		currentPos = currentPos.plus(Vec.of(0,cubeSize,0));
	}
	currentPos = currentPos.minus(Vec.of(0,cubeSize,0));
	return currentPos;
}
	const cubeSize = 2;
	var length = 3;
	var currentPosition = Vec.of(-17, -6, 0);
	//----------All the way until the first box--------------------
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes, this.materials);
	currentPosition = draw_upwards_slope(context, program_state, length, currentPosition, this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes, this.materials);
	this.shapes.interactive_box1.update_position_override(currentPosition.plus(Vec.of(0,2,0)));
    this.shapes.interactive_box1.draw(context, program_state, this.materials.wooden_box);
	//-------------------------------------------------------------
	currentPosition = draw_downwards_slope(context, program_state, length, currentPosition, this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes, this.materials);

	//Need to push the 1st box to continue
	var tempHeight = 3; //(currently can directly jump to continue) make it 4 when the wooden box works
	currentPosition = draw_vertical_wall(context, program_state, tempHeight, currentPosition, this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes, this.materials);
	//TODO: add some coins here (write a function make coins disappear after "collision"?)
	//three wooden box in the air
	this.shapes.interactive_box1.update_position_override(currentPosition.plus(Vec.of(-3*cubeSize,3*cubeSize,0)));
    this.shapes.interactive_box1.draw(context, program_state, this.materials.wooden_box);
	this.shapes.interactive_box1.update_position_override(currentPosition.plus(Vec.of(-2*cubeSize,3*cubeSize,0)));
    this.shapes.interactive_box1.draw(context, program_state, this.materials.wooden_box);
	this.shapes.interactive_box1.update_position_override(currentPosition.plus(Vec.of(-cubeSize,3*cubeSize,0)));
    this.shapes.interactive_box1.draw(context, program_state, this.materials.wooden_box);

	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes, this.materials);
	//Need to push the 2nd box to continue
	this.shapes.interactive_box1.update_position_override(currentPosition.plus(Vec.of(0,2,0)));
    this.shapes.interactive_box1.draw(context, program_state, this.materials.wooden_box);
	currentPosition = draw_downwards_slope(context, program_state, length, currentPosition, this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes, this.materials);

	//pit
	let depth = 2, width = 3;
	currentPosition = draw_vertical_wall(context, program_state, -depth, currentPosition.minus(Vec.of(cubeSize,0,0)), this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, width, currentPosition.plus(Vec.of(0,-depth*cubeSize,0)), this.shapes, this.materials);
	currentPosition = draw_vertical_wall(context, program_state, depth + 1, currentPosition, this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition.plus(Vec.of(0,cubeSize,0)), this.shapes, this.materials);
	currentPosition = draw_flat_ground(context, program_state, length, currentPosition, this.shapes, this.materials);



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

      var pos = this.shapes.mario.position;
      var factor = 1;





      this.shapes.mario.draw(context, program_state, this.materials.plastic.override( yellow ));
      //console.log(path);

// //	this.shapes.box.draw(context, program_state,  model_transform_square.times(Mat4.scale(Vec.of(2,12,2))), this.materials.plastic);
// 	var model_transform_slope = model_transform_square.copy();
// 		model_transform_slope = model_transform_slope.times(Mat4.translation([3, 2, 0]));
// 	    model_transform_slope = model_transform_slope.times(Mat4.rotation(Math.PI/4, Vec.of(0,0,-1)));
// 	this.shapes.box.draw(context, program_state, model_transform_slope.times(Mat4.scale(Vec.of(4,10,2))), this.materials.plastic);
// 	model_transform_square = model_transform_square.times(Mat4.translation([10, 10*Math.sqrt(2), 0]));
//     for (var i = 0; i < num_cubes; ++i) {
//         model_transform_square = model_transform_square.times(Mat4.translation([4, 0, 0]));
// 	  	this.shapes.box.draw(context, program_state,  model_transform_square.times(Mat4.scale(Vec.of(2,2,2))), this.materials.plastic);
//     }
      this.camera_teleporter.cameras.push( Mat4.inverse(this.shapes.mario.transform_position.times(Mat4.rotation(0 ,[1,0,0])).times(Mat4.translation([ 0,0, 20])) ));
      this.camera_teleporter.cameras.push( Mat4.inverse(this.shapes.mario.transform_position.times(Mat4.rotation(-Math.PI/2 ,[1,0,0])).times(Mat4.translation([ 0,0, 20])) ));

      // ***** END TEST SCENE *****

      // Warning: Get rid of the test scene, or else the camera position and movement will not work.



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

                                      // TODO (#5a):  Fill in some reasonable texture coordinates for the star:
      // this.arrays.texture_coord = this.arrays.position.map( p =>
    }
}

const Gouraud_Shader = defs.Gouraud_Shader =
class Gouraud_Shader extends defs.Phong_Shader
{
  shared_glsl_code()           // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    {
                          // TODO (#6b2.1):  Copy the Phong_Shader class's implementation of this function, but
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
                                          // TODO (#6b2.2):  Copy the Phong_Shader class's implementation of this function,
                                          // but declare N and vertex_worldspace as vec3s local to function main,
                                          // since they are no longer scoped as varyings.  Then, copy over the
                                          // fragment shader code to the end of main() here.  Computing the Phong
                                          // color here instead of in the fragment shader is called Gouraud
                                          // Shading.
                                          // Modify any lines that assign to gl_FragColor, to assign them to "color",
                                          // the varying you made, instead.  You cannot assign to gl_FragColor from
                                          // within the vertex shader (because it is a special variable for final
                                          // fragment shader color), but you can assign to varyings that will be
                                          // sent as outputs to the fragment shader.

      return this.shared_glsl_code() + `
        void main()
          {

          } ` ;
    }
  fragment_glsl_code()         // ********* FRAGMENT SHADER *********
    {                          // A fragment is a pixel that's overlapped by the current triangle.
                               // Fragments affect the final image or get discarded due to depth.

                               // TODO (#6b2.3):  Leave the main function almost blank, except assign gl_FragColor to
                               // just equal "color", the varying you made earlier.
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

                  // TODO (#EC 1b):  Send the GPU the only matrix it will need for this shader:  The product of the projection,
                  // camera, and model matrices.  The former two are found in program_state; the latter is directly
                  // available here.  Finally, pass in the animation_time from program_state. You don't need to allow
                  // custom materials for this part so you don't need any values from the material object.
                  // For an example of how to send variables to the GPU, check out the simple shader "Funny_Shader".

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
{ update_GPU( context, gpu_addresses, graphics_state, model_transform, material )
    {
                      // TODO (#EC 2): Pass the same information to the shader as for EC part 1.  Additionally
                      // pass material.color to the shader.


    }
                                // TODO (#EC 2):  Complete the shaders, displacing the input sphere's vertices as
                                // a fireball effect and coloring fragments according to displacement.

  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;

      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `

        void main()
        {

        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return this.shared_glsl_code() + `
        void main()
        {

        } ` ;
    }
}
