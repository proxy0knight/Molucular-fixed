class AdvancedMolecularSystem {
    constructor() {
        // المكونات الأساسية
        this.atoms = [];
        this.molecules = [];
        this.renderer = null;
        this.physicsEngine = null;
        this.uiManager = null;
        
        // إعدادات النظام
        this.settings = {
            maxAtoms: 1000,
            maxMolecules: 100,
            autoSave: false,
            autoSaveInterval: 60000, // دقيقة واحدة
            debugMode: false,
            performanceMode: false
        };
        
        // حالة النظام
        this.isInitialized = false;
        this.isRunning = false;
        this.lastUpdateTime = 0;
        this.frameCount = 0;
        
        // مولدات الأرقام التعريفية
        this.atomIdCounter = 0;
        this.moleculeIdCounter = 0;
        
        // تهيئة النظام
        this.initialize();
    }
    
    // تهيئة النظام
    async initialize() {
        try {
            console.log('بدء تهيئة النظام المتقدم...');
            
            // تهيئة محرك العرض
            this.renderer = new Renderer3D();
            
            // تهيئة محرك الفيزياء
            this.physicsEngine = new AdvancedPhysicsEngine({
                gravity: 0.0,
                damping: 0.99,
                timeStep: 0.016,
                dynamicSpace: true,
                baseSpaceSize: 10,
                atomSizeMultiplier: 99
            });
            
            // إعداد مستمعي أحداث الفيزياء
            this.setupPhysicsEventListeners();
            
            // تهيئة واجهة المستخدم
            this.uiManager = new AdvancedUIManager(this);
            window.uiManager = this.uiManager; // للوصول العام
            
            // إضافة بعض الذرات الأولية
            this.addInitialAtoms();
            
            // بدء حلقة التحديث
            this.startUpdateLoop();
            
            // تفعيل الحفظ التلقائي إذا كان مطلوباً
            if (this.settings.autoSave) {
                this.startAutoSave();
            }
            
            this.isInitialized = true;
            this.isRunning = true;
            
            console.log('تم تهيئة النظام المتقدم بنجاح');
            
        } catch (error) {
            console.error('خطأ في تهيئة النظام:', error);
            throw error;
        }
    }
    
    // إعداد مستمعي أحداث الفيزياء
    setupPhysicsEventListeners() {
        // حدث تكوين رابطة
        this.physicsEngine.addEventListener('onBondFormation', (data) => {
            console.log(`تم تكوين رابطة ${data.bondType} بين ${data.atom1.type} و ${data.atom2.type}`);
            this.handleBondFormation(data);
        });
        
        // حدث تكوين جزيء
        this.physicsEngine.addEventListener('onMoleculeFormation', (data) => {
            console.log(`تم تكوين جزيء جديد: ${data.resultMolecule.name}`);
            this.handleMoleculeFormation(data);
        });
        
        // حدث التصادم
        this.physicsEngine.addEventListener('onCollision', (data) => {
            if (this.settings.debugMode) {
                console.log(`تصادم بين ${data.atom1.type} و ${data.atom2.type} بقوة ${data.impulse.toFixed(2)}`);
            }
        });
    }
    
    // معالجة تكوين الرابطة
    handleBondFormation(data) {
        // تحديث قوائم الجزيئات إذا لزم الأمر
        this.updateMoleculeLists();
        
        // تحديث العرض
        this.renderer.updateBondVisuals();
    }
    
    // معالجة تكوين الجزيء
    handleMoleculeFormation(data) {
        // إزالة الجزيئات المدمجة من القائمة
        const mergedIndex = this.molecules.indexOf(data.mergedMolecule);
        if (mergedIndex > -1) {
            this.molecules.splice(mergedIndex, 1);
        }
        
        // تحديث قوائم واجهة المستخدم
        this.uiManager.updateMoleculeList();
    }
    
    // إضافة الذرات الأولية
    addInitialAtoms() {
        // إضافة بعض الذرات المختلفة للعرض
        const initialAtoms = [
            { type: 'H', position: [0, 0, 0] },
            { type: 'C', position: [1, 0, 0] },
            { type: 'O', position: [2, 0, 0] },
            { type: 'N', position: [0, 1, 0] },
            { type: 'H', position: [1, 1, 0] },
            { type: 'H', position: [2, 1, 0] }
        ];
        
        initialAtoms.forEach(atomData => {
            this.addAtom(atomData.type, ...atomData.position);
        });
        
        // إضافة جزيء ماء كمثال
        this.addWaterMolecule(3, 0, 0);
    }
    
    // إضافة ذرة جديدة
    addAtom(type = 'H', x = 0, y = 0, z = 0, options = {}) {
        if (this.atoms.length >= this.settings.maxAtoms) {
            console.warn('تم الوصول للحد الأقصى من الذرات');
            return null;
        }
        
        const atom = new Atom(x, y, z, {
            type: type,
            ...options
        });
        
        this.atoms.push(atom);
        this.renderer.addAtom(atom);
        
        console.log(`تم إضافة ذرة ${type} في الموقع (${x}, ${y}, ${z})`);
        return atom;
    }
    
    // إضافة ذرة عشوائية
    addRandomAtom() {
        const types = ['H', 'C', 'N', 'O', 'P', 'S'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        // موقع عشوائي ضمن الفضاء
        const spaceSize = this.physicsEngine.dynamicSpace.currentSize;
        const x = (Math.random() - 0.5) * spaceSize * 0.8;
        const y = (Math.random() - 0.5) * spaceSize * 0.8;
        const z = (Math.random() - 0.5) * spaceSize * 0.8;
        
        return this.addAtom(randomType, x, y, z);
    }
    
    // إضافة جزيء ماء
    addWaterMolecule(x = 0, y = 0, z = 0) {
        const oxygen = this.addAtom('O', x, y, z);
        const hydrogen1 = this.addAtom('H', x + 0.1, y + 0.08, z);
        const hydrogen2 = this.addAtom('H', x - 0.1, y + 0.08, z);
        
        if (oxygen && hydrogen1 && hydrogen2) {
            const waterMolecule = new AdvancedMolecule([oxygen, hydrogen1, hydrogen2], {
                name: 'ماء'
            });
            
            waterMolecule.addBond(oxygen, hydrogen1, 'single');
            waterMolecule.addBond(oxygen, hydrogen2, 'single');
            
            this.molecules.push(waterMolecule);
            this.renderer.addMolecule(waterMolecule);
            
            return waterMolecule;
        }
        
        return null;
    }
    
    // إضافة جزيء ميثان
    addMethaneMolecule(x = 0, y = 0, z = 0) {
        const carbon = this.addAtom('C', x, y, z);
        const hydrogens = [
            this.addAtom('H', x + 0.1, y + 0.1, z + 0.1),
            this.addAtom('H', x - 0.1, y + 0.1, z - 0.1),
            this.addAtom('H', x + 0.1, y - 0.1, z - 0.1),
            this.addAtom('H', x - 0.1, y - 0.1, z + 0.1)
        ];
        
        if (carbon && hydrogens.every(h => h)) {
            const methaneMolecule = new AdvancedMolecule([carbon, ...hydrogens], {
                name: 'ميثان'
            });
            
            hydrogens.forEach(hydrogen => {
                methaneMolecule.addBond(carbon, hydrogen, 'single');
            });
            
            this.molecules.push(methaneMolecule);
            this.renderer.addMolecule(methaneMolecule);
            
            return methaneMolecule;
        }
        
        return null;
    }
    
    // إضافة جزيء بنزين
    addBenzeneMolecule(x = 0, y = 0, z = 0) {
        const carbons = [];
        const hydrogens = [];
        const radius = 0.15;
        
        // إنشاء حلقة الكربون السداسية
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const cx = x + Math.cos(angle) * radius;
            const cy = y + Math.sin(angle) * radius;
            const cz = z;
            
            const carbon = this.addAtom('C', cx, cy, cz);
            carbons.push(carbon);
            
            // إضافة هيدروجين لكل كربون
            const hx = x + Math.cos(angle) * radius * 1.5;
            const hy = y + Math.sin(angle) * radius * 1.5;
            const hydrogen = this.addAtom('H', hx, hy, cz);
            hydrogens.push(hydrogen);
        }
        
        if (carbons.every(c => c) && hydrogens.every(h => h)) {
            const benzeneMolecule = new AdvancedMolecule([...carbons, ...hydrogens], {
                name: 'بنزين'
            });
            
            // روابط الكربون في الحلقة
            for (let i = 0; i < 6; i++) {
                const nextIndex = (i + 1) % 6;
                benzeneMolecule.addBond(carbons[i], carbons[nextIndex], 'aromatic');
            }
            
            // روابط الكربون-هيدروجين
            for (let i = 0; i < 6; i++) {
                benzeneMolecule.addBond(carbons[i], hydrogens[i], 'single');
            }
            
            this.molecules.push(benzeneMolecule);
            this.renderer.addMolecule(benzeneMolecule);
            
            return benzeneMolecule;
        }
        
        return null;
    }
    
    // حذف ذرة
    removeAtom(atom) {
        const index = this.atoms.indexOf(atom);
        if (index > -1) {
            // إزالة الذرة من أي جزيء تنتمي إليه
            if (atom.parentMolecule) {
                atom.parentMolecule.removeAtom(atom);
                
                // فحص إذا كان الجزيء فارغاً
                if (atom.parentMolecule.atoms.size === 0) {
                    this.removeMolecule(atom.parentMolecule);
                }
            }
            
            // إزالة الذرة من القائمة
            this.atoms.splice(index, 1);
            
            // إزالة من العرض
            this.renderer.removeAtom(atom);
            
            console.log(`تم حذف ذرة ${atom.type}`);
        }
    }
    
    // حذف جزيء
    removeMolecule(molecule) {
        const index = this.molecules.indexOf(molecule);
        if (index > -1) {
            // تفكيك الجزيء
            molecule.atoms.forEach(atom => {
                atom.parentMolecule = null;
                atom.bonds.clear();
                atom.currentLinks = 0;
            });
            
            // إزالة من القائمة
            this.molecules.splice(index, 1);
            
            // إزالة من العرض
            this.renderer.removeMolecule(molecule);
            
            console.log(`تم حذف جزيء ${molecule.name}`);
        }
    }
    
    // مسح جميع العناصر
    clearAll() {
        // مسح الذرات
        this.atoms.forEach(atom => {
            this.renderer.removeAtom(atom);
        });
        this.atoms = [];
        
        // مسح الجزيئات
        this.molecules.forEach(molecule => {
            this.renderer.removeMolecule(molecule);
        });
        this.molecules = [];
        
        // إعادة تعيين العدادات
        this.atomIdCounter = 0;
        this.moleculeIdCounter = 0;
        
        console.log('تم مسح جميع العناصر');
    }
    
    // تحديث قوائم الجزيئات
    updateMoleculeLists() {
        // فحص الذرات غير المرتبطة بجزيئات وإنشاء جزيئات جديدة إذا لزم الأمر
        const unassignedAtoms = this.atoms.filter(atom => !atom.parentMolecule && atom.bonds.size > 0);
        
        unassignedAtoms.forEach(atom => {
            if (!atom.parentMolecule) {
                // إنشاء جزيء جديد للذرات المترابطة
                const connectedAtoms = this.getConnectedAtoms(atom);
                if (connectedAtoms.length > 1) {
                    const newMolecule = new AdvancedMolecule(connectedAtoms);
                    this.molecules.push(newMolecule);
                    this.renderer.addMolecule(newMolecule);
                }
            }
        });
    }
    
    // الحصول على الذرات المترابطة
    getConnectedAtoms(startAtom) {
        const visited = new Set();
        const connected = [];
        const stack = [startAtom];
        
        while (stack.length > 0) {
            const atom = stack.pop();
            if (visited.has(atom)) continue;
            
            visited.add(atom);
            connected.push(atom);
            
            atom.bonds.forEach(bondedAtom => {
                if (!visited.has(bondedAtom)) {
                    stack.push(bondedAtom);
                }
            });
        }
        
        return connected;
    }
    
    // عرض حوار الجزيئات
    showMoleculeDialog() {
        const moleculeTypes = [
            { name: 'ماء (H₂O)', action: () => this.addWaterMolecule() },
            { name: 'ميثان (CH₄)', action: () => this.addMethaneMolecule() },
            { name: 'بنزين (C₆H₆)', action: () => this.addBenzeneMolecule() }
        ];
        
        // إنشاء حوار بسيط
        const dialog = document.createElement('div');
        dialog.className = 'molecule-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>اختر نوع الجزيء</h3>
                <div class="molecule-options">
                    ${moleculeTypes.map((mol, index) => 
                        `<button class="molecule-option" data-index="${index}">${mol.name}</button>`
                    ).join('')}
                </div>
                <button class="close-dialog">إلغاء</button>
            </div>
        `;
        
        // إضافة أحداث
        dialog.addEventListener('click', (e) => {
            if (e.target.classList.contains('molecule-option')) {
                const index = parseInt(e.target.dataset.index);
                moleculeTypes[index].action();
                document.body.removeChild(dialog);
            } else if (e.target.classList.contains('close-dialog')) {
                document.body.removeChild(dialog);
            }
        });
        
        document.body.appendChild(dialog);
    }
    
    // بدء حلقة التحديث
    startUpdateLoop() {
        const update = (currentTime) => {
            if (!this.isRunning) return;
            
            const deltaTime = currentTime - this.lastUpdateTime;
            this.lastUpdateTime = currentTime;
            this.frameCount++;
            
            // تحديث الفيزياء
            this.physicsEngine.update(this.atoms, this.molecules);
            
            // تحديث العرض
            this.renderer.update(this.atoms, this.molecules);
            
            // تحديث واجهة المستخدم (كل 10 إطارات)
            if (this.frameCount % 10 === 0) {
                this.uiManager.updateUI();
            }
            
            // طلب الإطار التالي
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
    }
    
    // بدء الحفظ التلقائي
    startAutoSave() {
        setInterval(() => {
            if (this.settings.autoSave) {
                this.autoSave();
            }
        }, this.settings.autoSaveInterval);
    }
    
    // الحفظ التلقائي
    autoSave() {
        try {
            const state = this.exportState();
            localStorage.setItem('molecular_system_autosave', JSON.stringify(state));
            console.log('تم الحفظ التلقائي');
        } catch (error) {
            console.error('خطأ في الحفظ التلقائي:', error);
        }
    }
    
    // تصدير حالة النظام
    exportState() {
        return {
            version: '2.0',
            timestamp: Date.now(),
            atoms: this.atoms.map(atom => atom.exportData()),
            molecules: this.molecules.map(molecule => molecule.exportInfo()),
            physicsSettings: this.physicsEngine.exportSettings(),
            displaySettings: this.uiManager.displaySettings,
            systemSettings: this.settings
        };
    }
    
    // استيراد حالة النظام
    importState(state) {
        try {
            // مسح الحالة الحالية
            this.clearAll();
            
            // استيراد الذرات
            state.atoms.forEach(atomData => {
                const atom = new Atom(
                    atomData.position.x,
                    atomData.position.y,
                    atomData.position.z,
                    atomData
                );
                this.atoms.push(atom);
                this.renderer.addAtom(atom);
            });
            
            // استيراد الجزيئات
            state.molecules.forEach(moleculeData => {
                const moleculeAtoms = moleculeData.atomIds.map(id => 
                    this.atoms.find(atom => atom.id === id)
                ).filter(atom => atom);
                
                if (moleculeAtoms.length > 0) {
                    const molecule = new AdvancedMolecule(moleculeAtoms, {
                        name: moleculeData.name
                    });
                    this.molecules.push(molecule);
                    this.renderer.addMolecule(molecule);
                }
            });
            
            // استيراد إعدادات الفيزياء
            if (state.physicsSettings) {
                this.physicsEngine.importSettings(state.physicsSettings);
            }
            
            // استيراد إعدادات العرض
            if (state.displaySettings) {
                Object.assign(this.uiManager.displaySettings, state.displaySettings);
            }
            
            // استيراد إعدادات النظام
            if (state.systemSettings) {
                Object.assign(this.settings, state.systemSettings);
            }
            
            console.log('تم استيراد الحالة بنجاح');
            
        } catch (error) {
            console.error('خطأ في استيراد الحالة:', error);
            throw error;
        }
    }
    
    // إيقاف النظام
    stop() {
        this.isRunning = false;
        console.log('تم إيقاف النظام');
    }
    
    // إعادة تشغيل النظام
    restart() {
        this.isRunning = true;
        this.startUpdateLoop();
        console.log('تم إعادة تشغيل النظام');
    }
    
    // الحصول على إحصائيات النظام
    getSystemStats() {
        return {
            atoms: this.atoms.length,
            molecules: this.molecules.length,
            bonds: this.molecules.reduce((total, mol) => total + mol.bonds.size, 0),
            frameCount: this.frameCount,
            isRunning: this.isRunning,
            physicsStats: this.physicsEngine.stats
        };
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('بدء تحميل النظام المتقدم...');
        
        // إنشاء النظام
        window.molecularSystem = new AdvancedMolecularSystem();
        
        // انتظار التهيئة
        await window.molecularSystem.initialize();
        
        console.log('تم تحميل النظام المتقدم بنجاح!');
        
        // عرض رسالة ترحيب
        setTimeout(() => {
            console.log(`
🧬 مرحباً بك في محاكي الهياكل الجزيئية المتقدم!

الميزات الجديدة:
✅ فيزياء واقعية مع قوى لينارد-جونز ومورس وكولوم
✅ فضاء ديناميكي يتكيف مع عدد الذرات
✅ واجهة مستخدم شاملة مع تحكم كامل
✅ تحليل متقدم للخصائص الجزيئية
✅ محاكاة حرارية وضغط
✅ حفظ وتحميل الحالات

استخدم الأزرار في الجانب الأيمن للتحكم في النظام!
            `);
        }, 1000);
        
    } catch (error) {
        console.error('فشل في تحميل النظام:', error);
        alert('حدث خطأ في تحميل النظام. يرجى إعادة تحميل الصفحة.');
    }
});

