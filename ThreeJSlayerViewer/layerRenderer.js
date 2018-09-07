/*
For this first version we only load images from a directory <assetDirectory>
*/

if (!Detector.webgl) Detector.addGetWebGLMessage()


var DEBUG = true

/*
data for the assets and the order of the layers
*/
var layerData = {

  'assetDirectory': 'gallery',
  'maxDistance':400
}

var variantIndices =[ ] // indices to variants for each layer [0,1,2,3,...]
var variantQuantities = [2,2,3,1] // number of variants for each layer, should be found out at runtime

var cooldownSpeed = 0.97

var movement = 0 // [0,1]

var isTouchDevice = false
var camera, scene, renderer
var cameraControls
var billboard = new THREE.PlaneGeometry()
var loading //used to show a loading animation

var mousePressed = false
var speedFactor = 40 // default speed of movement

var dx = 0,
  dy = 0,
  dz = 0
var dxSpeed = 0,
  dySpeed = 0,
  dzSpeed = 0
var dxIsCoolingDown = false,
  dyIsCoolingDown = false,
dzIsCoolingDown = false

var buttonNames = ['Mario world']
var buttons = []

init()
render()
animate()

function loadingStart() {
  /*
    var canvas = document.getElementsByTagName("canvas")[0]
    console.log("canvas:", canvas)  
  
    var context = canvas.getContext('2d');
    var x = canvas.width / 2;
    var y = canvas.height / 2;
  */
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
    document.createEvent('TouchEvent');
    return true;
  } catch (e) {
    return false;
  }
}

function onMouseDown(event) {
  mousePressed = true
  updateMovementDirection(event)
}

function onMouseUp(event) {
  mousePressed = false
  touchEnd(event)
}

function onMouseMove(event) {
  if (mousePressed)
    touchMove(event)
}

function touchMove(event) {
  event.preventDefault() // prevents scrolling
  updateMovementDirection(event)
}

function updateMovementDirection(event) {
  var debug = document.getElementById('info')
  var debugTextNode = debug.childNodes[0]

  if (DEBUG) {
    debugTextNode.nodeValue = 'fingers used: ' + nFingers + " ok"
  }

  var nFingers = 0
  if (event.touches)
    nFingers = event.touches.length
  else
    nFingers = event.which

  // zoom out
  if (nFingers === 3) {
    dzSpeed = 5
    movement = 1

  console.log(camera.position)

    if (DEBUG)
      debugTextNode.nodeValue = 'fingers used: ' + nFingers + '(zooming out)'
    return
  }

  // reset
  if (nFingers === 2) {
    dzSpeed = 2
    camera.position.set(0, 0, layerData.maxDistance)
    movement = 0
    if (DEBUG)
      debugTextNode.nodeValue = 'fingers used: ' + nFingers + '(reset zoom)'
    return
  }

  var center = getCenter()
  var x
  var y

  dxSpeed = 0
  dySpeed = 0
  dzSpeed = 0

  if (event.touches) {
    x = event.touches[0].clientX;
    y = event.touches[0].clientY;
  }
  else {
    x = event.pageX
    y = event.pageY
  }

  var point = new THREE.Vector2(x, y)
  var dir = new THREE.Vector2()
  dir.subVectors(point, center)
  var distance = Math.sqrt(dir.x * dir.x + dir.y * dir.y)

  dir = dir.normalize()
  var w = document.documentElement.clientWidth * 0.5
  var h = document.documentElement.clientHeight * 0.5
  var distanceMax = Math.sqrt(w * w + h * h)

  distance = distance / distanceMax
  dx = dir.x
  dir.y = -dir.y
  dy = dir.y
  dx = dir.x

  dx = Math.sign(dx) * Math.pow(dx, 2) * distance*2
  dy = Math.sign(dy) * Math.pow(dy, 2) * distance*2

  if (distance < 0.1) {
    dx = 0
    dy = 0
  }

  dxSpeed = dx
  dySpeed = dy
  dz = -1
  dzSpeed = dz
  movement = 1
}

//start movement
function touchStart(event) {
  event.preventDefault()

  updateMovementDirection(event)
}

