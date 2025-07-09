class Atom {
    constructor(x = 0, y = 0, z = 0, options = {}) {
        // معرف فريد للذرة
        this.id = Atom.generateId();
        
        // الموقع في الفضاء ثلاثي الأبعاد
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        
        // الخصائص الفيزيائية الأساسية
        this.weight = options.weight || 1.0;
        this.charge = options.charge || 0;
        this.maxLinks = options.maxLinks || 4;
        this.currentLinks = 0;
        this.type = options.type || 'H'; // نوع العنصر
        this.radius = this.calculateRadius();
        
        // خصائص جهد لينارد-جونز
        this.ljEpsilon = options.ljEpsilon || this.getDefaultLJEpsilon(); // عمق البئر الكامن
        this.ljSigma = options.ljSigma || this.getDefaultLJSigma(); // المسافة عند الطاقة الصفرية
        
        // خصائص جهد مورس للروابط
        this.morseDepth = options.morseDepth || this.getDefaultMorseDepth(); // عمق البئر
        this.morseAlpha = options.morseAlpha || this.getDefaultMorseAlpha(); // عرض الجهد
        this.equilibriumDistance = options.equilibriumDistance || this.getDefaultEquilibriumDistance(); // المسافة التوازنية
        
        // خصائص فيزيائية متقدمة
        this.vanDerWaalsRadius = options.vanDerWaalsRadius || this.getVanDerWaalsRadius();
        this.covalentRadius = options.covalentRadius || this.getCovalentRadius();
        this.electronegativity = options.electronegativity || this.getElectronegativity();
        this.ionizationEnergy = options.ionizationEnergy || this.getIonizationEnergy();
        
        // خصائص الحركة الحرارية
        this.temperature = options.temperature || 300; // درجة الحرارة بالكلفن
        this.thermalVelocity = this.calculateThermalVelocity();
        
        // الخصائص البصرية
        this.color = options.color || this.getElementColor();
        this.selected = false;
        this.visible = true;
        
        // علامة مخفية للتتبع
        this.hiddenMarker = `atom_${this.id}_${Date.now()}`;
        
        // الروابط مع الذرات الأخرى
        this.bonds = new Set();
        this.parentMolecule = null; // الجزيء الذي تنتمي إليه الذرة
        
        // كائن Three.js للعرض
        this.mesh = null;
        this.selectionSphere = null;
        
        // إنشاء الكائن ثلاثي الأبعاد
        this.createMesh();
        
        // إحصائيات الحركة
        this.lastPosition = this.position.clone();
        this.speed = 0;
        this.energy = 0; // الطاقة الحركية
        this.potentialEnergy = 0; // الطاقة الكامنة
        
        // خصائص إضافية للمحاكاة
        this.fixed = false; // هل الذرة مثبتة في مكانها
        this.frozen = false; // هل الذرة مجمدة (لا تتحرك)
        this.highlighted = false; // هل الذرة مميزة بصرياً
        
        // تاريخ الحركة للتحليل
        this.positionHistory = [];
        this.maxHistoryLength = 100;
        
        // خصائص الكم (مبسطة)
        this.spinState = options.spinState || 0.5; // حالة الدوران
        this.orbitalOccupancy = this.calculateOrbitalOccupancy(); // إشغال المدارات
    }
    
    // توليد معرف فريد
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    // حساب نصف القطر بناءً على الوزن والنوع
    calculateRadius() {
        const baseRadius = 0.1;
        const weightFactor = Math.pow(this.weight, 1/3);
        return baseRadius * weightFactor;
    }
    
    // الحصول على لون العنصر
    getElementColor() {
        const elementColors = {
            'H': 0xffffff,  // أبيض للهيدروجين
            'C': 0x404040,  // رمادي للكربون
            'N': 0x0000ff,  // أزرق للنيتروجين
            'O': 0xff0000,  // أحمر للأكسجين
            'P': 0xff8000,  // برتقالي للفوسفور
            'S': 0xffff00,  // أصفر للكبريت
            'Cl': 0x00ff00, // أخضر للكلور
            'Fe': 0x8b4513, // بني للحديد
            'Ca': 0x808080, // رمادي للكالسيوم
            'Mg': 0x90ee90  // أخضر فاتح للمغنيسيوم
        };
        return elementColors[this.type] || 0x888888;
    }
    
    // إنشاء الكائن ثلاثي الأبعاد
    createMesh() {
        // إنشاء الهندسة والمادة
        const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: this.color,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.userData = { atom: this, type: 'atom' };
        
        // إنشاء كرة التحديد (مخفية افتراضياً)
        const selectionGeometry = new THREE.SphereGeometry(this.radius * 2, 16, 16);
        const selectionMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        
        this.selectionSphere = new THREE.Mesh(selectionGeometry, selectionMaterial);
        this.selectionSphere.position.copy(this.position);
        this.selectionSphere.visible = false;
    }
    
    // تحديث الموقع والفيزياء
    update(deltaTime) {
        if (this.fixed) return;
        
        // تطبيق القوى
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // تطبيق المقاومة
        this.velocity.multiplyScalar(0.98);
        
        // تحديث الموقع
        this.lastPosition.copy(this.position);
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // حساب السرعة
        this.speed = this.velocity.length();
        
        // حساب الطاقة الحركية
        this.energy = 0.5 * this.weight * this.speed * this.speed;
        
        // تحديث موقع الكائن ثلاثي الأبعاد
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
        if (this.selectionSphere) {
            this.selectionSphere.position.copy(this.position);
        }
        
        // إعادة تعيين التسارع
        this.acceleration.set(0, 0, 0);
    }
    
    // تطبيق قوة على الذرة
    applyForce(force) {
        if (this.fixed) return;
        
        // F = ma, لذا a = F/m
        const acceleration = force.clone().divideScalar(this.weight);
        this.acceleration.add(acceleration);
    }
    
    // إضافة رابطة مع ذرة أخرى
    addBond(otherAtom) {
        if (this.currentLinks >= this.maxLinks || otherAtom.currentLinks >= otherAtom.maxLinks) {
            return false;
        }
        
        if (!this.bonds.has(otherAtom) && !otherAtom.bonds.has(this)) {
            this.bonds.add(otherAtom);
            otherAtom.bonds.add(this);
            this.currentLinks++;
            otherAtom.currentLinks++;
            return true;
        }
        return false;
    }
    
    // إزالة رابطة مع ذرة أخرى
    removeBond(otherAtom) {
        if (this.bonds.has(otherAtom)) {
            this.bonds.delete(otherAtom);
            otherAtom.bonds.delete(this);
            this.currentLinks--;
            otherAtom.currentLinks--;
            return true;
        }
        return false;
    }
    
    // حساب المسافة إلى ذرة أخرى
    distanceTo(otherAtom) {
        return this.position.distanceTo(otherAtom.position);
    }
    
    // تحديد/إلغاء تحديد الذرة
    setSelected(selected) {
        this.selected = selected;
        if (this.selectionSphere) {
            this.selectionSphere.visible = selected;
        }
        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissive.setHex(selected ? 0x333333 : 0x000000);
        }
    }
    
    // تحديث خصائص الذرة
    updateProperties(properties) {
        if (properties.weight !== undefined) {
            this.weight = Math.max(0.1, properties.weight);
            this.radius = this.calculateRadius();
            this.updateMeshGeometry();
        }
        
        if (properties.maxLinks !== undefined) {
            this.maxLinks = Math.max(0, properties.maxLinks);
        }
        
        if (properties.charge !== undefined) {
            this.charge = properties.charge;
        }
        
        if (properties.type !== undefined) {
            this.type = properties.type;
            this.color = this.getElementColor();
            if (this.mesh && this.mesh.material) {
                this.mesh.material.color.setHex(this.color);
            }
        }
        
        if (properties.fixed !== undefined) {
            this.fixed = properties.fixed;
            if (this.fixed) {
                this.velocity.set(0, 0, 0);
                this.acceleration.set(0, 0, 0);
            }
        }
    }
    
    // تحديث هندسة الكائن ثلاثي الأبعاد
    updateMeshGeometry() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = new THREE.SphereGeometry(this.radius, 16, 16);
        }
        if (this.selectionSphere) {
            this.selectionSphere.geometry.dispose();
            this.selectionSphere.geometry = new THREE.SphereGeometry(this.radius * 2, 16, 16);
        }
    }
    
    // الحصول على معلومات الذرة
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            position: {
                x: this.position.x.toFixed(2),
                y: this.position.y.toFixed(2),
                z: this.position.z.toFixed(2)
            },
            weight: this.weight,
            charge: this.charge,
            maxLinks: this.maxLinks,
            currentLinks: this.currentLinks,
            speed: this.speed.toFixed(2),
            energy: this.energy.toFixed(2),
            bonds: Array.from(this.bonds).map(atom => atom.id),
            hiddenMarker: this.hiddenMarker
        };
    }
    
    // تنظيف الموارد
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.selectionSphere) {
            this.selectionSphere.geometry.dispose();
            this.selectionSphere.material.dispose();
        }
        
        // إزالة جميع الروابط
        Array.from(this.bonds).forEach(atom => {
            this.removeBond(atom);
        });
    }
    
    // نسخ الذرة
    clone() {
        const clonedAtom = new Atom(
            this.position.x,
            this.position.y,
            this.position.z,
            {
                weight: this.weight,
                charge: this.charge,
                maxLinks: this.maxLinks,
                type: this.type,
                color: this.color
            }
        );
        
        clonedAtom.velocity.copy(this.velocity);
        clonedAtom.fixed = this.fixed;
        clonedAtom.temperature = this.temperature;
        
        return clonedAtom;
    }
}

