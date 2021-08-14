if (!Detector.webgl) Detector.addGetWebGLMessage()

var DEBUG = true
// mosaic data is populated after reading mosic.json
var MOSAICDATA = {
  'minDistance': 0.004,
  'maxDistance': 200,
  'mosaicFilename': '',
  'mosaicRoot': 'gallery',
  'loadingSplash': './icons/loadingText.png'
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
var billboard = new THREE.PlaneGeometry()
var loading // used to show a loading animation
var loader = {
  'mesh': new THREE.Mesh(),
  'activated': true
}
var mousePressed = false
var useColors = 0
var blurStrength = -0.1

var buttonNames = [
  'Ahsoka',
  'AmyAcker__Sexy010',
  'Ashoka 2',
  'Bertine',
  'Bicycle',
  'Bioshock',
  'Bioshock2',
  'chess',
  'colette',
  'cow vs girl',
  'Einstein',
  'Entangled 2',
  'Entangled2',
  'Eyes',
  'Ghostbusters',
  'Inna',
  'jaguar',
  'Janet Leigh 2',
  'Janet Leigh',
  'Jedi',
  'Jockey',
  'Kick Ass',
  'liberty',
  'Lucy Liu',
  'Mandelbrot',
  'Mario',
  'Melissa',
  'Monica',
  'mosaic glass',
  'Norman Bates',
  'picking a star',
  'Pickle Rick',
  'Pig colors',
  'pig',
  'Pig-baby',
  'Piggy 2',
  'Piggy',
  'piglet',
  'plumber Mario',
  'queen',
  'rainbow',
  'scream',
  'Soldier',
  'Star Trek',
  'the kiss',
  'Tony Curtis',
  'Tori Amos',
  'Trump',
  'women kranium']

var buttons = []

init()
render()
animate()

function loadingStart () {
  /*
    var canvas = document.getElementsByTagName("canvas")[0]
    console.log("canvas:", canvas)

    var context = canvas.getContext('2d');
    var x = canvas.width / 2;
    var y = canvas.height / 2;
  */
}

function getCenter () {
  var x = document.documentElement.clientWidth * 0.5
  var y = document.documentElement.clientHeight * 0.5
  var center = new THREE.Vector2(x, y)

  return center
}

function getJSONData (filename, cb) {
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

function _isTouchDevice () {
  try {
    document.createEvent('TouchEvent')
    return true
  } catch (e) {
    return false
  }
}

function onMouseDown (event) {
  mousePressed = true
  updateMovementDirection(event)
}

function onMouseUp (event) {
  mousePressed = false
  touchEnd(event)
}

function onMouseMove (event) {
  if (mousePressed) { touchMove(event) }
}

function touchMove (event) {
  event.preventDefault() // prevents scrolling
  updateMovementDirection(event)
}

function updateMovementDirection (event) {
  var debug = document.getElementById('info')
  var debugTextNode = debug.childNodes[0]

  if (DEBUG) {
    debugTextNode.nodeValue = 'fingers used: ' + nFingers + ' ok'
  }

  var nFingers = 0
  if (event.touches) { nFingers = event.touches.length } else { nFingers = event.which }

  // zoom out
  if (nFingers === 3) {
    dzSpeed = 5
    movement = 1

    if (DEBUG) { debugTextNode.nodeValue = 'fingers used: ' + nFingers + '(zooming out)' }
    return
  }

  // reset
  if (nFingers === 2) {
    dzSpeed = 2
    camera.position.set(0, 0, MOSAICDATA.maxDistance)
    movement = 0
    if (DEBUG) { debugTextNode.nodeValue = 'fingers used: ' + nFingers + '(reset zoom)' }
    return
  }

  var center = getCenter()
  var x
  var y

  dxSpeed = 0
  dySpeed = 0
  dzSpeed = 0

  if (event.touches) {
    x = event.touches[0].clientX
    y = event.touches[0].clientY
  } else {
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

  dx = Math.sign(dx) * Math.pow(dx, 2) * distance * 2
  dy = Math.sign(dy) * Math.pow(dy, 2) * distance * 2

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

// start movement
function touchStart (event) {
  event.preventDefault()

  updateMovementDirection(event)
}

function touchEnd (event) {
  dx = 0
  dy = 0
  dz = 0
  dxIsCoolingDown = true
  dyIsCoolingDown = true
  dzIsCoolingDown = true
}

function log (str) {
  if (DEBUG) {
    console.log(str)
  }
}

function init () {
  isTouchDevice = _isTouchDevice()
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

  renderer = new THREE.WebGLRenderer()
  renderer.setClearColor(0xAAAAAA)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasWidth, canvasHeight)
  renderer.gammaInput = true
  renderer.gammaOutput = true
  renderer.antialias = true

  container.appendChild(renderer.domElement)

  window.addEventListener('keydown', onKeyDown, false)
  window.addEventListener('keyup', onKeyUp, false)

  var canvas = document.getElementsByTagName('canvas')[0]
  canvas.addEventListener('mousedown', onMouseDown, false)
  canvas.addEventListener('mouseup', onMouseUp, false)
  canvas.addEventListener('mousemove', onMouseMove, false)
  canvas.addEventListener('touchstart', touchStart, false)
  canvas.addEventListener('touchend', touchEnd, false)
  canvas.addEventListener('touchmove', touchMove, false)
  canvas.addEventListener('contextmenu', function (ev) {
    ev.preventDefault()
    return false
  }, false)

  // Test
  loader.mesh.geometry.z = 10
  loader.mesh.name = 'load'
  loader.mesh = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 1, 1), new THREE.MeshBasicMaterial())
  loader.mesh.material = new THREE.TextureLoader().load(MOSAICDATA.loadingSplash)
  loader.mesh.materialColor = new THREE.Color(255, 0, 0)

  var materialColor = new THREE.Color()
  billboard.material = new THREE.MeshBasicMaterial({
    color: materialColor
  })

  scene = new THREE.Scene()
  scene.add(loader.mesh)
  loader.mesh.material.needsUpdate = true
}

function getAllJSONData (filename, cb) {
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
      textureMap.magFilter = THREE.NearestFilter
      textureMap.minFilter = THREE.LinearMipMapLinearFilter

      log('spritemap color data file: ' + MOSAICDATA.spritemapColordata)

      billboard.material.map = textureMap

      var mat = new THREE.ShaderMaterial({
        uniforms: {
          texture: {
            type: 't',
            value: textureMap
          },
          useColors: {
            type: 'i',
            value: useColors
          },
          blurStrength: {
            type: 'f',
            value: blurStrength
          }
        },
        vertexShader: document.getElementById('vertexShader').text,
        fragmentShader: document.getElementById('fragmentShader').text
      })
      billboard.material = mat

      textureMap.onload = function () {
        log('image:' + textureMap.image)
        log('>>>> LOADED texture')
        billboard.uniforms.texture.value = textureMap

        billboard.material.needsUpdate = true
      }
      updateButton()
    })

    MOSAICDATA.indices = data['mosaicIndices']
    MOSAICDATA.metadata = data['metadata']
  })
}

