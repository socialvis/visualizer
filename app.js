var THREE = window.THREE;
var menu = document.getElementById("menu");
var user = document.getElementById("user");
var userInput = document.getElementById("username");
var ghButton = document.getElementById("gh-button");
var userImage = document.getElementById("user-image");
var graph = document.getElementById("graph");
var first = document.getElementById("first");

var expandNetwork = document.getElementById("expand-network");

ghButton.addEventListener('click', function(){
  init(userInput.value);
  first.style.display = "none";
  graph.style.display = "block";
});

function init(firstUser){
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 0, 0, 20 );
  camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
  var renderer = new THREE.WebGLRenderer();
  var controls = new THREE.TrackballControls( camera );
  controls.zoomSpeed = 0.1;

  var currentUser = "";

  renderer.setClearColor(0x001155, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //renderer.shadowMapEnabled = true;
  //renderer.shadowMapSoft = true;
  document.getElementById("container").appendChild(renderer.domElement);

  var allUsers = {};

  var spheres = [];

  var geometry = new THREE.SphereGeometry(1, 100, 100);
  var textMaterial = new THREE.MeshBasicMaterial({
      color: 0xbbbbbb
  });
  var lineMaterial = new THREE.LineBasicMaterial({
    color: 0x999999
  });

  function calcProximity(user, dataLength){
    var i;
    if(!user.followers){
      i = 20;
    }else if(~user.followers.indexOf(currentUser)){
      i = 5;
    }else{
      i = 10;
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

  function createSphere(user, center, data, coordinates) {
    var dataLength = Object.keys(data).length;
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
      x = center[0] + calcProximity(user, dataLength);
      y = center[1] + calcProximity(user, dataLength);
      z = center[2] + calcProximity(user, dataLength);
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

  function createUserSpheres(data, cSphere){
    var center;
    if(cSphere){
      center= [cSphere.position.x, cSphere.position.y, cSphere.position.z];
    }else{
      center= [0,0,0];
    }

    Object.keys(data).forEach(function(key){
      if(!allUsers[key]){
        allUsers[key] = data[key];
      }
      allUsers[key].followers = data[key].followers;
    });

    Object.keys(data).forEach(function(key){
      if(!allUsers[key].sphere){
        if(key === currentUser){
          createSphere(data[key], center, data, center);
        }else{
          createSphere(data[key], center, data);
        }
      }
    });

    Object.keys(data).forEach(function(key){
      var user = allUsers[key];
      if(user.followers){
        user.followers.forEach(function(follower){
          makeLine(user.sphere, allUsers[follower].sphere);
        });
      }
    });
  }

  function loadUserNetwork(user, extensive) {
    currentUser = user.name;
    window.github.getData(user.name, extensive).then(function(result){
      if(user.sphere){
        var scale = calcPopularity(result[user.name]);
        user.sphere.scale.set(scale, scale, scale);
      }

      createUserSpheres(result, user.sphere);
    });
  }

  var projector = new THREE.Projector();

  function onMouseMove() {
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

  window.addEventListener( 'click', onMouseMove, false );

  render();

  function cameraLookDir(camera) {
    var point = new THREE.Vector3( 0, 0, -1 );
    return point.applyMatrix4( camera.matrixWorld );
  }

  loadUserNetwork({name : firstUser}, true);

  expandNetwork.onclick = function () {
    loadUserNetwork(allUsers[user.innerHTML], false);
  };

}