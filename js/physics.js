class PhysicsEngine {
    constructor(atoms, molecules, bounds) {
        this.atoms = atoms;
        this.molecules = molecules;
        this.bounds = bounds; // حدود العالم (x, y, z)
        this.gravity = new THREE.Vector3(0, -0.01, 0); // قوة الجاذبية
        this.drag = 0.99; // مقاومة الحركة

        // تهيئة الخصائص الافتراضية
        this.dynamicSpace = { enabled: false, baseSize: 100, atomSizeMultiplier: 1.0 };
        this.lennardJones = { enabled: false, epsilon: 0.01, sigma: 2.5 };
        this.morse = { enabled: false, De: 0.1, alpha: 1.0 };
        this.coulomb = { enabled: false, k: 8.9875e9 }; // ثابت كولوم
        this.vanDerWaals = { enabled: false, strength: 0.01 };
        this.hydrogenBond = { enabled: false, strength: 0.05 };
        this.generalTemperature = 300; // درجة الحرارة العامة بالكلفن
        this.restitution = 0.8; // معامل الارتداد
        this.friction = 0.1; // الاحتكاك

        // خصائص إحصائية (سيتم تحديثها ديناميكياً)
        this.totalEnergy = 0;
        this.kineticEnergy = 0;
        this.potentialEnergy = 0;
        this.systemTemperature = 0;
        this.systemPressure = 0;
        this.systemDensity = 0;
    }

    update(deltaTime) {
        // تطبيق القوى
        this.applyForces();

        // تحديث الذرات
        for (const atom of this.atoms) {
            atom.update(deltaTime);
        }

        // التعامل مع التصادمات
        this.handleCollisions();

        // التعامل مع حدود العالم
        this.handleBounds();

        // تحديث الإحصائيات
        this.updateStats();
    }

    applyForces() {
        for (const atom of this.atoms) {
            // تطبيق الجاذبية
            atom.applyForce(this.gravity);

            // تطبيق مقاومة الحركة
            atom.velocity.multiplyScalar(this.drag);

            // تطبيق قوى لينارد-جونز
            if (this.lennardJones.enabled) {
                for (const otherAtom of this.atoms) {
                    if (atom !== otherAtom) {
                        const distance = atom.position.distanceTo(otherAtom.position);
                        const r6 = Math.pow(this.lennardJones.sigma / distance, 6);
                        const r12 = r6 * r6;
                        const forceMagnitude = 24 * this.lennardJones.epsilon * (2 * r12 - r6) / distance;
                        const force = new THREE.Vector3().subVectors(atom.position, otherAtom.position).normalize().multiplyScalar(forceMagnitude);
                        atom.applyForce(force);
                    }
                }
            }

            // تطبيق قوى كولوم
            if (this.coulomb.enabled) {
                for (const otherAtom of this.atoms) {
                    if (atom !== otherAtom && atom.charge !== 0 && otherAtom.charge !== 0) {
                        const distance = atom.position.distanceTo(otherAtom.position);
                        if (distance > 0.001) { // تجنب القسمة على صفر
                            const forceMagnitude = this.coulomb.k * atom.charge * otherAtom.charge / (distance * distance);
                            const force = new THREE.Vector3().subVectors(atom.position, otherAtom.position).normalize().multiplyScalar(forceMagnitude);
                            atom.applyForce(force);
                        }
                    }
                }
            }
        }
    }

    handleCollisions() {
        for (let i = 0; i < this.atoms.length; i++) {
            for (let j = i + 1; j < this.atoms.length; j++) {
                const atom1 = this.atoms[i];
                const atom2 = this.atoms[j];

                const distance = atom1.position.distanceTo(atom2.position);
                const minDistance = atom1.radius + atom2.radius;

                if (distance < minDistance) {
                    // حساب التصادم
                    const normal = new THREE.Vector3().subVectors(atom1.position, atom2.position).normalize();
                    const relativeVelocity = new THREE.Vector3().subVectors(atom1.velocity, atom2.velocity);
                    const impulse = (-(1 + this.restitution) * relativeVelocity.dot(normal)) / (1 / atom1.mass + 1 / atom2.mass);

                    atom1.velocity.add(normal.clone().multiplyScalar(impulse / atom1.mass));
                    atom2.velocity.sub(normal.clone().multiplyScalar(impulse / atom2.mass));

                    // تطبيق الاحتكاك
                    const tangent = relativeVelocity.clone().sub(normal.clone().multiplyScalar(relativeVelocity.dot(normal))).normalize();
                    const frictionForce = tangent.multiplyScalar(-this.friction * impulse);
                    atom1.velocity.add(frictionForce.clone().divideScalar(atom1.mass));
                    atom2.velocity.sub(frictionForce.clone().divideScalar(atom2.mass));

                    // فصل الذرات المتداخلة
                    const overlap = minDistance - distance;
                    const separation = normal.clone().multiplyScalar(overlap / 2);
                    atom1.position.add(separation);
                    atom2.position.sub(separation);
                }
            }
        }
    }

    handleBounds() {
        for (const atom of this.atoms) {
            if (atom.position.x < -this.bounds.x) {
                atom.position.x = -this.bounds.x;
                atom.velocity.x *= -this.restitution;
            } else if (atom.position.x > this.bounds.x) {
                atom.position.x = this.bounds.x;
                atom.velocity.x *= -this.restitution;
            }
            if (atom.position.y < -this.bounds.y) {
                atom.position.y = -this.bounds.y;
                atom.velocity.y *= -this.restitution;
            } else if (atom.position.y > this.bounds.y) {
                atom.position.y = this.bounds.y;
                atom.velocity.y *= -this.restitution;
            }
            if (atom.position.z < -this.bounds.z) {
                atom.position.z = -this.bounds.z;
                atom.velocity.z *= -this.restitution;
            } else if (atom.position.z > this.bounds.z) {
                atom.position.z = this.bounds.z;
                atom.velocity.z *= -this.restitution;
            }
        }
    }

    updateStats() {
        this.kineticEnergy = 0;
        this.potentialEnergy = 0;
        let totalMass = 0;
        let totalMomentum = new THREE.Vector3();
        let totalVolume = 0;

        for (const atom of this.atoms) {
            this.kineticEnergy += 0.5 * atom.mass * atom.velocity.lengthSq();
            totalMass += atom.mass;
            totalMomentum.add(atom.velocity.clone().multiplyScalar(atom.mass));
            totalVolume += (4/3) * Math.PI * Math.pow(atom.radius, 3);

            // حساب الطاقة الكامنة (مثال بسيط لقوة الجاذبية)
            this.potentialEnergy += -atom.mass * this.gravity.y * atom.position.y;
        }

        this.totalEnergy = this.kineticEnergy + this.potentialEnergy;

        // حساب درجة الحرارة (متوسط الطاقة الحركية)
        if (this.atoms.length > 0) {
            const k_B = 1.380649e-23; // ثابت بولتزمان
            this.systemTemperature = (2 * this.kineticEnergy) / (3 * this.atoms.length * k_B * 1e20); // مقياس تقريبي
        } else {
            this.systemTemperature = 0;
        }

        // حساب الضغط (تقريبي بناءً على التصادمات مع الحدود)
        // هذا يتطلب نموذجًا أكثر تعقيدًا، هنا مجرد تقدير
        this.systemPressure = (totalMomentum.length() / (this.bounds.x * 2 * this.bounds.y * 2 * this.bounds.z * 2)) * 1e5; // تقدير

        // حساب الكثافة
        const spaceVolume = (this.bounds.x * 2 * this.bounds.y * 2 * this.bounds.z * 2);
        this.systemDensity = totalMass / spaceVolume;
    }

    resetToDefaults() {
        this.gravity = new THREE.Vector3(0, -0.01, 0);
        this.drag = 0.99;
        this.dynamicSpace = { enabled: false, baseSize: 100, atomSizeMultiplier: 1.0 };
        this.lennardJones = { enabled: false, epsilon: 0.01, sigma: 2.5 };
        this.morse = { enabled: false, De: 0.1, alpha: 1.0 };
        this.coulomb = { enabled: false, k: 8.9875e9 };
        this.vanDerWaals = { enabled: false, strength: 0.01 };
        this.hydrogenBond = { enabled: false, strength: 0.05 };
        this.generalTemperature = 300;
        this.restitution = 0.8;
        this.friction = 0.1;
    }
}

window.PhysicsEngine = PhysicsEngine;



