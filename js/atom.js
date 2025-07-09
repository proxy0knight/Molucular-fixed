class Atom {
    constructor(x = 0, y = 0, z = 0, options = {}) {
        // معرف فريد للذرة
        this.id = Atom.generateId();
        
        // الموقع في الفضاء ثلاثي الأبعاد
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        
        // الخصائص الفيزيائية
        this.weight = options.weight || 1.0;
        this.charge = options.charge || 0;
        this.maxLinks = options.maxLinks || 4;
        this.currentLinks = 0;
        this.type = options.type || 'H'; // نوع العنصر
        this.radius = this.calculateRadius();
        
        // الخصائص البصرية
        this.color = options.color || this.getElementColor();
        this.selected = false;
        this.visible = true;
        
        // علامة مخفية للتتبع
        this.hiddenMarker = `atom_${this.id}_${Date.now()}`;
        
        // الروابط مع الذرات الأخرى
        this.bonds = new Set();
        
        // كائن Three.js للعرض
        this.mesh = null;
        this.selectionSphere = null;
        
        // إنشاء الكائن ثلاثي الأبعاد
        this.createMesh();
        
        // إحصائيات الحركة
        this.lastPosition = this.position.clone();
        this.speed = 0;
        
        // خصائص إضافية للمحاكاة
        this.fixed = false; // هل الذرة مثبتة في مكانها
        this.temperature = 300; // درجة الحرارة بالكلفن
        this.energy = 0; // الطاقة الحركية
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

