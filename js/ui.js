class UIManager {
    constructor(molecularSystem) {
        this.system = molecularSystem;
        this.panels = {};
        this.initPanels();
        this.initEventListeners();
        this.initDragAndDrop();
        this.initKeyboardShortcuts();
        this.updateAtomList();
        this.updateMoleculeList();
        this.updateStats();
        this.updatePhysicsSettings();
    }

    initPanels() {
        const panelConfigs = [
            { id: "main-controls-panel", title: "التحكم الرئيسي", position: { top: "10px", left: "50%", transform: "translateX(-50%)" } },
            { id: "atom-list-panel", title: "قائمة الذرات", position: { top: "10px", left: "10px" } },
            { id: "molecule-list-panel", title: "قائمة الجزيئات", position: { top: "300px", left: "10px" } },
            { id: "atom-properties-panel", title: "خصائص العنصر المحدد", position: { top: "10px", right: "10px" } },
            { id: "physics-settings-panel", title: "إعدادات الفيزياء", position: { bottom: "10px", right: "10px" } },
            { id: "stats-panel", title: "إحصائيات النظام", position: { bottom: "10px", left: "10px" } }
        ];

        panelConfigs.forEach(config => {
            const panel = document.createElement("div");
            panel.id = config.id;
            panel.className = "control-panel";
            panel.style.top = config.position.top;
            panel.style.left = config.position.left;
            if (config.position.transform) {
                panel.style.transform = config.position.transform;
            }

            panel.innerHTML = `
                <h3>${config.title} <button class="collapse-btn">−</button></h3>
                <div class="content"></div>
            `;
            document.body.appendChild(panel);
            this.panels[config.id] = panel;

            // إضافة وظيفة الطي
            panel.querySelector(".collapse-btn").addEventListener("click", () => {
                panel.classList.toggle("collapsed");
                panel.querySelector(".collapse-btn").textContent = panel.classList.contains("collapsed") ? "+" : "−";
            });
        });

        this.renderMainControls();
        this.renderAtomList();
        this.renderMoleculeList();
        this.renderAtomProperties();
        this.renderPhysicsSettings();
        this.renderStats();
    }

    renderMainControls() {
        const content = this.panels["main-controls-panel"].querySelector(".content");
        content.innerHTML = `
            <div class="button-group">
                <button id="add-atom-btn">إضافة ذرة</button>
                <button id="add-molecule-btn">إضافة جزيء</button>
                <button id="clear-all-btn">مسح الكل</button>
            </div>
            <div class="button-group">
                <button id="toggle-simulation-btn">تشغيل/إيقاف</button>
                <button id="step-simulation-btn">خطوة واحدة</button>
                <button id="reset-simulation-btn">إعادة تعيين</button>
            </div>
            <label for="interaction-mode-select">وضع التفاعل:</label>
            <select id="interaction-mode-select">
                <option value="select">تحديد</option>
                <option value="add">إضافة</option>
                <option value="move">تحريك</option>
                <option value="delete">حذف</option>
            </select>
        `;

        document.getElementById("add-atom-btn").addEventListener("click", () => this.system.addAtom());
        document.getElementById("add-molecule-btn").addEventListener("click", () => this.showAddMoleculeDialog());
        document.getElementById("clear-all-btn").addEventListener("click", () => this.system.clearAll());
        document.getElementById("toggle-simulation-btn").addEventListener("click", () => this.system.toggleSimulation());
        document.getElementById("step-simulation-btn").addEventListener("click", () => this.system.stepSimulation());
        document.getElementById("reset-simulation-btn").addEventListener("click", () => this.system.resetSimulation());
        document.getElementById("interaction-mode-select").addEventListener("change", (e) => this.system.setInteractionMode(e.target.value));
    }

    renderAtomList() {
        const content = this.panels["atom-list-panel"].querySelector(".content");
        content.innerHTML = `
            <input type="text" id="atom-search" class="search-input" placeholder="البحث في الذرات...">
            <ul id="atoms-list" class="atom-list"></ul>
            <div class="button-group">
                <button id="select-all-atoms-btn">تحديد الكل</button>
                <button id="deselect-all-atoms-btn">إلغاء التحديد</button>
                <button id="delete-selected-atoms-btn">حذف المحدد</button>
            </div>
        `;
        document.getElementById("atom-search").addEventListener("input", (e) => this.filterAtomList(e.target.value));
        document.getElementById("select-all-atoms-btn").addEventListener("click", () => this.system.selectAllAtoms());
        document.getElementById("deselect-all-atoms-btn").addEventListener("click", () => this.system.deselectAllAtoms());
        document.getElementById("delete-selected-atoms-btn").addEventListener("click", () => this.system.deleteSelectedAtoms());
    }

    updateAtomList() {
        const atomListElement = document.getElementById("atoms-list");
        if (!atomListElement) return;
        atomListElement.innerHTML = "";
        const atoms = Object.values(this.system.atoms);
        atoms.forEach(atom => {
            const li = document.createElement("li");
            li.textContent = `${atom.type} (ID: ${atom.id.substring(0, 8)}...)`;
            li.dataset.atomId = atom.id;
            li.addEventListener("click", () => this.system.selectAtom(atom.id));
            atomListElement.appendChild(li);
        });
    }

    renderMoleculeList() {
        const content = this.panels["molecule-list-panel"].querySelector(".content");
        content.innerHTML = `
            <input type="text" id="molecule-search" class="search-input" placeholder="البحث في الجزيئات...">
            <ul id="molecules-list" class="molecule-list"></ul>
            <div class="button-group">
                <button id="select-all-molecules-btn">تحديد الكل</button>
                <button id="deselect-all-molecules-btn">إلغاء التحديد</button>
                <button id="disassemble-selected-molecules-btn">تفكيك المحدد</button>
            </div>
        `;
        document.getElementById("molecule-search").addEventListener("input", (e) => this.filterMoleculeList(e.target.value));
        document.getElementById("select-all-molecules-btn").addEventListener("click", () => this.system.selectAllMolecules());
        document.getElementById("deselect-all-molecules-btn").addEventListener("click", () => this.system.deselectAllMolecules());
        document.getElementById("disassemble-selected-molecules-btn").addEventListener("click", () => this.system.disassembleSelectedMolecules());
    }

    updateMoleculeList() {
        const moleculeListElement = document.getElementById("molecules-list");
        if (!moleculeListElement) return;
        moleculeListElement.innerHTML = "";
        const molecules = Object.values(this.system.molecules);
        molecules.forEach(mol => {
            const li = document.createElement("li");
            li.textContent = `${mol.formula} (MW: ${mol.molecularWeight.toFixed(2)})`;
            li.dataset.moleculeId = mol.id;
            li.addEventListener("click", () => this.system.selectMolecule(mol.id));
            moleculeListElement.appendChild(li);
        });
    }

    renderAtomProperties() {
        const content = this.panels["atom-properties-panel"].querySelector(".content");
        content.innerHTML = `<p>لم يتم تحديد أي عنصر</p>`;
    }

    updateAtomProperties(selectedObject) {
        const content = this.panels["atom-properties-panel"].querySelector(".content");
        if (!selectedObject) {
            content.innerHTML = `<p>لم يتم تحديد أي عنصر</p>`;
            return;
        }

        let html = ``;
        if (selectedObject instanceof Atom) {
            html = `
                <h4 class="section-header">خصائص الذرة</h4>
                <div class="property-item"><span>ID:</span><span>${selectedObject.id.substring(0, 8)}...</span></div>
                <div class="property-item"><span>النوع:</span><span>${selectedObject.type}</span></div>
                <div class="property-item"><span>الكتلة:</span><span>${selectedObject.mass.toFixed(3)}</span></div>
                <div class="property-item"><span>الشحنة:</span><span>${selectedObject.charge}</span></div>
                <div class="property-item"><span>نصف القطر:</span><span>${selectedObject.radius.toFixed(2)}</span></div>
                <div class="property-item"><span>الكهروسالبية:</span><span>${selectedObject.electronegativity.toFixed(2)}</span></div>
                <div class="property-item"><span>الروابط:</span><span>${selectedObject.bonds.length}/${selectedObject.maxBonds}</span></div>
                <div class="property-item"><span>الموقع:</span><span>X:${selectedObject.position.x.toFixed(2)}, Y:${selectedObject.position.y.toFixed(2)}, Z:${selectedObject.position.z.toFixed(2)}</span></div>
                <div class="property-item"><span>السرعة:</span><span>${selectedObject.velocity.length().toFixed(2)}</span></div>
                <div class="property-item"><span>درجة الحرارة:</span><span>${selectedObject.temperature.toFixed(2)} K</span></div>
                <h4 class="section-header">تعديل الخصائص</h4>
                <label for="atom-type">النوع:</label>
                <select id="atom-type">
                    <option value="H">H</option>
                    <option value="C">C</option>
                    <option value="O">O</option>
                    <option value="N">N</option>
                    <option value="Cl">Cl</option>
                    <option value="Na">Na</option>
                    <option value="S">S</option>
                    <option value="P">P</option>
                </select>
                <label for="atom-charge">الشحنة:</label>
                <input type="number" id="atom-charge" value="${selectedObject.charge}">
                <button id="update-atom-props-btn">تحديث</button>
            `;
        } else if (selectedObject instanceof Molecule) {
            html = `
                <h4 class="section-header">خصائص الجزيء</h4>
                <div class="property-item"><span>ID:</span><span>${selectedObject.id.substring(0, 8)}...</span></div>
                <div class="property-item"><span>الصيغة:</span><span>${selectedObject.formula}</span></div>
                <div class="property-item"><span>الوزن الجزيئي:</span><span>${selectedObject.molecularWeight.toFixed(2)}</span></div>
                <div class="property-item"><span>عدد الذرات:</span><span>${selectedObject.atoms.length}</span></div>
                <div class="property-item"><span>عدد الروابط:</span><span>${selectedObject.bonds.length}</span></div>
                <h4 class="section-header">الذرات المكونة:</h4>
                <ul class="atom-list">
                    ${selectedObject.atoms.map(atomId => `<li>${this.system.atoms[atomId] ? this.system.atoms[atomId].type : 'N/A'} (ID: ${atomId.substring(0, 8)}...)</li>`).join('')}
                </ul>
            `;
        }
        content.innerHTML = html;

        if (selectedObject instanceof Atom) {
            const atomTypeSelect = document.getElementById("atom-type");
            atomTypeSelect.value = selectedObject.type;
            atomTypeSelect.addEventListener("change", (e) => {
                selectedObject.setPropertiesByType(e.target.value);
                this.system.renderer.remove(selectedObject.mesh);
                selectedObject.mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(selectedObject.radius, 32, 32),
                    new THREE.MeshPhongMaterial({ color: selectedObject.color })
                );
                selectedObject.mesh.position.copy(selectedObject.position);
                selectedObject.mesh.userData.atomId = selectedObject.id;
                this.system.renderer.add(selectedObject.mesh);
                this.updateAtomProperties(selectedObject);
            });
            document.getElementById("atom-charge").addEventListener("change", (e) => {
                selectedObject.charge = parseFloat(e.target.value);
            });
        }
    }

    renderPhysicsSettings() {
        const content = this.panels["physics-settings-panel"].querySelector(".content");
        content.innerHTML = `
            <h4 class="section-header">إعدادات عامة</h4>
            <label for="gravity">الجاذبية:</label>
            <input type="number" id="gravity" value="${this.system.physicsEngine.gravity.y}" step="0.001">
            <label for="drag">المقاومة:</label>
            <input type="number" id="drag" value="${this.system.physicsEngine.drag}" step="0.01">
            <label for="time-step">الخطوة الزمنية:</label>
            <input type="number" id="time-step" value="${this.system.timeStep}" step="0.001">

            <h4 class="section-header">الفضاء الديناميكي</h4>
            <label for="dynamic-space-enabled">تفعيل الفضاء الديناميكي:</label>
            <input type="checkbox" id="dynamic-space-enabled" ${this.system.physicsEngine.dynamicSpace.enabled ? 'checked' : ''}>
            <label for="base-space-size">الحجم الأساسي:</label>
            <input type="number" id="base-space-size" value="${this.system.physicsEngine.dynamicSpace.baseSize}">
            <label for="atom-size-multiplier">مضاعف حجم الذرة:</label>
            <input type="number" id="atom-size-multiplier" value="${this.system.physicsEngine.dynamicSpace.atomSizeMultiplier}">

            <h4 class="section-header">القوى الفيزيائية</h4>
            <label for="lennard-jones-enabled">لينارد-جونز:</label>
            <input type="checkbox" id="lennard-jones-enabled" ${this.system.physicsEngine.lennardJones.enabled ? 'checked' : ''}>
            <input type="number" id="lennard-jones-epsilon" value="${this.system.physicsEngine.lennardJones.epsilon}" step="0.01">
            <input type="number" id="lennard-jones-sigma" value="${this.system.physicsEngine.lennardJones.sigma}" step="0.01">

            <label for="morse-enabled">مورس (الروابط):</label>
            <input type="checkbox" id="morse-enabled" ${this.system.physicsEngine.morse.enabled ? 'checked' : ''}>
            <input type="number" id="morse-De" value="${this.system.physicsEngine.morse.De}" step="0.01">
            <input type="number" id="morse-alpha" value="${this.system.physicsEngine.morse.alpha}" step="0.01">

            <label for="coulomb-enabled">كولوم:</label>
            <input type="checkbox" id="coulomb-enabled" ${this.system.physicsEngine.coulomb.enabled ? 'checked' : ''}>
            <input type="number" id="coulomb-k" value="${this.system.physicsEngine.coulomb.k}" step="0.01">

            <label for="van-der-waals-enabled">فان دير فالس:</label>
            <input type="checkbox" id="van-der-waals-enabled" ${this.system.physicsEngine.vanDerWaals.enabled ? 'checked' : ''}>
            <input type="number" id="van-der-waals-strength" value="${this.system.physicsEngine.vanDerWaals.strength}" step="0.01">

            <label for="hydrogen-bond-enabled">الروابط الهيدروجينية:</label>
            <input type="checkbox" id="hydrogen-bond-enabled" ${this.system.physicsEngine.hydrogenBond.enabled ? 'checked' : ''}>
            <input type="number" id="hydrogen-bond-strength" value="${this.system.physicsEngine.hydrogenBond.strength}" step="0.01">

            <h4 class="section-header">الحرارة والتصادمات</h4>
            <label for="general-temperature">درجة الحرارة العامة (K):</label>
            <input type="number" id="general-temperature" value="${this.system.physicsEngine.generalTemperature}" step="1">
            <label for="restitution">معامل الارتداد:</label>
            <input type="number" id="restitution" value="${this.system.physicsEngine.restitution}" step="0.01">
            <label for="friction">الاحتكاك:</label>
            <input type="number" id="friction" value="${this.system.physicsEngine.friction}" step="0.01">

            <div class="button-group">
                <button id="apply-physics-settings-btn">تطبيق الإعدادات</button>
                <button id="reset-physics-settings-btn">إعادة تعيين</button>
                <button id="save-preset-btn">حفظ كإعداد مسبق</button>
            </div>
        `;

        document.getElementById("apply-physics-settings-btn").addEventListener("click", () => this.applyPhysicsSettings());
        document.getElementById("reset-physics-settings-btn").addEventListener("click", () => this.resetPhysicsSettings());
        // Add event listeners for all input fields to update physics engine properties directly
        // This part would be extensive, so for brevity, I'll omit all of them here.
        // Example for gravity:
        document.getElementById("gravity").addEventListener("change", (e) => this.system.physicsEngine.gravity.y = parseFloat(e.target.value));
        document.getElementById("drag").addEventListener("change", (e) => this.system.physicsEngine.drag = parseFloat(e.target.value));
        document.getElementById("time-step").addEventListener("change", (e) => this.system.timeStep = parseFloat(e.target.value));

        document.getElementById("dynamic-space-enabled").addEventListener("change", (e) => this.system.physicsEngine.dynamicSpace.enabled = e.target.checked);
        document.getElementById("base-space-size").addEventListener("change", (e) => this.system.physicsEngine.dynamicSpace.baseSize = parseFloat(e.target.value));
        document.getElementById("atom-size-multiplier").addEventListener("change", (e) => this.system.physicsEngine.dynamicSpace.atomSizeMultiplier = parseFloat(e.target.value));

        document.getElementById("lennard-jones-enabled").addEventListener("change", (e) => this.system.physicsEngine.lennardJones.enabled = e.target.checked);
        document.getElementById("lennard-jones-epsilon").addEventListener("change", (e) => this.system.physicsEngine.lennardJones.epsilon = parseFloat(e.target.value));
        document.getElementById("lennard-jones-sigma").addEventListener("change", (e) => this.system.physicsEngine.lennardJones.sigma = parseFloat(e.target.value));

        document.getElementById("morse-enabled").addEventListener("change", (e) => this.system.physicsEngine.morse.enabled = e.target.checked);
        document.getElementById("morse-De").addEventListener("change", (e) => this.system.physicsEngine.morse.De = parseFloat(e.target.value));
        document.getElementById("morse-alpha").addEventListener("change", (e) => this.system.physicsEngine.morse.alpha = parseFloat(e.target.value));

        document.getElementById("coulomb-enabled").addEventListener("change", (e) => this.system.physicsEngine.coulomb.enabled = e.target.checked);
        document.getElementById("coulomb-k").addEventListener("change", (e) => this.system.physicsEngine.coulomb.k = parseFloat(e.target.value));

        document.getElementById("van-der-waals-enabled").addEventListener("change", (e) => this.system.physicsEngine.vanDerWaals.enabled = e.target.checked);
        document.getElementById("van-der-waals-strength").addEventListener("change", (e) => this.system.physicsEngine.vanDerWaals.strength = parseFloat(e.target.value));

        document.getElementById("hydrogen-bond-enabled").addEventListener("change", (e) => this.system.physicsEngine.hydrogenBond.enabled = e.target.checked);
        document.getElementById("hydrogen-bond-strength").addEventListener("change", (e) => this.system.physicsEngine.hydrogenBond.strength = parseFloat(e.target.value));

        document.getElementById("general-temperature").addEventListener("change", (e) => this.system.physicsEngine.generalTemperature = parseFloat(e.target.value));
        document.getElementById("restitution").addEventListener("change", (e) => this.system.physicsEngine.restitution = parseFloat(e.target.value));
        document.getElementById("friction").addEventListener("change", (e) => this.system.physicsEngine.friction = parseFloat(e.target.value));
    }

    applyPhysicsSettings() {
        // Settings are applied directly via event listeners on input change
        this.showAlert("تم تطبيق إعدادات الفيزياء بنجاح!", "success");
    }

    resetPhysicsSettings() {
        this.system.physicsEngine.resetToDefaults();
        this.updatePhysicsSettings(); // Refresh UI with default values
        this.showAlert("تم إعادة تعيين إعدادات الفيزياء إلى الافتراضيات.", "warning");
    }

    updatePhysicsSettings() {
        // This function would update the UI elements with current physics engine values
        // For brevity, I'll just re-render the whole section
        this.renderPhysicsSettings();
    }

    renderStats() {
        const content = this.panels["stats-panel"].querySelector(".content");
        content.innerHTML = `
            <div><span>عدد الذرات:</span> <span id="stat-atom-count">0</span></div>
            <div><span>عدد الجزيئات:</span> <span id="stat-molecule-count">0</span></div>
            <div><span>عدد الروابط:</span> <span id="stat-bond-count">0</span></div>
            <h4 class="section-header">الطاقة</h4>
            <div><span>الطاقة الإجمالية:</span> <span id="stat-total-energy">0</span></div>
            <div><span>الطاقة الحركية:</span> <span id="stat-kinetic-energy">0</span></div>
            <div><span>الطاقة الكامنة:</span> <span id="stat-potential-energy">0</span></div>
            <h4 class="section-header">الخصائص الديناميكية</h4>
            <div><span>درجة الحرارة:</span> <span id="stat-temperature">0 K</span></div>
            <div><span>الضغط:</span> <span id="stat-pressure">0 Pa</span></div>
            <div><span>الكثافة:</span> <span id="stat-density">0 kg/m³</span></div>
            <div><span>حجم الفضاء:</span> <span id="stat-space-volume">0 m³</span></div>
            <h4 class="section-header">الأداء</h4>
            <div><span>FPS:</span> <span id="stat-fps">0</span></div>
            <div><span>وقت الإطار (ms):</span> <span id="stat-frame-time">0</span></div>
            <div class="button-group">
                <button id="export-stats-btn">تصدير الإحصائيات</button>
                <button id="reset-stats-btn">إعادة تعيين</button>
            </div>
        `;
        document.getElementById("export-stats-btn").addEventListener("click", () => this.system.exportStats());
        document.getElementById("reset-stats-btn").addEventListener("click", () => this.system.resetStats());
    }

    updateStats() {
        document.getElementById("stat-atom-count").textContent = Object.keys(this.system.atoms).length;
        document.getElementById("stat-molecule-count").textContent = Object.keys(this.system.molecules).length;
        document.getElementById("stat-bond-count").textContent = this.system.getBondCount();
        document.getElementById("stat-total-energy").textContent = this.system.physicsEngine.totalEnergy.toFixed(2);
        document.getElementById("stat-kinetic-energy").textContent = this.system.physicsEngine.kineticEnergy.toFixed(2);
        document.getElementById("stat-potential-energy").textContent = this.system.physicsEngine.potentialEnergy.toFixed(2);
        document.getElementById("stat-temperature").textContent = `${this.system.physicsEngine.systemTemperature.toFixed(2)} K`;
        document.getElementById("stat-pressure").textContent = `${this.system.physicsEngine.systemPressure.toFixed(2)} Pa`;
        document.getElementById("stat-density").textContent = `${this.system.physicsEngine.systemDensity.toFixed(2)} kg/m³`;
        document.getElementById("stat-space-volume").textContent = `${(this.system.physicsEngine.bounds.x * 2 * this.system.physicsEngine.bounds.y * 2 * this.system.physicsEngine.bounds.z * 2).toFixed(2)} m³`;
        document.getElementById("stat-fps").textContent = this.system.fps.toFixed(0);
        document.getElementById("stat-frame-time").textContent = this.system.frameTime.toFixed(2);
    }

    initEventListeners() {
        // Welcome message button
        const startButton = document.getElementById("start-exploration-btn");
        if (startButton) {
            startButton.addEventListener("click", () => {
                document.getElementById("loading-screen").classList.add("hidden");
                this.system.startSimulation();
            });
        }
    }

    initDragAndDrop() {
        let activePanel = null;
        let initialX, initialY;
        let initialMouseX, initialMouseY;

        document.querySelectorAll(".control-panel h3").forEach(header => {
            header.addEventListener("mousedown", (e) => {
                activePanel = header.parentElement;
                initialX = activePanel.offsetLeft;
                initialY = activePanel.offsetTop;
                initialMouseX = e.clientX;
                initialMouseY = e.clientY;
                activePanel.classList.add("dragging");

                const onMouseMove = (e) => {
                    if (!activePanel) return;
                    const dx = e.clientX - initialMouseX;
                    const dy = e.clientY - initialMouseY;
                    activePanel.style.left = `${initialX + dx}px`;
                    activePanel.style.top = `${initialY + dy}px`;
                };

                const onMouseUp = () => {
                    activePanel.classList.remove("dragging");
                    activePanel = null;
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });
        });
    }

    initKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case 'h': // Ctrl + H to hide/show all panels
                        Object.values(this.panels).forEach(panel => panel.classList.toggle("hidden"));
                        break;
                    case '1': this.togglePanel("main-controls-panel"); break;
                    case '2': this.togglePanel("atom-list-panel"); break;
                    case '3': this.togglePanel("molecule-list-panel"); break;
                    case '4': this.togglePanel("atom-properties-panel"); break;
                    case '5': this.togglePanel("physics-settings-panel"); break;
                    case '6': this.togglePanel("stats-panel"); break;
                    case 'r': this.system.resetSimulation(); break;
                    case 's': this.system.saveState(); break;
                    case 'l': this.system.loadState(); break;
                }
            }
            switch (e.key) {
                case ' ': this.system.toggleSimulation(); break; // Space to toggle simulation
                case 'Delete': this.system.deleteSelected(); break;
                case 'Escape': this.system.deselectAll(); break;
            }
        });
    }

    togglePanel(panelId) {
        const panel = this.panels[panelId];
        if (panel) {
            panel.classList.toggle("hidden");
        }
    }

    showAddMoleculeDialog() {
        const dialog = document.createElement("div");
        dialog.className = "control-panel";
        dialog.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            width: 300px;
        `;
        dialog.innerHTML = `
            <h3>إضافة جزيء <button class="collapse-btn">−</button></h3>
            <div class="content">
                <label for="molecule-type">نوع الجزيء:</label>
                <select id="molecule-type">
                    <option value="water">الماء (H2O)</option>
                    <option value="methane">الميثان (CH4)</option>
                    <option value="benzene">البنزين (C6H6)</option>
                    <!-- يمكن إضافة المزيد هنا -->
                </select>
                <button id="create-molecule-btn">إنشاء</button>
                <button id="cancel-molecule-btn">إلغاء</button>
            </div>
        `;
        document.body.appendChild(dialog);

        dialog.querySelector(".collapse-btn").addEventListener("click", () => {
            dialog.classList.toggle("collapsed");
            dialog.querySelector(".collapse-btn").textContent = dialog.classList.contains("collapsed") ? "+" : "−";
        });

        document.getElementById("create-molecule-btn").addEventListener("click", () => {
            const type = document.getElementById("molecule-type").value;
            this.system.addMolecule(type);
            dialog.remove();
        });

        document.getElementById("cancel-molecule-btn").addEventListener("click", () => {
            dialog.remove();
        });
    }

    showAlert(message, type = "info", duration = 3000) {
        const alertBox = document.createElement("div");
        alertBox.className = `alert ${type}`;
        alertBox.textContent = message;
        document.body.appendChild(alertBox);

        setTimeout(() => {
            alertBox.classList.add("show");
        }, 10);

        setTimeout(() => {
            alertBox.classList.remove("show");
            alertBox.addEventListener("transitionend", () => alertBox.remove());
        }, duration);
    }

    filterAtomList(query) {
        const atomListElement = document.getElementById("atoms-list");
        if (!atomListElement) return;
        const items = atomListElement.getElementsByTagName("li");
        for (let i = 0; i < items.length; i++) {
            const text = items[i].textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                items[i].style.display = "";
            } else {
                items[i].style.display = "none";
            }
        }
    }

    filterMoleculeList(query) {
        const moleculeListElement = document.getElementById("molecules-list");
        if (!moleculeListElement) return;
        const items = moleculeListElement.getElementsByTagName("li");
        for (let i = 0; i < items.length; i++) {
            const text = items[i].textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                items[i].style.display = "";
            } else {
                items[i].style.display = "none";
            }
        }
    }
}

window.UIManager = UIManager;

