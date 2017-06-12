// Simple cube rotation
// author: MatzJB
// number of cubes in all directions
var numi = 3,
    numj = 3,
    numk = 3

// approximate distance we need to move the camera to see all of the cubes
var camDistance = getMaxOfArray([numi, numj, numk]) * 3

// interaction vars:
var previousX = 0
var previousY = 0
var floatingX = 0
var floatingY = 0
var dx = 0.5 //starting off with a spinning cube
var dy = 0
var mouseisDown = false

//set up scene:
var scene = new THREE.Scene()
var camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000)
var renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setClearColor("#ffffff");
renderer.setSize(window.innerWidth, window.innerHeight)

camera.position.set(0, 0, camDistance)

var light = new THREE.PointLight(0xffffff, 5, 100)
light.position.set(50, 50, 50)
scene.add(light)

light = new THREE.PointLight(0xffffff, 5, 100)
light.position.set(0, 30, 50)
scene.add(light)



document.body.appendChild(renderer.domElement)

// adding eventlisteners:
document.addEventListener("mousemove", mouseMove, false)
document.addEventListener("mousedown", mouseDown, false)
document.addEventListener("mouseup", mouseUp, false)


function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function mouseDown(event) {
    mouseisDown = true
}

function mouseUp(event) {
    mouseisDown = false
    previousX = 0
    previousY = 0
}

function mouseMove(event) {
    if (mouseisDown) {
        var tmpX = event.pageX * 0.01
        var tmpY = event.pageY * 0.01

        // just started dragging mouse
        if (previousX === 0) {
            previousX = tmpX
            previousY = tmpY
        }

        dx = tmpX - previousX
        dy = tmpY - previousY

        floatingX += dx
        floatingY += dy

        previousX = tmpX
        previousY = tmpY
    }
}


var geometry = new THREE.BoxGeometry(1, 1, 1)

function createMaterial(col) {
    var material = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.3,
        metalness: 0,
    })
    return material
}


var pivot = new THREE.Object3D()
scene.add(pivot)

// add meshes to our 'group'
var group = new THREE.Object3D()
pivot.add(group)


for (var i = 0; i < numi; i++) {
    for (var j = 0; j < numj; j++) {
        for (var k = 0; k < numk; k++) {
            var cube = new THREE.Mesh(geometry, createMaterial(
                new THREE.Color(i / numi, j / numj, k / numk)))
            cube.position.set(1.02 * i, 1.02 * j, 1.02 * k)
            group.add(cube)
        }
    }
}

// move pivot to center of group
group.position.x = 0.5 - numi * 0.5
group.position.y = 0.5 - numj * 0.5
group.position.z = 0.5 - numk * 0.5


var render = function() {
    requestAnimationFrame(render)
    if (!mouseisDown && (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01)) {
        dx *= 0.95
        dy *= 0.95

        floatingX += dx
        floatingY += dy
    }

    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        pivot.rotation.set(floatingY, floatingX, 0)
        renderer.render(scene, camera)
    }
}

render()
