class AdvancedMolecule {
    constructor(atoms = [], options = {}) {
        this.id = AdvancedMolecule.generateId();
        this.atoms = new Set(atoms);
        this.bonds = new Map(); // خريطة الروابط بين الذرات
        this.name = options.name || this.generateName();
        this.formula = this.calculateFormula();
        this.molecularWeight = this.calculateMolecularWeight();
        
        // الخصائص الفيزيائية للجزيء
        this.centerOfMass = this.calculateCenterOfMass();
        this.momentOfInertia = this.calculateMomentOfInertia();
        this.dipoleMoment = this.calculateDipoleMoment();
        this.totalCharge = this.calculateTotalCharge();
        
        // خصائص الحركة
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        this.rotationMatrix = new THREE.Matrix3();
        
        // خصائص ديناميكية
        this.rigidBody = options.rigidBody || false; // هل الجزيء جسم صلب
        this.flexible = options.flexible !== false; // هل يمكن للجزيء أن يتشوه
        this.stability = this.calculateStability();
        
        // خصائص بصرية
        this.visible = true;
        this.selected = false;
        this.highlighted = false;
        this.color = options.color || this.calculateMoleculeColor();
        
        // كائنات العرض ثلاثي الأبعاد
        this.bondMeshes = new Map(); // شبكات الروابط
        this.selectionBox = null;
        
        // ربط الذرات بالجزيء
        this.atoms.forEach(atom => {
            atom.parentMolecule = this;
        });
        
        // إنشاء الروابط الأولية
        this.detectBonds();
        this.createBondMeshes();
        
        // خصائص الطاقة
        this.internalEnergy = 0;
        this.vibrationalEnergy = 0;
        this.rotationalEnergy = 0;
        
        // خصائص كيميائية
        this.reactivity = this.calculateReactivity();
        this.electronegativity = this.calculateAverageElectronegativity();
        this.polarizability = this.calculatePolarizability();
        
        // تاريخ التغييرات
        this.formationTime = Date.now();
        this.lastModified = this.formationTime;
        this.structureHistory = [];
        
        // خصائص متقدمة
        this.hybridization = this.analyzeHybridization();
        this.aromaticity = this.checkAromaticity();
        this.chirality = this.checkChirality();
    }
    
    static generateId() {
        return 'advmol_' + Math.random().toString(36).substr(2, 9);
    }
    
    // إضافة ذرة إلى الجزيء
    addAtom(atom) {
        if (this.atoms.has(atom)) return false;
        
        this.atoms.add(atom);
        atom.parentMolecule = this;
        this.updateProperties();
        this.lastModified = Date.now();
        return true;
    }
    
    // إزالة ذرة من الجزيء
    removeAtom(atom) {
        if (!this.atoms.has(atom)) return false;
        
        this.atoms.delete(atom);
        atom.parentMolecule = null;
        
        // إزالة جميع الروابط المتعلقة بهذه الذرة
        this.bonds.forEach((bondInfo, bondKey) => {
            if (bondKey.includes(atom.id)) {
                this.bonds.delete(bondKey);
            }
        });
        
        this.updateProperties();
        this.lastModified = Date.now();
        return true;
    }
    
    // إضافة رابطة بين ذرتين
    addBond(atom1, atom2, bondType = 'single') {
        if (!this.atoms.has(atom1) || !this.atoms.has(atom2)) return false;
        if (atom1 === atom2) return false;
        
        const bondKey = this.getBondKey(atom1, atom2);
        if (this.bonds.has(bondKey)) return false;
        
        // فحص إمكانية تكوين الرابطة
        if (!atom1.canBondWith(atom2)) return false;
        
        const bondInfo = {
            atom1: atom1,
            atom2: atom2,
            type: bondType,
            strength: this.calculateBondStrength(atom1, atom2, bondType),
            length: atom1.distanceTo(atom2),
            energy: this.calculateBondEnergy(atom1, atom2, bondType),
            order: this.getBondOrder(bondType),
            created: Date.now()
        };
        
        this.bonds.set(bondKey, bondInfo);
        atom1.bonds.add(atom2);
        atom2.bonds.add(atom1);
        atom1.currentLinks++;
        atom2.currentLinks++;
        
        this.createBondMesh(bondInfo);
        this.updateProperties();
        this.lastModified = Date.now();
        
        return true;
    }
    
