import { getTotalCost } from "./utils/cost.js";

const cost = await getTotalCost({
  chatbotName: "claude-3-5-sonnet-20240620",
  fromTimestamp: new Date("2024 Jul 10"),
  toTimestamp: new Date("2024 Aug 01"),
});
console.log(cost);
