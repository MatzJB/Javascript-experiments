if (!Detector.webgl) Detector.addGetWebGLMessage()

var DEBUG = true
// mosaic data is populated after reading mosic.json
var MOSAICDATA = {
  'minDistance': 0.004,
  'maxDistance': 100,
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
var speed = 0.02 // default speed of movement

// var mousePressed = false // used to navigate
var camera, scene, renderer
var cameraControls
var effectController

var ambientLight, light
var skybox

var bNonBlinn
var shading
var wireMaterial, flatMaterial, texturedMaterial

var billboard, textureCube

var diffuseColor = new THREE.Color()
var specularColor = new THREE.Color()

//todo: read gallery from json 
var buttonNames = ['Mario', 'Pickle Rick', 'Mona', 'Einstein', 'Lucy Liu', 'Norman Bates', 'jaguar',
  'pig', 'the kiss', 'Trump', 'colette', 'gargantua', 'helpinghand', 'rainbow', 'jobs', 'chess']
var buttons = []

init()
render()
animate()

function getJSONData(filename, cb) {
  var client = new window.XMLHttpRequest()
  client.open('GET', filename)

  client.onreadystatechange = function () {
    if (client.readyState === 4) {
      console.log('json was read')
      var data = JSON.parse(client.responseText)
      cb(data)
    }
  }
  client.send()
}


function is_touch_device() {
  try {
    document.createEvent("TouchEvent");
    return true;
  } catch (e) {
    return false;
  }
}


function init() {
  isTouchDevice = is_touch_device()
  console.log('touch device?', isTouchDevice)
  console.log('creating buttons:')
  for (let i = 0; i < buttonNames.length; i++) {
    buttons[i] = document.createElement('BUTTON')
    var info = document.getElementById('info')
    info.appendChild(buttons[i])
    buttons[i].setAttribute('name', buttonNames[i])
    buttons[i].innerHTML = buttonNames[i]

    console.log('added  button', buttonNames[i])
    console.log('attempting to load json:', buttonNames[i])

    buttons[i].addEventListener('click', function () {
      getAllJSONData(MOSAICDATA['mosaicRoot'] + '/mosaic_' + buttonNames[i] + '.json')

      updateButton()
    }, false)
  }

  container = document.createElement('div')
  document.body.appendChild(container)
  var canvasWidth = window.innerWidth
  var canvasHeight = window.innerHeight

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, MOSAICDATA.minDistance, MOSAICDATA.maxDistance)
  console.log('camera was init')
  camera.position.set(0, 0, MOSAICDATA.maxDistance)
  console.log('camera', camera)

  ambientLight = new THREE.AmbientLight(0x000000) // 0.2
  light = new THREE.DirectionalLight(0xFFFFFF, 1.0)

  // renderer = new THREE.WebGLRenderer( { antialias: true } )
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
  var el = document.getElementsByTagName("canvas")[0];
  el.addEventListener("touchstart", touchStart, false);


  


  function touchStart(event) {
    console.log('touch start')
    var x
    var y


    //todo: zoom in functionaliy in a direction given by position compared to center
    if (is_touch_device()) {


      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    }
    else {
      x = event.pageX
      y = event.pageY
    }
    zoomXY = { 'x': x, 'y': y }


    console.log("X coords: " + x + ", Y coords: " + y)
  }

  function touchEnd(event) {
    console.log('touch end')

  }

  console.log(window)

  var textureMap
  var materialColor = new THREE.Color()

  texturedMaterial = new THREE.MeshBasicMaterial({ color: materialColor, map: textureMap })

  // choose a better filter?
  texturedMaterial.generateMipmaps = true
  texturedMaterial.magFilter = THREE.LinearMipMapLinearFilter
  texturedMaterial.minFilter = THREE.LinearMipMapLinearFilter
  wireMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
  
  scene = new THREE.Scene()
  scene.add(light)

    //setupGui()
}

function getAllJSONData(filename, cb) {
  getJSONData(filename, function (data) {
    console.log('mosaic data:', data)
    var spriteMapJsonFilename = './' + MOSAICDATA['mosaicRoot'] + '/' + data['spriteMap']
    console.log('spritemap filename', spriteMapJsonFilename)
    MOSAICDATA.mosaicIndices = data['mosaicIndices']
    MOSAICDATA.mosaicMetadata = data['metadata']
    console.log('spritemap:', spriteMapJsonFilename)
    
    getJSONData(spriteMapJsonFilename, function (spriteData) {
      console.log('spritemap data:', spriteData)
      MOSAICDATA.spritemapMetadata = spriteData['metadata']
      MOSAICDATA.spritemapColordata = './' + MOSAICDATA['mosaicRoot'] + '/' + spriteData['colordata']
      textureMap = new THREE.TextureLoader().load(MOSAICDATA.spritemapColordata)

      console.log('spritemap color data file', MOSAICDATA.spritemapColordata)
      console.log('applying map:', textureMap)
      texturedMaterial.map = textureMap

      textureMap.onload = function () {
        console.log('image:', textureMap.image)
        console.log('>>>> LOADED texture')
        console.log('texturemap:', textureMap)
        billboard.material.needsUpdate = true
      }
    })

    MOSAICDATA.indices = data['mosaicIndices']
    MOSAICDATA.metadata = data['metadata']

    var info = document.getElementById('info')

    // info.innerText = MOSAICDATA.mosaicFilename
    // cb()
  })
}

