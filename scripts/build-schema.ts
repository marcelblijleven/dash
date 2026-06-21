import { writeFileSync } from "node:fs";
import { configJsonSchema } from "@/lib/config/schema";

const schema = configJsonSchema();
writeFileSync(
  "public/config.schema.json",
  `${JSON.stringify(schema, null, 2)}\n`,
);
console.log("wrote public/config.schema.json");
