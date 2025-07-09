class MolecularSystem {
    constructor() {
        this.atoms = {}; // تخزين الذرات بواسطة ID
        this.molecules = {}; // تخزين الجزيئات بواسطة ID
        this.renderer = new Renderer3D();
        this.physicsEngine = new PhysicsEngine(Object.values(this.atoms), Object.values(this.molecules), new THREE.Vector3(50, 50, 50)); // حدود افتراضية
        this.uiManager = new UIManager(this);

        this.simulationRunning = false;
        this.lastTime = 0;
        this.timeStep = 1 / 60; // 60 FPS

        this.selectedObject = null; // الذرة أو الجزيء المحدد
        this.interactionMode = "select"; // وضع التفاعل الافتراضي

        this.fps = 0;
        this.frameTime = 0;
        this.frameCounter = 0;
        this.fpsInterval = 1000; // 1 ثانية
        this.lastFpsUpdateTime = 0;

        this.init();
    }

    init() {
        // تهيئة المشهد
        this.renderer.camera.position.z = 100;

        // إضافة ذرة افتراضية للبدء
        this.addAtom(0, 0, 0, "C");

        // بدء حلقة التحديث
        this.animate();
    }

    animate(currentTime) {
        requestAnimationFrame(this.animate.bind(this));

        if (!this.lastTime) this.lastTime = currentTime;
        const deltaTime = (currentTime - this.lastTime) / 1000; // بالثواني
        this.lastTime = currentTime;

        if (this.simulationRunning) {
            this.physicsEngine.update(deltaTime);
            // تحديث مواقع الـ mesh للذرات
            for (const atomId in this.atoms) {
                const atom = this.atoms[atomId];
                atom.mesh.position.copy(atom.position);
            }
        }

        this.renderer.render();
        this.uiManager.updateStats();

        // حساب FPS
        this.frameCounter++;
        if (currentTime > this.lastFpsUpdateTime + this.fpsInterval) {
            this.fps = (this.frameCounter * 1000) / (currentTime - this.lastFpsUpdateTime);
            this.frameTime = (currentTime - this.lastFpsUpdateTime) / this.frameCounter;
            this.frameCounter = 0;
            this.lastFpsUpdateTime = currentTime;
        }
    }

    addAtom(x = 0, y = 0, z = 0, type = "H") {
        const atom = new Atom(x, y, z, type);
        this.atoms[atom.id] = atom;
        this.renderer.add(atom.mesh);
        this.uiManager.updateAtomList();
        this.uiManager.showAlert(`تم إضافة ذرة ${type} بنجاح!`);
    }

    addMolecule(type) {
        let newMolecule = null;
        switch (type) {
            case "water": // H2O
                newMolecule = new Molecule();
                const o = new Atom(0, 0, 0, "O");
                const h1 = new Atom(o.position.x + 1, o.position.y + 1, o.position.z, "H");
                const h2 = new Atom(o.position.x - 1, o.position.y + 1, o.position.z, "H");
                this.atoms[o.id] = o;
                this.atoms[h1.id] = h1;
                this.atoms[h2.id] = h2;
                this.renderer.add(o.mesh);
                this.renderer.add(h1.mesh);
                this.renderer.add(h2.mesh);
                newMolecule.addAtom(o.id);
                newMolecule.addAtom(h1.id);
                newMolecule.addAtom(h2.id);
                newMolecule.addBond(o.id, h1.id);
                newMolecule.addBond(o.id, h2.id);
                break;
            case "methane": // CH4
                newMolecule = new Molecule();
                const c = new Atom(0, 0, 0, "C");
                const h3 = new Atom(c.position.x + 1, c.position.y + 1, c.position.z + 1, "H");
                const h4 = new Atom(c.position.x - 1, c.position.y + 1, c.position.z - 1, "H");
                const h5 = new Atom(c.position.x + 1, c.position.y - 1, c.position.z - 1, "H");
                const h6 = new Atom(c.position.x - 1, c.position.y - 1, c.position.z + 1, "H");
                this.atoms[c.id] = c;
                this.atoms[h3.id] = h3;
                this.atoms[h4.id] = h4;
                this.atoms[h5.id] = h5;
                this.atoms[h6.id] = h6;
                this.renderer.add(c.mesh);
                this.renderer.add(h3.mesh);
                this.renderer.add(h4.mesh);
                this.renderer.add(h5.mesh);
                this.renderer.add(h6.mesh);
                newMolecule.addAtom(c.id);
                newMolecule.addAtom(h3.id);
                newMolecule.addAtom(h4.id);
                newMolecule.addAtom(h5.id);
                newMolecule.addAtom(h6.id);
                newMolecule.addBond(c.id, h3.id);
                newMolecule.addBond(c.id, h4.id);
                newMolecule.addBond(c.id, h5.id);
                newMolecule.addBond(c.id, h6.id);
                break;
            case "benzene": // C6H6
                newMolecule = new Molecule();
                const carbons = [];
                const radius = 2;
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    const carbon = new Atom(x, y, 0, "C");
                    carbons.push(carbon);
                    this.atoms[carbon.id] = carbon;
                    this.renderer.add(carbon.mesh);
                    newMolecule.addAtom(carbon.id);
                }
                // روابط الكربون
                for (let i = 0; i < 6; i++) {
                    newMolecule.addBond(carbons[i].id, carbons[(i + 1) % 6].id);
                }
                // ذرات الهيدروجين
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const x = (radius + 0.8) * Math.cos(angle);
                    const y = (radius + 0.8) * Math.sin(angle);
                    const hydrogen = new Atom(x, y, 0, "H");
                    this.atoms[hydrogen.id] = hydrogen;
                    this.renderer.add(hydrogen.mesh);
                    newMolecule.addAtom(hydrogen.id);
                    newMolecule.addBond(carbons[i].id, hydrogen.id);
                }
                break;
            default:
                this.uiManager.showAlert("نوع الجزيء غير مدعوم!", "error");
                return;
        }

        if (newMolecule) {
            newMolecule.updateProperties(this.atoms);
            this.molecules[newMolecule.id] = newMolecule;
            this.uiManager.updateMoleculeList();
            this.uiManager.updateAtomList(); // قد تتغير قائمة الذرات بعد إضافة جزيء
            this.uiManager.showAlert(`تم إضافة جزيء ${newMolecule.formula} بنجاح!`);
        }
    }

    clearAll() {
        for (const atomId in this.atoms) {
            this.renderer.remove(this.atoms[atomId].mesh);
        }
        this.atoms = {};
        this.molecules = {};
        this.uiManager.updateAtomList();
        this.uiManager.updateMoleculeList();
        this.uiManager.showAlert("تم مسح جميع الذرات والجزيئات.");
    }

    toggleSimulation() {
        this.simulationRunning = !this.simulationRunning;
        this.uiManager.showAlert(this.simulationRunning ? "بدء المحاكاة" : "إيقاف المحاكاة مؤقتاً");
    }

    stepSimulation() {
        this.physicsEngine.update(this.timeStep);
        this.uiManager.showAlert("خطوة واحدة في المحاكاة.");
    }

    resetSimulation() {
        this.clearAll();
        this.addAtom(0, 0, 0, "C"); // إضافة ذرة افتراضية بعد إعادة التعيين
        this.uiManager.showAlert("تم إعادة تعيين المحاكاة.");
    }

    selectAtom(atomId) {
        if (this.selectedObject) {
            // إلغاء تحديد العنصر السابق
            if (this.selectedObject instanceof Atom) {
                this.selectedObject.mesh.material.emissive.setHex(0x000000); // إزالة التوهج
            }
        }
        this.selectedObject = this.atoms[atomId];
        if (this.selectedObject) {
            this.selectedObject.mesh.material.emissive.setHex(0x00ff00); // إضافة توهج أخضر
            this.uiManager.updateAtomProperties(this.selectedObject);
            // تحريك الكاميرا إلى الذرة المحددة
            this.renderer.controls.target.copy(this.selectedObject.position);
            this.renderer.controls.update();
        }
    }

    selectMolecule(moleculeId) {
        if (this.selectedObject) {
            // إلغاء تحديد العنصر السابق
            if (this.selectedObject instanceof Atom) {
                this.selectedObject.mesh.material.emissive.setHex(0x000000);
            }
        }
        this.selectedObject = this.molecules[moleculeId];
        if (this.selectedObject) {
            this.uiManager.updateAtomProperties(this.selectedObject);
            // تحريك الكاميرا إلى مركز الجزيء
            const center = new THREE.Vector3();
            let count = 0;
            for (const atomId of this.selectedObject.atoms) {
                const atom = this.atoms[atomId];
                if (atom) {
                    center.add(atom.position);
                    count++;
                }
            }
            if (count > 0) {
                center.divideScalar(count);
                this.renderer.controls.target.copy(center);
                this.renderer.controls.update();
            }
        }
    }

    deselectAll() {
        if (this.selectedObject) {
            if (this.selectedObject instanceof Atom) {
                this.selectedObject.mesh.material.emissive.setHex(0x000000);
            }
            this.selectedObject = null;
            this.uiManager.updateAtomProperties(null);
        }
    }

    selectAllAtoms() {
        for (const atomId in this.atoms) {
            this.atoms[atomId].mesh.material.emissive.setHex(0x00ff00);
        }
        this.uiManager.showAlert("تم تحديد جميع الذرات.");
    }

    deselectAllAtoms() {
        for (const atomId in this.atoms) {
            this.atoms[atomId].mesh.material.emissive.setHex(0x000000);
        }
        this.uiManager.showAlert("تم إلغاء تحديد جميع الذرات.");
    }

    deleteSelectedAtoms() {
        const atomsToDelete = [];
        for (const atomId in this.atoms) {
            if (this.atoms[atomId].mesh.material.emissive.getHex() === 0x00ff00) { // إذا كانت الذرة محددة
                atomsToDelete.push(atomId);
            }
        }

        atomsToDelete.forEach(atomId => {
            this.renderer.remove(this.atoms[atomId].mesh);
            delete this.atoms[atomId];
            // إزالة الذرة من أي جزيئات
            for (const molId in this.molecules) {
                const molecule = this.molecules[molId];
                molecule.removeAtom(atomId);
                if (molecule.atoms.length === 0) {
                    delete this.molecules[molId]; // حذف الجزيء إذا لم يعد يحتوي على ذرات
                }
            }
        });
        this.uiManager.updateAtomList();
        this.uiManager.updateMoleculeList();
        this.deselectAll();
        this.uiManager.showAlert(`تم حذف ${atomsToDelete.length} ذرة محددة.`);
    }

    selectAllMolecules() {
        for (const molId in this.molecules) {
            const molecule = this.molecules[molId];
            for (const atomId of molecule.atoms) {
                if (this.atoms[atomId]) {
                    this.atoms[atomId].mesh.material.emissive.setHex(0x00ff00);
                }
            }
        }
        this.uiManager.showAlert("تم تحديد جميع الجزيئات.");
    }

    deselectAllMolecules() {
        for (const molId in this.molecules) {
            const molecule = this.molecules[molId];
            for (const atomId of molecule.atoms) {
                if (this.atoms[atomId]) {
                    this.atoms[atomId].mesh.material.emissive.setHex(0x000000);
                }
            }
        }
        this.uiManager.showAlert("تم إلغاء تحديد جميع الجزيئات.");
    }

    disassembleSelectedMolecules() {
        const moleculesToDisassemble = [];
        for (const molId in this.molecules) {
            const molecule = this.molecules[molId];
            // إذا كانت أي ذرة من الجزيء محددة، نعتبر الجزيء كله محدداً للتفكيك
            const isSelected = molecule.atoms.some(atomId => 
                this.atoms[atomId] && this.atoms[atomId].mesh.material.emissive.getHex() === 0x00ff00
            );
            if (isSelected) {
                moleculesToDisassemble.push(molId);
            }
        }

        moleculesToDisassemble.forEach(molId => {
            const molecule = this.molecules[molId];
            const disassembledAtomIds = molecule.disassemble();
            // لا نحتاج لإضافة الذرات مرة أخرى إلى قائمة الذرات لأنها موجودة بالفعل
            // فقط نحذف الجزيء من قائمة الجزيئات
            delete this.molecules[molId];
            this.uiManager.showAlert(`تم تفكيك جزيء ${molecule.formula} بنجاح.`);
        });
        this.uiManager.updateAtomList();
        this.uiManager.updateMoleculeList();
        this.deselectAll();
    }

    deleteSelected() {
        if (this.selectedObject) {
            if (this.selectedObject instanceof Atom) {
                this.deleteSelectedAtoms(); // تعتمد على تحديد الذرة
            } else if (this.selectedObject instanceof Molecule) {
                this.disassembleSelectedMolecules(); // تعتمد على تحديد الجزيء
            }
        }
    }

    setInteractionMode(mode) {
        this.interactionMode = mode;
        this.uiManager.showAlert(`وضع التفاعل: ${mode}`);
    }

    getBondCount() {
        let count = 0;
        for (const molId in this.molecules) {
            count += this.molecules[molId].bonds.length;
        }
        return count;
    }

    exportStats() {
        const stats = {
            atomCount: Object.keys(this.atoms).length,
            moleculeCount: Object.keys(this.molecules).length,
            bondCount: this.getBondCount(),
            totalEnergy: this.physicsEngine.totalEnergy,
            kineticEnergy: this.physicsEngine.kineticEnergy,
            potentialEnergy: this.physicsEngine.potentialEnergy,
            temperature: this.physicsEngine.systemTemperature,
            pressure: this.physicsEngine.systemPressure,
            density: this.physicsEngine.systemDensity,
            spaceVolume: (this.physicsEngine.bounds.x * 2 * this.physicsEngine.bounds.y * 2 * this.physicsEngine.bounds.z * 2),
            fps: this.fps,
            frameTime: this.frameTime,
            timestamp: new Date().toISOString()
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `molecular_stats_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        this.uiManager.showAlert("تم تصدير الإحصائيات بنجاح!");
    }

    resetStats() {
        // لا يوجد شيء لإعادة تعيينه في الإحصائيات بخلاف القيم التي يتم تحديثها ديناميكياً
        this.uiManager.showAlert("تم إعادة تعيين الإحصائيات.");
    }

    saveState() {
        const state = {
            atoms: Object.values(this.atoms).map(atom => ({
                id: atom.id,
                type: atom.type,
                position: atom.position.toArray(),
                velocity: atom.velocity.toArray(),
                charge: atom.charge,
                radius: atom.radius,
                mass: atom.mass,
                color: atom.color,
                bonds: atom.bonds,
                maxBonds: atom.maxBonds,
                electronegativity: atom.electronegativity,
                temperature: atom.temperature
            })),
            molecules: Object.values(this.molecules).map(mol => ({
                id: mol.id,
                atoms: mol.atoms,
                bonds: mol.bonds,
                formula: mol.formula,
                molecularWeight: mol.molecularWeight
            })),
            physicsSettings: {
                gravity: this.physicsEngine.gravity.toArray(),
                drag: this.physicsEngine.drag,
                timeStep: this.timeStep,
                dynamicSpace: this.physicsEngine.dynamicSpace,
                lennardJones: this.physicsEngine.lennardJones,
                morse: this.physicsEngine.morse,
                coulomb: this.physicsEngine.coulomb,
                vanDerWaals: this.physicsEngine.vanDerWaals,
                hydrogenBond: this.physicsEngine.hydrogenBond,
                generalTemperature: this.physicsEngine.generalTemperature,
                restitution: this.physicsEngine.restitution,
                friction: this.physicsEngine.friction
            },
            cameraPosition: this.renderer.camera.position.toArray(),
            cameraTarget: this.renderer.controls.target.toArray()
        };
        localStorage.setItem("molecularSimulationState", JSON.stringify(state));
        this.uiManager.showAlert("تم حفظ حالة المحاكاة بنجاح!");
    }

    loadState() {
        const savedState = localStorage.getItem("molecularSimulationState");
        if (savedState) {
            const state = JSON.parse(savedState);
            this.clearAll(); // مسح الحالة الحالية

            // تحميل الذرات
            state.atoms.forEach(atomData => {
                const atom = new Atom(0, 0, 0, atomData.type, atomData.id);
                atom.position.fromArray(atomData.position);
                atom.velocity.fromArray(atomData.velocity);
                atom.charge = atomData.charge;
                atom.radius = atomData.radius;
                atom.mass = atomData.mass;
                atom.color = atomData.color;
                atom.bonds = atomData.bonds;
                atom.maxBonds = atomData.maxBonds;
                atom.electronegativity = atomData.electronegativity;
                atom.temperature = atomData.temperature;

                atom.mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(atom.radius, 32, 32),
                    new THREE.MeshPhongMaterial({ color: atom.color })
                );
                atom.mesh.position.copy(atom.position);
                atom.mesh.userData.atomId = atom.id;

                this.atoms[atom.id] = atom;
                this.renderer.add(atom.mesh);
            });

            // تحميل الجزيئات
            state.molecules.forEach(molData => {
                const molecule = new Molecule(molData.id);
                molecule.atoms = molData.atoms;
                molecule.bonds = molData.bonds;
                molecule.formula = molData.formula;
                molecule.molecularWeight = molData.molecularWeight;
                this.molecules[molecule.id] = molecule;
            });

            // تحميل إعدادات الفيزياء
            this.physicsEngine.gravity.fromArray(state.physicsSettings.gravity);
            this.physicsEngine.drag = state.physicsSettings.drag;
            this.timeStep = state.physicsSettings.timeStep;
            this.physicsEngine.dynamicSpace = state.physicsSettings.dynamicSpace;
            this.physicsEngine.lennardJones = state.physicsSettings.lennardJones;
            this.physicsEngine.morse = state.physicsSettings.morse;
            this.physicsEngine.coulomb = state.physicsSettings.coulomb;
            this.physicsEngine.vanDerWaals = state.physicsSettings.vanDerWaals;
            this.physicsEngine.hydrogenBond = state.physicsSettings.hydrogenBond;
            this.physicsEngine.generalTemperature = state.physicsSettings.generalTemperature;
            this.physicsEngine.restitution = state.physicsSettings.restitution;
            this.physicsEngine.friction = state.physicsSettings.friction;

            // تحميل موقع الكاميرا
            this.renderer.camera.position.fromArray(state.cameraPosition);
            this.renderer.controls.target.fromArray(state.cameraTarget);
            this.renderer.controls.update();

            this.uiManager.updateAtomList();
            this.uiManager.updateMoleculeList();
            this.uiManager.updatePhysicsSettings();
            this.uiManager.showAlert("تم تحميل حالة المحاكاة بنجاح!");
        } else {
            this.uiManager.showAlert("لا توجد حالة محاكاة محفوظة.", "warning");
        }
    }
}

window.MolecularSystem = MolecularSystem;

// بدء التطبيق عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    window.molecularSystem = new MolecularSystem();
});

