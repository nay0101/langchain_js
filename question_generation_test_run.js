import { Document } from "@langchain/core/documents";
import { QuestionGeneratorChain } from "./utils/questionGenerator.js";
import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv";
import { ChatAnthropic } from "@langchain/anthropic";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { ChatMistralAI } from "@langchain/mistralai";

config();

const chatHistory = [
  {
    role: "human",
    content:
      "How much interest can i get if I put in 50000RM for 48 months in fixed deposit account?",
  },
  {
    role: "ai",
    content:
      "If you deposit 50,000 RM in a fixed deposit account for 48 months at an interest rate of 2.35%, you can expect to earn approximately 4,811 RM in interest.",
  },
];

const context = [
  new Document({
    pageContent:
      "Fixed Deposit | Brillar Bank\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\ntop of pageThis site was designed with the .com website builder. Create your website today.Start NowHomeDepositsMoreUse tab to navigate through the menu items.Available for Registered Users\xa0 \xa0 \xa0 \xa0Learn More\xa0\n\n\n\n\nFixed Deposit @Brillar BankFeatures and BenefitsBrillar Bank Fixed Deposit account is a good start for your long-term savings plan.Get StartedLearn More\xa0\n\n\n\n\nFeatures and BenefitsLong TermA choice of terms from 1 - 60 months.Flexibility of early fixed deposit partial withdrawal without losing interest on remaining balanceInterest PayoutReceive interest at maturity.Convenient WithdrawalYou can withdraw from any branch nationwide.Partial withdrawal is in multiples of RM1,000. Outstanding balances will be shown on the monthly e-statement.\n\n\nEffective 1 January 2019, no interest shall be payable on partially withdrawn amounts and premature withdrawals of FD.Eligibility\n\nMinimum deposit of RM5,000 for 1 month placement and RM500 for 2 months and above.\n\n\n·Applicable for individual and non-individual customers.\n\n\nFor Malaysian aged 18 years old & above.\n\n\nFor Malaysian aged below 18 years old, account must be opened as a trust account.\n\nTerms and Conditions applyMember of PIDM. Protected by PIDM up to RM250,000 for each depositor.Interest RatesTenureInterest Rates1 month2.15%2 months2.25%3 months2.25%4 months2.30%5 months2.30%6 months2.30%7 months2.35%8 months2.35%9 months2.35%10 months2.35%11 months2.35%12 months2.35%13 - 60 months2.35%Fees and ChargesFees & Charges DescriptionFees / Charges\n(subject to Government Tax, if applicable)Cheque Related :Dishonoured Inward Return Cheques due to:\n\u200b\n\n\nPost-dated reason only\n\nRM10.00 per chequeChanges to Account Related :\n\nChange to operating mandate\n\n\nAddition of joint accountholder",
  }),
];

const modelName = "meta-llama/Meta-Llama-3.1-70B-Instruct";
const llm = new HuggingFaceInference({
  model: modelName,
  maxRetries: 0,
  maxTokens: 1000,
  temperature: 0.9,
});

const chain = QuestionGeneratorChain({ llm });
const result = await chain.invoke({
  chat_history: chatHistory,
  context: context,
  n: 3,
});

console.log(result);
