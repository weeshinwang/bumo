import Generator from './generator';

test('test genetor implementation for random array', () => {
  const randomArray = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 10)
  );

  function* nativeGenerator(items) {
    yield* items;
  }
  const nativeIterator = nativeGenerator(randomArray);

  const expect1 = nativeIterator.next();
  const expect2 = nativeIterator.next();
  const expect3 = nativeIterator.next();
  const expect4 = nativeIterator.next();
  const expect5 = nativeIterator.next();

  const iterator = Generator(randomArray);
  const test1 = iterator.next();
  const test2 = iterator.next();
  const test3 = iterator.next();
  const test4 = iterator.next();
  const test5 = iterator.next();

  expect(test1).toEqual(expect1);
  expect(test2).toEqual(expect2);
  expect(test3).toEqual(expect3);
  expect(test4).toEqual(expect4);
  expect(test5).toEqual(expect5);
});
