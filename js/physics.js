class PhysicsEngine {
    constructor() {
        this.gravity = new THREE.Vector3(0, -0.1, 0);
        this.bondStrength = 1.0;
        this.damping = 0.98;
        this.collisionEnabled = true;
        this.bondingEnabled = true;
        
        // معاملات القوى
        this.vanDerWaalsStrength = 0.01;
        this.electrostaticStrength = 0.1;
        this.bondLength = 0.3; // الطول المثالي للرابطة
        this.maxBondDistance = 0.5; // أقصى مسافة لتكوين رابطة
        
        // حدود البيئة
        this.bounds = {
            min: new THREE.Vector3(-10, -10, -10),
            max: new THREE.Vector3(10, 10, 10)
        };
        
        // إعدادات الأداء
        this.spatialGrid = new Map(); // شبكة مكانية لتحسين الأداء
        this.gridSize = 1.0;
    }
    
    // تحديث الفيزياء لجميع الذرات
    update(atoms, deltaTime) {
        // تنظيف الشبكة المكانية
        this.spatialGrid.clear();
        
        // تجميع الذرات في الشبكة المكانية
        this.buildSpatialGrid(atoms);
        
        // تطبيق القوى على كل ذرة
        atoms.forEach(atom => {
            this.applyForces(atom, atoms, deltaTime);
        });
        
        // فحص التصادمات والروابط
        if (this.collisionEnabled) {
            this.handleCollisions(atoms);
        }
        
        if (this.bondingEnabled) {
            this.handleBonding(atoms);
        }
        
        // تحديث مواقع الذرات
        atoms.forEach(atom => {
            atom.update(deltaTime);
            this.enforceWorldBounds(atom);
        });
    }
    
    // بناء الشبكة المكانية لتحسين الأداء
    buildSpatialGrid(atoms) {
        atoms.forEach(atom => {
            const gridX = Math.floor(atom.position.x / this.gridSize);
            const gridY = Math.floor(atom.position.y / this.gridSize);
            const gridZ = Math.floor(atom.position.z / this.gridSize);
            const key = `${gridX},${gridY},${gridZ}`;
            
            if (!this.spatialGrid.has(key)) {
                this.spatialGrid.set(key, []);
            }
            this.spatialGrid.get(key).push(atom);
        });
    }
    
    // الحصول على الذرات المجاورة
    getNearbyAtoms(atom) {
        const nearby = [];
        const gridX = Math.floor(atom.position.x / this.gridSize);
        const gridY = Math.floor(atom.position.y / this.gridSize);
        const gridZ = Math.floor(atom.position.z / this.gridSize);
        
        // فحص الخلايا المجاورة
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const key = `${gridX + dx},${gridY + dy},${gridZ + dz}`;
                    if (this.spatialGrid.has(key)) {
                        nearby.push(...this.spatialGrid.get(key));
                    }
                }
            }
        }
        
        return nearby.filter(other => other !== atom);
    }
    
    // تطبيق القوى على ذرة
    applyForces(atom, atoms, deltaTime) {
        if (atom.fixed) return;
        
        // تطبيق الجاذبية
        atom.applyForce(this.gravity.clone().multiplyScalar(atom.weight));
        
        // الحصول على الذرات المجاورة
        const nearbyAtoms = this.getNearbyAtoms(atom);
        
        nearbyAtoms.forEach(otherAtom => {
            const distance = atom.distanceTo(otherAtom);
            if (distance < 0.001) return; // تجنب القسمة على صفر
            
            const direction = new THREE.Vector3()
                .subVectors(atom.position, otherAtom.position)
                .normalize();
            
            // قوة فان دير فالس (جذب ضعيف)
            if (distance > atom.radius + otherAtom.radius) {
                const vanDerWaalsForce = direction.clone()
                    .multiplyScalar(-this.vanDerWaalsStrength / (distance * distance));
                atom.applyForce(vanDerWaalsForce);
            }
            
            // القوة الكهروستاتيكية
            if (atom.charge !== 0 && otherAtom.charge !== 0) {
                const electrostaticForce = direction.clone()
                    .multiplyScalar(
                        this.electrostaticStrength * atom.charge * otherAtom.charge / (distance * distance)
                    );
                atom.applyForce(electrostaticForce);
            }
            
            // قوة الرابطة الكيميائية
            if (atom.bonds.has(otherAtom)) {
                const bondForce = this.calculateBondForce(atom, otherAtom, distance);
                atom.applyForce(bondForce);
            }
        });
        
        // قوة عشوائية صغيرة لمحاكاة الحركة الحرارية
        const thermalForce = new THREE.Vector3(
            (Math.random() - 0.5) * 0.001 * atom.temperature / 300,
            (Math.random() - 0.5) * 0.001 * atom.temperature / 300,
            (Math.random() - 0.5) * 0.001 * atom.temperature / 300
        );
        atom.applyForce(thermalForce);
    }
    
    // حساب قوة الرابطة الكيميائية
    calculateBondForce(atom1, atom2, distance) {
        const direction = new THREE.Vector3()
            .subVectors(atom1.position, atom2.position)
            .normalize();
        
        // قانون هوك للرابطة المرنة
        const displacement = distance - this.bondLength;
        const springForce = -this.bondStrength * displacement;
        
        return direction.multiplyScalar(springForce);
    }
    
    // التعامل مع التصادمات
    handleCollisions(atoms) {
        const nearbyPairs = new Set();
        
        atoms.forEach(atom => {
            const nearby = this.getNearbyAtoms(atom);
            nearby.forEach(otherAtom => {
                if (atom.id < otherAtom.id) { // تجنب التكرار
                    const pairKey = `${atom.id}-${otherAtom.id}`;
                    if (!nearbyPairs.has(pairKey)) {
                        nearbyPairs.add(pairKey);
                        this.checkCollision(atom, otherAtom);
                    }
                }
            });
        });
    }
    
    // فحص التصادم بين ذرتين
    checkCollision(atom1, atom2) {
        const distance = atom1.distanceTo(atom2);
        const minDistance = atom1.radius + atom2.radius;
        
        if (distance < minDistance && distance > 0) {
            // حساب اتجاه التصادم
            const direction = new THREE.Vector3()
                .subVectors(atom1.position, atom2.position)
                .normalize();
            
            // فصل الذرات
            const overlap = minDistance - distance;
            const separation = direction.multiplyScalar(overlap * 0.5);
            
            if (!atom1.fixed) {
                atom1.position.add(separation);
            }
            if (!atom2.fixed) {
                atom2.position.sub(separation);
            }
            
            // حساب السرعات الجديدة (تصادم مرن)
            this.resolveCollision(atom1, atom2, direction);
        }
    }
    
    // حل التصادم المرن
    resolveCollision(atom1, atom2, normal) {
        if (atom1.fixed && atom2.fixed) return;
        
        // السرعات النسبية
        const relativeVelocity = new THREE.Vector3()
            .subVectors(atom1.velocity, atom2.velocity);
        
        const velocityAlongNormal = relativeVelocity.dot(normal);
        
        // لا تحل التصادم إذا كانت الذرات تتحرك بعيداً عن بعضها
        if (velocityAlongNormal > 0) return;
        
        // معامل الارتداد
        const restitution = 0.8;
        
        // حساب قوة التصادم
        const impulse = -(1 + restitution) * velocityAlongNormal / 
                       (1/atom1.weight + 1/atom2.weight);
        
        const impulseVector = normal.clone().multiplyScalar(impulse);
        
        // تطبيق التغيير في السرعة
        if (!atom1.fixed) {
            atom1.velocity.add(impulseVector.clone().divideScalar(atom1.weight));
        }
        if (!atom2.fixed) {
            atom2.velocity.sub(impulseVector.clone().divideScalar(atom2.weight));
        }
    }
    
    // التعامل مع تكوين الروابط
    handleBonding(atoms) {
        atoms.forEach(atom => {
            if (atom.currentLinks >= atom.maxLinks) return;
            
            const nearby = this.getNearbyAtoms(atom);
            nearby.forEach(otherAtom => {
                if (otherAtom.currentLinks >= otherAtom.maxLinks) return;
                if (atom.bonds.has(otherAtom)) return;
                
                const distance = atom.distanceTo(otherAtom);
                
                // تكوين رابطة إذا كانت المسافة مناسبة
                if (distance < this.maxBondDistance && this.canBond(atom, otherAtom)) {
                    atom.addBond(otherAtom);
                }
            });
        });
    }
    
    // فحص إمكانية تكوين رابطة
    canBond(atom1, atom2) {
        // قواعد بسيطة لتكوين الروابط
        const distance = atom1.distanceTo(atom2);
        const relativeSpeed = atom1.velocity.clone().sub(atom2.velocity).length();
        
        // الذرات البطيئة أكثر عرضة لتكوين روابط
        return relativeSpeed < 0.1 && distance < this.maxBondDistance;
    }
    
    // فرض حدود العالم
    enforceWorldBounds(atom) {
        if (atom.fixed) return;
        
        const pos = atom.position;
        const vel = atom.velocity;
        const radius = atom.radius;
        
        // الحدود في المحور X
        if (pos.x - radius < this.bounds.min.x) {
            pos.x = this.bounds.min.x + radius;
            vel.x = Math.abs(vel.x) * 0.8; // ارتداد مع فقدان طاقة
        } else if (pos.x + radius > this.bounds.max.x) {
            pos.x = this.bounds.max.x - radius;
            vel.x = -Math.abs(vel.x) * 0.8;
        }
        
        // الحدود في المحور Y
        if (pos.y - radius < this.bounds.min.y) {
            pos.y = this.bounds.min.y + radius;
            vel.y = Math.abs(vel.y) * 0.8;
        } else if (pos.y + radius > this.bounds.max.y) {
            pos.y = this.bounds.max.y - radius;
            vel.y = -Math.abs(vel.y) * 0.8;
        }
        
        // الحدود في المحور Z
        if (pos.z - radius < this.bounds.min.z) {
            pos.z = this.bounds.min.z + radius;
            vel.z = Math.abs(vel.z) * 0.8;
        } else if (pos.z + radius > this.bounds.max.z) {
            pos.z = this.bounds.max.z - radius;
            vel.z = -Math.abs(vel.z) * 0.8;
        }
    }
    
    // تحديث إعدادات الفيزياء
    updateSettings(settings) {
        if (settings.gravity !== undefined) {
            this.gravity.y = -settings.gravity;
        }
        if (settings.bondStrength !== undefined) {
            this.bondStrength = settings.bondStrength;
        }
        if (settings.damping !== undefined) {
            this.damping = settings.damping;
        }
        if (settings.collisionEnabled !== undefined) {
            this.collisionEnabled = settings.collisionEnabled;
        }
        if (settings.bondingEnabled !== undefined) {
            this.bondingEnabled = settings.bondingEnabled;
        }
    }
    
    // إضافة قوة انفجار في نقطة معينة
    addExplosion(center, force, radius) {
        // سيتم استخدامها من قبل النظام الرئيسي
        this.explosionCenter = center;
        this.explosionForce = force;
        this.explosionRadius = radius;
        this.explosionTime = Date.now();
    }
    
    // تطبيق قوة الانفجار
    applyExplosion(atoms) {
        if (!this.explosionCenter) return;
        
        const currentTime = Date.now();
        if (currentTime - this.explosionTime > 100) { // مدة الانفجار 100ms
            this.explosionCenter = null;
            return;
        }
        
        atoms.forEach(atom => {
            const distance = atom.position.distanceTo(this.explosionCenter);
            if (distance < this.explosionRadius && distance > 0) {
                const direction = new THREE.Vector3()
                    .subVectors(atom.position, this.explosionCenter)
                    .normalize();
                
                const forceMagnitude = this.explosionForce * (1 - distance / this.explosionRadius);
                const force = direction.multiplyScalar(forceMagnitude);
                atom.applyForce(force);
            }
        });
    }
}

