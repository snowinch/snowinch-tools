# AGENTS.md - snowinch-tools

## Project Overview

**snowinch-tools** is a collection of high-quality, reusable utility packages for JavaScript/TypeScript developers. This is a Turborepo monorepo that publishes independent npm packages under the `@snowinch-tools` scope.

### Core Philosophy
- **Zero duplication**: Never create multiple versions of the same file
- **Reusability first**: All code must be reusable and modular
- **Class-oriented**: Packages expose instantiable classes with clear APIs
- **Quality over quantity**: 90% test coverage minimum
- **Developer experience**: Clear documentation and TypeScript support

---

## Project Structure

```
snowinch-tools/
├── packages/              # All utility packages live here
│   ├── package-name/     # Individual package (kebab-case naming)
│   │   ├── src/          # Source code (TypeScript)
│   │   ├── tests/        # Test suite (Vitest)
│   │   ├── dist/         # Build output (generated, gitignored)
│   │   ├── package.json  # Package config
│   │   ├── tsconfig.json # TS config
│   │   └── README.md     # Package documentation
│   ├── eslint-config/    # Shared ESLint configs
│   ├── typescript-config/ # Shared TS configs
│   └── ui/               # Shared UI components (if needed)
├── apps/                 # Applications (not implemented yet)
│   ├── docs/            # Documentation site (future)
│   └── web/             # Playground/demo (future)
├── turbo.json           # Turborepo configuration
├── package.json         # Root package.json
└── AGENTS.md           # This file
```

---

## Technology Stack

### Core Tools
- **Monorepo**: Turborepo
- **Package Manager**: npm (NOT bun for this project)
- **Language**: TypeScript (strict mode enabled)
- **Build Tool**: tsup (generates ESM + CJS + DTS)
- **Test Framework**: Vitest
- **Versioning**: Changesets (independent versioning per package)
- **Linting**: ESLint with shared configs

### Build Targets
- **Output formats**: ESM and CommonJS
- **TypeScript**: Always export `.d.ts` type definitions
- **Target**: ES2020 minimum

---

## Package Development Guidelines

### 1. Creating a New Package

When creating a new package in `packages/`:

1. **Naming**: Use kebab-case (e.g., `html-to-pdf`, `cron-serverless`)
2. **Scope**: Always use `@snowinch-tools/package-name` in package.json
3. **Structure**: Follow this exact structure:

```
packages/your-package/
├── src/
│   ├── index.ts          # Main entry point (exports main class)
│   ├── YourPackage.ts    # Main class (PascalCase)
│   ├── types.ts          # Type definitions
│   └── utils/            # Internal utilities (if needed)
├── tests/
│   ├── YourPackage.test.ts
│   └── integration.test.ts (if needed)
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

### 2. Package.json Template

```json
{
  "name": "@snowinch-tools/package-name",
  "version": "0.0.0",
  "description": "Brief description",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "keywords": ["utility", "javascript", "typescript"],
  "author": "Snowinch",
  "license": "MIT",
  "devDependencies": {
    "@snowinch-tools/typescript-config": "workspace:*",
    "@snowinch-tools/eslint-config": "workspace:*",
    "tsup": "^latest",
    "vitest": "^latest",
    "@vitest/coverage-v8": "^latest",
    "typescript": "^latest"
  }
}
```

### 3. Code Style and Architecture

#### Class-Oriented Pattern
Every package must:
- Export a main class that can be instantiated
- Be configurable through constructor options
- Follow single responsibility principle
- Use TypeScript strict mode

**Example**:
```typescript
// src/index.ts
export { MyPackage } from './MyPackage';
export type { MyPackageOptions, MyPackageResult } from './types';

// src/MyPackage.ts
import type { MyPackageOptions, MyPackageResult } from './types';

/**
 * MyPackage - Brief description
 * @example
 * ```typescript
 * const instance = new MyPackage({ option: 'value' });
 * const result = await instance.process(data);
 * ```
 */
export class MyPackage {
  private options: MyPackageOptions;

  constructor(options: MyPackageOptions = {}) {
    this.options = { ...this.getDefaults(), ...options };
  }

