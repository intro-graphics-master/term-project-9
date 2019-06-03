# The adventure of Mario and his shadow

## Contributions of each team member:

### Steven Gong
- Overall architectural design of the project.
- Implementing physics components: collision, gravity. 
- Implementing pushing boxes.
- Implementing  mario’s control module (jump,double jump, shoot fire-ball, movement)
- Implementing AI ( mario’s shadow )
- Implementing camera tracking

### Haiwei Lu
- Scene drawing (moving planks, wooden boxes, flags and general ground)
- Obj files and texture files processing (use blender to divide obj files into parts and assign different colors/texture to each parts)
- Implementing reviving of characters, death detections
- Implementing coins’ spinning and collection effects


## Advanced topics we implemented:
Continuous collision detections ( bullet hits AI, both are moving ) 



## Things that's not obvious:
Since we cannot use given sample code to assign different color/texture for different parts of obj files, we use the software “blender” to split a single obj file into several obj files and assign colors separately. This method also need us to “reassemble” parts back to the original obj file using translation and scale. (We applied this method to both of our mario character and the flag at the end of game)

We are simulating the real gravity with constant g. We organize our objects in the form of a new class “physics_components”, and all other actors are derived from the base class. The base class has the conventional physics properties: gravity, mass, acceleration,velocity, position.   


