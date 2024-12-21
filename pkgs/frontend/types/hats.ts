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