function updateButton () {
  log('MOSAICDATA ' + MOSAICDATA)

  if (MOSAICDATA['mosaicMetadata'] != undefined) {
    var billboard = createSprite(MOSAICDATA.indices,
      MOSAICDATA['mosaicMetadata'],
      MOSAICDATA['spritemapMetadata'])
    billboard.material.needsUpdate = true

    // remove previously created billboards, if any
    var billboardName = 'billboard'
    var entity = scene.getObjectByName(billboardName)
    scene.remove(entity)
    // create and add billboard geometry
    billboard.name = billboardName
    scene.add(billboard)
  }
}

function onKeyUp (e) {
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
    case 67: // c
      console.log('toggling color ' + useColors)
      useColors = -useColors + 1
      billboard.material.uniforms.useColors.value = useColors
      break
    case 66: // b

      console.log('blur! ' + blurStrength)
      blurStrength += 0.2
      billboard.material.uniforms.blurStrength.value = blurStrength
      break
  }

  if (dx === 0 && dy === 0 && dz === 0) {
    keyIsUp = true
  }
}

function resetdxyz () {
  dx = 0
  dy = 0
  dz = 0
}

function onKeyDown (e) {
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

function onWindowResize () {
  var canvasWidth = window.innerWidth
  var canvasHeight = window.innerHeight
  renderer.setSize(canvasWidth, canvasHeight)
  camera.aspect = canvasWidth / canvasHeight
  camera.updateProjectionMatrix()
  render()
}

function render () {
  scene.background = new THREE.Color(0, 0, 0)
  renderer.render(scene, camera)
}

/* Create a plane with UV coordinates pointing into a <spritemap> using the mosaic <indices> matrix. */
function createSprite (indices, mosaicmetadata, spritemapmetadata) {
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

  billboard = new THREE.Mesh(geometry, billboard.material)

  return billboard
}

function animate () {
  if (loading) {

    // show 'loading' sprite
  }

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
