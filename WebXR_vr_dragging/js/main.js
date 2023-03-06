import {VRButton} from 'three/addons/webxr/VRButton.js';
import {XRControllerModelFactory} from 'three/addons/webxr/XRControllerModelFactory.js';
import * as THREE from 'three';

let container;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

let camera, scene, renderer;

let skinnedMesh, skeleton, bones, skeletonHelper;

let box0, box1, box2, box3, box4;
let boxes = [];

let raycaster, selected;

let selectedC=0xff0000;
let notSelectedC=0x001000;

let alturaS = 6;

let distAcX, distAcY;

const pointer = new THREE.Vector2();
         
init();
animate();

function init() {

    raycaster = new THREE.Raycaster();

    scene = new THREE.Scene();

    let dirLight = new THREE.DirectionalLight ( 0xffffff, 0.5 );
    scene.add( dirLight );
        
    let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
    scene.add( hemiLight );
    
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 60;
    
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
         
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    document.body.appendChild( VRButton.createButton( renderer ) );

    window.addEventListener( 'resize', onWindowResize );
    
    //new OrbitControls( camera, renderer.domElement );
    
    controller1 = renderer.xr.getController( 0 );
    controller1.addEventListener( 'selectstart', onSelectStart );
    controller1.addEventListener( 'selectend', onSelectEnd );
    scene.add( controller1 );
    
    const controllerModelFactory = new XRControllerModelFactory();
    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    scene.add( controllerGrip1 );
         
    controller2 = renderer.xr.getController( 1 );
    controller2.addEventListener( 'selectstart', onSelectStart );
    controller2.addEventListener( 'selectend', onSelectEnd );
    scene.add( controller1 );

    controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    scene.add( controllerGrip2 );
         
    initSkinnedMesh();

    window.addEventListener( 'mousemove', onPointerMove );
    window.addEventListener( 'pointerdown', onPointerDown );
    window.addEventListener( 'pointerup', onPointerUp );
}

function onPointerDown( event ) {

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    
    const found = raycaster.intersectObjects(scene.children, true);
    
    if (found.length) {   
        let obj = found[0].object;
        
        // Para que no se pueda seleccionar la malla
        if (obj !== skinnedMesh) {
           
            boxes.forEach(box => {
                box.ox = box.art.position.x;
                box.oy = box.art.position.y;
            });


            obj.material.emissive.setHex(selectedC);
            obj.currentDrag = true;
            obj.desfX = obj.position.x - found[0].point.x;
            obj.desfY = obj.position.y - found[0].point.y;
            selected = obj;

            boxes.forEach(box => {
                box.ox -= selected.art.position.x;
                box.oy -= selected.art.position.y;
            });
        }
    }
}

function onSelectStart( event ) {

    const controller = event.target;

    const intersections = getIntersections( controller );

    if ( intersections.length > 0 ) {

            const intersection = intersections[ 0 ];

            const object = intersection.object;
            object.material.emissive.b = 1;
            controller.attach( object );

            controller.userData.selected = object;

    }

}

function onSelectEnd( event ) {

    const controller = event.target;

    if ( controller.userData.selected !== undefined ) {

            const object = controller.userData.selected;
            object.material.emissive.b = 0;
            group.attach( object );

            controller.userData.selected = undefined;

    }


}

function onPointerUp( event ) {
    if (selected !== undefined){
        selected.currentDrag = false;
        selected.material.emissive.setHex(notSelectedC);
    }
}

function onPointerMove( event ) {
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const found = raycaster.intersectObjects(scene.children, true);
    if (found.length) {  
        if (selected && selected.currentDrag === true) {
            selected.position.x =  found[0].point.x + selected.desfX;
            selected.position.y = found[0].point.y + selected.desfY;
            
            var posx = 0;
            var posy = 0;
            
            if (selected !== box0) {
                for (var i = 0; i < boxes.length; i++) {
                    
                    if (selected === boxes[i]){
                        break;
                    }
                    posx += boxes[i].art.position.x;
                    posy += boxes[i].art.position.y;
                }
            }
            
            selected.art.position.x = (found[0].point.x + selected.desfX) - posx;
            selected.art.position.y = (found[0].point.y + selected.desfY) - posy;
            
            let encontrado = false;
            
            if (selected !== box0) {
                boxes.forEach(box => {
                    
                    if(encontrado) {
                        box.art.position.x = box.ox + selected.art.position.x;
                        box.art.position.y = box.oy + selected.art.position.y;
                    }
                    
                    if (selected === box){
                        encontrado = true;
                    }
                });
            }
        }
    }
}

