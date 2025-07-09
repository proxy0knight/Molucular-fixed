class Molecule {
    constructor(name = "Unknown Molecule") {
        this.id = Molecule.generateId();
        this.name = name;
        this.atoms = new Set();
        this.bonds = new Set(); // مجموعة من أزواج الذرات المترابطة
        this.center = new THREE.Vector3();
        this.selected = false;
        
        // خصائص الجزيء
        this.molecularWeight = 0;
        this.charge = 0;
        this.formula = "";
        
        // خصائص بصرية
        this.boundingBox = new THREE.Box3();
        this.boundingSphere = null;
        this.wireframe = null;
        
        // خصائص الحركة
        this.velocity = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();
        this.fixed = false;
        
        // إحصائيات
        this.creationTime = Date.now();
        this.lastUpdate = Date.now();
    }
    
    static generateId() {
        return 'mol_' + Math.random().toString(36).substr(2, 9);
    }
    
    // إضافة ذرة إلى الجزيء
    addAtom(atom) {
        if (this.atoms.has(atom)) return false;
        
        this.atoms.add(atom);
        this.updateProperties();
        return true;
    }
    
    // إزالة ذرة من الجزيء
    removeAtom(atom) {
        if (!this.atoms.has(atom)) return false;
        
        this.atoms.delete(atom);
        
        // إزالة جميع الروابط المتعلقة بهذه الذرة
        this.bonds.forEach(bond => {
            if (bond.atom1 === atom || bond.atom2 === atom) {
                this.bonds.delete(bond);
                bond.atom1.removeBond(bond.atom2);
            }
        });
        
        this.updateProperties();
        return true;
    }
    
    // إضافة رابطة بين ذرتين في الجزيء
    addBond(atom1, atom2, bondType = 'single') {
        if (!this.atoms.has(atom1) || !this.atoms.has(atom2)) {
            return false;
        }
        
        // فحص وجود الرابطة مسبقاً
        const existingBond = Array.from(this.bonds).find(bond => 
            (bond.atom1 === atom1 && bond.atom2 === atom2) ||
            (bond.atom1 === atom2 && bond.atom2 === atom1)
        );
        
        if (existingBond) return false;
        
        // إنشاء الرابطة
        const bond = {
            atom1: atom1,
            atom2: atom2,
            type: bondType,
            length: atom1.distanceTo(atom2),
            strength: this.getBondStrength(bondType),
            id: `bond_${atom1.id}_${atom2.id}`
        };
        
        this.bonds.add(bond);
        atom1.addBond(atom2);
        
        this.updateProperties();
        return true;
    }
    
    // إزالة رابطة
    removeBond(atom1, atom2) {
        const bond = Array.from(this.bonds).find(bond => 
            (bond.atom1 === atom1 && bond.atom2 === atom2) ||
            (bond.atom1 === atom2 && bond.atom2 === atom1)
        );
        
        if (bond) {
            this.bonds.delete(bond);
            atom1.removeBond(atom2);
            this.updateProperties();
            return true;
        }
        return false;
    }
    
    // الحصول على قوة الرابطة حسب النوع
    getBondStrength(bondType) {
        const strengths = {
            'single': 1.0,
            'double': 2.0,
            'triple': 3.0,
            'aromatic': 1.5,
            'hydrogen': 0.1,
            'ionic': 0.8
        };
        return strengths[bondType] || 1.0;
    }
    
    // تحديث خصائص الجزيء
    updateProperties() {
        this.calculateCenter();
        this.calculateMolecularWeight();
        this.calculateCharge();
        this.generateFormula();
        this.updateBoundingVolumes();
        this.lastUpdate = Date.now();
    }
    
    // حساب مركز الكتلة
    calculateCenter() {
        if (this.atoms.size === 0) {
            this.center.set(0, 0, 0);
            return;
        }
        
        let totalWeight = 0;
        this.center.set(0, 0, 0);
        
        this.atoms.forEach(atom => {
            this.center.add(atom.position.clone().multiplyScalar(atom.weight));
            totalWeight += atom.weight;
        });
        
        if (totalWeight > 0) {
            this.center.divideScalar(totalWeight);
        }
    }
    
    // حساب الوزن الجزيئي
    calculateMolecularWeight() {
        this.molecularWeight = 0;
        this.atoms.forEach(atom => {
            this.molecularWeight += atom.weight;
        });
    }
    
    // حساب الشحنة الإجمالية
    calculateCharge() {
        this.charge = 0;
        this.atoms.forEach(atom => {
            this.charge += atom.charge;
        });
    }
    
    // توليد الصيغة الكيميائية
    generateFormula() {
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
        
        this.formula = sortedElements.map(element => {
            const count = elementCounts[element];
            return count > 1 ? `${element}${count}` : element;
        }).join('');
    }
    
    // تحديث الأحجام المحيطة
    updateBoundingVolumes() {
        if (this.atoms.size === 0) return;
        
        this.boundingBox.makeEmpty();
        
        this.atoms.forEach(atom => {
            this.boundingBox.expandByPoint(atom.position);
        });
        
        // إضافة هامش للنصف قطر
        const maxRadius = Math.max(...Array.from(this.atoms).map(atom => atom.radius));
        this.boundingBox.expandByScalar(maxRadius);
        
        // حساب الكرة المحيطة
        const center = this.boundingBox.getCenter(new THREE.Vector3());
        const size = this.boundingBox.getSize(new THREE.Vector3());
        const radius = size.length() * 0.5;
        
        this.boundingSphere = { center, radius };
    }
    
    // نقل الجزيء إلى موقع جديد
    moveTo(newPosition) {
        const offset = new THREE.Vector3().subVectors(newPosition, this.center);
        
        this.atoms.forEach(atom => {
            atom.position.add(offset);
            if (atom.mesh) {
                atom.mesh.position.copy(atom.position);
            }
            if (atom.selectionSphere) {
                atom.selectionSphere.position.copy(atom.position);
            }
        });
        
        this.updateProperties();
    }
    
    // دوران الجزيء حول محور
    rotate(axis, angle) {
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
        
        this.atoms.forEach(atom => {
            // نقل الذرة إلى الأصل نسبة إلى مركز الجزيء
            const relativePosition = atom.position.clone().sub(this.center);
            
            // تطبيق الدوران
            relativePosition.applyMatrix4(rotationMatrix);
            
            // إعادة الذرة إلى موقعها الجديد
            atom.position.copy(this.center).add(relativePosition);
            
            if (atom.mesh) {
                atom.mesh.position.copy(atom.position);
            }
            if (atom.selectionSphere) {
                atom.selectionSphere.position.copy(atom.position);
            }
        });
        
        this.updateProperties();
    }
    
    // تطبيق قوة على الجزيء بأكمله
    applyForce(force) {
        if (this.fixed) return;
        
        const forcePerAtom = force.clone().divideScalar(this.atoms.size);
        
        this.atoms.forEach(atom => {
            atom.applyForce(forcePerAtom.clone());
        });
    }
    
    // تطبيق عزم دوران
    applyTorque(torque) {
        if (this.fixed) return;
        
        this.atoms.forEach(atom => {
            const r = atom.position.clone().sub(this.center);
            const force = new THREE.Vector3().crossVectors(torque, r);
            atom.applyForce(force);
        });
    }
    
    // فصل الجزيء إلى جزيئات أصغر
    fragment() {
        const fragments = [];
        const visitedAtoms = new Set();
        
        this.atoms.forEach(atom => {
            if (visitedAtoms.has(atom)) return;
            
            // البحث في العمق لإيجاد الذرات المترابطة
            const connectedAtoms = this.getConnectedAtoms(atom, visitedAtoms);
            
            if (connectedAtoms.length > 0) {
                const fragment = new Molecule(`Fragment of ${this.name}`);
                
                connectedAtoms.forEach(connectedAtom => {
                    fragment.addAtom(connectedAtom);
                    visitedAtoms.add(connectedAtom);
                });
                
                // إضافة الروابط
                this.bonds.forEach(bond => {
                    if (fragment.atoms.has(bond.atom1) && fragment.atoms.has(bond.atom2)) {
                        fragment.addBond(bond.atom1, bond.atom2, bond.type);
                    }
                });
                
                fragments.push(fragment);
            }
        });
        
        return fragments;
    }
    
    // الحصول على الذرات المترابطة
    getConnectedAtoms(startAtom, visited = new Set()) {
        const connected = [startAtom];
        const toVisit = [startAtom];
        visited.add(startAtom);
        
        while (toVisit.length > 0) {
            const currentAtom = toVisit.pop();
            
            currentAtom.bonds.forEach(bondedAtom => {
                if (!visited.has(bondedAtom) && this.atoms.has(bondedAtom)) {
                    visited.add(bondedAtom);
                    connected.push(bondedAtom);
                    toVisit.push(bondedAtom);
                }
            });
        }
        
        return connected;
    }
    
    // تحديد/إلغاء تحديد الجزيء
    setSelected(selected) {
        this.selected = selected;
        this.atoms.forEach(atom => {
            atom.setSelected(selected);
        });
    }
    
    // نسخ الجزيء
    clone() {
        const clonedMolecule = new Molecule(`Copy of ${this.name}`);
        const atomMap = new Map(); // خريطة الذرات الأصلية إلى المنسوخة
        
        // نسخ الذرات
        this.atoms.forEach(atom => {
            const clonedAtom = atom.clone();
            clonedMolecule.addAtom(clonedAtom);
            atomMap.set(atom, clonedAtom);
        });
        
        // نسخ الروابط
        this.bonds.forEach(bond => {
            const clonedAtom1 = atomMap.get(bond.atom1);
            const clonedAtom2 = atomMap.get(bond.atom2);
            if (clonedAtom1 && clonedAtom2) {
                clonedMolecule.addBond(clonedAtom1, clonedAtom2, bond.type);
            }
        });
        
        clonedMolecule.fixed = this.fixed;
        return clonedMolecule;
    }
    
    // الحصول على معلومات الجزيء
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            formula: this.formula,
            molecularWeight: this.molecularWeight.toFixed(2),
            charge: this.charge,
            atomCount: this.atoms.size,
            bondCount: this.bonds.size,
            center: {
                x: this.center.x.toFixed(2),
                y: this.center.y.toFixed(2),
                z: this.center.z.toFixed(2)
            },
            boundingBox: {
                min: this.boundingBox.min,
                max: this.boundingBox.max
            },
            atoms: Array.from(this.atoms).map(atom => atom.id),
            bonds: Array.from(this.bonds).map(bond => ({
                atom1: bond.atom1.id,
                atom2: bond.atom2.id,
                type: bond.type,
                length: bond.length.toFixed(2)
            })),
            creationTime: this.creationTime,
            lastUpdate: this.lastUpdate
        };
    }
    
    // تنظيف الموارد
    dispose() {
        this.atoms.forEach(atom => {
            atom.dispose();
        });
        this.atoms.clear();
        this.bonds.clear();
        
        if (this.wireframe) {
            this.wireframe.geometry.dispose();
            this.wireframe.material.dispose();
        }
    }
}