    // إزالة رابطة بين ذرتين
    removeBond(atom1, atom2) {
        const bondKey = this.getBondKey(atom1, atom2);
        if (!this.bonds.has(bondKey)) return false;
        
        this.bonds.delete(bondKey);
        atom1.bonds.delete(atom2);
        atom2.bonds.delete(atom1);
        atom1.currentLinks--;
        atom2.currentLinks--;
        
        this.removeBondMesh(bondKey);
        this.updateProperties();
        this.lastModified = Date.now();
        
        return true;
    }
    
    // توليد مفتاح الرابطة
    getBondKey(atom1, atom2) {
        const id1 = atom1.id;
        const id2 = atom2.id;
        return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
    }
    
    // حساب ترتيب الرابطة
    getBondOrder(bondType) {
        const orders = {
            'single': 1,
            'double': 2,
            'triple': 3,
            'aromatic': 1.5,
            'ionic': 1,
            'hydrogen': 0.5,
            'van_der_waals': 0.1
        };
        return orders[bondType] || 1;
    }
    
    // حساب قوة الرابطة
    calculateBondStrength(atom1, atom2, bondType) {
        const baseStrength = {
            'single': 1.0,
            'double': 2.0,
            'triple': 3.0,
            'aromatic': 1.5,
            'ionic': 0.8,
            'hydrogen': 0.3,
            'van_der_waals': 0.1
        };
        
        const electronegativityFactor = 1 + Math.abs(atom1.electronegativity - atom2.electronegativity) * 0.1;
        return (baseStrength[bondType] || 1.0) * electronegativityFactor;
    }
    
    // حساب طاقة الرابطة
    calculateBondEnergy(atom1, atom2, bondType) {
        const baseEnergies = {
            'single': 350,    // كيلو جول/مول
            'double': 600,
            'triple': 835,
            'aromatic': 450,
            'ionic': 400,
            'hydrogen': 20,
            'van_der_waals': 5
        };
        
        return baseEnergies[bondType] || 350;
    }
    
    // اكتشاف الروابط تلقائياً
    detectBonds() {
        const atomsArray = Array.from(this.atoms);
        
        for (let i = 0; i < atomsArray.length; i++) {
            for (let j = i + 1; j < atomsArray.length; j++) {
                const atom1 = atomsArray[i];
                const atom2 = atomsArray[j];
                const distance = atom1.distanceTo(atom2);
                
                // فحص إمكانية تكوين رابطة بناءً على المسافة
                const maxBondDistance = (atom1.covalentRadius + atom2.covalentRadius) * 1.3;
                
                if (distance <= maxBondDistance && atom1.canBondWith(atom2)) {
                    const bondType = atom1.determineBondType(atom2);
                    this.addBond(atom1, atom2, bondType);
                }
            }
        }
    }
    
    // حساب الصيغة الكيميائية
    calculateFormula() {
        const elementCounts = {};
        
        this.atoms.forEach(atom => {
            elementCounts[atom.type] = (elementCounts[atom.type] || 0) + 1;
        });
        
        // ترتيب العناصر (الكربون أولاً، ثم الهيدروجين، ثم الباقي أبجدياً)
        const sortedElements = Object.keys(elementCounts).sort((a, b) => {
            if (a === 'C') return -1;
            if (b === 'C') return 1;
            if (a === 'H') return -1;
            if (b === 'H') return 1;
            return a.localeCompare(b);
        });
        
        let formula = '';
        sortedElements.forEach(element => {
            const count = elementCounts[element];
            formula += element + (count > 1 ? count : '');
        });
        
        return formula || 'Unknown';
    }
    
