class PhysicsEngine {
    constructor(atoms, molecules, bounds) {
        this.atoms = atoms;
        this.molecules = molecules;
        this.bounds = bounds; // حدود العالم (x, y, z)
        this.gravity = new THREE.Vector3(0, -0.01, 0); // قوة الجاذبية
        this.drag = 0.99; // مقاومة الحركة
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
    }

    applyForces() {
        for (const atom of this.atoms) {
            // تطبيق الجاذبية
            atom.applyForce(this.gravity);

            // تطبيق مقاومة الحركة
            atom.velocity.multiplyScalar(this.drag);
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
                    const impulse = (2 * relativeVelocity.dot(normal)) / (atom1.mass + atom2.mass);

                    atom1.velocity.sub(normal.clone().multiplyScalar(impulse * atom2.mass));
                    atom2.velocity.add(normal.clone().multiplyScalar(impulse * atom1.mass));

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
            if (atom.position.x < -this.bounds.x || atom.position.x > this.bounds.x) {
                atom.velocity.x *= -1;
                atom.position.x = Math.max(-this.bounds.x, Math.min(this.bounds.x, atom.position.x));
            }
            if (atom.position.y < -this.bounds.y || atom.position.y > this.bounds.y) {
                atom.velocity.y *= -1;
                atom.position.y = Math.max(-this.bounds.y, Math.min(this.bounds.y, atom.position.y));
            }
            if (atom.position.z < -this.bounds.z || atom.position.z > this.bounds.z) {
                atom.velocity.z *= -1;
                atom.position.z = Math.max(-this.bounds.z, Math.min(this.bounds.z, atom.position.z));
            }
        }
    }
}

window.PhysicsEngine = PhysicsEngine;

