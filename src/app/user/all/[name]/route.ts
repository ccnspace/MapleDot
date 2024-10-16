import dayjs from "dayjs";
import { NextRequest } from "next/server";

const commonHeader: RequestInit = {
  headers: {
    "x-nxopen-api-key": process.env.API_KEY || "",
  },
  next: { revalidate: 0 },
};

const makeRequestUrls = (urlParams: string) => {
  const basicUrl = `${process.env.NEXON_API_DOMAIN}/character/basic`; // basic
  const statUrl = `${process.env.NEXON_API_DOMAIN}/character/stat`; // stat
  const abilityUrl = `${process.env.NEXON_API_DOMAIN}/character/ability`; // stat
  const normalEquipmentUrl = `${process.env.NEXON_API_DOMAIN}/character/item-equipment`; // normalItem
  const symbolEquimentUrl = `${process.env.NEXON_API_DOMAIN}/character/symbol-equipment`; // symbolItem
  const cashEquimentUrl = `${process.env.NEXON_API_DOMAIN}/character/cashitem-equipment`; // cashItem
  const petEquipmentUrl = `${process.env.NEXON_API_DOMAIN}/character/pet-equipment`; // pet
  const androidEquipmentUrl = `${process.env.NEXON_API_DOMAIN}/character/android-equipment`; // android

  const urls = [
    basicUrl,
    statUrl,
    abilityUrl,
    normalEquipmentUrl,
    symbolEquimentUrl,
    cashEquimentUrl,
    petEquipmentUrl,
    androidEquipmentUrl,
  ];

  return urls.map((url) => `${url}?${urlParams}`);
};

export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const username = params.name;
  const ocidResponse = await fetch(
    `${process.env.NEXON_API_DOMAIN}/id?character_name=${username}`,
    commonHeader
  );

  if (!ocidResponse.ok) {
    const response = await ocidResponse.json();
    return Response.json({ errorCode: response.error.name }, { status: 400 });
  }

  const ocidData = (await ocidResponse.json()) as { ocid: string };

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date") ?? "";
  const isToday = dayjs(Date.now()).format("YYYY-MM-DD") === date;

  const urlParams = new URLSearchParams();
  if (ocidData.ocid) urlParams.append("ocid", ocidData.ocid);
  if (date && !isToday) urlParams.append("date", date);

  const requestUrls = makeRequestUrls(urlParams.toString());

  const urlFetcher = async (url: string) => {
    const response = await fetch(url, commonHeader);
    const json = await response.json();
    const requestUrl = new URL(url);
    requestUrl.searchParams.delete("ocid");

    if (response.ok) return json;
    throw Error(
      JSON.stringify({
        name: json.error.name,
        message: json.error.message,
        requestUrl: requestUrl.toString(),
      })
    );
  };

  try {
    const [
      basic,
      stat,
      ability,
      normalEquip,
      symbolEquip,
      cashEquip,
      petEquip,
      androidEquip,
    ] = await Promise.all(requestUrls.map(urlFetcher));

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
