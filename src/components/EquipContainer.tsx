"use client";

import { useCharacterInfo } from "@/hooks/useCharacterInfo";
import { useEffect, useState } from "react";
import { EquipDetailCard } from "./Equip/EquiqDetailCard";
import { EquipInventory } from "./Equip/EquipInventory";

export const EquipContainer = () => {
  const [selectedEquipName, setSelectedEquipName] = useState("");
  const [preset, setPreset] = useState(0);
  const { characterInfo } = useCharacterInfo(preset);

  const getActivePresetStyle = (_preset: number) => {
    if (preset === _preset)
      return `underline decoration-2 underline-offset-4 decoration-black dark:decoration-slate-300
    `;
    return `underline decoration-2 underline-offset-4 decoration-transparent
    hover:decoration-slate-400
    `;
  };

  useEffect(() => {
    if (!characterInfo) {
      setSelectedEquipName("");
      setPreset(0);
    }
  }, [characterInfo]);

  return (
    <div
      className="flex shrink-0 flex-row bg-slate-100 dark:bg-[#1f2024] px-3 pt-3 pb-3 border
   border-slate-300 dark:border-[#1f2024] rounded-lg gap-6"
    >
      <div className="flex flex-col justify-center">
        {!!characterInfo?.equipments && (
          <div className="flex justify-between mb-2">
            <p
              className="flex font-extrabold text-sm mb-2 px-2 pb-0.5 pt-0.5 
              border-l-4 border-l-lime-400
             "
            >
              일반 장비 아이템
            </p>
            <div className="flex font-bold flex-row gap-3 text-sm mb-2 pb-1 pt-1 rounded-md">
              <button
                onClick={() => setPreset(1)}
                className={`flex text-xs px-1 pt-0.5 pb-0.5 ${getActivePresetStyle(
                  1
                )}`}
              >
                1번 프리셋
              </button>
              <button
                onClick={() => setPreset(2)}
                className={`flex rounded-md text-xs px-1 pt-0.5 pb-0.5 ${getActivePresetStyle(
                  2
                )}`}
              >
                2번 프리셋
              </button>
              <button
                onClick={() => setPreset(3)}
                className={`flex rounded-md text-xs px-1 pt-0.5 pb-0.5 ${getActivePresetStyle(
                  3
                )}`}
              >
                3번 프리셋
              </button>
            </div>
          </div>
        )}
        <EquipInventory
          equipments={characterInfo?.equipments}
          setSelectedEquipName={setSelectedEquipName}
        />
      </div>
      <div className="flex items-center justify-center rounded-lg px-4 pt-4 pb-4 min-w-[360px] bg-slate-200 dark:bg-[#25272e]">
        {!!selectedEquipName && !!characterInfo?.equipments && (
          <EquipDetailCard
            equipData={characterInfo.equipments}
            equipName={selectedEquipName}
          />
        )}
      </div>
    </div>
  );
};
