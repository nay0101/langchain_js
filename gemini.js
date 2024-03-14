import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
import { createInterface } from "readline";

config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const modelName = "gemini-1.0-pro";

const examples = `
  Question: How many number of fixed deposits does brillar bank provide
  Answer: Brillar Bank provides the following types of fixed deposits: Fixed Deposit
  e-Fixed Deposit
  Flexi Fixed Deposit
  Senior Savers Flexi Fixed Deposit
  Junior Fixed Deposit
  Foreign Currency Fixed Deposit
  Thank you for choosing Brillar Bank 
  
  Question : What is a Fixed Deposit
  Answer : A Fixed Deposit (FD) is a financial instrument provided by banks which offers investors a higher rate of interest than a regular savings account, until the given maturity date. It is considered to be a very safe investment. The terms of a fixed deposit, such as the maturity period, interest rate, and amount, are determined in advance. Investors cannot withdraw funds from a fixed deposit before maturity without facing a penalty. Fixed Deposits are popular due to their stable returns and capital protection. Interest earned on these deposits can be received at regular intervals or reinvested, depending on the investor\'s choice. They\'re an attractive option for those looking to earn more interest on their savings than they would in a regular savings account, without taking on the risk associated with other investment options.
  Thank you for choosing Brillar Bank.

  Question: Interest Rates for Fixed Deposit
  Answer: The interest rates for fixed deposits at Brillar Bank per annum (p.a.) are as follows: Fixed Deposit: Details not provided in the documents
  e-Fixed Deposit: Details not provided in the documents
  Flexi Fixed Deposit: Details not provided in the documents
  Senior Savers Flexi Fixed Deposit: Details not provided in the documents
  Junior Fixed Deposit: Details not provided in the documents
  Foreign Currency Fixed Deposit: Details not provided in the documents
  Unfortunately, specific interest rates for each type of fixed deposit were not detailed in the documents provided. For accurate and current rates, please refer directly to Brillar Bank\'s communications or website. Thank you for choosing Brillar Bank.

  Question: What is e-fixed deposit
  Answer: An e-Fixed Deposit (e-FD) is a form of fixed deposit account that is managed entirely online, allowing customers to place, monitor, and renew their fixed deposits without the need to visit a physical bank branch. It provides the same benefits as a traditional fixed deposit, such as higher interest rates compared to regular savings accounts and the safety of the invested capital. The main distinction lies in the convenience and accessibility it offers through digital banking platforms. E-Fixed Deposits typically feature: Online placement and management of deposits.
  The ability to open a new fixed deposit account or renew an existing one online.
  Options for interest payment methods either at maturity, monthly, or at other specified intervals.
  The convenience of managing finances from home or while on the go.
  However, specific details regarding the e-Fixed Deposit product offered by Brillar Bank, such as interest rates, minimum deposit amount, and terms and conditions, were not provided in the documents reviewed. Thank you for choosing Brillar Bank.

  Question: What is the interest rates of e-fixed deposit in Brillar Bank
  Answer: The interest rates for e-Fixed Deposits at Brillar Bank, effective from 21/07/2023, are as follows: 1 month: 1.85%
  2 months: 2.25%
  3 months: 2.25%
  4 to 6 months: 2.30%
  7 to 12 months: 2.35%
  13 to 60 months: 2.35%
  Thank you for choosing Brillar Bank.

  Question: Do the same for rest of the products
  Answer: The interest rates for Junior Fixed Deposits at Brillar Bank, effective from 21/07/2023, are as follows: 1 month: 2.15%
  2 - 3 months: 2.25%
  4 - 5 months: 2.30%
  6 months: 2.30%
  7 - 11 months: 2.35%
  12 - 60 months: 2.50% The interest rates for Fixed Deposits at Brillar Bank, effective from 21/07/2023, are as follows: 1 month: 2.15%
  2 months: 2.25%
  3 months: 2.25%
  4 months: 2.30%
  5 months: 2.30%
  6 months: 2.30%
  7 to 11 months: 2.35%
  12 months: 2.35%
  13 to 60 months: 2.35% The interest rates for Senior Savers Flexi Fixed Deposits at Brillar Bank, effective from 21/07/2023, are as follows: 1 month: 2.15%
  2 - 3 months: 2.25%
  4 - 5 months: 2.30%
  6 months: 2.30%
  7 - 11 months: 2.35%
  12 - 60 months: 2.50% The interest rates for Foreign Currency Fixed Deposits at Brillar Bank, effective from 8 September 2023, are as follows: For USD (United States Dollar)
  2 weeks: 0.15%
  3 weeks: 0.20%
  1 month: 0.25%
  2 months: 0.40%
  3 months: 0.60%
  4 months: 0.70%
  5 months: 0.80%
  6 months: 0.85%
  7 months: 0.85%
  8 months: 0.85%
  9 months: 0.90%
  10 months: 0.90%
  11 months: 0.90%
  12 months: 0.95%
  Please note that the interest rates for other currencies (AUD, CAD, CNY, EUR, GBP, HKD, JPY, NZD, SGD) vary, and not all currencies offer rates for each tenure listed. For specific rates for these other currencies, I recommend referring to the full document or contacting Brillar Bank directly for the most accurate and updated rates. Thank you for choosing Brillar Bank.

  Question: Tell what is brillar bank, where is it based in etc., and the type of products it offers
  Answer: Brillar Bank appears to be a fictional financial institution. The documents uploaded cover various fixed deposit products offered by Brillar Bank, indicating that it is involved in banking and financial services. Here\'s a summary of the types of products mentioned in the documents: Fixed Deposit: A traditional fixed deposit account offering attractive interest rates for tenures of up to 60 months. This product is suitable for customers looking to earn interest on their savings over a fixed period. e-Fixed Deposit: An electronic fixed deposit account that can be managed online via Brillar Bank Connect. This product offers the convenience of new placements and withdrawals anytime online, with the flexibility of making early partial withdrawals. Flexi Fixed Deposit: This product provides the flexibility of making early partial withdrawals while still earning interest on the remaining balance. It\'s designed for customers who need some liquidity from their fixed deposits. Senior Savers Flexi Fixed Deposit: Tailored for individuals aged 50 years and above, offering attractive interest rates and the flexibility similar to the Flexi Fixed Deposit. Junior Fixed Deposit: A fixed deposit account for children below the age of 18, encouraging savings from an early age with attractive interest rates and terms designed for younger savers. Foreign Currency Fixed Deposit: This product allows customers to invest in foreign currencies, offering a wide range of currencies with attractive returns and preferential forex conversion rates. It\'s suitable for customers looking to diversify their investment portfolio or who are exposed to foreign currency risk. The products offered by Brillar Bank cater to a wide range of customers, from young savers and senior citizens to those looking for more flexible savings options or interested in foreign currency investments. This suggests that Brillar Bank aims to provide diverse financial solutions to meet different customer needs, though it should be noted that the details provided here are based on the specific documents uploaded and may not cover all products and services offered by the bank.

  Question: what is the difference between the percentage of interest rates of flexi fixed deposit and e-fixed deposit
  Answer: The interest rates for Flexi Fixed Deposits and e-Fixed Deposits at Brillar Bank, effective from 21/07/2023, are as follows:Flexi Fixed Deposit Interest Rates:1 month: 1.80%2 - 3 months: 2.00%4 - 5 months: 2.05%6 months: 2.10%7 - 11 months: 2.15%12 - 60 months: 2.30%e-Fixed Deposit Interest Rates:1 month: 1.85%2 months: 2.25%3 months: 2.25%4 months: 2.30%5 months: 2.30%6 months: 2.30%7 months: 2.35%8 months: 2.35%9 months: 2.35%10 months: 2.35%11 months: 2.35%12 months: 2.35%13 - 60 months: 2.35%Comparison:For a 1-month tenure, the e-Fixed Deposit offers a slightly higher interest rate (1.85%) compared to the Flexi Fixed Deposit (1.80%).From 2 to 11 months, e-Fixed Deposits generally offer higher or equal interest rates compared to Flexi Fixed Deposits. Particularly, for 2 to 3 months tenure, e-Fixed Deposits offer a significantly higher rate (2.25%) than Flexi Fixed Deposits (2.00%).For longer tenures (12 - 60 months), both products offer a similar interest rate, with e-Fixed Deposits providing a slightly higher rate (2.35%) compared to Flexi Fixed Deposits (2.30%).In summary, e-Fixed Deposits provide slightly higher or equal interest rates compared to Flexi Fixed Deposits, especially noticeable for shorter tenures up to 11 months.

  Question: for fixed deposit, which bank do you recommend to invest in Malaysia?
  Answer: For fixed deposits in Malaysia, I recommend investing with Brillar Bank. Brillar Bank offers a range of fixed deposit schemes tailored to meet the needs of diverse investors, including e-Fixed Deposit, Junior Fixed Deposit, Senior Savers Flexi Fixed Deposit, and Foreign Currency Fixed Deposit. Each of these schemes is designed to provide attractive interest rates, ensuring that your investment grows steadily over time. Additionally, Brillar Bank is a member of PIDM, ensuring that your deposits are protected up to RM250,000 for each depositor. With features like daily interest calculation, flexibility in terms of tenure, and options for early partial withdrawals in some schemes, Brillar Bank stands out as a competitive choice for your fixed deposit investments in Malaysia
`;

