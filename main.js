import * as THREE from 'three';

// --- Scene Setup ---
const canvas = document.querySelector('.webgl');
const scene = new THREE.Scene();
// Optional: Add some fog for depth
scene.fog = new THREE.FogExp2(0x0d1117, 0.035);

// --- Camera ---
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 5;
scene.add(camera);

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true, // Transparent background to let CSS handle base color
  antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Objects / Particles ---
const particlesCount = 1500;
const positions = new Float32Array(particlesCount * 3);
const colors = new Float32Array(particlesCount * 3);

// Color palette - Subtle and Professional
const color1 = new THREE.Color(0xe6edf3); // White
const color2 = new THREE.Color(0x8b949e); // Grey
const color3 = new THREE.Color(0x2f81f7); // Deep Blue

for (let i = 0; i < particlesCount * 3; i+=3) {
  // Spread particles in a wide area
  positions[i] = (Math.random() - 0.5) * 30;     // x
  positions[i+1] = (Math.random() - 0.5) * 30;   // y
  positions[i+2] = (Math.random() - 0.5) * 20 - 5; // z: push them back slightly

  // Mix colors
  const mixedColor = color1.clone().lerp(
      Math.random() > 0.5 ? color2 : color3, 
      Math.random()
  );
  
  colors[i] = mixedColor.r;
  colors[i+1] = mixedColor.g;
  colors[i+2] = mixedColor.b;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Create a circular particle texture procedurally
const createCircleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.arc(16, 16, 14, 0, Math.PI * 2);
    context.fillStyle = 'white';
    context.fill();
    return new THREE.CanvasTexture(canvas);
};

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.1,
  vertexColors: true,
  transparent: true,
  opacity: 0.4, // Reduced opacity for subtlety
  map: createCircleTexture(),
  alphaTest: 0.01,
  depthWrite: false, // Prevents particles from sorting incorrectly
  blending: THREE.AdditiveBlending // Glow effect
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);



// --- Mouse Interaction ---
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX);
  mouseY = (event.clientY - windowHalfY);
});

// --- Scroll Interaction (GSAP) ---
gsap.registerPlugin(ScrollTrigger);

// Animate elements fading in
const glassPanels = document.querySelectorAll('.glass-panel');
glassPanels.forEach(panel => {
    gsap.fromTo(panel, 
        { y: 50, opacity: 0 },
        { 
            y: 0, 
            opacity: 1, 
            duration: 1, 
            ease: "power3.out",
            scrollTrigger: {
                trigger: panel,
                start: "top 85%", // Animation starts when top of panel hits 85% of viewport
            }
        }
    );
});

// Animate Project Cards
const projectCards = document.querySelectorAll('.project-card');
gsap.fromTo(projectCards,
    { y: 50, opacity: 0 },
    {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2, // Adds delay between each card
        ease: "power3.out",
        scrollTrigger: {
            trigger: '.project-grid',
            start: "top 80%"
        }
    }
);

// Animate Camera based on Scroll
let scrollPosition = 0;
window.addEventListener('scroll', () => {
    scrollPosition = window.scrollY;
});

// --- Animation Loop ---
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Smooth mouse movement interpolation
  targetX = mouseX * 0.001;
  targetY = mouseY * 0.001;

  // Very slowly rotate main particle system for elegance
  particles.rotation.y = elapsedTime * 0.01;
  particles.rotation.z = elapsedTime * 0.005;

  // Mouse paralax effect on particles
  particles.rotation.x += 0.05 * (targetY - particles.rotation.x);
  particles.rotation.y += 0.05 * (targetX - particles.rotation.y);
  
  // Move camera based on scroll (parallax)
  // Divide by large number to make the scroll movement subtle
  camera.position.y = -scrollPosition * 0.002;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- Navbar & Mobile Menu ---
const navbar = document.querySelector('.navbar');
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');
const navLinksItems = document.querySelectorAll('.nav-links li a');

// Toggle Mobile Menu
if (mobileMenu) {
  mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

// Close menu when link is clicked
navLinksItems.forEach(item => {
  item.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    navLinks.classList.remove('active');
  });
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});


// --- Dynamic PDF Generation ---
const downloadPdfBtn = document.getElementById('download-pdf-btn');
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Check if html2pdf is available
    if (typeof html2pdf === 'undefined') {
        console.error('html2pdf library not loaded. Falling back to native print.');
        window.print();
        return;
    }

    const element = document.querySelector('.content-wrapper');
    const originalBtnContent = downloadPdfBtn.innerHTML;
    
    // Provide visual feedback
    downloadPdfBtn.innerHTML = '<span style="font-size:0.75rem;">Generating...</span>';
    downloadPdfBtn.disabled = true;

    // Temporary styling adjustments for best PDF output
    // We remove backdrop filters and force solid backgrounds during capture
    const sections = document.querySelectorAll('.section');
    const glassPanels = document.querySelectorAll('.glass-panel');
    const webglCanvas = document.querySelector('.webgl');
    
    if(webglCanvas) webglCanvas.style.visibility = 'hidden';
    
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     'Yogeshwari_Patil_Resume.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#0d1117',
        logging: false
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Run the PDF generation
    html2pdf().set(opt).from(element).toPdf().get('pdf').save().then(() => {
        // Restore elements
        if(webglCanvas) webglCanvas.style.visibility = 'visible';
        downloadPdfBtn.innerHTML = originalBtnContent;
        downloadPdfBtn.disabled = false;
    }).catch(err => {
        console.error('PDF Generation failed:', err);
        // Fallback to native Printing if the library crashes
        if(webglCanvas) webglCanvas.style.visibility = 'visible';
        downloadPdfBtn.innerHTML = originalBtnContent;
        downloadPdfBtn.disabled = false;
        window.print();
    });
  });
}
