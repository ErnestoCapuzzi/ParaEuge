let scene, camera, renderer, starParticles;
let particles, particlePositions = [], particleVelocities = [];
let PARTICLE_COUNT;
let audioContext, analyser, dataArray;
let isPlaying = false;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audio = new Audio('tema1.mp3'); // Ruta del archivo de música
    audio.crossOrigin = 'anonymous';
    audio.loop = true;

    document.getElementById('play-pause').addEventListener('click', () => {
        if (!isPlaying) {
            audioContext.resume().then(() => {
                audio.play();
            });
            isPlaying = true;
            document.getElementById('play-pause').innerText = 'Pause';
        } else {
            audio.pause();
            isPlaying = false;
            document.getElementById('play-pause').innerText = 'Play';
        }
    });

    const source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

function generateSmileyShape(positions) {
    const faceRadius = 10; // Radio de la cara
    const eyeRadius = 1.5; // Radio de los ojos
    const eyeOffsetX = 4; // Distancia horizontal de los ojos
    const eyeOffsetY = 3; // Distancia vertical de los ojos
    const mouthRadius = 5; // Radio de la sonrisa
    const mouthAngleStart = Math.PI * 1.1; // Inicio de la sonrisa
    const mouthAngleEnd = Math.PI * 1.9; // Fin de la sonrisa

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        let x, y, z;
        const part = i % 3;

        if (part === 0) {
            // Cara (circunferencia)
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.sqrt(Math.random()) * faceRadius;
            x = distance * Math.cos(angle);
            y = distance * Math.sin(angle);
            z = (Math.random() - 0.5) * 0.5;
        } else if (part === 1) {
            // Ojos
            const isLeftEye = Math.random() < 0.5;
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.sqrt(Math.random()) * eyeRadius;
            x = (isLeftEye ? -eyeOffsetX : eyeOffsetX) + distance * Math.cos(angle);
            y = eyeOffsetY + distance * Math.sin(angle);
            z = (Math.random() - 0.5) * 0.2;
        } else {
            // Boca (arco de la sonrisa)
            const angle = mouthAngleStart + Math.random() * (mouthAngleEnd - mouthAngleStart);
            x = mouthRadius * Math.cos(angle);
            y = -4 + mouthRadius * Math.sin(angle);
            z = (Math.random() - 0.5) * 0.2;
        }

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        particlePositions.push(new THREE.Vector3(x, y, z));
        particleVelocities.push(new THREE.Vector3(0, 0, 0));
    }
}

function createStarField() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 200;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 0.3, // Tamaño reducido para un efecto más realista
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        transparent: true,
    });

    starParticles = new THREE.Points(starGeometry, starMaterial);
    scene.add(starParticles);
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    document.body.appendChild(renderer.domElement);

    PARTICLE_COUNT = window.innerWidth < 768 ? 5000 : 10000; // Reduce las partículas en pantallas pequeñas

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    generateSmileyShape(positions);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = 0;

        // Turquesa con brillo
        colors[i * 3] = 0.0; // Rojo
        colors[i * 3 + 1] = 1.0; // Verde
        colors[i * 3 + 2] = 0.8; // Azul
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.25,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        emissive: new THREE.Color(0x00ffff), // Turquesa brillante
        emissiveIntensity: 1.2,
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    createStarField();
    initAudio();
    animate();
}

function animate() {
    requestIdleCallback(() => {
        analyser.getByteFrequencyData(dataArray);

        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.attributes.velocity.array;
        const colors = particles.geometry.attributes.color.array;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const index = i * 3;

            const px = positions[index];
            const py = positions[index + 1];
            const pz = positions[index + 2];

            const intensity = (dataArray[i % dataArray.length] / 255) * 3;

            // Deformación dinámica
            positions[index] += intensity * 0.2 * Math.sin(i + Date.now() * 0.001);
            positions[index + 1] += intensity * 0.2 * Math.cos(i + Date.now() * 0.001);
            positions[index + 2] += intensity * 0.2 * Math.sin(i + Date.now() * 0.002);

            const original = particlePositions[i];
            velocities[index] += (original.x - px) * 0.01;
            velocities[index + 1] += (original.y - py) * 0.01;
            velocities[index + 2] += (original.z - pz) * 0.01;

            positions[index] += velocities[index];
            positions[index + 1] += velocities[index + 1];
            positions[index + 2] += velocities[index + 2];

            velocities[index] *= 0.9;
            velocities[index + 1] *= 0.9;
            velocities[index + 2] *= 0.9;

            // Aumentar el brillo de las partículas con la intensidad
            colors[index] = intensity * 0.2; // Rojo
            colors[index + 1] = intensity * 0.8; // Verde
            colors[index + 2] = intensity; // Azul (turquesa)
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;

        starParticles.rotation.y += 0.001; // Movimiento del fondo de estrellas
        renderer.render(scene, camera);
        animate();
    });
}

// Ajusta la escena al cambiar el tamaño de la ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();