function touchEnd(event) {
  dx = 0
  dy = 0
  dz = 0
  dxIsCoolingDown = true
  dyIsCoolingDown = true
  dzIsCoolingDown = true
}

function log(str) {
  if (DEBUG) {
    console.log(str)
  }
}

// returns the canvas
function GetCanvas(){

  return document.getElementsByTagName("canvas")[0]
}

function init() {
  isTouchDevice = _isTouchDevice()
  log('touch device?' + isTouchDevice)

  for (let i = 0; i < buttonNames.length; i++) {
    buttons[i] = document.createElement('BUTTON')
    var info = document.getElementById('info')
    info.appendChild(buttons[i])
    buttons[i].setAttribute('name', buttonNames[i])
    buttons[i].innerHTML = buttonNames[i]
    buttons[i].addEventListener('click', function () {
/*load new layers here*/
console.log('reading json')
      getAllJSONData(layerData['mosaicRoot'] + '/mosaic_' + buttonNames[i] + '.json')
    }, false)
  }

  container = document.createElement('div')
  document.body.appendChild(container)
  var canvasWidth = window.innerWidth
  var canvasHeight = window.innerHeight

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 500)
  log('camera was init:'+camera)
  camera.position.set(0, 0, 10)

  renderer = new THREE.WebGLRenderer()
  renderer.setClearColor(0xAAAAAA)
  
  renderer.sortElements = false;

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasWidth, canvasHeight)
  renderer.gammaInput = true
  renderer.gammaOutput = true

  container.appendChild(renderer.domElement)

  window.addEventListener('keydown', onKeyDown, false)
  window.addEventListener('keyup', onKeyUp, false)

  var canvas = GetCanvas()
  canvas.addEventListener('mousedown', onMouseDown, false)
  canvas.addEventListener('mouseup', onMouseUp, false)
  canvas.addEventListener('mousemove', onMouseMove, false)
  canvas.addEventListener("touchstart", touchStart, false)
  canvas.addEventListener("touchend", touchEnd, false)
  canvas.addEventListener("touchmove", touchMove, false);
  canvas.addEventListener('contextmenu', function (ev) {
    ev.preventDefault()
    return false
  }, false)

  scene = new THREE.Scene()

  initLayers(scene, 4)
 
  console.log('scene was created')
  var canvas = GetCanvas()
}


/*
  Removes a layer with the same name before creating it and returning the pointer
*/
function createLayer(name, z)
{
    console.log('removing previous layer, if any: ' + name)
    var entity = scene.getObjectByName(name)
    scene.remove(entity)

    var scale = 100
    var geometry = new THREE.PlaneGeometry(10, 10, 1 );

    var material = new THREE.SpriteMaterial( { color: 0xffffff, 
      blending: THREE.Normal,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide
} )

  var layer = new THREE.Sprite( material );
  layer.name = name
  
  return layer
}


// get layername using id (todo: ...and version)
function getLayerName(layerID){
  return 'sprite_' + layerID
}


function getLayer(layerID){
  return scene.getObjectByName(getLayerName(layerID))
}

function GetLayerAssetFilename(layerID){
  return './'+assetDirectory['assetDirectory'] + getLayerName(layerID) + '_' + variantIndices[layerID] + '.png'
}


//initialize layers that exist
function initLayers(scene, nLayers) {

  console.log('refreshing all layers...')
  for(var i=0; i<nLayers; i++)
  {
    var layerName = getLayerName(i)
    console.log('created layer ' + layerName+' at level ' + i)
    var mesh = createLayer(layerName, i)
    mesh.position.set(0,0, -i);
    variantIndices[i] = 0

    scene.add(mesh) 
    refreshLayerTexture(i,GetLayerAssetFilename(i))
  }

}

function refreshLayerTexture(id, filename) {

  console.log('refreshing layer, loading file:'+ filename)
  textureMap = new THREE.TextureLoader().load(filename)

  textureMap.magFilter = THREE.LinearFilter
  textureMap.minFilter = THREE.LinearFilter

  layer = getLayer(id)
  layer.material.map = textureMap
  layer.material.blending= THREE.Normal
 
  textureMap.onload = function () {
    log('image:' + textureMap.image)
    log('texture was loaded')

    layer.material.needsUpdate = true
  }
}

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

