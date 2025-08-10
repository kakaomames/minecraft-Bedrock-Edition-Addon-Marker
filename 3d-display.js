import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xcccccc);
document.body.appendChild(renderer.domElement);

camera.position.z = 50;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(0, 1, 1);
scene.add(directionalLight);

let currentModel = null;
const textureLoader = new THREE.TextureLoader();

function animate() {
    requestAnimationFrame(animate);
    if (currentModel) {
        // モデルを少し回転させるアニメーション
        currentModel.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// モデルをシーンに追加する関数
export function addModelToScene(model) {
    scene.clear();
    currentModel = model;
    scene.add(currentModel);
}

// モデルにテクスチャを適用する関数
export function applyTextureToModel(textureDataURL) {
    if (!currentModel) {
        return;
    }

    textureLoader.load(textureDataURL, (texture) => {
        // テクスチャをマテリアルに設定
        const material = new THREE.MeshStandardMaterial({ map: texture });
        currentModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material = material;
            }
        });
    });
}