function initSkinnedMesh() {

    const segmentHeight = 6;
    const segmentCount = 4;
    const height = segmentHeight * segmentCount;
    const halfHeight = height * 0.5;

    const sizing = {
            segmentHeight,
            segmentCount,
            height,
            halfHeight
    };

    const geometry = createGeometry( sizing );
    
    const material = new THREE.MeshStandardMaterial( {
            color: 0x156289,
            emissive: 0x072534,
            side: THREE.DoubleSide,
            flatShading: true,
            wireframe: true
    } );


    const bones = createBones( sizing );
    
    skeleton = new THREE.Skeleton( bones );
    
    skinnedMesh = new THREE.SkinnedMesh( geometry, material );
    const rootBone = skeleton.bones[ 0 ];
    skinnedMesh.add( rootBone );
    skinnedMesh.bind( skeleton );
    scene.add( skinnedMesh );
    
    skeletonHelper = new THREE.SkeletonHelper( skinnedMesh );
    skeletonHelper.material.linewidth = 5;
    scene.add( skeletonHelper );


    const aBoxGeometry = new THREE.BoxGeometry( 10, 2, 10 );
    
    // Aquí hago un poco de "trampa". Como se que están todos los huesos alineados,
    // aprovecho para fijar la x y la z de todas las cajas a las del hueso 0. En cambio,
    // para la y, multiplico el tamaó del segmento por el numero de caja (que sería equivalente a la suma acumulada)
    box0 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
    box0.position.x = skeleton.bones[0].position.x;
    box0.position.y = skeleton.bones[0].position.y;
    box0.position.z = skeleton.bones[0].position.z;
    box0.art = skeleton.bones[0];
    scene.add(box0);
    boxes.push(box0);
    
    box1 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
    box1.position.x = skeleton.bones[0].position.x;
    box1.position.y = skeleton.bones[0].position.y + sizing.segmentHeight;
    box1.position.z = skeleton.bones[0].position.z;
    box1.art = skeleton.bones[1];
    scene.add(box1);
    boxes.push(box1);
    
    box2 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
    box2.position.x = skeleton.bones[0].position.x;
    box2.position.y = skeleton.bones[0].position.y + sizing.segmentHeight*2;
    box2.position.z = skeleton.bones[0].position.z;
    box2.art = skeleton.bones[2];
    scene.add(box2);
    boxes.push(box2);
    
    box3 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
    box3.position.x = skeleton.bones[0].position.x;
    box3.position.y = skeleton.bones[0].position.y + sizing.segmentHeight*3;
    box3.position.z = skeleton.bones[0].position.z;
    box3.art = skeleton.bones[3];
    scene.add(box3);
    boxes.push(box3);
    
    box4 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
    box4.position.x = skeleton.bones[0].position.x;
    box4.position.y = skeleton.bones[0].position.y + sizing.segmentHeight*4;
    box4.position.z = skeleton.bones[0].position.z;
    box4.art = skeleton.bones[4];
    scene.add(box4);
    boxes.push(box4);
}

function createGeometry( sizing ) {

    const geometry = new THREE.CylinderGeometry(
            5, // radiusTop
            5, // radiusBottom
            sizing.height, // height
            8, // radiusSegments
            sizing.segmentCount * 1, // heightSegments
            true // openEnded
    );

    const position = geometry.attributes.position;

    const vertex = new THREE.Vector3();

    const skinIndices = [];
    const skinWeights = [];

    for ( let i = 0; i < position.count; i ++ ) {

            vertex.fromBufferAttribute( position, i );

            const y = ( vertex.y + sizing.halfHeight );

            const skinIndex = Math.floor( y / sizing.segmentHeight );
            const skinWeight = ( y % sizing.segmentHeight ) / sizing.segmentHeight;

            skinIndices.push( skinIndex, skinIndex + 1, 0, 0 );
            skinWeights.push( 1 - skinWeight, skinWeight, 0, 0 );

    }

    geometry.setAttribute( 'skinIndex', new THREE.Uint16BufferAttribute( skinIndices, 4 ) );
    geometry.setAttribute( 'skinWeight', new THREE.Float32BufferAttribute( skinWeights, 4 ) );

    return geometry;

    }

function createBones( sizing ) {

    bones = [];

    let prevBone = new THREE.Bone();
    bones.push( prevBone );
    prevBone.position.y = - sizing.halfHeight;

    for ( let i = 0; i < sizing.segmentCount; i ++ ) {

        const bone = new THREE.Bone();
        bone.position.y = sizing.segmentHeight;
            
        bones.push( bone );
        prevBone.add( bone );
        prevBone = bone;

    }
    return bones;
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

function getIntersections( controller ) {
    raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
    tempMatrix.identity().extractRotation( controller.matrixWorld );
    raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );
    return raycaster.intersectObjects( group.children, false );
}

function animate() {

    requestAnimationFrame( animate );
    
    distAcX = skeleton.bones[0].position.x;
    distAcY = skeleton.bones[0].position.y;

    for (var i = 1; i < boxes.length; i++) {
                    
        actualizar(boxes[i]); 
    }

    renderer.render( scene, camera );

}

function actualizar(caja) {
    if (!isNaN(distAcX)){
         
        distAcX += caja.art.position.x;
        distAcY += caja.art.position.y;

        caja.position.x = distAcX;
        caja.position.y = distAcY;
    }
}
