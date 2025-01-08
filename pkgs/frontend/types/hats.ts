export interface HatsDetailSchama {
  type: "1.0";
  data: {
    name: string;
    description?: string;
    responsabilities?: {
      label: string;
      description?: string | undefined;
      link?: string | undefined;
      imageUrl?: string | undefined;
    }[];
    authorities?: {
      label: string;
      description?: string | undefined;
      link?: string | undefined;
      imageUrl?: string | undefined;
      gate?: string | undefined;
    }[];
  };
}

export type HatsDetailsData = HatsDetailSchama["data"];

export type HatsDetailsResponsabilities = HatsDetailsData["responsabilities"];

export type HatsDetailsAuthorities = HatsDetailsData["authorities"];

// 共通の型を作成
export type HatsDetailsAttributes = NonNullable<
  HatsDetailsResponsabilities | HatsDetailsAuthorities
>;
