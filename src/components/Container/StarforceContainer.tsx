import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useStarforceStore } from "@/stores/starforce";
import CheckBox from "../CheckBox";
import Image from "next/image";
import { NormalContainer } from "@/components/Equip/normal/Container";
import { type StarforceResult, StarforceSimulator } from "@/utils/StarforceSimulator";
import { ItemEquipment } from "@/types/Equipment";
import { StarforceProbability } from "@/utils/starforceUtils";
import { StarforceDetail } from "@/components/Starforce/StarforceDetail";
import { StarforceResultLabel } from "@/components/Starforce/StarforceResultLabel";
import { formatKoreanNumber } from "@/utils/formatKoreanNum";
import { useThrottle } from "@/hooks/useThrottle";
import { SelectBox } from "../SelectBox";
import { StarforceRecords } from "../Starforce/StarforceRecords";
import { openModal } from "@/utils/openModal";

const MVP_OPTIONS = ["실버(메소 3%↓)", "골드(메소 5%↓)", "레드(메소 10%↓)"];
const getMaxStarforce = (baseEquipmentLevel: number) => {
  if (baseEquipmentLevel <= 94) return 5;
  if (baseEquipmentLevel <= 107) return 8;
  if (baseEquipmentLevel <= 117) return 10;
  if (baseEquipmentLevel <= 127) return 15;
  if (baseEquipmentLevel <= 137) return 20;
  return 30;
};
const getAutoModeOptions = (baseEquipmentLevel: number) => {
  if (baseEquipmentLevel <= 94) return [3, 4, 5].map((force) => `${force}성`);
  if (baseEquipmentLevel <= 107) return [5, 6, 7, 8].map((force) => `${force}성`);
  if (baseEquipmentLevel <= 117) return [6, 7, 8, 9, 10].map((force) => `${force}성`);
  if (baseEquipmentLevel <= 127) return [10, 11, 12, 13, 14, 15].map((force) => `${force}성`);
  if (baseEquipmentLevel <= 137) return [15, 16, 17, 18, 19, 20].map((force) => `${force}성`);
  return [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((force) => `${force}성`);
};

export type StarforceRecord = {
  initialStarforce: number;
  targetStarforce: number;
  attempts: number;
  destroyCount: number;
  accumulatedCost: number;
};

export const StarforceContainer = ({ targetItem }: { targetItem: ItemEquipment }) => {
  const simulator = useMemo(() => new StarforceSimulator({ item: targetItem }), [targetItem]);

  const resetStarforceTarget = useStarforceStore((state) => state.resetStarforceTarget);

  const [currentTarget, setCurrentTarget] = useState<ItemEquipment | null>(null);
  const [currentStarforce, setCurrentStarforce] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [currentProbabilities, setCurrentProbabilities] = useState<StarforceProbability | null>(null);
  const [accumulatedCost, setAccumulatedCost] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [destroyCount, setDestroyCount] = useState(0);

  const formattedCurrentCost = useMemo(() => formatKoreanNumber(currentCost), [currentCost]);

  const isMaxStarforce = useMemo(() => {
    if (!currentTarget) return false;
    const { item_base_option } = currentTarget;
    return currentStarforce >= getMaxStarforce(item_base_option.base_equipment_level);
  }, [currentTarget, currentStarforce]);

  const autoModeOptions = useMemo(() => getAutoModeOptions(targetItem.item_base_option.base_equipment_level), [targetItem]);

  // 자동 모드
  const [isAutoModePlaying, setIsAutoModePlaying] = useState(false);
  const [isAutoModeChecked, setIsAutoModeChecked] = useState(false);
  const [autoModeOption, setAutoModeOption] = useState<string>(autoModeOptions[0]);
  const [isAutoModeRestartChecked, setIsAutoModeRestartChecked] = useState(false);
  const hasAccomplished = useRef(false);
  const initialStarforce = useRef<number>(0);

  // 스타캐치
  const [isStarforceCatchChecked, setIsStarforceCatchChecked] = useState(false);
  // 샤이닝 스타포스
  const [isShiningStarforceChecked, setIsShiningStarforceChecked] = useState(false);
  // 파괴방지
  const [isDestroyProtectionChecked, setIsDestroyProtectionChecked] = useState(false);
  // 썬데이
  const [isSundayChecked, setIsSundayChecked] = useState(false);
  // PC방 할인
  const [isPcDiscountChecked, setIsPcDiscountChecked] = useState(false);
  // MVP 할인
  const [isMvpDiscountChecked, setIsMvpDiscountChecked] = useState(false);
  const [mvpOption, setMvpOption] = useState(MVP_OPTIONS[0]);
  const [discountRate, setDiscountRate] = useState(0);

  const [records, setRecords] = useState<StarforceRecord[]>([]);

  const starforceButtonLabel = useMemo(() => {
    if (isAutoModePlaying) {
      return "자동 강화 OFF";
    }
    return "+ 강화(D키)";
  }, [isAutoModePlaying]);

  const handleSelect = (option: string) => {
    setAutoModeOption(option.split("성")[0]);
  };

  const updateStarforceState = useCallback(() => {
    const { item, cost, probabilities } = simulator.getState();
    setCurrentStarforce(parseInt(item.starforce));
    setCurrentCost(cost);
    setCurrentProbabilities(probabilities);
  }, [simulator]);

  // 초기화
  useEffect(() => {
    const { item, cost, probabilities } = simulator.getState();
    setCurrentStarforce(parseInt(item.starforce));
    setCurrentCost(cost);
    setCurrentProbabilities(probabilities);
    setCurrentTarget(item);
  }, [simulator]);

  // 샤타포스 적용
  useEffect(() => {
    simulator.setShiningStarforce(isShiningStarforceChecked);
    updateStarforceState();
  }, [isShiningStarforceChecked, updateStarforceState]);

  // 스타캐치 적용
  useEffect(() => {
    simulator.applySuccessRateIncrease(isStarforceCatchChecked ? 0.05 : 0);
    updateStarforceState();
  }, [isStarforceCatchChecked, updateStarforceState]);

  // 파괴방지 (15~17성 단계에서 가능)
  useEffect(() => {
    simulator.setDestroyProtection(isDestroyProtectionChecked);
    updateStarforceState();
  }, [isDestroyProtectionChecked, updateStarforceState]);

  // 할인 적용
  useEffect(() => {
    const sundayDiscount = isSundayChecked ? 0.3 : 0;
    const pcDiscount = isPcDiscountChecked ? 0.05 : 0;
    const mvpDiscount = (() => {
      if (isMvpDiscountChecked) {
        if (mvpOption === MVP_OPTIONS[0]) return 0.03;
        if (mvpOption === MVP_OPTIONS[1]) return 0.05;
        if (mvpOption === MVP_OPTIONS[2]) return 0.1;
      }
      return 0;
    })();

    const discountInfo = { sundayDiscount, pcDiscount, mvpDiscount };
    simulator.applyCostDiscount(discountInfo);
    updateStarforceState();

    const discountRatio = simulator.getState().discountRatio;
    setDiscountRate((1 - discountRatio) * 100);
  }, [isSundayChecked, isPcDiscountChecked, isMvpDiscountChecked, mvpOption, updateStarforceState]);

  const { item_name, item_icon } = targetItem ?? {};
  const [result, setResult] = useState<StarforceResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseOverOnImage = () => {
    setShowDetail(true);
  };

  const handleMouseLeaveOnImage = () => {
    setShowDetail(false);
  };

  const resetDestroyCount = () => {
    setDestroyCount(0);
    simulator.resetDestroyCount();
  };

  const resetAttempts = () => {
    setAttempts(0);
    simulator.resetAttempts();
  };

  const resetAccumulatedCost = () => {
    setAccumulatedCost(0);
    simulator.resetAccumulatedCost();
  };

  const resetAllUserStarforceState = () => {
    resetDestroyCount();
    resetAttempts();
    resetAccumulatedCost();
  };

  const initializeStarforce = () => {
    const input = prompt("아이템에 설정할 스타포스 수치를 입력해주세요.");
    if (!input) return;

    const inputStarforce = parseInt(input);

    if (inputStarforce >= 30) {
      alert("30성 이상은 설정할 수 없습니다.");
      return;
    }

    if (isNaN(inputStarforce)) {
      alert("숫자를 입력해주세요.");
      return;
    }

    if (inputStarforce < 0) {
      alert("0 이상의 숫자를 입력해주세요.");
      return;
    }

    simulator.setStarforce(inputStarforce);
    const { item, cost, probabilities, discountRatio } = simulator.getState();
    setCurrentStarforce(parseInt(item.starforce));
    setCurrentCost(cost);
    setCurrentProbabilities(probabilities);
    setDiscountRate((1 - discountRatio) * 100);
    resetAllUserStarforceState();
  };

  const resetStarforceToZero = () => {
    simulator.setStarforce(0);
    const { item, cost, probabilities, discountRatio } = simulator.getState();
    setCurrentStarforce(parseInt(item.starforce));
    setCurrentCost(cost);
    setCurrentProbabilities(probabilities);
    setDiscountRate((1 - discountRatio) * 100);
    resetAllUserStarforceState();
  };

  const doStarforce = useCallback(() => {
    simulator.simulate();
    const { item, cost, probabilities, result, accumulatedCost, attempts, destroyCount } = simulator.getState();

    setCurrentStarforce(parseInt(item.starforce));
    setCurrentCost(cost);
    setCurrentProbabilities(probabilities);
    setResult(result);
    setAccumulatedCost(accumulatedCost);
    setAttempts(attempts);
    setDestroyCount(destroyCount);

    if (timerRef.current) {
      clearTimeout(timerRef.current);

      if (!isAutoModePlaying) {
        setResult(null);
      }
      setTimeout(() => {
        setResult(result); // 짧은 지연 후 새로운 결과로 설정
      }, 0);
    }
    const newTimer = setTimeout(() => setResult(null), 1000);
    timerRef.current = newTimer;

    if (isAutoModePlaying && autoModeOption) {
      const targetStarforce = autoModeOption;
      if (parseInt(item.starforce) >= parseInt(targetStarforce)) {
        setIsAutoModePlaying(false);
        setRecords((prev) => [
          ...prev,
          {
            initialStarforce: initialStarforce.current,
            targetStarforce: parseInt(targetStarforce),
            attempts,
            destroyCount,
            accumulatedCost,
          },
        ]);
        hasAccomplished.current = true;
        resetAllUserStarforceState();
      }
    }
  }, [simulator, isAutoModePlaying, autoModeOption, isMaxStarforce]);

  const handleClickStarforceButton = () => {
    if (isMaxStarforce) {
      openModal({
        type: "confirm",
        message: `이미 최대 스타포스 수치입니다.`,
      });
      return;
    }

    if (isAutoModePlaying) {
      setIsAutoModePlaying(false);
      return;
    }

    if (isAutoModeChecked) {
      if (currentStarforce >= parseInt(autoModeOption)) {
        alert("현재 스타포스 수치가 목표치 이상입니다.");
        return;
      }
      setIsAutoModePlaying(true);
      return;
    }

    doStarforce();
  };

  const throttleDoStarforce = useThrottle(handleClickStarforceButton, 200);

  /** 스타포스 강화 키 이벤트 핸들러 */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAutoModePlaying) return;
      if (e.key === "d") {
        throttleDoStarforce();
      }
      if (e.key === "Escape") {
        resetStarforceTarget();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [throttleDoStarforce, isAutoModePlaying]);

  // 자동 모드
  const autoModeTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isAutoModePlaying) {
      const delay = 0;
      initialStarforce.current = parseInt(simulator.getState().item.starforce);
      autoModeTimer.current = setInterval(() => {
        doStarforce();
      }, delay);
    } else {
      clearTimeout(autoModeTimer.current);
    }
    return () => clearTimeout(autoModeTimer.current);
  }, [isAutoModePlaying, doStarforce]);

  const restartTimer = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (isAutoModeRestartChecked) {
      if (!isAutoModePlaying && hasAccomplished.current) {
        restartTimer.current = setTimeout(() => {
          simulator.setStarforce(0);
          const { item } = simulator.getState();
          setCurrentStarforce(parseInt(item.starforce));

          setIsAutoModePlaying(true);
        }, 500);
      }
    } else {
      clearTimeout(restartTimer.current);
    }
    hasAccomplished.current = false;
    return () => clearTimeout(restartTimer.current);
  }, [isAutoModeRestartChecked, isAutoModeChecked, isAutoModePlaying]);

  useEffect(() => {
    // 자동 모드 옵션이 변경되면 유저의 모든 스타포스 상태를 초기화
    if (autoModeOption) {
      resetAllUserStarforceState();
    }
  }, [autoModeOption]);

  if (!targetItem) return null;

  return (
    <>
      <div style={{ zIndex: 1002 }} className="flex fixed top-[25%] left-[35%]">
        <div
          className={`flex flex-col items-center gap-1 rounded-lg
             bg-black/70 p-2 border border-white/30 align-center 
             justify-center w-[480px]`}
        >
          <p className="text-sm font-medium">
            <span className="text-yellow-400 font-bold">스타포스</span>
          </p>
          <div className="relative flex flex-col p-1 w-full rounded-lg bg-gradient-to-b from-gray-200 to-gray-300 gap-1">
            <div className="flex flex-col p-1 w-full rounded-lg bg-gradient-to-b from-[#4e413e] to-[#493d34] gap-1">
              <p className="flex fade-in justify-center rounded-md bg-[#2e2521] p-1 m-1 text-white">
                <span className="text-yellow-400">메소</span>를 사용하여 장비를 강화합니다.
              </p>
              <div className="flex flex-row">
                <div
                  onMouseOver={handleMouseOverOnImage}
                  onMouseLeave={handleMouseLeaveOnImage}
                  className="flex items-center justify-center bg-gradient-to-b from-[#3ac4ee] to-[#007a99] rounded-md p-1 w-[156px] h-[156px] m-1"
                >
                  <div className="flex w-[130px] h-[130px] items-center justify-center border-dashed border-white border-2 rounded-md">
                    {item_icon && (
                      <Image
                        src={item_icon}
                        className="m-3.5"
                        style={{ imageRendering: "pixelated" }}
                        alt={"스타포스 아이템"}
                        width={90}
                        height={90}
                        unoptimized
                      />
                    )}
                  </div>
                  {currentTarget && showDetail && (
                    <div
                      style={{ zIndex: "10003" }}
                      className="absolute top-[20%] left-[6%] flex flex-col min-w-80 max-w-80 bg-slate-950/90 dark:bg-[#121212]/90
          border border-gray-700 rounded-lg px-5 pt-3 pb-4"
                    >
                      <NormalContainer item={currentTarget} enableItemMenu={false} />
                    </div>
                  )}
                </div>
                <div className="flex flex-grow overflow-y-scroll bg-gradient-to-b from-[#3b302b] to-[#302622] rounded-md p-3 m-1">
                  {currentProbabilities && (
                    <StarforceDetail
                      isMaxStarforce={isMaxStarforce}
                      starforce={currentStarforce}
                      currentCost={currentCost}
                      currentProbabilities={currentProbabilities}
                    />
                  )}
                </div>
              </div>
              {/** 확률 메뉴 */}
              <div className="flex flex-row flew-grow w-full">
                <div className="flex text-white m-1 w-[30%] bg-gradient-to-b from-[#3b302b] to-[#302622] rounded-md p-2">
                  <CheckBox
                    checked={isStarforceCatchChecked}
                    disabled={isAutoModePlaying}
                    label="스타캐치"
                    onChange={() => setIsStarforceCatchChecked((prev) => !prev)}
                  />
                </div>
                <div className="flex text-white m-1 w-[30%] bg-gradient-to-b from-[#3b302b] to-[#302622] rounded-md p-2">
                  <CheckBox
                    labelStyle={{ fontWeight: "bold" }}
                    checked={isDestroyProtectionChecked}
                    disabled={isAutoModePlaying}
                    label="파괴방지"
                    onChange={() => setIsDestroyProtectionChecked((prev) => !prev)}
                  />
                </div>
                <div className="flex text-white m-1 w-[40%] bg-gradient-to-b from-[#3b302b] to-[#302622] rounded-md p-2">
                  <CheckBox
                    labelStyle={{ fontWeight: "bold" }}
                    checked={isShiningStarforceChecked}
                    disabled={isAutoModePlaying}
                    label="샤타포스(파괴 30%↓)"
                    onChange={() => setIsShiningStarforceChecked((prev) => !prev)}
                  />
                </div>
              </div>
              {/** 할인 메뉴 */}
              <div className="flex flex-row flew-grow w-full">
                <div className="flex items-center text-white m-1 w-[35%] bg-gradient-to-b from-[#3b302b] to-[#302622] rounded-md p-2">
                  <CheckBox
                    labelStyle={{ fontWeight: "bold" }}
                    checked={isSundayChecked}
                    disabled={isAutoModePlaying}
                    label="썬데이(메소 30%↓)"
                    onChange={() => setIsSundayChecked((prev) => !prev)}
                  />
                </div>
                <div className="flex items-center gap-1 m-1 w-[35%] bg-gradient-to-b from-[#3b302b] to-[#302622] rounded-md p-2">
                  <CheckBox
                    labelStyle={{ fontWeight: "bold" }}
                    checked={isMvpDiscountChecked}
                    disabled={isAutoModePlaying}
                    onChange={() => setIsMvpDiscountChecked((prev) => !prev)}
                  />
                  <SelectBox
                    style={{ maxWidth: "160px" }}
                    disabled={!isMvpDiscountChecked || isAutoModePlaying}
                    options={MVP_OPTIONS}
                    onSelect={(option) => setMvpOption(option)}
                  />
                </div>
                <div className="flex items-center text-white m-1 w-[30%] bg-gradient-to-b from-[#3b302b] to-[#302622] rounded-md p-1">
                  <CheckBox
                    labelStyle={{ fontWeight: "bold" }}
                    checked={isPcDiscountChecked}
                    disabled={isAutoModePlaying}
                    label="PC방(메소 5%↓)"
                    onChange={() => setIsPcDiscountChecked((prev) => !prev)}
                  />
                </div>
              </div>
              <div className="flex flex-row flew-grow w-full">
                <div className="flex items-center justify-between mx-1 w-full bg-gradient-to-b from-[#3b302b] to-[#302622] rounded-md p-2">
                  <div className="text-white">
                    <CheckBox
                      labelStyle={{ fontWeight: "bold" }}
                      label="자동 모드"
                      disabled={isAutoModePlaying}
                      checked={isAutoModeChecked}
                      onChange={() => setIsAutoModeChecked((prev) => !prev)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                      <SelectBox
                        style={{ maxWidth: "160px" }}
                        disabled={!isAutoModeChecked || isAutoModePlaying}
                        options={autoModeOptions}
                        onSelect={handleSelect}
                      />
                      <span className={`text-xs text-white ml-1 ${!isAutoModeChecked ? "opacity-50" : ""}`}>달성까지 자동 강화</span>
                    </div>
                    <div className="flex items-center text-white">
                      <CheckBox
                        label="달성 완료 후 0성부터 재시작"
                        checked={isAutoModeRestartChecked}
                        disabled={!isAutoModeChecked}
                        onChange={() => setIsAutoModeRestartChecked((prev) => !prev)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-row flew-grow w-full">
                <div className="flex m-1 w-full items-center justify-between bg-gradient-to-b from-[#3b302b] to-[#302622] rounded-md p-2">
                  <p className="text-sm font-bold text-white">🪙 필요한 메소: {formattedCurrentCost}</p>
                  <p className="text-xs font-bold text-red-200">🔻할인율: {discountRate.toFixed(2)}%</p>
                </div>
              </div>
              <div className="flex flex-row justify-center text-white">
                <button
                  onClick={throttleDoStarforce}
                  className="flex bg-gradient-to-b from-[#8fb843] to-[#73b12c]
                  hover:bg-gradient-to-b hover:from-[#7ea338] hover:to-[#578621]
                rounded-md p-0.5 m-1 w-[120px] justify-center text-lg font-bold"
                >
                  {starforceButtonLabel}
                </button>
                <button
                  disabled={isAutoModePlaying}
                  className="flex disabled:bg-gray-600/70 disabled:text-white/20
                  enabled:bg-gradient-to-b from-[#b6b6b6] to-[#868686]
                  enabled:hover:bg-gradient-to-b hover:from-[#979797] hover:to-[#6b6b6b]
                rounded-md p-0.5 m-1 w-[120px] justify-center text-lg font-bold"
                  onClick={initializeStarforce}
                >
                  {"↻ 초기화"}
                </button>
                <button
                  disabled={isAutoModePlaying}
                  className="flex disabled:bg-gray-600/70 disabled:text-white/20
                  enabled:bg-gradient-to-b from-[#b6b6b6] to-[#868686]
                  enabled:hover:bg-gradient-to-b hover:from-[#979797] hover:to-[#6b6b6b]
                rounded-md p-0.5 m-1 w-[120px] justify-center text-lg font-bold"
                  onClick={() => {
                    openModal({
                      type: "confirm",
                      message: "0성으로 초기화 하시겠습니까?",
                      confirmCallback: resetStarforceToZero,
                      confirmLabel: "초기화",
                      cancelLabel: "취소",
                    });
                  }}
                >
                  {"↻ 0성으로"}
                </button>
                <button
                  className="flex bg-gradient-to-b from-[#b6b6b6] to-[#868686]
                  hover:bg-gradient-to-b hover:from-[#979797] hover:to-[#6b6b6b]
                rounded-md p-0.5 m-1 w-[120px] justify-center text-lg font-bold"
                  onClick={resetStarforceTarget}
                >
                  {"X 닫기"}
                </button>
              </div>
              <p className="flex mt-1 mb-1 border-b-2 border-dotted border-b-white/20" />
              <div className="flex flex-row flex-grow gap-2 m-1">
                <div className="flex bg-slate-900/90 w-[65%] rounded-md p-1">
                  <p className="text-xs p-1 text-white">💸 누적 메소: {formatKoreanNumber(accumulatedCost)}</p>
                </div>
                <div className="flex bg-slate-900/90 w-[35%] rounded-md p-1">
                  <p className="text-xs p-1 text-white">☝️ 시도: {attempts}회</p>
                </div>
              </div>
            </div>
            <StarforceResultLabel result={result} isAutoModePlaying={isAutoModePlaying} />
          </div>
        </div>
        <StarforceRecords
          records={records}
          clearRecords={() => {
            setRecords([]);
            resetDestroyCount();
          }}
          destroyCount={destroyCount}
        />
      </div>
      <div
        style={{ zIndex: 1001 }}
        onClick={resetStarforceTarget}
        className="fixed z-50 top-0 left-0 w-full h-full flex justify-center items-center opacity-50 bg-black"
      />
    </>
  );
};
