class AdvancedPhysicsEngine {
    constructor(options = {}) {
        // إعدادات المحرك الأساسية
        this.gravity = options.gravity || 0.0; // الجاذبية (يمكن تعطيلها في الفضاء)
        this.damping = options.damping || 0.99; // مقاومة الحركة
        this.timeStep = options.timeStep || 0.016; // خطوة زمنية (60 FPS)
        
        // إعدادات الفضاء الديناميكي
        this.dynamicSpace = {
            enabled: options.dynamicSpace || true,
            baseSize: options.baseSpaceSize || 10, // الحجم الأساسي للفضاء
            atomSizeMultiplier: options.atomSizeMultiplier || 99, // المضاعف لحجم الذرة
            minSize: options.minSpaceSize || 5, // الحد الأدنى لحجم الفضاء
            maxSize: options.maxSpaceSize || 100, // الحد الأقصى لحجم الفضاء
            currentSize: options.baseSpaceSize || 10,
            adaptationRate: options.adaptationRate || 0.1 // معدل التكيف
        };
        
        // إعدادات القوى الفيزيائية
        this.forces = {
            lennardJones: {
                enabled: true,
                globalStrength: options.ljStrength || 1.0,
                cutoffDistance: options.ljCutoff || 2.5 // مسافة القطع
            },
            morse: {
                enabled: true,
                globalStrength: options.morseStrength || 1.0
            },
            coulomb: {
                enabled: true,
                globalStrength: options.coulombStrength || 1.0,
                dielectricConstant: options.dielectric || 1.0
            },
            vanDerWaals: {
                enabled: true,
                globalStrength: options.vdwStrength || 0.5
            },
            hydrogen: {
                enabled: true,
                globalStrength: options.hydrogenStrength || 0.3
            },
            thermal: {
                enabled: true,
                globalTemperature: options.temperature || 300, // كلفن
                thermalNoise: options.thermalNoise || 0.01
            }
        };
        
        // إعدادات التصادمات
        this.collision = {
            enabled: true,
            restitution: options.restitution || 0.8, // معامل الارتداد
            friction: options.friction || 0.1, // الاحتكاك
            minimumSeparation: options.minSeparation || 0.5 // الحد الأدنى للفصل
        };
        
        // شبكة مكانية لتحسين الأداء
        this.spatialGrid = {
            enabled: true,
            cellSize: 1.0,
            grid: new Map(),
            needsUpdate: true
        };
        
        // إحصائيات الأداء
        this.stats = {
            totalAtoms: 0,
            totalMolecules: 0,
            totalBonds: 0,
            totalEnergy: 0,
            kineticEnergy: 0,
            potentialEnergy: 0,
            temperature: 0,
            pressure: 0,
            density: 0,
            lastUpdateTime: 0,
            frameTime: 0
        };
        
        // حدود الفضاء
        this.boundaries = {
            type: 'elastic', // 'elastic', 'periodic', 'absorbing'
            walls: {
                enabled: true,
                thickness: 0.1,
                restitution: 0.9
            }
        };
        
        // نظام الأحداث
        this.events = {
            onCollision: [],
            onBondFormation: [],
            onBondBreaking: [],
            onMoleculeFormation: [],
            onMoleculeBreaking: [],
            onTemperatureChange: [],
            onPressureChange: []
        };
        
        // متغيرات التحكم
        this.paused = false;
        this.stepMode = false;
        this.debugMode = false;
        
        // تهيئة الشبكة المكانية
        this.initializeSpatialGrid();
    }
    
    // تهيئة الشبكة المكانية
    initializeSpatialGrid() {
        this.spatialGrid.grid.clear();
        this.spatialGrid.needsUpdate = true;
    }
    
    // تحديث الشبكة المكانية
    updateSpatialGrid(atoms) {
        if (!this.spatialGrid.enabled) return;
        
        this.spatialGrid.grid.clear();
        
        atoms.forEach(atom => {
            const cellX = Math.floor(atom.position.x / this.spatialGrid.cellSize);
            const cellY = Math.floor(atom.position.y / this.spatialGrid.cellSize);
            const cellZ = Math.floor(atom.position.z / this.spatialGrid.cellSize);
            const cellKey = `${cellX},${cellY},${cellZ}`;
            
            if (!this.spatialGrid.grid.has(cellKey)) {
                this.spatialGrid.grid.set(cellKey, []);
            }
            this.spatialGrid.grid.get(cellKey).push(atom);
        });
        
        this.spatialGrid.needsUpdate = false;
    }
    
