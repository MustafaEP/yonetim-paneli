import sehirler from "./sehirler.json";
import ilceler from "./ilceler.json";

export interface City {
  name: string;
  districts: string[];
}

export const turkeyCities: City[] = sehirler.map((sehir: any) => {
  const districts = ilceler
    .filter((ilce: any) => ilce.sehir_id === sehir.sehir_id)
    .map((ilce: any) => ilce.ilce_adi);

  return {
    name: sehir.sehir_adi,
    districts: districts,
  };
});
