export type HatsResponsibility = {
  label: string;
  description?: string;
  link?: string;
  imageUrl?: string;
};

type Authority = {
  label: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  gate?: string;
};

type DataSchema = {
  name: string;
  description?: string;
  responsabilities?: HatsResponsibility[];
  authorities?: Authority[];
};

export type DefaultHatsDetailsSchema = {
  type: "1.0";
  data: DataSchema;
};