    // الحصول على الذرات المجاورة
    getNearbyAtoms(atom) {
        if (!this.spatialGrid.enabled) return [];
        
        const cellX = Math.floor(atom.position.x / this.spatialGrid.cellSize);
        const cellY = Math.floor(atom.position.y / this.spatialGrid.cellSize);
        const cellZ = Math.floor(atom.position.z / this.spatialGrid.cellSize);
        
        const nearbyAtoms = [];
        
        // فحص الخلايا المجاورة (3x3x3)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const neighborKey = `${cellX + dx},${cellY + dy},${cellZ + dz}`;
                    const cellAtoms = this.spatialGrid.grid.get(neighborKey);
                    
                    if (cellAtoms) {
                        nearbyAtoms.push(...cellAtoms);
                    }
                }
            }
        }
        
        return nearbyAtoms.filter(otherAtom => otherAtom !== atom);
    }
    
    // تحديث حجم الفضاء الديناميكي
    updateDynamicSpace(atoms) {
        if (!this.dynamicSpace.enabled) return;
        
        const totalAtoms = atoms.length;
        const targetSize = this.dynamicSpace.baseSize + 
                          (totalAtoms * this.dynamicSpace.atomSizeMultiplier / 100);
        
        // تطبيق الحدود
        const clampedSize = Math.max(
            this.dynamicSpace.minSize,
            Math.min(this.dynamicSpace.maxSize, targetSize)
        );
        
        // تطبيق التكيف التدريجي
        const sizeDifference = clampedSize - this.dynamicSpace.currentSize;
        this.dynamicSpace.currentSize += sizeDifference * this.dynamicSpace.adaptationRate;
        
        // تحديث حدود الفضاء
        this.updateBoundaries();
    }
    
    // تحديث الحدود
    updateBoundaries() {
        const halfSize = this.dynamicSpace.currentSize / 2;
        this.boundaries.min = new THREE.Vector3(-halfSize, -halfSize, -halfSize);
        this.boundaries.max = new THREE.Vector3(halfSize, halfSize, halfSize);
    }
    
    // حساب قوة لينارد-جونز المحسنة
    calculateLennardJonesForce(atom1, atom2) {
        if (!this.forces.lennardJones.enabled) return new THREE.Vector3(0, 0, 0);
        
        const distance = atom1.distanceTo(atom2);
        
        // تطبيق مسافة القطع لتحسين الأداء
        if (distance > this.forces.lennardJones.cutoffDistance) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        const direction = atom2.position.clone().sub(atom1.position).normalize();
        const force = atom1.calculateLennardJonesForce(atom2, distance, direction);
        
        return force.multiplyScalar(this.forces.lennardJones.globalStrength);
    }
    
    // حساب قوة مورس للروابط
    calculateMorseForce(atom1, atom2) {
        if (!this.forces.morse.enabled) return new THREE.Vector3(0, 0, 0);
        if (!atom1.bonds.has(atom2)) return new THREE.Vector3(0, 0, 0);
        
        const distance = atom1.distanceTo(atom2);
        const direction = atom2.position.clone().sub(atom1.position).normalize();
        const force = atom1.calculateMorseForce(atom2, distance, direction);
        
        return force.multiplyScalar(this.forces.morse.globalStrength);
    }
    
    // حساب قوة كولوم للشحنات
    calculateCoulombForce(atom1, atom2) {
        if (!this.forces.coulomb.enabled) return new THREE.Vector3(0, 0, 0);
        if (atom1.charge === 0 || atom2.charge === 0) return new THREE.Vector3(0, 0, 0);
        
        const distance = atom1.distanceTo(atom2);
        const direction = atom2.position.clone().sub(atom1.position).normalize();
        
        // قانون كولوم: F = k * q1 * q2 / (ε * r²)
        const k = 8.9875517923e9; // ثابت كولوم (مبسط)
        const forceMagnitude = k * atom1.charge * atom2.charge / 
                              (this.forces.coulomb.dielectricConstant * distance * distance);
        
        // القوة تنافرية إذا كانت الشحنات متشابهة، تجاذبية إذا كانت مختلفة
        const force = direction.multiplyScalar(-forceMagnitude); // سالب لأن الاتجاه من atom1 إلى atom2
        
        return force.multiplyScalar(this.forces.coulomb.globalStrength);
    }
    
    // حساب قوى فان دير فالس
    calculateVanDerWaalsForce(atom1, atom2) {
        if (!this.forces.vanDerWaals.enabled) return new THREE.Vector3(0, 0, 0);
        
        const distance = atom1.distanceTo(atom2);
        const minDistance = atom1.getMinimumDistance(atom2);
        
        // قوى فان دير فالس تعمل على مسافات قصيرة
        if (distance > minDistance * 3) return new THREE.Vector3(0, 0, 0);
        
        const direction = atom2.position.clone().sub(atom1.position).normalize();
        
        // نموذج مبسط لقوى فان دير فالس
        const strength = (atom1.vanDerWaalsRadius * atom2.vanDerWaalsRadius) / (distance * distance);
        const force = direction.multiplyScalar(-strength * 0.1); // تجاذبية ضعيفة
        
        return force.multiplyScalar(this.forces.vanDerWaals.globalStrength);
    }
    
    // حساب الروابط الهيدروجينية
    calculateHydrogenBondForce(atom1, atom2) {
        if (!this.forces.hydrogen.enabled) return new THREE.Vector3(0, 0, 0);
        
        // فحص إمكانية تكوين رابطة هيدروجينية
        const isHydrogenBond = (atom1.type === 'H' && ['O', 'N', 'F'].includes(atom2.type)) ||
                              (atom2.type === 'H' && ['O', 'N', 'F'].includes(atom1.type));
        
        if (!isHydrogenBond) return new THREE.Vector3(0, 0, 0);
        
        const distance = atom1.distanceTo(atom2);
        const maxHBondDistance = 0.35; // مسافة الرابطة الهيدروجينية القصوى
        
        if (distance > maxHBondDistance) return new THREE.Vector3(0, 0, 0);
        
        const direction = atom2.position.clone().sub(atom1.position).normalize();
        const strength = Math.exp(-distance * 10) * 0.5; // قوة تتناقص أسياً
        const force = direction.multiplyScalar(-strength); // تجاذبية
        
        return force.multiplyScalar(this.forces.hydrogen.globalStrength);
    }
    
    // تطبيق الحركة الحرارية
    applyThermalForces(atoms) {
        if (!this.forces.thermal.enabled) return;
        
        atoms.forEach(atom => {
            if (atom.fixed || atom.frozen) return;
            
            // حساب السرعة الحرارية المتوقعة
            const expectedThermalVelocity = atom.calculateThermalVelocity();
            
            // إضافة ضوضاء حرارية عشوائية
            const thermalForce = new THREE.Vector3(
                (Math.random() - 0.5) * expectedThermalVelocity * this.forces.thermal.thermalNoise,
                (Math.random() - 0.5) * expectedThermalVelocity * this.forces.thermal.thermalNoise,
                (Math.random() - 0.5) * expectedThermalVelocity * this.forces.thermal.thermalNoise
            );
            
            atom.applyForce(thermalForce);
        });
    }
    
    // فحص التصادمات المتقدم
    handleAdvancedCollisions(atoms) {
        if (!this.collision.enabled) return;
        
        for (let i = 0; i < atoms.length; i++) {
            const atom1 = atoms[i];
            const nearbyAtoms = this.spatialGrid.enabled ? 
                               this.getNearbyAtoms(atom1) : 
                               atoms.slice(i + 1);
            
            nearbyAtoms.forEach(atom2 => {
                if (atom1 === atom2) return;
                
                const distance = atom1.distanceTo(atom2);
                const minDistance = atom1.getMinimumDistance(atom2);
                
                if (distance < minDistance) {
                    this.resolveCollision(atom1, atom2, distance, minDistance);
                }
            });
        }
    }
    
    // حل التصادم
    resolveCollision(atom1, atom2, currentDistance, minDistance) {
        const overlap = minDistance - currentDistance;
        const direction = atom2.position.clone().sub(atom1.position).normalize();
        
        // فصل الذرات
        const separation = direction.multiplyScalar(overlap * 0.5);
        atom1.position.sub(separation);
        atom2.position.add(separation);
        
        // حساب السرعات النسبية
        const relativeVelocity = atom1.velocity.clone().sub(atom2.velocity);
        const velocityAlongNormal = relativeVelocity.dot(direction);
        
        // لا نحتاج لحل التصادم إذا كانت الذرات تتحرك بعيداً عن بعضها
        if (velocityAlongNormal > 0) return;
        
        // حساب الدفع
        const restitution = this.collision.restitution;
        const impulse = -(1 + restitution) * velocityAlongNormal;
        const totalMass = atom1.weight + atom2.weight;
        const impulseVector = direction.multiplyScalar(impulse / totalMass);
        
        // تطبيق الدفع
        atom1.velocity.add(impulseVector.clone().multiplyScalar(atom2.weight));
        atom2.velocity.sub(impulseVector.clone().multiplyScalar(atom1.weight));
        
        // تطبيق الاحتكاك
        if (this.collision.friction > 0) {
            const tangent = relativeVelocity.clone().sub(direction.clone().multiplyScalar(velocityAlongNormal));
            const frictionImpulse = tangent.normalize().multiplyScalar(
                Math.min(this.collision.friction * Math.abs(impulse), tangent.length())
            );
            
            atom1.velocity.add(frictionImpulse.clone().multiplyScalar(atom2.weight / totalMass));
            atom2.velocity.sub(frictionImpulse.clone().multiplyScalar(atom1.weight / totalMass));
        }
        
        // إطلاق حدث التصادم
        this.triggerEvent('onCollision', { atom1, atom2, impulse: Math.abs(impulse) });
    }
    
    // تطبيق حدود الفضاء
    applyBoundaries(atoms) {
        atoms.forEach(atom => {
            if (atom.fixed) return;
            
            const pos = atom.position;
            const vel = atom.velocity;
            const radius = atom.radius;
            
            // فحص الحدود في كل اتجاه
            ['x', 'y', 'z'].forEach(axis => {
                const min = this.boundaries.min[axis] + radius;
                const max = this.boundaries.max[axis] - radius;
                
                if (pos[axis] < min) {
                    pos[axis] = min;
                    if (this.boundaries.type === 'elastic') {
                        vel[axis] = -vel[axis] * this.boundaries.walls.restitution;
                    } else if (this.boundaries.type === 'absorbing') {
                        vel[axis] = 0;
                    }
                } else if (pos[axis] > max) {
                    pos[axis] = max;
                    if (this.boundaries.type === 'elastic') {
                        vel[axis] = -vel[axis] * this.boundaries.walls.restitution;
                    } else if (this.boundaries.type === 'absorbing') {
                        vel[axis] = 0;
                    }
                }
            });
        });
    }
    
    // اكتشاف تكوين الروابط التلقائي
    detectBondFormation(atoms, molecules) {
        const newBonds = [];
        
        for (let i = 0; i < atoms.length; i++) {
            const atom1 = atoms[i];
            const nearbyAtoms = this.spatialGrid.enabled ? 
                               this.getNearbyAtoms(atom1) : 
                               atoms.slice(i + 1);
            
            nearbyAtoms.forEach(atom2 => {
                if (atom1 === atom2 || atom1.bonds.has(atom2)) return;
                
                const distance = atom1.distanceTo(atom2);
                const bondingDistance = (atom1.covalentRadius + atom2.covalentRadius) * 1.2;
                
                if (distance <= bondingDistance && atom1.canBondWith(atom2)) {
                    // فحص الطاقة والظروف المناسبة لتكوين الرابطة
                    const kineticEnergy = 0.5 * atom1.weight * atom1.velocity.lengthSq() +
                                         0.5 * atom2.weight * atom2.velocity.lengthSq();
                    
                    const activationEnergy = 50; // طاقة التنشيط المطلوبة (مبسطة)
                    
                    if (kineticEnergy > activationEnergy) {
                        const bondType = atom1.determineBondType(atom2);
                        newBonds.push({ atom1, atom2, bondType });
                    }
                }
            });
        }
        
        // تطبيق الروابط الجديدة
        newBonds.forEach(({ atom1, atom2, bondType }) => {
            this.formBond(atom1, atom2, bondType, molecules);
        });
        
        return newBonds;
    }
    
    // تكوين رابطة
    formBond(atom1, atom2, bondType, molecules) {
        atom1.bonds.add(atom2);
        atom2.bonds.add(atom1);
        atom1.currentLinks++;
        atom2.currentLinks++;
        
        // البحث عن الجزيئات التي تنتمي إليها الذرات
        const mol1 = atom1.parentMolecule;
        const mol2 = atom2.parentMolecule;
        
        if (mol1 && mol2 && mol1 !== mol2) {
            // دمج الجزيئين
            this.mergeMolecules(mol1, mol2, molecules);
        } else if (!mol1 && !mol2) {
            // إنشاء جزيء جديد
            const newMolecule = new AdvancedMolecule([atom1, atom2]);
            newMolecule.addBond(atom1, atom2, bondType);
            molecules.push(newMolecule);
        } else if (mol1 && !mol2) {
            // إضافة الذرة الثانية إلى الجزيء الأول
            mol1.addAtom(atom2);
            mol1.addBond(atom1, atom2, bondType);
        } else if (!mol1 && mol2) {
            // إضافة الذرة الأولى إلى الجزيء الثاني
            mol2.addAtom(atom1);
            mol2.addBond(atom1, atom2, bondType);
        }
        
        this.triggerEvent('onBondFormation', { atom1, atom2, bondType });
    }
    
    // دمج الجزيئات
    mergeMolecules(mol1, mol2, molecules) {
        // نقل جميع ذرات mol2 إلى mol1
        mol2.atoms.forEach(atom => {
            mol1.addAtom(atom);
        });
        
        // نقل جميع روابط mol2 إلى mol1
        mol2.bonds.forEach((bondInfo, bondKey) => {
            mol1.bonds.set(bondKey, bondInfo);
        });
        
        // إزالة mol2 من القائمة
        const index = molecules.indexOf(mol2);
        if (index > -1) {
            molecules.splice(index, 1);
        }
        
        // تحديث خصائص mol1
        mol1.updateProperties();
        
        this.triggerEvent('onMoleculeFormation', { resultMolecule: mol1, mergedMolecule: mol2 });
    }
    
    // حساب الإحصائيات
    calculateStatistics(atoms, molecules) {
        const startTime = performance.now();
        
        this.stats.totalAtoms = atoms.length;
        this.stats.totalMolecules = molecules.length;
        this.stats.totalBonds = molecules.reduce((total, mol) => total + mol.bonds.size, 0);
        
        // حساب الطاقات
        let totalKinetic = 0;
        let totalPotential = 0;
        
        atoms.forEach(atom => {
            // الطاقة الحركية
            const kineticEnergy = 0.5 * atom.weight * atom.velocity.lengthSq();
            totalKinetic += kineticEnergy;
            atom.energy = kineticEnergy;
            
            // الطاقة الكامنة
            const potentialEnergy = atom.calculateTotalPotentialEnergy(atoms);
            totalPotential += potentialEnergy;
        });
        
        this.stats.kineticEnergy = totalKinetic;
        this.stats.potentialEnergy = totalPotential / 2; // تقسيم على 2 لتجنب العد المزدوج
        this.stats.totalEnergy = this.stats.kineticEnergy + this.stats.potentialEnergy;
        
        // حساب درجة الحرارة (من الطاقة الحركية)
        const avgKineticEnergy = totalKinetic / atoms.length;
        const k = 1.38064852e-23; // ثابت بولتزمان
        this.stats.temperature = (2 * avgKineticEnergy) / (3 * k) || 0;
        
        // حساب الكثافة
        const volume = Math.pow(this.dynamicSpace.currentSize, 3);
        this.stats.density = this.stats.totalAtoms / volume;
        
        // حساب الضغط (مبسط)
        const avgVelocity = Math.sqrt(totalKinetic / atoms.length) || 0;
        this.stats.pressure = this.stats.density * avgVelocity * avgVelocity * 0.1;
        
        this.stats.frameTime = performance.now() - startTime;
        this.stats.lastUpdateTime = Date.now();
    }
    
    // إطلاق الأحداث
    triggerEvent(eventType, data) {
        if (this.events[eventType]) {
            this.events[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${eventType} event handler:`, error);
                }
            });
        }
    }
    
    // إضافة مستمع للأحداث
    addEventListener(eventType, callback) {
        if (this.events[eventType]) {
            this.events[eventType].push(callback);
        }
    }
    
    // إزالة مستمع للأحداث
    removeEventListener(eventType, callback) {
        if (this.events[eventType]) {
            const index = this.events[eventType].indexOf(callback);
            if (index > -1) {
                this.events[eventType].splice(index, 1);
            }
        }
    }
    
    // التحديث الرئيسي للمحرك
    update(atoms, molecules) {
        if (this.paused && !this.stepMode) return;
        
        const startTime = performance.now();
        
        // تحديث الشبكة المكانية
        if (this.spatialGrid.needsUpdate) {
            this.updateSpatialGrid(atoms);
        }
        
        // تحديث حجم الفضاء الديناميكي
        this.updateDynamicSpace(atoms);
        
        // تطبيق القوى
        atoms.forEach(atom => {
            if (atom.fixed || atom.frozen) return;
            
            atom.acceleration.set(0, 0, 0);
            
            // الجاذبية
            if (this.gravity !== 0) {
                atom.acceleration.y -= this.gravity;
            }
            
            // القوى بين الذرات
            const nearbyAtoms = this.spatialGrid.enabled ? 
                               this.getNearbyAtoms(atom) : 
                               atoms.filter(other => other !== atom);
            
            nearbyAtoms.forEach(otherAtom => {
                // قوة لينارد-جونز
                const ljForce = this.calculateLennardJonesForce(atom, otherAtom);
                atom.acceleration.add(ljForce.divideScalar(atom.weight));
                
                // قوة مورس للروابط
                const morseForce = this.calculateMorseForce(atom, otherAtom);
                atom.acceleration.add(morseForce.divideScalar(atom.weight));
                
                // قوة كولوم
                const coulombForce = this.calculateCoulombForce(atom, otherAtom);
                atom.acceleration.add(coulombForce.divideScalar(atom.weight));
                
                // قوى فان دير فالس
                const vdwForce = this.calculateVanDerWaalsForce(atom, otherAtom);
                atom.acceleration.add(vdwForce.divideScalar(atom.weight));
                
                // الروابط الهيدروجينية
                const hBondForce = this.calculateHydrogenBondForce(atom, otherAtom);
                atom.acceleration.add(hBondForce.divideScalar(atom.weight));
            });
        });
        
        // تطبيق الحركة الحرارية
        this.applyThermalForces(atoms);
        
        // تكامل السرعة والموقع (Verlet integration)
        atoms.forEach(atom => {
            if (atom.fixed || atom.frozen) return;
            
            // تحديث السرعة
            atom.velocity.add(atom.acceleration.clone().multiplyScalar(this.timeStep));
            
            // تطبيق المقاومة
            atom.velocity.multiplyScalar(this.damping);
            
            // تحديث الموقع
            atom.position.add(atom.velocity.clone().multiplyScalar(this.timeStep));
            
            // تحديث تاريخ الحركة
            atom.updatePositionHistory();
            
            // تحديث السرعة المحسوبة
            atom.speed = atom.velocity.length();
        });
        
        // فحص التصادمات
        this.handleAdvancedCollisions(atoms);
        
        // تطبيق حدود الفضاء
        this.applyBoundaries(atoms);
        
        // اكتشاف تكوين الروابط
        this.detectBondFormation(atoms, molecules);
        
        // تحديث شبكات الروابط في الجزيئات
        molecules.forEach(molecule => {
            molecule.updateBondMeshes();
        });
        
        // حساب الإحصائيات
        this.calculateStatistics(atoms, molecules);
        
        // إعادة تعيين وضع الخطوة الواحدة
        if (this.stepMode) {
            this.stepMode = false;
            this.paused = true;
        }
        
        // تحديث الشبكة المكانية للإطار التالي
        this.spatialGrid.needsUpdate = true;
    }
    
    // تشغيل خطوة واحدة
    step(atoms, molecules) {
        this.stepMode = true;
        this.paused = false;
        this.update(atoms, molecules);
    }
    
    // إيقاف/تشغيل المحاكاة
    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }
    
    // إعادة تعيين المحرك
    reset() {
        this.paused = false;
        this.stepMode = false;
        this.initializeSpatialGrid();
        
        // إعادة تعيين الإحصائيات
        Object.keys(this.stats).forEach(key => {
            if (typeof this.stats[key] === 'number') {
                this.stats[key] = 0;
            }
        });
    }
    
    // تصدير إعدادات المحرك
    exportSettings() {
        return {
            gravity: this.gravity,
            damping: this.damping,
            timeStep: this.timeStep,
            dynamicSpace: { ...this.dynamicSpace },
            forces: JSON.parse(JSON.stringify(this.forces)),
            collision: { ...this.collision },
            boundaries: JSON.parse(JSON.stringify(this.boundaries))
        };
    }
    
    // استيراد إعدادات المحرك
    importSettings(settings) {
        Object.assign(this, settings);
        this.updateBoundaries();
    }
}

// تصدير الفئة للاستخدام كوحدة
window.AdvancedPhysicsEngine = AdvancedPhysicsEngine;

