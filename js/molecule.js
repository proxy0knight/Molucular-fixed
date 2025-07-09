class Molecule {
    constructor(id = null) {
        this.id = id || `molecule-${Date.now()}-${Math.random().toFixed(5)}`;
        this.atoms = []; // قائمة بمعرفات الذرات التي تشكل الجزيء
        this.bonds = []; // قائمة بالروابط داخل الجزيء
        this.formula = ""; // الصيغة الكيميائية
        this.molecularWeight = 0; // الوزن الجزيئي
    }

    addAtom(atomId) {
        if (!this.atoms.includes(atomId)) {
            this.atoms.push(atomId);
            this.updateProperties();
            return true;
        }
        return false;
    }

    removeAtom(atomId) {
        const index = this.atoms.indexOf(atomId);
        if (index > -1) {
            this.atoms.splice(index, 1);
            // إزالة أي روابط مرتبطة بهذه الذرة
            this.bonds = this.bonds.filter(bond => bond.atom1Id !== atomId && bond.atom2Id !== atomId);
            this.updateProperties();
            return true;
        }
        return false;
    }

    addBond(atom1Id, atom2Id, type = "single") {
        // التأكد من أن الذرات جزء من هذا الجزيء
        if (this.atoms.includes(atom1Id) && this.atoms.includes(atom2Id)) {
            // التأكد من عدم وجود الرابطة بالفعل
            const exists = this.bonds.some(bond => 
                (bond.atom1Id === atom1Id && bond.atom2Id === atom2Id) ||
                (bond.atom1Id === atom2Id && bond.atom2Id === atom1Id)
            );
            if (!exists) {
                this.bonds.push({ atom1Id, atom2Id, type });
                this.updateProperties();
                return true;
            }
        }
        return false;
    }

    removeBond(atom1Id, atom2Id) {
        const initialLength = this.bonds.length;
        this.bonds = this.bonds.filter(bond => 
            !( (bond.atom1Id === atom1Id && bond.atom2Id === atom2Id) ||
               (bond.atom1Id === atom2Id && bond.atom2Id === atom1Id) )
        );
        if (this.bonds.length < initialLength) {
            this.updateProperties();
            return true;
        }
        return false;
    }

    updateProperties(allAtoms = {}) {
        // حساب الصيغة الكيميائية والوزن الجزيئي
        const atomCounts = {};
        let totalWeight = 0;

        for (const atomId of this.atoms) {
            const atom = allAtoms[atomId];
            if (atom) {
                atomCounts[atom.type] = (atomCounts[atom.type] || 0) + 1;
                totalWeight += atom.mass;
            }
        }

        let formulaParts = [];
        for (const type in atomCounts) {
            formulaParts.push(type + (atomCounts[type] > 1 ? atomCounts[type] : ""));
        }
        this.formula = formulaParts.sort().join("");
        this.molecularWeight = totalWeight;
    }

    // دالة لتفكيك الجزيء إلى ذرات منفصلة
    disassemble() {
        const atomIds = [...this.atoms];
        this.atoms = [];
        this.bonds = [];
        this.formula = "";
        this.molecularWeight = 0;
        return atomIds;
    }
}

window.Molecule = Molecule;

