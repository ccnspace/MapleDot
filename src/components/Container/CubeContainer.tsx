import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useThrottle } from "@/hooks/useThrottle";
import { useCubeStore } from "@/stores/cube";
import { ItemPotentialGrade } from "@/types/Equipment";
import { CubeSimulator, getItemOptionPool } from "@/utils/CubeSimulator";
import Image from "next/image";
import rollCubeSound from "@/app/sound/ScrollSuccess.mp3";
import completeSound from "@/app/sound/AchievmentComplete.mp3";
import CheckBox from "../CheckBox";
import potentialImg from "@/images/potentialBg.png";
import { Divider } from "../Equip/Divider";
import { SelectBox } from "../SelectBox";

const getGradeBackground = (grade: ItemPotentialGrade) => {
  if (grade === "레어") {
    return `bg-sky-500`;
  }
  if (grade === "에픽") {
    return "bg-purple-600";
  }
  if (grade === "유니크") {
    return "bg-yellow-500";
  }
  return "bg-lime-500";
};

const { firstLine, secondLine, thirdLine } = getItemOptionPool("무기", "레전드리", "120");
const firstOptions = firstLine.map((option) => option.name);
const secondOptions = secondLine.map((option) => option.name);
const thirdOptions = thirdLine.map((option) => option.name);