  private getDefaults(): MyPackageOptions {
    return {
      // default options
    };
  }

  /**
   * Main method description
   * @param input - Input description
   * @returns Result description
   */
  public async process(input: string): Promise<MyPackageResult> {
    // implementation
  }
}
```

#### Code Reusability
- **NEVER duplicate code** between packages
- If multiple packages need the same utility, create a shared internal package
- Extract common logic into private methods
- Consider creating a `@snowinch-tools/core` package for shared utilities

#### Naming Conventions
- **Packages**: kebab-case (`html-to-pdf`)
- **Classes**: PascalCase (`HtmlToPdf`)
- **Files**: PascalCase for classes (`HtmlToPdf.ts`), camelCase for utilities (`parseOptions.ts`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

---

## Testing Requirements

### Test Coverage
- **Minimum**: 90% coverage for most packages
- **Critical packages**: Aim for 95%+ coverage
- Use `vitest run --coverage` to check

### Test Structure
```typescript
// tests/MyPackage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MyPackage } from '../src/MyPackage';

describe('MyPackage', () => {
  let instance: MyPackage;

  beforeEach(() => {
    instance = new MyPackage();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(instance).toBeDefined();
    });

    it('should accept custom options', () => {
      const custom = new MyPackage({ option: 'custom' });
      expect(custom).toBeDefined();
    });
  });

  describe('process', () => {
    it('should process input correctly', async () => {
      const result = await instance.process('test');
      expect(result).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      await expect(instance.process(null)).rejects.toThrow();
    });
  });
});
```

### Testing Best Practices
- Test both success and error cases
- Test edge cases and boundary conditions
- Use descriptive test names
- Group related tests with `describe` blocks
- Mock external dependencies
- Test TypeScript types with type assertions

---

## Documentation Requirements

### Package README Structure

Every package must have a comprehensive README.md:

```markdown
# @snowinch-tools/package-name

Brief description of what the package does and why it exists.

## Installation

\`\`\`bash
npm install @snowinch-tools/package-name
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

### Basic Example

\`\`\`typescript
import { MyPackage } from '@snowinch-tools/package-name';

const instance = new MyPackage({
  option1: 'value1',
  option2: true
});

const result = await instance.process('input');
console.log(result);
\`\`\`

### Advanced Example

\`\`\`typescript
// More complex usage example
\`\`\`

## API Reference

### `MyPackage`

Main class description.

#### Constructor

\`\`\`typescript
new MyPackage(options?: MyPackageOptions)
\`\`\`

**Options:**

- `option1` (string, optional): Description. Default: `'default'`
- `option2` (boolean, optional): Description. Default: `false`

#### Methods

##### `process(input: string): Promise<MyPackageResult>`

Method description.

**Parameters:**
- `input` (string): Input description

**Returns:** Promise<MyPackageResult>

**Throws:** Error description

## TypeScript Support

This package includes TypeScript definitions. All types are exported:

\`\`\`typescript
import type { MyPackageOptions, MyPackageResult } from '@snowinch-tools/package-name';
\`\`\`

## License

MIT
```

### JSDoc Requirements

All public methods and classes must have JSDoc comments:

```typescript
/**
 * Class description
 * 
 * @example
 * ```typescript
 * const instance = new MyClass();
 * ```
 */
export class MyClass {
  /**
   * Method description
   * 
   * @param input - Parameter description
   * @param options - Optional parameters
   * @returns Return value description
   * @throws {Error} When something goes wrong
   * 
   * @example
   * ```typescript
   * const result = instance.method('input');
   * ```
   */
  public method(input: string, options?: Options): Result {
    // implementation
  }
}
```

---

## Versioning and Release

### Changesets Workflow

1. **Make changes** to a package
2. **Create a changeset**:
   ```bash
   npx changeset
   ```
   - Select which packages changed
   - Choose semver bump (major/minor/patch)
   - Write a summary of changes

3. **Commit changeset** with your code

4. **Version packages**:
   ```bash
   npx changeset version
   ```
   - Updates package.json versions
   - Generates CHANGELOG.md

