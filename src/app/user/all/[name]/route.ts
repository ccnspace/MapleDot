import { NextRequest } from "next/server";

const API_KEY = process.env.API_KEY;
const NEXON_API_DOMAIN = process.env.NEXON_API_DOMAIN;

if (!API_KEY || !NEXON_API_DOMAIN) {
  throw new Error("Missing required environment variables");
}

const commonHeader: RequestInit = {
  headers: { "x-nxopen-api-key": API_KEY },
  next: { revalidate: 0 },
};

const endpoints = [
  "basic",
  "stat",
  "ability",
  "item-equipment",
  "symbol-equipment",
  "cashitem-equipment",
  "pet-equipment",
  "android-equipment",
] as const;

const makeRequestUrls = (ocid: string) => {
  return endpoints.map((endpoint) => {
    const url = new URL(`${NEXON_API_DOMAIN}/character/${endpoint}`);
    url.searchParams.append("ocid", ocid);
    return url.toString();
  });
};

// 개발 모드이면 초당 최대 5회까지의 호출 제한이 있어 부득이하게 wait를 걸어준다.
const wait = () => new Promise((resolve) => setTimeout(resolve, 500));

const fetchOcid = async (username: string) => {
  const response = await fetch(`${NEXON_API_DOMAIN}/id?character_name=${username}`, commonHeader);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify({ errorCode: error.error.name }));
  }
  return (await response.json()).ocid;
};

const fetchAllInfo = async (url: string) => {
  console.log("Fetching: ", url);
  await wait();
  const response = await fetch(url, commonHeader);
  const json = await response.json();

  if (!response.ok) {
    const requestUrl = new URL(url);
    requestUrl.searchParams.delete("ocid");
    throw new Error(
      JSON.stringify({
        name: json.error.name,
        message: json.error.message,
        requestUrl: requestUrl.toString(),
      })
    );
  }
  return json;
};

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const ocid = await fetchOcid(params.name);
    const requestUrls = makeRequestUrls(ocid);

    const responses = [] as { name: string; data: unknown }[];
    for (let i = 0; i < requestUrls.length; i++) {
      const data = await fetchAllInfo(requestUrls[i]);
      responses.push({ name: endpoints[i], data });
    }

    const basic = responses.find((res) => res.name === "basic")?.data;
    const stat = responses.find((res) => res.name === "stat")?.data;
    const ability = responses.find((res) => res.name === "ability")?.data;
    const normalEquip = responses.find((res) => res.name === "item-equipment")?.data;
    const symbolEquip = responses.find((res) => res.name === "symbol-equipment")?.data;
    const cashEquip = responses.find((res) => res.name === "cashitem-equipment")?.data;
    const petEquip = responses.find((res) => res.name === "pet-equipment")?.data;
    const androidEquip = responses.find((res) => res.name === "android-equipment")?.data;

    return Response.json({
      basic,
      stat,
      ability,
      normalEquip,
      symbolEquip,
      cashEquip,
      petEquip,
      androidEquip,
    });
  } catch (e) {
    if (e instanceof Error) {
      const parsed = JSON.parse(e.message);
      return Response.json(parsed, { status: 400 });
    }
    return Response.json({ message: "Fetch Failed" }, { status: 400 });
  }
}
