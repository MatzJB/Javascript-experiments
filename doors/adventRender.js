/*
Matz JB
12/7 2023

Build cards based on json
Show 'scenes' from json
Buffer audio when switching scene. 

*/

//load data from file maybe?
jsonData = {
  "scenes": [
    {
      "background": "scene1_background.jpg",
      "images": [
        {
          "filename": "image1.jpg",
          "audio": "image1_audio.mp3",
          "position": [100, 200],
          "animation": "fade-in"
        },
        {
          "filename": "image2.jpg",
          "audio": "image2_audio.mp3",
          "position": [300, 400],
          "animation": "slide-in"
        }
      ]
    },
    {
      "background": "scene2_background.jpg",
      "images": [
        {
          "filename": "image3.jpg",
          "audio": "image3_audio.mp3",
          "position": [500, 600],
          "animation": "rotate"
        }
      ]
    }
  ]
}


if (!Detector.webgl) Detector.addGetWebGLMessage()

var DEBUG = true
var isTouchDevice = false
var camera, scene, renderer
var cameraControls
var billboard = new THREE.PlaneGeometry()
var mousePressed = false


function log(str) {
  if (DEBUG) {
    console.log(str)
  }
}

// add audio
const listener = new THREE.AudioListener()


function bufferAudio(filename)
{
    const sound = new THREE.Audio(listener)
    const audioLoader = new THREE.AudioLoader()
    audioLoader.load(filename, function(buffer) {
        sound.setBuffer(buffer)
        sound.setLoop(false)
        sound.setVolume(0.25)
    })
    log('Buffering audio ' + filename)
    return sound
}


function rotateAroundPoint(object, anchorPoint, angle, axisrotation) {
  let moveDir = new THREE.Vector3(
    anchorPoint.x - object.position.x,
    anchorPoint.y - object.position.y,
    anchorPoint.z - object.position.z
  )
  moveDir.normalize()
  let moveDist = object.position.distanceTo(anchorPoint)
  /// step 2: move object to anchor point
  object.translateOnAxis(moveDir, moveDist)
  /// step 3: rotate object
  object.rotateX(angle * axisrotation.x)
  object.rotateY(angle * axisrotation.y)
  object.rotateZ(angle * axisrotation.z)
  /// step4: move object along the opposite direction
  moveDir.multiplyScalar(-1)
  object.translateOnAxis(moveDir, moveDist)
}

class Door {
  constructor(name, filename, audioFilename, xCoordStart, yCoordStart, xCoordEnd, yCoordEnd) {
    this.xCoordStart = xCoordStart
    this.yCoordStart = yCoordStart
    this.xCoordEnd = xCoordEnd
    this.yCoordEnd = yCoordEnd
    this.animating = true //should be false
    var deg = 90
    this.rotation = 0
    this.time = 0
    this.angle = 0
    this.finish_angle = 90 * Math.PI / 180 //*deg/180 // 180/2
    var x = xCoordStart
    var y = yCoordStart
    //load audio and place it in a reference
    this.sound = bufferAudio(audioFilename)

    // testing to add sound to the mesh
    var mesh = createCard(this, name, 1, x, y, xCoordEnd - xCoordStart, yCoordEnd - yCoordStart)
    this.mesh = mesh
    scene.add(mesh)

    refreshLayerTexture(name, filename)
  }

  openDoor() {
    // log(this.sound)
    this.animating = true
    this.sound.play()
    log('hey Mattias guapo, can you hear this?')
    // log(this)
  }

  spin(rotation) {
    if (this.angle <= this.finish_angle) {
      // relative rotation
      rotateAroundPoint(this.mesh, new THREE.Vector3(0, 0, 0), rotation, new THREE.Vector3(0, 1, 0))
      this.angle += rotation
    }
    else {
      rotateAroundPoint(this.mesh, new THREE.Vector3(0, 0, 0), 0, new THREE.Vector3(0, 1, 0))
      this.animating = false
    }
  }

  zoom(zoomFactor) {
    this.mesh.scale.x = 0.6 + 0.05 * Math.cos(this.time)
    this.mesh.scale.y = 0.6 + 0.05 * Math.cos(this.time)
    //  this.mesh.rotateX = 0.8 + 0.1*Math.cos(this.time)

    this.time += zoomFactor
    //log(this.time)
  }

}


doors = []


init()
render()
animate()


function getCenter() {
  var x = document.documentElement.clientWidth * 0.5
  var y = document.documentElement.clientHeight * 0.5
  var center = new THREE.Vector2(x, y)

  return center
}


function getJSONData(filename, cb) {
  var client = new window.XMLHttpRequest()
  client.open('GET', filename)

  client.onreadystatechange = function () {
    if (client.readyState === 4) {
      log('json was read')
      var data = JSON.parse(client.responseText)
      cb(data)
    }
  }
  client.send()
}


function _isTouchDevice() {
  try {
    document.createEvent('TouchEvent')
    return true
  } catch (e) {
    return false
  }
}


function onMouseDown(event) {
  mousePressed = true
}


function onMouseUp(event) {
  mousePressed = false
  hitTest()
}


