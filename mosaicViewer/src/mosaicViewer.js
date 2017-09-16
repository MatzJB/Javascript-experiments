if (!Detector.webgl) Detector.addGetWebGLMessage()

var DEBUG = true
// mosaic data is populated after reading mosic.json
var MOSAICDATA = {
  'minDistance': 0.004,
  'maxDistance': 200,
  'mosaicFilename': '',
  'mosaicRoot': 'gallery'
}

var isTouchDevice = false
var dx = 0,
  dy = 0,
  dz = 0
var dxSpeed = 0,
  dySpeed = 0,
  dzSpeed = 0
var dxIsCoolingDown = false,
  dyIsCoolingDown = false,
  dzIsCoolingDown = false
var movement = 0 // [0,1]
var speedFactor = 40 // default speed of movement
var cooldownSpeed = 0.97
var camera, scene, renderer
var cameraControls
var billboard


//todo: read gallery from json 
var buttonNames = ['Mario', 'Pickle Rick', 'Mona', 'Einstein', 'Lucy Liu', 'Norman Bates', 'jaguar',
  'pig', 'the kiss', 'Trump', 'colette', 'gargantua', 'helpinghand', 'rainbow', 'jobs', 'chess']
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


function is_touch_device() {
  try {
    document.createEvent('TouchEvent');
    return true;
  } catch (e) {
    return false;
  }
}


function touchMove(event) {
  event.preventDefault() // prevents scrolling

  var nFingers = event.touches.length
  updateMovementDirection(nFingers)
}

