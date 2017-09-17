/*
  Simple scene with fragment and vertex shader, taken and modified from somewhere
*/

var scene, camera, renderer
var object = null

function init() {
  scene = new THREE.Scene()

  var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight
  var VIEW_ANGLE = 45,
    ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
    NEAR = 0.1, FAR = 1000
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR)
  scene.add(camera)
  camera.position.set(0, 0, 5)
  camera.lookAt(scene.position)

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT)
  var container = document.body
  container.appendChild(renderer.domElement)
  object = buildObject()
  scene.add(object)
  animate()
}


var buildObject = (function () {
  var g = new THREE.SphereGeometry(30, 10, 50)

  var mat = new THREE.ShaderMaterial({
    uniforms: {
      color: { type: 'f', value: 0.0 }
    },
    vertexShader: document.getElementById('vertShader').text,
    fragmentShader: document.getElementById('fragShader').text
  })

  var obj = new THREE.Mesh(g, mat)
  obj.position.x = 0
  obj.position.y = 0
  obj.position.z = -100
  obj.scale.x = obj.scale.y = obj.scale.z = 1
  return obj
})


function animate() {

  var c = 0.5 + 0.5 * Math.cos(
    new Date().getTime() / 1000.0 * Math.PI)
  object.material.uniforms.color.value = c
  renderer.render(scene, camera)
  window.requestAnimationFrame(animate)
}