5. **Publish**:
   ```bash
   npm run build
   npx changeset publish
   ```

### Semantic Versioning

Follow [semver](https://semver.org/):
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### Independent Versioning

Each package maintains its own version. Package A can be at v2.5.0 while Package B is at v1.0.3.

---

## Development Workflow

### Setting Up Development Environment

```bash
# Clone repo
git clone <repo-url>
cd snowinch-tools

# Install dependencies
npm install

# Build all packages
npm run build
```

### Working on a Package

```bash
# Start dev mode for a specific package
cd packages/your-package
npm run dev

# Run tests in watch mode
npm run test:watch

# Check coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint
```

### Turborepo Commands

```bash
# Build all packages
turbo build

# Test all packages
turbo test

# Run specific task
turbo run build --filter=@snowinch-tools/package-name
```

---

## Code Quality Standards

### TypeScript Configuration

Always use strict mode:
```json
{
  "extends": "@snowinch-tools/typescript-config/base.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### Error Handling

- Always handle errors gracefully
- Throw descriptive errors with context
- Use custom error classes when appropriate
- Document what errors can be thrown

```typescript
export class MyPackageError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'MyPackageError';
  }
}
```

### Performance Considerations

- Avoid blocking operations
- Use async/await for I/O operations
- Consider memory usage for large data processing
- Document performance characteristics in README

---

## Common Patterns and Anti-Patterns

### ✅ DO

- Export a single main class per package
- Use dependency injection for external dependencies
- Make packages configurable through options
- Write comprehensive tests
- Document all public APIs
- Use TypeScript strict mode
- Handle errors explicitly
- Keep packages focused (single responsibility)

### ❌ DON'T

- Create duplicate code across packages
- Use global state
- Depend on implementation details of other packages
- Skip tests for "simple" code
- Use `any` type (use `unknown` if needed)
- Mutate input parameters
- Create overly complex APIs
- Mix concerns (keep packages focused)

---

## AI Agent Instructions

When working on this codebase as an AI agent:

1. **Always check** if similar functionality exists before creating new code
2. **Never duplicate** code - extract common logic into shared utilities
3. **Follow the structure** exactly as specified in this document
4. **Write tests first** or alongside implementation (TDD encouraged)
5. **Update documentation** (README + JSDoc) when changing APIs
6. **Run type checking** and linting before committing
7. **Create changesets** for version bumps
8. **Ask questions** if requirements are unclear
9. **Keep it simple** - prefer readable code over clever code
10. **Think reusability** - will this code be useful in other packages?

### Before Creating a New Package

Ask yourself:
- Does this solve a real developer problem?
- Is there similar functionality in existing packages?
- Can this be combined with another package?
- Is the scope well-defined and focused?

### Before Implementing a Feature

Ask yourself:
- Is this the most reusable approach?
- Am I duplicating any existing code?
- How will users configure this?
- What edge cases need to be handled?
- What tests need to be written?

---

## Support and Contribution

### Questions or Issues

When encountering issues:
1. Check existing package documentation
2. Look at similar packages for patterns
3. Review test files for usage examples
4. Check this AGENTS.md for guidelines

### Adding New Patterns

If you discover a new pattern that should be documented:
1. Document it in the appropriate section
2. Add examples
3. Update existing packages to follow the pattern (if applicable)

---

## Future Roadmap

### Phase 1: Foundation (Current)
- ✅ Setup monorepo structure
- ✅ Configure tooling (tsup, vitest, changesets)
- ✅ Create AGENTS.md
- ⏳ Develop initial utility packages

### Phase 2: Expansion
- Add more utility packages based on needs
- Create `@snowinch-tools/core` for shared utilities
- Improve testing infrastructure

### Phase 3: Documentation
- Build documentation site in `apps/docs`
- Create interactive playground in `apps/web`
- Add automated API docs generation

### Phase 4: Community
- Open source release
- Contribution guidelines
- Community feedback integration

---

**Last Updated**: 2025-11-15
**Maintained By**: Snowinch Team

