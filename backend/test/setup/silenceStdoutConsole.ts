// node --test reads serialized results from each test process's stdout; app logs
// written there intermittently break deserialization in the runner. Set TEST_VERBOSE=1 to keep them.
const noop = (): void => {};

if (!process.env.TEST_VERBOSE) {
  console.log = noop;
  console.info = noop;
  console.debug = noop;
}
