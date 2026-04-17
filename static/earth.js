import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { drawThreeGeo } from "./threeGeoJSON.js";

const w = window.innerWidth * 0.6;
const h = window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.getElementById("rightPanel").appendChild(renderer.domElement);

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

const ctrls = new OrbitControls(camera, renderer.domElement);
ctrls.enableDamping = true;

const geometry = new THREE.SphereGeometry(2.5);
const edges = new THREE.EdgesGeometry(geometry, 1);

const line = new THREE.LineSegments(
  edges,
  new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2
  })
);

scene.add(line);

fetch('/static/countries.json')
  .then(res => res.json())
  .then(data => {
    const countries = drawThreeGeo({
      json: data,
      radius: 2.5,
      materalOptions: { color: 0x80FF80 }
    });
    scene.add(countries);
  });

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

let speed = 100;
let paused = false;

let total = 0;
let suspicious = 0;
let normal = 0;

const pauseBtn = document.getElementById("pauseBtn");
const speedBtn = document.getElementById("speedUpBtn");
const resetBtn = document.getElementById("resetSpeedBtn");

pauseBtn.onclick = () => {
  paused = !paused;
  pauseBtn.classList.toggle("active");
  pauseBtn.classList.toggle("danger");
};

speedBtn.onclick = () => {
  speed = Math.max(10, speed / 2);
  speedBtn.classList.add("active");
  setTimeout(() => speedBtn.classList.remove("active"), 200);
};

resetBtn.onclick = () => {
  speed = 100;
};

const totalEl = document.getElementById("total");
const susEl = document.getElementById("sus");
const normEl = document.getElementById("norm");

const barNormal = document.getElementById("barNormal");
const barSuspicious = document.getElementById("barSuspicious");

fetch('/static/coordinates.json')
  .then(res => res.json())
  .then(data => {

    data.sort((a, b) => a[3] - b[3]);

    let index = 0;

    function processNext() {
      if (index >= data.length) return;

      if (!paused) {
        const [ip, lat, lon, ts, sus] = data[index];

        const pos = latLonToVector3(lat, lon, 2.5);

        const geometry = new THREE.SphereGeometry(0.035, 8, 8);
        const color = sus === 1 ? 0xff0000 : 0x00ff00;

        const material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9
        });

        const point = new THREE.Mesh(geometry, material);
        point.position.copy(pos);

        scene.add(point);

        total++;
        if (sus === 1) suspicious++;
        else normal++;

        totalEl.textContent = total;
        susEl.textContent = suspicious;
        normEl.textContent = normal;

        const normalPercent = (normal / total) * 100;
        const susPercent = (suspicious / total) * 100;

        barNormal.style.width = normalPercent + "%";
        barSuspicious.style.width = susPercent + "%";

        index++;
      }

      setTimeout(processNext, speed);
    }

    processNext();
  });

function animate() {
  requestAnimationFrame(animate);

  scene.rotation.y += 0.0005;

  ctrls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  const w = window.innerWidth * 0.6;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});