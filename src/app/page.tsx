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

  const [alkCurrent, setAlkCurrent] = useState<string>("");
  const [alkTarget, setAlkTarget] = useState<string>("");
  const [alkPurity, setAlkPurity] = useState<string>("70");

  const [calCurrent, setCalCurrent] = useState<string>("");
  const [calTarget, setCalTarget] = useState<string>("");
  const [calPurity, setCalPurity] = useState<string>("50");

  const [magCurrent, setMagCurrent] = useState<string>("");
  const [magTarget, setMagTarget] = useState<string>("");
  const [magPurity, setMagPurity] = useState<string>("80");

  // Results
  const [dosingResults, setDosingResults] = useState<{
    alkNeeded: number;
    alkRec: number;
    calNeeded: number;
    calRec: number;
    magNeeded: number;
    magRec: number;
    hasDose: boolean;
  } | null>(null);

  const chemicalPresets: Record<string, { alk: number; cal: number; mag: number }> = {
    Crabs: { alk: 200, cal: 300, mag: 900 },
    Shrimp: { alk: 150, cal: 400, mag: 1200 },
    Lobster: { alk: 120, cal: 420, mag: 1300 },
    Custom: { alk: 200, cal: 300, mag: 900 }
  };

  const handleChemSpeciesChange = (species: string) => {
    setChemSpecies(species);
    if (species !== "Custom") {
      setAlkTarget(chemicalPresets[species].alk.toString());
      setCalTarget(chemicalPresets[species].cal.toString());
      setMagTarget(chemicalPresets[species].mag.toString());
    }
  };

  const calculateDosing = () => {
    const vol = parseFloat(chemVolume);
    const safety = parseFloat(chemSafetyFactor) / 100;

    if (isNaN(vol) || isNaN(safety) || vol <= 0 || safety <= 0) {
      setStatus("Error: Please provide valid volume and safety factor values.");
      return;
    }

    // Alkalinity (NaHCO3)
    const alkC = parseFloat(alkCurrent);
    const alkT = parseFloat(alkTarget);
    const alkP = parseFloat(alkPurity);
    let alkNeeded = 0;
    if (!isNaN(alkC) && !isNaN(alkT) && !isNaN(alkP) && alkT > alkC && alkP > 0) {
      alkNeeded = vol * (alkT - alkC) * (1.68 / 1000) * (100 / alkP);
    }

    // Calcium (CaCl2)
    const calC = parseFloat(calCurrent);
    const calT = parseFloat(calTarget);
    const calP = parseFloat(calPurity);
    let calNeeded = 0;
    if (!isNaN(calC) && !isNaN(calT) && !isNaN(calP) && calT > calC && calP > 0) {
      calNeeded = vol * (calT - calC) * (3.67 / 1000) * (100 / calP);
    }

    // Magnesium (MgCl2)
    const magC = parseFloat(magCurrent);
    const magT = parseFloat(magTarget);
    const magP = parseFloat(magPurity);
    let magNeeded = 0;
    if (!isNaN(magC) && !isNaN(magT) && !isNaN(magP) && magT > magC && magP > 0) {
      magNeeded = vol * (magT - magC) * (8.36 / 1000) * (100 / magP);
    }

    setDosingResults({
      alkNeeded,
      alkRec: alkNeeded * safety,
      calNeeded,
      calRec: calNeeded * safety,
      magNeeded,
      magRec: magNeeded * safety,
      hasDose: alkNeeded > 0 || calNeeded > 0 || magNeeded > 0
    });

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
    setDosingResults(null);
    setStatus("Ready");
  };

  return (
    <div className="flex flex-col h-screen select-none bg-[#EDF2F7] text-sm">
      {/* Top Banner (Header) */}
      <header className="bg-[#1B365D] px-8 py-5 flex flex-col justify-center flex-shrink-0 text-white shadow-md">
        <h1 className="text-2xl font-bold tracking-wide">Culture Tank Water Calculator</h1>
        <p className="text-sm text-[#93C5FD] mt-1 font-medium">Volume & Chemical Dosing Tool</p>
      </header>

      {/* Tabs Menu */}
      <nav className="flex bg-[#E2E8F0] border-b border-[#CBD5E1] flex-shrink-0 px-8 pt-3">
        <button
          onClick={() => setActiveTab("volume")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-t border-t border-x border-[#CBD5E1] -mb-[1px] transition-colors focus:outline-none ${
            activeTab === "volume"
              ? "bg-[#EDF2F7] text-[#1B365D] border-t-2 border-t-[#1B365D] font-extrabold z-10 text-sm"
              : "bg-[#E2E8F0] text-[#64748B] hover:bg-slate-50 border-transparent hover:text-black"
          }`}
        >
          <Cylinder className="h-4 w-4 text-[#1B365D]" />
          <span>Tank Volume</span>
        </button>
        <button
          onClick={() => setActiveTab("salinity")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-t border-t border-x border-[#CBD5E1] -mb-[1px] transition-colors focus:outline-none ${
            activeTab === "salinity"
              ? "bg-[#EDF2F7] text-[#1B365D] border-t-2 border-t-[#1B365D] font-extrabold z-10 text-sm"
              : "bg-[#E2E8F0] text-[#64748B] hover:bg-slate-50 border-transparent hover:text-black"
          }`}
        >
          <Droplets className="h-4 w-4 text-[#1B365D]" />
          <span>Salinity</span>
        </button>
        <button
          onClick={() => setActiveTab("dosing")}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-t border-t border-x border-[#CBD5E1] -mb-[1px] transition-colors focus:outline-none ${
            activeTab === "dosing"
              ? "bg-[#EDF2F7] text-[#1B365D] border-t-2 border-t-[#1B365D] font-extrabold z-10 text-sm"
              : "bg-[#E2E8F0] text-[#64748B] hover:bg-slate-50 border-transparent hover:text-black"
          }`}
        >
          <FlaskConical className="h-4 w-4 text-[#1B365D]" />
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
                    <div className="font-mono text-xs text-[#111111] leading-relaxed">
                      <div className="text-center font-bold text-slate-500 py-1">
                        ──────────────────────────────────────────────
                      </div>
                      <div className="text-center font-bold text-sm text-[#1B365D] tracking-wide uppercase py-1">
                        TANK VOLUME RESULTS
                      </div>
                      <div className="text-center font-bold text-slate-500 py-1">
                        ──────────────────────────────────────────────
                      </div>
                      
                      <div className="mt-4 space-y-3 pl-2">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Tank Shape</div>
                          <div className="text-xs font-extrabold text-[#111111]">{calcShape}</div>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">{calcDimLabel1}</div>
                          <div className="text-xs font-extrabold text-[#111111]">{calcDimVal1}</div>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">{calcDimLabel2}</div>
                          <div className="text-xs font-extrabold text-[#111111]">{calcDimVal2}</div>
                        </div>

                        {calcDimLabel3 && (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">{calcDimLabel3}</div>
                            <div className="text-xs font-extrabold text-[#111111]">{calcDimVal3}</div>
                          </div>
                        )}
                      </div>

                      <div className="text-center font-bold text-slate-400 mt-5 py-1">
                        ──────────────────────────────────────────────
                      </div>
                      
                      <div className="mt-4 space-y-3 pl-2">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Tank Capacity</div>
                          <div className="text-sm font-extrabold text-[#1B365D]">{calcCapacityM3?.toFixed(2)} m³</div>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Water Volume</div>
                          <div className="text-sm font-extrabold text-[#1B365D]">{calcVolumeLiters?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Liters</div>
                        </div>
                      </div>

                      <div className="text-center font-bold text-slate-400 mt-5 py-1">
                        ──────────────────────────────────────────────
                      </div>

                      <div className="mt-4 pl-2 text-xs font-semibold text-emerald-600 flex items-start gap-2">
                        <span>✓</span>
                        <span>Water volume has been automatically loaded<br/>into the Salinity and Chemical Dosing modules.</span>
                      </div>

                      <div className="text-center font-bold text-slate-400 mt-4 py-1">
                        ──────────────────────────────────────────────
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center py-20 text-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B365D] border-b border-[#E2E8F0] pb-2 mb-4 w-full">
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
                    <div className="space-y-5 text-sm">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#1B365D] border-b border-[#E2E8F0] pb-2 mb-4">
                        CALCULATED RESULTS
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</div>
                          <div className="text-sm font-extrabold text-[#1B365D]">{salResultAction}</div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salinity Increase</div>
                          <div className="text-sm font-extrabold text-[#111111]">{salResultDiff}</div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salt Required</div>
                          <div className="text-sm font-extrabold text-[#111111]">{salResultRequired}</div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommended Dose</div>
                          <div className="text-sm font-extrabold text-[#1B365D]">{salResultRecommended}</div>
                        </div>

                        <div className="pt-2 border-t border-[#E2E8F0]">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Protocol</div>
                          <p className="text-xs font-semibold text-[#111111] leading-relaxed bg-slate-50 border border-[#CBD5E1] p-3 rounded">
                            {salResultProtocol}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center py-20 text-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B365D] border-b border-[#E2E8F0] pb-2 mb-4 w-full">
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
                  dosingResults !== null ? (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B365D] border-b border-[#E2E8F0] pb-2 mb-4">
                        Calculated Results
                      </h3>
                      {dosingResults.hasDose ? (
                        <div className="space-y-3 text-xs">
                          {dosingResults.alkNeeded > 0 && (
                            <div className="p-3 bg-slate-50 border border-[#CBD5E1] rounded">
                              <span className="font-bold text-[#1B365D] block mb-1">Alkalinity Buffer</span>
                              <div className="flex justify-between">
                                <span>Pure Chemical:</span>
                                <strong>{dosingResults.alkNeeded.toFixed(1)} g</strong>
                              </div>
                              <div className="flex justify-between text-[#2563EB] font-semibold mt-0.5">
                                <span>Recommended Dose:</span>
                                <strong>{dosingResults.alkRec.toFixed(1)} g</strong>
                              </div>
                            </div>
                          )}
                          {dosingResults.calNeeded > 0 && (
                            <div className="p-3 bg-slate-50 border border-[#CBD5E1] rounded">
                              <span className="font-bold text-[#1B365D] block mb-1">Calcium Supplement</span>
                              <div className="flex justify-between">
                                <span>Pure Chemical:</span>
                                <strong>{dosingResults.calNeeded.toFixed(1)} g</strong>
                              </div>
                              <div className="flex justify-between text-[#2563EB] font-semibold mt-0.5">
                                <span>Recommended Dose:</span>
                                <strong>{dosingResults.calRec.toFixed(1)} g</strong>
                              </div>
                            </div>
                          )}
                          {dosingResults.magNeeded > 0 && (
                            <div className="p-3 bg-slate-50 border border-[#CBD5E1] rounded">
                              <span className="font-bold text-[#1B365D] block mb-1">Magnesium Supplement</span>
                              <div className="flex justify-between">
                                <span>Pure Chemical:</span>
                                <strong>{dosingResults.magNeeded.toFixed(1)} g</strong>
                              </div>
                              <div className="flex justify-between text-[#2563EB] font-semibold mt-0.5">
                                <span>Recommended Dose:</span>
                                <strong>{dosingResults.magRec.toFixed(1)} g</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-[#16A34A] font-semibold bg-emerald-50 border border-emerald-150 p-3 rounded">
                          All current water parameters match or exceed target thresholds. No chemical dosing required.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center py-20 text-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B365D] border-b border-[#E2E8F0] pb-2 mb-4 w-full">
                        Calculated Results
                      </h3>
                      <p className="text-xs text-[#94A3B8] italic">
                        Configure dosing values and click Calculate.
                      </p>
                    </div>
                  )
                )}

              </div>
              <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 border-t border-[#E2E8F0] pt-3 mt-4">
                <Info className="h-4 w-4 text-[#1B365D]" />
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
                  <h3 className="text-xs font-bold text-[#1B365D] uppercase tracking-wider">Tank Shape</h3>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer">
                      <input
                        type="radio"
                        name="shape-type"
                        checked={shape === "circular"}
                        onChange={() => setShape("circular")}
                        className="accent-[#1B365D]"
                      />
                      <span>Circular Tank</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#111111] cursor-pointer">
                      <input
                        type="radio"
                        name="shape-type"
                        checked={shape === "rectangular"}
                        onChange={() => setShape("rectangular")}
                        className="accent-[#1B365D]"
                      />
                      <span>Rectangular Tank</span>
                    </label>
                  </div>
                </div>

                {/* Dimensions White Panel */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-[#1B365D]">
                    {shape === "circular" ? "Circular Tank Dimensions" : "Rectangular Tank Dimensions"}
                  </h4>

                  {shape === "circular" ? (
                    <div className="flex flex-wrap gap-8 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#555555]">Diameter</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={diameter}
                            onChange={(e) => setDiameter(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-36"
                          />
                          <span className="text-xs text-[#555555]">m</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#555555]">Height</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-36"
                          />
                          <span className="text-xs text-[#555555]">m</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-8 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#555555]">Length</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-28"
                          />
                          <span className="text-xs text-[#555555]">m</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#555555]">Width</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-28"
                          />
                          <span className="text-xs text-[#555555]">m</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-[#555555]">Height</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={rectHeight}
                            onChange={(e) => setRectHeight(e.target.value)}
                            className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-28"
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
                    className="flex-1 bg-[#1B365D] hover:bg-[#152C52] text-white font-bold py-3 px-6 rounded transition-colors text-xs uppercase tracking-wider cursor-pointer"
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
                  <label className="text-xs font-bold text-[#1B365D] block">Water Volume</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={salVolume}
                      onChange={(e) => setSalVolume(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-56 font-bold"
                    />
                    <span className="text-xs text-[#555555]">Liters</span>
                  </div>
                  <div className="flex items-start gap-1 text-[10px] text-[#64748B] mt-1.5">
                    <Info className="h-3.5 w-3.5 text-[#64748B] flex-shrink-0 mt-0.5" />
                    <span>Auto-populated from Tank Volume tab. You can override this value.</span>
                  </div>
                </div>

                {/* Species Preset Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-2">
                  <label className="text-xs font-bold text-[#1B365D] block">Species Preset</label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#555555]">Select species:</span>
                    <select
                      value={salSpecies}
                      onChange={(e) => handleSalSpeciesChange(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-1 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] bg-gradient-to-b from-white to-[#F1F5F9] cursor-pointer h-8"
                    >
                      <option value="Crabs">Crabs</option>
                      <option value="Shrimp">Shrimp</option>
                      <option value="Lobster">Lobster</option>
                      <option value="Custom">Custom Target</option>
                    </select>
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-1">
                    Preset: Desired salinity <strong className="text-[#1B365D]">{salinityPresets[salSpecies]} ppt</strong>
                  </div>
                </div>

                {/* Salinity Parameters Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-[#1B365D]">Salinity Parameters</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between max-w-sm">
                      <span className="text-xs text-[#555555]">Current Salinity</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={salCurrent}
                          onChange={(e) => setSalCurrent(e.target.value)}
                          className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-28 text-center"
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
                          className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-28 text-center"
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
                          className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-28 text-center"
                        />
                        <span className="text-xs text-[#555555] w-8">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={calculateSalinity}
                    className="flex-1 bg-[#1B365D] hover:bg-[#152C52] text-white font-bold py-3 px-6 rounded transition-colors text-xs uppercase tracking-wider cursor-pointer"
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
                  <label className="text-xs font-bold text-[#1B365D] block">Water Volume</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={chemVolume}
                      onChange={(e) => setChemVolume(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-56 font-bold"
                    />
                    <span className="text-xs text-[#555555]">Liters</span>
                  </div>
                </div>

                {/* Species Preset Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-2">
                  <label className="text-xs font-bold text-[#1B365D] block">Species Preset</label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#555555]">Select species:</span>
                    <select
                      value={chemSpecies}
                      onChange={(e) => handleChemSpeciesChange(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] bg-gradient-to-b from-white to-[#F1F5F9] cursor-pointer h-8"
                    >
                      <option value="Crabs">Crabs</option>
                      <option value="Shrimp">Shrimp</option>
                      <option value="Lobster">Lobster</option>
                      <option value="Custom">Custom Target</option>
                    </select>
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-1 font-medium">
                    Presets: Alkalinity <strong className="text-[#1B365D]">{chemicalPresets[chemSpecies].alk} ppm</strong> - Calcium <strong className="text-[#1B365D]">{chemicalPresets[chemSpecies].cal} ppm</strong> - Magnesium <strong className="text-[#1B365D]">{chemicalPresets[chemSpecies].mag} ppm</strong>
                  </div>
                </div>

                {/* Water Parameters Matrix Table Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-[#1B365D]">Water Parameters</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#CBD5E1] text-[#64748B] font-semibold">
                          <th className="py-2.5 pr-4 font-bold text-[10px] uppercase">Parameter</th>
                          <th className="py-2.5 px-2 font-bold text-[10px] uppercase text-center">Current (ppm)</th>
                          <th className="py-2.5 px-2 font-bold text-[10px] uppercase text-center">Desired (ppm)</th>
                          <th className="py-2.5 pl-4 font-bold text-[10px] uppercase text-center">Purity (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {/* Alkalinity Row */}
                        <tr>
                          <td className="py-4 pr-4">
                            <span className="font-bold text-[#111111] block">Alkalinity</span>
                            <span className="text-[10px] text-[#64748B]">NaHCO₃</span>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={alkCurrent}
                              onChange={(e) => setAlkCurrent(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-[#1B365D]"
                            />
                          </td>
                          <td className="py-4 px-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={alkTarget}
                              onChange={(e) => setAlkTarget(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-[#1B365D]"
                            />
                          </td>
                          <td className="py-4 pl-4 text-center">
                            <input
                              type="number"
                              step="any"
                              value={alkPurity}
                              onChange={(e) => setAlkPurity(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-20 text-center focus:outline-none focus:border-[#1B365D]"
                            />
                          </td>
                        </tr>

                        {/* Calcium Row */}
                        <tr>
                          <td className="py-4 pr-4">
                            <span className="font-bold text-[#111111] block">Calcium</span>
                            <span className="text-[10px] text-[#64748B]">CaCl₂</span>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={calCurrent}
                              onChange={(e) => setCalCurrent(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-[#1B365D]"
                            />
                          </td>
                          <td className="py-4 px-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={calTarget}
                              onChange={(e) => setCalTarget(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-[#1B365D]"
                            />
                          </td>
                          <td className="py-4 pl-4 text-center">
                            <input
                              type="number"
                              step="any"
                              value={calPurity}
                              onChange={(e) => setCalPurity(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-20 text-center focus:outline-none focus:border-[#1B365D]"
                            />
                          </td>
                        </tr>

                        {/* Magnesium Row */}
                        <tr>
                          <td className="py-4 pr-4">
                            <span className="font-bold text-[#111111] block">Magnesium</span>
                            <span className="text-[10px] text-[#64748B]">MgCl₂</span>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={magCurrent}
                              onChange={(e) => setMagCurrent(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-[#1B365D]"
                            />
                          </td>
                          <td className="py-4 px-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={magTarget}
                              onChange={(e) => setMagTarget(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-24 text-center focus:outline-none focus:border-[#1B365D]"
                            />
                          </td>
                          <td className="py-4 pl-4 text-center">
                            <input
                              type="number"
                              step="any"
                              value={magPurity}
                              onChange={(e) => setMagPurity(e.target.value)}
                              className="border border-[#CBD5E1] rounded px-2.5 py-1.5 text-xs text-[#111111] w-20 text-center focus:outline-none focus:border-[#1B365D]"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Safety Factor Box */}
                <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-sm space-y-2">
                  <label className="text-xs font-bold text-[#1B365D] block">Dosing Safety Factor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={chemSafetyFactor}
                      onChange={(e) => setChemSafetyFactor(e.target.value)}
                      className="border border-[#CBD5E1] rounded px-3 py-1.5 text-xs text-[#111111] focus:outline-none focus:border-[#1B365D] w-28 text-center"
                    />
                    <span className="text-xs text-[#555555]">% of calculated dose</span>
                  </div>
                  <div className="flex items-start gap-1 text-[10px] text-[#64748B] mt-1.5">
                    <Info className="h-3.5 w-3.5 text-[#64748B] flex-shrink-0 mt-0.5" />
                    <span>Results will be multiplied by this factor as a safety buffer.</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={calculateDosing}
                    className="flex-1 bg-[#1B365D] hover:bg-[#152C52] text-white font-bold py-3 px-6 rounded transition-colors text-xs uppercase tracking-wider cursor-pointer"
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
      <footer className="border-t border-[#CBD5E1] bg-[#E2E8F0] px-8 py-2.5 text-xs flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] animate-pulse"></span>
          <span className="text-[#475569] font-medium">{status}</span>
        </div>
        <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Culture Tank Water Calculator</span>
      </footer>
    </div>
  );
}