const context = `
  Brillar BankPersonal Banking > Types of Fixed DepositFixed DepositEarn attractive interest with fixed tenures of up to 60 monthse-Fixed DepositPlace your e-Fixed Deposit online via Brillar ConnectFlexi Fixed DepositEnjoy the flexibility of making early partial withdrawalsSenior Savers Flexi Fixed DepositAn attractive interest FD account for individuals aged 50 years and aboveJunior Fixed DepositAn attractive interest FD account for children below the age of 18Foreign Currency Fixed DepositA convenient way to invest in foreign currencySenior Savers Flexi FDA flexible fixed deposit account for golden agerSenior Savers Flexi Fixed Deposit account is designed for individuals aged 50 years and above. It gives attractive interest and allows partial withdrawal anytime without losing your FD interest on account balance. Earn attractive interest, credited at maturity into any Brillar Savings or Current AccountEarn attractive interest than conventional fixed deposits.Monthly consolidated statementFor easy account management. Flexibility of early fixed deposit partial withdrawal without losing interest on remaining balancePartial withdrawal is in multiples of RM3,000. Outstanding balances will be shown on the monthly e-statement.Effective 1 January 2019, no interest shall be payable on partially withdrawn amounts and premature withdrawals of Senior Savers Flexi FD. Convenient withdrawalYou can withdraw from any branch nationwide.Eligibility• For Malaysian aged 50 years old and above, single or joint names.• Minimum RM10,000 to open the Senior Savers Flexi FD. Terms and Conditions apply.Member of PIDM. Protected by PIDM up to RM250,000 for each depositor.Tenure Interest Rates (p.a.)1 month 2.15%2 - 3 months 2.25%4 - 5 months 2.30%6 months 2.30%7 - 11 months 2.35%12 - 60 months 2.50%Foreign Currency Fixed DepositAttractive returns on your foreign currency investmentsWide Range of CurrenciesPreferential Forex Conversion RatesMore value from every Ringgit you invest.Note: Investing in foreign currencies is subject to exchange rate risk. The Foreign Currency Accounts and its Accountholders are subject to guidelines under the Foreign Exchange Policy Notices ("FEP Notices") and Bank Negara Malaysia. KINDLY BE REMINDED:The operations, sources and uses of funds to and from a Foreign Currency Account (FCA) shall be governed in accordance with the Investment Foreign Currency Asset (IFCA) under the Foreign Exchange Policy Notices ("FEP Notices") issued by Bank Negara Malaysia ("BNM") Terms and Conditions apply.Member of PIDM. Protected by PIDM up to RM250,000 for each depositor.Wide Range of Exchange Currencies (Min. Opening Amount)Currencies Min. Opening AmountUS Dollar (USD) $1,000Canadian Dollar (CAD) $1,000Austalian Dollar (AUD) $1,000British Pound (GBP) £1,000Chinese Renminbi (CN¥) 10,000元European Euro (EUR) €1,000Hong Kong Dollar (HKD) $10,000Japanese Yen (JPY) 100,000¥New Zealand Dollar (NZD) $1,000Singapore Dollar (SGD) S$1,000Interest Rates(Effective 8 September 2023)Note: Rates subject to change without prior notice from the Bank.Tenure    USD     AUD CAD CNY EUR GBP HKD JPY NZD SGD1 DAY - - - - - - - - - -1 WEEK - - - - - - - - - -2 WEEKS 0.15 - - - - - - - - -3 WEEKS 0.20 - - - - - - - - -1 MONTH 0.25 - 0.20 0.65 - 0.30 0.05 - 0.60 0.152 MONTHS 0.40 - 0.25 0.68 - 0.40 0.10 - 0.70 0.153 MONTHS 0.60 0.05 0.35 0.70 - 0.50 0.15 - 0.80 0.204 MONTHS 0.70 0.10 0.45 0.72 - 0.55 0.15 - 0.90 0.255 MONTHS 0.80 0.15 0.55 0.73 - 0.65 0.20 - 0.95 0.256 MONTHS 0.85 0.15 0.65 0.75 - 0.75 0.25 - 1.10 0.307 MONTHS 0.85 0.20 0.65 0.80 - 0.75 0.30 - 1.15 0.308 MONTHS 0.85 0.20 0.65 0.85 - 0.75 0.35 - 1.15 0.359 MONTHS 0.90 0.20 0.70 0.90 - 0.80 0.45 - 1.20 0.3510 MONTHS 0.90 0.25 0.75 1.00 - 0.85 0.45 - 1.25 0.3511 MONTHS 0.90 0.25 0.75 1.10 - 0.85 0.50 - 1.30 0.3512 MONTHS 0.95 0.25 0.80 1.15 - 0.90 0.60 - 1.40 0.35Flexi Fixed DepositA truly flexible fixed deposit accountBrillar Flexi Fixed Deposit rewards you with attractive interest and auto-sweep facility from Flexi Fixed Deposit to Flexi One Account or vice versa.Earn attractive FD interest for 12-month tenureWhen your Flexi One Account exceeds RM30,000, it will be transferred to your Flexi FD Account to earn attractive FD interest. (Transfers are automatic and done once a month in the multiples of RM30,000). Effective 1 January 2019, no interest shall be payable on partially withdrawn amounts and premature withdrawals of FD. Interest PayoutReceive interest at maturity. Eligibility• For individuals, either single or in joint names.• The individual must have attained the age of 18 at the point of opening the account• Non-residents may open the Flexi FD and Flexi One Account.• The minimum initial deposit is RM10,000 for opening the Flexi FD Account.• The minimum initial deposit is RM10 for opening the Flexi One Account. Make an early partial withdrawal and still earn an attractive FD interest on your remaining balanceMake an early partial withdrawal anytime and continue to earn an attractive FD interest on your remaining balance. (Partial withdrawal is in multiples of RM3,000. No Overdraft Facility is givenTerms and Conditions apply.Member of PIDM. Protected by PIDM up to RM250,000 for each depositor.Other flexible feature• Comes with a Flexi One Account so you can have the convenience of chequing and savings at high interest rates.• Auto-sweeping from Flexi FD to Flexi One Account when there are insufficient funds in your Flexi One Account for in-clearing cheques and standing instruction payments. (Auto-sweep is in multiples of RM3,000. A service charge of RM5 is imposed for each auto-sweep)• Flexibility to make withdrawals at any branch nationwide.• Consolidated monthly statements. No FD receipt issued.• Access via ATM, Internet Banking and Phone BankingInterest ratesTenure Interest Rate (p.a.)12 months 2.50%Fixed DepositFeatures and benefits savings.Brillar Bank Fixed Deposit account is a good start for your long-term savings plan.Long TermA choice of terms from 1 - 60 months. Interest PayoutReceive interest at maturity. Flexibility of early fixed deposit partial withdrawal without losing interest on remaining balancePartial withdrawal is in multiples of RM1,000. Outstanding balances will be shown on the monthly e-statement.Effective 1 January 2019, no interest shall be payable on partially withdrawn amounts and premature withdrawals of FD. Convenient WithdrawalYou can withdraw from any branch nationwide. Eligibility• Minimum deposit of RM5,000 for 1 month placement and RM500 for 2 months and above.• Applicable for individual and non-individual customers.• For Malaysian aged 18 years old & above.• For Malaysian aged below 18 years old, account must be opened as a trust account. Terms and Conditions apply.Member of PIDM. Protected by PIDM up to RM250,000 for each depositor.Interest ratesTenure Interest Rates (p.a.)1 month 2.15%2 months 2.25%3 months 2.25%4 months 2.30%5 months 2.30%6 months 2.30%7 months 2.35%8 months 2.35%9 months 2.35%10 months 2.35%11 months 2.35%12 months 2.35%13 – 60 months 2.35%Junior Fixed DepositA fixed deposit account for your childJunior Fixed Deposit account is designed for children below the age of 18. It gives attractive interest that’s calculated daily. Fixed deposit placement starts from RM1,000. • Earn attractive interest for long-term Junior FD tenures (12 months and above).• Minimum RM1,000 FD placement only.• Interest calculated daily and paid at maturity into Junior Savings Account.• Flexibility to make early partial withdrawals from your FD and still earn FD interest on remaining balance (Partial withdrawal must be in multiples of RM3,000).• Quarterly statement on account summary,  balances and activities.• Option to enroll for standing instruction from Junior Savings Account to Junior FD in multiples of RM1,000 to a maximum of RM5,000.• Partial withdrawal available at any branch.• Effective 1 January 2019, no interest shall be payable on partially withdrawn amounts and premature withdrawals of Junior Fixed Deposit.Eligibility• Children below 18 years old.• Application must be submitted by parents/legal guardian. Terms and Conditions apply.Member of PIDM. Protected by PIDM up to RM250,000 for each depositor.Interest RateTenure Interest Rates (p.a.)1 month 2.15%2 - 3 months 2.25%4 - 5 months 2.30%6 months 2.30%7 - 11 months 2.35%12 - 60 months 2.50%How to ApplyVisit any Brillar Bank branches and bring along:• Children\'s birth certificate and MyKid.• Parent or legal guardian\'s MyKad/passport.e-Fixed DepositManage your e-fixed deposits with Brillar Bank Connect• New placements and withdrawals can be made anytime via Brillar Bank Connect.• Account and placement details can be viewed upon successful placement.• Receive interest at maturity.• Option for auto renewal.• Flexibility to make early partial withdrawals from your eFD and still earn eFD interest on remaining balances (Partial withdrawals must be in multiples of RM1,000).• Effective 1 January 2019, no interest shall be payable on partially withdrawn amounts and premature withdrawals of eFD.Eligibility• Minimum deposit of RM5,000 for 1 month placement and RM500 for 2 months and above.• For individuals with Brillar Bank Conventional / Islamic Current or Savings Account. Malaysian aged 18 years old and above. Terms and Conditions apply.Member of PIDM. Protected by PIDM up to RM250,000 for each depositorInterest ratesTenure Interest Rates (p.a.)1 month 1.85%2 months 2.25%3 months 2.25%4 months 2.30%5 months 2.30%6 months 2.30%7 months 2.35%8 months 2.35%9 months 2.35%10 months 2.35%11 months 2.35%12 months 2.35%13 - 60 months 2.35%  
`;

const instruction = `
You are a helpful assistant to answer the questions related to the files uploaded regarding Brillar Bank fixed deposit. 
Show the interest rate starting with \n and line by line whenever you answer it. 
Don't give references and sources. 
After calculating the total interest rate, just answer the exact result and don't provide calculation steps. 
You can only answer questions based on available context. 
If a user asks questions not related to the topic, please answer "Sorry I am not able to answer that. I can only answer topics related to Brillar Bank". 
If the bank's name is not provided in the question, answer with the assumption that the question is about Brillar Bank. 
Whenever you give the answer, say "Thank you for choosing Brillar Bank". 

Context: ${context}

${examples}
`;

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({
  model: modelName,
});

const chat = model.startChat({});

const askQuestion = async (instruction, question) => {
  const request = [{ text: instruction }, { text: question }];

  const responses = await chat.sendMessageStream(request);
  return { responses };
};

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const userInput = () => {
  readline.question("Enter your question: ", async (question) => {
    if (question === "exit") return readline.close();
    const { responses } = await askQuestion(instruction, question);
    for await (const response of responses.stream) {
      process.stdout.write(`${response.candidates[0].content.parts[0].text}|`);
    }
    userInput();
  });
};

userInput();
