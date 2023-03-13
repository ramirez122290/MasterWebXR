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
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let group;

let raycaster;

let valorAnterior;

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );
         
    raycaster = new THREE.Raycaster();

    scene = new THREE.Scene();

    let dirLight = new THREE.DirectionalLight ( 0xffffff, 0.5 );
    scene.add( dirLight );
        
    let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
    scene.add( hemiLight );
    
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 60;
         
    group = new THREE.Group();
    scene.add( group );
    
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
         
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    document.body.appendChild( VRButton.createButton( renderer ) );

    window.addEventListener( 'resize', onWindowResize );
    
    controller1 = renderer.xr.getController( 0 );
    controller1.addEventListener( 'selectstart', onSelectStart );
    controller1.addEventListener( 'selectend', onSelectEnd );
    controller1.addEventListener( 'move', onMove);
    scene.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
    controller2.addEventListener( 'selectstart', onSelectStart );
    controller2.addEventListener( 'selectend', onSelectEnd );
    controller2.addEventListener( 'move', onMove);
    scene.add( controller2 );

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    scene.add( controllerGrip1 );

    controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    scene.add( controllerGrip2 );
         
         
    const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

    const line = new THREE.Line( geometry );
    line.name = 'line';
    line.scale.z = 5;

    controller1.add( line.clone() );
    controller2.add( line.clone() );

    raycaster = new THREE.Raycaster();
         
         
    initSkinnedMesh();
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
        valorAnterior = damePosicionGlobal(object.art)
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

function damePosicionGlobal(box) {
    var v = new THREE.Vector3();
    v.copy(box.position);
    box.getWorldPosition(v);
    return v;
}

function onMove (event) {

    const controller = event.target;
    if (controller.userData.selected !== undefined) {
        let seleccionada = controller.userData.selected;
        
        actualizarHuesoSeleccionada(seleccionada)
        actualizarRestoCajas(seleccionada)
    }
}

function initSkinnedMesh() {

    const segmentHeight = 0.5;
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


    const aBoxGeometry = new THREE.BoxGeometry( 0.5, 0.1, 0.5 );

    box0 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
         
    skeleton.bones[0].position.z = -2;
    skeleton.bones[0].position.y = 1;
         
    box0.position.x = skeleton.bones[0].position.x;
    box0.position.y = skeleton.bones[0].position.y;
    box0.position.z = skeleton.bones[0].position.z;
    box0.art = skeleton.bones[0];
    box0.artIdx = 0;
    group.add(box0);
    boxes.push(box0);
    
    box1 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
    box1.position.x = skeleton.bones[0].position.x;
    box1.position.y = skeleton.bones[0].position.y + sizing.segmentHeight;
    box1.position.z = skeleton.bones[0].position.z;
    box1.art = skeleton.bones[1];
    box1.artIdx = 1;
    box1.boxAnt = box0;
    group.add(box1);
    boxes.push(box1);
    
    box2 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
    box2.position.x = skeleton.bones[0].position.x;
    box2.position.y = skeleton.bones[0].position.y + sizing.segmentHeight*2;
    box2.position.z = skeleton.bones[0].position.z;
    box2.art = skeleton.bones[2];
    box2.artIdx = 2;
    box2.boxAnt = box1;
    group.add(box2);
    boxes.push(box2);
    
    box3 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
    box3.position.x = skeleton.bones[0].position.x;
    box3.position.y = skeleton.bones[0].position.y + sizing.segmentHeight*3;
    box3.position.z = skeleton.bones[0].position.z;
    box3.art = skeleton.bones[3];
    box3.artIdx = 3;
    box3.boxAnt = box2;
    group.add(box3);
    boxes.push(box3);
    
    box4 = new THREE.Mesh( aBoxGeometry, new THREE.MeshStandardMaterial( { color: 0x00ff00 } ) );
    box4.position.x = skeleton.bones[0].position.x;
    box4.position.y = skeleton.bones[0].position.y + sizing.segmentHeight*4;
    box4.position.z = skeleton.bones[0].position.z;
    box4.art = skeleton.bones[4];
    box4.artIdx = 4;
    box4.boxAnt = box3;
    group.add(box4);
    boxes.push(box4);

    box0.boxSig = box1;
    box1.boxSig = box2;
    box2.boxSig = box3;
    box3.boxSig = box4;
}

function createGeometry( sizing ) {

    const geometry = new THREE.CylinderGeometry(
            0.2, // radiusTop
            0.2, // radiusBottom
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

function intersectObjects( controller ) {

    if ( controller.userData.selected !== undefined ) return;

    const line = controller.getObjectByName( 'line' );
    const intersections = getIntersections( controller );

    if ( intersections.length > 0 ) {

            const intersection = intersections[ 0 ];
            const object = intersection.object;
            object.material.emissive.r = 1;
            intersected.push( object );
            line.scale.z = intersection.distance;

    } else {
            line.scale.z = 100;
    }
}

function cleanIntersected() {
    while ( intersected.length ) {
        const object = intersected.pop();
        object.material.emissive.r = 0;
    }
}

function animate() {
    renderer.setAnimationLoop( render );
}

function render() {
    cleanIntersected();

    intersectObjects( controller1 );
    intersectObjects( controller2 );

    renderer.render( scene, camera );
}

function actualizarHuesoSeleccionada(caja) {
    let relativa = damePosicionGlobal(caja);

    if (caja.boxAnt !== undefined) {

        let relativaAnt = damePosicionGlobal(caja.boxAnt)

        caja.art.position.set(
            relativa.x - relativaAnt.x,
            relativa.y - relativaAnt.y,
            relativa.z - relativaAnt.z
        )

    } else {
        caja.art.position.set(
            relativa.x,
            relativa.y,
            relativa.z
        )
    }
    

    let posDespuesCambio = damePosicionGlobal(caja.art);
    console.log(valorAnterior)
    console.log(posDespuesCambio)

    if (caja !== box4) {
        let cajaActual = caja.boxSig;

        while (cajaActual !== undefined) {    

            cajaActual.art.position.x += posDespuesCambio.x - valorAnterior.x;
            cajaActual.art.position.y += posDespuesCambio.y - valorAnterior.y;
            cajaActual.art.position.z += posDespuesCambio.z - valorAnterior.z;

            cajaActual = cajaActual.boxSig;
        }
    }
    valorAnterior = posDespuesCambio;
}

function actualizarRestoCajas(caja) {

    let cajaActual = caja.boxSig;

    while (cajaActual !== undefined) {
        let relativa = damePosicionGlobal(cajaActual.art);

        cajaActual.position.set(
            relativa.x,
            relativa.y,
            relativa.z
        )
        cajaActual = cajaActual.boxSig;
    }
}