// returns the canvas
function GetCanvas() {
  return document.getElementsByTagName("canvas")[0]
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/*
  Build advent calendar given arguments for number of tiles in each axle
*/
function BuildAdventCalendar() {
 // add audio for card to play
 
  console.log('Super-Card')
  console.log('Author: Matz JB')
  

  x = -1.3
  y = 0.5
  tmp = new Door('Cakey', 'gallery\\gabbys images\\cakey cat.png', 'gallery\\audios\\kram attack.mp3', x, y, 0,0)
  doors.push(tmp)

  x = -0.7
  y = 0.5
  tmp = new Door('Cat rat', 'gallery\\gabbys images\\cat rat.png', 'gallery\\audios\\gabby_cat_of_the_day.mp3', x, y,0,0)
  doors.push(tmp)

  //
  x = -0.1
  y = 0.5
  tmp = new Door('catnip', 'gallery\\gabbys images\\catnip.png', 'gallery\\audios\\gabby_cat_of_the_day.mp3', x, y,0,0)
  doors.push(tmp)

  x = 0.4
  y = 0.5
  tmp = new Door('gabby', 'gallery\\gabbys images\\gabby.png', 'gallery\\audios\\gabby_cat_of_the_day.mp3', x, y,0,0)
  doors.push(tmp)

  x = -1.3
  y = -0.2
  tmp = new Door('kitty fairy', 'gallery\\gabbys images\\kitty fairy.png', 'gallery\\audios\\gabby_cat_of_the_day.mp3', x, y,0,0)
  doors.push(tmp)

  x = -0.7
  y = -0.2
  tmp = new Door('mama box', 'gallery\\gabbys images\\mama box.png', 'gallery\\audios\\gabby_cat_of_the_day.mp3', x, y,0,0)
  doors.push(tmp)

  x = -0.1
  y = -0.2
  tmp = new Door('mercat', 'gallery\\gabbys images\\mercat.png', 'gallery\\audios\\gabby_cat_of_the_day.mp3', x, y,0,0)
  doors.push(tmp)

  x = 0.4
  y = -0.2
  tmp = new Door('pandy cat', 'gallery\\gabbys images\\pandy cat.png', 'gallery\\audios\\gabby_cat_of_the_day.mp3', x, y,0,0)
  doors.push(tmp)

  x = 1
  y = -0.2
  tmp = new Door('pillow cat', 'gallery\\gabbys images\\pillow cat.png', 'gallery\\audios\\gabby_cat_of_the_day.mp3', x, y,0,0)
  doors.push(tmp)







  console.log(doors[0])
}


function init() {
  isTouchDevice = _isTouchDevice()
  log('touch device?' + isTouchDevice)

  container = document.createElement('div')
  document.body.appendChild(container)
  var canvasWidth = window.innerWidth
  var canvasHeight = window.innerHeight

  // camera = new THREE.OrthographicCamera( canvasWidth / - 2, canvasWidth / 2, canvasHeight / 2, canvasHeight / - 2, 1, 200 );

  camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.01, 500)
  log('camera was init:' + camera)
  camera.position.set(0, 0, 10)

  camera.add(listener)

  renderer = new THREE.WebGLRenderer()
  renderer.setClearColor(0xAAAAAA)

  renderer.sortElements = false

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasWidth, canvasHeight)
  renderer.gammaInput = true
  renderer.gammaOutput = true

  container.appendChild(renderer.domElement)
  // window.addEventListener('keydown', onKeyDown, false)

  var canvas = GetCanvas()
  canvas.addEventListener('mousedown', onMouseDown, false)
  canvas.addEventListener('mouseup', onMouseUp, false)
  canvas.addEventListener('contextmenu', function (ev) {
    ev.preventDefault()
    return false
  }, false)

  scene = new THREE.Scene()
  log('scene was created')
  BuildAdventCalendar()
}


function refreshLayerTexture(name, filename) {
  textureMap = new THREE.TextureLoader().load(filename)
  textureMap.magFilter = THREE.LinearFilter
  textureMap.minFilter = THREE.LinearFilter
  layer = scene.getObjectByName(name)

  layer.material.map = textureMap
  layer.material.blending = THREE.Normal
  textureMap.onload = function () {
    layer.material.needsUpdate = true
  }
}


// check hit test against the doors in the scene, returns the door
function hitTest() {
  const raycaster = new THREE.Raycaster()

  var e = window.event

  var posX = e.clientX
  var posY = e.clientY

  var x = (posX / window.innerWidth) * 2 - 1
  var y = - (posY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
  const intersects = raycaster.intersectObjects(scene.children)
  if (intersects.length>0)
  {
    intersects[0].object.userData.openDoor()

    log(intersects[0].object)
  }
}



function createCard(ref, name, z, x, y, width, height) {
  var entity = scene.getObjectByName(name)
  scene.remove(entity)

  const geometry = new THREE.PlaneGeometry(1, 1)
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide,  transparent: true})
  // , wireframe:true 
  const layer = new THREE.Mesh(geometry, material)

  layer.name = name
  layer.position.set(x, y, 0)
  layer.userData = ref

  return layer
}


function onWindowResize() {
  var canvasWidth = window.innerWidth
  var canvasHeight = window.innerHeight
  renderer.setSize(canvasWidth, canvasHeight)
  camera.aspect = canvasWidth / canvasHeight
  camera.updateProjectionMatrix()
  render()
}

function render() {
  scene.background = new THREE.Color(0.01, 0.02, 0.2)
  renderer.render(scene, camera)
}


function animate() {
  // setTimeout( function() {
  //     requestAnimationFrame( animate )
  // }, 1000.0 / 40.0 )

  for (i = 0; i < doors.length; i++) {
    if (doors[i].animating) {
      doors[i].zoom(0.01)
    }
  }

  render()
  window.requestAnimationFrame(animate)
}


