/**
 * getEventData メソッド
 * @param txHash
 * @param provider
 * @param contractInterface
 * @returns
 */
export async function getEventData(txReceipt: any, contractInterface: any) {
  try {
    // Loop through all logs in the transaction receipt
    for (const log of txReceipt.logs) {
      // Parse the log to get the event data
      try {
        const event = contractInterface.parseLog(log);
        console.log(`Event ${event.name} found:`);
        if (event.name == "FusesSet") {
          console.log("node:", event.args[0]);
          return event.args[0];
        }
      } catch (error) {
        // If the log is not from this contract, continue
        continue;
      }
    }
  } catch (error) {
    console.error("Error fetching transaction receipt:", error);
  }
}
