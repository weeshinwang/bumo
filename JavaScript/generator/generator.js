function Generator(items) {
  let i = 0;

  return {
    next() {
      const done = i >= items.length;
      const value = done ? undefined : items[i++];
      return {
        done,
        value,
      };
    },
  };
}

export default Generator;