function onKeyUp(e) {

if (e.keyCode>=97 && e.keyCode <=105)
{
  var layerIndex = e.keyCode-97
  variantIndices[layerIndex] = (variantIndices[layerIndex] + 1)%variantQuantities[layerIndex]
  var variantindex = variantIndices[layerIndex]
  console.log(variantIndices)
  var filename = GetLayerAssetFilename(layerIndex)

  console.log('filename:' + filename)
  refreshLayerTexture(layerIndex, filename)
}

  switch (e.keyCode) {
    case 65: // A
      dxSpeed = dx
      dxIsCoolingDown = true
      dx = 0
      break
    case 68: // D
      dxSpeed = dx
      dxIsCoolingDown = true
      dx = 0
      break
    case 87: // W
      dySpeed = dy
      dyIsCoolingDown = true
      dy = 0
      break
    case 83: // S
      dySpeed = dy
      dyIsCoolingDown = true
      dy = 0
      break
    case 69: // E
      dzSpeed = dz
      dzIsCoolingDown = true
      dz = 0
      break
    case 70: // F
      dzSpeed = dz
      dzIsCoolingDown = true
      dz = 0
      break
    case 90: // z
      dzIsCoolingDown = true
      dzspeed = 0
      dz = 0
      movement = 0
      break
  }

  if (dx === 0 && dy === 0 && dz === 0) {
    keyIsUp = true
  }
}

function resetdxyz() {
  dx = 0
  dy = 0
  dz = 0
}

function onKeyDown(e) {
  keyIsUp = false

  // note: we we switch direction quicker than the repetition speed, we will see this in the movement of the camera

  movement = 1
  switch (e.keyCode) {
    case 65: // A
      dx = -1
      dxSpeed = dx
      dxIsCoolingDown = false
      break
    case 68: // D
      dx = 1
      dxSpeed = dx
      dxIsCoolingDown = false
      break
    case 87: // W 
      dy = 1
      dySpeed = dy
      dyIsCoolingDown = false
      break
    case 83: // S
      dy = -1
      dySpeed = dy
      dyIsCoolingDown = false
      break
    case 69: // E
      dz = -1
      dzSpeed = dz
      dzIsCoolingDown = false
      break
    case 70: // F
      dz = 1
      dzSpeed = dz
      dzIsCoolingDown = false
      break
    case 90: // z

      camera.position.set(0, 0, cameraDistance)
      break
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
  scene.background = new THREE.Color(0.5, 0.5, 1)
  renderer.render(scene, camera)
}


function animate() {

  if (dxIsCoolingDown && Math.abs(dxSpeed) > 0) {
    dxSpeed *= cooldownSpeed
  }
  if (dyIsCoolingDown && Math.abs(dySpeed) > 0) {
    dySpeed *= cooldownSpeed
  }
  if (dzIsCoolingDown && Math.abs(dzSpeed) > 0) {
    dzSpeed *= cooldownSpeed
  }

  if (Math.abs(dxSpeed) < 0.001) {
    dxSpeed = 0
  }
  if (Math.abs(dySpeed) < 0.001) {
    dySpeed = 0
  }
  if (Math.abs(dzSpeed) < 0.001) {
    dzSpeed = 0
  }

  if (camera.position) {
    speed = speedFactor * Math.log10(1 + 0.1 * Math.abs(camera.position.z / layerData.maxDistance))
    camera.position.x += speed * movement * dx + speed * movement * dxSpeed
    camera.position.y += speed * movement * dy + speed * movement * dySpeed
    camera.position.z += speed * movement * dz + speed * movement * dzSpeed

    if (camera.position.z < layerData.minDistance) {
      camera.position.z = layerData.minDistance
    }

    if (camera.position.z > layerData.maxDistance) {
      camera.position.z = layerData.maxDistance
    }
    camera.updateProjectionMatrix()
    render()
  }




  window.requestAnimationFrame(animate)
}
