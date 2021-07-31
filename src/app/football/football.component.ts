import { Component, OnInit } from '@angular/core';
import { SocketServiceService } from '../service/socket/socket-service.service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
// import * as dat from 'dat.gui';
import * as CANNON from 'cannon-es';
import gsap from 'gsap';

@Component({
  selector: 'app-football',
  templateUrl: './football.component.html',
  styleUrls: ['./football.component.scss']
})
export class FootballComponent implements OnInit {

  flag: boolean = false;
  models: any=[];
  keyboard: any=[];
  camera: any;
  navigationFlag: boolean = false;

  orientationValues: any = [];

  broadcastingOrientationValues: any = {alpha: 40, beta:4, gamma: 0};

  constructor(private socketService: SocketServiceService) { }

  ngOnInit(): void {

    // Device orientation
    if (window.DeviceOrientationEvent) {
      // alert('Orientation Supported');
      window.addEventListener('deviceorientation', (eventData) => {
        console.log(eventData);
        
        this.orientationValues = {
          alpha: eventData.alpha,
          beta: eventData.beta,
          gamma: eventData.gamma
        }

        // Sending out my existense to server
        this.socketService.emit('sendOrientationData',this.orientationValues);

      })
    } else { alert('Not supported') }


    // Listen to events from socket-io server
    this.socketService.listen('userJoined').subscribe((data) => {
      console.log(data);
    });

    

    // Server sending back all the user existence
    this.socketService.listen('sendOrientationDataToAll').subscribe((data) => {
      this.broadcastingOrientationValues = data;
      // playJoiningSound();
    })

    // Disconnection status
    this.socketService.listen('disconnectionstatus').subscribe((data) => {
      // playDisconnectedSound();
    })

    //Canvas
    const canvas = document.querySelector('.webgl') as HTMLCanvasElement;

    //Scene Initialisation  
    const scene = new THREE.Scene()
    

    // Physics
    // World
    const world = new CANNON.World()
    world.broadphase = new CANNON.SAPBroadphase(world)
    world.allowSleep = true
    world.gravity.set(0, - 9.82, 0)

    // Physics Materials
    const concreteMaterial = new CANNON.Material('concrete')
    const plasticMaterial = new CANNON.Material('plastic')

    const concretePlasticContactMaterial = new CANNON.ContactMaterial(
        concreteMaterial,
        plasticMaterial,
        {
            friction: 0.1,
            restitution: 0.7
        }
    )

    world.addContactMaterial(concretePlasticContactMaterial)

    const fog = new THREE.Fog('#262837', 1, 15)
    // scene.fog = fog

    // Sounds
    const userJoiningSound = new Audio('/assets/sounds/joined.mp3')

    const playJoiningSound = () =>
    {
      userJoiningSound.currentTime = 0
      userJoiningSound.play()
    }

    const userDisconnectedSound = new Audio('/assets/sounds/disconnected.mp3')
    const playDisconnectedSound = () =>
    {
      userDisconnectedSound.currentTime = 0
      userDisconnectedSound.play()
    }

    // Texture Loader
    const textureLoader = new THREE.TextureLoader()

    // Loaders and decoders

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('assets/decoders/draco/')

    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    // Textures
    const bakedTexture = textureLoader.load('assets/models/2/baked.jpg')
    bakedTexture.flipY = false
    bakedTexture.encoding = THREE.sRGBEncoding

    //foootball
    const ballTexture = textureLoader.load('assets/models/2/football.jpg')

    // Material
    //Baked Material
    const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture, side: THREE.DoubleSide })

    // Model
    gltfLoader.load(
      'assets/models/2/model.glb',
      (gltf) => {
          
          const mergedMesh = gltf.scene.children.find((child) => child.name === 'baked')
          if(mergedMesh instanceof THREE.Mesh) {
            mergedMesh.material = bakedMaterial
          }
          
          scene.add(gltf.scene)
          gltf.scene.scale.set(15,15,15)
          gltf.scene.receiveShadow = true
          this.models.push(gltf.scene)
      }
    )

    // Font Loader
    const fontLoader = new THREE.FontLoader()
    fontLoader.load(
        'assets/fonts/helvetiker_regular.typeface.json',
        (font) => {
            const textGeometry = new THREE.TextBufferGeometry(
                'UST',
                {
                    font: font,
                    size: .5,
                    height: 0.05,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.03,
                    bevelSize: 0.02,
                    bevelOffset: 0,
                    bevelSegments: 5
                }
            )
            //Make the text center
            textGeometry.computeBoundingBox()
            textGeometry.center()

            const textMaterial = new THREE.MeshBasicMaterial({
              color: 0xffffff
            })
            const text = new THREE.Mesh(textGeometry, textMaterial)
            text.rotation.y = Math.PI / 2
            text.position.x = -3.60
            // text.position.z = - 3
            text.position.y = 3.2
            // scene.add(text)
            text.castShadow = true
            text.receiveShadow = true
        }
    )

    //Physic Sphere
    const sphereShape = new CANNON.Sphere(0.15 * 15)
    const sphereBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0,5,0),
        shape: sphereShape,
        material: plasticMaterial
    })
    // sphereBody.applyLocalForce(new CANNON.Vec3(0, 0, 0), new CANNON.Vec3(0, 0, 0))
    world.addBody(sphereBody)
    

    //Physics Floor
    const floorShape = new CANNON.Plane()
    const floorBody = new CANNON.Body()
    floorBody.material = concreteMaterial
    floorBody.mass = 0
    floorBody.quaternion.setFromAxisAngle(
        new CANNON.Vec3(- 1, 0, 0),
        Math.PI * 0.5
    )
    floorBody.addShape(floorShape)
    world.addBody(floorBody)

    // Threejs Sphere
    const sphere = new THREE.Mesh(
      new THREE.SphereBufferGeometry(0.15,32,32),
      new THREE.MeshBasicMaterial({
          map: ballTexture
      })
    )
    sphere.castShadow = true
    sphere.position.y = 0.5
    scene.add(sphere)
    sphere.scale.set(15,15,15)

    //Three Player Box 
    const playerGeometry = new THREE.BoxBufferGeometry(.5,.5,.5)
    const playerMaterial = new THREE.MeshBasicMaterial({
        map: ballTexture
    })
    const playerMesh = new THREE.Mesh(playerGeometry,playerMaterial)
    playerMesh.position.y = .26
    playerMesh.castShadow = true
    scene.add(playerMesh)
    playerMesh.scale.set(15,15,15)

    // Cannon.js Player Box
    const playerShape = new CANNON.Box(new CANNON.Vec3( 0.5 / 2 * 15, 0.5 / 2 * 15, 0.5 / 2 * 15))
    const playerBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 0, 0),
        shape: playerShape,
        material: plasticMaterial
    })
    world.addBody(playerBody)

    //WALLS
    //Three Walls with Box 
    //1
    const walls = new THREE.Group()
    // scene.add(walls)

    const wallGeometry = new THREE.BoxBufferGeometry(15, 5, 0.25)
    const wallMaterial = new THREE.MeshBasicMaterial({
        wireframe: true
    })
    const wall1Mesh = new THREE.Mesh(wallGeometry, wallMaterial)
    wall1Mesh.position.y = 2.51
    wall1Mesh.position.z = -4.85

    wall1Mesh.castShadow = true
    walls.add(wall1Mesh)

    //Cannon.js Walls Box
    //Walls1

    const wallsShape = new CANNON.Box(new CANNON.Vec3(15 * 0.5, 5 * 0.5, 0.25 * 0.5))
    const walls1Body = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(0, 2.5/2 + 0.01, -4.85),
        shape: wallsShape,
        material: concreteMaterial
    })
    // walls1Body.addEventListener("collide", playWallSound)
    world.addBody(walls1Body)

    //2
    const wall2Mesh = new THREE.Mesh(wallGeometry, wallMaterial)
    wall2Mesh.position.y = 2.51
    wall2Mesh.position.z = 4.85

    wall2Mesh.castShadow = true
    walls.add(wall2Mesh)

    //Cannon.js Walls Box
    //Walls2
    const walls2Body = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(0, 2.5/2 + 0.01, 4.85),
        shape: wallsShape,
        material: concreteMaterial
    })
    // walls2Body.addEventListener("collide", playWallSound)
    world.addBody(walls2Body)

    //3

    const wall2Geometry = new THREE.BoxBufferGeometry(10,5,0.25)
    const wall2Material = new THREE.MeshBasicMaterial({
        wireframe: true
    }) 
    const wall3Mesh = new THREE.Mesh(wall2Geometry, wall2Material)
    wall3Mesh.position.x = -7.35
    wall3Mesh.position.y = 2.51
    wall3Mesh.position.z = 0
    wall3Mesh.rotation.y = Math.PI / 2

    wall3Mesh.receiveShadow = true
    wall3Mesh.castShadow = true
    walls.add(wall3Mesh)

    //Cannon.js Walls Box
    //Walls3

    const walls2Shape = new CANNON.Box(new CANNON.Vec3(10 * 0.5, 5 * 0.5, 0.25 * 0.5))
    const walls3Body = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(-7.35, 2.5/2 + 0.01, 0),
        shape: walls2Shape,
        material: concreteMaterial
    })
    walls3Body.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        Math.PI * 0.5
    )
    // walls3Body.addEventListener("collide", playWallSound)
    world.addBody(walls3Body)

    //three
    const wall4Mesh = new THREE.Mesh(wall2Geometry, wall2Material)
    wall4Mesh.position.x = 7.35
    wall4Mesh.position.y = 2.51
    wall4Mesh.position.z = 0
    wall4Mesh.rotation.y = Math.PI / 2

    wall4Mesh.receiveShadow = true
    wall4Mesh.castShadow = true
    walls.add(wall4Mesh)

    //cannon
    const walls4Body = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(7.35, 2.5/2 + 0.01, 0),
        shape: walls2Shape,
        material: concreteMaterial
    })
    walls4Body.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, -1, 0),
        Math.PI * 0.5
    )
    // walls4Body.addEventListener("collide", playWallSound)
    world.addBody(walls4Body)


    //Renderer Size
    const sizes = {
      width: innerWidth,
      height: innerHeight
    }

    //Render Initialisation
    const renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true})
    // document.body.appendChild( renderer.domElement );
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.setClearColor(0x000000)

    //Camera Initialisation
    this.camera = new THREE.PerspectiveCamera(75,  sizes.width / sizes.height, 0.1, 10000)
    this.camera.position.x = 0
    this.camera.position.y = 150
    this.camera.position.z = 0

    // this.camera.lookAt(new THREE.Vector3(0,0,0));
    scene.add(this.camera)

    // this.camera.position.x = 170 * 0.01;

    //Controls
    const controls = new OrbitControls(this.camera, canvas )
    controls.enableDamping = true;
    //Stopping the rendered view withing a ratio of view port, lock to a position
    // controls.minDistance = 10;
		// controls.maxDistance = 10;

    //Resize Event
    window.addEventListener('resize', () =>
    {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        //Update camera
        this.camera.aspect = sizes.width / sizes.height
        this.camera.updateProjectionMatrix()

        //Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    // Clock
    let clock = new THREE.Clock()
    let oldELapsedTime = 0

    var rotSpeed = .001


    //Animate
    const tick = () => {

      //Clock
      const elapsedTime = clock.getElapsedTime()
      const deltaTime = elapsedTime - oldELapsedTime
      oldELapsedTime = elapsedTime

      //Update Physics World
      world.step(1 / 60, elapsedTime, 3)

      sphere.position.x = sphereBody.position.x
      sphere.position.y = sphereBody.position.y
      sphere.position.z = sphereBody.position.z

      sphere.rotation.x = sphereBody.quaternion.x
      sphere.rotation.y = sphereBody.quaternion.y
      sphere.rotation.z = sphereBody.quaternion.z

      if (this.broadcastingOrientationValues){
        
        // this.camera.position.x = sphereBody.position.x
        // this.camera.position.y = sphereBody.position.y
        // this.camera.position.z = sphereBody.position.z

        playerMesh.position.x = this.broadcastingOrientationValues.alpha;
        playerMesh.position.y = this.broadcastingOrientationValues.beta;
        playerMesh.position.z = this.broadcastingOrientationValues.gamma;

        playerBody.position.x = playerMesh.position.x;
        playerBody.position.y = playerMesh.position.y;
        playerBody.position.z = playerMesh.position.z;
        // console.log(this.broadcastingOrientationValues.alpha);
        
        // this.camera.position.y = this.broadcastingOrientationValues.beta;
        // this.camera.position.y = this.broadcastingOrientationValues.beta * (pi/180);
        // this.camera.position.z = this.broadcastingOrientationValues.gamma * (pi/180);
      }

      // Keyboard movement inputs
      if(this.keyboard[38] || this.keyboard[87]){ // W key
          // playerMesh.position.copy(playerBody.position)
      playerMesh.position.x -= 0.09 * Math.sin(playerMesh.rotation.y)
      playerMesh.position.z += 0.09 * Math.cos(playerMesh.rotation.y)
          playerBody.position.x = playerMesh.position.x;
          playerBody.position.y = playerMesh.position.y;
          playerBody.position.z = playerMesh.position.z;
      }
      if(this.keyboard[40] || this.keyboard[83]){ // S key
      playerMesh.position.x += Math.sin(playerMesh.rotation.y) * 0.09
      playerMesh.position.z += -Math.cos(playerMesh.rotation.y) * 0.09
          playerBody.position.x = playerMesh.position.x;
          playerBody.position.y = playerMesh.position.y;
          playerBody.position.z = playerMesh.position.z;
      }
      if(this.keyboard[37] || this.keyboard[65]){ // A key
      // Redirect motion by 90 degrees
      playerMesh.position.x += Math.sin(playerMesh.rotation.y + Math.PI/2) * 0.09
      playerMesh.position.z += -Math.cos(playerMesh.rotation.y + Math.PI/2) * 0.09
          playerBody.position.x = playerMesh.position.x;
          playerBody.position.y = playerMesh.position.y;
          playerBody.position.z = playerMesh.position.z;
      }
      if(this.keyboard[39] || this.keyboard[68]){ // D key
      playerMesh.position.x += Math.sin(playerMesh.rotation.y - Math.PI/2) * 0.09
      playerMesh.position.z += -Math.cos(playerMesh.rotation.y - Math.PI/2) * 0.09
          playerBody.position.x = playerMesh.position.x;
          playerBody.position.y = playerMesh.position.y;
          playerBody.position.z = playerMesh.position.z;
      }
      
      controls.update()

      if(this.models) {
        this.models.forEach((model :any) => {
          // model.rotation.y += 0.001
        });
      }

      //Rendering Section
      renderer.render(scene, this.camera)

      window.requestAnimationFrame(tick)

    }

    tick()

    //Player Controls
    window.addEventListener('keydown', (event: any) => {
      this.keyboard[event.keyCode] = true;
    });
    window.addEventListener('keyup', (event: any) => {
      this.keyboard[event.keyCode] = false;
    });
  }

  navigateToRoom() {
    console.log(this.navigationFlag);
    
    if (this.navigationFlag === false) {
      gsap.to(this.camera.position, {duration: 1, delay: 0, x: -30})
      // gsap.to(this.camera.position, {duration: 1, delay: 0, y: 1})
      gsap.to(this.camera.position, {duration: 1, delay: 0, z: 15})
      this.navigationFlag = true;
      console.log('from 1st'+this.navigationFlag);
    } else {
      gsap.to(this.camera.position, {duration: 1, delay: 0, x: 0})
      gsap.to(this.camera.position, {duration: 1, delay: 0, y: 10})
      gsap.to(this.camera.position, {duration: 1, delay: 0, z: 10})
      this.navigationFlag = false;
      console.log('from 2nd'+this.navigationFlag);
    }
    
  }


}