// فئة مساعدة لإنشاء جزيئات شائعة
class MoleculeTemplates {
    static createWater() {
        const molecule = new Molecule("Water");
        
        // إنشاء الذرات
        const oxygen = new Atom(0, 0, 0, { type: 'O', weight: 16, maxLinks: 2 });
        const hydrogen1 = new Atom(0.96, 0, 0, { type: 'H', weight: 1, maxLinks: 1 });
        const hydrogen2 = new Atom(-0.24, 0.93, 0, { type: 'H', weight: 1, maxLinks: 1 });
        
        // إضافة الذرات إلى الجزيء
        molecule.addAtom(oxygen);
        molecule.addAtom(hydrogen1);
        molecule.addAtom(hydrogen2);
        
        // إنشاء الروابط
        molecule.addBond(oxygen, hydrogen1, 'single');
        molecule.addBond(oxygen, hydrogen2, 'single');
        
        return molecule;
    }
    
    static createMethane() {
        const molecule = new Molecule("Methane");
        
        // إنشاء ذرة الكربون في المركز
        const carbon = new Atom(0, 0, 0, { type: 'C', weight: 12, maxLinks: 4 });
        molecule.addAtom(carbon);
        
        // إنشاء ذرات الهيدروجين في تشكيل رباعي السطوح
        const bondLength = 1.09;
        const angle = Math.acos(-1/3); // زاوية رباعي السطوح
        
        const positions = [
            [bondLength, 0, 0],
            [-bondLength/3, bondLength * Math.sin(angle), 0],
            [-bondLength/3, -bondLength * Math.sin(angle) / 2, bondLength * Math.sqrt(3) / 2],
            [-bondLength/3, -bondLength * Math.sin(angle) / 2, -bondLength * Math.sqrt(3) / 2]
        ];
        
        positions.forEach((pos, index) => {
            const hydrogen = new Atom(pos[0], pos[1], pos[2], { 
                type: 'H', 
                weight: 1, 
                maxLinks: 1 
            });
            molecule.addAtom(hydrogen);
            molecule.addBond(carbon, hydrogen, 'single');
        });
        
        return molecule;
    }
    
