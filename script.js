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

function createStarField() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000; // Más estrellas para mayor densidad
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 300;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 300;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 300;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 0.2, // Estrellas más pequeñas para mayor detalle
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
        transparent: true,
    });

    starParticles = new THREE.Points(starGeometry, starMaterial);
    scene.add(starParticles);
}

function createMessage() {
    const textDiv = document.createElement('div');
    textDiv.id = 'text-overlay';
    textDiv.innerText = 'Buen viaje Euge';
    document.body.appendChild(textDiv);

    // Estilo del mensaje
    const style = document.createElement('style');
    style.innerHTML = `
        #text-overlay {
            position: absolute;
            top: 10%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            color: #00ffff; /* Color turquesa */
            font-family: 'Arial', sans-serif;
            text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
            opacity: 0;
            transition: opacity 3s ease-in-out;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    // Mostrar el mensaje una vez
    setTimeout(() => {
        textDiv.style.opacity = '1';
        setTimeout(() => {
            textDiv.style.opacity = '0';
        }, 5000); // Visible por 5 segundos
    }, 1000); // Aparece después de 1 segundo
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Mejorar la resolución
    renderer.setClearColor(0x000000, 1);
    document.body.appendChild(renderer.domElement);

    PARTICLE_COUNT = window.innerWidth < 768 ? 3000 : 8000; // Ajustar partículas según tamaño de pantalla

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.sqrt(Math.random()) * 10;

        positions[i * 3] = distance * Math.cos(angle);
        positions[i * 3 + 1] = distance * Math.sin(angle);
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;

        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = 0;

        colors[i * 3] = 0.1;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.2, // Tamaño más pequeño para partículas de alta resolución
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    createStarField();
    createMessage(); // Agregar mensaje
    initAudio();
    animate();
}

function animate() {
    requestIdleCallback(() => {
        analyser.getByteFrequencyData(dataArray);

        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.attributes.velocity.array;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const index = i * 3;

            const px = positions[index];
            const py = positions[index + 1];
            const pz = positions[index + 2];

            const intensity = (dataArray[i % dataArray.length] / 255) * 2;

            positions[index] += intensity * 0.2 * Math.sin(i + Date.now() * 0.001);
            positions[index + 1] += intensity * 0.2 * Math.cos(i + Date.now() * 0.001);
            positions[index + 2] += intensity * 0.2 * Math.sin(i + Date.now() * 0.002);

            velocities[index] += (0 - px) * 0.01;
            velocities[index + 1] += (0 - py) * 0.01;
            velocities[index + 2] += (0 - pz) * 0.01;

            positions[index] += velocities[index];
            positions[index + 1] += velocities[index + 1];
            positions[index + 2] += velocities[index + 2];

            velocities[index] *= 0.9;
            velocities[index + 1] *= 0.9;
            velocities[index + 2] *= 0.9;
        }

        particles.geometry.attributes.position.needsUpdate = true;

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


