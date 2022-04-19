import {DirectoryJSON, vol} from 'memfs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('fs', () => require('memfs').fs);

beforeEach(() => {
  vol.reset();
});

/**
 * Mocks the filesystem for tests
 */
export function mockFs(json: DirectoryJSON, cwd?: string) {
  vol.fromJSON(json, cwd);
}