export const CubeContainer = () => {
  const targetItem = useCubeStore((state) => state.targetItem);
  const cubeType = useCubeStore((state) => state.cubeType);
  const resetCube = useCubeStore((state) => state.resetCube);
  const {
    itemLevel,
    itemType,
    itemIcon,
    itemName,
    itemPotentialGrade = "레어",
    additionalPotentialGrade = "레어",
    currentPotentialOptions = [],
    currentAdditionalOptions = [],
  } = targetItem || {};

  const [prevOptions, setPrevOptions] = useState<string[]>([]);
  const [newOptions, setNewOptions] = useState<string[]>([]);
  const [prevGrade, setPrevGrade] = useState<ItemPotentialGrade>();
  const [afterGrade, setAfterGrade] = useState<ItemPotentialGrade>();
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [currentGuarantee, setCurrentGuarantee] = useState<number>(0);
  const [gradeUpInfos, setGradeUpInfos] = useState<string[]>([]);
  const [fadeIn, setFadeIn] = useState(false);
  const [glow, setGlow] = useState(false);
  const cubeTitle = cubeType === "potential" ? "잠재능력" : "에디셔널 잠재능력";

  const [isSoundChecked, setIsSoundChecked] = useState(true);
  const [isMiracleChecked, setIsMiracleChecked] = useState(false);

  /** 스피드 모드 state */
  const [firstSpeedOption, setFirstSpeedOption] = useState(firstOptions[0]);
  const [secondSpeedOption, setSecondSpeedOption] = useState(secondOptions[0]);
  const [thirdSpeedOption, setThirdSpeedOption] = useState(thirdOptions[0]);

  /** 기록실 */
  const [records, setRecords] = useState<string[]>([]);

  const rollCubeAudio = useRef(new Audio(rollCubeSound));
  const gradeUpAudio = useRef(new Audio(completeSound));
  rollCubeAudio.current.volume = 0.5;
  gradeUpAudio.current.volume = 0.3;

  const remainGradeUpRatio = (() => {
    if (currentGuarantee === 0) return 0;
    return currentAttempt / currentGuarantee;
  })();

  const cubeSimulator = useMemo(
    () =>
      new CubeSimulator({
        initItemGrade: itemPotentialGrade ?? "레어",
        initItemOptions: currentPotentialOptions,
        initAdditionalGrade: additionalPotentialGrade ?? "레어",
        initAdditionalOptions: currentAdditionalOptions,
        itemLevel: itemLevel ?? 0,
        itemType: itemType ?? "무기",
        cubeType,
      }),
    [itemPotentialGrade, itemLevel, additionalPotentialGrade, currentAdditionalOptions, cubeType, itemType, currentPotentialOptions]
  );

  const playRollCubeAudio = useCallback(() => {
    if (isSoundChecked) {
      rollCubeAudio.current.pause();
      rollCubeAudio.current.currentTime = 0;
      rollCubeAudio.current.play();
    }
  }, [isSoundChecked]);

  const playGradeUpAudio = useCallback(() => {
    if (isSoundChecked) {
      gradeUpAudio.current.play();
    }
  }, [isSoundChecked]);

  const startRollCube = useCallback(() => {
    // simulator 동작
    cubeSimulator.rollCube();

    playRollCubeAudio();

    const {
      prevOptions,
      currentOptions,
      prevGrade: simulatorPrevGrade,
      currentGrade: simulatorCurrentGrade,
      currentAttempt,
      currentGuarantee,
    } = cubeSimulator.getItemState();

    setPrevOptions(prevOptions);
    setNewOptions(currentOptions);

    setPrevGrade(simulatorPrevGrade);
    setAfterGrade(simulatorCurrentGrade);

    setCurrentAttempt(currentAttempt);
    setCurrentGuarantee(currentGuarantee);

    if (simulatorPrevGrade !== simulatorCurrentGrade) {
      playGradeUpAudio();
    }
  }, [playRollCubeAudio, playGradeUpAudio]);

  const handleRollCubeClick = useThrottle(() => {
    // simulator 동작
    cubeSimulator.rollCube();

    playRollCubeAudio();

    const {
      prevOptions,
      currentOptions,
      prevGrade: simulatorPrevGrade,
      currentGrade: simulatorCurrentGrade,
      currentAttempt,
      currentGuarantee,
    } = cubeSimulator.getItemState();

    setPrevOptions(prevOptions);
    setNewOptions(currentOptions);

    setPrevGrade(simulatorPrevGrade);
    setAfterGrade(simulatorCurrentGrade);

    setCurrentAttempt(currentAttempt);
    setCurrentGuarantee(currentGuarantee);

    if (simulatorPrevGrade !== simulatorCurrentGrade) {
      playGradeUpAudio();
    }
  }, 500);

  const showAfterButton = prevGrade === afterGrade;
  const handleAfterButtonClick = () => {
    const { currentOptions } = cubeSimulator.getItemState();
    cubeSimulator.setPrevOptions(currentOptions);
    setPrevOptions(currentOptions);
  };

  useEffect(() => {
    setFadeIn(true);

    const timer = setTimeout(() => {
      setFadeIn(false);
    }, 500);

    return () => {
      setFadeIn(false);
      clearTimeout(timer);
    };
  }, [newOptions]);

  useEffect(() => {
    if (!afterGrade) return;
    if (prevGrade === afterGrade) return;

    const { failedAttempts } = cubeSimulator.getItemState();
    const gradeIndex = ["레어", "에픽", "유니크"].findIndex((item) => item === prevGrade);
    const attempts = failedAttempts[gradeIndex] + 1;

    setRecords((prev) => [...prev, `${prevGrade}->${afterGrade} ${attempts}번만에 등급 업!`]);

    setGlow(true);
    setTimeout(() => {
      setGlow(false);
    }, 1000);
  }, [prevGrade, afterGrade]);

  useEffect(() => {
    const grade = cubeType === "potential" ? itemPotentialGrade : additionalPotentialGrade;
    const options = cubeType === "potential" ? currentPotentialOptions : currentAdditionalOptions;

    if (!grade || !options) return;

    setPrevGrade(grade);
    setPrevOptions(options);
  }, [cubeType, itemPotentialGrade, additionalPotentialGrade, currentPotentialOptions, currentAdditionalOptions]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const inputKey = e.key;
      if (inputKey === "d") {
        handleRollCubeClick();
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [handleRollCubeClick]);

  useEffect(() => {
    cubeSimulator.setMiracleTime(isMiracleChecked);
    const gradeUpInfos = cubeSimulator.getCurrentGradeUpInfo().map((item, idx) => {
      const gradeName = ["레어→에픽", "에픽→유니크", "유니크→레전드리"][idx];
      return `${gradeName}: ${(item.chance * 100).toFixed(4)}%`;
    });
    setGradeUpInfos(gradeUpInfos);
  }, [cubeSimulator, isMiracleChecked]);

  /** 스피드 옵션 */
  const [isSpeedMode, setSpeedMode] = useState(false);
  const timer = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (isSpeedMode) {
      setIsSoundChecked(false);
      timer.current = setInterval(() => {
        startRollCube();
      }, 50);
    } else {
      clearTimeout(timer.current);
    }
    return () => {
      clearTimeout(timer.current);
    };
  }, [isSpeedMode, startRollCube]);

  const speedOptions = [firstSpeedOption, secondSpeedOption, thirdSpeedOption];
  useEffect(() => {
    if (!isSpeedMode || !newOptions.length) return;

    const sortedSpeedOptions = [...speedOptions].sort();
    const sortedNewOptions = [...newOptions].sort();
    const isAllMatched = sortedSpeedOptions.every((item, idx) => item === sortedNewOptions[idx]);
    if (isAllMatched) {
      setSpeedMode(false);
      setRecords((prev) => [...prev, `${newOptions.join("/")} ${currentAttempt}번만에 획득`]);
    }
  }, [isSpeedMode, speedOptions, newOptions, currentAttempt]);

  if (!targetItem) return null;

  return (
    <>
      <div style={{ zIndex: 1002 }} className="flex fixed top-[30%] left-[45%]">
        <div
          className={`flex p-1 flex-col items-center gap-2 text-white rounded-lg
             bg-black/70 border ${isMiracleChecked ? "border-lime-300/70" : "border-white/30"} p-2 align-center 
             justify-center w-[312px] ${glow ? "cube-glow" : ""}`}
        >
          {isMiracleChecked ? (
            <p className="text-sm font-bold text-lime-400">✨✨ 지금은 미라클 타임!! ✨✨</p>
          ) : (
            <p className="text-sm font-bold">{`아이템의 ${cubeTitle}을 재설정합니다.`}</p>
          )}
          <div className="flex flex-col p-1 rounded-lg bg-gradient-to-b from-gray-200 to-gray-300 gap-2">
            <div className="relative flex flex-col gap-2 items-center justify-center w-[280px] h-[124px] rounded-md bg-slate-700">
              <Image className="rounded-md" src={potentialImg} alt="potential-bg" layout="fill" objectFit="cover" objectPosition="center" />
              {itemIcon && (
                <div style={{ zIndex: 1000 }} className="mt-7 mb-5">
                  <Image
                    style={{ imageRendering: "pixelated" }}
                    src={itemIcon}
                    alt={itemName || "cube-target"}
                    unoptimized
                    width={40}
                    height={40}
                  />
                </div>
              )}
              <div className="flex border border-slate-800 bg-slate-800 w-[260px] relative h-3.5 rounded-sm">
                <p
                  className="absolute mx-auto text-xs font-extralight text-white"
                  style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >{`${currentAttempt} / ${currentGuarantee}`}</p>
                <div
                  style={{ width: `${remainGradeUpRatio * 100}%`, transition: "width 0.5s ease" }}
                  className="flex bg-gradient-to-r from-sky-400 to-blue-600 h-3 rounded-sm"
                />
              </div>
            </div>
            <div className="flex flex-col w-[280px] rounded-md bg-sky-500">
              <p className="text-sm px-1 pt-1 pb-0.5 font-bold [text-shadow:_1px_2px_4px_rgb(0_0_0/_0.4)]">BEFORE</p>
              <div className="flex flex-col gap-0.5 bg-gradient-to-br from-slate-800 to-slate-900 m-1 text-sm rounded-md min-h-[96px]">
                {prevGrade && (
                  <p className={`flex justify-center mb-1 font-medium rounded-tl-md rounded-tr-md ${getGradeBackground(prevGrade)}`}>
                    {prevGrade}
                  </p>
                )}
                {prevOptions?.map((option, idx) => (
                  <p key={idx} className="font-medium px-2 text-sm">
                    {option}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex flex-col w-[280px] rounded-md bg-sky-500">
              <div className="flex flex-row items-center justify-between">
                <p className="text-sm px-1 pt-1 pb-0.5 font-bold [text-shadow:_1px_2px_4px_rgb(0_0_0/_0.4)]">AFTER</p>
                {showAfterButton && (
                  <button
                    onClick={handleAfterButtonClick}
                    className="text-sm px-2.5 mr-2 rounded-md font-bold text-black cursor-pointer
                bg-gradient-to-b from-yellow-300 to-yellow-400
                hover:from-yellow-400 hover:to-yellow-500
                "
                  >
                    선택
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-0.5 bg-gradient-to-br from-slate-800 to-slate-900 m-1 text-sm rounded-md min-h-[96px]">
                {afterGrade && (
                  <p className={`flex justify-center mb-1 font-medium rounded-tl-md rounded-tr-md ${getGradeBackground(afterGrade)}`}>
                    {afterGrade}
                  </p>
                )}
                {newOptions?.map((option, idx) => (
                  <p key={idx} className={`font-medium px-2 text-sm ${fadeIn ? "fade-in" : ""}`}>
                    {option}
                  </p>
                ))}
              </div>
            </div>
            <button
              onClick={handleRollCubeClick}
              className="flex justify-center border-2 border-white/50 bg-gradient-to-r from-lime-300 to-lime-400 hover:from-lime-400 hover:to-lime-500 text-sm font-bold text-black rounded-md p-1"
            >
              <p className="flex">한 번 더 재설정하기(혹은 [D]키 입력)</p>
            </button>
          </div>
        </div>
        {/* 큐브 유틸리티 영역 */}
        <div
          className={`flex p-2 flex-col gap-1 text-white rounded-lg
             bg-black/70 border border-white/30 w-[300px]`}
        >
          <div className="flex p-1 flex-col gap-1">
            <p className="text-sm font-bold mb-1 bg-white/20 p-1 rounded-md">⚙️ 기본 설정</p>
            <div className="flex gap-2 justify-center ">
              <CheckBox label={"큐브 사운드 재생"} checked={isSoundChecked} onChange={setIsSoundChecked} disabled={isSpeedMode} />
              <CheckBox label={"미라클 타임"} checked={isMiracleChecked} onChange={setIsMiracleChecked} />
            </div>
            <Divider />
            <div className="flex items-center justify-center flex-col gap-0.5 text-black dark:text-white">
              <p className="text-sm w-full font-bold mb-1 bg-white/20 p-1 rounded-md text-white">⚡초스피드 모드</p>
              <p style={{ fontSize: "12px" }} className="flex mb-1 font-light text-white/90">
                순서 관계없이 선택한 3가지 옵션이 나올 때까지 재설정
              </p>
              <SelectBox options={firstOptions} onSelect={setFirstSpeedOption}></SelectBox>
              <SelectBox options={secondOptions} onSelect={setSecondSpeedOption}></SelectBox>
              <SelectBox options={thirdOptions} onSelect={setThirdSpeedOption}></SelectBox>
              <button
                className="text-white font-bold w-[50%] text-xs p-1 mt-1.5 rounded-md flex
                justify-center bg-gradient-to-tr from-sky-600 to-blue-700
                hover:bg-gradient-to-tr hover:from-sky-800 hover:to-blue-900
                "
                onClick={() => setSpeedMode((prev) => !prev)}
              >
                <p>{isSpeedMode ? "OFF" : "🔥START🔥"}</p>
              </button>
            </div>
            <Divider />
            <div className="flex flex-col">
              <p className="text-sm font-bold mb-1 bg-white/20 p-1 rounded-md text-white">⏱️ 기록실</p>
              <div className="flex break-words overflow-y-scroll h-[72px] flex-col gap-1 bg-black/60 rounded-md p-2 text-xs text-white">
                {records.map((item, idx) => (
                  <p key={idx}>·{item}</p>
                ))}
              </div>
            </div>
            <Divider />
            <div className="flex justify-center">
              <div className="flex flex-col min-w-[214px] gap-0.5 text-xs bg-gradient-to-br from-slate-500 to-slate-600 rounded-md p-1.5">
                <p className="font-bold">{`🎲 ${cubeTitle} 등급 상승 확률`}</p>
                {gradeUpInfos.map((item, idx) => (
                  <p key={idx} className="font-light">
                    · {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{ zIndex: 1001 }}
        onClick={resetCube}
        className="fixed z-50 top-0 left-0 w-full h-full flex justify-center items-center opacity-50 bg-black"
      />
    </>
  );
};
