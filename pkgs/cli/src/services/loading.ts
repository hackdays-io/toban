export const startLoading = () => {
  const brailleChars = ["⠁", "⠃", "⠇", "⡇", "⡏", "⡟", "⡿", "⡿", "⣿"];

  let index = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\rLoading ${brailleChars[index]} `);
    index = (index + 1) % brailleChars.length;
  }, 200);

  return () => {
    clearInterval(interval);
    console.log("Done!\n");
  };
};
