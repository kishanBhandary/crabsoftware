"use client";

import React, { useState, useEffect } from "react";
import { 
  Cylinder, 
  Droplets, 
  FlaskConical, 
  Info
} from "lucide-react";

type Tab = "volume" | "salinity" | "dosing";
type Shape = "circular" | "rectangular";

interface DosingDetail {
  chemicalName: string;
  increase: number;
  pureRequired: number; // in kg
  purity: number;
  actualRequired: number; // in kg
  safetyFactor: number;
  recommended: number; // in kg
  isAboveTarget: boolean;
}

interface ChemicalSourceConfig {
  name: string;
  calculate: (vol: number, increase: number) => number;
}

// Config object mapping chemical source selections to their conversion factors
const CHEMICAL_SOURCES: Record<string, Record<string, ChemicalSourceConfig>> = {
  alkalinity: {
    NaHCO3: {
      name: "Sodium Bicarbonate (NaHCO₃)",
      calculate: (vol, inc) => (vol * inc * 84.01) / (50 * 1000000)
    },
    Na2CO3: {
      name: "Sodium Carbonate (Na₂CO₃)",
      calculate: (vol, inc) => (vol * inc * 106) / (50 * 1000000)
    }
  },
  calcium: {
    CaCl2: {
      name: "Calcium Chloride (Anhydrous CaCl₂)",
      calculate: (vol, inc) => {
        const elReq = (vol * inc) / 1000000;
        return elReq / 0.361;
      }
    },
    CaCl2_2H2O: {
      name: "Calcium Chloride Dihydrate (CaCl₂·2H₂O)",
      calculate: (vol, inc) => {
        const elReq = (vol * inc) / 1000000;
        return elReq / 0.2726;
      }
    }
  },
  magnesium: {
    MgCl2: {
      name: "Magnesium Chloride (Anhydrous MgCl₂)",
      calculate: (vol, inc) => {
        const elReq = (vol * inc) / 1000000;
        return elReq / 0.2553;
      }
    },
    MgCl2_6H2O: {
      name: "Magnesium Chloride Hexahydrate (MgCl₂·6H₂O)",
      calculate: (vol, inc) => {
        const elReq = (vol * inc) / 1000000;
        return elReq / 0.1196;
      }
    }
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("volume");
  const [status, setStatus] = useState<string>("Ready");
  
  // ==========================================
  // TAB 1: TANK VOLUME
  // ==========================================
  const [shape, setShape] = useState<Shape>("circular");
  
  // Dimensions
  const [diameter, setDiameter] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [rectHeight, setRectHeight] = useState<string>("");

  // Saved calculation state (exactly matching the user layout request)
  const [calcShape, setCalcShape] = useState<string>("");
  const [calcDimLabel1, setCalcDimLabel1] = useState<string>("");
  const [calcDimVal1, setCalcDimVal1] = useState<string>("");
  const [calcDimLabel2, setCalcDimLabel2] = useState<string>("");
  const [calcDimVal2, setCalcDimVal2] = useState<string>("");
  const [calcDimLabel3, setCalcDimLabel3] = useState<string>("");
  const [calcDimVal3, setCalcDimVal3] = useState<string>("");
  const [calcCapacityM3, setCalcCapacityM3] = useState<number | null>(null);
  const [calcVolumeLiters, setCalcVolumeLiters] = useState<number | null>(null);

  const calculateVolume = () => {
    if (shape === "circular") {
      const d = parseFloat(diameter);
      const h = parseFloat(height);
      if (isNaN(d) || isNaN(h) || d <= 0 || h <= 0) {
        setStatus("Error: Diameter and Height must be positive numbers.");
        return;
      }
      const radius = d / 2;
      const liters = Math.PI * Math.pow(radius, 2) * h * 1000;
      
      setCalcShape("Circular Tank");
      setCalcDimLabel1("Diameter");
      setCalcDimVal1(`${d.toFixed(2)} m`);
      setCalcDimLabel2("Water Depth");
      setCalcDimVal2(`${h.toFixed(2)} m`);
      setCalcDimLabel3("");
      setCalcDimVal3("");
      setCalcCapacityM3(liters / 1000);
      setCalcVolumeLiters(liters);
      
      // Auto-load to other tabs
      setSalVolume(Math.round(liters).toString());
      setChemVolume(Math.round(liters).toString());
      
      setStatus("Tank Volume calculated successfully.");
    } else {
      const l = parseFloat(length);
      const w = parseFloat(width);
      const h = parseFloat(rectHeight);
      if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
        setStatus("Error: Length, Width and Height must be positive numbers.");
        return;
      }
      const liters = l * w * h * 1000;
      
      setCalcShape("Rectangular Tank");
      setCalcDimLabel1("Length");
      setCalcDimVal1(`${l.toFixed(2)} m`);
      setCalcDimLabel2("Width");
      setCalcDimVal2(`${w.toFixed(2)} m`);
      setCalcDimLabel3("Water Depth");
      setCalcDimVal3(`${h.toFixed(2)} m`);
      setCalcCapacityM3(liters / 1000);
      setCalcVolumeLiters(liters);
      
      // Auto-load to other tabs
      setSalVolume(Math.round(liters).toString());
      setChemVolume(Math.round(liters).toString());
      
      setStatus("Tank Volume calculated successfully.");
    }
  };

  const clearVolume = () => {
    setDiameter("");
    setHeight("");
    setLength("");
    setWidth("");
    setRectHeight("");
    setCalcShape("");
    setCalcCapacityM3(null);
    setCalcVolumeLiters(null);
    setStatus("Ready");
  };

  // ==========================================
  // TAB 2: SALINITY
  // ==========================================
  const [salVolume, setSalVolume] = useState<string>("");
  const [salSpecies, setSalSpecies] = useState<string>("Crabs");
  const [salCurrent, setSalCurrent] = useState<string>("");
  const [salTarget, setSalTarget] = useState<string>("");
  const [salSafetyFactor, setSalSafetyFactor] = useState<string>("100");

  // Output State matching user request
  const [salResultAction, setSalResultAction] = useState<string>("");
  const [salResultDiff, setSalResultDiff] = useState<string>("");
  const [salResultRequired, setSalResultRequired] = useState<string>("");
  const [salResultRecommended, setSalResultRecommended] = useState<string>("");
  const [salResultProtocol, setSalResultProtocol] = useState<string>("");

  const salinityPresets: Record<string, number> = {
    Crabs: 15,
    Shrimp: 25,
    Lobster: 32,
    Custom: 25
  };

  const handleSalSpeciesChange = (species: string) => {
    setSalSpecies(species);
    if (species !== "Custom") {
      setSalTarget(salinityPresets[species].toString());
    }
  };

  const calculateSalinity = () => {
    const vol = parseFloat(salVolume);
    const curr = parseFloat(salCurrent);
    const tgt = parseFloat(salTarget);
    const safety = parseFloat(salSafetyFactor) / 100;

    if (isNaN(vol) || isNaN(curr) || isNaN(tgt) || isNaN(safety) || vol <= 0 || curr < 0 || tgt < 0 || safety <= 0) {
      setStatus("Error: Please provide valid positive values for Salinity.");
      return;
    }

    const diff = tgt - curr;

    if (Math.abs(diff) < 0.01) {
      setSalResultAction("No Change");
      setSalResultDiff("0.0 ppt");
      setSalResultRequired("0.00 kg");
      setSalResultRecommended("0.00 kg");
      setSalResultProtocol("Salinity matches target level. No adjustment needed.");
      setStatus("Salinity checked: no adjustment needed.");
      return;
    }

    if (diff > 0) {
      // Increase
      const gramsNeeded = vol * diff;
      const pureSaltKg = gramsNeeded / 1000;
      const recSaltKg = pureSaltKg * safety;

      setSalResultAction("Increase Salinity");
      setSalResultDiff(`${diff.toFixed(1)} ppt`);
      setSalResultRequired(`${pureSaltKg.toFixed(2)} kg`);
      setSalResultRecommended(`${recSaltKg.toFixed(2)} kg`);
      setSalResultProtocol(`Add ${recSaltKg.toFixed(2)} kg of marine salt to increase salinity from ${curr} ppt to ${tgt} ppt.`);
      setStatus("Salinity dose calculated successfully.");
    } else {
      // Decrease
      const replaceLiters = vol * (1 - tgt / curr);
      const recReplaceL = replaceLiters * safety;

      setSalResultAction("Decrease Salinity");
      setSalResultDiff(`${Math.abs(diff).toFixed(1)} ppt`);
      setSalResultRequired(`${replaceLiters.toFixed(1)} Liters`);
      setSalResultRecommended(`${recReplaceL.toFixed(1)} Liters`);
      setSalResultProtocol(`Drain and replace ${recReplaceL.toFixed(1)} Liters of tank water with fresh water (0 ppt) to decrease salinity from ${curr} ppt to ${tgt} ppt.`);
      setStatus("Freshwater replacement calculated successfully.");
    }
  };

  const clearSalinity = () => {
    setSalVolume("");
    setSalCurrent("");
    setSalTarget("");
    setSalSafetyFactor("100");
    setSalResultAction("");
    setStatus("Ready");
  };

  // ==========================================
  // TAB 3: CHEMICAL DOSING
  // ==========================================
  const [chemVolume, setChemVolume] = useState<string>("");
  const [chemSpecies, setChemSpecies] = useState<string>("Crabs");
  const [chemSafetyFactor, setChemSafetyFactor] = useState<string>("100");

  // Dropdown chemical sources selection
  const [alkSource, setAlkSource] = useState<string>("NaHCO3");
  const [calSource, setCalSource] = useState<string>("CaCl2_2H2O");
  const [magSource, setMagSource] = useState<string>("MgCl2_6H2O");

  const [alkCurrent, setAlkCurrent] = useState<string>("");
  const [alkTarget, setAlkTarget] = useState<string>("");
  const [alkPurity, setAlkPurity] = useState<string>("70");

  const [calCurrent, setCalCurrent] = useState<string>("");
  const [calTarget, setCalTarget] = useState<string>("");
  const [calPurity, setCalPurity] = useState<string>("50");

  const [magCurrent, setMagCurrent] = useState<string>("");
  const [magTarget, setMagTarget] = useState<string>("");
  const [magPurity, setMagPurity] = useState<string>("80");

  // Results details matching user specifications
  const [alkDosing, setAlkDosing] = useState<DosingDetail | null>(null);
  const [calDosing, setCalDosing] = useState<DosingDetail | null>(null);
  const [magDosing, setMagDosing] = useState<DosingDetail | null>(null);

  const chemicalPresets: Record<string, { alk: number; cal: number; mag: number }> = {
    Crabs: { alk: 200, cal: 300, mag: 900 },
    Shrimp: { alk: 150, cal: 400, mag: 1200 },
    Lobster: { alk: 120, py: 0, cal: 420, mag: 1300 } as any // Handle TS preset types
  };

  const handleChemSpeciesChange = (species: string) => {
    setChemSpecies(species);
    if (species !== "Custom") {
      const preset = chemicalPresets[species];
      if (preset) {
        setAlkTarget(preset.alk.toString());
        setCalTarget(preset.cal.toString());
        setMagTarget(preset.mag.toString());
      }
    }
  };

  const calculateDosing = () => {
    const vol = parseFloat(chemVolume);
    const safety = parseFloat(chemSafetyFactor);

    if (isNaN(vol) || isNaN(safety) || vol <= 0 || safety <= 0) {
      return;
    }

    // ALKALINITY
    const alkC = parseFloat(alkCurrent);
    const alkT = parseFloat(alkTarget);
    const alkP = parseFloat(alkPurity);
    if (!isNaN(alkC) && !isNaN(alkT)) {
      const inc = alkT - alkC;
      if (inc <= 0) {
        setAlkDosing({
          chemicalName: CHEMICAL_SOURCES.alkalinity[alkSource].name,
          increase: inc,
          pureRequired: 0,
          purity: isNaN(alkP) ? 100 : alkP,
          actualRequired: 0,
          safetyFactor: safety,
          recommended: 0,
          isAboveTarget: true
        });
      } else {
        const purityVal = isNaN(alkP) || alkP <= 0 ? 100 : alkP;
        const chemReq = CHEMICAL_SOURCES.alkalinity[alkSource].calculate(vol, inc);
        const actualReq = chemReq / (purityVal / 100);
        const rec = actualReq * (safety / 100);
        setAlkDosing({
          chemicalName: CHEMICAL_SOURCES.alkalinity[alkSource].name,
          increase: inc,
          pureRequired: chemReq,
          purity: purityVal,
          actualRequired: actualReq,
          safetyFactor: safety,
          recommended: rec,
          isAboveTarget: false
        });
      }
    } else {
      setAlkDosing(null);
    }

    // CALCIUM
    const calC = parseFloat(calCurrent);
    const calT = parseFloat(calTarget);
    const calP = parseFloat(calPurity);
    if (!isNaN(calC) && !isNaN(calT)) {
      const inc = calT - calC;
      if (inc <= 0) {
        setCalDosing({
          chemicalName: CHEMICAL_SOURCES.calcium[calSource].name,
          increase: inc,
          pureRequired: 0,
          purity: isNaN(calP) ? 100 : calP,
          actualRequired: 0,
          safetyFactor: safety,
          recommended: 0,
          isAboveTarget: true
        });
      } else {
        const purityVal = isNaN(calP) || calP <= 0 ? 100 : calP;
        const chemReq = CHEMICAL_SOURCES.calcium[calSource].calculate(vol, inc);
        const actualReq = chemReq / (purityVal / 100);
        const rec = actualReq * (safety / 100);
        setCalDosing({
          chemicalName: CHEMICAL_SOURCES.calcium[calSource].name,
          increase: inc,
          pureRequired: chemReq,
          purity: purityVal,
          actualRequired: actualReq,
          safetyFactor: safety,
          recommended: rec,
          isAboveTarget: false
        });
      }
    } else {
      setCalDosing(null);
    }

    // MAGNESIUM
    const magC = parseFloat(magCurrent);
    const magT = parseFloat(magTarget);
    const magP = parseFloat(magPurity);
    if (!isNaN(magC) && !isNaN(magT)) {
      const inc = magT - magC;
      if (inc <= 0) {
        setMagDosing({
          chemicalName: CHEMICAL_SOURCES.magnesium[magSource].name,
          increase: inc,
          pureRequired: 0,
          purity: isNaN(magP) ? 100 : magP,
          actualRequired: 0,
          safetyFactor: safety,
          recommended: 0,
          isAboveTarget: true
        });
      } else {
        const purityVal = isNaN(magP) || magP <= 0 ? 100 : magP;
        const chemReq = CHEMICAL_SOURCES.magnesium[magSource].calculate(vol, inc);
        const actualReq = chemReq / (purityVal / 100);
        const rec = actualReq * (safety / 100);
        setMagDosing({
          chemicalName: CHEMICAL_SOURCES.magnesium[magSource].name,
          increase: inc,
          pureRequired: chemReq,
          purity: purityVal,
          actualRequired: actualReq,
          safetyFactor: safety,
          recommended: rec,
          isAboveTarget: false
        });
      }
    } else {
      setMagDosing(null);
    }

    setStatus("Chemical dosing requirements computed successfully.");
  };

  const clearDosing = () => {
    setChemVolume("");
    setChemSafetyFactor("100");
    setAlkCurrent("");
    setAlkTarget("");
    setAlkPurity("70");
    setCalCurrent("");
    setCalTarget("");
    setCalPurity("50");
    setMagCurrent("");
    setMagTarget("");
    setMagPurity("80");
    setAlkSource("NaHCO3");
    setCalSource("CaCl2_2H2O");
    setMagSource("MgCl2_6H2O");
    setAlkDosing(null);
    setCalDosing(null);
    setMagDosing(null);
    setStatus("Ready");
  };

  // Safe external URL opener using Electron APIs
  const openWebsite = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = "https://www.crabshack.live";
    try {
      if (typeof window !== "undefined") {
        const w = window as any;
        if (w.electronAPI && typeof w.electronAPI.openExternal === "function") {
          w.electronAPI.openExternal(url);
          return;
        }
      }
    } catch (err) {
      console.warn("Electron API call failed, falling back to window.open", err);
    }
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  // Instant Dosing Recalculation Effect
  useEffect(() => {
    if (activeTab === "dosing" && chemVolume && chemSafetyFactor) {
      calculateDosing();
    }
  }, [
    alkSource, calSource, magSource,
    alkCurrent, alkTarget, alkPurity,
    calCurrent, calTarget, calPurity,
    magCurrent, magTarget, magPurity,
    chemVolume, chemSafetyFactor,
    activeTab
  ]);

  return (
    <div className="flex flex-col h-screen select-none bg-[#EDF2F7] text-base">
      {/* Top Banner (Header) */}
      <header className="bg-black px-8 py-4 flex items-center gap-4 flex-shrink-0 text-white shadow-md">
        <img src="/logo.png" alt="CrabShack Logo" className="h-14 w-auto object-contain bg-white/10 p-1 rounded font-bold" />
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold tracking-wide">Culture Tank Water Calculator</h1>
          <p className="text-base text-zinc-400 mt-0.5 font-medium">Volume & Chemical Dosing Tool</p>
        </div>
      </header>

      {/* Tabs Menu */}
      <nav className="flex bg-[#E2E8F0] border-b border-[#CBD5E1] flex-shrink-0 px-8 pt-3">
        <button
          onClick={() => setActiveTab("volume")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-t border-t border-x border-[#CBD5E1] -mb-[1px] transition-colors focus:outline-none ${
            activeTab === "volume"
              ? "bg-[#EDF2F7] text-black border-t-2 border-t-black font-extrabold z-10 text-sm"
              : "bg-[#E2E8F0] text-[#64748B] hover:bg-slate-50 border-transparent hover:text-black"
          }`}
        >
          <Cylinder className="h-5 w-5 text-black" />
          <span>Tank Volume</span>
        </button>
        <button
          onClick={() => setActiveTab("salinity")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-t border-t border-x border-[#CBD5E1] -mb-[1px] transition-colors focus:outline-none ${
            activeTab === "salinity"
              ? "bg-[#EDF2F7] text-black border-t-2 border-t-black font-extrabold z-10 text-sm"
              : "bg-[#E2E8F0] text-[#64748B] hover:bg-slate-50 border-transparent hover:text-black"
          }`}
        >
          <Droplets className="h-5 w-5 text-black" />
          <span>Salinity</span>
        </button>
        <button
          onClick={() => setActiveTab("dosing")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-t border-t border-x border-[#CBD5E1] -mb-[1px] transition-colors focus:outline-none ${
            activeTab === "dosing"
              ? "bg-[#EDF2F7] text-black border-t-2 border-t-black font-extrabold z-10 text-sm"
              : "bg-[#E2E8F0] text-[#64748B] hover:bg-slate-50 border-transparent hover:text-black"
          }`}
        >
          <FlaskConical className="h-5 w-5 text-black" />
          <span>Chemical Dosing</span>
        </button>
      </nav>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-8 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full max-w-full px-4 mx-auto">
          
          {/* LEFT COLUMN: Results Display Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm min-h-[480px] flex flex-col justify-between">
              <div>
                {/* TANK VOLUME RESULTS */}
                {activeTab === "volume" && (
                  calcVolumeLiters !== null ? (
                    <div className="font-mono text-sm text-[#111111] leading-relaxed">
                      <div className="text-center font-bold text-slate-500 py-1">
                        ──────────────────────────────────────────────
                      </div>
                      <div className="text-center font-bold text-base text-black tracking-wide uppercase py-1">
                        TANK VOLUME RESULTS
                      </div>
                      <div className="text-center font-bold text-slate-500 py-1">
                        ──────────────────────────────────────────────
                      </div>
                      
                      <div className="mt-4 space-y-3 pl-2">
                        <div>
                          <div className="text-xs uppercase font-bold text-slate-400">Tank Shape</div>
                          <div className="text-sm font-extrabold text-[#111111]">{calcShape}</div>
                        </div>

                        <div>
                          <div className="text-xs uppercase font-bold text-slate-400">{calcDimLabel1}</div>
                          <div className="text-sm font-extrabold text-[#111111]">{calcDimVal1}</div>
                        </div>

                        <div>
                          <div className="text-xs uppercase font-bold text-slate-400">{calcDimLabel2}</div>
                          <div className="text-sm font-extrabold text-[#111111]">{calcDimVal2}</div>
                        </div>

                        {calcDimLabel3 && (
                          <div>
                            <div className="text-xs uppercase font-bold text-slate-400">{calcDimLabel3}</div>
                            <div className="text-sm font-extrabold text-[#111111]">{calcDimVal3}</div>
                          </div>
                        )}
                      </div>

                      <div className="text-center font-bold text-slate-400 mt-5 py-1">
                        ──────────────────────────────────────────────
                      </div>
                      
                      <div className="mt-4 space-y-3 pl-2">
                        <div>
                          <div className="text-xs uppercase font-bold text-slate-400">Tank Capacity</div>
                          <div className="text-base font-extrabold text-black">{calcCapacityM3?.toFixed(2)} m³</div>
                        </div>

                        <div>
                          <div className="text-xs uppercase font-bold text-slate-400">Water Volume</div>
                          <div className="text-base font-extrabold text-black">{calcVolumeLiters?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Liters</div>
                        </div>
                      </div>

                      <div className="text-center font-bold text-slate-400 mt-5 py-1">
                        ──────────────────────────────────────────────
                      </div>

                      <div className="mt-4 pl-2 text-sm font-semibold text-emerald-600 flex items-start gap-2">
                        <span>✓</span>
                        <span>Water volume has been automatically loaded<br/>into the Salinity and Chemical Dosing modules.</span>
                      </div>

                      <div className="text-center font-bold text-slate-400 mt-4 py-1">
                        ──────────────────────────────────────────────
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center py-20 text-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-[#E2E8F0] pb-2 mb-4 w-full">
                        Calculated Results
                      </h3>
                      <p className="text-xs text-[#94A3B8] italic">
                        Enter tank shape and dimensions, then click Calculate.
                      </p>
                    </div>
                  )
                )}

                {/* SALINITY RESULTS */}
                {activeTab === "salinity" && (
                  salResultAction ? (
                    <div className="space-y-5 text-base">
                      <h3 className="text-base font-bold uppercase tracking-wider text-black border-b border-[#E2E8F0] pb-2 mb-4">
                        CALCULATED RESULTS
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action</div>
                          <div className="text-base font-extrabold text-black">{salResultAction}</div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salinity Increase</div>
                          <div className="text-base font-extrabold text-[#111111]">{salResultDiff}</div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salt Required</div>
                          <div className="text-base font-extrabold text-[#111111]">{salResultRequired}</div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Dose</div>
                          <div className="text-base font-extrabold text-black">{salResultRecommended}</div>
                        </div>

                        <div className="pt-2 border-t border-[#E2E8F0]">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Protocol</div>
                          <p className="text-sm font-semibold text-[#111111] leading-relaxed bg-slate-50 border border-[#CBD5E1] p-3 rounded">
                            {salResultProtocol}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center py-20 text-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-[#E2E8F0] pb-2 mb-4 w-full">
                        Calculated Results
                      </h3>
                      <p className="text-xs text-[#94A3B8] italic">
                        Configure salinity options and click Calculate.
                      </p>
                    </div>
                  )
                )}

                {/* CHEMICAL DOSING RESULTS */}
                {activeTab === "dosing" && (
                  (alkDosing !== null || calDosing !== null || magDosing !== null) ? (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-[#E2E8F0] pb-2 mb-4 w-full">
                        Calculated Results
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Alkalinity Buffer */}
                        {alkDosing && (
                          <div className="p-3 bg-slate-50 border border-[#CBD5E1] rounded text-sm space-y-1">
                            <span className="font-bold text-black block mb-1">Alkalinity Buffer</span>
                            {alkDosing.isAboveTarget ? (
                              <div className="text-xs font-semibold text-slate-500">
                                <span className="font-bold text-slate-400 block mb-0.5">Status</span>
                                <span className="text-[#D97706] font-bold block">Above Target</span>
                                <span className="text-slate-500 font-sans block mt-0.5">No dosing required.</span>
                              </div>
                            ) : (
                              <div className="space-y-1 font-mono text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Selected Chemical:</span>
                                  <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">{alkDosing.chemicalName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Increase Required:</span>
                                  <span className="font-bold text-slate-800">{alkDosing.increase.toFixed(1)} ppm</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Pure Chemical Required:</span>
                                  <span className="font-bold text-slate-800">{alkDosing.pureRequired.toFixed(3)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Purity:</span>
                                  <span className="font-bold text-slate-800">{alkDosing.purity}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Actual Chemical Required:</span>
                                  <span className="font-bold text-slate-800">{alkDosing.actualRequired.toFixed(3)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Safety Dose Factor:</span>
                                  <span className="font-bold text-slate-800">{alkDosing.safetyFactor}%</span>
                                </div>
                                <div className="flex justify-between text-black font-extrabold border-t border-dashed border-slate-200 pt-1 mt-1 font-sans">
                                  <span>Recommended Dose:</span>
                                  <span>{alkDosing.recommended.toFixed(3)} kg</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Calcium Supplement */}
                        {calDosing && (
                          <div className="p-3 bg-slate-50 border border-[#CBD5E1] rounded text-sm space-y-1">
                            <span className="font-bold text-black block mb-1">Calcium Supplement</span>
                            {calDosing.isAboveTarget ? (
                              <div className="text-xs font-semibold text-slate-500">
                                <span className="font-bold text-slate-400 block mb-0.5">Status</span>
                                <span className="text-[#D97706] font-bold block">Above Target</span>
                                <span className="text-slate-500 font-sans block mt-0.5">No dosing required.</span>
                              </div>
                            ) : (
                              <div className="space-y-1 font-mono text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Selected Chemical:</span>
                                  <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">{calDosing.chemicalName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Increase Required:</span>
                                  <span className="font-bold text-slate-800">{calDosing.increase.toFixed(1)} ppm</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Pure Chemical Required:</span>
                                  <span className="font-bold text-slate-800">{calDosing.pureRequired.toFixed(3)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Purity:</span>
                                  <span className="font-bold text-slate-800">{calDosing.purity}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Actual Chemical Required:</span>
                                  <span className="font-bold text-slate-800">{calDosing.actualRequired.toFixed(3)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Safety Dose Factor:</span>
                                  <span className="font-bold text-slate-800">{calDosing.safetyFactor}%</span>
                                </div>
                                <div className="flex justify-between text-black font-extrabold border-t border-dashed border-slate-200 pt-1 mt-1 font-sans">
                                  <span>Recommended Dose:</span>
                                  <span>{calDosing.recommended.toFixed(3)} kg</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Magnesium Supplement */}
                        {magDosing && (
                          <div className="p-3 bg-slate-50 border border-[#CBD5E1] rounded text-sm space-y-1">
                            <span className="font-bold text-black block mb-1">Magnesium Supplement</span>
                            {magDosing.isAboveTarget ? (
                              <div className="text-xs font-semibold text-slate-500">
                                <span className="font-bold text-slate-400 block mb-0.5">Status</span>
                                <span className="text-[#D97706] font-bold block">Above Target</span>
                                <span className="text-slate-500 font-sans block mt-0.5">No dosing required.</span>
                              </div>
                            ) : (
                              <div className="space-y-1 font-mono text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Selected Chemical:</span>
                                  <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">{magDosing.chemicalName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Increase Required:</span>
                                  <span className="font-bold text-slate-800">{magDosing.increase.toFixed(1)} ppm</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Pure Chemical Required:</span>
                                  <span className="font-bold text-slate-800">{magDosing.pureRequired.toFixed(3)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Purity:</span>
                                  <span className="font-bold text-slate-800">{magDosing.purity}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Actual Chemical Required:</span>
                                  <span className="font-bold text-slate-800">{magDosing.actualRequired.toFixed(3)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-sans">Safety Dose Factor:</span>
                                  <span className="font-bold text-slate-800">{magDosing.safetyFactor}%</span>
                                </div>
                                <div className="flex justify-between text-black font-extrabold border-t border-dashed border-slate-200 pt-1 mt-1 font-sans">
                                  <span>Recommended Dose:</span>
                                  <span>{magDosing.recommended.toFixed(3)} kg</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center py-20 text-center">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-[#E2E8F0] pb-2 mb-4 w-full">
                        Calculated Results
                      </h3>
                      <p className="text-xs text-[#94A3B8] italic">
                        Configure dosing values and click Calculate.
                      </p>
                    </div>
                  )
                )}

              </div>
              <div className="text-xs text-[#64748B] flex items-center gap-1.5 border-t border-[#E2E8F0] pt-3 mt-4">
                <Info className="h-4 w-4 text-black" />
                <span>Verify values and parameters before treatment application.</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Tab Inputs Forms */}
          <div className="lg:col-span-7 space-y-6">

            {/* TAB 1: TANK VOLUME INPUTS */}
            {activeTab === "volume" && (
              <div className="space-y-6">
                {/* Shape Selection Block */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-black uppercase tracking-wider">Tank Shape</h3>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer">
                      <input
                        type="radio"
                        name="shape-type"
                        checked={shape === "circular"}
                        onChange={() => setShape("circular")}
                        className="accent-black"
                      />
                      <span>Circular Tank</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer">
                      <input
                        type="radio"
                        name="shape-type"
                        checked={shape === "rectangular"}
                        onChange={() => setShape("rectangular")}
                        className="accent-black"
                      />
                      <span>Rectangular Tank</span>
                    </label>
                  </div>
                </div>

                {/* Dimensions White Panel */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-black">
                    {shape === "circular" ? "Circular Tank Dimensions" : "Rectangular Tank Dimensions"}
                  </h4>

                  {shape === "circular" ? (
                    <div className="flex flex-wrap gap-8 items-end">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#555555]">Diameter</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={diameter}
                            onChange={(e) => setDiameter(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black w-36"
                          />
                          <span className="text-xs text-[#555555]">m</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#555555]">Height</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black w-36"
                          />
                          <span className="text-xs text-[#555555]">m</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-8 items-end">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#555555]">Length</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black w-28"
                          />
                          <span className="text-xs text-[#555555]">m</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#555555]">Width</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black w-28"
                          />
                          <span className="text-xs text-[#555555]">m</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#555555]">Height</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={rectHeight}
                            onChange={(e) => setRectHeight(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black w-28"
                          />
                          <span className="text-xs text-[#555555]">m</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculate / Clear Buttons Row */}
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={calculateVolume}
                    className="flex-1 bg-black hover:bg-zinc-800 text-white font-bold py-3 px-6 rounded transition-colors text-xs uppercase tracking-wider cursor-pointer"
                  >
                    [ Calculate Tank Volume ]
                  </button>
                  <button
                    onClick={clearVolume}
                    className="bg-white hover:bg-slate-50 text-[#555555] border border-[#CBD5E1] font-semibold py-3 px-8 rounded transition-colors text-xs cursor-pointer"
                  >
                    [ Clear ]
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: SALINITY INPUTS */}
            {activeTab === "salinity" && (
              <div className="space-y-4">
                {/* Water Volume Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-2">
                  <label className="text-xs font-bold text-black block">Water Volume</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={salVolume}
                      onChange={(e) => setSalVolume(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-black w-56 font-bold"
                    />
                    <span className="text-xs text-[#555555]">Liters</span>
                  </div>
                  <div className="flex items-start gap-1 text-xs text-[#64748B] mt-1.5">
                    <Info className="h-3.5 w-3.5 text-[#64748B] flex-shrink-0 mt-0.5" />
                    <span>Auto-populated from Tank Volume tab. You can override this value.</span>
                  </div>
                </div>

                {/* Species Preset Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-2">
                  <label className="text-xs font-bold text-black block">Species Preset</label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#555555]">Select species:</span>
                    <select
                      value={salSpecies}
                      onChange={(e) => handleSalSpeciesChange(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-1 text-xs text-[#111111] focus:outline-none focus:border-black bg-gradient-to-b from-white to-[#F1F5F9] cursor-pointer h-8"
                    >
                      <option value="Crabs">Crabs</option>
                      <option value="Shrimp">Shrimp</option>
                      <option value="Lobster">Lobster</option>
                      <option value="Custom">Custom Target</option>
                    </select>
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    Preset: Desired salinity <strong className="text-black">{salinityPresets[salSpecies]} ppt</strong>
                  </div>
                </div>

                {/* Salinity Parameters Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-black">Salinity Parameters</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between max-w-sm">
                      <span className="text-xs text-[#555555]">Current Salinity</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={salCurrent}
                          onChange={(e) => setSalCurrent(e.target.value)}
                          className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black w-28 text-center"
                        />
                        <span className="text-xs text-[#555555] w-8">ppt</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between max-w-sm">
                      <span className="text-xs text-[#555555]">Desired Salinity</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={salTarget}
                          onChange={(e) => setSalTarget(e.target.value)}
                          className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black w-28 text-center"
                        />
                        <span className="text-xs text-[#555555] w-8">ppt</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between max-w-sm">
                      <span className="text-xs text-[#555555]">Safety Dose Factor</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={salSafetyFactor}
                          onChange={(e) => setSalSafetyFactor(e.target.value)}
                          className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black w-28 text-center"
                        />
                        <span className="text-xs text-[#555555] w-8">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={calculateSalinity}
                    className="flex-1 bg-black hover:bg-zinc-800 text-white font-bold py-3 px-6 rounded transition-colors text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Calculate Salt Dose
                  </button>
                  <button
                    onClick={clearSalinity}
                    className="bg-white hover:bg-slate-50 text-[#555555] border border-[#CBD5E1] font-semibold py-3 px-8 rounded transition-colors text-xs cursor-pointer"
                  >
                    Reset Parameters
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CHEMICAL DOSING INPUTS */}
            {activeTab === "dosing" && (
              <div className="space-y-4">
                {/* Water Volume Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-2">
                  <label className="text-xs font-bold text-black block">Water Volume</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={chemVolume}
                      onChange={(e) => setChemVolume(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-black w-56 font-bold"
                    />
                    <span className="text-xs text-[#555555]">Liters</span>
                  </div>
                </div>

                {/* Species Preset Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-2">
                  <label className="text-xs font-bold text-black block">Species Preset</label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#555555]">Select species:</span>
                    <select
                      value={chemSpecies}
                      onChange={(e) => handleChemSpeciesChange(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black bg-gradient-to-b from-white to-[#F1F5F9] cursor-pointer h-8"
                    >
                      <option value="Crabs">Crabs</option>
                      <option value="Shrimp">Shrimp</option>
                      <option value="Lobster">Lobster</option>
                      <option value="Custom">Custom Target</option>
                    </select>
                  </div>
                  <div className="text-xs text-[#64748B] mt-1 font-medium">
                    Presets: Alkalinity <strong className="text-black">{chemicalPresets[chemSpecies]?.alk ?? 200} ppm</strong> - Calcium <strong className="text-black">{chemicalPresets[chemSpecies]?.cal ?? 300} ppm</strong> - Magnesium <strong className="text-black">{chemicalPresets[chemSpecies]?.mag ?? 900} ppm</strong>
                  </div>
                </div>

                {/* Water Parameters Matrix Table Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-black">Water Parameters</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#CBD5E1] text-[#64748B] font-semibold">
                          <th className="py-2.5 pr-4 font-bold text-xs uppercase">Parameter</th>
                          <th className="py-2.5 px-2 font-bold text-xs uppercase text-center">Current (ppm)</th>
                          <th className="py-2.5 px-2 font-bold text-xs uppercase text-center">Desired (ppm)</th>
                          <th className="py-2.5 pl-4 font-bold text-xs uppercase text-center">Purity (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {/* Alkalinity Row */}
                        <tr>
                          <td className="py-4 pr-4">
                            <span className="font-bold text-[#111111] block text-xs">Alkalinity</span>
                            <div className="mt-1">
                              <span className="text-xs text-slate-400 block font-sans font-bold uppercase tracking-wider mb-0.5">Chemical Source</span>
                              <select
                                value={alkSource}
                                onChange={(e) => setAlkSource(e.target.value)}
                                className="border border-[#CBD5E1] rounded px-2 py-1 text-xs text-[#111111] focus:outline-none focus:border-black bg-gradient-to-b from-white to-[#F1F5F9] cursor-pointer h-7 w-full max-w-[190px] font-sans"
                              >
                                <option value="NaHCO3">Sodium Bicarbonate (NaHCO₃)</option>
                                <option value="Na2CO3">Sodium Carbonate (Na₂CO₃)</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center align-top">
                            <input
                              type="number"
                              step="any"
                              value={alkCurrent}
                              onChange={(e) => setAlkCurrent(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-black mt-4"
                            />
                          </td>
                          <td className="py-4 px-2 text-center align-top">
                            <input
                              type="number"
                              step="any"
                              value={alkTarget}
                              onChange={(e) => setAlkTarget(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-black mt-4"
                            />
                          </td>
                          <td className="py-4 pl-4 text-center align-top">
                            <input
                              type="number"
                              step="any"
                              value={alkPurity}
                              onChange={(e) => setAlkPurity(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-20 text-center focus:outline-none focus:border-black mt-4"
                            />
                          </td>
                        </tr>

                        {/* Calcium Row */}
                        <tr>
                          <td className="py-4 pr-4">
                            <span className="font-bold text-[#111111] block text-xs">Calcium</span>
                            <div className="mt-1">
                              <span className="text-xs text-slate-400 block font-sans font-bold uppercase tracking-wider mb-0.5">Chemical Source</span>
                              <select
                                value={calSource}
                                onChange={(e) => setCalSource(e.target.value)}
                                className="border border-[#CBD5E1] rounded px-2 py-1 text-xs text-[#111111] focus:outline-none focus:border-black bg-gradient-to-b from-white to-[#F1F5F9] cursor-pointer h-7 w-full max-w-[190px] font-sans"
                              >
                                <option value="CaCl2">Calcium Chloride (Anhydrous CaCl₂)</option>
                                <option value="CaCl2_2H2O">Calcium Chloride Dihydrate (CaCl₂·2H₂O)</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center align-top">
                            <input
                              type="number"
                              step="any"
                              value={calCurrent}
                              onChange={(e) => setCalCurrent(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-black mt-4"
                            />
                          </td>
                          <td className="py-4 px-2 text-center align-top">
                            <input
                              type="number"
                              step="any"
                              value={calTarget}
                              onChange={(e) => setCalTarget(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-black mt-4"
                            />
                          </td>
                          <td className="py-4 pl-4 text-center align-top">
                            <input
                              type="number"
                              step="any"
                              value={calPurity}
                              onChange={(e) => setCalPurity(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-20 text-center focus:outline-none focus:border-black mt-4"
                            />
                          </td>
                        </tr>

                        {/* Magnesium Row */}
                        <tr>
                          <td className="py-4 pr-4">
                            <span className="font-bold text-[#111111] block text-xs">Magnesium</span>
                            <div className="mt-1">
                              <span className="text-xs text-slate-400 block font-sans font-bold uppercase tracking-wider mb-0.5">Chemical Source</span>
                              <select
                                value={magSource}
                                onChange={(e) => setMagSource(e.target.value)}
                                className="border border-[#CBD5E1] rounded px-2 py-1 text-xs text-[#111111] focus:outline-none focus:border-black bg-gradient-to-b from-white to-[#F1F5F9] cursor-pointer h-7 w-full max-w-[190px] font-sans"
                              >
                                <option value="MgCl2">Magnesium Chloride (Anhydrous MgCl₂)</option>
                                <option value="MgCl2_6H2O">Magnesium Chloride Hexahydrate (MgCl₂·6H₂O)</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center align-top">
                            <input
                              type="number"
                              step="any"
                              value={magCurrent}
                              onChange={(e) => setMagCurrent(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-black mt-4"
                            />
                          </td>
                          <td className="py-4 px-2 text-center align-top">
                            <input
                              type="number"
                              step="any"
                              value={magTarget}
                              onChange={(e) => setMagTarget(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-black mt-4"
                            />
                          </td>
                          <td className="py-4 pl-4 text-center align-top">
                            <input
                              type="number"
                              step="any"
                              value={magPurity}
                              onChange={(e) => setMagPurity(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-20 text-center focus:outline-none focus:border-black mt-4"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Safety Factor Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-2">
                  <label className="text-xs font-bold text-black block">Dosing Safety Factor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={chemSafetyFactor}
                      onChange={(e) => setChemSafetyFactor(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-black w-28 text-center"
                    />
                    <span className="text-xs text-[#555555]">% of calculated dose</span>
                  </div>
                  <div className="flex items-start gap-1 text-xs text-[#64748B] mt-1.5">
                    <Info className="h-3.5 w-3.5 text-[#64748B] flex-shrink-0 mt-0.5" />
                    <span>Results will be multiplied by this factor as a safety buffer.</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={calculateDosing}
                    className="flex-1 bg-black hover:bg-zinc-800 text-white font-bold py-3 px-6 rounded transition-colors text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Calculate Dosing
                  </button>
                  <button
                    onClick={clearDosing}
                    className="bg-white hover:bg-slate-50 text-[#555555] border border-[#CBD5E1] font-semibold py-3 px-8 rounded transition-colors text-xs cursor-pointer"
                  >
                    Reset Doses
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="border-t border-[#CBD5E1] bg-[#E2E8F0] px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
          <span className="text-[#475569] font-bold text-xs">{status}</span>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-1">
          {/* Logo up: Small logo.png branding icon */}
          <div className="flex items-center gap-1.5 text-black">
            <img src="/logo.png" alt="CrabShack Logo" className="h-5 w-auto object-contain" />
            <span className="font-extrabold text-xs tracking-wide uppercase">CrabShack Water Quality Pro</span>
          </div>
          
          {/* Copyright & Website */}
          <div className="text-xs text-[#64748B] font-semibold flex flex-wrap items-center gap-2">
            <span>© All rights reserved to CrabShack Mangalore</span>
            <span className="text-slate-300">|</span>
            <a 
              href="https://www.crabshack.live" 
              onClick={openWebsite}
              className="text-black hover:underline font-bold cursor-pointer"
            >
              www.crabshack.live
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
