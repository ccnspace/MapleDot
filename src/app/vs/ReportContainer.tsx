"use client";

import { useCharacterStore } from "@/stores/character";
import { CharacterCard } from "./CharacterCard";
import { useVersusInfo } from "@/hooks/useVersusInfo";
import { DimmedLayer } from "@/components/DimmedLayer";

export const ReportContainer = () => {
  const {
    firstPersonInfo,
    secondPersonInfo,
    requestPersonData,
    validateReport,
    isLoading,
  } = useVersusInfo();

  const handleClick = async () => {
    if (validateReport()) {
      // TODO: 비교 리포트 만들기
      const { characterAttributes } = useCharacterStore.getState();
      if (!characterAttributes) return;

      await requestPersonData();
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 mt-5">
        <div className="flex flex-row gap-3 mt-5">
          <CharacterCard
            type="first"
            direction="left"
            characterImageUrl={firstPersonInfo?.basic?.character_image}
          />
          <CharacterCard
            type="second"
            direction="right"
            characterImageUrl={secondPersonInfo?.basic?.character_image}
          />
        </div>
        <button
          onClick={handleClick}
          className="flex justify-center rounded-lg px-6 pt-5 pb-5 text-3xl font-extrabold text-white
        bg-gradient-to-r from-sky-600 to-pink-400"
        >
          비교하기!
        </button>
      </div>
      {isLoading && <DimmedLayer spinner />}
    </>
  );
};
