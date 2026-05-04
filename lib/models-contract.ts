import type { modelID } from "@/ai/providers";

/** JSON body from GET `/api/models` — kept in `/lib` so client components avoid importing Route modules. */
export type ModelsApiOption = {
  id: modelID;
  label: string;
  available: boolean;
  requirement?: string;
  note?: string;
};

export type ModelsApiPayload = {
  options: ModelsApiOption[];
};
