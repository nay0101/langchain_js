import { config } from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGooglePaLM } from "@langchain/community/chat_models/googlepalm";

config();

// const llm = new ChatGoogleGenerativeAI({
//   modelName: "gemini-pro",
//   temperature: 0.1,
//   verbose: true,
// });

const llm = new ChatGooglePaLM({
  verbose: true,
});

const systemMessage = `use the following context to answer the questions: 
  Fixed Deposit HLB Connect Safe Deposit Box Digital Solutions APPLY ONLINE Credit
  Card Personal Loan Current / Savings Account Complete Saved Application Upload
  Documents Track My Application PROMOTIONS TRACK MY APPLICATION
  /content/dam/hlb/my/images/Personal/Deposits/Fixed-Deposit/Fixed-Deposit-Account/fixed_deposit_product_tile_en.png
  Fixed Deposit - HLB personal business priority Islamic Global Markets Assurance
  singapore hong kong vietnam cambodia ENG ENG BM 中文 Personal / Sole Proprietor
  Business HLB ConnectFirst HL Connect Biz personal business priority Islamic
  Global Markets Assurance ABOUT US
  Fixed Deposit HLB Connect Safe Deposit Box Digital Solutions APPLY ONLINE Credit
  Card Personal Loan Current / Savings Account Complete Saved Application Upload
  Documents Track My Application PROMOTIONS TRACK MY APPLICATION
  /content/dam/hlb/my/images/Personal/Deposits/Fixed-Deposit/e-Fixed-Deposit/e_fixed_deposit_product_tile_en.png
  Fixed Deposit HLB Connect Safe Deposit Box Digital Solutions APPLY ONLINE Credit
  Card Personal Loan Current / Savings Account Complete Saved Application Upload
  Documents Track My Application PROMOTIONS TRACK MY APPLICATION
  /content/dam/hlb/my/images/Personal/Deposits/Fixed-Deposit/Junior-Fixed-Deposit/junior_fixed_deposit_product_tile_en.png
  Fixed Deposit HLB Connect Safe Deposit Box Digital Solutions APPLY ONLINE Credit
  Card Personal Loan Current / Savings Account Complete Saved Application Upload
  Documents Track My Application PROMOTIONS TRACK MY APPLICATION
  /content/dam/hlb/my/images/Personal/Deposits/Fixed-Deposit/Flexi-FD/flexi_fd_product_tile_en.png
  Fixed Deposit HLB Connect Safe Deposit Box Digital Solutions APPLY ONLINE Credit
  Card Personal Loan Current / Savings Account Complete Saved Application Upload
  Documents Track My Application PROMOTIONS TRACK MY APPLICATION
  /content/dam/hlb/my/images/Personal/Deposits/Fixed-Deposit/Foreign-Deposit-Account/foreign_deposit_account_product_tile_en.jpg
  More details Less details Interest Payout Receive interest at maturity. More
  details Less details Flexibility of early fixed deposit partial withdrawal
  without losing interest on remaining balance Partial withdrawal is in multiples
  of RM1,000. Outstanding balances will be shown on the monthly e-statement.
  Effective 1 January 2019, no interest shall be payable on partially withdrawn
  amounts and premature withdrawals of FD. More details Less details Convenient
  Withdrawal You can withdraw from any branch nationwide.  More details Less
  details Eligibility Minimum deposit of RM5,000 for 1 month placement and RM500
  for 2 months and above.
  Fixed Deposit HLB Connect Safe Deposit Box Digital Solutions APPLY ONLINE Credit
  Card Personal Loan Current / Savings Account Complete Saved Application Upload
  Documents Track My Application PROMOTIONS TRACK MY APPLICATION
  /content/dam/hlb/my/images/Personal/Deposits/Fixed-Deposit/Senior-Savers-Flexi-FD/senior_savers_flexi_fd_product_tile_en.png
  Fixed Deposit null personal business priority Islamic Global Markets Assurance
  singapore hong kong vietnam cambodia ENG ENG BM 中文 Personal / Sole Proprietor
  Business HLB ConnectFirst HL Connect Biz personal business priority Islamic
  Global Markets Assurance ABOUT US
  Fixed Deposit HLB Connect Safe Deposit Box Digital Solutions APPLY ONLINE Credit
  Card Personal Loan Current / Savings Account Complete Saved Application Upload
  Documents Track My Application PROMOTIONS TRACK MY APPLICATION
  /content/dam/hlb/my/images/revamp-images/default-search-image.PNG ENG
`;

const res = await llm.invoke([
  ["system", systemMessage],
  ["human", "what is fixed deposit?"],
]);
console.log(res);
