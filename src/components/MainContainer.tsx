"use client";

import { EquipContainer } from "@/components/EquipContainer";
import { AbilityContainer } from "@/components/AbilityContainer";
import { StatContainer } from "@/components/StatContainer";
import { PetEquipContainer } from "@/components/PetEquipContainer";
import { ChartContainer } from "@/components/ChartContainer";
import { DimmedLayer } from "./DimmedLayer";
import { useCharacterStore } from "@/stores/character";

export const MainContainer = () => {
  const fetchStatus = useCharacterStore((state) => state.fetchStatus);

  return (
    <div className="main_container flex flex-col w-[1280px] gap-5 px-5 pt-8 pb-8">
      <div className="flex gap-5 h-auto">
        <StatContainer />
        <EquipContainer />
        <div className="flex flex-col gap-5">
          <AbilityContainer />
          <PetEquipContainer />
        </div>
      </div>
      <div className="flex gap-5">
        {/* <ChartContainer /> */}
        {/* <ExpContainer /> */}
      </div>
      {fetchStatus === "loading" && <DimmedLayer spinner />}
    </div>
  );
};
