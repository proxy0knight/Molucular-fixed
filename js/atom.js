class Atom {
    constructor(x, y, z, type = 'H', id = null) {
        this.id = id || `atom-${Date.now()}-${Math.random().toFixed(5)}`;
        this.type = type;
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.force = new THREE.Vector3();
        this.charge = 0; // شحنة الذرة
        this.radius = 0.5; // نصف قطر الذرة
        this.mass = 1; // كتلة الذرة
        this.color = 0xffffff; // لون الذرة
        this.bonds = []; // الروابط الكيميائية
        this.maxBonds = 1; // الحد الأقصى للروابط
        this.electronegativity = 2.20; // الكهروسالبية
        this.hiddenMarking = `hidden-${this.id}`; // حقل التحديد المخفي
        this.temperature = 300; // درجة الحرارة بالكلفن

        // تعيين الخصائص بناءً على النوع
        this.setPropertiesByType(type);

        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(this.radius, 32, 32),
            new THREE.MeshPhongMaterial({ color: this.color })
        );
        this.mesh.position.copy(this.position);
        this.mesh.userData.atomId = this.id; // ربط الـ mesh بمعرف الذرة
    }

    setPropertiesByType(type) {
        const properties = {
            'H': { mass: 1.008, charge: 0, radius: 0.25, color: 0xFFFFFF, maxBonds: 1, electronegativity: 2.20 }, // Hydrogen
            'C': { mass: 12.011, charge: 0, radius: 0.70, color: 0x909090, maxBonds: 4, electronegativity: 2.55 }, // Carbon
            'O': { mass: 15.999, charge: 0, radius: 0.60, color: 0xFF0000, maxBonds: 2, electronegativity: 3.44 }, // Oxygen
            'N': { mass: 14.007, charge: 0, radius: 0.65, color: 0x0000FF, maxBonds: 3, electronegativity: 3.04 }, // Nitrogen
            'Cl': { mass: 35.453, charge: 0, radius: 1.00, color: 0x00FF00, maxBonds: 1, electronegativity: 3.16 }, // Chlorine
            'Na': { mass: 22.990, charge: 1, radius: 1.80, color: 0xFFA500, maxBonds: 1, electronegativity: 0.93 }, // Sodium
            'S': { mass: 32.06, charge: 0, radius: 1.00, color: 0xFFFF00, maxBonds: 2, electronegativity: 2.58 }, // Sulfur
            'P': { mass: 30.974, charge: 0, radius: 1.00, color: 0xFFA500, maxBonds: 3, electronegativity: 2.19 } // Phosphorus
        };

        const props = properties[type] || properties['H']; // افتراضيًا هيدروجين
        this.mass = props.mass;
        this.charge = props.charge;
        this.radius = props.radius;
        this.color = props.color;
        this.maxBonds = props.maxBonds;
        this.electronegativity = props.electronegativity;
    }

    addBond(atomId) {
        if (this.bonds.length < this.maxBonds && !this.bonds.includes(atomId)) {
            this.bonds.push(atomId);
            return true;
        }
        return false;
    }

    removeBond(atomId) {
        const index = this.bonds.indexOf(atomId);
        if (index > -1) {
            this.bonds.splice(index, 1);
            return true;
        }
        return false;
    }

    // تحديث موضع الذرة بناءً على السرعة والتسارع
    update(deltaTime) {
        this.velocity.addScaledVector(this.acceleration, deltaTime);
        this.position.addScaledVector(this.velocity, deltaTime);
        this.mesh.position.copy(this.position);
        this.acceleration.set(0, 0, 0); // إعادة تعيين التسارع بعد كل تحديث
    }

    applyForce(forceVector) {
        this.force.add(forceVector);
        this.acceleration.add(forceVector.divideScalar(this.mass));
    }

    // حساب قيم لينارد-جونز
    getLennardJonesParameters() {
        // قيم افتراضية لـ epsilon (عمق البئر) و sigma (مسافة التوازن)
        // هذه القيم يجب أن تكون أكثر دقة بناءً على نوع الذرة
        const params = {
            'H': { epsilon: 0.01, sigma: 2.5 },
            'C': { epsilon: 0.05, sigma: 3.4 },
            'O': { epsilon: 0.03, sigma: 3.0 },
            'N': { epsilon: 0.04, sigma: 3.2 },
            'Cl': { epsilon: 0.10, sigma: 4.0 },
            'Na': { epsilon: 0.08, sigma: 3.8 },
            'S': { epsilon: 0.06, sigma: 3.6 },
            'P': { epsilon: 0.07, sigma: 3.5 }
        };
        return params[this.type] || params['H'];
    }

    // حساب قيم مورس (للقوى الكيميائية)
    getMorseParameters() {
        // De (عمق البئر)، alpha (عرض البئر)، re (مسافة التوازن)
        // هذه القيم يجب أن تكون أكثر دقة بناءً على نوع الذرة ونوع الرابطة
        const params = {
            'H': { De: 0.1, alpha: 1.0, re: 0.74 },
            'C': { De: 0.5, alpha: 1.5, re: 1.54 },
            'O': { De: 0.3, alpha: 1.2, re: 1.21 },
            'N': { De: 0.4, alpha: 1.3, re: 1.10 },
            'Cl': { De: 0.2, alpha: 1.1, re: 1.99 },
            'Na': { De: 0.15, alpha: 0.9, re: 2.50 },
            'S': { De: 0.25, alpha: 1.2, re: 2.00 },
            'P': { De: 0.35, alpha: 1.4, re: 2.20 }
        };
        return params[this.type] || params['H'];
    }

    // تصدير الفئة للاستخدام كوحدة
}
window.Atom = Atom;