    static createBenzene() {
        const molecule = new Molecule("Benzene");
        const radius = 1.4; // نصف قطر حلقة البنزين
        const carbons = [];
        
        // إنشاء ذرات الكربون في شكل سداسي
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const carbon = new Atom(x, y, 0, { type: 'C', weight: 12, maxLinks: 3 });
            carbons.push(carbon);
            molecule.addAtom(carbon);
        }
        
        // إنشاء الروابط بين ذرات الكربون
        for (let i = 0; i < 6; i++) {
            const nextIndex = (i + 1) % 6;
            const bondType = i % 2 === 0 ? 'double' : 'single'; // روابط متناوبة
            molecule.addBond(carbons[i], carbons[nextIndex], bondType);
        }
        
        // إضافة ذرات الهيدروجين
        carbons.forEach((carbon, index) => {
            const angle = (index * Math.PI * 2) / 6;
            const hRadius = radius + 1.1; // مسافة C-H
            const x = hRadius * Math.cos(angle);
            const y = hRadius * Math.sin(angle);
            const hydrogen = new Atom(x, y, 0, { type: 'H', weight: 1, maxLinks: 1 });
            molecule.addAtom(hydrogen);
            molecule.addBond(carbon, hydrogen, 'single');
        });
        
        return molecule;
    }
}