    // حساب الوزن الجزيئي
    calculateMolecularWeight() {
        let totalWeight = 0;
        this.atoms.forEach(atom => {
            totalWeight += atom.weight;
        });
        return totalWeight;
    }
    
    // حساب مركز الكتلة
    calculateCenterOfMass() {
        if (this.atoms.size === 0) return new THREE.Vector3(0, 0, 0);
        
        let totalMass = 0;
        const weightedPosition = new THREE.Vector3(0, 0, 0);
        
        this.atoms.forEach(atom => {
            const mass = atom.weight;
            totalMass += mass;
            weightedPosition.add(atom.position.clone().multiplyScalar(mass));
        });
        
        return weightedPosition.divideScalar(totalMass);
    }
    
    // حساب عزم القصور الذاتي
    calculateMomentOfInertia() {
        const centerOfMass = this.calculateCenterOfMass();
        let Ixx = 0, Iyy = 0, Izz = 0, Ixy = 0, Ixz = 0, Iyz = 0;
        
        this.atoms.forEach(atom => {
            const mass = atom.weight;
            const dx = atom.position.x - centerOfMass.x;
            const dy = atom.position.y - centerOfMass.y;
            const dz = atom.position.z - centerOfMass.z;
            
            Ixx += mass * (dy * dy + dz * dz);
            Iyy += mass * (dx * dx + dz * dz);
            Izz += mass * (dx * dx + dy * dy);
            Ixy -= mass * dx * dy;
            Ixz -= mass * dx * dz;
            Iyz -= mass * dy * dz;
        });
        
        return {
            Ixx, Iyy, Izz, Ixy, Ixz, Iyz,
            tensor: new THREE.Matrix3().set(
                Ixx, Ixy, Ixz,
                Ixy, Iyy, Iyz,
                Ixz, Iyz, Izz
            )
        };
    }
    
    // حساب عزم ثنائي القطب
    calculateDipoleMoment() {
        const dipole = new THREE.Vector3(0, 0, 0);
        const centerOfMass = this.calculateCenterOfMass();
        
        this.atoms.forEach(atom => {
            if (atom.charge !== 0) {
                const displacement = atom.position.clone().sub(centerOfMass);
                dipole.add(displacement.multiplyScalar(atom.charge));
            }
        });
        
        return {
            vector: dipole,
            magnitude: dipole.length()
        };
    }
    
    // حساب الشحنة الإجمالية
    calculateTotalCharge() {
        let totalCharge = 0;
        this.atoms.forEach(atom => {
            totalCharge += atom.charge;
        });
        return totalCharge;
    }
    
    // حساب الاستقرار
    calculateStability() {
        let stabilityScore = 0;
        
        // فحص اكتمال الغلاف الخارجي للذرات
        this.atoms.forEach(atom => {
            const valenceElectrons = this.getValenceElectrons(atom);
            const idealElectrons = atom.type === 'H' ? 2 : 8; // قاعدة الثمانية
            
            if (valenceElectrons === idealElectrons) {
                stabilityScore += 10;
            } else {
                stabilityScore -= Math.abs(valenceElectrons - idealElectrons);
            }
        });
        
        // فحص قوة الروابط
        this.bonds.forEach(bondInfo => {
            stabilityScore += bondInfo.strength * 5;
        });
        
        return Math.max(0, stabilityScore);
    }
    
    // حساب إلكترونات التكافؤ
    getValenceElectrons(atom) {
        const atomicNumbers = {
            'H': 1, 'C': 6, 'N': 7, 'O': 8, 'P': 15, 'S': 16,
            'Cl': 17, 'Fe': 26, 'Ca': 20, 'Mg': 12
        };
        
        const atomicNumber = atomicNumbers[atom.type] || 1;
        const electrons = atomicNumber - atom.charge;
        
        // تبسيط: إلكترونات التكافؤ هي الإلكترونات في الغلاف الخارجي
        if (electrons <= 2) return electrons;
        if (electrons <= 10) return electrons - 2;
        if (electrons <= 18) return electrons - 10;
        return electrons - 18;
    }
    
