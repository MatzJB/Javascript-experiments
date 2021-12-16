/*
For this first version we only load images from a directory <assetDirectory>
*/
console.log('test')

if (!Detector.webgl) Detector.addGetWebGLMessage()

var DEBUG = true
var isTouchDevice = false
var camera, scene, renderer
var cameraControls
var billboard = new THREE.PlaneGeometry()

var mousePressed = false


class Door
{
  //working on it...
  constructor(name, xCoordStart, yCoordStart, xCoordEnd, yCoordEnd)
  {
    this.xCoordStart = xCoordStart
    this.yCoordStart = yCoordStart
    this.xCoordEnd = xCoordEnd
    this.yCoordEnd = yCoordEnd
    this.angle=0    
    // contains graphics asset
    // threejs geometry
    // state (open/closed)
    var x = xCoordStart
    var y = yCoordStart

    var mesh = createCard(name, 1, x, y, xCoordEnd-xCoordStart, yCoordEnd-yCoordStart)
    var filename = '/gallery/door_inside1/acercarse.png'

    console.log('created door '+ name)
    console.log(mesh)

    scene.add(mesh)
    refreshLayerTexture(name, filename)
  }

  turnOver()
  {
    log('turn over')
    this.angle = 90

  }

}



console.log('reading script')
doors = []


init()
render()
animate()


function log(str) {
  if (DEBUG) {
    console.log(str)
  }
}




function getCenter() {
  var x = document.documentElement.clientWidth * 0.5
  var y = document.documentElement.clientHeight * 0.5
  var center = new THREE.Vector2(x, y)

  return center
}

function getJSONData(filename, cb) {
  var client = new window.XMLHttpRequest()
  client.open('GET', filename)

  client.onreadystatechange = function() {
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
    document.createEvent('TouchEvent');
    return true;
  } catch (e) {
    return false;
  }
}

function onMouseDown(event) {
  mousePressed = true
}

function onMouseUp(event) {
  mousePressed = false
  x = event.clientX
  y = event.clientY
  hitTest(x, y)
  // touchEnd(event)
}



// returns the canvas
function GetCanvas() {

  return document.getElementsByTagName("canvas")[0]
}

/*
  Build advent calendar given arguments for number of tiles in each axle
*/
function BuildAdventCalendar()
{

  // doors.push(new Door('hey', 350, 350, 700, 700))
  console.log('creating the advent calendar')
  doors.push(new Door('First_door', 0, 0, 400, 400))
  
  console.log(doors)
}


function init() 
{
  isTouchDevice = _isTouchDevice()
  log('touch device?' + isTouchDevice)

  container = document.createElement('div')
  document.body.appendChild(container)
  var canvasWidth = window.innerWidth
  var canvasHeight = window.innerHeight

  camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.01, 500)
  log('camera was init:' + camera)
  camera.position.set(0, 0, 10)

  renderer = new THREE.WebGLRenderer()
  renderer.setClearColor(0xAAAAAA)

  renderer.sortElements = false;

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasWidth, canvasHeight)
  renderer.gammaInput = true
  renderer.gammaOutput = true

  container.appendChild(renderer.domElement)

  // window.addEventListener('keydown', onKeyDown, false)

  var canvas = GetCanvas()
  canvas.addEventListener('mousedown', onMouseDown, false)
  canvas.addEventListener('mouseup', onMouseUp, false)
  canvas.addEventListener('contextmenu', function(ev) {
    ev.preventDefault()
    return false
  }, false)

  scene = new THREE.Scene()
  log('scene was created')
  BuildAdventCalendar()
  // var canvas = GetCanvas()
}


function refreshLayerTexture(name, filename) {

  textureMap = new THREE.TextureLoader().load(filename)

  textureMap.magFilter = THREE.LinearFilter
  textureMap.minFilter = THREE.LinearFilter


  layer = scene.getObjectByName(name)
  

  // layer = getelementbyname(name)
  layer.material.map = textureMap
  layer.material.blending = THREE.Normal

  textureMap.onload = function() {
    layer.material.needsUpdate = true
  }
}


// check hit test against the doors in the scene, returns the door
function hitTest(x_hit, y_hit)
{

  const raycaster = new THREE.Raycaster()
  
  var e = window.event;

  var posX = e.clientX;
  var posY = e.clientY;

  var x = ( posX/ window.innerWidth ) * 2 - 1
	var y = - ( posY/ window.innerHeight ) * 2 + 1

  raycaster.setFromCamera( new THREE.Vector2(x,y), camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children ) 
  
  //log(intersects[0])
  intersects[0].object.turnOver()
  // trigger turn over which sets angle, animation takes care of animation

  /*
  i = 0;
  for(; i<=doors.length; i++)
  {
    
    // might be a good idea to know that xcoords are xCoordStart<xCoordEnd etc.
    if (doors[i].xCoordStart > x || doors[i].xCoordEnd < x || doors[i].yCoordinateEnd < y || doors[i].yCoordinateStart < y  )
    {
      console.log('Im outside now')
      return -1
    }
    else
    {
      console.log('Im INSIDE now')
      return doors[i]
    }
  }
  */
}



//ok
function createCard(name, z, x, y, width, height)
 {
  // remove it if it already exist
  var entity = scene.getObjectByName(name)
  scene.remove(entity)

  var scale = 1
  var material = new THREE.SpriteMaterial({
    color: 0xffffff,
    transparent: false,
    opacity: 1,
    depthWrite: false,
    side: THREE.DoubleSide

  })
 
  var layer = new THREE.Sprite(material)
  layer.name = name
  layer.position.set(x, y, 0)
  
  return layer
}


function getSpriteName(spriteID) {
  return 'sprite_' + spriteID
}

function getSprite(spriteID) {
  return scene.getObjectByName(getSpriteName(spriteID))
}


function GetLayerAssetFilename(layerID) {
  return './' + layerData['assetDirectory'] + '/' + getLayerName(layerID) + '_' + variantIndices[layerID] + '.png'
}


// function refreshLayerTexture(id, filename) {

//   textureMap = new THREE.TextureLoader().load(filename)

//   textureMap.magFilter = THREE.LinearFilter
//   textureMap.minFilter = THREE.LinearFilter

//   layer = getLayer(id)
//   layer.material.map = textureMap
//   layer.material.blending = THREE.Normal

//   textureMap.onload = function() {
//     layer.material.needsUpdate = true
//   }
// }


// todo: update
function updateButton() {
  if (layerData['mosaicMetadata'] != undefined) {
    var billboard = createSprite(layerData.indices,
      layerData['mosaicMetadata'],
      layerData['spritemapMetadata'])
    billboard.material.needsUpdate = true

    // remove previously created billboards, if any
    var billboardName = "billboard"
    var entity = scene.getObjectByName(billboardName)
    scene.remove(entity)
    // create and add billboard geometry
    billboard.name = billboardName
    scene.add(billboard)
  }
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
  scene.background = new THREE.Color(0.5, 0.5, 0)
  renderer.render(scene, camera)
}


function animate() {
// move door
  var i = 0
  for(; i<doors.length; i++)
  {
    if(doors[i].angle>0)
    {
      log('rotate')
      doors[i].angle-=0.1
      doors[i].mesh.rotateX(doors[i].angle)
    }

  }

  render()
  window.requestAnimationFrame(animate)
}