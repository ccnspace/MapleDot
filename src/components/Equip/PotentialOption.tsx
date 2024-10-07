import { Divider } from "./Divider";

type Props = {
  grade: string;
  options: string[];
  type: "potential" | "additional";
};

const potentialStyle: Record<string, string> = {
  레전드리: "text-lime-400",
  유니크: "text-yellow-400",
  에픽: "text-purple-500",
  레어: "text-sky-400",
};

export const PotentialOption = (props: Props) => {
  const { grade, options, type } = props;
  const title =
    type === "potential"
      ? `[${grade}] 잠재 옵션`
      : `[${grade}] 에디셔널 잠재 옵션`;
  return (
    <>
      <Divider />
      <p className="flex flex-col text-xs font-light text-white whitespace-pre-wrap gap-[1px]">
        <p className={`${potentialStyle[grade]} text-xs`}>{title}</p>
        {options.map((item, i) => (
          <p key={i}>{item}</p>
        ))}
      </p>
    </>
  );
};
