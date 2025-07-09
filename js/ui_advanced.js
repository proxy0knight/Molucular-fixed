class AdvancedUIManager {
    constructor(molecularSystem) {
        this.system = molecularSystem;
        this.selectedAtoms = new Set();
        this.selectedMolecules = new Set();
        this.draggedAtom = null;
        this.isDragging = false;
        
        // عناصر واجهة المستخدم
        this.panels = {
            main: null,
            atomList: null,
            moleculeList: null,
            properties: null,
            physics: null,
            statistics: null,
            controls: null,
            visualization: null
        };
        
        // إعدادات العرض
        this.displaySettings = {
            showAtomLabels: true,
            showBonds: true,
            showMoleculeNames: true,
            showForces: false,
            showTrajectories: false,
            showBoundaries: true,
            atomScale: 1.0,
            bondScale: 1.0,
            labelScale: 1.0
        };
        
        // إعدادات التفاعل
        this.interactionMode = 'select'; // 'select', 'move', 'bond', 'delete'
        this.multiSelect = false;
        this.snapToGrid = false;
        this.gridSize = 0.1;
        
        // تهيئة واجهة المستخدم
        this.initializeUI();
        this.setupEventListeners();
        this.updateUI();
        
        // تحديث دوري لواجهة المستخدم
        setInterval(() => this.updateUI(), 100);
    }
    
    // تهيئة واجهة المستخدم
    initializeUI() {
        this.createMainPanel();
        this.createAtomListPanel();
        this.createMoleculeListPanel();
        this.createPropertiesPanel();
        this.createPhysicsPanel();
        this.createStatisticsPanel();
        this.createControlsPanel();
        this.createVisualizationPanel();
        this.createAdvancedControls();
    }
    
    // إنشاء اللوحة الرئيسية
    createMainPanel() {
        const existingPanel = document.getElementById('main-controls');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        this.panels.main = document.createElement('div');
        this.panels.main.id = 'main-controls';
        this.panels.main.className = 'control-panel main-panel';
        this.panels.main.innerHTML = `
            <div class="panel-header">
                <h3>التحكم الرئيسي</h3>
                <button class="collapse-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
            </div>
            <div class="panel-content">
                <div class="button-group">
                    <button id="add-atom-btn" class="btn primary">إضافة ذرة</button>
                    <button id="add-molecule-btn" class="btn primary">إضافة جزيء</button>
                    <button id="clear-all-btn" class="btn danger">مسح الكل</button>
                </div>
                <div class="button-group">
                    <button id="play-pause-btn" class="btn success">تشغيل/إيقاف</button>
                    <button id="step-btn" class="btn secondary">خطوة واحدة</button>
                    <button id="reset-btn" class="btn warning">إعادة تعيين</button>
                </div>
                <div class="interaction-modes">
                    <label>وضع التفاعل:</label>
                    <select id="interaction-mode">
                        <option value="select">تحديد</option>
                        <option value="move">تحريك</option>
                        <option value="bond">ربط</option>
                        <option value="delete">حذف</option>
                    </select>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panels.main);
    }
    
    // إنشاء لوحة قائمة الذرات
    createAtomListPanel() {
        this.panels.atomList = document.createElement('div');
        this.panels.atomList.id = 'atom-list-panel';
        this.panels.atomList.className = 'control-panel list-panel';
        this.panels.atomList.innerHTML = `
            <div class="panel-header">
                <h3>قائمة الذرات</h3>
                <button class="collapse-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
            </div>
            <div class="panel-content">
                <div class="search-box">
                    <input type="text" id="atom-search" placeholder="البحث في الذرات...">
                </div>
                <div class="list-controls">
                    <button id="select-all-atoms" class="btn small">تحديد الكل</button>
                    <button id="deselect-all-atoms" class="btn small">إلغاء التحديد</button>
                    <button id="delete-selected-atoms" class="btn small danger">حذف المحدد</button>
                </div>
                <div id="atom-list" class="item-list"></div>
            </div>
        `;
        
        document.body.appendChild(this.panels.atomList);
    }
    
    // إنشاء لوحة قائمة الجزيئات
    createMoleculeListPanel() {
        this.panels.moleculeList = document.createElement('div');
        this.panels.moleculeList.id = 'molecule-list-panel';
        this.panels.moleculeList.className = 'control-panel list-panel';
        this.panels.moleculeList.innerHTML = `
            <div class="panel-header">
                <h3>قائمة الجزيئات</h3>
                <button class="collapse-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
            </div>
            <div class="panel-content">
                <div class="search-box">
                    <input type="text" id="molecule-search" placeholder="البحث في الجزيئات...">
                </div>
                <div class="list-controls">
                    <button id="select-all-molecules" class="btn small">تحديد الكل</button>
                    <button id="deselect-all-molecules" class="btn small">إلغاء التحديد</button>
                    <button id="break-selected-molecules" class="btn small warning">تفكيك المحدد</button>
                </div>
                <div id="molecule-list" class="item-list"></div>
            </div>
        `;
        
        document.body.appendChild(this.panels.moleculeList);
    }
    
    // إنشاء لوحة الخصائص
    createPropertiesPanel() {
        this.panels.properties = document.createElement('div');
        this.panels.properties.id = 'properties-panel';
        this.panels.properties.className = 'control-panel properties-panel';
        this.panels.properties.innerHTML = `
            <div class="panel-header">
                <h3>خصائص العنصر المحدد</h3>
                <button class="collapse-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
            </div>
            <div class="panel-content">
                <div id="no-selection" class="no-selection">لم يتم تحديد أي عنصر</div>
                <div id="atom-properties" class="property-group" style="display: none;">
                    <h4>خصائص الذرة</h4>
                    <div class="property-row">
                        <label>النوع:</label>
                        <select id="atom-type">
                            <option value="H">هيدروجين (H)</option>
                            <option value="C">كربون (C)</option>
                            <option value="N">نيتروجين (N)</option>
                            <option value="O">أكسجين (O)</option>
                            <option value="P">فوسفور (P)</option>
                            <option value="S">كبريت (S)</option>
                            <option value="Cl">كلور (Cl)</option>
                            <option value="Fe">حديد (Fe)</option>
                            <option value="Ca">كالسيوم (Ca)</option>
                            <option value="Mg">مغنيسيوم (Mg)</option>
                        </select>
                    </div>
                    <div class="property-row">
                        <label>الوزن:</label>
                        <input type="number" id="atom-weight" step="0.1" min="0.1">
                    </div>
                    <div class="property-row">
                        <label>الشحنة:</label>
                        <input type="number" id="atom-charge" step="0.1">
                    </div>
                    <div class="property-row">
                        <label>عدد الروابط القصوى:</label>
                        <input type="number" id="atom-max-links" min="1" max="8">
                    </div>
                    <div class="property-row">
                        <label>درجة الحرارة (K):</label>
                        <input type="number" id="atom-temperature" min="0" step="10">
                    </div>
                    <div class="property-section">
                        <h5>خصائص لينارد-جونز</h5>
                        <div class="property-row">
                            <label>إبسيلون (ε):</label>
                            <input type="number" id="atom-lj-epsilon" step="0.01" min="0">
                        </div>
                        <div class="property-row">
                            <label>سيجما (σ):</label>
                            <input type="number" id="atom-lj-sigma" step="0.01" min="0">
                        </div>
                    </div>
                    <div class="property-section">
                        <h5>خصائص مورس</h5>
                        <div class="property-row">
                            <label>عمق البئر (De):</label>
                            <input type="number" id="atom-morse-depth" step="0.1" min="0">
                        </div>
                        <div class="property-row">
                            <label>ألفا (α):</label>
                            <input type="number" id="atom-morse-alpha" step="0.1" min="0">
                        </div>
                        <div class="property-row">
                            <label>المسافة التوازنية:</label>
                            <input type="number" id="atom-equilibrium-distance" step="0.01" min="0">
                        </div>
                    </div>
                    <div class="property-actions">
                        <button id="apply-atom-properties" class="btn primary">تطبيق التغييرات</button>
                        <button id="reset-atom-properties" class="btn secondary">إعادة تعيين</button>
                    </div>
                </div>
                <div id="molecule-properties" class="property-group" style="display: none;">
                    <h4>خصائص الجزيء</h4>
                    <div class="property-row">
                        <label>الاسم:</label>
                        <input type="text" id="molecule-name">
                    </div>
                    <div class="property-row">
                        <label>الصيغة:</label>
                        <span id="molecule-formula" class="property-value"></span>
                    </div>
                    <div class="property-row">
                        <label>الوزن الجزيئي:</label>
                        <span id="molecule-weight" class="property-value"></span>
                    </div>
                    <div class="property-row">
                        <label>الشحنة الإجمالية:</label>
                        <span id="molecule-charge" class="property-value"></span>
                    </div>
                    <div class="property-row">
                        <label>الاستقرار:</label>
                        <span id="molecule-stability" class="property-value"></span>
                    </div>
                    <div class="property-row">
                        <label>التفاعلية:</label>
                        <span id="molecule-reactivity" class="property-value"></span>
                    </div>
                    <div class="property-actions">
                        <button id="apply-molecule-properties" class="btn primary">تطبيق التغييرات</button>
                        <button id="break-molecule" class="btn warning">تفكيك الجزيء</button>
                        <button id="clone-molecule" class="btn secondary">نسخ الجزيء</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panels.properties);
    }
    
    // إنشاء لوحة إعدادات الفيزياء
    createPhysicsPanel() {
        this.panels.physics = document.createElement('div');
        this.panels.physics.id = 'physics-panel';
        this.panels.physics.className = 'control-panel physics-panel';
        this.panels.physics.innerHTML = `
            <div class="panel-header">
                <h3>إعدادات الفيزياء</h3>
                <button class="collapse-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
            </div>
            <div class="panel-content">
                <div class="physics-section">
                    <h4>إعدادات عامة</h4>
                    <div class="property-row">
                        <label>الجاذبية:</label>
                        <input type="range" id="gravity-slider" min="0" max="2" step="0.1" value="0">
                        <span id="gravity-value">0</span>
                    </div>
                    <div class="property-row">
                        <label>المقاومة:</label>
                        <input type="range" id="damping-slider" min="0.9" max="1" step="0.01" value="0.99">
                        <span id="damping-value">0.99</span>
                    </div>
                    <div class="property-row">
                        <label>الخطوة الزمنية:</label>
                        <input type="range" id="timestep-slider" min="0.001" max="0.05" step="0.001" value="0.016">
                        <span id="timestep-value">0.016</span>
                    </div>
                </div>
                
                <div class="physics-section">
                    <h4>الفضاء الديناميكي</h4>
                    <div class="property-row">
                        <label>تفعيل الفضاء الديناميكي:</label>
                        <input type="checkbox" id="dynamic-space-enabled" checked>
                    </div>
                    <div class="property-row">
                        <label>الحجم الأساسي:</label>
                        <input type="range" id="base-space-size" min="5" max="50" step="1" value="10">
                        <span id="base-space-value">10</span>
                    </div>
                    <div class="property-row">
                        <label>مضاعف حجم الذرة:</label>
                        <input type="range" id="atom-size-multiplier" min="10" max="200" step="10" value="99">
                        <span id="atom-multiplier-value">99</span>
                    </div>
                </div>
                
                <div class="physics-section">
                    <h4>القوى الفيزيائية</h4>
                    <div class="force-control">
                        <label>لينارد-جونز:</label>
                        <input type="checkbox" id="lj-enabled" checked>
                        <input type="range" id="lj-strength" min="0" max="2" step="0.1" value="1">
                        <span id="lj-strength-value">1.0</span>
                    </div>
                    <div class="force-control">
                        <label>مورس (الروابط):</label>
                        <input type="checkbox" id="morse-enabled" checked>
                        <input type="range" id="morse-strength" min="0" max="2" step="0.1" value="1">
                        <span id="morse-strength-value">1.0</span>
                    </div>
                    <div class="force-control">
                        <label>كولوم:</label>
                        <input type="checkbox" id="coulomb-enabled" checked>
                        <input type="range" id="coulomb-strength" min="0" max="2" step="0.1" value="1">
                        <span id="coulomb-strength-value">1.0</span>
                    </div>
                    <div class="force-control">
                        <label>فان دير فالس:</label>
                        <input type="checkbox" id="vdw-enabled" checked>
                        <input type="range" id="vdw-strength" min="0" max="2" step="0.1" value="0.5">
                        <span id="vdw-strength-value">0.5</span>
                    </div>
                    <div class="force-control">
                        <label>الروابط الهيدروجينية:</label>
                        <input type="checkbox" id="hydrogen-enabled" checked>
                        <input type="range" id="hydrogen-strength" min="0" max="2" step="0.1" value="0.3">
                        <span id="hydrogen-strength-value">0.3</span>
                    </div>
                </div>
                
                <div class="physics-section">
                    <h4>الحرارة والتصادمات</h4>
                    <div class="property-row">
                        <label>درجة الحرارة العامة (K):</label>
                        <input type="range" id="global-temperature" min="0" max="1000" step="10" value="300">
                        <span id="temperature-value">300</span>
                    </div>
                    <div class="property-row">
                        <label>معامل الارتداد:</label>
                        <input type="range" id="restitution" min="0" max="1" step="0.1" value="0.8">
                        <span id="restitution-value">0.8</span>
                    </div>
                    <div class="property-row">
                        <label>الاحتكاك:</label>
                        <input type="range" id="friction" min="0" max="1" step="0.1" value="0.1">
                        <span id="friction-value">0.1</span>
                    </div>
                </div>
                
                <div class="physics-actions">
                    <button id="apply-physics" class="btn primary">تطبيق الإعدادات</button>
                    <button id="reset-physics" class="btn secondary">إعادة تعيين</button>
                    <button id="save-physics-preset" class="btn success">حفظ كإعداد مسبق</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panels.physics);
    }
    
    // إنشاء لوحة الإحصائيات
    createStatisticsPanel() {
        this.panels.statistics = document.createElement('div');
        this.panels.statistics.id = 'statistics-panel';
        this.panels.statistics.className = 'control-panel statistics-panel';
        this.panels.statistics.innerHTML = `
            <div class="panel-header">
                <h3>إحصائيات النظام</h3>
                <button class="collapse-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
            </div>
            <div class="panel-content">
                <div class="stats-grid">
                    <div class="stat-item">
                        <label>عدد الذرات:</label>
                        <span id="stat-atoms">0</span>
                    </div>
                    <div class="stat-item">
                        <label>عدد الجزيئات:</label>
                        <span id="stat-molecules">0</span>
                    </div>
                    <div class="stat-item">
                        <label>عدد الروابط:</label>
                        <span id="stat-bonds">0</span>
                    </div>
                    <div class="stat-item">
                        <label>الطاقة الإجمالية:</label>
                        <span id="stat-total-energy">0</span>
                    </div>
                    <div class="stat-item">
                        <label>الطاقة الحركية:</label>
                        <span id="stat-kinetic-energy">0</span>
                    </div>
                    <div class="stat-item">
                        <label>الطاقة الكامنة:</label>
                        <span id="stat-potential-energy">0</span>
                    </div>
                    <div class="stat-item">
                        <label>درجة الحرارة:</label>
                        <span id="stat-temperature">0</span>
                    </div>
                    <div class="stat-item">
                        <label>الضغط:</label>
                        <span id="stat-pressure">0</span>
                    </div>
                    <div class="stat-item">
                        <label>الكثافة:</label>
                        <span id="stat-density">0</span>
                    </div>
                    <div class="stat-item">
                        <label>حجم الفضاء:</label>
                        <span id="stat-space-size">0</span>
                    </div>
                    <div class="stat-item">
                        <label>FPS:</label>
                        <span id="stat-fps">0</span>
                    </div>
                    <div class="stat-item">
                        <label>وقت الإطار (ms):</label>
                        <span id="stat-frame-time">0</span>
                    </div>
                </div>
                
                <div class="stats-actions">
                    <button id="export-stats" class="btn secondary">تصدير الإحصائيات</button>
                    <button id="reset-stats" class="btn warning">إعادة تعيين</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panels.statistics);
    }
    
    // إنشاء لوحة التحكم في العرض
    createVisualizationPanel() {
        this.panels.visualization = document.createElement('div');
        this.panels.visualization.id = 'visualization-panel';
        this.panels.visualization.className = 'control-panel visualization-panel';
        this.panels.visualization.innerHTML = `
            <div class="panel-header">
                <h3>إعدادات العرض</h3>
                <button class="collapse-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
            </div>
            <div class="panel-content">
                <div class="viz-section">
                    <h4>عرض العناصر</h4>
                    <div class="checkbox-group">
                        <label><input type="checkbox" id="show-atom-labels" checked> تسميات الذرات</label>
                        <label><input type="checkbox" id="show-bonds" checked> الروابط</label>
                        <label><input type="checkbox" id="show-molecule-names" checked> أسماء الجزيئات</label>
                        <label><input type="checkbox" id="show-forces"> القوى</label>
                        <label><input type="checkbox" id="show-trajectories"> مسارات الحركة</label>
                        <label><input type="checkbox" id="show-boundaries" checked> حدود الفضاء</label>
                    </div>
                </div>
                
                <div class="viz-section">
                    <h4>مقاييس العرض</h4>
                    <div class="property-row">
                        <label>حجم الذرات:</label>
                        <input type="range" id="atom-scale" min="0.1" max="3" step="0.1" value="1">
                        <span id="atom-scale-value">1.0</span>
                    </div>
                    <div class="property-row">
                        <label>سمك الروابط:</label>
                        <input type="range" id="bond-scale" min="0.1" max="3" step="0.1" value="1">
                        <span id="bond-scale-value">1.0</span>
                    </div>
                    <div class="property-row">
                        <label>حجم التسميات:</label>
                        <input type="range" id="label-scale" min="0.5" max="2" step="0.1" value="1">
                        <span id="label-scale-value">1.0</span>
                    </div>
                </div>
                
                <div class="viz-section">
                    <h4>ألوان وتأثيرات</h4>
                    <div class="property-row">
                        <label>نمط الألوان:</label>
                        <select id="color-scheme">
                            <option value="element">حسب العنصر</option>
                            <option value="charge">حسب الشحنة</option>
                            <option value="energy">حسب الطاقة</option>
                            <option value="temperature">حسب درجة الحرارة</option>
                            <option value="velocity">حسب السرعة</option>
                        </select>
                    </div>
                    <div class="property-row">
                        <label>شفافية الذرات:</label>
                        <input type="range" id="atom-opacity" min="0.1" max="1" step="0.1" value="1">
                        <span id="atom-opacity-value">1.0</span>
                    </div>
                    <div class="property-row">
                        <label>شفافية الروابط:</label>
                        <input type="range" id="bond-opacity" min="0.1" max="1" step="0.1" value="0.8">
                        <span id="bond-opacity-value">0.8</span>
                    </div>
                </div>
                
                <div class="viz-actions">
                    <button id="apply-visualization" class="btn primary">تطبيق الإعدادات</button>
                    <button id="reset-visualization" class="btn secondary">إعادة تعيين</button>
                    <button id="screenshot" class="btn success">لقطة شاشة</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panels.visualization);
    }
    
    // إنشاء أدوات التحكم المتقدمة
    createAdvancedControls() {
        const advancedPanel = document.createElement('div');
        advancedPanel.id = 'advanced-controls';
        advancedPanel.className = 'control-panel advanced-panel';
        advancedPanel.innerHTML = `
            <div class="panel-header">
                <h3>أدوات متقدمة</h3>
                <button class="collapse-btn" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">−</button>
            </div>
            <div class="panel-content">
                <div class="tool-section">
                    <h4>أدوات التحليل</h4>
                    <button id="analyze-structure" class="btn secondary">تحليل البنية</button>
                    <button id="calculate-properties" class="btn secondary">حساب الخصائص</button>
                    <button id="energy-minimization" class="btn secondary">تقليل الطاقة</button>
                </div>
                
                <div class="tool-section">
                    <h4>المحاكاة</h4>
                    <button id="heating-simulation" class="btn warning">محاكاة التسخين</button>
                    <button id="cooling-simulation" class="btn info">محاكاة التبريد</button>
                    <button id="pressure-simulation" class="btn primary">محاكاة الضغط</button>
                </div>
                
                <div class="tool-section">
                    <h4>الحفظ والتحميل</h4>
                    <button id="save-state" class="btn success">حفظ الحالة</button>
                    <button id="load-state" class="btn info">تحميل الحالة</button>
                    <button id="export-data" class="btn secondary">تصدير البيانات</button>
                    <input type="file" id="import-data" accept=".json" style="display: none;">
                    <button id="import-data-btn" class="btn secondary">استيراد البيانات</button>
                </div>
                
                <div class="tool-section">
                    <h4>إعدادات متقدمة</h4>
                    <label><input type="checkbox" id="debug-mode"> وضع التطوير</label>
                    <label><input type="checkbox" id="performance-mode"> وضع الأداء</label>
                    <label><input type="checkbox" id="auto-save"> الحفظ التلقائي</label>
                </div>
            </div>
        `;
        
        document.body.appendChild(advancedPanel);
    }
    
    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // أزرار التحكم الرئيسية
        document.getElementById('add-atom-btn')?.addEventListener('click', () => this.addRandomAtom());
        document.getElementById('add-molecule-btn')?.addEventListener('click', () => this.showMoleculeDialog());
        document.getElementById('clear-all-btn')?.addEventListener('click', () => this.clearAll());
        document.getElementById('play-pause-btn')?.addEventListener('click', () => this.toggleSimulation());
        document.getElementById('step-btn')?.addEventListener('click', () => this.stepSimulation());
        document.getElementById('reset-btn')?.addEventListener('click', () => this.resetSimulation());
        
        // وضع التفاعل
        document.getElementById('interaction-mode')?.addEventListener('change', (e) => {
            this.interactionMode = e.target.value;
        });
        
        // أحداث البحث
        document.getElementById('atom-search')?.addEventListener('input', (e) => {
            this.filterAtomList(e.target.value);
        });
        document.getElementById('molecule-search')?.addEventListener('input', (e) => {
            this.filterMoleculeList(e.target.value);
        });
        
        // أزرار التحديد
        document.getElementById('select-all-atoms')?.addEventListener('click', () => this.selectAllAtoms());
        document.getElementById('deselect-all-atoms')?.addEventListener('click', () => this.deselectAllAtoms());
        document.getElementById('select-all-molecules')?.addEventListener('click', () => this.selectAllMolecules());
        document.getElementById('deselect-all-molecules')?.addEventListener('click', () => this.deselectAllMolecules());
        
        // تطبيق الخصائص
        document.getElementById('apply-atom-properties')?.addEventListener('click', () => this.applyAtomProperties());
        document.getElementById('apply-molecule-properties')?.addEventListener('click', () => this.applyMoleculeProperties());
        document.getElementById('apply-physics')?.addEventListener('click', () => this.applyPhysicsSettings());
        document.getElementById('apply-visualization')?.addEventListener('click', () => this.applyVisualizationSettings());
        
        // أحداث الفيزياء
        this.setupPhysicsEventListeners();
        
        // أحداث العرض
        this.setupVisualizationEventListeners();
        
        // أحداث الأدوات المتقدمة
        this.setupAdvancedEventListeners();
        
        // أحداث الماوس للتفاعل ثلاثي الأبعاد
        this.setupMouseEvents();
        
        // أحداث لوحة المفاتيح
        this.setupKeyboardEvents();
    }
    
    // إعداد أحداث الفيزياء
    setupPhysicsEventListeners() {
        // منزلقات الفيزياء
        const sliders = [
            'gravity', 'damping', 'timestep', 'base-space-size', 'atom-size-multiplier',
            'lj-strength', 'morse-strength', 'coulomb-strength', 'vdw-strength', 
            'hydrogen-strength', 'global-temperature', 'restitution', 'friction'
        ];
        
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId + '-slider');
            const valueSpan = document.getElementById(sliderId.replace('-slider', '-value'));
            
            if (slider && valueSpan) {
                slider.addEventListener('input', (e) => {
                    valueSpan.textContent = e.target.value;
                });
            }
        });
        
        // مربعات الاختيار للقوى
        const forceCheckboxes = ['lj', 'morse', 'coulomb', 'vdw', 'hydrogen'];
        forceCheckboxes.forEach(forceId => {
            const checkbox = document.getElementById(forceId + '-enabled');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.applyPhysicsSettings();
                });
            }
        });
    }
    
    // إعداد أحداث العرض
    setupVisualizationEventListeners() {
        // منزلقات العرض
        const vizSliders = ['atom-scale', 'bond-scale', 'label-scale', 'atom-opacity', 'bond-opacity'];
        
        vizSliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(sliderId + '-value');
            
            if (slider && valueSpan) {
                slider.addEventListener('input', (e) => {
                    valueSpan.textContent = e.target.value;
                    this.applyVisualizationSettings();
                });
            }
        });
        
        // مربعات اختيار العرض
        const vizCheckboxes = [
            'show-atom-labels', 'show-bonds', 'show-molecule-names',
            'show-forces', 'show-trajectories', 'show-boundaries'
        ];
        
        vizCheckboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.applyVisualizationSettings();
                });
            }
        });
        
        // نمط الألوان
        document.getElementById('color-scheme')?.addEventListener('change', () => {
            this.applyVisualizationSettings();
        });
    }
    
    // إعداد أحداث الأدوات المتقدمة
    setupAdvancedEventListeners() {
        document.getElementById('save-state')?.addEventListener('click', () => this.saveState());
        document.getElementById('load-state')?.addEventListener('click', () => this.loadState());
        document.getElementById('export-data')?.addEventListener('click', () => this.exportData());
        document.getElementById('import-data-btn')?.addEventListener('click', () => {
            document.getElementById('import-data').click();
        });
        document.getElementById('import-data')?.addEventListener('change', (e) => this.importData(e));
        
        document.getElementById('screenshot')?.addEventListener('click', () => this.takeScreenshot());
        
        // محاكاة التسخين والتبريد
        document.getElementById('heating-simulation')?.addEventListener('click', () => this.startHeatingSimulation());
        document.getElementById('cooling-simulation')?.addEventListener('click', () => this.startCoolingSimulation());
        document.getElementById('pressure-simulation')?.addEventListener('click', () => this.startPressureSimulation());
    }
    
    // إعداد أحداث الماوس
    setupMouseEvents() {
        const canvas = this.system.renderer.renderer.domElement;
        
        canvas.addEventListener('click', (event) => this.handleCanvasClick(event));
        canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
    }
    
    // إعداد أحداث لوحة المفاتيح
    setupKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    this.toggleSimulation();
                    break;
                case 'KeyR':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.resetSimulation();
                    }
                    break;
                case 'KeyS':
                    if (event.ctrlKey) {
                        event.preventDefault();
                        this.saveState();
                    }
                    break;
                case 'Delete':
                    this.deleteSelected();
                    break;
                case 'Escape':
                    this.deselectAll();
                    break;
            }
        });
    }
    
    // تحديث واجهة المستخدم
    updateUI() {
        this.updateAtomList();
        this.updateMoleculeList();
        this.updateStatistics();
        this.updateSelectedProperties();
    }
    
    // تحديث قائمة الذرات
    updateAtomList() {
        const atomList = document.getElementById('atom-list');
        if (!atomList) return;
        
        atomList.innerHTML = '';
        
        this.system.atoms.forEach(atom => {
            const atomItem = document.createElement('div');
            atomItem.className = `list-item ${atom.selected ? 'selected' : ''}`;
            atomItem.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${atom.type} (${atom.id.substr(0, 8)})</span>
                    <span class="item-details">
                        الشحنة: ${atom.charge.toFixed(1)} | 
                        الروابط: ${atom.currentLinks}/${atom.maxLinks}
                    </span>
                </div>
                <div class="item-actions">
                    <button class="btn-small" onclick="window.uiManager.focusOnAtom('${atom.id}')">تركيز</button>
                    <button class="btn-small" onclick="window.uiManager.selectAtom('${atom.id}')">تحديد</button>
                    <button class="btn-small danger" onclick="window.uiManager.deleteAtom('${atom.id}')">حذف</button>
                </div>
            `;
            
            atomItem.addEventListener('click', () => this.selectAtom(atom.id));
            atomList.appendChild(atomItem);
        });
    }
    
    // تحديث قائمة الجزيئات
    updateMoleculeList() {
        const moleculeList = document.getElementById('molecule-list');
        if (!moleculeList) return;
        
        moleculeList.innerHTML = '';
        
        this.system.molecules.forEach(molecule => {
            const moleculeItem = document.createElement('div');
            moleculeItem.className = `list-item ${molecule.selected ? 'selected' : ''}`;
            moleculeItem.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${molecule.name}</span>
                    <span class="item-details">
                        الصيغة: ${molecule.formula} | 
                        الذرات: ${molecule.atoms.size} | 
                        الروابط: ${molecule.bonds.size}
                    </span>
                </div>
                <div class="item-actions">
                    <button class="btn-small" onclick="window.uiManager.focusOnMolecule('${molecule.id}')">تركيز</button>
                    <button class="btn-small" onclick="window.uiManager.selectMolecule('${molecule.id}')">تحديد</button>
                    <button class="btn-small warning" onclick="window.uiManager.breakMolecule('${molecule.id}')">تفكيك</button>
                </div>
            `;
            
            moleculeItem.addEventListener('click', () => this.selectMolecule(molecule.id));
            moleculeList.appendChild(moleculeItem);
        });
    }
    
    // تحديث الإحصائيات
    updateStatistics() {
        const stats = this.system.physicsEngine.stats;
        
        document.getElementById('stat-atoms').textContent = stats.totalAtoms;
        document.getElementById('stat-molecules').textContent = stats.totalMolecules;
        document.getElementById('stat-bonds').textContent = stats.totalBonds;
        document.getElementById('stat-total-energy').textContent = stats.totalEnergy.toFixed(2);
        document.getElementById('stat-kinetic-energy').textContent = stats.kineticEnergy.toFixed(2);
        document.getElementById('stat-potential-energy').textContent = stats.potentialEnergy.toFixed(2);
        document.getElementById('stat-temperature').textContent = stats.temperature.toFixed(1) + ' K';
        document.getElementById('stat-pressure').textContent = stats.pressure.toFixed(3);
        document.getElementById('stat-density').textContent = stats.density.toFixed(3);
        document.getElementById('stat-space-size').textContent = this.system.physicsEngine.dynamicSpace.currentSize.toFixed(1);
        document.getElementById('stat-fps').textContent = Math.round(1000 / (stats.frameTime || 16));
        document.getElementById('stat-frame-time').textContent = stats.frameTime.toFixed(1);
    }
    
    // تحديث خصائص العنصر المحدد
    updateSelectedProperties() {
        const noSelection = document.getElementById('no-selection');
        const atomProperties = document.getElementById('atom-properties');
        const moleculeProperties = document.getElementById('molecule-properties');
        
        if (this.selectedAtoms.size === 1) {
            const atom = Array.from(this.selectedAtoms)[0];
            this.showAtomProperties(atom);
            noSelection.style.display = 'none';
            atomProperties.style.display = 'block';
            moleculeProperties.style.display = 'none';
        } else if (this.selectedMolecules.size === 1) {
            const molecule = Array.from(this.selectedMolecules)[0];
            this.showMoleculeProperties(molecule);
            noSelection.style.display = 'none';
            atomProperties.style.display = 'none';
            moleculeProperties.style.display = 'block';
        } else {
            noSelection.style.display = 'block';
            atomProperties.style.display = 'none';
            moleculeProperties.style.display = 'none';
        }
    }
    
    // عرض خصائص الذرة
    showAtomProperties(atom) {
        document.getElementById('atom-type').value = atom.type;
        document.getElementById('atom-weight').value = atom.weight;
        document.getElementById('atom-charge').value = atom.charge;
        document.getElementById('atom-max-links').value = atom.maxLinks;
        document.getElementById('atom-temperature').value = atom.temperature;
        document.getElementById('atom-lj-epsilon').value = atom.ljEpsilon;
        document.getElementById('atom-lj-sigma').value = atom.ljSigma;
        document.getElementById('atom-morse-depth').value = atom.morseDepth;
        document.getElementById('atom-morse-alpha').value = atom.morseAlpha;
        document.getElementById('atom-equilibrium-distance').value = atom.equilibriumDistance;
    }
    
    // عرض خصائص الجزيء
    showMoleculeProperties(molecule) {
        document.getElementById('molecule-name').value = molecule.name;
        document.getElementById('molecule-formula').textContent = molecule.formula;
        document.getElementById('molecule-weight').textContent = molecule.molecularWeight.toFixed(2);
        document.getElementById('molecule-charge').textContent = molecule.totalCharge.toFixed(1);
        document.getElementById('molecule-stability').textContent = molecule.stability.toFixed(1);
        document.getElementById('molecule-reactivity').textContent = molecule.reactivity.toFixed(1);
    }
    
    // تطبيق خصائص الذرة
    applyAtomProperties() {
        if (this.selectedAtoms.size !== 1) return;
        
        const atom = Array.from(this.selectedAtoms)[0];
        
        atom.type = document.getElementById('atom-type').value;
        atom.weight = parseFloat(document.getElementById('atom-weight').value);
        atom.charge = parseFloat(document.getElementById('atom-charge').value);
        atom.maxLinks = parseInt(document.getElementById('atom-max-links').value);
        atom.updateTemperature(parseFloat(document.getElementById('atom-temperature').value));
        atom.ljEpsilon = parseFloat(document.getElementById('atom-lj-epsilon').value);
        atom.ljSigma = parseFloat(document.getElementById('atom-lj-sigma').value);
        atom.morseDepth = parseFloat(document.getElementById('atom-morse-depth').value);
        atom.morseAlpha = parseFloat(document.getElementById('atom-morse-alpha').value);
        atom.equilibriumDistance = parseFloat(document.getElementById('atom-equilibrium-distance').value);
        
        // تحديث الخصائص المشتقة
        atom.radius = atom.calculateRadius();
        atom.color = atom.getElementColor();
        atom.vanDerWaalsRadius = atom.getVanDerWaalsRadius();
        atom.covalentRadius = atom.getCovalentRadius();
        atom.electronegativity = atom.getElectronegativity();
        atom.ionizationEnergy = atom.getIonizationEnergy();
        
        // تحديث الشبكة ثلاثية الأبعاد
        atom.updateMesh();
        
        console.log('تم تطبيق خصائص الذرة بنجاح');
    }
    
    // تطبيق إعدادات الفيزياء
    applyPhysicsSettings() {
        const engine = this.system.physicsEngine;
        
        // الإعدادات العامة
        engine.gravity = parseFloat(document.getElementById('gravity-slider').value);
        engine.damping = parseFloat(document.getElementById('damping-slider').value);
        engine.timeStep = parseFloat(document.getElementById('timestep-slider').value);
        
        // الفضاء الديناميكي
        engine.dynamicSpace.enabled = document.getElementById('dynamic-space-enabled').checked;
        engine.dynamicSpace.baseSize = parseFloat(document.getElementById('base-space-size').value);
        engine.dynamicSpace.atomSizeMultiplier = parseFloat(document.getElementById('atom-size-multiplier').value);
        
        // القوى
        engine.forces.lennardJones.enabled = document.getElementById('lj-enabled').checked;
        engine.forces.lennardJones.globalStrength = parseFloat(document.getElementById('lj-strength').value);
        
        engine.forces.morse.enabled = document.getElementById('morse-enabled').checked;
        engine.forces.morse.globalStrength = parseFloat(document.getElementById('morse-strength').value);
        
        engine.forces.coulomb.enabled = document.getElementById('coulomb-enabled').checked;
        engine.forces.coulomb.globalStrength = parseFloat(document.getElementById('coulomb-strength').value);
        
        engine.forces.vanDerWaals.enabled = document.getElementById('vdw-enabled').checked;
        engine.forces.vanDerWaals.globalStrength = parseFloat(document.getElementById('vdw-strength').value);
        
        engine.forces.hydrogen.enabled = document.getElementById('hydrogen-enabled').checked;
        engine.forces.hydrogen.globalStrength = parseFloat(document.getElementById('hydrogen-strength').value);
        
        // الحرارة والتصادمات
        engine.forces.thermal.globalTemperature = parseFloat(document.getElementById('global-temperature').value);
        engine.collision.restitution = parseFloat(document.getElementById('restitution').value);
        engine.collision.friction = parseFloat(document.getElementById('friction').value);
        
        console.log('تم تطبيق إعدادات الفيزياء بنجاح');
    }
    
    // تطبيق إعدادات العرض
    applyVisualizationSettings() {
        this.displaySettings.showAtomLabels = document.getElementById('show-atom-labels').checked;
        this.displaySettings.showBonds = document.getElementById('show-bonds').checked;
        this.displaySettings.showMoleculeNames = document.getElementById('show-molecule-names').checked;
        this.displaySettings.showForces = document.getElementById('show-forces').checked;
        this.displaySettings.showTrajectories = document.getElementById('show-trajectories').checked;
        this.displaySettings.showBoundaries = document.getElementById('show-boundaries').checked;
        
        this.displaySettings.atomScale = parseFloat(document.getElementById('atom-scale').value);
        this.displaySettings.bondScale = parseFloat(document.getElementById('bond-scale').value);
        this.displaySettings.labelScale = parseFloat(document.getElementById('label-scale').value);
        
        // تطبيق التغييرات على العرض
        this.system.renderer.updateDisplaySettings(this.displaySettings);
        
        console.log('تم تطبيق إعدادات العرض بنجاح');
    }
    
    // إضافة ذرة عشوائية
    addRandomAtom() {
        this.system.addRandomAtom();
    }
    
    // عرض حوار الجزيئات
    showMoleculeDialog() {
        // تنفيذ حوار اختيار الجزيء
        this.system.showMoleculeDialog();
    }
    
    // مسح جميع العناصر
    clearAll() {
        if (confirm('هل أنت متأكد من حذف جميع الذرات والجزيئات؟')) {
            this.system.clearAll();
            this.selectedAtoms.clear();
            this.selectedMolecules.clear();
        }
    }
    
    // تبديل المحاكاة
    toggleSimulation() {
        this.system.physicsEngine.togglePause();
        const btn = document.getElementById('play-pause-btn');
        if (btn) {
            btn.textContent = this.system.physicsEngine.paused ? 'تشغيل' : 'إيقاف';
        }
    }
    
    // خطوة واحدة في المحاكاة
    stepSimulation() {
        this.system.physicsEngine.step(this.system.atoms, this.system.molecules);
    }
    
    // إعادة تعيين المحاكاة
    resetSimulation() {
        if (confirm('هل أنت متأكد من إعادة تعيين المحاكاة؟')) {
            this.system.physicsEngine.reset();
        }
    }
    
    // تحديد ذرة
    selectAtom(atomId) {
        const atom = this.system.atoms.find(a => a.id === atomId);
        if (atom) {
            if (!this.multiSelect) {
                this.selectedAtoms.clear();
                this.selectedMolecules.clear();
            }
            
            this.selectedAtoms.add(atom);
            atom.selected = true;
            this.updateSelectionVisuals();
        }
    }
    
    // تحديد جزيء
    selectMolecule(moleculeId) {
        const molecule = this.system.molecules.find(m => m.id === moleculeId);
        if (molecule) {
            if (!this.multiSelect) {
                this.selectedAtoms.clear();
                this.selectedMolecules.clear();
            }
            
            this.selectedMolecules.add(molecule);
            molecule.selected = true;
            this.updateSelectionVisuals();
        }
    }
    
    // إلغاء تحديد الكل
    deselectAll() {
        this.selectedAtoms.forEach(atom => atom.selected = false);
        this.selectedMolecules.forEach(molecule => molecule.selected = false);
        this.selectedAtoms.clear();
        this.selectedMolecules.clear();
        this.updateSelectionVisuals();
    }
    
    // تحديث مرئيات التحديد
    updateSelectionVisuals() {
        // تحديث مرئيات التحديد في المحرك ثلاثي الأبعاد
        this.system.renderer.updateSelectionVisuals(this.selectedAtoms, this.selectedMolecules);
    }
    
    // التركيز على ذرة
    focusOnAtom(atomId) {
        const atom = this.system.atoms.find(a => a.id === atomId);
        if (atom) {
            this.system.renderer.focusOnPosition(atom.position);
        }
    }
    
    // التركيز على جزيء
    focusOnMolecule(moleculeId) {
        const molecule = this.system.molecules.find(m => m.id === moleculeId);
        if (molecule) {
            this.system.renderer.focusOnPosition(molecule.centerOfMass);
        }
    }
    
    // حفظ الحالة
    saveState() {
        const state = this.system.exportState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `molecular_state_${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('تم حفظ الحالة بنجاح');
    }
    
    // تحميل الحالة
    loadState() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const state = JSON.parse(e.target.result);
                        this.system.importState(state);
                        console.log('تم تحميل الحالة بنجاح');
                    } catch (error) {
                        console.error('خطأ في تحميل الحالة:', error);
                        alert('خطأ في تحميل الملف');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    // أخذ لقطة شاشة
    takeScreenshot() {
        this.system.renderer.takeScreenshot();
    }
    
    // معالجة النقر على الكانفاس
    handleCanvasClick(event) {
        const intersectedObject = this.system.renderer.getIntersectedObject(event);
        
        if (intersectedObject) {
            if (intersectedObject.userData.atom) {
                this.selectAtom(intersectedObject.userData.atom.id);
            } else if (intersectedObject.userData.molecule) {
                this.selectMolecule(intersectedObject.userData.molecule.id);
            }
        } else if (!this.multiSelect) {
            this.deselectAll();
        }
    }
    
    // معالجة الضغط على الماوس
    handleMouseDown(event) {
        if (this.interactionMode === 'move') {
            const intersectedObject = this.system.renderer.getIntersectedObject(event);
            if (intersectedObject && intersectedObject.userData.atom) {
                this.draggedAtom = intersectedObject.userData.atom;
                this.isDragging = true;
            }
        }
    }
    
    // معالجة حركة الماوس
    handleMouseMove(event) {
        if (this.isDragging && this.draggedAtom) {
            const newPosition = this.system.renderer.getWorldPosition(event);
            if (newPosition) {
                this.draggedAtom.position.copy(newPosition);
            }
        }
    }
    
    // معالجة رفع الماوس
    handleMouseUp(event) {
        this.isDragging = false;
        this.draggedAtom = null;
    }
}

// تصدير الفئة للاستخدام العام
window.AdvancedUIManager = AdvancedUIManager;

