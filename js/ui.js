class UIManager {
    constructor(molecularSystem) {
        this.system = molecularSystem;
        this.selectedAtom = null;
        this.selectedMolecule = null;
        
        // عناصر واجهة المستخدم
        this.elements = {
            // الأزرار الرئيسية
            addAtom: document.getElementById('addAtom'),
            addMolecule: document.getElementById('addMolecule'),
            clearAll: document.getElementById('clearAll'),
            playPause: document.getElementById('playPause'),
            
            // قائمة الذرات
            atomList: document.getElementById('atom-list'),
            
            // خصائص الذرة
            atomWeight: document.getElementById('atom-weight'),
            atomLinks: document.getElementById('atom-links'),
            atomCharge: document.getElementById('atom-charge'),
            atomType: document.getElementById('atom-type'),
            updateAtom: document.getElementById('updateAtom'),
            
            // أدوات الكاميرا
            resetCamera: document.getElementById('resetCamera'),
            focusSelected: document.getElementById('focusSelected'),
            cameraSpeed: document.getElementById('cameraSpeed'),
            
            // إعدادات الفيزياء
            gravity: document.getElementById('gravity'),
            bondStrength: document.getElementById('bondStrength'),
            damping: document.getElementById('damping'),
            
            // شريط الحالة
            atomCount: document.getElementById('atom-count'),
            moleculeCount: document.getElementById('molecule-count'),
            fps: document.getElementById('fps'),
            
            // معلومات التحديد
            selectionInfo: document.getElementById('selection-info')
        };
        
        // حالة التطبيق
        this.isPlaying = true;
        this.showLabels = false;
        this.cameraSpeed = 1.0;
        
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.updateUI();
    }
    
    setupEventListeners() {
        // الأزرار الرئيسية
        this.elements.addAtom.addEventListener('click', () => this.addRandomAtom());
        this.elements.addMolecule.addEventListener('click', () => this.showMoleculeMenu());
        this.elements.clearAll.addEventListener('click', () => this.clearAll());
        this.elements.playPause.addEventListener('click', () => this.togglePlayPause());
        
        // تحديث خصائص الذرة
        this.elements.updateAtom.addEventListener('click', () => this.updateSelectedAtom());
        
        // أدوات الكاميرا
        this.elements.resetCamera.addEventListener('click', () => this.system.renderer.resetCamera());
        this.elements.focusSelected.addEventListener('click', () => this.focusOnSelected());
        this.elements.cameraSpeed.addEventListener('input', (e) => {
            this.cameraSpeed = parseFloat(e.target.value);
            this.system.renderer.controls.movementSpeed = this.cameraSpeed;
        });
        
        // إعدادات الفيزياء
        this.elements.gravity.addEventListener('input', (e) => {
            this.system.physics.updateSettings({ gravity: parseFloat(e.target.value) });
        });
        
        this.elements.bondStrength.addEventListener('input', (e) => {
            this.system.physics.updateSettings({ bondStrength: parseFloat(e.target.value) });
        });
        
        this.elements.damping.addEventListener('input', (e) => {
            this.system.physics.updateSettings({ damping: parseFloat(e.target.value) });
        });
        
        // أحداث النظام
        document.addEventListener('atomSelected', (e) => this.onAtomSelected(e.detail));
        document.addEventListener('atomAdded', () => this.updateUI());
        document.addEventListener('atomRemoved', () => this.updateUI());
        document.addEventListener('moleculeAdded', () => this.updateUI());
        document.addEventListener('moleculeRemoved', () => this.updateUI());
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case ' ': // مسافة - تشغيل/إيقاف
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'a': // إضافة ذرة
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.addRandomAtom();
                    }
                    break;
                case 'm': // إضافة جزيء
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.showMoleculeMenu();
                    }
                    break;
                case 'delete': // حذف المحدد
                    this.deleteSelected();
                    break;
                case 'r': // إعادة تعيين الكاميرا
                    this.system.renderer.resetCamera();
                    break;
                case 'f': // التركيز على المحدد
                    this.focusOnSelected();
                    break;
                case 'l': // تبديل التسميات
                    this.toggleLabels();
                    break;
                case 'c': // مسح الكل
                    if (e.ctrlKey && e.shiftKey) {
                        e.preventDefault();
                        this.clearAll();
                    }
                    break;
            }
        });
    }
    
    // إضافة ذرة عشوائية
    addRandomAtom() {
        const elements = ['H', 'C', 'N', 'O', 'P', 'S'];
        const weights = [1, 12, 14, 16, 31, 32];
        const maxLinks = [1, 4, 3, 2, 5, 6];
        
        const randomIndex = Math.floor(Math.random() * elements.length);
        const element = elements[randomIndex];
        
        const atom = new Atom(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            {
                type: element,
                weight: weights[randomIndex],
                maxLinks: maxLinks[randomIndex],
                charge: Math.floor(Math.random() * 3) - 1
            }
        );
        
        this.system.addAtom(atom);
        this.updateAtomList();
        
        // إضافة تأثير بصري
        this.addSpawnEffect(atom.position);
    }
    
    // عرض قائمة الجزيئات
    showMoleculeMenu() {
        const menu = this.createMoleculeMenu();
        document.body.appendChild(menu);
    }
    
    createMoleculeMenu() {
        const overlay = document.createElement('div');
        overlay.className = 'molecule-menu-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const menu = document.createElement('div');
        menu.className = 'molecule-menu';
        menu.style.cssText = `
            background: linear-gradient(135deg, #2c3e50, #34495e);
            padding: 30px;
            border-radius: 15px;
            border: 2px solid #3498db;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            max-width: 500px;
            width: 90%;
        `;
        
        const title = document.createElement('h3');
        title.textContent = 'اختر نوع الجزيء';
        title.style.cssText = `
            color: #ecf0f1;
            text-align: center;
            margin-bottom: 20px;
            font-size: 1.5em;
        `;
        
        const molecules = [
            { name: 'ماء (H₂O)', template: 'water' },
            { name: 'ميثان (CH₄)', template: 'methane' },
            { name: 'بنزين (C₆H₆)', template: 'benzene' },
            { name: 'جزيء مخصص', template: 'custom' }
        ];
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        `;
        
        molecules.forEach(mol => {
            const button = document.createElement('button');
            button.textContent = mol.name;
            button.style.cssText = `
                padding: 15px;
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            `;
            
            button.addEventListener('mouseover', () => {
                button.style.background = 'linear-gradient(135deg, #2980b9, #1f618d)';
                button.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseout', () => {
                button.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
                button.style.transform = 'translateY(0)';
            });
            
            button.addEventListener('click', () => {
                this.addMolecule(mol.template);
                document.body.removeChild(overlay);
            });
            
            buttonContainer.appendChild(button);
        });
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'إغلاق';
        closeButton.style.cssText = `
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        
        // إغلاق عند النقر على الخلفية
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
        
        menu.appendChild(title);
        menu.appendChild(buttonContainer);
        menu.appendChild(closeButton);
        overlay.appendChild(menu);
        
        return overlay;
    }
    
    // إضافة جزيء
    addMolecule(template) {
        let molecule;
        
        switch (template) {
            case 'water':
                molecule = MoleculeTemplates.createWater();
                break;
            case 'methane':
                molecule = MoleculeTemplates.createMethane();
                break;
            case 'benzene':
                molecule = MoleculeTemplates.createBenzene();
                break;
            default:
                return;
        }
        
        // وضع الجزيء في موقع عشوائي
        const randomPosition = new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
        );
        
        molecule.moveTo(randomPosition);
        this.system.addMolecule(molecule);
        this.updateUI();
        
        // إضافة تأثير بصري
        this.addSpawnEffect(randomPosition);
    }
    
    // مسح جميع الكائنات
    clearAll() {
        if (confirm('هل أنت متأكد من حذف جميع الذرات والجزيئات؟')) {
            this.system.clear();
            this.selectedAtom = null;
            this.selectedMolecule = null;
            this.updateUI();
        }
    }
    
    // تبديل تشغيل/إيقاف المحاكاة
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        this.system.setRunning(this.isPlaying);
        
        this.elements.playPause.textContent = this.isPlaying ? 'إيقاف' : 'تشغيل';
        this.elements.playPause.style.background = this.isPlaying 
            ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
            : 'linear-gradient(135deg, #27ae60, #229954)';
    }
    
    // تحديث الذرة المحددة
    updateSelectedAtom() {
        if (!this.selectedAtom) return;
        
        const properties = {
            weight: parseFloat(this.elements.atomWeight.value),
            maxLinks: parseInt(this.elements.atomLinks.value),
            charge: parseInt(this.elements.atomCharge.value),
            type: this.elements.atomType.value.trim()
        };
        
        this.selectedAtom.updateProperties(properties);
        this.updateAtomList();
        this.updateSelectionInfo();
    }
    
    // التركيز على المحدد
    focusOnSelected() {
        if (this.selectedAtom) {
            this.system.renderer.focusOn([this.selectedAtom]);
        } else if (this.selectedMolecule) {
            this.system.renderer.focusOn(Array.from(this.selectedMolecule.atoms));
        }
    }
    
    // حذف المحدد
    deleteSelected() {
        if (this.selectedAtom) {
            this.system.removeAtom(this.selectedAtom);
            this.selectedAtom = null;
        } else if (this.selectedMolecule) {
            this.system.removeMolecule(this.selectedMolecule);
            this.selectedMolecule = null;
        }
        this.updateUI();
    }
    
    // تبديل عرض التسميات
    toggleLabels() {
        this.showLabels = !this.showLabels;
        this.system.renderer.toggleLabels(this.showLabels);
    }
    
    // عند تحديد ذرة
    onAtomSelected(atom) {
        this.selectedAtom = atom;
        this.selectedMolecule = null;
        this.updateAtomProperties();
        this.updateSelectionInfo();
        this.highlightAtomInList(atom);
    }
    
    // تحديث خصائص الذرة في واجهة المستخدم
    updateAtomProperties() {
        if (!this.selectedAtom) return;
        
        this.elements.atomWeight.value = this.selectedAtom.weight;
        this.elements.atomLinks.value = this.selectedAtom.maxLinks;
        this.elements.atomCharge.value = this.selectedAtom.charge;
        this.elements.atomType.value = this.selectedAtom.type;
    }
    
    // تحديث معلومات التحديد
    updateSelectionInfo() {
        const info = this.elements.selectionInfo;
        
        if (this.selectedAtom) {
            const atomInfo = this.selectedAtom.getInfo();
            info.innerHTML = `
                <h4>معلومات الذرة المحددة</h4>
                <p><strong>النوع:</strong> ${atomInfo.type}</p>
                <p><strong>الوزن:</strong> ${atomInfo.weight}</p>
                <p><strong>الشحنة:</strong> ${atomInfo.charge}</p>
                <p><strong>الروابط:</strong> ${atomInfo.currentLinks}/${atomInfo.maxLinks}</p>
                <p><strong>السرعة:</strong> ${atomInfo.speed}</p>
                <p><strong>الطاقة:</strong> ${atomInfo.energy}</p>
                <p><strong>الموقع:</strong> (${atomInfo.position.x}, ${atomInfo.position.y}, ${atomInfo.position.z})</p>
            `;
            info.classList.add('visible');
        } else if (this.selectedMolecule) {
            const molInfo = this.selectedMolecule.getInfo();
            info.innerHTML = `
                <h4>معلومات الجزيء المحدد</h4>
                <p><strong>الاسم:</strong> ${molInfo.name}</p>
                <p><strong>الصيغة:</strong> ${molInfo.formula}</p>
                <p><strong>الوزن الجزيئي:</strong> ${molInfo.molecularWeight}</p>
                <p><strong>الشحنة:</strong> ${molInfo.charge}</p>
                <p><strong>عدد الذرات:</strong> ${molInfo.atomCount}</p>
                <p><strong>عدد الروابط:</strong> ${molInfo.bondCount}</p>
            `;
            info.classList.add('visible');
        } else {
            info.classList.remove('visible');
        }
    }
    
    // تحديث قائمة الذرات
    updateAtomList() {
        const list = this.elements.atomList;
        list.innerHTML = '';
        
        this.system.atoms.forEach(atom => {
            const item = document.createElement('div');
            item.className = 'atom-item';
            if (atom === this.selectedAtom) {
                item.classList.add('selected');
            }
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${atom.type} (${atom.id.substr(0, 6)})</span>
                    <span style="font-size: 12px; opacity: 0.7;">الوزن: ${atom.weight}</span>
                </div>
                <div style="font-size: 11px; opacity: 0.6; margin-top: 2px;">
                    الروابط: ${atom.currentLinks}/${atom.maxLinks} | الشحنة: ${atom.charge}
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.system.renderer.selectAtom(atom);
            });
            
            list.appendChild(item);
        });
    }
    
    // تمييز الذرة في القائمة
    highlightAtomInList(atom) {
        const items = this.elements.atomList.querySelectorAll('.atom-item');
        items.forEach(item => item.classList.remove('selected'));
        
        const atomIndex = Array.from(this.system.atoms).indexOf(atom);
        if (atomIndex >= 0 && items[atomIndex]) {
            items[atomIndex].classList.add('selected');
            items[atomIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    // تحديث واجهة المستخدم
    updateUI() {
        // تحديث العدادات
        this.elements.atomCount.textContent = `عدد الذرات: ${this.system.atoms.size}`;
        this.elements.moleculeCount.textContent = `عدد الجزيئات: ${this.system.molecules.size}`;
        
        // تحديث قائمة الذرات
        this.updateAtomList();
        
        // تحديث معلومات التحديد
        this.updateSelectionInfo();
    }
    
    // إضافة تأثير بصري عند الإنشاء
    addSpawnEffect(position) {
        // إنشاء تأثير انفجار صغير
        const particles = [];
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.02, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            
            particle.userData = { velocity, life: 1.0 };
            particles.push(particle);
            this.system.renderer.scene.add(particle);
        }
        
        // تحريك الجسيمات
        const animateParticles = () => {
            particles.forEach((particle, index) => {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.02));
                particle.userData.life -= 0.02;
                particle.material.opacity = particle.userData.life;
                
                if (particle.userData.life <= 0) {
                    this.system.renderer.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                    particles.splice(index, 1);
                }
            });
            
            if (particles.length > 0) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
}

