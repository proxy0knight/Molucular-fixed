class MolecularSystem {
    constructor() {
        // مجموعات البيانات الرئيسية
        this.atoms = new Set();
        this.molecules = new Set();
        this.bonds = new Set();
        
        // المحركات الفرعية
        this.physics = new PhysicsEngine();
        this.renderer = new Renderer3D('canvas3d');
        this.ui = null; // سيتم تهيئته بعد إنشاء النظام
        
        // حالة النظام
        this.isRunning = true;
        this.lastUpdateTime = 0;
        this.deltaTime = 0;
        
        // إعدادات المحاكاة
        this.timeScale = 1.0;
        this.maxAtoms = 1000;
        this.maxMolecules = 100;
        
        // إحصائيات الأداء
        this.updateCount = 0;
        this.averageUpdateTime = 0;
        
        this.init();
    }
    
    init() {
        // تهيئة واجهة المستخدم
        this.ui = new UIManager(this);
        
        // بدء حلقة التحديث
        this.startUpdateLoop();
        
        // إضافة بعض الذرات الافتراضية للعرض
        this.addDefaultAtoms();
        
        console.log('نظام المحاكاة الجزيئية جاهز!');
    }
    
    // بدء حلقة التحديث الرئيسية
    startUpdateLoop() {
        const update = (currentTime) => {
            this.deltaTime = (currentTime - this.lastUpdateTime) / 1000;
            this.lastUpdateTime = currentTime;
            
            if (this.isRunning && this.deltaTime < 0.1) { // تجنب القفزات الكبيرة في الوقت
                this.update(this.deltaTime * this.timeScale);
            }
            
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
    }
    
    // تحديث النظام
    update(deltaTime) {
        const startTime = performance.now();
        
        // تحديث الفيزياء
        this.physics.update(Array.from(this.atoms), deltaTime);
        
        // تحديث الجزيئات
        this.molecules.forEach(molecule => {
            molecule.updateProperties();
        });
        
        // تحديث الروابط في المحرك البصري
        this.renderer.updateBonds(Array.from(this.bonds));
        
        // فحص وإزالة الذرات التي خرجت من الحدود
        this.checkBounds();
        
        // تحديث الإحصائيات
        this.updateCount++;
        const updateTime = performance.now() - startTime;
        this.averageUpdateTime = (this.averageUpdateTime * 0.9) + (updateTime * 0.1);
    }
    
    // إضافة ذرة إلى النظام
    addAtom(atom) {
        if (this.atoms.size >= this.maxAtoms) {
            console.warn('تم الوصول إلى الحد الأقصى لعدد الذرات');
            return false;
        }
        
        this.atoms.add(atom);
        this.renderer.addAtom(atom);
        
        // إرسال حدث إضافة الذرة
        const event = new CustomEvent('atomAdded', { detail: atom });
        document.dispatchEvent(event);
        
        return true;
    }
    
    // إزالة ذرة من النظام
    removeAtom(atom) {
        if (!this.atoms.has(atom)) return false;
        
        // إزالة الذرة من أي جزيئات
        this.molecules.forEach(molecule => {
            if (molecule.atoms.has(atom)) {
                molecule.removeAtom(atom);
                
                // إذا أصبح الجزيء فارغاً، احذفه
                if (molecule.atoms.size === 0) {
                    this.removeMolecule(molecule);
                }
            }
        });
        
        // إزالة جميع الروابط المتعلقة بالذرة
        Array.from(this.bonds).forEach(bond => {
            if (bond.atom1 === atom || bond.atom2 === atom) {
                this.removeBond(bond);
            }
        });
        
        this.atoms.delete(atom);
        this.renderer.removeAtom(atom);
        atom.dispose();
        
        // إرسال حدث إزالة الذرة
        const event = new CustomEvent('atomRemoved', { detail: atom });
        document.dispatchEvent(event);
        
        return true;
    }
    
    // إضافة جزيء إلى النظام
    addMolecule(molecule) {
        if (this.molecules.size >= this.maxMolecules) {
            console.warn('تم الوصول إلى الحد الأقصى لعدد الجزيئات');
            return false;
        }
        
        // إضافة جميع ذرات الجزيء
        molecule.atoms.forEach(atom => {
            this.addAtom(atom);
        });
        
        // إضافة جميع روابط الجزيء
        molecule.bonds.forEach(bond => {
            this.addBond(bond);
        });
        
        this.molecules.add(molecule);
        
        // إرسال حدث إضافة الجزيء
        const event = new CustomEvent('moleculeAdded', { detail: molecule });
        document.dispatchEvent(event);
        
        return true;
    }
    
    // إزالة جزيء من النظام
    removeMolecule(molecule) {
        if (!this.molecules.has(molecule)) return false;
        
        // إزالة جميع ذرات الجزيء
        Array.from(molecule.atoms).forEach(atom => {
            this.removeAtom(atom);
        });
        
        this.molecules.delete(molecule);
        molecule.dispose();
        
        // إرسال حدث إزالة الجزيء
        const event = new CustomEvent('moleculeRemoved', { detail: molecule });
        document.dispatchEvent(event);
        
        return true;
    }
    
    // إضافة رابطة
    addBond(bond) {
        this.bonds.add(bond);
        this.renderer.addBond(bond);
        return true;
    }
    
    // إزالة رابطة
    removeBond(bond) {
        if (!this.bonds.has(bond)) return false;
        
        this.bonds.delete(bond);
        this.renderer.removeBond(bond);
        
        return true;
    }
    
    // مسح جميع الكائنات
    clear() {
        // إزالة جميع الجزيئات
        Array.from(this.molecules).forEach(molecule => {
            this.removeMolecule(molecule);
        });
        
        // إزالة جميع الذرات المتبقية
        Array.from(this.atoms).forEach(atom => {
            this.removeAtom(atom);
        });
        
        // إزالة جميع الروابط المتبقية
        Array.from(this.bonds).forEach(bond => {
            this.removeBond(bond);
        });
        
        console.log('تم مسح جميع الكائنات');
    }
    
    // تعيين حالة التشغيل
    setRunning(running) {
        this.isRunning = running;
        console.log(running ? 'تم تشغيل المحاكاة' : 'تم إيقاف المحاكاة');
    }
    
    // فحص الحدود
    checkBounds() {
        const bounds = this.physics.bounds;
        const atomsToRemove = [];
        
        this.atoms.forEach(atom => {
            const pos = atom.position;
            const margin = 2; // هامش إضافي
            
            if (pos.x < bounds.min.x - margin || pos.x > bounds.max.x + margin ||
                pos.y < bounds.min.y - margin || pos.y > bounds.max.y + margin ||
                pos.z < bounds.min.z - margin || pos.z > bounds.max.z + margin) {
                atomsToRemove.push(atom);
            }
        });
        
        // إزالة الذرات التي خرجت من الحدود
        atomsToRemove.forEach(atom => {
            console.log(`إزالة ذرة ${atom.id} - خرجت من الحدود`);
            this.removeAtom(atom);
        });
    }
    
    // إضافة ذرات افتراضية للعرض
    addDefaultAtoms() {
        // إضافة جزيء ماء
        const water = MoleculeTemplates.createWater();
        water.moveTo(new THREE.Vector3(2, 0, 0));
        this.addMolecule(water);
        
        // إضافة جزيء ميثان
        const methane = MoleculeTemplates.createMethane();
        methane.moveTo(new THREE.Vector3(-2, 0, 0));
        this.addMolecule(methane);
        
        // إضافة بعض الذرات المفردة
        const singleAtoms = [
            new Atom(0, 2, 0, { type: 'O', weight: 16, maxLinks: 2 }),
            new Atom(0, -2, 0, { type: 'N', weight: 14, maxLinks: 3 }),
            new Atom(2, 2, 0, { type: 'C', weight: 12, maxLinks: 4 }),
            new Atom(-2, -2, 0, { type: 'H', weight: 1, maxLinks: 1 })
        ];
        
        singleAtoms.forEach(atom => {
            this.addAtom(atom);
        });
    }
    
    // البحث عن ذرة بالمعرف
    findAtomById(id) {
        return Array.from(this.atoms).find(atom => atom.id === id);
    }
    
    // البحث عن جزيء بالمعرف
    findMoleculeById(id) {
        return Array.from(this.molecules).find(molecule => molecule.id === id);
    }
    
    // الحصول على الذرات في منطقة معينة
    getAtomsInRegion(center, radius) {
        return Array.from(this.atoms).filter(atom => {
            return atom.position.distanceTo(center) <= radius;
        });
    }
    
    // تطبيق قوة انفجار
    explode(center, force, radius) {
        this.physics.addExplosion(center, force, radius);
        
        // تأثير بصري للانفجار
        this.addExplosionEffect(center, radius);
    }
    
    // إضافة تأثير بصري للانفجار
    addExplosionEffect(center, radius) {
        const particleCount = 50;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 6, 6);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.1, 1, 0.5 + Math.random() * 0.5),
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(center);
            
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            
            const speed = 2 + Math.random() * 3;
            particle.userData = {
                velocity: direction.multiplyScalar(speed),
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02
            };
            
            particles.push(particle);
            this.renderer.scene.add(particle);
        }
        
        // تحريك جسيمات الانفجار
        const animateExplosion = () => {
            particles.forEach((particle, index) => {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.02));
                particle.userData.velocity.multiplyScalar(0.98); // تباطؤ
                particle.userData.life -= particle.userData.decay;
                particle.material.opacity = particle.userData.life;
                particle.scale.setScalar(particle.userData.life);
                
                if (particle.userData.life <= 0) {
                    this.renderer.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                    particles.splice(index, 1);
                }
            });
            
            if (particles.length > 0) {
                requestAnimationFrame(animateExplosion);
            }
        };
        
        animateExplosion();
    }
    
    // حفظ حالة النظام
    saveState() {
        const state = {
            atoms: Array.from(this.atoms).map(atom => atom.getInfo()),
            molecules: Array.from(this.molecules).map(molecule => molecule.getInfo()),
            physics: {
                gravity: this.physics.gravity.y,
                bondStrength: this.physics.bondStrength,
                damping: this.physics.damping
            },
            timestamp: Date.now()
        };
        
        return JSON.stringify(state, null, 2);
    }
    
    // تحميل حالة النظام
    loadState(stateJson) {
        try {
            const state = JSON.parse(stateJson);
            
            // مسح الحالة الحالية
            this.clear();
            
            // تحميل إعدادات الفيزياء
            if (state.physics) {
                this.physics.updateSettings(state.physics);
            }
            
            // تحميل الذرات
            if (state.atoms) {
                state.atoms.forEach(atomInfo => {
                    const atom = new Atom(
                        parseFloat(atomInfo.position.x),
                        parseFloat(atomInfo.position.y),
                        parseFloat(atomInfo.position.z),
                        {
                            type: atomInfo.type,
                            weight: atomInfo.weight,
                            charge: atomInfo.charge,
                            maxLinks: atomInfo.maxLinks
                        }
                    );
                    this.addAtom(atom);
                });
            }
            
            console.log('تم تحميل الحالة بنجاح');
            return true;
        } catch (error) {
            console.error('خطأ في تحميل الحالة:', error);
            return false;
        }
    }
    
    // الحصول على إحصائيات النظام
    getStats() {
        return {
            atoms: this.atoms.size,
            molecules: this.molecules.size,
            bonds: this.bonds.size,
            isRunning: this.isRunning,
            updateCount: this.updateCount,
            averageUpdateTime: this.averageUpdateTime.toFixed(2) + 'ms',
            memoryUsage: this.getMemoryUsage()
        };
    }
    
    // تقدير استخدام الذاكرة
    getMemoryUsage() {
        const atomMemory = this.atoms.size * 1000; // تقدير تقريبي بالبايت
        const moleculeMemory = this.molecules.size * 500;
        const bondMemory = this.bonds.size * 200;
        
        const totalBytes = atomMemory + moleculeMemory + bondMemory;
        const totalKB = (totalBytes / 1024).toFixed(1);
        
        return `${totalKB} KB`;
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من دعم WebGL
    if (!window.WebGLRenderingContext) {
        alert('متصفحك لا يدعم WebGL. يرجى استخدام متصفح حديث.');
        return;
    }
    
    // إنشاء النظام الرئيسي
    window.molecularSystem = new MolecularSystem();
    
    // إضافة أحداث إضافية للنافذة
    window.addEventListener('beforeunload', () => {
        // حفظ الحالة في التخزين المحلي
        const state = window.molecularSystem.saveState();
        localStorage.setItem('molecularSystemState', state);
    });
    
    // محاولة تحميل الحالة المحفوظة
    const savedState = localStorage.getItem('molecularSystemState');
    if (savedState) {
        const loadSaved = confirm('تم العثور على حالة محفوظة. هل تريد تحميلها؟');
        if (loadSaved) {
            window.molecularSystem.loadState(savedState);
        }
    }
    
    // إضافة أوامر وحدة التحكم للتطوير
    window.addRandomAtoms = (count = 10) => {
        for (let i = 0; i < count; i++) {
            window.molecularSystem.ui.addRandomAtom();
        }
    };
    
    window.explodeAt = (x = 0, y = 0, z = 0, force = 5, radius = 3) => {
        const center = new THREE.Vector3(x, y, z);
        window.molecularSystem.explode(center, force, radius);
    };
    
    window.getStats = () => {
        console.table(window.molecularSystem.getStats());
    };
    
    console.log('النظام جاهز! استخدم الأوامر التالية في وحدة التحكم:');
    console.log('- addRandomAtoms(count): إضافة ذرات عشوائية');
    console.log('- explodeAt(x, y, z, force, radius): إنشاء انفجار');
    console.log('- getStats(): عرض إحصائيات النظام');
});