    // حساب التفاعلية
    calculateReactivity() {
        let reactivity = 0;
        
        this.atoms.forEach(atom => {
            // الذرات ذات الروابط غير المكتملة أكثر تفاعلاً
            const unpairedElectrons = atom.maxLinks - atom.currentLinks;
            reactivity += unpairedElectrons * 2;
            
            // الذرات المشحونة أكثر تفاعلاً
            reactivity += Math.abs(atom.charge) * 3;
        });
        
        return reactivity;
    }
    
    // حساب متوسط الكهروسالبية
    calculateAverageElectronegativity() {
        if (this.atoms.size === 0) return 0;
        
        let totalElectronegativity = 0;
        this.atoms.forEach(atom => {
            totalElectronegativity += atom.electronegativity;
        });
        
        return totalElectronegativity / this.atoms.size;
    }
    
    // حساب القابلية للاستقطاب
    calculatePolarizability() {
        let polarizability = 0;
        
        this.atoms.forEach(atom => {
            // تقدير مبسط للقابلية للاستقطاب بناءً على حجم الذرة
            const atomicVolume = (4/3) * Math.PI * Math.pow(atom.vanDerWaalsRadius, 3);
            polarizability += atomicVolume * 0.1; // عامل تحويل مبسط
        });
        
        return polarizability;
    }
    
    // تحليل التهجين
    analyzeHybridization() {
        const hybridizations = new Map();
        
        this.atoms.forEach(atom => {
            if (atom.type === 'C') {
                const bondCount = atom.currentLinks;
                let hybridization = 'sp3'; // افتراضي
                
                if (bondCount === 2) {
                    hybridization = 'sp';
                } else if (bondCount === 3) {
                    hybridization = 'sp2';
                } else if (bondCount === 4) {
                    hybridization = 'sp3';
                }
                
                hybridizations.set(atom.id, hybridization);
            }
        });
        
        return hybridizations;
    }
    
    // فحص العطرية
    checkAromaticity() {
        // تبسيط: فحص وجود حلقات من 6 ذرات كربون
        const carbonAtoms = Array.from(this.atoms).filter(atom => atom.type === 'C');
        
        if (carbonAtoms.length === 6) {
            // فحص إذا كانت جميع ذرات الكربون مترابطة في حلقة
            let ringFormed = true;
            for (let i = 0; i < carbonAtoms.length; i++) {
                const currentAtom = carbonAtoms[i];
                const nextAtom = carbonAtoms[(i + 1) % carbonAtoms.length];
                
                if (!currentAtom.bonds.has(nextAtom)) {
                    ringFormed = false;
                    break;
                }
            }
            
            return ringFormed;
        }
        
        return false;
    }
    
    // فحص الكيرالية
    checkChirality() {
        // تبسيط: فحص وجود ذرة كربون مرتبطة بأربع مجموعات مختلفة
        const carbonAtoms = Array.from(this.atoms).filter(atom => 
            atom.type === 'C' && atom.currentLinks === 4
        );
        
        return carbonAtoms.some(carbon => {
            const bondedAtoms = Array.from(carbon.bonds);
            const atomTypes = bondedAtoms.map(atom => atom.type);
            const uniqueTypes = new Set(atomTypes);
            
            return uniqueTypes.size === 4; // أربع مجموعات مختلفة
        });
    }
    
    // حساب لون الجزيء
    calculateMoleculeColor() {
        if (this.atoms.size === 0) return 0x888888;
        
        // حساب متوسط ألوان الذرات
        let r = 0, g = 0, b = 0;
        
        this.atoms.forEach(atom => {
            const color = new THREE.Color(atom.color);
            r += color.r;
            g += color.g;
            b += color.b;
        });
        
        const count = this.atoms.size;
        const avgColor = new THREE.Color(r / count, g / count, b / count);
        
        return avgColor.getHex();
    }
    
