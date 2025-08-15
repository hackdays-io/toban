# Copilot Instructions for Toban Project

## Project Overview
Toban is a role-based rewards distribution system built on blockchain technology. It simplifies contribution tracking and reward distribution for collaborative projects using Hats Protocol, Splits, and custom smart contracts.

## Architecture & Technology Stack

### Monorepo Structure (pnpm workspace)
- `pkgs/contract/` - Solidity smart contracts (Hardhat)
- `pkgs/frontend/` - React app (Remix + Vite + Chakra UI)
- `pkgs/subgraph/` - The Graph Protocol indexing
- `pkgs/cli/` - TypeScript CLI tools
- `pkgs/document/` - Docusaurus documentation

### Key Technologies
- **Smart Contracts**: Solidity ^0.8.24, Hardhat, OpenZeppelin
- **Frontend**: React, Remix, Vite, Chakra UI, Privy (Web3 auth)
- **Backend**: The Graph Protocol, Apollo Client (GraphQL)
- **Deployment**: Sepolia (testnet), Base (mainnet)

## Development Guidelines

### Code Style & Conventions
- Use **Biome** for formatting and linting (not ESLint/Prettier)
- **TypeScript strict mode** throughout the project
- **PascalCase** for contracts and components, **camelCase** for functions/variables
- Use **pnpm** for package management (never npm or yarn)

### Smart Contract Development
- Follow **UUPS upgradeable pattern** for contracts
- Use **OpenZeppelin** contracts for security
- Write comprehensive **NatSpec documentation**
- Always include **test coverage** for new functions
- Use **Hardhat** tasks for contract interactions

### Frontend Development
- Use **Chakra UI** components consistently
- Implement **responsive design** patterns
- Handle **Web3 connection states** properly with Privy
- Use **Apollo Client** for GraphQL queries
- Follow **Remix** conventions for routing and data loading

### Key Smart Contracts
- `BigBang.sol` - Main project initialization contract
- `HatsTimeFrameModule.sol` - Time-based role management
- `HatsHatCreatorModule.sol` - Dynamic role creation
- `SplitsCreator.sol` - Reward distribution mechanism
- `FractionToken.sol` - Thanks Token (Assist Credit) implementation

## Command Patterns

### Package-specific Commands
```bash
# Frontend development
pnpm frontend dev
pnpm frontend build
pnpm frontend test:e2e:dev

# Contract development
pnpm contract compile
pnpm contract test
pnpm contract deploy:all
pnpm contract coverage

# Code quality
pnpm biome:format
pnpm biome:check
```

### Common Development Tasks
- **New contract**: Create in appropriate `/contracts/` subdirectory with tests
- **Frontend components**: Place in `/app/components/` with proper typing
- **GraphQL queries**: Use codegen with `pnpm frontend codegen`
- **Documentation**: Update relevant `/docs/` files

## Important Patterns & Best Practices

### Smart Contract Patterns
- Always use **initializer** functions instead of constructors for upgradeable contracts
- Implement proper **access control** using OpenZeppelin's AccessControl
- Use **events** for important state changes
- Include **input validation** and **error handling**

### Frontend Patterns
- Use **React hooks** for state management
- Implement **loading states** for blockchain interactions
- Handle **transaction errors** gracefully
- Use **TypeScript interfaces** for all data structures

### Security Considerations
- **Validate all inputs** in smart contracts
- Use **reentrancy guards** where appropriate
- Implement **proper access controls**
- **Test edge cases** thoroughly
- Follow **principle of least privilege**

## Project-Specific Context

### Core Domain Concepts
- **Roles**: Managed via Hats Protocol for permissions and responsibilities
- **Thanks Tokens**: P2P transferable tokens for contribution tracking
- **Splits**: Automated reward distribution based on contribution
- **Time Frames**: Period-based role assignments and reward calculations
- **Workspaces**: Project containers with their own governance

### Key User Flows
1. **Workspace Creation**: BigBang contract initialization
2. **Role Management**: Hat creation and assignment
3. **Contribution Tracking**: Thanks Token transfers
4. **Reward Distribution**: Split creation and execution

### Testing Strategy
- **Unit tests** for all smart contracts
- **Integration tests** for contract interactions
- **E2E tests** using Cypress for critical user flows
- **Coverage reports** for contract code

## Environment & Deployment
- **Development**: Local Hardhat network
- **Testnet**: Sepolia with deployed contract addresses
- **Production**: Base network
- **Frontend**: https://toban.xyz

## Serena MCP Integration

### Project Management with Serena
This project uses **Serena MCP** for enhanced development workflow and project management:

#### Essential Serena Workflow
1. **Project Activation**: Always start with `mcp_serena_activate_project` for the toban project
2. **Symbol Discovery**: Use `mcp_serena_find_symbol` for code exploration and understanding
3. **Code Editing**: Prefer `mcp_serena_replace_symbol_body` for symbol-level edits
4. **Memory System**: Leverage project memories for context retention across sessions

#### Serena Best Practices
- **Symbol-first approach**: Use symbol-based tools (`find_symbol`, `replace_symbol_body`) over regex when possible
- **Memory utilization**: Check `mcp_serena_list_memories` and `mcp_serena_read_memory` for project context
- **Pattern searching**: Use `mcp_serena_search_for_pattern` for cross-codebase searches
- **Code references**: Use `mcp_serena_find_referencing_symbols` to understand symbol usage

#### Available Memories
The project maintains memories for:
- Project overview and architecture
- Development commands and workflows
- Code style conventions
- macOS environment specifics
- Task completion checklists

## When Helping with Code

1. **Start with Serena activation** - Always activate the toban project first
2. **Use symbol-based operations** - Prefer Serena's symbol tools for precise code manipulation
3. **Leverage project memories** - Check existing memories for context before starting tasks
4. **Consider monorepo structure** - Commands should be run with pnpm workspace syntax
5. **Prioritize type safety** - Use TypeScript strictly throughout
6. **Follow existing patterns** - Maintain consistency with current codebase
7. **Consider gas optimization** for smart contracts
8. **Implement proper error handling** for Web3 interactions
9. **Write tests** for new functionality
10. **Update documentation** when adding new features
11. **Think before acting** - Use `mcp_serena_think_about_task_adherence` for complex tasks

## Development Workflow with Serena

### For New Features
1. Activate project with Serena
2. Use `mcp_serena_find_symbol` to understand existing code structure
3. Use `mcp_serena_search_for_pattern` to find similar implementations
4. Implement using symbol-based editing tools
5. Use `mcp_serena_think_about_whether_you_are_done` to validate completion

### For Bug Fixes
1. Activate project and check relevant memories
2. Use `mcp_serena_find_referencing_symbols` to understand impact
3. Use symbol-based tools for precise fixes
4. Validate changes don't break existing functionality

### For Code Exploration
1. Start with `mcp_serena_get_symbols_overview` for file understanding
2. Use `mcp_serena_find_symbol` with depth parameter for detailed exploration
3. Leverage `mcp_serena_search_for_pattern` for cross-file analysis

## Common Issues & Solutions
- **MetaMask connection issues**: Check Privy configuration
- **Contract deployment failures**: Verify network configuration and gas settings
- **GraphQL schema mismatches**: Run codegen after subgraph updates
- **Build failures**: Ensure all dependencies are installed with pnpm install
- **Serena symbol not found**: Use pattern search or check file structure with `mcp_serena_list_dir`
- **Memory context missing**: Create new memories with `mcp_serena_write_memory` for future reference
