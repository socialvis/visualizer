var THREE = window.THREE;
var menu = document.getElementById("menu");
var user = document.getElementById("user");
var userImage = document.getElementById("user-image");

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.set( 0, 0, 20 );
camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
var renderer = new THREE.WebGLRenderer();
var controls = new THREE.TrackballControls( camera );
controls.zoomSpeed = 0.1;

renderer.setClearColor(0x001155, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.shadowMapEnabled = true;
//renderer.shadowMapSoft = true;
document.getElementById("container").appendChild(renderer.domElement);

var data = {};
var dataLength = Object.keys(data).length;
var currentUser = 'johannhof';

window.github.getData('johannhof').then(function(result){
  data = result;
  dataLength = Object.keys(data).length;
  createUserSpheres();
});

var spheres = [];

var geometry = new THREE.SphereGeometry(1, 100, 100);
var textMaterial = new THREE.MeshBasicMaterial({
    color: 0xbbbbbb
});
var lineMaterial = new THREE.LineBasicMaterial({
  color: 0x001199
});

function calcProximity(user){
  var i;
  if(!user.followers){
    i = 30;
  }else if(~user.followers.indexOf(currentUser)){
    i = 5;
  }else{
    i = 15;
  }
 return Math.max(
   Math.min(
     Math.random() * (200 / dataLength * (i + 25)) - (100 / dataLength * (i + 25)),
     (i + 25)
   ),
   -(i + 25)
 );
}

function calcPopularity(user){
  if(user.followers){
    return Math.max(Math.min(user.followers.length, 200) / 10, 0.5);
  }else{
    return 0.5;
  }
}

function createSphere(user, coordinates) {
  var material = new THREE.MeshLambertMaterial({
    transparent: true,
    opacity: 0.8,
    ambient: 0x838383,
    color: Math.random() * 0xffffff,
    specular: 0x999999,
    shininess: 30,
    shading: THREE.FlatShading
  });

  var x, y, z;
  if(coordinates){
    x = coordinates[0];
    y = coordinates[1];
    z = coordinates[2];
  }else{
    x = calcProximity(user);
    y = calcProximity(user);
    z = calcProximity(user);
  }
  var textGeom = new THREE.TextGeometry( user.name, {
      size: 0.3,
      height: 0.1,
      font: 'helvetiker'
  });
  var textMesh = new THREE.Mesh( textGeom, textMaterial );
  var sphere = new THREE.Mesh(geometry, material);
  sphere.position.x = x;
  sphere.position.y = y;
  sphere.position.z = z;
  sphere.user = user;
  user.sphere = sphere;
  textMesh.position.x = x;
  textMesh.position.y = y;
  textMesh.position.z = z;
  //sphere.castShadow = true;
  //sphere.receiveShadow = true;
  var scale = calcPopularity(user);
  sphere.scale.set(scale, scale, scale);
  textMesh.scale.set(scale, scale, scale);
  scene.add( textMesh );
  scene.add(sphere);
  spheres.push(sphere);
}

function makeLine(sphere1, sphere2) {
  var lineGeometry = new THREE.Geometry();
  lineGeometry.vertices.push( new THREE.Vector3(sphere1.position.x, sphere1.position.y, sphere1.position.z));
  lineGeometry.vertices.push( new THREE.Vector3(sphere2.position.x, sphere2.position.y, sphere2.position.z));
  var line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);
}

function createUserSpheres(){
  Object.keys(data).forEach(function(key){
    if(!data[key].sphere){
      if(key === currentUser){
        createSphere(data[key], [0,0,0]);
      }else{
        createSphere(data[key]);
      }
    }
  });

  Object.keys(data).forEach(function(key){
    var user = data[key];
    if(user.followers){
      user.followers.forEach(function(follower){
        makeLine(user.sphere, data[follower].sphere);
      });
    }
  });
}

window.addEventListener( 'click', onMouseMove, false );

var projector = new THREE.Projector();

function onMouseMove( e ) {
    var mouse3D = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1,   //x
                                    -( event.clientY / window.innerHeight ) * 2 + 1,  //y
                                    0.5 );                                            //z
    var raycaster = projector.pickingRay( mouse3D.clone(), camera );
    var intersects = raycaster.intersectObjects(spheres);
    // Change color if hit block
    if ( intersects.length > 0 ) {
        var hit = intersects[ 0 ];
        controls.update();
        user.innerHTML = hit.object.user.name;
        userImage.src = hit.object.user.image;

        var cLook = cameraLookDir(camera);
        var tween = new TWEEN.Tween( {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
          lookX: cLook.x,
          lookY: cLook.y,
          lookZ: cLook.z
        })
          .to( {
              x: hit.point.x,
              y: hit.point.y,
              z: hit.point.z + 20,
              lookX: hit.point.x,
              lookY: hit.point.y,
              lookZ: hit.point.z
            } , 1000
               )
            .easing( TWEEN.Easing.Quadratic.In )
            .onUpdate( function () {
                camera.position.set( this.x, this.y, this.z);
                camera.lookAt( new THREE.Vector3( this.lookX, this.lookY, this.lookZ ) );
                controls.target = new THREE.Vector3( this.lookX, this.lookY, this.lookZ );
            } )
            .onComplete(function () {
                camera.lookAt( new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z) );
                controls.target = new THREE.Vector3(hit.point.x, hit.point.y, hit.point.z);
            })
            .start();

        menu.classList.add('show');
    }else{
        menu.classList.remove('show');
    }

}

var directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

var light = new THREE.AmbientLight( 0x888888 ); // soft white light
scene.add(light);

function render(time) {
  requestAnimationFrame(render);
  controls.update();
  TWEEN.update(time);
  renderer.render(scene, camera);
}

render();

function cameraLookDir(camera) {
  var point = new THREE.Vector3( 0, 0, -1 );
  return point.applyMatrix4( camera.matrixWorld );
}