    // توليد اسم الجزيء
    generateName() {
        const formula = this.calculateFormula();
        
        // أسماء شائعة للجزيئات المعروفة
        const knownMolecules = {
            'H2O': 'ماء',
            'CH4': 'ميثان',
            'C6H6': 'بنزين',
            'NH3': 'أمونيا',
            'CO2': 'ثاني أكسيد الكربون',
            'C2H6': 'إيثان',
            'C2H4': 'إيثيلين',
            'C2H2': 'أسيتيلين',
            'CH3OH': 'ميثانول',
            'C2H5OH': 'إيثانول'
        };
        
        return knownMolecules[formula] || `جزيء ${formula}`;
    }
    
    // إنشاء شبكات الروابط
    createBondMeshes() {
        this.bonds.forEach((bondInfo, bondKey) => {
            this.createBondMesh(bondInfo);
        });
    }
    
    // إنشاء شبكة رابطة واحدة
    createBondMesh(bondInfo) {
        const atom1 = bondInfo.atom1;
        const atom2 = bondInfo.atom2;
        
        const direction = atom2.position.clone().sub(atom1.position);
        const length = direction.length();
        const midpoint = atom1.position.clone().add(atom2.position).multiplyScalar(0.5);
        
        // إنشاء أسطوانة للرابطة
        const geometry = new THREE.CylinderGeometry(0.02, 0.02, length, 8);
        const material = new THREE.MeshPhongMaterial({
            color: this.getBondColor(bondInfo.type),
            transparent: true,
            opacity: 0.8
        });
        
        const bondMesh = new THREE.Mesh(geometry, material);
        bondMesh.position.copy(midpoint);
        
        // توجيه الأسطوانة
        bondMesh.lookAt(atom2.position);
        bondMesh.rotateX(Math.PI / 2);
        
        const bondKey = this.getBondKey(atom1, atom2);
        this.bondMeshes.set(bondKey, bondMesh);
        
        return bondMesh;
    }
    
    // إزالة شبكة رابطة
    removeBondMesh(bondKey) {
        if (this.bondMeshes.has(bondKey)) {
            const mesh = this.bondMeshes.get(bondKey);
            if (mesh.parent) {
                mesh.parent.remove(mesh);
            }
            this.bondMeshes.delete(bondKey);
        }
    }
    
    // الحصول على لون الرابطة
    getBondColor(bondType) {
        const colors = {
            'single': 0x888888,
            'double': 0xffaa00,
            'triple': 0xff0000,
            'aromatic': 0x00ff00,
            'ionic': 0x0000ff,
            'hydrogen': 0x00ffff,
            'van_der_waals': 0xff00ff
        };
        
        return colors[bondType] || 0x888888;
    }
    
    // تحديث جميع الخصائص
    updateProperties() {
        this.formula = this.calculateFormula();
        this.molecularWeight = this.calculateMolecularWeight();
        this.centerOfMass = this.calculateCenterOfMass();
        this.momentOfInertia = this.calculateMomentOfInertia();
        this.dipoleMoment = this.calculateDipoleMoment();
        this.totalCharge = this.calculateTotalCharge();
        this.stability = this.calculateStability();
        this.reactivity = this.calculateReactivity();
        this.electronegativity = this.calculateAverageElectronegativity();
        this.polarizability = this.calculatePolarizability();
        this.hybridization = this.analyzeHybridization();
        this.aromaticity = this.checkAromaticity();
        this.chirality = this.checkChirality();
        this.color = this.calculateMoleculeColor();
        this.name = this.generateName();
        
        this.lastModified = Date.now();
    }
    