function updateMovementDirection(nFingers) {

  var debug = document.getElementById('info')
  var debugTextNode = debug.childNodes[0]

  if (DEBUG) {

    debugTextNode.nodeValue = 'fingers used: ' + nFingers + " ok"
  }

  // zoom out
  if (nFingers === 2) {
    dzSpeed = 5
    movement = 1

    if (DEBUG)
      debugTextNode.nodeValue = 'fingers used: ' + nFingers + '(zooming out)'
    return
  }

  // reset
  if (nFingers === 3) {
    dzSpeed = 2
    camera.position.set(0, 0, MOSAICDATA.maxDistance)
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

  if (is_touch_device()) {
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

  dx = Math.sign(dx) * Math.pow(dx, 2) * distance
  dy = Math.sign(dy) * Math.pow(dy, 2) * distance

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
  var nFingers = event.touches.length
  updateMovementDirection(nFingers)
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

function init() {
  isTouchDevice = is_touch_device()
  log('touch device?' + isTouchDevice)

  for (let i = 0; i < buttonNames.length; i++) {
    buttons[i] = document.createElement('BUTTON')
    var info = document.getElementById('info')
    info.appendChild(buttons[i])
    buttons[i].setAttribute('name', buttonNames[i])
    buttons[i].innerHTML = buttonNames[i]
    buttons[i].addEventListener('click', function () {
      getAllJSONData(MOSAICDATA['mosaicRoot'] + '/mosaic_' + buttonNames[i] + '.json')
    }, false)
  }

  container = document.createElement('div')
  document.body.appendChild(container)
  var canvasWidth = window.innerWidth
  var canvasHeight = window.innerHeight

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1.1 * MOSAICDATA.maxDistance)
  log('camera was init')
  camera.position.set(0, 0, MOSAICDATA.maxDistance)
  ambientLight = new THREE.AmbientLight(0x000000) // 0.2
  light = new THREE.DirectionalLight(0xFFFFFF, 1.0)

  renderer = new THREE.WebGLRenderer()
  renderer.setClearColor(0xAAAAAA)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasWidth, canvasHeight)
  renderer.gammaInput = true
  renderer.gammaOutput = true
  container.appendChild(renderer.domElement)

  window.addEventListener('resize', onWindowResize, false)
  window.addEventListener('mousedown', onMouseDown, false)
  window.addEventListener('keydown', onKeyDown, false)
  window.addEventListener('keyup', onKeyUp, false)
  var canvas = document.getElementsByTagName("canvas")[0]
  canvas.addEventListener("touchstart", touchStart, false)
  canvas.addEventListener("touchend", touchEnd, false)
  canvas.addEventListener("touchmove", touchMove, false);


  var materialColor = new THREE.Color()
  texturedMaterial = new THREE.MeshBasicMaterial({ color: materialColor })
  texturedMaterial.generateMipmaps = false
  texturedMaterial.magFilter = THREE.LinearMipMapLinearFilter
  texturedMaterial.minFilter = THREE.LinearMipMapLinearFilter

  texturedMaterial.wrapS = THREE.ClampToEdgeWrapping
  texturedMaterial.wrapY = THREE.ClampToEdgeWrapping

  scene = new THREE.Scene()
  scene.add(light)
}

function getAllJSONData(filename, cb) {
  loadingStart()
  getJSONData(filename, function (data) {

    var spriteMapJsonFilename = './' + MOSAICDATA['mosaicRoot'] + '/' + data['spriteMap']
    log('spritemap filename: ' + spriteMapJsonFilename)
    MOSAICDATA.mosaicIndices = data['mosaicIndices']
    MOSAICDATA.mosaicMetadata = data['metadata']
    log('spritemap: ' + spriteMapJsonFilename)

    getJSONData(spriteMapJsonFilename, function (spriteData) {
      log('spritemap data: ' + spriteData)
      MOSAICDATA.spritemapMetadata = spriteData['metadata']
      MOSAICDATA.spritemapColordata = './' + MOSAICDATA['mosaicRoot'] + '/' + spriteData['colordata']
      textureMap = new THREE.TextureLoader().load(MOSAICDATA.spritemapColordata)

      log('spritemap color data file: ' + MOSAICDATA.spritemapColordata)
      texturedMaterial.map = textureMap

      textureMap.onload = function () {
        log('image:' + textureMap.image)
        log('>>>> LOADED texture')

        billboard.material.needsUpdate = true
      }
      updateButton()
    })

    MOSAICDATA.indices = data['mosaicIndices']
    MOSAICDATA.metadata = data['metadata']

    //var info = document.getElementById('info')
    // info.innerText = MOSAICDATA.mosaicFilename
  })
}

function updateButton() {
  log('MOSAICDATA ' + MOSAICDATA)

  if (MOSAICDATA['mosaicMetadata'] != undefined) {
    createSprite(MOSAICDATA.indices,
      MOSAICDATA['mosaicMetadata'],
      MOSAICDATA['spritemapMetadata'])
    billboard.material.needsUpdate = true;
  }
}

function onKeyUp(e) {
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
  // log('key pressed', e.keyCode)

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
      camera.position.set(0, 0, MOSAICDATA.maxDistance)
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
  shading = 'textured'
  scene.background = new THREE.Color(0, 0, 0)
  renderer.render(scene, camera)
}


/* Create a plane with UV coordinates pointing into a <spritemap> using the mosaic <indices> matrix. */
function createSprite(indices, mosaicmetadata, spritemapmetadata) {
  var spriteMapPixelWidth = spritemapmetadata['pixelWidth']
  var spriteMapPixelHeight = spritemapmetadata['pixelHeight']
  var tilesXsprite = spritemapmetadata['columns']
  var tilesYsprite = spritemapmetadata['rows']
  var ratio = spritemapmetadata['ratio']
  var tilesX = mosaicmetadata['columns']
  var tilesY = mosaicmetadata['rows']
  var mosaicRatio = tilesX / tilesY
  var spriteRatio = tilesXsprite / tilesYsprite

  if (mosaicRatio > 1.0) {
    mosaicRatio = 1 / mosaicRatio
  }

  if (spriteRatio > 1.0) {
    spriteRatio = 1 / spriteRatio
  }

  // todo: normalize tiling, calculate ratio and resize to fit screen
  var geometry = new THREE.PlaneGeometry(tilesX, ratio * tilesY, tilesX, tilesY)
  var j = 1
  for (var i = 0; i < 2 * tilesX * tilesY; i += 2) {

    /**
     * Quad coordinates (q1-q4):
     * (1)----(4)
     *  |      |
     * (2)----(3)
     * 
     * Triangle creation order (threeJS):
     * (1)---(3,6)
     * |   /     |
     * (2,4)---(5)
     * 
     */

    // coordinates are row-major, so they should be row major in mosaic data layout
    var tmp = i / 2
    j = indices[tmp] - 1

    // xx <- [0, tilesXsprite-1]
    var xx = j % tilesXsprite
    var yy = Math.floor(j / tilesXsprite) // starting from top of the sprite map

    var xs = 1.0 * xx / tilesXsprite
    var ys = 1.0 * yy / tilesYsprite

    var xs2 = (xx + 1.0) / tilesXsprite
    var ys2 = (yy + 1.0) / tilesYsprite

    var q1 = new THREE.Vector2(xs, ys2)
    var q2 = new THREE.Vector2(xs, ys)
    var q3 = new THREE.Vector2(xs2, ys)
    var q4 = new THREE.Vector2(xs2, ys2)

    geometry.faceVertexUvs[0][i][0] = q1
    geometry.faceVertexUvs[0][i][1] = q2
    geometry.faceVertexUvs[0][i][2] = q4

    geometry.faceVertexUvs[0][i + 1][0] = q2
    geometry.faceVertexUvs[0][i + 1][1] = q3
    geometry.faceVertexUvs[0][i + 1][2] = q4
  }

  geometry.uvsNeedUpdate = true

  // remove previously created billboards, if any
  var billboardName = "billboard"
  var entity = scene.getObjectByName(billboardName)
  scene.remove(entity)

  // create and add billboard geometry
  billboard = new THREE.Mesh(geometry, texturedMaterial)
  billboard.name = billboardName
  scene.add(billboard)
}

function onMouseDown() {
  mousePressed = true
}

function onMouseUp() {
  mousePressed = false
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
    speed = speedFactor * Math.log10(1 + 0.1 * Math.abs(camera.position.z / MOSAICDATA.maxDistance))
    camera.position.x += speed * movement * dx + speed * movement * dxSpeed
    camera.position.y += speed * movement * dy + speed * movement * dySpeed
    camera.position.z += speed * movement * dz + speed * movement * dzSpeed


    if (camera.position.z < MOSAICDATA.minDistance) {
      camera.position.z = MOSAICDATA.minDistance
    }

    if (camera.position.z > MOSAICDATA.maxDistance) {
      camera.position.z = MOSAICDATA.maxDistance
    }
    camera.updateProjectionMatrix()
    render()
  }

  window.requestAnimationFrame(animate)
}
