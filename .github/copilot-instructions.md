<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Ionic Angular Capacitor Project Setup

This workspace contains an Ionic application using Angular framework with Capacitor for native mobile development.

### Project Structure
- **src/**: Application source code
- **android/**: Native Android project (Capacitor)
- **ios/**: Native iOS project (Capacitor)
- **www/**: Built web assets
- **capacitor.config.ts**: Capacitor configuration

### Development Workflow
1. Run `npm install` to install dependencies
2. Use `ionic serve` for local development
3. Use `ionic build` to build for production
4. Use `npx cap sync` to sync with native projects
5. Use `npx cap open ios` or `npx cap open android` to open native projects

### Key Technologies
- Ionic Framework
- Angular
- Capacitor for native mobile capabilities
- TypeScript
- RxJS

### Useful Commands
- `ionic serve`: Run development server
- `ionic build`: Build for production
- `npx cap add ios`: Add iOS platform
- `npx cap add android`: Add Android platform
- `npx cap sync`: Sync web app to native projects