    // تحديث مواقع شبكات الروابط
    updateBondMeshes() {
        this.bonds.forEach((bondInfo, bondKey) => {
            const mesh = this.bondMeshes.get(bondKey);
            if (mesh) {
                const atom1 = bondInfo.atom1;
                const atom2 = bondInfo.atom2;
                
                const direction = atom2.position.clone().sub(atom1.position);
                const length = direction.length();
                const midpoint = atom1.position.clone().add(atom2.position).multiplyScalar(0.5);
                
                mesh.position.copy(midpoint);
                mesh.scale.y = length / 1; // تحديث طول الأسطوانة
                mesh.lookAt(atom2.position);
                mesh.rotateX(Math.PI / 2);
                
                // تحديث طول الرابطة في المعلومات
                bondInfo.length = length;
            }
        });
    }
    
    // فصل الجزيء إلى جزيئات أصغر
    fragment() {
        const fragments = [];
        const visitedAtoms = new Set();
        
        this.atoms.forEach(atom => {
            if (!visitedAtoms.has(atom)) {
                const fragment = this.getConnectedComponent(atom, visitedAtoms);
                if (fragment.length > 0) {
                    fragments.push(new AdvancedMolecule(fragment));
                }
            }
        });
        
        return fragments;
    }
    
    // الحصول على المكون المتصل
    getConnectedComponent(startAtom, visitedAtoms) {
        const component = [];
        const stack = [startAtom];
        
        while (stack.length > 0) {
            const atom = stack.pop();
            if (visitedAtoms.has(atom)) continue;
            
            visitedAtoms.add(atom);
            component.push(atom);
            
            atom.bonds.forEach(bondedAtom => {
                if (!visitedAtoms.has(bondedAtom) && this.atoms.has(bondedAtom)) {
                    stack.push(bondedAtom);
                }
            });
        }
        
        return component;
    }
    
    // نسخ الجزيء
    clone() {
        const atomClones = new Map();
        const clonedAtoms = [];
        
        // نسخ الذرات
        this.atoms.forEach(atom => {
            const clonedAtom = new Atom(
                atom.position.x,
                atom.position.y,
                atom.position.z,
                {
                    weight: atom.weight,
                    charge: atom.charge,
                    maxLinks: atom.maxLinks,
                    type: atom.type,
                    ljEpsilon: atom.ljEpsilon,
                    ljSigma: atom.ljSigma,
                    morseDepth: atom.morseDepth,
                    morseAlpha: atom.morseAlpha,
                    equilibriumDistance: atom.equilibriumDistance
                }
            );
            
            atomClones.set(atom, clonedAtom);
            clonedAtoms.push(clonedAtom);
        });
        
        // إنشاء الجزيء المنسوخ
        const clonedMolecule = new AdvancedMolecule(clonedAtoms, {
            name: this.name + ' (نسخة)',
            rigidBody: this.rigidBody,
            flexible: this.flexible
        });
        
        // نسخ الروابط
        this.bonds.forEach((bondInfo, bondKey) => {
            const clonedAtom1 = atomClones.get(bondInfo.atom1);
            const clonedAtom2 = atomClones.get(bondInfo.atom2);
            
            if (clonedAtom1 && clonedAtom2) {
                clonedMolecule.addBond(clonedAtom1, clonedAtom2, bondInfo.type);
            }
        });
        
        return clonedMolecule;
    }
    
    // تصدير معلومات الجزيء
    exportInfo() {
        return {
            id: this.id,
            name: this.name,
            formula: this.formula,
            molecularWeight: this.molecularWeight,
            atomCount: this.atoms.size,
            bondCount: this.bonds.size,
            totalCharge: this.totalCharge,
            stability: this.stability,
            reactivity: this.reactivity,
            electronegativity: this.electronegativity,
            polarizability: this.polarizability,
            aromaticity: this.aromaticity,
            chirality: this.chirality,
            dipoleMoment: this.dipoleMoment.magnitude,
            centerOfMass: {
                x: this.centerOfMass.x,
                y: this.centerOfMass.y,
                z: this.centerOfMass.z
            },
            formationTime: this.formationTime,
            lastModified: this.lastModified
        };
    }
}

// تصدير الفئة للاستخدام كوحدة
window.AdvancedMolecule = AdvancedMolecule;

