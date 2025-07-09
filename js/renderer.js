class Renderer3D {
    constructor(canvasId = 'canvas-container') {
        // إنشاء عنصر الكانفاس
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'molecular-canvas';
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // إضافة الكانفاس إلى الحاوي
        const container = document.getElementById(canvasId);
        if (container) {
            container.appendChild(this.canvas);
        } else {
            document.body.appendChild(this.canvas);
        }
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // إعدادات العرض
        this.backgroundColor = 0x0a0a0a;
        this.fogEnabled = true;
        this.shadowsEnabled = true;
        this.antialias = true;
        
        // كائنات العرض
        this.atomMeshes = new Map(); // خريطة من معرف الذرة إلى الكائن ثلاثي الأبعاد
        this.bondMeshes = new Map(); // خريطة من معرف الرابطة إلى الكائن ثلاثي الأبعاد
        this.selectionMeshes = new Map();
        
        // إعدادات الإضاءة
        this.lights = [];
        
        // إعدادات التفاعل
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedObjects = new Set();
        
        // إحصائيات الأداء
        this.frameCount = 0;
        this.lastTime = 0;
        this.fps = 0;
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupControls();
        this.setupEventListeners();
        
        // بدء حلقة العرض
        this.animate();
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.backgroundColor);
        
        // إضافة الضباب للعمق البصري
        if (this.fogEnabled) {
            this.scene.fog = new THREE.Fog(this.backgroundColor, 10, 50);
        }
        
        // إضافة شبكة مرجعية
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        gridHelper.position.y = -5;
        this.scene.add(gridHelper);
        
        // إضافة محاور الإحداثيات
        const axesHelper = new THREE.AxesHelper(2);
        axesHelper.position.set(-9, -4.5, -9);
        this.scene.add(axesHelper);
    }
    
    setupCamera() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.antialias,
            alpha: true
        });
        
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // تفعيل الظلال
        if (this.shadowsEnabled) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        // إعدادات إضافية للجودة
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }
    
    setupLights() {
        // الإضاءة المحيطة
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        
        // الإضاءة الاتجاهية الرئيسية
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = this.shadowsEnabled;
        
        if (this.shadowsEnabled) {
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 50;
            directionalLight.shadow.camera.left = -20;
            directionalLight.shadow.camera.right = 20;
            directionalLight.shadow.camera.top = 20;
            directionalLight.shadow.camera.bottom = -20;
        }
        
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
        
        // إضاءة نقطية للتأثيرات
        const pointLight = new THREE.PointLight(0x4080ff, 0.5, 30);
        pointLight.position.set(-5, 5, -5);
        this.scene.add(pointLight);
        this.lights.push(pointLight);
        
        // إضاءة نقطية أخرى
        const pointLight2 = new THREE.PointLight(0xff8040, 0.3, 25);
        pointLight2.position.set(5, -3, 8);
        this.scene.add(pointLight2);
        this.lights.push(pointLight2);
    }
    
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.maxDistance = 50;
        this.controls.minDistance = 1;
    }
    
    setupEventListeners() {
        // تغيير حجم النافذة
        window.addEventListener('resize', () => this.onWindowResize());
        
        // التفاعل بالماوس
        this.canvas.addEventListener('click', (event) => this.onMouseClick(event));
        this.canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
        
        // التفاعل باللمس للأجهزة المحمولة
        this.canvas.addEventListener('touchstart', (event) => this.onTouchStart(event));
        this.canvas.addEventListener('touchmove', (event) => this.onTouchMove(event));
    }
    
    // إضافة ذرة إلى المشهد
    addAtom(atom) {
        if (this.atomMeshes.has(atom.id)) {
            this.removeAtom(atom);
        }
        
        // إضافة الكائن الأساسي للذرة
        this.scene.add(atom.mesh);
        this.scene.add(atom.selectionSphere);
        this.atomMeshes.set(atom.id, atom.mesh);
        
        // إضافة تسمية للذرة
        this.addAtomLabel(atom);
    }
    
    // إزالة ذرة من المشهد
    removeAtom(atom) {
        if (this.atomMeshes.has(atom.id)) {
            const mesh = this.atomMeshes.get(atom.id);
            this.scene.remove(mesh);
            this.scene.remove(atom.selectionSphere);
            this.atomMeshes.delete(atom.id);
            
            // إزالة التسمية
            this.removeAtomLabel(atom);
        }
    }
    
    // إضافة تسمية للذرة
    addAtomLabel(atom) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.fillText(atom.type, canvas.width / 2, 25);
        context.fillText(`ID: ${atom.id.substr(0, 6)}`, canvas.width / 2, 45);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.copy(atom.position);
        sprite.position.y += atom.radius + 0.3;
        sprite.scale.set(1, 0.5, 1);
        sprite.visible = false; // مخفية افتراضياً
        
        atom.labelSprite = sprite;
        this.scene.add(sprite);
    }
    
    // إزالة تسمية الذرة
    removeAtomLabel(atom) {
        if (atom.labelSprite) {
            this.scene.remove(atom.labelSprite);
            atom.labelSprite.material.map.dispose();
            atom.labelSprite.material.dispose();
            atom.labelSprite = null;
        }
    }
    
    // إضافة رابطة إلى المشهد
    addBond(bond) {
        const atom1 = bond.atom1;
        const atom2 = bond.atom2;
        const distance = atom1.distanceTo(atom2);
        
        // إنشاء هندسة الأسطوانة للرابطة
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 8);
        
        // اختيار لون الرابطة حسب النوع
        let color = 0x888888;
        switch (bond.type) {
            case 'single': color = 0x888888; break;
            case 'double': color = 0xffaa00; break;
            case 'triple': color = 0xff4400; break;
            case 'aromatic': color = 0x00aaff; break;
            case 'hydrogen': color = 0x44ff44; break;
            case 'ionic': color = 0xff44ff; break;
        }
        
        const material = new THREE.MeshPhongMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        
        // وضع الرابطة بين الذرتين
        const midpoint = new THREE.Vector3()
            .addVectors(atom1.position, atom2.position)
            .multiplyScalar(0.5);
        
        mesh.position.copy(midpoint);
        
        // توجيه الرابطة
        const direction = new THREE.Vector3()
            .subVectors(atom2.position, atom1.position)
            .normalize();
        
        mesh.lookAt(atom2.position);
        mesh.rotateX(Math.PI / 2);
        
        mesh.userData = { bond: bond, type: 'bond' };
        
        this.scene.add(mesh);
        this.bondMeshes.set(bond.id, mesh);
    }
    
    // إزالة رابطة من المشهد
    removeBond(bond) {
        if (this.bondMeshes.has(bond.id)) {
            const mesh = this.bondMeshes.get(bond.id);
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.bondMeshes.delete(bond.id);
        }
    }
    
    // تحديث مواقع الروابط
    updateBonds(bonds) {
        bonds.forEach(bond => {
            if (this.bondMeshes.has(bond.id)) {
                const mesh = this.bondMeshes.get(bond.id);
                const atom1 = bond.atom1;
                const atom2 = bond.atom2;
                
                // تحديث الموقع
                const midpoint = new THREE.Vector3()
                    .addVectors(atom1.position, atom2.position)
                    .multiplyScalar(0.5);
                mesh.position.copy(midpoint);
                
                // تحديث التوجيه
                mesh.lookAt(atom2.position);
                mesh.rotateX(Math.PI / 2);
                
                // تحديث الطول
                const distance = atom1.distanceTo(atom2);
                mesh.scale.y = distance / 1; // الطول الأصلي للهندسة
            }
        });
    }
    
    // التركيز على كائن أو مجموعة كائنات
    focusOn(objects) {
        if (!objects || objects.length === 0) return;
        
        const box = new THREE.Box3();
        
        objects.forEach(obj => {
            if (obj.position) {
                box.expandByPoint(obj.position);
            }
        });
        
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        
        // تحريك الكاميرا
        const direction = this.camera.position.clone().sub(center).normalize();
        this.camera.position.copy(center).add(direction.multiplyScalar(distance));
        this.controls.target.copy(center);
        this.controls.update();
    }
    
    // إعادة تعيين الكاميرا
    resetCamera() {
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
    
    // التعامل مع النقر بالماوس
    onMouseClick(event) {
        this.updateMousePosition(event);
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const intersected = intersects[0].object;
            if (intersected.userData && intersected.userData.atom) {
                this.selectAtom(intersected.userData.atom);
            }
        }
    }
    
    // التعامل مع حركة الماوس
    onMouseMove(event) {
        this.updateMousePosition(event);
        
        // تحديث المؤشر عند التمرير فوق الكائنات
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const intersected = intersects[0].object;
            if (intersected.userData && (intersected.userData.atom || intersected.userData.bond)) {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = 'grab';
            }
        } else {
            this.canvas.style.cursor = 'grab';
        }
    }
    
    // تحديث موقع الماوس
    updateMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    // تحديد ذرة
    selectAtom(atom) {
        // إلغاء التحديد السابق
        this.selectedObjects.forEach(obj => {
            if (obj.setSelected) {
                obj.setSelected(false);
            }
        });
        this.selectedObjects.clear();
        
        // تحديد الذرة الجديدة
        atom.setSelected(true);
        this.selectedObjects.add(atom);
        
        // إرسال حدث التحديد
        const event = new CustomEvent('atomSelected', { detail: atom });
        document.dispatchEvent(event);
    }
    
    // التعامل مع تغيير حجم النافذة
    onWindowResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    // التعامل مع اللمس
    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.onMouseClick(touch);
        }
    }
    
    onTouchMove(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.onMouseMove(touch);
        }
    }
    
    // حلقة العرض الرئيسية
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // حساب FPS
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1 / deltaTime);
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${this.fps}`;
            }
        }
        
        // تحديث التحكم
        this.controls.update();
        
        // تحديث مواقع التسميات
        this.updateLabels();
        
        // عرض المشهد
        this.renderer.render(this.scene, this.camera);
    }
    
    // تحديث مواقع التسميات
    updateLabels() {
        this.atomMeshes.forEach((mesh, atomId) => {
            const atom = mesh.userData.atom;
            if (atom && atom.labelSprite) {
                atom.labelSprite.position.copy(atom.position);
                atom.labelSprite.position.y += atom.radius + 0.3;
            }
        });
    }
    
    // تبديل عرض التسميات
    toggleLabels(show) {
        this.atomMeshes.forEach((mesh, atomId) => {
            const atom = mesh.userData.atom;
            if (atom && atom.labelSprite) {
                atom.labelSprite.visible = show;
            }
        });
    }
    
    // تحديث إعدادات العرض
    updateSettings(settings) {
        if (settings.backgroundColor !== undefined) {
            this.backgroundColor = settings.backgroundColor;
            this.scene.background.setHex(this.backgroundColor);
            if (this.scene.fog) {
                this.scene.fog.color.setHex(this.backgroundColor);
            }
        }
        
        if (settings.fogEnabled !== undefined) {
            this.fogEnabled = settings.fogEnabled;
            if (this.fogEnabled) {
                this.scene.fog = new THREE.Fog(this.backgroundColor, 10, 50);
            } else {
                this.scene.fog = null;
            }
        }
        
        if (settings.shadowsEnabled !== undefined) {
            this.shadowsEnabled = settings.shadowsEnabled;
            this.renderer.shadowMap.enabled = this.shadowsEnabled;
            this.lights.forEach(light => {
                if (light.castShadow !== undefined) {
                    light.castShadow = this.shadowsEnabled;
                }
            });
        }
    }
    
    // تنظيف الموارد
    dispose() {
        // تنظيف الكائنات
        this.atomMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        
        this.bondMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        
        // تنظيف المحرك
        this.renderer.dispose();
        this.controls.dispose();
    }
}

// تصدير الفئة للاستخدام كوحدة
window.Renderer3D = Renderer3D;

