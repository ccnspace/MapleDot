import { ReactElement } from "react";
import { ProfileWrapper } from "./Profile";
import { SideBarItem } from "./SideBarItem";
import { HomeIcon } from "./svg/HomeIcon";
import { ProfileIcon } from "./svg/ProfileIcon";

export type SideBarItemType = {
  icon: ReactElement;
  title: string;
  src: string;
};
const sidebarItem: SideBarItemType[] = [
  {
    icon: <HomeIcon />,
    title: "홈",
    src: "/",
  },
  {
    icon: <ProfileIcon />,
    title: "과거와 대결",
    src: "/vs",
  },
  {
    icon: <ProfileIcon />,
    title: "확률",
    src: "",
  },
  {
    icon: <HomeIcon />,
    title: "기타",
    src: "",
  },
];

export const SideBar = () => {
  return (
    <div className="flex-shrink-0 w-96 font-bold text-lg border-r border-r-slate-200 dark:border-r-white/10">
      <ProfileWrapper />
      {/* <ul className="text-black">
        {sidebarItem.map((item, i) => (
          <SideBarItem key={i} item={item} />
        ))}
      </ul> */}
    </div>
  );
};