function updateButton() {
  console.log('MOSAICDATA', MOSAICDATA)

  if (MOSAICDATA['mosaicMetadata'] != undefined) {
    console.log('updating sprite')
    createSprite(MOSAICDATA.indices,
      MOSAICDATA['mosaicMetadata'],
      MOSAICDATA['spritemapMetadata'])
    billboard.material.needsUpdate = true; // really?
  }
}

function show_image(src) {
  var img = document.createElement('img')
  img.src = src
  img.width = 1000
  img.height = 1000

  // This next line will just add it to the <body> tag
  document.body.appendChild(img)
}

function onKeyUp(e) {
  // keyIsUp = true

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
  // console.log('key pressed', e.keyCode)

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

// EVENT HANDLERS
function onWindowResize() {
  var canvasWidth = window.innerWidth
  var canvasHeight = window.innerHeight
  renderer.setSize(canvasWidth, canvasHeight)
  camera.aspect = canvasWidth / canvasHeight
  camera.updateProjectionMatrix()

  render()
}

function setupGui() {
  effectController = {
    shininess: 40.0,
    ka: 0.17,
    kd: 0.51,
    ks: 0.2,
    metallic: true,

    hue: 0.0,
    saturation: 1.0,
    lightness: 1.0,

    lhue: 0.04,
    lsaturation: 0.01, // non-zero so that fractions will be shown
    llightness: 1.0,

    // bizarrely, if you initialize these with negative numbers, the sliders
    // will not show any decimal places.
    lx: 0.32,
    ly: 0.39,
    lz: 0.7,
    newShading: 'textured'
  }

  var h
  var gui = new dat.GUI()

  // shading
  h = gui.add(effectController, 'newShading', ['wireframe', 'textured']).name('Shading').onChange(render)
}

//
function render() {

  shading = 'textured'
/*
  if (effectController.nonblinn !== bNonBlinn ||
    effectController.newShading !== shading) {
    bNonBlinn = effectController.nonblinn
    shading = effectController.newShading
  }
*/

  /*
  diffuseColor.setHSL(effectController.hue, effectController.saturation, effectController.lightness)
  if (effectController.metallic) {
    // make colors match to give a more metallic look
    specularColor.copy(diffuseColor)
  } else {
    // more of a plastic look
    specularColor.setRGB(1, 1, 1)
  }

  light.position.set(effectController.lx, effectController.ly, effectController.lz)
  light.color.setHSL(effectController.lhue, effectController.lsaturation, effectController.llightness)

  // skybox is rendered separately, so that it is always behind the teapot.
  if (shading === 'reflective') {
    scene.background = textureCube
  } else {
    scene.background = new THREE.Color(0, 0, 0)
  }
  */
  scene.background = new THREE.Color(0, 0, 0)
  //  console.log("noticed a change, shading=", shading)
  renderer.render(scene, camera)
}


/* 
  Create a plane with UV coordinates pointing into a <spritemap> using the mosaic <indices> matrix.
*/
function createSprite(indices, mosaicmetadata, spritemapmetadata) {
  var spriteMapPixelWidth = spritemapmetadata['pixelWidth']
  var spriteMapPixelHeight = spritemapmetadata['pixelHeight']
  var tilesXsprite = spritemapmetadata['columns']
  var tilesYsprite = spritemapmetadata['rows']
  var ratio = spritemapmetadata['ratio']
  var tilesX = mosaicmetadata['columns']
  var tilesY = mosaicmetadata['rows']
  var maxDim = Math.max(tilesX, tilesY)

  MOSAICDATA.maxDistance = maxDim

  // values should be normalized 
  var mosaicRatio = tilesX / tilesY
  if (mosaicRatio > 1.0) {
    mosaicRatio = 1 / mosaicRatio
  }

  var spriteRatio = tilesXsprite / tilesYsprite
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
    var yy = Math.floor(j / tilesXsprite) // starting from top of sprite map

    // scale
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

  billboard = new THREE.Mesh(geometry, texturedMaterial)
  //  geometry.uvsNeedUpdate = true
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
    dxSpeed *= 0.8
  }
  if (dyIsCoolingDown && Math.abs(dySpeed) > 0) {
    dySpeed *= 0.8
  }
  if (dzIsCoolingDown && Math.abs(dzSpeed) > 0) {
    dzSpeed *= 0.8
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
    camera.position.x += speed * movement * dx + speed * movement * dxSpeed
    camera.position.y += speed * movement * dy + speed * movement * dySpeed
    camera.position.z += speed * movement * dz + speed * movement * dzSpeed
    speed = 20 * Math.log10(1 + 0.1 * Math.abs(camera.position.z / MOSAICDATA.maxDistance))

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