// تصدير الفئة للاستخدام كوحدة
window.Atom = Atom;


    
    // حساب قيم لينارد-جونز الافتراضية
    getDefaultLJEpsilon() {
        const epsilonValues = {
            'H': 0.0157,   // كيلو جول/مول
            'C': 0.3598,
            'N': 0.3598,
            'O': 0.8786,
            'P': 0.8786,
            'S': 1.0465,
            'Cl': 1.1087,
            'Fe': 0.0100,
            'Ca': 0.4598,
            'Mg': 0.8750
        };
        return epsilonValues[this.type] || 0.1;
    }
    
    getDefaultLJSigma() {
        const sigmaValues = {
            'H': 2.81,     // أنجستروم
            'C': 3.40,
            'N': 3.25,
            'O': 2.96,
            'P': 3.74,
            'S': 3.50,
            'Cl': 3.52,
            'Fe': 2.59,
            'Ca': 3.03,
            'Mg': 2.69
        };
        return (sigmaValues[this.type] || 3.0) * 0.1; // تحويل إلى وحدات المحاكاة
    }
    
    // حساب قيم مورس الافتراضية
    getDefaultMorseDepth() {
        const depthValues = {
            'H': 4.52,     // إلكترون فولت
            'C': 7.37,
            'N': 9.76,
            'O': 5.12,
            'P': 3.43,
            'S': 4.88,
            'Cl': 2.51,
            'Fe': 4.28,
            'Ca': 1.84,
            'Mg': 1.51
        };
        return depthValues[this.type] || 4.0;
    }
    
    getDefaultMorseAlpha() {
        const alphaValues = {
            'H': 1.94,     // أنجستروم^-1
            'C': 1.85,
            'N': 2.69,
            'O': 2.30,
            'P': 1.87,
            'S': 1.92,
            'Cl': 1.81,
            'Fe': 1.39,
            'Ca': 1.09,
            'Mg': 1.34
        };
        return alphaValues[this.type] || 2.0;
    }
    
    getDefaultEquilibriumDistance() {
        const distanceValues = {
            'H': 0.74,     // أنجستروم
            'C': 1.54,
            'N': 1.47,
            'O': 1.48,
            'P': 2.20,
            'S': 2.05,
            'Cl': 1.99,
            'Fe': 2.48,
            'Ca': 2.00,
            'Mg': 1.73
        };
        return (distanceValues[this.type] || 1.5) * 0.1; // تحويل إلى وحدات المحاكاة
    }
    
    // حساب نصف قطر فان دير فالس
    getVanDerWaalsRadius() {
        const vdwRadii = {
            'H': 1.20,     // أنجستروم
            'C': 1.70,
            'N': 1.55,
            'O': 1.52,
            'P': 1.80,
            'S': 1.80,
            'Cl': 1.75,
            'Fe': 2.00,
            'Ca': 2.31,
            'Mg': 1.73
        };
        return (vdwRadii[this.type] || 1.5) * 0.1; // تحويل إلى وحدات المحاكاة
    }
    
    // حساب نصف القطر التساهمي
    getCovalentRadius() {
        const covalentRadii = {
            'H': 0.31,     // أنجستروم
            'C': 0.76,
            'N': 0.71,
            'O': 0.66,
            'P': 1.07,
            'S': 1.05,
            'Cl': 0.99,
            'Fe': 1.32,
            'Ca': 1.76,
            'Mg': 1.41
        };
        return (covalentRadii[this.type] || 0.7) * 0.1; // تحويل إلى وحدات المحاكاة
    }
    
    // حساب الكهروسالبية
    getElectronegativity() {
        const electronegativityValues = {
            'H': 2.20,     // مقياس باولينغ
            'C': 2.55,
            'N': 3.04,
            'O': 3.44,
            'P': 2.19,
            'S': 2.58,
            'Cl': 3.16,
            'Fe': 1.83,
            'Ca': 1.00,
            'Mg': 1.31
        };
        return electronegativityValues[this.type] || 2.0;
    }
    
    // حساب طاقة التأين
    getIonizationEnergy() {
        const ionizationValues = {
            'H': 13.60,    // إلكترون فولت
            'C': 11.26,
            'N': 14.53,
            'O': 13.62,
            'P': 10.49,
            'S': 10.36,
            'Cl': 12.97,
            'Fe': 7.90,
            'Ca': 6.11,
            'Mg': 7.65
        };
        return ionizationValues[this.type] || 10.0;
    }
    
    // حساب السرعة الحرارية
    calculateThermalVelocity() {
        // v = sqrt(3kT/m) حيث k = ثابت بولتزمان، T = درجة الحرارة، m = الكتلة
        const k = 1.38064852e-23; // ثابت بولتزمان (J/K)
        const mass = this.weight * 1.66053906660e-27; // تحويل الكتلة الذرية إلى كيلوجرام
        return Math.sqrt(3 * k * this.temperature / mass) * 1e-12; // تحويل إلى وحدات المحاكاة
    }
    
    // حساب إشغال المدارات (مبسط)
    calculateOrbitalOccupancy() {
        const atomicNumbers = {
            'H': 1, 'C': 6, 'N': 7, 'O': 8, 'P': 15, 'S': 16,
            'Cl': 17, 'Fe': 26, 'Ca': 20, 'Mg': 12
        };
        
        const atomicNumber = atomicNumbers[this.type] || 1;
        const electrons = atomicNumber - this.charge; // عدد الإلكترونات
        
        // توزيع الإلكترونات على المدارات (مبسط)
        const orbitals = {
            '1s': Math.min(electrons, 2),
            '2s': Math.min(Math.max(electrons - 2, 0), 2),
            '2p': Math.min(Math.max(electrons - 4, 0), 6),
            '3s': Math.min(Math.max(electrons - 10, 0), 2),
            '3p': Math.min(Math.max(electrons - 12, 0), 6),
            '4s': Math.min(Math.max(electrons - 18, 0), 2),
            '3d': Math.min(Math.max(electrons - 20, 0), 10)
        };
        
        return orbitals;
    }
    
    // حساب الحد الأدنى للمسافة بين الذرات
    getMinimumDistance(otherAtom) {
        // الحد الأدنى = 50% من مجموع أنصاف أقطار فان دير فالس
        const minDistance = (this.vanDerWaalsRadius + otherAtom.vanDerWaalsRadius) * 0.5;
        return minDistance;
    }
    
    // حساب جهد لينارد-جونز
    calculateLennardJonesPotential(otherAtom, distance) {
        const epsilon = Math.sqrt(this.ljEpsilon * otherAtom.ljEpsilon); // قاعدة الخلط
        const sigma = (this.ljSigma + otherAtom.ljSigma) / 2; // قاعدة الخلط
        
        const sigmaOverR = sigma / distance;
        const sigmaOverR6 = Math.pow(sigmaOverR, 6);
        const sigmaOverR12 = sigmaOverR6 * sigmaOverR6;
        
        return 4 * epsilon * (sigmaOverR12 - sigmaOverR6);
    }
    
    // حساب قوة لينارد-جونز
    calculateLennardJonesForce(otherAtom, distance, direction) {
        const epsilon = Math.sqrt(this.ljEpsilon * otherAtom.ljEpsilon);
        const sigma = (this.ljSigma + otherAtom.ljSigma) / 2;
        
        const sigmaOverR = sigma / distance;
        const sigmaOverR6 = Math.pow(sigmaOverR, 6);
        const sigmaOverR12 = sigmaOverR6 * sigmaOverR6;
        
        const forceMagnitude = 24 * epsilon * (2 * sigmaOverR12 - sigmaOverR6) / distance;
        return direction.clone().multiplyScalar(forceMagnitude);
    }
    
    // حساب جهد مورس للروابط
    calculateMorsePotential(otherAtom, distance) {
        if (!this.bonds.has(otherAtom)) return 0;
        
        const depth = Math.sqrt(this.morseDepth * otherAtom.morseDepth);
        const alpha = (this.morseAlpha + otherAtom.morseAlpha) / 2;
        const equilibrium = (this.equilibriumDistance + otherAtom.equilibriumDistance) / 2;
        
        const exponent = -alpha * (distance - equilibrium);
        const term = 1 - Math.exp(exponent);
        
        return depth * (term * term - 1);
    }
    
    // حساب قوة مورس للروابط
    calculateMorseForce(otherAtom, distance, direction) {
        if (!this.bonds.has(otherAtom)) return new THREE.Vector3(0, 0, 0);
        
        const depth = Math.sqrt(this.morseDepth * otherAtom.morseDepth);
        const alpha = (this.morseAlpha + otherAtom.morseAlpha) / 2;
        const equilibrium = (this.equilibriumDistance + otherAtom.equilibriumDistance) / 2;
        
        const exponent = -alpha * (distance - equilibrium);
        const expTerm = Math.exp(exponent);
        const term = 1 - expTerm;
        
        const forceMagnitude = 2 * depth * alpha * term * expTerm;
        return direction.clone().multiplyScalar(-forceMagnitude); // سالب لأن القوة تعاكس الاتجاه
    }
    
    // تحديث تاريخ الحركة
    updatePositionHistory() {
        this.positionHistory.push(this.position.clone());
        if (this.positionHistory.length > this.maxHistoryLength) {
            this.positionHistory.shift();
        }
    }
    
    // حساب متوسط السرعة
    getAverageSpeed() {
        if (this.positionHistory.length < 2) return 0;
        
        let totalDistance = 0;
        for (let i = 1; i < this.positionHistory.length; i++) {
            totalDistance += this.positionHistory[i].distanceTo(this.positionHistory[i-1]);
        }
        
        return totalDistance / (this.positionHistory.length - 1);
    }
    
    // فحص إمكانية تكوين رابطة
    canBondWith(otherAtom) {
        // فحص عدد الروابط المتاحة
        if (this.currentLinks >= this.maxLinks || otherAtom.currentLinks >= otherAtom.maxLinks) {
            return false;
        }
        
        // فحص المسافة
        const distance = this.distanceTo(otherAtom);
        const maxBondDistance = (this.covalentRadius + otherAtom.covalentRadius) * 1.5; // 150% من مجموع الأنصاف التساهمية
        
        if (distance > maxBondDistance) {
            return false;
        }
        
        // فحص التوافق الكيميائي (مبسط)
        const electronegativityDiff = Math.abs(this.electronegativity - otherAtom.electronegativity);
        if (electronegativityDiff > 3.0) { // فرق كبير جداً في الكهروسالبية
            return false;
        }
        
        return true;
    }
    
    // تحديد نوع الرابطة
    determineBondType(otherAtom) {
        const electronegativityDiff = Math.abs(this.electronegativity - otherAtom.electronegativity);
        
        if (electronegativityDiff > 1.7) {
            return 'ionic';
        } else if (electronegativityDiff > 0.4) {
            return 'polar_covalent';
        } else {
            return 'covalent';
        }
    }
    
    // تطبيق الحركة الحرارية
    applyThermalMotion() {
        if (this.fixed || this.frozen) return;
        
        // إضافة حركة عشوائية صغيرة بناءً على درجة الحرارة
        const thermalForce = new THREE.Vector3(
            (Math.random() - 0.5) * this.thermalVelocity * 0.01,
            (Math.random() - 0.5) * this.thermalVelocity * 0.01,
            (Math.random() - 0.5) * this.thermalVelocity * 0.01
        );
        
        this.applyForce(thermalForce);
    }
    
    // تحديث درجة الحرارة
    updateTemperature(newTemperature) {
        this.temperature = newTemperature;
        this.thermalVelocity = this.calculateThermalVelocity();
    }
    
    // حساب الطاقة الكامنة الإجمالية
    calculateTotalPotentialEnergy(otherAtoms) {
        let totalPotential = 0;
        
        otherAtoms.forEach(otherAtom => {
            if (otherAtom === this) return;
            
            const distance = this.distanceTo(otherAtom);
            
            // طاقة لينارد-جونز
            totalPotential += this.calculateLennardJonesPotential(otherAtom, distance);
            
            // طاقة مورس للروابط
            if (this.bonds.has(otherAtom)) {
                totalPotential += this.calculateMorsePotential(otherAtom, distance);
            }
            
            // طاقة كولوم للشحنات
            if (this.charge !== 0 && otherAtom.charge !== 0) {
                const k = 8.9875517923e9; // ثابت كولوم (مبسط)
                totalPotential += k * this.charge * otherAtom.charge / distance;
            }
        });
        
        this.potentialEnergy = totalPotential;
        return totalPotential;
    }

