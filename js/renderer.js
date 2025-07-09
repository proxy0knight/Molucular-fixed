class Renderer3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("app-container").appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.camera.position.z = 50;

        // إضافة إضاءة
        const ambientLight = new THREE.AmbientLight(0x404040); // إضاءة محيطة
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // إضاءة اتجاهية
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);

        // إضافة شبكة للمساعدة في التصور
        const gridHelper = new THREE.GridHelper(100, 100);
        this.scene.add(gridHelper);

        window.addEventListener("resize", this.onWindowResize.bind(this), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    add(object) {
        this.scene.add(object);
    }

    remove(object) {
        this.scene.remove(object);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // تصدير الفئة للاستخدام كوحدة
}
window.Renderer3D = Renderer3D;

